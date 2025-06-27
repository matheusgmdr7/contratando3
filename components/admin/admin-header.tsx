"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-auth"
import Link from "next/link"
import { Settings, User, LogOut } from "lucide-react"
import { signOutAdmin } from "@/lib/supabase-auth"
import { Button } from "@/components/ui/button"

export default function AdminHeader() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function getUserInfo() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/admin/login")
        return
      }
      setUserEmail(session.user.email || null)

      // Extrair nome do email (parte antes do @)
      if (session.user.email) {
        const namePart = session.user.email.split("@")[0]
        // Capitalizar primeira letra de cada palavra
        const formattedName = namePart
          .split(".")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
        setUserName(formattedName)
      }
    }
    getUserInfo()
  }, [router])

  const handleLogout = async () => {
    try {
      await signOutAdmin()
      router.push("/admin/login")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 md:py-4 md:px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center">
        <Link href="/admin" className="text-xl font-bold text-[#168979] block md:hidden">
          CP Admin
        </Link>
        <Link href="/admin" className="text-xl font-bold text-[#168979] hidden md:block">
          Contratandoplanos <span className="text-gray-500 font-normal">Admin</span>
        </Link>
      </div>

      <div className="flex-1 max-w-xl mx-4 hidden md:block">
        <div className="relative"></div>
      </div>

      {/* Desktop menu */}
      <div className="hidden md:flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-gray-100" onClick={handleLogout}>
          <LogOut className="h-5 w-5 text-gray-500" />
        </button>

        <button className="p-2 rounded-full hover:bg-gray-100">
          <Settings className="h-5 w-5 text-gray-500" />
        </button>

        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-[#168979] text-white flex items-center justify-center mr-2">
            <User className="h-4 w-4" />
          </div>
          <div>
            {userName && <p className="text-sm font-medium">{userName}</p>}
            {userEmail && <p className="text-xs text-gray-500">{userEmail}</p>}
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden flex items-center">
        <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => setShowMobileMenu(!showMobileMenu)}>
          <User className="h-5 w-5 text-gray-600" />
        </Button>
      </div>

      {/* Mobile dropdown menu */}
      {showMobileMenu && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200 md:hidden">
          <div className="px-4 py-2 border-b border-gray-100">
            {userName && <p className="text-sm font-medium">{userName}</p>}
            {userEmail && <p className="text-xs text-gray-500 truncate">{userEmail}</p>}
          </div>
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            onClick={() => router.push("/admin/perfil")}
          >
            <Settings className="h-4 w-4 mr-2 text-gray-500" />
            Configurações
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2 text-red-500" />
            Sair
          </button>
        </div>
      )}
    </header>
  )
}
