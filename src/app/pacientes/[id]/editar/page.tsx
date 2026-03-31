import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import EditPatientForm from './EditPatientForm'

export default async function EditPatientPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: patient } = await supabase
    .from('patients').select('*')
    .eq('id', params.id).eq('doctor_id', user.id).single()

  if (!patient) notFound()
  return <EditPatientForm patient={patient} />
}
