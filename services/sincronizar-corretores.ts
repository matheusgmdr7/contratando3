import { supabase } from "@/lib/supabase"
import { buscarTodosCorretores } from "./corretores-service"

// Esta função pode ser chamada manualmente para sincronizar corretores existentes
export async function sincronizarCorretoresComAuth(
  senhaTemporaria = "Senha@123",
): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    // Buscar todos os corretores
    const corretores = await buscarTodosCorretores()

    if (!corretores || corretores.length === 0) {
      return {
        sucesso: false,
        mensagem: "Nenhum corretor encontrado para sincronizar.",
      }
    }

    let sucessos = 0
    let falhas = 0

    // Para cada corretor, verificar se existe no Auth e criar se não existir
    for (const corretor of corretores) {
      try {
        // Verificar se o usuário já existe no Auth
        const { data, error } = await supabase.auth.admin.getUserByEmail(corretor.email)

        if (error || !data.user) {
          // Usuário não existe, criar
          const { error: createError } = await supabase.auth.admin.createUser({
            email: corretor.email,
            password: senhaTemporaria,
            email_confirm: true,
            user_metadata: {
              role: "corretor",
              nome: corretor.nome,
            },
          })

          if (createError) {
            console.error(`Erro ao criar usuário ${corretor.email}:`, createError)
            falhas++
          } else {
            console.log(`Usuário criado com sucesso: ${corretor.email}`)
            sucessos++
          }
        } else {
          console.log(`Usuário já existe: ${corretor.email}`)
          sucessos++
        }
      } catch (err) {
        console.error(`Erro ao processar corretor ${corretor.email}:`, err)
        falhas++
      }
    }

    return {
      sucesso: true,
      mensagem: `Sincronização concluída. Sucessos: ${sucessos}, Falhas: ${falhas}`,
    }
  } catch (error) {
    console.error("Erro ao sincronizar corretores:", error)
    return {
      sucesso: false,
      mensagem: "Erro ao sincronizar corretores com o sistema de autenticação.",
    }
  }
}
