import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, ClipboardList, Phone, Mail, MapPin, AlertCircle, Edit, Send } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import FollowupTimeline from '@/components/followups/FollowupTimeline'
import AddFollowupForm from '@/components/followups/AddFollowupForm'
import SendReminderBanner from '@/components/followups/SendReminderBanner'

const SPECIALTY_LABELS: Record<string, string> = {
  cardiologia: 'Cardiología', neurologia: 'Neurología', oncologia: 'Oncología',
  pediatria: 'Pediatría', ortopedia: 'Ortopedia', endocrinologia: 'Endocrinología',
  ginecologia: 'Ginecología', dermatologia: 'Dermatología', psiquiatria: 'Psiquiatría',
  medicina_general: 'Medicina General',
}

function calcAge(dob: string | null) {
  if (!dob) return null
  return Math.abs(new Date(Date.now() - new Date(dob).getTime()).getUTCFullYear() - 1970)
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [patientRes, followupsRes, appointmentsRes] = await Promise.all([
    supabase.from('patients').select('*').eq('id', id).eq('doctor_id', user.id).single(),
    supabase.from('followups').select('*').eq('patient_id', id).order('created_at', { ascending: false }),
    supabase.from('appointments').select('*').eq('patient_id', id)
      .order('scheduled_at', { ascending: false }).limit(5),
  ])

  if (!patientRes.data) notFound()
  const p = patientRes.data
  const followups = followupsRes.data ?? []
  const appointments = appointmentsRes.data ?? []

  const initials = (p.first_name[0] + p.last_name[0]).toUpperCase()
  const age = calcAge(p.birth_date)

  // Buscar seguimientos con visita próxima ≤7 días
  const upcomingVisits = followups.filter((f: any) => {
    if (!f.next_visit_date) return false
    const days = getDaysUntil(f.next_visit_date)
    return days >= 0 && days <= 7
  }).sort((a: any, b: any) =>
    new Date(a.next_visit_date).getTime() - new Date(b.next_visit_date).getTime()
  )

  return (
    <div className="animate-in">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/pacientes" className="btn-ghost"><ArrowLeft size={16} /> Pacientes</Link>
      </div>

      {/* ── Banner de alerta de visita próxima ── */}
      {upcomingVisits.length > 0 && (
        <div className="mb-6 space-y-2">
          {upcomingVisits.map((visit: any) => (
            <SendReminderBanner
              key={visit.id}
              followup={visit}
              patient={p}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-[300px_1fr] gap-6">

        {/* Left - Patient card */}
        <div className="space-y-5">
          <div className="card p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-sky-700 flex items-center justify-center text-white text-xl font-bold mx-auto mb-3 shadow-lg shadow-sky-200">
              {initials}
            </div>
            <h2 className="font-display text-lg font-bold text-slate-800">
              {p.first_name} {p.last_name}
            </h2>
            {p.rut && <p className="text-xs text-slate-400 mt-0.5">{p.rut}</p>}
            <div className="flex justify-center gap-2 mt-3">
              <span className={`badge spec-${p.specialty}`}>
                {SPECIALTY_LABELS[p.specialty]}
              </span>
              <span className={`badge badge-${p.status}`}>
                {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
              </span>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5 text-left">
              {age && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="text-slate-400">👤</span>
                  {age} años {p.gender ? `· ${p.gender}` : ''}
                </div>
              )}
              {p.phone && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone size={13} className="text-slate-400" /> {p.phone}
                </div>
              )}
              {p.email && (
                <div className="flex items-center gap-2 text-sm text-slate-600 truncate">
                  <Mail size={13} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{p.email}</span>
                </div>
              )}
              {p.address && (
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin size={13} className="text-slate-400 flex-shrink-0 mt-0.5" /> {p.address}
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <Link href={`/pacientes/${p.id}/editar`} className="btn-outline flex-1 justify-center text-xs">
                <Edit size={13} /> Editar
              </Link>
              <Link href={`/citas/nueva?patient=${p.id}`} className="btn-primary flex-1 justify-center text-xs">
                <Calendar size={13} /> Cita
              </Link>
            </div>
          </div>

          {p.emergency_contact_name && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={14} className="text-amber-500" />
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Emergencia</h3>
              </div>
              <p className="text-sm font-semibold text-slate-700">{p.emergency_contact_name}</p>
              {p.emergency_contact_phone && (
                <p className="text-sm text-slate-500 mt-0.5">{p.emergency_contact_phone}</p>
              )}
            </div>
          )}

          {p.notes && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList size={14} className="text-sky-500" />
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Notas Clínicas</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{p.notes}</p>
            </div>
          )}

          {appointments.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-sky-500" />
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Citas</h3>
                </div>
                <Link href={`/citas?patient=${p.id}`} className="text-xs text-sky-500 hover:text-sky-700 font-medium">
                  Ver todas
                </Link>
              </div>
              <div className="space-y-2">
                {appointments.map(appt => (
                  <Link key={appt.id} href={`/citas/${appt.id}`}>
                    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 hover:bg-sky-50 -mx-2 px-2 rounded-lg transition-colors">
                      <div>
                        <p className="text-xs font-medium text-slate-700">
                          {format(parseISO(appt.scheduled_at), "d MMM yyyy, HH:mm", { locale: es })}
                        </p>
                        <p className="text-[10px] text-slate-400 capitalize">{appt.type.replace('_', ' ')}</p>
                      </div>
                      <span className={`status-dot ${appt.status} text-[10px]`}>
                        {appt.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right - Timeline */}
        <div className="space-y-5">
          <AddFollowupForm patientId={p.id} patientEmail={p.email} />
          <FollowupTimeline
            followups={followups}
            patientEmail={p.email}
            patientId={p.id}
          />
        </div>
      </div>
    </div>
  )
}