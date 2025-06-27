-- Adicionar campos faltantes para o titular na tabela propostas
ALTER TABLE propostas 
  ADD COLUMN IF NOT EXISTS nome_mae VARCHAR(255),
  ADD COLUMN IF NOT EXISTS sexo VARCHAR(20),
  ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(50),
  ADD COLUMN IF NOT EXISTS naturalidade VARCHAR(100);

-- Adicionar comentários explicativos
COMMENT ON COLUMN propostas.nome_mae IS 'Nome da mãe do titular';
COMMENT ON COLUMN propostas.sexo IS 'Sexo/gênero do titular (ex: Masculino, Feminino, Outro)';
COMMENT ON COLUMN propostas.estado_civil IS 'Estado civil do titular (ex: Solteiro, Casado, Divorciado, Viúvo)';
COMMENT ON COLUMN propostas.naturalidade IS 'Cidade/local de nascimento do titular';

-- Adicionar campos para dependentes também (opcional)
ALTER TABLE dependentes
  ADD COLUMN IF NOT EXISTS sexo VARCHAR(20),
  ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(50),
  ADD COLUMN IF NOT EXISTS naturalidade VARCHAR(100);

-- Adicionar comentários explicativos para os campos dos dependentes
COMMENT ON COLUMN dependentes.sexo IS 'Sexo/gênero do dependente (ex: Masculino, Feminino, Outro)';
COMMENT ON COLUMN dependentes.estado_civil IS 'Estado civil do dependente (ex: Solteiro, Casado, Divorciado, Viúvo)';
COMMENT ON COLUMN dependentes.naturalidade IS 'Cidade/local de nascimento do dependente';
