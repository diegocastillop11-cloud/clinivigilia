'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ClinicSettings {
  clinic_name: string
  logo_url: string
  avatar_url: string
  primary_color: string
  theme: 'light' | 'dark'
  sidebar_color: 'white' | 'dark' | 'colored'
}

const DEFAULTS: ClinicSettings = {
  clinic_name: '',
  logo_url: '',
  avatar_url: '',
  primary_color: '#0ea5e9',
  theme: 'light',
  sidebar_color: 'white',
}

interface ThemeContextType {
  settings: ClinicSettings
  loading: boolean
  refresh: () => Promise<void>
}

const ThemeContext = createContext<ThemeContextType>({
  settings: DEFAULTS,
  loading: true,
  refresh: async () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ClinicSettings>(DEFAULTS)
  const [loading, setLoading] = useState(true)

  const applyTheme = useCallback((s: ClinicSettings) => {
    const root = document.documentElement
    const hex = s.primary_color || '#0ea5e9'
    root.style.setProperty('--clinic-primary', hex)
    root.style.setProperty('--clinic-primary-light', hex + '20')
    root.style.setProperty('--clinic-primary-medium', hex + '40')
    if (s.theme === 'dark') root.classList.add('dark-mode')
    else root.classList.remove('dark-mode')
    root.setAttribute('data-sidebar', s.sidebar_color)
  }, [])

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Cargar configuración del doctor
    const { data: clinicData } = await supabase
      .from('clinic_settings')
      .select('*')
      .eq('doctor_id', user.id)
      .single()

    // Si el doctor no tiene logo propio, usar el logo de la landing (marca global)
    let brandLogoUrl = ''
    if (!clinicData?.logo_url) {
      const { data: landingData } = await supabase
        .from('landing_config')
        .select('logo_url')
        .eq('id', 'main')
        .single()
      brandLogoUrl = landingData?.logo_url ?? ''
    }

    const merged = {
      ...DEFAULTS,
      ...(clinicData ?? {}),
      logo_url: clinicData?.logo_url || brandLogoUrl,
    }

    setSettings(merged)
    applyTheme(merged)
    setLoading(false)
  }, [applyTheme])

  useEffect(() => { load() }, [load])

  return (
    <ThemeContext.Provider value={{ settings, loading, refresh: load }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)