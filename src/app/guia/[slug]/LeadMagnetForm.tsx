'use client'

import { useState } from 'react'

const PRIMARY = '#6366f1'
const GRADIENT = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'

interface Props {
  slug: string
  title: string
  description: string | null
}

const PREOCUPACIONES = [
  'Caída del cabello',
  'Adelgazamiento',
  'Caspa / grasa / picazón',
  'Alopecia diagnosticada',
  'Postparto / estrés',
  'No sé, necesito evaluación',
]

const TIEMPOS = [
  'Menos de 3 meses',
  '3 a 6 meses',
  'Más de 6 meses',
  'Más de 1 año',
]

function RadioGroup({ name, options, value, onChange, label }: {
  name: string
  options: string[]
  value: string
  onChange: (v: string) => void
  label: string
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontWeight: 600, fontSize: 14, color: '#374151', marginBottom: 10, lineHeight: 1.5 }}>
        {label} <span style={{ color: PRIMARY }}>*</span>
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map(opt => (
          <label key={opt} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 16px', borderRadius: 12, cursor: 'pointer',
            border: `2px solid ${value === opt ? PRIMARY : '#e5e7eb'}`,
            background: value === opt ? '#f0f0ff' : '#fafafa',
            transition: 'all 0.15s',
          }}>
            <input
              type="radio"
              name={name}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              style={{ display: 'none' }}
            />
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${value === opt ? PRIMARY : '#d1d5db'}`,
              background: value === opt ? PRIMARY : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}>
              {value === opt && (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
              )}
            </div>
            <span style={{ fontSize: 14, color: value === opt ? PRIMARY : '#4b5563', fontWeight: value === opt ? 600 : 400 }}>
              {opt}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: 12, boxSizing: 'border-box',
  border: '2px solid #e5e7eb', fontSize: 15, outline: 'none',
  background: '#fafafa', fontFamily: 'inherit', color: '#111827',
  transition: 'border-color 0.15s',
}

export default function LeadMagnetForm({ slug, title, description }: Props) {
  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '',
    preocupacion: '', tiempo_problema: '', quiere_info: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    if (error) setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.preocupacion || !form.tiempo_problema || !form.quiere_info) {
      setError('Por favor selecciona una opción en cada pregunta.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/lead-captures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          nombre: form.nombre,
          email: form.email,
          telefono: form.telefono,
          preocupacion: form.preocupacion,
          tiempo_problema: form.tiempo_problema,
          quiere_info: form.quiere_info === 'SI',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Ocurrió un error. Por favor intenta de nuevo.')
        return
      }
      setDownloadUrl(data.download_url)
    } catch {
      setError('Error de conexión. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (downloadUrl) {
    return (
      <div style={{
        minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}>
        <div style={{
          width: '100%', maxWidth: 480, background: '#fff', borderRadius: 24,
          boxShadow: '0 20px 60px rgba(99,102,241,0.12)', overflow: 'hidden', textAlign: 'center',
        }}>
          <div style={{ padding: '52px 32px 36px', background: GRADIENT }}>
            <div style={{ fontSize: 64, marginBottom: 16, lineHeight: 1 }}>🎉</div>
            <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 12 }}>
              ¡Felicitaciones!
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 16, lineHeight: 1.5 }}>
              Tu guía está lista para descargar
            </p>
          </div>
          <div style={{ padding: '36px 32px 28px' }}>
            <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 28, lineHeight: 1.65 }}>
              Gracias por completar el formulario. Haz clic en el botón para descargar tu guía gratuita.
            </p>
            <a
              href={downloadUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '16px 32px', borderRadius: 14,
                background: GRADIENT, color: '#fff', fontWeight: 700,
                fontSize: 16, textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Descargar guía gratuita
            </a>
            <p style={{ color: '#d1d5db', fontSize: 13, marginTop: 16 }}>
              ⏱ Este enlace estará disponible por 7 días
            </p>
          </div>
          <div style={{ padding: '14px 16px', borderTop: '1px solid #f3f4f6' }}>
            <p style={{ fontSize: 12, color: '#9ca3af' }}>
              Powered by <strong style={{ color: PRIMARY }}>ClinivigilIA</strong>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      paddingBottom: 48,
    }}>
      {/* Header */}
      <div style={{ background: GRADIENT, padding: '40px 24px 32px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.2)', padding: '6px 16px',
          borderRadius: 100, marginBottom: 20,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, letterSpacing: '0.05em' }}>DESCARGA GRATUITA</span>
        </div>
        <h1 style={{
          color: '#fff', fontSize: 'clamp(20px, 5vw, 30px)', fontWeight: 800,
          lineHeight: 1.25, maxWidth: 520, margin: '0 auto 12px',
        }}>
          {title}
        </h1>
        {description && (
          <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 15, maxWidth: 440, margin: '0 auto', lineHeight: 1.65 }}>
            {description}
          </p>
        )}
      </div>

      {/* Form card */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 16px' }}>
        <div style={{
          background: '#fff', borderRadius: '0 0 24px 24px',
          boxShadow: '0 20px 60px rgba(99,102,241,0.1)',
          padding: '32px 28px 28px',
        }}>
          <form onSubmit={handleSubmit}>

            {/* Nombre */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Nombre Completo <span style={{ color: PRIMARY }}>*</span>
              </label>
              <input
                type="text"
                required
                value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                placeholder="Tu nombre completo"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = PRIMARY}
                onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Correo Electrónico <span style={{ color: PRIMARY }}>*</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="tu@correo.com"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = PRIMARY}
                onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* Teléfono */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Teléfono <span style={{ color: PRIMARY }}>*</span>
              </label>
              <input
                type="tel"
                required
                value={form.telefono}
                onChange={e => set('telefono', e.target.value)}
                placeholder="+56 9 1234 5678"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = PRIMARY}
                onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div style={{ height: 1, background: '#f3f4f6', marginBottom: 28 }} />

            <RadioGroup
              name="preocupacion"
              label="¿Cuál es tu principal preocupación capilar?"
              options={PREOCUPACIONES}
              value={form.preocupacion}
              onChange={v => set('preocupacion', v)}
            />

            <RadioGroup
              name="tiempo_problema"
              label="¿Hace cuánto tiempo notas el problema?"
              options={TIEMPOS}
              value={form.tiempo_problema}
              onChange={v => set('tiempo_problema', v)}
            />

            <RadioGroup
              name="quiere_info"
              label="¿Te gustaría recibir información o promociones de tratamientos capilares?"
              options={['SI', 'NO']}
              value={form.quiere_info}
              onChange={v => set('quiere_info', v)}
            />

            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: 12, marginBottom: 16,
                background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 14,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '16px', borderRadius: 14,
                background: loading ? '#e5e7eb' : GRADIENT,
                color: loading ? '#9ca3af' : '#fff',
                fontWeight: 700, fontSize: 16, border: 'none', cursor: loading ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: loading ? 'none' : '0 8px 24px rgba(99,102,241,0.35)',
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}
            >
              {loading ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ animation: 'lm-spin 1s linear infinite' }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Procesando...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Enviar y descargar guía
                </>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 20 }}>
          Powered by <strong style={{ color: PRIMARY }}>ClinivigilIA</strong>
        </p>
      </div>

      <style>{`@keyframes lm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
