"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Mail, Play, Bug } from "lucide-react"
import {
  enviarEmailPropostaCliente,
  enviarEmailPropostaCompletada,
  verificarServicoEmail,
  testeRapidoEdgeFunction,
  debugEnvioEmail,
} from "@/services/email-service"

export default function TestarEmailCorrigidoPage() {
  const [statusServico, setStatusServico] = useState<any>(null)
  const [testeRapido, setTesteRapido] = useState<boolean | null>(null)
  const [testeEmailCliente, setTesteEmailCliente] = useState<any>(null)
  const [testeEmailCorretor, setTesteEmailCorretor] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Dados do formulário
  const [emailCliente, setEmailCliente] = useState("cliente@exemplo.com")
  const [nomeCliente, setNomeCliente] = useState("João Silva")
  const [nomeCorretor, setNomeCorretor] = useState("Maria Santos")
  const [linkProposta, setLinkProposta] = useState("https://exemplo.com/proposta/123")
  const [emailCorretor, setEmailCorretor] = useState("corretor@exemplo.com")

  const verificarStatus = async () => {
    setLoading(true)
    try {
      const status = await verificarServicoEmail()
      setStatusServico(status)
    } catch (error) {
      setStatusServico({
        disponivel: false,
        detalhes: `Erro: ${error.message}`,
        ambiente: "erro",
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

  const testarEmailCliente = async () => {
    setLoading(true)
    try {
      console.log("🧪 Testando envio para cliente...")
      const sucesso = await enviarEmailPropostaCliente(emailCliente, nomeCliente, linkProposta, nomeCorretor)
      setTesteEmailCliente({
        sucesso,
        timestamp: new Date().toLocaleString("pt-BR"),
        dados: { emailCliente, nomeCliente, linkProposta, nomeCorretor },
      })
    } catch (error) {
      setTesteEmailCliente({
        sucesso: false,
        erro: error.message,
        timestamp: new Date().toLocaleString("pt-BR"),
      })
    } finally {
      setLoading(false)
    }
  }

  const testarEmailCorretor = async () => {
    setLoading(true)
    try {
      console.log("🧪 Testando envio para corretor...")
      const sucesso = await enviarEmailPropostaCompletada(emailCorretor, nomeCorretor, nomeCliente, "PROP-123")
      setTesteEmailCorretor({
        sucesso,
        timestamp: new Date().toLocaleString("pt-BR"),
        dados: { emailCorretor, nomeCorretor, nomeCliente, proposta: "PROP-123" },
      })
    } catch (error) {
      setTesteEmailCorretor({
        sucesso: false,
        erro: error.message,
        timestamp: new Date().toLocaleString("pt-BR"),
      })
    } finally {
      setLoading(false)
    }
  }

  const executarDebugCompleto = async () => {
    setLoading(true)
    try {
      await debugEnvioEmail()
      console.log("✅ Debug completo executado - verifique o console")
    } catch (error) {
      console.error("❌ Erro no debug:", error)
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
        <h1 className="text-2xl font-bold mb-2">Teste de Email - Versão Corrigida</h1>
        <p className="text-muted-foreground">
          Teste do serviço de email com o nome correto da Edge Function: <code>resend-email</code>
        </p>
      </div>

      {/* Alerta de Correção */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Correção Aplicada</AlertTitle>
        <AlertDescription>
          <strong>Problema identificado:</strong> Nome da Edge Function estava incorreto
          <br />
          <strong>Correção:</strong> Alterado de <code>enviar-email</code> para <code>resend-email</code>
          <br />
          <strong>URL correta:</strong> <code>https://jtzbuxoslaotpnwsphqv.supabase.co/functions/v1/resend-email</code>
        </AlertDescription>
      </Alert>

      {/* Status do Serviço */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <RefreshCw className="h-5 w-5 mr-2" />
            Status do Serviço
          </CardTitle>
          <CardDescription>Verificação do status atual da Edge Function</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button onClick={verificarStatus} disabled={loading}>
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Verificar Status
              </Button>
              <Button onClick={executarTesteRapido} disabled={loading} variant="outline">
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                Teste Rápido
              </Button>
            </div>

            {statusServico && (
              <Alert variant={statusServico.disponivel ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  Status do Serviço
                  <StatusBadge sucesso={statusServico.disponivel} texto={statusServico.disponivel ? "OK" : "Falha"} />
                </AlertTitle>
                <AlertDescription>
                  <strong>Ambiente:</strong> {statusServico.ambiente}
                  <br />
                  <strong>Detalhes:</strong> {statusServico.detalhes}
                </AlertDescription>
              </Alert>
            )}

            {testeRapido !== null && (
              <Alert variant={testeRapido ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  Teste Rápido
                  <StatusBadge sucesso={testeRapido} texto={testeRapido ? "Sucesso" : "Falha"} />
                </AlertTitle>
                <AlertDescription>
                  {testeRapido
                    ? "A Edge Function está acessível e respondendo"
                    : "A Edge Function não está acessível ou tem problemas"}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuração dos Testes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configuração dos Testes</CardTitle>
          <CardDescription>Configure os dados para os testes de envio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emailCliente">Email do Cliente</Label>
              <Input
                id="emailCliente"
                value={emailCliente}
                onChange={(e) => setEmailCliente(e.target.value)}
                placeholder="cliente@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomeCliente">Nome do Cliente</Label>
              <Input
                id="nomeCliente"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                placeholder="João Silva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomeCorretor">Nome do Corretor</Label>
              <Input
                id="nomeCorretor"
                value={nomeCorretor}
                onChange={(e) => setNomeCorretor(e.target.value)}
                placeholder="Maria Santos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailCorretor">Email do Corretor</Label>
              <Input
                id="emailCorretor"
                value={emailCorretor}
                onChange={(e) => setEmailCorretor(e.target.value)}
                placeholder="corretor@exemplo.com"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="linkProposta">Link da Proposta</Label>
              <Input
                id="linkProposta"
                value={linkProposta}
                onChange={(e) => setLinkProposta(e.target.value)}
                placeholder="https://exemplo.com/proposta/123"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testes de Envio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Teste Email Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Teste Email Cliente
            </CardTitle>
            <CardDescription>Simula o envio de email para o cliente com link da proposta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={testarEmailCliente} disabled={loading} className="w-full">
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                Testar Email Cliente
              </Button>

              {testeEmailCliente && (
                <Alert variant={testeEmailCliente.sucesso ? "default" : "destructive"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>
                    Resultado
                    <StatusBadge
                      sucesso={testeEmailCliente.sucesso}
                      texto={testeEmailCliente.sucesso ? "Enviado" : "Falha"}
                    />
                  </AlertTitle>
                  <AlertDescription>
                    <strong>Timestamp:</strong> {testeEmailCliente.timestamp}
                    <br />
                    {testeEmailCliente.erro && (
                      <>
                        <strong>Erro:</strong> {testeEmailCliente.erro}
                        <br />
                      </>
                    )}
                    <strong>Dados:</strong> {JSON.stringify(testeEmailCliente.dados, null, 2)}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Teste Email Corretor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Teste Email Corretor
            </CardTitle>
            <CardDescription>Simula o envio de confirmação para o corretor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={testarEmailCorretor} disabled={loading} className="w-full">
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                Testar Email Corretor
              </Button>

              {testeEmailCorretor && (
                <Alert variant={testeEmailCorretor.sucesso ? "default" : "destructive"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>
                    Resultado
                    <StatusBadge
                      sucesso={testeEmailCorretor.sucesso}
                      texto={testeEmailCorretor.sucesso ? "Enviado" : "Falha"}
                    />
                  </AlertTitle>
                  <AlertDescription>
                    <strong>Timestamp:</strong> {testeEmailCorretor.timestamp}
                    <br />
                    {testeEmailCorretor.erro && (
                      <>
                        <strong>Erro:</strong> {testeEmailCorretor.erro}
                        <br />
                      </>
                    )}
                    <strong>Dados:</strong> {JSON.stringify(testeEmailCorretor.dados, null, 2)}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debug Completo */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bug className="h-5 w-5 mr-2" />
            Debug Completo
          </CardTitle>
          <CardDescription>Executa debug completo com logs detalhados no console</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={executarDebugCompleto} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Bug className="h-4 w-4 mr-2" />}
            Executar Debug Completo
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Os logs detalhados aparecerão no console do navegador (F12)
          </p>
        </CardContent>
      </Card>

      <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-2">💡 Como usar esta ferramenta:</h3>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          <li>
            <strong>Verificar Status:</strong> Confirma se a Edge Function está acessível
          </li>
          <li>
            <strong>Teste Rápido:</strong> Faz uma verificação básica de conectividade
          </li>
          <li>
            <strong>Configurar Dados:</strong> Ajuste os emails e nomes para os testes
          </li>
          <li>
            <strong>Testar Envios:</strong> Execute os testes de email para cliente e corretor
          </li>
          <li>
            <strong>Debug Completo:</strong> Se houver problemas, execute o debug e verifique o console (F12)
          </li>
        </ol>
      </div>
    </div>
  )
}
