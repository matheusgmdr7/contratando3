"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import PropostaWizard from "@/components/proposta-digital/proposta-wizard"
import { Spinner } from "@/components/ui/spinner"
import { Card } from "@/components/ui/card"
import { AlertCircle, User, Phone, Mail } from "lucide-react"

export default function PropostaCorretorPage() {
  const params = useParams()
  const corretorSlug = params.corretor as string

  const [corretor, setCorretor] = useState(null)
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState("")

  useEffect(() => {
    if (corretorSlug) {
      carregarDadosCorretor()
      carregarTemplates()
    }
  }, [corretorSlug])

  const carregarDadosCorretor = async () => {
    try {
      console.log("🔍 Buscando corretor com ID:", corretorSlug)
      setDebugInfo(`Buscando corretor: ${corretorSlug}`)

      // Buscar corretor apenas pelo ID (removendo filtros que podem estar causando problema)
      const { data, error } = await supabase.from("corretores").select("*").eq("id", corretorSlug).single()

      console.log("📊 Resultado da consulta:", { data, error })

      if (error) {
        console.error("❌ Erro ao buscar corretor:", error)

        // Se não encontrou por ID, vamos listar todos os corretores para debug
        const { data: todosCorretores, error: errorTodos } = await supabase
          .from("corretores")
          .select("id, nome, email, status")
          .limit(5)

        console.log("📋 Primeiros 5 corretores no banco:", todosCorretores)

        setError(`Corretor não encontrado. ID buscado: ${corretorSlug}`)
        setDebugInfo(`Erro: ${error.message}. Código: ${error.code}`)
        return
      }

      if (!data) {
        console.log("⚠️ Nenhum dado retornado")
        setError("Corretor não encontrado")
        setDebugInfo("Nenhum dado retornado da consulta")
        return
      }

      console.log("✅ Corretor encontrado:", data)

      // Verificar se o corretor está ativo (se a coluna existir)
      if (data.status && data.status !== "aprovado") {
        setError(`Corretor encontrado mas não está aprovado. Status: ${data.status}`)
        setDebugInfo(`Status do corretor: ${data.status}`)
        return
      }

      setCorretor(data)
      setDebugInfo(`Corretor carregado: ${data.nome}`)
    } catch (error) {
      console.error("💥 Erro geral ao carregar dados do corretor:", error)
      setError("Erro ao carregar dados do corretor")
      setDebugInfo(`Erro geral: ${error.message}`)
    }
  }

  const carregarTemplates = async () => {
    try {
      const { data, error } = await supabase.from("modelos_propostas").select("*").order("titulo")

      if (error) {
        console.error("Erro ao carregar templates:", error)
        toast.error("Erro ao carregar modelos de proposta")
        return
      }

      console.log("📄 Templates carregados:", data?.length || 0)
      setTemplates(data || [])
    } catch (error) {
      console.error("Erro ao carregar templates:", error)
      toast.error("Erro ao carregar modelos de proposta")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-gray-600">Carregando informações...</p>
          {debugInfo && <p className="mt-2 text-sm text-gray-500">{debugInfo}</p>}
        </div>
      </div>
    )
  }

  if (error || !corretor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">{error || "Corretor não encontrado"}</h1>
          <p className="text-gray-600 mb-4">
            O link que você acessou pode estar incorreto ou o corretor pode estar inativo.
          </p>

          {/* Informações de Debug */}
          <div className="bg-gray-100 p-3 rounded-lg mb-4 text-left">
            <p className="text-sm font-medium text-gray-700">Informações de Debug:</p>
            <p className="text-xs text-gray-600 mt-1">ID buscado: {corretorSlug}</p>
            <p className="text-xs text-gray-600">URL atual: {window.location.href}</p>
            {debugInfo && <p className="text-xs text-gray-600">Debug: {debugInfo}</p>}
          </div>

          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#168979] text-white px-4 py-2 rounded-lg hover:bg-[#13786a] transition-colors"
            >
              Tentar Novamente
            </button>
            <a
              href="/proposta-digital"
              className="block w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Fazer proposta sem corretor
            </a>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com informações do corretor */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
          <div className="flex flex-col items-center space-y-3 text-center md:flex-row md:items-start md:space-y-0 md:space-x-4 md:text-left">
            <div className="h-16 w-16 bg-[#168979] rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 sm:text-xl md:text-2xl break-words">
                Proposta Plano de Saúde
              </h1>
              <p className="text-sm text-gray-600 sm:text-base break-words">
                Corretor: <span className="font-medium">{corretor.nome}</span>
              </p>
              <div className="flex flex-col items-center space-y-1 mt-2 text-xs text-gray-500 sm:flex-row sm:space-y-0 sm:space-x-3 sm:text-sm md:items-start">
                {corretor.whatsapp && (
                  <div className="flex items-center">
                    <Phone className="h-3 w-3 mr-1 sm:h-4 sm:w-4" />
                    <span className="break-all">{corretor.whatsapp}</span>
                  </div>
                )}
                {corretor.email && (
                  <div className="flex items-center">
                    <Mail className="h-3 w-3 mr-1 sm:h-4 sm:w-4" />
                    <span className="break-all">{corretor.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="py-8">
        <PropostaWizard templates={templates} corretorPredefinido={corretor} />
      </div>
    </div>
  )
}
