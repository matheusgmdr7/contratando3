import { supabase, testarConexaoSupabase } from "@/lib/supabase"

/**
 * SERVIÇO DE PROPOSTAS CORRIGIDO PARA USAR TABELA propostas_corretores
 * ===================================================================
 */

// CORREÇÃO: Usar a tabela correta que tem as colunas de documentos
const TABELA_PROPOSTAS = "propostas_corretores"
const BUCKET_DOCUMENTOS = "documentos-propostas-corretores"

/**
 * Função auxiliar para tratar erros de API key
 */
async function tratarErroAPIKey(funcao: string, error: any) {
  console.error(`❌ ${funcao} - Erro de API key detectado:`, error)

  // Tentar reconectar
  const reconectado = await testarConexaoSupabase()
  if (reconectado) {
    console.log(`✅ ${funcao} - Reconexão bem-sucedida após erro de API key`)
    return true
  }

  console.error(`❌ ${funcao} - Falha na reconexão após erro de API key`)
  return false
}

/**
 * CORREÇÃO: Buscar propostas da tabela correta
 */
export async function buscarPropostas() {
  try {
    console.log("🔍 BUSCANDO PROPOSTAS DA TABELA CORRIGIDA")
    console.log("=".repeat(50))
    console.log("📋 Tabela:", TABELA_PROPOSTAS)

    const { data, error } = await supabase.from(TABELA_PROPOSTAS).select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Erro ao buscar propostas:", error)
      throw new Error(`Erro ao buscar propostas: ${error.message}`)
    }

    console.log("✅ Propostas encontradas:", data?.length || 0)

    if (data && data.length > 0) {
      console.log("📊 Distribuição de Status:")
      const statusCount = {}
      data.forEach((proposta) => {
        const status = proposta.status || "sem_status"
        statusCount[status] = (statusCount[status] || 0) + 1
      })

      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`   ${status}: ${count} proposta(s)`)
      })
    }

    return data || []
  } catch (error) {
    console.error("❌ Erro ao buscar propostas:", error)
    throw error
  }
}

/**
 * CORREÇÃO: Buscar proposta completa com campos corretos
 */
export async function buscarPropostaCompleta(propostaId: string) {
  try {
    console.log("🔍 BUSCANDO PROPOSTA COMPLETA - VERSÃO CORRIGIDA")
    console.log("=".repeat(50))
    console.log("📋 Proposta ID:", propostaId)
    console.log("📋 Tabela:", TABELA_PROPOSTAS)

    const { data: proposta, error } = await supabase.from(TABELA_PROPOSTAS).select("*").eq("id", propostaId).single()

    if (error) {
      console.error("❌ Erro ao buscar proposta:", error)
      throw error
    }

    if (!proposta) {
      console.error("❌ Proposta não encontrada")
      throw new Error("Proposta não encontrada")
    }

    console.log("✅ Proposta encontrada:")
    console.log("   Cliente:", proposta.cliente)
    console.log("   Email:", proposta.email_cliente)
    console.log("   Status:", proposta.status)

    // ANÁLISE DOS DOCUMENTOS COM CAMPOS CORRETOS
    console.log("\n📎 ANÁLISE DOS DOCUMENTOS:")

    // Verificar campo JSON principal
    if (proposta.documentos_urls && typeof proposta.documentos_urls === "object") {
      const docsCount = Object.keys(proposta.documentos_urls).length
      console.log(`   ✅ documentos_urls: ${docsCount} documento(s)`)
      console.log(`      Tipos: ${Object.keys(proposta.documentos_urls).join(", ")}`)
    } else {
      console.log("   ❌ documentos_urls: vazio ou inválido")
    }

    // Verificar campos individuais
    const camposIndividuais = ["rg_frente_url", "rg_verso_url", "cpf_url", "comprovante_residencia_url", "cns_url"]
    let docsIndividuais = 0

    camposIndividuais.forEach((campo) => {
      if (proposta[campo] && typeof proposta[campo] === "string" && proposta[campo].trim() !== "") {
        console.log(`   ✅ ${campo}: ${proposta[campo].substring(0, 50)}...`)
        docsIndividuais++
      } else {
        console.log(`   ❌ ${campo}: vazio`)
      }
    })

    console.log(`📊 Total documentos individuais: ${docsIndividuais}`)

    return proposta
  } catch (error) {
    console.error("❌ Erro ao buscar proposta completa:", error)
    throw error
  }
}

/**
 * CORREÇÃO: Buscar dependentes da tabela correta
 */
export async function buscarDependentesProposta(propostaId: string) {
  try {
    console.log("👨‍👩‍👧‍👦 BUSCANDO DEPENDENTES - VERSÃO CORRIGIDA")
    console.log("=".repeat(60))
    console.log("📋 Proposta ID:", propostaId)

    // Usar a tabela correta para dependentes de propostas de corretores
    const { data, error } = await supabase
      .from("dependentes_propostas_corretores")
      .select("*")
      .eq("proposta_corretor_id", propostaId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("❌ Erro ao buscar dependentes:", error)
      // Não falhar, apenas retornar array vazio
      return []
    }

    if (data && data.length > 0) {
      console.log(`✅ Dependentes encontrados: ${data.length}`)

      data.forEach((dep, index) => {
        console.log(`📋 Dependente ${index + 1}:`)
        console.log(`   Nome: ${dep.nome}`)
        console.log(`   CPF: ${dep.cpf}`)
        console.log(`   Parentesco: ${dep.parentesco}`)
      })
    } else {
      console.log("ℹ️ Nenhum dependente encontrado")
    }

    return data || []
  } catch (error) {
    console.error("❌ Erro ao buscar dependentes:", error)
    return []
  }
}

/**
 * CORREÇÃO: Função inteligente para obter documentos dos campos corretos
 */
export function obterDocumentosInteligente(objeto: any, tipo: "titular" | "dependente" = "titular") {
  console.log(`📎 OBTENDO DOCUMENTOS - VERSÃO CORRIGIDA (${tipo.toUpperCase()})`)

  if (!objeto) {
    console.log("❌ Objeto não fornecido")
    return {}
  }

  let documentosEncontrados = {}
  let campoUtilizado = null

  // PRIORIDADE 1: Campo JSON documentos_urls (para propostas_corretores)
  if (
    objeto.documentos_urls &&
    typeof objeto.documentos_urls === "object" &&
    Object.keys(objeto.documentos_urls).length > 0
  ) {
    console.log("✅ Documentos encontrados em: documentos_urls (JSON)")
    console.log(`📊 Quantidade: ${Object.keys(objeto.documentos_urls).length}`)
    console.log(`📋 Tipos: ${Object.keys(objeto.documentos_urls).join(", ")}`)

    documentosEncontrados = objeto.documentos_urls
    campoUtilizado = "documentos_urls"
  }

  // PRIORIDADE 2: Campos individuais (para propostas_corretores)
  else if (tipo === "titular") {
    const camposIndividuais = {
      rg_frente: objeto.rg_frente_url,
      rg_verso: objeto.rg_verso_url,
      cpf: objeto.cpf_url,
      comprovante_residencia: objeto.comprovante_residencia_url,
      cns: objeto.cns_url,
    }

    Object.entries(camposIndividuais).forEach(([nomeDoc, url]) => {
      if (url && typeof url === "string" && url.trim() !== "") {
        documentosEncontrados[nomeDoc] = url
        console.log(`✅ Documento individual encontrado: ${nomeDoc}`)
      }
    })

    if (Object.keys(documentosEncontrados).length > 0) {
      campoUtilizado = "campos_individuais"
    }
  }

  // PRIORIDADE 3: Outros campos JSON (compatibilidade com tabela antiga)
  if (Object.keys(documentosEncontrados).length === 0) {
    const camposAlternativos = ["documentos", "anexos", "arquivos"]

    for (const campo of camposAlternativos) {
      if (objeto[campo] && typeof objeto[campo] === "object" && Object.keys(objeto[campo]).length > 0) {
        console.log(`✅ Documentos encontrados em: ${campo} (fallback)`)
        documentosEncontrados = objeto[campo]
        campoUtilizado = campo
        break
      }
    }
  }

  if (Object.keys(documentosEncontrados).length > 0) {
    console.log(`🎯 RESULTADO: ${Object.keys(documentosEncontrados).length} documento(s) do campo ${campoUtilizado}`)

    // Validar URLs
    const documentosValidos = {}
    Object.entries(documentosEncontrados).forEach(([tipo, url]) => {
      if (typeof url === "string" && (url.startsWith("http") || url.startsWith("/"))) {
        documentosValidos[tipo] = url
        console.log(`   ✅ ${tipo}: URL válida`)
      } else {
        console.log(`   ⚠️ ${tipo}: URL inválida - ${url}`)
      }
    })

    return documentosValidos
  } else {
    console.log("❌ Nenhum documento encontrado")
    return {}
  }
}

/**
 * Buscar questionário de saúde (mantido igual)
 */
export async function buscarQuestionarioSaude(propostaId: string, dependenteId?: string) {
  try {
    console.log("🏥 BUSCANDO QUESTIONÁRIO DE SAÚDE")
    console.log("📋 Proposta ID:", propostaId)
    if (dependenteId) {
      console.log("👤 Dependente ID:", dependenteId)
    }

    // Tentar buscar na tabela de questionários de corretores primeiro
    const tabelasQuestionario = ["questionario_saude_corretores", "questionario_saude", "questionario_saude_propostas"]

    for (const tabela of tabelasQuestionario) {
      try {
        console.log(`🔍 Tentando buscar questionário na tabela: ${tabela}`)

        let query = supabase.from(tabela).select("*").eq("proposta_id", propostaId)

        if (dependenteId) {
          query = query.eq("dependente_id", dependenteId)
        } else {
          query = query.or("dependente_id.is.null,dependente_id.eq.")
        }

        const { data, error } = await query.order("pergunta_id", { ascending: true })

        if (error) {
          console.log(`⚠️ Erro na tabela ${tabela}:`, error.message)
          continue
        }

        if (data && data.length > 0) {
          console.log(`✅ Questionário encontrado na tabela ${tabela}:`, data.length, "respostas")
          return data
        }
      } catch (err) {
        console.log(`❌ Erro ao acessar tabela ${tabela}:`, err.message)
        continue
      }
    }

    console.log("❌ NENHUM QUESTIONÁRIO ENCONTRADO")
    return []
  } catch (error) {
    console.error("❌ Erro ao buscar questionário de saúde:", error)
    return []
  }
}

/**
 * CORREÇÃO: Atualizar status na tabela correta
 */
export async function atualizarStatusProposta(id: string, status: string, motivo?: string) {
  try {
    console.log(`🔄 ATUALIZANDO STATUS - TABELA: ${TABELA_PROPOSTAS}`)
    console.log(`📋 ID: ${id}`)
    console.log(`📊 Novo Status: ${status}`)

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (motivo) {
      updateData.motivo_rejeicao = motivo
    }

    const { data, error } = await supabase.from(TABELA_PROPOSTAS).update(updateData).eq("id", id)

    if (error) {
      console.error("❌ Erro ao atualizar status:", error)
      throw new Error(`Erro ao atualizar status da proposta: ${error.message}`)
    }

    console.log("✅ Status atualizado com sucesso!")
    return data
  } catch (error) {
    console.error("❌ Erro ao atualizar status da proposta:", error)
    throw error
  }
}

/**
 * CORREÇÃO: Enviar email usando campos corretos
 */
export async function enviarValidacaoEmail(propostaId: string, emailCliente: string, nomeCliente: string) {
  try {
    console.log("📧 ENVIANDO EMAIL DE VALIDAÇÃO - VERSÃO CORRIGIDA")
    console.log("=".repeat(50))
    console.log(`   Tabela: ${TABELA_PROPOSTAS}`)
    console.log(`   Proposta ID: ${propostaId}`)
    console.log(`   Email Cliente: "${emailCliente}"`)
    console.log(`   Nome Cliente: "${nomeCliente}"`)

    if (!propostaId || !emailCliente) {
      throw new Error("Dados obrigatórios não fornecidos")
    }

    // Se nome estiver vazio, buscar da proposta
    let nomeClienteFinal = nomeCliente
    if (!nomeCliente || nomeCliente.trim() === "") {
      console.log("⚠️ Nome vazio, buscando dados da proposta...")

      const { data: proposta, error } = await supabase
        .from(TABELA_PROPOSTAS)
        .select("cliente, email_cliente")
        .eq("id", propostaId)
        .single()

      if (error || !proposta) {
        throw new Error("Proposta não encontrada")
      }

      nomeClienteFinal = proposta.cliente || emailCliente.split("@")[0]
      console.log(`📝 Nome encontrado: "${nomeClienteFinal}"`)
    }

    // Criar link para completar proposta
    const linkValidacao = `${window.location.origin}/proposta-digital/completar/${propostaId}`
    console.log(`🔗 Link: ${linkValidacao}`)

    // Usar serviço de email
    const { enviarEmailPropostaCliente } = await import("./email-service")

    const sucesso = await enviarEmailPropostaCliente(
      emailCliente.trim(),
      nomeClienteFinal.trim(),
      linkValidacao,
      "Sistema ContratandoPlanos",
    )

    if (sucesso) {
      console.log("✅ Email enviado com sucesso!")

      // Atualizar proposta com informações do email
      const updateData = {
        status: "aguardando_cliente",
        email_enviado_em: new Date().toISOString(),
        email_validacao_enviado: true,
        link_validacao: linkValidacao,
        ultimo_erro_email: null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from(TABELA_PROPOSTAS).update(updateData).eq("id", propostaId)

      if (error) {
        console.error("⚠️ Erro ao atualizar status:", error)
        // Não falhar por causa disso
      } else {
        console.log("✅ Status atualizado para 'aguardando_cliente'")
      }

      return true
    } else {
      throw new Error("Falha no envio do email")
    }
  } catch (error) {
    console.error("❌ Erro ao enviar email de validação:", error)
    throw error
  }
}

/**
 * NOVA: Função para obter nome do cliente dos campos corretos
 */
export function obterNomeCliente(proposta: any): string {
  return proposta.cliente || proposta.nome_cliente || proposta.nome || "Nome não informado"
}

/**
 * NOVA: Função para obter email do cliente dos campos corretos
 */
export function obterEmailCliente(proposta: any): string {
  return proposta.email_cliente || proposta.email || "Email não informado"
}

/**
 * NOVA: Função para obter telefone do cliente dos campos corretos
 */
export function obterTelefoneCliente(proposta: any): string {
  return proposta.whatsapp_cliente || proposta.telefone || proposta.whatsapp || "Telefone não informado"
}

/**
 * NOVA: Função para obter valor da proposta dos campos corretos
 */
export function obterValorProposta(proposta: any): number {
  return proposta.valor_proposta || proposta.valor || proposta.valor_plano || 0
}
