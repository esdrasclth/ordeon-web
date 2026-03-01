'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface PdfDownloadButtonProps {
  order:    any
  settings: Record<string, string>
}

export function PdfDownloadButton({ order, settings }: PdfDownloadButtonProps) {
  const [ready,    setReady]    = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [PDFLink,  setPDFLink]  = useState<any>(null)
  const [OrderPDF, setOrderPDF] = useState<any>(null)

  useEffect(() => {
    // Cargar las librerías solo en el cliente
    Promise.all([
      import('@react-pdf/renderer'),
      import('./order-pdf'),
    ]).then(([pdf, { OrderPDF: PDFComponent }]) => {
      setPDFLink(() => pdf.PDFDownloadLink)
      setOrderPDF(() => PDFComponent)
      setReady(true)
    })
  }, [])

  if (!ready || !PDFLink || !OrderPDF) {
    return (
      <Button variant="outline" disabled style={{ color: '#468189', borderColor: '#468189' }}>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Preparando PDF...
      </Button>
    )
  }

  return (
    <PDFLink
      document={<OrderPDF order={order} settings={settings} />}
      fileName={`orden-${String(order.order_number).padStart(5, '0')}.pdf`}
      style={{ textDecoration: 'none' }}
    >
      {({ loading: pdfLoading }: { loading: boolean }) => (
        <Button
          variant="outline"
          disabled={pdfLoading}
          style={{ color: '#468189', borderColor: '#468189' }}
        >
          {pdfLoading
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generando...</>
            : <><span className="mr-2">⬇</span>Descargar PDF</>
          }
        </Button>
      )}
    </PDFLink>
  )
}