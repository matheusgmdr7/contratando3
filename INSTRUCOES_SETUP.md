# 🚀 Instruções de Setup - Supabase Email

## Passos 1-3: Configuração Inicial

### 1️⃣ **Instalar Supabase CLI**
\`\`\`bash
npm install -g supabase
\`\`\`

### 2️⃣ **Login no Supabase**
\`\`\`bash
supabase login
\`\`\`
- Isso abrirá seu navegador
- Faça login com sua conta Supabase
- Autorize o CLI

### 3️⃣ **Configurar Projeto**

#### 3.1 Inicializar Supabase no projeto:
\`\`\`bash
supabase init
\`\`\`

#### 3.2 Conectar ao seu projeto:
\`\`\`bash
supabase link --project-ref SEU_PROJECT_REF
\`\`\`

**🔍 Como encontrar seu PROJECT_REF:**
1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **General**
4. Copie o **Reference ID**

#### 3.3 Criar função de email:
\`\`\`bash
supabase functions new enviar-email
\`\`\`

## ✅ Verificação

Após executar os comandos, você deve ter:
- ✅ Pasta `supabase/` criada no projeto
- ✅ Arquivo `supabase/config.toml`
- ✅ Pasta `supabase/functions/enviar-email/`
- ✅ Arquivo `supabase/functions/enviar-email/index.ts`

## 🔄 Próximos Passos

1. **Configurar Resend** (Passo 4)
2. **Adicionar variáveis** (Passo 5)  
3. **Deploy da função** (Passo 6)
4. **Testar** (Passo 7)

## 🆘 Problemas Comuns

### "Command not found: supabase"
\`\`\`bash
# Reinstalar globalmente
npm uninstall -g supabase
npm install -g supabase
\`\`\`

### "Not logged in"
\`\`\`bash
supabase logout
supabase login
\`\`\`

### "Project not found"
- Verifique se o PROJECT_REF está correto
- Confirme se você tem acesso ao projeto
