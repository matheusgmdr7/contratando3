import { supabase } from "@/lib/supabase"
import type { PropostaCorretor } from "@/types/corretores"

export type ProdutoPorCategoria = {
  categoria: string
  total: number
}

export type ComissaoPorMes = {
  mes: string
  valor: number
}

export type EstatisticasCorretor = {
  totalPropostas: number
  propostasAprovadas: number
  propostasEmAnalise: number
  propostasRecusadas: number
  comissaoTotal: number
  comissaoMes: number
  ultimasPropostas: PropostaCorretor[]
  produtosPorCategoria: ProdutoPorCategoria[]
  comissoesPorMes: ComissaoPorMes[]
}

export async function buscarEstatisticasCorretor(corretorId: string): Promise<EstatisticasCorretor> {
  try {
    if (!corretorId) {
      throw new Error("ID do corretor não fornecido")
    }

    console.log("Buscando estatísticas para o corretor:", corretorId)

    // Primeiro, verificar se o corretor existe na tabela "corretores"
    const { data: corretor, error: corretorError } = await supabase
      .from("corretores")
      .select("*")
      .eq("id", corretorId)
      .single()

    if (corretorError) {
      console.error("Erro ao buscar corretor:", corretorError)
      throw new Error(`Erro ao buscar corretor: ${corretorError.message}`)
    }

    if (!corretor) {
      throw new Error("Corretor não encontrado")
    }

    console.log("Corretor encontrado:", corretor.nome)

    // Buscar todas as propostas do corretor
    const { data: propostas, error: propostasError } = await supabase
      .from("propostas_corretores")
      .select("*")
      .eq("corretor_id", corretorId)
      .order("created_at", { ascending: false })

    if (propostasError) {
      console.error("Erro ao buscar propostas do corretor:", propostasError)
      throw new Error(`Erro ao buscar propostas do corretor: ${propostasError.message}`)
    }

    console.log(`Encontradas ${propostas?.length || 0} propostas para o corretor`)

    // Buscar comissões do corretor
    const { data: comissoes, error: comissoesError } = await supabase
      .from("comissoes")
      .select("*")
      .eq("corretor_id", corretorId)
      .order("created_at", { ascending: false })

    if (comissoesError) {
      console.error("Erro ao buscar comissões do corretor:", comissoesError)
      throw new Error(`Erro ao buscar comissões do corretor: ${comissoesError.message}`)
    }

    console.log(`Encontradas ${comissoes?.length || 0} comissões para o corretor`)

    // Se temos propostas e precisamos de informações de produtos, buscar produtos separadamente
    let propostasComProdutos = [...(propostas || [])]

    if (propostas && propostas.length > 0) {
      // Extrair IDs de produtos únicos
      const produtoIds = [...new Set(propostas.map((p) => p.produto_id).filter(Boolean))]

      if (produtoIds.length > 0) {
        console.log("Buscando produtos com IDs:", produtoIds)

        // Buscar produtos relacionados
        const { data: produtos, error: produtosError } = await supabase
          .from("produtos_corretores")
          .select("*")
          .in("id", produtoIds)

        if (produtosError) {
          console.error("Erro ao buscar produtos:", produtosError)
          // Não vamos lançar erro aqui, apenas logar, para não interromper o fluxo
        } else {
          console.log(`Encontrados ${produtos?.length || 0} produtos relacionados`)
        }

        // Se temos produtos, adicionar à lista de propostas
        if (produtos && produtos.length > 0) {
          propostasComProdutos = propostas.map((proposta) => {
            const produtoRelacionado = produtos.find((p) => p.id === proposta.produto_id)
            return {
              ...proposta,
              produto: produtoRelacionado || undefined,
            }
          })
        }
      }
    }

    // Calcular estatísticas
    const propostasAprovadas = propostas?.filter((p) => p.status === "aprovada").length || 0
    const propostasEmAnalise = propostas?.filter((p) => p.status === "em_analise").length || 0
    const propostasRecusadas = propostas?.filter((p) => p.status === "recusada").length || 0

    // Calcular comissão total
    const comissaoTotal = comissoes?.reduce((total, comissao) => total + (comissao.valor || 0), 0) || 0

    // Calcular comissão do mês atual
    const dataAtual = new Date()
    const primeiroDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1)
    const comissaoMes =
      comissoes
        ?.filter((comissao) => {
          const dataComissao = new Date(comissao.created_at)
          return dataComissao >= primeiroDiaMes
        })
        .reduce((total, comissao) => total + (comissao.valor || 0), 0) || 0

    // Calcular produtos por categoria
    const produtosPorCategoria: ProdutoPorCategoria[] = []
    if (propostasComProdutos && propostasComProdutos.length > 0) {
      const categorias: Record<string, number> = {}

      propostasComProdutos.forEach((proposta) => {
        if (proposta.produto && proposta.produto.categoria) {
          const categoria = proposta.produto.categoria
          categorias[categoria] = (categorias[categoria] || 0) + 1
        }
      })

      Object.entries(categorias).forEach(([categoria, total]) => {
        produtosPorCategoria.push({ categoria, total })
      })
    }

    // Calcular comissões por mês
    const comissoesPorMes: ComissaoPorMes[] = []
    if (comissoes && comissoes.length > 0) {
      const meses: Record<string, number> = {}

      // Inicializar os últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const data = new Date()
        data.setMonth(dataAtual.getMonth() - i)
        const nomeMes = data.toLocaleString("default", { month: "short" })
        const chave = `${data.getFullYear()}-${nomeMes}`
        meses[chave] = 0
      }

      comissoes.forEach((comissao) => {
        const dataComissao = new Date(comissao.created_at)
        // Verificar se a comissão está nos últimos 6 meses
        if (dataComissao >= new Date(dataAtual.getFullYear(), dataAtual.getMonth() - 5, 1)) {
          const nomeMes = dataComissao.toLocaleString("default", { month: "short" })
          const chave = `${dataComissao.getFullYear()}-${nomeMes}`
          meses[chave] = (meses[chave] || 0) + (comissao.valor || 0)
        }
      })

      Object.entries(meses).forEach(([chave, valor]) => {
        const mes = chave.split("-")[1]
        comissoesPorMes.push({ mes, valor })
      })
    }

    // Pegar as últimas 5 propostas
    const ultimasPropostas = propostasComProdutos.slice(0, 5) as PropostaCorretor[]

    return {
      totalPropostas: propostas?.length || 0,
      propostasAprovadas,
      propostasEmAnalise,
      propostasRecusadas,
      comissaoTotal,
      comissaoMes,
      ultimasPropostas,
      produtosPorCategoria,
      comissoesPorMes,
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas do corretor:", error)
    throw error
  }
}
