'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Save, Palette, Type, DollarSign, Star,
  Check, Loader2, Eye, Layout, Plus, Trash2,
  Upload, X, ImageIcon
} from 'lucide-react'
import toast from 'react-hot-toast'

const COLOR_PALETTES = [
  { name: 'Índigo Premium', primary: '#6366f1', secondary: '#8b5cf6', accent: '#38bdf8', bg: '#030712', preview: ['#6366f1', '#8b5cf6', '#38bdf8'] },
  { name: 'Azul Clínico', primary: '#0ea5e9', secondary: '#0284c7', accent: '#6366f1', bg: '#020c1b', preview: ['#0ea5e9', '#0284c7', '#6366f1'] },
  { name: 'Esmeralda Salud', primary: '#10b981', secondary: '#059669', accent: '#0ea5e9', bg: '#030f0a', preview: ['#10b981', '#059669', '#0ea5e9'] },
  { name: 'Violeta Moderno', primary: '#8b5cf6', secondary: '#7c3aed', accent: '#ec4899', bg: '#0d0414', preview: ['#8b5cf6', '#7c3aed', '#ec4899'] },
  { name: 'Coral Cálido', primary: '#f43f5e', secondary: '#e11d48', accent: '#fb923c', bg: '#0f0608', preview: ['#f43f5e', '#e11d48', '#fb923c'] },
  { name: 'Teal Profesional', primary: '#14b8a6', secondary: '#0d9488', accent: '#818cf8', bg: '#030f0e', preview: ['#14b8a6', '#0d9488', '#818cf8'] },
]

interface LandingConfig {
  hero_title: string
  hero_subtitle: string
  hero_badge: string
  company_name: string
  company_tagline: string
  logo_url: string
  color_primary: string
  color_secondary: string
  color_accent: string
  color_bg: string
  plans: any[]
  features: any[]
  testimonials: any[]
}

const DEFAULTS: LandingConfig = {
  hero_title: 'La clínica del futuro, disponible hoy.',
  hero_subtitle: 'Gestiona pacientes, citas y seguimiento clínico con el poder de la IA.',
  hero_badge: 'Potenciado por Inteligencia Artificial · Claude Sonnet',
  company_name: 'ClinivigilIA',
  company_tagline: 'Sistema de Gestión Médica',
  logo_url: '',
  color_primary: '#6366f1',
  color_secondary: '#8b5cf6',
  color_accent: '#38bdf8',
  color_bg: '#030712',
  plans: [],
  features: [],
  testimonials: [],
}

type Tab = 'hero' | 'colors' | 'plans' | 'features' | 'testimonials'

// ─── Logo Uploader ────────────────────────────────────────────────────────────
function LogoUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo y tamaño
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen debe pesar menos de 2MB')
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const fileName = `landing-logo-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('clinic-assets')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('clinic-assets')
        .getPublicUrl(fileName)

      onChange(data.publicUrl)
      toast.success('Logo subido correctamente')
    } catch (err: any) {
      toast.error(err.message || 'Error al subir el logo')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#64748b' }}>
        Logo de la empresa
      </label>
      <div className="flex items-center gap-3">
        {/* Preview */}
        <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ background: '#0f172a', border: '1px solid #334155' }}>
          {value ? (
            <img src={value} alt="Logo" className="w-full h-full object-contain p-1" />
          ) : (
            <ImageIcon size={20} style={{ color: '#334155' }} />
          )}
        </div>

        <div className="flex-1 space-y-2">
          {/* Botón upload */}
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-dashed border-2 transition-all hover:opacity-80 disabled:opacity-50"
            style={{ borderColor: '#334155', color: '#94a3b8' }}>
            {uploading
              ? <><Loader2 size={15} className="animate-spin" /> Subiendo...</>
              : <><Upload size={15} /> Subir desde PC</>}
          </button>

          {/* URL manual como fallback */}
          <input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="O pega una URL directamente..."
            className="w-full px-3 py-2 rounded-xl text-xs outline-none"
            style={{ background: '#0f172a', border: '1px solid #1e293b', color: '#64748b' }}
          />
        </div>

        {/* Botón limpiar */}
        {value && (
          <button
            onClick={() => onChange('')}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/20 transition-colors flex-shrink-0">
            <X size={14} style={{ color: '#ef4444' }} />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminConfigPage() {
  const [config, setConfig] = useState<LandingConfig>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('hero')

  useEffect(() => { loadConfig() }, [])

  const loadConfig = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('landing_config').select('*').eq('id', 'main').single()
    if (data) setConfig({ ...DEFAULTS, ...data })
    setLoading(false)
  }

  const save = async () => {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('landing_config')
      .upsert({ id: 'main', ...config, updated_at: new Date().toISOString() })
    if (error) toast.error('Error al guardar')
    else toast.success('Cambios guardados correctamente')
    setSaving(false)
  }

  const update = (key: keyof LandingConfig, val: any) =>
    setConfig(prev => ({ ...prev, [key]: val }))

  const updatePlan = (i: number, key: string, val: any) => {
    const plans = [...config.plans]
    plans[i] = { ...plans[i], [key]: val }
    update('plans', plans)
  }

  const updateFeature = (i: number, key: string, val: any) => {
    const features = [...config.features]
    features[i] = { ...features[i], [key]: val }
    update('features', features)
  }

  const updateTestimonial = (i: number, key: string, val: any) => {
    const testimonials = [...config.testimonials]
    testimonials[i] = { ...testimonials[i], [key]: val }
    update('testimonials', testimonials)
  }

  const applyPalette = (palette: typeof COLOR_PALETTES[0]) => {
    setConfig(prev => ({
      ...prev,
      color_primary: palette.primary,
      color_secondary: palette.secondary,
      color_accent: palette.accent,
      color_bg: palette.bg,
    }))
    toast.success(`Paleta "${palette.name}" aplicada`)
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'hero', label: 'Hero & Empresa', icon: Type },
    { id: 'colors', label: 'Colores', icon: Palette },
    { id: 'plans', label: 'Planes', icon: DollarSign },
    { id: 'features', label: 'Módulos', icon: Layout },
    { id: 'testimonials', label: 'Testimonios', icon: Star },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin" style={{ color: '#818cf8' }} />
    </div>
  )

  return (
    <div style={{ color: '#f1f5f9' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Editor de Landing</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Personaliza tu página de ventas en tiempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:opacity-80"
            style={{ border: '1px solid #334155', color: '#94a3b8' }}>
            <Eye size={15} /> Ver landing
          </a>
          <button onClick={save} disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-px disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-2xl" style={{ background: '#1e293b' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 justify-center"
            style={{
              background: activeTab === t.id ? 'linear-gradient(135deg, #818cf8, #6366f1)' : 'transparent',
              color: activeTab === t.id ? 'white' : '#64748b',
            }}>
            <t.icon size={14} />
            <span className="hidden md:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: Hero & Empresa ── */}
      {activeTab === 'hero' && (
        <div className="space-y-5">
          <div className="p-6 rounded-2xl" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Type size={16} style={{ color: '#818cf8' }} /> Empresa
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Nombre de la empresa" value={config.company_name}
                onChange={v => update('company_name', v)} />
              <Field label="Tagline" value={config.company_tagline}
                onChange={v => update('company_tagline', v)} />
            </div>
            {/* Logo Uploader */}
            <LogoUploader
              value={config.logo_url}
              onChange={v => update('logo_url', v)}
            />
          </div>

          <div className="p-6 rounded-2xl" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Layout size={16} style={{ color: '#818cf8' }} /> Sección Hero
            </h3>
            <div className="space-y-4">
              <Field label="Badge superior" value={config.hero_badge}
                onChange={v => update('hero_badge', v)} />
              <Field label="Título principal" value={config.hero_title}
                onChange={v => update('hero_title', v)} large />
              <Field label="Subtítulo" value={config.hero_subtitle}
                onChange={v => update('hero_subtitle', v)} large />
            </div>
          </div>

          {/* Preview */}
          <div className="p-6 rounded-2xl" style={{ background: '#0f172a', border: '1px solid #334155' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#475569' }}>Preview</p>
            <div className="text-center py-8">
              {config.logo_url && (
                <img src={config.logo_url} alt="Logo" className="h-12 mx-auto mb-4 object-contain" />
              )}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-semibold"
                style={{ background: `${config.color_primary}20`, border: `1px solid ${config.color_primary}40`, color: config.color_primary }}>
                {config.hero_badge}
              </div>
              <h2 className="text-3xl font-black mb-3 text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                {config.hero_title}
              </h2>
              <p className="text-sm max-w-lg mx-auto" style={{ color: '#94a3b8' }}>{config.hero_subtitle}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Colores ── */}
      {activeTab === 'colors' && (
        <div className="space-y-5">
          <div className="p-6 rounded-2xl" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
              <Palette size={16} style={{ color: '#818cf8' }} /> Paletas Armoniosas
            </h3>
            <p className="text-xs mb-5" style={{ color: '#64748b' }}>Selecciona una paleta diseñada para verse profesional y médica</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {COLOR_PALETTES.map(palette => {
                const isActive = config.color_primary === palette.primary
                return (
                  <button key={palette.name} onClick={() => applyPalette(palette)}
                    className="p-4 rounded-xl text-left transition-all hover:-translate-y-0.5"
                    style={{ background: isActive ? `${palette.primary}15` : '#0f172a', border: `1px solid ${isActive ? palette.primary : '#334155'}` }}>
                    <div className="flex gap-2 mb-3">
                      {palette.preview.map(c => (
                        <div key={c} className="w-7 h-7 rounded-lg" style={{ background: c }} />
                      ))}
                    </div>
                    <p className="text-xs font-bold text-white">{palette.name}</p>
                    {isActive && (
                      <div className="flex items-center gap-1 mt-1">
                        <Check size={10} style={{ color: palette.primary }} />
                        <span className="text-[10px]" style={{ color: palette.primary }}>Activa</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-6 rounded-2xl" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="font-bold text-white mb-4">Personalización Manual</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'color_primary', label: 'Color Principal' },
                { key: 'color_secondary', label: 'Color Secundario' },
                { key: 'color_accent', label: 'Color de Acento' },
                { key: 'color_bg', label: 'Fondo' },
              ].map(c => (
                <div key={c.key}>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#64748b' }}>{c.label}</label>
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#0f172a', border: '1px solid #334155' }}>
                    <input type="color" value={(config as any)[c.key]}
                      onChange={e => update(c.key as keyof LandingConfig, e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
                    <span className="text-sm font-mono text-white">{(config as any)[c.key]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl overflow-hidden relative" style={{ background: config.color_bg, border: '1px solid #334155' }}>
            <div className="absolute inset-0 opacity-20"
              style={{ background: `radial-gradient(ellipse at 50% 0%, ${config.color_primary}, transparent 70%)` }} />
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#475569' }}>Preview</p>
            <div className="relative text-center py-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3 text-xs font-bold"
                style={{ background: `${config.color_primary}25`, border: `1px solid ${config.color_primary}50`, color: config.color_primary }}>
                Badge de ejemplo
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Título de ejemplo</h3>
              <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>Así se verá tu landing con estos colores</p>
              <div className="flex items-center justify-center gap-3">
                <button className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${config.color_primary}, ${config.color_secondary})` }}>
                  Botón principal
                </button>
                <button className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ border: `1px solid ${config.color_accent}50`, color: config.color_accent }}>
                  Botón secundario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Planes ── */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          {config.plans.map((plan, i) => (
            <div key={i} className="p-6 rounded-2xl" style={{ background: '#1e293b', border: '1px solid #334155' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">{plan.name}</h3>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full" style={{ background: plan.color }} />
                  <input type="color" value={plan.color}
                    onChange={e => updatePlan(i, 'color', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Nombre del plan" value={plan.name} onChange={v => updatePlan(i, 'name', v)} />
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#64748b' }}>Precio (CLP)</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: '#0f172a', border: '1px solid #334155' }}>
                    <span className="text-sm" style={{ color: '#64748b' }}>$</span>
                    <input value={plan.price} onChange={e => updatePlan(i, 'price', e.target.value)}
                      className="flex-1 bg-transparent outline-none text-sm text-white" placeholder="29.990" />
                  </div>
                </div>
              </div>
              <Field label="Descripción" value={plan.desc} onChange={v => updatePlan(i, 'desc', v)} />
              <div className="mt-4">
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#64748b' }}>
                  Módulos incluidos (uno por línea)
                </label>
                <textarea
                  value={Array.isArray(plan.modules) ? plan.modules.join('\n') : ''}
                  onChange={e => updatePlan(i, 'modules', e.target.value.split('\n').filter(Boolean))}
                  rows={4} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: Módulos ── */}
      {activeTab === 'features' && (
        <div className="space-y-4">
          {config.features.map((f, i) => (
            <div key={i} className="p-5 rounded-2xl" style={{ background: '#1e293b', border: '1px solid #334155' }}>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <Field label="Nombre del módulo" value={f.title} onChange={v => updateFeature(i, 'title', v)} />
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#64748b' }}>Color</label>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: '#0f172a', border: '1px solid #334155' }}>
                    <input type="color" value={f.color} onChange={e => updateFeature(i, 'color', e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
                    <span className="text-sm font-mono text-white">{f.color}</span>
                  </div>
                </div>
              </div>
              <Field label="Descripción" value={f.desc} onChange={v => updateFeature(i, 'desc', v)} large />
              <div className="flex items-center gap-2 mt-3">
                <input type="checkbox" id={`premium-${i}`} checked={f.premium || false}
                  onChange={e => updateFeature(i, 'premium', e.target.checked)} className="w-4 h-4 rounded" />
                <label htmlFor={`premium-${i}`} className="text-xs font-medium" style={{ color: '#94a3b8' }}>
                  Marcar como módulo Premium
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: Testimonios ── */}
      {activeTab === 'testimonials' && (
        <div className="space-y-4">
          {config.testimonials.map((t, i) => (
            <div key={i} className="p-5 rounded-2xl" style={{ background: '#1e293b', border: '1px solid #334155' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => updateTestimonial(i, 'stars', s)}>
                      <Star size={16} fill={s <= t.stars ? '#f59e0b' : 'transparent'}
                        style={{ color: s <= t.stars ? '#f59e0b' : '#334155' }} />
                    </button>
                  ))}
                </div>
                <button onClick={() => update('testimonials', config.testimonials.filter((_, j) => j !== i))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/20 transition-colors">
                  <Trash2 size={13} style={{ color: '#ef4444' }} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <Field label="Nombre" value={t.name} onChange={v => updateTestimonial(i, 'name', v)} />
                <Field label="Especialidad" value={t.specialty} onChange={v => updateTestimonial(i, 'specialty', v)} />
              </div>
              <Field label="Testimonio" value={t.text} onChange={v => updateTestimonial(i, 'text', v)} large />
            </div>
          ))}
          <button
            onClick={() => update('testimonials', [...config.testimonials, { name: '', specialty: '', text: '', stars: 5 }])}
            className="w-full py-3 rounded-xl text-sm font-semibold border-dashed border-2 transition-all hover:opacity-80 flex items-center justify-center gap-2"
            style={{ borderColor: '#334155', color: '#64748b' }}>
            <Plus size={15} /> Agregar testimonio
          </button>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, large }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; large?: boolean
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#64748b' }}>{label}</label>
      {large ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
          style={{ background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9' }} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9' }} />
      )}
    </div>
  )
}