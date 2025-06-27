"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { verificarAutenticacao } from "@/services/auth-corretores-simples"
import { obterValorProdutoPorIdade } from "@/services/produtos-corretores-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Loader2, FileText, User, CreditCard, Send, AlertCircle, Plus, Trash2, Check } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatarMoeda } from "@/utils/formatters"
import { Switch } from "@/components/ui/switch"
import { buscarTabelasPrecosPorProduto } from "@/services/tabelas-service"
import { enviarEmailPropostaCliente } from "@/services/email-service"
import { SuccessModal } from "@/components/ui/success-modal"
import { UploadService } from "@/services/upload-service"
import { criarProposta } from "@/services/propostas-service-unificado"
import { validarCPF, removerFormatacaoCPF } from "@/utils/validacoes"

// Schema de validação
const formSchema = z.object({
  // Informações do cliente
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
  cpf: z.string().min(11, "CPF inválido"),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  cns: z.string().min(1, "CNS é obrigatório"),
  rg: z.string().min(1, "RG é obrigatório"),
  orgao_emissor: z.string().min(1, "Órgão emissor é obrigatório"),
  nome_mae: z.string().min(1, "Nome da mãe é obrigatório"),
  sexo: z.enum(["Masculino", "Feminino", "Outro"], {
    required_error: "Sexo é obrigatório",
  }),

  // Endereço
  cep: z.string().min(8, "CEP inválido"),
  endereco: z.string().min(3, "Endereço deve ter pelo menos 3 caracteres"),
  numero: z.string().min(1, "Número é obrigatório"),
  complemento: z.string().optional(),
  bairro: z.string().min(2, "Bairro deve ter pelo menos 2 caracteres"),
  cidade: z.string().min(2, "Cidade deve ter pelo menos 2 caracteres"),
  estado: z.string().min(2, "Estado é obrigatório"),

  // Informações do plano
  produto_id: z.string().min(1, "Selecione um produto"),
  tabela_id: z.string().optional(),
  template_id: z.string().min(1, "Selecione um modelo de proposta"),
  cobertura: z.enum(["Nacional", "Estadual", "Regional"]),
  acomodacao: z.enum(["Enfermaria", "Apartamento"]),
  sigla_plano: z.string().min(1, "Código do plano é obrigatório"),
  valor: z.string().min(1, "Valor é obrigatório"),

  // Dependentes
  tem_dependentes: z.boolean().default(false),
  dependentes: z
    .array(
      z.object({
        nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
        cpf: z.string().min(11, "CPF inválido"),
        rg: z.string().min(1, "RG é obrigatório"),
        data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
        idade: z.string().optional(),
        cns: z.string().min(1, "CNS é obrigatório"),
        parentesco: z.string().min(1, "Parentesco é obrigatório"),
        nome_mae: z.string().min(1, "Nome da mãe é obrigatório"),
        peso: z.string().optional(),
        altura: z.string().optional(),
        valor_individual: z.string().optional(),
        uf_nascimento: z.string().min(1, "UF de nascimento é obrigatório"),
        sexo: z.enum(["Masculino", "Feminino", "Outro"], {
          required_error: "Sexo é obrigatório",
        }),
        orgao_emissor: z.string().min(1, "Órgão emissor é obrigatório"),
      }),
    )
    .default([]),

  // Informações adicionais
  observacoes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function NovaPropostaPage() {
  const router = useRouter()
  const [corretor, setCorretor] = useState<any>(null)
  const [produtos, setProdutos] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [tabelas, setTabelas] = useState<any[]>([])
  const [carregandoProdutos, setCarregandoProdutos] = useState(true)
  const [carregandoTemplates, setCarregandoTemplates] = useState(true)
  const [carregandoTabelas, setCarregandoTabelas] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [activeTab, setActiveTab] = useState("cliente")
  const [valorCalculado, setValorCalculado] = useState<number | null>(null)
  const [idadeCliente, setIdadeCliente] = useState<number | null>(null)
  const [documentosUpload, setDocumentosUpload] = useState<{ [key: string]: File | null }>({
    rg_frente: null,
    rg_verso: null,
    cpf: null,
    comprovante_residencia: null,
    cns: null,
  })
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null)

  const [documentosDependentesUpload, setDocumentosDependentesUpload] = useState<{
    [key: string]: { [key: string]: File | null }
  }>({})

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successData, setSuccessData] = useState<{
    clienteNome: string
    clienteEmail: string
    linkProposta: string
    emailEnviado: boolean
  } | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      cpf: "",
      data_nascimento: "",
      cns: "",
      rg: "",
      orgao_emissor: "",
      nome_mae: "",
      sexo: undefined,
      cep: "",
      endereco: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      produto_id: "",
      tabela_id: "",
      template_id: "",
      cobertura: "Nacional",
      acomodacao: "Enfermaria",
      sigla_plano: "",
      valor: "",
      tem_dependentes: false,
      dependentes: [],
      observacoes: "",
    },
  })

  // Observar mudanças na data de nascimento e produto_id
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "data_nascimento" || name === "produto_id" || name === "tabela_id") {
        const dataNascimento = form.getValues("data_nascimento")
        const produtoId = form.getValues("produto_id")
        const tabelaId = form.getValues("tabela_id")

        if (dataNascimento && produtoId) {
          if (tabelaId) {
            calcularValorPorTabelaEIdade(tabelaId, dataNascimento)
          } else {
            calcularIdadeEValor(dataNascimento, produtoId)
          }
        }
      }

      // NOVO: Carregar descrição do produto quando selecionado
      if (name === "produto_id") {
        const produtoId = form.getValues("produto_id")
        if (produtoId) {
          carregarDescricaoProduto(produtoId)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [form])

  useEffect(() => {
    // Verificar autenticação
    const { autenticado, corretor: corretorLogado } = verificarAutenticacao()
    if (!autenticado || !corretorLogado) {
      router.push("/corretor/login")
      return
    }

    setCorretor(corretorLogado)
    carregarProdutos()
    carregarTemplates()
  }, [router])

  const calcularIdade = (dataNascimento: string): number => {
    const hoje = new Date()
    const nascimento = new Date(dataNascimento)
    let idade = hoje.getFullYear() - nascimento.getFullYear()
    const m = hoje.getMonth() - nascimento.getMonth()

    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--
    }

    return idade
  }

  const calcularIdadeEValor = async (dataNascimento: string, produtoId: string) => {
    if (!dataNascimento || !produtoId) {
      console.log("⚠️ Data de nascimento ou produto não informados")
      return
    }

    console.log(`🔄 Calculando valor para produto ${produtoId} e data ${dataNascimento}`)

    // Calcular idade
    const idade = calcularIdade(dataNascimento)
    setIdadeCliente(idade)
    console.log(`👤 Idade calculada: ${idade} anos`)

    // Buscar valor do produto com base na idade
    try {
      console.log(`💰 Buscando valor do produto...`)
      const valor = await obterValorProdutoPorIdade(produtoId, idade)
      console.log(`💰 Valor retornado: ${valor}`)

      setValorCalculado(valor)

      if (valor > 0) {
        const valorFormatado = formatarMoeda(valor)
        console.log(`✅ Definindo valor formatado: ${valorFormatado}`)
        form.setValue("valor", valorFormatado)
        toast.success(`Valor calculado automaticamente: ${valorFormatado}`)
      } else {
        console.log(`⚠️ Valor zero ou não encontrado`)
        setValorCalculado(null)
        toast.warning("Não foi possível calcular o valor automaticamente. Informe o valor manualmente.")
      }
    } catch (error) {
      console.error("❌ Erro ao calcular valor do produto:", error)
      setValorCalculado(null)
      toast.error("Erro ao calcular valor do produto. Informe o valor manualmente.")
    }
  }

  const calcularValorPorTabelaEIdade = async (tabelaId: string, dataNascimento: string) => {
    try {
      console.log(`🔄 Calculando valor por tabela ${tabelaId} e data ${dataNascimento}`)

      const idade = calcularIdade(dataNascimento)
      setIdadeCliente(idade)
      console.log(`👤 Idade calculada: ${idade} anos`)

      // Buscar as faixas etárias da tabela
      const { data: faixas, error: faixasError } = await supabase
        .from("tabelas_precos_faixas")
        .select("faixa_etaria, valor")
        .eq("tabela_id", tabelaId)
        .order("faixa_etaria", { ascending: true })

      if (faixasError || !faixas || faixas.length === 0) {
        console.error("❌ Erro ao buscar faixas etárias:", faixasError || "Nenhuma faixa encontrada")
        toast.warning("Não foi possível buscar as faixas etárias desta tabela.")
        return
      }

      console.log(`📊 Faixas etárias da tabela:`, faixas)

      // Encontrar a faixa etária correspondente
      let valorEncontrado = 0
      let faixaEncontrada = null

      for (const faixa of faixas) {
        // Verificar se é uma faixa com formato "min-max"
        if (faixa.faixa_etaria.includes("-")) {
          const [minStr, maxStr] = faixa.faixa_etaria.split("-")
          const min = Number.parseInt(minStr.trim(), 10)
          const max = Number.parseInt(maxStr.trim(), 10)

          if (!isNaN(min) && !isNaN(max) && idade >= min && idade <= max) {
            valorEncontrado = Number.parseFloat(faixa.valor) || 0
            faixaEncontrada = faixa.faixa_etaria
            break
          }
        }
        // Verificar se é uma faixa com formato "min+" (idade mínima)
        else if (faixa.faixa_etaria.endsWith("+")) {
          const minStr = faixa.faixa_etaria.replace("+", "").trim()
          const min = Number.parseInt(minStr, 10)

          if (!isNaN(min) && idade >= min) {
            valorEncontrado = Number.parseFloat(faixa.valor) || 0
            faixaEncontrada = faixa.faixa_etaria
            break
          }
        }
        // Verificar se é uma idade específica
        else {
          const idadeExata = Number.parseInt(faixa.faixa_etaria.trim(), 10)

          if (!isNaN(idadeExata) && idade === idadeExata) {
            valorEncontrado = Number.parseFloat(faixa.valor) || 0
            faixaEncontrada = faixa.faixa_etaria
            break
          }
        }
      }

      setValorCalculado(valorEncontrado)

      if (valorEncontrado > 0) {
        const valorFormatado = formatarMoeda(valorEncontrado)
        form.setValue("valor", valorFormatado)
        console.log(`✅ Valor encontrado na faixa ${faixaEncontrada}: ${valorFormatado}`)
        toast.success(`Valor calculado para faixa ${faixaEncontrada}: ${valorFormatado}`)
      } else {
        console.log(`⚠️ Nenhum valor encontrado para idade ${idade}`)
        toast.warning(`Não foi possível encontrar valor para idade ${idade} anos nesta tabela.`)
      }
    } catch (error) {
      console.error("❌ Erro ao calcular valor pela tabela:", error)
      toast.error("Erro ao calcular valor pela tabela.")
    }
  }

  const carregarProdutos = async () => {
    setCarregandoProdutos(true)
    try {
      console.log("Iniciando carregamento de produtos...")

      // Tentar buscar produtos diretamente do Supabase
      const { data, error } = await supabase.from("produtos_corretores").select("*").order("nome", { ascending: true })

      if (error) {
        console.error("Erro ao buscar produtos diretamente:", error)
        throw error
      }

      console.log("Produtos carregados diretamente:", data)
      setProdutos(data || [])
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
      toast.error("Erro ao carregar produtos. Tente novamente.")
    } finally {
      setCarregandoProdutos(false)
    }
  }

  const carregarTabelasProduto = async (produtoId: string) => {
    setCarregandoTabelas(true)
    try {
      const tabelasProduto = await buscarTabelasPrecosPorProduto(produtoId)
      setTabelas(tabelasProduto)

      // Se houver apenas uma tabela, seleciona automaticamente
      if (tabelasProduto.length === 1) {
        form.setValue("tabela_id", tabelasProduto[0].tabela_id)
      }
    } catch (error) {
      console.error("Erro ao carregar tabelas do produto:", error)
      toast.error("Erro ao carregar tabelas do produto. Tente novamente.")
    } finally {
      setCarregandoTabelas(false)
    }
  }

  const carregarTemplates = async () => {
    setCarregandoTemplates(true)
    try {
      const { data, error } = await supabase
        .from("modelos_propostas")
        .select("*")
        .eq("ativo", true)
        .order("titulo", { ascending: true })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error("Erro ao carregar modelos de propostas:", error)
      toast.error("Erro ao carregar modelos de propostas. Tente novamente.")
    } finally {
      setCarregandoTemplates(false)
    }
  }

  const handleFileChange = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentosUpload((prev) => ({
        ...prev,
        [field]: e.target.files![0],
      }))
    }
  }

  const handleDependentFileChange = (dependentIndex: number, field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentosDependentesUpload((prev) => {
        const updatedDocs = { ...prev }
        if (!updatedDocs[dependentIndex]) {
          updatedDocs[dependentIndex] = {}
        }
        updatedDocs[dependentIndex][field] = e.target.files![0]
        return updatedDocs
      })
    }
  }

  const enviarEmailParaCliente = async (
    propostaId: string,
    emailCliente: string,
    nomeCliente: string,
  ): Promise<boolean> => {
    try {
      console.log("📧 INICIANDO ENVIO DE EMAIL PARA CLIENTE...")
      console.log(`   Proposta ID: ${propostaId}`)
      console.log(`   Email: ${emailCliente}`)
      console.log(`   Nome: ${nomeCliente}`)

      // Criar link único para o cliente completar a proposta
      const linkProposta = `${window.location.origin}/proposta-digital/completar/${propostaId}`
      console.log(`   Link gerado: ${linkProposta}`)

      // Usar o serviço de email
      const emailEnviado = await enviarEmailPropostaCliente(emailCliente, nomeCliente, linkProposta, corretor.nome)

      console.log(`📧 RESULTADO DO ENVIO: ${emailEnviado}`)
      console.log(`   Tipo do resultado: ${typeof emailEnviado}`)
      console.log(`   Valor booleano: ${emailEnviado === true}`)

      // VERIFICAÇÃO EXPLÍCITA
      if (emailEnviado === true) {
        console.log("✅ EMAIL CONFIRMADO COMO ENVIADO COM SUCESSO!")
        return true
      } else {
        console.log("❌ EMAIL NÃO FOI ENVIADO OU RETORNOU FALSO")
        return false
      }
    } catch (error) {
      console.error("❌ ERRO NO ENVIO DE EMAIL:", error)
      return false
    }
  }

  const carregarDescricaoProduto = async (produtoId: string) => {
    try {
      console.log("🔍 Carregando descrição do produto:", produtoId)

      const { data: produto, error } = await supabase
        .from("produtos_corretores")
        .select("nome, descricao, operadora, tipo")
        .eq("id", produtoId)
        .single()

      if (error) {
        console.error("❌ Erro ao carregar produto:", error)
        return
      }

      if (produto) {
        console.log("✅ Produto carregado:", produto)
        // Armazenar dados do produto para usar no envio
        setProdutoSelecionado(produto)
      }
    } catch (error) {
      console.error("❌ Erro ao carregar descrição do produto:", error)
    }
  }

  // NOVA VERSÃO OTIMIZADA DO UPLOAD - AGORA SALVA NA TABELA UNIFICADA
  const onSubmit = async (data: FormValues) => {
    if (!corretor?.id) {
      toast.error("Você precisa estar logado para criar uma proposta.")
      return
    }

    // VALIDAR CPF DO TITULAR
    console.log("🔍 Validando CPF do titular:", data.cpf)
    const cpfTitularLimpo = removerFormatacaoCPF(data.cpf)
    if (!validarCPF(cpfTitularLimpo)) {
      toast.error("CPF do titular é inválido. Verifique os dados informados.")
      return
    }

    // VALIDAR CPFs DOS DEPENDENTES
    if (data.tem_dependentes && data.dependentes.length > 0) {
      for (let i = 0; i < data.dependentes.length; i++) {
        const dependente = data.dependentes[i]
        console.log(`🔍 Validando CPF do dependente ${i + 1}:`, dependente.cpf)
        const cpfDependenteLimpo = removerFormatacaoCPF(dependente.cpf)
        if (!validarCPF(cpfDependenteLimpo)) {
          toast.error(`CPF do dependente ${i + 1} é inválido. Verifique os dados informados.`)
          return
        }
      }
    }

    // Verificar se todos os documentos do titular foram anexados
    const documentosObrigatorios = ["rg_frente", "rg_verso", "cpf", "comprovante_residencia", "cns"]
    const documentosFaltantes = documentosObrigatorios.filter((doc) => !documentosUpload[doc])

    if (documentosFaltantes.length > 0) {
      toast.error(`Anexe todos os documentos obrigatórios do titular: ${documentosFaltantes.join(", ")}`)
      return
    }

    // Verificar documentos dos dependentes se houver
    if (data.tem_dependentes) {
      for (let i = 0; i < data.dependentes.length; i++) {
        const docsObrigatoriosDependente = ["rg_frente", "rg_verso", "cpf", "cns"]
        const docsFaltantesDependente = docsObrigatoriosDependente.filter(
          (doc) => !documentosDependentesUpload[i] || !documentosDependentesUpload[i][doc],
        )

        if (docsFaltantesDependente.length > 0) {
          toast.error(
            `Anexe todos os documentos obrigatórios do dependente ${i + 1}: ${docsFaltantesDependente.join(", ")}`,
          )
          return
        }
      }
    }

    setEnviando(true)
    try {
      console.log("🚀 INICIANDO PROCESSO DE CRIAÇÃO DE PROPOSTA - TABELA UNIFICADA")
      console.log("=".repeat(70))

      // Converte o valor para número
      const valorNumerico = Number.parseFloat(data.valor.replace(/[^\d,.-]/g, "").replace(",", "."))

      // Buscar o produto selecionado para obter dados completos
      const produtoSelecionadoInterno = produtos.find((p) => p.id.toString() === data.produto_id)

      // Preparar endereço completo
      let enderecoCompleto = data.endereco
      if (data.numero) enderecoCompleto += `, ${data.numero}`
      if (data.complemento) enderecoCompleto += `, ${data.complemento}`

      // Dados da proposta para a tabela UNIFICADA
      const dadosProposta = {
        // Campos originais da tabela propostas
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        data_nascimento: data.data_nascimento,
        cpf: data.cpf, // Será validado e formatado no serviço
        rg: data.rg,
        endereco: enderecoCompleto,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        cns: data.cns,
        nome_mae: data.nome_mae,
        sexo: data.sexo,
        orgao_emissor: data.orgao_emissor,
        sigla_plano: data.sigla_plano,
        valor_mensal: valorNumerico,
        valor_total: valorNumerico,
        status: "parcial", // Status inicial correto
        observacoes: data.observacoes,

        // Campos específicos de corretores (NOVOS)
        corretor_id: corretor.id,
        cliente: data.nome,
        email_cliente: data.email,
        whatsapp_cliente: data.telefone,
        telefone_cliente: data.telefone,
        produto: produtoSelecionado?.nome || "Produto não identificado",
        produto_nome: produtoSelecionado?.nome || "",
        produto_descricao: produtoSelecionado?.descricao || null,
        produto_operadora: produtoSelecionado?.operadora || null,
        produto_tipo: produtoSelecionado?.tipo || null,
        plano_nome: `${produtoSelecionado?.nome || ""} - ${data.sigla_plano}`,
        valor_proposta: valorNumerico,
        comissao: 0,
        data: new Date().toISOString(),

        // Dados adicionais do cliente
        cpf_cliente: data.cpf, // Será validado e formatado no serviço
        data_nascimento_cliente: data.data_nascimento,
        endereco_cliente: enderecoCompleto,
        cidade_cliente: data.cidade,
        estado_cliente: data.estado,
        cep_cliente: data.cep,
        rg_cliente: data.rg,
        orgao_emissor_cliente: data.orgao_emissor,
        cns_cliente: data.cns,
        nome_mae_cliente: data.nome_mae,
        sexo_cliente: data.sexo,

        // Dados do plano
        cobertura: data.cobertura,
        acomodacao: data.acomodacao,
        codigo_plano: data.sigla_plano,

        // Dados adicionais
        tem_dependentes: data.tem_dependentes,
        quantidade_dependentes: data.tem_dependentes ? data.dependentes.length : 0,

        // Campos para controle de documentos
        documentos_enviados: true,
        data_upload_documentos: new Date().toISOString(),

        // Incluir dados dos dependentes para validação
        dependentes: data.tem_dependentes ? data.dependentes : [],
      }

      console.log("💾 Salvando proposta na tabela UNIFICADA 'propostas'...")

      // Usar o serviço unificado para criar a proposta
      const propostaId = await criarProposta(dadosProposta)

      if (!propostaId) {
        throw new Error("Erro ao criar proposta - ID não retornado")
      }

      console.log("✅ Proposta salva com sucesso!")
      console.log("🆔 ID da proposta:", propostaId)

      // NOVO: Upload otimizado de documentos
      console.log("📤 Iniciando upload otimizado de documentos...")

      const { documentosUrls, documentosDependentesUrls, bucketUsado } = await UploadService.uploadDocumentos(
        propostaId,
        documentosUpload,
        Object.values(documentosDependentesUpload),
      )

      console.log("📊 Resultado do upload:")
      console.log("   Bucket usado:", bucketUsado)
      console.log("   Documentos titular:", Object.keys(documentosUrls).length)
      console.log("   Documentos dependentes:", Object.keys(documentosDependentesUrls).length)

      // Salvar dependentes se houver
      if (data.tem_dependentes && data.dependentes.length > 0) {
        console.log("👨‍👩‍👧‍👦 Salvando dependentes...")

        const dependentesData = data.dependentes.map((dep, index) => ({
          proposta_id: propostaId, // Usar o ID da tabela unificada
          nome: dep.nome,
          cpf: removerFormatacaoCPF(dep.cpf), // Remover formatação do CPF
          rg: dep.rg,
          data_nascimento: dep.data_nascimento,
          cns: dep.cns,
          parentesco: dep.parentesco,
          nome_mae: dep.nome_mae,
          peso: dep.peso ? Number.parseFloat(dep.peso) : null,
          altura: dep.altura ? Number.parseFloat(dep.altura) : null,
          valor_individual: dep.valor_individual
            ? Number.parseFloat(dep.valor_individual.replace(/[^\d.,]/g, "").replace(",", "."))
            : null,
          uf_nascimento: dep.uf_nascimento,
          sexo: dep.sexo,
          orgao_emissor: dep.orgao_emissor,
          created_at: new Date().toISOString(),
        }))

        const { error: dependentesError } = await supabase
          .from("dependentes") // Usar a tabela unificada de dependentes
          .insert(dependentesData)

        if (dependentesError) {
          console.error("❌ Erro ao salvar dependentes:", dependentesError)
          toast.error("Proposta salva, mas houve erro ao salvar dependentes.")
        } else {
          console.log("✅ Dependentes salvos com sucesso!")
        }
      }

      // Atualizar com URLs dos documentos - CORRIGIDO: usar updated_at
      console.log("🔗 Atualizando proposta com URLs dos documentos...")

      const updateData: any = {
        updated_at: new Date().toISOString(), // CORRIGIDO: usar updated_at em vez de atualizado_em
        bucket_usado: bucketUsado, // NOVO: Registrar qual bucket foi usado
      }

      // Adicionar URLs dos documentos se houver
      if (Object.keys(documentosUrls).length > 0) {
        updateData.documentos_urls = documentosUrls

        // Também salvar em campos individuais para compatibilidade
        if (documentosUrls.rg_frente) updateData.rg_frente_url = documentosUrls.rg_frente
        if (documentosUrls.rg_verso) updateData.rg_verso_url = documentosUrls.rg_verso
        if (documentosUrls.cpf) updateData.cpf_url = documentosUrls.cpf
        if (documentosUrls.comprovante_residencia)
          updateData.comprovante_residencia_url = documentosUrls.comprovante_residencia
        if (documentosUrls.cns) updateData.cns_url = documentosUrls.cns
      }

      if (Object.keys(documentosDependentesUrls).length > 0) {
        updateData.documentos_dependentes_urls = documentosDependentesUrls
      }

      const { error: updateError } = await supabase
        .from("propostas") // Atualizar na tabela unificada
        .update(updateData)
        .eq("id", propostaId)

      if (updateError) {
        console.error("⚠️ Erro ao atualizar URLs dos documentos:", updateError)
        console.log("⚠️ Proposta salva, mas URLs dos documentos podem não ter sido atualizadas")
      } else {
        console.log("✅ URLs dos documentos atualizadas com sucesso!")
      }

      // Enviar email para o cliente
      console.log("📧 Tentando enviar email para o cliente...")
      console.log("📧 ANTES DO ENVIO - Dados:")
      console.log(`   propostaId: ${propostaId}`)
      console.log(`   email: ${data.email}`)
      console.log(`   nome: ${data.nome}`)

      const emailEnviado = await enviarEmailParaCliente(propostaId, data.email, data.nome)

      console.log("📧 APÓS O ENVIO - Resultado:")
      console.log(`   emailEnviado: ${emailEnviado}`)
      console.log(`   Tipo: ${typeof emailEnviado}`)
      console.log(`   É true?: ${emailEnviado === true}`)
      console.log(`   É truthy?: ${!!emailEnviado}`)

      // CORRIGIDO: Atualizar flag de email enviado no banco
      if (emailEnviado === true) {
        console.log("📧 Atualizando flag de email enviado no banco...")

        const { error: emailUpdateError } = await supabase
          .from("propostas")
          .update({
            email_validacao_enviado: true,
            email_enviado_em: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", propostaId)

        if (emailUpdateError) {
          console.error("⚠️ Erro ao atualizar flag de email:", emailUpdateError)
        } else {
          console.log("✅ Flag de email atualizada no banco!")
        }
      }

      // Preparar dados para o modal de sucesso
      const linkProposta = `${window.location.origin}/proposta-digital/completar/${propostaId}`

      setSuccessData({
        clienteNome: data.nome,
        clienteEmail: data.email,
        linkProposta,
        emailEnviado: emailEnviado === true, // VERIFICAÇÃO EXPLÍCITA
      })

      // Mostrar modal de sucesso
      setShowSuccessModal(true)

      // Se email não foi enviado, copiar link para clipboard
      if (!emailEnviado && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(linkProposta)
          console.log("📋 Link copiado para clipboard como fallback")
        } catch (clipboardError) {
          console.log("❌ Não foi possível copiar para clipboard:", clipboardError)
        }
      }

      console.log("🎉 PROCESSO COMPLETO FINALIZADO COM SUCESSO!")
      toast.success("Proposta criada com sucesso!")
    } catch (error) {
      console.error("❌ ERRO GERAL NO PROCESSO:", error)

      // Mostrar erro mais específico
      if (error instanceof Error) {
        if (error.message.includes("CPF")) {
          toast.error(error.message)
        } else {
          toast.error("Erro ao criar proposta. Verifique os dados e tente novamente.")
        }
      } else {
        toast.error("Erro ao criar proposta. Tente novamente.")
      }
    } finally {
      setEnviando(false)
    }
  }

  // Formata o valor como moeda brasileira
  const formatarValorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, "")

    if (valor === "") {
      form.setValue("valor", "")
      return
    }

    // Converte para centavos e depois formata
    valor = (Number.parseInt(valor) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })

    form.setValue("valor", valor)
  }

  // Formata o telefone
  const formatarTelefoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let telefone = e.target.value.replace(/\D/g, "")

    if (telefone.length > 11) {
      telefone = telefone.substring(0, 11)
    }

    if (telefone.length > 10) {
      telefone = telefone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3")
    } else if (telefone.length > 6) {
      telefone = telefone.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3")
    } else if (telefone.length > 2) {
      telefone = telefone.replace(/^(\d{2})(\d{0,5})$/, "($1) $2")
    }

    form.setValue("telefone", telefone)
  }

  // Formata o CPF
  const formatarCpfInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let cpf = e.target.value.replace(/\D/g, "")

    if (cpf.length > 11) {
      cpf = cpf.substring(0, 11)
    }

    if (cpf.length > 9) {
      cpf = cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})$/, "$1.$2.$3-$4")
    } else if (cpf.length > 6) {
      cpf = cpf.replace(/^(\d{3})(\d{3})(\d{0,3})$/, "$1.$2.$3")
    } else if (cpf.length > 3) {
      cpf = cpf.replace(/^(\d{3})(\d{0,3})$/, "$1.$2")
    }

    form.setValue("cpf", cpf)
  }

  // Formata o CEP
  const formatarCepInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let cep = e.target.value.replace(/\D/g, "")

    if (cep.length > 8) {
      cep = cep.substring(0, 8)
    }

    if (cep.length > 5) {
      cep = cep.replace(/^(\d{5})(\d{0,3})$/, "$1-$2")
    }

    form.setValue("cep", cep)
  }

  const buscarCep = async (cep: string) => {
    const cepNumerico = cep.replace(/\D/g, "")

    if (cepNumerico.length !== 8) return

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepNumerico}/json/`)
      const data = await response.json()

      if (!data.erro) {
        form.setValue("endereco", data.logradouro)
        form.setValue("bairro", data.bairro)
        form.setValue("cidade", data.localidade)
        form.setValue("estado", data.uf)
        // Foca no campo número após preencher o endereço
        document.getElementById("numero")?.focus()
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
    }
  }

  const nextTab = () => {
    if (activeTab === "cliente") {
      form.trigger(["nome", "email", "telefone", "data_nascimento"]).then((isValid) => {
        if (isValid) setActiveTab("endereco")
      })
    } else if (activeTab === "endereco") {
      setActiveTab("plano")
    } else if (activeTab === "plano") {
      form.trigger(["produto_id", "template_id", "sigla_plano", "valor"]).then((isValid) => {
        if (isValid) setActiveTab("dependentes")
      })
    } else if (activeTab === "dependentes") {
      setActiveTab("documentos")
    }
  }

  const prevTab = () => {
    if (activeTab === "endereco") setActiveTab("cliente")
    if (activeTab === "plano") setActiveTab("endereco")
    if (activeTab === "dependentes") setActiveTab("plano")
    if (activeTab === "documentos") setActiveTab("dependentes")
  }

  // Format CPF input for dependents
  const handleDependentCpfChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    let value = e.target.value.replace(/\D/g, "")

    if (value.length > 11) {
      value = value.slice(0, 11)
    }

    if (value.length > 9) {
      value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")
    } else if (value.length > 6) {
      value = value.replace(/^(\d{3})(\d{3})(\d{0,3})$/, "$1.$2.$3")
    } else if (value.length > 3) {
      value = value.replace(/^(\d{3})(\d{0,3})$/, "$1.$2")
    }

    form.setValue(`dependentes.${index}.cpf`, value)
  }

  // Calculate age from birth date
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return ""
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    return age.toString()
  }

  // Format currency input for dependents
  const handleDependentCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    e.preventDefault()
    e.stopPropagation()

    let value = e.target.value.replace(/\D/g, "")
    value = (Number(value) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    form.setValue(`dependentes.${index}.valor_individual`, value, { shouldValidate: false })
  }

  // Add a new dependent
  const addDependent = () => {
    const dependentes = form.getValues("dependentes") || []
    if (dependentes.length < 4) {
      form.setValue("dependentes", [
        ...dependentes,
        {
          nome: "",
          cpf: "",
          rg: "",
          data_nascimento: "",
          idade: "",
          cns: "",
          parentesco: "",
          nome_mae: "",
          peso: "",
          altura: "",
          valor_individual: "",
          uf_nascimento: "SP", // Valor padrão para campo obrigatório
          sexo: undefined,
          orgao_emissor: "",
        },
      ])
    }
  }

  // Remove a dependent
  const removeDependent = (index: number) => {
    const dependentes = form.getValues("dependentes")
    dependentes.splice(index, 1)
    form.setValue("dependentes", [...dependentes])
  }

  const produtoTemTabela = (produtoId: string) => {
    if (!produtoId) return false
    const produto = produtos.find((p) => p.id.toString() === produtoId)
    return produto && produto.tabela_id
  }

  return (
    <div className="container mx-auto p-4">
      <Button variant="ghost" className="mb-4" onClick={() => router.push("/corretor/propostas")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para propostas
      </Button>

      <Card className="shadow-md border-0">
        <CardHeader className="bg-gradient-to-r from-[#168979] to-[#13786a] text-white">
          <CardTitle>Nova Proposta</CardTitle>
          <CardDescription className="text-gray-100">
            Preencha os dados para criar uma proposta para seu cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-5 mb-8">
                  <TabsTrigger value="cliente" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Cliente</span>
                  </TabsTrigger>
                  <TabsTrigger value="endereco" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Endereço</span>
                  </TabsTrigger>
                  <TabsTrigger value="plano" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Plano</span>
                  </TabsTrigger>
                  <TabsTrigger value="dependentes" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Dependentes</span>
                  </TabsTrigger>
                  <TabsTrigger value="documentos" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Documentos</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="cliente" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Cliente</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@exemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(00) 00000-0000"
                              value={field.value}
                              onChange={(e) => {
                                field.onChange(e)
                                formatarTelefoneInput(e)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="000.000.000-00"
                              value={field.value}
                              onChange={(e) => {
                                field.onChange(e)
                                formatarCpfInput(e)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="data_nascimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                        {idadeCliente !== null && (
                          <p className="text-sm text-muted-foreground">Idade calculada: {idadeCliente} anos</p>
                        )}
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="rg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RG</FormLabel>
                          <FormControl>
                            <Input placeholder="Número do RG" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="orgao_emissor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Órgão Emissor</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: SSP/SP" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cns"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNS (Cartão Nacional de Saúde)</FormLabel>
                          <FormControl>
                            <Input placeholder="Número do CNS" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nome_mae"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Mãe</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo da mãe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="sexo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sexo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o sexo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Feminino">Feminino</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end mt-6">
                    <Button type="button" onClick={nextTab} className="bg-[#168979] hover:bg-[#13786a]">
                      Próximo
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="endereco" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              placeholder="00000-000"
                              value={field.value}
                              onChange={(e) => {
                                field.onChange(e)
                                formatarCepInput(e)
                              }}
                              onBlur={() => buscarCep(field.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => buscarCep(field.value)}
                              className="whitespace-nowrap"
                            >
                              Buscar CEP
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="endereco"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endereço</FormLabel>
                            <FormControl>
                              <Input placeholder="Rua, Avenida, etc" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="numero"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input id="numero" placeholder="123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="complemento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input placeholder="Apto, Bloco, etc" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="bairro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input placeholder="Bairro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Cidade" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="estado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Input placeholder="UF" maxLength={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button type="button" variant="outline" onClick={prevTab}>
                      Voltar
                    </Button>
                    <Button type="button" onClick={nextTab} className="bg-[#168979] hover:bg-[#13786a]">
                      Próximo
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="plano" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="produto_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Produto</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value)
                              // Limpar tabela selecionada
                              form.setValue("tabela_id", "")
                              // Carregar tabelas do produto
                              carregarTabelasProduto(value)
                              // Recalcular valor quando o produto mudar
                              const dataNascimento = form.getValues("data_nascimento")
                              if (dataNascimento) {
                                calcularIdadeEValor(dataNascimento, value)
                              }
                            }}
                            defaultValue={field.value}
                            disabled={carregandoProdutos}
                          >
                            <SelectTrigger className="border-2 border-amber-300 bg-amber-50 hover:border-amber-400 focus:border-amber-500 shadow-sm">
                              <SelectValue placeholder="Selecione um produto" />
                            </SelectTrigger>
                            <SelectContent>
                              {carregandoProdutos ? (
                                <div className="flex items-center justify-center p-2">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  <span>Carregando produtos...</span>
                                </div>
                              ) : produtos && produtos.length > 0 ? (
                                produtos.map((produto) => (
                                  <SelectItem key={produto.id} value={String(produto.id)}>
                                    {produto.nome}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="p-2 text-center text-muted-foreground">
                                  {carregandoProdutos ? "Carregando..." : "Nenhum produto encontrado"}
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.getValues("produto_id") && (
                    <FormField
                      control={form.control}
                      name="tabela_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tabela de Preços</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value)
                                // Recalcular valor quando a tabela mudar
                                const dataNascimento = form.getValues("data_nascimento")
                                if (dataNascimento && value) {
                                  calcularValorPorTabelaEIdade(value, dataNascimento)
                                }
                              }}
                              value={field.value}
                              disabled={carregandoTabelas || tabelas.length === 0}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma tabela" />
                              </SelectTrigger>
                              <SelectContent>
                                {carregandoTabelas ? (
                                  <div className="flex items-center justify-center p-2">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    <span>Carregando tabelas...</span>
                                  </div>
                                ) : tabelas.length > 0 ? (
                                  tabelas.map((tabela) => (
                                    <SelectItem key={tabela.tabela_id} value={tabela.tabela_id}>
                                      {tabela.tabela_titulo} - {tabela.segmentacao}
                                      {tabela.descricao ? ` (${tabela.descricao})` : ""}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="p-2 text-center text-muted-foreground">
                                    Nenhuma tabela disponível para este produto
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="template_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo de Proposta</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={carregandoTemplates}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um modelo" />
                            </SelectTrigger>
                            <SelectContent>
                              {carregandoTemplates ? (
                                <div className="flex items-center justify-center p-2">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  <span>Carregando modelos...</span>
                                </div>
                              ) : templates.length > 0 ? (
                                templates.map((template) => (
                                  <SelectItem key={template.id} value={template.id}>
                                    {template.titulo}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="p-2 text-center text-muted-foreground">Nenhum modelo disponível</div>
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cobertura"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cobertura</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a cobertura" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Nacional">Nacional</SelectItem>
                              <SelectItem value="Estadual">Estadual</SelectItem>
                              <SelectItem value="Regional">Regional</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="acomodacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Acomodação</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a acomodação" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Enfermaria">Enfermaria</SelectItem>
                              <SelectItem value="Apartamento">Apartamento</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sigla_plano"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código do Plano</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: PS-001" {...field} />
                          </FormControl>
                          <FormDescription>Coloque a sigla do plano, se houver</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="valor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="R$ 0,00"
                              value={field.value}
                              onChange={(e) => {
                                field.onChange(e)
                                formatarValorInput(e)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                          {valorCalculado !== null && (
                            <p className="text-sm text-green-600">
                              Valor calculado automaticamente com base na idade e tabela selecionada.
                            </p>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>

                  {idadeCliente !== null && form.getValues("produto_id") && !valorCalculado && (
                    <Alert variant="warning" className="bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        Não foi possível calcular automaticamente o valor para este produto e idade. Por favor, informe
                        o valor manualmente.
                      </AlertDescription>
                    </Alert>
                  )}

                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Informações adicionais sobre a proposta"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Opcional. Adicione detalhes relevantes para a análise da proposta.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between mt-6">
                    <Button type="button" variant="outline" onClick={prevTab}>
                      Voltar
                    </Button>
                    <Button type="button" onClick={nextTab} className="bg-[#168979] hover:bg-[#13786a]">
                      Próximo
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="dependentes" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="tem_dependentes"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Possui Dependentes?</FormLabel>
                          <FormDescription>
                            Marque se o cliente possui dependentes para adicionar as informações.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.getValues("tem_dependentes") && (
                    <>
                      {form.getValues("dependentes") &&
                        form.getValues("dependentes").map((_, index) => (
                          <div key={index} className="border rounded-md p-4 space-y-4">
                            <h3 className="text-lg font-semibold">Dependente {index + 1}</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`dependentes.${index}.nome`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nome Completo</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Nome completo" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`dependentes.${index}.cpf`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>CPF</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="000.000.000-00"
                                        value={field.value}
                                        onChange={(e) => {
                                          handleDependentCpfChange(e, index)
                                          field.onChange(e)
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`dependentes.${index}.rg`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>RG</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Número do RG" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`dependentes.${index}.orgao_emissor`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Órgão Emissor</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Ex: SSP/SP" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`dependentes.${index}.data_nascimento`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Data de Nascimento</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="date"
                                        {...field}
                                        onChange={(e) => {
                                          field.onChange(e)
                                          // Update idade when date changes
                                          const age = calculateAge(e.target.value)
                                          form.setValue(`dependentes.${index}.idade`, age)
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`dependentes.${index}.idade`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Idade</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Idade" {...field} readOnly />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`dependentes.${index}.cns`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>CNS (Cartão Nacional de Saúde)</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Número do CNS" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`dependentes.${index}.nome_mae`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nome da Mãe</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Nome completo da mãe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`dependentes.${index}.parentesco`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Parentesco</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Ex: Filho(a), Cônjuge" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`dependentes.${index}.sexo`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Sexo</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione o sexo" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="Masculino">Masculino</SelectItem>
                                        <SelectItem value="Feminino">Feminino</SelectItem>
                                        <SelectItem value="Outro">Outro</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`dependentes.${index}.peso`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Peso (kg)</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Peso em kg" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`dependentes.${index}.altura`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Altura (m)</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Altura em metros" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`dependentes.${index}.valor_individual`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Valor Individual</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="R$ 0,00"
                                        value={field.value}
                                        onChange={(e) => {
                                          field.onChange(e)
                                          handleDependentCurrencyChange(e, index)
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`dependentes.${index}.uf_nascimento`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>UF de Nascimento</FormLabel>
                                    <FormControl>
                                      <Input placeholder="UF" maxLength={2} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeDependent(index)}
                              className="mt-2"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remover Dependente
                            </Button>
                          </div>
                        ))}

                      <Button type="button" variant="secondary" onClick={addDependent} className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Dependente
                      </Button>
                    </>
                  )}

                  <div className="flex justify-between mt-6">
                    <Button type="button" variant="outline" onClick={prevTab}>
                      Voltar
                    </Button>
                    <Button type="button" onClick={nextTab} className="bg-[#168979] hover:bg-[#13786a]">
                      Próximo
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="documentos" className="space-y-4">
                  <h2 className="text-lg font-semibold">Documentos do Titular</h2>
                  <p className="text-sm text-muted-foreground">Anexe os documentos digitalizados do titular.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FormField
                        control={form.control}
                        name="rg_frente"
                        render={() => (
                          <FormItem>
                            <FormLabel>RG (Frente)</FormLabel>
                            <FormControl>
                              <Input type="file" accept="image/*" onChange={(e) => handleFileChange("rg_frente", e)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {documentosUpload.rg_frente && (
                        <Alert className="mt-2 bg-green-50 border-green-200">
                          <Check className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            Arquivo RG (Frente) anexado com sucesso!
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div>
                      <FormField
                        control={form.control}
                        name="rg_verso"
                        render={() => (
                          <FormItem>
                            <FormLabel>RG (Verso)</FormLabel>
                            <FormControl>
                              <Input type="file" accept="image/*" onChange={(e) => handleFileChange("rg_verso", e)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {documentosUpload.rg_verso && (
                        <Alert className="mt-2 bg-green-50 border-green-200">
                          <Check className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            Arquivo RG (Verso) anexado com sucesso!
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FormField
                        control={form.control}
                        name="cpf"
                        render={() => (
                          <FormItem>
                            <FormLabel>CPF</FormLabel>
                            <FormControl>
                              <Input type="file" accept="image/*" onChange={(e) => handleFileChange("cpf", e)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {documentosUpload.cpf && (
                        <Alert className="mt-2 bg-green-50 border-green-200">
                          <Check className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            Arquivo CPF anexado com sucesso!
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div>
                      <FormField
                        control={form.control}
                        name="comprovante_residencia"
                        render={() => (
                          <FormItem>
                            <FormLabel>Comprovante de Residência</FormLabel>
                            <FormControl>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange("comprovante_residencia", e)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {documentosUpload.comprovante_residencia && (
                        <Alert className="mt-2 bg-green-50 border-green-200">
                          <Check className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            Arquivo Comprovante de Residência anexado com sucesso!
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="cns"
                      render={() => (
                        <FormItem>
                          <FormLabel>CNS (Cartão Nacional de Saúde)</FormLabel>
                          <FormControl>
                            <Input type="file" accept="image/*" onChange={(e) => handleFileChange("cns", e)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {documentosUpload.cns && (
                      <Alert className="mt-2 bg-green-50 border-green-200">
                        <Check className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">Arquivo CNS anexado com sucesso!</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {form.getValues("tem_dependentes") && (
                    <>
                      <h2 className="text-lg font-semibold mt-8">Documentos dos Dependentes</h2>
                      <p className="text-sm text-muted-foreground">
                        Anexe os documentos digitalizados de cada dependente.
                      </p>

                      {form.getValues("dependentes") &&
                        form.getValues("dependentes").map((_, index) => (
                          <div key={index} className="border rounded-md p-4 space-y-4">
                            <h3 className="text-lg font-semibold">Dependente {index + 1}</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <FormField
                                  control={form.control}
                                  name={`dependentes.${index}.rg_frente`}
                                  render={() => (
                                    <FormItem>
                                      <FormLabel>RG (Frente)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handleDependentFileChange(index, "rg_frente", e)}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                {documentosDependentesUpload[index] && documentosDependentesUpload[index].rg_frente && (
                                  <Alert className="mt-2 bg-green-50 border-green-200">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-800">
                                      Arquivo RG (Frente) do dependente {index + 1} anexado com sucesso!
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>

                              <div>
                                <FormField
                                  control={form.control}
                                  name={`dependentes.${index}.rg_verso`}
                                  render={() => (
                                    <FormItem>
                                      <FormLabel>RG (Verso)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handleDependentFileChange(index, "rg_verso", e)}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                {documentosDependentesUpload[index] && documentosDependentesUpload[index].rg_verso && (
                                  <Alert className="mt-2 bg-green-50 border-green-200">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-800">
                                      Arquivo RG (Verso) do dependente {index + 1} anexado com sucesso!
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <FormField
                                  control={form.control}
                                  name={`dependentes.${index}.cpf`}
                                  render={() => (
                                    <FormItem>
                                      <FormLabel>CPF</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handleDependentFileChange(index, "cpf", e)}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                {documentosDependentesUpload[index] && documentosDependentesUpload[index].cpf && (
                                  <Alert className="mt-2 bg-green-50 border-green-200">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-800">
                                      Arquivo CPF do dependente {index + 1} anexado com sucesso!
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>

                              <div>
                                <FormField
                                  control={form.control}
                                  name={`dependentes.${index}.cns`}
                                  render={() => (
                                    <FormItem>
                                      <FormLabel>CNS (Cartão Nacional de Saúde)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handleDependentFileChange(index, "cns", e)}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                {documentosDependentesUpload[index] && documentosDependentesUpload[index].cns && (
                                  <Alert className="mt-2 bg-green-50 border-green-200">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-800">
                                      Arquivo CNS do dependente {index + 1} anexado com sucesso!
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </>
                  )}

                  <div className="flex justify-between mt-6">
                    <Button type="button" variant="outline" onClick={prevTab}>
                      Voltar
                    </Button>
                    <Button type="submit" className="bg-[#168979] hover:bg-[#13786a]" disabled={enviando}>
                      {enviando ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Criar Proposta
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </CardContent>
      </Card>

      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} data={successData} />
    </div>
  )
}
