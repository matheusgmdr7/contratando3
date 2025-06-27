import { supabase } from "@/lib/supabase"

/**
 * SERVIÇO DE UPLOAD OTIMIZADO - VERSÃO CORRIGIDA
 * ==============================================
 *
 * Corrige os problemas identificados:
 * 1. Bucket documentos_propostas não encontrado
 * 2. Coluna bucket_usado faltante
 * 3. Upload com fallback inteligente
 */

// CONFIGURAÇÃO DOS BUCKETS
const BUCKETS_CONFIG = {
  principal: "documentos_propostas",
  fallback: "documentos-propostas-corretores",
  alternativo: "documentos_propostas_corretores",
}

/**
 * Verifica quais buckets estão disponíveis
 */
async function verificarBucketsDisponiveis(): Promise<string[]> {
  try {
    console.log("🔍 Verificando buckets disponíveis...")

    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
      console.error("❌ Erro ao listar buckets:", error)
      return []
    }

    const nomesBuckets = buckets?.map((b) => b.name) || []
    console.log("📦 Buckets encontrados:", nomesBuckets)

    return nomesBuckets
  } catch (error) {
    console.error("❌ Erro ao verificar buckets:", error)
    return []
  }
}

/**
 * Seleciona o melhor bucket disponível
 */
async function selecionarBucketDisponivel(): Promise<string> {
  const bucketsDisponiveis = await verificarBucketsDisponiveis()

  // Ordem de prioridade
  const prioridades = [BUCKETS_CONFIG.principal, BUCKETS_CONFIG.fallback, BUCKETS_CONFIG.alternativo]

  for (const bucket of prioridades) {
    if (bucketsDisponiveis.includes(bucket)) {
      console.log(`✅ Bucket selecionado: ${bucket}`)
      return bucket
    }
  }

  // Se nenhum bucket específico foi encontrado, usar o primeiro disponível
  if (bucketsDisponiveis.length > 0) {
    const bucketGenerico = bucketsDisponiveis[0]
    console.log(`⚠️ Usando bucket genérico: ${bucketGenerico}`)
    return bucketGenerico
  }

  // Último recurso: tentar criar o bucket principal
  console.log("❌ Nenhum bucket encontrado, tentando usar o principal mesmo assim")
  return BUCKETS_CONFIG.principal
}

/**
 * Converte arquivo para JPEG se necessário
 */
async function converterParaJPEG(file: File, qualidade = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    // Se já for JPEG, retorna o arquivo original
    if (file.type === "image/jpeg") {
      resolve(file)
      return
    }

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      // Redimensionar se muito grande
      let { width, height } = img
      const maxSize = 1920 // Máximo 1920px

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height * maxSize) / width
          width = maxSize
        } else {
          width = (width * maxSize) / height
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height

      // Desenhar a imagem redimensionada
      ctx?.drawImage(img, 0, 0, width, height)

      // Converter para JPEG
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const nomeArquivo = file.name.replace(/\.[^/.]+$/, ".jpg")
            const arquivoJPEG = new File([blob], nomeArquivo, {
              type: "image/jpeg",
              lastModified: Date.now(),
            })
            resolve(arquivoJPEG)
          } else {
            reject(new Error("Erro ao converter para JPEG"))
          }
        },
        "image/jpeg",
        qualidade,
      )
    }

    img.onerror = () => reject(new Error("Erro ao carregar imagem"))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Faz upload de um único arquivo
 */
async function uploadArquivo(bucket: string, caminho: string, arquivo: File): Promise<{ url?: string; error?: any }> {
  try {
    console.log(`📤 Upload: ${bucket}/${caminho}`)
    console.log(`📄 Arquivo: ${arquivo.name} (${(arquivo.size / 1024 / 1024).toFixed(2)}MB)`)

    // Converter para JPEG se for imagem
    let arquivoFinal = arquivo
    if (arquivo.type.startsWith("image/") && arquivo.type !== "image/jpeg") {
      console.log("🔄 Convertendo para JPEG...")
      try {
        arquivoFinal = await converterParaJPEG(arquivo)
        console.log("✅ Conversão concluída")
      } catch (conversionError) {
        console.warn("⚠️ Falha na conversão, usando arquivo original:", conversionError)
      }
    }

    // Opções de upload
    const options = {
      upsert: true,
      contentType: arquivoFinal.type.startsWith("image/") ? "image/jpeg" : arquivo.type,
      cacheControl: "3600",
    }

    console.log("🔧 Opções de upload:", options)

    // Fazer upload
    const { data, error } = await supabase.storage.from(bucket).upload(caminho, arquivoFinal, options)

    if (error) {
      console.error("❌ Erro no upload:", error)
      return { error }
    }

    if (!data?.path) {
      return { error: new Error("Upload não retornou path válido") }
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

    if (!urlData?.publicUrl) {
      return { error: new Error("Não foi possível obter URL pública") }
    }

    console.log(`✅ Upload concluído: ${urlData.publicUrl}`)
    return { url: urlData.publicUrl }
  } catch (error) {
    console.error("❌ Erro geral no upload:", error)
    return { error }
  }
}

/**
 * Gera nome de arquivo único
 */
function gerarNomeArquivo(propostaId: string, tipoDocumento: string, dependenteIndex?: number): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)

  if (dependenteIndex !== undefined) {
    return `proposta_${propostaId}/dependente_${dependenteIndex}/${tipoDocumento}_${timestamp}_${random}.jpg`
  }

  return `proposta_${propostaId}/titular/${tipoDocumento}_${timestamp}_${random}.jpg`
}

/**
 * FUNÇÃO PRINCIPAL: Upload de documentos com fallback inteligente
 */
export class UploadService {
  static async uploadDocumentos(
    propostaId: string,
    documentosTitular: { [key: string]: File | null },
    documentosDependentes: { [key: string]: File | null }[],
  ): Promise<{
    documentosUrls: { [key: string]: string }
    documentosDependentesUrls: { [key: string]: { [key: string]: string } }
    bucketUsado: string
    erros: string[]
  }> {
    console.log("🚀 INICIANDO UPLOAD DE DOCUMENTOS - VERSÃO CORRIGIDA")
    console.log("=".repeat(60))
    console.log(`📋 Proposta ID: ${propostaId}`)

    const documentosUrls: { [key: string]: string } = {}
    const documentosDependentesUrls: { [key: string]: { [key: string]: string } } = {}
    const erros: string[] = []

    // 1. SELECIONAR BUCKET DISPONÍVEL
    const bucketUsado = await selecionarBucketDisponivel()
    console.log(`📦 Bucket selecionado: ${bucketUsado}`)

    // 2. UPLOAD DOS DOCUMENTOS DO TITULAR
    console.log("\n📎 UPLOAD DOCUMENTOS DO TITULAR:")
    for (const [tipoDoc, arquivo] of Object.entries(documentosTitular)) {
      if (!arquivo) {
        console.log(`⚠️ ${tipoDoc}: arquivo não fornecido`)
        continue
      }

      try {
        const nomeArquivo = gerarNomeArquivo(propostaId, tipoDoc)
        const resultado = await uploadArquivo(bucketUsado, nomeArquivo, arquivo)

        if (resultado.url) {
          documentosUrls[tipoDoc] = resultado.url
          console.log(`✅ ${tipoDoc}: ${resultado.url}`)
        } else {
          const erro = `Falha no upload de ${tipoDoc}: ${resultado.error?.message || "Erro desconhecido"}`
          erros.push(erro)
          console.error(`❌ ${erro}`)
        }
      } catch (error) {
        const erro = `Erro no upload de ${tipoDoc}: ${error.message}`
        erros.push(erro)
        console.error(`❌ ${erro}`)
      }
    }

    // 3. UPLOAD DOS DOCUMENTOS DOS DEPENDENTES
    if (documentosDependentes && documentosDependentes.length > 0) {
      console.log("\n👨‍👩‍👧‍👦 UPLOAD DOCUMENTOS DOS DEPENDENTES:")

      for (let i = 0; i < documentosDependentes.length; i++) {
        const docsDependente = documentosDependentes[i]
        if (!docsDependente) continue

        console.log(`\n📋 Dependente ${i + 1}:`)
        documentosDependentesUrls[i] = {}

        for (const [tipoDoc, arquivo] of Object.entries(docsDependente)) {
          if (!arquivo) {
            console.log(`⚠️ ${tipoDoc}: arquivo não fornecido`)
            continue
          }

          try {
            const nomeArquivo = gerarNomeArquivo(propostaId, tipoDoc, i)
            const resultado = await uploadArquivo(bucketUsado, nomeArquivo, arquivo)

            if (resultado.url) {
              documentosDependentesUrls[i][tipoDoc] = resultado.url
              console.log(`✅ ${tipoDoc}: ${resultado.url}`)
            } else {
              const erro = `Falha no upload de ${tipoDoc} (dependente ${i + 1}): ${resultado.error?.message || "Erro desconhecido"}`
              erros.push(erro)
              console.error(`❌ ${erro}`)
            }
          } catch (error) {
            const erro = `Erro no upload de ${tipoDoc} (dependente ${i + 1}): ${error.message}`
            erros.push(erro)
            console.error(`❌ ${erro}`)
          }
        }
      }
    }

    // 4. RESUMO FINAL
    console.log("\n📊 RESUMO DO UPLOAD:")
    console.log(`📦 Bucket usado: ${bucketUsado}`)
    console.log(`📎 Documentos titular: ${Object.keys(documentosUrls).length}`)
    console.log(`👨‍👩‍👧‍👦 Documentos dependentes: ${Object.keys(documentosDependentesUrls).length}`)
    console.log(`❌ Erros: ${erros.length}`)

    if (erros.length > 0) {
      console.log("\n❌ ERROS ENCONTRADOS:")
      erros.forEach((erro, index) => {
        console.log(`   ${index + 1}. ${erro}`)
      })
    }

    console.log("=".repeat(60))
    console.log("🎯 UPLOAD DE DOCUMENTOS FINALIZADO")

    return {
      documentosUrls,
      documentosDependentesUrls,
      bucketUsado,
      erros,
    }
  }

  /**
   * Função auxiliar para verificar se um bucket existe
   */
  static async verificarBucket(nomeBucket: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.getBucket(nomeBucket)
      return !error && !!data
    } catch {
      return false
    }
  }

  /**
   * Função auxiliar para criar bucket se não existir
   */
  static async criarBucketSeNecessario(nomeBucket: string): Promise<boolean> {
    try {
      const existe = await this.verificarBucket(nomeBucket)
      if (existe) {
        console.log(`✅ Bucket ${nomeBucket} já existe`)
        return true
      }

      console.log(`🔧 Criando bucket ${nomeBucket}...`)
      const { error } = await supabase.storage.createBucket(nomeBucket, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"],
      })

      if (error) {
        console.error(`❌ Erro ao criar bucket ${nomeBucket}:`, error)
        return false
      }

      console.log(`✅ Bucket ${nomeBucket} criado com sucesso`)
      return true
    } catch (error) {
      console.error(`❌ Erro ao criar bucket ${nomeBucket}:`, error)
      return false
    }
  }
}
