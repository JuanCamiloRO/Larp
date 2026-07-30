import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase.auth.getSession()
      setUser(data?.session?.user ?? null)
      setLoading(false)
    }

    loadSession()

    const { subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    
    return () => {
      try {
        subscription?.unsubscribe()
      } catch (err) {
        console.error('Error unsubscribing from auth:', err)
      }
    }
  }, [])
  
  return { user, loading }
}