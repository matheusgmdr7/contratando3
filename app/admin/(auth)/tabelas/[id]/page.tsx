"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, ArrowLeft, Plus, Save, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  buscarTabelaPrecoDetalhada,
  atualizarTabelaPreco,
  adicionarFaixaEtaria,
  atualizarFaixaEtaria,
  removerFaixaEtaria,
} from "@/services/tabelas-service"
import type { TabelaPrecoDetalhada, TabelaPrecoFaixa } from "@/types/tabelas"

export default function EditarTabelaPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [tabelaDetalhada, setTabelaDetalhada] = useState<TabelaPrecoDetalhada | null>(null)
  const [novaFaixa, setNovaFaixa] = useState<{ faixa_etaria: string; valor: number }>({
    faixa_etaria: "",
    valor: 0,
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("informacoes")

  // Carregar dados da tabela
  const carregarTabela = async () => {
    try {
      setIsLoading(true)
      const tabela = await buscarTabelaPrecoDetalhada(params.id)
      setTabelaDetalhada(tabela)
      setError(null)
    } catch (error) {
      console.error("Erro ao carregar tabela:", error)
      setError("Não foi possível carregar os dados da tabela.")
    } finally {
      setIsLoading(false)
    }
  }

  // Atualizar dados da tabela
  const handleSalvarTabela = async () => {
    if (!tabelaDetalhada) return

    try {
      setIsLoading(true)
      await atualizarTabelaPreco(params.id, {
        titulo: tabelaDetalhada.tabela.titulo,
        descricao: tabelaDetalhada.tabela.descricao,
        ativo: tabelaDetalhada.tabela.ativo,
      })
      toast.success("Tabela atualizada com sucesso!")
      setError(null)
    } catch (error) {
      console.error("Erro ao atualizar tabela:", error)
      toast.error("Não foi possível atualizar a tabela.")
      setError("Erro ao salvar as alterações.")
    } finally {
      setIsLoading(false)
    }
  }

  // Atualizar campo da tabela
  const handleTabelaChange = (field: keyof typeof tabelaDetalhada.tabela, value: any) => {
    if (!tabelaDetalhada) return
    setTabelaDetalhada({
      ...tabelaDetalhada,
      tabela: { ...tabelaDetalhada.tabela, [field]: value },
    })
  }

  // Adicionar nova faixa etária
  const handleAdicionarFaixa = async () => {
    if (!tabelaDetalhada || !novaFaixa.faixa_etaria) {
      toast.error("Preencha a faixa etária")
      return
    }

    try {
      setIsLoading(true)
      const faixa = await adicionarFaixaEtaria({
        tabela_id: params.id,
        faixa_etaria: novaFaixa.faixa_etaria,
        valor: novaFaixa.valor,
      })

      setTabelaDetalhada({
        ...tabelaDetalhada,
        faixas: [...tabelaDetalhada.faixas, faixa],
      })

      setNovaFaixa({ faixa_etaria: "", valor: 0 })
      toast.success("Faixa etária adicionada com sucesso!")
    } catch (error) {
      console.error("Erro ao adicionar faixa etária:", error)
      toast.error("Não foi possível adicionar a faixa etária.")
    } finally {
      setIsLoading(false)
    }
  }

  // Atualizar faixa etária
  const handleAtualizarFaixa = async (id: string | number, campo: keyof TabelaPrecoFaixa, valor: any) => {
    if (!tabelaDetalhada) return

    try {
      setIsLoading(true)

      // Atualizar localmente primeiro para feedback imediato
      const faixasAtualizadas = tabelaDetalhada.faixas.map((faixa) => {
        if (faixa.id === id) {
          return { ...faixa, [campo]: valor }
        }
        return faixa
      })

      setTabelaDetalhada({
        ...tabelaDetalhada,
        faixas: faixasAtualizadas,
      })

      // Atualizar no servidor
      await atualizarFaixaEtaria(id, { [campo]: valor })
    } catch (error) {
      console.error("Erro ao atualizar faixa etária:", error)
      toast.error("Não foi possível atualizar a faixa etária.")
      // Recarregar dados em caso de erro
      await carregarTabela()
    } finally {
      setIsLoading(false)
    }
  }

  // Remover faixa etária
  const handleRemoverFaixa = async (id: string | number) => {
    if (!tabelaDetalhada) return

    if (!confirm("Tem certeza que deseja remover esta faixa etária?")) return

    try {
      setIsLoading(true)
      await removerFaixaEtaria(id)

      setTabelaDetalhada({
        ...tabelaDetalhada,
        faixas: tabelaDetalhada.faixas.filter((faixa) => faixa.id !== id),
      })

      toast.success("Faixa etária removida com sucesso!")
    } catch (error) {
      console.error("Erro ao remover faixa etária:", error)
      toast.error("Não foi possível remover a faixa etária.")
    } finally {
      setIsLoading(false)
    }
  }

  // Formatar valor para exibição
  const formatarValor = (valor: number): string => {
    return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // Converter string para número
  const parseValor = (valor: string): number => {
    if (!valor) return 0
    return Number.parseFloat(valor.replace(/\./g, "").replace(",", "."))
  }

  // Carregar dados iniciais
  useEffect(() => {
    carregarTabela()
  }, [params.id])

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push("/admin/tabelas")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading && !tabelaDetalhada) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!tabelaDetalhada) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Tabela não encontrada</AlertTitle>
          <AlertDescription>A tabela solicitada não foi encontrada.</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push("/admin/tabelas")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="outline" onClick={() => router.push("/admin/tabelas")} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Editar Tabela de Preços</h1>
        </div>
        <Button onClick={handleSalvarTabela} disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="informacoes">Informações Básicas</TabsTrigger>
          <TabsTrigger value="faixas">Faixas Etárias</TabsTrigger>
        </TabsList>

        <TabsContent value="informacoes">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Tabela</CardTitle>
              <CardDescription>Edite as informações básicas da tabela de preços.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título da Tabela</Label>
                <Input
                  id="titulo"
                  value={tabelaDetalhada.tabela.titulo}
                  onChange={(e) => handleTabelaChange("titulo", e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={tabelaDetalhada.tabela.descricao || ""}
                  onChange={(e) => handleTabelaChange("descricao", e.target.value)}
                  disabled={isLoading}
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={tabelaDetalhada.tabela.ativo}
                  onCheckedChange={(checked) => handleTabelaChange("ativo", checked)}
                  disabled={isLoading}
                />
                <Label htmlFor="ativo">Tabela ativa</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSalvarTabela} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="faixas">
          <Card>
            <CardHeader>
              <CardTitle>Faixas Etárias</CardTitle>
              <CardDescription>Gerencie as faixas etárias e valores da tabela.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Faixa Etária</TableHead>
                      <TableHead>Valor (R$)</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tabelaDetalhada.faixas.map((faixa) => (
                      <TableRow key={faixa.id}>
                        <TableCell>
                          <Input
                            value={faixa.faixa_etaria}
                            onChange={(e) => handleAtualizarFaixa(faixa.id, "faixa_etaria", e.target.value)}
                            disabled={isLoading}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={formatarValor(faixa.valor)}
                            onChange={(e) => {
                              const valor = parseValor(e.target.value)
                              handleAtualizarFaixa(faixa.id, "valor", valor)
                            }}
                            disabled={isLoading}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleRemoverFaixa(faixa.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell>
                        <Input
                          value={novaFaixa.faixa_etaria}
                          onChange={(e) => setNovaFaixa({ ...novaFaixa, faixa_etaria: e.target.value })}
                          placeholder="Ex: 0-18, 19-23, 59+"
                          disabled={isLoading}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={formatarValor(novaFaixa.valor)}
                          onChange={(e) => {
                            const valor = parseValor(e.target.value)
                            setNovaFaixa({ ...novaFaixa, valor })
                          }}
                          placeholder="0,00"
                          disabled={isLoading}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="default"
                          size="icon"
                          onClick={handleAdicionarFaixa}
                          disabled={isLoading || !novaFaixa.faixa_etaria}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <div className="text-sm text-muted-foreground">
                  <p>Formatos aceitos para faixas etárias:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>Intervalo: "0-18", "19-23"</li>
                    <li>Idade mínima: "59+"</li>
                    <li>Idade específica: "18", "25"</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
