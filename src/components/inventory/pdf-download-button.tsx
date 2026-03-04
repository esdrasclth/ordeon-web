'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'

export function PdfDownloadButton({ products, overview, settings }: {
  products: any[]
  overview: any
  settings: any
}) {
  const [PdfLink,   setPdfLink]   = useState<any>(null)
  const [InventPDF, setInventPDF] = useState<any>(null)
  const [ready,     setReady]     = useState(false)

  useEffect(() => {
    // Carga diferida — no bloquea el render principal
    const timer = setTimeout(() => {
      Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/inventory/inventory-pdf'),
      ]).then(([pdf, { InventoryPDF }]) => {
        setPdfLink(() => pdf.PDFDownloadLink)
        setInventPDF(() => InventoryPDF)
        setReady(true)
      })
    }, 1000) // espera 1s después de montar para no competir con el render
    return () => clearTimeout(timer)
  }, [])

  if (!ready || !PdfLink || !InventPDF) return (
    <Button variant="outline" disabled
      style={{ color: '#9DBEBB', borderColor: '#ddd' }}>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Preparando PDF...
    </Button>
  )

  return (
    <PdfLink
      document={<InventPDF products={products} overview={overview} settings={settings} />}
      fileName={`inventario-${new Date().toLocaleDateString('es-HN').replace(/\//g, '-')}.pdf`}
      style={{ textDecoration: 'none' }}
    >
      {({ loading }: { loading: boolean }) => (
        <Button variant="outline" disabled={loading}
          style={{ color: '#468189', borderColor: '#468189' }}>
          {loading
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generando...</>
            : <><FileDown className="w-4 h-4 mr-2" />Exportar PDF</>
          }
        </Button>
      )}
    </PdfLink>
  )
}