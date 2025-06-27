/**
 * Formata um valor numérico para o formato de moeda brasileira (R$)
 */
export function formatarValor(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor)
}

/**
 * Formata uma string de data ISO para o formato brasileiro (DD/MM/AAAA)
 */
export function formatarData(dataString: string): string {
  const data = new Date(dataString)
  return data.toLocaleDateString("pt-BR")
}

/**
 * Formata um número de telefone para o formato brasileiro
 * Ex: (11) 98765-4321
 */
export function formatarTelefone(telefone: string): string {
  // Remove todos os caracteres não numéricos
  const numeros = telefone.replace(/\D/g, "")

  // Verifica se é celular (9 dígitos) ou fixo (8 dígitos)
  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
  } else if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`
  }

  // Se não for um formato reconhecido, retorna o original
  return telefone
}

/**
 * Formata um CPF para o formato brasileiro
 * Ex: 123.456.789-00
 */
export function formatarCPF(cpf: string): string {
  // Remove todos os caracteres não numéricos
  const numeros = cpf.replace(/\D/g, "")

  if (numeros.length !== 11) {
    return cpf
  }

  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`
}

/**
 * Formata um CNPJ para o formato brasileiro
 * Ex: 12.345.678/0001-90
 */
export function formatarCNPJ(cnpj: string): string {
  // Remove todos os caracteres não numéricos
  const numeros = cnpj.replace(/\D/g, "")

  if (numeros.length !== 14) {
    return cnpj
  }

  return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8, 12)}-${numeros.slice(12)}`
}
