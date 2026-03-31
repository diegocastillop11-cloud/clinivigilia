'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Loader2, Save, Pencil, X, Check, Search } from 'lucide-react'
import toast from 'react-hot-toast'

interface Specialty {
  id: string
  name: string
  slug: string
  icon: string
  active: boolean
  created_at: string
}

const EMOJI_OPTIONS = ['🩺','❤️','🧠','🔬','👶','🦴','⚗️','🌸','🩹','🧩','🫀','🫁','👁️','🦷','💊','🩻','🔩','🧬','🏥','⚕️']

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

export default function AdminSpecialtiesPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', slug: '', icon: '🩺' })
  const [newForm, setNewForm] = useState({ name: '', slug: '', icon: '🩺' })
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState<'new' | string | null>(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('specialties')
      .select('*')
      .order('name')
    setSpecialties(data ?? [])
    setLoading(false)
  }

  const filtered = specialties.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async () => {
    if (!newForm.name.trim()) { toast.error('El nombre es obligatorio'); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('specialties').insert({
      name: newForm.name.trim(),
      slug: newForm.slug || slugify(newForm.name),
      icon: newForm.icon,
    })
    if (error) {
      toast.error(error.message.includes('unique') ? 'Ya existe esa especialidad' : 'Error al crear')
    } else {
      toast.success('Especialidad creada')
      setNewForm({ name: '', slug: '', icon: '🩺' })
      setShowNew(false)
      load()
    }
    setSaving(false)
  }

  const handleEdit = async (id: string) => {
    if (!editForm.name.trim()) { toast.error('El nombre es obligatorio'); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('specialties')
      .update({ name: editForm.name.trim(), slug: editForm.slug, icon: editForm.icon })
      .eq('id', id)
    if (error) toast.error('Error al guardar')
    else { toast.success('Guardado'); setEditingId(null); load() }
    setSaving(false)
  }

  const handleToggle = async (s: Specialty) => {
    const supabase = createClient()
    await supabase.from('specialties').update({ active: !s.active }).eq('id', s.id)
    load()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return
    const supabase = createClient()
    const { error } = await supabase.from('specialties').delete().eq('id', id)
    if (error) toast.error('No se puede eliminar — puede estar en uso')
    else { toast.success('Eliminada'); load() }
  }

  const startEdit = (s: Specialty) => {
    setEditingId(s.id)
    setEditForm({ name: s.name, slug: s.slug, icon: s.icon })
  }

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
          <h1 className="font-display text-2xl font-bold text-white">Especialidades</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            {specialties.length} especialidades · {specialties.filter(s => s.active).length} activas
          </p>
        </div>
        <button
          onClick={() => { setShowNew(true); setShowEmojiPicker(null) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-px"
          style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
          <Plus size={16} /> Nueva Especialidad
        </button>
      </div>

      {/* Formulario nueva especialidad */}
      {showNew && (
        <div className="mb-6 p-6 rounded-2xl" style={{ background: '#1e293b', border: '1px solid #6366f1', boxShadow: '0 0 24px rgba(99,102,241,0.1)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">Nueva Especialidad</h3>
            <button onClick={() => setShowNew(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10">
              <X size={14} style={{ color: '#64748b' }} />
            </button>
          </div>

          <div className="grid grid-cols-[auto,1fr,1fr] gap-4 items-start">
            {/* Emoji picker */}
            <div className="relative">
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#64748b' }}>Ícono</label>
              <button
                onClick={() => setShowEmojiPicker(showEmojiPicker === 'new' ? null : 'new')}
                className="w-14 h-10 rounded-xl text-2xl flex items-center justify-center transition-all hover:opacity-80"
                style={{ background: '#0f172a', border: '1px solid #334155' }}>
                {newForm.icon}
              </button>
              {showEmojiPicker === 'new' && (
                <div className="absolute top-full left-0 mt-1 p-2 rounded-xl z-20 grid grid-cols-5 gap-1"
                  style={{ background: '#0f172a', border: '1px solid #334155', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                  {EMOJI_OPTIONS.map(e => (
                    <button key={e} onClick={() => { setNewForm(f => ({...f, icon: e})); setShowEmojiPicker(null) }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white/10 transition-colors">
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#64748b' }}>Nombre</label>
              <input
                autoFocus
                value={newForm.name}
                onChange={e => setNewForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Ej: Reumatología"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9' }} />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#64748b' }}>
                Slug <span style={{ color: '#334155' }}>(auto)</span>
              </label>
              <input
                value={newForm.slug}
                onChange={e => setNewForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="reumatologia"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono"
                style={{ background: '#0f172a', border: '1px solid #334155', color: '#64748b' }} />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowNew(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
              style={{ color: '#64748b' }}>
              Cancelar
            </button>
            <button onClick={handleAdd} disabled={saving || !newForm.name.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all hover:-translate-y-px"
              style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Crear especialidad
            </button>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="flex items-center gap-3 mb-4 px-4 py-2.5 rounded-xl"
        style={{ background: '#1e293b', border: '1px solid #334155' }}>
        <Search size={15} style={{ color: '#475569' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar especialidad..."
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: '#f1f5f9' }} />
        {search && (
          <button onClick={() => setSearch('')}>
            <X size={14} style={{ color: '#475569' }} />
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#1e293b', border: '1px solid #334155' }}>
        {/* Header tabla */}
        <div className="grid grid-cols-[auto,1fr,1fr,auto,auto] gap-4 px-5 py-3 border-b"
          style={{ borderColor: '#334155', background: '#0f172a' }}>
          {['Ícono', 'Nombre', 'Slug', 'Estado', 'Acciones'].map(h => (
            <p key={h} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#475569' }}>{h}</p>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-sm" style={{ color: '#475569' }}>
              {search ? `No hay resultados para "${search}"` : 'No hay especialidades aún'}
            </p>
          </div>
        ) : filtered.map(s => (
          <div key={s.id}
            className="grid grid-cols-[auto,1fr,1fr,auto,auto] gap-4 items-center px-5 py-3 border-b transition-colors hover:bg-white/[0.02]"
            style={{ borderColor: '#334155' }}>

            {/* Ícono */}
            {editingId === s.id ? (
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(showEmojiPicker === s.id ? null : s.id)}
                  className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all hover:opacity-80"
                  style={{ background: '#0f172a', border: '1px solid #334155' }}>
                  {editForm.icon}
                </button>
                {showEmojiPicker === s.id && (
                  <div className="absolute top-full left-0 mt-1 p-2 rounded-xl z-20 grid grid-cols-5 gap-1"
                    style={{ background: '#0f172a', border: '1px solid #334155', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                    {EMOJI_OPTIONS.map(e => (
                      <button key={e} onClick={() => { setEditForm(f => ({...f, icon: e})); setShowEmojiPicker(null) }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white/10">
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-2xl w-10 flex items-center justify-center">{s.icon}</span>
            )}

            {/* Nombre */}
            {editingId === s.id ? (
              <input
                autoFocus
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleEdit(s.id)}
                className="px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: '#0f172a', border: '1px solid #6366f1', color: '#f1f5f9' }} />
            ) : (
              <p className="text-sm font-semibold text-white">{s.name}</p>
            )}

            {/* Slug */}
            {editingId === s.id ? (
              <input
                value={editForm.slug}
                onChange={e => setEditForm(f => ({ ...f, slug: e.target.value }))}
                className="px-3 py-2 rounded-xl text-xs outline-none font-mono"
                style={{ background: '#0f172a', border: '1px solid #334155', color: '#64748b' }} />
            ) : (
              <p className="text-xs font-mono" style={{ color: '#475569' }}>{s.slug}</p>
            )}

            {/* Estado toggle */}
            <button
              onClick={() => handleToggle(s)}
              className="px-2.5 py-1 rounded-full text-xs font-bold transition-all hover:opacity-80"
              style={s.active ? {
                background: 'rgba(16,185,129,0.1)',
                color: '#10b981',
                border: '1px solid rgba(16,185,129,0.2)',
              } : {
                background: 'rgba(100,116,139,0.1)',
                color: '#64748b',
                border: '1px solid rgba(100,116,139,0.2)',
              }}>
              {s.active ? 'Activa' : 'Inactiva'}
            </button>

            {/* Acciones */}
            <div className="flex items-center gap-1">
              {editingId === s.id ? (
                <>
                  <button onClick={() => handleEdit(s.id)} disabled={saving}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-emerald-500/20">
                    {saving ? <Loader2 size={13} className="animate-spin" style={{ color: '#10b981' }} />
                      : <Check size={13} style={{ color: '#10b981' }} />}
                  </button>
                  <button onClick={() => setEditingId(null)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10">
                    <X size={13} style={{ color: '#64748b' }} />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(s)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10">
                    <Pencil size={13} style={{ color: '#64748b' }} />
                  </button>
                  <button onClick={() => handleDelete(s.id, s.name)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/20">
                    <Trash2 size={13} style={{ color: '#ef4444' }} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <p className="text-xs mt-4 text-center" style={{ color: '#334155' }}>
        Las especialidades activas aparecen en el formulario de pacientes y perfil de doctores
      </p>
    </div>
  )
}