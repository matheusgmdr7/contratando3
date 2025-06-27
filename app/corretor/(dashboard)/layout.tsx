"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FileText, Package, LogOut, Menu, X, DollarSign, FilePlus } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { verificarAutenticacao, logout } from "@/services/auth-corretores-simples"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { obterUrlAvatar } from "@/services/storage-service"

export default function CorretorDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [corretor, setCorretor] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    async function verificarAcesso() {
      try {
        console.log("Verificando autenticação do corretor...")

        // Verificar autenticação usando o módulo simplificado
        const { autenticado, corretor } = verificarAutenticacao()

        console.log("Resultado da verificação:", { autenticado, corretor })

        if (!autenticado || !corretor) {
          console.log("Corretor não autenticado, redirecionando para login")
          router.push("/corretor/login")
          return
        }

        // Verificar status atual do corretor no banco de dados
        const { data, error } = await supabase.from("corretores").select("*").eq("id", corretor.id).single()

        console.log("Dados atualizados do corretor:", { data, error })

        if (error || !data) {
          console.log("Erro ao buscar dados atualizados do corretor, redirecionando para login")
          logout()
          router.push("/corretor/login")
          return
        }

        // Verificar status do corretor
        if (data.status !== "aprovado") {
          console.log("Corretor não aprovado, redirecionando para aguardando aprovação")
          router.push("/corretor/aguardando-aprovacao")
          return
        }

        // Atualizar dados do corretor no localStorage
        localStorage.setItem(
          "corretorLogado",
          JSON.stringify({
            ...data,
            session: corretor.session,
          }),
        )

        setCorretor(data)
      } catch (error) {
        console.error("Erro ao verificar acesso:", error)
        logout()
        router.push("/corretor/login")
      } finally {
        setLoading(false)
      }
    }

    verificarAcesso()
  }, [router])

  useEffect(() => {
    async function carregarAvatar() {
      if (corretor?.id) {
        const url = await obterUrlAvatar(corretor.id)
        setAvatarUrl(url)
      }
    }

    if (corretor) {
      carregarAvatar()
    }
  }, [corretor])

  const handleLogout = () => {
    logout()
    router.push("/corretor/login")
  }

  const menuItems = [
    {
      href: "/corretor/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/corretor/propostas",
      label: "Propostas",
      icon: FileText,
    },
    {
      href: "/corretor/propostas/nova",
      label: "Nova Proposta",
      icon: FilePlus,
    },
    {
      href: "/corretor/comissoes",
      label: "Comissões",
      icon: DollarSign,
    },
    {
      href: "/corretor/produtos",
      label: "Produtos",
      icon: Package,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
        <span className="ml-2 text-gray-600">Verificando credenciais...</span>
      </div>
    )
  }

  if (!corretor) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="bg-[#168979] text-white p-2 md:p-3 flex items-center justify-between border-b border-[#13786a]/30 shadow-sm h-12 md:h-14">
        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-[#13786a] mr-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-1 md:gap-2">
            <img
              src="https://i.ibb.co/sdXM3bth/Post-Feed-e-Logo-6.png"
              alt="Logo Contratandoplanos"
              className="h-7 w-auto"
            />
            <h1 className="text-sm md:text-lg font-semibold tracking-tight">Corretor Digital</h1>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <span className="hidden md:inline text-xs md:text-sm font-medium">{corretor.nome}</span>
          <Button variant="ghost" size="sm" className="text-white hover:bg-[#13786a]" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" />
            <span className="hidden md:inline text-xs">Sair</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#168979] h-full w-64 p-3 overflow-y-auto shadow-lg animate-in slide-in-from-left">
              <div className="flex items-center justify-between mb-4 border-b border-[#13786a]/30 pb-3">
                <span className="text-base font-medium text-white">Menu</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white hover:bg-[#13786a]"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="px-3 py-2 flex items-center gap-2 text-sm text-blue-100 border-b border-[#13786a]/30 mb-3">
                <Avatar className="h-8 w-8 border border-[#13786a]/50">
                  <AvatarImage src={avatarUrl || ""} alt={corretor.nome || corretor.email} />
                  <AvatarFallback className="bg-[#13786a] text-white text-xs">
                    {corretor.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-white text-sm font-medium">{corretor.nome || "Corretor"}</span>
                  <span className="text-xs text-blue-100/80">{corretor.email}</span>
                </div>
              </div>

              <nav className="mt-2 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 relative",
                        isActive ? "bg-[#13786a] text-white" : "text-blue-100 hover:bg-[#13786a]/70 hover:text-white",
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {isActive && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-white rounded-full" />}
                      <Icon
                        className={cn(
                          "flex-shrink-0 h-4 w-4 mr-2",
                          isActive ? "text-white" : "text-blue-100 group-hover:text-white",
                        )}
                        aria-hidden="true"
                      />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              <div className="mt-auto pt-3 border-t border-[#13786a]/30 mt-4">
                <Button
                  variant="ghost"
                  className="w-full text-white hover:bg-[#13786a] justify-start text-sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-56 md:flex-col bg-[#168979] shadow-md">
          <div className="flex flex-col flex-grow pt-3 overflow-y-auto">
            <div className="px-3 py-2 flex items-center gap-2 text-sm text-blue-100 border-b border-[#13786a]/30 mx-2 mb-3">
              <Avatar className="h-8 w-8 border border-[#13786a]/50">
                <AvatarImage src={avatarUrl || ""} alt={corretor.nome || corretor.email} />
                <AvatarFallback className="bg-[#13786a] text-white text-xs">
                  {corretor.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-white text-sm font-medium">{corretor.nome || "Corretor"}</span>
                <span className="text-xs text-blue-100/80 truncate max-w-[160px] block" title={corretor.email}>
                  {corretor.email}
                </span>
              </div>
            </div>
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 relative",
                      isActive ? "bg-[#13786a] text-white" : "text-blue-100 hover:bg-[#13786a]/70 hover:text-white",
                    )}
                  >
                    {isActive && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-white rounded-full" />}
                    <Icon
                      className={cn(
                        "flex-shrink-0 h-4 w-4 mr-2",
                        isActive ? "text-white" : "text-blue-100 group-hover:text-white",
                      )}
                      aria-hidden="true"
                    />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="p-3 border-t border-[#13786a]/30 mx-2">
              <Button
                variant="ghost"
                className="w-full text-white hover:bg-[#13786a] justify-start text-sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-2 md:p-5 overflow-x-auto bg-gray-50">{children}</main>
      </div>
    </div>
  )
}
