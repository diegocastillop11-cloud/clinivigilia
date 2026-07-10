'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Brain, Users, Calendar, ClipboardList, BarChart2, Mail, Star, Check, ArrowRight, Stethoscope, X, ChevronDown, Menu } from 'lucide-react'

const ICON_MAP: Record<string, any> = { Users, Calendar, ClipboardList, BarChart2, Mail, Brain }

const DEFAULT_CONFIG = {
  hero_title: 'La clínica del futuro, disponible hoy.',
  hero_subtitle: 'Gestiona pacientes, citas y seguimiento clínico con el poder de la IA.',
  hero_badge: 'Potenciado por Claude · Anthropic',
  company_name: 'ClinivigilIA',
  logo_url: '',
  color_primary: '#6B4257', color_secondary: '#8B5D71',
  color_accent: '#4C6478', color_bg: '#EDE6DC',
  plans: [
    { name: 'Free', price: '0', desc: 'Para comenzar tu práctica digital', color: '#6B4257', modules: ['Pacientes ilimitados', 'Agenda básica', 'Seguimiento clínico'], missing: ['Reportes', 'Correos', 'IA'] },
    { name: 'Pro', price: '49.990', desc: 'El más popular entre médicos independientes', color: '#6B4257', popular: true, modules: ['Todo Free', 'Reportes PDF', 'Correos automáticos'], missing: ['IA'] },
    { name: 'Premium', price: '59.990', desc: 'Para clínicas que quieren el máximo', color: '#6B4257', modules: ['Todo Pro', 'IA ilimitada', 'Informes IA', 'Soporte 24/7'], missing: [] },
  ],
  features: [
    { icon: 'Users', title: 'Gestión de Pacientes', desc: 'Fichas clínicas completas con historial, alertas y seguimiento en tiempo real.', color: '#6B4257' },
    { icon: 'Calendar', title: 'Agenda Inteligente', desc: 'Programa citas, gestiona confirmaciones y reduce las ausencias automáticamente.', color: '#6B4257' },
    { icon: 'ClipboardList', title: 'Seguimiento Clínico', desc: 'Notas de evolución, recetas, laboratorios e imágenes en un solo lugar.', color: '#6B4257' },
    { icon: 'BarChart2', title: 'Reportes y Analytics', desc: 'Estadísticas de tu práctica, tendencias y exportación a PDF profesional.', color: '#6B4257' },
    { icon: 'Mail', title: 'Correos Automáticos', desc: 'Recordatorios de citas, resultados y seguimiento post-consulta sin esfuerzo.', color: '#6B4257' },
    { icon: 'Brain', title: 'Asistente IA', desc: 'Análisis clínico, sugerencias de medicamentos e informes generados por IA.', color: '#6B4257', premium: true },
  ],
  testimonials: [
    { name: 'Dr. Carlos Mendoza', specialty: 'Cardiólogo', text: 'ClinivigilIA transformó mi práctica. Lo que antes me tomaba 2 horas al día ahora lo hago en 20 minutos.', stars: 5 },
    { name: 'Dra. Ana Reyes', specialty: 'Pediatra', text: 'El asistente de IA es increíble. Me ayuda a revisar interacciones medicamentosas al instante.', stars: 5 },
    { name: 'Dr. Rodrigo Silva', specialty: 'Médico General', text: 'Mis pacientes notan la diferencia. El seguimiento automatizado mejoró muchísimo la adherencia al tratamiento.', stars: 5 },
  ],
}

const FAQS = [
  { q: '¿Necesito instalar algo?', a: 'No. 100% en la nube. Cualquier dispositivo, cualquier lugar.' },
  { q: '¿Mis datos están seguros?', a: 'Encriptación de nivel bancario. Tus datos nunca se comparten con terceros.' },
  { q: '¿Puedo migrar mis pacientes?', a: 'Sí. Importación desde Excel/CSV con asistencia incluida.' },
  { q: '¿Cómo funciona el Asistente IA?', a: 'Claude de Anthropic — uno de los modelos más avanzados del mundo.' },
  { q: '¿Hay contrato?', a: 'No. Cancela cuando quieras, sin penalizaciones.' },
]

function Modal({ onClose, colors }: { onClose: () => void; colors: any }) {
  const [form, setForm] = useState({ name: '', email: '', specialty: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSending(true)
    try {
      await fetch('https://formsubmit.co/ajax/diego.castillo.p11@gmail.com', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...form, _subject: `ClinivigilIA — ${form.name}` }),
      })
      setSent(true)
    } catch { setSent(true) } finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(43,38,32,0.55)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md relative" style={{ background: '#FFFFFF', border: '1px solid #DDD2C4', borderRadius: 3 }}>
        <div className="p-8">
          <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors">
            <X size={14} style={{ color: '#6B6153' }} />
          </button>
          {sent ? (
            <div className="text-center py-8">
              <p className="text-xl mb-2" style={{ fontFamily: "'Palatino Linotype','Book Antiqua',Georgia,serif", fontStyle: 'italic', color: '#2B2620' }}>Recibido.</p>
              <p className="text-sm" style={{ color: '#6B6153' }}>Te contactamos en menos de 24h.</p>
              <button onClick={onClose} className="mt-6 px-6 py-2.5 text-sm font-semibold text-white" style={{ background: colors.p, borderRadius: 3 }}>Cerrar</button>
            </div>
          ) : (
            <>
              <p className="text-xl mb-1" style={{ fontFamily: "'Palatino Linotype','Book Antiqua',Georgia,serif", fontStyle: 'italic', color: '#2B2620' }}>Solicitar Demo</p>
              <p className="text-sm mb-6" style={{ color: '#6B6153' }}>Sin compromiso · Respuesta en 24h</p>
              <form onSubmit={submit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[['name', 'Nombre', 'Dr. Juan Pérez'], ['email', 'Email', 'doctor@cl']].map(([k, l, p]) => (
                    <div key={k}>
                      <label className="text-[10px] font-semibold uppercase tracking-widest block mb-1.5" style={{ color: '#6B6153' }}>{l}</label>
                      <input required type={k === 'email' ? 'email' : 'text'} value={(form as any)[k]}
                        onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={p}
                        className="w-full px-3 py-2.5 text-sm outline-none"
                        style={{ background: '#F7F3EC', border: '1px solid #DDD2C4', color: '#2B2620', borderRadius: 3 }} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-widest block mb-1.5" style={{ color: '#6B6153' }}>Especialidad</label>
                  <input value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                    placeholder="Cardiología, Medicina General..." className="w-full px-3 py-2.5 text-sm outline-none"
                    style={{ background: '#F7F3EC', border: '1px solid #DDD2C4', color: '#2B2620', borderRadius: 3 }} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-widest block mb-1.5" style={{ color: '#6B6153' }}>Mensaje</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={3} className="w-full px-3 py-2.5 text-sm outline-none resize-none"
                    style={{ background: '#F7F3EC', border: '1px solid #DDD2C4', color: '#2B2620', borderRadius: 3 }} />
                </div>
                <button type="submit" disabled={sending}
                  className="w-full py-3 text-sm font-semibold text-white mt-2"
                  style={{ background: colors.p, borderRadius: 3 }}>
                  {sending ? 'Enviando...' : 'Solicitar Demo →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const [cfg, setCfg] = useState(DEFAULT_CONFIG)
  const [modal, setModal] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [faq, setFaq] = useState<number | null>(null)
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    createClient().from('landing_config').select('*').eq('id', 'main').single()
      .then(({ data }) => { if (data) setCfg(prev => ({ ...prev, ...data })) })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!mounted) return null
  const c = { p: cfg.color_primary, s: cfg.color_secondary, a: cfg.color_accent }
  const fontDisplay = "'Palatino Linotype','Book Antiqua',Georgia,'Times New Roman',serif"
  const fontBody = "'Segoe UI',system-ui,-apple-system,sans-serif"
  const ink = '#2B2620', inkSoft = '#6B6153', line = '#DDD2C4', surface = '#FFFFFF'

  return (
    <div style={{ background: '#EDE6DC', color: ink, fontFamily: fontBody, overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-40 transition-all duration-300"
        style={{ background: scrolled ? 'rgba(237,230,220,0.94)' : 'rgba(237,230,220,0.7)', backdropFilter: 'blur(8px)', borderBottom: `1px solid ${line}` }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {cfg.logo_url ? (
              <img src={cfg.logo_url} alt={cfg.company_name} className="h-8 object-contain max-w-[160px]" />
            ) : (
              <span style={{ fontFamily: fontDisplay, fontStyle: 'italic', fontSize: 20, color: ink }}>{cfg.company_name}</span>
            )}
          </div>

          <div className="hidden md:flex items-center gap-7">
            {['Módulos', 'Precios', 'Testimonios', 'FAQ'].map(i => (
              <a key={i} href={`#${i.toLowerCase()}`} className="text-sm transition-colors hover:opacity-70" style={{ color: inkSoft }}>{i}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login">
              <button className="text-sm underline underline-offset-4" style={{ color: inkSoft }}>Iniciar sesión</button>
            </Link>
            <button onClick={() => setModal(true)}
              className="h-11 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: c.p, borderRadius: 3 }}>
              Demo gratis
            </button>
          </div>

          <button onClick={() => setMobileMenu(v => !v)} aria-expanded={mobileMenu} aria-label="Abrir menú"
            className="md:hidden w-11 h-11 flex items-center justify-center" style={{ border: `1px solid ${line}`, borderRadius: 3, color: ink }}>
            <Menu size={18} />
          </button>
        </div>

        {mobileMenu && (
          <div className="md:hidden px-5 pb-5 flex flex-col gap-1" style={{ borderTop: `1px solid ${line}` }}>
            {['Módulos', 'Precios', 'Testimonios', 'FAQ'].map(i => (
              <a key={i} href={`#${i.toLowerCase()}`} onClick={() => setMobileMenu(false)}
                className="py-3 text-sm" style={{ color: ink, borderBottom: `1px solid ${line}` }}>{i}</a>
            ))}
            <div className="flex gap-3 pt-4">
              <Link href="/auth/login" className="flex-1">
                <button className="w-full h-11 text-sm font-semibold" style={{ border: `1px solid ${line}`, borderRadius: 3, color: ink }}>Iniciar sesión</button>
              </Link>
              <button onClick={() => { setModal(true); setMobileMenu(false) }} className="flex-1 h-11 text-sm font-semibold text-white" style={{ background: c.p, borderRadius: 3 }}>
                Demo gratis
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="py-10 md:py-24">
        <div className="max-w-6xl mx-auto px-5 md:px-8 grid gap-10 md:grid-cols-[0.85fr,1.15fr] items-center">
          <div className="md:order-2">
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest px-3.5 py-1.5 mb-7"
              style={{ border: `1px dashed ${inkSoft}`, borderRadius: 3, color: inkSoft }}>
              {cfg.hero_badge}
            </span>
            <h1 style={{ fontFamily: fontDisplay, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(32px,5vw,50px)', lineHeight: 1.15, color: ink }} className="mb-5">
              {cfg.hero_title}
            </h1>
            <p className="text-base md:text-lg leading-relaxed max-w-md mb-8" style={{ color: inkSoft }}>
              {cfg.hero_subtitle}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => setModal(true)}
                className="h-12 px-7 text-sm font-semibold text-white flex items-center gap-2.5 transition-opacity hover:opacity-90"
                style={{ background: c.p, borderRadius: 3 }}>
                Empezar gratis <ArrowRight size={14} />
              </button>
              <Link href="/auth/login">
                <button className="h-12 px-6 text-sm font-semibold" style={{ border: `1px solid ${line}`, borderRadius: 3, color: ink }}>
                  Ya soy cliente
                </button>
              </Link>
            </div>
          </div>

          <div className="md:order-1 rounded-sm p-6 md:p-7 max-w-sm" style={{ background: surface, border: `1px solid ${line}`, borderRadius: 3 }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: inkSoft }}>Próxima hora disponible</p>
            <p style={{ fontFamily: fontDisplay, fontSize: 26 }} className="mt-2 mb-4">30 de abril</p>
            <div className="flex justify-between py-2.5 text-sm" style={{ borderTop: `1px solid ${line}` }}>
              <span>10:00</span><span style={{ color: inkSoft }}>Dra. Ana Reyes</span>
            </div>
            <div className="flex justify-between py-2.5 text-sm" style={{ borderTop: `1px solid ${line}` }}>
              <span>Especialidad</span><span style={{ color: inkSoft }}>Pediatría</span>
            </div>
            <div className="flex justify-between py-2.5 text-sm" style={{ borderTop: `1px solid ${line}` }}>
              <span>Duración</span><span style={{ color: inkSoft }}>30 min</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ borderTop: `1px solid ${line}`, borderBottom: `1px solid ${line}`, background: '#F7F3EC' }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 grid grid-cols-2 md:grid-cols-4">
          {[['500+', 'Médicos activos en Chile'], ['98%', 'Satisfacción garantizada'], ['2h', 'Ahorro diario por doctor'], ['24/7', 'Disponibilidad en la nube']].map(([v, l], i) => (
            <div key={l} className="py-7 px-5" style={{ borderRight: i % 2 === 0 ? `1px solid ${line}` : 'none', borderBottom: i < 2 ? `1px solid ${line}` : 'none' }}>
              <p style={{ fontFamily: fontDisplay, fontSize: 28 }}>{v}</p>
              <p className="text-xs mt-1" style={{ color: inkSoft }}>{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MÓDULOS ── */}
      <section id="módulos" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div className="mb-10 md:mb-14 max-w-xl">
            <p className="text-[11px] uppercase tracking-widest mb-2.5" style={{ color: c.p }}>Módulos</p>
            <h2 style={{ fontFamily: fontDisplay, fontSize: 'clamp(24px,3.4vw,32px)' }}>Cada función, perfecta.</h2>
            <p className="mt-3 text-sm" style={{ color: inkSoft }}>Diseñado por médicos para médicos. Sin complejidad innecesaria.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cfg.features.map((f: any) => {
              const Icon = ICON_MAP[f.icon] || Brain
              return (
                <div key={f.title} className="relative p-6" style={{ background: surface, border: `1px solid ${line}`, borderRadius: 3 }}>
                  {f.premium && (
                    <span className="absolute top-4 right-4 text-[10px] uppercase tracking-wide px-2 py-0.5"
                      style={{ background: '#E8D9DE', color: '#4A2C3A', borderRadius: 3 }}>Premium</span>
                  )}
                  <Icon size={18} style={{ color: c.p }} className="mb-4" />
                  <h3 className="text-[15px] font-semibold mb-1.5">{f.title}</h3>
                  <p className="text-[13.5px] leading-relaxed" style={{ color: inkSoft }}>{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── IA DEMO ── */}
      <section className="py-16 md:py-24" style={{ background: '#F7F3EC', borderTop: `1px solid ${line}`, borderBottom: `1px solid ${line}` }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-[11px] uppercase tracking-widest px-3 py-1.5 mb-6" style={{ border: `1px dashed ${inkSoft}`, borderRadius: 3, color: inkSoft }}>
              Solo Premium
            </span>
            <h2 style={{ fontFamily: fontDisplay, fontStyle: 'italic', fontSize: 'clamp(28px,4vw,42px)', lineHeight: 1.15 }} className="mb-5">
              Un médico que nunca duerme.
            </h2>
            <p className="text-base leading-relaxed mb-7 max-w-sm" style={{ color: inkSoft }}>
              Claude de Anthropic analiza casos, sugiere medicamentos y genera informes en segundos.
            </p>
            <div className="space-y-2.5 mb-8">
              {['Medicamentos con dosis y contraindicaciones', 'Diagnósticos diferenciales al instante', 'Resúmenes clínicos automáticos', 'Informes PDF generados por IA', 'Detección de interacciones'].map(item => (
                <div key={item} className="flex items-center gap-2.5">
                  <Check size={13} style={{ color: c.p }} />
                  <span className="text-sm" style={{ color: inkSoft }}>{item}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setModal(true)}
              className="h-11 px-6 text-sm font-semibold text-white flex items-center gap-2 w-fit"
              style={{ background: c.p, borderRadius: 3 }}>
              Activar IA <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ background: surface, border: `1px solid ${line}`, borderRadius: 3 }}>
            <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${line}` }}>
              <div className="w-8 h-8 flex items-center justify-center" style={{ background: c.p, borderRadius: 3 }}>
                <Brain size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">{cfg.company_name}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span className="text-[11px] text-emerald-700">En línea</span>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {[
                { role: 'ai', text: 'Hola Dr. García. He analizado a su paciente con HTA grado 2 e IRC. Tengo una recomendación.' },
                { role: 'user', text: '¿Qué medicamento sugieres?' },
                { role: 'ai', text: 'Amlodipino 5mg/día. Evitar AINEs. Control en 30 días. ¿Genero el informe PDF?' },
                { role: 'user', text: 'Sí, genera el informe.' },
                { role: 'ai', text: '✦ Informe generado. Descarga disponible.', special: true },
              ].map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: msg.role === 'ai' ? '#E8D9DE' : '#EDE6DC' }}>
                    {msg.role === 'ai' ? <Brain size={11} style={{ color: c.p }} /> : <Stethoscope size={11} style={{ color: inkSoft }} />}
                  </div>
                  <div className="max-w-[75%] px-3.5 py-2.5 text-xs" style={{
                    background: (msg as any).special ? '#E8D9DE' : '#F7F3EC',
                    color: (msg as any).special ? '#4A2C3A' : inkSoft,
                    border: `1px solid ${line}`, borderRadius: 3,
                    fontWeight: (msg as any).special ? 600 : 400,
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section id="precios" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div className="mb-10 md:mb-14 max-w-xl">
            <p className="text-[11px] uppercase tracking-widest mb-2.5" style={{ color: c.p }}>Precios</p>
            <h2 style={{ fontFamily: fontDisplay, fontSize: 'clamp(24px,3.4vw,32px)' }}>Transparente. Sin sorpresas.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {cfg.plans.map((plan: any) => (
              <div key={plan.name} className="p-7 flex flex-col"
                style={{ background: surface, borderRadius: 3, border: plan.popular ? `2px solid ${plan.color}` : `1px solid ${line}` }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: inkSoft }}>{plan.name}</p>
                  {plan.popular && <span className="text-[10px] uppercase px-2.5 py-0.5 text-white" style={{ background: plan.color, borderRadius: 100 }}>Popular</span>}
                </div>
                <p className="text-xs mb-5" style={{ color: inkSoft }}>{plan.desc}</p>
                <p style={{ fontFamily: fontDisplay, fontSize: 34 }} className="mb-6">
                  {plan.price === '0' ? 'Gratis' : <>${plan.price}<span className="text-sm font-sans" style={{ color: inkSoft }}>/mes</span></>}
                </p>
                <ul className="space-y-0 mb-6 flex-1">
                  {(plan.modules || []).map((m: string) => (
                    <li key={m} className="flex items-center gap-2.5 text-[13.5px] py-2" style={{ borderTop: `1px solid ${line}` }}>
                      <Check size={12} style={{ color: plan.color, flexShrink: 0 }} />{m}
                    </li>
                  ))}
                  {(plan.missing || []).map((m: string) => (
                    <li key={m} className="flex items-center gap-2.5 text-[13.5px] py-2 opacity-50" style={{ borderTop: `1px solid ${line}` }}>
                      <X size={12} style={{ color: inkSoft, flexShrink: 0 }} />{m}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setModal(true)} className="w-full h-11 text-sm font-semibold"
                  style={plan.popular ? { background: plan.color, color: '#fff', borderRadius: 3 } : { border: `1px solid ${line}`, color: ink, borderRadius: 3 }}>
                  {plan.price === '0' ? 'Empezar gratis' : 'Solicitar acceso'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section id="testimonios" className="py-16 md:py-24" style={{ background: '#F7F3EC', borderTop: `1px solid ${line}`, borderBottom: `1px solid ${line}` }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div className="mb-10 md:mb-14 max-w-xl">
            <p className="text-[11px] uppercase tracking-widest mb-2.5" style={{ color: c.p }}>Testimonios</p>
            <h2 style={{ fontFamily: fontDisplay, fontSize: 'clamp(24px,3.4vw,32px)' }}>Ellos ya lo usan.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {cfg.testimonials.map((t: any) => (
              <div key={t.name} className="p-6" style={{ background: surface, border: `1px solid ${line}`, borderRadius: 3 }}>
                <p style={{ fontFamily: fontDisplay, fontStyle: 'italic', fontSize: 17, lineHeight: 1.55 }} className="mb-4">"{t.text}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs" style={{ background: '#E8D9DE', color: '#4A2C3A', fontFamily: fontDisplay }}>
                    {t.name.replace(/^(Dr\.|Dra\.)\s*/i, '').split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{t.name}</p>
                    <p className="text-xs" style={{ color: inkSoft }}>{t.specialty}</p>
                  </div>
                  <div className="flex gap-0.5 ml-auto">
                    {[...Array(t.stars || 5)].map((_, i) => <Star key={i} size={10} fill={c.p} style={{ color: c.p }} />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-5 md:px-8 grid md:grid-cols-[240px,1fr] gap-10">
          <div>
            <p className="text-[11px] uppercase tracking-widest mb-2.5" style={{ color: c.p }}>FAQ</p>
            <h2 style={{ fontFamily: fontDisplay, fontSize: 28 }}>Dudas frecuentes.</h2>
          </div>
          <div style={{ borderTop: `1px solid ${line}` }}>
            {FAQS.map((f, i) => (
              <div key={i} style={{ borderBottom: `1px solid ${line}` }}>
                <button onClick={() => setFaq(faq === i ? null : i)} className="w-full flex items-center justify-between gap-4 py-4 text-left">
                  <span className="text-[15px] font-semibold">{f.q}</span>
                  <ChevronDown size={16} style={{ color: inkSoft, transform: faq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                </button>
                {faq === i && <p className="pb-4 text-sm max-w-md" style={{ color: inkSoft }}>{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ background: '#F7F3EC', borderTop: `1px solid ${line}` }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-20">
          <h2 style={{ fontFamily: fontDisplay, fontSize: 'clamp(26px,4vw,36px)' }} className="max-w-md mb-3">Tu práctica, reinventada.</h2>
          <p className="text-[15.5px] mb-7 max-w-md" style={{ color: inkSoft }}>Únete a cientos de médicos que ya recuperaron su tiempo.</p>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => setModal(true)} className="h-12 px-7 text-sm font-semibold text-white flex items-center gap-2.5" style={{ background: c.p, borderRadius: 3 }}>
              Solicitar demo gratuita <ArrowRight size={14} />
            </button>
            <Link href="/auth/login">
              <button className="h-12 px-6 text-sm font-semibold" style={{ border: `1px solid ${line}`, borderRadius: 3, color: ink }}>Ya tengo cuenta</button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${line}` }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm" style={{ color: inkSoft }}>
          {cfg.logo_url ? (
            <img src={cfg.logo_url} alt={cfg.company_name} className="h-6 object-contain max-w-[120px]" />
          ) : (
            <span style={{ fontFamily: fontDisplay, fontStyle: 'italic' }}>{cfg.company_name}</span>
          )}
          <span>© {new Date().getFullYear()} {cfg.company_name}. Todos los derechos reservados.</span>
          <div className="flex gap-5">
            <a href="mailto:diego.castillo.p11@gmail.com" className="hover:opacity-70">Contacto</a>
            <button onClick={() => setModal(true)} className="hover:opacity-70" style={{ color: c.p, fontWeight: 600 }}>Demo →</button>
          </div>
        </div>
      </footer>

      {modal && <Modal onClose={() => setModal(false)} colors={{ p: c.p, s: c.s }} />}
    </div>
  )
}
