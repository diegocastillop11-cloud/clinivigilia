// ============================================================
// types/gestor-web.ts
// Tipos TypeScript para el módulo Gestor Web
// ============================================================

export interface WebPage {
  id: string
  doctor_id: string
  slug: string
  published: boolean

  clinic_name: string | null
  tagline: string | null
  about_text: string | null
  hero_image_url: string | null

  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  city: string | null
  maps_url: string | null

  instagram_url: string | null
  facebook_url: string | null

  primary_color: string
  accent_color: string
  theme: 'light' | 'dark'
  font_heading: string
  font_body: string

  show_services: boolean
  show_chat_ia: boolean
  show_booking: boolean
  show_map: boolean

  created_at: string
  updated_at: string
}

export interface WebService {
  id: string
  doctor_id: string
  web_page_id: string | null

  name: string
  short_desc: string | null
  long_desc: string | null
  image_url: string | null
  icon: string

  price_from: number | null
  price_currency: string
  price_label: string | null

  duration_min: number
  is_bookable: boolean
  active: boolean
  sort_order: number

  ia_context: string | null
  ia_keywords: string[]
  ia_faq: { q: string; a: string }[]
  ia_enriched: string | null
  ia_enriched_at: string | null

  created_at: string
  updated_at: string
}

export interface WebAvailability {
  id: string
  doctor_id: string
  day_of_week: number  // 0=Lun, 6=Dom
  start_time: string
  end_time: string
  slot_duration: number
  active: boolean
  created_at: string
}

export interface WebAppointment {
  id: string
  doctor_id: string
  service_id: string | null

  patient_name: string
  patient_email: string | null
  patient_phone: string | null
  patient_rut: string | null

  appointment_date: string
  appointment_time: string
  duration_min: number

  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes: string | null

  ia_session_id: string | null
  ia_recommended: boolean

  created_at: string
  updated_at: string

  // Join
  web_services?: Pick<WebService, 'name' | 'icon' | 'duration_min'>
}

export interface WebIaSession {
  id: string
  doctor_id: string
  visitor_id: string
  patient_email: string | null
  messages: { role: 'user' | 'assistant'; content: string; timestamp: string }[]
  recommended_service_id: string | null
  led_to_appointment: boolean
  started_at: string
  last_message_at: string
}

// ─── Stats para el dashboard del módulo ───────────────────
export interface GestorWebStats {
  total_services: number
  active_services: number
  appointments_this_month: number
  appointments_pending: number
  ia_sessions_this_month: number
  page_published: boolean
  page_slug: string | null
}

// ─── Form types ───────────────────────────────────────────
export type WebServiceForm = Omit<
  WebService,
  'id' | 'doctor_id' | 'created_at' | 'updated_at' | 'ia_enriched' | 'ia_enriched_at'
>

export type WebPageForm = Omit<WebPage, 'id' | 'doctor_id' | 'created_at' | 'updated_at'>
