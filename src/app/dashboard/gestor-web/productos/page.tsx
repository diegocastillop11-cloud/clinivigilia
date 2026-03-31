'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

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
  active: boolean
  featured: boolean
  category: string | null
  sort_order: number
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  items: { name: string; price: number; quantity: number; image_url?: string }[]
  total: number
  currency: string
  status: string
  payment_note: string | null
  payment_sent_at: string | null
  created_at: string
}

// ─── Iconos ───────────────────────────────────────────────
const IconPlus      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
const IconEdit      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IconTrash     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
const IconUpload    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
const IconPackage   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
const IconShop      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
const IconStar      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
const IconArrowLeft = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
const IconX         = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IconSend      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>

// ─── Helpers ──────────────────────────────────────────────
function formatPrice(price: number, currency = 'CLP') {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:      { label: 'Pendiente',        color: '#92400e', bg: '#fef3c7' },
  payment_sent: { label: 'Pago enviado',     color: '#1e40af', bg: '#dbeafe' },
  paid:         { label: 'Pagado',           color: '#065f46', bg: '#d1fae5' },
  preparing:    { label: 'Preparando',       color: '#5b21b6', bg: '#ede9fe' },
  shipped:      { label: 'Enviado',          color: '#0c4a6e', bg: '#e0f2fe' },
  delivered:    { label: 'Entregado',        color: '#14532d', bg: '#dcfce7' },
  cancelled:    { label: 'Cancelado',        color: '#7f1d1d', bg: '#fee2e2' },
}

// ─── Modal de producto ─────────────────────────────────────
function ProductModal({ product, onSave, onClose }: {
  product: Partial<Product> | null
  onSave: (p: Partial<Product>, imageFile?: File) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<Partial<Product>>(product || {
    name: '', short_desc: '', description: '', price: 0,
    currency: 'CLP', price_label: '', stock: null, track_stock: false,
    active: true, featured: false, category: '',
  })
  const [imageFile, setImageFile] = useState<File | undefined>()
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url || null)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!form.name?.trim()) { toast.error('El nombre es obligatorio'); return }
    setSaving(true)
    await onSave(form, imageFile)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{product?.id ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><IconX /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Imagen */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => inputRef.current?.click()}
              className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-violet-400 transition-colors overflow-hidden flex-shrink-0"
              style={{ background: imagePreview ? 'none' : '#f8fafc' }}
            >
              {imagePreview
                ? <img src={imagePreview} className="w-full h-full object-cover"/>
                : <div className="text-center"><IconUpload /><p className="text-xs text-gray-400 mt-1">Foto</p></div>
              }
            </div>
            <div className="flex-1 space-y-1">
              <button onClick={() => inputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors">
                <IconUpload /> Subir foto
              </button>
              <p className="text-xs text-gray-400">JPG, PNG. Recomendado: 800x800px</p>
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleImage}/>
          </div>

          {/* Nombre */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Nombre *</label>
            <input
              value={form.name || ''}
              onChange={e => set('name', e.target.value)}
              placeholder="Ej: Shampoo anticaída"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 focus:bg-white"
            />
          </div>

          {/* Desc corta */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Descripción corta</label>
            <input
              value={form.short_desc || ''}
              onChange={e => set('short_desc', e.target.value)}
              placeholder="Aparece en la card del producto"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 focus:bg-white"
            />
          </div>

          {/* Desc larga */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Descripción completa</label>
            <textarea
              value={form.description || ''}
              onChange={e => set('description', e.target.value)}
              placeholder="Ingredientes, modo de uso, beneficios..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 focus:bg-white resize-none"
            />
          </div>

          {/* Precio */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Precio *</label>
              <input
                type="number" min="0"
                value={form.price || 0}
                onChange={e => set('price', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 focus:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Moneda</label>
              <select
                value={form.currency || 'CLP'}
                onChange={e => set('currency', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
              >
                <option value="CLP">CLP</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {/* Etiqueta precio */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Etiqueta precio personalizada</label>
            <input
              value={form.price_label || ''}
              onChange={e => set('price_label', e.target.value)}
              placeholder='Ej: "Pack 3 meses", "Precio promocional"'
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 focus:bg-white"
            />
          </div>

          {/* Categoría */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Categoría</label>
            <input
              value={form.category || ''}
              onChange={e => set('category', e.target.value)}
              placeholder="Ej: Shampoo, Suplementos, Tratamientos..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 focus:bg-white"
            />
          </div>

          {/* Stock */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <button onClick={() => set('track_stock', !form.track_stock)}
              className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.track_stock ? 'bg-violet-500' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${form.track_stock ? 'left-5' : 'left-0.5'}`}/>
            </button>
            <span className="text-sm text-gray-700">Control de stock</span>
            {form.track_stock && (
              <input
                type="number" min="0"
                value={form.stock ?? ''}
                onChange={e => set('stock', parseInt(e.target.value) || 0)}
                placeholder="Unidades"
                className="ml-auto w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            )}
          </div>

          {/* Switches */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'active',   label: '✅ Activo',     hint: 'Visible en tienda' },
              { key: 'featured', label: '⭐ Destacado',   hint: 'Preview en landing' },
            ].map(({ key, label, hint }) => (
              <button key={key} onClick={() => set(key, !form[key as keyof typeof form])}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  form[key as keyof typeof form]
                    ? 'border-violet-400 bg-violet-50'
                    : 'border-gray-200 bg-gray-50'
                }`}>
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{hint}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-[2] py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/> Guardando...</> : 'Guardar producto'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal de pedido ──────────────────────────────────────
function OrderModal({ order, onUpdateStatus, onSendPayment, onClose }: {
  order: Order
  onUpdateStatus: (id: string, status: string) => Promise<void>
  onSendPayment: (id: string, note: string) => Promise<void>
  onClose: () => void
}) {
  const [paymentNote, setPaymentNote] = useState(order.payment_note || '')
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)
  const status = STATUS_MAP[order.status] || STATUS_MAP.pending

  async function handleSendPayment() {
    if (!paymentNote.trim()) { toast.error('Escribe las instrucciones de pago'); return }
    setSending(true)
    await onSendPayment(order.id, paymentNote)
    setSending(false)
  }

  async function handleStatus(s: string) {
    setUpdating(true)
    await onUpdateStatus(order.id, s)
    setUpdating(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Pedido {order.order_number}</h2>
            <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('es-CL', { dateStyle: 'full' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: status.bg, color: status.color }}>
              {status.label}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><IconX /></button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Cliente */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Cliente</p>
            <p className="font-semibold text-gray-900">{order.customer_name}</p>
            {order.customer_email && <p className="text-sm text-gray-500">{order.customer_email}</p>}
            {order.customer_phone && <p className="text-sm text-gray-500">{order.customer_phone}</p>}
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Productos</p>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  {item.image_url && (
                    <img src={item.image_url} className="w-10 h-10 rounded-lg object-cover flex-shrink-0"/>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">x{item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{formatPrice(item.price * item.quantity, order.currency)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
              <p className="font-bold text-gray-900">Total</p>
              <p className="text-lg font-bold text-violet-600">{formatPrice(order.total, order.currency)}</p>
            </div>
          </div>

          {/* Enviar medio de pago */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Instrucciones de pago</p>
            <textarea
              value={paymentNote}
              onChange={e => setPaymentNote(e.target.value)}
              placeholder="Ej: Transferencia al Banco Estado cuenta corriente 12345678, nombre: Clínica XYZ, RUT: 12.345.678-9. Enviar comprobante a contacto@clinica.cl"
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none bg-gray-50"
            />
            <button onClick={handleSendPayment} disabled={sending}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50">
              {sending ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/> Enviando...</> : <><IconSend /> Enviar instrucciones al cliente</>}
            </button>
            {order.payment_sent_at && (
              <p className="text-xs text-emerald-600 text-center">✓ Enviado el {new Date(order.payment_sent_at).toLocaleDateString('es-CL')}</p>
            )}
          </div>

          {/* Cambiar estado */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Cambiar estado</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(STATUS_MAP).map(([key, val]) => (
                <button key={key}
                  onClick={() => handleStatus(key)}
                  disabled={updating || order.status === key}
                  className="py-2 px-3 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                  style={{
                    background: order.status === key ? val.bg : '#f8fafc',
                    color: order.status === key ? val.color : '#64748b',
                    border: `1.5px solid ${order.status === key ? val.color + '40' : '#e2e8f0'}`,
                  }}>
                  {val.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────
export default function ProductosPage() {
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<'productos' | 'pedidos'>('productos')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [modalProduct, setModalProduct] = useState<Partial<Product> | null | false>(false)
  const [modalOrder, setModalOrder] = useState<Order | null>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [pRes, oRes] = await Promise.all([
      supabase.from('web_products').select('*').eq('doctor_id', user.id).order('sort_order'),
      supabase.from('web_orders').select('*').eq('doctor_id', user.id).order('created_at', { ascending: false }),
    ])
    if (pRes.data) setProducts(pRes.data)
    if (oRes.data) setOrders(oRes.data)
    setLoading(false)
  }

  async function saveProduct(form: Partial<Product>, imageFile?: File) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let image_url = form.image_url || null

    // Subir imagen si hay una nueva
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('product-images').upload(path, imageFile, { upsert: true })
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
        image_url = publicUrl
      }
    }

    const payload = { ...form, image_url, doctor_id: user.id }

    if (form.id) {
      const { error } = await supabase.from('web_products').update(payload).eq('id', form.id)
      if (error) { toast.error('Error al actualizar'); return }
      toast.success('Producto actualizado')
    } else {
      const { error } = await supabase.from('web_products').insert(payload)
      if (error) { toast.error('Error al crear'); return }
      toast.success('Producto creado')
    }

    setModalProduct(false)
    loadAll()
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('web_products').update({ active }).eq('id', id)
    setProducts(p => p.map(pr => pr.id === id ? { ...pr, active } : pr))
  }

  async function toggleFeatured(id: string, featured: boolean) {
    await supabase.from('web_products').update({ featured }).eq('id', id)
    setProducts(p => p.map(pr => pr.id === id ? { ...pr, featured } : pr))
    toast.success(featured ? '⭐ Marcado como destacado' : 'Quitado de destacados')
  }

  async function deleteProduct(id: string) {
    if (!confirm('¿Eliminar este producto?')) return
    await supabase.from('web_products').delete().eq('id', id)
    setProducts(p => p.filter(pr => pr.id !== id))
    toast.success('Producto eliminado')
  }

  async function updateOrderStatus(id: string, status: string) {
    await supabase.from('web_orders').update({ status }).eq('id', id)
    setOrders(p => p.map(o => o.id === id ? { ...o, status } : o))
    setModalOrder(prev => prev?.id === id ? { ...prev, status } : prev)
    toast.success('Estado actualizado')
  }

  async function sendPayment(id: string, note: string) {
    await supabase.from('web_orders').update({
      payment_note: note,
      payment_sent_at: new Date().toISOString(),
      status: 'payment_sent',
    }).eq('id', id)
    setOrders(p => p.map(o => o.id === id ? { ...o, payment_note: note, status: 'payment_sent', payment_sent_at: new Date().toISOString() } : o))
    setModalOrder(prev => prev?.id === id ? { ...prev, payment_note: note, status: 'payment_sent' } : prev)
    toast.success('✅ Instrucciones enviadas al cliente')
  }

  const pendingOrders = orders.filter(o => o.status === 'pending').length

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"/>
        <p className="text-sm text-gray-400">Cargando tienda...</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={() => router.push('/dashboard/gestor-web')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-3 transition-colors">
            <IconArrowLeft /> Volver al gestor web
          </button>
          <div className="flex items-center gap-2 text-violet-600 mb-1">
            <IconShop />
            <span className="text-sm font-semibold uppercase tracking-wide">Tienda</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Productos y pedidos</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona tu catálogo y los pedidos de tus pacientes</p>
        </div>
        {tab === 'productos' && (
          <button onClick={() => setModalProduct({})}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-violet-200 flex-shrink-0">
            <IconPlus /> Nuevo producto
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6">
        {[
          { key: 'productos', label: `📦 Productos (${products.length})` },
          { key: 'pedidos',   label: `🛒 Pedidos${pendingOrders > 0 ? ` (${pendingOrders} nuevos)` : ''}` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PRODUCTOS ── */}
      {tab === 'productos' && (
        <div className="space-y-4">
          {products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="text-5xl mb-4">📦</div>
              <p className="font-semibold text-gray-700">Sin productos aún</p>
              <p className="text-sm text-gray-400 mt-1 max-w-xs">Agrega productos para que tus pacientes puedan comprar desde tu landing</p>
              <button onClick={() => setModalProduct({})}
                className="mt-5 flex items-center gap-2 bg-violet-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-violet-700 transition-colors">
                <IconPlus /> Agregar primer producto
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {products.map(p => (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
                    {/* Imagen */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                      {p.image_url
                        ? <img src={p.image_url} className="w-full h-full object-cover"/>
                        : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">📦</div>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
                        {p.featured && <span className="text-amber-400"><IconStar /></span>}
                        {p.category && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{p.category}</span>}
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{p.short_desc || '—'}</p>
                    </div>

                    {/* Precio */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900 text-sm">{formatPrice(p.price, p.currency)}</p>
                      {p.track_stock && <p className="text-xs text-gray-400">{p.stock ?? 0} en stock</p>}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => toggleFeatured(p.id, !p.featured)}
                        title={p.featured ? 'Quitar destacado' : 'Marcar destacado'}
                        className={`text-sm transition-colors ${p.featured ? 'text-amber-400' : 'text-gray-200 hover:text-amber-300'}`}>
                        <IconStar />
                      </button>
                      <button onClick={() => toggleActive(p.id, !p.active)}
                        className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${p.active ? 'bg-violet-500' : 'bg-gray-200'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${p.active ? 'left-4' : 'left-0.5'}`}/>
                      </button>
                      <button onClick={() => setModalProduct(p)}
                        className="text-gray-300 hover:text-violet-500 transition-colors opacity-0 group-hover:opacity-100">
                        <IconEdit />
                      </button>
                      <button onClick={() => deleteProduct(p.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PEDIDOS ── */}
      {tab === 'pedidos' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">🛒</div>
              <p className="font-semibold text-gray-700">Sin pedidos aún</p>
              <p className="text-sm text-gray-400 mt-1">Los pedidos de tus pacientes aparecerán aquí</p>
            </div>
          ) : orders.map(o => {
            const s = STATUS_MAP[o.status] || STATUS_MAP.pending
            return (
              <button key={o.id} onClick={() => setModalOrder(o)}
                className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:border-violet-200 hover:shadow-md transition-all text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 text-sm">{o.order_number}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">{o.customer_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {o.items.length} producto{o.items.length !== 1 ? 's' : ''} · {new Date(o.created_at).toLocaleDateString('es-CL')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-violet-600">{formatPrice(o.total, o.currency)}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Modales */}
      {modalProduct !== false && (
        <ProductModal
          product={modalProduct}
          onSave={saveProduct}
          onClose={() => setModalProduct(false)}
        />
      )}
      {modalOrder && (
        <OrderModal
          order={modalOrder}
          onUpdateStatus={updateOrderStatus}
          onSendPayment={sendPayment}
          onClose={() => setModalOrder(null)}
        />
      )}
    </div>
  )
}
