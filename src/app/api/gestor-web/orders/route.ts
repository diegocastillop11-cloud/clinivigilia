// app/api/gestor-web/orders/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = createClient() as any

    const { error, data } = await supabase
      .from('web_orders')
      .insert({
        doctor_id:      body.doctor_id,
        customer_name:  body.customer_name,
        customer_email: body.customer_email || null,
        customer_phone: body.customer_phone || null,
        customer_notes: body.customer_notes || null,
        items:          body.items,
        subtotal:       body.subtotal,
        total:          body.total,
        currency:       body.currency || 'CLP',
        status:         'pending',
      })
      .select('order_number')
      .single()

    if (error) {
      console.error('Error creating order:', error)
      return NextResponse.json({ error: 'Error al crear pedido' }, { status: 500 })
    }

    return NextResponse.json({ order_number: data.order_number })
  } catch (error) {
    console.error('Orders API error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
