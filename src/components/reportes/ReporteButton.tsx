'use client'

import { useState } from 'react'
import { FileDown, Printer, Loader2 } from 'lucide-react'
import type { Patient, Doctor, Appointment, Followup } from '@/types/database'

interface Props {
  patient: Patient
  doctor: Doctor | null
  appointments?: Appointment[]
  followups?: Followup[]
  aiSummary?: string
  variant?: 'button' | 'icon'
}

export default function ReporteButton({
  patient, doctor, appointments = [], followups = [], aiSummary, variant = 'button'
}: Props) {
  const [loading, setLoading] = useState(false)

  const generatePDF = async (action: 'download' | 'print') => {
    setLoading(true)
    try {
      // Importar jsPDF dinámicamente
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const W = 210
      const margin = 20
      const contentW = W - margin * 2
      let y = 0

      // ─── Colores ───────────────────────────────────────────
      const primary   = [14, 165, 233]   // azul clínica
      const dark      = [15, 23, 42]     // slate-900
      const muted     = [100, 116, 139]  // slate-500
      const light     = [241, 245, 249]  // slate-100
      const white     = [255, 255, 255]

      // ─── Helper: texto con wrap ─────────────────────────────
      const addText = (text: string, x: number, yPos: number, opts: {
        size?: number; color?: number[]; bold?: boolean; maxW?: number
      } = {}) => {
        doc.setFontSize(opts.size ?? 10)
        doc.setTextColor(...(opts.color ?? dark) as [number,number,number])
        doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
        if (opts.maxW) {
          const lines = doc.splitTextToSize(text, opts.maxW)
          doc.text(lines, x, yPos)
          return (lines.length - 1) * (opts.size ?? 10) * 0.4
        }
        doc.text(text, x, yPos)
        return 0
      }

      const checkPage = (needed: number) => {
        if (y + needed > 270) {
          doc.addPage()
          y = 20
        }
      }

      // ══════════════════════════════════════════════════
      // HEADER — fondo oscuro
      // ══════════════════════════════════════════════════
      doc.setFillColor(...dark as [number,number,number])
      doc.rect(0, 0, W, 45, 'F')

      // Línea de color primario arriba
      doc.setFillColor(...primary as [number,number,number])
      doc.rect(0, 0, W, 2, 'F')

      // Logo / nombre clínica
      const clinicName = doctor?.clinic_name || 'ClinivigilIA'
      addText(clinicName, margin, 16, { size: 16, color: white, bold: true })
      addText('Sistema de Gestión Médica', margin, 23, { size: 8, color: [148, 163, 184] })

      // Título del informe
      addText('INFORME CLÍNICO', W - margin, 16, { size: 11, color: primary, bold: true })
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.setFont('helvetica', 'normal')
      const dateStr = new Date().toLocaleDateString('es-CL', {
        day: '2-digit', month: 'long', year: 'numeric'
      })
      doc.text(dateStr, W - margin, 23, { align: 'right' })

      // Doctor
      if (doctor?.full_name) {
        addText(`Dr. ${doctor.full_name}`, W - margin, 30, { size: 8, color: [148, 163, 184] })
        if (doctor.specialty) {
          const spec = doctor.specialty.replace('_', ' ')
            .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          addText(spec, W - margin, 36, { size: 8, color: primary })
        }
      }

      y = 55

      // ══════════════════════════════════════════════════
      // DATOS DEL PACIENTE
      // ══════════════════════════════════════════════════
      doc.setFillColor(...light as [number,number,number])
      doc.roundedRect(margin, y, contentW, 8, 2, 2, 'F')
      addText('DATOS DEL PACIENTE', margin + 4, y + 5.5, { size: 8, color: primary, bold: true })
      y += 13

      // Nombre grande
      const fullName = `${patient.first_name} ${patient.last_name}`
      addText(fullName, margin, y, { size: 15, color: dark, bold: true })
      y += 8

      // Grid de datos 2 columnas
      const fields = [
        ['RUT',           patient.rut || '—'],
        ['Género',        patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : '—'],
        ['Fecha de nac.', patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('es-CL') : '—'],
        ['Email',         patient.email || '—'],
        ['Teléfono',      patient.phone || '—'],
        ['Especialidad',  patient.specialty?.replace('_', ' ') || '—'],
        ['Estado',        patient.status?.charAt(0).toUpperCase() + patient.status?.slice(1) || '—'],
        ['Dirección',     patient.address || '—'],
      ]

      const colW = contentW / 2 - 3
      fields.forEach((f, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const xPos = margin + col * (colW + 6)
        const yPos = y + row * 8

        checkPage(8)
        addText(f[0] + ':', xPos, yPos, { size: 8, color: muted, bold: true })
        addText(f[1], xPos + 28, yPos, { size: 8, color: dark, maxW: colW - 28 })
      })
      y += Math.ceil(fields.length / 2) * 8 + 4

      // Notas del paciente
      if (patient.notes) {
        checkPage(16)
        doc.setFillColor(254, 243, 199)
        doc.roundedRect(margin, y, contentW, 6, 1, 1, 'F')
        addText('Notas clínicas:', margin + 3, y + 4, { size: 7, color: [146, 64, 14], bold: true })
        y += 9
        const extraH = addText(patient.notes, margin, y, { size: 8, color: dark, maxW: contentW })
        y += 5 + extraH
      }

      // Contacto emergencia
      if (patient.emergency_contact_name) {
        checkPage(10)
        addText('Contacto de emergencia:', margin, y, { size: 8, color: muted, bold: true })
        addText(
          `${patient.emergency_contact_name}${patient.emergency_contact_phone ? ' · ' + patient.emergency_contact_phone : ''}`,
          margin + 42, y, { size: 8, color: dark }
        )
        y += 8
      }

      y += 4
      doc.setDrawColor(...light as [number,number,number])
      doc.line(margin, y, W - margin, y)
      y += 8

      // ══════════════════════════════════════════════════
      // HISTORIAL DE CITAS
      // ══════════════════════════════════════════════════
      if (appointments.length > 0) {
        checkPage(20)
        doc.setFillColor(...light as [number,number,number])
        doc.roundedRect(margin, y, contentW, 8, 2, 2, 'F')
        addText(`HISTORIAL DE CITAS (${appointments.length})`, margin + 4, y + 5.5, { size: 8, color: primary, bold: true })
        y += 13

        appointments.slice(0, 10).forEach(apt => {
          checkPage(12)
          const aptDate = new Date(apt.scheduled_at).toLocaleDateString('es-CL', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })

          // Estado con color
          const statusColors: Record<string, number[]> = {
            completada: [16, 185, 129],
            programada: [59, 130, 246],
            cancelada:  [239, 68, 68],
            no_asistio: [245, 158, 11],
          }
          const sc = statusColors[apt.status] ?? muted

          doc.setFillColor(sc[0], sc[1], sc[2], 0.1)
          doc.roundedRect(margin, y - 3, contentW, 10, 1.5, 1.5, 'F')

          addText(aptDate, margin + 3, y + 3.5, { size: 8, color: muted })
          addText(apt.type?.replace('_', ' ') || '—', margin + 52, y + 3.5, { size: 8, color: dark, bold: true })
          const statusLabel = apt.status.charAt(0).toUpperCase() + apt.status.slice(1).replace('_', ' ')
          addText(statusLabel, W - margin - 3, y + 3.5, { size: 7, color: sc as [number,number,number] })
          y += 11

          if (apt.notes) {
            const extraH = addText(`  ${apt.notes}`, margin + 3, y, { size: 7, color: muted, maxW: contentW - 6 })
            y += 5 + extraH
          }
        })

        if (appointments.length > 10) {
          addText(`... y ${appointments.length - 10} citas más`, margin, y, { size: 7, color: muted })
          y += 6
        }

        y += 4
        doc.line(margin, y, W - margin, y)
        y += 8
      }

      // ══════════════════════════════════════════════════
      // SEGUIMIENTO CLÍNICO
      // ══════════════════════════════════════════════════
      if (followups.length > 0) {
        checkPage(20)
        doc.setFillColor(...light as [number,number,number])
        doc.roundedRect(margin, y, contentW, 8, 2, 2, 'F')
        addText(`SEGUIMIENTO CLÍNICO (${followups.length} registros)`, margin + 4, y + 5.5, { size: 8, color: primary, bold: true })
        y += 13

        followups.slice(0, 8).forEach(fu => {
          checkPage(18)
          const fuDate = new Date(fu.created_at).toLocaleDateString('es-CL', {
            day: '2-digit', month: 'short', year: 'numeric'
          })

          if (fu.is_alert) {
            doc.setFillColor(254, 226, 226)
            doc.roundedRect(margin, y - 2, contentW, 4, 1, 1, 'F')
          }

          addText(fuDate, margin, y + 2, { size: 7, color: muted })
          addText(fu.type?.toUpperCase() || '', margin + 25, y + 2, { size: 6.5, color: primary, bold: true })
          addText(fu.title, margin + 50, y + 2, { size: 8, color: dark, bold: true })
          if (fu.is_alert) addText('⚠ ALERTA', W - margin - 3, y + 2, { size: 7, color: [239, 68, 68] })
          y += 6

          if (fu.content) {
            const extraH = addText(fu.content, margin, y, { size: 7.5, color: [51, 65, 85], maxW: contentW })
            y += 5 + extraH
          }
          y += 2
        })

        y += 4
        doc.line(margin, y, W - margin, y)
        y += 8
      }

      // ══════════════════════════════════════════════════
      // RESUMEN IA
      // ══════════════════════════════════════════════════
      if (aiSummary) {
        checkPage(20)
        doc.setFillColor(238, 242, 255)
        doc.roundedRect(margin, y, contentW, 8, 2, 2, 'F')
        doc.setFillColor(...primary as [number,number,number])
        doc.roundedRect(margin, y, 3, 8, 1, 1, 'F')
        addText('ANÁLISIS Y SUGERENCIAS IA', margin + 7, y + 5.5, { size: 8, color: primary, bold: true })
        y += 13

        // Limpiar markdown del summary
        const cleanSummary = aiSummary
          .replace(/#{1,3}\s/g, '')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/^[-•]\s/gm, '• ')

        const extraH = addText(cleanSummary, margin, y, { size: 8, color: dark, maxW: contentW })
        y += 8 + extraH

        addText(
          '* Este análisis fue generado por IA como apoyo clínico y no reemplaza el juicio médico profesional.',
          margin, y, { size: 6.5, color: muted, maxW: contentW }
        )
        y += 8
      }

      // ══════════════════════════════════════════════════
      // FOOTER en todas las páginas
      // ══════════════════════════════════════════════════
      const totalPages = doc.getNumberOfPages()
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p)
        doc.setFillColor(...dark as [number,number,number])
        doc.rect(0, 285, W, 12, 'F')
        doc.setFillColor(...primary as [number,number,number])
        doc.rect(0, 285, W, 1, 'F')
        addText('ClinivigilIA — Sistema de Gestión Médica', margin, 291, { size: 7, color: [148, 163, 184] })
        addText(
          `Documento confidencial · Generado el ${new Date().toLocaleDateString('es-CL')} · Página ${p} de ${totalPages}`,
          W - margin, 291, { size: 7, color: [100, 116, 139] }
        )
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 116, 139)
        doc.setFontSize(7)
        doc.text(
          `Documento confidencial · Generado el ${new Date().toLocaleDateString('es-CL')} · Página ${p} de ${totalPages}`,
          W - margin, 291, { align: 'right' }
        )
      }

      // ── Acción ───────────────────────────────────────
      const filename = `Informe_${patient.first_name}_${patient.last_name}_${new Date().toISOString().slice(0,10)}.pdf`

      if (action === 'download') {
        doc.save(filename)
      } else {
        const blob = doc.output('blob')
        const url = URL.createObjectURL(blob)
        const win = window.open(url, '_blank')
        win?.print()
      }

    } catch (err) {
      console.error('Error generando PDF:', err)
      alert('Error al generar el informe. Asegúrate de tener conexión.')
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'icon') {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => generatePDF('download')}
          disabled={loading}
          title="Descargar informe PDF"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-40"
          style={{ background: 'var(--clinic-primary-light)', color: 'var(--clinic-primary)' }}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
        </button>
        <button
          onClick={() => generatePDF('print')}
          disabled={loading}
          title="Imprimir informe"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-40"
          style={{ background: 'var(--clinic-primary-light)', color: 'var(--clinic-primary)' }}>
          <Printer size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => generatePDF('download')}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px disabled:opacity-50"
        style={{
          background: 'linear-gradient(135deg, var(--clinic-primary), color-mix(in srgb, var(--clinic-primary) 70%, #000))',
          color: 'white',
          boxShadow: '0 4px 12px color-mix(in srgb, var(--clinic-primary) 30%, transparent)',
        }}>
        {loading ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
        {loading ? 'Generando...' : 'Descargar PDF'}
      </button>
      <button
        onClick={() => generatePDF('print')}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:-translate-y-px disabled:opacity-50"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}>
        <Printer size={15} />
        Imprimir
      </button>
    </div>
  )
}