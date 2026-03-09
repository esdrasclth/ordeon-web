// Layout limpio para páginas de impresión/PDF
// No hereda el sidebar ni el navbar del dashboard
export const metadata = { title: 'Imprimir — Ordeon' }

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return children
}
