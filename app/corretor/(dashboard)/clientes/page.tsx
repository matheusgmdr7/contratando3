"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, PlusCircle, Eye, Mail, Phone, Download } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { verificarAutenticacao } from "@/services/auth-corretores-simples"

interface Cliente {
  id: string
  nome: string
  email: string
  telefone: string
  status: "ativo" | "inativo" | "pendente"
  data_cadastro: string
  ultima_proposta?: string
  propostas_count: number
}

// Simulação de serviço de clientes
const buscarClientesPorCorretor = async (corretorId: string): Promise<Cliente[]> => {
  // Simular uma chamada de API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: "1",
          nome: "João Silva",
          email: "joao@exemplo.com",
          telefone: "(11) 98765-4321",
          status: "ativo",
          data_cadastro: "2023-05-15T10:30:00",
          ultima_proposta: "2023-06-01T14:20:00",
          propostas_count: 2,
        },
        {
          id: "2",
          nome: "Maria Oliveira",
          email: "maria@exemplo.com",
          telefone: "(11) 91234-5678",
          status: "ativo",
          data_cadastro: "2023-05-20T09:15:00",
          ultima_proposta: "2023-05-25T16:45:00",
          propostas_count: 1,
        },
        {
          id: "3",
          nome: "Carlos Santos",
          email: "carlos@exemplo.com",
          telefone: "(11) 97777-8888",
          status: "pendente",
          data_cadastro: "2023-06-05T11:10:00",
          propostas_count: 0,
        },
        {
          id: "4",
          nome: "Ana Pereira",
          email: "ana@exemplo.com",
          telefone: "(11) 96666-7777",
          status: "inativo",
          data_cadastro: "2023-04-10T08:30:00",
          ultima_proposta: "2023-04-15T10:20:00",
          propostas_count: 1,
        },
      ])
    }, 500)
  })
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState("")
  const [statusFiltro, setStatusFiltro] = useState("todos")
  const [ordenacao, setOrdenacao] = useState("recentes")

  useEffect(() => {
    carregarClientes()
  }, [])

  async function carregarClientes() {
    try {
      setLoading(true)

      // Verificar autenticação do corretor
      const { autenticado, corretor } = verificarAutenticacao()

      if (!autenticado || !corretor) {
        toast.error("Sessão expirada. Por favor, faça login novamente.")
        // Redirecionar para login
        window.location.href = "/corretor/login"
        return
      }

      const data = await buscarClientesPorCorretor(corretor.id)
      setClientes(data)
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
      toast.error("Erro ao carregar clientes")
    } finally {
      setLoading(false)
    }
  }

  // Filtrar clientes
  let clientesFiltrados = clientes.filter(
    (cliente) =>
      (cliente.nome.toLowerCase().includes(filtro.toLowerCase()) ||
        cliente.email.toLowerCase().includes(filtro.toLowerCase()) ||
        cliente.telefone.includes(filtro)) &&
      (statusFiltro === "todos" || cliente.status === statusFiltro),
  )

  // Ordenar clientes
  clientesFiltrados = [...clientesFiltrados].sort((a, b) => {
    if (ordenacao === "recentes") {
      return new Date(b.data_cadastro).getTime() - new Date(a.data_cadastro).getTime()
    } else if (ordenacao === "antigos") {
      return new Date(a.data_cadastro).getTime() - new Date(b.data_cadastro).getTime()
    } else if (ordenacao === "nome-asc") {
      return a.nome.localeCompare(b.nome)
    } else if (ordenacao === "nome-desc") {
      return b.nome.localeCompare(a.nome)
    } else if (ordenacao === "propostas") {
      return b.propostas_count - a.propostas_count
    }
    return 0
  })

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center border-b pb-3">
        <h1 className="text-xl font-semibold tracking-tight">Meus Clientes</h1>
        <Button onClick={() => (window.location.href = "/corretor/propostas/nova")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Proposta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {clientes.filter((c) => c.status === "ativo").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-medium">Propostas Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {clientes.reduce((acc, cliente) => acc + cliente.propostas_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Lista de Clientes</CardTitle>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar por nome, email..."
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
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
              </Select>

              <Select value={ordenacao} onValueChange={setOrdenacao}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recentes">Mais Recentes</SelectItem>
                  <SelectItem value="antigos">Mais Antigos</SelectItem>
                  <SelectItem value="nome-asc">Nome (A-Z)</SelectItem>
                  <SelectItem value="nome-desc">Nome (Z-A)</SelectItem>
                  <SelectItem value="propostas">Mais Propostas</SelectItem>
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
          ) : clientesFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Propostas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientesFiltrados.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5 text-gray-500" />
                            <span className="text-sm">{cliente.email}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Phone className="h-3.5 w-3.5 text-gray-500" />
                            <span className="text-sm">{cliente.telefone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            cliente.status === "ativo"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : cliente.status === "inativo"
                                ? "bg-red-100 text-red-800 hover:bg-red-100"
                                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                          }
                        >
                          {cliente.status === "ativo" ? "Ativo" : cliente.status === "inativo" ? "Inativo" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(cliente.data_cadastro).toLocaleDateString()}</TableCell>
                      <TableCell>{cliente.propostas_count}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">Nenhum cliente encontrado.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
