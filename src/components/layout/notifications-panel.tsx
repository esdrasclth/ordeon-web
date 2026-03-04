'use client'

import { useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, X, CheckCheck, Trash2 } from 'lucide-react'
import { AppNotification } from '@/lib/hooks/use-notifications'

interface NotificationsPanelProps {
  notifications: AppNotification[]
  unreadCount: number
  open: boolean
  onOpen: () => void
  onClose: () => void
  onMarkAllRead: () => void
  onClearAll: () => void
  collapsed: boolean
}

const TYPE_COLORS = {
  nueva_orden:          { bg: '#e8f5e9', color: '#27ae60', border: '#a5d6a7' },
  pendiente_aprobacion: { bg: '#fffbeb', color: '#e67e22', border: '#fcd34d' },
  stock_bajo:           { bg: '#fef2f2', color: '#d94f4f', border: '#fca5a5' },
}

export function NotificationsPanel({
  notifications, unreadCount, open, onOpen, onClose,
  onMarkAllRead, onClearAll, collapsed,
}: NotificationsPanelProps) {
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>

      {/* Botón campana */}
      <button
        onClick={open ? onClose : onOpen}
        className="relative flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all"
        style={{
          background: open ? 'rgba(68,129,137,0.3)' : 'transparent',
          border: open ? '1px solid rgba(68,129,137,0.4)' : '1px solid transparent',
          color: open ? '#F4E9CD' : 'rgba(244,233,205,0.55)',
        }}
      >
        <div className="relative flex-shrink-0">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center"
              style={{ background: '#d94f4f', color: '#fff', fontSize: 9 }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        {!collapsed && (
          <span className="text-sm font-medium whitespace-nowrap">Notificaciones</span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed z-50 rounded-xl shadow-2xl overflow-hidden"
          style={{
            left: collapsed ? 72 : 228,
            bottom: 16,
            width: 340,
            background: '#fff',
            border: '1px solid rgba(68,129,137,0.2)',
            maxHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid #f0f0f0', background: '#031926' }}>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" style={{ color: '#468189' }} />
              <span className="font-bold text-sm" style={{ color: '#F4E9CD' }}>
                Notificaciones
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: '#d94f4f', color: '#fff' }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <>
                  <button onClick={onMarkAllRead} title="Marcar todas como leídas">
                    <CheckCheck className="w-4 h-4" style={{ color: '#468189' }} />
                  </button>
                  <button onClick={onClearAll} title="Limpiar todas">
                    <Trash2 className="w-4 h-4" style={{ color: '#9DBEBB' }} />
                  </button>
                </>
              )}
              <button onClick={onClose}>
                <X className="w-4 h-4" style={{ color: '#9DBEBB' }} />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Bell className="w-10 h-10" style={{ color: '#e0e0e0' }} />
                <p className="text-sm" style={{ color: '#9DBEBB' }}>Sin notificaciones</p>
              </div>
            ) : (
              notifications.map(n => {
                const colors = TYPE_COLORS[n.type]
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (n.link) { router.push(n.link); onClose() }
                    }}
                    className="px-4 py-3 transition-colors cursor-pointer"
                    style={{
                      borderBottom: '1px solid #f8f8f8',
                      background: n.read ? '#fff' : '#f8fffe',
                      borderLeft: n.read ? 'none' : `3px solid ${colors.border}`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: n.read ? '#e0e0e0' : colors.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: '#031926' }}>
                          {n.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#777' }}>
                          {n.message}
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#9DBEBB' }}>
                          {new Date(n.created_at).toLocaleTimeString('es-HN', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}