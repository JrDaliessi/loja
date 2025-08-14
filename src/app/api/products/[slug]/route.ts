import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = createClient()
  const { slug } = params

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
  }

  try {
    const { data: product, error } = await supabase
      .from('products')
      .select(
        `
        id,
        name,
        slug,
        description_md,
        care_instructions_md,
        categories (id, name, slug),
        variants (*)
      `
      )
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Supabase query error:', error)
      // Heuristic to check if the error is because the item was not found
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (e) {
    console.error('API Route error:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
