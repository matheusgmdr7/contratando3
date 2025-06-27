"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, ArrowLeft, Save, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { obterProdutoCorretor, atualizarProdutoCorretor } from "@/services/produtos-corretores-service"
import TabelasPrecosProduto from "../components/tabelas-precos-produto"
import type { ProdutoCorretor } from "@/types/corretores"

export default function EditarProdutoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>("informacoes")
  const [produto, setProduto] = useState<ProdutoCorretor>({
    id: params.id,
    nome: "",
    operadora: "",
    tipo: "",
    comissao: "",
    descricao: "",
    disponivel: true,
    created_at: "",
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar dados do produto
  const carregarProduto = async () => {
    try {
      setIsLoading(true)
      const data = await obterProdutoCorretor(params.id)
      setProduto(data)
      setError(null)
    } catch (error) {
      console.error("Erro ao carregar produto:", error)
      setError(`Não foi possível carregar os dados do produto: ${error.message || "Erro desconhecido"}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Atualizar produto
  const handleSalvar = async () => {
    try {
      setIsSaving(true)
      await atualizarProdutoCorretor(params.id, {
        nome: produto.nome,
        operadora: produto.operadora,
        tipo: produto.tipo,
        comissao: produto.comissao,
        descricao: produto.descricao,
        disponivel: produto.disponivel,
      })
      toast.success("Produto atualizado com sucesso!")
    } catch (error) {
      console.error("Erro ao atualizar produto:", error)
      toast.error(`Não foi possível atualizar o produto: ${error.message || "Erro desconhecido"}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    carregarProduto()
  }, [params.id])

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="icon"
          className="mr-4"
          onClick={() => router.push("/admin/produtos-corretores")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Editar Produto</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="informacoes">Informações Básicas</TabsTrigger>
            <TabsTrigger value="tabelas">Tabelas de Preços</TabsTrigger>
          </TabsList>

          <TabsContent value="informacoes">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Produto</CardTitle>
                <CardDescription>Edite as informações básicas do produto.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Produto</Label>
                    <Input
                      id="nome"
                      value={produto.nome}
                      onChange={(e) => setProduto({ ...produto, nome: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="operadora">Operadora</Label>
                    <Input
                      id="operadora"
                      value={produto.operadora}
                      onChange={(e) => setProduto({ ...produto, operadora: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Input
                      id="tipo"
                      value={produto.tipo}
                      onChange={(e) => setProduto({ ...produto, tipo: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comissao">Comissão (%)</Label>
                    <Input
                      id="comissao"
                      value={produto.comissao}
                      onChange={(e) => setProduto({ ...produto, comissao: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={produto.descricao || ""}
                    onChange={(e) => setProduto({ ...produto, descricao: e.target.value })}
                    disabled={isSaving}
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="disponivel"
                    checked={produto.disponivel}
                    onCheckedChange={(checked) => setProduto({ ...produto, disponivel: checked })}
                    disabled={isSaving}
                  />
                  <Label htmlFor="disponivel">Produto disponível para corretores</Label>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSalvar} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tabelas">
            <Card>
              <CardContent className="pt-6">
                <TabelasPrecosProduto produtoId={params.id} produtoNome={produto.nome} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
