export interface ModeloProposta {
  id: string
  titulo: string
  produto_id?: string
  produto_nome?: string
  descricao?: string
  arquivo_url: string
  arquivo_nome: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface ModeloPropostaFormData {
  titulo: string
  produto_id?: string
  descricao?: string
  arquivo?: File
  ativo?: boolean
}
