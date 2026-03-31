'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { WebService, WebPage, GestorWebStats } from '@/types/gestor-web'

// ─── Iconos simples SVG ───────────────────────────────────
const IconGlobe = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)
const IconStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
)
const IconBot = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/><path d="M7 15h.01M17 15h.01"/>
  </svg>
)
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IconExternalLink = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)
const IconToggle = ({ on }: { on: boolean }) => (
  <svg width="36" height="20" viewBox="0 0 36 20">
    <rect width="36" height="20" rx="10" fill={on ? '#6366F1' : '#D1D5DB'}/>
    <circle cx={on ? 26 : 10} cy="10" r="8" fill="white"/>
  </svg>
)

// ─── Stat Card ────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode, label: string, value: string | number,
  sub?: string, color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="rounded-xl p-2.5 flex-shrink-0" style={{ backgroundColor: color + '18' }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Service Row ──────────────────────────────────────────
function ServiceRow({ service, onToggle }: { service: WebService; onToggle: (id: string, active: boolean) => void }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
      <span className="text-2xl w-8 text-center flex-shrink-0">{service.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{service.name}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{service.short_desc || '—'}</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
        <span className="hidden sm:block">{service.duration_min} min</span>
        {service.price_label && (
          <span className="bg-gray-100 rounded-full px-2.5 py-0.5 font-medium">{service.price_label}</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {service.ia_context ? (
          <span className="text-xs bg-violet-50 text-violet-600 rounded-full px-2 py-0.5 font-medium hidden sm:block">
            IA ✓
          </span>
        ) : (
          <span className="text-xs bg-amber-50 text-amber-600 rounded-full px-2 py-0.5 font-medium hidden sm:block">
            Sin IA
          </span>
        )}
      </div>
      <button
        onClick={() => onToggle(service.id, !service.active)}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        title={service.active ? 'Desactivar' : 'Activar'}
      >
        <IconToggle on={service.active} />
      </button>
      <Link
        href="/dashboard/gestor-web/disponibilidad"
        className="flex items-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl px-3 py-2 hover:border-gray-300 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        Disponibilidad
      </Link>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────
export default function GestorWebPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [webPage, setWebPage] = useState<WebPage | null>(null)
  const [services, setServices] = useState<WebService[]>([])
  const [stats, setStats] = useState<GestorWebStats>({
    total_services: 0,
    active_services: 0,
    appointments_this_month: 0,
    appointments_pending: 0,
    ia_sessions_this_month: 0,
    page_published: false,
    page_slug: null,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [pageRes, servicesRes, apptRes, iaRes] = await Promise.all([
      supabase.from('web_pages').select('*').eq('doctor_id', user.id).single(),
      supabase.from('web_services').select('*').eq('doctor_id', user.id).order('sort_order'),
      supabase.from('web_appointments')
        .select('id, status')
        .eq('doctor_id', user.id)
        .gte('appointment_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
      supabase.from('web_ia_sessions')
        .select('id')
        .eq('doctor_id', user.id)
        .gte('started_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ])

    if (pageRes.data) setWebPage(pageRes.data)
    if (servicesRes.data) {
      setServices(servicesRes.data)
      const svcs = servicesRes.data
      setStats({
        total_services: svcs.length,
        active_services: svcs.filter(s => s.active).length,
        appointments_this_month: apptRes.data?.length ?? 0,
        appointments_pending: apptRes.data?.filter(a => a.status === 'pending').length ?? 0,
        ia_sessions_this_month: iaRes.data?.length ?? 0,
        page_published: pageRes.data?.published ?? false,
        page_slug: pageRes.data?.slug ?? null,
      })
    }

    setLoading(false)
  }

  async function toggleService(id: string, active: boolean) {
    await supabase.from('web_services').update({ active }).eq('id', id)
    setServices(prev => prev.map(s => s.id === id ? { ...s, active } : s))
  }

  async function togglePublish() {
    if (!webPage) return
    const next = !webPage.published
    await supabase.from('web_pages').update({ published: next }).eq('id', webPage.id)
    setWebPage(prev => prev ? { ...prev, published: next } : null)
    setStats(prev => ({ ...prev, page_published: next }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"/>
          <p className="text-sm text-gray-400">Cargando gestor web...</p>
        </div>
      </div>
    )
  }

  const publicUrl = stats.page_slug ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://clinivigilia.com'}/${stats.page_slug}` : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* ─── Header ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <div className="flex items-center gap-2 text-violet-600 mb-1">
            <IconGlobe />
            <span className="text-sm font-semibold tracking-wide uppercase">Gestor Web</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Tu presencia digital</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestiona tu landing, servicios y agenda inteligente con IA
          </p>
        </div>
        <div className="flex items-center gap-2">
          {publicUrl && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 transition-colors border border-gray-200 rounded-xl px-3 py-2 hover:border-violet-200"
            >
              <IconExternalLink />
              Ver sitio
            </a>
          )}
          <Link
            href="/dashboard/gestor-web/disponibilidad"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl px-3 py-2 hover:border-gray-300 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Disponibilidad
          </Link>
          <Link href="/dashboard/gestor-web/productos"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl px-3 py-2 hover:border-gray-300 transition-colors">
            🛒 Productos
          </Link>
        </div>
      </div>

      {/* ─── Banner publicación ────────────────────────────── */}
      <div className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between transition-colors ${
        stats.page_published
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-amber-50 border-amber-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${stats.page_published ? 'bg-emerald-500' : 'bg-amber-400'} animate-pulse`}/>
            <p className={`font-semibold text-sm ${stats.page_published ? 'text-emerald-800' : 'text-amber-800'}`}>
              {stats.page_published ? 'Tu sitio está publicado y visible' : 'Tu sitio está en borrador — no es visible aún'}
            </p>
          </div>
          {publicUrl && (
            <p className="text-xs mt-1 text-gray-500 font-mono">{publicUrl}</p>
          )}
          {!webPage && (
            <p className="text-xs mt-1 text-amber-700">Configura tu sitio primero para poder publicarlo</p>
          )}
        </div>
        {webPage && (
          <button
            onClick={togglePublish}
            className={`flex-shrink-0 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              stats.page_published
                ? 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                : 'bg-violet-600 text-white hover:bg-violet-700 shadow-md shadow-violet-200'
            }`}
          >
            {stats.page_published ? 'Despublicar' : 'Publicar sitio'}
          </button>
        )}
      </div>

      {/* ─── Stats ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<IconStar />}
          label="Servicios activos"
          value={`${stats.active_services}/${stats.total_services}`}
          sub="en tu catálogo"
          color="#6366F1"
        />
        <StatCard
          icon={<IconCalendar />}
          label="Citas este mes"
          value={stats.appointments_this_month}
          sub={`${stats.appointments_pending} pendientes`}
          color="#10B981"
        />
        <StatCard
          icon={<IconBot />}
          label="Chats IA este mes"
          value={stats.ia_sessions_this_month}
          sub="desde tu landing"
          color="#8B5CF6"
        />
        <StatCard
          icon={<IconGlobe />}
          label="Estado del sitio"
          value={stats.page_published ? 'Publicado' : 'Borrador'}
          sub={stats.page_slug ? `/${stats.page_slug}` : 'Sin configurar'}
          color={stats.page_published ? '#10B981' : '#F59E0B'}
        />
      </div>

      {/* ─── Servicios ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Servicios</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Cada servicio tiene su propio entrenamiento de IA
            </p>
          </div>
          <Link
            href="/dashboard/gestor-web/servicios/nuevo"
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-violet-200"
          >
            <IconPlus />
            Nuevo servicio
          </Link>
        </div>

        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="text-5xl mb-4">🩺</div>
            <p className="font-semibold text-gray-700">Aún no tienes servicios</p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              Agrega tu primer servicio y entrena a la IA para que lo explique a tus pacientes
            </p>
            <Link
              href="/dashboard/gestor-web/servicios/nuevo"
              className="mt-5 flex items-center gap-1.5 bg-violet-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-violet-700 transition-colors"
            >
              <IconPlus />
              Agregar primer servicio
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {services.map(service => (
              <ServiceRow key={service.id} service={service} onToggle={toggleService} />
            ))}
          </div>
        )}
      </div>

      {/* ─── Próximos pasos ───────────────────────────────── */}
      {(!webPage || services.length === 0) && (
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4">🚀 Empieza en 3 pasos</h3>
          <div className="space-y-3">
            {[
              { done: !!webPage, label: 'Configura tu sitio web', sub: 'Nombre, logo, colores y descripción', href: '/dashboard/gestor-web/configurar' },
              { done: services.length > 0, label: 'Agrega tus servicios', sub: 'Incluye el contexto para entrenar la IA', href: '/dashboard/gestor-web/servicios/nuevo' },
              { done: totalSlots > 0, label: 'Configura tu disponibilidad', sub: 'Define los horarios y bloques agendables', href: '/dashboard/gestor-web/disponibilidad'},
              { done: stats.page_published, label: 'Publica tu sitio', sub: 'Actívalo para que tus pacientes puedan encontrarte', href: '#' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  step.done ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-violet-200 text-violet-400'
                }`}>
                  {step.done ? '✓' : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${step.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-400">{step.sub}</p>
                </div>
                {!step.done && step.href !== '#' && (
                  <Link href={step.href} className="text-xs font-medium text-violet-600 hover:text-violet-700 flex-shrink-0">
                    Ir →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
