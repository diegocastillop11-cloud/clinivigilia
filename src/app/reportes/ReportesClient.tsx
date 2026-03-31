'use client'

import { useState } from 'react'
import { BarChart2, Users, Calendar, FileText, Download, Printer, TrendingUp, AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  doctor: any
  stats: any
  patients: any[]
  appointments: any[]
  followups: any[]
}

const SPECIALTY_LABELS: Record<string, string> = {
  cardiologia: 'Cardiología', neurologia: 'Neurología', oncologia: 'Oncología',
  pediatria: 'Pediatría', ortopedia: 'Ortopedia', endocrinologia: 'Endocrinología',
  ginecologia: 'Ginecología', dermatologia: 'Dermatología', psiquiatria: 'Psiquiatría',
  medicina_general: 'Medicina General',
}

export default function ReportesClient({ doctor, stats, patients, appointments, followups }: Props) {
  const [generating, setGenerating] = useState(false)
  const [reportType, setReportType] = useState<'general' | 'pacientes' | 'citas'>('general')

  // Calcular estadísticas
  const apptByStatus = appointments.reduce((acc: any, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1
    return acc
  }, {})

  const patientsBySpecialty = patients.reduce((acc: any, p) => {
    const label = SPECIALTY_LABELS[p.specialty] ?? p.specialty
    acc[label] = (acc[label] || 0) + 1
    return acc
  }, {})

  const topSpecialties = Object.entries(patientsBySpecialty)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)

  const alertsCount = followups.filter(f => f.is_alert).length
  const completedAppts = appointments.filter(a => a.status === 'completada').length
  const cancelledAppts = appointments.filter(a => a.status === 'cancelada').length

  const generatePDF = async (action: 'download' | 'print') => {
    setGenerating(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210
      const margin = 20
      let y = 0

      const primary = [14, 165, 233] as [number,number,number]
      const dark = [15, 23, 42] as [number,number,number]
      const muted = [100, 116, 139] as [number,number,number]
      const white = [255, 255, 255] as [number,number,number]
      const light = [241, 245, 249] as [number,number,number]

      const addText = (text: string, x: number, yPos: number, opts: { size?: number; color?: [number,number,number]; bold?: boolean; align?: 'right' | 'left' } = {}) => {
        doc.setFontSize(opts.size ?? 10)
        doc.setTextColor(...(opts.color ?? dark))
        doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
        doc.text(text, x, yPos, opts.align === 'right' ? { align: 'right' } : undefined)
      }

      const checkPage = (needed: number) => {
        if (y + needed > 270) { doc.addPage(); y = 20 }
      }

      // Header
      doc.setFillColor(...dark)
      doc.rect(0, 0, W, 42, 'F')
      doc.setFillColor(...primary)
      doc.rect(0, 0, W, 2, 'F')

      addText(doctor?.clinic_name || 'ClinivigilIA', margin, 14, { size: 14, color: white, bold: true })
      addText('Reporte Clínico', margin, 22, { size: 9, color: [148, 163, 184] })
      addText(new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }), W - margin, 14, { size: 8, color: [148, 163, 184], align: 'right' })
      addText(`Dr. ${doctor?.full_name ?? ''}`, W - margin, 22, { size: 8, color: primary, align: 'right' })

      y = 52

      // Stats generales
      doc.setFillColor(...light)
      doc.roundedRect(margin, y, W - margin * 2, 8, 2, 2, 'F')
      addText('RESUMEN GENERAL', margin + 4, y + 5.5, { size: 8, color: primary, bold: true })
      y += 13

      const statItems = [
        ['Total Pacientes', stats.total],
        ['Pacientes Activos', stats.activos],
        ['Pendientes', stats.pendientes],
        ['Con Alta', stats.alta],
        ['Total Citas', appointments.length],
        ['Citas Completadas', completedAppts],
        ['Citas Canceladas', cancelledAppts],
        ['Alertas Clínicas', alertsCount],
      ]

      const colW = (W - margin * 2) / 2 - 3
      statItems.forEach(([label, value], i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const xPos = margin + col * (colW + 6)
        const yPos = y + row * 8
        checkPage(8)
        addText(String(label) + ':', xPos, yPos, { size: 8, color: muted, bold: true })
        addText(String(value), xPos + 45, yPos, { size: 8, color: dark })
      })
      y += Math.ceil(statItems.length / 2) * 8 + 8

      // Especialidades
      if (topSpecialties.length > 0) {
        checkPage(20)
        doc.setFillColor(...light)
        doc.roundedRect(margin, y, W - margin * 2, 8, 2, 2, 'F')
        addText('PACIENTES POR ESPECIALIDAD', margin + 4, y + 5.5, { size: 8, color: primary, bold: true })
        y += 13

        topSpecialties.forEach(([specialty, count]) => {
          checkPage(10)
          addText(String(specialty), margin, y, { size: 8, color: dark })
          addText(String(count) + ' pacientes', W - margin, y, { size: 8, color: muted, align: 'right' })

          // Barra proporcional
          const maxCount = topSpecialties[0][1] as number
          const barWidth = ((count as number) / maxCount) * (W - margin * 2 - 60)
          doc.setFillColor(...primary)
          doc.roundedRect(margin, y + 2, barWidth, 2.5, 1, 1, 'F')
          y += 10
        })
        y += 6
      }

      // Últimas citas
      if (appointments.length > 0) {
        checkPage(20)
        doc.setFillColor(...light)
        doc.roundedRect(margin, y, W - margin * 2, 8, 2, 2, 'F')
        addText(`HISTORIAL DE CITAS (últimas ${Math.min(appointments.length, 10)})`, margin + 4, y + 5.5, { size: 8, color: primary, bold: true })
        y += 13

        appointments.slice(0, 10).forEach(apt => {
          checkPage(10)
          const aptDate = new Date(apt.scheduled_at).toLocaleDateString('es-CL')
          const patName = apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : '—'
          addText(aptDate, margin, y, { size: 7.5, color: muted })
          addText(patName, margin + 25, y, { size: 7.5, color: dark })
          addText(apt.status, W - margin, y, { size: 7, color: apt.status === 'completada' ? [16, 185, 129] : apt.status === 'cancelada' ? [239, 68, 68] : primary, align: 'right' })
          y += 7
        })
        y += 4
      }

      // Footer
      const totalPages = doc.getNumberOfPages()
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p)
        doc.setFillColor(...dark)
        doc.rect(0, 285, W, 12, 'F')
        doc.setFillColor(...primary)
        doc.rect(0, 285, W, 1, 'F')
        addText('ClinivigilIA — Sistema de Gestión Médica', margin, 291, { size: 7, color: [148, 163, 184] })
        doc.setFontSize(7)
        doc.setTextColor(100, 116, 139)
        doc.text(`Generado el ${new Date().toLocaleDateString('es-CL')} · Página ${p} de ${totalPages}`, W - margin, 291, { align: 'right' })
      }

      const filename = `Reporte_${doctor?.full_name?.replace(/ /g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`
      if (action === 'download') {
        doc.save(filename)
      } else {
        const blob = doc.output('blob')
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')?.print()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  const statCards = [
    { label: 'Total Pacientes',  value: stats.total,       color: 'var(--clinic-primary)', icon: Users },
    { label: 'Activos',          value: stats.activos,      color: '#10b981',               icon: TrendingUp },
    { label: 'Total Citas',      value: appointments.length, color: '#8b5cf6',              icon: Calendar },
    { label: 'Alertas',          value: alertsCount,         color: '#f59e0b',              icon: AlertCircle },
  ]

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto w-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Reportes
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Estadísticas y exportación de datos clínicos
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => generatePDF('download')} disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-px disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--clinic-primary), color-mix(in srgb, var(--clinic-primary) 70%, #000))', boxShadow: '0 4px 12px color-mix(in srgb, var(--clinic-primary) 30%, transparent)' }}>
            {generating ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {generating ? 'Generando...' : 'Descargar PDF'}
          </button>
          <button onClick={() => generatePDF('print')} disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <Printer size={15} /> Imprimir
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: color }} />
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}18` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <p className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Pacientes por especialidad */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Users size={15} style={{ color: 'var(--clinic-primary)' }} /> Pacientes por Especialidad
          </h2>
          {topSpecialties.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Sin datos aún</p>
          ) : topSpecialties.map(([specialty, count]) => {
            const max = topSpecialties[0][1] as number
            const pct = Math.round(((count as number) / max) * 100)
            return (
              <div key={String(specialty)} className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{specialty}</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--clinic-primary)' }}>{String(count)}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: 'var(--clinic-primary)' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Estado de citas */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Calendar size={15} style={{ color: 'var(--clinic-primary)' }} /> Estado de Citas
          </h2>
          {appointments.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Sin citas aún</p>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Completadas', key: 'completada', color: '#10b981' },
                { label: 'Programadas', key: 'programada', color: 'var(--clinic-primary)' },
                { label: 'Confirmadas',  key: 'confirmada', color: '#8b5cf6' },
                { label: 'Canceladas',   key: 'cancelada',  color: '#ef4444' },
                { label: 'No asistió',   key: 'no_asistio', color: '#f59e0b' },
              ].map(({ label, key, color }) => {
                const count = apptByStatus[key] ?? 0
                const pct = Math.round((count / appointments.length) * 100)
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
                      <span className="text-xs font-bold" style={{ color }}>{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Seguimientos recientes */}
        <div className="rounded-2xl p-5 lg:col-span-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FileText size={15} style={{ color: 'var(--clinic-primary)' }} /> Últimos Seguimientos
          </h2>
          {followups.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Sin seguimientos aún</p>
          ) : (
            <div className="space-y-2">
              {followups.slice(0, 6).map(f => (
                <div key={f.id} className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: f.is_alert ? 'rgba(239,68,68,0.05)' : 'var(--bg-main)', border: `1px solid ${f.is_alert ? 'rgba(239,68,68,0.15)' : 'var(--border-color)'}` }}>
                  {f.is_alert && <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{f.title}</p>
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{f.content}</p>
                  </div>
                  <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {new Date(f.created_at).toLocaleDateString('es-CL')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}