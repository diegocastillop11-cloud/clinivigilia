// ============================================================
// INSTRUCCIONES: Agrega este item al Sidebar del dashboard
// Archivo: src/components/layout/Sidebar.tsx
//
// Agrega esta entrada en el array de navegación del doctor,
// después de "Seguimiento" y antes de "Configuración".
// ============================================================

// ─── Item a agregar en el array navItems ──────────────────
/*
{
  href: '/dashboard/gestor-web',
  label: 'Gestor Web',
  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  // Solo mostrar si el doctor tiene el módulo activo:
  // requireModule: 'gestor_web',
},
*/

// ─── Ejemplo completo del Sidebar con el nuevo item ───────
// Si tu Sidebar tiene una estructura diferente, adapta según corresponda.

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const IconGlobe = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)

// Agrega a tu array existente de navItems:
export const GESTOR_WEB_NAV_ITEM = {
  href: '/dashboard/gestor-web',
  label: 'Gestor Web',
  icon: <IconGlobe />,
}

// ─── Componente de badge "Nuevo" para destacar el módulo ──
export function NewBadge() {
  return (
    <span className="ml-auto text-[10px] font-bold bg-violet-500 text-white px-1.5 py-0.5 rounded-full">
      NEW
    </span>
  )
}
