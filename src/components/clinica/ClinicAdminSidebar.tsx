'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Users, UserPlus, ClipboardList, Settings, LogOut, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

const navItems = [
  { label: 'Dashboard',  href: '/clinica/admin',          icon: LayoutDashboard },
  { label: 'Médicos',    href: '/clinica/admin/medicos',   icon: Users },
  { label: 'Pacientes',  href: '/clinica/admin/pacientes', icon: ClipboardList },
  { label: 'Config',     href: '/clinica/admin/config',    icon: Settings },
]

export default function ClinicAdminSidebar({ clinic, doctor }: { clinic: any; doctor: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const [brandLogoUrl, setBrandLogoUrl] = useState('')

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient()
        .from('landing_config').select('logo_url').eq('id', 'main').single()
        .then(({ data }) => { if (data?.logo_url) setBrandLogoUrl(data.logo_url) })
    })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/auth/login')
  }

  const initials = doctor?.full_name
    ? doctor.full_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'CA'

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] flex flex-col z-50"
      style={{ background: '#1e293b', borderRight: '1px solid #334155' }}>

      {/* Logo clínica */}
      <div className="px-5 py-5 border-b" style={{ borderColor: '#334155' }}>
        <div className="flex items-center gap-3">
          {brandLogoUrl && (
            <img src={brandLogoUrl} alt="ClinivigilIA" className="h-8 object-contain max-w-[100px] flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white truncate">{clinic.name}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#10b981' }}>
              Admin Clínica
            </p>
          </div>
        </div>
      </div>

      {/* Info admin */}
      <div className="mx-3 my-3 px-3 py-3 rounded-xl flex items-center gap-3"
        style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white truncate">{doctor?.full_name || 'Administrador'}</p>
          <p className="text-[10px]" style={{ color: '#10b981' }}>Administrador</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2">
        <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-2" style={{ color: '#475569' }}>
          Panel de Clínica
        </p>
        {navItems.map(item => {
          const active = item.href === '/clinica/admin'
            ? pathname === '/clinica/admin'
            : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer mb-0.5"
                style={{
                  background: active ? 'rgba(16,185,129,0.15)' : 'transparent',
                  color: active ? '#6ee7b7' : '#94a3b8',
                }}>
                <item.icon size={16} />
                <span>{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Stats rápidas */}
      <div className="mx-3 mb-3 p-3 rounded-xl" style={{ background: '#0f172a', border: '1px solid #334155' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#475569' }}>Plan activo</p>
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
            {clinic.plan}
          </span>
          <span className="text-xs" style={{ color: '#475569' }}>
            {clinic.max_doctors} médicos máx.
          </span>
        </div>
      </div>

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