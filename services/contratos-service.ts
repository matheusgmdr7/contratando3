import { supabase } from "@/lib/supabase"

export interface Contrato {
  id: string
  numero_contrato: string
  nome_cliente: string
  cpf_cliente?: string
  email_cliente?: string
  telefone_cliente?: string
  plano: string
  plano_nome?: string
  operadora?: string
  tipo_plano?: string
  tipo_acomodacao?: string
  valor_mensal: number
  data_inicio: string
  data_fim?: string
  status: "ativo" | "pendente" | "cancelado" | "suspenso"
  documento_url?: string
  corretor_nome: string
  corretor_email?: string
  corretor_telefone?: string
  created_at: string
  updated_at?: string
  endereco_cliente?: string
  tipo: "digital" | "corretor"
}

export class ContratosService {
  static async listarContratos(): Promise<Contrato[]> {
    try {
      // Buscar propostas aprovadas da tabela propostas_corretores
      const { data: propostasCorretores, error: errorCorretores } = await supabase
        .from("propostas_corretores")
        .select("*, corretores(*)")
        .eq("status", "aprovada")
        .order("created_at", { ascending: false })

      // Buscar propostas aprovadas da tabela propostas
      const { data: propostasDigitais, error: errorDigitais } = await supabase
        .from("propostas")
        .select("*")
        .eq("status", "aprovada")
        .order("created_at", { ascending: false })

      if (errorCorretores) console.error("Erro ao buscar propostas de corretores:", errorCorretores)
      if (errorDigitais) console.error("Erro ao buscar propostas digitais:", errorDigitais)

      // Formatar dados das propostas de corretores para o formato de contratos
      const contratosCorretores = (propostasCorretores || []).map((proposta) => ({
        id: proposta.id,
        numero_contrato: `PC-${proposta.id.substring(0, 8)}`,
        nome_cliente: proposta.cliente,
        cpf_cliente: proposta.cpf_cliente,
        email_cliente: proposta.email_cliente,
        telefone_cliente: proposta.whatsapp_cliente,
        plano: proposta.produto || "Não especificado",
        plano_nome: proposta.plano_nome || proposta.produto,
        operadora: proposta.operadora,
        valor_mensal: proposta.valor || 0,
        data_inicio: proposta.data || proposta.created_at,
        status: "ativo",
        documento_url: proposta.documentos_propostas_corretores?.[0]?.url,
        corretor_nome: proposta.corretores?.nome || "Não especificado",
        corretor_email: proposta.corretores?.email,
        corretor_telefone: proposta.corretores?.telefone,
        created_at: proposta.created_at,
        updated_at: proposta.updated_at,
        tipo: "corretor",
      }))

      // Formatar dados das propostas digitais para o formato de contratos
      const contratosDigitais = (propostasDigitais || []).map((proposta) => ({
        id: proposta.id,
        numero_contrato: `PD-${proposta.id.substring(0, 8)}`,
        nome_cliente: proposta.nome_cliente,
        cpf_cliente: proposta.cpf,
        email_cliente: proposta.email,
        telefone_cliente: proposta.telefone,
        plano: proposta.sigla_plano || "Não especificado",
        plano_nome: proposta.sigla_plano,
        operadora: "Não especificado",
        tipo_plano: proposta.tipo_cobertura,
        tipo_acomodacao: proposta.tipo_acomodacao,
        valor_mensal: Number.parseFloat(proposta.valor) || 0,
        data_inicio: proposta.created_at,
        status: "ativo",
        documento_url: proposta.pdf_url,
        corretor_nome: proposta.corretor_nome || "Direto",
        created_at: proposta.created_at,
        updated_at: proposta.created_at,
        endereco_cliente: `${proposta.endereco}, ${proposta.bairro}, ${proposta.cidade}/${proposta.estado}, CEP: ${proposta.cep}`,
        tipo: "digital",
      }))

      // Combinar os dois tipos de contratos
      return [...contratosCorretores, ...contratosDigitais] as Contrato[]
    } catch (error) {
      console.error("Erro ao listar contratos:", error)
      throw error
    }
  }

  static async obterContrato(id: string, tipo: "digital" | "corretor"): Promise<Contrato> {
    try {
      if (tipo === "corretor") {
        // Buscar proposta de corretor
        const { data, error } = await supabase
          .from("propostas_corretores")
          .select("*, corretores(*), documentos_propostas_corretores(*)")
          .eq("id", id)
          .eq("status", "aprovada")
          .single()

        if (error) throw error

        if (!data) {
          throw new Error("Contrato não encontrado ou não está aprovado.")
        }

        // Formatar dados para o formato de contrato
        return {
          id: data.id,
          numero_contrato: `PC-${data.id.substring(0, 8)}`,
          nome_cliente: data.cliente,
          cpf_cliente: data.cpf_cliente || "Não informado",
          email_cliente: data.email_cliente || "Não informado",
          telefone_cliente: data.whatsapp_cliente || "Não informado",
          plano: data.produto || "Não especificado",
          plano_nome: data.plano_nome || data.produto,
          operadora: data.operadora || "Não especificado",
          valor_mensal: data.valor || 0,
          data_inicio: data.data || data.created_at,
          status: "ativo",
          documento_url: data.documentos_propostas_corretores?.[0]?.url || null,
          corretor_nome: data.corretores?.nome || "Não especificado",
          corretor_email: data.corretores?.email || "Não informado",
          corretor_telefone: data.corretores?.telefone || "Não informado",
          created_at: data.created_at,
          updated_at: data.updated_at,
          tipo: "corretor",
        }
      } else {
        // Buscar proposta digital
        const { data, error } = await supabase
          .from("propostas")
          .select("*")
          .eq("id", id)
          .eq("status", "aprovada")
          .single()

        if (error) throw error

        if (!data) {
          throw new Error("Contrato não encontrado ou não está aprovado.")
        }

        // Formatar dados para o formato de contrato
        return {
          id: data.id,
          numero_contrato: `PD-${data.id.substring(0, 8)}`,
          nome_cliente: data.nome_cliente,
          cpf_cliente: data.cpf,
          email_cliente: data.email,
          telefone_cliente: data.telefone,
          plano: data.sigla_plano || "Não especificado",
          plano_nome: data.sigla_plano,
          operadora: "Não especificado",
          tipo_plano: data.tipo_cobertura,
          tipo_acomodacao: data.tipo_acomodacao,
          valor_mensal: Number.parseFloat(data.valor) || 0,
          data_inicio: data.created_at,
          status: "ativo",
          documento_url: data.pdf_url || null,
          corretor_nome: data.corretor_nome || "Direto",
          created_at: data.created_at,
          updated_at: data.created_at,
          endereco_cliente: `${data.endereco}, ${data.bairro}, ${data.cidade}/${data.estado}, CEP: ${data.cep}`,
          tipo: "digital",
        }
      }
    } catch (error) {
      console.error(`Erro ao obter contrato ${id}:`, error)
      throw error
    }
  }

  static async atualizarStatusContrato(id: string, tipo: "digital" | "corretor", status: string): Promise<boolean> {
    try {
      const tabela = tipo === "corretor" ? "propostas_corretores" : "propostas"

      const { error } = await supabase.from(tabela).update({ status }).eq("id", id)

      if (error) throw error

      return true
    } catch (error) {
      console.error(`Erro ao atualizar status do contrato ${id}:`, error)
      throw error
    }
  }
}
