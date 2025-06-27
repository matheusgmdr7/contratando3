import { supabase } from "@/lib/supabase"

/**
 * SERVIÇO DE PROPOSTAS - VERSÃO ORIGINAL CORRIGIDA
 * ===============================================
 * Volta a usar a tabela "propostas" que tem os dados corretos
 */

// CORREÇÃO: Voltar para a tabela original que funcionava
const TABELA_PROPOSTAS = "propostas"
const TABELA_DEPENDENTES = "dependentes"

/**
 * Buscar propostas da tabela original (que tem os dados corretos)
 */
export async function buscarPropostas() {
  try {
    console.log("🔍 BUSCANDO PROPOSTAS - TABELA ORIGINAL")
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

      console.log("📋 Primeiras 3 propostas:")
      data.slice(0, 3).forEach((proposta, index) => {
        console.log(`   ${index + 1}. Cliente: ${proposta.nome_cliente || proposta.nome || "N/A"}`)
        console.log(`      Status: ${proposta.status || "N/A"}`)
        console.log(`      Email: ${proposta.email || "N/A"}`)
        console.log("      ---")
      })
    }

    return data || []
  } catch (error) {
    console.error("❌ Erro ao buscar propostas:", error)
    throw error
  }
}

/**
 * Buscar proposta completa da tabela original
 */
export async function buscarPropostaCompleta(propostaId: string) {
  try {
    console.log("🔍 BUSCANDO PROPOSTA COMPLETA - TABELA ORIGINAL")
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
    console.log("   Nome:", proposta.nome_cliente || proposta.nome)
    console.log("   Email:", proposta.email)
    console.log("   Status:", proposta.status)

    // Verificar documentos
    console.log("\n📎 ANÁLISE DOS DOCUMENTOS:")
    if (proposta.documentos_urls && typeof proposta.documentos_urls === "object") {
      const docsCount = Object.keys(proposta.documentos_urls).length
      console.log(`   ✅ documentos_urls: ${docsCount} documento(s)`)
    } else {
      console.log("   ❌ documentos_urls: vazio ou inválido")
    }

    return proposta
  } catch (error) {
    console.error("❌ Erro ao buscar proposta completa:", error)
    throw error
  }
}

/**
 * Buscar dependentes da tabela original
 */
export async function buscarDependentesProposta(propostaId: string) {
  try {
    console.log("👨‍👩‍👧‍👦 BUSCANDO DEPENDENTES - TABELA ORIGINAL")
    console.log("=".repeat(60))
    console.log("📋 Proposta ID:", propostaId)

    // Tentar diferentes tabelas de dependentes
    const tabelasPossiveisDependendes = [
      "dependentes",
      "dependentes_propostas",
      "dependentes_propostas_corretores",
      "proposta_dependentes",
    ]

    let dependentesEncontrados = []
    let tabelaUsada = null

    for (const tabela of tabelasPossiveisDependendes) {
      try {
        console.log(`🔍 Tentando buscar na tabela: ${tabela}`)

        const { data, error } = await supabase
          .from(tabela)
          .select("*")
          .eq("proposta_id", propostaId)
          .order("created_at", { ascending: true })

        if (error) {
          console.log(`⚠️ Erro na tabela ${tabela}:`, error.message)
          continue
        }

        if (data && data.length > 0) {
          console.log(`✅ Dependentes encontrados na tabela ${tabela}:`, data.length)
          dependentesEncontrados = data
          tabelaUsada = tabela
          break
        } else {
          console.log(`ℹ️ Nenhum dependente na tabela ${tabela}`)
        }
      } catch (err) {
        console.log(`❌ Erro ao acessar tabela ${tabela}:`, err.message)
        continue
      }
    }

    if (dependentesEncontrados.length > 0) {
      console.log(`🎯 DEPENDENTES ENCONTRADOS NA TABELA: ${tabelaUsada}`)
      console.log("📊 Quantidade:", dependentesEncontrados.length)
    } else {
      console.log("❌ NENHUM DEPENDENTE ENCONTRADO EM NENHUMA TABELA")
    }

    return dependentesEncontrados || []
  } catch (error) {
    console.error("❌ Erro geral ao buscar dependentes:", error)
    return []
  }
}

/**
 * Função inteligente para obter documentos (compatível com estrutura original)
 */
export function obterDocumentosInteligente(objeto: any, tipo: "titular" | "dependente" = "titular") {
  console.log(`📎 OBTENDO DOCUMENTOS - TABELA ORIGINAL (${tipo.toUpperCase()})`)

  if (!objeto) {
    console.log("❌ Objeto não fornecido")
    return {}
  }

  let documentosEncontrados = {}
  let campoUtilizado = null

  // PRIORIDADE 1: Campo JSON documentos_urls (estrutura original)
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

  // PRIORIDADE 2: Outros campos JSON (compatibilidade)
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
 * Buscar questionário de saúde
 */
export async function buscarQuestionarioSaude(propostaId: string, dependenteId?: string) {
  try {
    console.log("🏥 BUSCANDO QUESTIONÁRIO DE SAÚDE")
    console.log("📋 Proposta ID:", propostaId)
    if (dependenteId) {
      console.log("👤 Dependente ID:", dependenteId)
    }

    const tabelasQuestionario = [
      "questionario_saude",
      "questionario_saude_propostas",
      "saude_questionario",
      "proposta_questionario_saude",
    ]

    let questionarioEncontrado = []
    let tabelaUsada = null

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
          questionarioEncontrado = data
          tabelaUsada = tabela
          break
        } else {
          console.log(`ℹ️ Nenhum questionário na tabela ${tabela}`)
        }
      } catch (err) {
        console.log(`❌ Erro ao acessar tabela ${tabela}:`, err.message)
        continue
      }
    }

    if (questionarioEncontrado.length > 0) {
      console.log(`🎯 QUESTIONÁRIO ENCONTRADO NA TABELA: ${tabelaUsada}`)
      const respostasPositivas = questionarioEncontrado.filter((q) => q.resposta === "Sim")
      console.log(`📊 Total de respostas: ${questionarioEncontrado.length}`)
      console.log(`⚠️ Respostas "Sim": ${respostasPositivas.length}`)
    } else {
      console.log("❌ NENHUM QUESTIONÁRIO ENCONTRADO")
    }

    return questionarioEncontrado || []
  } catch (error) {
    console.error("❌ Erro ao buscar questionário de saúde:", error)
    return []
  }
}

/**
 * Atualizar status da proposta na tabela original
 */
export async function atualizarStatusProposta(id: string, status: string, motivo?: string) {
  try {
    console.log(`🔄 ATUALIZANDO STATUS - TABELA: ${TABELA_PROPOSTAS}`)
    console.log(`📋 ID: ${id}`)
    console.log(`📊 Novo Status: ${status}`)

    const updateData: any = { status }
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
 * Enviar email de validação usando tabela original
 */
export async function enviarValidacaoEmail(propostaId: string, emailCliente: string, nomeCliente: string) {
  try {
    console.log("📧 ENVIANDO EMAIL DE VALIDAÇÃO - TABELA ORIGINAL")
    console.log("=".repeat(50))
    console.log(`   Tabela: ${TABELA_PROPOSTAS}`)
    console.log(`   Proposta ID: ${propostaId}`)
    console.log(`   Email Cliente: "${emailCliente}"`)
    console.log(`   Nome Cliente: "${nomeCliente}"`)

    if (!propostaId) {
      throw new Error("ID da proposta não fornecido")
    }

    if (!emailCliente || emailCliente.trim() === "") {
      throw new Error("Email do cliente não fornecido ou vazio")
    }

    // Se o nome estiver vazio, buscar dados completos da proposta
    let nomeClienteFinal = nomeCliente
    if (!nomeCliente || nomeCliente.trim() === "") {
      console.log("⚠️ Nome do cliente vazio, buscando dados completos da proposta...")

      const { data: proposta, error } = await supabase.from(TABELA_PROPOSTAS).select("*").eq("id", propostaId).single()

      if (error) {
        console.error("❌ Erro ao buscar proposta:", error)
        throw new Error(`Erro ao buscar dados da proposta: ${error.message}`)
      }

      if (!proposta) {
        throw new Error("Proposta não encontrada")
      }

      // Usar campos da tabela "propostas" original
      nomeClienteFinal = proposta.nome_cliente || proposta.nome || "Cliente"

      console.log(`📝 Nome encontrado: "${nomeClienteFinal}"`)

      // Se ainda estiver vazio, usar email como fallback
      if (!nomeClienteFinal || nomeClienteFinal.trim() === "") {
        nomeClienteFinal = emailCliente.split("@")[0]
        console.log(`📝 Usando email como fallback para nome: "${nomeClienteFinal}"`)
      }
    }

    // Validação final
    if (!nomeClienteFinal || nomeClienteFinal.trim() === "") {
      throw new Error("Não foi possível determinar o nome do cliente")
    }

    console.log(`✅ Dados validados:`)
    console.log(`   Email: "${emailCliente}"`)
    console.log(`   Nome: "${nomeClienteFinal}"`)

    // Criar link para o cliente completar a proposta
    const linkValidacao = `${window.location.origin}/proposta-digital/completar/${propostaId}`
    console.log(`   Link: ${linkValidacao}`)

    // Usar o serviço de email
    const { enviarEmailPropostaCliente } = await import("./email-service")

    const sucesso = await enviarEmailPropostaCliente(
      emailCliente.trim(),
      nomeClienteFinal.trim(),
      linkValidacao,
      "Sistema ContratandoPlanos",
    )

    if (sucesso) {
      console.log("✅ Email de validação enviado com sucesso!")

      // Atualizar status da proposta
      const updateData = {
        status: "aguardando_cliente",
        email_enviado_em: new Date().toISOString(),
        email_validacao_enviado: true,
        link_validacao: linkValidacao,
        ultimo_erro_email: null,
      }

      const { error } = await supabase.from(TABELA_PROPOSTAS).update(updateData).eq("id", propostaId)

      if (error) {
        console.error("❌ Erro ao atualizar status da proposta:", error)
        // Tentar atualização básica
        const { error: basicError } = await supabase
          .from(TABELA_PROPOSTAS)
          .update({ status: "aguardando_cliente" })
          .eq("id", propostaId)

        if (basicError) {
          throw new Error(`Erro ao atualizar status básico: ${basicError.message}`)
        }
      }

      console.log("✅ Status da proposta atualizado para 'aguardando_cliente'")
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
 * Funções auxiliares para obter dados dos campos corretos da tabela original
 */
export function obterNomeCliente(proposta: any): string {
  return proposta.nome_cliente || proposta.nome || "Nome não informado"
}

export function obterEmailCliente(proposta: any): string {
  return proposta.email || "Email não informado"
}

export function obterTelefoneCliente(proposta: any): string {
  return proposta.telefone || proposta.whatsapp || "Telefone não informado"
}

export function obterValorProposta(proposta: any): number {
  return proposta.valor || proposta.valor_plano || 0
}
