"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { buscarTabelasPrecos, vincularProdutoTabela } from "@/services/produtos-corretores-service"

interface VincularTabelaProps {
  isOpen: boolean
  onClose: () => void
  produtoId: string
  produtoNome: string
  tabelaAtualId: string | null
  onSuccess: () => void
}

export default function VincularTabela({
  isOpen,
  onClose,
  produtoId,
  produtoNome,
  tabelaAtualId,
  onSuccess,
}: VincularTabelaProps) {
  const [tabelas, setTabelas] = useState<Array<{ id: string; titulo: string }>>([])
  const [tabelaSelecionada, setTabelaSelecionada] = useState<string | null>(tabelaAtualId)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (isOpen) {
      carregarTabelas()
    }
  }, [isOpen])

  const carregarTabelas = async () => {
    try {
      setCarregando(true)
      const tabelasData = await buscarTabelasPrecos()
      setTabelas(tabelasData)
    } catch (error) {
      console.error("Erro ao carregar tabelas:", error)
      toast.error("Erro ao carregar tabelas de preços")
    } finally {
      setCarregando(false)
    }
  }

  const handleVincular = async () => {
    try {
      setSalvando(true)
      await vincularProdutoTabela(produtoId, tabelaSelecionada)
      toast.success("Tabela vinculada com sucesso!")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Erro ao vincular tabela:", error)
      toast.error("Erro ao vincular tabela")
    } finally {
      setSalvando(false)
    }
  }

  const handleDesvincular = async () => {
    try {
      setSalvando(true)
      await vincularProdutoTabela(produtoId, null)
      toast.success("Tabela desvinculada com sucesso!")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Erro ao desvincular tabela:", error)
      toast.error("Erro ao desvincular tabela")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Vincular Tabela de Preços</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="produto" className="text-right">
              Produto
            </Label>
            <div id="produto" className="col-span-3 font-medium">
              {produtoNome}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tabela" className="text-right">
              Tabela
            </Label>
            <Select
              value={tabelaSelecionada || ""}
              onValueChange={setTabelaSelecionada}
              disabled={carregando}
              className="col-span-3"
            >
              <SelectTrigger id="tabela">
                <SelectValue placeholder="Selecione uma tabela" />
              </SelectTrigger>
              <SelectContent>
                {tabelas.map((tabela) => (
                  <SelectItem key={tabela.id} value={tabela.id}>
                    {tabela.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          {tabelaAtualId && (
            <Button variant="outline" onClick={handleDesvincular} disabled={salvando}>
              Desvincular
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={handleVincular} disabled={!tabelaSelecionada || salvando}>
              Vincular Tabela
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
