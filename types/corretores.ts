export interface Corretor {
  id: string
  nome: string
  email: string
  telefone?: string
  ativo: boolean
  created_at?: string
  updated_at?: string
}

export interface Comissao {
  id: string
  corretor_id: string
  proposta_id?: string
  valor: number
  percentual?: string | null
  data: string
  status: "pendente" | "pago"
  data_pagamento?: string
  created_at: string
  descricao?: string
  data_prevista?: string
  corretor?: {
    id: string
    nome: string
    email: string
  }
}

export interface ResumoComissoes {
  total?: number
  pagas?: number
  pendentes?: number
  total_corretores?: number
  totalPendente?: number
  totalPago?: number
  porMes?: Record<string, number>
}
