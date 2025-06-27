import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface EmailRequest {
  to: string
  subject: string
  nome: string
  corretor: string
  link: string
  tipo?: string
  cliente?: string
  proposta?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    console.log("📧 Iniciando envio de email...")

    const requestData: EmailRequest = await req.json()
    console.log("📝 Dados recebidos:", {
      to: requestData.to,
      subject: requestData.subject,
      tipo: requestData.tipo || "proposta_cliente",
    })

    const { to, subject, nome, corretor, link, tipo, cliente, proposta } = requestData

    // Validar dados obrigatórios
    if (!to || !nome) {
      console.error("❌ Dados obrigatórios faltando:", { to: !!to, nome: !!nome })
      return new Response(
        JSON.stringify({
          error: "Dados obrigatórios: to, nome",
          received: { to: !!to, nome: !!nome },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // Obter variáveis de ambiente - CORRIGIDO
    const resendApiKey = Deno.env.get("RESEND_API_KEY")
    const fromEmail = Deno.env.get("FROM_EMAIL") || "noreply@contratandoplanos.com.br"

    console.log("🔑 Verificando configurações:", {
      hasResendKey: !!resendApiKey,
      fromEmail: fromEmail,
      keyLength: resendApiKey ? resendApiKey.length : 0,
    })

    if (!resendApiKey) {
      console.error("❌ RESEND_API_KEY não configurada")
      return new Response(
        JSON.stringify({
          error: "RESEND_API_KEY não configurada nas variáveis de ambiente",
          help: "Configure RESEND_API_KEY no painel do Supabase",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // Validar formato da chave
    if (!resendApiKey.startsWith("re_")) {
      console.error("❌ Formato da RESEND_API_KEY inválido")
      return new Response(
        JSON.stringify({
          error: "RESEND_API_KEY deve começar com 're_'",
          received: resendApiKey.substring(0, 5) + "...",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // Gerar conteúdo do email baseado no tipo
    let htmlContent = ""
    let emailSubject = subject

    if (tipo === "proposta_completada") {
      // Email para corretor
      emailSubject = emailSubject || `Proposta completada - ${cliente}`
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Proposta Completada</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #168979; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .highlight { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #168979; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Proposta Completada!</h1>
                </div>
                <div class="content">
                    <p>Olá <strong>${nome}</strong>,</p>
                    
                    <div class="highlight">
                        <h3>🎉 Boa notícia!</h3>
                        <p>O cliente <strong>${cliente}</strong> completou a proposta <strong>${proposta}</strong>.</p>
                    </div>
                    
                    <p><strong>Próximos passos:</strong></p>
                    <ul>
                        <li>Acesse seu painel de corretor</li>
                        <li>Verifique os documentos enviados</li>
                        <li>Processe a proposta</li>
                    </ul>
                    
                    <p>Acesse seu painel para dar continuidade ao processo.</p>
                </div>
            </div>
        </body>
        </html>
      `
    } else {
      // Email para cliente
      emailSubject = emailSubject || `Complete sua proposta de plano de saúde - ${nome}`
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Complete sua Proposta</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #168979 0%, #13786a 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #168979; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; text-align: center; }
                .highlight { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .link-box { background: #f5f5f5; padding: 15px; border-radius: 5px; word-break: break-all; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🛡️ Complete sua Proposta</h1>
                </div>
                <div class="content">
                    <p>Olá <strong>${nome}</strong>,</p>
                    
                    <p>Seu corretor <strong>${corretor}</strong> iniciou uma proposta de plano de saúde para você!</p>
                    
                    <div class="highlight">
                        <h3>📋 Próximos passos:</h3>
                        <ol>
                            <li>Clique no botão abaixo para acessar sua proposta</li>
                            <li>Complete a declaração de saúde</li>
                            <li>Assine digitalmente o documento</li>
                            <li>Pronto! Sua proposta será enviada para análise</li>
                        </ol>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="${link}" class="button">
                            ✅ Completar Proposta
                        </a>
                    </div>
                    
                    <p><strong>Ou copie e cole este link no seu navegador:</strong></p>
                    <div class="link-box">
                        <a href="${link}">${link}</a>
                    </div>
                    
                    <p><small>Este link é pessoal e intransferível. Se você não solicitou esta proposta, pode ignorar este email.</small></p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                    <p>© 2024 Contratando Planos - Este é um email automático</p>
                </div>
            </div>
        </body>
        </html>
      `
    }

    console.log("📤 Enviando email via Resend...")

    // Enviar email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: emailSubject,
        html: htmlContent,
      }),
    })

    console.log("📬 Resposta do Resend:", emailResponse.status)

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error("❌ Erro do Resend:", errorData)

      return new Response(
        JSON.stringify({
          error: "Erro ao enviar email via Resend",
          status: emailResponse.status,
          details: errorData,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    const result = await emailResponse.json()
    console.log("✅ Email enviado com sucesso:", result.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email enviado com sucesso",
        id: result.id,
        to: to,
        subject: emailSubject,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("💥 Erro geral:", error)
    return new Response(
      JSON.stringify({
        error: "Erro interno do servidor",
        message: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }
})
