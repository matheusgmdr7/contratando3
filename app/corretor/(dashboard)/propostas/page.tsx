"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, Search, FileText } from "lucide-react"
import { buscarPropostasPorCorretor } from "@/services/propostas-service-unificado"
import { verificarAutenticacao } from "@/services/auth-corretores-simples"
import { Spinner } from "@/components/ui/spinner"
import { formatarMoeda } from "@/utils/formatters"
import { useRouter } from "next/navigation"

export default function CorretorPropostasPage() {
  const [propostas, setPropostas] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("Todos")
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro(null)

        // Verificar autenticação
        const { autenticado, corretor } = verificarAutenticacao()
        if (!autenticado || !corretor) {
          setErro("Usuário não autenticado. Por favor, faça login novamente.")
          return
        }

        // Carregar propostas usando o serviço unificado
        const propostasData = await buscarPropostasPorCorretor(corretor.id)
        setPropostas(propostasData)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        setErro("Não foi possível carregar os dados. Por favor, tente novamente.")
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [])

  const propostasFiltradas = propostas.filter((proposta) => {
    const matchSearch =
      proposta.nome_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposta.email_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposta.telefone_cliente?.includes(searchTerm) ||
      proposta.produto?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchStatus = filtroStatus === "Todos" || proposta.status === filtroStatus
    return matchSearch && matchStatus
  })

  if (erro) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Propostas</h1>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <p className="text-red-500 font-medium">{erro}</p>
              <Button onClick={() => window.location.reload()} className="bg-[#168979] hover:bg-[#13786a]">
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center border-b pb-3">
        <h1 className="text-xl font-semibold tracking-tight">Propostas Recebidas</h1>
        <Button
          onClick={() => router.push("/corretor/propostas/nova")}
          className="bg-[#168979] hover:bg-[#13786a] text-white"
        >
          <FileText className="mr-2 h-4 w-4" />
          Nova Proposta
        </Button>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-base font-medium">Propostas enviadas pelos clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-5">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por cliente, email, telefone ou produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 text-sm"
              />
            </div>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full md:w-[180px] h-9 text-sm">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="aprovada">Aprovadas</SelectItem>
                <SelectItem value="rejeitada">Rejeitadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-medium text-xs text-gray-600">Cliente</TableHead>
                  <TableHead className="font-medium text-xs text-gray-600">Contato</TableHead>
                  <TableHead className="font-medium text-xs text-gray-600">Produto</TableHead>
                  <TableHead className="font-medium text-xs text-gray-600">Data</TableHead>
                  <TableHead className="font-medium text-xs text-gray-600">Status</TableHead>
                  <TableHead className="font-medium text-xs text-gray-600">Valor</TableHead>
                  <TableHead className="font-medium text-xs text-gray-600">Comissão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carregando ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex justify-center">
                        <Spinner />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Carregando propostas...</p>
                    </TableCell>
                  </TableRow>
                ) : propostasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-sm text-gray-500">
                      {searchTerm || filtroStatus !== "Todos"
                        ? "Nenhuma proposta encontrada com os filtros aplicados"
                        : "Você ainda não possui propostas cadastradas"}
                    </TableCell>
                  </TableRow>
                ) : (
                  propostasFiltradas.map((proposta) => (
                    <TableRow key={proposta.id} className="text-sm">
                      <TableCell className="font-medium">{proposta.nome_cliente}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Email:</span>
                          <span className="text-xs">{proposta.email_cliente || "-"}</span>
                          <span className="text-xs text-gray-500 mt-1">Telefone:</span>
                          <span className="text-xs">{proposta.telefone_cliente || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{proposta.produto || proposta.produto_nome || "-"}</TableCell>
                      <TableCell className="text-xs">
                        {proposta.created_at ? new Date(proposta.created_at).toLocaleDateString("pt-BR") : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-1.5 py-0.5 rounded-sm text-xs ${
                            proposta.status === "aprovada"
                              ? "bg-green-100 text-green-800"
                              : proposta.status === "rejeitada"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {proposta.status === "aprovada"
                            ? "Aprovada"
                            : proposta.status === "rejeitada"
                              ? "Rejeitada"
                              : "Pendente"}
                        </span>
                      </TableCell>
                      <TableCell>{proposta.valor_total > 0 ? formatarMoeda(proposta.valor_total) : "-"}</TableCell>
                      <TableCell>{proposta.comissao > 0 ? formatarMoeda(proposta.comissao) : "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
