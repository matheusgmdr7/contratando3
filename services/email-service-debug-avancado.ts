/**
 * Diagnóstico avançado para problemas de Edge Function
 */

const SUPABASE_CONFIG = {
  url: "https://jtzbuxoslaotpnwsphqv.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0emJ1eG9zbGFvdHBud3NwaHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1MDU5MDEsImV4cCI6MjA1ODA4MTkwMX0.jmI-h8pKW00TN5uNpo3Q16GaZzOpFAnPUVO0yyNq54U",
}

/**
 * Testa diferentes nomes possíveis para a Edge Function
 */
async function testarNomesEdgeFunction(): Promise<{
  resultados: Array<{ nome: string; status: number | string; erro?: string }>
  funcaoEncontrada?: string
}> {
  const nomesParaTestar = [
    "enviar-email",
    "enviar_email",
    "send-email",
    "email",
    "sendEmail",
    "notificar-email",
    "email-service",
  ]

  const resultados = []
  let funcaoEncontrada: string | undefined

  for (const nome of nomesParaTestar) {
    try {
      console.log(`🔍 Testando função: ${nome}`)

      const url = `${SUPABASE_CONFIG.url}/functions/v1/${nome}`

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
        },
        body: JSON.stringify({ teste: true }),
      })

      const status = response.status
      console.log(`📊 ${nome}: Status ${status}`)

      resultados.push({ nome, status })

      // Se não for 404, a função existe
      if (status !== 404 && !funcaoEncontrada) {
        funcaoEncontrada = nome
        console.log(`✅ Função encontrada: ${nome}`)
      }
    } catch (error) {
      console.log(`❌ ${nome}: ${error.message}`)
      resultados.push({ nome, status: "Erro", erro: error.message })
    }
  }

  return { resultados, funcaoEncontrada }
}

/**
 * Testa diferentes combinações de headers
 */
async function testarHeaders(nomeFuncao: string): Promise<{
  resultados: Array<{ headers: string; status: number | string; erro?: string; resposta?: any }>
}> {
  const combinacoesHeaders = [
    {
      nome: "Básico",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
      },
    },
    {
      nome: "Com apikey",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
        apikey: SUPABASE_CONFIG.anonKey,
      },
    },
    {
      nome: "Com CORS",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    },
    {
      nome: "Completo",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
        apikey: SUPABASE_CONFIG.anonKey,
        "User-Agent": "ContratandoPlanos/1.0",
        Accept: "application/json",
      },
    },
  ]

  const resultados = []

  for (const combo of combinacoesHeaders) {
    try {
      console.log(`🔍 Testando headers: ${combo.nome}`)

      const url = `${SUPABASE_CONFIG.url}/functions/v1/${nomeFuncao}`

      const response = await fetch(url, {
        method: "POST",
        headers: combo.headers,
        body: JSON.stringify({ teste: true, timestamp: new Date().toISOString() }),
      })

      const status = response.status
      let resposta: any = null

      try {
        const text = await response.text()
        resposta = { text, length: text.length }

        // Tentar parsear como JSON
        try {
          resposta.json = JSON.parse(text)
        } catch {
          // Não é JSON válido
        }
      } catch (error) {
        resposta = { erro: "Não foi possível ler a resposta" }
      }

      console.log(`📊 ${combo.nome}: Status ${status}`, resposta)

      resultados.push({
        headers: combo.nome,
        status,
        resposta,
      })
    } catch (error) {
      console.log(`❌ ${combo.nome}: ${error.message}`)
      resultados.push({
        headers: combo.nome,
        status: "Erro",
        erro: error.message,
      })
    }
  }

  return { resultados }
}

/**
 * Testa especificamente problemas de CORS
 */
async function testarCORS(nomeFuncao: string): Promise<{
  preflight: any
  request: any
  corsSuportado: boolean
}> {
  const url = `${SUPABASE_CONFIG.url}/functions/v1/${nomeFuncao}`

  // Teste 1: Preflight OPTIONS
  let preflight: any = {}
  try {
    console.log("🔍 Testando preflight CORS (OPTIONS)...")

    const optionsResponse = await fetch(url, {
      method: "OPTIONS",
      headers: {
        Origin: window.location.origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, Authorization",
      },
    })

    preflight = {
      status: optionsResponse.status,
      headers: Object.fromEntries(optionsResponse.headers.entries()),
      ok: optionsResponse.ok,
    }

    console.log("📊 Preflight CORS:", preflight)
  } catch (error) {
    preflight = { erro: error.message }
    console.log("❌ Erro no preflight:", error.message)
  }

  // Teste 2: Request real com Origin
  let request: any = {}
  try {
    console.log("🔍 Testando request com Origin...")

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
        Origin: window.location.origin,
      },
      body: JSON.stringify({ teste: true }),
    })

    const responseText = await response.text().catch(() => "")

    request = {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok,
      body: responseText,
    }

    console.log("📊 Request com Origin:", request)
  } catch (error) {
    request = { erro: error.message }
    console.log("❌ Erro no request:", error.message)
  }

  // Análise de CORS
  const corsSuportado =
    preflight.headers?.["access-control-allow-origin"] ||
    preflight.headers?.["access-control-allow-methods"] ||
    request.headers?.["access-control-allow-origin"] ||
    false

  return { preflight, request, corsSuportado }
}

/**
 * Verifica se a Edge Function está listada no Supabase
 */
async function verificarListaFuncoes(): Promise<{
  sucesso: boolean
  funcoes?: string[]
  erro?: string
}> {
  try {
    console.log("🔍 Tentando listar Edge Functions...")

    // Tentar acessar endpoint de listagem (pode não existir publicamente)
    const response = await fetch(`${SUPABASE_CONFIG.url}/functions/v1/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      return { sucesso: true, funcoes: data }
    } else {
      return { sucesso: false, erro: `Status ${response.status}` }
    }
  } catch (error) {
    return { sucesso: false, erro: error.message }
  }
}

/**
 * Diagnóstico completo e avançado
 */
export async function diagnosticoAvancadoEdgeFunction(): Promise<{
  nomes: any
  headers?: any
  cors?: any
  lista?: any
  recomendacoes: string[]
  proximosPasso: string[]
}> {
  console.log("🔍 INICIANDO DIAGNÓSTICO AVANÇADO DA EDGE FUNCTION")
  console.log("=".repeat(60))

  // Teste 1: Diferentes nomes de função
  console.log("1️⃣ Testando diferentes nomes de função...")
  const nomes = await testarNomesEdgeFunction()

  let headers: any = undefined
  let cors: any = undefined

  // Se encontrou uma função, testar headers e CORS
  if (nomes.funcaoEncontrada) {
    console.log(`2️⃣ Testando headers para função: ${nomes.funcaoEncontrada}`)
    headers = await testarHeaders(nomes.funcaoEncontrada)

    console.log(`3️⃣ Testando CORS para função: ${nomes.funcaoEncontrada}`)
    cors = await testarCORS(nomes.funcaoEncontrada)
  } else {
    console.log("2️⃣ Nenhuma função encontrada, pulando testes de headers e CORS")
  }

  // Teste 4: Listar funções
  console.log("4️⃣ Tentando listar Edge Functions...")
  const lista = await verificarListaFuncoes()

  // Análise e recomendações
  const recomendacoes: string[] = []
  const proximosPasso: string[] = []

  if (!nomes.funcaoEncontrada) {
    recomendacoes.push("❌ Nenhuma Edge Function encontrada com os nomes testados")
    recomendacoes.push("🔍 Verifique se a função foi deployada no Supabase")
    recomendacoes.push("📝 Confirme o nome exato da função no dashboard do Supabase")

    proximosPasso.push("Acesse o dashboard do Supabase")
    proximosPasso.push("Vá em 'Edge Functions'")
    proximosPasso.push("Verifique se a função 'enviar-email' existe")
    proximosPasso.push("Se não existir, faça o deploy da função")
  } else {
    recomendacoes.push(`✅ Função encontrada: ${nomes.funcaoEncontrada}`)

    if (cors && !cors.corsSuportado) {
      recomendacoes.push("❌ Problemas de CORS detectados")
      recomendacoes.push("🔧 Configure CORS na Edge Function")

      proximosPasso.push("Adicione headers CORS na Edge Function:")
      proximosPasso.push("  'Access-Control-Allow-Origin': '*'")
      proximosPasso.push("  'Access-Control-Allow-Methods': 'POST, OPTIONS'")
      proximosPasso.push("  'Access-Control-Allow-Headers': 'Content-Type, Authorization'")
    }

    if (headers) {
      const sucessos = headers.resultados.filter((r) => typeof r.status === "number" && r.status < 400)
      if (sucessos.length > 0) {
        recomendacoes.push(`✅ Headers funcionais encontrados: ${sucessos.map((s) => s.headers).join(", ")}`)
      } else {
        recomendacoes.push("❌ Nenhuma combinação de headers funcionou")
        proximosPasso.push("Verifique os logs da Edge Function no Supabase")
        proximosPasso.push("Confirme se a função está processando requests corretamente")
      }
    }
  }

  console.log("📊 DIAGNÓSTICO AVANÇADO CONCLUÍDO")
  console.log("=".repeat(60))

  return {
    nomes,
    headers,
    cors,
    lista,
    recomendacoes,
    proximosPasso,
  }
}

/**
 * Teste com a função encontrada (se houver)
 */
export async function testarFuncaoEncontrada(): Promise<{
  sucesso: boolean
  nomeFuncao?: string
  detalhes: any
}> {
  console.log("🔍 Procurando e testando função disponível...")

  const nomes = await testarNomesEdgeFunction()

  if (!nomes.funcaoEncontrada) {
    return {
      sucesso: false,
      detalhes: {
        erro: "Nenhuma Edge Function encontrada",
        nomesTentados: nomes.resultados,
      },
    }
  }

  // Testar a função encontrada
  try {
    const url = `${SUPABASE_CONFIG.url}/functions/v1/${nomes.funcaoEncontrada}`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
        apikey: SUPABASE_CONFIG.anonKey,
      },
      body: JSON.stringify({
        to: "teste@exemplo.com",
        subject: "Teste de funcionamento",
        nome: "Teste",
        tipo: "teste",
        timestamp: new Date().toISOString(),
      }),
    })

    const responseText = await response.text()
    let responseJson: any = null

    try {
      responseJson = JSON.parse(responseText)
    } catch {
      // Não é JSON
    }

    return {
      sucesso: response.ok,
      nomeFuncao: nomes.funcaoEncontrada,
      detalhes: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText,
        json: responseJson,
      },
    }
  } catch (error) {
    return {
      sucesso: false,
      nomeFuncao: nomes.funcaoEncontrada,
      detalhes: {
        erro: error.message,
        tipo: error.name,
      },
    }
  }
}
