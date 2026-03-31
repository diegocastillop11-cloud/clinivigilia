'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm: '', specialty: ''
  })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Las contraseñas no coinciden'); return }
    if (form.password.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return }

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, specialty: form.specialty } }
    })

    if (error) { toast.error(error.message); setLoading(false); return }

    toast.success('¡Cuenta creada! Redirigiendo...')
    router.push('/dashboard')
    router.refresh()
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="card p-8 shadow-xl shadow-sky-100">
      <h2 className="font-display text-xl font-bold text-slate-800 mb-1">Crear cuenta médica</h2>
      <p className="text-sm text-slate-400 mb-6">Registro de profesional de salud</p>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="form-label">Nombre completo *</label>
          <input type="text" required className="form-input"
            placeholder="Dr. Juan Pérez" value={form.full_name} onChange={set('full_name')} />
        </div>

        <div>
          <label className="form-label">Especialidad</label>
          <select className="form-input" value={form.specialty} onChange={set('specialty')}>
            <option value="">Seleccionar...</option>
            <option value="cardiologia">Cardiología</option>
            <option value="neurologia">Neurología</option>
            <option value="oncologia">Oncología</option>
            <option value="pediatria">Pediatría</option>
            <option value="ortopedia">Ortopedia</option>
            <option value="endocrinologia">Endocrinología</option>
            <option value="ginecologia">Ginecología</option>
            <option value="dermatologia">Dermatología</option>
            <option value="psiquiatria">Psiquiatría</option>
            <option value="medicina_general">Medicina General</option>
          </select>
        </div>

        <div>
          <label className="form-label">Correo electrónico *</label>
          <input type="email" required className="form-input"
            placeholder="doctor@clinica.com" value={form.email} onChange={set('email')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Contraseña *</label>
            <input type="password" required className="form-input"
              placeholder="••••••••" value={form.password} onChange={set('password')} />
          </div>
          <div>
            <label className="form-label">Confirmar *</label>
            <input type="password" required className="form-input"
              placeholder="••••••••" value={form.confirm} onChange={set('confirm')} />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="text-sky-600 font-semibold hover:text-sky-700">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
