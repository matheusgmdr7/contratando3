import { supabase } from "@/lib/supabase"
import type { Corretor } from "@/types/corretores"

export async function buscarCorretores(): Promise<Corretor[]> {
  try {
    const { data, error } = await supabase.from("corretores").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar corretores:", error)
      throw new Error(`Erro ao buscar corretores: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Erro ao buscar corretores:", error)
    throw error
  }
}

export async function buscarTodosCorretores(): Promise<Corretor[]> {
  try {
    const { data, error } = await supabase.from("corretores").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar corretores:", error)
      throw new Error(`Erro ao buscar corretores: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Erro ao buscar corretores:", error)
    throw error
  }
}

export async function buscarCorretorPorEmail(email: string): Promise<Corretor | null> {
  try {
    const { data, error } = await supabase.from("corretores").select("*").eq("email", email).single()

    if (error) {
      if (error.code === "PGRST116") {
        // Corretor não encontrado
        return null
      }
      console.error("Erro ao buscar corretor por email:", error)
      throw new Error(`Erro ao buscar corretor por email: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Erro ao buscar corretor por email:", error)
    throw error
  }
}

export async function criarCorretor(corretor: Omit<Corretor, "id" | "created_at">): Promise<Corretor> {
  try {
    console.log("Criando corretor com dados:", JSON.stringify(corretor, null, 2))

    // Primeiro, verificar se o corretor já existe
    const corretorExistente = await buscarCorretorPorEmail(corretor.email)
    if (corretorExistente) {
      console.log("Corretor já existe, retornando dados existentes")
      return corretorExistente
    }

    // Criar registro na tabela corretores
    const { data, error } = await supabase
      .from("corretores")
      .insert([
        {
          nome: corretor.nome,
          email: corretor.email,
          whatsapp: corretor.whatsapp,
          estado: corretor.estado,
          // Não incluímos o campo cidade aqui
          status: corretor.status || "pendente",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar corretor:", error)
      throw new Error(`Erro ao criar corretor: ${error.message}`)
    }

    if (!data) {
      throw new Error("Erro ao criar corretor: Dados não retornados")
    }

    console.log("Corretor criado com sucesso:", data)
    return data
  } catch (error) {
    console.error("Erro ao criar corretor:", error)
    throw error
  }
}

export async function atualizarCorretor(id: string, corretor: Partial<Corretor>): Promise<Corretor> {
  try {
    const { data, error } = await supabase.from("corretores").update(corretor).eq("id", id).select().single()

    if (error) {
      console.error("Erro ao atualizar corretor:", error)
      throw new Error(`Erro ao atualizar corretor: ${error.message}`)
    }

    if (!data) {
      throw new Error("Erro ao atualizar corretor: Dados não retornados")
    }

    return data
  } catch (error) {
    console.error("Erro ao atualizar corretor:", error)
    throw error
  }
}

export async function deletarCorretor(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("corretores").delete().eq("id", id)

    if (error) {
      console.error("Erro ao deletar corretor:", error)
      throw new Error(`Erro ao deletar corretor: ${error.message}`)
    }
  } catch (error) {
    console.error("Erro ao deletar corretor:", error)
    throw error
  }
}

export async function verificarStatusCorretor(email: string): Promise<string> {
  try {
    const corretor = await buscarCorretorPorEmail(email)

    if (!corretor) {
      throw new Error("Corretor não encontrado")
    }

    return corretor.status || "pendente"
  } catch (error) {
    console.error("Erro ao verificar status do corretor:", error)
    throw error
  }
}
