"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { User } from "@supabase/supabase-js"
import { ChevronDown, LogOut, Menu } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<User | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Buscar a URL do avatar
        try {
          const { data } = await supabase.storage.from("avatars").getPublicUrl(user.id)

          setAvatarUrl(data.publicUrl)
        } catch (error) {
          console.error("Erro ao buscar avatar:", error)
        }
      }
    }
    getUser()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // Obter as iniciais do email para o fallback do avatar
  const getInitials = (email: string | undefined) => {
    if (!email) return "U"
    return email.charAt(0).toUpperCase()
  }

  return (
    <div className="border-b">
      {/* Adicionar a foto do corretor acima do menu */}
      <div className="flex justify-center py-4 border-b">
        <div className="flex flex-col items-center">
          <Avatar className="h-20 w-20 mb-2">
            <AvatarImage src={avatarUrl || ""} alt={user?.email || "Avatar do usuário"} />
            <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{user?.email}</span>
        </div>
      </div>

      {/* Menu original */}
      <div className="flex h-16 items-center px-4 container mx-auto">
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMenu}>
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        <Link href="/corretor/dashboard" className="font-bold text-xl mr-6">
          Corretor Digital
        </Link>
        <nav
          className={`${isMenuOpen ? "block absolute top-16 left-0 right-0 bg-white z-50 border-b pb-4" : "hidden"} md:block md:flex md:items-center md:space-x-4 md:lg:space-x-6`}
        >
          <Link
            href="/corretor/dashboard"
            className={`text-sm font-medium transition-colors hover:text-primary ${pathname === "/corretor/dashboard" ? "text-primary" : "text-muted-foreground"} block px-4 py-2 md:px-0 md:py-0`}
          >
            Dashboard
          </Link>
          <Link
            href="/corretor/propostas"
            className={`text-sm font-medium transition-colors hover:text-primary ${pathname === "/corretor/propostas" ? "text-primary" : "text-muted-foreground"} block px-4 py-2 md:px-0 md:py-0`}
          >
            Propostas
          </Link>
          <Link
            href="/corretor/clientes"
            className={`text-sm font-medium transition-colors hover:text-primary ${pathname === "/corretor/clientes" ? "text-primary" : "text-muted-foreground"} block px-4 py-2 md:px-0 md:py-0`}
          >
            Clientes
          </Link>
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1">
                {user?.email}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
