'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Question } from '@/app/guia/[slug]/LeadMagnetForm'

interface LeadMagnet {
  id: string
  title: string
  description: string | null
  slug: string
  pdf_path: string | null
  is_active: boolean
  created_at: string
  questions: Question[]
  capture_count?: number
}

interface Capture {
  id: string
  nombre: string
  email: string
  telefono: string
  answers: Record<string, string>
  created_at: string
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function newQuestion(): Question {
  return { id: `q_${Date.now()}`, label: '', type: 'radio', options: ['', ''], required: true }
}

// ── Editor de preguntas ────────────────────────────────────
function QuestionEditor({
  questions, onChange,
}: { questions: Question[]; onChange: (q: Question[]) => void }) {

  function updateQ(id: string, patch: Partial<Question>) {
    onChange(questions.map(q => q.id === id ? { ...q, ...patch } : q))
  }
  function removeQ(id: string) { onChange(questions.filter(q => q.id !== id)) }
  function moveQ(idx: number, dir: -1 | 1) {
    const arr = [...questions]
    const target = idx + dir
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]]
    onChange(arr)
  }
  function addOption(qId: string) {
    onChange(questions.map(q => q.id === qId ? { ...q, options: [...q.options, ''] } : q))
  }
  function updateOption(qId: string, i: number, val: string) {
    onChange(questions.map(q => {
      if (q.id !== qId) return q
      const options = [...q.options]; options[i] = val; return { ...q, options }
    }))
  }
  function removeOption(qId: string, i: number) {
    onChange(questions.map(q => {
      if (q.id !== qId) return q
      return { ...q, options: q.options.filter((_, idx) => idx !== i) }
    }))
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border text-sm outline-none'
  const inputSt = { background: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <div key={q.id} className="rounded-xl border p-4 space-y-3"
          style={{ background: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>

          {/* Header pregunta */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {qi + 1}
            </span>
            <input
              value={q.label}
              onChange={e => updateQ(q.id, { label: e.target.value })}
              placeholder={`Texto de la pregunta ${qi + 1}`}
              className={inputCls + ' flex-1'}
              style={inputSt}
            />
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => moveQ(qi, -1)} disabled={qi === 0}
                className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                ↑
              </button>
              <button onClick={() => moveQ(qi, 1)} disabled={qi === questions.length - 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                ↓
              </button>
              <button onClick={() => removeQ(q.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626' }}>
                ✕
              </button>
            </div>
          </div>

          {/* Tipo de pregunta */}
          <div className="flex gap-4">
            {(['radio', 'text'] as const).map(tipo => (
              <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${q.type === tipo ? '#6366f1' : '#d1d5db'}`,
                  background: q.type === tipo ? '#6366f1' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {q.type === tipo && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <input type="radio" name={`type-${q.id}`} checked={q.type === tipo}
                  onChange={() => updateQ(q.id, { type: tipo, options: tipo === 'radio' && !q.options.length ? ['', ''] : q.options })}
                  className="hidden" />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {tipo === 'radio' ? 'Opción múltiple' : 'Respuesta libre'}
                </span>
              </label>
            ))}
          </div>

          {/* Opciones (solo radio) */}
          {q.type === 'radio' && (
            <div className="space-y-2 pl-2">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Opciones</p>
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #d1d5db', flexShrink: 0 }} />
                  <input
                    value={opt}
                    onChange={e => updateOption(q.id, oi, e.target.value)}
                    placeholder={`Opción ${oi + 1}`}
                    className={inputCls + ' flex-1'}
                    style={inputSt}
                  />
                  {q.options.length > 2 && (
                    <button onClick={() => removeOption(q.id, oi)}
                      className="text-xs w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ color: '#dc2626', background: 'rgba(239,68,68,0.08)' }}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addOption(q.id)}
                className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{ color: '#6366f1', background: 'rgba(99,102,241,0.08)' }}>
                + Agregar opción
              </button>
            </div>
          )}

          {/* Obligatoria toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div onClick={() => updateQ(q.id, { required: !q.required })} style={{
              width: 32, height: 18, borderRadius: 9, flexShrink: 0, cursor: 'pointer',
              background: q.required ? '#6366f1' : '#d1d5db', transition: 'background 0.2s', position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: 2, left: q.required ? 14 : 2, width: 14, height: 14,
                borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Obligatoria</span>
          </label>
        </div>
      ))}

      <button
        onClick={() => onChange([...questions, newQuestion()])}
        className="w-full py-2.5 rounded-xl border-2 border-dashed text-sm font-semibold flex items-center justify-center gap-2"
        style={{ borderColor: '#6366f1', color: '#6366f1', background: 'rgba(99,102,241,0.04)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Agregar pregunta
      </button>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────
export default function LeadMagnetsPage() {
  const supabase = createClient()
  const [leadMagnets, setLeadMagnets] = useState<LeadMagnet[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingLeadMagnet, setEditingLeadMagnet] = useState<LeadMagnet | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftQuestions, setDraftQuestions] = useState<Question[]>([])
  const [savingQuestions, setSavingQuestions] = useState(false)
  const [selectedForCaptures, setSelectedForCaptures] = useState<LeadMagnet | null>(null)
  const [captures, setCaptures] = useState<Capture[]>([])
  const [loadingCaptures, setLoadingCaptures] = useState(false)
  const [expandedCapture, setExpandedCapture] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [siteUrl, setSiteUrl] = useState('')
  const [newForm, setNewForm] = useState({ title: '', description: '', slug: '' })
  const [showPromotion, setShowPromotion] = useState(false)
  const [promotionForm, setPromotionForm] = useState({ servicio_id: '', descuento: '', descripcion: '' })
  const [sendingPromotion, setSendingPromotion] = useState(false)
  const [webServices, setWebServices] = useState<Array<{id: string; name: string}>>([])
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [loadingServices, setLoadingServices] = useState(false)

  useEffect(() => {
    setSiteUrl(window.location.origin)
    loadLeadMagnets()
    loadWebServices()
  }, [])

  async function loadWebServices() {
    setLoadingServices(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingServices(false); return }
    const { data } = await supabase
      .from('web_services')
      .select('id, name')
      .eq('doctor_id', user.id)
      .eq('active', true)
      .order('name')
    setWebServices(data ?? [])
    setLoadingServices(false)
  }

  async function loadLeadMagnets() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('lead_magnets')
      .select('*')
      .eq('doctor_id', user.id)
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      const withCounts = await Promise.all(data.map(async (lm: LeadMagnet) => {
        const { count } = await supabase
          .from('lead_captures')
          .select('id', { count: 'exact', head: true })
          .eq('lead_magnet_id', lm.id)
        return { ...lm, questions: lm.questions ?? [], capture_count: count ?? 0 }
      }))
      setLeadMagnets(withCounts)
    } else {
      setLeadMagnets(data ?? [])
    }
    setLoading(false)
  }

  function handleTitleChange(title: string) {
    setNewForm(f => ({ ...f, title, slug: slugify(title) }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newForm.title || !newForm.slug) return
    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCreating(false); return }

    const { error } = await supabase
      .from('lead_magnets')
      .insert({
        doctor_id: user.id,
        title: newForm.title.trim(),
        description: newForm.description.trim() || null,
        slug: newForm.slug.trim(),
        questions: [],
      })

    if (error) {
      toast.error(error.message.includes('unique') ? 'Ese slug ya está en uso.' : 'Error al crear.')
      setCreating(false); return
    }
    toast.success('Lead magnet creado')
    setNewForm({ title: '', description: '', slug: '' })
    setShowCreate(false)
    setCreating(false)
    loadLeadMagnets()
  }

  function openQuestionEditor(lm: LeadMagnet) {
    setEditingLeadMagnet(lm)
    setDraftTitle(lm.title)
    setDraftDescription(lm.description ?? '')
    setDraftQuestions(lm.questions ?? [])
  }

  async function saveQuestions() {
    if (!editingLeadMagnet) return
    if (!draftTitle.trim()) { toast.error('El título no puede quedar vacío.'); return }
    for (const q of draftQuestions) {
      if (!q.label.trim()) { toast.error('Hay preguntas sin texto.'); return }
      if (q.type === 'radio' && q.options.filter(o => o.trim()).length < 2) {
        toast.error(`La pregunta "${q.label || '?'}" necesita al menos 2 opciones.`); return
      }
    }
    setSavingQuestions(true)
    const { error } = await supabase
      .from('lead_magnets')
      .update({ title: draftTitle.trim(), description: draftDescription.trim() || null, questions: draftQuestions })
      .eq('id', editingLeadMagnet.id)

    if (!error) {
      toast.success('Lead magnet actualizado')
      setLeadMagnets(prev => prev.map(m => m.id === editingLeadMagnet.id ? {
        ...m,
        title: draftTitle.trim(),
        description: draftDescription.trim() || null,
        questions: draftQuestions,
      } : m))
      setEditingLeadMagnet(null)
    } else {
      toast.error('Error al guardar cambios')
    }
    setSavingQuestions(false)
  }

  async function handleToggle(lm: LeadMagnet) {
    const { error } = await supabase
      .from('lead_magnets')
      .update({ is_active: !lm.is_active })
      .eq('id', lm.id)
    if (!error) {
      setLeadMagnets(prev => prev.map(m => m.id === lm.id ? { ...m, is_active: !m.is_active } : m))
      toast.success(lm.is_active ? 'Formulario desactivado' : 'Formulario activado')
    }
  }

  async function handleDelete(lm: LeadMagnet) {
    if (!confirm(`¿Eliminar "${lm.title}"?\n\nSe borrarán todos los leads capturados.`)) return
    if (lm.pdf_path) await supabase.storage.from('lead-pdfs').remove([lm.pdf_path])
    const { error } = await supabase.from('lead_magnets').delete().eq('id', lm.id)
    if (!error) { setLeadMagnets(prev => prev.filter(m => m.id !== lm.id)); toast.success('Eliminado') }
  }

  async function handlePdfUpload(lm: LeadMagnet, file: File) {
    if (file.type !== 'application/pdf') { toast.error('Solo archivos PDF'); return }
    if (file.size > 20 * 1024 * 1024) { toast.error('Máximo 20 MB'); return }
    setUploading(lm.id)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(null); return }
    const filePath = `${user.id}/${lm.id}.pdf`
    if (lm.pdf_path) await supabase.storage.from('lead-pdfs').remove([lm.pdf_path])
    const { error: uploadError } = await supabase.storage
      .from('lead-pdfs')
      .upload(filePath, file, { upsert: true, contentType: 'application/pdf' })
    if (uploadError) { toast.error('Error al subir: ' + uploadError.message); setUploading(null); return }
    const { error: updateError } = await supabase
      .from('lead_magnets').update({ pdf_path: filePath }).eq('id', lm.id)
    if (!updateError) {
      toast.success('PDF subido correctamente')
      setLeadMagnets(prev => prev.map(m => m.id === lm.id ? { ...m, pdf_path: filePath } : m))
    }
    setUploading(null)
  }

  async function loadCaptures(lm: LeadMagnet) {
    setSelectedForCaptures(lm)
    setExpandedCapture(null)
    setLoadingCaptures(true)
    const { data } = await supabase
      .from('lead_captures')
      .select('*')
      .eq('lead_magnet_id', lm.id)
      .order('created_at', { ascending: false })
    setCaptures(data ?? [])
    setSelectedContacts(new Set((data ?? []).map(c => c.id)))
    setLoadingCaptures(false)
  }

  function toggleContact(id: string) {
    setSelectedContacts(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAllContacts() {
    setSelectedContacts(prev =>
      prev.size === captures.length ? new Set() : new Set(captures.map(c => c.id))
    )
  }

  function downloadCsv() {
    if (!selectedForCaptures) return
    const questions = selectedForCaptures.questions ?? []
    const headers = ['Nombre', 'Email', 'Teléfono', 'Fecha', ...questions.map(q => q.label)]
    const rows = [
      headers,
      ...captures.map(capture => [
        capture.nombre,
        capture.email,
        capture.telefono,
        new Date(capture.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }),
        ...questions.map(q => capture.answers?.[q.id] ?? ''),
      ]),
    ]

    const csv = rows
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedForCaptures.slug || 'reporte-leads'}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async function sendPromotion() {
    const service = webServices.find(s => s.id === promotionForm.servicio_id)
    const recipients = captures.filter(c => selectedContacts.has(c.id))

    if (!selectedForCaptures || !service || !promotionForm.descuento.trim()) {
      toast.error('Selecciona un servicio y completa el porcentaje de descuento')
      return
    }
    if (recipients.length === 0) {
      toast.error('Selecciona al menos un contacto')
      return
    }

    setSendingPromotion(true)
    try {
      const res = await fetch('/api/lead-magnets/send-promotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_magnet_id: selectedForCaptures.id,
          nombre_promocion: service.name,
          descuento: promotionForm.descuento.trim(),
          descripcion: promotionForm.descripcion.trim(),
          emails: recipients.map(c => ({ email: c.email, nombre: c.nombre })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Error al enviar'); return }
      toast.success(`Promoción enviada a ${data.sent ?? recipients.length} contactos`)
      setPromotionForm({ servicio_id: '', descuento: '', descripcion: '' })
      setShowPromotion(false)
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSendingPromotion(false)
    }
  }

  function copyUrl(slug: string) {
    navigator.clipboard.writeText(`${siteUrl}/guia/${slug}`)
      .then(() => toast.success('URL copiada'))
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border text-sm outline-none'
  const inputSt = { background: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Lead Magnets</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Formularios con preguntas personalizadas para capturar leads y entregar PDFs gratis
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Nuevo Lead Magnet
        </button>
      </div>

      {/* ── Modal crear ─────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6"
            style={{ background: 'var(--bg-card)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Nuevo Lead Magnet</h2>
              <button onClick={() => setShowCreate(false)} style={{ color: 'var(--text-muted)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Título *</label>
                <input required value={newForm.title} onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Ej: Guía de apoyo para el tratamiento capilar"
                  className={inputCls} style={inputSt} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Descripción (opcional)</label>
                <textarea value={newForm.description} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Completa tus datos y recibirás el enlace para descargar la guía gratuita."
                  rows={3} className={inputCls + ' resize-none'}
                  style={{ ...inputSt, fontFamily: 'inherit' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Slug / URL *</label>
                <div className="flex items-stretch rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                  <span className="px-3 py-2.5 text-xs font-medium flex items-center flex-shrink-0 select-none"
                    style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', borderRight: '1px solid var(--border-color)' }}>
                    /guia/
                  </span>
                  <input required value={newForm.slug} onChange={e => setNewForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                    placeholder="guia-capilar" className="flex-1 px-3 py-2.5 text-sm outline-none"
                    style={{ background: 'var(--bg-main)', color: 'var(--text-primary)' }} />
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                  URL: {siteUrl}/guia/<strong>{newForm.slug || 'slug'}</strong>
                </p>
              </div>
              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.06)', color: '#6366f1' }}>
                💡 Podrás agregar las preguntas del formulario después de crear.
              </p>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)', background: 'transparent' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: creating ? '#d1d5db' : 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {creating ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal editor de preguntas ────────────────────────── */}
      {editingLeadMagnet && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-2xl rounded-2xl overflow-hidden mb-10"
            style={{ background: 'var(--bg-card)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Editar formulario
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Cabecera, descripción y preguntas</p>
              </div>
              <button onClick={() => setEditingLeadMagnet(null)} style={{ color: 'var(--text-muted)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Nota sobre campos fijos */}
            <div className="px-5 pt-4 pb-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Título *</label>
                <input value={draftTitle} onChange={e => setDraftTitle(e.target.value)}
                  className={inputCls} style={inputSt} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Descripción</label>
                <textarea value={draftDescription} onChange={e => setDraftDescription(e.target.value)}
                  rows={3} className={inputCls + ' resize-none'} style={{ ...inputSt, fontFamily: 'inherit' }} />
              </div>
              <div className="mx-5 mt-1 px-4 py-2.5 rounded-xl text-xs"
                style={{ background: 'rgba(99,102,241,0.06)', color: '#6366f1' }}>
                Los campos <strong>Nombre, Email y Teléfono</strong> se incluyen siempre de forma automática. Aquí agregas tus preguntas adicionales.
              </div>
            </div>

            {/* Editor */}
            <div className="p-5 pt-0">
              <QuestionEditor questions={draftQuestions} onChange={setDraftQuestions} />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-5 pb-5">
              <button onClick={() => setEditingLeadMagnet(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)', background: 'transparent' }}>
                Cancelar
              </button>
              <button onClick={saveQuestions} disabled={savingQuestions}
                className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
                style={{ background: savingQuestions ? '#d1d5db' : 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {savingQuestions ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Guardar preguntas</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lista vacía ──────────────────────────────────────── */}
      {leadMagnets.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-16 text-center"
          style={{ borderColor: 'var(--border-color)' }}>
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Sin lead magnets aún</h3>
          <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--text-muted)' }}>
            Crea tu primer formulario con preguntas personalizadas para capturar leads y entregar un PDF.
          </p>
          <button onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            Crear primer Lead Magnet
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {leadMagnets.map(lm => (
            <div key={lm.id} className="rounded-2xl border p-5"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-xl"
                  style={{ background: 'rgba(99,102,241,0.1)' }}>📋</div>
                <div className="flex-1 min-w-0">

                  {/* Título + badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h3 className="font-semibold text-base truncate" style={{ color: 'var(--text-primary)' }}>{lm.title}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${lm.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {lm.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                    {!lm.pdf_path && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">Sin PDF</span>}
                    <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                      {lm.questions?.length ?? 0} pregunta{(lm.questions?.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {lm.description && (
                    <p className="text-sm truncate mb-2" style={{ color: 'var(--text-muted)' }}>{lm.description}</p>
                  )}

                  {/* URL */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <code className="text-xs px-2 py-1 rounded-lg font-mono" style={{ background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
                      /guia/{lm.slug}
                    </code>
                    <button onClick={() => copyUrl(lm.slug)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg"
                      style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      Copiar URL
                    </button>
                    <a href={`/guia/${lm.slug}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg"
                      style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      Ver
                    </a>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Editar encabezado */}
                    <button onClick={() => openQuestionEditor(lm)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Editar encabezado
                    </button>

                    {/* Ver reporte */}
                    <button onClick={() => loadCaptures(lm)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                      style={{ background: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      Ver reporte ({lm.capture_count ?? 0})
                    </button>

                    {/* Subir PDF */}
                    <label className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                      style={{
                        background: lm.pdf_path ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: lm.pdf_path ? '#059669' : '#d97706',
                        border: `1px solid ${lm.pdf_path ? '#bbf7d0' : '#fde68a'}`,
                      }}>
                      {uploading === lm.id ? (
                        <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Subiendo...</>
                      ) : (
                        <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          {lm.pdf_path ? 'PDF ✓ (cambiar)' : 'Subir PDF'}</>
                      )}
                      <input type="file" accept="application/pdf" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfUpload(lm, f); e.target.value = '' }} />
                    </label>

                    {/* Activar/desactivar */}
                    <button onClick={() => handleToggle(lm)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                      style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                      {lm.is_active ? 'Desactivar' : 'Activar'}
                    </button>

                    {/* Eliminar */}
                    <button onClick={() => handleDelete(lm)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal leads capturados ───────────────────────────── */}
      {selectedForCaptures && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-3xl rounded-2xl overflow-hidden mb-10"
            style={{ background: 'var(--bg-card)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Reporte de leads — {selectedForCaptures.title}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {captures.length} contacto{captures.length !== 1 ? 's' : ''} capturado{captures.length !== 1 ? 's' : ''}
                  {captures.length > 0 && ` · ${selectedContacts.size} seleccionado${selectedContacts.size !== 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowPromotion(true)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                  style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66v1.68c0 .55.35 1.08.89 1.32l1.96 1.02c.54.28 1.2.28 1.74 0l1.96-1.02c.54-.24.89-.77.89-1.32v-1.68"/><path d="M6 9h12v5H6z"/></svg>
                  Enviar promoción
                </button>
                <button onClick={downloadCsv}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
                  Descargar CSV
                </button>
                <button onClick={() => { setSelectedForCaptures(null); setCaptures([]); setExpandedCapture(null) }}
                  style={{ color: 'var(--text-muted)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            {loadingCaptures ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : captures.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Todavía no hay leads</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Comparte la URL del formulario para empezar</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2 px-5 py-2.5" style={{ background: 'var(--bg-main)' }}>
                  <input type="checkbox" className="w-3.5 h-3.5 flex-shrink-0"
                    checked={captures.length > 0 && selectedContacts.size === captures.length}
                    onChange={toggleAllContacts} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Seleccionar todos</span>
                </div>
                {captures.map(c => (
                  <div key={c.id}>
                    {/* Fila principal */}
                    <div
                      onClick={() => setExpandedCapture(expandedCapture === c.id ? null : c.id)}
                      className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:opacity-80 transition-opacity cursor-pointer">
                      <input type="checkbox" className="w-3.5 h-3.5 flex-shrink-0"
                        checked={selectedContacts.has(c.id)}
                        onClick={e => e.stopPropagation()}
                        onChange={() => toggleContact(c.id)} />
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                        {c.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{c.nombre}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{c.email} · {c.telefono}</p>
                      </div>
                      <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                        {new Date(c.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                        style={{ color: 'var(--text-muted)', transform: expandedCapture === c.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>

                    {/* Respuestas expandidas */}
                    {expandedCapture === c.id && (
                      <div className="px-5 pb-4 space-y-3" style={{ background: 'var(--bg-main)' }}>
                        {selectedForCaptures.questions?.length > 0 ? (
                          selectedForCaptures.questions.map(q => (
                            <div key={q.id}>
                              <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-muted)' }}>{q.label}</p>
                              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                {c.answers?.[q.id] || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin respuesta</span>}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Este formulario no tenía preguntas adicionales.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal enviar promoción ───────────────────────────── */}
      {showPromotion && selectedForCaptures && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6"
            style={{ background: 'var(--bg-card)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Enviar promoción</h2>
              <button onClick={() => setShowPromotion(false)} style={{ color: 'var(--text-muted)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Servicio *</label>
                {loadingServices ? (
                  <div className="text-sm px-1 py-2" style={{ color: 'var(--text-muted)' }}>Cargando servicios...</div>
                ) : webServices.length === 0 ? (
                  <p className="text-xs px-3 py-2.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', color: '#d97706' }}>
                    No tienes servicios activos configurados. Ve a Gestor Web → Servicios para crear uno.
                  </p>
                ) : (
                  <select value={promotionForm.servicio_id} onChange={e => setPromotionForm(f => ({ ...f, servicio_id: e.target.value }))}
                    className={inputCls} style={inputSt}>
                    <option value="">Selecciona un servicio</option>
                    {webServices.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Porcentaje de descuento (%) *</label>
                <input value={promotionForm.descuento} onChange={e => setPromotionForm(f => ({ ...f, descuento: e.target.value }))}
                  type="number" min="0" max="100" placeholder="Ej: 20"
                  className={inputCls} style={inputSt} />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Descripción (opcional)</label>
                <textarea value={promotionForm.descripcion} onChange={e => setPromotionForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Detalle adicional de la promoción, condiciones, vigencia, etc."
                  rows={3} className={inputCls + ' resize-none'} style={{ ...inputSt, fontFamily: 'inherit' }} />
              </div>

              <div className="px-3 py-2.5 rounded-lg text-xs"
                style={{ background: 'rgba(34,197,94,0.06)', color: '#16a34a' }}>
                📧 Se enviará a <strong>{selectedContacts.size}</strong> contacto{selectedContacts.size !== 1 ? 's' : ''} seleccionado{selectedContacts.size !== 1 ? 's' : ''}.
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowPromotion(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)', background: 'transparent' }}>
                  Cancelar
                </button>
                <button onClick={sendPromotion} disabled={sendingPromotion || selectedContacts.size === 0}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                  style={{ background: sendingPromotion ? '#d1d5db' : 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                  {sendingPromotion ? 'Enviando...' : `Enviar a ${selectedContacts.size}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
