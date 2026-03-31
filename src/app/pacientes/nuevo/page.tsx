'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, User } from 'lucide-react'
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

export default function NewPatientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    first_name: '', last_name: '', rut: '', email: '', phone: '',
    birth_date: '', gender: '', address: '', specialty: '', status: 'activo',
    notes: '', emergency_contact_name: '', emergency_contact_phone: '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.first_name || !form.last_name || !form.specialty) {
      toast.error('Nombre, apellido y especialidad son obligatorios')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { error } = await supabase.from('patients').insert({
      ...form,
      doctor_id: user.id,
      birth_date: form.birth_date || null,
      gender: (form.gender || null) as any,
    })

    if (error) { toast.error('Error al guardar: ' + error.message); setLoading(false); return }
    toast.success(`${form.first_name} ${form.last_name} registrado exitosamente`)
    router.push('/pacientes')
    router.refresh()
  }

  return (
    <div className="animate-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-7">
        <Link href="/pacientes" className="btn-ghost">
          <ArrowLeft size={16} /> Volver
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Nuevo Paciente</h1>
          <p className="text-sm text-slate-400 mt-0.5">Completa la información del paciente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Datos personales */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <User size={16} className="text-sky-500" />
            <h2 className="font-display font-bold text-slate-700">Datos Personales</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nombres *</label>
              <input className="form-input" placeholder="Juan Carlos" required
                value={form.first_name} onChange={set('first_name')} />
            </div>
            <div>
              <label className="form-label">Apellidos *</label>
              <input className="form-input" placeholder="González López" required
                value={form.last_name} onChange={set('last_name')} />
            </div>
            <div>
              <label className="form-label">RUT / Identificación</label>
              <input className="form-input" placeholder="12.345.678-9"
                value={form.rut} onChange={set('rut')} />
            </div>
            <div>
              <label className="form-label">Fecha de Nacimiento</label>
              <input type="date" className="form-input"
                value={form.birth_date} onChange={set('birth_date')} />
            </div>
            <div>
              <label className="form-label">Género</label>
              <select className="form-input" value={form.gender} onChange={set('gender')}>
                <option value="">Seleccionar...</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="form-label">Teléfono</label>
              <input className="form-input" placeholder="+56 9 1234 5678"
                value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="form-label">Correo Electrónico</label>
              <input type="email" className="form-input" placeholder="paciente@email.com"
                value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="form-label">Dirección</label>
              <input className="form-input" placeholder="Av. Principal 123, Santiago"
                value={form.address} onChange={set('address')} />
            </div>
          </div>
        </div>

        {/* Información clínica */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-sky-500">🩺</span>
            <h2 className="font-display font-bold text-slate-700">Información Clínica</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Especialidad / Tratamiento *</label>
              <select className="form-input" required value={form.specialty} onChange={set('specialty')}>
                <option value="">Seleccionar especialidad...</option>
                {SPECIALTIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Estado</label>
              <select className="form-input" value={form.status} onChange={set('status')}>
                <option value="activo">Activo — En tratamiento</option>
                <option value="pendiente">Pendiente — En evaluación</option>
                <option value="alta">Alta médica</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="form-label">Notas clínicas / Diagnóstico inicial</label>
              <textarea className="form-input min-h-[100px]" rows={4}
                placeholder="Diagnóstico, antecedentes relevantes, indicaciones iniciales..."
                value={form.notes} onChange={set('notes')} />
            </div>
          </div>
        </div>

        {/* Contacto de emergencia */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-sky-500">🆘</span>
            <h2 className="font-display font-bold text-slate-700">Contacto de Emergencia</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nombre completo</label>
              <input className="form-input" placeholder="María González"
                value={form.emergency_contact_name} onChange={set('emergency_contact_name')} />
            </div>
            <div>
              <label className="form-label">Teléfono</label>
              <input className="form-input" placeholder="+56 9 8765 4321"
                value={form.emergency_contact_phone} onChange={set('emergency_contact_phone')} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-4">
          <Link href="/pacientes" className="btn-outline">Cancelar</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg> Guardando...</>
            ) : <><Save size={16} /> Guardar Paciente</>}
          </button>
        </div>
      </form>
    </div>
  )
}
