"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, FileText } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { obterTabelasPrecos } from "@/services/tabelas-service"
import type { TabelaPreco } from "@/types/tabelas"
import Link from "next/link"

export default function TabelasPage() {
  const [tabelas, setTabelas] = useState<TabelaPreco[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredTabelas, setFilteredTabelas] = useState<TabelaPreco[]>([])

  useEffect(() => {
    async function carregarTabelas() {
      try {
        const data = await obterTabelasPrecos()
        setTabelas(data)
        setFilteredTabelas(data)
      } catch (error) {
        console.error("Erro ao carregar tabelas:", error)
      } finally {
        setLoading(false)
      }
    }

    carregarTabelas()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredTabelas(tabelas)
    } else {
      const filtered = tabelas.filter(
        (tabela) =>
          tabela.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tabela.corretora.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredTabelas(filtered)
    }
  }, [searchTerm, tabelas])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
        <span className="ml-2">Carregando tabelas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-3">
        <h1 className="text-xl font-semibold tracking-tight">Tabelas de Preços</h1>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar tabelas..."
            className="pl-8 w-full h-9 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredTabelas.length === 0 ? (
        <Card className="shadow-sm border-gray-200">
          <CardContent className="py-8">
            <div className="text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <h3 className="mt-3 text-base font-medium">Nenhuma tabela encontrada</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm
                  ? "Não encontramos tabelas correspondentes à sua busca."
                  : "Ainda não há tabelas de preços disponíveis."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-base font-medium">Tabelas Disponíveis</CardTitle>
            <CardDescription className="text-xs">
              Consulte as tabelas de preços por faixa etária dos produtos disponíveis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-medium text-xs text-gray-600">Produto</TableHead>
                  <TableHead className="font-medium text-xs text-gray-600">Corretora</TableHead>
                  <TableHead className="hidden md:table-cell font-medium text-xs text-gray-600">
                    Data de Atualização
                  </TableHead>
                  <TableHead className="text-right font-medium text-xs text-gray-600">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTabelas.map((tabela) => (
                  <TableRow key={tabela.id} className="text-sm">
                    <TableCell className="font-medium">{tabela.titulo}</TableCell>
                    <TableCell>{tabela.corretora}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs">
                      {new Date(tabela.updated_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/corretor/tabelas/${tabela.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          Visualizar
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
