"use client"

import { useState, useEffect } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Check, FileText } from "lucide-react"
import Step1SelectTemplate from "./steps/step1-select-template"
import Step2PlanInfo from "./steps/step2-plan-info"
import Step3Dependents from "./steps/step3-dependents"
import Step4Documents from "./steps/step4-documents"
import Step5HealthQuestionnaire from "./steps/step5-health-questionnaire"
import Step6PDFPreview from "./steps/step6-pdf-preview"
import Step7Signature from "./steps/step7-signature"
import Step8Confirmation from "./steps/step8-confirmation"
import { healthQuestions } from "@/data/health-questions"
import {
  criarPropostaDigital,
  salvarDependentes,
  salvarQuestionarioSaude,
  atualizarProposta,
  obterDependentes,
} from "@/services/propostas-digital-service"
import { validarCPF } from "@/utils/validacoes"
import { supabase } from "@/lib/supabase"
import { uploadDocumentos } from "@/services/upload-service"

// Schema for the entire form
const formSchema = z.object({
  // Step 1
  corretor_nome: z.string().min(3, "Nome do corretor é obrigatório"),
  corretor_id: z.string().optional(),
  template_id: z.string().min(1, "Selecione um modelo de proposta"),
  template_titulo: z.string().optional(),

  // Step 2
  cobertura: z.enum(["Nacional", "Estadual"]),
  acomodacao: z.enum(["Enfermaria", "Apartamento"]),
  sigla_plano: z.string().min(1, "Código do plano é obrigatório"),
  valor: z.string().min(1, "Valor é obrigatório"),
  valor_total: z.string().optional(),

  // Titular info
  nome: z.string().min(3, "Nome completo é obrigatório"),
  cpf: z
    .string()
    .min(11, "CPF inválido")
    .refine((cpf) => validarCPF(cpf), { message: "CPF inválido. Por favor, verifique e tente novamente." }),
  rg: z.string().min(5, "RG é obrigatório"),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  idade_titular: z.string().optional(),
  cns: z.string().optional(),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
  cep: z.string().min(8, "CEP inválido"),
  endereco: z.string().min(5, "Endereço é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório"),
  complemento: z.string().optional(),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  estado: z.string().min(2, "Estado é obrigatório"),

  // Campos adicionais do titular
  nome_mae: z.string().optional(),
  sexo: z.string().optional(),
  estado_civil: z.string().optional(),
  naturalidade: z.string().optional(),

  // Step 3
  tem_dependentes: z.boolean(),
  dependentes: z
    .array(
      z.object({
        nome: z.string().min(3, "Nome completo é obrigatório"),
        cpf: z
          .string()
          .min(11, "CPF inválido")
          .refine((cpf) => validarCPF(cpf), { message: "CPF inválido. Por favor, verifique e tente novamente." }),
        rg: z.string().min(5, "RG é obrigatório"),
        data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
        idade: z.string().optional(),
        cns: z.string().optional(),
        parentesco: z.string().min(1, "Parentesco é obrigatório"),
        nome_mae: z.string().optional(),
        peso: z.string().optional(),
        altura: z.string().optional(),
        valor_individual: z.string().optional(),
      }),
    )
    .optional(),

  // Step 4 - Documentos obrigatórios
  documentos: z.object({
    rg_frente: z.any().refine((file) => file instanceof File, "RG (frente) é obrigatório"),
    rg_verso: z.any().refine((file) => file instanceof File, "RG (verso) é obrigatório"),
    cpf: z.any().refine((file) => file instanceof File, "CPF é obrigatório"),
    comprovante_residencia: z.any().refine((file) => file instanceof File, "Comprovante de residência é obrigatório"),
    cns: z.any().optional(),
  }),

  // Step 5
  peso: z.string().min(1, "Peso é obrigatório"),
  altura: z.string().min(1, "Altura é obrigatória"),
  respostas_saude: z.array(
    z.object({
      pergunta_id: z.number(),
      pergunta: z.string(),
      resposta: z.enum(["Sim", "Não"]),
      observacao: z.string().optional(),
    }),
  ),

  // Step 7
  assinatura: z.string().min(1, "Assinatura é obrigatória"),
})

type FormValues = z.infer<typeof formSchema>

interface PropostaWizardProps {
  templates: any[]
  corretorPredefinido?: any
}

export default function PropostaWizard({ templates, corretorPredefinido }: PropostaWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreatingProposta, setIsCreatingProposta] = useState(false)
  const [propostaId, setPropostaId] = useState<string | null>(null)
  const router = useRouter()

  const totalSteps = 8

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      corretor_nome: corretorPredefinido?.nome || "",
      corretor_id: corretorPredefinido?.id || "",
      template_id: "",
      template_titulo: "",
      cobertura: "Nacional",
      acomodacao: "Enfermaria",
      sigla_plano: "",
      valor: "",
      valor_total: "0,00",
      nome: "",
      cpf: "",
      rg: "",
      data_nascimento: "",
      idade_titular: "",
      cns: "",
      email: "",
      telefone: "",
      cep: "",
      endereco: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      nome_mae: "",
      sexo: "",
      estado_civil: "",
      naturalidade: "",
      tem_dependentes: false,
      dependentes: [],
      documentos: {
        rg_frente: null,
        rg_verso: null,
        cpf: null,
        comprovante_residencia: null,
        cns: null,
      },
      peso: "",
      altura: "",
      respostas_saude: healthQuestions.map((q) => ({
        pergunta_id: q.id,
        pergunta: q.question,
        resposta: "Não" as "Sim" | "Não",
        observacao: "",
      })),
      assinatura: "",
    },
    mode: "onChange",
  })

  // Efeito para atualizar o título do template quando o template_id mudar
  useEffect(() => {
    const templateId = methods.getValues("template_id")
    if (templateId && templates) {
      const selectedTemplate = templates.find((t) => t.id === templateId)
      if (selectedTemplate) {
        methods.setValue("template_titulo", selectedTemplate.titulo)
        console.log(`Template selecionado: ${selectedTemplate.titulo} (ID: ${selectedTemplate.id})`)
      }
    }
  }, [methods.watch("template_id"), templates])

  // Efeito para calcular o valor total quando o valor do plano ou dependentes mudar
  useEffect(() => {
    const valorPlano = methods.getValues("valor")
    const dependentes = methods.getValues("dependentes") || []
    const temDependentes = methods.getValues("tem_dependentes")

    let total = 0

    // Adicionar valor do plano principal (titular)
    if (valorPlano) {
      const valorNumerico = Number.parseFloat(valorPlano.replace(/[^\d,]/g, "").replace(",", "."))
      if (!isNaN(valorNumerico)) {
        total += valorNumerico
      }
    }

    // Adicionar valores dos dependentes (somente se tem dependentes ativo)
    if (temDependentes && dependentes.length > 0) {
      dependentes.forEach((dep) => {
        if (dep.valor_individual) {
          const valorDep = Number.parseFloat(dep.valor_individual.replace(/[^\d,]/g, "").replace(",", "."))
          if (!isNaN(valorDep)) {
            total += valorDep
          }
        }
      })
    }

    // Formatar e atualizar o valor total
    const valorTotalFormatado = total.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    methods.setValue("valor_total", valorTotalFormatado)
  }, [methods.watch("valor"), methods.watch("dependentes"), methods.watch("tem_dependentes")])

  // Função para criar a proposta antes de visualizar
  const criarPropostaParaPreview = async () => {
    try {
      setIsCreatingProposta(true)

      const data = methods.getValues()
      console.log("🔍 Criando proposta para preview com dados:", data)

      // Debug específico para dependentes
      console.log("🔍 Debug dependentes no formulário:", {
        tem_dependentes: data.tem_dependentes,
        dependentes_count: data.dependentes?.length || 0,
        dependentes_data: data.dependentes,
      })

      // Validação adicional de CPF
      if (!validarCPF(data.cpf)) {
        console.error("❌ CPF inválido:", data.cpf)
        toast.error("CPF inválido. Por favor, verifique e tente novamente.")
        return null
      }

      // Criar proposta usando o serviço
      const novaProposta = await criarPropostaDigital({
        corretor_nome: data.corretor_nome,
        corretor_id: data.corretor_id,
        template_id: data.template_id,
        template_titulo: data.template_titulo,
        nome: data.nome,
        cpf: data.cpf,
        rg: data.rg,
        data_nascimento: data.data_nascimento,
        idade_titular: data.idade_titular,
        cns: data.cns,
        email: data.email,
        telefone: data.telefone,
        endereco: data.endereco,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        cobertura: data.cobertura,
        acomodacao: data.acomodacao,
        sigla_plano: data.sigla_plano,
        valor: data.valor,
        valor_total: data.valor_total,
        tem_dependentes: data.tem_dependentes,
        peso: data.peso,
        altura: data.altura,
        nome_mae: data.nome_mae,
        sexo: data.sexo,
        estado_civil: data.estado_civil,
        naturalidade: data.naturalidade,
        status: "rascunho",
      })

      console.log("✅ Proposta criada com sucesso para preview:", novaProposta)
      setPropostaId(novaProposta.id)

      // Salvar dependentes - com debug detalhado
      if (data.tem_dependentes && data.dependentes && data.dependentes.length > 0) {
        console.log("📝 Salvando dependentes...")
        console.log("📝 Dados dos dependentes a serem salvos:", data.dependentes)

        try {
          const dependentesSalvos = await salvarDependentes(novaProposta.id, data.dependentes)
          console.log("✅ Dependentes salvos com sucesso:", dependentesSalvos)

          // Verificar se foram realmente salvos no banco
          const dependentesVerificacao = await obterDependentes(novaProposta.id)
          console.log("🔍 Verificação - dependentes no banco:", dependentesVerificacao)
        } catch (depError) {
          console.error("❌ Erro ao salvar dependentes:", depError)
          toast.error("Erro ao salvar dependentes. Verifique os dados e tente novamente.")
        }
      } else {
        console.log("ℹ️ Nenhum dependente para salvar:", {
          tem_dependentes: data.tem_dependentes,
          dependentes_length: data.dependentes?.length || 0,
        })
      }

      // Salvar questionário de saúde
      console.log("📋 Salvando questionário de saúde...")
      await salvarQuestionarioSaude(novaProposta.id, data.respostas_saude)

      // Salvar documentos
      console.log("📄 Salvando documentos...")
      try {
        const documentosUrls = await uploadDocumentos(novaProposta.id, data.documentos)
        console.log("✅ Documentos salvos:", documentosUrls)

        // Atualizar a proposta com as URLs dos documentos
        await atualizarProposta(novaProposta.id, { documentos_urls: documentosUrls })
      } catch (docError) {
        console.error("⚠️ Erro ao salvar documentos, continuando com o processo:", docError)
      }

      return novaProposta.id
    } catch (error) {
      console.error("❌ Erro ao criar proposta para preview:", error)
      toast.error("Erro ao preparar a visualização da proposta. Por favor, tente novamente.")
      return null
    } finally {
      setIsCreatingProposta(false)
    }
  }

  const nextStep = async () => {
    console.log(`🔍 Tentando avançar do step ${currentStep}`)

    if (currentStep === 1) {
      const fieldsToValidate = corretorPredefinido ? ["template_id"] : ["corretor_nome", "template_id"]
      const isValid = await methods.trigger(fieldsToValidate)
      if (!isValid) return
    } else if (currentStep === 2) {
      const fieldsToValidate = [
        "cobertura",
        "acomodacao",
        "sigla_plano",
        "valor",
        "nome",
        "cpf",
        "rg",
        "data_nascimento",
        "email",
        "telefone",
        "cep",
        "endereco",
        "numero",
        "bairro",
        "cidade",
        "estado",
      ]
      const isValid = await methods.trigger(fieldsToValidate)
      if (!isValid) return
    } else if (currentStep === 3) {
      const isValid = await methods.trigger("tem_dependentes")
      if (!isValid) return

      // Debug detalhado do Step 3
      const temDependentes = methods.getValues("tem_dependentes")
      const dependentes = methods.getValues("dependentes") || []

      console.log("🔍 Debug Step 3 - Dependentes:", {
        tem_dependentes: temDependentes,
        dependentes_count: dependentes.length,
        dependentes_data: dependentes,
      })

      if (temDependentes) {
        if (dependentes.length === 0) {
          toast.error(
            "Você marcou que tem dependentes, mas não adicionou nenhum. Adicione pelo menos um dependente ou desmarque a opção.",
          )
          return
        }

        // Validar cada dependente
        let allValid = true
        for (let i = 0; i < dependentes.length; i++) {
          const isDepValid = await methods.trigger(`dependentes.${i}`)
          console.log(`📊 Validação dependente ${i}:`, isDepValid, dependentes[i])
          if (!isDepValid) {
            allValid = false
          }
        }
        if (!allValid) {
          toast.error("Há erros nos dados dos dependentes. Verifique e corrija antes de continuar.")
          return
        }
      }
    } else if (currentStep === 4) {
      const documentos = methods.getValues("documentos")
      const documentosObrigatorios = ["rg_frente", "rg_verso", "cpf", "comprovante_residencia"]
      let documentosValidos = true

      for (const doc of documentosObrigatorios) {
        if (!documentos[doc] || !(documentos[doc] instanceof File)) {
          toast.error(`Por favor, faça o upload do documento: ${doc.replace("_", " ").toUpperCase()}`)
          documentosValidos = false
        }
      }

      if (!documentosValidos) return
    } else if (currentStep === 5) {
      const peso = methods.getValues("peso")
      const altura = methods.getValues("altura")

      if (!peso || peso.trim() === "") {
        toast.error("Por favor, preencha o peso")
        return
      }

      if (!altura || altura.trim() === "") {
        toast.error("Por favor, preencha a altura")
        return
      }

      const respostas = methods.getValues("respostas_saude")
      if (!respostas || respostas.length === 0) {
        toast.error("Erro no questionário de saúde. Recarregue a página.")
        return
      }

      for (let i = 0; i < respostas.length; i++) {
        if (!respostas[i].resposta || (respostas[i].resposta !== "Sim" && respostas[i].resposta !== "Não")) {
          toast.error(`Por favor, responda a pergunta ${i + 1} do questionário de saúde`)
          return
        }
      }

      // Criar proposta para preview se não existir
      if (!propostaId) {
        console.log("🔄 Criando proposta para preview...")
        const novoId = await criarPropostaParaPreview()
        if (!novoId) {
          console.log("❌ Falha ao criar proposta para preview")
          return
        }
        console.log("✅ Proposta criada para preview:", novoId)
      }
    } else if (currentStep === 7) {
      const isValid = await methods.trigger("assinatura")
      if (!isValid) return
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true)

      // Validação adicional de CPF
      if (!validarCPF(data.cpf)) {
        toast.error("CPF inválido. Por favor, verifique e tente novamente.")
        return
      }

      let finalPropostaId = propostaId

      // Se já temos um ID de proposta (criado no preview), apenas atualizamos
      if (propostaId) {
        await atualizarProposta(propostaId, {
          status: "pendente",
          assinatura: data.assinatura,
          idade_titular: data.idade_titular,
          valor_total: data.valor_total,
        })
      } else {
        // Criar nova proposta se não temos ID
        const novaProposta = await criarPropostaDigital({
          corretor_nome: data.corretor_nome,
          corretor_id: data.corretor_id,
          template_id: data.template_id,
          template_titulo: data.template_titulo,
          nome: data.nome,
          cpf: data.cpf,
          rg: data.rg,
          data_nascimento: data.data_nascimento,
          idade_titular: data.idade_titular,
          cns: data.cns,
          email: data.email,
          telefone: data.telefone,
          endereco: data.endereco,
          numero: data.numero,
          complemento: data.complemento,
          bairro: data.bairro,
          cidade: data.cidade,
          estado: data.estado,
          cep: data.cep,
          cobertura: data.cobertura,
          acomodacao: data.acomodacao,
          sigla_plano: data.sigla_plano,
          valor: data.valor,
          valor_total: data.valor_total,
          tem_dependentes: data.tem_dependentes,
          peso: data.peso,
          altura: data.altura,
          nome_mae: data.nome_mae,
          sexo: data.sexo,
          estado_civil: data.estado_civil,
          naturalidade: data.naturalidade,
          status: "pendente",
          assinatura: data.assinatura,
        })

        finalPropostaId = novaProposta.id
        setPropostaId(novaProposta.id)

        // Salvar dependentes se for uma nova proposta
        if (data.tem_dependentes && data.dependentes && data.dependentes.length > 0) {
          await salvarDependentes(novaProposta.id, data.dependentes)
        }

        // Salvar questionário de saúde se for uma nova proposta
        await salvarQuestionarioSaude(novaProposta.id, data.respostas_saude)
      }

      // Garantir que os documentos sejam sempre salvos
      try {
        const { data: propostaAtual } = await supabase
          .from("propostas")
          .select("documentos_urls")
          .eq("id", finalPropostaId)
          .single()

        if (!propostaAtual?.documentos_urls || Object.keys(propostaAtual.documentos_urls).length === 0) {
          const documentosUrls = await uploadDocumentos(finalPropostaId, data.documentos)
          await atualizarProposta(finalPropostaId, { documentos_urls: documentosUrls })
        }
      } catch (docError) {
        console.error("⚠️ Erro ao salvar documentos:", docError)
        toast.error("Erro ao salvar documentos. Continuando com o processo...")
      }

      toast.success("Proposta enviada com sucesso!")
      router.push(`/proposta-digital/sucesso?id=${finalPropostaId}`)
    } catch (error) {
      console.error("❌ Erro ao enviar proposta:", error)

      if (error.message && error.message.includes("cpf_valido")) {
        toast.error("CPF inválido. Por favor, verifique e tente novamente.")
      } else if (error.message) {
        toast.error(`Erro ao enviar proposta: ${error.message}`)
      } else {
        toast.error("Erro ao enviar proposta. Tente novamente.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1SelectTemplate templates={templates} corretorPredefinido={corretorPredefinido} />
      case 2:
        return <Step2PlanInfo templates={templates} corretorPredefinido={corretorPredefinido} />
      case 3:
        return <Step3Dependents />
      case 4:
        return <Step4Documents />
      case 5:
        return <Step5HealthQuestionnaire />
      case 6:
        return isCreatingProposta ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-[#168979] border-t-transparent rounded-full mb-4"></div>
            <p className="text-gray-600">Preparando resumo da proposta...</p>
          </div>
        ) : (
          <Step6PDFPreview propostaId={propostaId} onNext={() => nextStep()} onBack={() => prevStep()} />
        )
      case 7:
        return <Step7Signature />
      case 8:
        return <Step8Confirmation formData={methods.getValues()} />
      default:
        return <Step1SelectTemplate templates={templates} corretorPredefinido={corretorPredefinido} />
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Selecione o modelo"
      case 2:
        return "Informações do plano e titular"
      case 3:
        return "Dependentes"
      case 4:
        return "Documentos"
      case 5:
        return "Questionário de saúde"
      case 6:
        return "Resumo da proposta"
      case 7:
        return "Assinatura"
      case 8:
        return "Confirmação"
      default:
        return ""
    }
  }

  const getStepIcon = () => {
    switch (currentStep) {
      case 6:
        return <FileText className="h-5 w-5" />
      case 8:
        return <Check className="h-5 w-5" />
      default:
        return null
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-4xl mx-auto shadow-lg border-0 bg-white">
          {/* Header melhorado */}
          <div className="bg-gradient-to-r from-[#168979] to-[#13786a] text-white p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                {getStepIcon()}
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">Proposta Digital</h1>
                  <p className="text-sm opacity-90">
                    Passo {currentStep} de {totalSteps}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{getStepTitle()}</p>
              </div>
            </div>

            {/* Progress bar melhorada */}
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-white h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8">{renderStep()}</div>

          {/* Navigation melhorada */}
          <div className="border-t bg-gray-50 px-6 py-4 sm:px-8 sm:py-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  onClick={prevStep}
                  variant="outline"
                  disabled={isSubmitting || isCreatingProposta}
                  className="order-2 sm:order-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
              ) : (
                <div className="order-2 sm:order-1"></div>
              )}

              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={isSubmitting || isCreatingProposta}
                  className="bg-[#168979] hover:bg-[#13786a] order-1 sm:order-2"
                >
                  {isCreatingProposta ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      Próximo <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white order-1 sm:order-2"
                  onClick={async (e) => {
                    e.preventDefault()
                    const formData = methods.getValues()
                    await onSubmit(formData)
                  }}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <span className="mr-2">Enviando...</span>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      Finalizar proposta <Check className="ml-2 h-4 w-4" />
                    </div>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </form>
    </FormProvider>
  )
}
