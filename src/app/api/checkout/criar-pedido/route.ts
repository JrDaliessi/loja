import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/ssr'
import { z } from 'zod'

// Schema de validação para cada item do carrinho
const cartItemSchema = z.object({
  variant_id: z.number(),
  product_id: z.number(),
  name: z.string(),
  image_url: z.string().nullable(),
  price: z.number(),
  quantity: z.number().min(1),
  // Adicionando campos que a função SQL espera
  color: z.string(),
  size: z.string(),
})

// Schema de validação para o corpo da requisição
const checkoutSchema = z.object({
  items: z.array(cartItemSchema),
  // TODO: Adicionar validação para shipping e coupon se necessário
})

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    // 1. Obter dados do usuário autenticado
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    // 2. Validar o corpo da requisição
    const json = await request.json()
    const validation = checkoutSchema.safeParse(json)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 })
    }

    const { items } = validation.data

    // 3. Chamar a função RPC do Supabase para criar o pedido
    const { data: orderId, error: rpcError } = await supabase.rpc(
      'create_order_with_items',
      {
        cart_items: items,
        user_id_input: userId,
        // TODO: Passar dados de frete e cupom dinamicamente
        shipping_cost_input: 10.0, // Valor fixo por enquanto
        coupon_code_input: null,
        coupon_discount_input: 0,
      }
    )

    if (rpcError) {
      console.error('Supabase RPC Error:', rpcError)
      return NextResponse.json(
        { error: 'Failed to create order', details: rpcError.message },
        { status: 500 }
      )
    }

    // 4. Retornar o ID do pedido criado
    return NextResponse.json({ order_id: orderId }, { status: 201 })
    
  } catch (error) {
    console.error('Internal Server Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
