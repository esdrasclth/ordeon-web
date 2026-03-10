'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
    Building2, UserCheck, KeyRound, PartyPopper,
    ChevronRight, Check, Eye, EyeOff
} from 'lucide-react'
import { formatHNPhone } from '@/components/shared/phone-input'

const supabase = createClient()

// ── Mapa de módulos legibles ──────────────────────────────────────
const MODULE_LABELS: Record<string, string> = {
    core: '🏠 Core',
    ventas: '📦 Órdenes',
    clientes: '👥 Clientes',
    reportes: '📊 Reportes',
    compras: '🛒 Compras',
    facturacion: '🧾 Facturación',
    logistica: '🚚 Logística',
    multi_bodega: '🏭 Multi-bodega',
    contabilidad: '📒 Contabilidad',
}

// ── Steps ─────────────────────────────────────────────────────────
const STEPS = [
    { icon: Building2, label: 'Bienvenida' },
    { icon: UserCheck, label: 'Tu empresa' },
    { icon: KeyRound, label: 'Contraseña' },
    { icon: PartyPopper, label: '¡Listo!' },
]

// ── Props ─────────────────────────────────────────────────────────
interface Props {
    adminName: string
    companyId: string
    companyName: string
    companyEmail: string
    companyPhone: string
    companyAddress: string
    companyRtn: string
    modules: string[]
}

export function OnboardingWizard({
    adminName,
    companyId,
    companyName,
    companyEmail,
    companyPhone,
    companyAddress,
    companyRtn,
    modules,
}: Props) {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    // Paso 2: datos de empresa
    const [companyForm, setCompanyForm] = useState({
        name: companyName,
        phone: companyPhone,
        address: companyAddress,
        rtn: companyRtn,
    })

    // Paso 3: contraseña
    const [passwords, setPasswords] = useState({ newPwd: '', confirmPwd: '' })
    const [showPwd, setShowPwd] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    // ── Guardar datos de empresa (paso 2) ────────────────────────────
    const handleSaveCompany = async () => {
        // Safety guard: si no hay companyId no intentamos el PATCH
        if (!companyId) {
            setStep(3)
            return
        }
        setLoading(true)

        // Llamar al API que usa service role (el admin no puede PATCH companies directamente por RLS)
        const res = await fetch('/api/users/update-company-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                companyId: companyId,
                name: companyForm.name || companyName,
                rtn: companyForm.rtn || null,
                phone: companyForm.phone || null,
                address: companyForm.address || null,
            }),
        })

        if (!res.ok) {
            const data = await res.json()
            toast.error('Error al guardar: ' + (data.error ?? 'intenta de nuevo'))
            setLoading(false)
            return
        }

        setStep(3)
        setLoading(false)
    }

    // ── Cambiar contraseña (paso 3) ──────────────────────────────────
    const handleChangePassword = async () => {
        if (!passwords.newPwd || passwords.newPwd.length < 8) {
            toast.error('La contraseña debe tener al menos 8 caracteres')
            return
        }
        if (passwords.newPwd !== passwords.confirmPwd) {
            toast.error('Las contraseñas no coinciden')
            return
        }
        setLoading(true)
        const { error } = await supabase.auth.updateUser({ password: passwords.newPwd })
        if (error) {
            toast.error('Error al cambiar contraseña: ' + error.message)
            setLoading(false)
            return
        }
        await completeOnboarding()
    }

    // ── Finalizar onboarding ─────────────────────────────────────────
    const completeOnboarding = async () => {
        await fetch('/api/users/complete-onboarding', { method: 'POST' })
        setStep(4)
        setLoading(false)
    }

    // ── Ir al dashboard ──────────────────────────────────────────────
    const goToDashboard = () => router.push('/dashboard')

    // ── Helpers de estilo ────────────────────────────────────────────
    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 14px', borderRadius: 10,
        border: '1px solid rgba(70,129,137,0.3)',
        background: 'rgba(255,255,255,0.08)',
        color: '#F4E9CD', fontSize: 14, outline: 'none',
        backdropFilter: 'blur(4px)',
        boxSizing: 'border-box',
    }
    const labelStyle: React.CSSProperties = {
        fontSize: 12, fontWeight: 600, color: '#9DBEBB',
        display: 'block', marginBottom: 6,
    }

    return (
        <div>
            {/* Stepper */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 32, gap: 0,
            }}>
                {STEPS.map((s, idx) => {
                    const n = idx + 1
                    const done = step > n
                    const active = step === n
                    const Icon = s.icon
                    return (
                        <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: done ? '#27ae60' : active ? '#468189' : 'rgba(255,255,255,0.08)',
                                    border: active ? '2px solid #468189' : done ? '2px solid #27ae60' : '2px solid rgba(255,255,255,0.1)',
                                    transition: 'all 0.3s',
                                }}>
                                    {done
                                        ? <Check size={18} color="#fff" />
                                        : <Icon size={18} color={active ? '#fff' : 'rgba(255,255,255,0.3)'} />
                                    }
                                </div>
                                <span style={{
                                    fontSize: 11, fontWeight: 600,
                                    color: active ? '#F4E9CD' : done ? '#9DBEBB' : 'rgba(255,255,255,0.3)',
                                }}>
                                    {s.label}
                                </span>
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div style={{
                                    width: 60, height: 2, marginBottom: 22,
                                    background: done ? '#27ae60' : 'rgba(255,255,255,0.1)',
                                    transition: 'background 0.3s',
                                }} />
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Card */}
            <div style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(70,129,137,0.25)',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
            }}>

                {/* ── PASO 1: Bienvenida ─────────────────────────────── */}
                {step === 1 && (
                    <div style={{ padding: '40px 40px 32px' }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: 'rgba(70,129,137,0.2)',
                            border: '2px solid rgba(70,129,137,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: 24,
                        }}>
                            <Building2 size={28} color="#468189" />
                        </div>

                        <h1 style={{
                            fontSize: 28, fontWeight: 900, color: '#F4E9CD',
                            fontFamily: 'Georgia, serif', margin: '0 0 8px',
                        }}>
                            ¡Bienvenido, {adminName.split(' ')[0]}! 👋
                        </h1>
                        <p style={{ fontSize: 15, color: '#9DBEBB', margin: '0 0 28px', lineHeight: 1.6 }}>
                            Eres el administrador de <strong style={{ color: '#F4E9CD' }}>{companyName}</strong>.
                            Te guiaremos en los primeros pasos para configurar tu sistema.
                        </p>

                        {/* Módulos */}
                        <div style={{
                            background: 'rgba(70,129,137,0.08)',
                            border: '1px solid rgba(70,129,137,0.2)',
                            borderRadius: 12, padding: '16px 20px', marginBottom: 28,
                        }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#468189', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 1 }}>
                                Módulos habilitados
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {modules.map(m => (
                                    <span key={m} style={{
                                        fontSize: 12, padding: '4px 12px', borderRadius: 20,
                                        background: 'rgba(70,129,137,0.15)',
                                        border: '1px solid rgba(70,129,137,0.3)',
                                        color: '#9DBEBB', fontWeight: 600,
                                    }}>
                                        {MODULE_LABELS[m] ?? m}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(244,233,205,0.05)',
                            borderRadius: 10, padding: '12px 16px', marginBottom: 32,
                            border: '1px solid rgba(244,233,205,0.1)',
                        }}>
                            <p style={{ fontSize: 13, color: '#9DBEBB', margin: 0, lineHeight: 1.7 }}>
                                En los próximos pasos podrás:
                            </p>
                            <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: '#9DBEBB', fontSize: 13, lineHeight: 1.9 }}>
                                <li>Completar los datos de tu empresa</li>
                                <li>Establecer una contraseña segura</li>
                                <li>Empezar a usar el sistema</li>
                            </ul>
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            style={{
                                width: '100%', padding: '14px 0', borderRadius: 12,
                                background: 'linear-gradient(135deg, #468189, #2d6b73)',
                                border: 'none', color: '#F4E9CD',
                                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}
                        >
                            Comenzar configuración
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}

                {/* ── PASO 2: Datos de empresa ───────────────────────── */}
                {step === 2 && (
                    <div style={{ padding: '40px 40px 32px' }}>
                        <h2 style={{
                            fontSize: 22, fontWeight: 900, color: '#F4E9CD',
                            fontFamily: 'Georgia, serif', margin: '0 0 8px',
                        }}>
                            Datos de la empresa
                        </h2>
                        <p style={{ fontSize: 14, color: '#9DBEBB', margin: '0 0 28px' }}>
                            Verifica y completa la información de tu empresa.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={labelStyle}>Nombre de la empresa</label>
                                <input
                                    style={inputStyle}
                                    value={companyForm.name}
                                    onChange={e => setCompanyForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Mi Empresa S.A. de C.V."
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>RTN (Registro Tributario Nacional)</label>
                                <input
                                    style={inputStyle}
                                    value={companyForm.rtn}
                                    onChange={e => setCompanyForm(f => ({ ...f, rtn: e.target.value }))}
                                    placeholder="0801-1985-000000"
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Teléfono de la empresa</label>
                                <input
                                    style={inputStyle}
                                    value={companyForm.phone}
                                    onChange={e => setCompanyForm(f => ({ ...f, phone: formatHNPhone(e.target.value) }))}
                                    placeholder="+504 0000-0000"
                                    maxLength={14}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Dirección fiscal</label>
                                <input
                                    style={inputStyle}
                                    value={companyForm.address}
                                    onChange={e => setCompanyForm(f => ({ ...f, address: e.target.value }))}
                                    placeholder="Boulevard Morazán, Torre Empresarial, Piso 7"
                                />
                            </div>
                        </div>

                        <p style={{ fontSize: 12, color: 'rgba(157,190,187,0.5)', margin: '16px 0 24px' }}>
                            Puedes dejar campos vacíos y completarlos después en Configuración.
                        </p>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setStep(1)}
                                style={{
                                    flex: 1, padding: '13px 0', borderRadius: 12,
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    color: '#9DBEBB', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                }}
                            >
                                ← Atrás
                            </button>
                            <button
                                onClick={handleSaveCompany}
                                disabled={loading}
                                style={{
                                    flex: 2, padding: '13px 0', borderRadius: 12,
                                    background: loading ? 'rgba(70,129,137,0.4)' : 'linear-gradient(135deg, #468189, #2d6b73)',
                                    border: 'none', color: '#F4E9CD',
                                    fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                }}
                            >
                                {loading ? 'Guardando...' : <>Guardar y continuar <ChevronRight size={16} /></>}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── PASO 3: Cambiar contraseña ─────────────────────── */}
                {step === 3 && (
                    <div style={{ padding: '40px 40px 32px' }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: 'rgba(70,129,137,0.15)',
                            border: '2px solid rgba(70,129,137,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                        }}>
                            <KeyRound size={24} color="#468189" />
                        </div>

                        <h2 style={{
                            fontSize: 22, fontWeight: 900, color: '#F4E9CD',
                            fontFamily: 'Georgia, serif', margin: '0 0 8px',
                        }}>
                            Establece tu contraseña
                        </h2>
                        <p style={{ fontSize: 14, color: '#9DBEBB', margin: '0 0 28px', lineHeight: 1.6 }}>
                            Por seguridad, establece una contraseña personal. No compartas la contraseña temporal que recibiste.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={labelStyle}>Nueva contraseña</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPwd ? 'text' : 'password'}
                                        style={{ ...inputStyle, paddingRight: 44 }}
                                        value={passwords.newPwd}
                                        onChange={e => setPasswords(p => ({ ...p, newPwd: e.target.value }))}
                                        placeholder="Mínimo 8 caracteres"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPwd(v => !v)}
                                        style={{
                                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', cursor: 'pointer', color: '#9DBEBB', padding: 0,
                                        }}
                                    >
                                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {/* Indicador de fortaleza */}
                                {passwords.newPwd && (
                                    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                                        {[1, 2, 3, 4].map(lvl => {
                                            const strength = passwords.newPwd.length >= 12
                                                ? 4
                                                : passwords.newPwd.length >= 10
                                                    ? 3
                                                    : passwords.newPwd.length >= 8
                                                        ? 2
                                                        : 1
                                            return (
                                                <div key={lvl} style={{
                                                    flex: 1, height: 4, borderRadius: 2,
                                                    background: lvl <= strength
                                                        ? strength <= 1 ? '#d94f4f' : strength <= 2 ? '#e67e22' : strength <= 3 ? '#f1c40f' : '#27ae60'
                                                        : 'rgba(255,255,255,0.1)',
                                                    transition: 'background 0.2s',
                                                }} />
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={labelStyle}>Confirmar contraseña</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        style={{
                                            ...inputStyle, paddingRight: 44,
                                            borderColor: passwords.confirmPwd && passwords.newPwd !== passwords.confirmPwd
                                                ? 'rgba(217,79,79,0.5)' : 'rgba(70,129,137,0.3)',
                                        }}
                                        value={passwords.confirmPwd}
                                        onChange={e => setPasswords(p => ({ ...p, confirmPwd: e.target.value }))}
                                        placeholder="Repite la contraseña"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(v => !v)}
                                        style={{
                                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', cursor: 'pointer', color: '#9DBEBB', padding: 0,
                                        }}
                                    >
                                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {passwords.confirmPwd && passwords.newPwd !== passwords.confirmPwd && (
                                    <p style={{ fontSize: 12, color: '#d94f4f', margin: '6px 0 0' }}>
                                        Las contraseñas no coinciden
                                    </p>
                                )}
                                {passwords.confirmPwd && passwords.newPwd === passwords.confirmPwd && (
                                    <p style={{ fontSize: 12, color: '#27ae60', margin: '6px 0 0' }}>
                                        ✓ Las contraseñas coinciden
                                    </p>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                            <button
                                onClick={() => setStep(2)}
                                style={{
                                    flex: 1, padding: '13px 0', borderRadius: 12,
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    color: '#9DBEBB', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                }}
                            >
                                ← Atrás
                            </button>
                            <button
                                onClick={handleChangePassword}
                                disabled={loading || !passwords.newPwd || !passwords.confirmPwd}
                                style={{
                                    flex: 2, padding: '13px 0', borderRadius: 12,
                                    background: (loading || !passwords.newPwd || !passwords.confirmPwd)
                                        ? 'rgba(70,129,137,0.3)'
                                        : 'linear-gradient(135deg, #468189, #2d6b73)',
                                    border: 'none', color: '#F4E9CD',
                                    fontSize: 14, fontWeight: 700,
                                    cursor: (loading || !passwords.newPwd || !passwords.confirmPwd) ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                }}
                            >
                                {loading ? 'Guardando...' : <>Guardar contraseña <ChevronRight size={16} /></>}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── PASO 4: ¡Listo! ────────────────────────────────── */}
                {step === 4 && (
                    <div style={{ padding: '52px 40px 44px', textAlign: 'center' }}>
                        {/* Animación de éxito */}
                        <div style={{
                            width: 80, height: 80, borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(39,174,96,0.25) 0%, rgba(39,174,96,0.05) 100%)',
                            border: '2px solid rgba(39,174,96,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px',
                            animation: 'pulse 2s infinite',
                        }}>
                            <PartyPopper size={36} color="#27ae60" />
                        </div>

                        <h2 style={{
                            fontSize: 30, fontWeight: 900, color: '#F4E9CD',
                            fontFamily: 'Georgia, serif', margin: '0 0 12px',
                        }}>
                            ¡Todo listo!
                        </h2>
                        <p style={{
                            fontSize: 15, color: '#9DBEBB', margin: '0 0 36px', lineHeight: 1.7,
                        }}>
                            Tu cuenta de administrador está configurada.<br />
                            Ya puedes empezar a usar <strong style={{ color: '#F4E9CD' }}>Ordeon ERP</strong>.
                        </p>

                        {/* Checklist de lo completado */}
                        <div style={{
                            background: 'rgba(39,174,96,0.06)',
                            border: '1px solid rgba(39,174,96,0.15)',
                            borderRadius: 12, padding: '16px 20px',
                            marginBottom: 32, textAlign: 'left',
                        }}>
                            {[
                                'Empresa configurada',
                                'Datos de contacto actualizados',
                                'Contraseña segura establecida',
                            ].map(item => (
                                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                                    <div style={{
                                        width: 20, height: 20, borderRadius: '50%',
                                        background: '#27ae60',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    }}>
                                        <Check size={12} color="#fff" />
                                    </div>
                                    <span style={{ fontSize: 13, color: '#9DBEBB', fontWeight: 500 }}>{item}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={goToDashboard}
                            style={{
                                width: '100%', padding: '16px 0', borderRadius: 12,
                                background: 'linear-gradient(135deg, #27ae60, #1e8449)',
                                border: 'none', color: '#fff',
                                fontSize: 16, fontWeight: 800, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: '0 8px 24px rgba(39,174,96,0.3)',
                            }}
                        >
                            Ir al Dashboard →
                        </button>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        input::placeholder { color: rgba(157,190,187,0.4); }
        input:focus { border-color: rgba(70,129,137,0.6) !important; }
      `}</style>
        </div>
    )
}
