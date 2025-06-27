"use client"

import { useState, useEffect } from "react"
import { buscarCorretores, atualizarCorretor } from "@/services/corretores-service"
import type { Corretor } from "@/types/corretores"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CorretoresPage() {
  const [corretores, setCorretores] = useState<Corretor[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState("")
  const [statusFiltro, setStatusFiltro] = useState<string>("todos")

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [itensPorPagina] = useState(15)

  useEffect(() => {
    carregarCorretores()
  }, [])

  async function carregarCorretores() {
    try {
      setLoading(true)
      const data = await buscarCorretores()
      setCorretores(data)
    } catch (error) {
      console.error("Erro ao carregar corretores:", error)
      toast.error("Erro ao carregar corretores")
    } finally {
      setLoading(false)
    }
  }

  async function aprovarCorretor(id: string) {
    try {
      await atualizarCorretor(id, { status: "aprovado" })
      toast.success("Corretor aprovado com sucesso")
      carregarCorretores()
    } catch (error) {
      console.error("Erro ao aprovar corretor:", error)
      toast.error("Erro ao aprovar corretor")
    }
  }

  async function rejeitarCorretor(id: string) {
    try {
      await atualizarCorretor(id, { status: "rejeitado" })
      toast.success("Corretor rejeitado com sucesso")
      carregarCorretores()
    } catch (error) {
      console.error("Erro ao rejeitar corretor:", error)
      toast.error("Erro ao rejeitar corretor")
    }
  }

  const corretoresFiltrados = corretores.filter((corretor) => {
    const matchFiltro =
      corretor.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      corretor.email.toLowerCase().includes(filtro.toLowerCase()) ||
      corretor.cidade.toLowerCase().includes(filtro.toLowerCase()) ||
      (corretor.cpf && corretor.cpf.includes(filtro))

    if (statusFiltro === "todos") return matchFiltro
    return matchFiltro && corretor.status === statusFiltro
  })

  // Cálculos de paginação
  const totalItens = corretoresFiltrados.length
  const totalPaginas = Math.ceil(totalItens / itensPorPagina)
  const indiceInicio = (paginaAtual - 1) * itensPorPagina
  const indiceFim = indiceInicio + itensPorPagina
  const corretoresExibidos = corretoresFiltrados.slice(indiceInicio, indiceFim)

  // Reset da página quando filtros mudam
  useEffect(() => {
    setPaginaAtual(1)
  }, [filtro, statusFiltro])

  const formatarData = (data: string) => {
    if (!data) return "-"
    return new Date(data).toLocaleDateString("pt-BR")
  }

  const formatarCPF = (cpf: string) => {
    if (!cpf) return "-"
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  const formatarTelefone = (telefone: string) => {
    if (!telefone) return "-"
    return telefone.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Gerenciamento de Corretores</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Resumo</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-600">Total de Corretores</p>
            <p className="text-2xl font-bold text-gray-800">{corretores.length}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-600">Pendentes de Aprovação</p>
            <p className="text-2xl font-bold text-gray-800">
              {corretores.filter((c) => c.status === "pendente").length}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-600">Corretores Ativos</p>
            <p className="text-2xl font-bold text-gray-800">
              {corretores.filter((c) => c.status === "aprovado").length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between mb-4">
            <h2 className="text-lg font-semibold mb-4 md:mb-0 text-gray-700">Lista de Corretores</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Buscar por nome, email, cidade ou CPF..."
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                />
              </div>
              <div>
                <select
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  value={statusFiltro}
                  onChange={(e) => setStatusFiltro(e.target.value)}
                >
                  <option value="todos">Todos os status</option>
                  <option value="pendente">Pendentes</option>
                  <option value="aprovado">Aprovados</option>
                  <option value="rejeitado">Rejeitados</option>
                </select>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Mostrando {indiceInicio + 1}-{Math.min(indiceFim, totalItens)} de {totalItens} corretores
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Corretor
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CPF
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localização
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Nasc.
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cadastro
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {corretoresExibidos.length > 0 ? (
                    corretoresExibidos.map((corretor) => (
                      <tr key={corretor.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            {corretor.foto_url ? (
                              <img
                                src={corretor.foto_url || "/placeholder.svg"}
                                alt={corretor.nome}
                                className="w-10 h-10 rounded-full mr-3 object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center border border-gray-300">
                                <span className="text-gray-600 font-medium text-sm">{corretor.nome.charAt(0)}</span>
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{corretor.nome}</div>
                              <div className="text-sm text-gray-500">{corretor.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900">{formatarCPF(corretor.cpf)}</td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-900">{formatarTelefone(corretor.telefone)}</div>
                          {corretor.whatsapp && (
                            <div className="text-sm text-gray-500">WhatsApp: {formatarTelefone(corretor.whatsapp)}</div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-900">
                            {corretor.cidade}, {corretor.estado}
                          </div>
                          {(corretor.endereco || corretor.cep) && (
                            <div className="text-sm text-gray-500">
                              {corretor.endereco && <div>{corretor.endereco}</div>}
                              {corretor.cep && <div>CEP: {corretor.cep}</div>}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900">{formatarData(corretor.data_nascimento)}</td>
                        <td className="py-4 px-4 text-sm text-gray-900">{formatarData(corretor.created_at)}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              corretor.status === "aprovado"
                                ? "bg-gray-100 text-gray-800"
                                : corretor.status === "rejeitado"
                                  ? "bg-gray-100 text-gray-600"
                                  : "bg-gray-50 text-gray-700"
                            }`}
                          >
                            {corretor.status === "aprovado"
                              ? "Aprovado"
                              : corretor.status === "rejeitado"
                                ? "Rejeitado"
                                : "Pendente"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {corretor.status === "pendente" && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => aprovarCorretor(corretor.id)}
                                className="bg-gray-600 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-700 transition-colors"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => rejeitarCorretor(corretor.id)}
                                className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-sm hover:bg-red-200 transition-colors border border-red-200"
                              >
                                Rejeitar
                              </button>
                            </div>
                          )}
                          {corretor.status === "rejeitado" && (
                            <button
                              onClick={() => aprovarCorretor(corretor.id)}
                              className="bg-gray-600 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-700 transition-colors"
                            >
                              Aprovar
                            </button>
                          )}
                          {corretor.status === "aprovado" && (
                            <button
                              onClick={() => rejeitarCorretor(corretor.id)}
                              className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-sm hover:bg-red-200 transition-colors border border-red-200"
                            >
                              Desativar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-500">
                        Nenhum corretor encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Página {paginaAtual} de {totalPaginas}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                      disabled={paginaAtual === 1}
                      className="h-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>

                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                        let pageNum
                        if (totalPaginas <= 5) {
                          pageNum = i + 1
                        } else if (paginaAtual <= 3) {
                          pageNum = i + 1
                        } else if (paginaAtual >= totalPaginas - 2) {
                          pageNum = totalPaginas - 4 + i
                        } else {
                          pageNum = paginaAtual - 2 + i
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={paginaAtual === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPaginaAtual(pageNum)}
                            className="h-8 w-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                      disabled={paginaAtual === totalPaginas}
                      className="h-8"
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
