// Este arquivo contém código para configurar o storage do Supabase via API
// Pode ser executado no console do navegador ou em um ambiente Node.js

async function configurarStorageSupabase() {
  // Substitua pelos seus valores reais
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("URL ou chave do Supabase não definidas")
    return
  }

  try {
    // 1. Criar o bucket se não existir
    console.log('Criando bucket "arquivos"...')
    const bucketResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        id: "arquivos",
        name: "arquivos",
        public: true,
        file_size_limit: 5242880, // 5MB
      }),
    })

    // Ignorar erro se o bucket já existir
    if (!bucketResponse.ok && bucketResponse.status !== 409) {
      console.error("Erro ao criar bucket:", await bucketResponse.text())
    } else {
      console.log("Bucket criado ou já existente")
    }

    // 2. Desativar RLS temporariamente para testes
    console.log("Desativando RLS para storage.objects...")
    const disableRlsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/disable_rls`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        table_name: "storage.objects",
      }),
    })

    if (!disableRlsResponse.ok) {
      console.error("Erro ao desativar RLS:", await disableRlsResponse.text())
    } else {
      console.log("RLS desativado com sucesso")
    }

    console.log("Configuração do storage concluída!")
  } catch (error) {
    console.error("Erro ao configurar storage:", error)
  }
}

// Executar a configuração
configurarStorageSupabase()
