# ✅ Checklist - Configuração de Email

## 1. Pré-requisitos ✅
- [x] Resend conectado ao domínio
- [ ] Supabase CLI instalado
- [ ] Projeto linkado ao Supabase

## 2. Edge Function
- [ ] Função `enviar-email` criada
- [ ] Código copiado para `supabase/functions/enviar-email/index.ts`
- [ ] Deploy realizado (`supabase functions deploy enviar-email`)

## 3. Variáveis de Ambiente (Supabase Dashboard)
- [ ] `RESEND_API_KEY` - Sua chave da API do Resend
- [ ] `FROM_EMAIL` - Email remetente (ex: noreply@seudominio.com)

## 4. Testes
- [ ] Teste local funcionando
- [ ] Teste em produção funcionando
- [ ] Email chegando na caixa de entrada

## 5. Comandos para Executar

### Instalar e configurar:
\`\`\`bash
npm install -g supabase
supabase login
supabase link --project-ref SEU_PROJECT_REF
\`\`\`

### Criar e deployar função:
\`\`\`bash
supabase functions new enviar-email
# Copiar código para supabase/functions/enviar-email/index.ts
supabase functions deploy enviar-email
\`\`\`

### Testar:
\`\`\`bash
supabase functions serve  # Terminal 1
# Em outro terminal:
bash scripts/test-email-function.sh
\`\`\`

## 6. Onde Configurar Variáveis

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. **Settings** → **Edge Functions**
4. Adicione as variáveis:
   - `RESEND_API_KEY`: re_xxxxxxxxx
   - `FROM_EMAIL`: noreply@seudominio.com

## 7. Troubleshooting

### Erro: "Function not found"
- Execute: `supabase functions deploy enviar-email`

### Erro: "RESEND_API_KEY não configurada"
- Configure a variável no painel do Supabase

### Erro: "Domain not verified"
- Verifique se o domínio está verificado no Resend

### Email não chega
- Verifique spam/lixo eletrônico
- Confirme o FROM_EMAIL no Resend
- Teste com diferentes provedores

## 8. Próximos Passos

Após configurar tudo:
1. Teste criando uma proposta
2. Verifique se o email é enviado
3. Confirme se o link funciona
4. Monitore logs no Supabase e Resend
