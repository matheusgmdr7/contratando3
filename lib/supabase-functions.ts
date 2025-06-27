import { supabase } from "./supabase"
import type { Corretor } from "@/types/corretores"

export async function cadastrarCorretor(corretor: {
  nome: string
  email: string
  whatsapp: string
  estado: string
  cidade?: string
  status?: string
}): Promise<Corretor> {
  try {
    // Usando inserção direta na tabela em vez de RPC
    const { data, error } = await supabase
      .from("corretores")
      .insert([
        {
          nome: corretor.nome,
          email: corretor.email,
          whatsapp: corretor.whatsapp,
          estado: corretor.estado,
          cidade: corretor.cidade || null,
          status: corretor.status || "pendente",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Erro ao cadastrar corretor:", error)
      throw new Error(`Erro ao cadastrar corretor: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Erro ao cadastrar corretor:", error)
    throw error
  }
}
