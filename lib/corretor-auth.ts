import { supabase } from "./supabase"
import { buscarCorretorPorEmail } from "@/services/corretores-service"

/**
 * Realiza o login do corretor com tratamento especial para desenvolvimento
 */
export async function loginCorretor(email: string, senha: string) {
  try {
    console.log("Tentando login para:", email)

    // 1. Verificar se o corretor existe no banco de dados
    const corretor = await buscarCorretorPorEmail(email)

    if (!corretor) {
      console.error("Corretor não encontrado no banco de dados")
      throw new Error("Corretor não encontrado. Verifique o email ou faça seu cadastro.")
    }

    console.log("Corretor encontrado no banco de dados:", corretor.id)

    // 2. Em ambiente de desenvolvimento, permitir login direto
    if (process.env.NODE_ENV === "development") {
      console.log("Ambiente de desenvolvimento detectado - permitindo login direto")
      localStorage.setItem("corretorLogado", JSON.stringify(corretor))
      return { corretor }
    }

    // 3. Em produção, verificar autenticação normal
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) {
      console.error("Erro de autenticação:", error.message)

      if (error.message.includes("Invalid login credentials")) {
        throw new Error("Senha incorreta. Por favor, verifique suas credenciais.")
      }

      throw new Error(`Erro de autenticação: ${error.message}`)
    }

    // 4. Login bem-sucedido
    localStorage.setItem("corretorLogado", JSON.stringify(corretor))
    return { user: data.user, corretor }
  } catch (error: any) {
    console.error("Erro ao fazer login:", error.message)
    throw error
  }
}

/**
 * Realiza o logout do corretor
 */
export async function logoutCorretor() {
  try {
    localStorage.removeItem("corretorLogado")

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Erro ao fazer logout:", error.message)
    }

    return true
  } catch (error: any) {
    console.error("Erro ao fazer logout:", error.message)
    return false
  }
}

/**
 * Verifica se o corretor está autenticado
 */
export async function verificarAutenticacaoCorretor() {
  // 1. Verificar se há dados no localStorage
  const corretorLogado = localStorage.getItem("corretorLogado")

  if (!corretorLogado) {
    return { autenticado: false }
  }

  // 2. Em desenvolvimento, aceitar apenas o localStorage
  if (process.env.NODE_ENV === "development") {
    return {
      autenticado: true,
      corretor: JSON.parse(corretorLogado),
    }
  }

  // 3. Em produção, verificar também a sessão do Supabase
  try {
    const { data } = await supabase.auth.getSession()

    return {
      autenticado: !!data.session,
      corretor: JSON.parse(corretorLogado),
      session: data.session,
    }
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error)
    return { autenticado: false }
  }
}
