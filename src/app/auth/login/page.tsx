'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Stethoscope } from 'lucide-react'
import toast from 'react-hot-toast'

const SUPERADMIN_EMAIL = 'diego.castillo.p11@gmail.com'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [companyName, setCompanyName] = useState('ClinivigilIA')
  const [form, setForm] = useState({ email: '', password: '' })

  useEffect(() => {
    createClient()
      .from('landing_config').select('logo_url, company_name').eq('id', 'main').single()
      .then(({ data }) => {
        if (data?.logo_url) setLogoUrl(data.logo_url)
        if (data?.company_name) setCompanyName(data.company_name)
      })
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email, password: form.password,
    })
    if (error) {
      toast.error(error.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : error.message)
      setLoading(false)
      return
    }
    toast.success('¡Bienvenido!')
    if (data.user?.email === SUPERADMIN_EMAIL) router.push('/admin')
    else router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="card p-8 shadow-xl shadow-sky-100">
      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        {logoUrl ? (
          <img src={logoUrl} alt={companyName} className="h-14 object-contain mb-3" />
        ) : (
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
            <Stethoscope size={26} className="text-white" />
          </div>
        )}
        <h1 className="font-display text-xl font-black text-slate-800">
          {companyName.replace('IA', '')}<span style={{ color: '#0ea5e9' }}>IA</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">Sistema de Seguimiento de Pacientes</p>
      </div>

      <h2 className="font-display text-lg font-bold text-slate-800 mb-1">Iniciar sesión</h2>
      <p className="text-sm text-slate-400 mb-6">Accede a tu panel</p>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="form-label">Correo electrónico</label>
          <input type="email" required className="form-input" placeholder="email@clinica.com"
            value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        </div>
        <div>
          <label className="form-label">Contraseña</label>
          <input type="password" required className="form-input" placeholder="••••••••"
            value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Ingresando...
            </span>
          ) : 'Entrar al sistema'}
        </button>
      </form>
    </div>
  )
}