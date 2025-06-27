import type { Metadata } from "next"
import PropostaWizard from "@/components/proposta-digital/proposta-wizard"
import { supabase } from "@/lib/supabase"

export const metadata: Metadata = {
  title: "Proposta Digital | Contratando Planos",
  description: "Preencha sua proposta digital para contratação de plano de saúde",
}

export default async function PropostaDigitalPage() {
  try {
    console.log("Carregando página de proposta digital")

    // Buscar modelos de propostas diretamente da tabela modelos_propostas
    const { data: templates, error } = await supabase
      .from("modelos_propostas")
      .select("*")
      .eq("ativo", true)
      .order("titulo", { ascending: true })

    if (error) {
      console.error("Erro ao buscar modelos de propostas:", error)
      throw error
    }

    if (!templates || templates.length === 0) {
      return (
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold text-center mb-8">Proposta Digital</h1>
          <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Nenhum modelo disponível</h2>
            <p className="text-gray-600 mb-6">
              No momento não há modelos de propostas disponíveis. Por favor, tente novamente mais tarde ou entre em
              contato com o suporte.
            </p>
            <a
              href="/"
              className="px-4 py-2 bg-[#168979] text-white rounded-md hover:bg-[#13786a] transition-colors inline-block"
            >
              Voltar para a página inicial
            </a>
          </div>
        </div>
      )
    }

    console.log(`${templates.length} modelos de propostas encontrados`)

    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Proposta Digital</h1>
        <p className="text-center text-gray-600 mb-8">
          Preencha o formulário abaixo para enviar sua proposta de contratação de plano de saúde.
        </p>

        <PropostaWizard templates={templates} />

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Ao enviar esta proposta, você concorda com os{" "}
            <a href="/termos" className="text-blue-600 hover:underline">
              Termos de Uso
            </a>{" "}
            e{" "}
            <a href="/privacidade" className="text-blue-600 hover:underline">
              Política de Privacidade
            </a>
            .
          </p>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Erro ao carregar a página:", error)
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Proposta Digital</h1>
        <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Erro ao carregar modelos</h2>
          <p className="text-gray-600 mb-6">
            Ocorreu um erro ao carregar os modelos de propostas. Por favor, tente novamente mais tarde ou entre em
            contato com o suporte.
          </p>
          <a
            href="/"
            className="px-4 py-2 bg-[#168979] text-white rounded-md hover:bg-[#13786a] transition-colors inline-block"
          >
            Voltar para a página inicial
          </a>
        </div>
      </div>
    )
  }
}
