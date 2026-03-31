'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Brain, Users, Calendar, ClipboardList, BarChart2, Mail, Star, Check, ArrowRight, Stethoscope, X, ChevronDown, Zap, Shield, Activity } from 'lucide-react'

const ICON_MAP: Record<string, any> = { Users, Calendar, ClipboardList, BarChart2, Mail, Brain }

const DEFAULT_CONFIG = {
  hero_title: 'La clínica del futuro, disponible hoy.',
  hero_subtitle: 'Gestiona pacientes, citas y seguimiento clínico con el poder de la IA.',
  hero_badge: 'Potenciado por Claude · Anthropic',
  company_name: 'ClinivigilIA',
  logo_url: '',
  color_primary: '#6366f1', color_secondary: '#8b5cf6',
  color_accent: '#38bdf8', color_bg: '#030712',
  plans: [
    { name: 'Free', price: '0', desc: 'Para comenzar', color: '#64748b', modules: ['Pacientes ilimitados','Agenda básica','Seguimiento clínico'], missing: ['Reportes','Correos','IA'] },
    { name: 'Pro', price: '29.990', desc: 'Más popular', color: '#0ea5e9', popular: true, modules: ['Todo Free','Reportes PDF','Correos automáticos'], missing: ['IA'] },
    { name: 'Premium', price: '59.990', desc: 'Máximo poder', color: '#6366f1', modules: ['Todo Pro','IA ilimitada','Informes IA','Soporte 24/7'], missing: [] },
  ],
  features: [
    { icon: 'Users', title: 'Gestión de Pacientes', desc: 'Fichas clínicas completas con historial y alertas en tiempo real.', color: '#0ea5e9' },
    { icon: 'Calendar', title: 'Agenda Inteligente', desc: 'Citas, confirmaciones y reducción de ausencias automáticamente.', color: '#10b981' },
    { icon: 'ClipboardList', title: 'Seguimiento Clínico', desc: 'Evoluciones, recetas e imágenes en un solo lugar.', color: '#f59e0b' },
    { icon: 'BarChart2', title: 'Reportes', desc: 'Estadísticas exportables a PDF profesional.', color: '#8b5cf6' },
    { icon: 'Mail', title: 'Correos Automáticos', desc: 'Recordatorios y seguimiento sin esfuerzo.', color: '#ec4899' },
    { icon: 'Brain', title: 'Asistente IA', desc: 'Análisis clínico, medicamentos e informes por IA.', color: '#6366f1', premium: true },
  ],
  testimonials: [
    { name: 'Dr. Carlos Mendoza', specialty: 'Cardiólogo', text: 'Transformó mi práctica. Lo que tomaba 2 horas ahora lo hago en 20 minutos.', stars: 5 },
    { name: 'Dra. Ana Reyes', specialty: 'Pediatra', text: 'El asistente de IA me ayuda a revisar interacciones medicamentosas al instante.', stars: 5 },
    { name: 'Dr. Rodrigo Silva', specialty: 'Médico General', text: 'El seguimiento automatizado mejoró la adherencia de mis pacientes.', stars: 5 },
  ],
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)' }}>
      <div className="w-full max-w-md relative"
        style={{ background: '#131d30', border: `1px solid ${colors.p}25`, borderRadius: 28, overflow: 'hidden' }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${colors.p}, transparent)` }} />
        <div className="p-8">
          <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors">
            <X size={14} style={{ color: '#64748b' }} />
          </button>
          {sent ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✦</div>
              <p className="text-xl font-black text-white mb-2">Recibido.</p>
              <p className="text-sm" style={{ color: '#7c8fa8' }}>Te contactamos en menos de 24h.</p>
              <button onClick={onClose} className="mt-6 px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: colors.p }}>Cerrar</button>
            </div>
          ) : (
            <>
              <p className="text-xl font-black text-white mb-1">Solicitar Demo</p>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>Sin compromiso · Respuesta en 24h</p>
              <form onSubmit={submit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[['name','Nombre','Dr. Juan Pérez'],['email','Email','doctor@cl']].map(([k,l,p]) => (
                    <div key={k}>
                      <label className="text-[10px] font-black uppercase tracking-widest block mb-1.5" style={{ color: '#7c8fa8' }}>{l}</label>
                      <input required type={k==='email'?'email':'text'} value={(form as any)[k]}
                        onChange={e => setForm(f => ({...f,[k]:e.target.value}))} placeholder={p}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: '#131d30', border: '1px solid #0f172a', color: '#f1f5f9' }} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest block mb-1.5" style={{ color: '#7c8fa8' }}>Especialidad</label>
                  <input value={form.specialty} onChange={e => setForm(f => ({...f,specialty:e.target.value}))}
                    placeholder="Cardiología, Medicina General..." className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: '#131d30', border: '1px solid #0f172a', color: '#f1f5f9' }} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest block mb-1.5" style={{ color: '#7c8fa8' }}>Mensaje</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({...f,message:e.target.value}))}
                    rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{ background: '#131d30', border: '1px solid #0f172a', color: '#f1f5f9' }} />
                </div>
                <button type="submit" disabled={sending}
                  className="w-full py-3 rounded-xl text-sm font-black text-white mt-2"
                  style={{ background: `linear-gradient(135deg, ${colors.p}, ${colors.s})` }}>
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
  const [faq, setFaq] = useState<number|null>(null)
  const [hoverPlan, setHoverPlan] = useState<number|null>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const faqs = [
    { q: '¿Necesito instalar algo?', a: 'No. 100% en la nube. Cualquier dispositivo, cualquier lugar.' },
    { q: '¿Mis datos están seguros?', a: 'Encriptación de nivel bancario. Tus datos nunca se comparten con terceros.' },
    { q: '¿Puedo migrar mis pacientes?', a: 'Sí. Importación desde Excel/CSV con asistencia incluida.' },
    { q: '¿Cómo funciona el Asistente IA?', a: 'Claude de Anthropic — uno de los modelos más avanzados del mundo.' },
    { q: '¿Hay contrato?', a: 'No. Cancela cuando quieras, sin penalizaciones.' },
  ]

  useEffect(() => {
    setMounted(true)
    window.addEventListener('scroll', () => setScrolled(window.scrollY > 20))
    const handleMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMouse)
    createClient().from('landing_config').select('*').eq('id','main').single()
      .then(({ data }) => { if (data) setCfg(prev => ({ ...prev, ...data })) })
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  if (!mounted) return null
  const c = { p: cfg.color_primary, s: cfg.color_secondary, a: cfg.color_accent, bg: cfg.color_bg }

  return (
    <div style={{ background: '#0d1424', color: '#f1f5f9', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' }}>

      {/* Cursor glow */}
      <div className="fixed pointer-events-none z-0 w-96 h-96 rounded-full blur-3xl opacity-5 transition-all duration-700"
        style={{ background: c.p, left: mousePos.x - 192, top: mousePos.y - 192 }} />

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
        style={{ background: scrolled ? 'rgba(3,5,10,0.92)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none' }}>
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">

          {/* Logo — muestra imagen si existe, sino el texto */}
          <div className="flex items-center gap-2.5">
            {cfg.logo_url ? (
              <img src={cfg.logo_url} alt={cfg.company_name} className="h-9 object-contain max-w-[160px]" />
            ) : (
              <>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${c.p}, ${c.s})` }}>
                  <Stethoscope size={14} className="text-white" />
                </div>
                <span className="font-black tracking-tight text-white">
                  {cfg.company_name.replace('IA','')}<span style={{ color: c.p }}>IA</span>
                </span>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-1">
            {['Módulos','Precios','Testimonios','FAQ'].map(i => (
              <a key={i} href={`#${i.toLowerCase()}`}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:text-white"
                style={{ color: '#64748b' }}>{i}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <button className="h-8 px-3 rounded-lg text-xs font-semibold transition-colors hover:text-white"
                style={{ color: '#64748b' }}>Iniciar sesión</button>
            </Link>
            <button onClick={() => setModal(true)}
              className="h-8 px-4 rounded-lg text-xs font-black text-white transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${c.p}, ${c.s})` }}>
              Demo gratis
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-16">
        <div className="absolute left-[8vw] top-0 bottom-0 w-px opacity-10"
          style={{ background: `linear-gradient(to bottom, transparent, ${c.p}, transparent)` }} />
        <div className="absolute right-[8vw] top-0 bottom-0 w-px opacity-5"
          style={{ background: `linear-gradient(to bottom, transparent, ${c.s}, transparent)` }} />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 font-black text-[30vw] leading-none select-none pointer-events-none"
          style={{ color: 'rgba(255,255,255,0.015)', fontFamily: "'Sora', sans-serif", letterSpacing: '-0.05em' }}>
          IA
        </div>
        <div className="absolute top-20 right-[15%] w-64 h-64 rounded-full blur-[80px] opacity-20 animate-pulse"
          style={{ background: `radial-gradient(circle, ${c.p}, ${c.s})`, animationDuration: '4s' }} />
        <div className="absolute bottom-20 left-[20%] w-32 h-32 rounded-full blur-[60px] opacity-10"
          style={{ background: c.a }} />

        <div className="relative max-w-7xl mx-auto px-8 w-full py-20">
          {/* Badge / logo hero */}
          <div className="mb-12">
            {cfg.logo_url ? (
              <div className="flex justify-center">
                <img src={cfg.logo_url} alt={cfg.company_name}
                  className="h-20 object-contain"
                  style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' }} />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: `${c.p}10`, border: `1px solid ${c.p}20` }}>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: c.p }} />
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: c.p }}>
                    {cfg.hero_badge}
                  </span>
                </div>
                <div className="h-px flex-1 max-w-[60px]" style={{ background: `linear-gradient(to right, ${c.p}40, transparent)` }} />
              </div>
            )}
          </div>

          <div className="mb-8">
            <h1 className="font-black text-white leading-[0.88]"
              style={{ fontSize: 'clamp(3.5rem, 9vw, 9rem)', fontFamily: "'Sora', sans-serif", letterSpacing: '-0.04em' }}>
              MEDICINA
            </h1>
            <div className="flex items-center gap-6">
              <h1 className="font-black leading-[0.88]"
                style={{ fontSize: 'clamp(3.5rem, 9vw, 9rem)', fontFamily: "'Sora', sans-serif", letterSpacing: '-0.04em',
                  WebkitTextStroke: `2px ${c.p}`, color: 'transparent' }}>
                DEL
              </h1>
              <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${c.p}20, ${c.s}20)`, border: `1px solid ${c.p}30` }}>
                  <Brain size={24} style={{ color: c.p }} />
                </div>
                <div>
                  <p className="text-xs font-black text-white">IA Médica</p>
                  <p className="text-[10px]" style={{ color: '#64748b' }}>Claude · Anthropic</p>
                </div>
              </div>
            </div>
            <h1 className="font-black text-white leading-[0.88]"
              style={{ fontSize: 'clamp(3.5rem, 9vw, 9rem)', fontFamily: "'Sora', sans-serif", letterSpacing: '-0.04em' }}>
              FUTURO
            </h1>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end gap-8 lg:gap-16">
            <p className="text-lg max-w-sm leading-relaxed" style={{ color: '#7c8fa8' }}>
              {cfg.hero_subtitle}
            </p>
            <div className="flex items-center gap-4">
              <button onClick={() => setModal(true)}
                className="group h-14 px-8 rounded-2xl text-sm font-black text-white flex items-center gap-3 transition-all hover:-translate-y-1"
                style={{ background: `linear-gradient(135deg, ${c.p}, ${c.s})`, boxShadow: `0 16px 40px ${c.p}35` }}>
                Empezar gratis
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight size={12} />
                </div>
              </button>
              <Link href="/auth/login">
                <button className="h-14 px-6 rounded-2xl text-sm font-semibold transition-all hover:bg-white/5"
                  style={{ border: '1px solid rgba(255,255,255,0.11)', color: '#7c8fa8' }}>
                  Ya soy cliente
                </button>
              </Link>
            </div>
          </div>

          <div className="mt-20 pt-8 border-t grid grid-cols-2 md:grid-cols-4 gap-8"
            style={{ borderColor: 'rgba(255,255,255,0.11)' }}>
            {[['500+','Médicos activos','en Chile'],['98%','Satisfacción','garantizada'],['2h','Ahorro diario','por doctor'],['24/7','Disponibilidad','en la nube']].map(([v,l,s]) => (
              <div key={l} className="flex items-start gap-3">
                <div className="w-px h-8 mt-1 flex-shrink-0" style={{ background: `linear-gradient(to bottom, ${c.p}, transparent)` }} />
                <div>
                  <p className="text-2xl font-black text-white leading-none">{v}</p>
                  <p className="text-xs font-bold mt-1" style={{ color: '#7c8fa8' }}>{l}</p>
                  <p className="text-[10px]" style={{ color: '#64748b' }}>{s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="border-y overflow-hidden py-4" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
        <div className="flex gap-10 whitespace-nowrap" style={{ animation: 'marquee 25s linear infinite' }}>
          {[...Array(4)].flatMap(() =>
            ['Gestión Clínica','·','Agenda Médica','·','IA Diagnóstica','·','Reportes PDF','·','Correos Automáticos','·','Seguimiento Clínico','·','Medicamentos','·','Análisis de Casos']
              .map((t,i) => (
                <span key={`${t}${i}`} className="text-xs font-semibold"
                  style={{ color: t==='·' ? c.p : '#7c8fa8' }}>{t}</span>
              ))
          )}
        </div>
      </div>

      {/* ── MÓDULOS ── */}
      <section id="módulos" className="py-32">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-end justify-between mb-16">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-3" style={{ color: c.p }}>Módulos</p>
              <h2 className="text-5xl font-black text-white" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: '-0.03em' }}>
                Cada función,<br />perfecta.
              </h2>
            </div>
            <p className="hidden md:block text-sm max-w-xs text-right pb-2" style={{ color: '#64748b' }}>
              Diseñado por médicos para médicos. Sin complejidad innecesaria.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px"
            style={{ background: 'rgba(255,255,255,0.11)', borderRadius: 24, overflow: 'hidden' }}>
            {cfg.features.map((f: any, i: number) => {
              const Icon = ICON_MAP[f.icon] || Brain
              return (
                <div key={f.title} className="group relative p-8 transition-all duration-500 cursor-default"
                  style={{ background: '#131d30' }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(135deg, ${f.color}08, transparent)` }} />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-6">
                      <span className="text-5xl font-black leading-none"
                        style={{ color: 'rgba(255,255,255,0.10)', fontFamily: "'Sora', sans-serif" }}>
                        {String(i+1).padStart(2,'0')}
                      </span>
                      {f.premium && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                          style={{ background: `${c.p}15`, color: c.p, border: `1px solid ${c.p}20` }}>
                          PREMIUM
                        </span>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                      style={{ background: `${f.color}12`, border: `1px solid ${f.color}20` }}>
                      <Icon size={18} style={{ color: f.color }} />
                    </div>
                    <h3 className="font-black text-white mb-2 text-base">{f.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{f.desc}</p>
                    <div className="mt-6 h-px w-0 group-hover:w-full transition-all duration-500"
                      style={{ background: `linear-gradient(to right, ${f.color}, transparent)` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── IA SECTION ── */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${c.p}05, transparent 60%)` }} />
        <div className="relative max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="inline-block mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] px-3 py-1.5 rounded-full"
                  style={{ background: `${c.p}10`, border: `1px solid ${c.p}20`, color: c.p }}>
                  Solo Premium
                </span>
              </div>
              <h2 className="font-black text-white mb-6 leading-[0.9]"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)', fontFamily: "'Sora', sans-serif", letterSpacing: '-0.03em' }}>
                Un médico<br />
                <span style={{ WebkitTextStroke: `2px ${c.p}`, color: 'transparent' }}>
                  que nunca<br />duerme.
                </span>
              </h2>
              <p className="text-base leading-relaxed mb-8 max-w-sm" style={{ color: '#7c8fa8' }}>
                Claude de Anthropic analiza casos, sugiere medicamentos y genera informes en segundos.
              </p>
              <div className="space-y-3 mb-8">
                {['Medicamentos con dosis y contraindicaciones','Diagnósticos diferenciales al instante','Resúmenes clínicos automáticos','Informes PDF generados por IA','Detección de interacciones'].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `${c.p}15` }}>
                      <Check size={9} style={{ color: c.p }} />
                    </div>
                    <span className="text-sm" style={{ color: '#64748b' }}>{item}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setModal(true)}
                className="group h-12 px-6 rounded-xl text-sm font-black text-white flex items-center gap-2 transition-all hover:-translate-y-0.5 w-fit"
                style={{ background: `linear-gradient(135deg, ${c.p}, ${c.s})`, boxShadow: `0 8px 24px ${c.p}30` }}>
                Activar IA <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl blur-2xl opacity-15"
                style={{ background: `linear-gradient(135deg, ${c.p}, ${c.s})` }} />
              <div className="relative rounded-3xl overflow-hidden"
                style={{ background: '#131d30', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="px-6 py-4 flex items-center gap-3 border-b"
                  style={{ borderColor: 'rgba(255,255,255,0.11)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${c.p}, ${c.s})` }}>
                    <Brain size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white">ClinivigilIA</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px]" style={{ color: '#10b981' }}>En línea</span>
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
                    <div key={i} className={`flex gap-3 ${msg.role==='user' ? 'flex-row-reverse' : ''}`}>
                      <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
                        style={{ background: msg.role==='ai' ? `${c.p}15` : `${c.a}15` }}>
                        {msg.role==='ai' ? <Brain size={10} style={{ color: c.p }} /> : <Stethoscope size={10} style={{ color: c.a }} />}
                      </div>
                      <div className="max-w-[75%] px-3.5 py-2.5 rounded-2xl text-xs"
                        style={msg.role==='ai' ? {
                          background: (msg as any).special ? `${c.p}15` : '#131d30',
                          color: (msg as any).special ? c.p : '#64748b',
                          border: (msg as any).special ? `1px solid ${c.p}20` : '1px solid rgba(255,255,255,0.07)',
                          fontWeight: (msg as any).special ? '700' : '400',
                        } : { background: `${c.a}12`, color: '#94a3b8', border: `1px solid ${c.a}15` }}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-6 pb-6">
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                    style={{ background: '#131d30', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-xs flex-1" style={{ color: '#7c8fa8' }}>Escribe tu consulta...</span>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${c.p}, ${c.s})` }}>
                      <ArrowRight size={10} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section id="precios" className="py-32">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4" style={{ color: c.p }}>Precios</p>
            <h2 className="text-5xl font-black text-white" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: '-0.03em' }}>
              Transparente.<br />Sin sorpresas.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {cfg.plans.map((plan: any, i: number) => (
              <div key={plan.name}
                onMouseEnter={() => setHoverPlan(i)}
                onMouseLeave={() => setHoverPlan(null)}
                className="relative rounded-3xl p-7 cursor-pointer transition-all duration-300"
                style={{
                  background: hoverPlan===i ? `${plan.color}08` : '#131d30',
                  border: `1px solid ${hoverPlan===i || plan.popular ? plan.color+'25' : 'rgba(255,255,255,0.11)'}`,
                  transform: hoverPlan===i ? 'translateY(-4px)' : 'none',
                  boxShadow: hoverPlan===i ? `0 24px 48px ${plan.color}12` : 'none',
                }}>
                {plan.popular && (
                  <div className="absolute -top-px left-8 right-8 h-px"
                    style={{ background: `linear-gradient(90deg, transparent, ${plan.color}, transparent)` }} />
                )}
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <p className="text-sm font-black text-white">{plan.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#7c8fa8' }}>{plan.desc}</p>
                  </div>
                  {plan.popular && (
                    <span className="text-[9px] font-black px-2 py-1 rounded-full"
                      style={{ background: `${plan.color}15`, color: plan.color }}>POPULAR</span>
                  )}
                </div>
                <div className="mb-8">
                  {plan.price === '0' ? (
                    <p className="text-5xl font-black text-white leading-none">Gratis</p>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-sm font-bold mb-1" style={{ color: plan.color }}>$</span>
                      <p className="text-5xl font-black text-white leading-none">{plan.price}</p>
                      <span className="text-xs mb-1" style={{ color: '#7c8fa8' }}>/mes</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2.5 mb-8">
                  {(plan.modules||[]).map((m: string) => (
                    <div key={m} className="flex items-center gap-2.5">
                      <Check size={11} style={{ color: plan.color }} />
                      <span className="text-xs" style={{ color: '#64748b' }}>{m}</span>
                    </div>
                  ))}
                  {(plan.missing||[]).map((m: string) => (
                    <div key={m} className="flex items-center gap-2.5 opacity-40">
                      <X size={11} style={{ color: '#64748b' }} />
                      <span className="text-xs line-through" style={{ color: '#64748b' }}>{m}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setModal(true)}
                  className="w-full py-3 rounded-xl text-xs font-black transition-all"
                  style={plan.popular ? {
                    background: `linear-gradient(135deg, ${plan.color}, ${c.s})`, color: 'white',
                  } : {
                    background: 'rgba(255,255,255,0.10)', color: '#64748b', border: '1px solid rgba(255,255,255,0.07)',
                  }}>
                  {plan.price === '0' ? 'Empezar gratis' : 'Solicitar acceso'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section id="testimonios" className="py-32 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-5"
          style={{ background: `linear-gradient(to left, ${c.p}, transparent)` }} />
        <div className="relative max-w-7xl mx-auto px-8">
          <div className="mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4" style={{ color: c.p }}>Testimonios</p>
            <h2 className="text-5xl font-black text-white" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: '-0.03em' }}>
              Ellos ya lo usan.
            </h2>
          </div>
          <div className="space-y-px" style={{ background: 'rgba(255,255,255,0.10)', borderRadius: 20, overflow: 'hidden' }}>
            {cfg.testimonials.map((t: any) => (
              <div key={t.name}
                className="group grid md:grid-cols-[200px,1fr,auto] gap-8 items-center p-8 transition-all duration-300 hover:bg-white/[0.02]"
                style={{ background: '#131d30' }}>
                <div>
                  <p className="text-sm font-black text-white">{t.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: c.p }}>{t.specialty}</p>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>"{t.text}"</p>
                <div className="flex gap-0.5 flex-shrink-0">
                  {[...Array(t.stars||5)].map((_,i) => (
                    <Star key={i} size={11} fill="#f59e0b" style={{ color: '#f59e0b' }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-32">
        <div className="max-w-4xl mx-auto px-8">
          <div className="grid md:grid-cols-[280px,1fr] gap-16">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4" style={{ color: c.p }}>FAQ</p>
              <h2 className="text-4xl font-black text-white" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: '-0.03em' }}>
                Dudas<br />frecuentes.
              </h2>
            </div>
            <div className="space-y-2">
              {faqs.map((f, i) => (
                <div key={i} className="rounded-2xl overflow-hidden transition-all"
                  style={{ background: '#131d30', border: `1px solid ${faq===i ? c.p+'15' : 'rgba(255,255,255,0.10)'}` }}>
                  <button onClick={() => setFaq(faq===i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left">
                    <span className="text-sm font-bold text-white">{f.q}</span>
                    <ChevronDown size={14} style={{
                      color: faq===i ? c.p : '#7c8fa8',
                      transform: faq===i ? 'rotate(180deg)' : 'none',
                      transition: 'all 0.2s', flexShrink: 0
                    }} />
                  </button>
                  {faq===i && (
                    <div className="px-5 pb-4">
                      <p className="text-sm" style={{ color: '#64748b' }}>{f.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="relative py-40 overflow-hidden">
        <div className="absolute inset-0"
          style={{ backgroundImage: `radial-gradient(circle, ${c.p}10 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[800px] h-[400px] rounded-full blur-[120px] opacity-10"
            style={{ background: `linear-gradient(135deg, ${c.p}, ${c.s})` }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-8 text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.4em] mb-6 flex items-center justify-center gap-3">
            <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.p})` }} />
            <span style={{ color: c.p }}>Comienza hoy</span>
            <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.p})` }} />
          </div>
          <h2 className="font-black text-white mb-6 leading-[0.9]"
            style={{ fontSize: 'clamp(3rem, 7vw, 7rem)', fontFamily: "'Sora', sans-serif", letterSpacing: '-0.04em' }}>
            TU PRÁCTICA,<br />
            <span style={{ WebkitTextStroke: `2px ${c.p}`, color: 'transparent' }}>REINVENTADA.</span>
          </h2>
          <p className="text-lg mb-10" style={{ color: '#64748b' }}>
            Únete a cientos de médicos que ya recuperaron su tiempo.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => setModal(true)}
              className="group h-14 px-10 rounded-2xl text-sm font-black text-white flex items-center gap-3 transition-all hover:-translate-y-1"
              style={{ background: `linear-gradient(135deg, ${c.p}, ${c.s})`, boxShadow: `0 20px 50px ${c.p}35` }}>
              Solicitar demo gratuita
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <Link href="/auth/login">
              <button className="h-14 px-8 rounded-2xl text-sm font-semibold transition-all hover:bg-white/5"
                style={{ border: '1px solid rgba(255,255,255,0.11)', color: '#64748b' }}>
                Ya tengo cuenta
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t py-8" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {cfg.logo_url ? (
              <img src={cfg.logo_url} alt={cfg.company_name} className="h-7 object-contain max-w-[120px]" />
            ) : (
              <>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${c.p}, ${c.s})` }}>
                  <Stethoscope size={11} className="text-white" />
                </div>
                <span className="text-xs font-black text-white">{cfg.company_name}</span>
              </>
            )}
          </div>
          <p className="text-[10px]" style={{ color: '#64748b' }}>
            © {new Date().getFullYear()} {cfg.company_name}. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <a href="mailto:diego.castillo.p11@gmail.com" className="text-[10px] transition-colors hover:text-white" style={{ color: '#64748b' }}>Contacto</a>
            <button onClick={() => setModal(true)} className="text-[10px] font-black transition-colors" style={{ color: c.p }}>Demo →</button>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
      `}</style>

      {modal && <Modal onClose={() => setModal(false)} colors={{ p: c.p, s: c.s }} />}
    </div>
  )
}