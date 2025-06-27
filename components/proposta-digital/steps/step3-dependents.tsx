"use client"

import { useFormContext, useFieldArray } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, User } from "lucide-react"
import { useEffect } from "react"

export default function Step3Dependents() {
  const { control, setValue, watch } = useFormContext()
  const temDependentes = watch("tem_dependentes")

  // Use useFieldArray to manage the dependents array
  const { fields, append, remove } = useFieldArray({
    control,
    name: "dependentes",
  })

  // Format CPF input for dependents
  const handleDependentCpfChange = (e, index) => {
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

    setValue(`dependentes.${index}.cpf`, value)
  }

  // Calculate age from birth date
  const calculateAge = (birthDate) => {
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

  // Format currency input
  const formatCurrency = (value) => {
    let numericValue = value.replace(/\D/g, "")
    numericValue = (Number(numericValue) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return numericValue
  }

  // Add a new dependent
  const addDependent = () => {
    if (fields.length < 5) {
      append({
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
      })
    }
  }

  // Initialize dependents array if tem_dependentes is true and array is empty
  useEffect(() => {
    if (temDependentes && fields.length === 0) {
      addDependent()
    }
  }, [temDependentes, fields.length])

  // Recalcular valor total quando valores dos dependentes mudarem
  useEffect(() => {
    // Trigger recalculation in parent component
    const dependentesValues = fields.map((_, index) => ({
      valor_individual: watch(`dependentes.${index}.valor_individual`),
    }))

    // Force update of total value calculation
    setValue("dependentes", watch("dependentes"))
  }, [fields.map((_, index) => watch(`dependentes.${index}.valor_individual`)).join(",")])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Dependentes</h3>

        <div className="flex items-center space-x-2 mb-6">
          <FormField
            control={control}
            name="tem_dependentes"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked)
                      if (!checked) {
                        // Clear dependents if switched off
                        setValue("dependentes", [])
                      }
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Possui dependentes?</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        {temDependentes && (
          <div className="space-y-6">
            {fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center text-lg">
                      <User className="h-5 w-5 mr-2" />
                      Dependente {index + 1}
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Dados Pessoais */}
                  <div>
                    <h4 className="font-medium mb-3">Dados Pessoais</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={control}
                        name={`dependentes.${index}.nome`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Nome Completo *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`dependentes.${index}.cpf`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="000.000.000-00"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e)
                                  handleDependentCpfChange(e, index)
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`dependentes.${index}.rg`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>RG *</FormLabel>
                            <FormControl>
                              <Input placeholder="Número do RG" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`dependentes.${index}.data_nascimento`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Nascimento *</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e)
                                  // Auto-calculate age
                                  const age = calculateAge(e.target.value)
                                  setValue(`dependentes.${index}.idade`, age)
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`dependentes.${index}.idade`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Idade</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Calculada automaticamente"
                                {...field}
                                readOnly
                                className="bg-gray-50"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`dependentes.${index}.parentesco`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parentesco *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o parentesco" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Cônjuge">Cônjuge</SelectItem>
                                <SelectItem value="Filho(a)">Filho(a)</SelectItem>
                                <SelectItem value="Pai/Mãe">Pai/Mãe</SelectItem>
                                <SelectItem value="Irmão/Irmã">Irmão/Irmã</SelectItem>
                                <SelectItem value="Outro">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`dependentes.${index}.cns`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNS (opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Número do CNS" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`dependentes.${index}.nome_mae`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Nome da Mãe</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome completo da mãe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Dados Físicos */}
                  <div>
                    <h4 className="font-medium mb-3">Dados Físicos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={control}
                        name={`dependentes.${index}.peso`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Peso (kg)</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 70" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`dependentes.${index}.altura`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Altura (cm)</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 175" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Valor Individual */}
                  <div>
                    <h4 className="font-medium mb-3">Valor do Plano</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={control}
                        name={`dependentes.${index}.valor_individual`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Individual (R$)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="0,00"
                                {...field}
                                onChange={(e) => {
                                  const formatted = formatCurrency(e.target.value)
                                  field.onChange(formatted)
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add Dependent Button */}
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={addDependent}
                disabled={fields.length >= 5}
                className="w-full md:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Dependente
              </Button>
            </div>

            {fields.length >= 5 && <p className="text-sm text-amber-600 mt-2">Máximo de 5 dependentes permitido.</p>}
          </div>
        )}

        {!temDependentes && (
          <div className="bg-gray-50 p-6 rounded-md text-center">
            <p className="text-gray-500">Nenhum dependente será adicionado à proposta.</p>
          </div>
        )}
      </div>
    </div>
  )
}
