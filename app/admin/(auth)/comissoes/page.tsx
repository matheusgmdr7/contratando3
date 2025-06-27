"use client"

import { useState, useEffect } from "react"
import {
  buscarComissoes,
  atualizarStatusComissao,
  buscarResumoComissoes,
  criarComissaoManual,
  buscarCorretores,
} from "@/services/comissoes-service"
import type { Comissao, ResumoComissoes, Corretor } from "@/types/corretores"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { formatarMoeda } from "@/utils/formatters"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { PlusCircle, Search, Download } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function ComissoesPage() {
  const [comissoes, setComissoes] = useState<Comissao[]>([])
  const [resumo, setResumo] = useState<ResumoComissoes | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState("")
  const [statusFiltro, setStatusFiltro] = useState<string>("todos")
  const [comissaoDetalhada, setComissaoDetalhada] = useState<Comissao | null>(null)
  const [dataPagamento, setDataPagamento] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [showNovaComissaoModal, setShowNovaComissaoModal] = useState(false)
  const [corretores, setCorretores] = useState<Corretor[]>([])
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string>("mes-atual")
  const [mesSelecionado, setMesSelecionado] = useState<string>(new Date().toISOString().substring(0, 7)) // Formato YYYY-MM
  const [ordenacao, setOrdenacao] = useState<string>("data-desc")

  // Estado para nova comissão manual
  const [novaComissao, setNovaComissao] = useState({
    corretor_id: "",
    descricao: "",
    valor: "",
    percentual: "",
    data_prevista: "",
  })

  useEffect(() => {
    carregarDados()
  }, [statusFiltro, periodoSelecionado, mesSelecionado])

  async function carregarDados() {
    try {
      setLoading(true)
      const [comissoesData, resumoData, corretoresData] = await Promise.all([
        buscarComissoes(),
        buscarResumoComissoes(),
        buscarCorretores(),
      ])

      // Filtrar comissões por status se necessário
      let comissoesFiltradas = comissoesData
      if (statusFiltro !== "todos") {
        comissoesFiltradas = comissoesData.filter((comissao) => comissao.status === statusFiltro)
      }

      // Filtrar por período
      if (periodoSelecionado !== "todos") {
        const hoje = new Date()
        let dataInicio: Date, dataFim: Date

        if (periodoSelecionado === "mes-atual") {
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
          dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
        } else if (periodoSelecionado === "mes-especifico") {
          const [ano, mes] = mesSelecionado.split("-")
          dataInicio = new Date(Number.parseInt(ano), Number.parseInt(mes) - 1, 1)
          dataFim = new Date(Number.parseInt(ano), Number.parseInt(mes), 0)
        }

        comissoesFiltradas = comissoesFiltradas.filter((comissao) => {
          const dataComissao = new Date(comissao.data_prevista || comissao.created_at || comissao.data)
          return dataComissao >= dataInicio && dataComissao <= dataFim
        })
      }

      // Ordenar comissões
      comissoesFiltradas.sort((a, b) => {
        const dataA = new Date(a.data_prevista || a.created_at || a.data)
        const dataB = new Date(b.data_prevista || b.created_at || b.data)

        if (ordenacao === "data-desc") {
          return dataB.getTime() - dataA.getTime()
        } else if (ordenacao === "data-asc") {
          return dataA.getTime() - dataB.getTime()
        } else if (ordenacao === "valor-desc") {
          return Number(b.valor) - Number(a.valor)
        } else {
          // valor-asc
          return Number(a.valor) - Number(b.valor)
        }
      })

      setComissoes(comissoesFiltradas)
      setResumo(resumoData)
      setCorretores(corretoresData)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados das comissões")
    } finally {
      setLoading(false)
    }
  }

  const comissoesFiltradas = comissoes.filter(
    (comissao) =>
      comissao.corretor?.nome?.toLowerCase().includes(filtro.toLowerCase()) ||
      comissao.descricao?.toLowerCase().includes(filtro.toLowerCase()),
  )

  const handleMarcarPago = async () => {
    if (!comissaoDetalhada) return

    try {
      await atualizarStatusComissao(comissaoDetalhada.id, {
        status: "pago",
        data_pagamento: dataPagamento || new Date().toISOString().split("T")[0],
      })

      toast.success("Comissão marcada como paga com sucesso!")
      setShowModal(false)
      carregarDados()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast.error("Erro ao atualizar status da comissão")
    }
  }

  const handleCriarComissao = async () => {
    try {
      if (!novaComissao.corretor_id || !novaComissao.valor || !novaComissao.descricao) {
        toast.error("Preencha todos os campos obrigatórios")
        return
      }

      await criarComissaoManual({
        ...novaComissao,
        valor: Number.parseFloat(novaComissao.valor.replace(/[^\d,.-]/g, "").replace(",", ".")),
        percentual: novaComissao.percentual
          ? Number.parseFloat(novaComissao.percentual.replace(/[^\d,.-]/g, "").replace(",", "."))
          : null,
      })

      toast.success("Comissão criada com sucesso!")
      setShowNovaComissaoModal(false)
      setNovaComissao({
        corretor_id: "",
        descricao: "",
        valor: "",
        percentual: "",
        data_prevista: "",
      })
      carregarDados()
    } catch (error) {
      console.error("Erro ao criar comissão:", error)
      toast.error("Erro ao criar nova comissão")
    }
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

  // Função para formatar o mês para exibição
  const formatarMes = (dataStr: string) => {
    const [ano, mes] = dataStr.split("-")
    const data = new Date(Number.parseInt(ano), Number.parseInt(mes) - 1, 1)
    return data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comissões"
        description="Gerencie as comissões dos corretores"
        actions={
          <Button onClick={() => setShowNovaComissaoModal(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Comissão
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Comissões</CardTitle>
            <CardDescription>Valor total de comissões</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumo ? formatarMoeda(resumo.total) : <Spinner size="sm" />}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Comissões Pagas</CardTitle>
            <CardDescription>Valor total pago</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {resumo ? formatarMoeda(resumo.pagas) : <Spinner size="sm" />}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Comissões Pendentes</CardTitle>
            <CardDescription>Valor a pagar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {resumo ? formatarMoeda(resumo.pendentes) : <Spinner size="sm" />}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Corretores</CardTitle>
            <CardDescription>Corretores com comissões</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumo ? resumo.total_corretores : <Spinner size="sm" />}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Lista de Comissões</CardTitle>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar por corretor ou descrição..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="pago">Pagos</SelectItem>
                </SelectContent>
              </Select>

              <Tabs defaultValue="mes-atual" className="w-full md:w-auto" onValueChange={setPeriodoSelecionado}>
                <TabsList className="grid grid-cols-3 w-full md:w-auto">
                  <TabsTrigger value="mes-atual" className="text-xs">
                    Mês Atual
                  </TabsTrigger>
                  <TabsTrigger value="mes-especifico" className="text-xs">
                    Mês Específico
                  </TabsTrigger>
                  <TabsTrigger value="todos" className="text-xs">
                    Todos
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="mes-especifico" className="mt-2">
                  <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                    <SelectTrigger className="w-full md:w-[200px] h-8 text-xs">
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

              <Select value={ordenacao} onValueChange={setOrdenacao}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data-desc">Data (recente)</SelectItem>
                  <SelectItem value="data-asc">Data (antiga)</SelectItem>
                  <SelectItem value="valor-desc">Valor (maior)</SelectItem>
                  <SelectItem value="valor-asc">Valor (menor)</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="w-full md:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : comissoesFiltradas.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Corretor</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data Prevista</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comissoesFiltradas.map((comissao) => (
                    <TableRow key={comissao.id}>
                      <TableCell className="font-medium">{comissao.corretor?.nome || "N/A"}</TableCell>
                      <TableCell>{comissao.descricao}</TableCell>
                      <TableCell>{formatarMoeda(comissao.valor)}</TableCell>
                      <TableCell>
                        {comissao.data_prevista
                          ? new Date(comissao.data_prevista).toLocaleDateString()
                          : "Não definida"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={comissao.status === "pago" ? "success" : "outline"}
                          className={`${
                            comissao.status === "pago"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                          }`}
                        >
                          {comissao.status === "pago" ? "Pago" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {comissao.status === "pendente" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setComissaoDetalhada(comissao)
                              setDataPagamento(new Date().toISOString().split("T")[0])
                              setShowModal(true)
                            }}
                          >
                            Marcar como Pago
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Pago em {new Date(comissao.data_pagamento).toLocaleDateString()}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma comissão encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para marcar como pago */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar Comissão como Paga</DialogTitle>
            <DialogDescription>
              Confirme o pagamento da comissão para {comissaoDetalhada?.corretor?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="data-pagamento">Data do Pagamento</Label>
              <Input
                id="data-pagamento"
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Detalhes da Comissão</Label>
              <div className="rounded-md bg-gray-50 p-4">
                <p className="text-sm font-medium">Valor: {formatarMoeda(comissaoDetalhada?.valor || 0)}</p>
                <p className="text-sm text-gray-500 mt-1">{comissaoDetalhada?.descricao}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMarcarPago}>Confirmar Pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para criar nova comissão */}
      <Dialog open={showNovaComissaoModal} onOpenChange={setShowNovaComissaoModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Criar Nova Comissão</DialogTitle>
            <DialogDescription>Adicione uma nova comissão para um corretor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="corretor">Corretor</Label>
              <Select
                value={novaComissao.corretor_id}
                onValueChange={(value) => setNovaComissao({ ...novaComissao, corretor_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um corretor" />
                </SelectTrigger>
                <SelectContent>
                  {corretores.map((corretor) => (
                    <SelectItem key={corretor.id} value={corretor.id}>
                      {corretor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva a comissão"
                value={novaComissao.descricao}
                onChange={(e) => setNovaComissao({ ...novaComissao, descricao: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  placeholder="0,00"
                  value={novaComissao.valor}
                  onChange={(e) => setNovaComissao({ ...novaComissao, valor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentual">Percentual (%)</Label>
                <Input
                  id="percentual"
                  placeholder="0,00"
                  value={novaComissao.percentual}
                  onChange={(e) => setNovaComissao({ ...novaComissao, percentual: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-prevista">Data Prevista de Pagamento</Label>
              <Input
                id="data-prevista"
                type="date"
                value={novaComissao.data_prevista}
                onChange={(e) => setNovaComissao({ ...novaComissao, data_prevista: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNovaComissaoModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriarComissao}>Criar Comissão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
