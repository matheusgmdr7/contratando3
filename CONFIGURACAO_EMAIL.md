# Configuração de Email no Supabase

## Passo 1: Instalar Supabase CLI

\`\`\`bash
# Instalar Supabase CLI
npm install -g supabase

# Verificar instalação
supabase --version
\`\`\`

## Passo 2: Fazer Login no Supabase

\`\`\`bash
# Fazer login
supabase login

# Verificar projetos
supabase projects list
\`\`\`

## Passo 3: Inicializar Projeto Local

\`\`\`bash
# Na raiz do seu projeto
supabase init

# Linkar com seu projeto (substitua pela sua referência)
supabase link --project-ref SEU_PROJECT_REF
\`\`\`

## Passo 4: Criar a Função Edge

\`\`\`bash
# Criar a função
supabase functions new enviar-email
\`\`\`

## Passo 5: Copiar o Código da Função

Copie o conteúdo do arquivo `supabase/functions/enviar-email/index.ts` para a pasta criada.

## Passo 6: Configurar Variáveis de Ambiente

No painel do Supabase (https://supabase.com/dashboard):

1. Vá para **Settings** > **Edge Functions**
2. Adicione as variáveis:
   - `RESEND_API_KEY`: Sua chave da API do Resend
   - `FROM_EMAIL`: Email remetente (ex: noreply@seudominio.com)

## Passo 7: Deploy da Função

\`\`\`bash
# Deploy da função
supabase functions deploy enviar-email

# Verificar se foi deployada
supabase functions list
\`\`\`

## Passo 8: Configurar Resend (Recomendado)

1. Acesse https://resend.com
2. Crie uma conta gratuita
3. Adicione seu domínio
4. Configure os registros DNS
5. Obtenha sua API Key
6. Adicione a API Key nas variáveis de ambiente do Supabase

## Passo 9: Testar a Função

\`\`\`bash
# Testar localmente
supabase functions serve

# Em outro terminal, testar
curl -X POST 'http://localhost:54321/functions/v1/enviar-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "teste@exemplo.com",
    "subject": "Teste",
    "nome": "João",
    "corretor": "Maria",
    "link": "https://exemplo.com"
  }'
\`\`\`

## Alternativas ao Resend

### SendGrid
\`\`\`typescript
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')

const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SENDGRID_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    personalizations: [{
      to: [{ email: to }],
      subject: subject
    }],
    from: { email: 'noreply@seudominio.com' },
    content: [{
      type: 'text/html',
      value: htmlContent
    }]
  }),
})
\`\`\`

### Nodemailer (SMTP)
\`\`\`typescript
// Para usar SMTP tradicional, você precisaria de uma biblioteca específica
// Recomendamos usar Resend ou SendGrid para simplicidade
\`\`\`

## Troubleshooting

### Erro: "Function not found"
- Verifique se fez o deploy: `supabase functions deploy enviar-email`
- Confirme o nome da função no código

### Erro: "Invalid API Key"
- Verifique se adicionou a variável `RESEND_API_KEY`
- Confirme se a chave está correta

### Erro: "Domain not verified"
- Configure seu domínio no Resend
- Adicione os registros DNS necessários

### Email não chega
- Verifique spam/lixo eletrônico
- Confirme se o domínio está verificado
- Teste com diferentes provedores de email

## Custos

### Resend (Recomendado)
- **Gratuito**: 3.000 emails/mês
- **Pro**: $20/mês para 50.000 emails
- **Escala**: $80/mês para 500.000 emails

### SendGrid
- **Gratuito**: 100 emails/dia
- **Essentials**: $19.95/mês para 50.000 emails

### Supabase Edge Functions
- **Gratuito**: 500.000 invocações/mês
- **Pro**: $25/mês para 2 milhões de invocações
