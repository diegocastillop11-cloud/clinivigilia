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

  const [messages, setMessages] = useState([
    {
      role: 'assistant' as const,
      content: `¡Hola! 👋 Soy el asistente de **${page.clinic_name}**. ¿En qué puedo ayudarte hoy?`,
    }
  ])
  const [input, setInput]     = useState(initialMessage || '')
  const [loading, setLoading] = useState(false)
  const autoSentRef = useRef(false)
  const [booked, setBooked]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (initialMessage) {
      setInput(initialMessage)
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [])

  useEffect(() => {
    if (!loading) inputRef.current?.focus()
  }, [loading])

  async function send(text?: string) {
    const msg = (text || input).trim()
    if (!msg || loading) return
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
      {/* Overlay */}
      <div onClick={onClose} style={{
        position:'fixed', inset:0, zIndex:200,
        background:'rgba(0,0,0,0.45)',
        backdropFilter:'blur(3px)',
        animation:'fadeIn 0.2s ease',
      }}/>

      {/* Panel */}
      <div style={{
        position:'fixed', top:0, left:0, bottom:0,
        width:'min(520px, 100vw)',
        zIndex:201,
        display:'flex', flexDirection:'column',
        background:panelBg,
        boxShadow:'4px 0 40px rgba(0,0,0,0.2)',
        animation:'slideInLeft 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* ── Header compacto ── */}
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
            transition:'background 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.background='rgba(255,255,255,0.2)')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* ── Mensajes ── */}
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
                maxWidth:'82%',
                padding:'10px 14px',
                borderRadius: m.role==='user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.role==='user'
                  ? `linear-gradient(135deg,${primary},${page.accent_color})`
                  : msgBg,
                color: m.role==='user' ? '#fff' : textCol,
                fontSize:14,
                lineHeight:1.55,
                boxShadow: m.role==='user'
                  ? `0 3px 12px ${primary}30`
                  : '0 1px 4px rgba(0,0,0,0.05)',
              }}
                dangerouslySetInnerHTML={{ __html: renderContent(m.content) }}
              />
            </div>
          ))}

          {/* Typing */}
          {loading && (
            <div style={{ display:'flex', alignItems:'flex-end', gap:8 }}>
              <div style={{
                width:28, height:28, borderRadius:8, flexShrink:0,
                background:`linear-gradient(135deg,${primary},${page.accent_color})`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#fff',
              }}>✨</div>
              <div style={{
                padding:'10px 16px', borderRadius:'16px 16px 16px 4px',
                background:msgBg, display:'flex', gap:4, alignItems:'center',
              }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width:7, height:7, borderRadius:'50%', background:primary,
                    animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`,
                  }}/>
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* ── Quick replies — solo al inicio ── */}
        {messages.length===1 && !loading && (
          <div style={{ padding:'6px 16px 4px', display:'flex', flexWrap:'wrap', gap:6 }}>
            {quickReplies.map(q => (
              <button key={q} onClick={() => send(q)} style={{
                padding:'6px 12px', borderRadius:16, fontSize:12, fontWeight:500,
                border:`1.5px solid ${primary}35`, color:primary,
                background:`${primary}0d`, cursor:'pointer', transition:'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background=`${primary}1a` }}
                onMouseLeave={e => { e.currentTarget.style.background=`${primary}0d` }}
              >{q}</button>
            ))}
          </div>
        )}

        {/* ── Banner cita agendada ── */}
        {booked && (
          <div style={{
            margin:'8px 16px', padding:'10px 14px', borderRadius:12,
            background:'#f0fdf4', border:'1px solid #bbf7d0',
            display:'flex', alignItems:'center', gap:8,
          }}>
            <span style={{ fontSize:18 }}>🎉</span>
            <p style={{ fontSize:13, color:'#166534', fontWeight:600 }}>
              ¡Cita agendada! El doctor recibirá la notificación.
            </p>
          </div>
        )}

        {/* ── Input ── */}
        <div style={{
          padding:'10px 14px 16px', flexShrink:0,
          borderTop:`1px solid ${isDark?'#1e1e38':'#f1f5f9'}`,
        }}>
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
              placeholder="Escribe tu consulta aquí..."
              rows={1}
              disabled={booked}
              style={{
                flex:1, border:'none', outline:'none', resize:'none',
                background:'transparent', color: booked ? '#94a3b8' : textCol,
                fontSize:14, lineHeight:1.5, maxHeight:100,
                fontFamily:'inherit',
              }}
            />
            <button onClick={() => send()} disabled={!input.trim()||loading||booked} style={{
              width:38, height:38, borderRadius:10, flexShrink:0,
              background:!input.trim()||loading||booked ? '#e2e8f0' : `linear-gradient(135deg,${primary},${page.accent_color})`,
              border:'none', cursor:!input.trim()||loading||booked ? 'default':'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:!input.trim()||loading||booked ? '#94a3b8':'#fff',
              transition:'all 0.2s',
              boxShadow:!input.trim()||loading||booked ? 'none':`0 3px 10px ${primary}35`,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
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
