"use client"

import { Card } from "@/components/ui/card"
import { Check, AlertCircle } from "lucide-react"

export default function Step8Confirmation({ formData }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Confirmação</h3>
        <p className="text-sm text-gray-500 mb-6">
          Revise os dados abaixo e clique em "Finalizar e enviar" para concluir o processo.
        </p>

        <Card className="p-6 bg-green-50 border-green-200 mb-6">
          <div className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-green-800">Proposta pronta para envio</h4>
              <p className="text-sm text-green-700 mt-1">
                Todos os dados foram preenchidos e a proposta está pronta para ser enviada. Após o envio, você receberá
                uma confirmação por email.
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <div>
            <h4 className="text-md font-medium mb-2">Dados do Corretor</h4>
            <Card className="p-4">
              <p className="text-sm">
                <span className="font-medium">Nome:</span> {formData.corretor_nome}
              </p>
            </Card>
          </div>

          <div>
            <h4 className="text-md font-medium mb-2">Dados do Plano</h4>
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p className="text-sm">
                  <span className="font-medium">Cobertura:</span> {formData.cobertura}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Acomodação:</span> {formData.acomodacao}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Código do Plano:</span> {formData.sigla_plano}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Valor:</span> {formData.valor}
                </p>
              </div>
            </Card>
          </div>

          <div>
            <h4 className="text-md font-medium mb-2">Dados do Titular</h4>
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p className="text-sm">
                  <span className="font-medium">Nome:</span> {formData.nome}
                </p>
                <p className="text-sm">
                  <span className="font-medium">CPF:</span> {formData.cpf}
                </p>
                <p className="text-sm">
                  <span className="font-medium">RG:</span> {formData.rg}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Data de Nascimento:</span> {formData.data_nascimento}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {formData.email}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Telefone:</span> {formData.telefone}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Endereço:</span>{" "}
                  {`${formData.endereco}, ${formData.numero}${formData.complemento ? `, ${formData.complemento}` : ""}`}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Bairro:</span> {formData.bairro}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Cidade/UF:</span> {`${formData.cidade}/${formData.estado}`}
                </p>
                <p className="text-sm">
                  <span className="font-medium">CEP:</span> {formData.cep}
                </p>
              </div>
            </Card>
          </div>

          {formData.tem_dependentes && formData.dependentes && formData.dependentes.length > 0 && (
            <div>
              <h4 className="text-md font-medium mb-2">Dependentes</h4>
              <Card className="p-4">
                <div className="space-y-4">
                  {formData.dependentes.map((dep, index) => (
                    <div key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
                      <p className="font-medium mb-2">Dependente {index + 1}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <p className="text-sm">
                          <span className="font-medium">Nome:</span> {dep.nome}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">CPF:</span> {dep.cpf}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">RG:</span> {dep.rg}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Data de Nascimento:</span> {dep.data_nascimento}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Parentesco:</span> {dep.parentesco}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          <div>
            <h4 className="text-md font-medium mb-2">Dados de Saúde</h4>
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <p className="text-sm">
                  <span className="font-medium">Peso:</span> {formData.peso} kg
                </p>
                <p className="text-sm">
                  <span className="font-medium">Altura:</span> {formData.altura} cm
                </p>
              </div>

              <p className="font-medium mb-2">Questionário de Saúde</p>
              <div className="space-y-2">
                {formData.respostas_saude
                  .filter((resp) => resp.resposta === "Sim")
                  .map((resp, index) => (
                    <div key={index} className="text-sm">
                      <p>
                        <span className="font-medium">{resp.pergunta}</span>: Sim
                      </p>
                      {resp.observacao && <p className="text-gray-600 ml-4">Obs: {resp.observacao}</p>}
                    </div>
                  ))}

                {formData.respostas_saude.filter((resp) => resp.resposta === "Sim").length === 0 && (
                  <p className="text-sm text-gray-600">Nenhuma condição de saúde reportada.</p>
                )}
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">Atenção</h4>
              <p className="text-sm text-amber-700 mt-1">
                Ao clicar em "Finalizar e enviar", sua proposta será enviada para análise. Você receberá uma cópia por
                email e poderá acompanhar o status pelo portal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
