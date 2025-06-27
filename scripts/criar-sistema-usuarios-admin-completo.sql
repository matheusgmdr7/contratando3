-- Criar sistema completo de usuários administrativos
-- Execute este script no Supabase SQL Editor

-- 1. Remover tabelas existentes se houver problemas
DROP TABLE IF EXISTS perfis_permissoes CASCADE;
DROP TABLE IF EXISTS usuarios_admin CASCADE;

-- 2. Criar tabela de usuários administrativos
CREATE TABLE usuarios_admin (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    perfil VARCHAR(50) NOT NULL CHECK (perfil IN ('master', 'secretaria', 'assistente')),
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    permissoes JSONB DEFAULT '{}',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    criado_por UUID
);

-- 3. Criar tabela de perfis e permissões
CREATE TABLE perfis_permissoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    perfil VARCHAR(50) NOT NULL,
    modulo VARCHAR(100) NOT NULL,
    permissoes JSONB NOT NULL DEFAULT '{}',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(perfil, modulo)
);

-- 4. Criar índices para performance
CREATE INDEX idx_usuarios_admin_email ON usuarios_admin(email);
CREATE INDEX idx_usuarios_admin_status ON usuarios_admin(status);
CREATE INDEX idx_usuarios_admin_perfil ON usuarios_admin(perfil);
CREATE INDEX idx_perfis_permissoes_perfil ON perfis_permissoes(perfil);

-- 5. Criar trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_usuarios_admin_updated_at ON usuarios_admin;
CREATE TRIGGER update_usuarios_admin_updated_at 
    BEFORE UPDATE ON usuarios_admin 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Inserir permissões padrão para cada perfil
INSERT INTO perfis_permissoes (perfil, modulo, permissoes) VALUES
-- Permissões Master
('master', 'dashboard', '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'),
('master', 'leads', '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'),
('master', 'propostas', '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'),
('master', 'corretores', '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'),
('master', 'produtos', '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'),
('master', 'tabelas', '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'),
('master', 'comissoes', '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'),
('master', 'usuarios', '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'),
('master', 'contratos', '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'),
('master', 'vendas', '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'),

-- Permissões Secretaria
('secretaria', 'dashboard', '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'),
('secretaria', 'leads', '{"visualizar": true, "criar": true, "editar": true, "excluir": false}'),
('secretaria', 'propostas', '{"visualizar": true, "criar": true, "editar": true, "excluir": false}'),
('secretaria', 'corretores', '{"visualizar": true, "criar": false, "editar": true, "excluir": false}'),
('secretaria', 'produtos', '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'),
('secretaria', 'tabelas', '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'),
('secretaria', 'comissoes', '{"visualizar": true, "criar": false, "editar": true, "excluir": false}'),
('secretaria', 'usuarios', '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'),
('secretaria', 'contratos', '{"visualizar": true, "criar": true, "editar": true, "excluir": false}'),
('secretaria', 'vendas', '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'),

-- Permissões Assistente
('assistente', 'dashboard', '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'),
('assistente', 'leads', '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'),
('assistente', 'propostas', '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'),
('assistente', 'corretores', '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'),
('assistente', 'produtos', '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'),
('assistente', 'tabelas', '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'),
('assistente', 'comissoes', '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'),
('assistente', 'usuarios', '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'),
('assistente', 'contratos', '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'),
('assistente', 'vendas', '{"visualizar": true, "criar": false, "editar": false, "excluir": false}');

-- 7. Inserir usuário master padrão
INSERT INTO usuarios_admin (nome, email, senha_hash, perfil, status, permissoes) VALUES
('Administrador Master', 'admin@sistema.com', 'hashed_admin123_temp', 'master', 'ativo', 
'{"dashboard": {"visualizar": true, "criar": true, "editar": true, "excluir": true}, 
  "leads": {"visualizar": true, "criar": true, "editar": true, "excluir": true}, 
  "propostas": {"visualizar": true, "criar": true, "editar": true, "excluir": true}, 
  "corretores": {"visualizar": true, "criar": true, "editar": true, "excluir": true}, 
  "produtos": {"visualizar": true, "criar": true, "editar": true, "excluir": true}, 
  "tabelas": {"visualizar": true, "criar": true, "editar": true, "excluir": true}, 
  "comissoes": {"visualizar": true, "criar": true, "editar": true, "excluir": true}, 
  "usuarios": {"visualizar": true, "criar": true, "editar": true, "excluir": true}, 
  "contratos": {"visualizar": true, "criar": true, "editar": true, "excluir": true}, 
  "vendas": {"visualizar": true, "criar": true, "editar": true, "excluir": true}}');

-- 8. Verificar se tudo foi criado corretamente
SELECT 'Tabelas criadas com sucesso!' as status;
SELECT COUNT(*) as total_permissoes FROM perfis_permissoes;
SELECT COUNT(*) as total_usuarios FROM usuarios_admin;
SELECT nome, email, perfil, status FROM usuarios_admin;
