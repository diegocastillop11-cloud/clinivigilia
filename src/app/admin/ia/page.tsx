import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminIAChat from './AdminIAChat'

export const dynamic = 'force-dynamic'

const SUPERADMIN_EMAIL = 'diego.castillo.p11@gmail.com'

export default async function AdminIAPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== SUPERADMIN_EMAIL) redirect('/admin')

  // Cargar todos los datos de la plataforma
  const [clientsRes, clinicsRes, patientsRes, appointmentsRes] = await Promise.all([
    supabase.from('admin_clients_view').select('*').order('created_at', { ascending: false }),
    supabase.from('clinics').select('*, clinic_doctors(count)'),
    supabase.from('patients').select('id, doctor_id, status, specialty, created_at'),
    supabase.from('appointments').select('id, doctor_id, status, scheduled_at, type'),
  ])

  const clients = clientsRes.data ?? []
  const clinics = clinicsRes.data ?? []
  const patients = patientsRes.data ?? []
  const appointments = appointmentsRes.data ?? []

  // Construir contexto rico para la IA
  const platformData = {
    resumen: {
      total_clientes: clients.length,
      clientes_activos: clients.filter(c => c.status === 'active').length,
      clientes_suspendidos: clients.filter(c => c.status === 'suspended').length,
      total_clinicas: clinics.length,
      total_pacientes: patients.length,
      total_citas: appointments.length,
      citas_completadas: appointments.filter(a => a.status === 'completada').length,
      planes: {
        free: clients.filter(c => c.plan === 'free').length,
        pro: clients.filter(c => c.plan === 'pro').length,
        premium: clients.filter(c => c.plan === 'premium').length,
        enterprise: clients.filter(c => c.plan === 'enterprise').length,
      }
    },
    clientes: clients.map(c => ({
      nombre: c.full_name,
      tipo: c.clinic_name ? 'clinica' : 'doctor_independiente',
      clinica: c.clinic_name ?? null,
      plan: c.plan,
      estado: c.status,
      pacientes: c.patient_count ?? 0,
      modulos: c.enabled_modules ?? [],
      vencimiento: c.expires_at ?? null,
      creado: c.created_at,
    })),
    clinicas: clinics.map(cl => ({
      nombre: cl.name,
      plan: cl.plan,
      estado: cl.status,
      max_medicos: cl.max_doctors,
      modulos: cl.enabled_modules ?? [],
    })),
    pacientes_por_estado: {
      activos: patients.filter(p => p.status === 'activo').length,
      pendientes: patients.filter(p => p.status === 'pendiente').length,
      alta: patients.filter(p => p.status === 'alta').length,
      suspendidos: patients.filter(p => p.status === 'suspendido').length,
    },
    citas_por_estado: {
      programadas: appointments.filter(a => a.status === 'programada').length,
      confirmadas: appointments.filter(a => a.status === 'confirmada').length,
      completadas: appointments.filter(a => a.status === 'completada').length,
      canceladas: appointments.filter(a => a.status === 'cancelada').length,
      no_asistio: appointments.filter(a => a.status === 'no_asistio').length,
    }
  }

  return <AdminIAChat platformData={platformData} />
}