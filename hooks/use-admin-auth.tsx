"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { validarSenhaUsuarioAdmin, type UsuarioAdmin } from "@/services/usuarios-admin-service"

interface AdminAuthContextType {
  usuario: UsuarioAdmin | null
  loading: boolean
  login: (email: string, senha: string) => Promise<boolean>
  logout: () => void
  temPermissao: (modulo: string, acao: string) => boolean
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAdmin | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar se há usuário logado no localStorage
    const usuarioSalvo = localStorage.getItem("admin_usuario")
    if (usuarioSalvo) {
      try {
        setUsuario(JSON.parse(usuarioSalvo))
      } catch (error) {
        console.error("Erro ao recuperar usuário do localStorage:", error)
        localStorage.removeItem("admin_usuario")
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, senha: string): Promise<boolean> => {
    try {
      const usuarioValidado = await validarSenhaUsuarioAdmin(email, senha)
      if (usuarioValidado) {
        setUsuario(usuarioValidado)
        localStorage.setItem("admin_usuario", JSON.stringify(usuarioValidado))
        return true
      }
      return false
    } catch (error) {
      console.error("Erro no login:", error)
      return false
    }
  }

  const logout = () => {
    setUsuario(null)
    localStorage.removeItem("admin_usuario")
    router.push("/admin/login")
  }

  const temPermissao = (modulo: string, acao: string): boolean => {
    if (!usuario) return false

    // Master sempre tem acesso
    if (usuario.perfil === "master") return true

    // Verificar permissões específicas
    const permissoesModulo = usuario.permissoes?.[modulo]
    return permissoesModulo?.[acao] === true
  }

  return (
    <AdminAuthContext.Provider value={{ usuario, loading, login, logout, temPermissao }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error("useAdminAuth deve ser usado dentro de AdminAuthProvider")
  }
  return context
}
