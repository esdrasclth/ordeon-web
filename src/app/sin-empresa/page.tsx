export default function SinEmpresaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: '#031926' }}>
      <div className="text-center max-w-md px-8">
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: '#F4E9CD', fontFamily: 'Georgia, serif' }}>
          Sin empresa asignada
        </h1>
        <p className="text-sm mb-6" style={{ color: '#9DBEBB', lineHeight: 1.7 }}>
          Tu usuario no tiene una empresa asignada. Contacta al administrador del sistema.
        </p>
        <a href="mailto:soporte@brandsoft.app"
          className="inline-block px-6 py-3 rounded-lg text-sm font-semibold"
          style={{ background: '#468189', color: '#F4E9CD' }}>
          Contactar soporte
        </a>
      </div>
    </div>
  )
}