'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Save, User, Palette, Stethoscope, Phone, Building2, Hash, Shield } from 'lucide-react'
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
  { label: 'Perfil Médico',   href: '/dashboard/settings',               icon: User    },
  { label: 'Personalización', href: '/dashboard/settings/personalizacion', icon: Palette },
]

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--clinic-primary)' }}>{icon}</span>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const pathname = usePathname()
  const [loading, setSaving] = useState(false)
  const [doctor, setDoctor] = useState<Partial<Doctor>>({})
  const [initials, setInitials] = useState('DR')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('doctors').select('*').eq('id', user.id).single()
      if (data) {
        setDoctor(data)
        if (data.full_name) {
          setInitials(data.full_name.split(' ').map((w: string) => w[0]).slice(0,2).join('').toUpperCase())
        }
      }
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
    toast.success('✅ Perfil actualizado correctamente')
    setSaving(false)
  }

  const selectedSpecialty = SPECIALTIES.find(s => s.value === doctor.specialty)

  return (
    <div className="animate-in max-w-2xl space-y-6">

      {/* ─── Header ───────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--clinic-primary), color-mix(in srgb, var(--clinic-primary) 60%, #6366f1))' }}>
          {initials}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {doctor.full_name || 'Mi perfil'}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            {selectedSpecialty && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: 'var(--clinic-primary-light)', color: 'var(--clinic-primary)' }}>
                {selectedSpecialty.label}
              </span>
            )}
            {doctor.clinic_name && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                · {doctor.clinic_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Tabs ─────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-2xl"
        style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)' }}>
        {TABS.map(tab => {
          const active = pathname === tab.href
          return (
            <Link key={tab.href} href={tab.href} className="flex-1">
              <div className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200`}
                style={{
                  background: active ? 'var(--clinic-primary)' : 'transparent',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  boxShadow: active ? '0 4px 12px color-mix(in srgb, var(--clinic-primary) 30%, transparent)' : 'none',
                }}>
                <tab.icon size={15} />
                {tab.label}
              </div>
            </Link>
          )
        })}
      </div>

      {/* ─── Formulario ───────────────────────────────── */}
      <form onSubmit={handleSave} className="space-y-5">

        {/* Card info personal */}
        <div className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>

          <div className="px-6 py-4 flex items-center gap-2"
            style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-page)' }}>
            <User size={15} style={{ color: 'var(--clinic-primary)' }} />
            <h2 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Información profesional
            </h2>
          </div>

          <div className="p-6 grid grid-cols-2 gap-5">

            <div className="col-span-2">
              <Field label="Nombre completo" icon={<User size={11}/>}>
                <input
                  className="form-input"
                  placeholder="Dr. Juan Pérez"
                  value={doctor.full_name ?? ''}
                  onChange={set('full_name')}
                />
              </Field>
            </div>

            <Field label="Especialidad" icon={<Stethoscope size={11}/>}>
              <select className="form-input" value={doctor.specialty ?? ''} onChange={set('specialty')}>
                <option value="">Seleccionar...</option>
                {SPECIALTIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>

            <Field label="N° Licencia / Matrícula" icon={<Hash size={11}/>}>
              <input
                className="form-input"
                placeholder="12345"
                value={doctor.license_no ?? ''}
                onChange={set('license_no')}
              />
            </Field>

            <Field label="Teléfono" icon={<Phone size={11}/>}>
              <input
                className="form-input"
                placeholder="+56 9 1234 5678"
                value={doctor.phone ?? ''}
                onChange={set('phone')}
              />
            </Field>

            <Field label="Nombre de la clínica" icon={<Building2 size={11}/>}>
              <input
                className="form-input"
                placeholder="Clínica Las Condes"
                value={doctor.clinic_name ?? ''}
                onChange={set('clinic_name')}
              />
            </Field>

          </div>
        </div>

        {/* Botón guardar */}
        <div className="flex justify-end">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-all"
            style={{
              background: 'linear-gradient(135deg, var(--clinic-primary), color-mix(in srgb, var(--clinic-primary) 70%, #6366f1))',
              boxShadow: '0 4px 16px color-mix(in srgb, var(--clinic-primary) 35%, transparent)',
              opacity: loading ? 0.7 : 1,
            }}>
            {loading
              ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/> Guardando...</>
              : <><Save size={15}/> Guardar perfil</>
            }
          </button>
        </div>
      </form>

      {/* ─── Banner IA ────────────────────────────────── */}
      <div className="rounded-2xl p-5 flex items-start gap-4"
        style={{
          border: '1px solid var(--clinic-primary-medium)',
          background: 'var(--clinic-primary-light)',
        }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--clinic-primary), color-mix(in srgb, var(--clinic-primary) 60%, #6366f1))' }}>
          🤖
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Módulo de IA Avanzada
            </h3>
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--clinic-primary-medium)', color: 'var(--clinic-primary)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: 'var(--clinic-primary)' }}/>
              Próximamente
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Análisis predictivo, alertas automáticas y seguimiento inteligente de pacientes con IA.
          </p>
        </div>
      </div>

    </div>
  )
}
