# ClinivigilIA — Instrucciones para Claude

## Qué es este proyecto
SaaS chileno de gestión médica con IA: manejo de pacientes, citas, seguimientos clínicos, páginas web personalizadas con chatbot de reservas, y análisis con Claude AI. Stack: Next.js 14 App Router · Supabase · Claude API · TypeScript · Tailwind.

## Cómo trabajar en este proyecto

### Reglas de comunicación
- **Siempre responder en español**, sin excepción.
- **Trabajar con planes de acción**: antes de implementar algo no trivial, presentar un plan numerado breve (3-5 pasos), esperar confirmación, luego ejecutar paso a paso.

### Contexto de producto
- El sistema está orientado a **médicos y clínicas** — los usuarios finales son doctores, no pacientes.
- Contexto de datos: pacientes, citas, seguimientos, especialidades médicas, RUT chileno.
- Multi-tenant: cada doctor ve solo sus propios datos. Clínicas agrupan múltiples doctores.
- Roles: `superadmin` (diego.castillo.p11@gmail.com) → `clinic_admin` → `doctor`.

### Prioridades
1. **Poco uso de tokens** — respuestas directas, sin explicar lo obvio. Una propuesta + el tradeoff principal.
2. **Orden lógico** — una cosa a la vez. Terminar lo que se empieza antes de pasar a lo siguiente.
3. **No crear archivos innecesarios** — editar lo que existe. Sin documentación extra, sin comentarios obvios.

### Flujo de trabajo
- Leer el archivo relevante antes de editar.
- Proponer plan de acción si la tarea tiene más de 2 pasos, esperar confirmación.
- Implementar directo si la tarea es clara y pequeña.
- Verificar que lo editado compila (sin errores de TypeScript obvios).

## Arquitectura

```
src/
  app/
    api/                  → rutas API (Next.js route handlers)
    auth/                 → login, register
    dashboard/            → panel principal del doctor
    dashboard/gestor-web/ → gestor de landing page con chatbot
    admin/                → panel superadmin (NEXT_PUBLIC_SUPERADMIN_EMAIL)
    clinica/admin/        → panel del admin de clínica
    pacientes/            → gestión de pacientes
    citas/                → gestión de citas
    seguimiento/          → seguimientos y notas clínicas
    reportes/             → exportación de datos (jsPDF)
    ia/                   → módulo IA (restringido por licencia)
    (public)/[slug]/      → landing page pública del doctor/clínica
  components/
    layout/               → Sidebar, ClinicAdminSidebar, AdminSidebar
    patients/             → PatientTable, formularios de paciente
    appointments/         → AppointmentActions, listas de citas
    followups/            → FollowupTimeline, AddFollowupForm, alertas
    ia/                   → IAChat (módulo IA para doctores)
    dashboard/            → stats, widgets del dashboard
    clinica/              → componentes de clínica
    admin/                → componentes del superadmin
  context/
    ThemeContext.tsx       → branding y tema por clínica (colores, logo)
  lib/supabase/
    client.ts             → cliente browser
    server.ts             → cliente SSR con cookies
  types/
    database.ts           → tipos TypeScript de todas las tablas
  middleware.ts           → auth guard + redirección por rol
```

## Base de datos (Supabase)

Tablas principales: `doctors` · `patients` · `appointments` · `followups` · `clinic_settings` · `licenses` · `clinics` · `modules` · `web_availability`

**Roles y visibilidad:**
- `doctors.is_superadmin = true` → ve todo
- `doctors.account_type = 'clinic_admin'` → ve doctores de su clínica
- Doctor regular → solo sus propios datos (RLS)

**Enums clave:**
- `appointments.type`: primera_vez / control / urgencia / teleconsulta / procedimiento
- `appointments.status`: programada / confirmada / completada / cancelada / no_asistio
- `followups.type`: nota / evolucion / laboratorio / imagen / receta / alerta / email_enviado
- `followups.alert_level`: info / warning / critical
- `licenses.plan`: free / pro / premium / enterprise

**Planes y módulos:**
- Free: pacientes, citas, seguimientos
- Pro: + reportes, email automático
- Premium: + módulo IA
- Enterprise: todo habilitado

## APIs importantes

| Ruta | Qué hace |
|------|----------|
| `POST /api/admin/create-client` | Superadmin crea doctor (usa service role key) |
| `POST /api/admin/create-clinic` | Superadmin crea clínica + admin |
| `POST /api/admin/delete-client` | Superadmin elimina cuenta de doctor |
| `POST /api/clinica/create-doctor` | Clinic admin agrega doctor a su clínica |
| `POST /api/gestor-web/chat` | Chat Claude AI para reservas web — detecta comando `AGENDAR\|...` y crea cita |
| `POST /api/gestor-web/enrich-service` | IA enriquece descripción de servicios |
| `GET/POST /api/gestor-web/orders` | Registros de reservas desde la web pública |
| `POST /api/seguimiento/send-reminder` | Envía email recordatorio al paciente (Resend) |

**Flujo del chat web (`/api/gestor-web/chat`):**
1. Recibe mensajes, `doctor_id`, `slug`, lista de servicios
2. Claude consulta disponibilidad de los próximos 14 días desde `web_availability`
3. Cuando el paciente confirma → detecta `AGENDAR|nombre|rut|email|teléfono|YYYY-MM-DD|HH:MM|servicio|duración`
4. Auto-crea paciente + cita en la BD

## Variables de entorno necesarias
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
NEXT_PUBLIC_SUPERADMIN_EMAIL
GMAIL_USER
GMAIL_APP_PASSWORD
RESEND_API_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SITE_URL
```

## Convenciones
- CSS variables del tema (desde `ThemeContext`): `--primary-color`, `--sidebar-color`, `--bg-base`, etc.
- Server Components por defecto; `'use client'` solo cuando hay estado/interactividad.
- No usar `any` en TypeScript — los tipos están en `src/types/database.ts`.
- Localización: español (es-CL), RUT chileno, `date-fns` con locale `es`.
- Notificaciones: `react-hot-toast` (importar `toast` de `'react-hot-toast'`).
- Iconos: `lucide-react`.

## Herramientas gstack disponibles

Suite de skills instalada en `~/.claude/skills/gstack`. Invocar con `/nombre` cuando aplique.

**Planificación y revisión de planes**
- `/spec` — convierte una idea vaga en spec ejecutable
- `/office-hours` — brainstorming de producto estilo YC
- `/autoplan` — pipeline de revisión automática (CEO → Design → Eng → DX) con voces duales (Claude + Codex)
- `/plan-ceo-review` `/plan-design-review` `/plan-eng-review` `/plan-devex-review` — revisión de plan por área, interactiva
- `/plan-tune` — ajusta sensibilidad de preguntas del flujo

**Código y debugging**
- `/investigate` — debugging sistemático con root cause
- `/review` — revisión de PR antes de mergear
- `/health` — dashboard de calidad de código
- `/devex-review` — auditoría de developer experience en vivo

**QA y navegador**
- `/qa` / `/qa-only` — testing de la app en navegador headless (con fixes o solo reporte)
- `/browse` — navegador headless rápido para QA
- `/scrape` — extraer datos de una página web
- `/setup-browser-cookies` — importar cookies del navegador real

**Diseño**
- `/design-consultation` — sistema de diseño completo (estética, tipografía, color)
- `/design-html` — genera HTML/CSS de producción
- `/design-review` — ojo de diseñador: inconsistencias visuales
- `/design-shotgun` — genera variantes de diseño en paralelo

**Ship y deploy**
- `/ship` — flujo completo: tests, review, changelog, commit, push, PR
- `/land-and-deploy` — merge + deploy
- `/canary` — monitoreo post-deploy
- `/setup-deploy` — configura settings de deployment

**Seguridad**
- `/cso` — modo Chief Security Officer
- `/careful` / `/guard` — guardrails para comandos destructivos / edición limitada a un directorio

**Contexto y memoria**
- `/context-save` / `/context-restore` — guarda y restaura contexto de trabajo
- `/learn` — gestiona aprendizajes del proyecto
- `/setup-gbrain` / `/sync-gbrain` — memoria semántica del repo (gbrain)
- `/retro` — retrospectiva semanal de ingeniería

**Otros**
- `/diagram` — descripción en inglés → diagrama editable
- `/document-generate` / `/document-release` — generación y actualización de docs
- `/make-pdf` — markdown → PDF
- `/benchmark` / `/benchmark-models` — detección de regresiones de performance
- `/codex` — wrapper del CLI de OpenAI Codex
- `/pair-agent` — parea un agente remoto con el navegador
- `/gstack-upgrade` — actualiza gstack a la última versión

## Lo que falta por completar
- Envío masivo de emails (Resend bulk) para recordatorios automáticos
- Vista de reportes con filtros avanzados y gráficos
- Módulo de teleconsulta (videollamada embebida)
- Onboarding guiado para doctores nuevos
- Notificaciones push / alertas en tiempo real
