import { supabase } from "@/lib/supabase"

// Tipo para modelo de proposta baseado na estrutura da tabela modelos_propostas
export interface ModeloProposta {
  id: string
  titulo: string
  descricao?: string
  produto_nome?: string
  arquivo_url?: string
  arquivo_nome?: string
  ativo: boolean
  created_at?: string
  updated_at?: string
}

/**
 * Busca um modelo de proposta pelo ID
 * @param id ID do modelo
 * @returns O modelo encontrado ou null
 */
export async function obterModeloProposta(id: string) {
  try {
    console.log(`Buscando modelo de proposta com ID ${id}`)

    const { data, error } = await supabase.from("modelos_propostas").select("*").eq("id", id).single()

    if (error) {
      console.error("Erro ao buscar modelo de proposta:", error)
      return null
    }

    if (!data) {
      console.warn(`Modelo de proposta com ID ${id} não encontrado`)
      return null
    }

    console.log("Modelo de proposta encontrado:", data)
    return data
  } catch (error) {
    console.error("Erro ao buscar modelo de proposta:", error)
    return null
  }
}

/**
 * Busca um modelo de proposta pelo título
 * @param titulo Título do modelo
 * @returns O modelo encontrado ou null
 */
export async function obterModeloPropostaPorTitulo(titulo: string) {
  try {
    console.log(`Buscando modelo de proposta com título "${titulo}"`)

    const { data, error } = await supabase
      .from("modelos_propostas")
      .select("*")
      .ilike("titulo", `%${titulo}%`)
      .eq("ativo", true)
      .limit(1)
      .single()

    if (error) {
      console.error("Erro ao buscar modelo de proposta por título:", error)
      return null
    }

    if (!data) {
      console.warn(`Modelo de proposta com título "${titulo}" não encontrado`)
      return null
    }

    console.log("Modelo de proposta encontrado pelo título:", data)
    return data
  } catch (error) {
    console.error("Erro ao buscar modelo de proposta por título:", error)
    return null
  }
}

/**
 * Busca todos os modelos de proposta ativos
 * @returns Lista de modelos ativos
 */
export async function obterModelosPropostaAtivos() {
  try {
    console.log("Buscando modelos de proposta ativos")

    const { data, error } = await supabase.from("modelos_propostas").select("*").eq("ativo", true)

    if (error) {
      console.error("Erro ao buscar modelos de proposta ativos:", error)
      return []
    }

    if (!data || data.length === 0) {
      console.warn("Nenhum modelo de proposta ativo encontrado")
      return []
    }

    console.log(`Encontrados ${data.length} modelos de proposta ativos`)

    // Registrar todos os modelos encontrados para diagnóstico
    data.forEach((modelo, index) => {
      console.log(`Modelo ${index + 1}: ID=${modelo.id}, Título=${modelo.titulo}, URL=${modelo.arquivo_url}`)
    })

    // Verificar se há um modelo TEST1 e priorizá-lo
    const modeloTEST1 = data.find((modelo) => modelo.titulo && modelo.titulo.includes("TEST1"))
    if (modeloTEST1) {
      console.log(`Encontrado modelo TEST1: ${modeloTEST1.id}. Movendo para o início da lista.`)
      // Remover o modelo TEST1 da lista
      const filteredData = data.filter((modelo) => modelo.id !== modeloTEST1.id)
      // Adicionar o modelo TEST1 no início da lista
      return [modeloTEST1, ...filteredData]
    }

    // Correção específica para o primeiro modelo se for o Amil
    if (data.length > 0 && data[0].arquivo_url && data[0].arquivo_url.includes("Proposta%20Amil.pdf")) {
      console.log("Corrigindo URL para o modelo Amil (removendo barras duplicadas)")
      data[0].arquivo_url = data[0].arquivo_url.replace("//Proposta", "/Proposta")
    }

    return data
  } catch (error) {
    console.error("Erro ao buscar modelos de proposta ativos:", error)
    return []
  }
}

/**
 * Armazena o título do template em memória para uso posterior
 */
const templateTituloCache = new Map<string, string>()

/**
 * Armazena o título do template para uso posterior
 * @param templateId ID do template
 * @param titulo Título do template
 */
export function armazenarTituloTemplate(templateId: string, titulo: string) {
  if (templateId && titulo) {
    console.log(`Armazenando título do template ${templateId}: ${titulo}`)
    templateTituloCache.set(templateId, titulo)
  }
}

/**
 * Obtém o título do template armazenado
 * @param templateId ID do template
 * @returns Título do template ou undefined se não encontrado
 */
export function obterTituloTemplateArmazenado(templateId: string): string | undefined {
  if (!templateId) return undefined

  const titulo = templateTituloCache.get(templateId)
  if (titulo) {
    console.log(`Título do template ${templateId} encontrado em cache: ${titulo}`)
  } else {
    console.log(`Título do template ${templateId} não encontrado em cache`)
  }

  return titulo
}

/**
 * Verifica e atualiza a URL do modelo de proposta
 */
export async function verificarEAtualizarUrlModelo(modeloId: string, urlCorreta: string): Promise<boolean> {
  try {
    console.log(`Verificando e atualizando URL do modelo ${modeloId}`)
    console.log(`URL correta: ${urlCorreta}`)

    // Buscar o modelo atual
    const { data: modelo, error } = await supabase.from("modelos_propostas").select("*").eq("id", modeloId).single()

    if (error) {
      console.error("Erro ao buscar modelo para atualização:", error)
      return false
    }

    if (!modelo) {
      console.error("Modelo não encontrado para atualização")
      return false
    }

    console.log("URL atual no banco de dados:", modelo.arquivo_url)

    // Se a URL estiver diferente, atualizar
    if (modelo.arquivo_url !== urlCorreta) {
      console.log("URLs diferentes, atualizando no banco de dados")

      const { error: updateError } = await supabase
        .from("modelos_propostas")
        .update({ arquivo_url: urlCorreta })
        .eq("id", modeloId)

      if (updateError) {
        console.error("Erro ao atualizar URL do modelo:", updateError)
        return false
      }

      console.log("URL do modelo atualizada com sucesso")
      return true
    } else {
      console.log("URL já está correta no banco de dados")
      return true
    }
  } catch (error) {
    console.error("Erro ao verificar e atualizar URL do modelo:", error)
    return false
  }
}

/**
 * Busca todos os modelos de propostas
 */
export async function listarTodosModelosPropostas(): Promise<ModeloProposta[]> {
  try {
    const { data, error } = await supabase.from("modelos_propostas").select("*").order("titulo", { ascending: true })

    if (error) {
      console.error("Erro ao listar todos os modelos de propostas:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Erro ao listar todos os modelos de propostas:", error)
    throw error
  }
}

/**
 * Cria um novo modelo de proposta
 */
export async function criarModeloProposta(
  modelo: Omit<ModeloProposta, "id" | "created_at" | "updated_at">,
): Promise<ModeloProposta> {
  try {
    // Corrigir URL do arquivo se existir
    if (modelo.arquivo_url) {
      modelo.arquivo_url = modelo.arquivo_url.replace(/([^:])\/\/+/g, "$1/")
    }

    const { data, error } = await supabase.from("modelos_propostas").insert(modelo).select().single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("Erro ao criar modelo de proposta:", error)
    throw error
  }
}

/**
 * Atualiza um modelo de proposta existente
 */
export async function atualizarModeloProposta(id: string, modelo: Partial<ModeloProposta>): Promise<ModeloProposta> {
  try {
    // Corrigir URL do arquivo se existir
    if (modelo.arquivo_url) {
      modelo.arquivo_url = modelo.arquivo_url.replace(/([^:])\/\/+/g, "$1/")
    }

    const { data, error } = await supabase.from("modelos_propostas").update(modelo).eq("id", id).select().single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("Erro ao atualizar modelo de proposta:", error)
    throw error
  }
}

/**
 * Exclui um modelo de proposta
 */
export async function excluirModeloProposta(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("modelos_propostas").delete().eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("Erro ao excluir modelo de proposta:", error)
    throw error
  }
}

/**
 * Busca o arquivo PDF de um modelo de proposta
 */
export async function obterArquivoModeloProposta(url: string): Promise<ArrayBuffer | null> {
  try {
    console.log("Obtendo arquivo do modelo de proposta:", url)

    // Processar a URL para garantir que seja válida
    let processedUrl = url.trim()

    // Corrigir duplicação de barras no caminho
    processedUrl = processedUrl.replace(/([^:])\/\/+/g, "$1/")
    console.log("URL após correção de barras duplicadas:", processedUrl)

    // Verificar se a URL é um caminho do Supabase Storage
    if (processedUrl.startsWith("/arquivos/") || !processedUrl.startsWith("http")) {
      console.log("URL parece ser um caminho do Supabase Storage, obtendo URL pública")

      // Remover o prefixo "/arquivos/" se existir
      const storagePath = processedUrl.replace(/^\/arquivos\//, "")

      // Obter a URL pública do arquivo
      const { data: urlData } = supabase.storage.from("arquivos").getPublicUrl(storagePath)

      if (!urlData || !urlData.publicUrl) {
        throw new Error(`Não foi possível obter a URL pública para o caminho: ${storagePath}`)
      }

      processedUrl = urlData.publicUrl
      console.log("URL pública obtida:", processedUrl)
    }

    // Verificar se a URL tem protocolo
    if (!processedUrl.startsWith("http://") && !processedUrl.startsWith("https://")) {
      console.log("URL sem protocolo, adicionando https://")
      processedUrl = `https://${processedUrl}`
    }

    console.log("URL processada para download:", processedUrl)

    // Tentar baixar o arquivo diretamente
    try {
      const response = await fetch(processedUrl, {
        method: "GET",
        headers: {
          Accept: "application/pdf,*/*",
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        console.error(`Erro HTTP ao baixar arquivo: ${response.status} ${response.statusText}`)

        // Tentar uma abordagem alternativa para URLs do Supabase
        if (processedUrl.includes("supabase") && processedUrl.includes("storage")) {
          console.log("Tentando abordagem alternativa para URL do Supabase...")

          // Extrair o bucket e o caminho do arquivo da URL
          const matches = processedUrl.match(/public\/([^/]+)\/(.+)$/)
          if (matches && matches.length >= 3) {
            const bucket = matches[1]
            const filePath = decodeURIComponent(matches[2])
            console.log(`Bucket extraído: ${bucket}, Caminho do arquivo: ${filePath}`)

            // Tentar obter o arquivo diretamente do storage
            const { data, error } = await supabase.storage.from(bucket).download(filePath)

            if (error) {
              console.error("Erro ao baixar diretamente do storage:", error)
              throw error
            }

            if (data) {
              console.log("Arquivo baixado diretamente do storage com sucesso")
              return await data.arrayBuffer()
            }
          }
        }

        throw new Error(`Erro ao buscar arquivo: ${response.status} ${response.statusText}`)
      }

      return await response.arrayBuffer()
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error)
      throw error
    }
  } catch (error) {
    console.error("Erro ao obter arquivo do modelo de proposta:", error)
    return null
  }
}
