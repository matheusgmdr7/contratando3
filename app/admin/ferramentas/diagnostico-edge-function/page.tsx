"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Play, Search, Settings } from "lucide-react"
import {
  diagnosticarEdgeFunction,
  enviarEmailComDiagnostico,
  testeRapidoEdgeFunction,
} from "@/services/email-service-debug"
import { diagnosticoAvancadoEdgeFunction, testarFuncaoEncontrada } from "@/services/email-service-debug-avancado"

export default function DiagnosticoEdgeFunctionPage() {
  const [diagnostico, setDiagnostico] = useState<any>(null)
  const [diagnosticoAvancado, setDiagnosticoAvancado] = useState<any>(null)
  const [testeEmail, setTesteEmail] = useState<any>(null)
  const [testeFuncao, setTesteFuncao] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [testeRapido, setTesteRapido] = useState<boolean | null>(null)

  const executarDiagnostico = async () => {
    setLoading(true)
    try {
      console.log("🔍 Executando diagnóstico completo...")
      const resultado = await diagnosticarEdgeFunction()
      setDiagnostico(resultado)
    } catch (error) {
      console.error("Erro no diagnóstico:", error)
      setDiagnostico({
        erro: error.message,
        resumo: "❌ Erro ao executar diagnóstico",
      })
    } finally {
      setLoading(false)
    }
  }

  const executarDiagnosticoAvancado = async () => {
    setLoading(true)
    try {
      console.log("🔍 Executando diagnóstico avançado...")
      const resultado = await diagnosticoAvancadoEdgeFunction()
      setDiagnosticoAvancado(resultado)
    } catch (error) {
      console.error("Erro no diagnóstico avançado:", error)
      setDiagnosticoAvancado({
        erro: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const testarEnvioEmail = async () => {
    setLoading(true)
    try {
      console.log("📧 Testando envio de email...")
      const resultado = await enviarEmailComDiagnostico(
        "teste@exemplo.com",
        "João Teste",
        "https://exemplo.com/proposta/123",
        "Maria Corretora",
      )
      setTesteEmail(resultado)
    } catch (error) {
      console.error("Erro no teste de email:", error)
      setTesteEmail({
        sucesso: false,
        erro: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const executarTesteFuncao = async () => {
    setLoading(true)
    try {
      console.log("🔍 Testando função encontrada...")
      const resultado = await testarFuncaoEncontrada()
      setTesteFuncao(resultado)
    } catch (error) {
      console.error("Erro no teste da função:", error)
      setTesteFuncao({
        sucesso: false,
        erro: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const executarTesteRapido = async () => {
    setLoading(true)
    try {
      const resultado = await testeRapidoEdgeFunction()
      setTesteRapido(resultado)
    } catch (error) {
      setTesteRapido(false)
    } finally {
      setLoading(false)
    }
  }

  const StatusBadge = ({ sucesso, texto }: { sucesso: boolean; texto: string }) => (
    <Badge variant={sucesso ? "default" : "destructive"} className="ml-2">
      {sucesso ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
      {texto}
    </Badge>
  )

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Diagnóstico Avançado da Edge Function</h1>
        <p className="text-muted-foreground">
          Ferramenta especializada para identificar problemas específicos de CORS, nomes de função e headers
        </p>
      </div>

      {/* Alerta baseado no diagnóstico anterior */}
      <Alert className="mb-6" variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Problema Identificado</AlertTitle>
        <AlertDescription>
          <strong>Conectividade Supabase:</strong> ✅ OK
          <br />
          <strong>Edge Function:</strong> ❌ "Failed to fetch" - Problema de CORS ou nome da função
          <br />
          <strong>Próximo passo:</strong> Execute o diagnóstico avançado abaixo
        </AlertDescription>
      </Alert>

      {/* Diagnóstico Avançado */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Diagnóstico Avançado
          </CardTitle>
          <CardDescription>Testa diferentes nomes de função, headers e problemas de CORS</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={executarDiagnosticoAvancado} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Executar Diagnóstico Avançado
            </Button>

            {diagnosticoAvancado && (
              <div className="space-y-4">
                {/* Recomendações */}
                {diagnosticoAvancado.recomendacoes && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Recomendações</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-5 space-y-1 mt-2">
                        {diagnosticoAvancado.recomendacoes.map((rec: string, index: number) => (
                          <li key={index} className="text-sm">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Próximos Passos */}
                {diagnosticoAvancado.proximosPasso && diagnosticoAvancado.proximosPasso.length > 0 && (
                  <Alert>
                    <Settings className="h-4 w-4" />
                    <AlertTitle>Próximos Passos</AlertTitle>
                    <AlertDescription>
                      <ol className="list-decimal pl-5 space-y-1 mt-2">
                        {diagnosticoAvancado.proximosPasso.map((passo: string, index: number) => (
                          <li key={index} className="text-sm">
                            {passo}
                          </li>
                        ))}
                      </ol>
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                {/* Resultados Detalhados */}
                <div className="grid gap-4">
                  {/* Teste de Nomes */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      Teste de Nomes de Função
                      {diagnosticoAvancado.nomes?.funcaoEncontrada && (
                        <StatusBadge
                          sucesso={true}
                          texto={`Encontrada: ${diagnosticoAvancado.nomes.funcaoEncontrada}`}
                        />
                      )}
                    </h4>
                    <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(diagnosticoAvancado.nomes, null, 2)}
                    </pre>
                  </div>

                  {/* Teste de Headers */}
                  {diagnosticoAvancado.headers && (
                    <div>
                      <h4 className="font-medium mb-2">Teste de Headers</h4>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                        {JSON.stringify(diagnosticoAvancado.headers, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Teste de CORS */}
                  {diagnosticoAvancado.cors && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center">
                        Teste de CORS
                        <StatusBadge
                          sucesso={diagnosticoAvancado.cors.corsSuportado}
                          texto={diagnosticoAvancado.cors.corsSuportado ? "CORS OK" : "CORS Problema"}
                        />
                      </h4>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                        {JSON.stringify(diagnosticoAvancado.cors, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Teste da Função Encontrada */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Play className="h-5 w-5 mr-2" />
            Teste da Função Encontrada
          </CardTitle>
          <CardDescription>Se uma função for encontrada, testa o envio real com payload completo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={executarTesteFuncao} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Testar Função Encontrada
            </Button>

            {testeFuncao && (
              <div className="space-y-4">
                <Alert variant={testeFuncao.sucesso ? "default" : "destructive"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>
                    {testeFuncao.sucesso ? "Sucesso" : "Falha"}
                    {testeFuncao.nomeFuncao && ` - Função: ${testeFuncao.nomeFuncao}`}
                  </AlertTitle>
                  <AlertDescription>
                    {testeFuncao.sucesso
                      ? "A Edge Function está funcionando corretamente!"
                      : "A Edge Function foi encontrada mas falhou no processamento"}
                  </AlertDescription>
                </Alert>

                <div>
                  <h4 className="font-medium mb-2">Detalhes do Teste:</h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(testeFuncao.detalhes, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-2">🔍 Como interpretar os resultados:</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            <strong>Status 404:</strong> Função não existe com esse nome
          </li>
          <li>
            <strong>Status 500:</strong> Função existe mas tem erro interno
          </li>
          <li>
            <strong>Status 200:</strong> Função funcionando corretamente
          </li>
          <li>
            <strong>"Failed to fetch":</strong> Problema de CORS ou rede
          </li>
          <li>
            <strong>CORS:</strong> Verifique se a função permite requisições do seu domínio
          </li>
        </ul>
      </div>
    </div>
  )
}
