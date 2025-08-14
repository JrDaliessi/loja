'use client'

import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'

import { useCartStore } from '@/stores/use-cart-store'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import Image from 'next/image'

function CartItem({ item }: { item: import('@/stores/use-cart-store').CartItem }) {
  const { removeItem, updateItemQuantity } = useCartStore()

  return (
    <div className="flex items-center gap-4 py-4">
      <div className="relative h-20 w-20 border rounded-md overflow-hidden">
        <Image
          src={item.image_url || '/placeholder.svg'}
          alt={item.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex-1">
        <p className="font-semibold">{item.name}</p>
        <p className="text-sm text-gray-500">R$ {item.price.toFixed(2)}</p>
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => updateItemQuantity(item.variant_id, item.quantity - 1)}
          >
            -
          </Button>
          <span>{item.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => updateItemQuantity(item.variant_id, item.quantity + 1)}
          >
            +
          </Button>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={() => removeItem(item.variant_id)}>
        <span className="text-xs text-red-500">Remover</span>
      </Button>
    </div>
  )
}

export function MiniCart() {
  const { items } = useCartStore()
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingBag className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Carrinho ({itemCount} itens)</SheetTitle>
        </SheetHeader>
        <Separator />
        {itemCount > 0 ? (
          <>
            <ScrollArea className="flex-1 pr-4">
              <div className="flex flex-col divide-y">
                {items.map((item) => (
                  <CartItem key={item.variant_id} item={item} />
                ))}
              </div>
            </ScrollArea>
            <Separator />
            <SheetFooter className="mt-4">
              <div className="w-full space-y-4">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline">
                        <Link href="/sacola">Ver Carrinho</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/checkout">Finalizar Compra</Link>
                    </Button>
                </div>
              </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <ShoppingBag className="h-16 w-16 text-gray-300" />
            <p className="text-gray-500">Seu carrinho está vazio.</p>
            <Button asChild variant="link">
                <Link href="/">Continuar comprando</Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
