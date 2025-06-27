"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import { Search, Database, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface PropostaInfo {
  id: string
  tabela: string
  nome?: string
  nome_cliente?: string
  cpf?: string
  cpf_cliente?: string
  email?: string
  email_cliente?: string
  status: string
  created_at: string
  dependentes_count?: number
  questionario_count?: number
}

export default function VerificarIdsPropostasPage() {
  const [propostaId, setPropostaId] = useState("54e76c27-a2c0-46b3-b223-5dc43a264aed")
  const [loading, setLoading] = useState(false)
  const [resultados, setResultados] = useState<PropostaInfo[]>([])
  const [estatisticas, setEstatisticas] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const verificarProposta = async () => {
    if (!propostaId.trim()) {
      toast.error("Digite um ID de proposta")
      return
    }

    try {
      setLoading(true)
      setError(null)
      setResultados([])

      console.log("🔍 Verificando proposta:", propostaId)

      const resultadosEncontrados: PropostaInfo[] = []

      // 1. Buscar na tabela 'propostas'
      console.log("🔍 Buscando em 'propostas'...")
      const { data: proposta, error: propostaError } = await supabase
        .from("propostas")
        .select("*")
        .eq("id", propostaId)
        .single()

      if (proposta && !propostaError) {
        console.log("✅ Encontrado em 'propostas'")

        // Contar dependentes
        const { data: dependentes, error: depError } = await supabase
          .from("dependentes")
          .select("id")
          .eq("proposta_id", propostaId)

        // Contar questionário
        const { data: questionario, error: questError } = await supabase
          .from("questionario_saude")
          .select("id")
          .eq("proposta_id", propostaId)

        resultadosEncontrados.push({
          ...proposta,
          tabela: "propostas",
          dependentes_count: dependentes?.length || 0,
          questionario_count: questionario?.length || 0,
        })
      } else {
        console.log("❌ Não encontrado em 'propostas':", propostaError?.message)
      }

      // 2. Buscar na tabela 'propostas_corretores'
      console.log("🔍 Buscando em 'propostas_corretores'...")
      const { data: propostaCorretor, error: propostaCorretorError } = await supabase
        .from("propostas_corretores")
        .select("*")
        .eq("id", propostaId)
        .single()

      if (propostaCorretor && !propostaCorretorError) {
        console.log("✅ Encontrado em 'propostas_corretores'")

        // Contar dependentes
        const { data: dependentes, error: depError } = await supabase
          .from("dependentes")
          .select("id")
          .eq("proposta_id", propostaId)

        // Contar questionário
        const { data: questionario, error: questError } = await supabase
          .from("questionario_saude")
          .select("id")
          .eq("proposta_id", propostaId)

        resultadosEncontrados.push({
          ...propostaCorretor,
          tabela: "propostas_corretores",
          dependentes_count: dependentes?.length || 0,
          questionario_count: questionario?.length || 0,
        })
      } else {
        console.log("❌ Não encontrado em 'propostas_corretores':", propostaCorretorError?.message)
      }

      // 3. Buscar estatísticas gerais
      const { data: statsPropostas } = await supabase.from("propostas").select("id", { count: "exact" })

      const { data: statsPropostasCorretores } = await supabase
        .from("propostas_corretores")
        .select("id", { count: "exact" })

      setEstatisticas({
        total_propostas: statsPropostas?.length || 0,
        total_propostas_corretores: statsPropostasCorretores?.length || 0,
      })

      setResultados(resultadosEncontrados)

      if (resultadosEncontrados.length === 0) {
        setError("Proposta não encontrada em nenhuma tabela")
        toast.error("Proposta não encontrada")
      } else {
        toast.success(`Proposta encontrada em ${resultadosEncontrados.length} tabela(s)`)
      }
    } catch (error) {
      console.error("❌ Erro ao verificar proposta:", error)
      setError("Erro ao verificar proposta: " + error.message)
      toast.error("Erro ao verificar proposta")
    } finally {
      setLoading(false)
    }
  }

  const testarConexao = async () => {
    try {
      setLoading(true)
      console.log("🔍 Testando conexão...")

      const { data, error } = await supabase.from("propostas").select("id").limit(1)

      if (error) {
        setError("Erro de conexão: " + error.message)
        toast.error("Erro de conexão")
      } else {
        toast.success("Conexão OK")
        setError(null)
      }
    } catch (error) {
      setError("Erro inesperado: " + error.message)
      toast.error("Erro inesperado")
    } finally {
      setLoading(false)
    }
  }

  const abrirProposta = (id: string) => {
    const url = `/proposta-digital/completar/${id}`
    window.open(url, "_blank")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Verificar IDs de Propostas</h1>
        <p className="text-gray-600">
          Ferramenta para verificar se um ID de proposta existe nas tabelas do banco de dados
        </p>
      </div>

      {/* Formulário de Busca */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Proposta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proposta-id">ID da Proposta</Label>
            <Input
              id="proposta-id"
              value={propostaId}
              onChange={(e) => setPropostaId(e.target.value)}
              placeholder="Digite o ID da proposta (UUID)"
              className="font-mono"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={verificarProposta} disabled={loading} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              {loading ? "Verificando..." : "Verificar Proposta"}
            </Button>

            <Button
              onClick={testarConexao}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              <Database className="h-4 w-4" />
              Testar Conexão
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {estatisticas && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Estatísticas do Banco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{estatisticas.total_propostas}</p>
                <p className="text-sm text-gray-600">Propostas Diretas</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{estatisticas.total_propostas_corretores}</p>
                <p className="text-sm text-gray-600">Propostas de Corretores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Erro */}
      {error && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Resultados */}
      {resultados.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Resultados Encontrados</h2>

          {resultados.map((resultado, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Encontrado em: {resultado.tabela}
                  </div>
                  <Badge variant={resultado.tabela === "propostas" ? "default" : "secondary"}>
                    {resultado.tabela === "propostas" ? "Direta" : "Corretor"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">ID</Label>
                    <p className="font-mono text-sm">{resultado.id}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nome</Label>
                    <p className="font-semibold">{resultado.nome || resultado.nome_cliente || "Não informado"}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">CPF</Label>
                    <p>{resultado.cpf || resultado.cpf_cliente || "Não informado"}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p>{resultado.email || resultado.email_cliente || "Não informado"}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge variant="outline">{resultado.status}</Badge>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Criado em</Label>
                    <p>{new Date(resultado.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold">{resultado.dependentes_count || 0}</p>
                    <p className="text-sm text-gray-600">Dependentes</p>
                  </div>

                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold">{resultado.questionario_count || 0}</p>
                    <p className="text-sm text-gray-600">Questionários</p>
                  </div>

                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Button onClick={() => abrirProposta(resultado.id)} size="sm" className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Abrir Proposta
                    </Button>
                  </div>
                </div>

                {/* Dados Completos (JSON) */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
                    Ver dados completos (JSON)
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(resultado, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Instruções */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Como usar esta ferramenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• Digite o ID da proposta no campo acima</p>
          <p>• Clique em "Verificar Proposta" para buscar nas duas tabelas</p>
          <p>• Use "Testar Conexão" se houver problemas de conectividade</p>
          <p>• Clique em "Abrir Proposta" para testar o fluxo completo</p>
          <p>• Os dados completos estão disponíveis em formato JSON</p>
        </CardContent>
      </Card>
    </div>
  )
}
