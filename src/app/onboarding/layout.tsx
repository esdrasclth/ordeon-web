import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_superadmin, onboarding_completed')
        .eq('id', user.id)
        .single()

    if (!profile) redirect('/login')

    // Superadmins no tienen onboarding
    if (profile.is_superadmin) redirect('/superadmin')

    // Si ya completó el onboarding, ir al dashboard
    if (profile.onboarding_completed) redirect('/dashboard')

    return (
        <div
            className="min-h-screen flex items-center justify-center"
            style={{
                background: 'linear-gradient(135deg, #031926 0%, #073d52 50%, #0a5166 100%)',
                fontFamily: "'Inter', sans-serif",
            }}
        >
            {/* Fondo decorativo */}
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: '-20%', right: '-10%',
                    width: 500, height: 500, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(70,129,137,0.15) 0%, transparent 70%)',
                }} />
                <div style={{
                    position: 'absolute', bottom: '-20%', left: '-10%',
                    width: 600, height: 600, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(70,129,137,0.1) 0%, transparent 70%)',
                }} />
            </div>

            {/* Logo top-center */}
            <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)' }}>
                <span style={{
                    color: '#F4E9CD', fontFamily: 'Georgia, serif',
                    fontWeight: 700, fontSize: 22, letterSpacing: -0.5,
                }}>
                    Ord<span style={{ color: '#468189' }}>eon</span>
                </span>
            </div>

            <div className="relative w-full" style={{ maxWidth: 600, padding: '0 16px' }}>
                {children}
            </div>
        </div>
    )
}
