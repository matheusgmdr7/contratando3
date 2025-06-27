import { supabase } from "@/lib/supabase"

/**
 * SERVIÇO DE UPLOAD CORRIGIDO - FOCO NO PROBLEMA REAL
 * ===================================================
 *
 * Problemas identificados e corrigidos:
 * 1. Conversão para JPEG estava causando problemas
 * 2. Detecção de tipo MIME incorreta
 * 3. Sempre usar o mesmo bucket: documentos_propostas
 */

const BUCKET_PRINCIPAL = "documentos_propostas"

/**
 * Converte arquivo para JPEG de forma mais robusta
 */
async function converterParaJPEGSeguro(file: File, qualidade = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Iniciando conversão para JPEG: ${file.name}`)

    // Se já for JPEG, retorna o arquivo original
    if (
      file.type === "image/jpeg" ||
      file.name.toLowerCase().endsWith(".jpg") ||
      file.name.toLowerCase().endsWith(".jpeg")
    ) {
      console.log("✅ Arquivo já é JPEG, mantendo original")
      resolve(file)
      return
    }

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      console.error("❌ Não foi possível obter contexto do canvas")
      resolve(file) // Fallback: usar arquivo original
      return
    }

    const img = new Image()

    img.onload = () => {
      try {
        console.log(`📐 Dimensões originais: ${img.width}x${img.height}`)

        // Redimensionar se muito grande (otimização)
        let { width, height } = img
        const maxSize = 1920

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width
            width = maxSize
          } else {
            width = (width * maxSize) / height
            height = maxSize
          }
          console.log(`📐 Redimensionado para: ${width}x${height}`)
        }

        canvas.width = width
        canvas.height = height

        // Preencher com fundo branco (importante para transparências)
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, width, height)

        // Desenhar a imagem
        ctx.drawImage(img, 0, 0, width, height)

        // Converter para JPEG
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const nomeArquivo = file.name.replace(/\.[^/.]+$/, ".jpg")
              const arquivoJPEG = new File([blob], nomeArquivo, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })

              console.log(`✅ Conversão concluída: ${nomeArquivo} (${(blob.size / 1024).toFixed(1)}KB)`)
              resolve(arquivoJPEG)
            } else {
              console.error("❌ Erro ao gerar blob JPEG")
              resolve(file) // Fallback: usar arquivo original
            }
          },
          "image/jpeg",
          qualidade,
        )
      } catch (error) {
        console.error("❌ Erro durante conversão:", error)
        resolve(file) // Fallback: usar arquivo original
      }
    }

    img.onerror = (error) => {
      console.error("❌ Erro ao carregar imagem para conversão:", error)
      resolve(file) // Fallback: usar arquivo original
    }

    // Definir crossOrigin para evitar problemas de CORS
    img.crossOrigin = "anonymous"
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Faz upload de um único arquivo com tratamento robusto
 */
async function uploadArquivoSeguro(caminho: string, arquivo: File): Promise<{ url?: string; error?: any }> {
  try {
    console.log(`📤 UPLOAD SEGURO: ${caminho}`)
    console.log(`📄 Arquivo original: ${arquivo.name} (${arquivo.type}) - ${(arquivo.size / 1024 / 1024).toFixed(2)}MB`)

    // Validações básicas
    if (arquivo.size > 10 * 1024 * 1024) {
      throw new Error("Arquivo muito grande (máximo 10MB)")
    }

    let arquivoFinal = arquivo

    // Converter para JPEG apenas se for imagem e não for JPEG
    if (arquivo.type.startsWith("image/") && arquivo.type !== "image/jpeg") {
      console.log("🔄 Convertendo para JPEG...")
      try {
        arquivoFinal = await converterParaJPEGSeguro(arquivo)
      } catch (conversionError) {
        console.warn("⚠️ Falha na conversão, usando arquivo original:", conversionError)
        arquivoFinal = arquivo
      }
    }

    console.log(
      `📄 Arquivo final: ${arquivoFinal.name} (${arquivoFinal.type}) - ${(arquivoFinal.size / 1024 / 1024).toFixed(2)}MB`,
    )

    // Opções de upload otimizadas
    const options = {
      upsert: true,
      contentType: arquivoFinal.type === "image/jpeg" ? "image/jpeg" : arquivoFinal.type,
      cacheControl: "3600",
    }

    console.log("🔧 Opções de upload:", options)

    // SEMPRE usar o bucket principal
    const { data, error } = await supabase.storage.from(BUCKET_PRINCIPAL).upload(caminho, arquivoFinal, options)

    if (error) {
      console.error("❌ Erro no upload:", error)

      // Log detalhado do erro
      console.error("❌ Detalhes do erro:")
      console.error("   - Código:", error.statusCode)
      console.error("   - Mensagem:", error.message)
      console.error("   - Bucket:", BUCKET_PRINCIPAL)
      console.error("   - Caminho:", caminho)

      return { error }
    }

    if (!data?.path) {
      const erro = new Error("Upload não retornou path válido")
      console.error("❌", erro.message)
      return { error: erro }
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage.from(BUCKET_PRINCIPAL).getPublicUrl(data.path)

    if (!urlData?.publicUrl) {
      const erro = new Error("Não foi possível obter URL pública")
      console.error("❌", erro.message)
      return { error: erro }
    }

    console.log(`✅ Upload concluído com sucesso!`)
    console.log(`🔗 URL: ${urlData.publicUrl}`)

    return { url: urlData.publicUrl }
  } catch (error) {
    console.error("❌ Erro geral no upload:", error)
    return { error }
  }
}

/**
 * Gera caminho único para o arquivo
 */
function gerarCaminhoArquivo(propostaId: string, tipoDocumento: string, dependenteIndex?: number): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)

  if (dependenteIndex !== undefined) {
    return `proposta_${propostaId}/dependente_${dependenteIndex}/${tipoDocumento}_${timestamp}_${random}.jpg`
  }

  return `proposta_${propostaId}/titular/${tipoDocumento}_${timestamp}_${random}.jpg`
}

/**
 * CLASSE PRINCIPAL: Upload Service Corrigido
 */
export class UploadService {
  /**
   * Upload de documentos - SEMPRE no mesmo bucket
   */
  static async uploadDocumentos(
    propostaId: string,
    documentosTitular: { [key: string]: File | null },
    documentosDependentes: { [key: string]: File | null }[] = [],
  ): Promise<{
    documentosUrls: { [key: string]: string }
    documentosDependentesUrls: { [key: string]: { [key: string]: string } }
    bucketUsado: string
    erros: string[]
  }> {
    console.log("🚀 UPLOAD SERVICE CORRIGIDO - INICIANDO")
    console.log("=".repeat(60))
    console.log(`📋 Proposta ID: ${propostaId}`)
    console.log(`📦 Bucket: ${BUCKET_PRINCIPAL} (SEMPRE O MESMO)`)

    const documentosUrls: { [key: string]: string } = {}
    const documentosDependentesUrls: { [key: string]: { [key: string]: string } } = {}
    const erros: string[] = []

    // 1. VERIFICAR SE O BUCKET EXISTE
    try {
      const { data: bucketInfo, error: bucketError } = await supabase.storage.getBucket(BUCKET_PRINCIPAL)

      if (bucketError || !bucketInfo) {
        const erro = `Bucket ${BUCKET_PRINCIPAL} não encontrado ou inacessível: ${bucketError?.message}`
        console.error("❌", erro)
        erros.push(erro)

        return {
          documentosUrls,
          documentosDependentesUrls,
          bucketUsado: BUCKET_PRINCIPAL,
          erros,
        }
      }

      console.log(`✅ Bucket ${BUCKET_PRINCIPAL} verificado e acessível`)
    } catch (error) {
      const erro = `Erro ao verificar bucket: ${error.message}`
      console.error("❌", erro)
      erros.push(erro)
    }

    // 2. UPLOAD DOS DOCUMENTOS DO TITULAR
    console.log("\n📎 PROCESSANDO DOCUMENTOS DO TITULAR:")
    for (const [tipoDoc, arquivo] of Object.entries(documentosTitular)) {
      if (!arquivo) {
        console.log(`⚠️ ${tipoDoc}: arquivo não fornecido`)
        continue
      }

      try {
        const caminho = gerarCaminhoArquivo(propostaId, tipoDoc)
        const resultado = await uploadArquivoSeguro(caminho, arquivo)

        if (resultado.url) {
          documentosUrls[tipoDoc] = resultado.url
          console.log(`✅ ${tipoDoc}: sucesso`)
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
      console.log("\n👨‍👩‍👧‍👦 PROCESSANDO DOCUMENTOS DOS DEPENDENTES:")

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
            const caminho = gerarCaminhoArquivo(propostaId, tipoDoc, i)
            const resultado = await uploadArquivoSeguro(caminho, arquivo)

            if (resultado.url) {
              documentosDependentesUrls[i][tipoDoc] = resultado.url
              console.log(`✅ ${tipoDoc}: sucesso`)
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
    console.log(`📦 Bucket usado: ${BUCKET_PRINCIPAL}`)
    console.log(`📎 Documentos titular: ${Object.keys(documentosUrls).length}`)
    console.log(`👨‍👩‍👧‍👦 Documentos dependentes: ${Object.keys(documentosDependentesUrls).length}`)
    console.log(`❌ Erros: ${erros.length}`)

    if (erros.length > 0) {
      console.log("\n❌ ERROS ENCONTRADOS:")
      erros.forEach((erro, index) => {
        console.log(`   ${index + 1}. ${erro}`)
      })
    } else {
      console.log("🎉 TODOS OS UPLOADS CONCLUÍDOS COM SUCESSO!")
    }

    console.log("=".repeat(60))

    return {
      documentosUrls,
      documentosDependentesUrls,
      bucketUsado: BUCKET_PRINCIPAL,
      erros,
    }
  }

  /**
   * Função para verificar se o bucket principal está acessível
   */
  static async verificarBucket(): Promise<{ existe: boolean; erro?: string }> {
    try {
      const { data, error } = await supabase.storage.getBucket(BUCKET_PRINCIPAL)

      if (error) {
        return { existe: false, erro: error.message }
      }

      return { existe: !!data }
    } catch (error) {
      return { existe: false, erro: error.message }
    }
  }
}

/**
 * Função de conveniência para manter compatibilidade
 */
export async function uploadDocumentos(
  propostaId: string,
  nomeCliente: string,
  documentos: any,
  documentosDependentes?: any,
) {
  // Converter formato antigo para novo
  const documentosTitular: { [key: string]: File | null } = {}
  const documentosDependentesArray: { [key: string]: File | null }[] = []

  // Processar documentos do titular
  if (documentos) {
    for (const [key, file] of Object.entries(documentos)) {
      documentosTitular[key] = file as File | null
    }
  }

  // Processar documentos dos dependentes
  if (documentosDependentes && Array.isArray(documentosDependentes)) {
    for (const docsDep of documentosDependentes) {
      if (docsDep) {
        const docsDepFormatados: { [key: string]: File | null } = {}
        for (const [key, file] of Object.entries(docsDep)) {
          docsDepFormatados[key] = file as File | null
        }
        documentosDependentesArray.push(docsDepFormatados)
      }
    }
  }

  return UploadService.uploadDocumentos(propostaId, documentosTitular, documentosDependentesArray)
}
