export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Specialty =
  | 'cardiologia' | 'neurologia' | 'oncologia'
  | 'pediatria' | 'ortopedia' | 'endocrinologia'
  | 'ginecologia' | 'dermatologia' | 'psiquiatria' | 'medicina_general'

export type PatientStatus = 'activo' | 'pendiente' | 'alta' | 'suspendido'
export type AppointmentStatus = 'programada' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio'
export type AppointmentType = 'primera_vez' | 'control' | 'urgencia' | 'teleconsulta' | 'procedimiento'
export type FollowupType = 'nota' | 'evolucion' | 'laboratorio' | 'imagen' | 'receta' | 'alerta' | 'email_enviado'
export type AlertLevel = 'info' | 'warning' | 'critical'

export interface Doctor {
  id: string
  full_name: string
  specialty: string | null
  license_no: string | null
  phone: string | null
  clinic_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Patient {
  id: string
  doctor_id: string
  first_name: string
  last_name: string
  rut: string | null
  email: string | null
  phone: string | null
  birth_date: string | null
  gender: 'masculino' | 'femenino' | 'otro' | null
  address: string | null
  specialty: Specialty
  status: PatientStatus
  notes: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  scheduled_at: string
  duration_min: number
  type: AppointmentType
  status: AppointmentStatus
  location: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  patient?: Pick<Patient, 'id' | 'first_name' | 'last_name' | 'specialty' | 'status'>
}

export interface Followup {
  id: string
  patient_id: string
  doctor_id: string
  appointment_id: string | null
  type: FollowupType
  title: string
  content: string
  is_alert: boolean
  alert_level: AlertLevel | null
  created_at: string
}

export interface PatientStats {
  doctor_id: string
  total: number
  activos: number
  pendientes: number
  alta: number
  suspendidos: number
}

export interface Database {
  public: {
    Tables: {
      doctors: { Row: Doctor; Insert: Partial<Doctor>; Update: Partial<Doctor> }
      patients: { Row: Patient; Insert: Omit<Patient, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Patient> }
      appointments: { Row: Appointment; Insert: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Appointment> }
      followups: { Row: Followup; Insert: Omit<Followup, 'id' | 'created_at'>; Update: Partial<Followup> }
    }
    Views: {
      patient_stats: { Row: PatientStats }
    }
  }
}
