/**
 * Serviço de email - versão corrigida com campos corretos
 */

const SUPABASE_CONFIG = {
  url: "https://jtzbuxoslaotpnwsphqv.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0emJ1eG9zbGFvdHBud3NwaHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1MDU5MDEsImV4cCI6MjA1ODA4MTkwMX0.jmI-h8pKW00TN5uNpo3Q16GaZzOpFAnPUVO0yyNq54U",
  functionName: "resend-email",
}

/**
 * Valida se os dados obrigatórios estão presentes e válidos
 */
function validarDadosObrigatorios(to: string, nome: string): { valido: boolean; erro?: string } {
  console.log("🔍 VALIDANDO DADOS OBRIGATÓRIOS:")
  console.log(`   to: "${to}" (tipo: ${typeof to}, length: ${to?.length || 0})`)
  console.log(`   nome: "${nome}" (tipo: ${typeof nome}, length: ${nome?.length || 0})`)

  if (!to) {
    return { valido: false, erro: "Campo 'to' está vazio ou undefined" }
  }

  if (typeof to !== "string") {
    return { valido: false, erro: `Campo 'to' deve ser string, recebido: ${typeof to}` }
  }

  if (to.trim().length === 0) {
    return { valido: false, erro: "Campo 'to' está vazio após trim" }
  }

  // Validação básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(to.trim())) {
    return { valido: false, erro: `Campo 'to' não é um email válido: "${to}"` }
  }

  if (!nome) {
    return { valido: false, erro: "Campo 'nome' está vazio ou undefined" }
  }

  if (typeof nome !== "string") {
    return { valido: false, erro: `Campo 'nome' deve ser string, recebido: ${typeof nome}` }
  }

  if (nome.trim().length === 0) {
    return { valido: false, erro: "Campo 'nome' está vazio após trim" }
  }

  console.log("✅ Dados obrigatórios válidos!")
  return { valido: true }
}

/**
 * Detecta o ambiente atual
 */
function detectarAmbiente(): {
  tipo: "desenvolvimento" | "producao" | "preview"
  hostname: string
  protocol: string
} {
  if (typeof window === "undefined") {
    return { tipo: "desenvolvimento", hostname: "server", protocol: "http:" }
  }

  const hostname = window.location.hostname
  const protocol = window.location.protocol

  // Desenvolvimento local
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.includes("localhost")) {
    return { tipo: "desenvolvimento", hostname, protocol }
  }

  // Preview/staging (Vercel, Netlify, etc.)
  if (
    hostname.includes("vercel.app") ||
    hostname.includes("netlify.app") ||
    hostname.includes("preview") ||
    hostname.includes("lite.vusercontent.net")
  ) {
    return { tipo: "preview", hostname, protocol }
  }

  // Produção
  return { tipo: "producao", hostname, protocol }
}

/**
 * Simula envio de email para desenvolvimento
 */
function simularEnvioEmail(
  emailCliente: string,
  nomeCliente: string,
  linkProposta: string,
  nomeCorretor: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    console.log("🔧 SIMULAÇÃO DE EMAIL - AMBIENTE DE DESENVOLVIMENTO")
    console.log("=".repeat(70))
    console.log("📧 DETALHES DO EMAIL:")
    console.log(`   📨 Para: ${emailCliente}`)
    console.log(`   📋 Assunto: Complete sua proposta de plano de saúde`)
    console.log(`   👤 Cliente: ${nomeCliente}`)
    console.log(`   🏢 Corretor: ${nomeCorretor}`)
    console.log(`   🔗 Link: ${linkProposta}`)
    console.log(`   ⏰ Timestamp: ${new Date().toLocaleString("pt-BR")}`)
    console.log("=".repeat(70))
    console.log("✅ EMAIL SIMULADO COM SUCESSO!")
    console.log("💡 Em produção, este email seria enviado via Edge Function")

    // Simular delay de rede
    setTimeout(() => resolve(true), 1000)
  })
}

/**
 * Tenta enviar via Edge Function com validação prévia
 */
async function tentarEdgeFunction(payload: any): Promise<{ sucesso: boolean; erro?: string; detalhes?: any }> {
  try {
    console.log("🚀 INICIANDO ENVIO VIA EDGE FUNCTION")
    console.log("=".repeat(60))

    // Validação prévia dos dados obrigatórios
    const validacao = validarDadosObrigatorios(payload.to, payload.nome)
    if (!validacao.valido) {
      console.error("❌ VALIDAÇÃO PRÉVIA FALHOU:")
      console.error(`   Erro: ${validacao.erro}`)
      return { sucesso: false, erro: `Validação prévia: ${validacao.erro}` }
    }

    console.log(`📍 URL: ${SUPABASE_CONFIG.url}/functions/v1/${SUPABASE_CONFIG.functionName}`)
    console.log(`🔑 API Key (primeiros 10 chars): ${SUPABASE_CONFIG.anonKey.substring(0, 10)}...`)

    // Criar payload limpo com apenas os campos essenciais
    const payloadLimpo = {
      to: payload.to.trim(),
      nome: payload.nome.trim(),
      subject: payload.subject || "Assunto padrão",
      tipo: payload.tipo || "email",
    }

    // Adicionar campos opcionais se existirem
    if (payload.corretor) payloadLimpo.corretor = payload.corretor
    if (payload.link) payloadLimpo.link = payload.link
    if (payload.cliente) payloadLimpo.cliente = payload.cliente
    if (payload.proposta) payloadLimpo.proposta = payload.proposta

    console.log(`📤 Payload limpo enviado:`)
    console.log(JSON.stringify(payloadLimpo, null, 2))

    const url = `${SUPABASE_CONFIG.url}/functions/v1/${SUPABASE_CONFIG.functionName}`

    // Timeout de 20 segundos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
      console.log("⏰ TIMEOUT: Edge Function demorou mais que 20 segundos")
    }, 20000)

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
      apikey: SUPABASE_CONFIG.anonKey,
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payloadLimpo),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log("📨 RESPOSTA RECEBIDA:")
    console.log(`   Status: ${response.status}`)
    console.log(`   Status Text: ${response.statusText}`)
    console.log(`   OK: ${response.ok}`)

    // Ler o corpo da resposta
    let responseBody: any = null
    let responseText = ""

    try {
      responseText = await response.text()
      console.log(`📄 Corpo da resposta (texto bruto): "${responseText}"`)

      if (responseText) {
        try {
          responseBody = JSON.parse(responseText)
          console.log(`📄 Corpo da resposta (JSON parseado):`)
          console.log(JSON.stringify(responseBody, null, 2))
        } catch (parseError) {
          console.log(`❌ Erro ao parsear JSON: ${parseError.message}`)
        }
      }
    } catch (error) {
      console.log(`❌ Erro ao ler corpo da resposta: ${error.message}`)
    }

    const detalhes = {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      body: responseText,
      json: responseBody,
      payloadEnviado: payloadLimpo,
    }

    console.log("=".repeat(60))

    if (!response.ok) {
      const erro = `HTTP ${response.status}: ${responseText || response.statusText}`
      console.error("❌ EDGE FUNCTION RETORNOU ERRO:")
      console.error(`   Status: ${response.status}`)
      console.error(`   Mensagem: ${responseText}`)
      return { sucesso: false, erro, detalhes }
    }

    console.log("✅ SUCESSO NA EDGE FUNCTION!")
    return { sucesso: true, detalhes }
  } catch (error) {
    console.error("💥 EXCEÇÃO NA EDGE FUNCTION:")
    console.error(`   Tipo: ${error.name}`)
    console.error(`   Mensagem: ${error.message}`)

    let mensagemErro = "Erro desconhecido"

    if (error.name === "AbortError") {
      mensagemErro = "Timeout - Edge Function não respondeu em 20 segundos"
    } else if (error.message?.includes("Failed to fetch")) {
      mensagemErro = "Falha na conexão - Verifique se a Edge Function está acessível"
    } else if (error.message?.includes("NetworkError")) {
      mensagemErro = "Erro de rede - Verifique a conexão com a internet"
    } else if (error.message) {
      mensagemErro = error.message
    }

    return { sucesso: false, erro: mensagemErro }
  }
}

/**
 * Atualiza flag de email enviado na tabela correta - CORRIGIDO
 */
async function atualizarFlagEmailEnviado(propostaId: string): Promise<boolean> {
  try {
    console.log(`📧 ATUALIZANDO FLAG DE EMAIL - Proposta: ${propostaId}`)

    // Importar supabase dinamicamente para evitar problemas de dependência circular
    const { supabase } = await import("@/lib/supabase")

    // Primeiro tentar atualizar na tabela 'propostas'
    const { error: updateError1 } = await supabase
      .from("propostas")
      .update({
        email_validacao_enviado: true,
        email_enviado_em: new Date().toISOString(),
        updated_at: new Date().toISOString(), // CORRIGIDO: usar updated_at
      })
      .eq("id", propostaId)

    if (!updateError1) {
      console.log("✅ Flag atualizada na tabela 'propostas'")
      return true
    }

    console.warn("⚠️ Erro ao atualizar em 'propostas', tentando 'propostas_corretores':", updateError1)

    // Se falhar, tentar na tabela 'propostas_corretores'
    const { error: updateError2 } = await supabase
      .from("propostas_corretores")
      .update({
        email_validacao_enviado: true,
        email_enviado_em: new Date().toISOString(),
        updated_at: new Date().toISOString(), // CORRIGIDO: usar updated_at
      })
      .eq("id", propostaId)

    if (!updateError2) {
      console.log("✅ Flag atualizada na tabela 'propostas_corretores'")
      return true
    }

    console.error("❌ Erro ao atualizar flag em ambas as tabelas:", { updateError1, updateError2 })

    // Tentar sem o campo updated_at se ainda falhar
    const { error: updateError3 } = await supabase
      .from("propostas")
      .update({
        email_validacao_enviado: true,
        email_enviado_em: new Date().toISOString(),
      })
      .eq("id", propostaId)

    if (!updateError3) {
      console.log("✅ Flag atualizada na tabela 'propostas' (sem updated_at)")
      return true
    }

    console.error("❌ Falha final ao atualizar flag de email:", updateError3)
    return false
  } catch (error) {
    console.error("❌ Erro ao atualizar flag de email:", error)
    return false
  }
}

/**
 * Envia um email para o cliente com o link para completar a proposta
 */
export async function enviarEmailPropostaCliente(
  emailCliente: string,
  nomeCliente: string,
  linkProposta: string,
  nomeCorretor: string,
): Promise<boolean> {
  try {
    console.log("📧 INICIANDO ENVIO DE EMAIL PARA CLIENTE")
    console.log("=".repeat(50))
    console.log(`   Cliente: "${nomeCliente}" (${emailCliente})`)
    console.log(`   Corretor: "${nomeCorretor}"`)
    console.log(`   Link: ${linkProposta}`)

    // Validação prévia dos parâmetros
    if (!emailCliente || !nomeCliente) {
      const erro = `Parâmetros inválidos: emailCliente="${emailCliente}", nomeCliente="${nomeCliente}"`
      console.error("❌ " + erro)
      throw new Error(erro)
    }

    const ambiente = detectarAmbiente()
    console.log(`🌍 Ambiente detectado: ${ambiente.tipo} (${ambiente.hostname})`)

    // Em desenvolvimento, sempre simular
    if (ambiente.tipo === "desenvolvimento") {
      const sucesso = await simularEnvioEmail(emailCliente, nomeCliente, linkProposta, nomeCorretor)
      console.log(`🔧 Simulação concluída com sucesso: ${sucesso}`)
      return sucesso
    }

    // Em produção ou preview, tentar Edge Function
    console.log("🎯 Ambiente de produção/preview - tentando Edge Function...")

    // Corrigir link se necessário
    const linkCorreto = linkProposta.replace(
      /https:\/\/[a-z0-9]+\.lite\.vusercontent\.net/,
      "https://contratandoplanos.com.br",
    )

    const payload = {
      to: emailCliente,
      nome: nomeCliente,
      subject: "Complete sua proposta de plano de saúde",
      corretor: nomeCorretor || "Sistema ContratandoPlanos",
      link: linkCorreto,
      tipo: "proposta_cliente",
      timestamp: new Date().toISOString(),
    }

    console.log("📦 Payload preparado para envio:")
    console.log(JSON.stringify(payload, null, 2))

    const resultado = await tentarEdgeFunction(payload)

    console.log("🔍 RESULTADO DA EDGE FUNCTION:")
    console.log(`   Sucesso: ${resultado.sucesso}`)
    console.log(`   Erro: ${resultado.erro || "Nenhum"}`)

    if (resultado.sucesso) {
      console.log("✅ EMAIL ENVIADO COM SUCESSO VIA EDGE FUNCTION!")
      return true
    } else {
      console.error("❌ EDGE FUNCTION FALHOU:")
      console.error(`   Erro: ${resultado.erro}`)
      return false
    }
  } catch (error) {
    console.error("💥 ERRO GERAL NO SERVIÇO DE EMAIL:", error)
    return false
  }
}

/**
 * Função específica para envio de email de validação de proposta - CORRIGIDA
 */
export async function enviarEmailValidacaoProposta(
  emailCliente: string,
  nomeCliente: string,
  propostaId: string,
): Promise<boolean> {
  try {
    console.log("📧 ENVIANDO EMAIL DE VALIDAÇÃO DE PROPOSTA")
    console.log(`   Cliente: ${nomeCliente}`)
    console.log(`   Email: ${emailCliente}`)
    console.log(`   Proposta ID: ${propostaId}`)

    // Criar link de validação
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://contratandoplanos.com.br"
    const linkValidacao = `${baseUrl}/proposta-digital/completar/${propostaId}`

    console.log(`   Link gerado: ${linkValidacao}`)

    // Usar a função principal de envio
    const resultado = await enviarEmailPropostaCliente(
      emailCliente,
      nomeCliente,
      linkValidacao,
      "Sistema ContratandoPlanos",
    )

    console.log(`📧 Resultado do envio de validação: ${resultado}`)

    // CORRIGIDO: Atualizar flag apenas se o email foi enviado com sucesso
    if (resultado) {
      console.log("📧 Email enviado com sucesso, atualizando flag...")
      const flagAtualizada = await atualizarFlagEmailEnviado(propostaId)
      console.log(`📧 Flag de email atualizada: ${flagAtualizada}`)

      if (!flagAtualizada) {
        console.warn("⚠️ Email enviado mas flag não foi atualizada")
        // Não falhar o processo por causa da flag
      }
    } else {
      console.error("❌ Email não foi enviado, não atualizando flag")
    }

    return resultado
  } catch (error) {
    console.error("❌ Erro no envio de email de validação:", error)
    return false
  }
}

/**
 * Envia email para o corretor quando a proposta é completada
 */
export async function enviarEmailPropostaCompletada(
  emailCorretor: string,
  nomeCorretor: string,
  nomeCliente: string,
  idProposta: string,
): Promise<boolean> {
  try {
    console.log("📧 ENVIANDO CONFIRMAÇÃO PARA CORRETOR")

    const ambiente = detectarAmbiente()

    if (ambiente.tipo === "desenvolvimento") {
      console.log("🔧 SIMULAÇÃO - EMAIL DE CONFIRMAÇÃO PARA CORRETOR")
      console.log("=".repeat(50))
      console.log(`   Para: ${emailCorretor}`)
      console.log(`   Assunto: Proposta completada pelo cliente`)
      console.log(`   Corretor: ${nomeCorretor}`)
      console.log(`   Cliente: ${nomeCliente}`)
      console.log(`   Proposta: ${idProposta}`)
      console.log("=".repeat(50))
      console.log("✅ Confirmação simulada!")

      await new Promise((resolve) => setTimeout(resolve, 500))
      return true
    }

    // Tentar envio real
    const payload = {
      to: emailCorretor,
      nome: nomeCorretor,
      subject: "Proposta completada pelo cliente",
      cliente: nomeCliente,
      proposta: idProposta,
      tipo: "proposta_completada",
      timestamp: new Date().toISOString(),
    }

    const resultado = await tentarEdgeFunction(payload)

    if (resultado.sucesso) {
      console.log("✅ Email de confirmação enviado!")
      return true
    } else {
      console.warn("⚠️ Falha no envio de confirmação:", resultado.erro)
      return false
    }
  } catch (error) {
    console.error("💥 Erro no email de confirmação:", error)
    return false
  }
}

/**
 * Envia email para o corretor quando a proposta é assinada
 */
export async function enviarEmailPropostaAssinada(
  emailCorretor: string,
  nomeCorretor: string,
  nomeCliente: string,
  idProposta: string,
  valorProposta: number,
): Promise<boolean> {
  try {
    console.log("📧 ENVIANDO NOTIFICAÇÃO DE ASSINATURA PARA CORRETOR")

    const ambiente = detectarAmbiente()

    if (ambiente.tipo === "desenvolvimento") {
      console.log("🔧 SIMULAÇÃO - EMAIL DE ASSINATURA PARA CORRETOR")
      console.log("=".repeat(50))
      console.log(`   Para: ${emailCorretor}`)
      console.log(`   Assunto: Cliente assinou a proposta!`)
      console.log(`   Corretor: ${nomeCorretor}`)
      console.log(`   Cliente: ${nomeCliente}`)
      console.log(`   Proposta: ${idProposta}`)
      console.log(`   Valor: R$ ${valorProposta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`)
      console.log("=".repeat(50))
      console.log("✅ Notificação de assinatura simulada!")

      await new Promise((resolve) => setTimeout(resolve, 500))
      return true
    }

    // Tentar envio real
    const payload = {
      to: emailCorretor,
      nome: nomeCorretor,
      subject: `🎉 Cliente ${nomeCliente} assinou a proposta!`,
      cliente: nomeCliente,
      proposta: idProposta,
      valor: valorProposta,
      tipo: "proposta_assinada",
      timestamp: new Date().toISOString(),
    }

    const resultado = await tentarEdgeFunction(payload)

    if (resultado.sucesso) {
      console.log("✅ Email de assinatura enviado!")
      return true
    } else {
      console.warn("⚠️ Falha no envio de notificação de assinatura:", resultado.erro)
      return false
    }
  } catch (error) {
    console.error("💥 Erro no email de assinatura:", error)
    return false
  }
}

/**
 * Envia email para o corretor quando a proposta é aprovada
 */
export async function enviarEmailPropostaAprovada(
  emailCorretor: string,
  nomeCorretor: string,
  nomeCliente: string,
  idProposta: string,
  valorProposta: number,
  comissao?: number,
): Promise<boolean> {
  try {
    console.log("📧 ENVIANDO NOTIFICAÇÃO DE APROVAÇÃO PARA CORRETOR")

    const ambiente = detectarAmbiente()

    if (ambiente.tipo === "desenvolvimento") {
      console.log("🔧 SIMULAÇÃO - EMAIL DE APROVAÇÃO PARA CORRETOR")
      console.log("=".repeat(50))
      console.log(`   Para: ${emailCorretor}`)
      console.log(`   Assunto: Proposta aprovada - Parabéns!`)
      console.log(`   Corretor: ${nomeCorretor}`)
      console.log(`   Cliente: ${nomeCliente}`)
      console.log(`   Proposta: ${idProposta}`)
      console.log(`   Valor: R$ ${valorProposta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`)
      if (comissao) {
        console.log(`   Comissão: R$ ${comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`)
      }
      console.log("=".repeat(50))
      console.log("✅ Notificação de aprovação simulada!")

      await new Promise((resolve) => setTimeout(resolve, 500))
      return true
    }

    // Tentar envio real
    const payload = {
      to: emailCorretor,
      nome: nomeCorretor,
      subject: `✅ Proposta aprovada - ${nomeCliente}`,
      cliente: nomeCliente,
      proposta: idProposta,
      valor: valorProposta,
      comissao: comissao || 0,
      tipo: "proposta_aprovada",
      timestamp: new Date().toISOString(),
    }

    const resultado = await tentarEdgeFunction(payload)

    if (resultado.sucesso) {
      console.log("✅ Email de aprovação enviado!")
      return true
    } else {
      console.warn("⚠️ Falha no envio de notificação de aprovação:", resultado.erro)
      return false
    }
  } catch (error) {
    console.error("💥 Erro no email de aprovação:", error)
    return false
  }
}

/**
 * Envia email para o corretor quando a proposta é rejeitada
 */
export async function enviarEmailPropostaRejeitada(
  emailCorretor: string,
  nomeCorretor: string,
  nomeCliente: string,
  idProposta: string,
  motivoRejeicao: string,
): Promise<boolean> {
  try {
    console.log("📧 ENVIANDO NOTIFICAÇÃO DE REJEIÇÃO PARA CORRETOR")

    const ambiente = detectarAmbiente()

    if (ambiente.tipo === "desenvolvimento") {
      console.log("🔧 SIMULAÇÃO - EMAIL DE REJEIÇÃO PARA CORRETOR")
      console.log("=".repeat(50))
      console.log(`   Para: ${emailCorretor}`)
      console.log(`   Assunto: Proposta rejeitada`)
      console.log(`   Corretor: ${nomeCorretor}`)
      console.log(`   Cliente: ${nomeCliente}`)
      console.log(`   Proposta: ${idProposta}`)
      console.log(`   Motivo: ${motivoRejeicao}`)
      console.log("=".repeat(50))
      console.log("✅ Notificação de rejeição simulada!")

      await new Promise((resolve) => setTimeout(resolve, 500))
      return true
    }

    // Tentar envio real
    const payload = {
      to: emailCorretor,
      nome: nomeCorretor,
      subject: `❌ Proposta rejeitada - ${nomeCliente}`,
      cliente: nomeCliente,
      proposta: idProposta,
      motivo: motivoRejeicao,
      tipo: "proposta_rejeitada",
      timestamp: new Date().toISOString(),
    }

    const resultado = await tentarEdgeFunction(payload)

    if (resultado.sucesso) {
      console.log("✅ Email de rejeição enviado!")
      return true
    } else {
      console.warn("⚠️ Falha no envio de notificação de rejeição:", resultado.erro)
      return false
    }
  } catch (error) {
    console.error("💥 Erro no email de rejeição:", error)
    return false
  }
}

/**
 * Teste rápido da Edge Function
 */
export async function testeRapidoEdgeFunction(): Promise<boolean> {
  try {
    console.log("⚡ TESTE RÁPIDO DA EDGE FUNCTION")

    const resultado = await tentarEdgeFunction({
      to: "teste@exemplo.com",
      nome: "Teste Sistema",
      subject: "Teste de conectividade",
      tipo: "teste",
      timestamp: new Date().toISOString(),
    })

    console.log(`⚡ Resultado do teste rápido: ${resultado.sucesso ? "✅ SUCESSO" : "❌ FALHA"}`)
    if (!resultado.sucesso) {
      console.log(`⚡ Erro: ${resultado.erro}`)
    }

    return resultado.sucesso
  } catch (error) {
    console.error("❌ Erro no teste rápido:", error)
    return false
  }
}

/**
 * Verifica o status do serviço de email
 */
export async function verificarServicoEmail(): Promise<{
  disponivel: boolean
  detalhes: string
  ambiente: string
}> {
  const ambiente = detectarAmbiente()

  if (ambiente.tipo === "desenvolvimento") {
    return {
      disponivel: true,
      detalhes: "Simulação ativa - emails são exibidos no console",
      ambiente: ambiente.tipo,
    }
  }

  try {
    const disponivel = await testeRapidoEdgeFunction()

    return {
      disponivel,
      detalhes: disponivel
        ? `Edge Function '${SUPABASE_CONFIG.functionName}' funcionando corretamente`
        : `Edge Function '${SUPABASE_CONFIG.functionName}' não acessível`,
      ambiente: ambiente.tipo,
    }
  } catch (error) {
    return {
      disponivel: false,
      detalhes: `Erro na verificação: ${error.message}`,
      ambiente: ambiente.tipo,
    }
  }
}

/**
 * Função para debug - testa o envio de email
 */
export async function debugEnvioEmail(): Promise<void> {
  console.log("🔍 INICIANDO DEBUG COMPLETO DO SERVIÇO DE EMAIL")
  console.log("=".repeat(60))

  const ambiente = detectarAmbiente()
  console.log(`🌍 Ambiente: ${ambiente.tipo}`)
  console.log(`🏠 Hostname: ${ambiente.hostname}`)
  console.log(`🔒 Protocol: ${ambiente.protocol}`)
  console.log(`📍 Edge Function: ${SUPABASE_CONFIG.functionName}`)
  console.log(`🔗 URL: ${SUPABASE_CONFIG.url}/functions/v1/${SUPABASE_CONFIG.functionName}`)

  const status = await verificarServicoEmail()
  console.log(`📊 Status: ${status.disponivel ? "Disponível" : "Indisponível"}`)
  console.log(`📝 Detalhes: ${status.detalhes}`)

  // Teste rápido
  console.log("⚡ Executando teste rápido...")
  const testeRapido = await testeRapidoEdgeFunction()
  console.log(`⚡ Resultado: ${testeRapido ? "✅ Sucesso" : "❌ Falha"}`)

  console.log("=".repeat(60))
  console.log("🔍 DEBUG CONCLUÍDO")
}
