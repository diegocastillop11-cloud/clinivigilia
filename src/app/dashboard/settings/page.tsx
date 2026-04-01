'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Save, User, Palette } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Doctor } from '@/types/database'

const SPECIALTIES = [
  { value: 'cardiologia',      label: 'Cardiología' },
  { value: 'neurologia',       label: 'Neurología' },
  { value: 'oncologia',        label: 'Oncología' },
  { value: 'pediatria',        label: 'Pediatría' },
  { value: 'ortopedia',        label: 'Ortopedia' },
  { value: 'endocrinologia',   label: 'Endocrinología' },
  { value: 'ginecologia',      label: 'Ginecología' },
  { value: 'dermatologia',     label: 'Dermatología' },
  { value: 'psiquiatria',      label: 'Psiquiatría' },
  { value: 'medicina_general', label: 'Medicina General' },
]

const TABS = [
  { label: 'Perfil Médico',   href: '/dashboard/settings',                icon: User    },
  { label: 'Personalización', href: '/dashboard/settings/personalizacion', icon: Palette },
]

export default function SettingsPage() {
  const pathname = usePathname()
  const [loading, setSaving] = useState(false)
  const [doctor, setDoctor] = useState<Partial<Doctor>>({})

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('doctors').select('*').eq('id', user.id).single()
      if (data) setDoctor(data)
    }
    load()
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDoctor(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('doctors').update({
      full_name:   doctor.full_name,
      specialty:   doctor.specialty,
      license_no:  doctor.license_no,
      phone:       doctor.phone,
      clinic_name: doctor.clinic_name,
    }).eq('id', user.id)
    if (error) { toast.error('Error al guardar'); setSaving(false); return }
    toast.success('Perfil actualizado')
    setSaving(false)
  }

  return (
    <div className="animate-in max-w-2xl px-2">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Configuración</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Gestiona tu perfil y preferencias</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)' }}>
        {TABS.map(tab => {
          const active = pathname === tab.href
          return (
            <Link key={tab.href} href={tab.href} className="flex-1">
              <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150"
                style={{
                  background: active ? 'var(--clinic-primary)' : 'transparent',
                  color: active ? '#fff' : 'var(--text-secondary)',
                }}>
                <tab.icon size={15} />
                {tab.label}
              </div>
            </Link>
          )
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <User size={16} style={{ color: 'var(--clinic-primary)' }} />
            <h2 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>Perfil Médico</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Nombre completo</label>
              <input className="form-input" value={doctor.full_name ?? ''} onChange={set('full_name')} />
            </div>
            <div>
              <label className="form-label">Especialidad</label>
              <select className="form-input" value={doctor.specialty ?? ''} onChange={set('specialty')}>
                <option value="">Seleccionar...</option>
                {SPECIALTIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">N° Licencia / Matrícula</label>
              <input className="form-input" placeholder="12345" value={doctor.license_no ?? ''} onChange={set('license_no')} />
            </div>
            <div>
              <label className="form-label">Teléfono</label>
              <input className="form-input" placeholder="+56 9..." value={doctor.phone ?? ''} onChange={set('phone')} />
            </div>
            <div>
              <label className="form-label">Nombre de la Clínica</label>
              <input className="form-input" placeholder="Clínica Las Condes" value={doctor.clinic_name ?? ''} onChange={set('clinic_name')} />
            </div>
          </div>
        </div>

        <div className="flex justify-end pb-4">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Guardando...' : <><Save size={16} /> Guardar Perfil</>}
          </button>
        </div>
      </form>

      <div className="card p-6" style={{ borderColor: 'var(--clinic-primary-medium)', background: 'var(--clinic-primary-light)' }}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0"
            style={{ background: `linear-gradient(135deg, var(--clinic-primary), color-mix(in srgb, var(--clinic-primary) 70%, #000))` }}>
            🤖
          </div>
          <div>
            <h3 className="font-display font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Módulo de IA — Próximamente</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              ClinivigilIA integrará inteligencia artificial para análisis predictivo, alertas automáticas y seguimiento inteligente.
            </p>
            <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: 'var(--clinic-primary-medium)', color: 'var(--clinic-primary)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--clinic-primary)' }} />
              En desarrollo
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
