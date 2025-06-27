"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { PDFService } from "@/services/pdf-service"
import { PropostaHTMLService } from "@/services/proposta-html-service"
import { supabase } from "@/lib/supabase"
import { FileText, AlertCircle, RefreshCw, Info } from "lucide-react"
import { obterProposta } from "@/services/propostas-digital-service"
import { obterModeloProposta } from "@/services/proposta-modelos-service"

interface PDFGeneratorProps {
  propostaId: string | null
  onPDFGenerated?: (pdfUrl: string) => void
}

export function PDFGenerator({ propostaId, onPDFGenerated }: PDFGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [htmlLoading, setHtmlLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [proposta, setProposta] = useState<any>(null)
  const [dependentes, setDependentes] = useState<any[]>([])
  const [questionario, setQuestionario] = useState<any[]>([])
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"html" | "pdf">("html")
  const [htmlError, setHtmlError] = useState<string | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [modeloProposta, setModeloProposta] = useState<any>(null)
  const [modeloError, setModeloError] = useState<string | null>(null)

  const carregarDadosProposta = useCallback(async () => {
    if (!propostaId) {
      setError("ID da proposta não fornecido")
      return
    }

    try {
      setLoading(true)
      setError(null)
      setHtmlError(null)
      setPdfError(null)
      setModeloError(null)

      console.log("Carregando dados da proposta:", propostaId)

      // Carregar dados da proposta
      const proposta = await obterProposta(propostaId)

      if (!proposta) {
        throw new Error("Proposta não encontrada")
      }

      console.log("Proposta carregada:", proposta)
      setProposta(proposta)

      // Verificar se já existe uma URL de PDF
      if (proposta.pdf_url) {
        console.log("PDF já existe:", proposta.pdf_url)
        setPdfUrl(proposta.pdf_url)
      }

      // Verificar se a proposta tem modelo_id (campo no banco de dados)
      // ou template_id (campo usado no frontend)
      const templateId = proposta.modelo_id || proposta.template_id

      // Carregar modelo da proposta
      if (templateId) {
        try {
          console.log("Buscando modelo de proposta com ID:", templateId)
          const modelo = await obterModeloProposta(templateId)

          if (modelo) {
            console.log("Modelo de proposta carregado:", modelo)
            setModeloProposta(modelo)

            // Verificar se o modelo tem URL de arquivo
            if (!modelo.arquivo_url) {
              setModeloError("O modelo de proposta não possui URL de arquivo definida")
              console.error("Modelo sem URL de arquivo:", modelo)
            } else {
              console.log("URL do arquivo do modelo:", modelo.arquivo_url)

              // Verificar se é o modelo TEST1 e corrigir a URL se necessário
              if (
                modelo.titulo &&
                modelo.titulo.includes("TEST1") &&
                !modelo.arquivo_url.includes("PROPOSTA%20TEST1.pdf")
              ) {
                console.log("Corrigindo URL para o modelo TEST1")
                modelo.arquivo_url =
                  "https://jtzbuxoslaotpnwsphqv.supabase.co/storage/v1/object/public/modelos/PROPOSTA%20TEST1.pdf"
              }
            }
          } else {
            console.warn("Modelo de proposta não encontrado, buscando todos os modelos ativos")
            setModeloError("Modelo de proposta não encontrado com o ID especificado")

            // Buscar modelos ativos
            const { data: modelos } = await supabase.from("modelos_propostas").select("*").eq("ativo", true)

            if (modelos && modelos.length > 0) {
              console.log(`Encontrados ${modelos.length} modelos ativos, usando o primeiro`)

              // Verificar se há um modelo TEST1 e priorizá-lo
              const modeloTEST1 = modelos.find((m) => m.titulo && m.titulo.includes("TEST1"))
              if (modeloTEST1) {
                console.log("Encontrado modelo TEST1, usando-o como prioridade")
                setModeloProposta(modeloTEST1)

                // Corrigir URL se necessário
                if (!modeloTEST1.arquivo_url.includes("PROPOSTA%20TEST1.pdf")) {
                  console.log("Corrigindo URL para o modelo TEST1")
                  modeloTEST1.arquivo_url =
                    "https://jtzbuxoslaotpnwsphqv.supabase.co/storage/v1/object/public/modelos/PROPOSTA%20TEST1.pdf"
                }
              } else {
                console.log("Usando o primeiro modelo ativo encontrado")
                setModeloProposta(modelos[0])
              }
            } else {
              console.error("Nenhum modelo de proposta ativo encontrado")
              setModeloError("Nenhum modelo de proposta ativo encontrado no sistema")
            }
          }
        } catch (modeloError) {
          console.error("Erro ao carregar modelo de proposta:", modeloError)
          setModeloError(`Erro ao carregar modelo de proposta: ${modeloError.message || "Erro desconhecido"}`)
        }
      } else {
        console.warn("Proposta sem modelo_id/template_id. Buscando modelos ativos...")

        // Buscar modelos ativos
        const { data: modelos } = await supabase.from("modelos_propostas").select("*").eq("ativo", true)

        if (modelos && modelos.length > 0) {
          console.log(`Encontrados ${modelos.length} modelos ativos, usando o primeiro`)

          // Verificar se há um modelo TEST1 e priorizá-lo
          const modeloTEST1 = modelos.find((m) => m.titulo && m.titulo.includes("TEST1"))
          if (modeloTEST1) {
            console.log("Encontrado modelo TEST1, usando-o como prioridade")
            setModeloProposta(modeloTEST1)

            // Corrigir URL se necessário
            if (!modeloTEST1.arquivo_url.includes("PROPOSTA%20TEST1.pdf")) {
              console.log("Corrigindo URL para o modelo TEST1")
              modeloTEST1.arquivo_url =
                "https://jtzbuxoslaotpnwsphqv.supabase.co/storage/v1/object/public/modelos/PROPOSTA%20TEST1.pdf"
            }
          } else {
            console.log("Usando o primeiro modelo ativo encontrado")
            setModeloProposta(modelos[0])
          }
        } else {
          console.error("Nenhum modelo de proposta ativo encontrado")
          setModeloError("Nenhum modelo de proposta ativo encontrado no sistema")
        }
      }

      // Carregar dependentes
      const { data: dependentesData, error: dependentesError } = await supabase
        .from("dependentes")
        .select("*")
        .eq("proposta_id", propostaId)
        .order("created_at", { ascending: true })

      if (dependentesError) {
        console.error("Erro ao carregar dependentes:", dependentesError)
      } else {
        console.log("Dependentes carregados:", dependentesData?.length || 0)
        setDependentes(dependentesData || [])
      }

      // Carregar questionário de saúde
      const { data: questionarioData, error: questionarioError } = await supabase
        .from("questionario_saude")
        .select("*")
        .eq("proposta_id", propostaId)
        .order("pergunta_id", { ascending: true })

      if (questionarioError) {
        console.error("Erro ao carregar questionário:", questionarioError)
      } else {
        console.log("Questionário carregado:", questionarioData?.length || 0)
        setQuestionario(questionarioData || [])
      }

      // Gerar HTML da proposta
      await gerarHTML(proposta, dependentesData || [], questionarioData || [])
    } catch (error) {
      console.error("Erro ao carregar dados da proposta:", error)
      setError(`Não foi possível carregar os dados da proposta: ${error.message || "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }, [propostaId])

  const gerarHTML = async (propostaData, dependentesData, questionarioData) => {
    try {
      setHtmlLoading(true)
      setHtmlError(null)

      console.log("Gerando HTML da proposta")

      // Verificar se temos todos os dados necessários
      if (!propostaData) {
        throw new Error("Dados da proposta não disponíveis para gerar HTML")
      }

      // Gerar HTML usando o serviço
      const html = PropostaHTMLService.generatePropostaHTML(propostaData, dependentesData, questionarioData, false)

      if (!html) {
        throw new Error("Falha ao gerar HTML da proposta")
      }

      console.log("HTML gerado com sucesso")
      setHtmlContent(html)
      return html
    } catch (error) {
      console.error("Erro ao gerar HTML:", error)
      setHtmlError(`Não foi possível gerar a visualização HTML: ${error.message || "Erro desconhecido"}`)
      return null
    } finally {
      setHtmlLoading(false)
    }
  }

  const gerarPDF = async () => {
    if (!propostaId) {
      setPdfError("ID da proposta não fornecido")
      return
    }

    try {
      setPdfLoading(true)
      setPdfError(null)

      console.log("Iniciando geração de PDF")

      if (!proposta) {
        throw new Error("Dados da proposta não disponíveis")
      }

      // Verificar se temos o modelo de proposta
      if (!modeloProposta || !modeloProposta.arquivo_url) {
        const errorMsg = !modeloProposta
          ? "Modelo de proposta não disponível"
          : "Modelo de proposta não possui URL de arquivo"

        console.error(errorMsg, modeloProposta)
        throw new Error(errorMsg)
      }

      console.log("Usando modelo de proposta:", modeloProposta.titulo, modeloProposta.arquivo_url)

      // Preparar os dados para preencher o PDF
      const dadosParaPreenchimento = prepararDadosParaPreenchimento(proposta, dependentes, questionario)

      // Gerar o nome do arquivo
      const fileName = `proposta_${propostaId}_${proposta.nome_cliente?.replace(/\s+/g, "_") || propostaId}`

      // Preencher o modelo de PDF com os dados
      console.log("Preenchendo modelo de PDF com dados do formulário")

      let pdfUrl
      try {
        pdfUrl = await PDFService.fillPDFTemplate(modeloProposta.arquivo_url, dadosParaPreenchimento, fileName)
      } catch (pdfError) {
        console.error("Erro ao preencher modelo PDF, tentando URL alternativa:", pdfError)

        // Se o modelo for TEST1 e a URL estiver errada, tentar com a URL correta
        if (modeloProposta.titulo && modeloProposta.titulo.includes("TEST1")) {
          const urlCorreta =
            "https://jtzbuxoslaotpnwsphqv.supabase.co/storage/v1/object/public/modelos/PROPOSTA%20TEST1.pdf"
          console.log("Tentando com URL correta para TEST1:", urlCorreta)

          try {
            pdfUrl = await PDFService.fillPDFTemplate(urlCorreta, dadosParaPreenchimento, fileName)
          } catch (alternativeError) {
            console.error("Erro ao usar URL alternativa:", alternativeError)
            throw pdfError // Lançar o erro original
          }
        } else {
          throw pdfError
        }
      }

      if (!pdfUrl) {
        throw new Error("Falha ao gerar URL do PDF")
      }

      console.log("PDF gerado com sucesso:", pdfUrl)

      // Atualizar a URL do PDF na proposta
      const { error: updateError } = await supabase.from("propostas").update({ pdf_url: pdfUrl }).eq("id", propostaId)

      if (updateError) {
        console.error("Erro ao atualizar URL do PDF na proposta:", updateError)
        // Não falhar completamente se apenas a atualização falhar
      }

      setPdfUrl(pdfUrl)

      // Notificar o componente pai
      if (onPDFGenerated) {
        onPDFGenerated(pdfUrl)
      }

      return pdfUrl
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      setPdfError(`Não foi possível gerar o PDF: ${error.message || "Erro desconhecido"}`)
      return null
    } finally {
      setPdfLoading(false)
    }
  }

  // Função para preparar os dados para preenchimento do PDF
  const prepararDadosParaPreenchimento = (proposta, dependentes, questionario) => {
    // Objeto para armazenar os dados formatados para o PDF
    const dadosPDF = {
      // Dados básicos da proposta
      nome: proposta.nome_cliente || proposta.nome || "",
      cpf: proposta.cpf || "",
      rg: proposta.rg || "",
      data_nascimento: formatarData(proposta.data_nascimento),
      email: proposta.email || "",
      telefone: proposta.telefone || "",
      celular: proposta.celular || "",

      // Campos adicionais do titular
      nome_mae: proposta.nome_mae || "",
      sexo: proposta.sexo || "",
      estado_civil: proposta.estado_civil || "",
      naturalidade: proposta.naturalidade || "",

      // Outros campos que podem estar no formulário
      nome_pai: proposta.nome_pai || "",
      nacionalidade: proposta.nacionalidade || "",
      profissao: proposta.profissao || "",
      orgao_expedidor: proposta.orgao_expedidor || "",
      uf_nascimento: proposta.uf_nascimento || "",

      // Endereço
      endereco: proposta.endereco || "",
      bairro: proposta.bairro || "",
      cidade: proposta.cidade || "",
      estado: proposta.estado || "",
      cep: proposta.cep || "",

      // Dados do plano
      plano: proposta.codigo_plano || proposta.sigla_plano || "",
      cobertura: proposta.tipo_cobertura || proposta.cobertura || "",
      acomodacao: proposta.tipo_acomodacao || proposta.acomodacao || "",
      valor: formatarMoeda(proposta.valor_plano || proposta.valor),

      // Dados físicos
      peso: proposta.peso || "",
      altura: proposta.altura || "",

      // Dados do corretor
      corretor_nome: proposta.corretor_nome || "",
      corretor_codigo: proposta.corretor_codigo || "",

      // Data de criação
      data_criacao: formatarData(proposta.created_at),
      data_atualizacao: formatarData(proposta.updated_at),
    }

    // Adicionar dependentes (até 5)
    if (dependentes && dependentes.length > 0) {
      dependentes.slice(0, 5).forEach((dep, index) => {
        const prefixo = `dependente${index + 1}_`
        dadosPDF[`${prefixo}nome`] = dep.nome || ""
        dadosPDF[`${prefixo}cpf`] = dep.cpf || ""
        dadosPDF[`${prefixo}data_nascimento`] = formatarData(dep.data_nascimento)
        dadosPDF[`${prefixo}parentesco`] = dep.parentesco || ""
        dadosPDF[`${prefixo}rg`] = dep.rg || ""
        dadosPDF[`${prefixo}cns`] = dep.cns || ""

        // Campos adicionais para dependentes
        dadosPDF[`${prefixo}sexo`] = dep.sexo || ""
        dadosPDF[`${prefixo}estado_civil`] = dep.estado_civil || ""
        dadosPDF[`${prefixo}naturalidade`] = dep.naturalidade || ""
      })
    }

    // Adicionar respostas do questionário
    if (questionario && questionario.length > 0) {
      questionario.forEach((q, index) => {
        dadosPDF[`pergunta${index + 1}`] = q.pergunta || ""
        dadosPDF[`resposta${index + 1}`] = q.resposta || ""
        if (q.observacao) {
          dadosPDF[`observacao${index + 1}`] = q.observacao
        }
      })
    }

    console.log("Dados preparados para preenchimento do PDF:", dadosPDF)
    return dadosPDF
  }

  // Adicionar esta função após a função prepararDadosParaPreenchimento
  const forcarGeracaoPDF = async () => {
    if (!propostaId) {
      setPdfError("ID da proposta não fornecido")
      return null
    }

    try {
      setPdfLoading(true)
      setPdfError(null)

      console.log("🔄 Forçando geração de PDF...")

      if (!proposta) {
        throw new Error("Dados da proposta não disponíveis")
      }

      // Verificar se temos o modelo de proposta
      if (!modeloProposta || !modeloProposta.arquivo_url) {
        const errorMsg = !modeloProposta
          ? "Modelo de proposta não disponível"
          : "Modelo de proposta não possui URL de arquivo"

        console.error(errorMsg, modeloProposta)
        throw new Error(errorMsg)
      }

      console.log("Usando modelo de proposta:", modeloProposta.titulo, modeloProposta.arquivo_url)

      // Preparar os dados para preencher o PDF
      const dadosParaPreenchimento = prepararDadosParaPreenchimento(proposta, dependentes, questionario)

      // Gerar o nome do arquivo
      const fileName = `proposta_${propostaId}_${proposta.nome_cliente?.replace(/\s+/g, "_") || propostaId}`

      // Preencher o modelo de PDF com os dados
      console.log("Preenchendo modelo de PDF com dados do formulário")

      let pdfUrl
      try {
        pdfUrl = await PDFService.fillPDFTemplate(modeloProposta.arquivo_url, dadosParaPreenchimento, fileName)
      } catch (pdfError) {
        console.error("Erro ao preencher modelo PDF, tentando URL alternativa:", pdfError)

        // Se o modelo for TEST1 e a URL estiver errada, tentar com a URL correta
        if (modeloProposta.titulo && modeloProposta.titulo.includes("TEST1")) {
          const urlCorreta =
            "https://jtzbuxoslaotpnwsphqv.supabase.co/storage/v1/object/public/modelos/PROPOSTA%20TEST1.pdf"
          console.log("Tentando com URL correta para TEST1:", urlCorreta)

          try {
            pdfUrl = await PDFService.fillPDFTemplate(urlCorreta, dadosParaPreenchimento, fileName)
          } catch (alternativeError) {
            console.error("Erro ao usar URL alternativa:", alternativeError)
            throw pdfError // Lançar o erro original
          }
        } else {
          throw pdfError
        }
      }

      if (!pdfUrl) {
        throw new Error("Falha ao gerar URL do PDF")
      }

      console.log("PDF gerado com sucesso:", pdfUrl)

      // Atualizar a URL do PDF na proposta
      const { error: updateError } = await supabase.from("propostas").update({ pdf_url: pdfUrl }).eq("id", propostaId)

      if (updateError) {
        console.error("Erro ao atualizar URL do PDF na proposta:", updateError)
        // Não falhar completamente se apenas a atualização falhar
      }

      setPdfUrl(pdfUrl)

      // Notificar o componente pai
      if (onPDFGenerated) {
        onPDFGenerated(pdfUrl)
      }

      return pdfUrl
    } catch (error) {
      console.error("Erro ao forçar geração de PDF:", error)
      setPdfError(`Não foi possível gerar o PDF: ${error.message || "Erro desconhecido"}`)
      return null
    } finally {
      setPdfLoading(false)
    }
  }

  // Expor a função para uso externo
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.forcarGeracaoPDF = forcarGeracaoPDF
    }
  }, [])

  // Funções auxiliares para formatação
  const formatarData = (dataString) => {
    if (!dataString) return ""
    try {
      const data = new Date(dataString)
      return data.toLocaleDateString("pt-BR")
    } catch (e) {
      return dataString
    }
  }

  const formatarMoeda = (valor) => {
    if (!valor) return ""
    try {
      return typeof valor === "number" ? valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : valor
    } catch (e) {
      return valor
    }
  }

  // Função pública para forçar geração do PDF (pode ser chamada externamente)
  const handleForceGeneratePDF = useCallback(async () => {
    return await forcarGeracaoPDF()
  }, [forcarGeracaoPDF])

  // Expor a função através de uma ref ou callback
  useEffect(() => {
    if (onPDFGenerated && typeof onPDFGenerated === "function") {
      // Adicionar a função de força geração como propriedade
      onPDFGenerated.forceGenerate = handleForceGeneratePDF
    }
  }, [onPDFGenerated, handleForceGeneratePDF])

  useEffect(() => {
    if (propostaId) {
      carregarDadosProposta()
    } else {
      setError("ID da proposta não fornecido")
    }
  }, [propostaId, carregarDadosProposta])

  // Quando o modo de visualização muda para PDF, gerar o PDF se necessário
  useEffect(() => {
    if (viewMode === "pdf" && !pdfUrl && !pdfLoading && modeloProposta && modeloProposta.arquivo_url) {
      gerarPDF().catch((err) => {
        console.error("Erro ao gerar PDF ao mudar para visualização PDF:", err)
      })
    }
  }, [viewMode, pdfUrl, pdfLoading, modeloProposta])

  // Componente para visualização HTML
  const HTMLViewer = ({ html }: { html: string }) => {
    if (!html) return null

    return (
      <div className="w-full">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    )
  }

  // Componente para visualização de erro
  const ErrorDisplay = ({ message, onRetry, isRetrying = false }) => (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4 text-center">
      <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
      <h3 className="text-lg font-medium text-red-800 mb-2">Erro</h3>
      <p className="text-red-700 mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} disabled={isRetrying} variant="outline" size="sm">
          {isRetrying ? (
            <>
              <Spinner className="h-4 w-4 mr-2" />
              Tentando novamente...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </>
          )}
        </Button>
      )}
    </div>
  )

  // Renderização quando não há ID de proposta
  if (!propostaId) {
    return <ErrorDisplay message="Não foi possível carregar a proposta. ID da proposta não fornecido." onRetry={null} />
  }

  // Renderização principal do componente
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <Spinner className="mb-4" />
        <p className="text-gray-500">Carregando dados da proposta...</p>
      </div>
    )
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={carregarDadosProposta} isRetrying={loading} />
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center mb-4 w-full">
        <div className="bg-gray-100 p-1 rounded-md">
          <button
            data-testid="html-button"
            onClick={() => setViewMode("html")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              viewMode === "html" ? "bg-white shadow-sm text-gray-800" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Pré-visualização HTML
          </button>
          <button
            data-testid="pdf-button"
            onClick={() => setViewMode("pdf")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              viewMode === "pdf" ? "bg-white shadow-sm text-gray-800" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Documento PDF
          </button>
        </div>
      </div>

      {modeloError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4 w-full">
          <div className="flex">
            <Info className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Problema com o modelo de proposta</h4>
              <p className="text-sm text-yellow-700 mt-1">{modeloError}</p>
            </div>
          </div>
        </div>
      )}

      {viewMode === "html" ? (
        <div className="w-full">
          {htmlLoading ? (
            <div className="flex flex-col items-center justify-center p-6">
              <Spinner className="mb-4" />
              <p className="text-gray-500">Gerando visualização HTML...</p>
            </div>
          ) : htmlError ? (
            <ErrorDisplay
              message={htmlError}
              onRetry={() => gerarHTML(proposta, dependentes, questionario)}
              isRetrying={htmlLoading}
            />
          ) : htmlContent ? (
            <HTMLViewer html={htmlContent} />
          ) : (
            <div className="text-center p-6">
              <p className="text-gray-500 mb-4">Não foi possível carregar a visualização HTML.</p>
              <Button onClick={() => gerarHTML(proposta, dependentes, questionario)} disabled={htmlLoading}>
                {htmlLoading ? (
                  <>
                    <Spinner className="h-4 w-4 mr-2" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Gerar Visualização HTML
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full">
          {pdfLoading ? (
            <div className="flex flex-col items-center justify-center p-6">
              <Spinner className="mb-4" />
              <p className="text-gray-500">Gerando documento PDF...</p>
              <p className="text-xs text-gray-400 mt-2">Isso pode levar alguns instantes</p>
            </div>
          ) : pdfError ? (
            <ErrorDisplay message={pdfError} onRetry={gerarPDF} isRetrying={pdfLoading} />
          ) : pdfUrl ? (
            <div className="w-full flex flex-col items-center">
              <iframe src={pdfUrl} className="w-full h-[70vh] border rounded-md" title="Documento PDF da Proposta" />
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {!modeloProposta || !modeloProposta.arquivo_url ? (
                <div className="text-center p-6">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Modelo de proposta não disponível</h3>
                  <p className="text-gray-500 mb-4">
                    Não foi possível encontrar um modelo de proposta válido para gerar o PDF.
                  </p>
                  <Button onClick={carregarDadosProposta} className="mt-2">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar novamente
                  </Button>
                </div>
              ) : (
                <Button onClick={gerarPDF} disabled={pdfLoading} className="bg-[#168979] hover:bg-[#13786a]">
                  {pdfLoading ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2" />
                      Gerando PDF...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Gerar Documento PDF
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
