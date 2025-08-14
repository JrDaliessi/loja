'use client'

import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCartStore, CartItem } from '@/stores/use-cart-store'

import { initMercadoPago, Payment } from '@mercadopago/sdk-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

// --- Tipos ---
interface ShippingOption {
  id: string
  name: string
  price: number
  delivery_time_days: number
}

const addressSchema = z.object({
  cep: z.string().min(8, 'CEP inválido').regex(/^\d{8}$/, 'CEP deve conter 8 números'),
  street: z.string().min(3, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  city: z.string().min(3, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
})

type AddressFormData = z.infer<typeof addressSchema>

// --- Inicialização do SDK ---
const mpPublicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY
if (mpPublicKey) {
  initMercadoPago(mpPublicKey)
} else {
  console.warn('Mercado Pago public key is not set.')
}

// --- Componente Principal ---
export default function CheckoutPage() {
  const [step, setStep] = useState('address')
  const [shippingAddress, setShippingAddress] = useState<AddressFormData | null>(null)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)
  const [preferenceId, setPreferenceId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { items, clearCart } = useCartStore()
  const { toast } = useToast()

  const getShippingQuotes = async (address: AddressFormData) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/frete/cotacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep: address.cep.replace(/\D/g, ''), items }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao cotar o frete.')
      setShippingOptions(data)
      if (data.length > 0) setSelectedShipping(data[0]) // Pré-seleciona a primeira opção
    } catch (error) {
      toast({ title: 'Erro no Frete', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' })
      setStep('address') // Volta para o passo de endereço em caso de erro
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddressSubmit = (data: AddressFormData) => {
    setShippingAddress(data)
    setStep('shipping')
    getShippingQuotes(data)
  }

  const handleProceedToPayment = async () => {
    if (!selectedShipping) {
      toast({ title: 'Selecione uma forma de envio.', variant: 'destructive' })
      return
    }
    setIsLoading(true)
    try {
      const orderResponse = await fetch('/api/checkout/criar-pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, shipping_cost_input: selectedShipping.price }),
      })
      const orderData = await orderResponse.json()
      if (!orderResponse.ok) throw new Error(orderData.error || 'Falha ao criar pedido')

      const preferenceResponse = await fetch('/api/payments/mp/preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderData.order_id }),
      })
      const preferenceData = await preferenceResponse.json()
      if (!preferenceResponse.ok) throw new Error(preferenceData.error || 'Falha ao criar preferência de pagamento')

      setPreferenceId(preferenceData.init_point.split('=').pop())
      setStep('payment')
    } catch (error) {
      toast({ title: 'Erro no Checkout', description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 'address':
        return <AddressStep onSubmit={handleAddressSubmit} />
      case 'shipping':
        return <ShippingStep address={shippingAddress!} options={shippingOptions} selected={selectedShipping} onSelect={setSelectedShipping} onConfirm={handleProceedToPayment} isLoading={isLoading} />
      case 'payment':
        return <PaymentStep preferenceId={preferenceId!} onSuccess={clearCart} />
      default:
        return <AddressStep onSubmit={handleAddressSubmit} />
    }
  }

  return (
    <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
      <div className="md:col-span-2">{renderStep()}</div>
      <div><CartSummary items={items} shipping={selectedShipping} /></div>
    </div>
  )
}

// --- Componentes dos Passos (Atualizados) ---

function AddressStep({ onSubmit }: { onSubmit: (data: AddressFormData) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<AddressFormData>({ resolver: zodResolver(addressSchema) })
  return (
    <Card>
      <CardHeader><CardTitle>1. Endereço de Entrega</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input {...register('cep')} placeholder="CEP (somente números)" />
          {errors.cep && <p className="text-red-500 text-sm">{errors.cep.message}</p>}
          <Input {...register('street')} placeholder="Rua" />
          {errors.street && <p className="text-red-500 text-sm">{errors.street.message}</p>}
          <div className="grid grid-cols-2 gap-4">
            <Input {...register('number')} placeholder="Número" />
            <Input {...register('complement')} placeholder="Complemento (opcional)" />
          </div>
          {errors.number && <p className="text-red-500 text-sm">{errors.number.message}</p>}
          <div className="grid grid-cols-2 gap-4">
            <Input {...register('city')} placeholder="Cidade" />
            <Input {...register('state')} placeholder="Estado" />
          </div>
          {errors.city && <p className="text-red-500 text-sm">{errors.city.message}</p>}
          {errors.state && <p className="text-red-500 text-sm">{errors.state.message}</p>}
          <Button type="submit" className="w-full">Calcular Frete</Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ShippingStep({ address, options, selected, onSelect, onConfirm, isLoading }: { address: AddressFormData, options: ShippingOption[], selected: ShippingOption | null, onSelect: (option: ShippingOption) => void, onConfirm: () => void, isLoading: boolean }) {
  return (
    <Card>
      <CardHeader><CardTitle>2. Opções de Frete</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border rounded-md">
          <p className="font-semibold">Entregar em:</p>
          <p>{address.street}, {address.number} - {address.city}, {address.state}</p>
        </div>
        {isLoading ? <p>Calculando frete...</p> : (
          <RadioGroup value={selected?.id} onValueChange={(id) => onSelect(options.find(o => o.id === id)!)}>
            {options.map(option => (
              <Label key={option.id} htmlFor={option.id} className="flex items-center justify-between p-4 border rounded-md cursor-pointer">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <div>
                    <p>{option.name}</p>
                    <p className="text-sm text-gray-500">Prazo: {option.delivery_time_days} dias úteis</p>
                  </div>
                </div>
                <p className="font-semibold">{option.price === 0 ? 'Grátis' : `R$ ${option.price.toFixed(2)}`}</p>
              </Label>
            ))}
          </RadioGroup>
        )}
        <Button onClick={onConfirm} disabled={isLoading || !selected} className="w-full">Continuar para o Pagamento</Button>
      </CardContent>
    </Card>
  )
}

function PaymentStep({ preferenceId, onSuccess }: { preferenceId: string, onSuccess: () => void }) {
  return (
    <Card>
      <CardHeader><CardTitle>3. Pagamento</CardTitle></CardHeader>
      <CardContent>
        <p className="text-center mb-4">Escolha sua forma de pagamento.</p>
        {preferenceId && <Payment initialization={{ preferenceId }} customization={{ visual: { style: { theme: 'flat' } } }} onSubmit={onSuccess} />}
      </CardContent>
    </Card>
  )
}

function CartSummary({ items, shipping }: { items: CartItem[], shipping: ShippingOption | null }) {
  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.price * item.quantity, 0), [items])
  const total = subtotal + (shipping?.price || 0)

  return (
    <Card>
      <CardHeader><CardTitle>Resumo do Pedido</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {items.map(item => (
          <div key={item.variant_id} className="flex justify-between items-center">
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
            </div>
            <p>R$ {(item.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
        <Separator />
        <div className="flex justify-between">
          <p>Subtotal</p>
          <p>R$ {subtotal.toFixed(2)}</p>
        </div>
        <div className="flex justify-between">
          <p>Frete</p>
          <p>{shipping ? `R$ ${shipping.price.toFixed(2)}` : 'A calcular'}</p>
        </div>
        <Separator />
        <div className="flex justify-between font-bold text-lg">
          <p>Total</p>
          <p>R$ {total.toFixed(2)}</p>
        </div>
      </CardContent>
    </Card>
  )
}
