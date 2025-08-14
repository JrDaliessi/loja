"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"

export function useUser() {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN") {
          setUser(session?.user || null)
        } else if (event === "SIGNED_OUT") {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  return { user, loading }
}
