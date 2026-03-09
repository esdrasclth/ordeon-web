/**
 * accounting-integration.ts
 *
 * Helper para generar asientos contables automáticos desde otras partes del sistema
 * (facturas, movimientos de stock, etc.).
 *
 * Diseño: best-effort — si falla la contabilidad, la operación principal NO se cancela.
 * Los errores se loguean como warning en consola.
 *
 * Cuentas usadas (plan estándar Honduras):
 *  1103 — Cuentas por Cobrar
 *  1104 — Inventario
 *  2101 — Cuentas por Pagar
 *  2102 — ISV por Pagar
 *  4101 — Ventas
 *  5101 — Costo de Ventas
 */

import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// ─── Tipos internos ────────────────────────────────────────────────────────────

export type JournalLinePayload = {
  account_code: string   // buscamos la cuenta por código
  debit: number
  credit: number
  description?: string
}

export type JournalEntryPayload = {
  date: string
  description: string
  reference?: string
  source: 'factura' | 'ajuste_stock' | 'venta' | 'devolucion' | 'pago'
  source_id?: string
  lines: JournalLinePayload[]
}

// ─── Obtener contexto (companyId + período abierto + userId) ──────────────────

async function getAccountingContext(): Promise<{
  companyId: string
  userId: string
  periodId: string | null
} | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) return null

    // Buscar período contable abierto actual
    const today = new Date().toISOString().split('T')[0]
    const { data: period } = await supabase
      .from('accounting_periods')
      .select('id')
      .eq('company_id', profile.company_id)
      .eq('status', 'open')
      .lte('start_date', today)
      .gte('end_date', today)
      .limit(1)
      .single()

    return {
      companyId: profile.company_id,
      userId: user.id,
      periodId: period?.id ?? null,
    }
  } catch {
    return null
  }
}

// ─── Resolver códigos de cuenta → UUIDs ───────────────────────────────────────

async function resolveAccountIds(
  companyId: string,
  codes: string[]
): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('accounts')
    .select('id, code')
    .eq('company_id', companyId)
    .in('code', codes)

  if (error || !data) return {}

  return data.reduce((acc, a) => {
    acc[a.code] = a.id
    return acc
  }, {} as Record<string, string>)
}

// ─── Función principal: crear asiento contable ────────────────────────────────

/**
 * Intenta crear un asiento contable. Si falla (módulo inactivo, cuentas inexistentes,
 * período cerrado…) solo loguea un warning. La operación principal NO se interrumpe.
 */
export async function tryCreateJournalEntry(payload: JournalEntryPayload): Promise<void> {
  try {
    const ctx = await getAccountingContext()
    if (!ctx) {
      console.warn('[accounting] Sin contexto de usuario/empresa, se omite el asiento.')
      return
    }

    const { companyId, userId, periodId } = ctx

    // Verificar que el módulo contabilidad está activo para la empresa
    const { data: company } = await supabase
      .from('companies')
      .select('modules')
      .eq('id', companyId)
      .single()

    const modules: string[] = company?.modules ?? []
    if (!modules.includes('contabilidad')) {
      // Módulo inactivo — no crear asiento, es silencioso
      return
    }

    // Resolver códigos → IDs
    const codes = payload.lines.map(l => l.account_code)
    const accountMap = await resolveAccountIds(companyId, codes)

    const missingCodes = codes.filter(c => !accountMap[c])
    if (missingCodes.length > 0) {
      console.warn('[accounting] Cuentas no encontradas:', missingCodes, '— se omite el asiento.')
      return
    }

    // Validar que balance: sum(debit) === sum(credit)
    const totalDebit  = payload.lines.reduce((s, l) => s + l.debit, 0)
    const totalCredit = payload.lines.reduce((s, l) => s + l.credit, 0)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      console.warn('[accounting] Asiento desbalanceado:', { totalDebit, totalCredit })
      return
    }

    // Insertar cabecera
    const { data: entry, error: entryErr } = await supabase
      .from('journal_entries')
      .insert({
        company_id:  companyId,
        date:        payload.date,
        description: payload.description,
        reference:   payload.reference ?? null,
        source:      payload.source,
        source_id:   payload.source_id ?? null,
        period_id:   periodId,
        created_by:  userId,
      })
      .select()
      .single()

    if (entryErr) {
      console.warn('[accounting] Error creando cabecera de asiento:', entryErr.message)
      return
    }

    // Insertar líneas
    const { error: linesErr } = await supabase
      .from('journal_lines')
      .insert(
        payload.lines.map(l => ({
          entry_id:    entry.id,
          account_id:  accountMap[l.account_code],
          debit:       l.debit,
          credit:      l.credit,
          description: l.description ?? null,
        }))
      )

    if (linesErr) {
      // Limpiar cabecera huérfana
      await supabase.from('journal_entries').delete().eq('id', entry.id)
      console.warn('[accounting] Error creando líneas de asiento:', linesErr.message)
    }
  } catch (err) {
    console.warn('[accounting] Error inesperado al crear asiento contable:', err)
  }
}

// ─── Constructores de asientos específicos ────────────────────────────────────

/**
 * Asiento para factura emitida:
 *   Déb: Cuentas por Cobrar (total con ISV)
 *   Cré: Ventas (subtotal sin ISV)
 *   Cré: ISV por Pagar (monto ISV)
 *   Déb: Costo de Ventas (costo de los productos — si se conoce)
 *   Cré: Inventario (costo de los productos — si se conoce)
 */
export function buildInvoiceJournalEntry(params: {
  invoiceId: string
  invoiceNumber: string
  date: string
  clientName: string
  subtotal: number   // sin ISV
  isvAmount: number
  total: number      // subtotal + isv - descuentos
  costAmount?: number // costo de ventas (opcional)
}): JournalEntryPayload {
  const { invoiceId, invoiceNumber, date, clientName, subtotal, isvAmount, total, costAmount } = params

  const lines: JournalLinePayload[] = [
    // Cuentas por Cobrar
    {
      account_code: '1103',
      debit:        round2(total),
      credit:       0,
      description:  `Factura ${invoiceNumber} — ${clientName}`,
    },
    // Ventas
    {
      account_code: '4101',
      debit:        0,
      credit:       round2(subtotal),
      description:  `Venta según factura ${invoiceNumber}`,
    },
    // ISV por Pagar
    {
      account_code: '2102',
      debit:        0,
      credit:       round2(isvAmount),
      description:  `ISV factura ${invoiceNumber}`,
    },
  ]

  // Si conocemos el costo, registrar Costo de Ventas / Inventario
  if (costAmount && costAmount > 0) {
    lines.push(
      {
        account_code: '5101',
        debit:        round2(costAmount),
        credit:       0,
        description:  `Costo de ventas — factura ${invoiceNumber}`,
      },
      {
        account_code: '1104',
        debit:        0,
        credit:       round2(costAmount),
        description:  `Salida de inventario — factura ${invoiceNumber}`,
      }
    )
  }

  return {
    date,
    description: `Factura emitida ${invoiceNumber} — ${clientName}`,
    reference:   invoiceNumber,
    source:      'factura',
    source_id:   invoiceId,
    lines,
  }
}

/**
 * Asiento para entrada de stock (compra/recepción):
 *   Déb: Inventario
 *   Cré: Cuentas por Pagar
 */
export function buildStockEntryJournalEntry(params: {
  movementId?: string
  date: string
  productName: string
  quantity: number
  unitCost: number
  reference?: string
}): JournalEntryPayload {
  const { movementId, date, productName, quantity, unitCost, reference } = params
  const amount = round2(quantity * unitCost)

  return {
    date,
    description: `Entrada de inventario — ${productName} (${quantity} unid.)`,
    reference,
    source:      'ajuste_stock',
    source_id:   movementId,
    lines: [
      {
        account_code: '1104',
        debit:        amount,
        credit:       0,
        description:  `Entrada ${productName} x${quantity}`,
      },
      {
        account_code: '2101',
        debit:        0,
        credit:       amount,
        description:  `CxP por compra ${productName}`,
      },
    ],
  }
}

/**
 * Asiento para salida/ajuste negativo de stock:
 *   Déb: Costo de Ventas
 *   Cré: Inventario
 */
export function buildStockExitJournalEntry(params: {
  movementId?: string
  date: string
  productName: string
  quantity: number
  unitCost: number
  reference?: string
}): JournalEntryPayload {
  const { movementId, date, productName, quantity, unitCost, reference } = params
  const amount = round2(Math.abs(quantity) * unitCost)

  return {
    date,
    description: `Salida de inventario — ${productName} (${Math.abs(quantity)} unid.)`,
    reference,
    source:      'ajuste_stock',
    source_id:   movementId,
    lines: [
      {
        account_code: '5101',
        debit:        amount,
        credit:       0,
        description:  `Costo salida ${productName} x${Math.abs(quantity)}`,
      },
      {
        account_code: '1104',
        debit:        0,
        credit:       amount,
        description:  `Baja inventario ${productName}`,
      },
    ],
  }
}

/**
 * Asiento para cobro de factura a crédito:
 *   Déb: Bancos / Caja  (1103-01)
 *   Créd: Cuentas por Cobrar (1104)
 */
export function buildPaymentJournalEntry(params: {
  paymentId: string
  invoiceNumber: string
  date: string
  clientName: string
  amount: number
  paymentMethod: string
}): JournalEntryPayload {
  const { paymentId, invoiceNumber, date, clientName, amount, paymentMethod } = params
  return {
    date,
    description: `Cobro factura ${invoiceNumber} — ${clientName} (${paymentMethod})`,
    reference:   invoiceNumber,
    source:      'pago',
    source_id:   paymentId,
    lines: [
      {
        account_code: '1103-01',
        debit:        round2(amount),
        credit:       0,
        description:  `Cobro ${paymentMethod} — ${clientName}`,
      },
      {
        account_code: '1104',
        debit:        0,
        credit:       round2(amount),
        description:  `Cancelación CxC factura ${invoiceNumber}`,
      },
    ],
  }
}

// ─── Utilidad ─────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
