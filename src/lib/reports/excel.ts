// src/lib/reports/excel.ts
// Utilidad para generar archivos Excel con SheetJS

import * as XLSX from 'xlsx'

export function buildWorkbook(
  sheets: { name: string; data: Record<string, any>[] }[]
): Buffer {
  const wb = XLSX.utils.book_new()
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.data)
    // Auto-ancho de columnas
    const cols = sheet.data.length > 0
      ? Object.keys(sheet.data[0]).map(k => ({
          wch: Math.max(k.length, ...sheet.data.map(r => String(r[k] ?? '').length)) + 2
        }))
      : []
    ws['!cols'] = cols
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31))
  }
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
}

export function excelResponse(buffer: Buffer, filename: string): Response {
  return new Response(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
