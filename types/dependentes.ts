/**
 * Interface que representa um dependente no sistema
 */
export interface Dependente {
  id: string
  proposta_id: string
  nome: string
  cpf: string
  rg: string
  data_nascimento: string
  cns?: string
  parentesco: string
  created_at: string
  updated_at: string
}

/**
 * Tipos de parentesco disponíveis no sistema
 */
export const tiposParentesco = [
  "Cônjuge",
  "Filho(a)",
  "Pai/Mãe",
  "Irmão/Irmã",
  "Avô/Avó",
  "Neto(a)",
  "Tio(a)",
  "Sobrinho(a)",
  "Primo(a)",
  "Enteado(a)",
  "Outro",
]

/**
 * Função para validar se um parentesco é válido
 */
export function validarParentesco(parentesco: string): boolean {
  return tiposParentesco.includes(parentesco) || parentesco === "Não especificado"
}

/**
 * Função para obter o texto de exibição de um parentesco
 */
export function obterTextoParentesco(parentesco: string): string {
  return parentesco || "Não especificado"
}
