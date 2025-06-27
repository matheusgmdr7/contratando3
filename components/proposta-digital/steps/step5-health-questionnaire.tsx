"use client"

import { useState, useEffect } from "react"
import { useFormContext } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Heart, AlertTriangle, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react"
import { healthQuestions } from "@/data/health-questions"

interface Step5HealthQuestionnaireProps {
  onNext: () => void
  onBack: () => void
}

export default function Step5HealthQuestionnaire({ onNext, onBack }: Step5HealthQuestionnaireProps) {
  const {
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [respostas, setRespostas] = useState<Record<number, { resposta: string; detalhes?: string }>>({})
  const [mostrarResumo, setMostrarResumo] = useState(false)

  const dependentes = watch("dependentes") || []
  const temDependentes = watch("tem_dependentes")
  const [pessoaAtual, setPessoaAtual] = useState(0) // 0 = titular, 1+ = dependentes
  const [questionarioCompleto, setQuestionarioCompleto] = useState<
    Record<number, Record<number, { resposta: string; detalhes?: string }>>
  >({})

  const totalPessoas = 1 + (temDependentes ? dependentes.length : 0)
  const currentQuestion = healthQuestions[currentQuestionIndex]
  const totalQuestions = healthQuestions.length
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100

  const pessoaAtualNome =
    pessoaAtual === 0 ? "Titular" : `Dependente ${pessoaAtual}: ${dependentes[pessoaAtual - 1]?.nome || "Sem nome"}`

  useEffect(() => {
    // Inicializar questionário para todas as pessoas
    const questionarioInicial: Record<number, Record<number, { resposta: string; detalhes?: string }>> = {}
    for (let pessoa = 0; pessoa < totalPessoas; pessoa++) {
      questionarioInicial[pessoa] = {}
    }
    setQuestionarioCompleto(questionarioInicial)
  }, [totalPessoas])

  const handleResposta = (questionId: number, resposta: string) => {
    const novoQuestionario = { ...questionarioCompleto }
    if (!novoQuestionario[pessoaAtual]) {
      novoQuestionario[pessoaAtual] = {}
    }
    novoQuestionario[pessoaAtual][questionId] = { resposta, detalhes: "" }
    setQuestionarioCompleto(novoQuestionario)
  }

  const handleDetalhes = (questionId: number, detalhes: string) => {
    const novoQuestionario = { ...questionarioCompleto }
    if (novoQuestionario[pessoaAtual] && novoQuestionario[pessoaAtual][questionId]) {
      novoQuestionario[pessoaAtual][questionId].detalhes = detalhes
    }
    setQuestionarioCompleto(novoQuestionario)
  }

  const proximaPergunta = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Terminou as perguntas para a pessoa atual
      if (pessoaAtual < totalPessoas - 1) {
        // Próxima pessoa
        setPessoaAtual(pessoaAtual + 1)
        setCurrentQuestionIndex(0)
      } else {
        // Terminou para todas as pessoas
        setMostrarResumo(true)
      }
    }
  }

  const perguntaAnterior = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else if (pessoaAtual > 0) {
      // Voltar para a pessoa anterior
      setPessoaAtual(pessoaAtual - 1)
      setCurrentQuestionIndex(totalQuestions - 1)
    }
  }

  const finalizarQuestionario = () => {
    // Salvar todas as respostas no formulário
    setValue("questionario_saude", questionarioCompleto)
    onNext()
  }

  const respostaAtual = questionarioCompleto[pessoaAtual]?.[currentQuestion.id]
  const temResposta = respostaAtual?.resposta
  const precisaDetalhes = respostaAtual?.resposta === "sim"

  const contarRespostasPositivas = () => {
    let total = 0
    Object.values(questionarioCompleto).forEach((pessoa) => {
      Object.values(pessoa).forEach((resposta) => {
        if (resposta.resposta === "sim") total++
      })
    })
    return total
  }

  if (mostrarResumo) {
    const respostasPositivas = contarRespostasPositivas()

    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Questionário de Saúde Concluído</h2>
          <p className="text-gray-600">Todas as perguntas foram respondidas com sucesso</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resumo das Respostas</CardTitle>
            <CardDescription>Confira o resumo antes de prosseguir</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{totalPessoas}</div>
                <div className="text-sm text-blue-600">Pessoas Avaliadas</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{totalQuestions * totalPessoas}</div>
                <div className="text-sm text-green-600">Perguntas Respondidas</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{respostasPositivas}</div>
                <div className="text-sm text-orange-600">Respostas Positivas</div>
              </div>
            </div>

            {respostasPositivas > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Foram identificadas {respostasPositivas} respostas positivas que podem requerer análise médica
                  adicional. Isso é normal e não impede o prosseguimento da proposta.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              {Array.from({ length: totalPessoas }, (_, index) => {
                const nome = index === 0 ? "Titular" : `Dependente: ${dependentes[index - 1]?.nome || "Sem nome"}`
                const respostasPessoa = questionarioCompleto[index] || {}
                const positivasPessoa = Object.values(respostasPessoa).filter((r) => r.resposta === "sim").length

                return (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{nome}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{totalQuestions} perguntas</span>
                      {positivasPessoa > 0 && (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                          {positivasPessoa} positivas
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setMostrarResumo(false)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Revisar Respostas
          </Button>
          <Button onClick={finalizarQuestionario}>
            Continuar para Documentos
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com progresso */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Heart className="h-6 w-6 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">Declaração de Saúde</h2>
        </div>
        <p className="text-gray-600 mb-4">
          {pessoaAtualNome} - Pergunta {currentQuestionIndex + 1} de {totalQuestions}
        </p>
        <Progress value={progress} className="w-full max-w-md mx-auto" />
      </div>

      {/* Indicador de pessoas */}
      {totalPessoas > 1 && (
        <div className="flex justify-center space-x-2 mb-6">
          {Array.from({ length: totalPessoas }, (_, index) => (
            <div
              key={index}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                index === pessoaAtual
                  ? "bg-blue-600 text-white"
                  : index < pessoaAtual
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {index === 0 ? "Titular" : `Dep. ${index}`}
            </div>
          ))}
        </div>
      )}

      {/* Pergunta atual */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
          <CardDescription>
            Responda com sinceridade. Informações incorretas podem invalidar o contrato.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Opções de resposta */}
          <RadioGroup
            value={respostaAtual?.resposta || ""}
            onValueChange={(value) => handleResposta(currentQuestion.id, value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id="nao" />
              <Label htmlFor="nao" className="cursor-pointer">
                Não
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id="sim" />
              <Label htmlFor="sim" className="cursor-pointer">
                Sim
              </Label>
            </div>
          </RadioGroup>

          {/* Campo de detalhes se resposta for "sim" */}
          {precisaDetalhes && (
            <div className="space-y-2">
              <Label htmlFor="detalhes">Por favor, forneça mais detalhes sobre sua resposta:</Label>
              <Textarea
                id="detalhes"
                placeholder="Descreva sua condição, quando foi diagnosticada, tratamentos realizados, etc."
                value={respostaAtual?.detalhes || ""}
                onChange={(e) => handleDetalhes(currentQuestion.id, e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navegação */}
      <div className="flex justify-between max-w-2xl mx-auto">
        <Button variant="outline" onClick={perguntaAnterior} disabled={currentQuestionIndex === 0 && pessoaAtual === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={onBack}>
            Voltar ao Passo Anterior
          </Button>
          <Button
            onClick={proximaPergunta}
            disabled={!temResposta || (precisaDetalhes && !respostaAtual?.detalhes?.trim())}
          >
            {currentQuestionIndex === totalQuestions - 1 && pessoaAtual === totalPessoas - 1
              ? "Finalizar Questionário"
              : "Próxima"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Informação sobre obrigatoriedade */}
      <Alert className="max-w-2xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> A declaração de saúde é obrigatória e deve ser preenchida com veracidade.
          Informações falsas podem resultar na negativa de cobertura ou cancelamento do contrato.
        </AlertDescription>
      </Alert>
    </div>
  )
}
