import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { WebPage, WebService } from '@/types/gestor-web'
import LandingClient from './LandingClient'

// ─── Metadata dinámica por slug ───────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const supabase = createClient() as any
  const { data } = await supabase
    .from('web_pages')
    .select('clinic_name, tagline, hero_image_url')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (!data) return { title: 'Clínica no encontrada' }

  return {
    title: data.clinic_name,
    description: data.tagline || `Agenda tu cita con ${data.clinic_name}`,
    openGraph: {
      title: data.clinic_name,
      description: data.tagline,
      images: data.hero_image_url ? [data.hero_image_url] : [],
    },
  }
}

// ─── Página servidor ───────────────────────────────────────
export default async function LandingPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createClient() as any

  const { data: page } = await supabase
    .from('web_pages')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (!page) notFound()

  const { data: services } = await supabase
    .from('web_services')
    .select('*')
    .eq('doctor_id', page.doctor_id)
    .eq('active', true)
    .order('sort_order')

  const { data: featuredProducts } = await supabase
    .from('web_products')
    .select('*')
    .eq('doctor_id', page.doctor_id)
    .eq('active', true)
    .eq('featured', true)
    .order('sort_order')
    .limit(4)

  return <LandingClient page={page as WebPage} services={(services ?? []) as WebService[]} featuredProducts={featuredProducts ?? []}/>

}
