import { supabase } from "@/lib/supabase"

export interface Lead {
  id: number
  nome: string
  email: string
  whatsapp: string
  plano_id: string
  plano_nome: string
  plano_operadora: string
  faixa_etaria: string
  estado: string
  data_registro: string
  status: string
  observacoes?: string
}

export async function criarLead(dados: Omit<Lead, "id" | "data_registro">) {
  const { data, error } = await supabase.from("leads").insert([dados]).select().single()

  if (error) {
    throw new Error(`Erro ao criar lead: ${error.message}`)
  }

  return data
}

export async function buscarLeads() {
  const { data, error } = await supabase.from("leads").select("*").order("data_registro", { ascending: false })

  if (error) {
    throw new Error(`Erro ao buscar leads: ${error.message}`)
  }

  return data
}

export async function atualizarLead(id: string, dados: Partial<Lead>) {
  const { data, error } = await supabase.from("leads").update(dados).eq("id", id).select().single()

  if (error) {
    throw new Error(`Erro ao atualizar lead: ${error.message}`)
  }

  return data
}

export async function deletarLead(id: string) {
  const { error } = await supabase.from("leads").delete().eq("id", id)

  if (error) {
    throw new Error(`Erro ao deletar lead: ${error.message}`)
  }
}
