"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Search, Plus, Edit, X, Eye } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { PageHeader } from "@/components/admin/page-header"
import {
  buscarTabelasPrecos,
  criarTabelaPreco,
  atualizarTabelaPreco,
  buscarTabelaPrecoDetalhada,
  adicionarFaixaEtaria,
} from "@/services/tabelas-service"
import type { TabelaPreco } from "@/types/tabelas"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function TabelasAdminPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [tabelas, setTabelas] = useState<TabelaPreco[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredTabelas, setFilteredTabelas] = useState<TabelaPreco[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTabela, setEditingTabela] = useState<TabelaPreco | null>(null)
  const [formData, setFormData] = useState({
    titulo: "",
    operadora: "",
    tipo_plano: "",
    segmentacao: "",
    corretora: "",
    descricao: "",
    ativo: true,
  })

  const [faixasEtarias, setFaixasEtarias] = useState<{ faixa_etaria: string; valor: string }[]>([
    { faixa_etaria: "0-18", valor: "" },
    { faixa_etaria: "19-23", valor: "" },
    { faixa_etaria: "24-28", valor: "" },
    { faixa_etaria: "29-33", valor: "" },
    { faixa_etaria: "34-38", valor: "" },
    { faixa_etaria: "39-43", valor: "" },
    { faixa_etaria: "44-48", valor: "" },
    { faixa_etaria: "49-53", valor: "" },
    { faixa_etaria: "54-58", valor: "" },
    { faixa_etaria: "59+", valor: "" },
  ])

  useEffect(() => {
    carregarTabelas()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredTabelas(tabelas)
    } else {
      const filtered = tabelas.filter(
        (tabela) =>
          tabela.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (tabela.operadora && tabela.operadora.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (tabela.segmentacao && tabela.segmentacao.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredTabelas(filtered)
    }
  }, [searchTerm, tabelas])

  async function carregarTabelas() {
    try {
      setLoading(true)
      const data = await buscarTabelasPrecos()
      setTabelas(data)
      setFilteredTabelas(data)
    } catch (error) {
      console.error("Erro ao carregar tabelas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as tabelas de preços",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (tabela?: TabelaPreco) => {
    if (tabela) {
      setEditingTabela(tabela)
      setFormData({
        titulo: tabela.titulo,
        operadora: tabela.operadora || "",
        tipo_plano: tabela.tipo_plano || "",
        segmentacao: tabela.segmentacao || "",
        corretora: tabela.corretora || "",
        descricao: tabela.descricao || "",
        ativo: tabela.ativo,
      })
      // Carregar faixas etárias se estiver editando
      carregarFaixasEtarias(tabela.id)
    } else {
      setEditingTabela(null)
      setFormData({
        titulo: "",
        operadora: "",
        tipo_plano: "",
        segmentacao: "",
        corretora: "",
        descricao: "",
        ativo: true,
      })
      // Resetar faixas etárias para o padrão
      setFaixasEtarias([
        { faixa_etaria: "0-18", valor: "" },
        { faixa_etaria: "19-23", valor: "" },
        { faixa_etaria: "24-28", valor: "" },
        { faixa_etaria: "29-33", valor: "" },
        { faixa_etaria: "34-38", valor: "" },
        { faixa_etaria: "39-43", valor: "" },
        { faixa_etaria: "44-48", valor: "" },
        { faixa_etaria: "49-53", valor: "" },
        { faixa_etaria: "54-58", valor: "" },
        { faixa_etaria: "59+", valor: "" },
      ])
    }
    setDialogOpen(true)
  }

  const carregarFaixasEtarias = async (tabelaId: string | number) => {
    try {
      const { faixas } = await buscarTabelaPrecoDetalhada(tabelaId)
      // Se existirem faixas, atualizar o estado
      if (faixas.length > 0) {
        const faixasFormatadas = faixas.map((faixa) => ({
          faixa_etaria: faixa.faixa_etaria,
          valor: faixa.valor.toString(),
        }))
        setFaixasEtarias(faixasFormatadas)
      }
    } catch (error) {
      console.error("Erro ao carregar faixas etárias:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as faixas etárias",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, ativo: checked }))
  }

  const handleFaixaEtariaChange = (index: number, value: string) => {
    const novasFaixas = [...faixasEtarias]
    novasFaixas[index].valor = value
    setFaixasEtarias(novasFaixas)
  }

  const handleAddFaixaEtaria = () => {
    setFaixasEtarias([...faixasEtarias, { faixa_etaria: "", valor: "" }])
  }

  const handleRemoveFaixaEtaria = (index: number) => {
    const novasFaixas = [...faixasEtarias]
    novasFaixas.splice(index, 1)
    setFaixasEtarias(novasFaixas)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Validar campos obrigatórios
      if (!formData.titulo) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha o título da tabela",
          variant: "destructive",
        })
        return
      }

      // Validar faixas etárias
      const faixasValidas = faixasEtarias.filter((f) => f.faixa_etaria && f.valor)
      if (faixasValidas.length === 0) {
        toast({
          title: "Faixas etárias",
          description: "Adicione pelo menos uma faixa etária com valor",
          variant: "destructive",
        })
        return
      }

      if (editingTabela) {
        // Atualizar tabela existente
        await atualizarTabelaPreco(editingTabela.id, formData)

        // Adicionar novas faixas etárias
        const faixasParaAdicionar = faixasValidas.map((f) => ({
          tabela_id: editingTabela.id,
          faixa_etaria: f.faixa_etaria,
          valor: Number.parseFloat(f.valor),
        }))

        for (const faixa of faixasParaAdicionar) {
          await adicionarFaixaEtaria(faixa)
        }

        toast({
          title: "Sucesso",
          description: "Tabela de preços atualizada com sucesso",
        })
      } else {
        // Criar nova tabela
        const novaTabelaPreco = await criarTabelaPreco(formData)

        // Adicionar faixas etárias
        const faixasParaAdicionar = faixasValidas.map((f) => ({
          tabela_id: novaTabelaPreco.id,
          faixa_etaria: f.faixa_etaria,
          valor: Number.parseFloat(f.valor),
        }))

        for (const faixa of faixasParaAdicionar) {
          await adicionarFaixaEtaria(faixa)
        }

        toast({
          title: "Sucesso",
          description: "Tabela de preços criada com sucesso",
        })
      }

      // Recarregar tabelas e fechar diálogo
      await carregarTabelas()
      setDialogOpen(false)
    } catch (error) {
      console.error("Erro ao salvar tabela:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar a tabela de preços",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (id: string | number, ativo: boolean) => {
    try {
      await atualizarTabelaPreco(id, { ativo: !ativo })
      toast({
        title: "Sucesso",
        description: `Tabela de preços ${!ativo ? "ativada" : "desativada"} com sucesso`,
      })
      await carregarTabelas()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da tabela",
        variant: "destructive",
      })
    }
  }

  const handleVisualizarTabela = (id: string | number) => {
    router.push(`/admin/tabelas/${id}/visualizar`)
  }

  const handleEditarTabela = (id: string | number) => {
    router.push(`/admin/tabelas/${id}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tabelas de Preços"
        description="Gerencie as tabelas de preços por faixa etária para os corretores"
      />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar tabelas..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Tabela
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner />
          <span className="ml-2">Carregando tabelas...</span>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tabelas de Preços</CardTitle>
            <CardDescription>Gerencie as tabelas de preços disponíveis para os corretores</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTabelas.length === 0 ? (
              <div className="text-center py-10">
                <h3 className="text-lg font-semibold">Nenhuma tabela encontrada</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchTerm
                    ? "Não encontramos tabelas correspondentes à sua busca."
                    : "Clique em 'Nova Tabela' para adicionar uma tabela de preços."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Operadora</TableHead>
                    <TableHead>Segmentação</TableHead>
                    <TableHead>Corretora</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Atualização</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTabelas.map((tabela) => (
                    <TableRow key={tabela.id}>
                      <TableCell className="font-medium">{tabela.titulo}</TableCell>
                      <TableCell>{tabela.operadora || "-"}</TableCell>
                      <TableCell>{tabela.segmentacao || "-"}</TableCell>
                      <TableCell>{tabela.corretora || "-"}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Switch
                          id={`ativo-${tabela.id}`}
                          checked={tabela.ativo}
                          onCheckedChange={() => handleToggleStatus(tabela.id, tabela.ativo)}
                        />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {tabela.updated_at ? new Date(tabela.updated_at).toLocaleDateString("pt-BR") : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleVisualizarTabela(tabela.id)}
                            title="Visualizar tabela"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenDialog(tabela)}
                            title="Editar tabela"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTabela ? "Editar Tabela de Preços" : "Nova Tabela de Preços"}</DialogTitle>
            <DialogDescription>
              {editingTabela
                ? "Atualize as informações da tabela de preços"
                : "Preencha as informações para criar uma nova tabela de preços"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título (Produto) *</Label>
                  <Input
                    id="titulo"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleInputChange}
                    placeholder="Ex: Plano Saúde Total"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="segmentacao">Segmentação *</Label>
                  <Input
                    id="segmentacao"
                    name="segmentacao"
                    value={formData.segmentacao}
                    onChange={handleInputChange}
                    placeholder="Ex: Individual, Familiar, Empresarial"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="operadora">Operadora</Label>
                  <Input
                    id="operadora"
                    name="operadora"
                    value={formData.operadora}
                    onChange={handleInputChange}
                    placeholder="Ex: Amil, Unimed, SulAmérica"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo_plano">Tipo de Plano</Label>
                  <Input
                    id="tipo_plano"
                    name="tipo_plano"
                    value={formData.tipo_plano}
                    onChange={handleInputChange}
                    placeholder="Ex: Ambulatorial, Hospitalar"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="corretora">Corretora</Label>
                <Input
                  id="corretora"
                  name="corretora"
                  value={formData.corretora}
                  onChange={handleInputChange}
                  placeholder="Ex: Corretora XYZ, Grupo ABC"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  placeholder="Descrição opcional da tabela de preços"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="ativo" checked={formData.ativo} onCheckedChange={handleSwitchChange} />
                <Label htmlFor="ativo">Tabela ativa</Label>
              </div>

              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Faixas Etárias e Valores</h4>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddFaixaEtaria}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar Faixa
                  </Button>
                </div>

                <div className="space-y-2">
                  {faixasEtarias.map((faixa, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          value={faixa.faixa_etaria}
                          onChange={(e) => {
                            const novasFaixas = [...faixasEtarias]
                            novasFaixas[index].faixa_etaria = e.target.value
                            setFaixasEtarias(novasFaixas)
                          }}
                          placeholder="Faixa etária (ex: 0-18)"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={faixa.valor}
                          onChange={(e) => handleFaixaEtariaChange(index, e.target.value)}
                          placeholder="Valor (R$)"
                        />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFaixaEtaria(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
