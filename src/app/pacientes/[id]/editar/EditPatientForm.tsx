'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Patient } from '@/types/database'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const SPECIALTIES = [
  { value: 'cardiologia', label: 'Cardiología' },
  { value: 'neurologia', label: 'Neurología' },
  { value: 'oncologia', label: 'Oncología' },
  { value: 'pediatria', label: 'Pediatría' },
  { value: 'ortopedia', label: 'Ortopedia' },
  { value: 'endocrinologia', label: 'Endocrinología' },
  { value: 'ginecologia', label: 'Ginecología' },
  { value: 'dermatologia', label: 'Dermatología' },
  { value: 'psiquiatria', label: 'Psiquiatría' },
  { value: 'medicina_general', label: 'Medicina General' },
]

export default function EditPatientForm({ patient }: { patient: Patient }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    first_name: patient.first_name,
    last_name: patient.last_name,
    rut: patient.rut ?? '',
    email: patient.email ?? '',
    phone: patient.phone ?? '',
    birth_date: patient.birth_date ?? '',
    gender: patient.gender ?? '',
    address: patient.address ?? '',
    specialty: patient.specialty,
    status: patient.status,
    notes: patient.notes ?? '',
    emergency_contact_name: patient.emergency_contact_name ?? '',
    emergency_contact_phone: patient.emergency_contact_phone ?? '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('patients').update({
      ...form,
      birth_date: form.birth_date || null,
      gender: (form.gender || null) as any,
    }).eq('id', patient.id)

    if (error) { toast.error('Error: ' + error.message); setLoading(false); return }
    toast.success('Paciente actualizado')
    router.push(`/pacientes/${patient.id}`)
    router.refresh()
  }

  return (
    <div className="animate-in max-w-3xl">
      <div className="flex items-center gap-4 mb-7">
        <Link href={`/pacientes/${patient.id}`} className="btn-ghost">
          <ArrowLeft size={16} /> Volver
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Editar Paciente</h1>
          <p className="text-sm text-slate-400 mt-0.5">{patient.first_name} {patient.last_name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-6">
          <h2 className="font-display font-bold text-slate-700 mb-4">Datos Personales</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Nombres *</label>
              <input className="form-input" required value={form.first_name} onChange={set('first_name')} /></div>
            <div><label className="form-label">Apellidos *</label>
              <input className="form-input" required value={form.last_name} onChange={set('last_name')} /></div>
            <div><label className="form-label">RUT</label>
              <input className="form-input" value={form.rut} onChange={set('rut')} /></div>
            <div><label className="form-label">Fecha Nacimiento</label>
              <input type="date" className="form-input" value={form.birth_date} onChange={set('birth_date')} /></div>
            <div><label className="form-label">Género</label>
              <select className="form-input" value={form.gender} onChange={set('gender')}>
                <option value="">Seleccionar...</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select></div>
            <div><label className="form-label">Teléfono</label>
              <input className="form-input" value={form.phone} onChange={set('phone')} /></div>
            <div><label className="form-label">Email</label>
              <input type="email" className="form-input" value={form.email} onChange={set('email')} /></div>
            <div><label className="form-label">Dirección</label>
              <input className="form-input" value={form.address} onChange={set('address')} /></div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display font-bold text-slate-700 mb-4">Información Clínica</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Especialidad *</label>
              <select className="form-input" required value={form.specialty} onChange={set('specialty')}>
                {SPECIALTIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select></div>
            <div><label className="form-label">Estado</label>
              <select className="form-input" value={form.status} onChange={set('status')}>
                <option value="activo">Activo</option>
                <option value="pendiente">Pendiente</option>
                <option value="alta">Alta médica</option>
                <option value="suspendido">Suspendido</option>
              </select></div>
            <div className="col-span-2"><label className="form-label">Notas clínicas</label>
              <textarea className="form-input" rows={4} value={form.notes} onChange={set('notes')} /></div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display font-bold text-slate-700 mb-4">Contacto de Emergencia</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Nombre</label>
              <input className="form-input" value={form.emergency_contact_name} onChange={set('emergency_contact_name')} /></div>
            <div><label className="form-label">Teléfono</label>
              <input className="form-input" value={form.emergency_contact_phone} onChange={set('emergency_contact_phone')} /></div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-4">
          <Link href={`/pacientes/${patient.id}`} className="btn-outline">Cancelar</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Guardando...' : <><Save size={16} /> Guardar Cambios</>}
          </button>
        </div>
      </form>
    </div>
  )
}
