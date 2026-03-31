'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/context/ThemeContext'
import type { Doctor } from '@/types/database'
import {
  LayoutDashboard, Users, Calendar, ClipboardList,
  Settings, LogOut, Stethoscope, Brain, BarChart2, Mail, Menu, X, Globe
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'

const ALL_NAV_ITEMS = [
  { label: 'Dashboard',    href: '/dashboard',             icon: LayoutDashboard, module: null,          section: 'main' },
  { label: 'Pacientes',    href: '/pacientes',             icon: Users,           module: 'patients',     section: 'main' },
  { label: 'Citas',        href: '/citas',                 icon: Calendar,        module: 'appointments', section: 'main', badge: 'citas' },
  { label: 'Seguimiento',  href: '/seguimiento',           icon: ClipboardList,   module: 'followups',    section: 'main' },
  { label: 'Gestor Web',   href: '/dashboard/gestor-web',  icon: Globe,           module: 'gestor_web',   section: 'main', badge: 'NEW' },
  { label: 'Asistente IA', href: '/ia',                    icon: Brain,           module: 'ai',           section: 'main', badge: 'IA' },
  { label: 'Reportes',     href: '/reportes',              icon: BarChart2,       module: 'reports',      section: 'main' },
  { label: 'Correos',      href: '/correos',               icon: Mail,            module: 'emails',       section: 'main' },
  { label: 'Configuración',href: '/dashboard/settings',    icon: Settings,        module: null,           section: 'system' },
]

interface SidebarProps {
  doctor: Doctor | null
  enabledModules?: string[]
}

export default function Sidebar({ doctor, enabledModules }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { settings } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingAppointments, setPendingAppointments] = useState(0)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  // ─── Cargar citas pendientes desde landing ──────────
  useEffect(() => {
    async function loadPending() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Citas programadas desde hoy en adelante con nota de landing
      const { count } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('doctor_id', user.id)
        .eq('status', 'programada')
        .gte('scheduled_at', new Date().toISOString())
        .ilike('notes', '%landing web%')

      setPendingAppointments(count || 0)
    }

    loadPending()

    // Actualizar cada 60 segundos
    const interval = setInterval(loadPending, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/auth/login')
  }

  const initials = doctor?.full_name
    ? doctor.full_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'DR'

  const displayName = settings.clinic_name || doctor?.full_name || 'Doctor'
  const avatarUrl   = settings.avatar_url  || doctor?.avatar_url || null
  const logoUrl     = settings.logo_url

  const visibleItems = ALL_NAV_ITEMS.filter(item => {
    if (item.module === null) return true
    if (!enabledModules) return true
    if (item.module === 'ai') return enabledModules.includes('ai') || enabledModules.includes('ia')
    return enabledModules.includes(item.module)
  })

  const mainItems   = visibleItems.filter(n => n.section === 'main')
  const systemItems = visibleItems.filter(n => n.section === 'system')

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-6 border-b flex items-center gap-3" style={{ borderColor: 'var(--border-color)' }}>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-9 w-9 rounded-xl object-contain flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, var(--clinic-primary), color-mix(in srgb, var(--clinic-primary) 70%, #000))`, boxShadow: `0 4px 12px color-mix(in srgb, var(--clinic-primary) 30%, transparent)` }}>
            <Stethoscope size={18} className="text-white" />
          </div>
        )}
        <span className="font-display text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Clinivigil<span className="logo-ia">IA</span>
        </span>
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto md:hidden p-1.5 rounded-lg"
          style={{ color: 'var(--text-muted)' }}>
          <X size={20} />
        </button>
      </div>

      {/* Doctor info */}
      <div className="mx-3 my-3 px-3 py-3 rounded-xl border flex items-center gap-3"
        style={{ background: 'var(--clinic-primary-light)', borderColor: 'var(--clinic-primary-medium)' }}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar"
            className="w-9 h-9 rounded-full object-cover flex-shrink-0 border-2"
            style={{ borderColor: 'var(--clinic-primary)' }} />
        ) : (
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: `linear-gradient(135deg, var(--clinic-primary), color-mix(in srgb, var(--clinic-primary) 70%, #000))` }}>
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{displayName}</p>
          <p className="text-[10px] font-medium capitalize" style={{ color: 'var(--clinic-primary)' }}>
            {doctor?.specialty?.replace('_', ' ') || 'Médico'}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-2" style={{ color: 'var(--text-muted)' }}>Principal</p>
        {mainItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}>
              <div className={`nav-item ${active ? 'active' : ''}`}>
                <item.icon size={16} />
                <span>{item.label}</span>

                {/* Badge de citas pendientes desde landing */}
                {(item as any).badge === 'citas' && pendingAppointments > 0 && (
                  <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold"
                    style={{ background: '#ef4444', minWidth: 20 }}>
                    {pendingAppointments > 99 ? '99+' : pendingAppointments}
                  </span>
                )}

                {/* Badge NEW para Gestor Web */}
                {(item as any).badge === 'NEW' && (
                  <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
                    NEW
                  </span>
                )}

                {/* Badge IA */}
                {(item as any).badge === 'IA' && (
                  <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
                    IA
                  </span>
                )}
              </div>
            </Link>
          )
        })}

        <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-2 mt-3" style={{ color: 'var(--text-muted)' }}>Sistema</p>
        {systemItems.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}>
              <div className={`nav-item ${active ? 'active' : ''}`}>
                <item.icon size={16} /><span>{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-3 space-y-2" style={{ borderColor: 'var(--border-color)' }}>
        <button onClick={handleLogout} className="nav-item w-full" style={{ color: '#f87171' }}>
          <LogOut size={16} /><span>Cerrar sesión</span>
        </button>
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 text-white text-[10px] font-bold px-3 py-1 rounded-full"
            style={{ background: `linear-gradient(90deg, var(--clinic-primary), color-mix(in srgb, var(--clinic-primary) 70%, #0369a1))` }}>
            <span className="w-1.5 h-1.5 bg-cyan-200 rounded-full animate-pulse" />
            IA Activa · v1.0
          </span>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Hamburguesa mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl shadow-lg"
        style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
        <Menu size={20} />
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar mobile */}
      <aside
        className={`md:hidden fixed left-0 top-0 h-screen w-[260px] flex flex-col z-50 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-color)', boxShadow: '4px 0 24px rgba(0,0,0,0.15)' }}>
        <SidebarContent />
      </aside>

      {/* Sidebar desktop */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-screen w-[240px] border-r flex-col z-50 transition-colors duration-300"
        style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-color)', boxShadow: '4px 0 24px rgba(0,0,0,0.06)' }}>
        <SidebarContent />
      </aside>
    </>
  )
}
