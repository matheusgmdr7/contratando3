"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, TrendingUp, Users, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { buscarPropostasPorCorretor } from "@/services/propostas-corretores-service"
import { getCorretorLogado } from "@/services/auth-corretores-simples"
import { buscarComissoesPorCorretor } from "@/services/comissoes-service"
import { formatarMoeda } from "@/utils/formatters"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { testarConexaoSupabase } from "@/lib/supabase"

interface DashboardStats {
  propostasEnviadas: number
  propostasAprovadas: number
  comissoesPendentes: number
  comissoesTotais: number
  comissoesPagas: number
  clientesAtivos: number
}

export default function CorretorDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    propostasEnviadas: 0,
    propostasAprovadas: 0,
    comissoesPendentes: 0,
    comissoesTotais: 0,
    comissoesPagas: 0,
    clientesAtivos: 0,
  })
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [ultimasPropostas, setUltimasPropostas] = useState<any[]>([])
  const [ultimasComissoes, setUltimasComissoes] = useState<any[]>([])
  const [mesSelecionado, setMesSelecionado] = useState<string>(new Date().toISOString().substring(0, 7)) // Formato YYYY-MM
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string>("mes-atual")
  const [tentativasRecarregar, setTentativasRecarregar] = useState(0)
  const [statusSupabase, setStatusSupabase] = useState<boolean | null>(null)
  const [verificandoSupabase, setVerificandoSupabase] = useState(false)

  // Função para obter o primeiro e último dia do mês
  const obterPrimeiroDiaDoMes = (dataStr: string) => {
    const [ano, mes] = dataStr.split("-")
    return new Date(Number.parseInt(ano), Number.parseInt(mes) - 1, 1)
  }

  const obterUltimoDiaDoMes = (dataStr: string) => {
    const [ano, mes] = dataStr.split("-")
    return new Date(Number.parseInt(ano), Number.parseInt(mes), 0)
  }

  // Função para filtrar dados por período
  const filtrarPorPeriodo = (dados: any[], dataInicio: Date, dataFim: Date) => {
    return dados.filter((item) => {
      const dataItem = new Date(item.created_at || item.data)
      return dataItem >= dataInicio && dataItem <= dataFim
    })
  }

  // Verificar conexão com Supabase
  const verificarConexaoSupabase = async () => {
    try {
      setVerificandoSupabase(true)
      const resultado = await testarConexaoSupabase()
      setStatusSupabase(resultado)
      return resultado
    } catch (error) {
      console.error("Erro ao verificar conexão com Supabase:", error)
      setStatusSupabase(false)
      return false
    } finally {
      setVerificandoSupabase(false)
    }
  }

  useEffect(() => {
    // Verificar conexão com Supabase ao carregar a página
    verificarConexaoSupabase()
  }, [])

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true)
        setErro(null)

        // Verificar conexão com Supabase
        const conexaoOk = await verificarConexaoSupabase()
        if (!conexaoOk) {
          setErro("Não foi possível conectar ao banco de dados. Verifique a configuração do Supabase.")
          setCarregando(false)
          return
        }

        // Obter o corretor logado
        const corretor = getCorretorLogado()

        if (!corretor || !corretor.id) {
          setErro("Corretor não autenticado ou ID não disponível")
          setCarregando(false)
          return
        }

        console.log("ID do corretor autenticado:", corretor.id)

        // Buscar propostas do corretor
        const propostas = await buscarPropostasPorCorretor(corretor.id)

        // Buscar comissões do corretor
        const comissoes = await buscarComissoesPorCorretor(corretor.id)

        // Definir datas de início e fim com base no período selecionado
        let dataInicio: Date, dataFim: Date

        if (periodoSelecionado === "mes-atual") {
          const hoje = new Date()
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
          dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
        } else if (periodoSelecionado === "mes-especifico") {
          dataInicio = obterPrimeiroDiaDoMes(mesSelecionado)
          dataFim = obterUltimoDiaDoMes(mesSelecionado)
        } else {
          // todos
          dataInicio = new Date(0) // Data mínima
          dataFim = new Date(8640000000000000) // Data máxima
        }

        // Filtrar dados pelo período selecionado
        const propostasFiltradas =
          periodoSelecionado === "todos" ? propostas : filtrarPorPeriodo(propostas, dataInicio, dataFim)

        const comissoesFiltradas =
          periodoSelecionado === "todos" ? comissoes : filtrarPorPeriodo(comissoes, dataInicio, dataFim)

        // Calcular resumo das comissões
        const comissoesTotais = comissoesFiltradas.reduce((acc, comissao) => acc + Number(comissao.valor || 0), 0)
        const comissoesPagas = comissoesFiltradas
          .filter((comissao) => comissao.status === "pago")
          .reduce((acc, comissao) => acc + Number(comissao.valor || 0), 0)
        const comissoesPendentes = comissoesFiltradas
          .filter((comissao) => comissao.status === "pendente")
          .reduce((acc, comissao) => acc + Number(comissao.valor || 0), 0)

        // Calcular estatísticas com base nas propostas
        const propostasEnviadas = propostasFiltradas.length
        const propostasAprovadas = propostasFiltradas.filter((p) => p.status === "aprovada").length

        // Calcular clientes únicos (baseado no email)
        const clientesUnicos = new Set()
        propostasFiltradas?.forEach((proposta) => {
          // Apenas propostas APROVADAS contam como clientes ativos
          if (proposta.status === "aprovada" && proposta.email_cliente) {
            clientesUnicos.add(proposta.email_cliente)
          }
        })
        const clientesAtivos = clientesUnicos.size

        // Atualizar estatísticas
        setStats({
          propostasEnviadas,
          propostasAprovadas,
          comissoesPendentes,
          comissoesTotais,
          comissoesPagas,
          clientesAtivos,
        })

        // Definir últimas propostas reais (limitado a 5)
        const propostasRecentes =
          propostas.length > 0
            ? [...propostas]
                .sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime())
                .slice(0, 5)
            : []

        setUltimasPropostas(propostasRecentes)

        // Definir últimas comissões (limitado a 5)
        const comissoesRecentes = [...comissoes]
          .sort(
            (a, b) =>
              new Date(b.created_at || b.data || "").getTime() - new Date(a.created_at || a.data || "").getTime(),
          )
          .slice(0, 5)

        setUltimasComissoes(comissoesRecentes)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        setErro("Erro ao carregar dados do dashboard. Tente novamente.")
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [mesSelecionado, periodoSelecionado, tentativasRecarregar])

  // Função para formatar o mês para exibição
  const formatarMes = (dataStr: string) => {
    const [ano, mes] = dataStr.split("-")
    const data = new Date(Number.parseInt(ano), Number.parseInt(mes) - 1, 1)
    return data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  }

  // Gerar opções de meses (últimos 12 meses)
  const gerarOpcoesMeses = () => {
    const opcoes = []
    const dataAtual = new Date()

    for (let i = 0; i < 12; i++) {
      const data = new Date(dataAtual.getFullYear(), dataAtual.getMonth() - i, 1)
      const valor = data.toISOString().substring(0, 7) // YYYY-MM
      opcoes.push({ valor, label: data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) })
    }

    return opcoes
  }

  const opcoesMeses = gerarOpcoesMeses()

  // Função para tentar recarregar os dados
  const handleRecarregar = () => {
    setTentativasRecarregar((prev) => prev + 1)
  }

  if (erro) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Erro ao carregar o dashboard</h2>
        <p className="text-gray-600 mb-4">{erro}</p>

        {statusSupabase === false && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Problema de conexão com o banco de dados</AlertTitle>
            <AlertDescription>
              Não foi possível conectar ao Supabase. Verifique se as variáveis de ambiente estão configuradas
              corretamente.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex space-x-4">
          <Button onClick={handleRecarregar} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>

          <Button onClick={verificarConexaoSupabase} variant="outline" disabled={verificandoSupabase}>
            {verificandoSupabase ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Verificar conexão
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center border-b pb-3">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>

        <div className="flex items-center space-x-2">
          <Tabs defaultValue="mes-atual" className="w-[400px]" onValueChange={setPeriodoSelecionado}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mes-atual">Mês Atual</TabsTrigger>
              <TabsTrigger value="mes-especifico">Mês Específico</TabsTrigger>
              <TabsTrigger value="todos">Todos</TabsTrigger>
            </TabsList>
            <TabsContent value="mes-especifico" className="mt-2">
              <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {opcoesMeses.map((opcao) => (
                    <SelectItem key={opcao.valor} value={opcao.valor}>
                      {opcao.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {carregando ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
          <span className="ml-2 text-gray-600">Carregando dados...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                <CardTitle className="text-sm font-medium text-gray-700">Propostas Enviadas</CardTitle>
                <FileText className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{stats.propostasEnviadas}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {periodoSelecionado === "mes-atual"
                    ? "No mês atual"
                    : periodoSelecionado === "mes-especifico"
                      ? `Em ${formatarMes(mesSelecionado)}`
                      : "Total"}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                <CardTitle className="text-sm font-medium text-gray-700">Propostas Aprovadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{stats.propostasAprovadas}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {periodoSelecionado === "mes-atual"
                    ? "No mês atual"
                    : periodoSelecionado === "mes-especifico"
                      ? `Em ${formatarMes(mesSelecionado)}`
                      : "Total"}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                <CardTitle className="text-sm font-medium text-gray-700">Comissões Pendentes</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-amber-600">{formatarMoeda(stats.comissoesPendentes)}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {periodoSelecionado === "mes-atual"
                    ? "No mês atual"
                    : periodoSelecionado === "mes-especifico"
                      ? `Em ${formatarMes(mesSelecionado)}`
                      : "Total"}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                <CardTitle className="text-sm font-medium text-gray-700">Clientes Ativos</CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{stats.clientesAtivos}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {periodoSelecionado === "mes-atual"
                    ? "No mês atual"
                    : periodoSelecionado === "mes-especifico"
                      ? `Em ${formatarMes(mesSelecionado)}`
                      : "Total"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-base font-medium">Últimas Propostas</CardTitle>
                <CardDescription className="text-xs">Propostas enviadas recentemente</CardDescription>
              </CardHeader>
              <CardContent>
                {ultimasPropostas.length > 0 ? (
                  <div className="space-y-0">
                    {ultimasPropostas.map((proposta, index) => (
                      <div
                        key={proposta.id}
                        className={`flex justify-between py-2 ${index < ultimasPropostas.length - 1 ? "border-b border-gray-100" : ""}`}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {proposta.nome_cliente || proposta.cliente || "Cliente não informado"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(proposta.created_at || "").toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-[#168979]">
                            {proposta.produto_nome || proposta.plano_nome || "Plano"}
                          </span>
                          <span
                            className={`ml-2 w-2 h-2 rounded-full ${
                              proposta.status === "aprovada"
                                ? "bg-green-500"
                                : proposta.status === "rejeitada"
                                  ? "bg-red-500"
                                  : proposta.status === "pendente"
                                    ? "bg-yellow-500"
                                    : "bg-gray-400"
                            }`}
                          ></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">Nenhuma proposta enviada ainda</p>
                    <p className="text-xs text-gray-400 mt-1">As propostas aparecerão aqui após serem enviadas</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-base font-medium">Comissões Recentes</CardTitle>
                <CardDescription className="text-xs">Últimas comissões recebidas</CardDescription>
              </CardHeader>
              <CardContent>
                {ultimasComissoes.length > 0 ? (
                  <div className="space-y-0">
                    {ultimasComissoes.map((comissao, index) => (
                      <div
                        key={comissao.id}
                        className={`flex justify-between py-2 ${index < ultimasComissoes.length - 1 ? "border-b border-gray-100" : ""}`}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {comissao.descricao ||
                              (comissao.propostas_corretores?.cliente
                                ? `${comissao.propostas_corretores.cliente}`
                                : "Comissão")}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comissao.created_at || comissao.data || "").toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span
                            className={`text-sm ${comissao.status === "pago" ? "text-green-600" : "text-amber-600"}`}
                          >
                            {formatarMoeda(comissao.valor || 0)}
                          </span>
                          <span
                            className={`ml-2 w-2 h-2 rounded-full ${
                              comissao.status === "pago" ? "bg-green-500" : "bg-yellow-500"
                            }`}
                          ></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4 text-sm">Nenhuma comissão recebida ainda</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
