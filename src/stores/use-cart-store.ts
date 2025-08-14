import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { toast } from '@/hooks/use-toast'

// TODO: Adicionar mais detalhes do produto se necessário (ex: slug, stock)
export interface CartItem {
  variant_id: number
  product_id: number
  name: string
  image_url: string | null
  price: number
  quantity: number
}

// TODO: Definir a interface do Cupom com base na tabela do DB
export interface Coupon {
  code: string
  type: 'percent' | 'fixed'
  value: number
}

interface CartState {
  items: CartItem[]
  coupon: Coupon | null
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (variant_id: number) => void
  updateItemQuantity: (variant_id: number, quantity: number) => void
  applyCoupon: (coupon: Coupon) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,

      addItem: (itemToAdd) => {
        const existingItem = get().items.find(
          (item) => item.variant_id === itemToAdd.variant_id
        )

        if (existingItem) {
          // Se o item já existe, apenas incrementa a quantidade
          set((state) => ({
            items: state.items.map((item) =>
              item.variant_id === itemToAdd.variant_id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          }))
          toast({ title: 'Adicionado ao carrinho', description: `+1 ${itemToAdd.name}` })
        } else {
          // Adiciona o novo item com quantidade 1
          set((state) => ({ items: [...state.items, { ...itemToAdd, quantity: 1 }] }))
          toast({ title: 'Adicionado ao carrinho', description: `${itemToAdd.name}` })
        }
      },

      removeItem: (variant_id) => {
        set((state) => ({
          items: state.items.filter((item) => item.variant_id !== variant_id),
        }))
        toast({ title: 'Item removido do carrinho' })
      },

      updateItemQuantity: (variant_id, quantity) => {
        if (quantity <= 0) {
          // Se a quantidade for 0 ou menos, remove o item
          get().removeItem(variant_id)
          return
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.variant_id === variant_id ? { ...item, quantity } : item
          ),
        }))
      },

      applyCoupon: (coupon) => set({ coupon }),

      clearCart: () => set({ items: [], coupon: null }),
    }),
    {
      name: 'cart-storage', // Chave para o localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
)
