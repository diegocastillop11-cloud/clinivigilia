'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Patient } from '@/types/database'

const APPT_TYPES = [
  { value: 'primera_vez', label: 'Primera vez' },
  { value: 'control', label: 'Control' },
  { value: 'urgencia', label: 'Urgencia' },
  { value: 'teleconsulta', label: 'Teleconsulta' },
  { value: 'procedimiento', label: 'Procedimiento' },
]

export default function NewAppointmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedPatient = searchParams.get('patient')
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [form, setForm] = useState({
    patient_id: preselectedPatient ?? '',
    date: '', time: '09:00', duration_min: '30',
    type: 'control', status: 'programada',
    location: '', notes: '',
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('patients').select('*')
        .eq('doctor_id', user.id).order('first_name')
      setPatients(data ?? [])
    }
    load()
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.patient_id || !form.date || !form.time) {
      toast.error('Selecciona paciente, fecha y hora')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const scheduled_at = new Date(`${form.date}T${form.time}:00`).toISOString()

    const { error } = await supabase.from('appointments').insert({
      patient_id: form.patient_id,
      doctor_id: user.id,
      scheduled_at,
      duration_min: parseInt(form.duration_min),
      type: form.type as any,
      status: form.status as any,
      location: form.location || null,
      notes: form.notes || null,
    })

    if (error) { toast.error('Error: ' + error.message); setLoading(false); return }

    const patient = patients.find(p => p.id === form.patient_id)
    toast.success(`Cita agendada para ${patient?.first_name} ${patient?.last_name}`)
    router.push('/citas')
    router.refresh()
  }

  return (
    <div className="animate-in max-w-2xl">
      <div className="flex items-center gap-4 mb-7">
        <Link href="/citas" className="btn-ghost"><ArrowLeft size={16} /> Volver</Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Nueva Cita</h1>
          <p className="text-sm text-slate-400 mt-0.5">Programar consulta médica</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Calendar size={16} className="text-sky-500" />
            <h2 className="font-display font-bold text-slate-700">Detalles de la Cita</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Paciente *</label>
              <select className="form-input" required value={form.patient_id} onChange={set('patient_id')}>
                <option value="">Seleccionar paciente...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name} — {p.rut || 'sin RUT'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Fecha *</label>
              <input type="date" className="form-input" required
                min={new Date().toISOString().split('T')[0]}
                value={form.date} onChange={set('date')} />
            </div>
            <div>
              <label className="form-label">Hora *</label>
              <input type="time" className="form-input" required
                value={form.time} onChange={set('time')} />
            </div>

            <div>
              <label className="form-label">Tipo de cita</label>
              <select className="form-input" value={form.type} onChange={set('type')}>
                {APPT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Duración (minutos)</label>
              <select className="form-input" value={form.duration_min} onChange={set('duration_min')}>
                {['15','20','30','45','60','90','120'].map(d => (
                  <option key={d} value={d}>{d} minutos</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Estado inicial</label>
              <select className="form-input" value={form.status} onChange={set('status')}>
                <option value="programada">Programada</option>
                <option value="confirmada">Confirmada</option>
              </select>
            </div>
            <div>
              <label className="form-label">Ubicación / Sala</label>
              <input className="form-input" placeholder="Ej: Consultorio 3, Piso 2"
                value={form.location} onChange={set('location')} />
            </div>

            <div className="col-span-2">
              <label className="form-label">Notas de la cita</label>
              <textarea className="form-input" rows={3}
                placeholder="Instrucciones previas, motivo de consulta, observaciones..."
                value={form.notes} onChange={set('notes')} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-4">
          <Link href="/citas" className="btn-outline">Cancelar</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Guardando...' : <><Save size={16} /> Agendar Cita</>}
          </button>
        </div>
      </form>
    </div>
  )
}
