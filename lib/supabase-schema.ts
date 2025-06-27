/**
 * Este arquivo contém informações sobre o schema do banco de dados Supabase
 * para garantir compatibilidade entre o frontend e o backend.
 */

// Mapeamento de campos do formulário para colunas do banco de dados
export const propostasSchema = {
  // Campos do formulário -> colunas da tabela propostas
  corretor_nome: "corretor_nome",
  template_id: "modelo_id",
  nome: "nome_cliente",
  cpf: "cpf",
  rg: "rg",
  data_nascimento: "data_nascimento",
  cns: "cns",
  email: "email",
  telefone: "telefone",
  endereco_completo: "endereco", // Combinação de endereco, numero e complemento
  bairro: "bairro",
  cidade: "cidade",
  estado: "estado",
  cep: "cep",
  cobertura: "tipo_cobertura", // Nome correto na tabela
  acomodacao: "tipo_acomodacao", // Nome correto na tabela
  sigla_plano: "codigo_plano", // Nome correto na tabela
  valor: "valor_plano", // Nome correto na tabela
  tem_dependentes: "tem_dependentes",
  peso: "peso",
  altura: "altura",
  status: "status",
}

// Lista de colunas que realmente existem na tabela propostas
export const propostasColumns = [
  "id",
  "created_at",
  "corretor_nome",
  "modelo_id",
  "nome_cliente",
  "cpf",
  "rg",
  "data_nascimento",
  "cns",
  "email",
  "telefone",
  "endereco",
  "bairro",
  "cidade",
  "estado",
  "cep",
  "tipo_cobertura",
  "tipo_acomodacao",
  "codigo_plano",
  "valor_plano",
  "tem_dependentes",
  "peso",
  "altura",
  "status",
  "pdf_url",
  "documentos_urls",
]

// Mapeamento de campos do formulário para colunas da tabela dependentes
export const dependentesSchema = {
  nome: "nome",
  cpf: "cpf",
  rg: "rg",
  data_nascimento: "data_nascimento",
  cns: "cns",
  parentesco: "parentesco",
}

// Mapeamento de campos do formulário para colunas da tabela questionario_saude
export const questionarioSchema = {
  pergunta_id: "pergunta_id",
  pergunta: "pergunta",
  resposta: "resposta",
  observacao: "observacao",
}
