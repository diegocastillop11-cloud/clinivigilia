import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, Calendar, Clock, User, FileText, MapPin } from 'lucide-react'
import AppointmentActions from '@/components/appointments/AppointmentActions'

const TYPE_LABELS: Record<string, string> = {
  primera_vez: 'Primera vez', control: 'Control',
  urgencia: 'Urgencia', teleconsulta: 'Teleconsulta', procedimiento: 'Procedimiento',
}
const STATUS_LABELS: Record<string, string> = {
  programada: 'Programada', confirmada: 'Confirmada',
  completada: 'Completada', cancelada: 'Cancelada', no_asistio: 'No asistió',
}

function extractService(notes: string | null): string | null {
  if (!notes) return null
  const match = notes.match(/— Servicio: (.+)$/)
  return match?.[1]?.trim() || null
}

export const dynamic = 'force-dynamic'

export default async function CitaDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: appt } = await supabase
    .from('appointments')
    .select('*, patient:patients(id,first_name,last_name,rut,email,phone,specialty)')
    .eq('id', params.id)
    .eq('doctor_id', user.id)
    .single()

  if (!appt) notFound()

  const p = appt.patient as any
  const service = extractService(appt.notes)
  const fecha = parseISO(appt.scheduled_at)

  return (
    <div className="animate-in max-w-2xl mx-auto">
      {/* Back */}
      <Link href="/citas" className="btn-ghost mb-6 inline-flex">
        <ArrowLeft size={16} /> Volver a citas
      </Link>

      {/* Header */}
      <div className="card p-6 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-sky-50 border border-sky-100 rounded-2xl flex flex-col items-center justify-center flex-shrink-0">
              <span className="font-display text-2xl font-bold text-sky-600 leading-none">
                {format(fecha, 'd')}
              </span>
              <span className="text-[10px] font-bold text-sky-400 uppercase">
                {format(fecha, 'MMM', { locale: es })}
              </span>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800 capitalize">
                {format(fecha, "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </p>
              <p className="text-sky-600 font-semibold mt-0.5">
                {format(fecha, 'HH:mm')} hrs · {appt.duration_min} min
              </p>
            </div>
          </div>
          <span className={`status-dot ${appt.status} text-sm`}>{STATUS_LABELS[appt.status]}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {/* Servicio / tipo */}
        <div className="card p-5 space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
            <Calendar size={13} className="text-sky-500" /> Detalle de la cita
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Tipo</p>
              <p className="text-sm font-semibold text-slate-700">{TYPE_LABELS[appt.type] ?? appt.type}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Duración</p>
              <p className="text-sm font-semibold text-slate-700">{appt.duration_min} minutos</p>
            </div>
            {service && (
              <div className="col-span-2">
                <p className="text-xs text-slate-400 mb-0.5">Servicio agendado</p>
                <p className="text-sm font-bold text-violet-700">🏥 {service}</p>
              </div>
            )}
            {appt.location && (
              <div className="col-span-2">
                <p className="text-xs text-slate-400 mb-0.5">Lugar</p>
                <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <MapPin size={13} className="text-slate-400" /> {appt.location}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Paciente */}
        {p && (
          <div className="card p-5 space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <User size={13} className="text-sky-500" /> Paciente
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-slate-800">{p.first_name} {p.last_name}</p>
                {p.rut && <p className="text-xs text-slate-400 mt-0.5">RUT: {p.rut}</p>}
              </div>
              <Link href={`/pacientes/${p.id}`} className="btn-ghost text-sm">
                Ver ficha →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50">
              {p.email && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Email</p>
                  <p className="text-sm text-slate-700">{p.email}</p>
                </div>
              )}
              {p.phone && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Teléfono</p>
                  <p className="text-sm text-slate-700">{p.phone}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notas */}
        {appt.notes && (
          <div className="card p-5">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2 mb-3">
              <FileText size={13} className="text-sky-500" /> Notas
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{appt.notes}</p>
          </div>
        )}

        {/* Acciones */}
        {['programada', 'confirmada'].includes(appt.status) && (
          <div className="card p-5">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Cambiar estado</h2>
            <AppointmentActions apptId={appt.id} currentStatus={appt.status} />
          </div>
        )}
      </div>
    </div>
  )
}
