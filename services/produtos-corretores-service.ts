import { supabase } from "@/lib/supabase"

// Modificar a função buscarProdutosCorretoresAtivos para usar a consulta mais simples e direta
export async function obterProdutosCorretores() {
  try {
    // Simplificar a consulta para garantir que estamos obtendo os produtos
    const { data, error } = await supabase.from("produtos_corretores").select("*").order("nome", { ascending: true })

    if (error) {
      console.error("Erro ao buscar produtos corretores:", error)
      throw error
    }

    console.log("Produtos encontrados:", data)

    // Retornar todos os produtos, independente do status
    return data || []
  } catch (error) {
    console.error("Erro ao buscar produtos corretores:", error)
    throw error
  }
}

export async function obterValorProdutoPorIdade(produtoId: string, idade: number) {
  try {
    console.log(`🔍 Buscando valor para produto ${produtoId}, idade ${idade}`)
    
    // Primeiro, buscar as tabelas associadas ao produto
    const { data: relacoes, error: relacoesError } = await supabase
      .from("produto_tabela_relacao")
      .select("tabela_id, segmentacao, descricao")
      .eq("produto_id", produtoId)

    if (relacoesError) {
      console.error(`❌ Erro ao buscar relações para o produto ${produtoId}:`, relacoesError)
      throw relacoesError
    }

    if (!relacoes || relacoes.length === 0) {
      console.warn(`⚠️ Nenhuma tabela encontrada para o produto ${produtoId}`)
      return 0
    }

    console.log(`📊 Encontradas ${relacoes.length} tabelas para o produto:`, relacoes)

    // Usar a primeira tabela encontrada (poderia ser melhorado para selecionar a tabela mais adequada)
    const tabelaId = relacoes[0].tabela_id
    console.log(`📋 Usando tabela ID: ${tabelaId}`)

    // Buscar as faixas etárias da tabela
    const { data: faixas, error: faixasError } = await supabase
      .from("tabelas_precos_faixas")
      .select("faixa_etaria, valor")
      .eq("tabela_id", tabelaId)
      .order("faixa_etaria", { ascending: true })

    if (faixasError) {
      console.error(`❌ Erro ao buscar faixas etárias para a tabela ${tabelaId}:`, faixasError)
      throw faixasError
    }

    if (!faixas || faixas.length === 0) {
      console.warn(`⚠️ Nenhuma faixa etária encontrada para a tabela ${tabelaId}`)
      return 0
    }

    console.log(`🎯 Faixas etárias encontradas:`, faixas)

    // Encontrar a faixa etária correspondente
    let valorEncontrado = 0
    let faixaEncontrada = null

    for (const faixa of faixas) {
      console.log(`🔍 Verificando faixa: ${faixa.faixa_etaria} (valor: ${faixa.valor})`)
      
      // Verificar se é uma faixa com formato "min-max"
      if (faixa.faixa_etaria.includes("-")) {
        const [minStr, maxStr] = faixa.faixa_etaria.split("-")
        const min = parseInt(minStr.trim(), 10)
        const max = parseInt(maxStr.trim(), 10)

        console.log(`   📊 Faixa ${min}-${max}, idade ${idade}`)
        
        if (!isNaN(min) && !isNaN(max) && idade >= min && idade <= max) {
          valorEncontrado = parseFloat(faixa.valor) || 0
          faixaEncontrada = faixa.faixa_etaria
          console.log(`✅ Faixa encontrada: ${faixaEncontrada}, valor: ${valorEncontrado}`)
          break
        }
      }
      // Verificar se é uma faixa com formato "min+" (idade mínima)
      else if (faixa.faixa_etaria.endsWith("+")) {
        const minStr = faixa.faixa_etaria.replace("+", "").trim()
        const min = parseInt(minStr, 10)
        
        console.log(`   📊 Faixa ${min}+, idade ${idade}`)
        
        if (!isNaN(min) && idade >= min) {
          valorEncontrado = parseFloat(faixa.valor) || 0
          faixaEncontrada = faixa.faixa_etaria
          console.log(`✅ Faixa encontrada: ${faixaEncontrada}, valor: ${valorEncontrado}`)
          break
        }
      }
      // Verificar se é uma idade específica
      else {
        const idadeExata = parseInt(faixa.faixa_etaria.trim(), 10)
        
        console.log(`   📊 Idade exata ${idadeExata}, idade ${idade}`)
        
        if (!isNaN(idadeExata) && idade === idadeExata) {
          valorEncontrado = parseFloat(faixa.valor) || 0
          faixaEncontrada = faixa.faixa_etaria
          console.log(`✅ Idade exata encontrada: ${faixaEncontrada}, valor: ${valorEncontrado}`)
          break
        }
      }
    }

    if (valorEncontrado > 0) {
      console.log(`🎉 Valor calculado com sucesso: R$ ${valorEncontrado} para faixa ${faixaEncontrada}`)
    } else {
      console.warn(`⚠️ Nenhum valor encontrado para idade ${idade}`)
    }

    return valorEncontrado
  } catch (error) {
    console.error("❌ Erro ao obter valor do produto por idade:", error)
    return 0 // Retorna 0 em caso de erro ao invés de throw
  }
}

export async function obterProdutoCorretor(produtoId: string) {
  try {
    const { data, error } = await supabase.from("produtos_corretores").select("*").eq("id", produtoId).single()

    if (error) {
      console.error("Erro ao buscar produto corretor:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Erro ao obter produto corretor:", error)
    throw error
  }
}

// Adicionar as funções que estão faltando
export async function criarProdutoCorretor(produto: any) {
  try {
    const { data, error } = await supabase.from("produtos_corretores").insert([produto]).select().single()

    if (error) {
      console.error("Erro ao criar produto corretor:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Erro ao criar produto corretor:", error)
    throw error
  }
}

export async function atualizarStatusProdutoCorretor(id: string | number, disponivel: boolean) {
  try {
    const { data, error } = await supabase
      .from("produtos_corretores")
      .update({ disponivel })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Erro ao atualizar status do produto corretor:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Erro ao atualizar status do produto corretor:", error)
    throw error
  }
}

export async function excluirProdutoCorretor(id: string | number) {
  try {
    const { error } = await supabase.from("produtos_corretores").delete().eq("id", id)

    if (error) {
      console.error("Erro ao excluir produto corretor:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Erro ao excluir produto corretor:", error)
    throw error
  }
}

export async function atualizarProdutoCorretor(id: string | number, produto: any) {
  try {
    const { data, error } = await supabase.from("produtos_corretores").update(produto).eq("id", id).select().single()

    if (error) {
      console.error("Erro ao atualizar produto corretor:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Erro ao atualizar produto corretor:", error)
    throw error
  }
}
