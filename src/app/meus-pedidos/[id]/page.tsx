'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase.types'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// Definindo tipos para o pedido e itens
type Order = Database['public']['Tables']['orders']['Row']
type OrderItem = Database['public']['Tables']['order_items']['Row']
type OrderDetails = Order & { order_items: OrderItem[] }

export default function OrderConfirmationPage() {
  const params = useParams()
  const { id } = params
  const supabase = createClient()

  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return

      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', id as string)
          .single()

        if (error) {
          throw new Error('Pedido não encontrado ou você não tem permissão para vê-lo.')
        }
        setOrder(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocorreu um erro.')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id, supabase])

  if (loading) {
    return <div className="container mx-auto py-8 text-center">Carregando detalhes do pedido...</div>
  }

  if (error) {
    return <div className="container mx-auto py-8 text-center text-red-500">{error}</div>
  }

  if (!order) {
    return <div className="container mx-auto py-8 text-center">Pedido não encontrado.</div>
  }

  const total = order.order_items.reduce((acc, item) => acc + Number(item.unit_price) * item.quantity, 0)

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-green-600">Pedido Realizado com Sucesso!</CardTitle>
          <p className="text-gray-500">Obrigado pela sua compra.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Resumo do Pedido</h3>
            <div className="p-4 border rounded-md space-y-2">
              <div className="flex justify-between">
                <span>ID do Pedido:</span>
                <span className="font-mono text-sm">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Status do Pagamento:</span>
                <span className="font-semibold capitalize">{order.payment_status || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Status do Pedido:</span>
                <span className="font-semibold capitalize">{order.status}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Itens Comprados</h3>
            <div className="border rounded-md">
              {order.order_items.map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 border-b last:border-b-0">
                  <div>
                    <p className="font-semibold">{item.name_snapshot}</p>
                    <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                  </div>
                  <p>R$ {(Number(item.unit_price) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-right">
             <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Frete:</span>
                <span>R$ {Number(order.shipping_cost).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Desconto:</span>
                <span className="text-green-600">- R$ {Number(order.total_discount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total Pago:</span>
                <span>R$ {Number(order.total_paid).toFixed(2)}</span>
              </div>
          </div>

          <div className="text-center pt-4">
            <Link href="/meus-pedidos">
              <Button variant="outline">Ver todos os meus pedidos</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
