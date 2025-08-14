import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Schema de validação para os dados de entrada
const waitlistSchema = z.object({
  variant_id: z.number().int().positive({ message: 'ID da variação inválido' }),
  email: z.string().email({ message: 'Endereço de e-mail inválido' }),
})

export async function POST(request: Request) {
  const supabase = createClient()

  try {
    const body = await request.json()

    // Valida o corpo da requisição
    const validation = waitlistSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { variant_id, email } = validation.data

    // Insere os dados na tabela waitlist
    const { error } = await supabase
      .from('waitlist')
      .insert({ variant_id, email })

    if (error) {
      console.error('Supabase insert error:', error)
      // Trata erro de chave estrangeira (variante não existe)
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Variação de produto não encontrada' },
          { status: 404 }
        )
      }
      return NextResponse.json({ error: 'Erro ao registrar na lista de espera' }, { status: 500 })
    }

    return NextResponse.json(
      { message: 'Inscrição na lista de espera realizada com sucesso!' },
      { status: 201 }
    )
  } catch (e) {
    console.error('API Route error:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
