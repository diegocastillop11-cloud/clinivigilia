'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

// ─── Tipos ────────────────────────────────────────────────
interface DayConfig {
  day: number        // 0=Lun, 6=Dom
  enabled: boolean
  start: string      // "09:00"
  end: string        // "20:00"
  slotDuration: number // minutos
  enabledSlots: string[] // ["09:00","10:00",...]
}

// ─── Constantes ───────────────────────────────────────────
const DAYS = [
  { label: 'Lunes',     short: 'Lun', value: 0 },
  { label: 'Martes',    short: 'Mar', value: 1 },
  { label: 'Miércoles', short: 'Mié', value: 2 },
  { label: 'Jueves',    short: 'Jue', value: 3 },
  { label: 'Viernes',   short: 'Vie', value: 4 },
  { label: 'Sábado',    short: 'Sáb', value: 5 },
  { label: 'Domingo',   short: 'Dom', value: 6 },
]

const SLOT_DURATIONS = [
  { label: '30 min',  value: 30 },
  { label: '45 min',  value: 45 },
  { label: '1 hora',  value: 60 },
  { label: '1.5 hrs', value: 90 },
  { label: '2 horas', value: 120 },
]

const HOURS = Array.from({ length: 24 }, (_, i) =>
  `${String(i).padStart(2, '0')}:00`
)

// ─── Helpers ──────────────────────────────────────────────
function generateSlots(start: string, end: string, duration: number): string[] {
  const slots: string[] = []
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let current = sh * 60 + sm
  const endMin = eh * 60 + em

  while (current + duration <= endMin) {
    const h = Math.floor(current / 60)
    const m = current % 60
    slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
    current += duration
  }
  return slots
}

function formatSlot(time: string, duration: number): string {
  const [h, m] = time.split(':').map(Number)
  const endMin = h * 60 + m + duration
  const eh = Math.floor(endMin / 60)
  const em = endMin % 60
  return `${time} - ${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}`
}

const defaultDay = (day: number): DayConfig => ({
  day,
  enabled: day < 5, // Lun-Vie por defecto
  start: '09:00',
  end: '18:00',
  slotDuration: 60,
  enabledSlots: [],
})

// ─── Iconos ───────────────────────────────────────────────
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
)
const IconSave = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
)
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
)
const IconCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
)
const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
)

// ─── DayCard ──────────────────────────────────────────────
function DayCard({
  config, onChange, onCopyTo,
}: {
  config: DayConfig
  onChange: (c: DayConfig) => void
  onCopyTo: (from: number) => void
}) {
  const day = DAYS[config.day]
  const allSlots = generateSlots(config.start, config.end, config.slotDuration)

  function toggleSlot(slot: string) {
    const next = config.enabledSlots.includes(slot)
      ? config.enabledSlots.filter(s => s !== slot)
      : [...config.enabledSlots, slot]
    onChange({ ...config, enabledSlots: next })
  }

  function selectAll() {
    onChange({ ...config, enabledSlots: allSlots })
  }

  function clearAll() {
    onChange({ ...config, enabledSlots: [] })
  }

  // Cuando cambia start/end/duration, limpiar slots que ya no existen
  function handleRangeChange(key: 'start' | 'end' | 'slotDuration', val: string | number) {
    const next = { ...config, [key]: val }
    const newSlots = generateSlots(next.start, next.end, next.slotDuration)
    next.enabledSlots = next.enabledSlots.filter(s => newSlots.includes(s))
    onChange(next)
  }

  return (
    <div className={`rounded-2xl border transition-all overflow-hidden ${
      config.enabled
        ? 'border-violet-200 bg-white shadow-sm'
        : 'border-gray-100 bg-gray-50'
    }`}>
      {/* Header del día */}
      <div className={`flex items-center gap-3 px-4 py-3 ${config.enabled ? 'bg-violet-50 border-b border-violet-100' : 'border-b border-gray-100'}`}>
        <button
          onClick={() => onChange({ ...config, enabled: !config.enabled })}
          className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${config.enabled ? 'bg-violet-500' : 'bg-gray-300'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${config.enabled ? 'left-5' : 'left-0.5'}`}/>
        </button>
        <span className={`font-bold text-sm ${config.enabled ? 'text-violet-900' : 'text-gray-400'}`}>
          {day.label}
        </span>
        {config.enabled && (
          <span className="ml-auto text-xs text-violet-500 font-medium">
            {config.enabledSlots.length} bloques activos
          </span>
        )}
        {!config.enabled && (
          <span className="ml-auto text-xs text-gray-400">Sin atención</span>
        )}
      </div>

      {/* Contenido */}
      {config.enabled && (
        <div className="p-4 space-y-4">
          {/* Configuración del rango */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Desde</label>
              <select
                value={config.start}
                onChange={e => handleRangeChange('start', e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-medium text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                {HOURS.filter(h => h < config.end).map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hasta</label>
              <select
                value={config.end}
                onChange={e => handleRangeChange('end', e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-medium text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                {HOURS.filter(h => h > config.start).map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <IconClock />
              <select
                value={config.slotDuration}
                onChange={e => handleRangeChange('slotDuration', parseInt(e.target.value))}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-medium text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                {SLOT_DURATIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Slots generados */}
          {allSlots.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Bloques disponibles — haz clic para habilitar/deshabilitar
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
                  >
                    Todos
                  </button>
                  <span className="text-gray-300">·</span>
                  <button
                    onClick={clearAll}
                    className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Ninguno
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {allSlots.map(slot => {
                  const active = config.enabledSlots.includes(slot)
                  return (
                    <button
                      key={slot}
                      onClick={() => toggleSlot(slot)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        active
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {active && <IconCheck />}
                      {formatSlot(slot, config.slotDuration)}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400 text-center py-2">
              El rango seleccionado no genera bloques válidos
            </p>
          )}

          {/* Copiar a otros días */}
          <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
            <IconCopy />
            <span className="text-xs text-gray-400 font-medium">Copiar configuración a:</span>
            {DAYS.filter(d => d.value !== config.day).map(d => (
              <button
                key={d.value}
                onClick={() => onCopyTo(d.value)}
                className="text-xs font-semibold text-violet-500 hover:text-violet-700 transition-colors px-2 py-0.5 rounded-lg hover:bg-violet-50"
              >
                {d.short}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────
export default function DisponibilidadPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [days, setDays] = useState<DayConfig[]>(
    DAYS.map(d => defaultDay(d.value))
  )

  // ─── Cargar disponibilidad guardada ─────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('web_availability')
        .select('*')
        .eq('doctor_id', user.id)

      if (data && data.length > 0) {
        setDays(prev => prev.map(d => {
          const saved = data.find((r: any) => r.day_of_week === d.day)
          if (!saved) return d
          return {
            day: d.day,
            enabled: saved.active,
            start: saved.start_time?.slice(0,5) || '09:00',
            end: saved.end_time?.slice(0,5) || '18:00',
            slotDuration: saved.slot_duration || 60,
            enabledSlots: saved.enabled_slots || [],
          }
        }))
      }
      setLoading(false)
    }
    load()
  }, [])

  function updateDay(day: number, config: DayConfig) {
    setDays(prev => prev.map(d => d.day === day ? config : d))
  }

  function copyTo(fromDay: number, toDay: number) {
    const from = days.find(d => d.day === fromDay)!
    setDays(prev => prev.map(d => {
      if (d.day !== toDay) return d
      // Regenerar slots para el día destino con la misma config
      const newSlots = generateSlots(from.start, from.end, from.slotDuration)
      const validEnabled = from.enabledSlots.filter(s => newSlots.includes(s))
      return {
        ...d,
        enabled: from.enabled,
        start: from.start,
        end: from.end,
        slotDuration: from.slotDuration,
        enabledSlots: validEnabled,
      }
    }))
    toast.success(`Configuración copiada a ${DAYS[toDay].label}`)
  }

  // ─── Guardar ─────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Borrar todo y reinsertar (más simple que upsert por day_of_week)
    await supabase.from('web_availability').delete().eq('doctor_id', user.id)

    const rows = days.map(d => ({
      doctor_id:     user.id,
      day_of_week:   d.day,
      start_time:    d.start + ':00',
      end_time:      d.end + ':00',
      slot_duration: d.slotDuration,
      active:        d.enabled,
      enabled_slots: d.enabledSlots,
    }))

    const { error } = await supabase.from('web_availability').insert(rows)

    setSaving(false)
    if (error) {
      toast.error('Error al guardar disponibilidad')
    } else {
      toast.success('¡Disponibilidad guardada correctamente!')
      router.push('/dashboard/gestor-web')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"/>
          <p className="text-sm text-gray-400">Cargando disponibilidad...</p>
        </div>
      </div>
    )
  }

  const totalSlots = days.reduce((acc, d) => acc + d.enabledSlots.length, 0)
  const activeDays = days.filter(d => d.enabled).length

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
          <h1 className="text-2xl font-bold text-gray-900">Disponibilidad</h1>
          <p className="text-sm text-gray-500 mt-1">
            Define los bloques de atención que tus pacientes pueden agendar
          </p>
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

      {/* ─── Stats rápidos ────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Días activos',       value: activeDays,   color: '#6366F1' },
          { label: 'Bloques habilitados',value: totalSlots,   color: '#10B981' },
          { label: 'Días sin atención',  value: 7 - activeDays, color: '#94A3B8' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ─── Tip ──────────────────────────────────────── */}
      <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 mb-6 flex gap-3">
        <span className="text-xl flex-shrink-0">💡</span>
        <div className="text-sm text-violet-700">
          <strong>Cómo funciona:</strong> Activa el día con el toggle, define el rango horario y la duración de cada bloque.
          El sistema genera los bloques automáticamente — haz clic en los que quieras habilitar.
          Usa <strong>Copiar configuración a</strong> para replicar un día en los demás rápidamente.
        </div>
      </div>

      {/* ─── Cards de días ────────────────────────────── */}
      <div className="space-y-4">
        {days.map(config => (
          <DayCard
            key={config.day}
            config={config}
            onChange={c => updateDay(config.day, c)}
            onCopyTo={toDay => copyTo(config.day, toDay)}
          />
        ))}
      </div>

      {/* ─── Guardar bottom ───────────────────────────── */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-md shadow-violet-200 disabled:opacity-50"
        >
          {saving ? (
            <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/> Guardando...</>
          ) : (
            <><IconSave /> Guardar disponibilidad</>
          )}
        </button>
      </div>
    </div>
  )
}
