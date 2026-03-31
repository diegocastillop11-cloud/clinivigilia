'use client'

import { useState, useEffect } from 'react'
import type { WebPage } from '@/types/gestor-web'

// ─── Tipos ────────────────────────────────────────────────
interface Product {
  id: string
  name: string
  short_desc: string | null
  description: string | null
  image_url: string | null
  price: number
  currency: string
  price_label: string | null
  stock: number | null
  track_stock: boolean
  category: string | null
  featured: boolean
}

interface CartItem extends Product { quantity: number }

interface Props {
  page: WebPage
  products: Product[]
}

// ─── Helpers ──────────────────────────────────────────────
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `${r} ${g} ${b}`
}

function formatPrice(price: number, currency = 'CLP') {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)
}

// ─── Iconos ───────────────────────────────────────────────
const IconCart    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
const IconPlus    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
const IconMinus   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/></svg>
const IconTrash   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
const IconX       = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IconArrow   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
const IconCheck   = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
const IconSearch  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>

// ─── Product Card ─────────────────────────────────────────
function ProductCard({ product, primary, accent, isDark, onAdd }: {
  product: Product; primary: string; accent: string; isDark: boolean
  onAdd: (p: Product) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const bg     = isDark ? '#1e1e3a' : '#fff'
  const border = isDark ? '#2d2d5a' : '#f0f0f0'
  const text   = isDark ? '#f1f5f9' : '#0f172a'
  const muted  = isDark ? '#94a3b8' : '#64748b'

  return (
    <div style={{
      background: bg, border: `1px solid ${border}`,
      borderRadius: 20, overflow: 'hidden',
      boxShadow: isDark ? 'none' : '0 2px 16px rgba(0,0,0,0.06)',
      transition: 'all 0.25s', display: 'flex', flexDirection: 'column',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = `0 16px 40px ${primary}18`
        e.currentTarget.style.borderColor = primary + '40'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = isDark ? 'none' : '0 2px 16px rgba(0,0,0,0.06)'
        e.currentTarget.style.borderColor = border
      }}
    >
      {/* Imagen */}
      <div style={{ position: 'relative', paddingTop: '75%', overflow: 'hidden' }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            transition: 'transform 0.4s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(135deg, ${primary}15, ${accent}10)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48,
          }}>📦</div>
        )}
        {product.category && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            color: '#fff', fontSize: 11, fontWeight: 600,
            padding: '3px 10px', borderRadius: 20,
          }}>{product.category}</div>
        )}
        {product.track_stock && product.stock === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Sin stock</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '18px 18px 0', flex: 1 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: text, marginBottom: 6 }}>{product.name}</h3>
        {product.short_desc && (
          <p style={{ fontSize: 13, color: muted, lineHeight: 1.5, marginBottom: 8 }}>{product.short_desc}</p>
        )}
        {product.description && (
          <>
            <button onClick={() => setExpanded(!expanded)}
              style={{ fontSize: 12, color: primary, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              {expanded ? 'Ver menos ▲' : 'Ver más ▼'}
            </button>
            {expanded && (
              <p style={{ fontSize: 13, color: muted, lineHeight: 1.6, marginTop: 8 }}>{product.description}</p>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '14px 18px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p style={{ fontSize: 18, fontWeight: 800, color: primary }}>
            {product.price_label || formatPrice(product.price, product.currency)}
          </p>
          {product.track_stock && product.stock !== null && product.stock > 0 && (
            <p style={{ fontSize: 11, color: muted }}>{product.stock} disponibles</p>
          )}
        </div>
        <button
          onClick={() => onAdd(product)}
          disabled={product.track_stock && product.stock === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: product.track_stock && product.stock === 0
              ? '#e2e8f0'
              : `linear-gradient(135deg, ${primary}, ${accent})`,
            color: product.track_stock && product.stock === 0 ? '#94a3b8' : '#fff',
            fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
            boxShadow: product.track_stock && product.stock === 0 ? 'none' : `0 4px 16px ${primary}35`,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!(product.track_stock && product.stock === 0)) e.currentTarget.style.transform = 'scale(1.05)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          <IconPlus /> Agregar
        </button>
      </div>
    </div>
  )
}

// ─── Cart Panel ───────────────────────────────────────────
function CartPanel({ cart, page, onClose, onUpdate, onRemove, onClear }: {
  cart: CartItem[]; page: WebPage
  onClose: () => void
  onUpdate: (id: string, qty: number) => void
  onRemove: (id: string) => void
  onClear: () => void
}) {
  const primary = page.primary_color
  const accent  = page.accent_color
  const isDark  = page.theme === 'dark'
  const panelBg = isDark ? '#0f0f1e' : '#ffffff'
  const bg2     = isDark ? '#1e1e38' : '#f8fafc'
  const textCol = isDark ? '#f1f5f9' : '#0f172a'
  const muted   = isDark ? '#64748b' : '#94a3b8'
  const border  = isDark ? '#1e1e38' : '#f1f5f9'

  const [step, setStep]       = useState<'cart' | 'checkout' | 'success'>('cart')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [orderNumber, setOrderNumber] = useState('')

  const total    = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const currency = cart[0]?.currency || 'CLP'
  const set      = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function handleOrder() {
    if (!form.name.trim()) { alert('Por favor ingresa tu nombre'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/gestor-web/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: page.doctor_id,
          customer_name: form.name,
          customer_email: form.email || null,
          customer_phone: form.phone || null,
          customer_notes: form.notes || null,
          items: cart.map(i => ({
            product_id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image_url: i.image_url,
          })),
          subtotal: total,
          total,
          currency,
        }),
      })
      const data = await res.json()
      if (data.order_number) {
        setOrderNumber(data.order_number)
        setStep('success')
        onClear()
      }
    } catch { alert('Error al procesar el pedido. Intenta de nuevo.') }
    setSubmitting(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: `1.5px solid ${border}`,
    borderRadius: 12, padding: '11px 16px', fontSize: 14,
    background: bg2, color: textCol, fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.2s',
  }

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease',
      }}/>

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(480px, 100vw)', zIndex: 201,
        display: 'flex', flexDirection: 'column',
        background: panelBg,
        boxShadow: '-4px 0 40px rgba(0,0,0,0.15)',
        animation: 'slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* Header */}
        <div style={{
          padding: '18px 20px', borderBottom: `1px solid ${border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {step === 'checkout' && (
              <button onClick={() => setStep('cart')} style={{ color: muted, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <IconArrow />
              </button>
            )}
            <div>
              <p style={{ fontWeight: 700, color: textCol, fontSize: 16 }}>
                {step === 'cart' ? `Mi carrito (${cart.length})` : step === 'checkout' ? 'Finalizar pedido' : '¡Pedido realizado!'}
              </p>
              {step === 'cart' && total > 0 && (
                <p style={{ fontSize: 13, color: muted }}>{formatPrice(total, currency)} en total</p>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ color: muted, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <IconX />
          </button>
        </div>

        {/* ── CARRITO ── */}
        {step === 'cart' && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cart.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <div style={{ fontSize: 56 }}>🛒</div>
                  <p style={{ fontWeight: 600, color: textCol }}>Tu carrito está vacío</p>
                  <p style={{ fontSize: 13, color: muted }}>Agrega productos para continuar</p>
                  <button onClick={onClose} style={{
                    padding: '10px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: `linear-gradient(135deg, ${primary}, ${accent})`,
                    color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
                  }}>Ver productos</button>
                </div>
              ) : cart.map(item => (
                <div key={item.id} style={{
                  display: 'flex', gap: 12, padding: '14px',
                  background: bg2, borderRadius: 16,
                  border: `1px solid ${border}`,
                }}>
                  {item.image_url && (
                    <img src={item.image_url} style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}/>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: textCol, marginBottom: 4 }}>{item.name}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: primary }}>{formatPrice(item.price, item.currency)}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <button onClick={() => onUpdate(item.id, item.quantity - 1)} style={{
                        width: 28, height: 28, borderRadius: 8, border: `1.5px solid ${border}`,
                        background: bg2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textCol,
                      }}><IconMinus /></button>
                      <span style={{ fontSize: 14, fontWeight: 700, color: textCol, minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => onUpdate(item.id, item.quantity + 1)} style={{
                        width: 28, height: 28, borderRadius: 8, border: `1.5px solid ${border}`,
                        background: bg2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textCol,
                      }}><IconPlus /></button>
                      <button onClick={() => onRemove(item.id)} style={{
                        marginLeft: 'auto', color: muted, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                      }}><IconTrash /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div style={{ padding: '16px 20px 24px', borderTop: `1px solid ${border}`, flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <p style={{ fontWeight: 700, fontSize: 16, color: textCol }}>Total</p>
                  <p style={{ fontWeight: 800, fontSize: 20, color: primary }}>{formatPrice(total, currency)}</p>
                </div>
                <p style={{ fontSize: 12, color: muted, marginBottom: 12, textAlign: 'center' }}>
                  💳 El medio de pago se envía después de confirmar el pedido
                </p>
                <button onClick={() => setStep('checkout')} style={{
                  width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg, ${primary}, ${accent})`,
                  color: '#fff', fontWeight: 700, fontSize: 16, fontFamily: 'inherit',
                  boxShadow: `0 8px 24px ${primary}35`,
                }}>
                  Confirmar pedido →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── CHECKOUT ── */}
        {step === 'checkout' && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {/* Resumen */}
              <div style={{ background: bg2, borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Resumen del pedido</p>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <p style={{ fontSize: 13, color: textCol }}>{item.name} <span style={{ color: muted }}>x{item.quantity}</span></p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: textCol }}>{formatPrice(item.price * item.quantity, item.currency)}</p>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${border}`, marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <p style={{ fontWeight: 700, color: textCol }}>Total</p>
                  <p style={{ fontWeight: 800, color: primary, fontSize: 16 }}>{formatPrice(total, currency)}</p>
                </div>
              </div>

              {/* Formulario */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                    Nombre completo *
                  </label>
                  <input value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Tu nombre" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = primary }}
                    onBlur={e => { e.target.style.borderColor = border }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                    Email
                  </label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="Para recibir confirmación" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = primary }}
                    onBlur={e => { e.target.style.borderColor = border }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                    Teléfono
                  </label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)}
                    placeholder="+56 9 1234 5678" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = primary }}
                    onBlur={e => { e.target.style.borderColor = border }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                    Notas (opcional)
                  </label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                    placeholder="¿Alguna indicación especial para tu pedido?" rows={3}
                    style={{ ...inputStyle, resize: 'none' }}
                    onFocus={e => { e.target.style.borderColor = primary }}
                    onBlur={e => { e.target.style.borderColor = border }}
                  />
                </div>
              </div>

              <p style={{ fontSize: 12, color: muted, marginTop: 16, textAlign: 'center', lineHeight: 1.6 }}>
                🔒 Al confirmar, la clínica recibirá tu pedido y te enviará el medio de pago por email o WhatsApp.
              </p>
            </div>

            <div style={{ padding: '16px 20px 28px', borderTop: `1px solid ${border}`, flexShrink: 0 }}>
              <button onClick={handleOrder} disabled={submitting || !form.name.trim()} style={{
                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                cursor: submitting || !form.name.trim() ? 'default' : 'pointer',
                background: submitting || !form.name.trim() ? '#e2e8f0' : `linear-gradient(135deg, ${primary}, ${accent})`,
                color: submitting || !form.name.trim() ? '#94a3b8' : '#fff',
                fontWeight: 700, fontSize: 16, fontFamily: 'inherit',
                boxShadow: submitting || !form.name.trim() ? 'none' : `0 8px 24px ${primary}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {submitting
                  ? <><div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #94a3b8', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }}/> Procesando...</>
                  : '✓ Confirmar pedido'
                }
              </button>
            </div>
          </>
        )}

        {/* ── ÉXITO ── */}
        {step === 'success' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: `linear-gradient(135deg, #10b981, #059669)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', marginBottom: 24,
              boxShadow: '0 12px 32px rgba(16,185,129,0.4)',
            }}>
              <IconCheck />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: textCol, marginBottom: 8 }}>¡Pedido recibido!</h2>
            <p style={{ fontSize: 28, fontWeight: 900, color: primary, marginBottom: 12 }}>{orderNumber}</p>
            <p style={{ fontSize: 15, color: muted, lineHeight: 1.7, maxWidth: 300 }}>
              La clínica recibió tu pedido y pronto te contactará con el medio de pago. ¡Gracias por tu compra! 🎉
            </p>
            {form.email && (
              <p style={{ fontSize: 13, color: muted, marginTop: 12 }}>
                Recibirás la confirmación en <strong style={{ color: textCol }}>{form.email}</strong>
              </p>
            )}
            <button onClick={onClose} style={{
              marginTop: 32, padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${primary}, ${accent})`,
              color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: 'inherit',
            }}>
              Volver a la tienda
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ─── TIENDA PRINCIPAL ─────────────────────────────────────
export default function TiendaClient({ page, products }: Props) {
  const [cart, setCart]           = useState<CartItem[]>([])
  const [cartOpen, setCartOpen]   = useState(false)
  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState('Todos')
  const [mounted, setMounted]     = useState(false)

  const primary = page.primary_color || '#6366F1'
  const accent  = page.accent_color  || '#8B5CF6'
  const isDark  = page.theme === 'dark'

  const bg      = isDark ? '#0d0d1a' : '#f8fafc'
  const bgCard  = isDark ? '#13132a' : '#ffffff'
  const textPri = isDark ? '#f1f5f9' : '#0f172a'
  const textSec = isDark ? '#94a3b8' : '#64748b'
  const border  = isDark ? '#1e1e3a' : '#e2e8f0'

  useEffect(() => { setMounted(true) }, [])

  // Categorías únicas
  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]))]

  // Filtrado
  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.short_desc?.toLowerCase().includes(search.toLowerCase())
    const matchCat    = category === 'Todos' || p.category === category
    return matchSearch && matchCat
  })

  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...product, quantity: 1 }]
    })
    // Mini feedback
    const btn = document.querySelector(`[data-product="${product.id}"]`)
    if (btn) {
      btn.textContent = '✓ Agregado'
      setTimeout(() => { if (btn) btn.textContent = '+ Agregar' }, 1200)
    }
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) removeFromCart(id)
    else setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i))
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  return (
    <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=${(page.font_heading||'Sora').replace(' ','+')}:wght@400;600;700;800&family=${(page.font_body||'DM+Sans').replace(' ','+')}:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'${page.font_body||'DM Sans'}',sans-serif; background:${bg}; color:${textPri}; }
        h1,h2,h3 { font-family:'${page.font_heading||'Sora'}',sans-serif; }
        :root { --p:${primary}; --a:${accent}; --p-rgb:${hexToRgb(primary)}; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideInRight { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:${primary}30; border-radius:3px; }
      `}</style>

      {/* ─── NAVBAR ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: mounted ? (isDark ? 'rgba(13,13,26,0.96)' : 'rgba(255,255,255,0.96)') : (isDark ? '#0d0d1a' : '#fff'),
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${border}`,
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href={`/${page.slug}`} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: textSec, textDecoration: 'none', fontSize: 13, fontWeight: 500,
          }}>
            <IconArrow /> Volver
          </a>
          <span style={{ color: border }}>|</span>
          <span style={{ fontFamily: `'${page.font_heading||'Sora'}',sans-serif`, fontWeight: 700, fontSize: 15, color: textPri }}>
            {page.clinic_name}
          </span>
          <span style={{ fontSize: 13, color: textSec }}>— Tienda</span>
        </div>

        <button onClick={() => setCartOpen(true)} style={{
          position: 'relative', display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: cartCount > 0 ? `linear-gradient(135deg, ${primary}, ${accent})` : (isDark ? '#1e1e38' : '#f1f5f9'),
          color: cartCount > 0 ? '#fff' : textSec,
          fontWeight: 600, fontSize: 14, fontFamily: 'inherit', transition: 'all 0.2s',
          boxShadow: cartCount > 0 ? `0 4px 16px ${primary}35` : 'none',
        }}>
          <IconCart />
          {cartCount > 0 ? `${cartCount} producto${cartCount > 1 ? 's' : ''}` : 'Carrito'}
          {cartCount > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -6,
              width: 20, height: 20, borderRadius: '50%',
              background: '#ef4444', color: '#fff',
              fontSize: 11, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${isDark ? '#0d0d1a' : '#fff'}`,
            }}>{cartCount}</span>
          )}
        </button>
      </nav>

      {/* ─── HERO TIENDA ── */}
      <div style={{
        background: `linear-gradient(135deg, ${primary}18, ${accent}12)`,
        padding: '48px 24px 36px', textAlign: 'center',
        borderBottom: `1px solid ${border}`,
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: primary, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
          Tienda online
        </p>
        <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, letterSpacing: '-0.02em', color: textPri, marginBottom: 8 }}>
          Productos de {page.clinic_name}
        </h1>
        <p style={{ fontSize: 16, color: textSec, maxWidth: 480, margin: '0 auto 24px' }}>
          Realiza tu pedido y te contactaremos con el medio de pago
        </p>

        {/* Búsqueda */}
        <div style={{
          maxWidth: 420, margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: 10,
          background: isDark ? '#1e1e38' : '#fff',
          borderRadius: 14, padding: '10px 16px',
          border: `1.5px solid ${border}`,
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        }}>
          <span style={{ color: textSec }}><IconSearch /></span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: textPri, fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {/* ─── CATEGORÍAS ── */}
      {categories.length > 1 && (
        <div style={{ padding: '16px 24px', display: 'flex', gap: 8, overflowX: 'auto', borderBottom: `1px solid ${border}` }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: '7px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', transition: 'all 0.2s',
              background: category === cat ? `linear-gradient(135deg, ${primary}, ${accent})` : (isDark ? '#1e1e38' : '#f1f5f9'),
              color: category === cat ? '#fff' : textSec,
              boxShadow: category === cat ? `0 4px 12px ${primary}30` : 'none',
            }}>{cat}</button>
          ))}
        </div>
      )}

      {/* ─── GRID PRODUCTOS ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontWeight: 600, color: textPri }}>Sin resultados</p>
            <p style={{ fontSize: 14, color: textSec, marginTop: 6 }}>Intenta con otra búsqueda o categoría</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 24,
          }}>
            {filtered.map(p => (
              <ProductCard
                key={p.id} product={p}
                primary={primary} accent={accent} isDark={isDark}
                onAdd={addToCart}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── FOOTER ── */}
      <footer style={{ background: isDark ? '#080812' : '#0f172a', padding: '28px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#475569' }}>
          Powered by <span style={{ color: primary, fontWeight: 700 }}>ClinivigilIA</span>
        </p>
      </footer>

      {/* ─── BOTÓN FLOTANTE CARRITO ── */}
      {cartCount > 0 && !cartOpen && (
        <button onClick={() => setCartOpen(true)} style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 150,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 22px', borderRadius: 50, border: 'none', cursor: 'pointer',
          background: `linear-gradient(135deg, ${primary}, ${accent})`,
          color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: 'inherit',
          boxShadow: `0 8px 32px ${primary}50`,
          animation: 'fadeIn 0.3s ease',
        }}>
          <IconCart />
          Ver carrito ({cartCount})
        </button>
      )}

      {/* ─── CART PANEL ── */}
      {cartOpen && (
        <CartPanel
          cart={cart} page={page}
          onClose={() => setCartOpen(false)}
          onUpdate={updateQty}
          onRemove={removeFromCart}
          onClear={() => setCart([])}
        />
      )}
    </>
  )
}
