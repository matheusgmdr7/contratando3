"use client"

import { useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function Step2PlanInfo() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Informações do Plano</h3>
        <p className="text-sm text-gray-500">Selecione as características do plano desejado.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <FormField
            control={control}
            name="cobertura"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Cobertura</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="Nacional" />
                      </FormControl>
                      <FormLabel className="font-normal">Nacional</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="Estadual" />
                      </FormControl>
                      <FormLabel className="font-normal">Estadual</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormField
            control={control}
            name="acomodacao"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Acomodação</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="Enfermaria" />
                      </FormControl>
                      <FormLabel className="font-normal">Enfermaria</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="Apartamento" />
                      </FormControl>
                      <FormLabel className="font-normal">Apartamento</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sigla_plano" className={errors.sigla_plano ? "text-red-500" : ""}>
            Código do Plano
          </Label>
          <Input
            id="sigla_plano"
            placeholder="Ex: AMIL400"
            {...register("sigla_plano")}
            className={errors.sigla_plano ? "border-red-500" : ""}
          />
          {errors.sigla_plano && <p className="text-red-500 text-sm mt-1">{errors.sigla_plano.message as string}</p>}
        </div>

        <div>
          <Label htmlFor="valor" className={errors.valor ? "text-red-500" : ""}>
            Valor
          </Label>
          <Input
            id="valor"
            placeholder="Ex: R$ 500,00"
            {...register("valor")}
            className={errors.valor ? "border-red-500" : ""}
          />
          {errors.valor && <p className="text-red-500 text-sm mt-1">{errors.valor.message as string}</p>}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mt-8">Informações do Titular</h3>
        <p className="text-sm text-gray-500">Preencha os dados do titular do plano.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nome" className={errors.nome ? "text-red-500" : ""}>
            Nome Completo
          </Label>
          <Input
            id="nome"
            placeholder="Nome completo do titular"
            {...register("nome")}
            className={errors.nome ? "border-red-500" : ""}
          />
          {errors.nome && <p className="text-red-500 text-sm mt-1">{errors.nome.message as string}</p>}
        </div>

        <div>
          <Label htmlFor="cpf" className={errors.cpf ? "text-red-500" : ""}>
            CPF
          </Label>
          <Input
            id="cpf"
            placeholder="000.000.000-00"
            {...register("cpf")}
            className={errors.cpf ? "border-red-500" : ""}
          />
          {errors.cpf && <p className="text-red-500 text-sm mt-1">{errors.cpf.message as string}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rg" className={errors.rg ? "text-red-500" : ""}>
            RG
          </Label>
          <Input id="rg" placeholder="00.000.000-0" {...register("rg")} className={errors.rg ? "border-red-500" : ""} />
          {errors.rg && <p className="text-red-500 text-sm mt-1">{errors.rg.message as string}</p>}
        </div>

        <div>
          <Label htmlFor="data_nascimento" className={errors.data_nascimento ? "text-red-500" : ""}>
            Data de Nascimento
          </Label>
          <Input
            id="data_nascimento"
            type="date"
            {...register("data_nascimento")}
            className={errors.data_nascimento ? "border-red-500" : ""}
          />
          {errors.data_nascimento && (
            <p className="text-red-500 text-sm mt-1">{errors.data_nascimento.message as string}</p>
          )}
        </div>
      </div>

      {/* Campos adicionais do titular */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nome_mae" className={errors.nome_mae ? "text-red-500" : ""}>
            Nome da Mãe
          </Label>
          <Input
            id="nome_mae"
            placeholder="Nome completo da mãe"
            {...register("nome_mae")}
            className={errors.nome_mae ? "border-red-500" : ""}
          />
          {errors.nome_mae && <p className="text-red-500 text-sm mt-1">{errors.nome_mae.message as string}</p>}
        </div>

        <div>
          <FormField
            control={control}
            name="sexo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FormField
            control={control}
            name="estado_civil"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado Civil</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                    <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                    <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                    <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                    <SelectItem value="União Estável">União Estável</SelectItem>
                    <SelectItem value="Separado(a)">Separado(a)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <Label htmlFor="naturalidade" className={errors.naturalidade ? "text-red-500" : ""}>
            Naturalidade
          </Label>
          <Input
            id="naturalidade"
            placeholder="Cidade de nascimento"
            {...register("naturalidade")}
            className={errors.naturalidade ? "border-red-500" : ""}
          />
          {errors.naturalidade && <p className="text-red-500 text-sm mt-1">{errors.naturalidade.message as string}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cns" className={errors.cns ? "text-red-500" : ""}>
            CNS (Cartão Nacional de Saúde)
          </Label>
          <Input
            id="cns"
            placeholder="000 0000 0000 0000"
            {...register("cns")}
            className={errors.cns ? "border-red-500" : ""}
          />
          {errors.cns && <p className="text-red-500 text-sm mt-1">{errors.cns.message as string}</p>}
        </div>

        <div>
          <Label htmlFor="email" className={errors.email ? "text-red-500" : ""}>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="email@exemplo.com"
            {...register("email")}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message as string}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="telefone" className={errors.telefone ? "text-red-500" : ""}>
            Telefone
          </Label>
          <Input
            id="telefone"
            placeholder="(00) 00000-0000"
            {...register("telefone")}
            className={errors.telefone ? "border-red-500" : ""}
          />
          {errors.telefone && <p className="text-red-500 text-sm mt-1">{errors.telefone.message as string}</p>}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mt-8">Endereço</h3>
        <p className="text-sm text-gray-500">Preencha os dados de endereço do titular.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cep" className={errors.cep ? "text-red-500" : ""}>
            CEP
          </Label>
          <Input id="cep" placeholder="00000-000" {...register("cep")} className={errors.cep ? "border-red-500" : ""} />
          {errors.cep && <p className="text-red-500 text-sm mt-1">{errors.cep.message as string}</p>}
        </div>

        <div>
          <Label htmlFor="endereco" className={errors.endereco ? "text-red-500" : ""}>
            Endereço
          </Label>
          <Input
            id="endereco"
            placeholder="Rua, Avenida, etc."
            {...register("endereco")}
            className={errors.endereco ? "border-red-500" : ""}
          />
          {errors.endereco && <p className="text-red-500 text-sm mt-1">{errors.endereco.message as string}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="numero" className={errors.numero ? "text-red-500" : ""}>
            Número
          </Label>
          <Input
            id="numero"
            placeholder="123"
            {...register("numero")}
            className={errors.numero ? "border-red-500" : ""}
          />
          {errors.numero && <p className="text-red-500 text-sm mt-1">{errors.numero.message as string}</p>}
        </div>

        <div>
          <Label htmlFor="complemento">Complemento</Label>
          <Input id="complemento" placeholder="Apto, Bloco, etc." {...register("complemento")} />
        </div>

        <div>
          <Label htmlFor="bairro" className={errors.bairro ? "text-red-500" : ""}>
            Bairro
          </Label>
          <Input
            id="bairro"
            placeholder="Bairro"
            {...register("bairro")}
            className={errors.bairro ? "border-red-500" : ""}
          />
          {errors.bairro && <p className="text-red-500 text-sm mt-1">{errors.bairro.message as string}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cidade" className={errors.cidade ? "text-red-500" : ""}>
            Cidade
          </Label>
          <Input
            id="cidade"
            placeholder="Cidade"
            {...register("cidade")}
            className={errors.cidade ? "border-red-500" : ""}
          />
          {errors.cidade && <p className="text-red-500 text-sm mt-1">{errors.cidade.message as string}</p>}
        </div>

        <div>
          <Label htmlFor="estado" className={errors.estado ? "text-red-500" : ""}>
            Estado
          </Label>
          <Input
            id="estado"
            placeholder="UF"
            maxLength={2}
            {...register("estado")}
            className={errors.estado ? "border-red-500" : ""}
          />
          {errors.estado && <p className="text-red-500 text-sm mt-1">{errors.estado.message as string}</p>}
        </div>
      </div>
    </div>
  )
}
