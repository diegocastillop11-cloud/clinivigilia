'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface LeadMagnet {
  id: string
  title: string
  description: string | null
  slug: string
  pdf_path: string | null
  is_active: boolean
  created_at: string
  capture_count?: number
}

interface Capture {
  id: string
  nombre: string
  email: string
  telefono: string
  preocupacion: string
  tiempo_problema: string
  quiere_info: boolean
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

export default function LeadMagnetsPage() {
  const supabase = createClient()
  const [leadMagnets, setLeadMagnets] = useState<LeadMagnet[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selectedForCaptures, setSelectedForCaptures] = useState<LeadMagnet | null>(null)
  const [captures, setCaptures] = useState<Capture[]>([])
  const [loadingCaptures, setLoadingCaptures] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [siteUrl, setSiteUrl] = useState('')

  const [newForm, setNewForm] = useState({ title: '', description: '', slug: '' })

  useEffect(() => {
    setSiteUrl(window.location.origin)
    loadLeadMagnets()
  }, [])

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
        return { ...lm, capture_count: count ?? 0 }
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
      })

    if (error) {
      toast.error(error.message.includes('unique') ? 'Ese slug ya está en uso, elige otro.' : 'Error al crear el lead magnet.')
      setCreating(false)
      return
    }

    toast.success('Lead magnet creado correctamente')
    setNewForm({ title: '', description: '', slug: '' })
    setShowCreate(false)
    setCreating(false)
    loadLeadMagnets()
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
    if (!confirm(`¿Eliminar "${lm.title}"?\n\nSe borrarán también todos los leads capturados.`)) return
    if (lm.pdf_path) {
      await supabase.storage.from('lead-pdfs').remove([lm.pdf_path])
    }
    const { error } = await supabase.from('lead_magnets').delete().eq('id', lm.id)
    if (!error) {
      setLeadMagnets(prev => prev.filter(m => m.id !== lm.id))
      toast.success('Eliminado correctamente')
    }
  }

  async function handlePdfUpload(lm: LeadMagnet, file: File) {
    if (file.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('El PDF no puede superar los 20 MB')
      return
    }

    setUploading(lm.id)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(null); return }

    const filePath = `${user.id}/${lm.id}.pdf`
    if (lm.pdf_path) {
      await supabase.storage.from('lead-pdfs').remove([lm.pdf_path])
    }

    const { error: uploadError } = await supabase.storage
      .from('lead-pdfs')
      .upload(filePath, file, { upsert: true, contentType: 'application/pdf' })

    if (uploadError) {
      toast.error('Error al subir el PDF: ' + uploadError.message)
      setUploading(null)
      return
    }

    const { error: updateError } = await supabase
      .from('lead_magnets')
      .update({ pdf_path: filePath })
      .eq('id', lm.id)

    if (updateError) {
      toast.error('PDF subido pero no se pudo actualizar el registro.')
    } else {
      toast.success('PDF actualizado correctamente')
      setLeadMagnets(prev => prev.map(m => m.id === lm.id ? { ...m, pdf_path: filePath } : m))
    }
    setUploading(null)
  }

  async function loadCaptures(lm: LeadMagnet) {
    setSelectedForCaptures(lm)
    setLoadingCaptures(true)
    const { data } = await supabase
      .from('lead_captures')
      .select('*')
      .eq('lead_magnet_id', lm.id)
      .order('created_at', { ascending: false })
    setCaptures(data ?? [])
    setLoadingCaptures(false)
  }

  function copyUrl(slug: string) {
    const url = `${siteUrl}/guia/${slug}`
    navigator.clipboard.writeText(url).then(() => toast.success('URL copiada al portapapeles'))
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors'
  const inputStyle = { background: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }

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
            Formularios para capturar leads y entregar guías PDF gratis
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Nuevo Lead Magnet
        </button>
      </div>

      {/* ── Modal crear ───────────────────────────────────── */}
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
                <input
                  required
                  value={newForm.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Ej: Guía de apoyo para el tratamiento capilar"
                  className={inputCls} style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Descripción (opcional)</label>
                <textarea
                  value={newForm.description}
                  onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Completa tus datos y al finalizar recibirás el enlace para descargar la guía gratuita."
                  rows={3}
                  className={inputCls + ' resize-none'}
                  style={{ ...inputStyle, fontFamily: 'inherit' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Slug / URL *</label>
                <div className="flex items-stretch rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                  <span className="px-3 py-2.5 text-xs font-medium flex items-center flex-shrink-0 select-none"
                    style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', borderRight: '1px solid var(--border-color)' }}>
                    /guia/
                  </span>
                  <input
                    required
                    value={newForm.slug}
                    onChange={e => setNewForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                    placeholder="guia-capilar"
                    className="flex-1 px-3 py-2.5 text-sm outline-none"
                    style={{ background: 'var(--bg-main)', color: 'var(--text-primary)' }}
                  />
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                  URL: {siteUrl}/guia/<strong>{newForm.slug || 'slug'}</strong>
                </p>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)', background: 'transparent' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: creating ? '#d1d5db' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {creating ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Lista vacía ───────────────────────────────────── */}
      {leadMagnets.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-16 text-center"
          style={{ borderColor: 'var(--border-color)' }}>
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Sin lead magnets aún</h3>
          <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--text-muted)' }}>
            Crea tu primer formulario para capturar leads y entregar un PDF automáticamente al finalizar.
          </p>
          <button onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
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
                  style={{ background: 'rgba(99,102,241,0.1)' }}>
                  📋
                </div>
                <div className="flex-1 min-w-0">

                  {/* Título + badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h3 className="font-semibold text-base truncate" style={{ color: 'var(--text-primary)' }}>
                      {lm.title}
                    </h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${lm.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {lm.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                    {!lm.pdf_path && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                        Sin PDF
                      </span>
                    )}
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
                    {/* Leads */}
                    <button onClick={() => loadCaptures(lm)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                      style={{ background: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      {lm.capture_count ?? 0} leads
                    </button>

                    {/* Subir PDF */}
                    <label className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                      style={{
                        background: lm.pdf_path ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: lm.pdf_path ? '#059669' : '#d97706',
                        border: `1px solid ${lm.pdf_path ? '#bbf7d0' : '#fde68a'}`,
                      }}>
                      {uploading === lm.id ? (
                        <>
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          {lm.pdf_path ? 'PDF ✓ (cambiar)' : 'Subir PDF'}
                        </>
                      )}
                      <input type="file" accept="application/pdf" className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) handlePdfUpload(lm, file)
                          e.target.value = ''
                        }}
                      />
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

      {/* ── Modal leads capturados ─────────────────────────── */}
      {selectedForCaptures && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-4xl rounded-2xl overflow-hidden mb-10"
            style={{ background: 'var(--bg-card)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Leads — {selectedForCaptures.title}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {captures.length} contacto{captures.length !== 1 ? 's' : ''} capturado{captures.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={() => { setSelectedForCaptures(null); setCaptures([]) }}
                style={{ color: 'var(--text-muted)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="overflow-x-auto">
              {loadingCaptures ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : captures.length === 0 ? (
                <div className="py-14 text-center">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Todavía no hay leads</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Comparte la URL del formulario para empezar a capturar</p>
                </div>
              ) : (
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                      {['Nombre', 'Email', 'Teléfono', 'Preocupación', 'Tiempo', '¿Info?', 'Fecha'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                          style={{ color: 'var(--text-muted)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {captures.map((c, i) => (
                      <tr key={c.id} style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: i % 2 === 0 ? 'transparent' : 'var(--bg-main)',
                      }}>
                        <td className="px-4 py-2.5 font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{c.nombre}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{c.email}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{c.telefono}</td>
                        <td className="px-4 py-2.5 max-w-[180px] truncate" style={{ color: 'var(--text-muted)' }} title={c.preocupacion}>{c.preocupacion}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{c.tiempo_problema}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.quiere_info ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {c.quiere_info ? 'Sí' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs" style={{ color: 'var(--text-muted)' }}>
                          {new Date(c.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
