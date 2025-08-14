"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"

export function useUser() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error: getUserError } = await supabase.auth.getUser()
        if (getUserError) throw getUserError
        setUser(user)
      } catch (err) {
        console.error("Erro ao buscar usuário", err)
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    let authListener: { subscription: { unsubscribe: () => void } } | null = null
    try {
      const { data: listener, error: authListenerError } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === "SIGNED_IN") {
            setUser(session?.user || null)
          } else if (event === "SIGNED_OUT") {
            setUser(null)
          }
          setLoading(false)
        }
      )
      if (authListenerError) throw authListenerError
      authListener = listener
    } catch (err) {
      console.error("Erro ao observar mudanças de autenticação", err)
      setError((err as Error).message)
      setLoading(false)
    }

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [supabase])

  return { user, loading, error }
}
