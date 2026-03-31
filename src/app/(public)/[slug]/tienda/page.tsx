import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import TiendaClient from './TiendaClient'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const supabase = createClient() as any
  const { data } = await supabase
    .from('web_pages').select('clinic_name').eq('slug', slug).eq('published', true).maybeSingle()
  return { title: data ? `Tienda — ${data.clinic_name}` : 'Tienda' }
}

export default async function TiendaPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createClient() as any

  const { data: page } = await supabase
    .from('web_pages').select('*').eq('slug', slug).eq('published', true).maybeSingle()

  if (!page) notFound()

  const { data: products } = await supabase
    .from('web_products')
    .select('*')
    .eq('doctor_id', page.doctor_id)
    .eq('active', true)
    .order('sort_order')

  return <TiendaClient page={page} products={products ?? []} />
}
