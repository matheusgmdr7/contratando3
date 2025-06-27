"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"
import { testarConexaoSupabase, verificarChavesAPI, getSupabaseEnv } from "@/lib/supabase"

export default function VerificarSupabasePage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [resultado, setResultado] = useState<any>(null)
  const [env, setEnv] = useState<any>(null)

  useEffect(() => {
    // Obter variáveis de ambiente ao carregar a página
    const supabaseEnv = getSupabaseEnv()
    setEnv(supabaseEnv)
  }, [])

  const handleTestarConexao = async () => {
    try {
      setStatus("loading")

      // Testar conexão com Supabase
      const sucesso = await testarConexaoSupabase()

      // Verificar chaves de API
      const resultadoChaves = await verificarChavesAPI()

      setResultado({
        conexao: sucesso,
        chaves: resultadoChaves,
      })

      setStatus(sucesso ? "success" : "error")
    } catch (error) {
      console.error("Erro ao testar conexão:", error)
      setResultado({
        conexao: false,
        erro: error instanceof Error ? error.message : "Erro desconhecido",
      })
      setStatus("error")
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Verificar Configuração do Supabase</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Variáveis de Ambiente</CardTitle>
            <CardDescription>Configurações atuais do Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            {env ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">URL:</div>
                  <div className="font-mono text-sm break-all">{env.url}</div>

                  <div className="font-medium">Chave:</div>
                  <div className="font-mono text-sm">{env.key ? env.key.substring(0, 20) + "..." : "Não definida"}</div>

                  <div className="font-medium">Usando valores padrão:</div>
                  <div>{env.isUsingDefaults ? "Sim" : "Não"}</div>
                </div>

                {env.isUsingDefaults && (
                  <Alert variant="warning" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Atenção</AlertTitle>
                    <AlertDescription>
                      O sistema está usando valores padrão para as variáveis de ambiente do Supabase. Para um ambiente
                      de produção, configure as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e
                      NEXT_PUBLIC_SUPABASE_ANON_KEY.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="text-center py-4">Carregando informações...</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teste de Conexão</CardTitle>
            <CardDescription>Verifique se a conexão com o Supabase está funcionando</CardDescription>
          </CardHeader>
          <CardContent>
            {status === "idle" && (
              <div className="text-center py-4">Clique no botão abaixo para testar a conexão com o Supabase</div>
            )}

            {status === "loading" && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-2">Testando conexão...</span>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <Alert variant="success">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Conexão estabelecida com sucesso!</AlertTitle>
                  <AlertDescription>A conexão com o Supabase está funcionando corretamente.</AlertDescription>
                </Alert>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Detalhes:</h3>
                  <pre className="text-xs overflow-auto p-2 bg-white border rounded">
                    {JSON.stringify(resultado, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Erro de conexão</AlertTitle>
                  <AlertDescription>
                    Não foi possível estabelecer conexão com o Supabase. Verifique as configurações.
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Detalhes do erro:</h3>
                  <pre className="text-xs overflow-auto p-2 bg-white border rounded">
                    {JSON.stringify(resultado, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleTestarConexao} disabled={status === "loading"} className="w-full">
              {status === "loading" ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                "Testar Conexão"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
