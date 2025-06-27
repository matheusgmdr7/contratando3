"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { AlertCircle, CheckCircle, Database, FileText, Search } from "lucide-react"

interface CampoAnalise {
  nome: string
  tipo: string
  obrigatorio: boolean
  valorExemplo?: any
  status: "ok" | "vazio" | "erro"
  observacao?: string
}

interface PropostaAnalise {
  id: string
  cliente: string
  email_cliente: string
  created_at: string
  campos: CampoAnalise[]
  totalCampos: number
  camposVazios: number
  camposOk: number
}

export default function DiagnosticoCamposPropostasPage() {
  const [carregando, setCarregando] = useState(false)
  const [propostas, setPropostas] = useState<PropostaAnalise[]>([])
  const [estruturaTabela, setEstruturaTabela] = useState<any[]>([])
  const [estatisticas, setEstatisticas] = useState({
    totalPropostas: 0,
    camposMaisVazios: [] as { campo: string; count: number }[],
    ultimasPropostas: [] as any[],
  })

  const analisarEstrutura = async () => {
    setCarregando(true)
    try {
      console.log("🔍 Analisando estrutura da tabela propostas_corretores...")

      // Buscar estrutura da tabela
      const { data: estrutura, error: estruturaError } = await supabase.rpc("get_table_structure", {
        table_name: "propostas_corretores",
      })

      if (estruturaError) {
        console.log("Erro ao buscar estrutura, tentando método alternativo...")
        // Método alternativo: buscar uma proposta para ver os campos
        const { data: amostra } = await supabase.from("propostas_corretores").select("*").limit(1).single()

        if (amostra) {
          const campos = Object.keys(amostra).map((key) => ({
            column_name: key,
            data_type: typeof amostra[key],
            is_nullable: "YES",
          }))
          setEstruturaTabela(campos)
        }
      } else {
        setEstruturaTabela(estrutura || [])
      }

      // Buscar últimas 10 propostas para análise
      const { data: propostasData, error: propostasError } = await supabase
        .from("propostas_corretores")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)

      if (propostasError) {
        throw propostasError
      }

      console.log("📊 Propostas encontradas:", propostasData?.length || 0)

      // Analisar cada proposta
      const propostasAnalisadas: PropostaAnalise[] = []
      const camposVaziosPorCampo: { [key: string]: number } = {}

      for (const proposta of propostasData || []) {
        const campos: CampoAnalise[] = []
        let camposVazios = 0
        let camposOk = 0

        // Campos importantes para análise
        const camposImportantes = [
          "cliente",
          "email_cliente",
          "whatsapp_cliente",
          "cpf_cliente",
          "data_nascimento_cliente",
          "endereco_cliente",
          "cidade_cliente",
          "estado_cliente",
          "cep_cliente",
          "rg_cliente",
          "orgao_emissor_cliente",
          "cns_cliente",
          "nome_mae_cliente",
          "sexo_cliente",
          "produto",
          "produto_nome",
          "plano_nome",
          "valor_proposta",
          "cobertura",
          "acomodacao",
          "codigo_plano",
          "observacoes",
          "tem_dependentes",
          "quantidade_dependentes",
        ]

        for (const campo of camposImportantes) {
          const valor = proposta[campo]
          let status: "ok" | "vazio" | "erro" = "ok"
          let observacao = ""

          if (valor === null || valor === undefined || valor === "") {
            status = "vazio"
            camposVazios++
            camposVaziosPorCampo[campo] = (camposVaziosPorCampo[campo] || 0) + 1
            observacao = "Campo vazio ou nulo"
          } else {
            camposOk++
            if (typeof valor === "string" && valor.trim() === "") {
              status = "vazio"
              observacao = "String vazia"
            }
          }

          campos.push({
            nome: campo,
            tipo: typeof valor,
            obrigatorio: ["cliente", "email_cliente", "produto"].includes(campo),
            valorExemplo: valor,
            status,
            observacao,
          })
        }

        propostasAnalisadas.push({
          id: proposta.id,
          cliente: proposta.cliente || "Sem nome",
          email_cliente: proposta.email_cliente || "Sem email",
          created_at: proposta.created_at,
          campos,
          totalCampos: camposImportantes.length,
          camposVazios,
          camposOk,
        })
      }

      setPropostas(propostasAnalisadas)

      // Calcular estatísticas
      const camposMaisVazios = Object.entries(camposVaziosPorCampo)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([campo, count]) => ({ campo, count }))

      setEstatisticas({
        totalPropostas: propostasData?.length || 0,
        camposMaisVazios,
        ultimasPropostas: propostasData?.slice(0, 5) || [],
      })

      console.log("✅ Análise concluída!")
    } catch (error) {
      console.error("❌ Erro na análise:", error)
    } finally {
      setCarregando(false)
    }
  }

  const gerarRelatorioCorrecao = () => {
    console.log("📋 RELATÓRIO DE CORREÇÃO DE CAMPOS")
    console.log("=====================================")

    console.log("\n🔴 CAMPOS MAIS PROBLEMÁTICOS:")
    estatisticas.camposMaisVazios.forEach((item, index) => {
      console.log(`${index + 1}. ${item.campo}: ${item.count} propostas com campo vazio`)
    })

    console.log("\n📝 SUGESTÕES DE CORREÇÃO:")
    estatisticas.camposMaisVazios.forEach((item) => {
      const sugestoes = {
        cpf_cliente: "Verificar se o campo CPF está sendo mapeado corretamente do formulário",
        data_nascimento_cliente: "Confirmar formato de data (YYYY-MM-DD)",
        endereco_cliente: "Verificar se endereço completo está sendo montado",
        rg_cliente: "Campo RG pode estar sendo perdido no mapeamento",
        orgao_emissor_cliente: "Campo órgão emissor pode não estar sendo salvo",
        cns_cliente: "CNS pode estar opcional mas deveria ser obrigatório",
        nome_mae_cliente: "Nome da mãe pode estar sendo perdido",
        sexo_cliente: "Campo sexo pode ter problema de enum/select",
        cobertura: "Verificar valores padrão para cobertura",
        acomodacao: "Verificar valores padrão para acomodação",
        codigo_plano: "Sigla do plano pode não estar sendo mapeada",
      }

      if (sugestoes[item.campo as keyof typeof sugestoes]) {
        console.log(`- ${item.campo}: ${sugestoes[item.campo as keyof typeof sugestoes]}`)
      }
    })

    console.log("\n🔧 CÓDIGO DE CORREÇÃO SUGERIDO:")
    console.log(`
// No arquivo app/corretor/(dashboard)/propostas/nova/page.tsx
// Verificar se estes campos estão sendo mapeados corretamente:

const dadosProposta = {
  // ... outros campos ...
  
  // CAMPOS QUE PODEM ESTAR SENDO PERDIDOS:
  cpf_cliente: data.cpf,                    // ✅ Verificar
  data_nascimento_cliente: data.data_nascimento, // ✅ Verificar
  rg_cliente: data.rg,                      // ✅ Verificar
  orgao_emissor_cliente: data.orgao_emissor, // ✅ Verificar
  cns_cliente: data.cns,                    // ✅ Verificar
  nome_mae_cliente: data.nome_mae,          // ✅ Verificar
  sexo_cliente: data.sexo,                  // ✅ Verificar
  cobertura: data.cobertura,                // ✅ Verificar
  acomodacao: data.acomodacao,              // ✅ Verificar
  codigo_plano: data.sigla_plano,           // ✅ Verificar (sigla_plano -> codigo_plano)
}
`)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Diagnóstico de Campos - Propostas</h1>
        <p className="text-muted-foreground">Análise detalhada dos campos salvos na tabela propostas_corretores</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Análise de Campos
            </CardTitle>
            <CardDescription>Verificar quais campos estão sendo salvos corretamente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={analisarEstrutura} disabled={carregando} className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                {carregando ? "Analisando..." : "Analisar Campos"}
              </Button>
              {propostas.length > 0 && (
                <Button variant="outline" onClick={gerarRelatorioCorrecao}>
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {estatisticas.totalPropostas > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Propostas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.totalPropostas}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Campos Problemáticos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{estatisticas.camposMaisVazios.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Estrutura da Tabela</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estruturaTabela.length} campos</div>
              </CardContent>
            </Card>
          </div>
        )}

        {propostas.length > 0 && (
          <Tabs defaultValue="problemas" className="w-full">
            <TabsList>
              <TabsTrigger value="problemas">Campos Problemáticos</TabsTrigger>
              <TabsTrigger value="propostas">Análise por Proposta</TabsTrigger>
              <TabsTrigger value="estrutura">Estrutura da Tabela</TabsTrigger>
            </TabsList>

            <TabsContent value="problemas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Campos com Mais Problemas</CardTitle>
                  <CardDescription>Campos que estão vazios com mais frequência</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {estatisticas.camposMaisVazios.map((item, index) => (
                      <div key={item.campo} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="destructive">{index + 1}</Badge>
                          <span className="font-medium">{item.campo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.count} vazios</Badge>
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="propostas" className="space-y-4">
              {propostas.map((proposta) => (
                <Card key={proposta.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {proposta.cliente} - {proposta.email_cliente}
                    </CardTitle>
                    <CardDescription>
                      ID: {proposta.id} | Criada em: {new Date(proposta.created_at).toLocaleString()}
                    </CardDescription>
                    <div className="flex gap-2">
                      <Badge variant="outline">{proposta.camposOk} campos OK</Badge>
                      <Badge variant="destructive">{proposta.camposVazios} campos vazios</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {proposta.campos.map((campo) => (
                        <div
                          key={campo.nome}
                          className={`p-3 border rounded-lg ${
                            campo.status === "vazio" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{campo.nome}</span>
                            {campo.status === "vazio" ? (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Tipo: {campo.tipo} | {campo.obrigatorio ? "Obrigatório" : "Opcional"}
                          </div>
                          {campo.valorExemplo && (
                            <div className="text-xs mt-1 p-1 bg-white rounded border">
                              {String(campo.valorExemplo).substring(0, 50)}
                              {String(campo.valorExemplo).length > 50 ? "..." : ""}
                            </div>
                          )}
                          {campo.observacao && <div className="text-xs text-red-600 mt-1">{campo.observacao}</div>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="estrutura" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estrutura da Tabela propostas_corretores</CardTitle>
                  <CardDescription>Campos disponíveis na tabela</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {estruturaTabela.map((campo) => (
                      <div key={campo.column_name} className="p-3 border rounded-lg">
                        <div className="font-medium">{campo.column_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {campo.data_type} | {campo.is_nullable === "YES" ? "Opcional" : "Obrigatório"}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {propostas.length === 0 && !carregando && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Clique em "Analisar Campos" para verificar os dados salvos na tabela propostas_corretores.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
