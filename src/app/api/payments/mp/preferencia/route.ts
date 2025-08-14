import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/ssr'
import { z } from 'zod'
import { MercadoPagoConfig, Preference } from 'mercadopago'

// Inicializa o cliente do Mercado Pago
// Acessa a variável de ambiente diretamente
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

const preferenceSchema = z.object({
  order_id: z.string().uuid(),
})

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    // 1. Validar o corpo da requisição
    const json = await request.json()
    const validation = preferenceSchema.safeParse(json)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 })
    }
    const { order_id } = validation.data

    // 2. Buscar dados do pedido e seus itens no Supabase
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', order_id)
      .single()

    if (orderError || !orderData) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 3. Formatar os itens para a API do Mercado Pago
    const items = orderData.order_items.map((item) => ({
      id: item.variant_id.toString(),
      title: item.name_snapshot,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      currency_id: 'BRL',
    }))

    // 4. Criar a preferência de pagamento
    const preference = new Preference(client)
    const result = await preference.create({
      body: {
        items,
        external_reference: order_id,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/meus-pedidos/${order_id}`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/sacola`,
        },
        // URL para receber notificações de pagamento
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/webhook`,
      },
    })

    // 5. Retornar os dados da preferência para o frontend
    return NextResponse.json(
      {
        init_point: result.init_point,
        qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Mercado Pago Preference Error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment preference' },
      { status: 500 }
    )
  }
}
