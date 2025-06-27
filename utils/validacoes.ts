export function validarCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, "")

  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) {
    console.log("CPF inválido: não tem 11 dígitos")
    return false
  }

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) {
    console.log("CPF inválido: todos os dígitos são iguais")
    return false
  }

  // Validação do primeiro dígito verificador
  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += Number.parseInt(cpf.charAt(i)) * (10 - i)
  }

  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0

  if (resto !== Number.parseInt(cpf.charAt(9))) {
    console.log("CPF inválido: primeiro dígito verificador incorreto")
    return false
  }

  // Validação do segundo dígito verificador
  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += Number.parseInt(cpf.charAt(i)) * (11 - i)
  }

  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0

  if (resto !== Number.parseInt(cpf.charAt(10))) {
    console.log("CPF inválido: segundo dígito verificador incorreto")
    return false
  }

  console.log("CPF válido:", cpf)
  return true
}

export function removerFormatacaoCPF(cpf: string): string {
  // Remove todos os caracteres não numéricos
  const cpfNumerico = cpf.replace(/[^\d]/g, "")
  console.log("CPF após remoção de formatação:", cpfNumerico)
  return cpfNumerico
}

export function formatarCPF(cpf: string): string {
  // Remove formatação existente
  const cpfNumerico = removerFormatacaoCPF(cpf)

  // Aplica formatação XXX.XXX.XXX-XX
  if (cpfNumerico.length === 11) {
    return cpfNumerico.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  return cpfNumerico
}
