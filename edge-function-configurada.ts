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

    // Configurações fixas - SUAS CREDENCIAIS
    const resendApiKey = "re_hbo9nhsH_Nub8YRaedQWU9dhyw3G8E11W"
    const fromEmail = "corretor@contratandoplanos.com.br"

    console.log("🔑 Configurações carregadas:", {
      hasResendKey: true,
      fromEmail: fromEmail,
      keyLength: resendApiKey.length,
    })

    // Gerar conteúdo do email baseado no tipo
    let htmlContent = ""
    let emailSubject = subject

    if (tipo === "proposta_completada") {
      // Email para corretor quando cliente completa proposta
      emailSubject = emailSubject || `✅ Proposta completada - ${cliente}`
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Proposta Completada</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #168979; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .highlight { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #168979; }
                .info-box { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #ddd; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Proposta Completada!</h1>
                </div>
                <div class="content">
                    <p>Olá <strong>${nome}</strong>,</p>
                    
                    <div class="highlight">
                        <h3>✅ Boa notícia!</h3>
                        <p>O cliente <strong>${cliente}</strong> completou a proposta <strong>${proposta}</strong> com sucesso!</p>
                    </div>
                    
                    <div class="info-box">
                        <h4>📋 Próximos passos:</h4>
                        <ul>
                            <li>✓ Acesse seu painel de corretor</li>
                            <li>✓ Verifique os documentos enviados pelo cliente</li>
                            <li>✓ Revise a declaração de saúde</li>
                            <li>✓ Processe a proposta na seguradora</li>
                        </ul>
                    </div>
                    
                    <p>A proposta está pronta para análise e processamento. Acesse seu dashboard para dar continuidade.</p>
                    
                    <div class="footer">
                        <p>© 2024 Contratando Planos - Notificação automática</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
      `
    } else {
      // Email para cliente completar proposta
      emailSubject = emailSubject || `🛡️ Complete sua proposta de plano de saúde - ${nome}`
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Complete sua Proposta</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #168979 0%, #13786a 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 40px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #168979; color: white; padding: 18px 35px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: bold; text-align: center; font-size: 16px; }
                .button:hover { background: #13786a; }
                .highlight { background: #e3f2fd; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #168979; }
                .link-box { background: #f5f5f5; padding: 20px; border-radius: 8px; word-break: break-all; margin: 20px 0; border: 1px solid #ddd; }
                .steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🛡️ Complete sua Proposta</h1>
                    <p style="margin: 0; font-size: 18px;">Plano de Saúde</p>
                </div>
                <div class="content">
                    <p style="font-size: 16px;">Olá <strong>${nome}</strong>,</p>
                    
                    <p>Seu corretor <strong>${corretor}</strong> iniciou uma proposta de plano de saúde especialmente para você!</p>
                    
                    <div class="highlight">
                        <h3>📋 Como funciona:</h3>
                        <div class="steps">
                            <p><strong>1.</strong> Clique no botão abaixo para acessar sua proposta</p>
                            <p><strong>2.</strong> Preencha a declaração de saúde (simples e rápido)</p>
                            <p><strong>3.</strong> Assine digitalmente o documento</p>
                            <p><strong>4.</strong> Pronto! Sua proposta será enviada para análise</p>
                        </div>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="${link}" class="button">
                            ✅ COMPLETAR PROPOSTA AGORA
                        </a>
                    </div>
                    
                    <p><strong>🔗 Ou copie e cole este link no seu navegador:</strong></p>
                    <div class="link-box">
                        <a href="${link}" style="color: #168979; text-decoration: none;">${link}</a>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
                        <p style="margin: 0;"><strong>⚠️ Importante:</strong> Este link é pessoal e intransferível. Se você não solicitou esta proposta, pode ignorar este email.</p>
                    </div>
                    
                    <p style="color: #666;">Dúvidas? Entre em contato com seu corretor <strong>${corretor}</strong>.</p>
                    
                    <div class="footer">
                        <p>© 2024 Contratando Planos - Este é um email automático</p>
                        <p>Você está recebendo este email porque uma proposta foi iniciada em seu nome.</p>
                    </div>
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

    console.log("📬 Status da resposta:", emailResponse.status)

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error("❌ Erro do Resend:", errorData)

      return new Response(
        JSON.stringify({
          error: "Erro ao enviar email via Resend",
          status: emailResponse.status,
          details: errorData,
          apiKey: "re_hbo...E11W (configurada)",
          from: fromEmail,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    const result = await emailResponse.json()
    console.log("✅ Email enviado com sucesso! ID:", result.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email enviado com sucesso!",
        id: result.id,
        to: to,
        subject: emailSubject,
        from: fromEmail,
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
