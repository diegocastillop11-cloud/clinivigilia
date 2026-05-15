import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import LeadMagnetForm from './LeadMagnetForm'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const supabase = createClient() as any
  const { data } = await supabase
    .from('lead_magnets')
    .select('title, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (!data) return { title: 'Guía no encontrada' }

  return {
    title: data.title,
    description: data.description ?? undefined,
    openGraph: {
      title: data.title,
      description: data.description ?? undefined,
    },
  }
}

export default async function GuiaPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createClient() as any

  const { data: leadMagnet } = await supabase
    .from('lead_magnets')
    .select('title, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (!leadMagnet) notFound()

  return (
    <LeadMagnetForm
      slug={slug}
      title={leadMagnet.title}
      description={leadMagnet.description}
    />
  )
}
