import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProductDetails } from '@/components/product-details'
import { ProductGallery } from '@/components/product-gallery'

// TODO: Mover tipos para um arquivo dedicado (ex: lib/types.ts)
export type Variant = {
  id: number
  product_id: number
  sku: string
  color: string
  size: string
  price: number
  compare_at_price: number | null
  stock: number
  is_active: boolean
}

export type Category = {
  id: number
  name: string
  slug: string
}

export type ProductImage = {
  id: number
  url: string
  alt: string | null
}

export type Product = {
  id: number
  name: string
  slug: string
  description_md: string | null
  care_instructions_md: string | null
  categories: Category | null
  variants: Variant[]
  product_images: ProductImage[]
}

async function getProductData(slug: string): Promise<Product> {
  const supabase = createClient()
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
      variants (*),
      product_images (*)
    `
    )
    .eq('slug', slug)
    .order('position', { foreignTable: 'product_images' })
    .single()

  if (error || !product) {
    console.error('Failed to fetch product:', error)
    notFound()
  }

  return product as Product
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductData(params.slug)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <section>
          <ProductGallery images={product.product_images} />
        </section>

        <section className="flex flex-col gap-4">
          {/* TODO: Componente Breadcrumb */}
          <div className="text-sm text-gray-500">
            <p>
              Home / {product.categories?.name || 'Categoria'} / {product.name}
            </p>
          </div>

          <h1 className="text-3xl font-bold">{product.name}</h1>

          <ProductDetails product={product} />

          {/* TODO: Descrição do Produto */}
          {product.description_md && (
            <div>
              <h3 className="font-semibold mb-2">Descrição</h3>
              <p className="text-gray-700">{product.description_md}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
