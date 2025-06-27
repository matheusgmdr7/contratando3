"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { Plus, X } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { criarTabelaPreco, adicionarFaixaEtaria } from "@/services/tabelas-service"
import type { TabelaPreco } from "@/types/tabelas"
import { useToast } from "@/components/ui/use-toast"

interface CriarTabelaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (tabela: TabelaPreco) => void
}

export default function CriarTabelaModal({ isOpen, onClose, onSuccess }: CriarTabelaModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    titulo: "",
    operadora: "",
    tipo_plano: "",
    segmentacao: "",
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

  const resetForm = () => {
    setFormData({
      titulo: "",
      operadora: "",
      tipo_plano: "",
      segmentacao: "",
      descricao: "",
      ativo: true,
    })
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

  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

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
      setLoading(true)

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

      console.log("📝 Criando tabela com dados:", formData)

      // Criar nova tabela
      const novaTabelaPreco = await criarTabelaPreco(formData)

      console.log("✅ Tabela criada:", novaTabelaPreco)

      // Adicionar faixas etárias
      console.log("📝 Adicionando faixas etárias:", faixasValidas)
      for (const faixa of faixasValidas) {
        await adicionarFaixaEtaria({
          tabela_id: novaTabelaPreco.id,
          faixa_etaria: faixa.faixa_etaria,
          valor: Number.parseFloat(faixa.valor),
        })
      }

      toast({
        title: "Sucesso",
        description: "Tabela de preços criada com sucesso",
      })

      onSuccess(novaTabelaPreco)
      onClose()
    } catch (error) {
      console.error("❌ Erro ao salvar tabela:", error)
      toast({
        title: "Erro",
        description: `Não foi possível salvar a tabela de preços: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Tabela de Preços</DialogTitle>
          <DialogDescription>Preencha as informações para criar uma nova tabela de preços</DialogDescription>
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
                <Label htmlFor="segmentacao">Segmentação</Label>
                <Input
                  id="segmentacao"
                  name="segmentacao"
                  value={formData.segmentacao}
                  onChange={handleInputChange}
                  placeholder="Ex: Individual, Familiar, Empresarial"
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
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner className="mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
