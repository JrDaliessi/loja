import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/ssr'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { z } from 'zod'

// Inicializa o cliente do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

// Schema para o corpo do webhook (simplificado)
const webhookSchema = z.object({
  action: z.string(),
  type: z.string(),
  data: z.object({
    id: z.string(),
  }),
})

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    // TODO: Implementar validação de assinatura do webhook
    // const signature = request.headers.get('x-signature')
    // const webhookSecret = process.env.MP_WEBHOOK_SECRET
    // Aqui iria a lógica para verificar a assinatura HMAC-SHA256

    const body = await request.json()
    const validation = webhookSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 })
    }

    const { type, data, action } = validation.data

    // Processar apenas eventos de pagamento
    if (type === 'payment' && action === 'payment.updated') {
      const paymentId = data.id

      // 1. Buscar o pagamento no Mercado Pago
      const payment = await new Payment(client).get({ id: paymentId })

      if (payment && payment.external_reference && payment.status) {
        const orderId = payment.external_reference
        const paymentStatus = payment.status

        // 2. Chamar a função para atualizar o pedido no banco
        const { error: rpcError } = await supabase.rpc('handle_payment_update', {
          order_id_input: orderId,
          payment_status_input: paymentStatus,
        })

        if (rpcError) {
          console.error('Error calling handle_payment_update:', rpcError)
          // Mesmo com erro interno, retornamos 200 para o MP não reenviar
          return NextResponse.json({ success: false, error: rpcError.message }, { status: 200 })
        }
      }
    }

    // 3. Retornar 200 OK para o Mercado Pago
    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
