"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import type { EstatisticasCorretor } from "@/services/estatisticas-corretores-service"
import { BarChart3 } from "lucide-react"

// Função para gerar dados dos últimos 6 meses com base nas propostas
function gerarDadosGrafico(estatisticas: EstatisticasCorretor | null) {
  if (!estatisticas || !estatisticas.ultimasPropostas || estatisticas.ultimasPropostas.length === 0) {
    return []
  }

  // Criar um mapa para os últimos 6 meses
  const meses: Record<string, number> = {}
  const hoje = new Date()

  for (let i = 5; i >= 0; i--) {
    const data = new Date()
    data.setMonth(hoje.getMonth() - i)
    const nomeMes = data.toLocaleString("default", { month: "short" })
    meses[nomeMes] = 0
  }

  // Contar propostas por mês
  estatisticas.ultimasPropostas.forEach((proposta) => {
    if (!proposta.created_at) return

    const dataProposta = new Date(proposta.created_at)
    // Verificar se a proposta está nos últimos 6 meses
    if (dataProposta >= new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1)) {
      const nomeMes = dataProposta.toLocaleString("default", { month: "short" })
      if (meses[nomeMes] !== undefined) {
        meses[nomeMes]++
      }
    }
  })

  // Converter para o formato esperado pelo gráfico
  return Object.entries(meses).map(([name, total]) => ({ name, total }))
}

export function Overview({ data }: { data: EstatisticasCorretor | null }) {
  const chartData = gerarDadosGrafico(data)

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex h-[300px] w-full flex-col items-center justify-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">Sem dados de propostas</h3>
        <p className="mt-2 text-sm text-muted-foreground">Envie propostas para visualizar estatísticas mensais.</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip
          formatter={(value: number) => [`${value} propostas`, "Total"]}
          labelFormatter={(label) => `Mês: ${label}`}
        />
        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  )
}
