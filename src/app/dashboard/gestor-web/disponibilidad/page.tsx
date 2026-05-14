'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  format, startOfMonth, endOfMonth, addMonths, subMonths,
  eachDayOfInterval, startOfWeek, endOfWeek,
  isSameMonth, isToday, isBefore, startOfDay, getDay,
} from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

// ─── Tipos ────────────────────────────────────────────────
interface DayConfig {
  date: string
  active: boolean
  start_time: string
  end_time: string
  slot_duration: number
  enabled_slots: string[]
}
type AvailMap = Record<string, DayConfig>

// ─── Helpers ──────────────────────────────────────────────
function generateSlots(start: string, end: string, duration: number): string[] {
  if (!start || !end || duration <= 0) return []
  const slots: string[] = []
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let min = sh * 60 + sm
  const endMin = eh * 60 + em
  while (min + duration <= endMin) {
    slots.push(`${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`)
    min += duration
  }
  return slots
}

// date-fns getDay: 0=Dom → 0=Lun...6=Dom
function jsToMon(d: number) { return d === 0 ? 6 : d - 1 }

const WEEK_LABELS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const WEEK_FULL   = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DURATIONS   = [
  { v: 30, l: '30 min' }, { v: 45, l: '45 min' }, { v: 60, l: '1 hora' },
  { v: 90, l: '1:30 h' }, { v: 120, l: '2 horas' },
]
const DEFAULT_PANEL = {
  active: true, start_time: '09:00', end_time: '18:00',
  slot_duration: 60, enabled_slots: [] as string[],
}

// ─── Componente principal ─────────────────────────────────
export default function DisponibilidadPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [month, setMonth]       = useState(new Date())
  const [avail, setAvail]       = useState<AvailMap>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [panel, setPanel]       = useState({ ...DEFAULT_PANEL })
  const [saving, setSaving]     = useState(false)
  const [loading, setLoading]   = useState(true)

  // ─── Cargar disponibilidad del mes ───────────────────
  const loadMonth = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const start = format(startOfMonth(month), 'yyyy-MM-dd')
    const end   = format(endOfMonth(addMonths(month, 1)), 'yyyy-MM-dd')

    const { data } = await supabase
      .from('web_availability_dates')
      .select('*')
      .eq('doctor_id', user.id)
      .gte('date', start)
      .lte('date', end)

    const map: AvailMap = {}
    for (const row of (data || [])) {
      map[row.date] = {
        date:          row.date,
        active:        row.active,
        start_time:    (row.start_time  || '09:00:00').slice(0, 5),
        end_time:      (row.end_time    || '18:00:00').slice(0, 5),
        slot_duration: row.slot_duration || 60,
        enabled_slots: row.enabled_slots || [],
      }
    }
    setAvail(map)
    setLoading(false)
  }, [month])

  useEffect(() => { loadMonth() }, [loadMonth])

  // ─── Seleccionar día específico ───────────────────────
  function selectDay(dateStr: string) {
    setSelected(dateStr)
    const existing = avail[dateStr]
    setPanel(existing
      ? { active: existing.active, start_time: existing.start_time, end_time: existing.end_time, slot_duration: existing.slot_duration, enabled_slots: existing.enabled_slots }
      : { ...DEFAULT_PANEL, enabled_slots: [] }
    )
  }

  // ─── Abrir shortcut por día de semana ─────────────────
  function openWeekday(idx: number) {
    const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
      .filter(d => jsToMon(getDay(d)) === idx)
    setSelected(`weekday:${idx}`)
    const first = days.length ? avail[format(days[0], 'yyyy-MM-dd')] : null
    setPanel(first
      ? { active: first.active, start_time: first.start_time, end_time: first.end_time, slot_duration: first.slot_duration, enabled_slots: first.enabled_slots }
      : { ...DEFAULT_PANEL, enabled_slots: [] }
    )
  }

  // ─── Cambiar tiempo/duración (regenera slots) ─────────
  function updateTime(key: 'start_time' | 'end_time' | 'slot_duration', val: string | number) {
    setPanel(p => {
      const next = { ...p, [key]: val }
      return { ...next, enabled_slots: generateSlots(next.start_time, next.end_time, next.slot_duration) }
    })
  }

  function toggleSlot(slot: string) {
    setPanel(p => ({
      ...p,
      enabled_slots: p.enabled_slots.includes(slot)
        ? p.enabled_slots.filter(s => s !== slot)
        : [...p.enabled_slots, slot].sort(),
    }))
  }

  // ─── Guardar día específico ───────────────────────────
  async function saveDay() {
    if (!selected || selected.startsWith('weekday:')) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { error } = await supabase.from('web_availability_dates').upsert({
      doctor_id:     user.id,
      date:          selected,
      active:        panel.active,
      start_time:    panel.start_time,
      end_time:      panel.end_time,
      slot_duration: panel.slot_duration,
      enabled_slots: panel.enabled_slots,
    }, { onConflict: 'doctor_id,date' })

    if (!error) {
      setAvail(prev => ({ ...prev, [selected]: { date: selected, ...panel } }))
      toast.success('Día guardado')
    } else {
      toast.error('Error al guardar')
    }
    setSaving(false)
  }

  // ─── Aplicar a todos los X del mes ───────────────────
  async function applyToWeekday() {
    let targetIdx: number | undefined
    if (selected?.startsWith('weekday:')) {
      targetIdx = parseInt(selected.split(':')[1])
    } else if (selected) {
      targetIdx = jsToMon(getDay(new Date(selected + 'T12:00:00')))
    }
    if (targetIdx === undefined) return

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
      .filter(d => jsToMon(getDay(d)) === targetIdx)

    const upserts = days.map(d => ({
      doctor_id:     user.id,
      date:          format(d, 'yyyy-MM-dd'),
      active:        panel.active,
      start_time:    panel.start_time,
      end_time:      panel.end_time,
      slot_duration: panel.slot_duration,
      enabled_slots: panel.enabled_slots,
    }))

    const { error } = await supabase
      .from('web_availability_dates')
      .upsert(upserts, { onConflict: 'doctor_id,date' })

    if (!error) {
      const newMap = { ...avail }
      for (const d of days) {
        const ds = format(d, 'yyyy-MM-dd')
        newMap[ds] = { date: ds, ...panel }
      }
      setAvail(newMap)
      toast.success(`Aplicado a todos los ${WEEK_FULL[targetIdx]} del mes`)
    } else {
      toast.error('Error al aplicar')
    }
    setSaving(false)
  }

  // ─── Grid del calendario ──────────────────────────────
  const today         = new Date()
  const monthStart    = startOfMonth(month)
  const monthEnd      = endOfMonth(month)
  const gridStart     = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd       = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calDays       = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const monthDays     = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const daysLeft        = Math.ceil((monthEnd.getTime() - today.getTime()) / 86400000)
  const showNextHint    = daysLeft <= 7 && isSameMonth(month, today)

  const activeDays  = monthDays.filter(d => avail[format(d, 'yyyy-MM-dd')]?.active).length
  const totalSlots  = monthDays.reduce((acc, d) => acc + (avail[format(d, 'yyyy-MM-dd')]?.enabled_slots?.length || 0), 0)
  const emptyDays   = monthDays.filter(d => !avail[format(d, 'yyyy-MM-dd')]).length

  const allSlots = generateSlots(panel.start_time, panel.end_time, panel.slot_duration)

  const selectedWeekdayIdx = selected?.startsWith('weekday:')
    ? parseInt(selected.split(':')[1])
    : selected
    ? jsToMon(getDay(new Date(selected + 'T12:00:00')))
    : null

  const isPastDay = selected && !selected.startsWith('weekday:')
    && isBefore(startOfDay(new Date(selected + 'T00:00:00')), startOfDay(today))

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <button onClick={() => router.push('/dashboard/gestor-web')}
          className="text-sm text-gray-400 hover:text-gray-600 mb-3 flex items-center gap-1 transition-colors">
          ← Volver al gestor web
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Disponibilidad</h1>
        <p className="text-sm text-gray-500 mt-1">Define los días y horarios en que tus pacientes pueden agendar</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Días activos', value: activeDays, color: '#10b981' },
          { label: 'Bloques habilitados', value: totalSlots, color: '#6366f1' },
          { label: 'Días sin configurar', value: emptyDays, color: '#94a3b8' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Hint próximo mes */}
      {showNextHint && (
        <div className="mb-4 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-violet-700">
            <span className="font-semibold">Última semana del mes.</span>{' '}
            Ya puedes configurar {format(addMonths(month, 1), 'MMMM', { locale: es })}.
          </p>
          <button onClick={() => setMonth(m => addMonths(m, 1))}
            className="text-xs font-semibold text-violet-600 hover:text-violet-800 whitespace-nowrap">
            Ir a {format(addMonths(month, 1), 'MMMM', { locale: es })} →
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-5">

        {/* ─── Calendario ──────────────────────────────── */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Nav mes */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <button onClick={() => setMonth(m => subMonths(m, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600 text-lg">
              ‹
            </button>
            <h2 className="text-base font-bold text-gray-900 capitalize">
              {format(month, 'MMMM yyyy', { locale: es })}
            </h2>
            <button onClick={() => setMonth(m => addMonths(m, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600 text-lg">
              ›
            </button>
          </div>

          {/* Shortcuts días de semana */}
          <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/60">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Configurar todos los:</p>
            <div className="flex gap-1.5 flex-wrap">
              {WEEK_LABELS.map((label, idx) => {
                const activeCount = monthDays.filter(d =>
                  jsToMon(getDay(d)) === idx && avail[format(d, 'yyyy-MM-dd')]?.active
                ).length
                return (
                  <button key={idx} onClick={() => openWeekday(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      selected === `weekday:${idx}`
                        ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600'
                    }`}>
                    {label}
                    {activeCount > 0 && (
                      <span className="ml-1 text-[9px] opacity-60">({activeCount})</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Grid */}
          <div className="p-4">
            <div className="grid grid-cols-7 mb-1">
              {WEEK_LABELS.map(l => (
                <div key={l} className="text-center text-[10px] font-bold text-gray-400 py-1">{l}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {loading ? (
                <div className="col-span-7 py-12 text-center text-sm text-gray-400">Cargando...</div>
              ) : calDays.map(day => {
                const dateStr    = format(day, 'yyyy-MM-dd')
                const inMonth    = isSameMonth(day, month)
                const todayDay   = isToday(day)
                const past       = isBefore(startOfDay(day), startOfDay(today))
                const cfg        = avail[dateStr]
                const isActive   = cfg?.active
                const slotCount  = cfg?.enabled_slots?.length || 0
                const isSelected = selected === dateStr

                return (
                  <button key={dateStr}
                    onClick={() => inMonth && selectDay(dateStr)}
                    disabled={!inMonth}
                    title={cfg ? `${slotCount} bloques` : undefined}
                    className={[
                      'relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all',
                      !inMonth ? 'opacity-15 cursor-default' : 'cursor-pointer',
                      isSelected ? 'ring-2 ring-violet-500 ring-offset-1 z-10' : '',
                      todayDay && !isSelected ? 'ring-2 ring-blue-300' : '',
                      inMonth && isActive  ? 'bg-emerald-50 hover:bg-emerald-100' : '',
                      inMonth && cfg && !isActive ? 'bg-red-50' : '',
                      inMonth && !cfg ? 'bg-gray-50 hover:bg-gray-100' : '',
                      past && inMonth ? 'opacity-50' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <span className={`text-xs font-bold ${todayDay ? 'text-blue-600' : isActive ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {format(day, 'd')}
                    </span>
                    {slotCount > 0 && inMonth && (
                      <span className="text-[8px] font-bold text-emerald-500 leading-none">{slotCount}sl</span>
                    )}
                    {cfg && !isActive && inMonth && (
                      <span className="text-[8px] text-red-400 leading-none">off</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
              {[
                { color: 'bg-emerald-50', border: 'border-emerald-200', label: 'Con horarios' },
                { color: 'bg-red-50', border: 'border-red-200', label: 'Desactivado' },
                { color: 'bg-gray-50', border: 'border-gray-200', label: 'Sin configurar' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${l.color} border ${l.border}`} />
                  <span className="text-[10px] text-gray-400">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Panel de configuración ──────────────────── */}
        {selected ? (
          <div className="lg:w-80 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 self-start">

            {/* Título */}
            <div className="flex items-start justify-between">
              <div>
                {selected.startsWith('weekday:') ? (
                  <>
                    <p className="font-bold text-gray-900">
                      Todos los {WEEK_FULL[parseInt(selected.split(':')[1])]}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">
                      {format(month, 'MMMM yyyy', { locale: es })}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-gray-900 capitalize">
                      {format(new Date(selected + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })}
                    </p>
                    {isPastDay && (
                      <p className="text-xs text-amber-500 mt-0.5">Día pasado — solo lectura</p>
                    )}
                  </>
                )}
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-300 hover:text-gray-500 text-xl leading-none mt-0.5">×</button>
            </div>

            {/* Toggle disponible */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-gray-700">Disponible</p>
                <p className="text-xs text-gray-400">Pacientes pueden agendar</p>
              </div>
              <button
                onClick={() => !isPastDay && setPanel(p => ({ ...p, active: !p.active }))}
                disabled={!!isPastDay}
                className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${panel.active ? 'bg-violet-500' : 'bg-gray-200'} disabled:opacity-50`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${panel.active ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>

            {panel.active && (
              <>
                {/* Horario */}
                <div className="space-y-2.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Horario</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Desde</label>
                      <input type="time" value={panel.start_time} disabled={!!isPastDay}
                        onChange={e => !isPastDay && updateTime('start_time', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50 disabled:cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Hasta</label>
                      <input type="time" value={panel.end_time} disabled={!!isPastDay}
                        onChange={e => !isPastDay && updateTime('end_time', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50 disabled:cursor-not-allowed" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Duración del bloque</label>
                    <select value={panel.slot_duration} disabled={!!isPastDay}
                      onChange={e => !isPastDay && updateTime('slot_duration', parseInt(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50 disabled:cursor-not-allowed">
                      {DURATIONS.map(d => <option key={d.v} value={d.v}>{d.l}</option>)}
                    </select>
                  </div>
                </div>

                {/* Slots */}
                {allSlots.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bloques</p>
                      <div className="flex gap-2">
                        <button onClick={() => !isPastDay && setPanel(p => ({ ...p, enabled_slots: allSlots }))}
                          disabled={!!isPastDay}
                          className="text-[10px] font-semibold text-violet-500 hover:text-violet-700 disabled:opacity-40">
                          Todos
                        </button>
                        <button onClick={() => !isPastDay && setPanel(p => ({ ...p, enabled_slots: [] }))}
                          disabled={!!isPastDay}
                          className="text-[10px] font-semibold text-gray-400 hover:text-gray-600 disabled:opacity-40">
                          Ninguno
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {allSlots.map(slot => {
                        const on = panel.enabled_slots.includes(slot)
                        return (
                          <button key={slot} onClick={() => !isPastDay && toggleSlot(slot)} disabled={!!isPastDay}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all disabled:cursor-not-allowed ${
                              on ? 'bg-violet-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}>
                            {slot}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Acciones */}
            {!isPastDay && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                {!selected.startsWith('weekday:') && (
                  <button onClick={saveDay} disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold py-2.5 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-40 shadow-md shadow-violet-200 text-sm">
                    {saving
                      ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> Guardando...</>
                      : '✓ Guardar este día'}
                  </button>
                )}
                <button onClick={applyToWeekday} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-violet-50 text-violet-700 font-semibold py-2.5 rounded-xl hover:bg-violet-100 transition-colors disabled:opacity-40 text-sm border border-violet-200">
                  {saving
                    ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" /> Aplicando...</>
                    : `↻ Todos los ${selectedWeekdayIdx !== null ? WEEK_FULL[selectedWeekdayIdx] : ''} del mes`}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden lg:flex lg:w-80 bg-gray-50 rounded-2xl border border-dashed border-gray-200 items-center justify-center text-center p-8 self-start" style={{ minHeight: 300 }}>
            <div>
              <p className="text-3xl mb-3">📅</p>
              <p className="text-sm font-semibold text-gray-500">Selecciona un día del calendario</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                o usa los atajos de día de semana para configurar en bloque
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
