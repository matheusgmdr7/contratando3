/**
 * SERVIÇO DE PROPOSTAS SEM DEPENDÊNCIA DE STORAGE
 * ==============================================
 *
 * Versão que funciona mesmo sem Supabase Storage configurado
 */

import { supabase } from "@/lib/supabase"

const TABELA_PROPOSTAS = "propostas_corretores"

/**
 * Criar nova proposta (sem upload de arquivos)
 */
export async function criarPropostaSemStorage(dadosProposta: any) {
  try {
    console.log("📝 CRIANDO PROPOSTA SEM STORAGE")
    console.log("=".repeat(40))

    const { data, error } = await supabase.from(TABELA_PROPOSTAS).insert([dadosProposta]).select().single()

    if (error) {
      console.error("❌ Erro ao criar proposta:", error)
      throw error
    }

    console.log("✅ Proposta criada:", data.id)
    return data
  } catch (error) {
    console.error("❌ Erro ao criar proposta:", error)
    throw error
  }
}

/**
 * Atualizar proposta com URLs de documentos
 */
export async function atualizarDocumentosProposta(propostaId: string, documentosUrls: Record<string, string>) {
  try {
    console.log("📎 ATUALIZANDO DOCUMENTOS DA PROPOSTA")
    console.log("=".repeat(40))
    console.log("🆔 Proposta:", propostaId)
    console.log("📋 Documentos:", Object.keys(documentosUrls))

    const updateData: any = {
      documentos_urls: documentosUrls,
      updated_at: new Date().toISOString(),
    }

    // Campos individuais para compatibilidade
    const mapeamento = {
      rg_frente: "rg_frente_url",
      rg_verso: "rg_verso_url",
      cpf: "cpf_url",
      comprovante_residencia: "comprovante_residencia_url",
      cns: "cns_url",
    }

    Object.entries(mapeamento).forEach(([chave, campo]) => {
      if (documentosUrls[chave]) {
        updateData[campo] = documentosUrls[chave]
      }
    })

    const { error } = await supabase.from(TABELA_PROPOSTAS).update(updateData).eq("id", propostaId)

    if (error) {
      console.error("❌ Erro ao atualizar documentos:", error)
      throw error
    }

    console.log("✅ Documentos atualizados com sucesso!")
    return true
  } catch (error) {
    console.error("❌ Erro ao atualizar documentos:", error)
    throw error
  }
}

/**
 * Buscar proposta com tratamento de documentos
 */
export async function buscarPropostaComDocumentos(propostaId: string) {
  try {
    console.log("🔍 BUSCANDO PROPOSTA COM DOCUMENTOS")
    console.log("=".repeat(40))

    const { data, error } = await supabase.from(TABELA_PROPOSTAS).select("*").eq("id", propostaId).single()

    if (error) {
      console.error("❌ Erro ao buscar proposta:", error)
      throw error
    }

    if (!data) {
      throw new Error("Proposta não encontrada")
    }

    // Processar documentos
    const documentos = obterDocumentosInteligente(data)

    console.log("✅ Proposta encontrada")
    console.log("📎 Documentos:", Object.keys(documentos).length)

    return {
      ...data,
      documentos_processados: documentos,
    }
  } catch (error) {
    console.error("❌ Erro ao buscar proposta:", error)
    throw error
  }
}

/**
 * Função inteligente para obter documentos (reutilizada)
 */
function obterDocumentosInteligente(proposta: any): Record<string, string> {
  const documentos: Record<string, string> = {}

  // Prioridade 1: Campo JSON
  if (proposta.documentos_urls && typeof proposta.documentos_urls === "object") {
    Object.assign(documentos, proposta.documentos_urls)
  }

  // Prioridade 2: Campos individuais
  const camposIndividuais = {
    rg_frente: proposta.rg_frente_url,
    rg_verso: proposta.rg_verso_url,
    cpf: proposta.cpf_url,
    comprovante_residencia: proposta.comprovante_residencia_url,
    cns: proposta.cns_url,
  }

  Object.entries(camposIndividuais).forEach(([tipo, url]) => {
    if (url && typeof url === "string" && url.trim() !== "") {
      documentos[tipo] = url
    }
  })

  return documentos
}

/**
 * Validar se proposta tem documentos obrigatórios
 */
export function validarDocumentosObrigatorios(proposta: any): { valido: boolean; faltando: string[] } {
  const documentos = obterDocumentosInteligente(proposta)
  const obrigatorios = ["rg_frente", "rg_verso", "cpf"]
  const faltando: string[] = []

  obrigatorios.forEach((doc) => {
    if (!documentos[doc]) {
      faltando.push(doc)
    }
  })

  return {
    valido: faltando.length === 0,
    faltando,
  }
}
