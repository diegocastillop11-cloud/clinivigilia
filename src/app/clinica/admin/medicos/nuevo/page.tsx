'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Save, UserPlus, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const inputStyle = {
  background: '#0f172a', border: '1.5px solid #334155', color: '#f1f5f9',
  borderRadius: '12px', padding: '10px 14px', fontSize: '13px',
  outline: 'none', width: '100%', fontFamily: 'DM Sans, sans-serif',
}
const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: '600' as const,
  color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
}

// ─── Validación RUT chileno ───────────────────────────────────
function formatRut(value: string): string {
  const clean = value.replace(/[^0-9kK]/g, '').toUpperCase()
  if (clean.length < 2) return clean
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formatted}-${dv}`
}

function validateRut(rut: string): boolean {
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase()
  if (clean.length < 2) return false
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  if (!/^\d+$/.test(body)) return false

  let sum = 0
  let multiplier = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }
  const remainder = sum % 11
  const expected = remainder === 0 ? '0' : remainder === 1 ? 'K' : String(11 - remainder)
  return dv === expected
}

export default function NuevoMedicoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clinic, setClinic] = useState<any>(null)
  const [specialties, setSpecialties] = useState<{value:string,label:string}[]>([])
  const [mode, setMode] = useState<'with_password'|'magic_link'>('with_password')
  const [rutValue, setRutValue] = useState('')
  const [rutValid, setRutValid] = useState<boolean | null>(null)
  const [form, setForm] = useState({
    full_name: '', email: '', password: '',
    specialty: '', phone: '', rut: '',
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: c } = await supabase.from('clinics').select('*').eq('admin_id', user.id).single()
      setClinic(c)
      const { data: s } = await supabase.from('specialties').select('name,slug').eq('active', true).order('name')
      if (s) setSpecialties(s.map(x => ({ value: x.slug, label: x.name })))
    }
    load()
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<any>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9kK]/g, '')
    if (raw.length > 9) return
    const formatted = formatRut(raw)
    setRutValue(formatted)
    setForm(p => ({ ...p, rut: formatted }))
    if (raw.length >= 7) {
      setRutValid(validateRut(formatted))
    } else {
      setRutValid(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name || !form.email) { toast.error('Nombre y email son obligatorios'); return }
    if (mode === 'with_password' && form.password.length < 6) { toast.error('Contraseña mínimo 6 caracteres'); return }
    if (!clinic) { toast.error('No se encontró la clínica'); return }
    if (form.rut && !validateRut(form.rut)) { toast.error('El RUT ingresado no es válido'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/clinica/create-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, mode, clinic_id: clinic.id }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Error al crear médico'); setLoading(false); return }
      toast.success(`✅ Dr. ${form.full_name} agregado a ${clinic.name}`)
      router.push('/clinica/admin/medicos')
      router.refresh()
    } catch { toast.error('Error de conexión'); setLoading(false) }
  }

  return (
    <div style={{ color: '#f1f5f9', maxWidth: '600px' }}>
      <div className="flex items-center gap-4 mb-7">
        <Link href="/clinica/admin/medicos">
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}>
            <ArrowLeft size={16} /> Volver
          </button>
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold text-white">Agregar Médico</h1>
          <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
            {clinic ? `Clínica: ${clinic.name}` : 'Cargando...'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Método */}
        <div className="rounded-2xl p-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <h2 className="font-bold text-sm text-white mb-4">Método de acceso</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'with_password', label: 'Con contraseña', icon: '🔑' },
              { value: 'magic_link', label: 'Link de invitación', icon: '✉️' },
            ].map(opt => (
              <button key={opt.value} type="button" onClick={() => setMode(opt.value as any)}
                className="flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                style={{
                  border: `2px solid ${mode === opt.value ? '#10b981' : '#334155'}`,
                  background: mode === opt.value ? 'rgba(16,185,129,0.1)' : '#0f172a',
                }}>
                <span style={{ fontSize: 18 }}>{opt.icon}</span>
                <p className="text-sm font-semibold text-white">{opt.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Datos */}
        <div className="rounded-2xl p-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <h2 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
            <UserPlus size={15} style={{ color: '#10b981' }} /> Datos del Médico
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Nombre completo *</label>
              <input style={inputStyle} placeholder="Dr. Juan Pérez" required value={form.full_name} onChange={set('full_name')} />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input type="email" style={inputStyle} placeholder="doctor@clinica.com" required value={form.email} onChange={set('email')} />
            </div>

            {/* RUT con validación */}
            <div>
              <label style={labelStyle}>RUT</label>
              <div className="relative">
                <input
                  value={rutValue}
                  onChange={handleRutChange}
                  placeholder="12.345.678-9"
                  style={{
                    ...inputStyle,
                    paddingRight: '40px',
                    borderColor: rutValid === null ? '#334155' : rutValid ? '#10b981' : '#ef4444',
                  }}
                />
                {rutValid !== null && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {rutValid
                      ? <CheckCircle size={16} style={{ color: '#10b981' }} />
                      : <XCircle size={16} style={{ color: '#ef4444' }} />}
                  </div>
                )}
              </div>
              {rutValid === false && (
                <p className="text-[10px] mt-1" style={{ color: '#ef4444' }}>RUT inválido — verifica el dígito verificador</p>
              )}
              {rutValid === true && (
                <p className="text-[10px] mt-1" style={{ color: '#10b981' }}>RUT válido ✓</p>
              )}
            </div>

            <div>
              <label style={labelStyle}>Teléfono</label>
              <input style={inputStyle} placeholder="+56 9..." value={form.phone} onChange={set('phone')} />
            </div>

            {mode === 'with_password' && (
              <div className="col-span-2">
                <label style={labelStyle}>Contraseña *</label>
                <input type="password" style={{ ...inputStyle, width: '50%' }}
                  placeholder="mínimo 6 caracteres" value={form.password} onChange={set('password')} />
              </div>
            )}

            <div>
              <label style={labelStyle}>Especialidad</label>
              <select style={inputStyle} value={form.specialty} onChange={set('specialty')}>
                <option value="">Seleccionar...</option>
                {specialties.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Info herencia */}
        <div className="p-4 rounded-xl flex items-start gap-3"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <span style={{ fontSize: 18 }}>ℹ️</span>
          <p className="text-xs leading-relaxed" style={{ color: '#6ee7b7' }}>
            El médico heredará automáticamente el plan <strong>{clinic?.plan?.toUpperCase()}</strong> y
            los módulos de tu clínica. Podrá acceder desde <strong>/dashboard</strong> con sus credenciales.
          </p>
        </div>

        <div className="flex justify-end gap-3 pb-6">
          <Link href="/clinica/admin/medicos">
            <button type="button" className="px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8' }}>
              Cancelar
            </button>
          </Link>
          <button type="submit" disabled={loading || rutValid === false}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
            {loading ? 'Creando...' : <><Save size={15} /> Agregar Médico</>}
          </button>
        </div>
      </form>
    </div>
  )
}