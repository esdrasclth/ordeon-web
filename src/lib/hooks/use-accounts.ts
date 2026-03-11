'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Account, AccountType } from '@/types'

const supabase = createClient()

async function getCompanyId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) throw new Error('Sin empresa asignada')
  return profile.company_id
}

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    staleTime: 0,
    queryFn: async () => {
      const companyId = await getCompanyId()
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('company_id', companyId)
        .eq('active', true)
        .order('code')
      if (error) { console.error('[useAccounts]', error); throw error }
      return data as Account[]
    },
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      code: string
      name: string
      type: AccountType
      subtype?: string
      parent_id?: string | null
      is_detail?: boolean
    }) => {
      const companyId = await getCompanyId()
      const { data, error } = await supabase
        .from('accounts')
        .insert({ ...params, company_id: companyId, active: true })
        .select().single()
      if (error) { console.error('[useCreateAccount]', error); throw error }
      return data as Account
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: Partial<Account> & { id: string }) => {
      const { id, ...rest } = params
      const { error } = await supabase.from('accounts').update(rest).eq('id', id)
      if (error) { console.error('[useUpdateAccount]', error); throw error }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('accounts').update({ active: false }).eq('id', id)
      if (error) { console.error('[useDeleteAccount]', error); throw error }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

// ─── Plan de cuentas estándar Honduras ───────────────────────────────────────
const PLAN_CUENTAS_ESTANDAR = [
  // ACTIVOS
  { code: '1',      name: 'ACTIVOS',                               type: 'activo',  is_detail: false, parent_id: null },
  { code: '11',     name: 'ACTIVO CORRIENTE',                      type: 'activo',  is_detail: false, parent_id: null },
  { code: '1101',   name: 'Caja General',                          type: 'activo',  is_detail: true,  parent_id: null },
  { code: '1102',   name: 'Caja Chica',                            type: 'activo',  is_detail: true,  parent_id: null },
  { code: '1103',   name: 'Bancos',                                type: 'activo',  is_detail: false, parent_id: null },
  { code: '1103-01',name: 'Banco Atlántida Cta. Corriente',        type: 'activo',  is_detail: true,  parent_id: null },
  { code: '1103-02',name: 'Banco BAC Cta. Corriente',              type: 'activo',  is_detail: true,  parent_id: null },
  { code: '1104',   name: 'Cuentas por Cobrar Clientes',           type: 'activo',  is_detail: true,  parent_id: null },
  { code: '1105',   name: 'Documentos por Cobrar',                 type: 'activo',  is_detail: true,  parent_id: null },
  { code: '1106',   name: 'ISV Acreditable (Crédito Fiscal)',      type: 'activo',  is_detail: true,  parent_id: null },
  { code: '1107',   name: 'Inventario de Mercancías',              type: 'activo',  is_detail: true,  parent_id: null },
  { code: '1108',   name: 'Anticipos a Proveedores',               type: 'activo',  is_detail: true,  parent_id: null },
  { code: '1109',   name: 'Gastos Pagados por Anticipado',         type: 'activo',  is_detail: true,  parent_id: null },
  { code: '12',     name: 'ACTIVO NO CORRIENTE',                   type: 'activo',  is_detail: false, parent_id: null },
  { code: '1201',   name: 'Mobiliario y Equipo de Oficina',        type: 'activo',  is_detail: true,  parent_id: null },
  { code: '1202',   name: 'Equipo de Transporte',                  type: 'activo',  is_detail: true,  parent_id: null },
  { code: '1203',   name: 'Equipo de Cómputo',                     type: 'activo',  is_detail: true,  parent_id: null },
  { code: '1204',   name: 'Dep. Acum. Mobiliario y Equipo',        type: 'activo',  is_detail: true,  parent_id: null },
  { code: '1205',   name: 'Dep. Acum. Equipo de Transporte',       type: 'activo',  is_detail: true,  parent_id: null },
  { code: '1206',   name: 'Dep. Acum. Equipo de Cómputo',         type: 'activo',  is_detail: true,  parent_id: null },
  // PASIVOS
  { code: '2',      name: 'PASIVOS',                               type: 'pasivo',  is_detail: false, parent_id: null },
  { code: '21',     name: 'PASIVO CORRIENTE',                      type: 'pasivo',  is_detail: false, parent_id: null },
  { code: '2101',   name: 'Cuentas por Pagar Proveedores',         type: 'pasivo',  is_detail: true,  parent_id: null },
  { code: '2102',   name: 'Documentos por Pagar',                  type: 'pasivo',  is_detail: true,  parent_id: null },
  { code: '2103',   name: 'ISV por Pagar (Débito Fiscal)',         type: 'pasivo',  is_detail: true,  parent_id: null },
  { code: '2104',   name: 'Impuesto Sobre la Renta por Pagar',     type: 'pasivo',  is_detail: true,  parent_id: null },
  { code: '2105',   name: 'Sueldos y Salarios por Pagar',          type: 'pasivo',  is_detail: true,  parent_id: null },
  { code: '2106',   name: 'Prestaciones Laborales por Pagar',      type: 'pasivo',  is_detail: true,  parent_id: null },
  { code: '2107',   name: 'IHSS por Pagar',                        type: 'pasivo',  is_detail: true,  parent_id: null },
  { code: '2108',   name: 'RAP por Pagar',                         type: 'pasivo',  is_detail: true,  parent_id: null },
  { code: '2109',   name: 'Anticipo de Clientes',                  type: 'pasivo',  is_detail: true,  parent_id: null },
  { code: '22',     name: 'PASIVO NO CORRIENTE',                   type: 'pasivo',  is_detail: false, parent_id: null },
  { code: '2201',   name: 'Préstamos Bancarios L/P',               type: 'pasivo',  is_detail: true,  parent_id: null },
  { code: '2202',   name: 'Hipotecas por Pagar',                   type: 'pasivo',  is_detail: true,  parent_id: null },
  // CAPITAL
  { code: '3',      name: 'CAPITAL CONTABLE',                      type: 'capital', is_detail: false, parent_id: null },
  { code: '3101',   name: 'Capital Social',                        type: 'capital', is_detail: true,  parent_id: null },
  { code: '3102',   name: 'Utilidad del Ejercicio Anterior',       type: 'capital', is_detail: true,  parent_id: null },
  { code: '3103',   name: 'Utilidad del Ejercicio Actual',         type: 'capital', is_detail: true,  parent_id: null },
  { code: '3104',   name: 'Pérdida del Ejercicio',                 type: 'capital', is_detail: true,  parent_id: null },
  { code: '3105',   name: 'Reserva Legal',                         type: 'capital', is_detail: true,  parent_id: null },
  // INGRESOS
  { code: '4',      name: 'INGRESOS',                              type: 'ingreso', is_detail: false, parent_id: null },
  { code: '4101',   name: 'Ventas de Mercancías',                  type: 'ingreso', is_detail: true,  parent_id: null },
  { code: '4102',   name: 'Devoluciones sobre Ventas',             type: 'ingreso', is_detail: true,  parent_id: null },
  { code: '4103',   name: 'Descuentos sobre Ventas',               type: 'ingreso', is_detail: true,  parent_id: null },
  { code: '4104',   name: 'Otros Ingresos',                        type: 'ingreso', is_detail: true,  parent_id: null },
  { code: '4105',   name: 'Ingresos Financieros',                  type: 'ingreso', is_detail: true,  parent_id: null },
  // COSTOS
  { code: '5',      name: 'COSTOS',                                type: 'costo',   is_detail: false, parent_id: null },
  { code: '5101',   name: 'Costo de Ventas',                       type: 'costo',   is_detail: true,  parent_id: null },
  { code: '5102',   name: 'Compras de Mercancías',                 type: 'costo',   is_detail: true,  parent_id: null },
  { code: '5103',   name: 'Devoluciones sobre Compras',            type: 'costo',   is_detail: true,  parent_id: null },
  { code: '5104',   name: 'Descuentos sobre Compras',              type: 'costo',   is_detail: true,  parent_id: null },
  // GASTOS
  { code: '6',      name: 'GASTOS',                                type: 'gasto',   is_detail: false, parent_id: null },
  { code: '61',     name: 'GASTOS DE OPERACIÓN',                   type: 'gasto',   is_detail: false, parent_id: null },
  { code: '6101',   name: 'Sueldos y Salarios',                    type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '6102',   name: 'Décimo Cuarto Mes',                     type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '6103',   name: 'Décimo Quinto Mes (Bono Educativo)',    type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '6104',   name: 'Vacaciones',                            type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '6105',   name: 'Indemnizaciones',                       type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '6106',   name: 'Aporte Patronal IHSS',                  type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '6107',   name: 'Aporte Patronal RAP',                   type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '6108',   name: 'Alquiler de Local',                     type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '6109',   name: 'Energía Eléctrica',                     type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '6110',   name: 'Agua y Alcantarillado',                  type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '6111',   name: 'Teléfono e Internet',                   type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '6112',   name: 'Combustible y Lubricantes',             type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '6113',   name: 'Mantenimiento y Reparaciones',          type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '6114',   name: 'Depreciaciones',                        type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '6115',   name: 'Papelería y Útiles de Oficina',         type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '6116',   name: 'Publicidad y Propaganda',               type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '6117',   name: 'Fletes y Acarreos',                     type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '6118',   name: 'Seguros',                               type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '62',     name: 'GASTOS FINANCIEROS',                    type: 'gasto',   is_detail: false, parent_id: null },
  { code: '6201',   name: 'Intereses Bancarios',                   type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '6202',   name: 'Comisiones Bancarias',                  type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '6203',   name: 'Diferencial Cambiario',                 type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '63',     name: 'GASTOS DE IMPUESTOS',                   type: 'gasto',   is_detail: false, parent_id: null },
  { code: '6301',   name: 'Impuesto Sobre la Renta',               type: 'gasto',   is_detail: true,  parent_id: null },
  { code: '6302',   name: 'Impuesto al Activo Neto',               type: 'gasto',   is_detail: true,  parent_id: null },
]

export function useInitializeAccounts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const companyId = await getCompanyId()
      const rows = PLAN_CUENTAS_ESTANDAR.map(a => ({
        ...a,
        company_id: companyId,
        active: true,
      }))
      const { error } = await supabase
        .from('accounts')
        .upsert(rows, { onConflict: 'company_id,code' })
      if (error) { console.error('[useInitializeAccounts]', error); throw error }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

// Helper: obtener saldo de una cuenta (débitos - créditos para activo/costo/gasto)
export function useAccountBalance(accountId: string, fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ['account-balance', accountId, fromDate, toDate],
    staleTime: 0,
    queryFn: async () => {
      let query = supabase
        .from('journal_lines')
        .select('debit, credit, journal_entries!inner(date, company_id)')
        .eq('account_id', accountId)
      if (fromDate) query = query.gte('journal_entries.date', fromDate)
      if (toDate)   query = query.lte('journal_entries.date', toDate)
      const { data, error } = await query
      if (error) throw error
      const totalDebit  = (data ?? []).reduce((s, r) => s + Number(r.debit), 0)
      const totalCredit = (data ?? []).reduce((s, r) => s + Number(r.credit), 0)
      return { totalDebit, totalCredit, balance: totalDebit - totalCredit }
    },
    enabled: !!accountId,
  })
}
