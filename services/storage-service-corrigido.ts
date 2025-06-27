import { supabase } from "@/lib/supabase"

/**
 * SERVIÇO DE STORAGE CORRIGIDO
 * ============================
 *
 * Corrige os problemas identificados nos logs:
 * 1. Bucket documentos_propostas não encontrado
 * 2. Fallback inteligente para outros buckets
 * 3. Criação automática de bucket se necessário
 */

// Lista de buckets em ordem de prioridade
const BUCKETS_PRIORIDADE = [
  "documentos_propostas",
  "documentos-propostas-corretores",
  "documentos_propostas_corretores",
  "documentos-propostas",
]

/**
 * Verifica quais buckets estão disponíveis
 */
export async function verificarBucketsDisponiveis(): Promise<{
  disponiveis: string[]
  recomendado: string | null
  erro?: string
}> {
  try {
    console.log("🔍 VERIFICANDO BUCKETS DISPONÍVEIS...")

    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
      console.error("❌ Erro ao listar buckets:", error)
      return {
        disponiveis: [],
        recomendado: null,
        erro: error.message,
      }
    }

    const nomesBuckets = buckets?.map((b) => b.name) || []
    console.log("📦 Buckets encontrados:", nomesBuckets)

    // Encontrar o bucket recomendado baseado na prioridade
    let recomendado = null
    for (const bucket of BUCKETS_PRIORIDADE) {
      if (nomesBuckets.includes(bucket)) {
        recomendado = bucket
        break
      }
    }

    console.log(`🎯 Bucket recomendado: ${recomendado || "Nenhum encontrado"}`)

    return {
      disponiveis: nomesBuckets,
      recomendado,
    }
  } catch (error) {
    console.error("❌ Erro ao verificar buckets:", error)
    return {
      disponiveis: [],
      recomendado: null,
      erro: error.message,
    }
  }
}

/**
 * Tenta criar o bucket principal se não existir
 */
export async function criarBucketPrincipal(): Promise<{
  sucesso: boolean
  bucket?: string
  erro?: string
}> {
  try {
    console.log("🔧 TENTANDO CRIAR BUCKET PRINCIPAL...")

    const bucketNome = "documentos_propostas"

    // Verificar se já existe
    const { data: bucketExistente } = await supabase.storage.getBucket(bucketNome)
    if (bucketExistente) {
      console.log(`✅ Bucket ${bucketNome} já existe`)
      return { sucesso: true, bucket: bucketNome }
    }

    // Tentar criar
    const { data, error } = await supabase.storage.createBucket(bucketNome, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"],
    })

    if (error) {
      console.error(`❌ Erro ao criar bucket ${bucketNome}:`, error)
      return { sucesso: false, erro: error.message }
    }

    console.log(`✅ Bucket ${bucketNome} criado com sucesso!`)
    return { sucesso: true, bucket: bucketNome }
  } catch (error) {
    console.error("❌ Erro ao criar bucket principal:", error)
    return { sucesso: false, erro: error.message }
  }
}

/**
 * Seleciona o melhor bucket disponível ou cria um novo
 */
export async function selecionarBucketOtimo(): Promise<{
  bucket: string
  criado: boolean
  erro?: string
}> {
  console.log("🎯 SELECIONANDO BUCKET ÓTIMO...")

  // 1. Verificar buckets disponíveis
  const { disponiveis, recomendado, erro: erroVerificacao } = await verificarBucketsDisponiveis()

  if (erroVerificacao) {
    console.error("❌ Erro na verificação:", erroVerificacao)
    return {
      bucket: BUCKETS_PRIORIDADE[0],
      criado: false,
      erro: erroVerificacao,
    }
  }

  // 2. Se encontrou bucket recomendado, usar ele
  if (recomendado) {
    console.log(`✅ Usando bucket existente: ${recomendado}`)
    return { bucket: recomendado, criado: false }
  }

  // 3. Se não encontrou nenhum, tentar criar o principal
  console.log("⚠️ Nenhum bucket recomendado encontrado, tentando criar...")

  const { sucesso, bucket, erro: erroCriacao } = await criarBucketPrincipal()

  if (sucesso && bucket) {
    console.log(`✅ Bucket criado e selecionado: ${bucket}`)
    return { bucket, criado: true }
  }

  // 4. Se falhou em criar, usar o primeiro disponível ou o padrão
  if (disponiveis.length > 0) {
    const bucketFallback = disponiveis[0]
    console.log(`⚠️ Usando bucket fallback: ${bucketFallback}`)
    return { bucket: bucketFallback, criado: false }
  }

  // 5. Último recurso: usar o bucket padrão mesmo que não exista
  const bucketPadrao = BUCKETS_PRIORIDADE[0]
  console.log(`❌ Usando bucket padrão como último recurso: ${bucketPadrao}`)
  return {
    bucket: bucketPadrao,
    criado: false,
    erro: erroCriacao || "Nenhum bucket disponível",
  }
}

/**
 * Upload de arquivo com seleção automática de bucket
 */
export async function uploadArquivoInteligente(
  nomeArquivo: string,
  arquivo: File,
  bucketEspecifico?: string,
): Promise<{
  url?: string
  bucket?: string
  erro?: string
}> {
  try {
    console.log(`📤 UPLOAD INTELIGENTE: ${nomeArquivo}`)

    // Selecionar bucket
    let bucketUsado = bucketEspecifico
    if (!bucketUsado) {
      const { bucket, erro } = await selecionarBucketOtimo()
      bucketUsado = bucket

      if (erro) {
        console.warn(`⚠️ Aviso na seleção de bucket: ${erro}`)
      }
    }

    console.log(`📦 Bucket selecionado: ${bucketUsado}`)

    // Fazer upload
    const { data, error } = await supabase.storage.from(bucketUsado).upload(nomeArquivo, arquivo, {
      upsert: true,
      contentType: arquivo.type.startsWith("image/") ? "image/jpeg" : arquivo.type,
      cacheControl: "3600",
    })

    if (error) {
      console.error(`❌ Erro no upload para ${bucketUsado}:`, error)
      return { erro: error.message }
    }

    if (!data?.path) {
      return { erro: "Upload não retornou path válido" }
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage.from(bucketUsado).getPublicUrl(data.path)

    if (!urlData?.publicUrl) {
      return { erro: "Não foi possível obter URL pública" }
    }

    console.log(`✅ Upload concluído: ${urlData.publicUrl}`)

    return {
      url: urlData.publicUrl,
      bucket: bucketUsado,
    }
  } catch (error) {
    console.error("❌ Erro no upload inteligente:", error)
    return { erro: error.message }
  }
}

/**
 * Diagnóstico completo do storage
 */
export async function diagnosticarStorage(): Promise<{
  buckets: string[]
  recomendado: string | null
  podecriar: boolean
  erros: string[]
}> {
  console.log("🔍 DIAGNÓSTICO COMPLETO DO STORAGE")
  console.log("=".repeat(50))

  const erros: string[] = []

  // 1. Verificar buckets
  const { disponiveis, recomendado, erro } = await verificarBucketsDisponiveis()
  if (erro) erros.push(`Erro ao listar buckets: ${erro}`)

  // 2. Testar criação de bucket
  let podecriar = false
  try {
    const bucketTeste = `teste-${Date.now()}`
    const { error: erroCriacao } = await supabase.storage.createBucket(bucketTeste, { public: true })

    if (!erroCriacao) {
      podecriar = true
      // Limpar bucket de teste
      await supabase.storage.deleteBucket(bucketTeste)
    } else {
      erros.push(`Não pode criar buckets: ${erroCriacao.message}`)
    }
  } catch (error) {
    erros.push(`Erro ao testar criação: ${error.message}`)
  }

  console.log("📊 RESULTADO DO DIAGNÓSTICO:")
  console.log(`   Buckets disponíveis: ${disponiveis.length}`)
  console.log(`   Bucket recomendado: ${recomendado || "Nenhum"}`)
  console.log(`   Pode criar buckets: ${podecriar ? "Sim" : "Não"}`)
  console.log(`   Erros encontrados: ${erros.length}`)

  return {
    buckets: disponiveis,
    recomendado,
    podecriar,
    erros,
  }
}
