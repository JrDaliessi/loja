'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCartStore, CartItem } from '@/stores/use-cart-store'
import { useRouter } from 'next/navigation'

import { initMercadoPago, Payment } from '@mercadopago/sdk-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

// Chave pública do Mercado Pago (deve estar no .env.local)
const mpPublicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY
if (mpPublicKey) {
  initMercadoPago(mpPublicKey)
} else {
  console.warn('Mercado Pago public key is not set.')
}

// --- Zod Schemas ---
const addressSchema = z.object({
  cep: z.string().min(8, 'CEP inválido'),
  street: z.string().min(3, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  city: z.string().min(3, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
})

type AddressFormData = z.infer<typeof addressSchema>

// --- Componente Principal ---
export default function CheckoutPage() {
  const [step, setStep] = useState('address')
  const [shippingAddress, setShippingAddress] = useState<AddressFormData | null>(null)
  const [preferenceId, setPreferenceId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { items, clearCart } = useCartStore()
  const { toast } = useToast()
  const router = useRouter()

  const handleAddressSubmit = (data: AddressFormData) => {
    setShippingAddress(data)
    setStep('shipping')
  }

  const handleShippingSubmit = async () => {
    setIsLoading(true)
    try {
      // 1. Criar o pedido no nosso backend
      const orderResponse = await fetch('/api/checkout/criar-pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const orderData = await orderResponse.json()

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Falha ao criar pedido')
      }

      const { order_id } = orderData

      // 2. Criar a preferência de pagamento no Mercado Pago
      const preferenceResponse = await fetch('/api/payments/mp/preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id }),
      })
      const preferenceData = await preferenceResponse.json()

      if (!preferenceResponse.ok) {
        throw new Error(preferenceData.error || 'Falha ao criar preferência de pagamento')
      }

      setPreferenceId(preferenceData.init_point.split('=').pop()) // Extrai o ID do init_point
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
        return <ShippingStep address={shippingAddress!} onConfirm={handleShippingSubmit} isLoading={isLoading} />
      case 'payment':
        return <PaymentStep preferenceId={preferenceId!} onSuccess={() => clearCart()} />
      default:
        return <AddressStep onSubmit={handleAddressSubmit} />
    }
  }

  return (
    <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
      <div className="md:col-span-2">{renderStep()}</div>
      <div>
        <CartSummary items={items} />
      </div>
    </div>
  )
}

// --- Componentes dos Passos ---

function AddressStep({ onSubmit }: { onSubmit: (data: AddressFormData) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<AddressFormData>({ resolver: zodResolver(addressSchema) })

  return (
    <Card>
      <CardHeader><CardTitle>1. Endereço de Entrega</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input {...register('cep')} placeholder="CEP" />
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
          <Button type="submit" className="w-full">Continuar para o Frete</Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ShippingStep({ address, onConfirm, isLoading }: { address: AddressFormData, onConfirm: () => void, isLoading: boolean }) {
  return (
    <Card>
      <CardHeader><CardTitle>2. Frete e Confirmação</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border rounded-md">
          <p className="font-semibold">Entregar em:</p>
          <p>{address.street}, {address.number} - {address.city}, {address.state}</p>
        </div>
        <div className="p-4 border rounded-md">
          <p className="font-semibold">Opção de Frete</p>
          <p>SEDEX - R$ 10,00 (valor fixo por enquanto)</p>
        </div>
        <Button onClick={onConfirm} disabled={isLoading} className="w-full">
          {isLoading ? 'Processando...' : 'Continuar para o Pagamento'}
        </Button>
      </CardContent>
    </Card>
  )
}

function PaymentStep({ preferenceId, onSuccess }: { preferenceId: string, onSuccess: () => void }) {
  const router = useRouter()
  return (
    <Card>
      <CardHeader><CardTitle>3. Pagamento</CardTitle></CardHeader>
      <CardContent>
        <p className="text-center mb-4">Escolha sua forma de pagamento.</p>
        {preferenceId && (
          <Payment
            initialization={{ preferenceId }}
            customization={{ 
              visual: { 
                style: { theme: 'flat' } 
              },
              paymentMethods: { 
                creditCard: 'all',
                debitCard: 'all',
                ticket: 'all',
                pix: 'all'
              } 
            }}
            onSubmit={async (param) => {
              // Este callback é chamado após o pagamento ser processado
              // A notificação do webhook é a fonte da verdade, mas podemos redirecionar aqui
              console.log('Payment submitted:', param)
            }}
            onReady={() => console.log('Payment component is ready')}
            onError={(error) => console.error('Payment component error:', error)}
          />
        )}
      </CardContent>
    </Card>
  )
}

function CartSummary({ items }: { items: CartItem[] }) {
  const total = useMemo(() => items.reduce((acc, item) => acc + item.price * item.quantity, 0), [items])

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
        <div className="flex justify-between font-bold text-lg">
          <p>Total</p>
          <p>R$ {total.toFixed(2)}</p>
        </div>
      </CardContent>
    </Card>
  )
}
