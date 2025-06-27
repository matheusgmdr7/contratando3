"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-auth"
import { toast } from "sonner"

export function SessionMonitor() {
  const router = useRouter()
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    // Verificar a sessão inicial
    const checkInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSessionChecked(true)

      if (!session && window.location.pathname.startsWith("/admin") && window.location.pathname !== "/admin/login") {
        router.push("/admin/login")
      }
    }

    checkInitialSession()

    // Configurar o listener de mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session ? "Session exists" : "No session")

      if (event === "SIGNED_OUT" || event === "USER_DELETED") {
        // Se o usuário foi desconectado e não está na página de login
        if (window.location.pathname.startsWith("/admin") && window.location.pathname !== "/admin/login") {
          toast.error("Sua sessão expirou. Por favor, faça login novamente.")
          router.push("/admin/login")
        }
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Se o usuário acabou de fazer login ou teve o token atualizado
        if (window.location.pathname === "/admin/login") {
          router.push("/admin")
        }
      }
    })

    // Limpar o listener quando o componente for desmontado
    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return null // Este componente não renderiza nada visualmente
}
