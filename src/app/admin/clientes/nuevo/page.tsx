'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, UserPlus, Key, Building2, Stethoscope, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const ALL_MODULES = [
  { id: 'patients',     label: 'Pacientes',          icon: '👥' },
  { id: 'appointments', label: 'Citas',               icon: '📅' },
  { id: 'followups',    label: 'Seguimiento',         icon: '📋' },
  { id: 'reports',      label: 'Reportes',            icon: '📊' },
  { id: 'email',        label: 'Correos Automáticos', icon: '✉️' },
  { id: 'ai',           label: 'Inteligencia IA',     icon: '🤖' },
]

const PLAN_MODULES: Record<string, string[]> = {
  free:       ['patients','appointments','followups'],
  pro:        ['patients','appointments','followups','reports','email'],
  premium:    ['patients','appointments','followups','reports','email','ai'],
  enterprise: ['patients','appointments','followups','reports','email','ai'],
}

const PLANS = [
  { value: 'free',       label: 'Free',       color: '#94a3b8' },
  { value: 'pro',        label: 'Pro',        color: '#60a5fa' },
  { value: 'premium',    label: 'Premium',    color: '#a5b4fc' },
  { value: 'enterprise', label: 'Enterprise', color: '#6ee7b7' },
]

type AccountType = 'doctor' | 'clinic'
type CreateMode = 'with_password' | 'magic_link'

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

// ── RUT helpers ────────────────────────────────────────────────
function formatRut(value: string): string {
  // Eliminar todo excepto números, k y K
  let clean = value.replace(/[^0-9kK]/g, '').toUpperCase()
  if (clean.length === 0) return ''
  // Separar dígito verificador
  const dv = clean.slice(-1)
  let body = clean.slice(0, -1)
  // Formatear con puntos
  body = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${body}-${dv}`
}

function validateRut(rut: string): boolean {
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase()
  if (clean.length < 2) return false
  const dv = clean.slice(-1)
  const body = clean.slice(0, -1)
  if (!/^\d+$/.test(body)) return false
  // Calcular dígito verificador
  let sum = 0
  let multiplier = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }
  const remainder = 11 - (sum % 11)
  const expected = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder)
  return dv === expected
}

export default function NewClientPage() {
  const router = useRouter()
  const [accountType, setAccountType] = useState<AccountType | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<CreateMode>('with_password')
  const [specialties, setSpecialties] = useState<{value:string,label:string}[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [rutError, setRutError] = useState('')

  // Formulario doctor
  const [doctorForm, setDoctorForm] = useState({
    full_name: '', email: '', password: '', rut: '',
    specialty: '', clinic_name: '', phone: '',
    plan: 'free' as string,
    status: 'active' as string,
    expires_at: '',
    enabled_modules: ['patients','appointments','followups'] as string[],
    notes: '',
  })

  // Formulario clínica
  const [clinicForm, setClinicForm] = useState({
    clinic_name: '', email: '', password: '', rut: '',
    admin_name: '', phone: '', address: '',
    plan: 'free' as string,
    status: 'active' as string,
    max_doctors: '5',
    expires_at: '',
    enabled_modules: ['patients','appointments','followups'] as string[],
    notes: '',
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('specialties').select('name,slug').eq('active', true).order('name')
      if (data) setSpecialties(data.map((s: { name: string; slug: string }) => ({ value: s.slug, label: s.name })))
    }
    load()
  }, [])

  const setDoctor = (k: string) => (e: React.ChangeEvent<any>) =>
    setDoctorForm(p => ({ ...p, [k]: e.target.value }))

  const setClinic = (k: string) => (e: React.ChangeEvent<any>) =>
    setClinicForm(p => ({ ...p, [k]: e.target.value }))

  // Handler especial para RUT con formato automático
  const handleRutChange = (form: 'doctor' | 'clinic') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value)
    if (form === 'doctor') {
      setDoctorForm(p => ({ ...p, rut: formatted }))
    } else {
      setClinicForm(p => ({ ...p, rut: formatted }))
    }
    // Validar solo si tiene longitud suficiente
    const clean = e.target.value.replace(/[^0-9kK]/g, '')
    if (clean.length >= 7) {
      setRutError(validateRut(formatted) ? '' : 'RUT inválido')
    } else {
      setRutError('')
    }
  }

  const handleDoctorPlan = (plan: string) =>
    setDoctorForm(p => ({ ...p, plan, enabled_modules: PLAN_MODULES[plan] }))

  const handleClinicPlan = (plan: string) =>
    setClinicForm(p => ({ ...p, plan, enabled_modules: PLAN_MODULES[plan] }))

  const toggleDoctorModule = (id: string) =>
    setDoctorForm(p => ({
      ...p,
      enabled_modules: p.enabled_modules.includes(id)
        ? p.enabled_modules.filter(m => m !== id)
        : [...p.enabled_modules, id],
    }))

  const toggleClinicModule = (id: string) =>
    setClinicForm(p => ({
      ...p,
      enabled_modules: p.enabled_modules.includes(id)
        ? p.enabled_modules.filter(m => m !== id)
        : [...p.enabled_modules, id],
    }))

  // ── Submit Doctor ──────────────────────────────────────────
  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctorForm.full_name || !doctorForm.email) { toast.error('Nombre y email son obligatorios'); return }
    if (mode === 'with_password' && doctorForm.password.length < 6) { toast.error('Contraseña mínimo 6 caracteres'); return }
    if (doctorForm.rut && !validateRut(doctorForm.rut)) { toast.error('RUT inválido'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/create-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...doctorForm, mode, account_type: 'independent' }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Error al crear'); setLoading(false); return }
      toast.success(`✅ Doctor ${doctorForm.full_name} creado correctamente`)
      router.push('/admin/clientes')
      router.refresh()
    } catch { toast.error('Error de conexión'); setLoading(false) }
  }

  // ── Submit Clínica ─────────────────────────────────────────
  const handleClinicSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clinicForm.clinic_name || !clinicForm.email || !clinicForm.admin_name) {
      toast.error('Nombre de clínica, email y nombre del admin son obligatorios'); return
    }
    if (mode === 'with_password' && clinicForm.password.length < 6) { toast.error('Contraseña mínimo 6 caracteres'); return }
    if (clinicForm.rut && !validateRut(clinicForm.rut)) { toast.error('RUT inválido'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/create-clinic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...clinicForm, mode }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Error al crear clínica'); setLoading(false); return }
      toast.success(`🏥 Clínica "${clinicForm.clinic_name}" creada correctamente`)
      router.push('/admin/clientes')
      router.refresh()
    } catch { toast.error('Error de conexión'); setLoading(false) }
  }

  // ── Selector de tipo ───────────────────────────────────────
  if (!accountType) {
    return (
      <div style={{ color: '#f1f5f9', maxWidth: '720px' }}>
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/clientes">
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}>
              <ArrowLeft size={16} /> Volver
            </button>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Nuevo Cliente</h1>
            <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>¿Qué tipo de cliente quieres crear?</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <button
            onClick={() => setAccountType('doctor')}
            className="group p-7 rounded-3xl text-left transition-all duration-300 hover:-translate-y-1"
            style={{ background: '#1e293b', border: '2px solid #334155' }}
            onMouseEnter={e => (e.currentTarget.style.border = '2px solid #818cf8')}
            onMouseLeave={e => (e.currentTarget.style.border = '2px solid #334155')}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(129,140,248,0.15)' }}>
              <Stethoscope size={26} style={{ color: '#818cf8' }} />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Doctor Independiente</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
              Un médico que usa la plataforma de forma individual. Tú administras su cuenta, plan y módulos.
            </p>
            <div className="mt-5 space-y-1.5">
              {['Cuenta personal del doctor','Tú gestionas su licencia','Acceso a su panel /dashboard'].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#818cf8' }} />
                  <span className="text-xs" style={{ color: '#475569' }}>{f}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold" style={{ color: '#818cf8' }}>
              Crear doctor <ArrowLeft size={14} className="rotate-180" />
            </div>
          </button>

          <button
            onClick={() => setAccountType('clinic')}
            className="group p-7 rounded-3xl text-left transition-all duration-300 hover:-translate-y-1"
            style={{ background: '#1e293b', border: '2px solid #334155' }}
            onMouseEnter={e => (e.currentTarget.style.border = '2px solid #10b981')}
            onMouseLeave={e => (e.currentTarget.style.border = '2px solid #334155')}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(16,185,129,0.15)' }}>
              <Building2 size={26} style={{ color: '#10b981' }} />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Clínica</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
              Una clínica con múltiples médicos. El admin de la clínica crea y gestiona a sus propios doctores.
            </p>
            <div className="mt-5 space-y-1.5">
              {['Admin de clínica con panel propio','Crea y gestiona sus médicos','Todos heredan el plan de la clínica'].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
                  <span className="text-xs" style={{ color: '#475569' }}>{f}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold" style={{ color: '#10b981' }}>
              Crear clínica <ArrowLeft size={14} className="rotate-180" />
            </div>
          </button>
        </div>
      </div>
    )
  }

  const isClinic = accountType === 'clinic'
  const accentColor = isClinic ? '#10b981' : '#818cf8'
  const currentModules = isClinic ? clinicForm.enabled_modules : doctorForm.enabled_modules
  const currentPlan = isClinic ? clinicForm.plan : doctorForm.plan
  const currentRut = isClinic ? clinicForm.rut : doctorForm.rut

  return (
    <div style={{ color: '#f1f5f9', maxWidth: '720px' }}>
      <div className="flex items-center gap-4 mb-7">
        <button onClick={() => setAccountType(null)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}>
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${accentColor}20` }}>
            {isClinic ? <Building2 size={18} style={{ color: accentColor }} /> : <Stethoscope size={18} style={{ color: accentColor }} />}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white">
              Nueva {isClinic ? 'Clínica' : 'Cuenta de Doctor'}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
              {isClinic ? 'El admin podrá crear y gestionar médicos en su panel' : 'Doctor independiente administrado por ti'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={isClinic ? handleClinicSubmit : handleDoctorSubmit} className="space-y-5">

        {/* Modo de creación */}
        <div className="rounded-2xl p-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <h2 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
            <Key size={15} style={{ color: accentColor }} /> Método de acceso
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'with_password', label: 'Con contraseña', desc: 'Tú defines la contraseña y se la compartes', icon: '🔑' },
              { value: 'magic_link', label: 'Link de invitación', desc: 'Recibe email para activar su cuenta', icon: '✉️' },
            ].map(opt => (
              <button key={opt.value} type="button" onClick={() => setMode(opt.value as CreateMode)}
                className="flex items-start gap-3 p-4 rounded-xl text-left transition-all"
                style={{
                  border: `2px solid ${mode === opt.value ? accentColor : '#334155'}`,
                  background: mode === opt.value ? `${accentColor}10` : '#0f172a',
                }}>
                <span style={{ fontSize: 18 }}>{opt.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{opt.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── FORMULARIO DOCTOR ── */}
        {!isClinic && (
          <div className="rounded-2xl p-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h2 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
              <UserPlus size={15} style={{ color: accentColor }} /> Datos del Doctor
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Nombre completo *</label>
                <input style={inputStyle} placeholder="Dr. Juan Pérez" required value={doctorForm.full_name} onChange={setDoctor('full_name')} />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" style={inputStyle} placeholder="doctor@clinica.com" required value={doctorForm.email} onChange={setDoctor('email')} />
              </div>

              {/* RUT */}
              <div>
                <label style={labelStyle}>RUT <span style={{ color: '#475569', fontWeight: 400 }}>(opcional)</span></label>
                <input
                  style={{
                    ...inputStyle,
                    border: `1.5px solid ${rutError ? '#ef4444' : currentRut && validateRut(currentRut) ? '#10b981' : '#334155'}`,
                  }}
                  placeholder="12.345.678-9"
                  value={doctorForm.rut}
                  onChange={handleRutChange('doctor')}
                  maxLength={12}
                />
                {rutError && <p className="text-[11px] mt-1" style={{ color: '#ef4444' }}>{rutError}</p>}
                {!rutError && doctorForm.rut && validateRut(doctorForm.rut) && (
                  <p className="text-[11px] mt-1" style={{ color: '#10b981' }}>✓ RUT válido</p>
                )}
              </div>

              {/* Contraseña con ojito */}
              {mode === 'with_password' && (
                <div>
                  <label style={labelStyle}>Contraseña *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      style={{ ...inputStyle, paddingRight: '40px' }}
                      placeholder="mínimo 6 caracteres"
                      value={doctorForm.password}
                      onChange={setDoctor('password')}
                    />
                    <button type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80">
                      {showPassword
                        ? <EyeOff size={14} style={{ color: '#475569' }} />
                        : <Eye size={14} style={{ color: '#475569' }} />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label style={labelStyle}>Especialidad</label>
                <select style={inputStyle} value={doctorForm.specialty} onChange={setDoctor('specialty')}>
                  <option value="">Seleccionar...</option>
                  {specialties.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Nombre de la Clínica</label>
                <input style={inputStyle} placeholder="Clínica San José" value={doctorForm.clinic_name} onChange={setDoctor('clinic_name')} />
              </div>
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input style={inputStyle} placeholder="+56 9..." value={doctorForm.phone} onChange={setDoctor('phone')} />
              </div>
            </div>
          </div>
        )}

        {/* ── FORMULARIO CLÍNICA ── */}
        {isClinic && (
          <div className="rounded-2xl p-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h2 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
              <Building2 size={15} style={{ color: accentColor }} /> Datos de la Clínica
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Nombre de la clínica *</label>
                <input style={inputStyle} placeholder="Clínica San José" required value={clinicForm.clinic_name} onChange={setClinic('clinic_name')} />
              </div>
              <div>
                <label style={labelStyle}>Email del admin *</label>
                <input type="email" style={inputStyle} placeholder="admin@clinica.com" required value={clinicForm.email} onChange={setClinic('email')} />
              </div>
              <div>
                <label style={labelStyle}>Nombre del administrador *</label>
                <input style={inputStyle} placeholder="Dr. María González" required value={clinicForm.admin_name} onChange={setClinic('admin_name')} />
              </div>

              {/* RUT clínica */}
              <div>
                <label style={labelStyle}>RUT <span style={{ color: '#475569', fontWeight: 400 }}>(opcional)</span></label>
                <input
                  style={{
                    ...inputStyle,
                    border: `1.5px solid ${rutError ? '#ef4444' : currentRut && validateRut(currentRut) ? '#10b981' : '#334155'}`,
                  }}
                  placeholder="12.345.678-9"
                  value={clinicForm.rut}
                  onChange={handleRutChange('clinic')}
                  maxLength={12}
                />
                {rutError && <p className="text-[11px] mt-1" style={{ color: '#ef4444' }}>{rutError}</p>}
                {!rutError && clinicForm.rut && validateRut(clinicForm.rut) && (
                  <p className="text-[11px] mt-1" style={{ color: '#10b981' }}>✓ RUT válido</p>
                )}
              </div>

              <div>
                <label style={labelStyle}>Teléfono</label>
                <input style={inputStyle} placeholder="+56 2..." value={clinicForm.phone} onChange={setClinic('phone')} />
              </div>

              {/* Contraseña clínica con ojito */}
              {mode === 'with_password' && (
                <div>
                  <label style={labelStyle}>Contraseña *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      style={{ ...inputStyle, paddingRight: '40px' }}
                      placeholder="mínimo 6 caracteres"
                      value={clinicForm.password}
                      onChange={setClinic('password')}
                    />
                    <button type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80">
                      {showPassword
                        ? <EyeOff size={14} style={{ color: '#475569' }} />
                        : <Eye size={14} style={{ color: '#475569' }} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="col-span-2">
                <label style={labelStyle}>Dirección</label>
                <input style={inputStyle} placeholder="Av. Providencia 1234, Santiago" value={clinicForm.address} onChange={setClinic('address')} />
              </div>
              <div>
                <label style={labelStyle}>Máximo de médicos</label>
                <input type="number" min="1" max="500" style={inputStyle}
                  value={clinicForm.max_doctors} onChange={setClinic('max_doctors')} />
              </div>
            </div>
          </div>
        )}

        {/* Plan y licencia */}
        <div className="rounded-2xl p-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <h2 className="font-bold text-sm text-white mb-4">🎫 Plan y Licencia</h2>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="col-span-2">
              <label style={labelStyle}>Plan</label>
              <div className="grid grid-cols-4 gap-2">
                {PLANS.map(p => (
                  <button key={p.value} type="button"
                    onClick={() => isClinic ? handleClinicPlan(p.value) : handleDoctorPlan(p.value)}
                    className="py-2.5 rounded-xl text-sm font-bold uppercase tracking-wide transition-all"
                    style={{
                      border: `2px solid ${currentPlan === p.value ? p.color : '#334155'}`,
                      background: currentPlan === p.value ? p.color + '20' : '#0f172a',
                      color: currentPlan === p.value ? p.color : '#475569',
                    }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Estado</label>
              <select style={inputStyle}
                value={isClinic ? clinicForm.status : doctorForm.status}
                onChange={isClinic ? setClinic('status') : setDoctor('status')}>
                <option value="active">Activo</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspendido</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Fecha de vencimiento</label>
              <input type="date" style={inputStyle}
                value={isClinic ? clinicForm.expires_at : doctorForm.expires_at}
                onChange={isClinic ? setClinic('expires_at') : setDoctor('expires_at')} />
            </div>
          </div>

          <label style={labelStyle}>Módulos habilitados</label>
          <div className="grid grid-cols-3 gap-2">
            {ALL_MODULES.map(m => {
              const enabled = currentModules.includes(m.id)
              return (
                <button key={m.id} type="button"
                  onClick={() => isClinic ? toggleClinicModule(m.id) : toggleDoctorModule(m.id)}
                  className="flex items-center gap-2 p-3 rounded-xl text-left transition-all"
                  style={{
                    border: `1.5px solid ${enabled ? accentColor : '#334155'}`,
                    background: enabled ? `${accentColor}12` : '#0f172a',
                  }}>
                  <span style={{ fontSize: 16 }}>{m.icon}</span>
                  <p className="text-xs font-semibold flex-1" style={{ color: enabled ? '#f1f5f9' : '#64748b' }}>
                    {m.label}
                  </p>
                  <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: enabled ? accentColor : '#1e293b', border: `1px solid ${enabled ? accentColor : '#334155'}` }}>
                    {enabled && <span className="text-white text-[10px] font-bold">✓</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Notas */}
        <div className="rounded-2xl p-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <h2 className="font-bold text-sm text-white mb-4">📝 Notas internas</h2>
          <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' } as any}
            placeholder="Notas sobre el cliente, acuerdos comerciales, etc..."
            value={isClinic ? clinicForm.notes : doctorForm.notes}
            onChange={isClinic ? setClinic('notes') : setDoctor('notes')} />
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 pb-6">
          <button type="button" onClick={() => setAccountType(null)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8' }}>
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${accentColor}, ${isClinic ? '#059669' : '#6366f1'})`, boxShadow: `0 4px 16px ${accentColor}40` }}>
            {loading ? 'Creando...' : <><Save size={15} /> Crear {isClinic ? 'Clínica' : 'Doctor'}</>}
          </button>
        </div>
      </form>
    </div>
  )
}