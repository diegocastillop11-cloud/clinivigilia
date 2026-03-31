// app/(public)/layout.tsx
// Layout limpio para rutas públicas — sin sidebar ni navbar del dashboard

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
