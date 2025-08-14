import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/ssr'
import { z } from 'zod'
import { Database } from '@/lib/supabase.types'

// --- Zod Schema for Input Validation ---
const shippingQuoteSchema = z.object({
  cep: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
  items: z.array(z.object({
    variant_id: z.number(),
    quantity: z.number().min(1),
  })).min(1, 'Pelo menos um item é necessário'),
})

// --- Type for Shipping Options ---
interface ShippingOption {
  name: string
  price: number
  delivery_time_days: number
  id: string
}

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

  try {
    // 1. Validate request body
    const json = await request.json()
    const validation = shippingQuoteSchema.safeParse(json)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 })
    }
    const { cep, items } = validation.data

    // 2. Fetch variant data from DB
    const variantIds = items.map(item => item.variant_id)
    const { data: variants, error: variantsError } = await supabase
      .from('variants')
      .select('id, price, weight_g')
      .in('id', variantIds)

    if (variantsError || !variants || variants.length !== variantIds.length) {
      return NextResponse.json({ error: 'Alguns produtos não foram encontrados.' }, { status: 404 })
    }

    // 3. Calculate totals
    let subtotal = 0
    let total_weight_g = 0
    const variantsMap = new Map(variants.map(v => [v.id, v]))

    for (const item of items) {
      const variant = variantsMap.get(item.variant_id)
      if (variant) {
        subtotal += Number(variant.price) * item.quantity
        total_weight_g += (variant.weight_g || 100) * item.quantity // Default weight 100g
      }
    }

    // 4. Apply business rules & build response
    const shippingOptions: ShippingOption[] = []

    // Rule: Local Pickup
    const pickupCeps = (process.env.LOJA_CEPS_RETIRADA || '').split(',')
    if (pickupCeps.includes(cep)) {
      shippingOptions.push({ id: 'pickup', name: 'Retirada em Loja', price: 0, delivery_time_days: 0 })
    }

    // Rule: Free Shipping
    const freeShippingSubtotal = Number(process.env.FRETE_GRATIS_SUBTOTAL || 9999)
    if (subtotal >= freeShippingSubtotal) {
      shippingOptions.push({ id: 'free', name: 'Frete Grátis', price: 0, delivery_time_days: 5 })
      // Se já tem frete grátis e retirada, podemos retornar
      return NextResponse.json(shippingOptions)
    }

    // 5. Check cache
    const { data: cachedQuote, error: cacheError } = await supabase
      .from('shipping_quotes')
      .select('quotes, created_at')
      .eq('cep', cep)
      .eq('total_weight_g', total_weight_g)
      .single()

    if (cachedQuote && !cacheError) {
      const cacheAge = (new Date().getTime() - new Date(cachedQuote.created_at).getTime()) / (1000 * 60)
      if (cacheAge < 30) { // Cache is valid for 30 minutes
        return NextResponse.json([...shippingOptions, ...cachedQuote.quotes as ShippingOption[]])
      }
    }

    // 6. Call external API (Melhor Envio)
    let finalQuotes: ShippingOption[] = []
    try {
      const response = await fetch('https://www.melhorenvio.com.br/api/v2/me/shipment/calculate', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MELHOR_ENVIO_API_TOKEN}`,
          'User-Agent': 'Gemini-Agent (contato@loja.com)'
        },
        body: JSON.stringify({
          from: { postal_code: "01001000" }, // CEP da loja (origem)
          to: { postal_code: cep },
          package: {
            weight: (total_weight_g / 1000).toFixed(2), // Converter para kg
            width: 15,
            height: 5,
            length: 20,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Melhor Envio API responded with status ${response.status}`)
      }

      const data = await response.json()

      // Filtrar e mapear as 2 melhores respostas (excluindo erros)
      finalQuotes = data
        .filter((quote: any) => !quote.error)
        .map((quote: any) => ({
          id: quote.id.toString(),
          name: quote.name,
          price: Number(quote.price),
          delivery_time_days: Number(quote.delivery_time),
        }))
        .slice(0, 2)

    } catch (apiError) {
      console.error("Melhor Envio API Error:", apiError)
      // Se a API externa falhar, retorna apenas as opções locais (retirada/frete grátis)
      return NextResponse.json(shippingOptions)
    }

    // 7. Save to cache
    const allQuotes = [...finalQuotes]
    const { error: saveCacheError } = await supabase
      .from('shipping_quotes')
      .upsert({ cep, total_weight_g, quotes: allQuotes, created_at: new Date().toISOString() })

    if (saveCacheError) {
      console.error('Error saving shipping quote to cache:', saveCacheError)
    }

    // 8. Return final list
    return NextResponse.json([...shippingOptions, ...allQuotes])

  } catch (error) {
    console.error('Shipping Quote Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
