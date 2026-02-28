'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateOrder } from '@/lib/hooks/use-orders'
import { OrderForm } from '@/components/orders/order-form'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function NuevaOrdenPage() {
  const router = useRouter()
  const createOrder = useCreateOrder()
  const [vendorId, setVendorId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setVendorId(data.user.id)
    })
  }, [])

  const handleCreate = async (data: any) => {
    try {
      const result = await createOrder.mutateAsync(data)
      toast.success(`Orden #${String(result.order_number).padStart(5, '0')} creada`)
      router.push('/dashboard/ordenes')
    } catch (e: any) {
      toast.error(e.message ?? 'Error al crear la orden')
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          style={{ color: '#468189' }}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver
        </Button>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: '#031926', fontFamily: 'Georgia, serif' }}
          >
            Nueva Orden de Venta
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#9DBEBB' }}>
            Completa los campos para crear una nueva orden
          </p>
        </div>
      </div>

      {vendorId && (
        <OrderForm
          vendorId={vendorId}
          onSubmit={handleCreate}
          onCancel={() => router.back()}
          loading={createOrder.isPending}
        />
      )}
    </div>
  )
}