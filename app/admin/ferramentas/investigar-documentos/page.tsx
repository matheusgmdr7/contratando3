"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { FileSearch, Database, Eye } from "lucide-react"

export default function InvestigarDocumentosPage() {
  const [loading, setLoading] = useState(false)
  const [resultados, setResultados] = useState(null)

  async function investigarDocumentos() {
    try {
      setLoading(true)
      console.log("🔍 INICIANDO INVESTIGAÇÃO DOS DOCUMENTOS")
      console.log("=".repeat(60))

      const investigacao = {
        estruturaPropostas: null,
        tabelasDocumentos: null,
        propostasComDocumentos: null,
        estatisticasDocumentos: null,
        estruturaDependentes: null,
        dependentesComDocumentos: null,
        tabelasEspecificas: null,
      }

      // 1. Verificar estrutura da tabela propostas (campos de documentos)
      console.log("1️⃣ Verificando estrutura da tabela propostas...")
      const { data: estruturaPropostas, error: errorEstrutura } = await supabase.rpc("execute_sql", {
        query: `
          SELECT 
              column_name,
              data_type,
              is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'propostas' 
              AND table_schema = 'public'
              AND (column_name LIKE '%documento%' OR column_name LIKE '%url%' OR column_name LIKE '%anexo%')
          ORDER BY ordinal_position;
        `,
      })

      if (!errorEstrutura) {
        investigacao.estruturaPropostas = estruturaPropostas
        console.log("✅ Estrutura propostas:", estruturaPropostas?.length || 0, "campos relacionados a documentos")
      }

      // 2. Buscar propostas recentes com documentos
      console.log("2️⃣ Buscando propostas com documentos...")
      const { data: propostas, error: errorPropostas } = await supabase
        .from("propostas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)

      if (!errorPropostas && propostas) {
        investigacao.propostasComDocumentos = propostas
        console.log("✅ Propostas encontradas:", propostas.length)

        // Analisar campos de documentos
        propostas.forEach((proposta, index) => {
          console.log(`📋 Proposta ${index + 1} (${proposta.nome_cliente || proposta.nome}):`)
          console.log(`   ID: ${proposta.id}`)

          // Verificar todos os campos possíveis
          const camposDocumentos = [
            "documentos_urls",
            "documentos",
            "anexos",
            "arquivos",
            "rg_frente_url",
            "rg_verso_url",
            "cpf_url",
            "comprovante_residencia_url",
            "cns_url",
          ]

          let temDocumentos = false
          camposDocumentos.forEach((campo) => {
            if (proposta[campo]) {
              if (typeof proposta[campo] === "object") {
                const keys = Object.keys(proposta[campo])
                if (keys.length > 0) {
                  console.log(`   📎 ${campo}: ${keys.length} documento(s) - ${keys.join(", ")}`)
                  temDocumentos = true
                }
              } else if (typeof proposta[campo] === "string" && proposta[campo].trim() !== "") {
                console.log(`   📎 ${campo}: ${proposta[campo]}`)
                temDocumentos = true
              }
            }
          })

          if (!temDocumentos) {
            console.log(`   📎 Nenhum documento encontrado`)
          }
          console.log("   ---")
        })
      }

      // 3. Buscar dependentes com documentos
      console.log("3️⃣ Buscando dependentes com documentos...")
      const tabelasDependentes = ["dependentes", "dependentes_propostas", "proposta_dependentes"]

      for (const tabela of tabelasDependentes) {
        try {
          const { data: dependentes, error } = await supabase.from(tabela).select("*").limit(5)

          if (!error && dependentes && dependentes.length > 0) {
            console.log(`✅ Dependentes encontrados na tabela ${tabela}:`, dependentes.length)
            investigacao.dependentesComDocumentos = { tabela, dados: dependentes }

            dependentes.forEach((dep, index) => {
              console.log(`👤 Dependente ${index + 1} (${dep.nome}):`)
              const camposDocumentos = ["documentos_urls", "documentos", "anexos", "arquivos"]

              let temDocumentos = false
              camposDocumentos.forEach((campo) => {
                if (dep[campo] && typeof dep[campo] === "object" && Object.keys(dep[campo]).length > 0) {
                  console.log(`   📎 ${campo}: ${Object.keys(dep[campo]).length} documento(s)`)
                  temDocumentos = true
                }
              })

              if (!temDocumentos) {
                console.log(`   📎 Nenhum documento encontrado`)
              }
            })
            break
          }
        } catch (err) {
          console.log(`⚠️ Tabela ${tabela} não existe ou erro:`, err.message)
        }
      }

      // 4. Verificar se existe tabela específica para documentos
      console.log("4️⃣ Verificando tabelas específicas de documentos...")
      try {
        const { data: tabelasEspecificas, error } = await supabase.rpc("execute_sql", {
          query: `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
                AND table_name LIKE '%documento%'
            ORDER BY table_name;
          `,
        })

        if (!error && tabelasEspecificas) {
          investigacao.tabelasEspecificas = tabelasEspecificas
          console.log("✅ Tabelas específicas de documentos:", tabelasEspecificas.length)
        }
      } catch (err) {
        console.log("⚠️ Erro ao verificar tabelas específicas:", err.message)
      }

      console.log("🎉 INVESTIGAÇÃO CONCLUÍDA!")
      setResultados(investigacao)
      toast.success("Investigação concluída! Verifique os resultados.")
    } catch (error) {
      console.error("❌ Erro na investigação:", error)
      toast.error("Erro na investigação: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Investigar Documentos</h1>
          <p className="text-gray-600">Analisar onde os documentos estão sendo salvos e como acessá-los</p>
        </div>
        <Button onClick={investigarDocumentos} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? <Spinner className="h-4 w-4 mr-2" /> : <FileSearch className="h-4 w-4 mr-2" />}
          Investigar Documentos
        </Button>
      </div>

      {resultados && (
        <div className="space-y-6">
          {/* Estrutura da Tabela Propostas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Estrutura da Tabela Propostas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resultados.estruturaPropostas ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border p-2 text-left">Campo</th>
                        <th className="border p-2 text-left">Tipo</th>
                        <th className="border p-2 text-left">Nullable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultados.estruturaPropostas.map((campo, index) => (
                        <tr key={index}>
                          <td className="border p-2 font-mono">{campo.column_name}</td>
                          <td className="border p-2">{campo.data_type}</td>
                          <td className="border p-2">{campo.is_nullable}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">Nenhum campo de documento encontrado</p>
              )}
            </CardContent>
          </Card>

          {/* Propostas com Documentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Propostas Recentes (Análise de Documentos)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resultados.propostasComDocumentos ? (
                <div className="space-y-4">
                  {resultados.propostasComDocumentos.map((proposta, index) => {
                    const camposDocumentos = [
                      "documentos_urls",
                      "documentos",
                      "anexos",
                      "arquivos",
                      "rg_frente_url",
                      "rg_verso_url",
                      "cpf_url",
                      "comprovante_residencia_url",
                      "cns_url",
                    ]

                    const documentosEncontrados = []
                    camposDocumentos.forEach((campo) => {
                      if (proposta[campo]) {
                        if (typeof proposta[campo] === "object" && Object.keys(proposta[campo]).length > 0) {
                          documentosEncontrados.push({
                            campo,
                            tipo: "object",
                            quantidade: Object.keys(proposta[campo]).length,
                            dados: proposta[campo],
                          })
                        } else if (typeof proposta[campo] === "string" && proposta[campo].trim() !== "") {
                          documentosEncontrados.push({
                            campo,
                            tipo: "string",
                            dados: proposta[campo],
                          })
                        }
                      }
                    })

                    return (
                      <div key={proposta.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{proposta.nome_cliente || proposta.nome}</h4>
                            <p className="text-sm text-gray-600">ID: {proposta.id}</p>
                            <p className="text-sm text-gray-600">Email: {proposta.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              Status: <span className="text-blue-600">{proposta.status}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(proposta.created_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <h5 className="font-medium text-sm mb-2">Documentos Encontrados:</h5>
                          {documentosEncontrados.length > 0 ? (
                            <div className="space-y-2">
                              {documentosEncontrados.map((doc, docIndex) => (
                                <div key={docIndex} className="bg-white p-3 rounded border">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-mono text-sm text-blue-600">{doc.campo}</p>
                                      <p className="text-xs text-gray-500">Tipo: {doc.tipo}</p>
                                      {doc.quantidade && (
                                        <p className="text-xs text-gray-500">Quantidade: {doc.quantidade}</p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          console.log(`Dados do campo ${doc.campo}:`, doc.dados)
                                          alert(`Dados logados no console para ${doc.campo}`)
                                        }}
                                      >
                                        Ver Dados
                                      </Button>
                                    </div>
                                  </div>
                                  {doc.tipo === "object" && (
                                    <div className="mt-2">
                                      <p className="text-xs text-gray-600">
                                        Chaves: {Object.keys(doc.dados).join(", ")}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">Nenhum documento encontrado</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500">Nenhuma proposta encontrada</p>
              )}
            </CardContent>
          </Card>

          {/* Dependentes com Documentos */}
          {resultados.dependentesComDocumentos && (
            <Card>
              <CardHeader>
                <CardTitle>Dependentes com Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3">
                  <strong>Tabela utilizada:</strong> {resultados.dependentesComDocumentos.tabela}
                </p>
                <div className="space-y-3">
                  {resultados.dependentesComDocumentos.dados.map((dep, index) => (
                    <div key={dep.id} className="border rounded p-3 bg-gray-50">
                      <h5 className="font-medium">{dep.nome}</h5>
                      <p className="text-sm text-gray-600">ID: {dep.id}</p>
                      <p className="text-sm text-gray-600">Proposta ID: {dep.proposta_id}</p>

                      <div className="mt-2">
                        {["documentos_urls", "documentos", "anexos", "arquivos"].map((campo) => {
                          if (dep[campo] && typeof dep[campo] === "object" && Object.keys(dep[campo]).length > 0) {
                            return (
                              <div key={campo} className="text-sm">
                                <strong>{campo}:</strong> {Object.keys(dep[campo]).length} documento(s)
                              </div>
                            )
                          }
                          return null
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabelas Específicas */}
          {resultados.tabelasEspecificas && resultados.tabelasEspecificas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tabelas Específicas de Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {resultados.tabelasEspecificas.map((tabela, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded">
                      <code>{tabela.table_name}</code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
