'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const IDLE_LIMIT_MS = 30 * 60 * 1000
const CHECK_INTERVAL_MS = 15 * 1000
const ACTIVITY_THROTTLE_MS = 5 * 1000
const STORAGE_KEY = 'cv_last_activity'
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const

function markActivity() {
  localStorage.setItem(STORAGE_KEY, String(Date.now()))
}

/**
 * Cierra la sesión tras 30 min sin actividad. El timestamp se guarda en
 * localStorage para que la actividad en una pestaña resetee el timer de
 * las demás (evita que una pestaña cierre sesión mientras otra está en uso).
 */
export default function IdleLogout() {
  const router = useRouter()

  useEffect(() => {
    markActivity()

    let lastMarked = Date.now()
    const onActivity = () => {
      const now = Date.now()
      if (now - lastMarked < ACTIVITY_THROTTLE_MS) return
      lastMarked = now
      markActivity()
    }
    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, onActivity, { passive: true }))

    const checkIdle = async () => {
      const last = Number(localStorage.getItem(STORAGE_KEY) || Date.now())
      if (Date.now() - last < IDLE_LIMIT_MS) return
      clearInterval(interval)
      const supabase = createClient()
      await supabase.auth.signOut()
      toast.error('Tu sesión se cerró por inactividad')
      router.push('/auth/login')
    }
    const interval = setInterval(checkIdle, CHECK_INTERVAL_MS)

    return () => {
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, onActivity))
      clearInterval(interval)
    }
  }, [router])

  return null
}
