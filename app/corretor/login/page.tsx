"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { autenticarCorretor } from "@/services/auth-corretores-simples"
import { Spinner } from "@/components/ui/spinner"

export default function CorretorLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro("")
    setLoading(true)

    try {
      console.log("Iniciando login para:", email)

      // Usar o módulo de autenticação simplificado
      const result = await autenticarCorretor({ email, senha })

      console.log("Resultado da autenticação:", result)

      if (result.success) {
        // Redirecionar com base no status do corretor
        if (result.corretor?.status === "aprovado") {
          router.push("/corretor/dashboard")
        } else {
          router.push("/corretor/aguardando-aprovacao")
        }
      } else {
        setErro(result.message)
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error)
      setErro("Ocorreu um erro ao fazer login. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#168979]">Área do Corretor</h1>
          <p className="text-gray-600 mt-2">Faça login para acessar sua conta</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {erro && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{erro}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#168979] focus:border-[#168979]"
                required
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#168979] focus:border-[#168979]"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <Link href="/corretor/recuperar-senha" className="text-sm text-[#168979] hover:underline">
                Esqueceu a senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#168979] text-white py-2 px-4 rounded-md hover:bg-[#13786a] focus:outline-none focus:ring-2 focus:ring-[#168979] focus:ring-opacity-50 transition-colors disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Spinner className="h-4 w-4 mr-2" />
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Ainda não tem uma conta?{" "}
              <Link href="/corretores" className="text-[#168979] hover:underline">
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
