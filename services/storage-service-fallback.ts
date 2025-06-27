/**
 * SERVIÇO DE STORAGE COM FALLBACK PARA URLS DIRETAS
 * ================================================
 *
 * Este serviço funciona tanto com Supabase Storage quanto com URLs diretas
 */

import { supabase } from "@/lib/supabase"

const BUCKET_NAME = "documentos-propostas-corretores"

/**
 * Verificar se o Supabase Storage está disponível
 */
export async function verificarStorageDisponivel(): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.listBuckets()

    if (error) {
      console.log("⚠️ Storage não disponível:", error.message)
      return false
    }

    console.log("✅ Storage disponível, buckets:", data?.length || 0)
    return true
  } catch (error) {
    console.log("⚠️ Storage não disponível:", error)
    return false
  }
}

/**
 * Upload de arquivo com fallback
 */
export async function uploadDocumento(
  arquivo: File,
  nomeArquivo: string,
  propostaId: string,
): Promise<{ url: string; sucesso: boolean; metodo: "storage" | "base64" | "url" }> {
  console.log("📤 UPLOAD DE DOCUMENTO")
  console.log("=".repeat(40))
  console.log("📁 Arquivo:", arquivo.name)
  console.log("📋 Nome:", nomeArquivo)
  console.log("🆔 Proposta:", propostaId)

  // MÉTODO 1: Tentar Supabase Storage
  const storageDisponivel = await verificarStorageDisponivel()

  if (storageDisponivel) {
    try {
      const caminhoArquivo = `${propostaId}/${nomeArquivo}`

      const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(caminhoArquivo, arquivo, {
        cacheControl: "3600",
        upsert: true,
      })

      if (!error && data) {
        const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(caminhoArquivo)

        console.log("✅ Upload via Storage bem-sucedido")
        return {
          url: urlData.publicUrl,
          sucesso: true,
          metodo: "storage",
        }
      }
    } catch (error) {
      console.log("⚠️ Falha no Storage, tentando fallback:", error)
    }
  }

  // MÉTODO 2: Fallback para Base64 (para arquivos pequenos)
  if (arquivo.size < 1024 * 1024) {
    // Menos de 1MB
    try {
      const base64 = await arquivoParaBase64(arquivo)
      console.log("✅ Conversão para Base64 bem-sucedida")

      return {
        url: base64,
        sucesso: true,
        metodo: "base64",
      }
    } catch (error) {
      console.log("⚠️ Falha na conversão Base64:", error)
    }
  }

  // MÉTODO 3: Fallback para URL temporária (Object URL)
  try {
    const objectUrl = URL.createObjectURL(arquivo)
    console.log("✅ Object URL criada como último recurso")

    return {
      url: objectUrl,
      sucesso: true,
      metodo: "url",
    }
  } catch (error) {
    console.log("❌ Todos os métodos falharam:", error)
    throw new Error("Falha no upload do documento")
  }
}

/**
 * Converter arquivo para Base64
 */
function arquivoParaBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new Error("Falha na conversão para Base64"))
      }
    }

    reader.onerror = () => reject(new Error("Erro ao ler arquivo"))
    reader.readAsDataURL(arquivo)
  })
}

/**
 * Salvar URLs dos documentos na proposta
 */
export async function salvarDocumentosProposta(
  propostaId: string,
  documentos: Record<string, string>,
): Promise<boolean> {
  try {
    console.log("💾 SALVANDO DOCUMENTOS NA PROPOSTA")
    console.log("=".repeat(40))
    console.log("🆔 Proposta:", propostaId)
    console.log("📎 Documentos:", Object.keys(documentos).length)

    // Preparar dados para atualização
    const updateData: any = {
      documentos_urls: documentos,
      updated_at: new Date().toISOString(),
    }

    // Também salvar em campos individuais para compatibilidade
    if (documentos.rg_frente) updateData.rg_frente_url = documentos.rg_frente
    if (documentos.rg_verso) updateData.rg_verso_url = documentos.rg_verso
    if (documentos.cpf) updateData.cpf_url = documentos.cpf
    if (documentos.comprovante_residencia) updateData.comprovante_residencia_url = documentos.comprovante_residencia
    if (documentos.cns) updateData.cns_url = documentos.cns

    const { error } = await supabase.from("propostas_corretores").update(updateData).eq("id", propostaId)

    if (error) {
      console.error("❌ Erro ao salvar documentos:", error)
      return false
    }

    console.log("✅ Documentos salvos com sucesso!")
    return true
  } catch (error) {
    console.error("❌ Erro ao salvar documentos:", error)
    return false
  }
}

/**
 * Obter URL pública do documento
 */
export async function obterUrlDocumento(caminhoArquivo: string): Promise<string | null> {
  try {
    const storageDisponivel = await verificarStorageDisponivel()

    if (storageDisponivel) {
      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(caminhoArquivo)

      return data.publicUrl
    }

    return null
  } catch (error) {
    console.error("❌ Erro ao obter URL do documento:", error)
    return null
  }
}

/**
 * Listar documentos de uma proposta
 */
export async function listarDocumentosProposta(propostaId: string): Promise<string[]> {
  try {
    const storageDisponivel = await verificarStorageDisponivel()

    if (storageDisponivel) {
      const { data, error } = await supabase.storage.from(BUCKET_NAME).list(propostaId)

      if (!error && data) {
        return data.map((arquivo) => arquivo.name)
      }
    }

    return []
  } catch (error) {
    console.error("❌ Erro ao listar documentos:", error)
    return []
  }
}
