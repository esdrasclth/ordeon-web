'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface AppNotification {
  id: string
  type: 'nueva_orden' | 'stock_bajo' | 'pendiente_aprobacion'
  title: string
  message: string
  read: boolean
  created_at: string
  link?: string
}

const supabase = createClient()

export function useNotifications(userRole: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  const addNotification = (notif: Omit<AppNotification, 'id' | 'read' | 'created_at'>) => {
    setNotifications(prev => {
      // Evitar duplicados
      const exists = prev.some(n => n.title === notif.title && n.message === notif.message)
      if (exists) return prev
      return [{
        id: Math.random().toString(36).slice(2),
        read: false,
        created_at: new Date().toISOString(),
        ...notif,
      }, ...prev].slice(0, 20) // máximo 20
    })
  }

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const clearAll = () => setNotifications([])

  useEffect(() => {
    // ── Canal: nuevas órdenes ──
    const orderChannel = supabase
      .channel('realtime-orders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'sales_orders',
      }, payload => {
        const order = payload.new as any
        if (['admin', 'supervisor', 'almacen'].includes(userRole)) {
          addNotification({
            type: 'nueva_orden',
            title: '🛒 Nueva orden creada',
            message: `Orden #${String(order.order_number).padStart(5, '0')} fue creada`,
            link: `/dashboard/ordenes/${order.id}`,
          })
        }
      })
      .subscribe()

    // ── Canal: órdenes pendientes de aprobación ──
    const approvalChannel = supabase
      .channel('realtime-approvals')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sales_orders',
        filter: 'status=eq.pendiente_aprobacion',
      }, payload => {
        const order = payload.new as any
        if (['admin', 'supervisor'].includes(userRole)) {
          addNotification({
            type: 'pendiente_aprobacion',
            title: '⚠️ Aprobación requerida',
            message: `Orden #${String(order.order_number).padStart(5, '0')} excede límite de crédito`,
            link: `/dashboard/ordenes/${order.id}`,
          })
        }
      })
      .subscribe()

    // ── Canal: stock bajo ──
    const stockChannel = supabase
      .channel('realtime-stock')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'products',
      }, payload => {
        const product = payload.new as any
        const prev = payload.old as any
        if (
          ['admin', 'supervisor', 'almacen'].includes(userRole) &&
          product.stock <= product.min_stock &&
          prev.stock > prev.min_stock
        ) {
          addNotification({
            type: 'stock_bajo',
            title: '📦 Stock bajo',
            message: `${product.name} tiene solo ${product.stock} ${product.unit} disponibles`,
            link: `/dashboard/productos/${product.id}`,
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(orderChannel)
      supabase.removeChannel(approvalChannel)
      supabase.removeChannel(stockChannel)
    }
  }, [userRole])

  const unreadCount = notifications.filter(n => !n.read).length

  return { notifications, unreadCount, markAllRead, clearAll }
}