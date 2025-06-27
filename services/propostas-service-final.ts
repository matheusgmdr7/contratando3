import { supabase } from "@/lib/supabase"

/**
 * SERVIÇO DE PROPOSTAS FINAL - VERSÃO COMPLETA E CORRIGIDA
 * ========================================================
 */

// Configurações corretas
const TABELA_PROPOSTAS = "propostas_corretores"
const TABELA_DEPENDENTES = "dependentes_propostas_corretores"
const BUCKET_DOCUMENTOS = "documentos-propostas-corretores"

/**
 * Buscar todas as propostas
 */
export async function buscarPropostas() {
  try {
    console.log("🔍 BUSCANDO PROPOSTAS - VERSÃO FINAL")
    console.log("=".repeat(50))
    console.log("📋 Tabela:", TABELA_PROPOSTAS)

    const { data, error } = await supabase
      .from(TABELA_PROPOSTAS)
      .select(`
        *,
        corretor:corretores(nome, email)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Erro ao buscar propostas:", error)
      throw new Error(`Erro ao buscar propostas: ${error.message}`)
    }

    console.log("✅ Propostas encontradas:", data?.length || 0)

    // Enriquecer dados com informações do corretor
    const propostas =
      data?.map((proposta) => ({
        ...proposta,
        corretor_nome: proposta.corretor?.nome || "Direto",
        corretor_email: proposta.corretor?.email || "N/A",
      })) || []

    return propostas
  } catch (error) {
    console.error("❌ Erro ao buscar propostas:", error)
    throw error
  }
}

/**
 * Buscar proposta completa com todos os dados
 */
export async function buscarPropostaCompleta(propostaId: string) {
  try {
    console.log("🔍 BUSCANDO PROPOSTA COMPLETA - VERSÃO FINAL")
    console.log("=".repeat(50))
    console.log("📋 Proposta ID:", propostaId)

    const { data: proposta, error } = await supabase
      .from(TABELA_PROPOSTAS)
      .select(`
        *,
        corretor:corretores(nome, email, telefone)
      `)
      .eq("id", propostaId)
      .single()

    if (error) {
      console.error("❌ Erro ao buscar proposta:", error)
      throw error
    }

    if (!proposta) {
      throw new Error("Proposta não encontrada")
    }

    console.log("✅ Proposta encontrada:")
    console.log("   Cliente:", proposta.cliente)
    console.log("   Email:", proposta.email_cliente)
    console.log("   Status:", proposta.status)
    console.log("   Corretor:", proposta.corretor?.nome || "Direto")

    // Analisar documentos
    console.log("\n📎 ANÁLISE DOS DOCUMENTOS:")
    const documentos = obterDocumentosInteligente(proposta, "titular")
    console.log(`📊 Total documentos: ${Object.keys(documentos).length}`)

    return {
      ...proposta,
      corretor_nome: proposta.corretor?.nome || "Direto",
      corretor_email: proposta.corretor?.email || "N/A",
      corretor_telefone: proposta.corretor?.telefone || "N/A",
    }
  } catch (error) {
    console.error("❌ Erro ao buscar proposta completa:", error)
    throw error
  }
}

/**
 * Buscar dependentes da proposta
 */
export async function buscarDependentesProposta(propostaId: string) {
  try {
    console.log("👨‍👩‍👧‍👦 BUSCANDO DEPENDENTES - VERSÃO FINAL")
    console.log("📋 Proposta ID:", propostaId)

    const { data, error } = await supabase
      .from(TABELA_DEPENDENTES)
      .select("*")
      .eq("proposta_corretor_id", propostaId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("❌ Erro ao buscar dependentes:", error)
      return []
    }

    console.log(`✅ Dependentes encontrados: ${data?.length || 0}`)

    return data || []
  } catch (error) {
    console.error("❌ Erro ao buscar dependentes:", error)
    return []
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

    // Tentar diferentes tabelas de questionário
    const tabelasQuestionario = [
      "questionario_saude_corretores",
      "questionario_saude_propostas_corretores",
      "questionario_saude",
    ]

    for (const tabela of tabelasQuestionario) {
      try {
        let query = supabase.from(tabela).select("*").eq("proposta_id", propostaId)

        if (dependenteId) {
          query = query.eq("dependente_id", dependenteId)
        } else {
          query = query.or("dependente_id.is.null,dependente_id.eq.")
        }

        const { data, error } = await query.order("pergunta_id", { ascending: true })

        if (!error && data && data.length > 0) {
          console.log(`✅ Questionário encontrado na tabela ${tabela}:`, data.length, "respostas")
          return data
        }
      } catch (err) {
        continue
      }
    }

    console.log("❌ Nenhum questionário encontrado")
    return []
  } catch (error) {
    console.error("❌ Erro ao buscar questionário de saúde:", error)
    return []
  }
}

/**
 * Função inteligente para obter documentos
 */
export function obterDocumentosInteligente(objeto: any, tipo: "titular" | "dependente" = "titular") {
  if (!objeto) return {}

  let documentos = {}

  // Prioridade 1: Campo JSON documentos_urls
  if (objeto.documentos_urls && typeof objeto.documentos_urls === "object") {
    documentos = { ...objeto.documentos_urls }
  }

  // Prioridade 2: Campos individuais (para titular)
  if (tipo === "titular" && Object.keys(documentos).length === 0) {
    const camposIndividuais = {
      rg_frente: objeto.rg_frente_url,
      rg_verso: objeto.rg_verso_url,
      cpf: objeto.cpf_url,
      comprovante_residencia: objeto.comprovante_residencia_url,
      cns: objeto.cns_url,
    }

    Object.entries(camposIndividuais).forEach(([nome, url]) => {
      if (url && typeof url === "string" && url.trim() !== "") {
        documentos[nome] = url
      }
    })
  }

  // Validar URLs
  const documentosValidos = {}
  Object.entries(documentos).forEach(([tipo, url]) => {
    if (typeof url === "string" && (url.startsWith("http") || url.startsWith("/"))) {
      documentosValidos[tipo] = url
    }
  })

  return documentosValidos
}

/**
 * Atualizar status da proposta
 */
export async function atualizarStatusProposta(id: string, status: string, motivo?: string) {
  try {
    console.log(`🔄 ATUALIZANDO STATUS`)
    console.log(`📋 ID: ${id}`)
    console.log(`📊 Novo Status: ${status}`)

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (motivo) {
      updateData.motivo_rejeicao = motivo
    }

    const { error } = await supabase.from(TABELA_PROPOSTAS).update(updateData).eq("id", id)

    if (error) {
      throw new Error(`Erro ao atualizar status: ${error.message}`)
    }

    console.log("✅ Status atualizado com sucesso!")
    return true
  } catch (error) {
    console.error("❌ Erro ao atualizar status:", error)
    throw error
  }
}

/**
 * Enviar email de validação
 */
export async function enviarValidacaoEmail(propostaId: string, emailCliente: string, nomeCliente: string) {
  try {
    console.log("📧 ENVIANDO EMAIL DE VALIDAÇÃO")
    console.log(`📋 Proposta ID: ${propostaId}`)
    console.log(`📧 Email: ${emailCliente}`)
    console.log(`👤 Nome: ${nomeCliente}`)

    if (!propostaId || !emailCliente) {
      throw new Error("Dados obrigatórios não fornecidos")
    }

    // Criar link de validação
    const linkValidacao = `${window.location.origin}/proposta-digital/completar/${propostaId}`

    // Importar serviço de email
    const { enviarEmailPropostaCliente } = await import("./email-service")

    // Enviar email
    const sucesso = await enviarEmailPropostaCliente(
      emailCliente.trim(),
      nomeCliente.trim(),
      linkValidacao,
      "Sistema ContratandoPlanos",
    )

    if (sucesso) {
      // Atualizar proposta
      const updateData = {
        status: "aguardando_cliente",
        email_enviado_em: new Date().toISOString(),
        email_validacao_enviado: true,
        link_validacao: linkValidacao,
        updated_at: new Date().toISOString(),
      }

      await supabase.from(TABELA_PROPOSTAS).update(updateData).eq("id", propostaId)

      console.log("✅ Email enviado e status atualizado!")
      return true
    } else {
      throw new Error("Falha no envio do email")
    }
  } catch (error) {
    console.error("❌ Erro ao enviar email:", error)
    throw error
  }
}

/**
 * Funções auxiliares para obter dados dos campos corretos
 */
export function obterNomeCliente(proposta: any): string {
  return proposta.cliente || proposta.nome_cliente || proposta.nome || "Nome não informado"
}

export function obterEmailCliente(proposta: any): string {
  return proposta.email_cliente || proposta.email || "Email não informado"
}

export function obterTelefoneCliente(proposta: any): string {
  return proposta.whatsapp_cliente || proposta.telefone || proposta.whatsapp || "Telefone não informado"
}

export function obterValorProposta(proposta: any): number {
  return proposta.valor_proposta || proposta.valor || proposta.valor_plano || 0
}
