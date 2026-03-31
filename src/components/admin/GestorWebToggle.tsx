'use client'

// ============================================================
// app/admin/clientes/[id]/GestorWebToggle.tsx
// Toggle para activar/desactivar Gestor Web desde el panel admin
// Agrégalo en la página de detalle del cliente
// ============================================================

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  doctorId: string
  licenseId: string
  currentModules: string[]
}

export function GestorWebToggle({ doctorId, licenseId, currentModules }: Props) {
  const supabase = createClient()
  const [enabled, setEnabled] = useState(currentModules.includes('gestor_web'))
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const next = !enabled

    const newModules = next
      ? [...currentModules, 'gestor_web']
      : currentModules.filter(m => m !== 'gestor_web')

    const { error } = await supabase
      .from('licenses')
      .update({ modules: newModules })
      .eq('id', licenseId)

    if (!error) setEnabled(next)
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-lg">🌐</div>
        <div>
          <p className="font-semibold text-sm text-gray-900">Gestor Web</p>
          <p className="text-xs text-gray-400">Landing + IA + Agendamiento online</p>
        </div>
      </div>
      <button
        onClick={toggle}
        disabled={loading}
        className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
          enabled ? 'bg-violet-500' : 'bg-gray-200'
        } ${loading ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
          enabled ? 'left-6' : 'left-0.5'
        }`}/>
      </button>
    </div>
  )
}

// ─── Variables de entorno necesarias ─────────────────────
// Agrega en .env.local:
// ANTHROPIC_API_KEY=sk-ant-...
// NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
