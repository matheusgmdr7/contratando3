-- Criar tabela de usuários administrativos
CREATE TABLE IF NOT EXISTS usuarios_admin (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil VARCHAR(50) NOT NULL CHECK (perfil IN ('master', 'secretaria', 'assistente')),
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  permissoes JSONB DEFAULT '{}',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultimo_acesso TIMESTAMP WITH TIME ZONE,
  criado_por UUID REFERENCES usuarios_admin(id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_email ON usuarios_admin(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_perfil ON usuarios_admin(perfil);
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_status ON usuarios_admin(status);

-- Criar tabela de permissões por perfil
CREATE TABLE IF NOT EXISTS perfis_permissoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  perfil VARCHAR(50) NOT NULL,
  modulo VARCHAR(100) NOT NULL,
  permissoes JSONB NOT NULL DEFAULT '{}',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(perfil, modulo)
);

-- Inserir permissões padrão
INSERT INTO perfis_permissoes (perfil, modulo, permissoes) VALUES
-- MASTER - Acesso total
('master', 'dashboard', '{"visualizar": true, "gerenciar": true}'),
('master', 'leads', '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'),
('master', 'propostas', '{"visualizar": true, "aprovar": true, "rejeitar": true, "editar": true}'),
('master', 'corretores', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "aprovar": true}'),
('master', 'produtos', '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'),
('master', 'tabelas', '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'),
('master', 'comissoes', '{"visualizar": true, "gerenciar": true}'),
('master', 'usuarios', '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'),
('master', 'contratos', '{"visualizar": true, "gerenciar": true}'),
('master', 'vendas', '{"visualizar": true, "relatorios": true}'),

-- SECRETARIA - Acesso operacional
('secretaria', 'dashboard', '{"visualizar": true}'),
('secretaria', 'leads', '{"visualizar": true, "criar": true, "editar": true}'),
('secretaria', 'propostas', '{"visualizar": true, "aprovar": true, "rejeitar": true}'),
('secretaria', 'corretores', '{"visualizar": true, "editar": true, "aprovar": true}'),
('secretaria', 'produtos', '{"visualizar": true}'),
('secretaria', 'tabelas', '{"visualizar": true}'),
('secretaria', 'comissoes', '{"visualizar": true}'),
('secretaria', 'contratos', '{"visualizar": true, "gerenciar": true}'),
('secretaria', 'vendas', '{"visualizar": true}'),

-- ASSISTENTE - Acesso limitado
('assistente', 'dashboard', '{"visualizar": true}'),
('assistente', 'leads', '{"visualizar": true, "criar": true}'),
('assistente', 'propostas', '{"visualizar": true}'),
('assistente', 'corretores', '{"visualizar": true}'),
('assistente', 'produtos', '{"visualizar": true}'),
('assistente', 'tabelas', '{"visualizar": true}')

ON CONFLICT (perfil, modulo) DO NOTHING;

-- Criar tabela de logs de acesso
CREATE TABLE IF NOT EXISTS logs_acesso_admin (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios_admin(id),
  acao VARCHAR(100) NOT NULL,
  modulo VARCHAR(100),
  detalhes JSONB,
  ip_address INET,
  user_agent TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para logs
CREATE INDEX IF NOT EXISTS idx_logs_acesso_usuario ON logs_acesso_admin(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_acesso_data ON logs_acesso_admin(criado_em);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar timestamp
DROP TRIGGER IF EXISTS update_usuarios_admin_updated_at ON usuarios_admin;
CREATE TRIGGER update_usuarios_admin_updated_at
    BEFORE UPDATE ON usuarios_admin
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir usuário master padrão (senha: admin123)
INSERT INTO usuarios_admin (nome, email, senha_hash, perfil, status) VALUES
('Administrador Master', 'admin@sistema.com', '$2b$10$rQZ8kHWKtGKVQZ8kHWKtGOuKVQZ8kHWKtGKVQZ8kHWKtGKVQZ8kHW', 'master', 'ativo')
ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE usuarios_admin IS 'Usuários do painel administrativo';
COMMENT ON TABLE perfis_permissoes IS 'Permissões por perfil de usuário';
COMMENT ON TABLE logs_acesso_admin IS 'Logs de acesso e ações dos usuários admin';
