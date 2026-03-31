'use client'

import { useState, useEffect, useRef } from 'react'
import type { WebPage, WebService } from '@/types/gestor-web'
import Link from 'next/link'

interface Props {
  page: WebPage
  services: WebService[]
  featuredProducts?: any[]
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `${r} ${g} ${b}`
}

function formatPrice(s: WebService) {
  if (s.price_label) return s.price_label
  if (!s.price_from) return 'Consultar precio'
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: s.price_currency || 'CLP', maximumFractionDigits: 0 }).format(s.price_from)
}

// ─── Iconos ───────────────────────────────────────────────
const IconPhone     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.08 6.08l.98-.98a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
const IconMail      = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const IconMap       = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
const IconWhatsapp  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
const IconInstagram = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
const IconFacebook  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
const IconBot       = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/><path d="M7 15h.01M17 15h.01"/></svg>
const IconCalendar  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
const IconClock     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const IconChevron   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
const IconX         = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IconSend      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
const IconSparkle   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>

// ─── Panel de chat lateral izquierdo ─────────────────────

function ChatPanel({ page, services, initialMessage, onClose }: {
  page: WebPage
  services: WebService[]
  initialMessage?: string
  onClose: () => void
}) {
  const primary = page.primary_color
  const isDark  = page.theme === 'dark'
  const panelBg = isDark ? '#0f0f1e' : '#ffffff'
  const msgBg   = isDark ? '#1e1e38' : '#f3f4f6'
  const textCol = isDark ? '#e5e7eb' : '#111827'

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(`chat_${page.slug}`)
      return saved ? JSON.parse(saved) : [{
        role: 'assistant' as const,
        content: `¡Hola! 👋 Soy el asistente de **${page.clinic_name}**. ¿En qué puedo ayudarte hoy?`,
      }]
    } catch {
      return [{
        role: 'assistant' as const,
        content: `¡Hola! 👋 Soy el asistente de **${page.clinic_name}**. ¿En qué puedo ayudarte hoy?`,
      }]
    }
  })

  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [booked, setBooked]   = useState(false)
  const sentRef   = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Pre-cargar mensaje en el input si viene de un servicio
  useEffect(() => {
    if (initialMessage && !sentRef.current) {
      sentRef.current = true
      setMessages((p: {role: 'user'|'assistant', content: string}[]) => [...p, { role: 'user' as const, content: initialMessage }])      
      setLoading(true)
      fetch('/api/gestor-web/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: page.doctor_id,
          slug: page.slug,
          messages: [
            { role: 'assistant', content: `¡Hola! 👋 Soy el asistente de **${page.clinic_name}**. ¿En qué puedo ayudarte hoy?` },
            { role: 'user', content: initialMessage },
          ],
          services: services.map(s => ({
            id: s.id, name: s.name, ia_context: s.ia_context,
            ia_keywords: s.ia_keywords, duration_min: s.duration_min,
            price_label: s.price_label, price_from: s.price_from, short_desc: s.short_desc,
          })),
        }),
      })
      .then(r => r.json())
      .then(data => {
        setMessages(p => [...p, { role: 'assistant', content: data.reply || 'Error al procesar.' }])
        if (data.booked) setBooked(true)
      })
      .catch(() => {
        setMessages(p => [...p, { role: 'assistant', content: 'Error de conexión.' }])
      })
      .finally(() => {
        setLoading(false)
        sentRef.current = false
      })
    }
  }, [])

  useEffect(() => {
    if (!loading) inputRef.current?.focus()
  }, [loading])

  useEffect(() => {
    try {
      localStorage.setItem(`chat_${page.slug}`, JSON.stringify(messages))
    } catch {}
  }, [messages])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading || sentRef.current) return
    sentRef.current = true
    setInput('')

    const userMsg = { role: 'user' as const, content: msg }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/gestor-web/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: page.doctor_id,
          slug: page.slug,
          messages: newMessages,
          services: services.map(s => ({
            id: s.id,
            name: s.name,
            ia_context: s.ia_context,
            ia_keywords: s.ia_keywords,
            duration_min: s.duration_min,
            price_label: s.price_label,
            price_from: s.price_from,
            short_desc: s.short_desc,
          })),
        }),
      })
      const data = await res.json()
      setMessages(p => [...p, { role: 'assistant', content: data.reply || 'Error al procesar.' }])
      if (data.booked) setBooked(true)
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: 'Error de conexión. Intenta de nuevo.' }])
    }
    setLoading(false)
    sentRef.current = false
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function renderContent(text: string) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  const quickReplies = [
    '¿Cuáles son los servicios?',
    'Quiero agendar una cita',
    '¿Cuánto cuesta la consulta?',
    '¿Cuál es la dirección?',
  ]

  return (
    <>
      <div onClick={onClose} style={{
        position:'fixed', inset:0, zIndex:200,
        background:'rgba(0,0,0,0.45)',
        backdropFilter:'blur(3px)',
        animation:'fadeIn 0.2s ease',
      }}/>

      <div style={{
        position:'fixed', top:0, left:0, bottom:0,
        width:'min(520px, 100vw)',
        zIndex:201,
        display:'flex', flexDirection:'column',
        background:panelBg,
        boxShadow:'4px 0 40px rgba(0,0,0,0.2)',
        animation:'slideInLeft 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* Header */}
        <div style={{
          padding:'14px 20px',
          background:`linear-gradient(135deg,${primary},${page.accent_color})`,
          flexShrink:0,
          display:'flex', alignItems:'center', gap:12,
        }}>
          <div style={{
            width:38, height:38, borderRadius:11, flexShrink:0,
            background:'rgba(255,255,255,0.2)',
            display:'flex', alignItems:'center', justifyContent:'center', color:'#fff',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/><path d="M7 15h.01M17 15h.01"/></svg>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontWeight:700, color:'#fff', fontSize:14, lineHeight:1 }}>Asistente IA</p>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', animation:'pulse 2s infinite' }}/>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.8)' }}>{page.clinic_name}</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width:32, height:32, borderRadius:8, flexShrink:0,
            background:'rgba(255,255,255,0.2)', border:'none', cursor:'pointer',
            color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Mensajes */}
        <div style={{
          flex:1, overflowY:'auto', padding:'16px 16px 8px',
          display:'flex', flexDirection:'column', gap:12, minHeight:0,
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display:'flex',
              flexDirection: m.role==='user' ? 'row-reverse' : 'row',
              alignItems:'flex-end', gap:8,
            }}>
              {m.role==='assistant' && (
                <div style={{
                  width:28, height:28, borderRadius:8, flexShrink:0,
                  background:`linear-gradient(135deg,${primary},${page.accent_color})`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, color:'#fff', fontWeight:700,
                }}>✨</div>
              )}
              <div style={{
                maxWidth:'82%', padding:'10px 14px',
                borderRadius: m.role==='user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.role==='user' ? `linear-gradient(135deg,${primary},${page.accent_color})` : msgBg,
                color: m.role==='user' ? '#fff' : textCol,
                fontSize:14, lineHeight:1.55,
                boxShadow: m.role==='user' ? `0 3px 12px ${primary}30` : '0 1px 4px rgba(0,0,0,0.05)',
              }}
                dangerouslySetInnerHTML={{ __html: renderContent(m.content) }}
              />
            </div>
          ))}

          {loading && (
            <div style={{ display:'flex', alignItems:'flex-end', gap:8 }}>
              <div style={{
                width:28, height:28, borderRadius:8, flexShrink:0,
                background:`linear-gradient(135deg,${primary},${page.accent_color})`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#fff',
              }}>✨</div>
              <div style={{ padding:'10px 16px', borderRadius:'16px 16px 16px 4px', background:msgBg, display:'flex', gap:4, alignItems:'center' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:primary, animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }}/>
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Quick replies */}
        {messages.length===1 && !loading && !initialMessage && (
          <div style={{ padding:'6px 16px 4px', display:'flex', flexWrap:'wrap', gap:6 }}>
            {quickReplies.map(q => (
              <button key={q} onClick={() => send(q)} style={{
                padding:'6px 12px', borderRadius:16, fontSize:12, fontWeight:500,
                border:`1.5px solid ${primary}35`, color:primary,
                background:`${primary}0d`, cursor:'pointer',
              }}>{q}</button>
            ))}
          </div>
        )}

        {/* Banner cita agendada */}
        {booked && (
          <div style={{
            margin:'8px 16px', padding:'10px 14px', borderRadius:12,
            background:'#f0fdf4', border:'1px solid #bbf7d0',
            display:'flex', alignItems:'center', gap:8,
          }}>
            <span style={{ fontSize:18 }}>🎉</span>
            <p style={{ fontSize:13, color:'#166534', fontWeight:600 }}>¡Cita agendada! El doctor recibirá la notificación.</p>
          </div>
        )}

        {/* Input */}
        <div style={{ padding:'10px 14px 16px', flexShrink:0, borderTop:`1px solid ${isDark?'#1e1e38':'#f1f5f9'}` }}>
          <div style={{
            display:'flex', gap:8, alignItems:'flex-end',
            background:isDark?'#1e1e38':'#f8fafc',
            borderRadius:14, padding:'8px 8px 8px 14px',
            border:`1.5px solid ${primary}28`,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={initialMessage ? 'Presiona Enter para enviar...' : 'Escribe tu consulta aquí...'}
              rows={1}
              disabled={booked}
              style={{
                flex:1, border:'none', outline:'none', resize:'none',
                background:'transparent', color: booked ? '#94a3b8' : textCol,
                fontSize:14, lineHeight:1.5, maxHeight:100, fontFamily:'inherit',
              }}
            />
            <button onClick={() => send()} disabled={!input.trim()||loading||booked} style={{
              width:38, height:38, borderRadius:10, flexShrink:0,
              background:!input.trim()||loading||booked ? '#e2e8f0' : `linear-gradient(135deg,${primary},${page.accent_color})`,
              border:'none', cursor:!input.trim()||loading||booked ? 'default':'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:!input.trim()||loading||booked ? '#94a3b8':'#fff', transition:'all 0.2s',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
            <button onClick={() => {
              localStorage.removeItem(`chat_${page.slug}`)
              setMessages([{ role: 'assistant', content: `¡Hola! 👋 Soy el asistente de **${page.clinic_name}**. ¿En qué puedo ayudarte hoy?` }])
            }} style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
              color: '#fff', fontSize: 11, fontWeight: 700,
            }} title="Nueva conversación">
              🗑️
            </button>

          </div>
          <p style={{ fontSize:11, color:isDark?'#334155':'#cbd5e1', textAlign:'center', marginTop:6 }}>
            Enter para enviar · Shift+Enter nueva línea
          </p>
        </div>
      </div>
    </>
  )
}

function ServiceCard({ service, primary, accent, theme, onBook }: {
  service: WebService; primary: string; accent: string; theme: string
  onBook: (serviceName: string) => void
}) {
  const isDark = theme === 'dark'
  return (
    <div
      onClick={() => onBook(service.name)}
      style={{
        background: isDark ? '#1e1e3a' : '#fff',
        border: `1px solid ${isDark ? '#2d2d5a' : '#f0f0f0'}`,
        borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
        transition: 'all 0.25s',
        boxShadow: isDark ? 'none' : '0 2px 16px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = `0 12px 32px ${primary}20`
        e.currentTarget.style.borderColor = primary + '50'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = isDark ? 'none' : '0 2px 16px rgba(0,0,0,0.06)'
        e.currentTarget.style.borderColor = isDark ? '#2d2d5a' : '#f0f0f0'
      }}
    >
      {/* Línea de color top */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${primary}, ${accent})` }}/>

      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: primary + '15',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          }}>
            {service.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontWeight: 700, fontSize: 17, color: isDark ? '#f1f5f9' : '#0f172a', marginBottom: 4 }}>
              {service.name}
            </h3>
            {service.short_desc && (
              <p style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.5 }}>
                {service.short_desc}
              </p>
            )}
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 16, borderTop: `1px solid ${isDark ? '#2d2d5a' : '#f1f5f9'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isDark ? '#64748b' : '#94a3b8' }}>
            <IconClock />
            <span style={{ fontSize: 13 }}>{service.duration_min} min</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: primary }}>
              {formatPrice(service)}
            </span>
            <span style={{
              fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 20,
              background: primary, color: '#fff',
              display: 'flex', alignItems: 'center', gap: 4,
              boxShadow: `0 4px 12px ${primary}40`,
            }}>
              Agendar <IconChevron />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── LANDING PRINCIPAL ────────────────────────────────────
export default function LandingClient({ page, services, featuredProducts = [] }: Props) {
  const [chatOpen,    setChatOpen]    = useState(false)
  const [initialMsg,  setInitialMsg]  = useState<string | undefined>()
  const [scrolled,    setScrolled]    = useState(false)
  const [mounted,     setMounted]     = useState(false)

  const primary = page.primary_color || '#6366F1'
  const accent  = page.accent_color  || '#8B5CF6'
  const isDark  = page.theme === 'dark'

  const bg      = isDark ? '#0d0d1a' : '#ffffff'
  const bgAlt   = isDark ? '#13132a' : '#f8fafc'
  const textPri = isDark ? '#f1f5f9' : '#0f172a'
  const textSec = isDark ? '#94a3b8' : '#64748b'
  const border  = isDark ? '#1e1e3a' : '#f1f5f9'

  useEffect(() => {
    setMounted(true)
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  function openChat(serviceName?: string) {
    const msg = serviceName
      ? `Hola, me interesa el servicio de **${serviceName}** y quisiera agendar una cita. ¿Pueden ayudarme?`
      : undefined
    setInitialMsg(msg)
    setChatOpen(true)
  }

  function closeChat() {
    setChatOpen(false)
    setInitialMsg(undefined)
  }

  const whatsappUrl = page.whatsapp
    ? `https://wa.me/${page.whatsapp.replace(/\D/g,'')}`
    : null

  return (
    <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=${(page.font_heading||'Sora').replace(' ','+')}:wght@400;600;700;800&family=${(page.font_body||'DM+Sans').replace(' ','+')}:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: '${page.font_body||'DM Sans'}', sans-serif; background: ${bg}; color: ${textPri}; }
        h1,h2,h3,h4 { font-family: '${page.font_heading||'Sora'}', sans-serif; }
        :root { --p: ${primary}; --a: ${accent}; --p-rgb: ${hexToRgb(primary)}; }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideInLeft { from{transform:translateX(-100%)} to{transform:translateX(0)} }
        @keyframes bounce    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes glow      { 0%,100%{box-shadow:0 0 0 0 rgb(var(--p-rgb)/0.4)} 50%{box-shadow:0 0 0 10px rgb(var(--p-rgb)/0)} }
        .fade-up   { animation: fadeUp 0.6s ease both; }
        .fade-up-1 { animation-delay:0.1s; }
        .fade-up-2 { animation-delay:0.2s; }
        .fade-up-3 { animation-delay:0.3s; }
        .fade-up-4 { animation-delay:0.4s; }
        .btn-primary {
          display:inline-flex; align-items:center; gap:8px;
          padding:14px 28px; border-radius:14px; font-weight:700; font-size:16px;
          background:linear-gradient(135deg,var(--p),var(--a));
          color:#fff; border:none; cursor:pointer;
          box-shadow:0 8px 24px rgb(var(--p-rgb)/0.35);
          transition:all 0.2s; animation:glow 3s ease infinite;
          font-family:inherit;
        }
        .btn-primary:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgb(var(--p-rgb)/0.45); }
        .btn-secondary {
          display:inline-flex; align-items:center; gap:8px;
          padding:14px 28px; border-radius:14px; font-weight:600; font-size:16px;
          background:transparent; color:var(--p); border:2px solid rgb(var(--p-rgb)/0.3);
          cursor:pointer; transition:all 0.2s; font-family:inherit; text-decoration:none;
        }
        .btn-secondary:hover { background:rgb(var(--p-rgb)/0.08); border-color:var(--p); }
        .nav-link { text-decoration:none; font-size:15px; font-weight:500; color:${textSec}; transition:color 0.2s; }
        .nav-link:hover { color:var(--p); }
        .contact-chip {
          display:flex; align-items:center; gap:12px;
          padding:16px 20px; border-radius:16px; text-decoration:none;
          transition:all 0.2s; color:${textPri};
          background:${isDark?'#1e1e3a':'#f8fafc'};
          border:1px solid ${border};
        }
        .contact-chip:hover { background:rgb(var(--p-rgb)/0.08); border-color:var(--p); transform:translateY(-2px); }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${primary}40; border-radius:3px; }
      `}</style>

      {/* ─── NAVBAR ────────────────────────────────────── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        padding:'0 32px', height:68,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        transition:'all 0.3s',
        background: mounted && scrolled ? (isDark?'rgba(13,13,26,0.96)':'rgba(255,255,255,0.96)') : 'transparent',
        backdropFilter: mounted && scrolled ? 'blur(20px)' : 'none',
        borderBottom: mounted && scrolled ? `1px solid ${border}` : 'none',
      }}>
      
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {page.hero_image_url ? (
            <img
              src={page.hero_image_url}
              alt={page.clinic_name || ''}
              style={{ width:38, height:38, borderRadius:11, objectFit:'cover' }}
            />
          ) : (
            <div style={{
              width:38, height:38, borderRadius:11,
              background:`linear-gradient(135deg,${primary},${accent})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fff', fontWeight:800, fontSize:17,
            }}>
              {(page.clinic_name||'C')[0]}
            </div>
          )}
          <div>
            <span style={{ fontFamily:`'${page.font_heading||'Sora'}',sans-serif`, fontWeight:700, fontSize:17, color:textPri, display:'block', lineHeight:1.1 }}>
              {page.clinic_name}
            </span>
            <span style={{ fontSize:10, color:primary, fontWeight:600, letterSpacing:'0.05em' }}>
              Parte de ClinivigilIA
            </span>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:28 }}>
          {page.show_services  && <a href="#servicios" className="nav-link">Servicios</a>}
          {page.about_text     && <a href="#nosotros"  className="nav-link">Nosotros</a>}
          {page.phone          && <a href="#contacto"  className="nav-link">Contacto</a>}
          {page.show_booking   && (
            <button className="btn-primary" style={{ padding:'9px 20px', fontSize:14, animation:'none' }}
              onClick={() => openChat()}>
              <IconCalendar /> Agendar cita
            </button>
          )}
        </div>
      </nav>

      {/* ─── HERO ──────────────────────────────────────── */}
      <section style={{
        minHeight:'100vh', display:'flex', alignItems:'center',
        position:'relative', overflow:'hidden', paddingTop:68,
      }}>
        <div style={{
          position:'absolute', inset:0, zIndex:0,
          background:`radial-gradient(ellipse 80% 60% at 60% 40%,${primary}18 0%,transparent 70%),
                      radial-gradient(ellipse 50% 40% at 20% 80%,${accent}12 0%,transparent 60%)`,
        }}/>
        <div style={{
          position:'absolute', top:'15%', right:'-5%',
          width:420, height:420, borderRadius:'50%',
          border:`1px solid ${primary}20`, zIndex:0,
        }}/>
        <div style={{
          maxWidth:1200, margin:'0 auto', padding:'80px 32px',
          display:'grid',
          gridTemplateColumns: page.hero_image_url ? '1fr 1fr' : '1fr',
          gap:64, alignItems:'center', position:'relative', zIndex:1, width:'100%',
        }}>
          <div>
            {page.tagline && (
              <div className="fade-up" style={{
                display:'inline-flex', alignItems:'center', gap:6,
                background:`${primary}18`, color:primary,
                padding:'6px 16px', borderRadius:100, fontSize:14, fontWeight:600,
                marginBottom:24, border:`1px solid ${primary}25`,
              }}>
                <IconSparkle /> {page.tagline}
              </div>
            )}
            <h1 className="fade-up fade-up-1" style={{
              fontSize:'clamp(38px,5.5vw,68px)', fontWeight:800,
              lineHeight:1.1, letterSpacing:'-0.03em', color:textPri, marginBottom:20,
            }}>
              {page.clinic_name}
            </h1>
            {page.about_text && (
              <p className="fade-up fade-up-2" style={{
                fontSize:18, color:textSec, lineHeight:1.75,
                maxWidth:520, marginBottom:36,
              }}>
                {page.about_text.slice(0,180)}{page.about_text.length>180?'...':''}
              </p>
            )}
            <div className="fade-up fade-up-3" style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {page.show_chat_ia && (
                <button className="btn-primary" onClick={() => openChat()}>
                  <IconBot /> Consultar con IA
                </button>
              )}
              {page.show_services && (
                <a href="#servicios" className="btn-secondary">
                  Ver servicios <IconChevron />
                </a>
              )}
            </div>
            {services.length > 0 && (
              <div className="fade-up fade-up-4" style={{ display:'flex', gap:36, marginTop:52 }}>
                <div>
                  <p style={{ fontSize:30, fontWeight:800, color:primary }}>{services.length}</p>
                  <p style={{ fontSize:13, color:textSec }}>Servicios disponibles</p>
                </div>
                {page.show_booking && (
                  <div>
                    <p style={{ fontSize:30, fontWeight:800, color:primary }}>24/7</p>
                    <p style={{ fontSize:13, color:textSec }}>Agendamiento online</p>
                  </div>
                )}
                <div>
                  <p style={{ fontSize:30, fontWeight:800, color:primary }}>IA</p>
                  <p style={{ fontSize:13, color:textSec }}>Asistente inteligente</p>
                </div>
              </div>
            )}
          </div>
          {page.hero_image_url && (
            <div className="fade-up fade-up-2" style={{ position:'relative' }}>
              <div style={{
                position:'absolute', inset:-12,
                background:`linear-gradient(135deg,${primary}20,${accent}20)`,
                borderRadius:32, transform:'rotate(3deg)',
              }}/>
              <img src={page.hero_image_url} alt={page.clinic_name||''} style={{
                width:'100%', aspectRatio:'4/3', objectFit:'cover',
                borderRadius:24, position:'relative',
                boxShadow:`0 24px 64px ${primary}25`,
              }}/>
            </div>
          )}
        </div>
      </section>

      {/* ─── SERVICIOS ─────────────────────────────────── */}
      {page.show_services && services.length > 0 && (
        <section id="servicios" style={{ background:bgAlt, padding:'96px 32px' }}>
          <div style={{ maxWidth:1200, margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:56 }}>
              <p style={{ fontSize:13, fontWeight:700, color:primary, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>
                Nuestros servicios
              </p>
              <h2 style={{ fontSize:'clamp(28px,4vw,42px)', fontWeight:800, letterSpacing:'-0.02em', color:textPri, marginBottom:12 }}>
                ¿En qué podemos ayudarte?
              </h2>
              <p style={{ fontSize:16, color:textSec, maxWidth:520, margin:'0 auto' }}>
                Haz clic en cualquier servicio para{' '}
                <strong style={{ color:primary }}>chatear con nuestra IA</strong>{' '}
                y agendar tu cita al instante
              </p>
            </div>
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',
              gap:20,
            }}>
              {services.map(s => (
                <ServiceCard
                  key={s.id} service={s}
                  primary={primary} accent={accent} theme={page.theme}
                  onBook={name => openChat(name)}
                />
              ))}
            </div>
            {page.show_booking && (
              <div style={{ textAlign:'center', marginTop:48 }}>
                <button className="btn-primary" onClick={() => openChat()}>
                  <IconCalendar /> Agendar una cita ahora
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {page.show_services && featuredProducts.length > 0 && (
        <section style={{ background: bg, padding: '80px 32px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: primary, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Nuestra tienda
                </p>
                <h2 style={{ fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 800, letterSpacing: '-0.02em', color: textPri }}>
                  Productos destacados
                </h2>
              </div>
              <a href={`/${page.slug}/tienda`} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 20px', borderRadius: 12,
                background: primary + '15', color: primary,
                fontWeight: 700, fontSize: 14, textDecoration: 'none',
                border: `1.5px solid ${primary}30`, transition: 'all 0.2s',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                Ver todos los productos →
              </a>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 20,
            }}>
              {featuredProducts.slice(0, 4).map((p: any) => (
                <a key={p.id} href={`/${page.slug}/tienda`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: isDark ? '#1e1e3a' : '#fff',
                    border: `1px solid ${isDark ? '#2d2d5a' : '#f0f0f0'}`,
                    borderRadius: 18, overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    transition: 'all 0.25s', cursor: 'pointer',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = `0 12px 32px ${primary}18`
                      e.currentTarget.style.borderColor = primary + '40'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'
                      e.currentTarget.style.borderColor = isDark ? '#2d2d5a' : '#f0f0f0'
                    }}
                  >
                    <div style={{ position: 'relative', paddingTop: '70%', overflow: 'hidden', background: primary + '10' }}>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} style={{
                          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                        }}/>
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📦</div>
                      )}
                    </div>
                    <div style={{ padding: '14px 16px' }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: isDark ? '#f1f5f9' : '#0f172a', marginBottom: 4 }}>{p.name}</p>
                      {p.short_desc && <p style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 8, lineHeight: 1.4 }}>{p.short_desc}</p>}
                      <p style={{ fontSize: 15, fontWeight: 800, color: primary }}>
                        {p.price_label || new Intl.NumberFormat('es-CL', { style: 'currency', currency: p.currency || 'CLP', maximumFractionDigits: 0 }).format(p.price)}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 36 }}>
              <a href={`/${page.slug}/tienda`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 32px', borderRadius: 14,
                background: `linear-gradient(135deg, ${primary}, ${accent})`,
                color: '#fff', fontWeight: 700, fontSize: 16, textDecoration: 'none',
                boxShadow: `0 8px 24px ${primary}35`,
              }}>
                🛒 Ver todos los productos
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ─── SOBRE NOSOTROS ────────────────────────────── */}
      {page.about_text && (
        <section id="nosotros" style={{ padding:'96px 32px', background:bg }}>
          <div style={{ maxWidth:800, margin:'0 auto', textAlign:'center' }}>
            <p style={{ fontSize:13, fontWeight:700, color:primary, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>
              Sobre nosotros
            </p>
            <h2 style={{ fontSize:'clamp(28px,4vw,42px)', fontWeight:800, letterSpacing:'-0.02em', color:textPri, marginBottom:24 }}>
              Quiénes somos
            </h2>
            <p style={{ fontSize:17, color:textSec, lineHeight:1.85 }}>{page.about_text}</p>
          </div>
        </section>
      )}

      {/* ─── CONTACTO ──────────────────────────────────── */}
      {(page.phone||page.whatsapp||page.email||page.address) && (
        <section id="contacto" style={{ background:bgAlt, padding:'96px 32px' }}>
          <div style={{ maxWidth:1200, margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:56 }}>
              <p style={{ fontSize:13, fontWeight:700, color:primary, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>
                Contacto
              </p>
              <h2 style={{ fontSize:'clamp(28px,4vw,42px)', fontWeight:800, letterSpacing:'-0.02em', color:textPri }}>
                Encuéntranos
              </h2>
            </div>
            <div style={{
              display:'grid',
              gridTemplateColumns: page.maps_url ? '1fr 1fr' : '1fr',
              gap:40, alignItems:'start',
            }}>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {page.phone && (
                  <a href={`tel:${page.phone}`} className="contact-chip">
                    <span style={{ color:primary }}><IconPhone /></span>
                    <div>
                      <p style={{ fontSize:11, color:textSec, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Teléfono</p>
                      <p style={{ fontSize:16, fontWeight:600 }}>{page.phone}</p>
                    </div>
                  </a>
                )}
                {whatsappUrl && (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="contact-chip">
                    <span style={{ color:'#25D366' }}><IconWhatsapp /></span>
                    <div>
                      <p style={{ fontSize:11, color:textSec, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>WhatsApp</p>
                      <p style={{ fontSize:16, fontWeight:600 }}>{page.whatsapp}</p>
                    </div>
                  </a>
                )}
                {page.email && (
                  <a href={`mailto:${page.email}`} className="contact-chip">
                    <span style={{ color:primary }}><IconMail /></span>
                    <div>
                      <p style={{ fontSize:11, color:textSec, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Email</p>
                      <p style={{ fontSize:16, fontWeight:600 }}>{page.email}</p>
                    </div>
                  </a>
                )}
                {page.address && (
                  <a href={page.maps_url||'#'} target={page.maps_url?'_blank':undefined} rel="noopener noreferrer" className="contact-chip">
                    <span style={{ color:primary }}><IconMap /></span>
                    <div>
                      <p style={{ fontSize:11, color:textSec, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Dirección</p>
                      <p style={{ fontSize:16, fontWeight:600 }}>{page.address}</p>
                      {page.city && <p style={{ fontSize:14, color:textSec }}>{page.city}</p>}
                    </div>
                  </a>
                )}
                {(page.instagram_url||page.facebook_url) && (
                  <div style={{ display:'flex', gap:10, marginTop:4 }}>
                    {page.instagram_url && (
                      <a href={page.instagram_url} target="_blank" rel="noopener noreferrer" className="contact-chip" style={{ flex:1, justifyContent:'center' }}>
                        <IconInstagram /> Instagram
                      </a>
                    )}
                    {page.facebook_url && (
                      <a href={page.facebook_url} target="_blank" rel="noopener noreferrer" className="contact-chip" style={{ flex:1, justifyContent:'center' }}>
                        <IconFacebook /> Facebook
                      </a>
                    )}
                  </div>
                )}
              </div>
              {page.maps_url && (
                <div style={{ borderRadius:20, overflow:'hidden', height:380, border:`1px solid ${border}` }}>
                  <iframe
                    src={page.maps_url.replace('/maps/','/maps/embed?').replace('?q=','&q=')}
                    width="100%" height="100%" style={{ border:0 }}
                    allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── FOOTER ────────────────────────────────────── */}
      <footer style={{ background:isDark?'#080812':'#0f172a', padding:'40px 32px', textAlign:'center' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:16 }}>
            
            {page.hero_image_url ? (
              <img
                src={page.hero_image_url}
                alt={page.clinic_name || ''}
                style={{ width:38, height:38, borderRadius:11, objectFit:'cover' }}
              />
            ) : (
              <div style={{
                width:38, height:38, borderRadius:11,
                background:`linear-gradient(135deg,${primary},${accent})`,
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#fff', fontWeight:800, fontSize:17,
              }}>
                {(page.clinic_name||'C')[0]}
              </div>
            )}

            <span style={{ fontFamily:`'${page.font_heading||'Sora'}',sans-serif`, fontWeight:700, fontSize:15, color:'#f1f5f9' }}>
              {page.clinic_name}
            </span>
          </div>
          <p style={{ fontSize:13, color:'#475569', marginBottom:12 }}>
            {page.tagline||'Tu salud es nuestra prioridad'}
          </p>
          <p style={{ fontSize:11, color:'#334155' }}>
            Powered by <span style={{ color:primary, fontWeight:700 }}>ClinivigilIA</span> — Sistema de gestión médica inteligente
          </p>
        </div>
      </footer>

      {/* ─── BOTÓN FLOTANTE ────────────────────────────── */}
      {!chatOpen && page.show_chat_ia && (
        <button
          onClick={() => openChat()}
          style={{
            position:'fixed', bottom:28, right:28, zIndex:150,
            display:'flex', alignItems:'center', gap:10,
            padding:'14px 22px', borderRadius:50,
            background:`linear-gradient(135deg,${primary},${accent})`,
            color:'#fff', border:'none', cursor:'pointer', fontFamily:'inherit',
            fontWeight:700, fontSize:15,
            boxShadow:`0 8px 32px ${primary}50`,
            transition:'all 0.2s', animation:'glow 3s ease infinite',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform='scale(1.05)' }}
          onMouseLeave={e => { e.currentTarget.style.transform='scale(1)' }}
        >
          <IconBot />
          Consultar con IA
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#4ade80', animation:'pulse 2s infinite' }}/>
        </button>
      )}

      {/* ─── CHAT PANEL ────────────────────────────────── */}
      {chatOpen && (
        <ChatPanel
          page={page}
          services={services}
          initialMessage={initialMsg}
          onClose={closeChat}
        />
      )}
    </>
  )
}
