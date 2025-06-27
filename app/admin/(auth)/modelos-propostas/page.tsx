"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Plus, Edit, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import {
  listarModelosPropostas,
  excluirModeloProposta,
  alternarStatusModeloProposta,
  criarModeloProposta,
  atualizarModeloProposta,
} from "@/services/modelos-propostas-service"
import type { ModeloProposta, ModeloPropostaFormData } from "@/types/modelos-propostas"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner" // Import the Spinner component
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
import { Switch } from "@/components/ui/switch" // Explicitly import Switch
import { supabase } from "@/lib/supabase"

export default function ModelosPropostasPage() {
  const [modelos, setModelos] = useState<ModeloProposta[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredModelos, setFilteredModelos] = useState<ModeloProposta[]>([])
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [selectedModelo, setSelectedModelo] = useState<ModeloProposta | null>(null)
  const [formData, setFormData] = useState<ModeloPropostaFormData>({
    titulo: "",
    produto_id: "",
    descricao: "",
    arquivo: null,
    ativo: true,
  })

  useEffect(() => {
    carregarModelos()
  }, [])

  useEffect(() => {
    const filtro = searchTerm.toLowerCase()
    const resultadosFiltrados = modelos.filter((modelo) => {
      return modelo.titulo.toLowerCase().includes(filtro)
    })
    setFilteredModelos(resultadosFiltrados)
  }, [searchTerm, modelos])

  async function carregarModelos() {
    try {
      setLoading(true)
      const data = await listarModelosPropostas()
      setModelos(data)
      setFilteredModelos(data)
    } catch (error) {
      console.error("Erro ao carregar modelos de propostas:", error)
      toast.error("Erro ao carregar modelos de propostas")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir este modelo de proposta?")) {
      try {
        await excluirModeloProposta(id)
        toast.success("Modelo de proposta excluído com sucesso")
        carregarModelos()
      } catch (error) {
        console.error("Erro ao excluir modelo de proposta:", error)
        toast.error("Erro ao excluir modelo de proposta")
      }
    }
  }

  async function handleToggleStatus(id: string, ativo: boolean) {
    try {
      await alternarStatusModeloProposta(id, !ativo)
      toast.success(`Modelo de proposta ${!ativo ? "ativado" : "desativado"} com sucesso`)
      carregarModelos()
    } catch (error) {
      console.error("Erro ao alternar status do modelo de proposta:", error)
      toast.error("Erro ao alternar status do modelo de proposta")
    }
  }

  const handleOpenDialog = async (modelo?: ModeloProposta) => {
    setSelectedModelo(modelo || null)
    setFormData({
      titulo: "",
      produto_id: modelo?.produto_id || "",
      descricao: modelo?.descricao || "",
      arquivo: null,
      ativo: modelo?.ativo !== undefined ? modelo.ativo : true,
    })
    setFormData((prev) => ({ ...prev, arquivo: null }))
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setSelectedModelo(null)
    setFormData({
      titulo: "",
      produto_id: "",
      descricao: "",
      arquivo: null,
      ativo: true,
    })
    setDialogOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, ativo: checked }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, arquivo: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (!formData.titulo) {
        toast.error("O título é obrigatório")
        return
      }

      let arquivo_url = ""
      let arquivo_nome = ""

      if (formData.arquivo) {
        // Upload do arquivo para o Storage
        const fileExt = formData.arquivo.name.split(".").pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `modelos-propostas/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("arquivos")
          .upload(filePath, formData.arquivo, {
            cacheControl: "3600",
            upsert: false,
          })

        if (uploadError) {
          console.error("Erro ao fazer upload do arquivo:", uploadError)
          toast.error(`Erro ao fazer upload do arquivo: ${uploadError.message}`)
          return
        }

        // Obter URL pública do arquivo
        const { data: urlData } = await supabase.storage.from("arquivos").getPublicUrl(filePath)

        arquivo_url = urlData.publicUrl
        arquivo_nome = formData.arquivo.name
      }

      if (selectedModelo) {
        // Atualizar modelo existente
        await atualizarModeloProposta(selectedModelo.id, {
          ...formData,
          arquivo_url,
          arquivo_nome,
        })
        toast.success("Modelo de proposta atualizado com sucesso")
      } else {
        // Criar novo modelo
        await criarModeloProposta({
          ...formData,
          arquivo_url,
          arquivo_nome,
        })
        toast.success("Modelo de proposta criado com sucesso")
      }

      // Recarregar modelos e fechar diálogo
      await carregarModelos()
      setDialogOpen(false)
    } catch (error) {
      console.error("Erro ao salvar modelo de proposta:", error)
      toast.error("Erro ao salvar modelo de proposta")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modelos de Propostas"
        description="Gerencie os modelos de propostas disponíveis para os corretores"
        action={
          <Button onClick={handleOpenDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Modelo
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Modelos</CardTitle>
          <CardDescription>Visualize e gerencie os modelos de propostas existentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full max-w-md mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Buscar modelo..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModelos.length > 0 ? (
                    filteredModelos.map((modelo) => (
                      <TableRow key={modelo.id}>
                        <TableCell className="font-medium">{modelo.titulo}</TableCell>
                        <TableCell>{modelo.produto_nome}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              modelo.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {modelo.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleOpenDialog(modelo)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => handleDelete(modelo.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-500">
                        Nenhum modelo encontrado
                      </td>
                    </tr>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedModelo ? "Editar Modelo de Proposta" : "Novo Modelo de Proposta"}</DialogTitle>
            <DialogDescription>
              {selectedModelo
                ? "Atualize as informações do modelo de proposta"
                : "Preencha as informações para criar um novo modelo de proposta"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  name="titulo"
                  value={formData.titulo || ""}
                  onChange={handleInputChange}
                  placeholder="Ex: Modelo de Proposta Unimed"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="produto_id">Produto</Label>
                <Input
                  id="produto_id"
                  name="produto_id"
                  value={formData.produto_id || ""}
                  onChange={handleInputChange}
                  placeholder="Ex: Plano de Saúde Unimed"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                name="descricao"
                value={formData.descricao || ""}
                onChange={handleInputChange}
                placeholder="Descrição opcional do modelo"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arquivo">Arquivo (PDF)</Label>
              <Input
                type="file"
                id="arquivo"
                name="arquivo"
                accept="application/pdf"
                onChange={handleFileChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="ativo" checked={formData.ativo || false} onCheckedChange={handleSwitchChange} />
              <Label htmlFor="ativo">Ativo</Label>
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
