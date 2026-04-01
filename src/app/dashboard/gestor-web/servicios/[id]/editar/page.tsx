'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

// ─── Tipos locales ────────────────────────────────────────
interface FaqItem { q: string; a: string }

// ─── Iconos ───────────────────────────────────────────────
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
)
const IconSparkle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
)
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
)
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
)
const IconBot = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/><path d="M7 15h.01M17 15h.01"/></svg>
)
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
)
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
)

// ─── Emojis ───────────────────────────────────────────────
const ICON_OPTIONS = ['🩺','💊','🏥','💉','🫀','🦷','👁️','🧠','🦴','🧬','🩻','🩹','🔬','💪','🌿','🧘']

// ─── Pasos ────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Información básica' },
  { id: 2, label: 'Detalles y precio' },
  { id: 3, label: 'Entrenamiento IA' },
]

// ─── Componentes base ─────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
      {...props}
    />
  )
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all resize-none"
      {...props}
    />
  )
}

// ─── Página principal ─────────────────────────────────────
export default function EditarServicioPage() {
  const router = useRouter()
  const params = useParams()
  const serviceId = params.id as string
  const supabase = createClient()

  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [enriched, setEnriched]   = useState('')
  const [keywordInput, setKeywordInput] = useState('')

  const [form, setForm] = useState({
    name:          '',
    icon:          '🩺',
    short_desc:    '',
    long_desc:     '',
    price_from:    '',
    price_currency:'CLP',
    price_label:   '',
    duration_min:  '30',
    is_bookable:   true,
    ia_context:    '',
    ia_keywords:   [] as string[],
    active:        true,
  })
  const [faqs, setFaqs] = useState<FaqItem[]>([{ q: '', a: '' }])

  // ─── Cargar servicio existente ───────────────────────
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('web_services')
        .select('*')
        .eq('id', serviceId)
        .single()

      if (!data) { router.push('/dashboard/gestor-web'); return }

      setForm({
        name:           data.name || '',
        icon:           data.icon || '🩺',
        short_desc:     data.short_desc || '',
        long_desc:      data.long_desc || '',
        price_from:     data.price_from?.toString() || '',
        price_currency: data.price_currency || 'CLP',
        price_label:    data.price_label || '',
        duration_min:   data.duration_min?.toString() || '30',
        is_bookable:    data.is_bookable ?? true,
        ia_context:     data.ia_context || '',
        ia_keywords:    data.ia_keywords || [],
        active:         data.active ?? true,
      })

      if (data.ia_faq?.length > 0) {
        setFaqs(data.ia_faq)
      }

      if (data.ia_enriched) {
        setEnriched(data.ia_enriched)
      }

      setLoading(false)
    }
    load()
  }, [serviceId])

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  // ─── Keywords ────────────────────────────────────────
  function addKeyword() {
    if (!keywordInput.trim()) return
    set('ia_keywords', [...form.ia_keywords, keywordInput.trim()])
    setKeywordInput('')
  }
  function removeKeyword(i: number) {
    set('ia_keywords', form.ia_keywords.filter((_, idx) => idx !== i))
  }

  // ─── FAQs ────────────────────────────────────────────
  function addFaq() { setFaqs(p => [...p, { q: '', a: '' }]) }
  function removeFaq(i: number) { setFaqs(p => p.filter((_, idx) => idx !== i)) }
  function setFaq(i: number, field: 'q' | 'a', val: string) {
    setFaqs(p => p.map((f, idx) => idx === i ? { ...f, [field]: val } : f))
  }

  // ─── Enriquecer con IA ────────────────────────────────
  async function enrichWithIA() {
    if (!form.ia_context.trim()) return
    setEnriching(true)
    try {
      const res = await fetch('/api/gestor-web/enrich-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_name: form.name,
          ia_context:   form.ia_context,
          ia_keywords:  form.ia_keywords,
        }),
      })
      const data = await res.json()
      setEnriched(data.enriched || '')
    } catch {
      setEnriched('Error al conectar con la IA. Inténtalo nuevamente.')
    }
    setEnriching(false)
  }

  // ─── Guardar cambios ──────────────────────────────────
  async function handleSave() {
    if (!form.name.trim()) { setStep(1); return }
    setSaving(true)

    const { error } = await supabase
      .from('web_services')
      .update({
        name:           form.name,
        icon:           form.icon,
        short_desc:     form.short_desc || null,
        long_desc:      form.long_desc  || null,
        price_from:     form.price_from ? parseFloat(form.price_from) : null,
        price_currency: form.price_currency,
        price_label:    form.price_label || null,
        duration_min:   parseInt(form.duration_min),
        is_bookable:    form.is_bookable,
        ia_context:     form.ia_context  || null,
        ia_keywords:    form.ia_keywords,
        ia_faq:         faqs.filter(f => f.q.trim()),
        ia_enriched:    enriched || null,
        ia_enriched_at: enriched ? new Date().toISOString() : null,
        active:         form.active,
      })
      .eq('id', serviceId)

    setSaving(false)

    if (!error) {
      toast.success('Servicio actualizado correctamente')
      router.push('/dashboard/gestor-web')
    } else {
      toast.error('Error al guardar. Intenta de nuevo.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"/>
          <p className="text-sm text-gray-400">Cargando servicio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/gestor-web')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors"
        >
          <IconArrowLeft /> Volver al gestor web
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{form.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar servicio</h1>
            <p className="text-sm text-gray-500 mt-0.5">{form.name}</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => s.id < step ? setStep(s.id) : undefined}
              className="flex items-center gap-2 group"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                step > s.id
                  ? 'bg-emerald-500 text-white'
                  : step === s.id
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {step > s.id ? <IconCheck /> : s.id}
              </div>
              <span className={`text-xs font-medium hidden sm:block transition-colors ${
                step === s.id ? 'text-violet-600' : step > s.id ? 'text-emerald-600' : 'text-gray-400'
              }`}>{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full transition-colors ${step > s.id ? 'bg-emerald-300' : 'bg-gray-100'}`}/>
            )}
          </div>
        ))}
      </div>

      {/* ─── PASO 1 ─── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

            <Field label="Ícono del servicio">
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map(em => (
                  <button key={em} onClick={() => set('icon', em)}
                    className={`w-10 h-10 text-xl rounded-xl flex items-center justify-center transition-all ${
                      form.icon === em ? 'bg-violet-100 ring-2 ring-violet-500 scale-110' : 'bg-gray-50 hover:bg-gray-100'
                    }`}>
                    {em}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Nombre del servicio *">
              <Input placeholder="Ej: Consulta médica general" value={form.name} onChange={e => set('name', e.target.value)} autoFocus/>
            </Field>

            <Field label="Descripción corta" hint="Aparece en la card del servicio (máx. 120 caracteres)">
              <Input placeholder="Ej: Evaluación completa de tu estado de salud" value={form.short_desc} onChange={e => set('short_desc', e.target.value)} maxLength={120}/>
            </Field>

            <Field label="Descripción completa">
              <Textarea placeholder="Describe en detalle qué incluye este servicio..." value={form.long_desc} onChange={e => set('long_desc', e.target.value)} rows={4}/>
            </Field>

            {/* Toggle activo */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-gray-700">Servicio activo</p>
                <p className="text-xs text-gray-400">Visible en tu landing pública</p>
              </div>
              <button onClick={() => set('active', !form.active)}
                className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.active ? 'bg-violet-500' : 'bg-gray-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${form.active ? 'left-5' : 'left-0.5'}`}/>
              </button>
            </div>
          </div>

          <button onClick={() => form.name.trim() && setStep(2)} disabled={!form.name.trim()}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold py-3 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-violet-200">
            Continuar <IconChevronRight />
          </button>
        </div>
      )}

      {/* ─── PASO 2 ─── */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

            <div className="grid grid-cols-2 gap-4">
              <Field label="Precio (desde)">
                <Input type="number" placeholder="25000" value={form.price_from} onChange={e => set('price_from', e.target.value)}/>
              </Field>
              <Field label="Moneda">
                <select value={form.price_currency} onChange={e => set('price_currency', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400">
                  <option value="CLP">CLP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </Field>
            </div>

            <Field label="Etiqueta de precio personalizada" hint='Ej: "Desde $25.000", "Consulta gratuita"'>
              <Input placeholder="Ej: Desde $25.000" value={form.price_label} onChange={e => set('price_label', e.target.value)}/>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Duración (minutos)">
                <select value={form.duration_min} onChange={e => set('duration_min', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400">
                  {[15,20,30,45,60,90,120].map(d => <option key={d} value={d}>{d} min</option>)}
                </select>
              </Field>
              <Field label="¿Es agendable online?">
                <button onClick={() => set('is_bookable', !form.is_bookable)} className="flex items-center gap-3 mt-1">
                  <div className={`w-12 h-6 rounded-full transition-colors relative ${form.is_bookable ? 'bg-violet-500' : 'bg-gray-200'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${form.is_bookable ? 'left-6' : 'left-0.5'}`}/>
                  </div>
                  <span className="text-sm text-gray-700">{form.is_bookable ? 'Sí' : 'No'}</span>
                </button>
              </Field>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Atrás
            </button>
            <button onClick={() => setStep(3)} className="flex-[2] flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold py-3 rounded-xl hover:bg-violet-700 transition-colors shadow-md shadow-violet-200">
              Entrenamiento IA <IconChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* ─── PASO 3 ─── */}
      {step === 3 && (
        <div className="space-y-6">

          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-5 flex gap-3">
            <div className="text-violet-500 flex-shrink-0 mt-0.5"><IconBot /></div>
            <div>
              <p className="font-semibold text-violet-900 text-sm">Entrenamiento IA</p>
              <p className="text-xs text-violet-700 mt-1 leading-relaxed">
                Actualiza el contexto que la IA usará para explicar este servicio a tus pacientes.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

            <Field label="Contexto para la IA" hint="La IA aprenderá de esto para explicarle el servicio a tus pacientes.">
              <Textarea
                placeholder="Describe el servicio para que la IA pueda explicárselo a tus pacientes..."
                value={form.ia_context}
                onChange={e => set('ia_context', e.target.value)}
                rows={7}
              />
            </Field>

            <Field label="Palabras clave / síntomas asociados" hint="Escribe una y presiona Enter.">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Ej: dolor de cabeza, fiebre..." value={keywordInput}
                    onChange={e => setKeywordInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addKeyword() } }}
                  />
                  <button onClick={addKeyword} className="flex-shrink-0 px-3 py-2 bg-violet-100 text-violet-600 rounded-xl hover:bg-violet-200 transition-colors">
                    <IconPlus />
                  </button>
                </div>
                {form.ia_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.ia_keywords.map((kw, i) => (
                      <span key={i} className="flex items-center gap-1 bg-violet-50 text-violet-700 text-xs font-medium px-2.5 py-1 rounded-full">
                        {kw}
                        <button onClick={() => removeKeyword(i)} className="text-violet-400 hover:text-violet-700 ml-0.5">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Field>

            {/* FAQs */}
            <Field label="Preguntas frecuentes">
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <Input placeholder="Pregunta del paciente..." value={faq.q} onChange={e => setFaq(i, 'q', e.target.value)}/>
                    <div className="flex gap-2">
                      <Textarea placeholder="Respuesta..." value={faq.a} onChange={e => setFaq(i, 'a', e.target.value)} rows={2}
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none"/>
                      {faqs.length > 1 && (
                        <button onClick={() => removeFaq(i)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-1">
                          <IconTrash />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button onClick={addFaq} className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-medium">
                  <IconPlus /> Agregar otra pregunta
                </button>
              </div>
            </Field>

            {/* Enriquecer con IA */}
            <div className="border-t border-gray-100 pt-4">
              <button onClick={enrichWithIA} disabled={enriching || !form.ia_context.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-violet-200">
                {enriching ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/> Buscando información relevante...</>
                ) : (
                  <><IconSparkle /> Re-enriquecer con IA + búsqueda web</>
                )}
              </button>

              {enriched && (
                <div className="mt-3 bg-violet-50 border border-violet-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-violet-700 mb-2 flex items-center gap-1.5">
                    <IconSparkle /> Contexto enriquecido por IA
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{enriched}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Atrás
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-[2] flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-40 shadow-md shadow-emerald-200">
              {saving ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/> Guardando...</>
              ) : (
                <><IconCheck /> Guardar cambios</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
