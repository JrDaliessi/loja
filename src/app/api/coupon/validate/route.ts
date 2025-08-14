import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const couponValidationSchema = z.object({
  coupon_code: z.string().min(1, { message: 'O código do cupom é obrigatório' }),
  subtotal: z.number().positive({ message: 'Subtotal deve ser um valor positivo' }),
})

export async function POST(request: Request) {
  const supabase = createClient()

  try {
    const body = await request.json()
    const validation = couponValidationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { coupon_code, subtotal } = validation.data

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', coupon_code.toUpperCase())
      .single()

    if (error || !coupon) {
      return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 })
    }

    // --- Lógica de Validação ---
    if (!coupon.is_active) {
      return NextResponse.json({ error: 'Este cupom está inativo' }, { status: 400 })
    }
    if (coupon.ends_at && new Date(coupon.ends_at) < new Date()) {
      return NextResponse.json({ error: 'Cupom expirado' }, { status: 400 })
    }
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ error: 'Cupom esgotado' }, { status: 400 })
    }
    if (coupon.min_subtotal && subtotal < coupon.min_subtotal) {
      return NextResponse.json(
        { error: `O valor mínimo para este cupom é de R$ ${coupon.min_subtotal}` },
        { status: 400 }
      )
    }

    // --- Cupom Válido ---
    const { used_count, max_uses, ends_at, ...validCoupon } = coupon

    return NextResponse.json(validCoupon)

  } catch (e) {
    console.error('Coupon validation error:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
