import { supabase } from "@/lib/supabase"
import { buscarCorretorPorEmail, criarCorretor } from "./corretores-service"
import type { Corretor } from "@/types/corretores"

export interface LoginCorretorData {
  email: string
  senha: string
}

export interface LoginCorretorResult {
  success: boolean
  message: string
  corretor?: Corretor
}

export interface CadastroCorretorData {
  nome: string
  email: string
  senha: string
  whatsapp: string
  estado: string
  cidade?: string
}

// Função para verificar se o usuário existe no Supabase Auth
async function verificarUsuarioAuth(email: string): Promise<boolean> {
  try {
    // Verificar se o usuário existe no Supabase Auth
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // Não criar usuário, apenas verificar
      },
    })

    // Se não houver erro e data existir, o usuário existe
    return !error && !!data
  } catch (error) {
    console.error("Erro ao verificar usuário no Auth:", error)
    return false
  }
}

// Função para criar usuário no Supabase Auth
async function criarUsuarioAuth(email: string, senha: string, nome: string): Promise<boolean> {
  try {
    // Criar usuário no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          role: "corretor",
          nome,
        },
      },
    })

    if (error) {
      console.error("Erro ao criar usuário no Auth:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao criar usuário no Auth:", error)
    return false
  }
}

// Função para login do corretor
export async function loginCorretor(data: LoginCorretorData): Promise<LoginCorretorResult> {
  try {
    // Primeiro, verificar se o corretor existe na tabela corretores
    const corretor = await buscarCorretorPorEmail(data.email)

    if (!corretor) {
      return {
        success: false,
        message: "Corretor não encontrado. Verifique seu email ou faça seu cadastro.",
      }
    }

    // Verificar se o usuário existe no Supabase Auth
    const usuarioExiste = await verificarUsuarioAuth(data.email)

    // Se o usuário não existir no Auth, mas existir na tabela corretores, criar no Auth
    if (!usuarioExiste) {
      console.log("Usuário não existe no Auth, criando...")
      const criado = await criarUsuarioAuth(data.email, data.senha, corretor.nome)

      if (!criado) {
        return {
          success: false,
          message: "Erro ao criar usuário. Por favor, entre em contato com o suporte.",
        }
      }

      // Aguardar um momento para garantir que o usuário foi criado
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // Tentar autenticar com Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.senha,
    })

    if (authError) {
      console.error("Erro na autenticação:", authError)

      // Verificar o tipo de erro para fornecer mensagem mais específica
      if (authError.message.includes("Invalid login credentials")) {
        return {
          success: false,
          message: "Senha incorreta. Tente novamente ou use a opção 'Esqueceu a senha'.",
        }
      }

      return {
        success: false,
        message: `Erro na autenticação: ${authError.message}`,
      }
    }

    // Verificar status do corretor
    if (corretor.status !== "aprovado") {
      // Não fazemos logout aqui, pois queremos que o corretor possa ver a página de aguardando aprovação
      return {
        success: true,
        message: "Login realizado com sucesso, aguardando aprovação.",
        corretor,
      }
    }

    // Salvar dados do corretor no localStorage
    localStorage.setItem(
      "corretorLogado",
      JSON.stringify({
        ...corretor,
        session: authData.session,
      }),
    )

    return {
      success: true,
      message: "Login realizado com sucesso!",
      corretor,
    }
  } catch (error) {
    console.error("Erro ao fazer login:", error)
    return {
      success: false,
      message: "Ocorreu um erro ao fazer login. Tente novamente.",
    }
  }
}

// Função para cadastro do corretor
export async function cadastrarCorretor(data: CadastroCorretorData): Promise<LoginCorretorResult> {
  try {
    // Verificar se o corretor já existe
    const corretorExistente = await buscarCorretorPorEmail(data.email)
    if (corretorExistente) {
      return {
        success: false,
        message: "Este email já está cadastrado. Tente fazer login ou recuperar sua senha.",
      }
    }

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.senha,
      options: {
        data: {
          role: "corretor",
          nome: data.nome,
        },
      },
    })

    if (authError) {
      console.error("Erro ao criar usuário no Auth:", authError)
      return {
        success: false,
        message: `Erro ao criar conta: ${authError.message}`,
      }
    }

    // 2. Criar registro na tabela corretores
    const corretor = await criarCorretor({
      nome: data.nome,
      email: data.email,
      whatsapp: data.whatsapp,
      estado: data.estado,
      cidade: data.cidade,
      status: "pendente", // Corretor começa como pendente
    })

    // Salvar dados do corretor no localStorage
    localStorage.setItem(
      "corretorLogado",
      JSON.stringify({
        ...corretor,
        session: authData.session,
      }),
    )

    return {
      success: true,
      message: "Cadastro realizado com sucesso! Aguardando aprovação.",
      corretor,
    }
  } catch (error) {
    console.error("Erro ao cadastrar corretor:", error)
    return {
      success: false,
      message: "Ocorreu um erro ao cadastrar. Tente novamente.",
    }
  }
}

// Função para verificar autenticação do corretor
export async function verificarAutenticacaoCorretor(): Promise<{ autenticado: boolean; corretor?: Corretor }> {
  try {
    // Verificar sessão no Supabase Auth
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      // Limpar localStorage se não houver sessão válida
      localStorage.removeItem("corretorLogado")
      return { autenticado: false }
    }

    // Verificar dados do corretor no localStorage
    const corretorLogadoStr = localStorage.getItem("corretorLogado")
    if (!corretorLogadoStr) {
      // Se não há dados no localStorage mas há sessão, buscar dados do corretor
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const corretor = await buscarCorretorPorEmail(user.email || "")
        if (corretor) {
          localStorage.setItem(
            "corretorLogado",
            JSON.stringify({
              ...corretor,
              session,
            }),
          )
          return { autenticado: true, corretor }
        }
      }

      // Se não encontrou o corretor, fazer logout
      await supabase.auth.signOut()
      return { autenticado: false }
    }

    // Verificar dados do corretor no banco
    try {
      const corretorLogado = JSON.parse(corretorLogadoStr)
      const corretor = await buscarCorretorPorEmail(corretorLogado.email)

      if (!corretor) {
        // Corretor não existe mais no banco
        localStorage.removeItem("corretorLogado")
        await supabase.auth.signOut()
        return { autenticado: false }
      }

      // Atualizar dados no localStorage
      localStorage.setItem(
        "corretorLogado",
        JSON.stringify({
          ...corretor,
          session,
        }),
      )

      return { autenticado: true, corretor }
    } catch (parseError) {
      console.error("Erro ao processar dados do localStorage:", parseError)
      localStorage.removeItem("corretorLogado")
      return { autenticado: false }
    }
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error)
    return { autenticado: false }
  }
}

// Função para logout do corretor
export async function logoutCorretor(): Promise<void> {
  try {
    await supabase.auth.signOut()
    localStorage.removeItem("corretorLogado")
  } catch (error) {
    console.error("Erro ao fazer logout:", error)
    // Mesmo com erro, limpar localStorage
    localStorage.removeItem("corretorLogado")
  }
}

// Função para proteger rotas do corretor
export async function protegerRotaCorretor() {
  const { autenticado, corretor } = await verificarAutenticacaoCorretor()

  if (!autenticado) {
    // Redirecionar para login se não estiver autenticado
    return { redirect: { destination: "/corretor/login", permanent: false } }
  }

  if (corretor?.status !== "aprovado") {
    // Redirecionar para página de aguardando aprovação se não estiver aprovado
    return { redirect: { destination: "/corretor/aguardando-aprovacao", permanent: false } }
  }

  // Corretor autenticado e aprovado
  return { props: {} }
}

// Função para obter dados do corretor logado
export function getCorretorLogado(): Corretor | null {
  try {
    const corretorLogadoStr = localStorage.getItem("corretorLogado")
    if (!corretorLogadoStr) return null

    const corretorLogado = JSON.parse(corretorLogadoStr)
    return corretorLogado
  } catch (error) {
    console.error("Erro ao obter dados do corretor logado:", error)
    return null
  }
}

// Adicione esta função ao arquivo auth-corretores-service.ts

// Função alternativa para login (apenas para desenvolvimento)
export async function loginCorretorDev(data: LoginCorretorData): Promise<LoginCorretorResult> {
  try {
    // Verificar se o corretor existe na tabela corretores
    const corretor = await buscarCorretorPorEmail(data.email)

    if (!corretor) {
      return {
        success: false,
        message: "Corretor não encontrado. Verifique seu email ou faça seu cadastro.",
      }
    }

    // Em ambiente de desenvolvimento, não verificamos a senha
    // Apenas verificamos se o corretor existe

    // Verificar status do corretor
    if (corretor.status !== "aprovado") {
      return {
        success: true,
        message: "Login realizado com sucesso, aguardando aprovação.",
        corretor,
      }
    }

    // Salvar dados do corretor no localStorage
    localStorage.setItem(
      "corretorLogado",
      JSON.stringify({
        ...corretor,
        // Criar uma sessão fictícia
        session: {
          access_token: "dev_token",
          expires_at: Date.now() + 3600000, // 1 hora
          refresh_token: "dev_refresh_token",
        },
      }),
    )

    return {
      success: true,
      message: "Login realizado com sucesso!",
      corretor,
    }
  } catch (error) {
    console.error("Erro ao fazer login (dev):", error)
    return {
      success: false,
      message: "Ocorreu um erro ao fazer login. Tente novamente.",
    }
  }
}
