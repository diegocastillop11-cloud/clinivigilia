'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { WebPage } from '@/types/gestor-web'

// ─── Iconos ───────────────────────────────────────────────
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
)
const IconSave = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
)
const IconGlobe = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
)
const IconUpload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
)
const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
)

// ─── Colores preset ───────────────────────────────────────
const COLOR_PRESETS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#06B6D4', '#3B82F6',
  '#84CC16', '#F97316', '#14B8A6', '#6B7280',
]

// ─── Secciones del formulario ─────────────────────────────
const SECTIONS = [
  { id: 'identidad',     label: 'Identidad',      emoji: '🏥' },
  { id: 'contacto',      label: 'Contacto',        emoji: '📞' },
  { id: 'redes',         label: 'Redes sociales',  emoji: '📱' },
  { id: 'apariencia',    label: 'Apariencia',      emoji: '🎨' },
  { id: 'modulos',       label: 'Módulos activos', emoji: '⚙️' },
]

// ─── Componentes base ─────────────────────────────────────
function SectionCard({ emoji, title, subtitle, children }: {
  emoji: string; title: string; subtitle?: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
        <span className="text-xl">{emoji}</span>
        <div>
          <h2 className="font-bold text-gray-900 text-sm">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
      {...props}
    />
  )
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all bg-gray-50 focus:bg-white resize-none"
      {...props}
    />
  )
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex items-center justify-between w-full p-3 rounded-xl border transition-all hover:border-violet-200"
      style={{ borderColor: on ? '#818cf8' : '#e5e7eb', background: on ? '#f5f3ff' : '#f9fafb' }}
    >
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${on ? 'bg-violet-500' : 'bg-gray-200'}`}>
        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${on ? 'left-5' : 'left-0.5'}`}/>
      </div>
    </button>
  )
}

// ─── Live preview del slug ────────────────────────────────
function SlugPreview({ slug, siteUrl }: { slug: string; siteUrl: string }) {
  const display = slug ? `${siteUrl}/${slug}` : `${siteUrl}/tu-clinica`
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
      <IconGlobe />
      <span className="text-xs text-gray-400 font-mono truncate">{display}</span>
      {slug && (
        <span className="ml-auto flex-shrink-0">
          <span className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
            <IconCheck />
          </span>
        </span>
      )}
    </div>
  )
}

// ─── Upload de imagen ─────────────────────────────────────
function ImageUpload({ label, hint, value, bucket, path, onChange }: {
  label: string; hint?: string; value: string | null
  bucket: string; path: string; onChange: (url: string) => void
}) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const filePath = `${path}-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath)
      onChange(publicUrl)
      toast.success('Imagen subida correctamente')
    } catch {
      toast.error('Error al subir la imagen')
    }
    setUploading(false)
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
            <img src={value} alt={label} className="w-full h-full object-cover"/>
            <button
              onClick={() => onChange('')}
              className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold"
            >✕</button>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center flex-shrink-0 bg-gray-50">
            <span className="text-gray-300 text-2xl">+</span>
          </div>
        )}
        <div className="flex-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            <IconUpload />
            {uploading ? 'Subiendo...' : 'Subir imagen'}
          </button>
          {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────
export default function ConfigurarSitioPage() {
  const router = useRouter()
  const supabase = createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://clinivigilia.com'

  const [loading, setLoading]   = useState(true)
  const [saving,  setSaving]    = useState(false)
  const [pageId,  setPageId]    = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('identidad')

  const [form, setForm] = useState({
    // Identidad
    slug:           '',
    clinic_name:    '',
    tagline:        '',
    about_text:     '',
    hero_image_url: '',
    // Contacto
    phone:          '',
    whatsapp:       '',
    email:          '',
    address:        '',
    city:           '',
    maps_url:       '',
    // Redes
    instagram_url:  '',
    facebook_url:   '',
    // Apariencia
    primary_color:  '#6366F1',
    accent_color:   '#8B5CF6',
    theme:          'light' as 'light' | 'dark',
    // Módulos landing
    show_services:  true,
    show_chat_ia:   true,
    show_booking:   true,
    show_map:       true,
  })

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  // ─── Cargar datos existentes ───────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('web_pages')
        .select('*')
        .eq('doctor_id', user.id)
        .maybeSingle()

      if (data) {
        setPageId(data.id)
        setForm({
          slug:           data.slug           || '',
          clinic_name:    data.clinic_name    || '',
          tagline:        data.tagline        || '',
          about_text:     data.about_text     || '',
          hero_image_url: data.hero_image_url || '',
          phone:          data.phone          || '',
          whatsapp:       data.whatsapp       || '',
          email:          data.email          || '',
          address:        data.address        || '',
          city:           data.city           || '',
          maps_url:       data.maps_url       || '',
          instagram_url:  data.instagram_url  || '',
          facebook_url:   data.facebook_url   || '',
          primary_color:  data.primary_color  || '#6366F1',
          accent_color:   data.accent_color   || '#8B5CF6',
          theme:          data.theme          || 'light',
          show_services:  data.show_services  ?? true,
          show_chat_ia:   data.show_chat_ia   ?? true,
          show_booking:   data.show_booking   ?? true,
          show_map:       data.show_map       ?? true,
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  // ─── Limpiar slug en tiempo real ───────────────────────
  function handleSlugChange(raw: string) {
    const clean = raw
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    set('slug', clean)
  }

  // ─── Guardar ───────────────────────────────────────────
  async function handleSave() {
    if (!form.slug.trim()) {
      toast.error('El slug (URL) es obligatorio')
      setActiveSection('identidad')
      return
    }
    if (!form.clinic_name.trim()) {
      toast.error('El nombre de la clínica es obligatorio')
      setActiveSection('identidad')
      return
    }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      doctor_id:      user.id,
      slug:           form.slug,
      clinic_name:    form.clinic_name    || null,
      tagline:        form.tagline        || null,
      about_text:     form.about_text     || null,
      hero_image_url: form.hero_image_url || null,
      phone:          form.phone          || null,
      whatsapp:       form.whatsapp       || null,
      email:          form.email          || null,
      address:        form.address        || null,
      city:           form.city           || null,
      maps_url:       form.maps_url       || null,
      instagram_url:  form.instagram_url  || null,
      facebook_url:   form.facebook_url   || null,
      primary_color:  form.primary_color,
      accent_color:   form.accent_color,
      theme:          form.theme,
      show_services:  form.show_services,
      show_chat_ia:   form.show_chat_ia,
      show_booking:   form.show_booking,
      show_map:       form.show_map,
    }

    let error
    if (pageId) {
      const res = await supabase.from('web_pages').update(payload).eq('id', pageId)
      error = res.error
    } else {
      const res = await supabase.from('web_pages').insert(payload).select('id').single()
      error = res.error
      if (res.data) setPageId(res.data.id)
    }

    setSaving(false)
    if (error) {
      if (error.code === '23505') {
        toast.error('Ese slug ya está en uso, elige otro')
        setActiveSection('identidad')
      } else {
        toast.error('Error al guardar')
      }
    } else {
      toast.success('¡Sitio configurado correctamente!')
      router.push('/dashboard/gestor-web')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"/>
          <p className="text-sm text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* ─── Header ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => router.push('/dashboard/gestor-web')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-3 transition-colors"
          >
            <IconArrowLeft /> Volver al gestor web
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Configurar sitio web</h1>
          <p className="text-sm text-gray-500 mt-1">Define cómo verán tu clínica o consulta tus pacientes</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-violet-200 disabled:opacity-50 flex-shrink-0"
        >
          {saving ? (
            <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/> Guardando...</>
          ) : (
            <><IconSave /> Guardar</>
          )}
        </button>
      </div>

      {/* ─── Nav de secciones ─────────────────────────── */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-2xl p-1 overflow-x-auto">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-1 justify-center ${
              activeSection === s.id
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{s.emoji}</span>
            <span className="hidden sm:block">{s.label}</span>
          </button>
        ))}
      </div>

      {/* ─── SECCIÓN: Identidad ───────────────────────── */}
      {activeSection === 'identidad' && (
        <div className="space-y-5">
          <SectionCard emoji="🏥" title="Identidad de tu clínica" subtitle="La información principal que verán tus pacientes">

            <Field label="Nombre de la clínica *">
              <Input
                placeholder="Ej: Clínica San Martín, Consulta Dr. Pérez..."
                value={form.clinic_name}
                onChange={e => set('clinic_name', e.target.value)}
                autoFocus
              />
            </Field>

            <Field
              label="URL pública (slug) *"
              hint="Solo letras minúsculas, números y guiones. No se puede cambiar después de publicar."
            >
              <Input
                placeholder="ej: clinica-san-martin"
                value={form.slug}
                onChange={e => handleSlugChange(e.target.value)}
              />
              <SlugPreview slug={form.slug} siteUrl={siteUrl} />
            </Field>

            <Field label="Tagline" hint="Una frase corta y memorable. Ej: 'Tu salud, nuestra prioridad'">
              <Input
                placeholder="Ej: Cuidamos tu salud con tecnología de vanguardia"
                value={form.tagline}
                onChange={e => set('tagline', e.target.value)}
                maxLength={100}
              />
            </Field>

            <Field label="Descripción de la clínica" hint="Se muestra en la sección 'Sobre nosotros' de tu landing">
              <Textarea
                placeholder="Cuenta quiénes son, qué los hace especiales, cuánto tiempo llevan, su misión..."
                value={form.about_text}
                onChange={e => set('about_text', e.target.value)}
                rows={4}
              />
            </Field>

            <ImageUpload
              label="Imagen principal (hero)"
              hint="Recomendado: 1200x600px. Foto de la clínica, equipo o ambiente."
              value={form.hero_image_url}
              bucket="web-assets"
              path={`hero/${form.slug || 'clinica'}`}
              onChange={url => set('hero_image_url', url)}
            />
          </SectionCard>
        </div>
      )}

      {/* ─── SECCIÓN: Contacto ────────────────────────── */}
      {activeSection === 'contacto' && (
        <SectionCard emoji="📞" title="Información de contacto" subtitle="Cómo pueden encontrarte tus pacientes">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Teléfono">
              <Input placeholder="+56 2 2345 6789" value={form.phone} onChange={e => set('phone', e.target.value)}/>
            </Field>
            <Field label="WhatsApp" hint="Con código de país">
              <Input placeholder="+56 9 8765 4321" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)}/>
            </Field>
            <Field label="Email de contacto">
              <Input type="email" placeholder="contacto@miclinica.cl" value={form.email} onChange={e => set('email', e.target.value)}/>
            </Field>
            <Field label="Ciudad">
              <Input placeholder="Santiago, Valparaíso..." value={form.city} onChange={e => set('city', e.target.value)}/>
            </Field>
          </div>
          <Field label="Dirección">
            <Input placeholder="Av. Providencia 1234, Oficina 56" value={form.address} onChange={e => set('address', e.target.value)}/>
          </Field>
          <Field label="Link de Google Maps" hint="Abre Google Maps → Compartir → Copiar link">
            <Input placeholder="https://maps.google.com/..." value={form.maps_url} onChange={e => set('maps_url', e.target.value)}/>
          </Field>
        </SectionCard>
      )}

      {/* ─── SECCIÓN: Redes sociales ──────────────────── */}
      {activeSection === 'redes' && (
        <SectionCard emoji="📱" title="Redes sociales" subtitle="Aparecen como íconos en el footer de tu landing">
          <Field label="Instagram">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">instagram.com/</span>
              <Input
                placeholder="miclinica"
                value={form.instagram_url.replace('https://instagram.com/', '').replace('https://www.instagram.com/', '')}
                onChange={e => set('instagram_url', e.target.value ? `https://instagram.com/${e.target.value}` : '')}
                className="pl-32"
                style={{ paddingLeft: '132px' }}
              />
            </div>
          </Field>
          <Field label="Facebook">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">facebook.com/</span>
              <Input
                placeholder="miclinica"
                value={form.facebook_url.replace('https://facebook.com/', '').replace('https://www.facebook.com/', '')}
                onChange={e => set('facebook_url', e.target.value ? `https://facebook.com/${e.target.value}` : '')}
                style={{ paddingLeft: '124px' }}
              />
            </div>
          </Field>
        </SectionCard>
      )}

      {/* ─── SECCIÓN: Apariencia ─────────────────────── */}
      {activeSection === 'apariencia' && (
        <div className="space-y-5">
          <SectionCard emoji="🎨" title="Colores" subtitle="Define la paleta visual de tu landing pública">

            <Field label="Color principal">
              <div className="flex flex-wrap gap-2 mb-3">
                {COLOR_PRESETS.map(c => (
                  <button
                    key={c}
                    onClick={() => set('primary_color', c)}
                    className="w-8 h-8 rounded-lg transition-all hover:scale-110 flex-shrink-0"
                    style={{
                      background: c,
                      ring: form.primary_color === c ? `3px solid ${c}` : 'none',
                      outline: form.primary_color === c ? `3px solid ${c}` : 'none',
                      outlineOffset: '2px',
                      transform: form.primary_color === c ? 'scale(1.15)' : undefined,
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={e => set('primary_color', e.target.value)}
                  className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-1"
                />
                <Input
                  value={form.primary_color}
                  onChange={e => set('primary_color', e.target.value)}
                  placeholder="#6366F1"
                  className="font-mono"
                />
              </div>
            </Field>

            <Field label="Color de acento">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.accent_color}
                  onChange={e => set('accent_color', e.target.value)}
                  className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-1"
                />
                <Input
                  value={form.accent_color}
                  onChange={e => set('accent_color', e.target.value)}
                  placeholder="#8B5CF6"
                  className="font-mono"
                />
              </div>
            </Field>

            {/* Preview de colores */}
            <div className="rounded-xl overflow-hidden border border-gray-100">
              <div className="px-4 py-3 text-white text-sm font-semibold" style={{ background: form.primary_color }}>
                Vista previa — Header de tu landing
              </div>
              <div className="px-4 py-3 bg-white flex items-center gap-3">
                <button className="text-sm font-semibold px-4 py-1.5 rounded-lg text-white" style={{ background: form.primary_color }}>
                  Agendar cita
                </button>
                <button className="text-sm font-semibold px-4 py-1.5 rounded-lg" style={{ background: form.accent_color + '20', color: form.accent_color }}>
                  Ver servicios
                </button>
              </div>
            </div>
          </SectionCard>

          <SectionCard emoji="🌓" title="Tema" subtitle="Modo claro u oscuro para tu landing">
            <div className="grid grid-cols-2 gap-3">
              {(['light', 'dark'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => set('theme', t)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    form.theme === t ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-full h-12 rounded-lg mb-2 flex items-center justify-center text-lg ${
                    t === 'light' ? 'bg-white border border-gray-200' : 'bg-gray-900'
                  }`}>
                    {t === 'light' ? '☀️' : '🌙'}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{t === 'light' ? 'Claro' : 'Oscuro'}</p>
                  <p className="text-xs text-gray-400">{t === 'light' ? 'Fondo blanco, texto oscuro' : 'Fondo oscuro, texto claro'}</p>
                </button>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ─── SECCIÓN: Módulos ─────────────────────────── */}
      {activeSection === 'modulos' && (
        <SectionCard emoji="⚙️" title="Módulos de la landing" subtitle="Elige qué secciones aparecen en tu sitio público">
          <div className="space-y-2">
            <Toggle on={form.show_services} onChange={v => set('show_services', v)} label="🩺 Catálogo de servicios"/>
            <Toggle on={form.show_chat_ia}  onChange={v => set('show_chat_ia',  v)} label="🤖 Chat con IA"/>
            <Toggle on={form.show_booking}  onChange={v => set('show_booking',  v)} label="📅 Agendar cita online"/>
            <Toggle on={form.show_map}      onChange={v => set('show_map',      v)} label="📍 Mapa y dirección"/>
          </div>

          <div className="mt-4 p-4 bg-violet-50 border border-violet-100 rounded-xl">
            <p className="text-xs font-semibold text-violet-700 mb-2">Vista previa de secciones activas</p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'show_services', label: 'Servicios',  emoji: '🩺' },
                { key: 'show_chat_ia',  label: 'Chat IA',    emoji: '🤖' },
                { key: 'show_booking',  label: 'Agendamiento', emoji: '📅' },
                { key: 'show_map',      label: 'Mapa',       emoji: '📍' },
              ].map(m => (
                <span
                  key={m.key}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full transition-all ${
                    form[m.key as keyof typeof form]
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-gray-100 text-gray-400 line-through'
                  }`}
                >
                  {m.emoji} {m.label}
                </span>
              ))}
            </div>
          </div>
        </SectionCard>
      )}

      {/* ─── Botón guardar bottom ─────────────────────── */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-md shadow-violet-200 disabled:opacity-50"
        >
          {saving ? (
            <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/> Guardando...</>
          ) : (
            <><IconSave /> Guardar configuración</>
          )}
        </button>
      </div>
    </div>
  )
}
