'use client'
import { useState, useEffect } from 'react'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Users, Settings, LogOut, Shield, ExternalLink, Brain, Stethoscope } from 'lucide-react'
import toast from 'react-hot-toast'

const navItems = [
  { label: 'Dashboard',      href: '/admin',                icon: LayoutDashboard },
  { label: 'Clientes',       href: '/admin/clientes',       icon: Users },
  { label: 'Especialidades', href: '/admin/especialidades', icon: Stethoscope },
  { label: 'IA Admin',       href: '/admin/ia',             icon: Brain, badge: 'PRO' },
  { label: 'Config',         href: '/admin/config',         icon: Settings },
]

const testModules = [
  { label: 'Asistente IA', href: '/ia', icon: Brain, badge: 'IA' },
]

export default function AdminSidebar({ doctor }: { doctor: any }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [logoUrl, setLogoUrl] = useState('')

  useEffect(() => {
    createClient()
      .from('landing_config').select('logo_url').eq('id', 'main').single()
      .then(({ data }) => { if (data?.logo_url) setLogoUrl(data.logo_url) })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/auth/login')
  }

  const initials = doctor?.full_name
    ? doctor.full_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'SA'

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] flex flex-col z-50"
      style={{ background: '#1e293b', borderRight: '1px solid #334155' }}>

      {/* Logo */}
      <div className="px-5 py-5 border-b flex items-center gap-3" style={{ borderColor: '#334155' }}>
        {logoUrl ? (
          <div className="flex items-center gap-2 w-full">
            <img src={logoUrl} alt="ClinivigilIA" className="h-9 object-contain max-w-[140px]" />
            <span className="text-[10px] font-bold uppercase tracking-widest ml-auto"
              style={{ color: '#818cf8' }}>Super Admin</span>
          </div>
        ) : (
          <>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <span className="font-display text-base font-bold text-white tracking-tight block">
                Clinivigil<span style={{ color: '#818cf8' }}>IA</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: '#818cf8' }}>Super Admin</span>
            </div>
          </>
        )}
      </div>

      {/* Admin info */}
      <div className="mx-3 my-3 px-3 py-3 rounded-xl flex items-center gap-3"
        style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white truncate">{doctor?.full_name || 'Super Admin'}</p>
          <p className="text-[10px] font-medium" style={{ color: '#818cf8' }}>Administrador</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-2" style={{ color: '#475569' }}>
          Panel de Control
        </p>
        {navItems.map(item => {
          const active = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer select-none mb-0.5"
                style={{
                  background: active ? 'rgba(129,140,248,0.15)' : 'transparent',
                  color: active ? '#a5b4fc' : '#94a3b8',
                }}>
                <item.icon size={16} />
                <span className="flex-1">{item.label}</span>
                {(item as any).badge && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
                    {(item as any).badge}
                  </span>
                )}
              </div>
            </Link>
          )
        })}

        {/* Módulos para probar */}
        <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-2 mt-3" style={{ color: '#475569' }}>
          Prueba de Módulos
        </p>
        {testModules.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer select-none mb-0.5"
                style={{
                  background: active ? 'rgba(129,140,248,0.15)' : 'transparent',
                  color: active ? '#a5b4fc' : '#94a3b8',
                }}>
                <item.icon size={16} />
                <span>{item.label}</span>
                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
                  {item.badge}
                </span>
              </div>
            </Link>
          )
        })}

        {/* Link to doctor panel */}
        <div className="mt-4 px-2">
          <Link href="/dashboard">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer"
              style={{ color: '#64748b', border: '1px dashed #334155' }}>
              <ExternalLink size={14} />
              <span>Ver panel médico</span>
            </div>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t p-3" style={{ borderColor: '#334155' }}>
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all duration-150"
          style={{ color: '#f87171' }}>
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}