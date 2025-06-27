import { supabase } from "@/lib/supabase"

// CORREÇÃO: Usar a mesma tabela que "Propostas Digitais" usa (que está funcionando corretamente)
const TABELA_PROPOSTAS = "propostas" // Mudança: era "propostas_corretores", agora é "propostas"

export async function buscarPropostas() {
  try {
    console.log("🔍 BUSCANDO PROPOSTAS DA TABELA CORRETA")
    console.log("=".repeat(50))
    console.log("📋 Tabela configurada:", TABELA_PROPOSTAS)

    // Buscar da mesma tabela que "Propostas Digitais" usa
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

// NOVA FUNÇÃO: Buscar dados completos da proposta com debug melhorado
export async function buscarPropostaCompleta(propostaId: string) {
  try {
    console.log("🔍 BUSCANDO PROPOSTA COMPLETA - DEBUG MELHORADO")
    console.log("=".repeat(50))
    console.log("📋 Proposta ID:", propostaId)

    // Buscar proposta principal
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

    // ANÁLISE DETALHADA DOS DOCUMENTOS DO TITULAR
    console.log("\n📎 ANÁLISE DETALHADA DOS DOCUMENTOS DO TITULAR:")
    const camposDocumentosTitular = [
      "documentos_urls",
      "documentos",
      "anexos",
      "arquivos",
      "rg_frente_url",
      "rg_verso_url",
      "cpf_url",
      "comprovante_residencia_url",
      "cns_url",
    ]

    let documentosTitular = null
    let campoComDocumentos = null

    camposDocumentosTitular.forEach((campo) => {
      if (proposta[campo]) {
        if (typeof proposta[campo] === "object" && Object.keys(proposta[campo]).length > 0) {
          console.log(`   ✅ ${campo}: ${Object.keys(proposta[campo]).length} documento(s)`)
          console.log(`      Tipos: ${Object.keys(proposta[campo]).join(", ")}`)

          // Verificar URLs válidas
          Object.entries(proposta[campo]).forEach(([tipo, url]) => {
            if (typeof url === "string" && url.startsWith("http")) {
              console.log(`      📄 ${tipo}: ${url.substring(0, 50)}...`)
            } else {
              console.log(`      ⚠️ ${tipo}: URL inválida ou vazia`)
            }
          })

          if (!documentosTitular) {
            documentosTitular = proposta[campo]
            campoComDocumentos = campo
          }
        } else if (typeof proposta[campo] === "string" && proposta[campo].trim() !== "") {
          console.log(`   ✅ ${campo}: ${proposta[campo].substring(0, 50)}...`)
          if (!documentosTitular) {
            documentosTitular = { [campo]: proposta[campo] }
            campoComDocumentos = campo
          }
        } else {
          console.log(`   ❌ ${campo}: vazio ou inválido`)
        }
      } else {
        console.log(`   ❌ ${campo}: não existe`)
      }
    })

    if (documentosTitular) {
      console.log(`\n🎯 DOCUMENTOS DO TITULAR ENCONTRADOS NO CAMPO: ${campoComDocumentos}`)
      console.log(`📊 Total de documentos: ${Object.keys(documentosTitular).length}`)
    } else {
      console.log("\n❌ NENHUM DOCUMENTO DO TITULAR ENCONTRADO")
    }

    return proposta
  } catch (error) {
    console.error("❌ Erro ao buscar proposta completa:", error)
    throw error
  }
}

// CORREÇÃO: Melhorar função de buscar dependentes com logs detalhados
export async function buscarDependentesProposta(propostaId: string) {
  try {
    console.log("👨‍👩‍👧‍👦 BUSCANDO DEPENDENTES - DEBUG DETALHADO")
    console.log("=".repeat(60))
    console.log("📋 Proposta ID:", propostaId)

    // Tentar buscar em diferentes tabelas possíveis
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

      dependentesEncontrados.forEach((dep, index) => {
        console.log(`📋 Dependente ${index + 1}:`)
        console.log(`   Nome: ${dep.nome}`)
        console.log(`   CPF: ${dep.cpf}`)
        console.log(`   Parentesco: ${dep.parentesco}`)
        console.log(`   ID: ${dep.id}`)

        // ANÁLISE DETALHADA DOS DOCUMENTOS DO DEPENDENTE
        console.log(`   📎 ANÁLISE DOS DOCUMENTOS:`)
        const camposDocumentos = ["documentos_urls", "documentos", "anexos", "arquivos"]
        let temDocumentos = false

        camposDocumentos.forEach((campo) => {
          if (dep[campo]) {
            if (typeof dep[campo] === "object" && Object.keys(dep[campo]).length > 0) {
              console.log(`      ✅ ${campo}: ${Object.keys(dep[campo]).length} documento(s)`)
              console.log(`         Tipos: ${Object.keys(dep[campo]).join(", ")}`)

              // Verificar URLs válidas
              Object.entries(dep[campo]).forEach(([tipo, url]) => {
                if (typeof url === "string" && url.startsWith("http")) {
                  console.log(`         📄 ${tipo}: ${url.substring(0, 50)}...`)
                } else {
                  console.log(`         ⚠️ ${tipo}: URL inválida`)
                }
              })

              temDocumentos = true
            } else {
              console.log(`      ❌ ${campo}: vazio ou inválido`)
            }
          } else {
            console.log(`      ❌ ${campo}: não existe`)
          }
        })

        if (!temDocumentos) {
          console.log(`      ❌ Nenhum documento encontrado`)
        }
        console.log("   ---")
      })
    } else {
      console.log("❌ NENHUM DEPENDENTE ENCONTRADO EM NENHUMA TABELA")
    }

    return dependentesEncontrados || []
  } catch (error) {
    console.error("❌ Erro geral ao buscar dependentes:", error)
    return []
  }
}

// NOVA FUNÇÃO: Obter documentos de forma inteligente
export function obterDocumentosInteligente(objeto: any, tipo: "titular" | "dependente" = "titular") {
  console.log(`📎 OBTENDO DOCUMENTOS - MODO INTELIGENTE (${tipo.toUpperCase()})`)

  if (!objeto) {
    console.log("❌ Objeto não fornecido")
    return {}
  }

  const camposPossiveis = ["documentos_urls", "documentos", "anexos", "arquivos"]

  // Para titular, também verificar campos específicos
  if (tipo === "titular") {
    camposPossiveis.push("rg_frente_url", "rg_verso_url", "cpf_url", "comprovante_residencia_url", "cns_url")
  }

  let documentosEncontrados = {}
  let campoUtilizado = null

  // Primeiro, tentar campos de objeto (JSON)
  for (const campo of camposPossiveis.slice(0, 4)) {
    // Apenas os campos de objeto
    if (objeto[campo] && typeof objeto[campo] === "object" && Object.keys(objeto[campo]).length > 0) {
      console.log(`✅ Documentos encontrados no campo: ${campo}`)
      console.log(`📊 Quantidade: ${Object.keys(objeto[campo]).length}`)
      console.log(`📋 Tipos: ${Object.keys(objeto[campo]).join(", ")}`)

      documentosEncontrados = objeto[campo]
      campoUtilizado = campo
      break
    }
  }

  // Se não encontrou em campos de objeto e é titular, verificar campos individuais
  if (Object.keys(documentosEncontrados).length === 0 && tipo === "titular") {
    const camposIndividuais = ["rg_frente_url", "rg_verso_url", "cpf_url", "comprovante_residencia_url", "cns_url"]

    camposIndividuais.forEach((campo) => {
      if (objeto[campo] && typeof objeto[campo] === "string" && objeto[campo].trim() !== "") {
        const nomeDoc = campo.replace("_url", "")
        documentosEncontrados[nomeDoc] = objeto[campo]
        console.log(`✅ Documento individual encontrado: ${campo}`)
      }
    })

    if (Object.keys(documentosEncontrados).length > 0) {
      campoUtilizado = "campos_individuais"
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

// Manter outras funções existentes...
export async function buscarQuestionarioSaude(propostaId: string, dependenteId?: string) {
  try {
    console.log("🏥 BUSCANDO QUESTIONÁRIO DE SAÚDE - DEBUG")
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
          // Para o titular, buscar onde dependente_id é null ou não existe
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

export async function atualizarStatusProposta(id: string, status: string, motivo?: string) {
  try {
    const updateData: any = { status }
    if (motivo) {
      updateData.motivo_rejeicao = motivo
    }

    const { data, error } = await supabase.from(TABELA_PROPOSTAS).update(updateData).eq("id", id)

    if (error) {
      console.error("Erro ao atualizar status da proposta:", error)
      throw new Error(`Erro ao atualizar status da proposta: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Erro ao atualizar status da proposta:", error)
    throw error
  }
}

export async function enviarValidacaoEmail(propostaId: string, emailCliente: string, nomeCliente: string) {
  try {
    console.log("📧 INICIANDO ENVIO DE EMAIL DE VALIDAÇÃO")
    console.log("=".repeat(50))
    console.log(`   Tabela usada: ${TABELA_PROPOSTAS}`)
    console.log(`   Proposta ID: ${propostaId}`)
    console.log(`   Email Cliente: "${emailCliente}"`)
    console.log(`   Nome Cliente: "${nomeCliente}"`)

    // Verificar se os dados básicos estão presentes
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

      // Usar campos da tabela "propostas"
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
