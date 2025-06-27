-- Adicionar colunas de controle de email na tabela propostas
ALTER TABLE propostas 
ADD COLUMN IF NOT EXISTS email_enviado_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_validacao_enviado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS link_validacao TEXT,
ADD COLUMN IF NOT EXISTS tentativas_envio INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultimo_erro_email TEXT,
ADD COLUMN IF NOT EXISTS data_ultima_tentativa TIMESTAMP WITH TIME ZONE;

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_propostas_email_enviado ON propostas(email_enviado_em);
CREATE INDEX IF NOT EXISTS idx_propostas_status_email ON propostas(status, email_validacao_enviado);

-- Comentários para documentação
COMMENT ON COLUMN propostas.email_enviado_em IS 'Data e hora do último envio de email de validação';
COMMENT ON COLUMN propostas.email_validacao_enviado IS 'Flag indicando se email de validação foi enviado';
COMMENT ON COLUMN propostas.link_validacao IS 'Link de validação enviado para o cliente';
COMMENT ON COLUMN propostas.tentativas_envio IS 'Número de tentativas de envio de email';
COMMENT ON COLUMN propostas.ultimo_erro_email IS 'Último erro ocorrido no envio de email';
COMMENT ON COLUMN propostas.data_ultima_tentativa IS 'Data da última tentativa de envio';
