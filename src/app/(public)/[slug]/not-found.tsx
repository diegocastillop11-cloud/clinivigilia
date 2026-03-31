// app/(public)/[slug]/not-found.tsx
// Página 404 cuando el slug no existe o no está publicado

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0d0d1a', color: '#f1f5f9', fontFamily: 'DM Sans, sans-serif',
      textAlign: 'center', padding: '24px',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 24,
        background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36, marginBottom: 24,
      }}>
        🏥
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, fontFamily: 'Sora, sans-serif' }}>
        Sitio no encontrado
      </h1>
      <p style={{ fontSize: 16, color: '#64748b', maxWidth: 400, lineHeight: 1.6 }}>
        Este sitio no existe o aún no ha sido publicado. Si eres el médico o clínica, verifica que tu sitio esté publicado desde el panel de control.
      </p>
      <a
        href="/"
        style={{
          marginTop: 32, padding: '12px 24px', borderRadius: 12,
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          color: '#fff', fontWeight: 700, textDecoration: 'none', fontSize: 14,
        }}
      >
        Volver al inicio
      </a>
    </div>
  )
}
