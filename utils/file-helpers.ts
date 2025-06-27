/**
 * Utilitários para manipulação de arquivos
 */

/**
 * Normaliza nome de arquivo para uso em URLs
 */
export function normalizarNomeArquivo(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s.-]/g, "") // Remove caracteres especiais
    .replace(/\s+/g, "_") // Substitui espaços por underscore
    .substring(0, 100) // Limita o tamanho
}

/**
 * Gera nome de pasta baseado no nome do cliente
 */
export function gerarNomePastaCliente(nomeCliente: string): string {
  return normalizarNomeArquivo(nomeCliente).substring(0, 50)
}

/**
 * Valida se o arquivo é uma imagem válida
 */
export function validarImagem(file: File): { valido: boolean; erro?: string } {
  // Verificar tamanho (máximo 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { valido: false, erro: "Arquivo muito grande (máximo 10MB)" }
  }

  // Verificar tipo
  const tiposPermitidos = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "application/pdf"]
  if (!tiposPermitidos.includes(file.type)) {
    return { valido: false, erro: `Tipo de arquivo não permitido: ${file.type}` }
  }

  return { valido: true }
}

/**
 * Converte bytes para formato legível
 */
export function formatarTamanhoArquivo(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

/**
 * Extrai extensão do arquivo
 */
export function obterExtensaoArquivo(nomeArquivo: string): string {
  return nomeArquivo.split(".").pop()?.toLowerCase() || ""
}

/**
 * Gera nome único para arquivo
 */
export function gerarNomeUnicoArquivo(nomeOriginal: string, prefixo?: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extensao = obterExtensaoArquivo(nomeOriginal)
  const nomeBase = nomeOriginal.replace(/\.[^/.]+$/, "")
  const nomeNormalizado = normalizarNomeArquivo(nomeBase)

  if (prefixo) {
    return `${prefixo}_${nomeNormalizado}_${timestamp}_${random}.${extensao}`
  }

  return `${nomeNormalizado}_${timestamp}_${random}.${extensao}`
}
