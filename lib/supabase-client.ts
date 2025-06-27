import { createClient } from "@supabase/supabase-js"

// Valores padrão para desenvolvimento (substitua pelos seus valores reais em produção)
const defaultUrl = "https://jtzbuxoslaotpnwsphqv.supabase.co"
const defaultAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0emJ1eG9zbGFvdHBud3NwaHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1MDU5MDEsImV4cCI6MjA1ODA4MTkwMX0.jmI-h8pKW00TN5uNpo3Q16GaZzOpFAnPUVO0yyNq54U"

// Usar valores do ambiente se disponíveis, caso contrário usar os padrões
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultUrl
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultAnonKey

// Criar um cliente Supabase singleton para evitar múltiplas instâncias
let supabaseInstance: any = null

export function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  console.log("🔧 Inicializando cliente Supabase com:", {
    url: supabaseUrl,
    keyLength: supabaseAnonKey.length,
    keyPrefix: supabaseAnonKey.substring(0, 20) + "...",
    usingDefaults: !process.env.NEXT_PUBLIC_SUPABASE_URL,
  })

  // Criar o cliente com configurações otimizadas
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return supabaseInstance
}

// Exportar o cliente Supabase
export const supabaseClient = getSupabaseClient()

// Função para testar a conexão
export async function testarConexaoSupabase() {
  try {
    console.log("🔍 Testando conexão com Supabase...")
    console.log("URL:", supabaseUrl)
    console.log("Key (primeiros 10 caracteres):", supabaseAnonKey.substring(0, 10) + "...")

    // Teste simples de conexão
    const { data, error } = await supabaseClient.from("produtos_corretores").select("id").limit(1)

    if (error) {
      console.error("❌ Erro ao testar conexão Supabase:", error)
      return {
        success: false,
        message: error.message,
        details: error,
      }
    }

    console.log("✅ Conexão Supabase funcionando! Dados recebidos:", data)
    return {
      success: true,
      message: "Conexão estabelecida com sucesso",
      details: { data },
    }
  } catch (error) {
    console.error("❌ Erro inesperado ao testar Supabase:", error)
    return {
      success: false,
      message: error.message,
      details: { error },
    }
  }
}

// Função para verificar explicitamente as chaves de API
export async function verificarChavesAPI() {
  try {
    console.log("🔍 Verificando chaves de API...")

    // Verificar se as chaves estão definidas
    if (!supabaseUrl || supabaseUrl.trim() === "") {
      console.error("❌ URL do Supabase não definida")
      return {
        success: false,
        message: "URL do Supabase não definida",
        details: { url: false, key: false },
      }
    }

    if (!supabaseAnonKey || supabaseAnonKey.trim() === "") {
      console.error("❌ Chave anônima do Supabase não definida")
      return {
        success: false,
        message: "Chave anônima do Supabase não definida",
        details: { url: true, key: false },
      }
    }

    // Testar a conexão
    return await testarConexaoSupabase()
  } catch (error) {
    console.error("❌ Erro inesperado ao verificar chaves de API:", error)
    return {
      success: false,
      message: error.message,
      details: { error },
    }
  }
}

// Função para obter as variáveis de ambiente do Supabase
export function getSupabaseEnv() {
  return {
    url: supabaseUrl,
    key: supabaseAnonKey,
    isUsingDefaults: !process.env.NEXT_PUBLIC_SUPABASE_URL,
  }
}
