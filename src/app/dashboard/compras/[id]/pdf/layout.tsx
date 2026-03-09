// Layout mínimo para la página de PDF — sin sidebar ni navbar
// En Next.js App Router los layouts anidados no pueden redefinir <html>/<body>,
// pero sí pueden inyectar estilos globales que oculten el sidebar al imprimir.
export default function PDFLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        /* Ocultar el sidebar y el wrapper del dashboard en modo impresión */
        @media print {
          aside,
          [class*="sidebar"],
          nav {
            display: none !important;
          }
          /* Hacer que el main ocupe toda la página */
          main {
            padding: 0 !important;
            overflow: visible !important;
          }
          /* El contenedor flex del layout */
          .flex.h-screen {
            display: block !important;
          }
        }
        /* Pantalla: fondo blanco, sin padding del dashboard */
        body {
          background: #f5f7f7;
        }
      `}</style>
      {children}
    </>
  )
}
