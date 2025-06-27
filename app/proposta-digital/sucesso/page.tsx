"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { CheckCircle, Home, FileText, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function PropostaDigitalSucessoPage() {
  const [proposta, setProposta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pdfError, setPdfError] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  const propostaId = searchParams.get("id")

  useEffect(() => {
    async function fetchProposta() {
      if (!propostaId) {
        setError("ID da proposta não fornecido")
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        const { data, error } = await supabase.from("propostas").select("*").eq("id", propostaId).single()

        if (error) throw error

        setProposta(data)
      } catch (error) {
        console.error("Erro ao buscar proposta:", error)
        setError("Não foi possível carregar os detalhes da proposta")
      } finally {
        setLoading(false)
      }
    }

    fetchProposta()
  }, [propostaId])

  const handleDownloadPDF = async () => {
    if (!proposta?.pdf_url) {
      toast.error("Link do PDF não disponível")
      return
    }

    try {
      setPdfError(false)

      // Primeiro, verifique se a URL é válida
      const isValidUrl = (urlString) => {
        try {
          new URL(urlString)
          return true
        } catch (e) {
          return false
        }
      }

      if (!isValidUrl(proposta.pdf_url)) {
        throw new Error("URL do PDF inválida")
      }

      // Verifica se conseguimos acessar o PDF
      const checkResponse = await fetch(proposta.pdf_url, { method: "HEAD" })
      if (!checkResponse.ok) {
        throw new Error("Não foi possível acessar o arquivo PDF")
      }

      // Abre o PDF em uma nova aba
      window.open(proposta.pdf_url, "_blank")
    } catch (error) {
      console.error("Erro ao abrir o PDF:", error)
      setPdfError(true)
      toast.error("Não foi possível abrir o PDF. Tente novamente mais tarde.")
    }
  }

  const handleRegeneratePDF = async () => {
    try {
      setLoading(true)

      // Importar dinamicamente o serviço de PDF
      const PDFService = (await import("@/services/pdf-service")).PDFService
      const PropostaHTMLService = (await import("@/services/proposta-html-service")).PropostaHTMLService

      // Buscar dados necessários
      const { data: dependentesData } = await supabase
        .from("dependentes")
        .select("*")
        .eq("proposta_id", propostaId)
        .order("created_at", { ascending: true })

      const { data: questionarioData } = await supabase
        .from("questionario_saude")
        .select("*")
        .eq("proposta_id", propostaId)
        .order("pergunta_id", { ascending: true })

      // Gerar HTML
      const html = PropostaHTMLService.generatePropostaHTML(proposta, dependentesData || [], questionarioData || [])

      // Gerar PDF
      const fileName = `proposta_${propostaId}_${proposta.nome_cliente.replace(/\s+/g, "_")}`
      const pdfUrl = await PDFService.generatePDFFromHTML(html, fileName)

      // Atualizar a URL do PDF na proposta
      await supabase.from("propostas").update({ pdf_url: pdfUrl }).eq("id", propostaId)

      // Atualizar o estado local
      setProposta({ ...proposta, pdf_url: pdfUrl })
      toast.success("PDF gerado com sucesso!")
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      toast.error("Não foi possível gerar o PDF. Por favor, tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-600">Carregando informações da proposta...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !proposta) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-lg mx-auto p-6">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Erro ao carregar proposta</h1>
              <p className="text-gray-600 mb-6">{error || "Proposta não encontrada"}</p>
              <Button onClick={() => router.push("/")} className="mt-4">
                <Home className="mr-2 h-4 w-4" />
                Voltar para a página inicial
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <Card className="max-w-lg mx-auto p-6">
          <div className="flex flex-col items-center text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Proposta Enviada com Sucesso!</h1>
            <p className="text-gray-600 mb-6">
              Sua proposta foi recebida e está em análise. Você receberá atualizações por email.
            </p>

            <div className="bg-gray-50 w-full p-4 rounded-md mb-6">
              <div className="text-left">
                <p className="text-sm mb-2">
                  <span className="font-medium">Número da Proposta:</span> #{proposta.id}
                </p>
                <p className="text-sm mb-2">
                  <span className="font-medium">Data de Envio:</span>{" "}
                  {new Date(proposta.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-sm mb-2">
                  <span className="font-medium">Status:</span>{" "}
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Em análise
                  </span>
                </p>
              </div>
            </div>

            {pdfError && (
              <div className="mb-6 w-full p-4 bg-red-50 border border-red-200 rounded-md text-left">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Problema ao acessar o PDF</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Não foi possível abrir o PDF da sua proposta. Estamos trabalhando para resolver este problema.
                    </p>
                    <Button onClick={handleRegeneratePDF} variant="outline" size="sm" className="mt-3">
                      <FileText className="mr-1 h-4 w-4" /> Solicitar nova geração do PDF
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {proposta.pdf_url ? (
              <div className="w-full flex flex-col items-center">
                <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4 text-center w-full">
                  <p className="font-medium">PDF da proposta disponível</p>
                  <p className="text-sm">Você pode visualizar ou baixar o documento usando os botões abaixo.</p>
                </div>

                <div className="flex justify-center w-full">
                  <Button onClick={handleDownloadPDF} className="bg-[#168979] hover:bg-[#13786a]">
                    <FileText className="h-4 w-4 mr-2" />
                    Visualizar PDF
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center">
                <p className="text-gray-500 mb-4">O PDF da proposta ainda não foi gerado.</p>
                <Button onClick={handleRegeneratePDF} className="bg-[#168979] hover:bg-[#13786a]">
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar PDF da Proposta
                </Button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <Button onClick={() => router.push("/")} className="flex-1">
                <Home className="mr-2 h-4 w-4" />
                Página Inicial
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
