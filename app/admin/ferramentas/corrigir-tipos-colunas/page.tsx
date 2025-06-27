"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import { AlertCircle, CheckCircle, Database, Settings, Copy, Play } from "lucide-react"
import { toast } from "sonner"

interface TipoColuna {
  column_name: string
  data_type: string
  character_maximum_length: number | null
  is_nullable: string
  column_default: string | null
  tipo_recomendado: string
  motivo: string
  precisa_correcao: boolean
}

export default function CorrigirTiposColunasPage() {
  const [carregando, setCarregando] = useState(false)
  const [analisando, setAnalisando] = useState(false)
  const [tiposAtuais, setTiposAtuais] = useState<TipoColuna[]>([])
  const [scriptGerado, setScriptGerado] = useState("")
  const [resultadoTeste, setResultadoTeste] = useState<any>(null)

  const camposEsperados = {
    nome_cliente: { tipo: "VARCHAR(255)", motivo: "Nome completo do cliente" },
    email: { tipo: "VARCHAR(255)", motivo: "Email do cliente" },
    cpf: { tipo: "VARCHAR(11)", motivo: "CPF sem formatação (apenas números)" },
    telefone: { tipo: "VARCHAR(20)", motivo: "Telefone com formatação" },
    endereco: { tipo: "VARCHAR(500)", motivo: "Endereço completo" },
    numero: { tipo: "VARCHAR(10)", motivo: "Número do endereço" },
    complemento: { tipo: "VARCHAR(100)", motivo: "Complemento do endereço" },
    bairro: { tipo: "VARCHAR(100)", motivo: "Bairro" },
    cidade: { tipo: "VARCHAR(100)", motivo: "Cidade" },
    estado: { tipo: "VARCHAR(2)", motivo: "UF do estado" },
    cep: { tipo: "VARCHAR(9)", motivo: "CEP com formatação" },
    rg: { tipo: "VARCHAR(20)", motivo: "RG do cliente" },
    orgao_emissor: { tipo: "VARCHAR(10)", motivo: "Órgão emissor do RG" },
    cns: { tipo: "VARCHAR(15)", motivo: "Cartão Nacional de Saúde" },
    nome_mae: { tipo: "VARCHAR(255)", motivo: "Nome completo da mãe" },
    sexo: { tipo: "VARCHAR(10)", motivo: "Sexo do cliente" },
    data_nascimento: { tipo: "DATE", motivo: "Data de nascimento" },
    cobertura: { tipo: "VARCHAR(20)", motivo: "Tipo de cobertura" },
    acomodacao: { tipo: "VARCHAR(20)", motivo: "Tipo de acomodação" },
    codigo_plano: { tipo: "VARCHAR(50)", motivo: "Código/sigla do plano" },
    observacoes: { tipo: "TEXT", motivo: "Observações gerais" },
    tem_dependentes: { tipo: "BOOLEAN", motivo: "Flag se tem dependentes" },
    quantidade_dependentes: { tipo: "INTEGER", motivo: "Número de dependentes" },
    template_id: { tipo: "UUID", motivo: "ID do template usado" },
    tabela_id: { tipo: "VARCHAR(50)", motivo: "ID da tabela de preços" },
    produto_id: { tipo: "VARCHAR(50)", motivo: "ID do produto" },
  }

  const analisarTiposAtuais = async () => {
    setAnalisando(true)
    try {
      console.log("🔍 ANALISANDO TIPOS DE COLUNAS DA TABELA 'propostas'")

      // Buscar informações das colunas
      const { data, error } = await supabase.rpc("get_table_columns", {
        table_name: "propostas",
      })

      if (error) {
        // Se a função RPC não existir, usar uma consulta alternativa
        console.log("Função RPC não encontrada, usando consulta direta...")

        const query = `
          SELECT 
            column_name,
            data_type,
            character_maximum_length,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'propostas' 
          ORDER BY ordinal_position
        `

        const { data: colunas, error: queryError } = await supabase.rpc("execute_sql", { query })

        if (queryError) {
          throw new Error("Não foi possível consultar a estrutura da tabela")
        }

        // Processar dados e comparar com tipos esperados
        const tiposAnalisados: TipoColuna[] = []

        for (const [nomeColuna, config] of Object.entries(camposEsperados)) {
          const colunaAtual = colunas?.find((c: any) => c.column_name === nomeColuna)

          if (colunaAtual) {
            const tipoAtual = colunaAtual.data_type.toUpperCase()
            const tipoEsperado = config.tipo.toUpperCase()
            const precisaCorrecao = !tipoAtual.includes(tipoEsperado.split("(")[0])

            tiposAnalisados.push({
              column_name: nomeColuna,
              data_type: colunaAtual.data_type,
              character_maximum_length: colunaAtual.character_maximum_length,
              is_nullable: colunaAtual.is_nullable,
              column_default: colunaAtual.column_default,
              tipo_recomendado: config.tipo,
              motivo: config.motivo,
              precisa_correcao: precisaCorrecao,
            })
          } else {
            // Coluna não existe
            tiposAnalisados.push({
              column_name: nomeColuna,
              data_type: "NÃO EXISTE",
              character_maximum_length: null,
              is_nullable: "YES",
              column_default: null,
              tipo_recomendado: config.tipo,
              motivo: config.motivo,
              precisa_correcao: true,
            })
          }
        }

        setTiposAtuais(tiposAnalisados)
        gerarScriptCorrecao(tiposAnalisados)
        toast.success("Análise concluída!")
      }
    } catch (error) {
      console.error("Erro na análise:", error)
      toast.error("Erro ao analisar tipos de colunas: " + error.message)
    } finally {
      setAnalisando(false)
    }
  }

  const gerarScriptCorrecao = (tipos: TipoColuna[]) => {
    const tiposProblematicos = tipos.filter((t) => t.precisa_correcao)

    let script = `-- Script de Correção de Tipos de Colunas
-- Gerado automaticamente em ${new Date().toLocaleString()}
-- Execute este script no Supabase SQL Editor

-- BACKUP: Faça backup da tabela antes de executar
-- CREATE TABLE propostas_backup AS SELECT * FROM propostas;

`

    // Alterações de tipo
    script += "-- 1. CORRIGIR TIPOS DE COLUNAS EXISTENTES\n"
    tiposProblematicos
      .filter((t) => t.data_type !== "NÃO EXISTE")
      .forEach((tipo) => {
        script += `-- ${tipo.motivo}\n`
        script += `ALTER TABLE propostas ALTER COLUMN ${tipo.column_name} TYPE ${tipo.tipo_recomendado};\n\n`
      })

    // Adição de colunas
    script += "-- 2. ADICIONAR COLUNAS FALTANTES\n"
    tiposProblematicos
      .filter((t) => t.data_type === "NÃO EXISTE")
      .forEach((tipo) => {
        script += `-- ${tipo.motivo}\n`
        script += `DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas' AND column_name = '${tipo.column_name}'
    ) THEN
        ALTER TABLE propostas ADD COLUMN ${tipo.column_name} ${tipo.tipo_recomendado};
    END IF;
END $$;

`
      })

    // Teste de inserção
    script += `-- 3. TESTE DE INSERÇÃO
-- Teste para verificar se os tipos estão corretos
INSERT INTO propostas (
    nome_cliente, email, cpf, telefone, endereco, numero, complemento,
    bairro, cidade, estado, cep, rg, orgao_emissor, cns, nome_mae,
    sexo, data_nascimento, cobertura, acomodacao, codigo_plano,
    observacoes, tem_dependentes, quantidade_dependentes, status, created_at
) VALUES (
    'Teste Correção Tipos',
    'teste@email.com',
    '12345678901',
    '(11) 99999-9999',
    'Rua Teste, 123',
    '123',
    'Apto 1',
    'Centro',
    'São Paulo',
    'SP',
    '01234-567',
    '123456789',
    'SSP/SP',
    '123456789012345',
    'Mãe Teste',
    'Masculino',
    '1990-01-01',
    'Nacional',
    'Apartamento',
    'TESTE-001',
    'Teste após correção de tipos',
    true,
    1,
    'teste_tipos',
    NOW()
);

-- Verificar inserção
SELECT * FROM propostas WHERE status = 'teste_tipos' ORDER BY created_at DESC LIMIT 1;

-- Limpar teste
DELETE FROM propostas WHERE status = 'teste_tipos';

-- 4. VERIFICAR RESULTADO FINAL
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'propostas' 
ORDER BY ordinal_position;
`

    setScriptGerado(script)
  }

  const copiarScript = () => {
    if (navigator.clipboard && scriptGerado) {
      navigator.clipboard.writeText(scriptGerado)
      toast.success("Script copiado para clipboard!")
    }
  }

  const testarInsercao = async () => {
    setCarregando(true)
    try {
      console.log("🧪 TESTANDO INSERÇÃO COM TIPOS CORRIGIDOS")

      const dadosTeste = {
        nome_cliente: "Teste Inserção Tipos",
        email: "teste.tipos@email.com",
        cpf: "12345678901",
        telefone: "(11) 99999-9999",
        endereco: "Rua Teste Tipos, 123",
        numero: "123",
        complemento: "Apto 1",
        bairro: "Centro",
        cidade: "São Paulo",
        estado: "SP",
        cep: "01234-567",
        rg: "123456789",
        orgao_emissor: "SSP/SP",
        cns: "123456789012345",
        nome_mae: "Mãe Teste Tipos",
        sexo: "Masculino",
        data_nascimento: "1990-01-01",
        cobertura: "Nacional",
        acomodacao: "Apartamento",
        codigo_plano: "TESTE-TIPOS",
        observacoes: "Teste de inserção após correção de tipos",
        tem_dependentes: true,
        quantidade_dependentes: 1,
        status: "teste_tipos_app",
        created_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("propostas").insert([dadosTeste]).select().single()

      if (error) {
        console.error("❌ Erro na inserção:", error)
        setResultadoTeste({
          sucesso: false,
          erro: error.message,
          detalhes: error.details || "Sem detalhes adicionais",
        })
        toast.error("Erro na inserção: " + error.message)
      } else {
        console.log("✅ Inserção bem-sucedida:", data)
        setResultadoTeste({
          sucesso: true,
          dados: data,
          id: data.id,
        })
        toast.success("Teste de inserção bem-sucedido!")

        // Limpar dados de teste
        await supabase.from("propostas").delete().eq("id", data.id)
        console.log("🧹 Dados de teste removidos")
      }
    } catch (error) {
      console.error("❌ Erro no teste:", error)
      setResultadoTeste({
        sucesso: false,
        erro: error.message,
        detalhes: "Erro inesperado durante o teste",
      })
      toast.error("Erro no teste: " + error.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Correção de Tipos de Colunas</h1>
        <p className="text-muted-foreground">Identifica e corrige conflitos de tipos de dados na tabela "propostas"</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Análise de Tipos
            </CardTitle>
            <CardDescription>Verificar tipos atuais vs tipos recomendados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={analisarTiposAtuais} disabled={analisando} className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                {analisando ? "Analisando..." : "Analisar Tipos"}
              </Button>
              {scriptGerado && (
                <>
                  <Button variant="outline" onClick={copiarScript}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Script
                  </Button>
                  <Button variant="outline" onClick={testarInsercao} disabled={carregando}>
                    <Play className="h-4 w-4 mr-2" />
                    {carregando ? "Testando..." : "Testar Inserção"}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {tiposAtuais.length > 0 && (
          <Tabs defaultValue="problematicos" className="w-full">
            <TabsList>
              <TabsTrigger value="problematicos">Tipos Problemáticos</TabsTrigger>
              <TabsTrigger value="todos">Todos os Tipos</TabsTrigger>
              <TabsTrigger value="script">Script de Correção</TabsTrigger>
            </TabsList>

            <TabsContent value="problematicos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Colunas que Precisam de Correção</CardTitle>
                  <CardDescription>
                    {tiposAtuais.filter((t) => t.precisa_correcao).length} colunas precisam de correção
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Coluna</TableHead>
                        <TableHead>Tipo Atual</TableHead>
                        <TableHead>Tipo Recomendado</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tiposAtuais
                        .filter((t) => t.precisa_correcao)
                        .map((tipo) => (
                          <TableRow key={tipo.column_name}>
                            <TableCell className="font-medium">{tipo.column_name}</TableCell>
                            <TableCell>
                              <Badge variant={tipo.data_type === "NÃO EXISTE" ? "destructive" : "secondary"}>
                                {tipo.data_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{tipo.tipo_recomendado}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{tipo.motivo}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <span className="text-red-600 text-sm">Precisa correção</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="todos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Todos os Tipos de Colunas</CardTitle>
                  <CardDescription>Visão completa dos tipos atuais vs recomendados</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Coluna</TableHead>
                        <TableHead>Tipo Atual</TableHead>
                        <TableHead>Tipo Recomendado</TableHead>
                        <TableHead>Tamanho</TableHead>
                        <TableHead>Nulo</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tiposAtuais.map((tipo) => (
                        <TableRow key={tipo.column_name}>
                          <TableCell className="font-medium">{tipo.column_name}</TableCell>
                          <TableCell>
                            <Badge variant={tipo.data_type === "NÃO EXISTE" ? "destructive" : "secondary"}>
                              {tipo.data_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{tipo.tipo_recomendado}</Badge>
                          </TableCell>
                          <TableCell>{tipo.character_maximum_length || "-"}</TableCell>
                          <TableCell>{tipo.is_nullable}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {tipo.precisa_correcao ? (
                                <>
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                  <span className="text-red-600 text-sm">Corrigir</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-green-600 text-sm">OK</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="script" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Script SQL de Correção</CardTitle>
                  <CardDescription>Execute este script no Supabase SQL Editor</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button onClick={copiarScript} variant="outline">
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Script
                      </Button>
                    </div>
                    <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto max-h-96">
                      {scriptGerado || "Execute a análise primeiro para gerar o script"}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {resultadoTeste && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado do Teste de Inserção</CardTitle>
            </CardHeader>
            <CardContent>
              {resultadoTeste.sucesso ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ✅ Teste bem-sucedido! Os tipos de dados estão funcionando corretamente.
                    <br />
                    ID da proposta teste: {resultadoTeste.id}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    ❌ Erro no teste: {resultadoTeste.erro}
                    <br />
                    Detalhes: {resultadoTeste.detalhes}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
