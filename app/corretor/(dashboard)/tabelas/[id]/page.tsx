"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { buscarTabelaPrecoDetalhada } from "@/services/tabelas-service"
import type { TabelaPrecoDetalhada } from "@/types/tabelas"
import { formatarMoeda } from "@/utils/formatters"

export default function TabelaDetalhadaPage() {
  const params = useParams()
  const router = useRouter()
  const [tabelaDetalhada, setTabelaDetalhada] = useState<TabelaPrecoDetalhada | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function carregarTabela() {
      try {
        if (typeof params.id !== "string") {
          throw new Error("ID da tabela inválido")
        }

        const data = await buscarTabelaPrecoDetalhada(params.id)
        setTabelaDetalhada(data)
      } catch (error) {
        console.error("Erro ao carregar tabela:", error)
        setError("Não foi possível carregar os detalhes da tabela")
      } finally {
        setLoading(false)
      }
    }

    carregarTabela()
  }, [params.id])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
        <span className="ml-2">Carregando detalhes da tabela...</span>
      </div>
    )
  }

  if (error || !tabelaDetalhada) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <h3 className="mt-4 text-lg font-semibold">Erro ao carregar tabela</h3>
              <p className="mt-2 text-sm text-muted-foreground">{error || "Tabela não encontrada"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { tabela, faixas } = tabelaDetalhada

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button variant="outline" onClick={handlePrint} className="print:hidden">
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </div>

      <Card className="print:shadow-none print:border-none">
        <CardHeader>
          <CardTitle>{tabela.titulo}</CardTitle>
          <CardDescription>
            Corretora: {tabela.corretora} | Atualizado em: {new Date(tabela.updated_at).toLocaleDateString("pt-BR")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tabela.descricao && <p className="mb-4 text-sm text-muted-foreground">{tabela.descricao}</p>}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faixa Etária</TableHead>
                <TableHead className="text-right">Valor (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faixas.map((faixa) => (
                <TableRow key={faixa.id}>
                  <TableCell className="font-medium">{faixa.faixa_etaria}</TableCell>
                  <TableCell className="text-right">{formatarMoeda(faixa.valor)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
