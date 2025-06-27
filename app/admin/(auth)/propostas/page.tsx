"use client"

import { useState, useEffect } from "react"
import {
  buscarPropostas,
  atualizarStatusProposta,
  enviarValidacaoEmail,
  buscarDependentesProposta,
  buscarQuestionarioSaude,
  buscarPropostaCompleta,
  obterDocumentosInteligente,
  obterNomeCliente,
  obterEmailCliente,
  obterTelefoneCliente,
  obterValorProposta,
} from "@/services/propostas-service-unificado"
import { downloadPropostaComDocumentos } from "@/services/download-service"
import { gerarPDFCompleto, gerarPDFSimples } from "@/services/pdf-completo-service"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PropostasPage() {
  const [propostas, setPropostas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState("")
  const [statusFiltro, setStatusFiltro] = useState("todos")
  const [origemFiltro, setOrigemFiltro] = useState("todas")
  const [propostaDetalhada, setPropostaDetalhada] = useState(null)
  const [dependentes, setDependentes] = useState([])
  const [questionario, setQuestionario] = useState([])
  const [questionarioDependentes, setQuestionarioDependentes] = useState([])
  const [motivoRejeicao, setMotivoRejeicao] = useState("")
  const [showModalRejeicao, setShowModalRejeicao] = useState(false)
  const [showModalDetalhes, setShowModalDetalhes] = useState(false)
  const [enviandoEmail, setEnviandoEmail] = useState(null)
  const [loadingDetalhes, setLoadingDetalhes] = useState(false)
  const [downloadingZip, setDownloadingZip] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [itensPorPagina] = useState(25)

  useEffect(() => {
    carregarPropostas()
  }, [])

  async function carregarPropostas() {
    try {
      setLoading(true)
      console.log("🔄 Carregando propostas UNIFICADAS...")
      const data = await buscarPropostas()
      console.log("📊 Propostas carregadas:", data.length)
      setPropostas(data)
    } catch (error) {
      console.error("❌ Erro ao carregar propostas:", error)
      toast.error("Erro ao carregar propostas")
    } finally {
      setLoading(false)
    }
  }

  async function carregarDetalhesCompletos(proposta) {
    try {
      setLoadingDetalhes(true)
      console.log("🔍 CARREGANDO DETALHES COMPLETOS - UNIFICADO")
      console.log("=".repeat(60))
      console.log("📋 Proposta ID:", proposta.id)
      console.log("📋 Origem:", proposta.origem)

      // 1. Buscar dados completos da proposta
      const propostaCompleta = await buscarPropostaCompleta(proposta.id)
      setPropostaDetalhada(propostaCompleta)

      // 2. Carregar dependentes
      const dependentesData = await buscarDependentesProposta(proposta.id)
      setDependentes(dependentesData)

      // 3. Carregar questionário do titular
      const questionarioData = await buscarQuestionarioSaude(proposta.id)
      setQuestionario(questionarioData)

      // 4. Carregar questionários dos dependentes
      const questionarioDependentesData = []
      if (dependentesData && dependentesData.length > 0) {
        for (const dep of dependentesData) {
          try {
            const questDep = await buscarQuestionarioSaude(proposta.id, dep.id)
            if (questDep && questDep.length > 0) {
              questionarioDependentesData.push({
                dependente_id: dep.id,
                dependente_nome: dep.nome,
                dependente_parentesco: dep.parentesco,
                questionario: questDep,
              })
            }
          } catch (error) {
            console.log(`⚠️ Erro ao buscar questionário do dependente ${dep.nome}:`, error.message)
          }
        }
      }

      setQuestionarioDependentes(questionarioDependentesData)
      console.log("🎉 CARREGAMENTO COMPLETO FINALIZADO!")
    } catch (error) {
      console.error("❌ ERRO GERAL AO CARREGAR DETALHES:", error)
      toast.error("Erro ao carregar detalhes da proposta: " + error.message)
    } finally {
      setLoadingDetalhes(false)
    }
  }

  async function baixarTudoZip() {
    if (!propostaDetalhada) return

    try {
      setDownloadingZip(true)
      const nomeCliente = obterNomeCliente(propostaDetalhada)
      const documentosUrls = obterDocumentosInteligente(propostaDetalhada, "titular")
      const pdfUrl = propostaDetalhada.pdf_url

      const documentosDependentes = {}
      dependentes.forEach((dep, index) => {
        const docsDependendente = obterDocumentosInteligente(dep, "dependente")
        Object.entries(docsDependendente).forEach(([tipo, url]) => {
          documentosDependentes[`dependente_${index + 1}_${tipo}`] = url
        })
      })

      const todosDocumentos = { ...documentosUrls, ...documentosDependentes }

      if (!pdfUrl && Object.keys(todosDocumentos).length === 0) {
        toast.error("Nenhum documento disponível para download")
        return
      }

      await downloadPropostaComDocumentos(propostaDetalhada.id, nomeCliente, todosDocumentos, pdfUrl)
      toast.success("Download ZIP iniciado com sucesso!")
    } catch (error) {
      console.error("❌ Erro ao baixar ZIP:", error)
      toast.error("Erro ao gerar arquivo ZIP: " + error.message)
    } finally {
      setDownloadingZip(false)
    }
  }

  async function gerarPDFCompletoAction() {
    if (!propostaDetalhada) return

    try {
      setGeneratingPdf(true)
      const nomeCliente = obterNomeCliente(propostaDetalhada)
      const documentosUrls = obterDocumentosInteligente(propostaDetalhada, "titular")
      const pdfUrl = propostaDetalhada.pdf_url

      if (!pdfUrl) {
        toast.error("PDF da proposta não disponível")
        return
      }

      let pdfBlob
      try {
        pdfBlob = await gerarPDFCompleto(propostaDetalhada.id, nomeCliente, documentosUrls, pdfUrl)
      } catch (error) {
        console.warn("⚠️ Falha na geração completa, tentando PDF simples...")
        pdfBlob = await gerarPDFSimples(propostaDetalhada.id, nomeCliente, documentosUrls, pdfUrl)
      }

      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Proposta_Completa_${nomeCliente.replace(/[^a-zA-Z0-9]/g, "_")}_${obterIdSeguro(propostaDetalhada).substring(0, 8)}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("PDF completo gerado com sucesso!")
    } catch (error) {
      console.error("❌ Erro ao gerar PDF completo:", error)
      toast.error("Erro ao gerar PDF completo: " + error.message)
    } finally {
      setGeneratingPdf(false)
    }
  }

  async function aprovarProposta(id) {
    try {
      await atualizarStatusProposta(id, "aprovada")

      // Buscar dados da proposta para enviar email ao corretor
      const proposta = propostas.find((p) => p.id === id)
      if (proposta && proposta.origem === "propostas_corretores" && proposta.corretor_email) {
        const { enviarEmailPropostaAprovada } = await import("@/services/email-service")

        try {
          await enviarEmailPropostaAprovada(
            proposta.corretor_email,
            proposta.corretor_nome || "Corretor",
            obterNomeCliente(proposta),
            String(proposta.id),
            obterValorProposta(proposta),
            proposta.comissao || 0,
          )
          console.log("✅ Email de aprovação enviado ao corretor")
        } catch (emailError) {
          console.warn("⚠️ Erro ao enviar email ao corretor:", emailError)
          // Não falhar a aprovação por causa do email
        }
      }

      toast.success("Proposta aprovada com sucesso")
      carregarPropostas()
    } catch (error) {
      console.error("Erro ao aprovar proposta:", error)
      toast.error("Erro ao aprovar proposta")
    }
  }

  async function rejeitarProposta() {
    if (!propostaDetalhada) return

    try {
      await atualizarStatusProposta(propostaDetalhada.id, "rejeitada", motivoRejeicao)

      // Enviar email ao corretor se for proposta de corretor
      if (propostaDetalhada.origem === "propostas_corretores" && propostaDetalhada.corretor_email) {
        const { enviarEmailPropostaRejeitada } = await import("@/services/email-service")

        try {
          await enviarEmailPropostaRejeitada(
            propostaDetalhada.corretor_email,
            propostaDetalhada.corretor_nome || "Corretor",
            obterNomeCliente(propostaDetalhada),
            String(propostaDetalhada.id),
            motivoRejeicao,
          )
          console.log("✅ Email de rejeição enviado ao corretor")
        } catch (emailError) {
          console.warn("⚠️ Erro ao enviar email ao corretor:", emailError)
          // Não falhar a rejeição por causa do email
        }
      }

      toast.success("Proposta rejeitada com sucesso")
      setShowModalRejeicao(false)
      setMotivoRejeicao("")
      setPropostaDetalhada(null)
      carregarPropostas()
    } catch (error) {
      console.error("Erro ao rejeitar proposta:", error)
      toast.error("Erro ao rejeitar proposta")
    }
  }

  async function enviarEmailValidacao(proposta) {
    try {
      if (!proposta.id) {
        throw new Error("Proposta sem ID")
      }

      const emailCliente = obterEmailCliente(proposta)
      const nomeCliente = obterNomeCliente(proposta)

      if (!emailCliente || emailCliente === "Email não informado") {
        throw new Error("Proposta sem email válido")
      }

      setEnviandoEmail(proposta.id)

      const sucesso = await enviarValidacaoEmail(proposta.id, emailCliente, nomeCliente)

      if (sucesso) {
        toast.success("Email de validação enviado com sucesso!")
        carregarPropostas()
      } else {
        throw new Error("Falha no envio do email")
      }
    } catch (error) {
      console.error("❌ Erro completo:", error)
      toast.error(error.message || "Erro ao enviar email de validação")
    } finally {
      setEnviandoEmail(null)
    }
  }

  function abrirModalRejeicao(proposta) {
    setPropostaDetalhada(proposta)
    setShowModalRejeicao(true)
  }

  async function abrirModalDetalhes(proposta) {
    setPropostaDetalhada(proposta)
    setShowModalDetalhes(true)
    await carregarDetalhesCompletos(proposta)
  }

  function getStatusBadge(status) {
    const statusConfig = {
      parcial: { label: "Aguardando Validação", color: "bg-blue-50 text-blue-700 border border-blue-200" },
      aguardando_cliente: {
        label: "Aguardando Cliente",
        color: "bg-yellow-50 text-yellow-700 border border-yellow-200",
      },
      pendente: { label: "Aguardando Análise", color: "bg-amber-50 text-amber-700 border border-amber-200" },
      aprovada: { label: "Aprovada", color: "bg-green-50 text-green-700 border border-green-200" },
      rejeitada: { label: "Rejeitada", color: "bg-red-50 text-red-700 border border-red-200" },
    }

    return statusConfig[status] || { label: status, color: "bg-gray-50 text-gray-700 border border-gray-200" }
  }

  function getOrigemBadge(origem) {
    const origemConfig = {
      propostas: { label: "Cliente Direto", color: "bg-slate-50 text-slate-700 border border-slate-200" },
      propostas_corretores: { label: "Via Corretor", color: "bg-gray-50 text-gray-700 border border-gray-200" },
    }

    return origemConfig[origem] || { label: origem, color: "bg-gray-50 text-gray-700 border border-gray-200" }
  }

  function obterIdSeguro(proposta) {
    if (!proposta || !proposta.id) return "N/A"
    return String(proposta.id)
  }

  function getTipoArquivo(url) {
    const extensao = url.split(".").pop()?.toLowerCase()
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extensao)) {
      return "imagem"
    } else if (extensao === "pdf") {
      return "pdf"
    }
    return "documento"
  }

  function getNomeDocumento(key) {
    const nomes = {
      rg_frente: "RG (Frente)",
      rg_verso: "RG (Verso)",
      cpf: "CPF",
      comprovante_residencia: "Comprovante de Residência",
      cns: "Cartão Nacional de Saúde",
      foto_3x4: "Foto 3x4",
      certidao_nascimento: "Certidão de Nascimento",
      comprovante_renda: "Comprovante de Renda",
    }
    return nomes[key] || key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  function getParentescoAmigavel(parentesco) {
    const parentescos = {
      conjuge: "Cônjuge",
      filho: "Filho(a)",
      pai: "Pai",
      mae: "Mãe",
      irmao: "Irmão(ã)",
      sogro: "Sogro(a)",
      genro: "Genro/Nora",
      neto: "Neto(a)",
      outro: "Outro",
    }
    return parentescos[parentesco] || parentesco
  }

  function calcularIdade(dataNascimento) {
    if (!dataNascimento) return "N/A"
    const hoje = new Date()
    const nascimento = new Date(dataNascimento)
    let idade = hoje.getFullYear() - nascimento.getFullYear()
    const mes = hoje.getMonth() - nascimento.getMonth()
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--
    }
    return `${idade} anos`
  }

  function formatarDataSegura(dataString) {
    if (!dataString) return "N/A"

    try {
      const data = new Date(dataString)
      if (isNaN(data.getTime())) {
        return "Data inválida"
      }

      return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (error) {
      return "Erro na data"
    }
  }

  function formatarHoraSegura(dataString) {
    if (!dataString) return "N/A"

    try {
      const data = new Date(dataString)
      if (isNaN(data.getTime())) {
        return "Hora inválida"
      }

      return data.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return "Erro na hora"
    }
  }

  function formatarDataHoraSegura(dataString) {
    if (!dataString) return "N/A"

    try {
      const data = new Date(dataString)
      if (isNaN(data.getTime())) {
        return "Data inválida"
      }

      return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (error) {
      return "Erro na data"
    }
  }

  const propostasFiltradas = propostas.filter((proposta) => {
    const nomeCliente = obterNomeCliente(proposta).toLowerCase()
    const emailCliente = obterEmailCliente(proposta).toLowerCase()
    const matchesFiltro = nomeCliente.includes(filtro.toLowerCase()) || emailCliente.includes(filtro.toLowerCase())
    const matchesStatus = statusFiltro === "todos" || proposta.status === statusFiltro
    const matchesOrigem = origemFiltro === "todas" || proposta.origem === origemFiltro

    return matchesFiltro && matchesStatus && matchesOrigem
  })

  // Cálculos de paginação
  const totalItens = propostasFiltradas.length
  const totalPaginas = Math.ceil(totalItens / itensPorPagina)
  const indiceInicio = (paginaAtual - 1) * itensPorPagina
  const indiceFim = indiceInicio + itensPorPagina
  const propostasExibidas = propostasFiltradas.slice(indiceInicio, indiceFim)

  // Reset da página quando filtros mudam
  useEffect(() => {
    setPaginaAtual(1)
  }, [filtro, statusFiltro, origemFiltro])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Propostas</h1>
        <button
          onClick={carregarPropostas}
          className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          Atualizar Lista
        </button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-xl font-bold text-gray-900">{propostas.length}</div>
          <div className="text-xs text-gray-600">Total de Propostas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-xl font-bold text-blue-700">
            {propostas.filter((p) => p.status === "parcial").length}
          </div>
          <div className="text-xs text-gray-600">Aguardando Validação</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-xl font-bold text-amber-700">
            {propostas.filter((p) => p.status === "pendente").length}
          </div>
          <div className="text-xs text-gray-600">Aguardando Análise</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-xl font-bold text-gray-700">
            {propostas.filter((p) => p.origem === "propostas").length}
          </div>
          <div className="text-xs text-gray-600">Clientes Diretos</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-xl font-bold text-gray-700">
            {propostas.filter((p) => p.origem === "propostas_corretores").length}
          </div>
          <div className="text-xs text-gray-600">Via Corretores</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-3 rounded-lg shadow border border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Nome ou email..."
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="todos">Todos</option>
              <option value="parcial">Aguardando Validação</option>
              <option value="aguardando_cliente">Aguardando Cliente</option>
              <option value="pendente">Aguardando Análise</option>
              <option value="aprovada">Aprovada</option>
              <option value="rejeitada">Rejeitada</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Origem</label>
            <select
              value={origemFiltro}
              onChange={(e) => setOrigemFiltro(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="todas">Todas</option>
              <option value="propostas">Clientes Diretos</option>
              <option value="propostas_corretores">Via Corretores</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Propostas */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Lista de Propostas</h2>
            <div className="text-sm text-gray-600">
              Mostrando {indiceInicio + 1}-{Math.min(indiceFim, totalItens)} de {totalItens} propostas
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origem/Status
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor/Data
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {propostasExibidas.map((proposta) => {
                const statusConfig = getStatusBadge(proposta.status)
                const origemConfig = getOrigemBadge(proposta.origem)
                return (
                  <tr key={`${proposta.origem}-${proposta.id}`} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900" title={obterNomeCliente(proposta)}>
                        {obterNomeCliente(proposta)}
                      </div>
                      <div className="text-xs text-gray-500">ID: {obterIdSeguro(proposta)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs text-gray-900" title={obterEmailCliente(proposta)}>
                        {obterEmailCliente(proposta)}
                      </div>
                      <div className="text-xs text-gray-500" title={obterTelefoneCliente(proposta)}>
                        {obterTelefoneCliente(proposta)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${origemConfig.color}`}
                        >
                          {origemConfig.label}
                        </span>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusConfig.color}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500" title={proposta.corretor_nome || "Proposta Direta"}>
                        {proposta.corretor_nome || "Proposta Direta"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        R$ {obterValorProposta(proposta).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-gray-500">{formatarDataSegura(proposta.created_at)}</div>
                      <div className="text-xs text-gray-500">{formatarHoraSegura(proposta.created_at)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => abrirModalDetalhes(proposta)}
                          className="text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs transition-colors"
                        >
                          Ver
                        </button>

                        {proposta.status === "parcial" && (
                          <button
                            onClick={() => enviarEmailValidacao(proposta)}
                            disabled={enviandoEmail === proposta.id}
                            className="text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded disabled:opacity-50 transition-colors text-xs"
                          >
                            {enviandoEmail === proposta.id ? "..." : "Email"}
                          </button>
                        )}

                        {proposta.status === "pendente" && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => aprovarProposta(proposta.id)}
                              className="text-green-700 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors text-xs flex-1"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => abrirModalRejeicao(proposta)}
                              className="text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors text-xs flex-1"
                            >
                              ✗
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {propostasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">Nenhuma proposta encontrada</div>
            <div className="text-gray-400 text-sm mt-2">
              {filtro || statusFiltro !== "todos" || origemFiltro !== "todas"
                ? "Tente ajustar os filtros de busca"
                : "Aguardando novas propostas"}
            </div>
          </div>
        )}

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
      </div>

      {/* Modal de Detalhes */}
      {showModalDetalhes && propostaDetalhada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-300">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-2xl font-bold text-gray-900">Detalhes da Proposta</h2>
                <div className="flex gap-3">
                  {propostaDetalhada.pdf_url && (
                    <button
                      onClick={gerarPDFCompletoAction}
                      disabled={generatingPdf}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {generatingPdf ? "Gerando PDF..." : "Baixar PDF Completo"}
                    </button>
                  )}
                  <button
                    onClick={baixarTudoZip}
                    disabled={downloadingZip}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {downloadingZip ? "Gerando ZIP..." : "Baixar Tudo (ZIP)"}
                  </button>
                  <button
                    onClick={() => setShowModalDetalhes(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              {loadingDetalhes ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-600"></div>
                  <span className="ml-4 text-lg text-gray-700">Carregando detalhes...</span>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* 1. Dados do Titular */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 border-b border-gray-200 pb-2">
                      Dados do Titular
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Nome Completo</label>
                        <p className="text-gray-900 font-medium">{obterNomeCliente(propostaDetalhada)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Email</label>
                        <p className="text-gray-900">{obterEmailCliente(propostaDetalhada)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Telefone</label>
                        <p className="text-gray-900">{obterTelefoneCliente(propostaDetalhada)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">CPF</label>
                        <p className="text-gray-900">{propostaDetalhada.cpf || "Não informado"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Data de Nascimento</label>
                        <p className="text-gray-900">
                          {propostaDetalhada.data_nascimento
                            ? formatarDataSegura(propostaDetalhada.data_nascimento)
                            : "Não informado"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Sexo</label>
                        <p className="text-gray-900">{propostaDetalhada.sexo || "Não informado"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Estado Civil</label>
                        <p className="text-gray-900">{propostaDetalhada.estado_civil || "Não informado"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Profissão</label>
                        <p className="text-gray-900">{propostaDetalhada.profissao || "Não informado"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Renda</label>
                        <p className="text-gray-900">
                          {propostaDetalhada.renda
                            ? `R$ ${Number(propostaDetalhada.renda).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                            : "Não informado"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Endereço */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 border-b border-gray-200 pb-2">Endereço</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-600">Logradouro</label>
                        <p className="text-gray-900">
                          {propostaDetalhada.endereco || "Não informado"}
                          {propostaDetalhada.numero && `, ${propostaDetalhada.numero}`}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Complemento</label>
                        <p className="text-gray-900">{propostaDetalhada.complemento || "Não informado"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Bairro</label>
                        <p className="text-gray-900">{propostaDetalhada.bairro || "Não informado"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Cidade</label>
                        <p className="text-gray-900">{propostaDetalhada.cidade || "Não informado"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Estado</label>
                        <p className="text-gray-900">
                          {propostaDetalhada.estado || propostaDetalhada.uf || "Não informado"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">CEP</label>
                        <p className="text-gray-900">{propostaDetalhada.cep || "Não informado"}</p>
                      </div>
                    </div>
                  </div>

                  {/* 3. Informações do Plano */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 border-b border-gray-200 pb-2">
                      Informações do Plano
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Produto</label>
                        <p className="text-gray-900 font-medium">
                          {propostaDetalhada.produto_nome || propostaDetalhada.produto || "Não informado"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Plano</label>
                        <p className="text-gray-900">
                          {propostaDetalhada.plano_nome || propostaDetalhada.sigla_plano || "Não informado"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Cobertura</label>
                        <p className="text-gray-900">{propostaDetalhada.cobertura || "Não informado"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Acomodação</label>
                        <p className="text-gray-900">{propostaDetalhada.acomodacao || "Não informado"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Valor Mensal</label>
                        <p className="text-2xl font-bold text-green-600">
                          R${" "}
                          {obterValorProposta(propostaDetalhada).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Tem Dependentes</label>
                        <p className="text-gray-900">
                          {propostaDetalhada.tem_dependentes ? "Sim" : "Não"}
                          {dependentes.length > 0 &&
                            ` (${dependentes.length} dependente${dependentes.length > 1 ? "s" : ""})`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 4. Status da Proposta */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 border-b border-gray-200 pb-2">
                      Status da Proposta
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Status Atual</label>
                        <span
                          className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(propostaDetalhada.status).color}`}
                        >
                          {getStatusBadge(propostaDetalhada.status).label}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Origem</label>
                        <span
                          className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getOrigemBadge(propostaDetalhada.origem).color}`}
                        >
                          {getOrigemBadge(propostaDetalhada.origem).label}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Data de Criação</label>
                        <p className="text-gray-900">{formatarDataSegura(propostaDetalhada.created_at)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Corretor Responsável</label>
                        <p className="text-gray-900">{propostaDetalhada.corretor_nome || "Proposta Direta"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Email Enviado</label>
                        <p className="text-gray-900">
                          {propostaDetalhada.email_validacao_enviado ? "Sim" : "Não"}
                          {propostaDetalhada.email_enviado_em &&
                            ` - ${formatarDataSegura(propostaDetalhada.email_enviado_em)}`}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Última Atualização</label>
                        <p className="text-gray-900">
                          {formatarDataSegura(propostaDetalhada.updated_at || propostaDetalhada.created_at)}
                        </p>
                      </div>
                    </div>
                    {propostaDetalhada.motivo_rejeicao && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <label className="block text-sm font-medium text-red-700">Motivo da Rejeição</label>
                        <p className="text-red-900 mt-1">{propostaDetalhada.motivo_rejeicao}</p>
                      </div>
                    )}
                  </div>

                  {/* Resto do modal continua igual... */}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rejeição */}
      {showModalRejeicao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 border border-gray-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Rejeitar Proposta</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Motivo da rejeição:</label>
              <textarea
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                rows={4}
                placeholder="Descreva o motivo da rejeição..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowModalRejeicao(false)
                  setMotivoRejeicao("")
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={rejeitarProposta}
                disabled={!motivoRejeicao.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
