"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "member"
  avatar?: string
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include', // 🔥 ajoute ceci pour envoyer le cookie JWT
        })

        if (res.ok) {
          const data = await res.json()
          setUser(data)
        } else {
          setUser(null)
          router.push('/signin')
        }
      } catch (err) {
        console.error('Erreur de récupération du user:', err)
        setUser(null)
        router.push('/signin')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  return { user, loading }
}
