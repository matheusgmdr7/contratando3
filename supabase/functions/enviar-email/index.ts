import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

console.log("🚀 Edge Function enviar-email iniciada")

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    console.log("📧 Processando requisição de email...")

    // Verificar se RESEND_API_KEY está configurada
    const resendApiKey = Deno.env.get("RESEND_API_KEY")
    console.log("🔑 RESEND_API_KEY encontrada:", resendApiKey ? "✅ SIM" : "❌ NÃO")

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

    const { to, nome, subject, tipo, corretor, link } = await req.json()
    console.log("📨 Dados recebidos:", { to, nome, subject, tipo, corretor })

    // Preparar email baseado no tipo
    let htmlContent = ""
    let textContent = ""

    if (tipo === "proposta_cliente") {
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Complete sua Proposta de Plano de Saúde</h2>
          <p>Olá <strong>${nome}</strong>,</p>
          <p>Seu corretor <strong>${corretor}</strong> iniciou uma proposta de plano de saúde para você.</p>
          <p>Para finalizar sua proposta, clique no link abaixo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Completar Proposta
            </a>
          </div>
          <p>Se você não conseguir clicar no botão, copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; color: #666;">${link}</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            Este email foi enviado automaticamente. Se você não solicitou esta proposta, pode ignorar este email.
          </p>
        </div>
      `
      textContent = `
        Complete sua Proposta de Plano de Saúde
        
        Olá ${nome},
        
        Seu corretor ${corretor} iniciou uma proposta de plano de saúde para você.
        
        Para finalizar sua proposta, acesse: ${link}
        
        Se você não solicitou esta proposta, pode ignorar este email.
      `
    }

    console.log("📤 Enviando email via Resend...")

    // Enviar email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Contratando Planos <noreply@contratandoplanos.com.br>",
        to: [to],
        subject: subject,
        html: htmlContent,
        text: textContent,
      }),
    })

    const result = await response.json()
    console.log("📧 Resposta do Resend:", result)

    if (!response.ok) {
      console.error("❌ Erro do Resend:", result)
      throw new Error(`Resend API error: ${result.message || "Unknown error"}`)
    }

    console.log("✅ Email enviado com sucesso!")
    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.id,
        message: "Email enviado com sucesso",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("❌ Erro na Edge Function:", error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: "Erro interno do servidor",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }
})
