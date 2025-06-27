/**
 * Serviço de email com diagnóstico detalhado para Edge Function
 */

// Configurações da Edge Function
const SUPABASE_CONFIG = {
  url: "https://jtzbuxoslaotpnwsphqv.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0emJ1eG9zbGFvdHBud3NwaHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1MDU5MDEsImV4cCI6MjA1ODA4MTkwMX0.jmI-h8pKW00TN5uNpo3Q16GaZzOpFAnPUVO0yyNq54U",
  functionName: "enviar-email",
}

/**
 * Teste básico de conectividade com Supabase
 */
async function testarConectividadeSupabase(): Promise<{ sucesso: boolean; detalhes: any }> {
  try {
    console.log("🔍 Testando conectividade básica com Supabase...")

    const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: SUPABASE_CONFIG.anonKey,
        Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
      },
    })

    const detalhes = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok,
    }

    console.log("📊 Resposta da conectividade Supabase:", detalhes)

    return { sucesso: response.ok, detalhes }
  } catch (error) {
    console.error("❌ Erro na conectividade Supabase:", error)
    return {
      sucesso: false,
      detalhes: {
        erro: error.message,
        tipo: error.name,
        stack: error.stack,
      },
    }
  }
}

/**
 * Teste de existência da Edge Function
 */
async function testarExistenciaEdgeFunction(): Promise<{ sucesso: boolean; detalhes: any }> {
  try {
    console.log("🔍 Verificando se a Edge Function existe...")

    const url = `${SUPABASE_CONFIG.url}/functions/v1/${SUPABASE_CONFIG.functionName}`
    console.log("🌐 URL da Edge Function:", url)

    // Primeiro, tentar OPTIONS para verificar CORS
    console.log("🔄 Testando OPTIONS (CORS)...")
    const optionsResponse = await fetch(url, {
      method: "OPTIONS",
      headers: {
        Origin: window.location.origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, Authorization",
      },
    })

    console.log("📋 Resposta OPTIONS:", {
      status: optionsResponse.status,
      headers: Object.fromEntries(optionsResponse.headers.entries()),
    })

    // Agora tentar POST básico
    console.log("🔄 Testando POST básico...")
    const postResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
        apikey: SUPABASE_CONFIG.anonKey,
      },
      body: JSON.stringify({ teste: true }),
    })

    const detalhes = {
      options: {
        status: optionsResponse.status,
        headers: Object.fromEntries(optionsResponse.headers.entries()),
      },
      post: {
        status: postResponse.status,
        statusText: postResponse.statusText,
        headers: Object.fromEntries(postResponse.headers.entries()),
        ok: postResponse.ok,
      },
    }

    // Tentar ler o corpo da resposta
    try {
      const responseText = await postResponse.text()
      detalhes.post.body = responseText

      // Se for JSON válido, parsear
      try {
        detalhes.post.json = JSON.parse(responseText)
      } catch {
        // Não é JSON, manter como texto
      }
    } catch (error) {
      detalhes.post.bodyError = error.message
    }

    console.log("📊 Detalhes completos da Edge Function:", detalhes)

    return {
      sucesso: postResponse.status !== 404, // 404 = função não existe
      detalhes,
    }
  } catch (error) {
    console.error("❌ Erro ao testar Edge Function:", error)
    return {
      sucesso: false,
      detalhes: {
        erro: error.message,
        tipo: error.name,
        stack: error.stack,
      },
    }
  }
}

/**
 * Teste completo de envio de email
 */
async function testarEnvioCompleto(payload: any): Promise<{ sucesso: boolean; detalhes: any }> {
  try {
    console.log("🔍 Testando envio completo de email...")
    console.log("📤 Payload:", JSON.stringify(payload, null, 2))

    const url = `${SUPABASE_CONFIG.url}/functions/v1/${SUPABASE_CONFIG.functionName}`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
        apikey: SUPABASE_CONFIG.anonKey,
        "User-Agent": "ContratandoPlanos/1.0",
      },
      body: JSON.stringify(payload),
    })

    const detalhes = {
      request: {
        url,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_CONFIG.anonKey.substring(0, 20)}...`,
          apikey: `${SUPABASE_CONFIG.anonKey.substring(0, 20)}...`,
        },
        payload,
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      },
    }

    // Tentar ler o corpo da resposta
    try {
      const responseText = await response.text()
      detalhes.response.body = responseText

      // Se for JSON válido, parsear
      try {
        detalhes.response.json = JSON.parse(responseText)
      } catch {
        // Não é JSON, manter como texto
      }
    } catch (error) {
      detalhes.response.bodyError = error.message
    }

    console.log("📊 Detalhes completos do envio:", detalhes)

    return {
      sucesso: response.ok,
      detalhes,
    }
  } catch (error) {
    console.error("❌ Erro no envio completo:", error)
    return {
      sucesso: false,
      detalhes: {
        erro: error.message,
        tipo: error.name,
        stack: error.stack,
      },
    }
  }
}

/**
 * Diagnóstico completo da Edge Function
 */
export async function diagnosticarEdgeFunction(): Promise<{
  conectividade: any
  existencia: any
  envioTeste: any
  resumo: string
  recomendacoes: string[]
}> {
  console.log("🔍 INICIANDO DIAGNÓSTICO COMPLETO DA EDGE FUNCTION")
  console.log("=".repeat(60))

  // Teste 1: Conectividade básica com Supabase
  const conectividade = await testarConectividadeSupabase()

  // Teste 2: Existência da Edge Function
  const existencia = await testarExistenciaEdgeFunction()

  // Teste 3: Envio de teste
  const envioTeste = await testarEnvioCompleto({
    teste: true,
    to: "teste@exemplo.com",
    subject: "Teste de diagnóstico",
    nome: "Teste",
    timestamp: new Date().toISOString(),
  })

  // Análise dos resultados
  let resumo = ""
  const recomendacoes: string[] = []

  if (!conectividade.sucesso) {
    resumo = "❌ Falha na conectividade básica com Supabase"
    recomendacoes.push("Verificar se a URL do Supabase está correta")
    recomendacoes.push("Verificar se a chave anônima está válida")
    recomendacoes.push("Verificar conexão com a internet")
  } else if (!existencia.sucesso) {
    resumo = "❌ Edge Function não encontrada ou inacessível"
    recomendacoes.push("Verificar se a Edge Function 'enviar-email' foi deployada")
    recomendacoes.push("Verificar o nome da função no Supabase")
    recomendacoes.push("Verificar permissões da função")
  } else if (!envioTeste.sucesso) {
    resumo = "❌ Edge Function existe mas falha no processamento"
    recomendacoes.push("Verificar logs da Edge Function no Supabase")
    recomendacoes.push("Verificar se as variáveis de ambiente estão configuradas")
    recomendacoes.push("Verificar se o código da função está correto")
  } else {
    resumo = "✅ Edge Function funcionando corretamente"
    recomendacoes.push("Sistema operacional - pode prosseguir com envios reais")
  }

  console.log("📊 RESUMO DO DIAGNÓSTICO:", resumo)
  console.log("💡 RECOMENDAÇÕES:", recomendacoes)
  console.log("=".repeat(60))

  return {
    conectividade,
    existencia,
    envioTeste,
    resumo,
    recomendacoes,
  }
}

/**
 * Versão simplificada do envio de email com logs detalhados
 */
export async function enviarEmailComDiagnostico(
  emailCliente: string,
  nomeCliente: string,
  linkProposta: string,
  nomeCorretor: string,
): Promise<{ sucesso: boolean; detalhes: any }> {
  console.log("📧 INICIANDO ENVIO DE EMAIL COM DIAGNÓSTICO")
  console.log("=".repeat(50))
  console.log(`📨 Para: ${emailCliente}`)
  console.log(`👤 Cliente: ${nomeCliente}`)
  console.log(`🏢 Corretor: ${nomeCorretor}`)
  console.log(`🔗 Link: ${linkProposta}`)

  const payload = {
    to: emailCliente,
    subject: "Complete sua proposta de plano de saúde",
    nome: nomeCliente,
    corretor: nomeCorretor,
    link: linkProposta,
    tipo: "proposta_cliente",
    timestamp: new Date().toISOString(),
  }

  const resultado = await testarEnvioCompleto(payload)

  console.log("=".repeat(50))
  console.log(`📊 RESULTADO: ${resultado.sucesso ? "✅ SUCESSO" : "❌ FALHA"}`)

  if (!resultado.sucesso) {
    console.log("🔍 EXECUTAR DIAGNÓSTICO COMPLETO PARA MAIS DETALHES")
  }

  return resultado
}

/**
 * Teste rápido da Edge Function
 */
export async function testeRapidoEdgeFunction(): Promise<boolean> {
  try {
    const url = `${SUPABASE_CONFIG.url}/functions/v1/${SUPABASE_CONFIG.functionName}`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
      },
      body: JSON.stringify({ teste: true }),
    })

    return response.status !== 404 && response.status < 500
  } catch {
    return false
  }
}
