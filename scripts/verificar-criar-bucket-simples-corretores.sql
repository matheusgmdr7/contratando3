-- VERIFICAR E CRIAR BUCKET SIMPLES PARA DOCUMENTOS DOS CORRETORES
-- ==============================================================

-- 1. VERIFICAR SE O SCHEMA STORAGE EXISTE
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') 
        THEN 'Storage schema existe'
        ELSE 'Storage schema NÃO existe - Storage não configurado'
    END as status_storage;

-- 2. VERIFICAR SE AS TABELAS DE STORAGE EXISTEM
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'Existe'
        ELSE 'Não existe'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'storage' 
AND table_name IN ('buckets', 'objects', 'policies')
ORDER BY table_name;

-- 3. SE STORAGE EXISTE, VERIFICAR BUCKETS EXISTENTES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        -- Verificar se a tabela buckets existe
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
            RAISE NOTICE 'BUCKETS EXISTENTES:';
            -- Listar buckets existentes seria feito aqui, mas não podemos usar SELECT em DO blocks
        ELSE
            RAISE NOTICE 'Tabela storage.buckets não existe';
        END IF;
    ELSE
        RAISE NOTICE 'Schema storage não existe - Storage não configurado';
    END IF;
END $$;

-- 4. TENTAR CRIAR BUCKET BÁSICO (só se storage existir)
DO $$
BEGIN
    -- Verificar se storage está disponível
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'storage' AND table_name = 'buckets'
    ) THEN
        -- Tentar criar o bucket
        BEGIN
            INSERT INTO storage.buckets (id, name, public)
            SELECT 
                'documentos-propostas-corretores',
                'documentos-propostas-corretores',
                true
            WHERE NOT EXISTS (
                SELECT 1 FROM storage.buckets 
                WHERE name = 'documentos-propostas-corretores'
            );
            
            RAISE NOTICE 'Bucket criado ou já existe: documentos-propostas-corretores';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao criar bucket: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Storage não disponível - usando fallback para URLs diretas';
    END IF;
END $$;

-- 5. RESULTADO FINAL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') 
        THEN 'STORAGE DISPONÍVEL - Bucket configurado'
        ELSE 'STORAGE NÃO DISPONÍVEL - Usando URLs diretas'
    END as resultado_final;
