'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Doctor, Patient } from '@/types/database'
import {
  Brain, Send, User, Stethoscope, Pill, FileText,
  ChevronDown, X, Sparkles, AlertCircle, Loader2,
  Search, ClipboardList
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Props {
  doctor: Doctor | null
  patients: Patient[]
}

const QUICK_PROMPTS = [
  {
    label: 'Sugerir medicamentos',
    icon: 'pill',
    prompt: 'Basándote en el diagnóstico del paciente seleccionado, ¿qué medicamentos serían apropiados? Incluye dosis, frecuencia y posibles contraindicaciones.',
  },
  {
    label: 'Resumen del historial',
    icon: 'file',
    prompt: 'Genera un resumen clínico completo del paciente seleccionado, incluyendo evolución, alertas importantes y recomendaciones.',
  },
  {
    label: 'Análisis del caso',
    icon: 'clipboard',
    prompt: 'Analiza el caso clínico del paciente seleccionado y proporciona una evaluación detallada con posibles diagnósticos diferenciales y plan de tratamiento sugerido.',
  },
  {
    label: 'Interacciones medicamentosas',
    icon: 'alert',
    prompt: 'Revisa si hay posibles interacciones medicamentosas importantes que deba considerar para este paciente, basándote en su historial.',
  },
]

function buildSystemPrompt(doctor: Doctor | null, patient: Patient | null): string {
  const doctorInfo = doctor
    ? `Eres el asistente de IA del Dr./Dra. ${doctor.full_name}, especialista en ${doctor.specialty?.replace('_', ' ') || 'medicina general'}.`
    : 'Eres un asistente médico de IA altamente especializado.'

  const patientContext = patient
    ? `
PACIENTE EN CONTEXTO:
- Nombre: ${patient.first_name} ${patient.last_name}
- RUT: ${patient.rut || 'No registrado'}
- Género: ${patient.gender || 'No especificado'}
- Fecha de nacimiento: ${patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('es-CL') : 'No registrada'}
- Especialidad: ${patient.specialty?.replace('_', ' ')}
- Estado: ${patient.status}
- Notas clínicas: ${patient.notes || 'Sin notas registradas'}
`
    : 'No hay paciente seleccionado. Responde consultas médicas generales.'

  return `${doctorInfo}

Tu rol es ser el asistente médico más completo e inteligente posible. Debes:
1. Responder con precisión clínica y evidencia médica actualizada
2. Sugerir medicamentos con dosis, vía de administración y contraindicaciones cuando sea relevante
3. Analizar casos clínicos de forma sistemática
4. Alertar sobre situaciones de riesgo o interacciones importantes
5. Proporcionar información basada en guías clínicas actualizadas
6. Hablar siempre en español, con terminología médica apropiada pero explicaciones claras
7. Ser directo y útil, priorizando la eficiencia del médico

IMPORTANTE: Siempre incluir el disclaimer de que tus sugerencias son de apoyo y no reemplazan el juicio clínico del médico.

${patientContext}

Responde de forma estructurada cuando sea apropiado, usando secciones claras. Sé conciso pero completo.`
}

function formatMessage(content: string): string {
  return content
    .replace(/^#{4,}\s(.+)$/gm, '<h5 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:10px 0 4px;opacity:0.6">$1</h5>')
    .replace(/^### (.+)$/gm, '<h4 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:10px 0 4px;opacity:0.7">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="font-size:12px;font-weight:700;margin:12px 0 5px;color:inherit">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 style="font-size:13px;font-weight:800;margin:12px 0 6px;color:inherit">$1</h2>')
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^[-•]\s(.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0"><span style="opacity:0.5;flex-shrink:0">•</span><span>$1</span></div>')
    .replace(/^(\d+)\.\s(.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0"><span style="opacity:0.5;flex-shrink:0;font-weight:700">$1.</span><span>$2</span></div>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid currentColor;opacity:0.15;margin:12px 0"/>')
    .replace(/\n\n/g, '<div style="height:8px"></div>')
    .replace(/\n/g, '<br/>')
}

export default function IAChat({ doctor, patients }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientSearch, setPatientSearch] = useState('')
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    setMessages([{
      id: '0',
      role: 'assistant',
      content: `Hola${doctor ? `, Dr. ${doctor.full_name?.split(' ')[0]}` : ''}! Soy tu asistente medico IA.\n\nPuedo ayudarte con:\n• Sugerencias de medicamentos y dosis\n• Analisis y resumenes de casos clinicos\n• Consultas sobre diagnosticos diferenciales\n• Interacciones medicamentosas\n• Informacion clinica basada en evidencia\n\nSelecciona un paciente para contexto especifico, o hazme cualquier consulta medica directamente.`,
      timestamp: new Date(),
    }])
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowPatientDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredPatients = patients.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearch.toLowerCase()) ||
    (p.rut && p.rut.includes(patientSearch))
  )

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
      const systemPrompt = buildSystemPrompt(doctor, selectedPatient)
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
          max_tokens: 1000,
          system: systemPrompt,
          messages: [
            ...conversationHistory,
            { role: 'user', content: content.trim() }
          ],
        }),
      })

      const data = await response.json()
      const text = data.content?.find((b: any) => b.type === 'text')?.text || 'No pude generar una respuesta.'

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: text,
        timestamp: new Date(),
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Ocurrio un error al conectar con la IA. Por favor intenta nuevamente.',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [messages, loading, doctor, selectedPatient])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setShowPatientDropdown(false)
    setPatientSearch('')
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Perfecto, ahora tengo el contexto de **${patient.first_name} ${patient.last_name}**.\n\nPuedo sugerir medicamentos, analizar su caso o generar un resumen clinico.`,
      timestamp: new Date(),
    }])
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg-main)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>
            <Brain size={16} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Asistente Medico IA
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                Activo - Claude Sonnet
              </span>
            </div>
          </div>
        </div>

        {/* Patient selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowPatientDropdown(!showPatientDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: selectedPatient ? 'var(--clinic-primary-light)' : 'var(--bg-card)',
              borderColor: selectedPatient ? 'var(--clinic-primary)' : 'var(--border-color)',
              color: selectedPatient ? 'var(--clinic-primary)' : 'var(--text-muted)',
            }}>
            <User size={14} />
            {selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : 'Seleccionar paciente'}
            <ChevronDown size={14} />
          </button>

          {selectedPatient && (
            <button
              onClick={() => setSelectedPatient(null)}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors">
              <X size={10} className="text-white" />
            </button>
          )}

          {showPatientDropdown && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border shadow-2xl z-50 overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="p-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'var(--bg-main)' }}>
                  <Search size={13} style={{ color: 'var(--text-muted)' }} />
                  <input
                    autoFocus
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    placeholder="Buscar paciente..."
                    className="bg-transparent text-xs outline-none flex-1"
                    style={{ color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto py-1">
                {filteredPatients.length === 0 ? (
                  <p className="text-xs px-4 py-3 text-center" style={{ color: 'var(--text-muted)' }}>
                    No se encontraron pacientes
                  </p>
                ) : filteredPatients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => selectPatient(p)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:opacity-80 transition-opacity">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, var(--clinic-primary), color-mix(in srgb, var(--clinic-primary) 70%, #000))' }}>
                      {p.first_name[0]}{p.last_name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {p.specialty?.replace('_', ' ')} - {p.rut || 'Sin RUT'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick prompts */}
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto border-b"
        style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
        <span className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
          Acciones
        </span>
        {QUICK_PROMPTS.map(qp => (
          <button
            key={qp.label}
            onClick={() => sendMessage(qp.prompt)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border flex-shrink-0 transition-all hover:-translate-y-px disabled:opacity-50"
            style={{
              background: 'var(--clinic-primary-light)',
              borderColor: 'var(--clinic-primary-medium)',
              color: 'var(--clinic-primary)',
            }}>
            {qp.icon === 'pill' && <Pill size={14} />}
            {qp.icon === 'file' && <FileText size={14} />}
            {qp.icon === 'clipboard' && <ClipboardList size={14} />}
            {qp.icon === 'alert' && <AlertCircle size={14} />}
            {qp.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={msg.role === 'assistant'
                ? { background: 'linear-gradient(135deg, #818cf8, #6366f1)' }
                : { background: 'linear-gradient(135deg, var(--clinic-primary), color-mix(in srgb, var(--clinic-primary) 70%, #000))' }
              }>
              {msg.role === 'assistant' ? <Brain size={15} className="text-white" /> : <Stethoscope size={15} className="text-white" />}
            </div>

            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
              style={msg.role === 'user' ? {
                background: 'linear-gradient(135deg, var(--clinic-primary), color-mix(in srgb, var(--clinic-primary) 80%, #000))',
                color: 'white',
              } : {
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}>
              <p className="text-xs leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
              <p className="text-[10px] mt-1.5"
                style={{
                  color: msg.role === 'user' ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)',
                  textAlign: msg.role === 'user' ? 'right' : 'left'
                }}>
                {msg.timestamp.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
              <Brain size={15} className="text-white" />
            </div>
            <div className="rounded-2xl rounded-tl-sm px-4 py-3 border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" style={{ color: 'var(--clinic-primary)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Analizando...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
        {selectedPatient && (
          <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'var(--clinic-primary-light)', color: 'var(--clinic-primary)' }}>
            <User size={12} />
            Contexto: {selectedPatient.first_name} {selectedPatient.last_name} - {selectedPatient.specialty?.replace('_', ' ')}
          </div>
        )}
        <div className="flex items-end gap-3 rounded-2xl border px-4 py-3"
          style={{ background: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
          <Sparkles size={16} className="mb-1 flex-shrink-0" style={{ color: 'var(--clinic-primary)' }} />
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu consulta medica... (Enter para enviar, Shift+Enter para nueva linea)"
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none text-sm leading-relaxed"
            style={{ color: 'var(--text-primary)', maxHeight: '120px', minHeight: '24px' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 disabled:opacity-40 disabled:scale-100"
            style={{
              background: 'linear-gradient(135deg, var(--clinic-primary), color-mix(in srgb, var(--clinic-primary) 70%, #000))',
            }}>
            <Send size={14} className="text-white" />
          </button>
        </div>
        <p className="text-[10px] text-center mt-2" style={{ color: 'var(--text-muted)' }}>
          Las sugerencias de la IA son de apoyo clinico y no reemplazan el juicio medico profesional
        </p>
      </div>
    </div>
  )
}