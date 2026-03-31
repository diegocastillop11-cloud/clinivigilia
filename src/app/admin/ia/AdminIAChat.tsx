'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Brain, Send, Sparkles, Loader2, Users, BarChart2, Building2, RefreshCw } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Props {
  platformData: any
}

const QUICK_PROMPTS = [
  { label: 'Resumen general', icon: BarChart2, prompt: 'Dame un resumen completo del estado actual de la plataforma ClinivigilIA. Incluye métricas clave, clientes más activos y cualquier observación importante.' },
  { label: 'Clientes activos', icon: Users, prompt: '¿Cuáles son los clientes más activos? Analiza quiénes tienen más pacientes y mayor uso de la plataforma.' },
  { label: 'Análisis de planes', icon: BarChart2, prompt: 'Analiza la distribución de planes (Free, Pro, Premium, Enterprise). ¿Qué oportunidades de upsell ves? ¿Qué clientes podrían beneficiarse de un upgrade?' },
  { label: 'Estado clínicas', icon: Building2, prompt: 'Dame un reporte detallado de las clínicas registradas: su estado, plan, médicos y actividad.' },
  { label: 'Métricas de citas', icon: BarChart2, prompt: 'Analiza las métricas de citas de la plataforma. ¿Cuál es la tasa de completitud? ¿Hay muchas cancelaciones?' },
  { label: 'Oportunidades', icon: Sparkles, prompt: 'Basándote en los datos actuales, ¿qué oportunidades de negocio ves? ¿Qué clientes están cerca de su límite o podrían necesitar más módulos?' },
]

function buildSystemPrompt(platformData: any): string {
  return `Eres el asistente IA privado y exclusivo de Diego Castillo, fundador y superadmin de ClinivigilIA — una plataforma SaaS médica chilena.

Tu rol es ser su analista de negocio inteligente. Tienes acceso completo y en tiempo real a todos los datos de la plataforma.

DATOS ACTUALES DE LA PLATAFORMA (actualizados al momento):
${JSON.stringify(platformData, null, 2)}

TUS CAPACIDADES:
1. Analizar el estado de todos los clientes (doctores y clínicas)
2. Identificar oportunidades de negocio y upsell
3. Detectar clientes en riesgo (suspendidos, sin actividad)
4. Generar insights sobre uso de módulos y planes
5. Responder preguntas específicas sobre cualquier cliente
6. Analizar métricas globales de pacientes y citas
7. Sugerir estrategias de crecimiento

REGLAS:
- Habla siempre en español, tono profesional pero cercano
- Sé directo y accionable — no des respuestas genéricas
- Cuando menciones clientes, usa sus nombres reales de los datos
- Si te preguntan por un cliente específico, busca en los datos y da info exacta
- Usa emojis con moderación para hacer más legible la respuesta
- Formatea bien con secciones cuando sea apropiado

Eres el asistente más valioso de Diego para tomar decisiones sobre su negocio.`
}

function formatMessage(content: string): string {
  return content
    .replace(/^#{4,}\s(.+)$/gm, '<h5 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:10px 0 4px;opacity:0.7">$1</h5>')
    .replace(/^### (.+)$/gm, '<h4 style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin:10px 0 4px;color:inherit">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="font-size:13px;font-weight:700;margin:12px 0 5px;color:inherit">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 style="font-size:14px;font-weight:800;margin:12px 0 6px;color:inherit">$1</h2>')
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^[-•]\s(.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0"><span style="opacity:0.5;flex-shrink:0">•</span><span>$1</span></div>')
    .replace(/^(\d+)\.\s(.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0"><span style="opacity:0.5;flex-shrink:0;font-weight:700">$1.</span><span>$2</span></div>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid currentColor;opacity:0.15;margin:12px 0"/>')
    .replace(/\n\n/g, '<div style="height:8px"></div>')
    .replace(/\n/g, '<br/>')
}

export default function AdminIAChat({ platformData }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setMounted(true)
    setMessages([{
      id: '0',
      role: 'assistant',
      content: `Hola Diego! 👋 Soy tu asistente IA privado con acceso completo a ClinivigilIA.\n\nTengo datos en tiempo real de:\n• **${platformData.resumen.total_clientes} clientes** registrados (${platformData.resumen.clientes_activos} activos)\n• **${platformData.resumen.total_pacientes} pacientes** en la plataforma\n• **${platformData.resumen.total_citas} citas** registradas\n• **${platformData.resumen.total_clinicas} clínicas** activas\n\n¿Qué quieres analizar hoy?`,
      timestamp: new Date(),
    }])
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const systemPrompt = buildSystemPrompt(platformData)
      const conversationHistory = messages
        .filter(m => m.id !== '0')
        .map(m => ({ role: m.role, content: m.content }))

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system: systemPrompt,
          messages: [...conversationHistory, { role: 'user', content: content.trim() }],
        }),
      })

      const data = await response.json()
      const text = data.content?.find((b: any) => b.type === 'text')?.text || 'No pude generar respuesta.'

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: text,
        timestamp: new Date(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error de conexión. Intenta nuevamente.',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [messages, loading, platformData])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const handleReset = () => {
    setMessages([{
      id: '0',
      role: 'assistant',
      content: `Chat reiniciado. Tengo datos actualizados de ${platformData.resumen.total_clientes} clientes y ${platformData.resumen.total_pacientes} pacientes. ¿En qué te ayudo?`,
      timestamp: new Date(),
    }])
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col h-screen" style={{ background: '#0f172a' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b"
        style={{ background: '#1e293b', borderColor: '#334155' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Asistente IA — SuperAdmin</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[11px]" style={{ color: '#64748b' }}>
                {platformData.resumen.total_clientes} clientes · {platformData.resumen.total_pacientes} pacientes · datos en tiempo real
              </span>
            </div>
          </div>
        </div>
        <button onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
          style={{ background: 'rgba(129,140,248,0.1)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.2)' }}>
          <RefreshCw size={12} /> Reiniciar
        </button>
      </div>

      {/* Quick prompts */}
      <div className="flex items-center gap-2 px-6 py-3 overflow-x-auto border-b"
        style={{ borderColor: '#334155', background: '#1e293b' }}>
        <span className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: '#475569' }}>
          Acciones
        </span>
        {QUICK_PROMPTS.map(qp => (
          <button key={qp.label} onClick={() => sendMessage(qp.prompt)} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border flex-shrink-0 transition-all hover:-translate-y-px disabled:opacity-50"
            style={{ background: 'rgba(129,140,248,0.1)', borderColor: 'rgba(129,140,248,0.2)', color: '#818cf8' }}>
            <qp.icon size={12} /> {qp.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={msg.role === 'assistant'
                ? { background: 'linear-gradient(135deg, #818cf8, #6366f1)' }
                : { background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              {msg.role === 'assistant'
                ? <Brain size={13} className="text-white" />
                : <span className="text-white text-[10px] font-black">DC</span>}
            </div>
            <div className={`max-w-[78%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
              style={msg.role === 'user' ? {
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
              } : {
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#f1f5f9',
              }}>
              <p className="text-xs leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
              <p className="text-[10px] mt-1.5"
                style={{ color: msg.role === 'user' ? 'rgba(255,255,255,0.6)' : '#475569', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                {msg.timestamp.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
              <Brain size={13} className="text-white" />
            </div>
            <div className="rounded-2xl rounded-tl-sm px-4 py-3 border"
              style={{ background: '#1e293b', borderColor: '#334155' }}>
              <div className="flex items-center gap-2">
                <Loader2 size={13} className="animate-spin" style={{ color: '#818cf8' }} />
                <span className="text-xs" style={{ color: '#475569' }}>Analizando datos...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t" style={{ borderColor: '#334155', background: '#1e293b' }}>
        <div className="flex items-end gap-3 rounded-2xl border px-4 py-3"
          style={{ background: '#0f172a', borderColor: '#334155' }}>
          <Sparkles size={15} className="mb-1 flex-shrink-0" style={{ color: '#818cf8' }} />
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Consulta datos de tus clientes... (Enter para enviar)"
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none text-xs leading-relaxed text-white"
            style={{ maxHeight: '100px', minHeight: '20px' }}
          />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
            <Send size={12} className="text-white" />
          </button>
        </div>
        <p className="text-[10px] text-center mt-2" style={{ color: '#334155' }}>
          Datos actualizados en tiempo real · Solo visible para el superadmin
        </p>
      </div>
    </div>
  )
}