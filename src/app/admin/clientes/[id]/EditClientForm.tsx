'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Trash2, RotateCcw, Mail, Key, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const ALL_MODULES = [
  { id: 'patients',     label: 'Pacientes',          icon: '👥' },
  { id: 'appointments', label: 'Citas',               icon: '📅' },
  { id: 'followups',    label: 'Seguimiento',         icon: '📋' },
  { id: 'reports',      label: 'Reportes',            icon: '📊' },
  { id: 'email',        label: 'Correos Automáticos', icon: '✉️' },
  { id: 'ai',           label: 'Inteligencia IA',     icon: '🤖' },
  { id: 'gestor_web',   label: 'Gestor Web',          icon: '🌐' },
]

const PLAN_MODULES: Record<string, string[]> = {
  free:       ['patients','appointments','followups'],
  pro:        ['patients','appointments','followups','reports','email'],
  premium:    ['patients','appointments','followups','reports','email','ai'],
  enterprise: ['patients','appointments','followups','reports','email','ai'],
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function EditClientForm({ client, license, clinic }: { client: any; license: any; clinic?: any }) {
  const router = useRouter()
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [showDeletePassword, setShowDeletePassword] = useState(false)
  const [verifyingDelete, setVerifyingDelete] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [specialties, setSpecialties] = useState<{value:string,label:string}[]>([])
  const [clientEmail, setClientEmail] = useState<string>('')

  const [profile, setProfile] = useState({
    full_name:   client.full_name   ?? '',
    specialty:   client.specialty   ?? '',
    clinic_name: client.clinic_name ?? '',
    phone:       client.phone       ?? '',
    max_doctors: clinic?.max_doctors ?? 5,
  })
  const [lic, setLic] = useState({
    plan:            (license?.plan            ?? 'free') as string,
    status:          (license?.status          ?? 'active') as string,
    expires_at:      license?.expires_at ? license.expires_at.slice(0,10) : '',
    enabled_modules: (license?.enabled_modules ?? ['patients','appointments','followups']) as string[],
    notes:           license?.notes ?? '',
  })
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    const load = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any
      const { data: specs } = await supabase
        .from('specialties').select('name,slug').eq('active', true).order('name')
      if (specs) setSpecialties(specs.map((s: { name: string; slug: string }) => ({ value: s.slug, label: s.name })))

      const res = await fetch(`/api/admin/get-client-email?id=${client.id}`)
      if (res.ok) {
        const data = await res.json()
        setClientEmail(data.email ?? '')
      }
    }
    load()
  }, [client.id])

  const setP = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setProfile(p => ({ ...p, [k]: e.target.value }))
  const setL = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setLic(p => ({ ...p, [k]: e.target.value }))

  const handlePlanChange = (plan: string) =>
    setLic(p => ({ ...p, plan, enabled_modules: PLAN_MODULES[plan] ?? p.enabled_modules }))

  const toggleModule = (id: string) =>
    setLic(p => ({
      ...p,
      enabled_modules: p.enabled_modules.includes(id)
        ? p.enabled_modules.filter(m => m !== id)
        : [...p.enabled_modules, id],
    }))

  const handleSave = async () => {
    setSaving(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any

    const r1 = await supabase.from('doctors').update({
      full_name:   profile.full_name,
      specialty:   profile.specialty   || null,
      clinic_name: profile.clinic_name || null,
      phone:       profile.phone       || null,
    }).eq('id', client.id)

    const r2 = await supabase.from('licenses').upsert({
      doctor_id:       client.id,
      plan:            lic.plan,
      status:          lic.status,
      expires_at:      lic.expires_at || null,
      enabled_modules: lic.enabled_modules,
      notes:           lic.notes || null,
    }, { onConflict: 'doctor_id' })

    if (client.account_type === 'clinic_admin' && clinic?.id) {
      await supabase.from('clinics').update({
        plan:            lic.plan,
        status:          lic.status,
        max_doctors:     Number(profile.max_doctors) || 5,
        expires_at:      lic.expires_at || null,
        enabled_modules: lic.enabled_modules,
      }).eq('id', clinic.id)
    }

    if (r1.error || r2.error) { toast.error('Error al guardar'); setSaving(false); return }
    toast.success('Cliente actualizado')
    router.refresh()
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return }
    setChangingPassword(true)
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: client.id, password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Error al cambiar contraseña'); return }
      toast.success('Contraseña actualizada correctamente')
      setNewPassword('')
    } catch { toast.error('Error de conexión') }
    finally { setChangingPassword(false) }
  }

  const handleToggleSuspend = async () => {
    const isSuspended = lic.status === 'suspended'
    const msg = isSuspended
      ? '¿Reactivar acceso a este cliente?'
      : '¿Suspender acceso a este cliente?\nNo podrá entrar al sistema hasta que lo reactives.'
    if (!confirm(msg)) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any
    const newStatus = isSuspended ? 'active' : 'suspended'
    await supabase.from('licenses').upsert({
      doctor_id: client.id, status: newStatus,
      plan: lic.plan, enabled_modules: lic.enabled_modules,
    }, { onConflict: 'doctor_id' })
    toast.success(isSuspended ? '✅ Cliente reactivado' : '⏸ Cliente suspendido')
    setLic(p => ({ ...p, status: newStatus }))
    router.refresh()
  }

  const handleDelete = () => {
    setShowDeleteModal(true)
    setDeletePassword('')
  }

  const handleConfirmDelete = async () => {
    if (!deletePassword) { toast.error('Ingresa tu contraseña'); return }
    setVerifyingDelete(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any
      const { data: { user } } = await supabase.auth.getUser()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user?.email ?? '',
        password: deletePassword,
      })
      if (authError) {
        toast.error('Contraseña incorrecta')
        setVerifyingDelete(false)
        return
      }

      setDeleting(true)
      setShowDeleteModal(false)
      const res = await fetch('/api/admin/delete-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: client.id }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Error al eliminar'); setDeleting(false); return }
      toast.success(`${profile.full_name} eliminado permanentemente`)
      router.push('/admin/clientes')
      router.refresh()
    } catch {
      toast.error('Error de conexión')
    } finally {
      setVerifyingDelete(false)
      setDeleting(false)
    }
  }

  const initials = profile.full_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '??'

  const DeleteModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: '#0f172a', border: '1px solid #7f1d1d', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        <div className="px-6 py-5 border-b" style={{ borderColor: '#7f1d1d', background: '#1a0505' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(239,68,68,0.15)' }}>
              <Trash2 size={18} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <h3 className="font-bold text-white">Confirmar eliminación</h3>
              <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Esta acción no se puede deshacer</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-sm" style={{ color: '#fca5a5' }}>
              Vas a eliminar permanentemente a <strong>{profile.full_name}</strong> junto con
              todos sus pacientes, citas e historial clínico.
            </p>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest block mb-2" style={{ color: '#94a3b8' }}>
              Ingresa tu contraseña para confirmar
            </label>
            <div className="relative">
              <input
                autoFocus
                type={showDeletePassword ? 'text' : 'password'}
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConfirmDelete()}
                placeholder="Tu contraseña de administrador"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-10"
                style={{ background: '#1e293b', border: '1.5px solid #334155', color: '#f1f5f9' }}
              />
              <button type="button"
                onClick={() => setShowDeletePassword(!showDeletePassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80">
                {showDeletePassword
                  ? <EyeOff size={14} style={{ color: '#475569' }} />
                  : <Eye size={14} style={{ color: '#475569' }} />}
              </button>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={() => { setShowDeleteModal(false); setDeletePassword('') }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}>
            Cancelar
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={verifyingDelete || !deletePassword}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
            {verifyingDelete ? 'Verificando...' : 'Eliminar definitivamente'}
          </button>
        </div>
      </div>
    </div>
  )

  const isSuspended = lic.status === 'suspended'

  return (
    <>
    <div style={{ color: '#f1f5f9', maxWidth: '720px' }}>
      <div className="flex items-center gap-4 mb-7">
        <Link href="/admin/clientes">
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}>
            <ArrowLeft size={16} /> Volver
          </button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
            {initials}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white">{profile.full_name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {client.account_type === 'clinic_admin' ? (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                  🏥 Clínica
                </span>
              ) : (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.3)' }}>
                  👨‍⚕️ Doctor
                </span>
              )}
              <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full"
                style={{
                  background: lic.plan === 'premium' ? '#1a1f3a' : lic.plan === 'pro' ? '#1e3a5f' : lic.plan === 'enterprise' ? '#1a2e24' : '#1e293b',
                  color: lic.plan === 'premium' ? '#a5b4fc' : lic.plan === 'pro' ? '#60a5fa' : lic.plan === 'enterprise' ? '#6ee7b7' : '#94a3b8',
                  border: `1px solid ${lic.plan === 'premium' ? '#6366f1' : lic.plan === 'pro' ? '#1d4ed8' : lic.plan === 'enterprise' ? '#059669' : '#334155'}`,
                }}>
                {lic.plan}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: isSuspended ? '#450a0a' : lic.status === 'trial' ? '#451a03' : '#064e3b',
                  color: isSuspended ? '#fca5a5' : lic.status === 'trial' ? '#fcd34d' : '#6ee7b7',
                }}>
                {isSuspended ? 'Suspendido' : lic.status === 'trial' ? 'Trial' : 'Activo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {isSuspended && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: '#450a0a', border: '1px solid #7f1d1d' }}>
            <span style={{ fontSize: 18 }}>⏸</span>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: '#fca5a5' }}>Cliente suspendido</p>
              <p className="text-xs" style={{ color: '#f87171' }}>No puede acceder al sistema</p>
            </div>
            <button onClick={handleToggleSuspend}
              className="px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{ background: '#064e3b', color: '#6ee7b7', border: '1px solid #065f46' }}>
              Reactivar
            </button>
          </div>
        )}

        <div className="rounded-2xl p-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <h2 className="font-display font-bold text-sm text-white mb-4">
            {client.account_type === 'clinic_admin' ? '🏥 Perfil de Clínica' : '👤 Perfil del Doctor'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Nombre completo</label>
              <input style={inputStyle} value={profile.full_name} onChange={setP('full_name')} />
            </div>
            <div>
              <label style={labelStyle}>Especialidad</label>
              <select style={inputStyle} value={profile.specialty} onChange={setP('specialty')}>
                <option value="">Seleccionar...</option>
                {specialties.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Clínica</label>
              <input style={inputStyle} value={profile.clinic_name} onChange={setP('clinic_name')} />
            </div>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input style={inputStyle} value={profile.phone} onChange={setP('phone')} />
            </div>
            {client.account_type === 'clinic_admin' && (
              <div className="col-span-2">
                <label style={labelStyle}>Límite de médicos</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 p-3 rounded-xl"
                    style={{ background: '#0f172a', border: '1.5px solid #334155' }}>
                    <button type="button"
                      onClick={() => setProfile(p => ({ ...p, max_doctors: Math.max(1, Number(p.max_doctors) - 1) }))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold transition-all hover:bg-white/10"
                      style={{ color: '#818cf8' }}>−</button>
                    <input
                      type="number" min="1" max="500"
                      value={profile.max_doctors}
                      onChange={e => setProfile(p => ({ ...p, max_doctors: parseInt(e.target.value) || 1 }))}
                      className="w-16 text-center bg-transparent outline-none text-lg font-black text-white" />
                    <button type="button"
                      onClick={() => setProfile(p => ({ ...p, max_doctors: Number(p.max_doctors) + 1 }))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold transition-all hover:bg-white/10"
                      style={{ color: '#818cf8' }}>+</button>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">médicos máximo</p>
                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                      El admin de la clínica no podrá agregar más de este número
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <h2 className="font-display font-bold text-sm text-white mb-4 flex items-center gap-2">
            <Mail size={15} style={{ color: '#818cf8' }} /> Acceso y Seguridad
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Correo electrónico</label>
              <div className="relative">
                <input
                  readOnly
                  value={clientEmail || 'Cargando...'}
                  style={{ ...inputStyle, color: '#64748b', cursor: 'default', paddingRight: '40px' }}
                />
                <Mail size={14} className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#334155' }} />
              </div>
              <p className="text-[10px] mt-1" style={{ color: '#475569' }}>
                El email no se puede cambiar desde aquí
              </p>
            </div>
            <div>
              <label style={labelStyle}>Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="mínimo 6 caracteres"
                  style={{ ...inputStyle, paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80">
                  {showPassword
                    ? <EyeOff size={14} style={{ color: '#475569' }} />
                    : <Eye size={14} style={{ color: '#475569' }} />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={changingPassword || newPassword.length < 6}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80 disabled:opacity-40"
                style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.3)' }}>
                <Key size={12} />
                {changingPassword ? 'Cambiando...' : 'Cambiar contraseña'}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <h2 className="font-display font-bold text-sm text-white mb-4">🎫 Licencia y Plan</h2>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="col-span-2">
              <label style={labelStyle}>Plan</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'free', color: '#94a3b8' }, { value: 'pro', color: '#60a5fa' },
                  { value: 'premium', color: '#a5b4fc' }, { value: 'enterprise', color: '#6ee7b7' },
                ].map(p => (
                  <button key={p.value} type="button" onClick={() => handlePlanChange(p.value)}
                    className="py-2.5 rounded-xl text-sm font-bold uppercase tracking-wide transition-all"
                    style={{
                      border: `2px solid ${lic.plan === p.value ? p.color : '#334155'}`,
                      background: lic.plan === p.value ? p.color + '20' : '#0f172a',
                      color: lic.plan === p.value ? p.color : '#475569',
                    }}>{p.value}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Estado</label>
              <select style={inputStyle} value={lic.status} onChange={setL('status')}>
                <option value="active">Activo</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspendido</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Vencimiento</label>
              <input type="date" style={inputStyle} value={lic.expires_at} onChange={setL('expires_at')} />
            </div>
          </div>
          <label style={labelStyle}>Módulos habilitados</label>
          <div className="grid grid-cols-3 gap-2">
            {ALL_MODULES.map(m => {
              const enabled = lic.enabled_modules.includes(m.id)
              return (
                <button key={m.id} type="button" onClick={() => toggleModule(m.id)}
                  className="flex items-center gap-2 p-3 rounded-xl text-left transition-all"
                  style={{ border: `1.5px solid ${enabled ? '#6366f1' : '#334155'}`, background: enabled ? 'rgba(99,102,241,0.12)' : '#0f172a' }}>
                  <span style={{ fontSize: 16 }}>{m.icon}</span>
                  <p className="text-xs font-semibold flex-1" style={{ color: enabled ? '#a5b4fc' : '#64748b' }}>{m.label}</p>
                  <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: enabled ? '#6366f1' : '#1e293b', border: `1px solid ${enabled ? '#6366f1' : '#334155'}` }}>
                    {enabled && <span className="text-white text-[10px] font-bold">✓</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <h2 className="font-display font-bold text-sm text-white mb-4">📝 Notas internas</h2>
          <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' } as React.CSSProperties}
            value={lic.notes} onChange={setL('notes')} placeholder="Notas sobre el cliente, acuerdos, observaciones..." />
        </div>

        <div className="flex justify-between gap-3">
          <button type="button" onClick={handleToggleSuspend}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={isSuspended
              ? { background: '#064e3b', color: '#6ee7b7', border: '1px solid #065f46' }
              : { background: '#451a03', color: '#fcd34d', border: '1px solid #78350f' }}>
            <RotateCcw size={14} />
            {isSuspended ? 'Reactivar cliente' : 'Suspender cliente'}
          </button>
          <div className="flex gap-3">
            <Link href="/admin/clientes">
              <button type="button" className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8' }}>
                Cancelar
              </button>
            </Link>
            <button type="button" onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
              {saving ? 'Guardando...' : <><Save size={15} /> Guardar cambios</>}
            </button>
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: '#1a0505', border: '1px solid #7f1d1d' }}>
          <h2 className="font-display font-bold text-sm mb-1" style={{ color: '#f87171' }}>⚠️ Zona de Peligro</h2>
          <p className="text-xs mb-4" style={{ color: '#64748b' }}>Estas acciones son irreversibles. Procede con cuidado.</p>
          <div className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: '#0f172a', border: '1px solid #450a0a' }}>
            <div>
              <p className="text-sm font-semibold text-white">Eliminar cliente permanentemente</p>
              <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                Elimina la cuenta, todos sus pacientes, citas e historial clínico
              </p>
            </div>
            <button type="button" onClick={handleDelete} disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold ml-4 flex-shrink-0"
              style={{ background: '#450a0a', color: '#fca5a5', border: '1px solid #7f1d1d' }}>
              <Trash2 size={14} />
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>

    {showDeleteModal && <DeleteModal />}
    </>
  )
}