import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportesClient from './ReportesClient'

export const dynamic = 'force-dynamic'

export default async function ReportesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: doctor } = await supabase
    .from('doctors').select('*').eq('id', user.id).single()

  // Stats generales
  const { data: stats } = await supabase
    .from('patient_stats').select('*').eq('doctor_id', user.id).single()

  // Todos los pacientes
  const { data: patients } = await supabase
    .from('patients').select('*').eq('doctor_id', user.id).order('created_at', { ascending: false })

  // Todas las citas
  const { data: appointments } = await supabase
    .from('appointments').select('*, patient:patients(first_name,last_name)')
    .eq('doctor_id', user.id).order('scheduled_at', { ascending: false })

  // Seguimientos
  const { data: followups } = await supabase
    .from('followups').select('*').eq('doctor_id', user.id).order('created_at', { ascending: false })

  return (
    <ReportesClient
      doctor={doctor}
      stats={stats ?? { total: 0, activos: 0, pendientes: 0, alta: 0, suspendidos: 0 }}
      patients={patients ?? []}
      appointments={appointments ?? []}
      followups={followups ?? []}
    />
  )
}