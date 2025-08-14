'use client'

import { useState, useMemo } from 'react'
import type { Product, Variant } from '@/app/p/[slug]/page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ProductDetailsProps {
  product: Product
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const { toast } = useToast()
  const [selectedColor, setSelectedColor] = useState<string | null>(
    product.variants[0]?.color || null
  )
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const uniqueColors = useMemo(() => {
    const colors = product.variants.map((v) => v.color)
    return [...new Set(colors)]
  }, [product.variants])

  const availableSizesForColor = useMemo(() => {
    if (!selectedColor) return []
    return product.variants
      .filter((v) => v.color === selectedColor)
      .map((v) => v.size)
  }, [product.variants, selectedColor])

  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return null
    return (
      product.variants.find(
        (v) => v.color === selectedColor && v.size === selectedSize
      ) || null
    )
  }, [product.variants, selectedColor, selectedSize])

  const handleNotifyMeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVariant || !email) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant_id: selectedVariant.id, email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Algo deu errado')
      }

      toast({
        title: 'Pronto!',
        description: 'Você será notificado por e-mail quando este produto voltar.',
      })
      setEmail('')
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const displayPrice = selectedVariant?.price || product.variants[0]?.price
  const displayCompareAtPrice = selectedVariant?.compare_at_price || product.variants[0]?.compare_at_price

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-md font-semibold mb-2">Cor: {selectedColor}</h3>
        <div className="flex gap-2">
          {uniqueColors.map((color) => (
            <button
              key={color}
              onClick={() => {
                setSelectedColor(color)
                setSelectedSize(null) // Reset size selection when color changes
              }}
              className={cn(
                'w-8 h-8 rounded-full border-2',
                selectedColor === color ? 'border-blue-500' : 'border-gray-200'
              )}
              style={{ backgroundColor: color.toLowerCase() }}
              aria-label={`Cor ${color}`}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-md font-semibold mb-2">Tamanho:</h3>
        <div className="flex gap-2 flex-wrap">
          {availableSizesForColor.map((size) => (
            <Button
              key={size}
              variant={selectedSize === size ? 'default' : 'outline'}
              onClick={() => setSelectedSize(size)}
              disabled={!selectedColor}
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      <div className="text-3xl font-bold">
        {displayCompareAtPrice && (
            <span className="text-lg text-gray-500 line-through mr-2">
                R$ {displayCompareAtPrice.toFixed(2)}
            </span>
        )}
        <span>R$ {displayPrice ? displayPrice.toFixed(2) : '---'}</span>
      </div>

      {selectedVariant && selectedVariant.stock > 0 && (
        <Button size="lg" disabled={!selectedVariant}>Adicionar ao Carrinho</Button>
      )}

      {selectedVariant && selectedVariant.stock === 0 && (
        <form onSubmit={handleNotifyMeSubmit} className="p-4 border rounded-lg bg-gray-50 space-y-2">
            <p className='font-semibold'>Produto indisponível</p>
            <p className='text-sm text-gray-600'>Deixe seu e-mail para ser notificado quando voltar.</p>
            <div className="flex gap-2">
                <Input 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Enviando...' : 'Avise-me'}
                </Button>
            </div>
        </form>
      )}

      {!selectedVariant && selectedSize && selectedColor && (
         <div className="p-4 border rounded-lg bg-yellow-50 text-yellow-800">
            <p>Esta combinação de cor e tamanho não está disponível.</p>
        </div>
      )}

    </div>
  )
}
