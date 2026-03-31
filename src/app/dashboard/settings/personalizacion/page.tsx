'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/context/ThemeContext'
import { Upload, Save, RotateCcw, Sun, Moon, Palette, Building2, User } from 'lucide-react'
import toast from 'react-hot-toast'

const PRESET_COLORS = [
  { hex: '#0ea5e9', name: 'Celeste médico' },
  { hex: '#0369a1', name: 'Azul profundo' },
  { hex: '#0891b2', name: 'Cian clínico' },
  { hex: '#0d9488', name: 'Verde teal' },
  { hex: '#059669', name: 'Verde salud' },
  { hex: '#7c3aed', name: 'Violeta' },
  { hex: '#db2777', name: 'Rosa médico' },
  { hex: '#dc2626', name: 'Rojo urgencia' },
  { hex: '#ea580c', name: 'Naranja' },
  { hex: '#ca8a04', name: 'Dorado' },
  { hex: '#374151', name: 'Grafito' },
  { hex: '#1e293b', name: 'Noche' },
]

const TABS = [
  { label: 'Perfil Médico',   href: '/dashboard/settings',               icon: User },
  { label: 'Personalización', href: '/dashboard/settings/personalizacion', icon: Palette },
]

export default function PersonalizacionPage() {
  const pathname = usePathname()
  const { settings, refresh } = useTheme()
  const logoRef   = useRef<HTMLInputElement>(null)
  const avatarRef = useRef<HTMLInputElement>(null)

  const [saving,          setSaving]          = useState(false)
  const [uploadingLogo,   setUploadingLogo]   = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [form, setForm] = useState({
    clinic_name:   '',
    primary_color: '#0ea5e9',
    theme:         'light' as 'light' | 'dark',
    sidebar_color: 'white' as 'white' | 'dark' | 'colored',
    logo_url:      '',
    avatar_url:    '',
  })

  useEffect(() => {
    setForm({
      clinic_name:   settings.clinic_name   || '',
      primary_color: settings.primary_color || '#0ea5e9',
      theme:         settings.theme         || 'light',
      sidebar_color: settings.sidebar_color || 'white',
      logo_url:      settings.logo_url      || '',
      avatar_url:    settings.avatar_url    || '',
    })
  }, [settings])

  // Live preview
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--clinic-primary', form.primary_color)
    root.style.setProperty('--clinic-primary-light',  form.primary_color + '20')
    root.style.setProperty('--clinic-primary-medium', form.primary_color + '40')
    if (form.theme === 'dark') root.classList.add('dark-mode')
    else root.classList.remove('dark-mode')
    root.setAttribute('data-sidebar', form.sidebar_color)
  }, [form.primary_color, form.theme, form.sidebar_color])

  const uploadFile = async (file: File, bucket: string, type: 'logo' | 'avatar') => {
    const setter = type === 'logo' ? setUploadingLogo : setUploadingAvatar
    setter(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const ext  = file.name.split('.').pop()
    const path = `${user.id}/${type}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) { toast.error('Error al subir: ' + error.message); setter(false); return }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    setForm(p => ({ ...p, [`${type}_url`]: publicUrl }))
    toast.success(`${type === 'logo' ? 'Logo' : 'Foto'} subido`)
    setter(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('clinic_settings').upsert({
      doctor_id:     user.id,
      clinic_name:   form.clinic_name   || null,
      primary_color: form.primary_color,
      theme:         form.theme,
      sidebar_color: form.sidebar_color,
      logo_url:      form.logo_url      || null,
      avatar_url:    form.avatar_url    || null,
    }, { onConflict: 'doctor_id' })
    if (error) { toast.error('Error: ' + error.message); setSaving(false); return }
    await refresh()
    toast.success('¡Personalización guardada!')
    setSaving(false)
  }

  const handleReset = () => {
    setForm({ clinic_name: '', primary_color: '#0ea5e9', theme: 'light', sidebar_color: 'white', logo_url: '', avatar_url: '' })
    toast('Valores restablecidos', { icon: '↩️' })
  }

  return (
    <div className="animate-in max-w-2xl">
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
                style={{ background: active ? 'var(--clinic-primary)' : 'transparent', color: active ? '#fff' : 'var(--text-secondary)' }}>
                <tab.icon size={15} />{tab.label}
              </div>
            </Link>
          )
        })}
      </div>

      <div className="space-y-5">
        {/* Identidad */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 size={16} style={{ color: 'var(--clinic-primary)' }} />
            <h3 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Identidad de la Clínica</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="form-label">Nombre de la clínica</label>
              <input className="form-input" placeholder="Clínica San José, Centro Médico..."
                value={form.clinic_name} onChange={e => setForm(p => ({ ...p, clinic_name: e.target.value }))} />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Aparece en el sidebar en lugar de tu nombre</p>
            </div>
            {/* Logo */}
            <div>
              <label className="form-label">Logo de la clínica</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl border-2 border-dashed flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                  {form.logo_url
                    ? <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                    : <Building2 size={22} style={{ color: 'var(--text-muted)' }} />}
                </div>
                <div className="flex-1">
                  <input ref={logoRef} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], 'clinic-assets', 'logo')} />
                  <button onClick={() => logoRef.current?.click()} disabled={uploadingLogo} className="btn-outline text-xs w-full justify-center mb-2">
                    <Upload size={13} />{uploadingLogo ? 'Subiendo...' : 'Subir logo'}
                  </button>
                  <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>PNG, JPG, SVG · máx 5MB</p>
                  {form.logo_url && (
                    <button onClick={() => setForm(p => ({ ...p, logo_url: '' }))}
                      className="text-xs w-full text-center mt-1" style={{ color: '#ef4444' }}>Eliminar logo</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Avatar */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <User size={16} style={{ color: 'var(--clinic-primary)' }} />
            <h3 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Foto de Perfil</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ borderColor: 'var(--clinic-primary)', background: 'var(--clinic-primary-light)' }}>
              {form.avatar_url
                ? <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                : <span className="text-xl font-bold" style={{ color: 'var(--clinic-primary)' }}>
                    {form.clinic_name?.[0]?.toUpperCase() || 'D'}
                  </span>}
            </div>
            <div className="flex-1">
              <input ref={avatarRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], 'avatars', 'avatar')} />
              <button onClick={() => avatarRef.current?.click()} disabled={uploadingAvatar} className="btn-outline text-xs w-full justify-center mb-2">
                <Upload size={13} />{uploadingAvatar ? 'Subiendo...' : 'Subir foto'}
              </button>
              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>PNG, JPG · máx 3MB</p>
              {form.avatar_url && (
                <button onClick={() => setForm(p => ({ ...p, avatar_url: '' }))}
                  className="text-xs w-full text-center mt-1" style={{ color: '#ef4444' }}>Eliminar foto</button>
              )}
            </div>
          </div>
        </div>

        {/* Color */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Palette size={16} style={{ color: 'var(--clinic-primary)' }} />
            <h3 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Color Principal</h3>
          </div>
          <div className="grid grid-cols-6 gap-2 mb-4">
            {PRESET_COLORS.map(c => (
              <button key={c.hex} title={c.name}
                onClick={() => setForm(p => ({ ...p, primary_color: c.hex }))}
                className={`color-swatch ${form.primary_color === c.hex ? 'selected' : ''}`}
                style={{ background: c.hex }} />
            ))}
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl border"
            style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
            <input type="color" value={form.primary_color}
              onChange={e => setForm(p => ({ ...p, primary_color: e.target.value }))}
              className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
            <div className="flex-1">
              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Color personalizado</p>
              <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{form.primary_color.toUpperCase()}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 rounded-full text-white font-semibold" style={{ background: form.primary_color }}>Botón</span>
              <span className="text-xs px-2 py-1 rounded-lg font-medium"
                style={{ background: form.primary_color + '20', color: form.primary_color }}>Badge</span>
            </div>
          </div>
        </div>

        {/* Tema */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Sun size={16} style={{ color: 'var(--clinic-primary)' }} />
            <h3 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Tema de la Interfaz</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'light', label: 'Claro',  icon: Sun,  desc: 'Fondo blanco · Recomendado' },
              { value: 'dark',  label: 'Oscuro', icon: Moon, desc: 'Fondo oscuro · Modo noche' },
            ].map(opt => (
              <button key={opt.value}
                onClick={() => setForm(p => ({ ...p, theme: opt.value as 'light' | 'dark' }))}
                className="flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150"
                style={{
                  borderColor: form.theme === opt.value ? 'var(--clinic-primary)' : 'var(--border-color)',
                  background:  form.theme === opt.value ? 'var(--clinic-primary-light)' : 'var(--bg-page)',
                }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: form.theme === opt.value ? 'var(--clinic-primary)' : 'var(--bg-card)',
                    border: `1px solid ${form.theme === opt.value ? 'transparent' : 'var(--border-color)'}`,
                  }}>
                  <opt.icon size={16} style={{ color: form.theme === opt.value ? '#fff' : 'var(--text-secondary)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{opt.label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <span style={{ fontSize: 18, color: 'var(--clinic-primary)', fontWeight: 'bold' }}>▌</span>
            <h3 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Color del Sidebar</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'white',   label: 'Blanco',        desc: 'Clásico y limpio', bg: '#ffffff' },
              { value: 'dark',    label: 'Oscuro',         desc: 'Contraste alto',  bg: '#0f172a' },
              { value: 'colored', label: 'Color primario', desc: 'Tu color de marca', bg: form.primary_color },
            ].map(opt => (
              <button key={opt.value}
                onClick={() => setForm(p => ({ ...p, sidebar_color: opt.value as 'white' | 'dark' | 'colored' }))}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all duration-150"
                style={{
                  borderColor: form.sidebar_color === opt.value ? 'var(--clinic-primary)' : 'var(--border-color)',
                  background:  form.sidebar_color === opt.value ? 'var(--clinic-primary-light)' : 'var(--bg-page)',
                }}>
                <div className="w-12 h-16 rounded-lg overflow-hidden border flex flex-col" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex-1 flex flex-col gap-1 p-1.5" style={{ background: opt.bg }}>
                    {[8, 6, 7].map((w, i) => (
                      <div key={i} className="h-1.5 rounded-sm" style={{
                        width: `${w * 4}px`,
                        background: opt.value === 'white' ? '#e2e8f0' : 'rgba(255,255,255,0.3)',
                      }} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{opt.label}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-6">
          <button onClick={handleReset} className="btn-outline"><RotateCcw size={14} /> Restablecer</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Guardando...' : <><Save size={15} /> Guardar personalización</>}
          </button>
        </div>
      </div>
    </div>
  )
}
