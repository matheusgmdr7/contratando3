export interface Plano {
  id: number
  nome: string
  operadora: string
  cobertura: string
  tipo: string
  descricao: string
  preco: number
  precos: {
    faixa_etaria: string
    preco: number
  }[]
}

export type FaixaEtaria = "0-18" | "19-23" | "24-28" | "29-33" | "34-38" | "39-43" | "44-48" | "49-53" | "54-58" | "59+"
