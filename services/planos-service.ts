import { supabase } from "@/lib/supabase"
import type { Plano } from "@/types/planos"

export async function buscarPlanos(): Promise<Plano[]> {
  try {
    console.log("Iniciando busca de planos...")

    const { data: planosData, error: planosError } = await supabase
      .from("planos")
      .select("*")
      .order("created_at", { ascending: false })

    if (planosError) {
      console.error("Erro do Supabase ao buscar planos:", {
        message: planosError.message,
        details: planosError.details,
        hint: planosError.hint,
        code: planosError.code,
      })
      throw new Error(`Erro ao buscar planos: ${planosError.message}`)
    }

    if (!planosData) {
      console.log("Nenhum plano encontrado")
      return []
    }

    // Buscar preços para cada plano
    const planosComPrecos = await Promise.all(
      planosData.map(async (plano) => {
        const { data: precosData, error: precosError } = await supabase
          .from("precos_planos")
          .select("*")
          .eq("plano_id", plano.id)

        if (precosError) {
          console.error(`Erro ao buscar preços do plano ${plano.id}:`, precosError)
          return plano
        }

        return {
          ...plano,
          precos: precosData || [],
        }
      }),
    )

    console.log(`Encontrados ${planosComPrecos.length} planos`)
    return planosComPrecos
  } catch (error) {
    console.error("Erro ao buscar planos:", error instanceof Error ? error.message : "Erro desconhecido")
    throw error
  }
}

export async function buscarPlanosPorId(id: string): Promise<Plano | null> {
  try {
    console.log(`Buscando plano com ID: ${id}`)

    const { data: planoData, error: planoError } = await supabase.from("planos").select("*").eq("id", id).single()

    if (planoError) {
      console.error("Erro do Supabase ao buscar plano por ID:", {
        message: planoError.message,
        details: planoError.details,
        hint: planoError.hint,
        code: planoError.code,
      })
      throw new Error(`Erro ao buscar plano: ${planoError.message}`)
    }

    if (!planoData) {
      console.log("Plano não encontrado")
      return null
    }

    // Buscar preços do plano
    const { data: precosData, error: precosError } = await supabase.from("precos_planos").select("*").eq("plano_id", id)

    if (precosError) {
      console.error(`Erro ao buscar preços do plano ${id}:`, precosError)
      return planoData
    }

    return {
      ...planoData,
      precos: precosData || [],
    }
  } catch (error) {
    console.error("Erro ao buscar plano por ID:", error instanceof Error ? error.message : "Erro desconhecido")
    throw error
  }
}

export async function criarPlano(plano: Omit<Plano, "id" | "created_at">): Promise<Plano> {
  try {
    console.log("Iniciando criação de plano:", plano)

    // Extrair preços do plano
    const { precos, ...planoData } = plano

    // Criar o plano
    const { data: planoCriado, error: planoError } = await supabase.from("planos").insert([planoData]).select().single()

    if (planoError) {
      console.error("Erro do Supabase ao criar plano:", {
        message: planoError.message,
        details: planoError.details,
        hint: planoError.hint,
        code: planoError.code,
      })
      throw new Error(`Erro ao criar plano: ${planoError.message}`)
    }

    if (!planoCriado) {
      throw new Error("Erro ao criar plano: Dados não retornados")
    }

    // Criar os preços do plano
    if (precos && precos.length > 0) {
      const precosParaInserir = precos.map((preco) => ({
        plano_id: planoCriado.id,
        faixa_etaria: preco.faixa_etaria,
        preco: preco.preco,
      }))

      const { error: precosError } = await supabase.from("precos_planos").insert(precosParaInserir)

      if (precosError) {
        console.error("Erro ao criar preços do plano:", precosError)
        // Não vamos lançar erro aqui, apenas logar
      }
    }

    return {
      ...planoCriado,
      precos: precos || [],
    }
  } catch (error) {
    console.error("Erro ao criar plano:", error instanceof Error ? error.message : "Erro desconhecido")
    throw error
  }
}

export async function atualizarPlano(id: string, plano: Partial<Plano>): Promise<Plano> {
  try {
    console.log(`Atualizando plano com ID: ${id}`, plano)

    // Extrair preços do plano
    const { precos, ...planoData } = plano

    // Primeiro, verificar se o plano existe
    const { data: planoExistente, error: checkError } = await supabase
      .from("planos")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (checkError) {
      console.error("Erro ao verificar plano:", checkError)
      throw new Error(`Erro ao verificar plano: ${checkError.message}`)
    }

    if (!planoExistente) {
      throw new Error("Plano não encontrado")
    }

    // Atualizar o plano
    const { error: planoError } = await supabase.from("planos").update(planoData).eq("id", id)

    if (planoError) {
      console.error("Erro do Supabase ao atualizar plano:", {
        message: planoError.message,
        details: planoError.details,
        hint: planoError.hint,
        code: planoError.code,
      })
      throw new Error(`Erro ao atualizar plano: ${planoError.message}`)
    }

    // Buscar o plano atualizado
    const { data: planoAtualizado, error: fetchError } = await supabase.from("planos").select("*").eq("id", id).single()

    if (fetchError) {
      console.error("Erro ao buscar plano atualizado:", fetchError)
      throw new Error(`Erro ao buscar plano atualizado: ${fetchError.message}`)
    }

    if (!planoAtualizado) {
      throw new Error("Erro ao atualizar plano: Dados não retornados")
    }

    // Atualizar os preços do plano
    if (precos && precos.length > 0) {
      // Primeiro, deletar os preços existentes
      const { error: deleteError } = await supabase.from("precos_planos").delete().eq("plano_id", id)

      if (deleteError) {
        console.error("Erro ao deletar preços existentes:", deleteError)
      }

      // Depois, inserir os novos preços
      const precosParaInserir = precos.map((preco) => ({
        plano_id: id,
        faixa_etaria: preco.faixa_etaria,
        preco: Number(preco.preco), // Garantir que o preço seja um número
      }))

      console.log("Tentando inserir preços:", precosParaInserir)

      const { data: precosInseridos, error: insertError } = await supabase
        .from("precos_planos")
        .insert(precosParaInserir)
        .select()

      if (insertError) {
        console.error("Erro ao inserir novos preços:", {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
        })
        throw new Error(`Erro ao inserir novos preços: ${insertError.message}`)
      }

      console.log("Preços inseridos com sucesso:", precosInseridos)
    }

    // Buscar os preços atualizados
    const { data: precosAtualizados, error: precosError } = await supabase
      .from("precos_planos")
      .select("faixa_etaria, preco")
      .eq("plano_id", id)

    if (precosError) {
      console.error("Erro ao buscar preços atualizados:", precosError)
      return {
        ...planoAtualizado,
        precos: precos || [],
      }
    }

    return {
      ...planoAtualizado,
      precos: precosAtualizados || [],
    }
  } catch (error) {
    console.error("Erro ao atualizar plano:", error instanceof Error ? error.message : "Erro desconhecido")
    throw error
  }
}

export async function deletarPlano(id: string): Promise<void> {
  try {
    console.log(`Deletando plano com ID: ${id}`)

    // Primeiro, deletar os preços do plano
    const { error: precosError } = await supabase.from("precos_planos").delete().eq("plano_id", id)

    if (precosError) {
      console.error("Erro ao deletar preços do plano:", precosError)
      // Não vamos lançar erro aqui, apenas logar
    }

    // Depois, deletar o plano
    const { error: planoError } = await supabase.from("planos").delete().eq("id", id)

    if (planoError) {
      console.error("Erro do Supabase ao deletar plano:", {
        message: planoError.message,
        details: planoError.details,
        hint: planoError.hint,
        code: planoError.code,
      })
      throw new Error(`Erro ao deletar plano: ${planoError.message}`)
    }
  } catch (error) {
    console.error("Erro ao deletar plano:", error instanceof Error ? error.message : "Erro desconhecido")
    throw error
  }
}

export async function buscarPlanosPorFaixaEtaria(faixaEtaria: string): Promise<Plano[]> {
  try {
    console.log(`Buscando planos para faixa etária: ${faixaEtaria}`)

    const { data: planosData, error: planosError } = await supabase
      .from("planos")
      .select(`
        *,
        precos_planos!inner (
          faixa_etaria,
          preco
        )
      `)
      .eq("precos_planos.faixa_etaria", faixaEtaria)

    if (planosError) {
      console.error("Erro do Supabase ao buscar planos por faixa etária:", {
        message: planosError.message,
        details: planosError.details,
        hint: planosError.hint,
        code: planosError.code,
      })
      throw new Error(`Erro ao buscar planos: ${planosError.message}`)
    }

    if (!planosData) {
      console.log("Nenhum plano encontrado")
      return []
    }

    // Transformar os dados para o formato esperado
    const planosFormatados = planosData.map((plano) => ({
      ...plano,
      precos: plano.precos_planos,
      preco: plano.precos_planos[0]?.preco || 0,
    }))

    console.log(`Encontrados ${planosFormatados.length} planos`)
    return planosFormatados
  } catch (error) {
    console.error(
      "Erro ao buscar planos por faixa etária:",
      error instanceof Error ? error.message : "Erro desconhecido",
    )
    throw error
  }
}
