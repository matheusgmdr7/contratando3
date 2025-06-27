"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle, FileText, Users, Info, Heart } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface Proposta {
  id: string
  nome_titular: string
  email_titular: string
  telefone_titular: string
  cpf_titular: string
  data_nascimento_titular: string
  endereco_titular: string
  cep_titular: string
  cidade_titular: string
  estado_titular: string
  plano_escolhido: string
  valor_total: number
  quantidade_dependentes: number
  dependentes_dados: any[]
  observacoes?: string
  caracteristicas_plano?: string
  observacao?: string
  produto_descricao?: string
  status: string
  created_at: string
  assinado_em?: string
  assinatura_imagem?: string
  assinatura?: string
  questionario_completo?: boolean
  ip_assinatura?: string
  user_agent?: string
  status_assinatura?: string
}

interface DependenteQuestionario {
  dependente_id: string
  dependente_nome: string
  pessoa_tipo: "titular" | "dependente"
  respostas: Record<string, any>
}

export default function CompletarPropostaPage() {
  const params = useParams()
  const router = useRouter()
  const propostaId = params.id as string

  const [proposta, setProposta] = useState<Proposta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFinalizando, setIsFinalizando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Função para obter características do plano com prioridade
  const obterCaracteristicasPlano = (proposta: Proposta): string => {
    console.log("🔍 Obtendo características do plano para proposta:", proposta.id)

    // Prioridade: produto_descricao > observacoes > caracteristicas_plano > observacao
    if (proposta.produto_descricao && proposta.produto_descricao.trim()) {
      console.log("✅ Usando produto_descricao:", proposta.produto_descricao)
      return proposta.produto_descricao.trim()
    }

    if (proposta.observacoes && proposta.observacoes.trim()) {
      console.log("✅ Usando observacoes:", proposta.observacoes)
      return proposta.observacoes.trim()
    }

    if (proposta.caracteristicas_plano && proposta.caracteristicas_plano.trim()) {
      console.log("✅ Usando caracteristicas_plano:", proposta.caracteristicas_plano)
      return proposta.caracteristicas_plano.trim()
    }

    if (proposta.observacao && proposta.observacao.trim()) {
      console.log("✅ Usando observacao:", proposta.observacao)
      return proposta.observacao.trim()
    }

    console.log("⚠️ Nenhuma característica encontrada")
    return "Informações não disponíveis"
  }

  // Carregar dados da proposta
  const carregarProposta = async () => {
    try {
      console.log("🔍 Carregando proposta:", propostaId)
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("propostas")
        .select(`
          id,
          nome_titular,
          email_titular,
          telefone_titular,
          cpf_titular,
          data_nascimento_titular,
          endereco_titular,
          cep_titular,
          cidade_titular,
          estado_titular,
          plano_escolhido,
          valor_total,
          quantidade_dependentes,
          dependentes_dados,
          observacoes,
          caracteristicas_plano,
          observacao,
          produto_descricao,
          status,
          created_at,
          assinado_em,
          assinatura_imagem,
          assinatura,
          questionario_completo,
          ip_assinatura,
          user_agent,
          status_assinatura
        `)
        .eq("id", propostaId)
        .single()

      if (error) {
        console.error("❌ Erro ao carregar proposta:", error)
        throw new Error(`Erro ao carregar proposta: ${error.message}`)
      }

      if (!data) {
        throw new Error("Proposta não encontrada")
      }

      console.log("✅ Proposta carregada:", data)
      setProposta(data)
    } catch (error) {
      console.error("❌ Erro ao carregar proposta:", error)
      setError(error.message || "Erro desconhecido")
    } finally {
      setIsLoading(false)
    }
  }

  // Finalizar proposta
  const finalizarProposta = async () => {
    if (!proposta) return

    try {
      console.log("🚀 Iniciando finalização da proposta:", proposta.id)
      setIsFinalizando(true)

      // Obter informações do navegador
      const userAgent = navigator.userAgent
      const ipAddress = await fetch("https://api.ipify.org?format=json")
        .then((res) => res.json())
        .then((data) => data.ip)
        .catch(() => "Não disponível")

      console.log("📝 Dados de assinatura:", { userAgent, ipAddress })

      // Simular questionário de saúde (em produção, isso viria de um formulário)
      const questionarioSaude: DependenteQuestionario[] = []

      // Adicionar questionário do titular
      questionarioSaude.push({
        dependente_id: "titular",
        dependente_nome: proposta.nome_titular,
        pessoa_tipo: "titular",
        respostas: {
          possui_doenca_cronica: false,
          faz_uso_medicamentos: false,
          teve_cirurgia_recente: false,
          possui_alergia: false,
          pratica_esportes_radicais: false,
          observacoes_saude: "",
        },
      })

      // Adicionar questionário dos dependentes
      if (proposta.dependentes_dados && Array.isArray(proposta.dependentes_dados)) {
        proposta.dependentes_dados.forEach((dependente, index) => {
          questionarioSaude.push({
            dependente_id: `dependente_${index + 1}`,
            dependente_nome: dependente.nome || `Dependente ${index + 1}`,
            pessoa_tipo: "dependente",
            respostas: {
              possui_doenca_cronica: false,
              faz_uso_medicamentos: false,
              teve_cirurgia_recente: false,
              possui_alergia: false,
              pratica_esportes_radicais: false,
              observacoes_saude: "",
            },
          })
        })
      }

      console.log("📋 Questionário de saúde preparado:", questionarioSaude)

      // Salvar questionário de saúde
      for (const questionario of questionarioSaude) {
        try {
          const { error: questionarioError } = await supabase.from("questionario_saude").insert({
            proposta_id: proposta.id,
            dependente_id: questionario.dependente_id,
            pessoa_tipo: questionario.pessoa_tipo,
            dependente_nome: questionario.dependente_nome,
            respostas: questionario.respostas,
            created_at: new Date().toISOString(),
          })

          if (questionarioError) {
            console.error("❌ Erro ao salvar questionário:", questionarioError)
            throw new Error(
              `Erro ao salvar questionário de ${questionario.dependente_nome}: ${questionarioError.message}`,
            )
          }

          console.log(`✅ Questionário salvo para ${questionario.dependente_nome}`)
        } catch (error) {
          console.error(`❌ Erro ao processar questionário de ${questionario.dependente_nome}:`, error)
          throw error
        }
      }

      // Atualizar status da proposta
      const { error: updateError } = await supabase
        .from("propostas")
        .update({
          status: "finalizada",
          status_assinatura: "assinada",
          assinado_em: new Date().toISOString(),
          assinatura: `Assinatura digital realizada em ${new Date().toLocaleString("pt-BR")}`,
          questionario_completo: true,
          ip_assinatura: ipAddress,
          user_agent: userAgent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposta.id)

      if (updateError) {
        console.error("❌ Erro ao atualizar proposta:", updateError)
        throw new Error(`Erro ao finalizar proposta: ${updateError.message}`)
      }

      console.log("✅ Proposta finalizada com sucesso")
      toast.success("Proposta finalizada com sucesso!")

      // Redirecionar para página de sucesso
      router.push(`/proposta-digital/sucesso?id=${proposta.id}`)
    } catch (error) {
      console.error("❌ Erro ao finalizar proposta:", error)
      toast.error(`Erro ao finalizar proposta: ${error.message || "Erro desconhecido"}`)
    } finally {
      setIsFinalizando(false)
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    if (propostaId) {
      carregarProposta()
    }
  }, [propostaId])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Carregando proposta...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!proposta) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Proposta não encontrada.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const caracteristicasPlano = obterCaracteristicasPlano(proposta)

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Finalizar Proposta</h1>
        <p className="text-muted-foreground">Revise os dados da sua proposta e finalize o processo</p>
      </div>

      {/* Status da Proposta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Status da Proposta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Proposta #{proposta.id}</p>
              <p className="text-sm text-muted-foreground">
                Criada em {new Date(proposta.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
            <Badge variant={proposta.status === "finalizada" ? "default" : "secondary"}>
              {proposta.status === "finalizada" ? "Finalizada" : "Pendente"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Dados do Titular */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dados do Titular
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome</p>
              <p className="font-medium">{proposta.nome_titular}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="font-medium">{proposta.email_titular}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Telefone</p>
              <p className="font-medium">{proposta.telefone_titular}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">CPF</p>
              <p className="font-medium">{proposta.cpf_titular}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
              <p className="font-medium">{new Date(proposta.data_nascimento_titular).toLocaleDateString("pt-BR")}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cidade/Estado</p>
              <p className="font-medium">
                {proposta.cidade_titular}/{proposta.estado_titular}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plano Escolhido */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Plano Escolhido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Plano</p>
              <p className="font-medium">{proposta.plano_escolhido}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
              <p className="font-medium text-lg text-green-600">
                R$ {proposta.valor_total?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4" />
              <p className="text-sm font-medium text-muted-foreground">Características do Plano</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="whitespace-pre-line">{caracteristicasPlano}</p>
            </div>
            {process.env.NODE_ENV === "development" && (
              <p className="text-xs text-muted-foreground mt-2">
                Fonte:{" "}
                {proposta.produto_descricao
                  ? "produto_descricao"
                  : proposta.observacoes
                    ? "observacoes"
                    : proposta.caracteristicas_plano
                      ? "caracteristicas_plano"
                      : "observacao"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dependentes */}
      {proposta.quantidade_dependentes > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Dependentes ({proposta.quantidade_dependentes})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proposta.dependentes_dados && Array.isArray(proposta.dependentes_dados) ? (
              <div className="space-y-4">
                {proposta.dependentes_dados.map((dependente, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Dependente {index + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Nome</p>
                        <p className="font-medium">{dependente.nome || "Não informado"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Data de Nascimento</p>
                        <p className="font-medium">
                          {dependente.data_nascimento
                            ? new Date(dependente.data_nascimento).toLocaleDateString("pt-BR")
                            : "Não informado"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Parentesco</p>
                        <p className="font-medium">{dependente.parentesco || "Não informado"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Dados dos dependentes não disponíveis</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Ao finalizar, você confirma que todos os dados estão corretos e aceita os termos do plano de saúde.
            </p>
            <Button
              onClick={finalizarProposta}
              disabled={isFinalizando || proposta.status === "finalizada"}
              size="lg"
              className="w-full md:w-auto"
            >
              {isFinalizando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalizando...
                </>
              ) : proposta.status === "finalizada" ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Proposta Finalizada
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Finalizar Proposta
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
