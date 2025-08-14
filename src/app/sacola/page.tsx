'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/stores/use-cart-store'
import type { CartItem, Coupon } from '@/stores/use-cart-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Separator } from '@/components/ui/separator'

function CartItemRow({ item }: { item: CartItem }) {
  const { updateItemQuantity, removeItem } = useCartStore()

  return (
    <div className="flex items-start gap-4 py-4">
      <div className="relative h-24 w-24 border rounded-md overflow-hidden">
        <Image
          src={item.image_url || '/placeholder.svg'}
          alt={item.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold">{item.name}</h3>
        <p className="text-sm text-gray-500">Preço: R$ {item.price.toFixed(2)}</p>
        <div className="flex items-center gap-2 mt-2">
          <label htmlFor={`quantity-${item.variant_id}`} className="text-sm">Qtd:</label>
          <Input 
            id={`quantity-${item.variant_id}`}
            type="number"
            min={1}
            className="h-8 w-16"
            value={item.quantity}
            onChange={(e) => updateItemQuantity(item.variant_id, parseInt(e.target.value, 10) || 1)}
          />
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold">R$ {(item.price * item.quantity).toFixed(2)}</p>
        <Button variant="link" className="text-red-500 h-auto p-0 mt-2" onClick={() => removeItem(item.variant_id)}>
          Remover
        </Button>
      </div>
    </div>
  )
}

function OrderSummary() {
    const { items, coupon, applyCoupon } = useCartStore()
    const { toast } = useToast()
    const [couponCode, setCouponCode] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // TODO: Mover para variável de ambiente ou configuração remota
    const FREE_SHIPPING_THRESHOLD = 199;

    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
    let discount = 0
    if (coupon) {
        if (coupon.type === 'fixed') {
            discount = coupon.value
        } else if (coupon.type === 'percent') {
            discount = subtotal * (coupon.value / 100)
        }
        // 'free_shipping' coupon não aplica um desconto direto no subtotal
    }
    const total = subtotal - discount

    const hasFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || coupon?.type === 'free_shipping';
    const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;

    const handleApplyCoupon = async () => {
        if (!couponCode) return
        setIsLoading(true)
        try {
            const response = await fetch('/api/coupon/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coupon_code: couponCode, subtotal })
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Erro desconhecido')
            applyCoupon(data as Coupon)
            toast({ title: 'Sucesso!', description: 'Cupom aplicado.' })
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="p-6 border rounded-lg bg-gray-50 space-y-4">
            {hasFreeShipping ? (
                 <div className="text-center text-sm text-green-600 bg-green-50 p-3 rounded-md">
                    <p>🎉 Parabéns! Seu pedido tem frete grátis!</p>
                </div>
            ) : (
                remainingForFreeShipping > 0 && (
                    <div className="text-center text-sm text-gray-600 bg-gray-100 p-3 rounded-md">
                        <p>
                        Faltam <strong>R$ {remainingForFreeShipping.toFixed(2)}</strong> para ganhar frete grátis!
                        </p>
                    </div>
                )
            )}
            <h2 className="text-xl font-semibold">Resumo do Pedido</h2>
            <div className="flex justify-between">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
                <Input placeholder="Cupom de desconto" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} />
                <Button onClick={handleApplyCoupon} disabled={isLoading}>{isLoading ? 'Aplicando...' : 'Aplicar'}</Button>
            </div>
            {coupon && (
                <div className="flex justify-between text-green-600">
                    <span>Desconto ({coupon.code})</span>
                    <span>- R$ {discount.toFixed(2)}</span>
                </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>R$ {total.toFixed(2)}</span>
            </div>
            <Button asChild size="lg" className="w-full">
                <Link href="/checkout">Finalizar Compra</Link>
            </Button>
        </div>
    )
}

export default function SacolaPage() {
  const { items } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="container mx-auto text-center py-20">
        <h1 className="text-2xl font-semibold">Seu carrinho está vazio</h1>
        <Button asChild variant="default" className="mt-4">
          <Link href="/">Continuar Comprando</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Meu Carrinho</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 divide-y">
          {items.map((item) => (
            <CartItemRow key={item.variant_id} item={item} />
          ))}
        </div>
        <div className="lg:col-span-1">
            <OrderSummary />
        </div>
      </div>
    </div>
  )
}
