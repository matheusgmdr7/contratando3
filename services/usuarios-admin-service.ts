import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export interface UsuarioAdmin {
  id: string
  nome: string
  email: string
  senha_hash: string
  ativo: boolean
  ultimo_login?: string
  created_at: string
  updated_at: string
}

export interface CriarUsuarioData {
  nome: string
  email: string
  senha: string
}

export interface LoginData {
  email: string
  senha: string
}

/**
 * Serviço para gerenciar usuários administrativos
 */
export class UsuariosAdminService {
  /**
   * Criar um novo usuário admin
   */
  static async criarUsuario(
    dados: CriarUsuarioData,
  ): Promise<{ success: boolean; message: string; usuario?: UsuarioAdmin }> {
    try {
      console.log("🔐 Criando novo usuário admin:", dados.email)

      // Verificar se o email já existe
      const { data: usuarioExistente, error: errorVerificacao } = await supabase
        .from("usuarios_admin")
        .select("email")
        .eq("email", dados.email)
        .single()

      if (usuarioExistente) {
        return {
          success: false,
          message: "Email já está em uso",
        }
      }

      // Hash da senha
      const saltRounds = 12
      const senhaHash = await bcrypt.hash(dados.senha, saltRounds)

      // Inserir usuário
      const { data: novoUsuario, error } = await supabase
        .from("usuarios_admin")
        .insert([
          {
            nome: dados.nome,
            email: dados.email.toLowerCase(),
            senha_hash: senhaHash,
            ativo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("❌ Erro ao criar usuário:", error)
        return {
          success: false,
          message: "Erro ao criar usuário: " + error.message,
        }
      }

      console.log("✅ Usuário criado com sucesso:", novoUsuario.email)
      return {
        success: true,
        message: "Usuário criado com sucesso",
        usuario: novoUsuario,
      }
    } catch (error) {
      console.error("❌ Erro inesperado ao criar usuário:", error)
      return {
        success: false,
        message: "Erro inesperado: " + error.message,
      }
    }
  }

  /**
   * Fazer login de usuário admin
   */
  static async login(dados: LoginData): Promise<{ success: boolean; message: string; usuario?: UsuarioAdmin }> {
    try {
      console.log("🔐 Tentativa de login:", dados.email)

      // Buscar usuário pelo email
      const { data: usuario, error } = await supabase
        .from("usuarios_admin")
        .select("*")
        .eq("email", dados.email.toLowerCase())
        .eq("ativo", true)
        .single()

      if (error || !usuario) {
        console.log("❌ Usuário não encontrado ou inativo")
        return {
          success: false,
          message: "Email ou senha incorretos",
        }
      }

      // Verificar senha
      const senhaValida = await bcrypt.compare(dados.senha, usuario.senha_hash)

      if (!senhaValida) {
        console.log("❌ Senha incorreta")
        return {
          success: false,
          message: "Email ou senha incorretos",
        }
      }

      // Atualizar último login
      await supabase
        .from("usuarios_admin")
        .update({
          ultimo_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", usuario.id)

      console.log("✅ Login realizado com sucesso:", usuario.email)
      return {
        success: true,
        message: "Login realizado com sucesso",
        usuario: {
          ...usuario,
          senha_hash: undefined, // Não retornar o hash da senha
        },
      }
    } catch (error) {
      console.error("❌ Erro inesperado no login:", error)
      return {
        success: false,
        message: "Erro inesperado: " + error.message,
      }
    }
  }

  /**
   * Listar todos os usuários admin
   */
  static async listarUsuarios(): Promise<{ success: boolean; usuarios: UsuarioAdmin[]; message?: string }> {
    try {
      console.log("📋 Listando usuários admin...")

      const { data: usuarios, error } = await supabase
        .from("usuarios_admin")
        .select("id, nome, email, ativo, ultimo_login, created_at, updated_at")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erro ao listar usuários:", error)
        return {
          success: false,
          usuarios: [],
          message: "Erro ao listar usuários: " + error.message,
        }
      }

      console.log(`✅ ${usuarios?.length || 0} usuários encontrados`)
      return {
        success: true,
        usuarios: usuarios || [],
      }
    } catch (error) {
      console.error("❌ Erro inesperado ao listar usuários:", error)
      return {
        success: false,
        usuarios: [],
        message: "Erro inesperado: " + error.message,
      }
    }
  }

  /**
   * Ativar/desativar usuário
   */
  static async alterarStatusUsuario(id: string, ativo: boolean): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔄 Alterando status do usuário ${id} para:`, ativo ? "ativo" : "inativo")

      const { error } = await supabase
        .from("usuarios_admin")
        .update({
          ativo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) {
        console.error("❌ Erro ao alterar status:", error)
        return {
          success: false,
          message: "Erro ao alterar status: " + error.message,
        }
      }

      console.log("✅ Status alterado com sucesso")
      return {
        success: true,
        message: `Usuário ${ativo ? "ativado" : "desativado"} com sucesso`,
      }
    } catch (error) {
      console.error("❌ Erro inesperado ao alterar status:", error)
      return {
        success: false,
        message: "Erro inesperado: " + error.message,
      }
    }
  }

  /**
   * Alterar senha do usuário
   */
  static async alterarSenha(id: string, novaSenha: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🔐 Alterando senha do usuário:", id)

      // Hash da nova senha
      const saltRounds = 12
      const senhaHash = await bcrypt.hash(novaSenha, saltRounds)

      const { error } = await supabase
        .from("usuarios_admin")
        .update({
          senha_hash: senhaHash,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) {
        console.error("❌ Erro ao alterar senha:", error)
        return {
          success: false,
          message: "Erro ao alterar senha: " + error.message,
        }
      }

      console.log("✅ Senha alterada com sucesso")
      return {
        success: true,
        message: "Senha alterada com sucesso",
      }
    } catch (error) {
      console.error("❌ Erro inesperado ao alterar senha:", error)
      return {
        success: false,
        message: "Erro inesperado: " + error.message,
      }
    }
  }

  /**
   * Buscar usuário por ID
   */
  static async buscarUsuarioPorId(id: string): Promise<{ success: boolean; usuario?: UsuarioAdmin; message?: string }> {
    try {
      console.log("🔍 Buscando usuário por ID:", id)

      const { data: usuario, error } = await supabase
        .from("usuarios_admin")
        .select("id, nome, email, ativo, ultimo_login, created_at, updated_at")
        .eq("id", id)
        .single()

      if (error || !usuario) {
        console.log("❌ Usuário não encontrado")
        return {
          success: false,
          message: "Usuário não encontrado",
        }
      }

      console.log("✅ Usuário encontrado:", usuario.email)
      return {
        success: true,
        usuario,
      }
    } catch (error) {
      console.error("❌ Erro inesperado ao buscar usuário:", error)
      return {
        success: false,
        message: "Erro inesperado: " + error.message,
      }
    }
  }

  /**
   * Verificar se existe pelo menos um usuário admin
   */
  static async verificarUsuariosExistentes(): Promise<{ success: boolean; existem: boolean; total: number }> {
    try {
      console.log("🔍 Verificando usuários existentes...")

      const { data: usuarios, error } = await supabase.from("usuarios_admin").select("id", { count: "exact" })

      if (error) {
        console.error("❌ Erro ao verificar usuários:", error)
        return {
          success: false,
          existem: false,
          total: 0,
        }
      }

      const total = usuarios?.length || 0
      console.log(`✅ ${total} usuários encontrados`)

      return {
        success: true,
        existem: total > 0,
        total,
      }
    } catch (error) {
      console.error("❌ Erro inesperado ao verificar usuários:", error)
      return {
        success: false,
        existem: false,
        total: 0,
      }
    }
  }

  /**
   * Criar usuário admin padrão (para setup inicial)
   */
  static async criarUsuarioPadrao(): Promise<{ success: boolean; message: string; usuario?: UsuarioAdmin }> {
    try {
      console.log("🔧 Criando usuário admin padrão...")

      const dadosPadrao: CriarUsuarioData = {
        nome: "Administrador",
        email: "admin@contratandoplanos.com",
        senha: "admin123456",
      }

      const resultado = await this.criarUsuario(dadosPadrao)

      if (resultado.success) {
        console.log("✅ Usuário admin padrão criado com sucesso")
        console.log("📧 Email:", dadosPadrao.email)
        console.log("🔐 Senha:", dadosPadrao.senha)
        console.log("⚠️ IMPORTANTE: Altere a senha após o primeiro login!")
      }

      return resultado
    } catch (error) {
      console.error("❌ Erro ao criar usuário padrão:", error)
      return {
        success: false,
        message: "Erro ao criar usuário padrão: " + error.message,
      }
    }
  }

  /**
   * Validar token de sessão (simulado - em produção usar JWT)
   */
  static async validarSessao(token: string): Promise<{ success: boolean; usuario?: UsuarioAdmin }> {
    try {
      // Em produção, implementar validação JWT real
      // Por enquanto, usar uma validação simples baseada no email
      const email = Buffer.from(token, "base64").toString("utf-8")

      const { data: usuario, error } = await supabase
        .from("usuarios_admin")
        .select("id, nome, email, ativo, ultimo_login, created_at, updated_at")
        .eq("email", email)
        .eq("ativo", true)
        .single()

      if (error || !usuario) {
        return { success: false }
      }

      return {
        success: true,
        usuario,
      }
    } catch (error) {
      console.error("❌ Erro ao validar sessão:", error)
      return { success: false }
    }
  }

  /**
   * Gerar token de sessão (simulado - em produção usar JWT)
   */
  static gerarToken(email: string): string {
    // Em produção, usar JWT com expiração e assinatura
    return Buffer.from(email).toString("base64")
  }
}

// Exportar instância padrão
export const usuariosAdminService = UsuariosAdminService
