'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Loader2, Building2, Mail, Phone, Globe, Upload, ImageIcon, X, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const inputStyle = {
  background: '#0f172a', border: '1.5px solid #334155', color: '#f1f5f9',
  borderRadius: '12px', padding: '10px 14px', fontSize: '13px',
  outline: 'none', width: '100%', fontFamily: 'DM Sans, sans-serif',
}
const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: '600' as const,
  color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
}

export default function ClinicConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [clinic, setClinic] = useState<any>(null)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', website: '',
    logo_url: '', description: '',
  })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('clinics').select('*').eq('admin_id', user.id).single()
      if (data) {
        setClinic(data)
        setForm({
          name:        data.name        ?? '',
          email:       data.email       ?? '',
          phone:       data.phone       ?? '',
          address:     data.address     ?? '',
          website:     data.website     ?? '',
          logo_url:    data.logo_url    ?? '',
          description: data.description ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Solo imágenes'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Máximo 2MB'); return }

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const fileName = `clinic-logo-${clinic?.id}-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('clinic-assets').upload(fileName, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('clinic-assets').getPublicUrl(fileName)
      setForm(p => ({ ...p, logo_url: data.publicUrl }))
      toast.success('Logo subido')
    } catch (err: any) {
      toast.error(err.message || 'Error al subir')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { error } = await supabase.from('clinics').update({
      name:        form.name,
      email:       form.email       || null,
      phone:       form.phone       || null,
      address:     form.address     || null,
      website:     form.website     || null,
      logo_url:    form.logo_url    || null,
      description: form.description || null,
    }).eq('admin_id', user.id)

    if (error) toast.error('Error al guardar: ' + error.message)
    else toast.success('Configuración guardada')
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 size={24} className="animate-spin" style={{ color: '#10b981' }} />
    </div>
  )

  return (
    <div style={{ color: '#f1f5f9', maxWidth: '680px' }}>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Configuración</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Datos y perfil de tu clínica</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      <div className="space-y-5">

        {/* Logo */}
        <div className="rounded-2xl p-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <h2 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
            <ImageIcon size={15} style={{ color: '#10b981' }} /> Logo de la Clínica
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ background: '#0f172a', border: '1px solid #334155' }}>
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <Building2 size={28} style={{ color: '#334155' }} />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <button onClick={() => inputRef.current?.click()} disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-dashed border-2 transition-all hover:opacity-80 disabled:opacity-50"
                style={{ borderColor: '#334155', color: '#94a3b8' }}>
                {uploading ? <><Loader2 size={14} className="animate-spin" /> Subiendo...</> : <><Upload size={14} /> Subir logo</>}
              </button>
              <input value={form.logo_url} onChange={set('logo_url')}
                placeholder="O pega una URL..."
                style={{ ...inputStyle, fontSize: '12px' }} />
            </div>
            {form.logo_url && (
              <button onClick={() => setForm(p => ({ ...p, logo_url: '' }))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/20">
                <X size={14} style={{ color: '#ef4444' }} />
              </button>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
        </div>

        {/* Datos básicos */}
        <div className="rounded-2xl p-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <h2 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
            <Building2 size={15} style={{ color: '#10b981' }} /> Datos de la Clínica
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label style={labelStyle}>Nombre de la clínica *</label>
              <input style={inputStyle} value={form.name} onChange={set('name')} placeholder="Clínica San Juan" />
            </div>
            <div className="col-span-2">
              <label style={labelStyle}>Descripción</label>
              <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' } as any}
                value={form.description} onChange={set('description')}
                placeholder="Breve descripción de tu clínica..." />
            </div>
            <div>
              <label style={labelStyle}>Email de contacto</label>
              <div className="relative">
                <input type="email" style={{ ...inputStyle, paddingLeft: '36px' }}
                  value={form.email} onChange={set('email')} placeholder="contacto@clinica.cl" />
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <div className="relative">
                <input style={{ ...inputStyle, paddingLeft: '36px' }}
                  value={form.phone} onChange={set('phone')} placeholder="+56 2 2345 6789" />
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
              </div>
            </div>
            <div className="col-span-2">
              <label style={labelStyle}>Dirección</label>
              <input style={inputStyle} value={form.address} onChange={set('address')}
                placeholder="Av. Providencia 1234, Santiago" />
            </div>
            <div className="col-span-2">
              <label style={labelStyle}>Sitio web</label>
              <div className="relative">
                <input style={{ ...inputStyle, paddingLeft: '36px' }}
                  value={form.website} onChange={set('website')} placeholder="https://www.miclinica.cl" />
                <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Info del plan */}
        <div className="rounded-2xl p-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <h2 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
            <Users size={15} style={{ color: '#10b981' }} /> Plan activo
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Plan', value: clinic?.plan?.toUpperCase() ?? '—' },
              { label: 'Médicos máx.', value: clinic?.max_doctors ?? '—' },
              { label: 'Estado', value: clinic?.status === 'active' ? 'Activo' : clinic?.status ?? '—' },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl text-center"
                style={{ background: '#0f172a', border: '1px solid #334155' }}>
                <p className="text-xs font-bold text-white">{item.value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#475569' }}>{item.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: '#475569' }}>
            Para cambiar de plan contacta al administrador del sistema.
          </p>
        </div>

      </div>
    </div>
  )
}