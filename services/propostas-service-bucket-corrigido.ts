import { createClient } from "@/utils/supabase/client"

// BUCKET ESPECÍFICO - NÃO MUDAR
const BUCKET_NAME = "documentos-propostas-corretores"

export async function salvarPropostaCorretor(dadosProposta: any) {
  const supabase = createClient()

  try {
    console.log("🚀 INICIANDO SALVAMENTO - BUCKET ESPECÍFICO")
    console.log("🎯 Bucket alvo:", BUCKET_NAME)

    // 1. VERIFICAR BUCKET ESPECÍFICO
    console.log("🔍 Verificando bucket específico...")

    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error("❌ Erro ao listar buckets:", bucketsError)
      throw new Error(`Erro ao verificar buckets: ${bucketsError.message}`)
    }

    console.log("📦 Buckets disponíveis:", buckets?.map((b) => b.name).join(", "))

    const bucketExists = buckets?.some((bucket) => bucket.name === BUCKET_NAME)

    if (!bucketExists) {
      console.error("❌ BUCKET ESPECÍFICO NÃO ENCONTRADO!")
      console.error(`   Bucket procurado: ${BUCKET_NAME}`)
      console.error(`   Buckets disponíveis: ${buckets?.map((b) => b.name).join(", ")}`)
      throw new Error(`Bucket ${BUCKET_NAME} não existe. Execute o script SQL para criá-lo.`)
    }

    console.log("✅ Bucket específico encontrado:", BUCKET_NAME)

    // 2. SALVAR PROPOSTA
    console.log("💾 Salvando proposta...")

    const dadosParaSalvar = {
      corretor_id: dadosProposta.corretor_id,
      nome_titular: dadosProposta.nome_titular,
      email_titular: dadosProposta.email_titular,
      telefone_titular: dadosProposta.telefone_titular,
      whatsapp_cliente: dadosProposta.whatsapp_cliente,
      cpf_titular: dadosProposta.cpf_titular,
      data_nascimento_titular: dadosProposta.data_nascimento_titular,
      produto_id: dadosProposta.produto_id,
      plano_id: dadosProposta.plano_id,
      valor_total: dadosProposta.valor_total,
      status: "pendente",
      dados_completos: dadosProposta,
    }

    const { data: proposta, error: propostaError } = await supabase
      .from("propostas_corretores")
      .insert(dadosParaSalvar)
      .select()
      .single()

    if (propostaError) {
      console.error("❌ Erro ao salvar proposta:", propostaError)
      throw new Error(`Erro ao salvar proposta: ${propostaError.message}`)
    }

    console.log("✅ Proposta salva com ID:", proposta.id)

    // 3. PROCESSAR DOCUMENTOS NO BUCKET ESPECÍFICO
    console.log("📎 PROCESSANDO DOCUMENTOS NO BUCKET ESPECÍFICO...")
    const documentosUrls: Record<string, string> = {}

    if (dadosProposta.documentos && Object.keys(dadosProposta.documentos).length > 0) {
      console.log("📊 Total de documentos:", Object.keys(dadosProposta.documentos).length)

      for (const [key, file] of Object.entries(dadosProposta.documentos)) {
        console.log(`\n📤 Processando: ${key}`)

        if (!file || typeof file !== "object" || !("name" in file)) {
          console.log(`❌ Arquivo ${key} inválido`)
          continue
        }

        try {
          const timestamp = Date.now()
          const extensao = file.name.split(".").pop()

          // ESTRUTURA ORGANIZADA NO BUCKET ESPECÍFICO
          const fileName = `propostas/${proposta.id}/${key}_${timestamp}.${extensao}`

          console.log(`   📁 Salvando em: ${BUCKET_NAME}/${fileName}`)
          console.log(`   📏 Tamanho: ${file.size} bytes`)

          // UPLOAD NO BUCKET ESPECÍFICO
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME) // USAR BUCKET ESPECÍFICO
            .upload(fileName, file, {
              cacheControl: "3600",
              upsert: false,
            })

          if (uploadError) {
            console.error(`   ❌ Erro no upload de ${key}:`, uploadError)

            // FALLBACK: Upload simples no bucket específico
            const fileNameSimples = `${proposta.id}_${key}_${timestamp}.${extensao}`
            console.log(`   🔄 Tentando upload simples: ${fileNameSimples}`)

            const { data: uploadSimples, error: errorSimples } = await supabase.storage
              .from(BUCKET_NAME) // AINDA NO BUCKET ESPECÍFICO
              .upload(fileNameSimples, file, {
                cacheControl: "3600",
                upsert: true,
              })

            if (errorSimples) {
              console.error(`   ❌ Erro no upload simples de ${key}:`, errorSimples)
              continue
            }

            console.log(`   ✅ Upload simples realizado: ${fileNameSimples}`)

            // Gerar URL pública
            const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileNameSimples)

            documentosUrls[key] = urlData.publicUrl
          } else {
            console.log(`   ✅ Upload realizado: ${fileName}`)

            // Gerar URL pública
            const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName)

            documentosUrls[key] = urlData.publicUrl
          }

          console.log(`   🔗 URL: ${documentosUrls[key]}`)
        } catch (error) {
          console.error(`   💥 Erro inesperado no upload de ${key}:`, error)
        }
      }
    } else {
      console.log("⚠️ Nenhum documento para processar")
    }

    // 4. ATUALIZAR PROPOSTA COM URLs
    if (Object.keys(documentosUrls).length > 0) {
      console.log("🔄 Atualizando proposta com URLs...")

      const { error: updateError } = await supabase
        .from("propostas_corretores")
        .update({
          documentos_urls: documentosUrls,
          dados_completos: {
            ...dadosProposta,
            documentos_urls: documentosUrls,
          },
        })
        .eq("id", proposta.id)

      if (updateError) {
        console.error("⚠️ Erro ao atualizar URLs:", updateError)
      } else {
        console.log("✅ URLs atualizadas na proposta")
      }
    }

    console.log("\n🎉 RESUMO FINAL:")
    console.log(`   ✅ Proposta ID: ${proposta.id}`)
    console.log(`   🗂️ Bucket usado: ${BUCKET_NAME}`)
    console.log(`   📎 Documentos salvos: ${Object.keys(documentosUrls).length}`)
    console.log(`   🔗 URLs geradas: ${Object.keys(documentosUrls).join(", ")}`)

    return {
      success: true,
      proposta,
      documentos_urls: documentosUrls,
    }
  } catch (error) {
    console.error("💥 ERRO GERAL:", error)
    throw error
  }
}
