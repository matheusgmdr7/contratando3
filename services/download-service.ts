/**
 * Função para download de arquivos a partir de uma URL
 * @param url URL do arquivo a ser baixado
 * @returns Promise com o Blob do arquivo
 */
export async function downloadFile(url: string): Promise<Blob> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Erro ao baixar arquivo: ${response.status} ${response.statusText}`)
    }

    return await response.blob()
  } catch (error) {
    console.error("Erro ao baixar arquivo:", error)
    throw error
  }
}

/**
 * Baixa uma proposta e seus documentos como um arquivo ZIP
 * @param propostaId ID da proposta
 * @param nomeCliente Nome do cliente para identificar o arquivo
 * @param documentosUrls Objeto com URLs dos documentos
 * @param pdfUrl URL do PDF da proposta
 */
export async function downloadPropostaComDocumentos(
  propostaId: string,
  nomeCliente: string,
  documentosUrls: Record<string, string>,
  pdfUrl: string,
): Promise<void> {
  try {
    // Verificar se JSZip está disponível no navegador
    if (typeof window === "undefined" || !window.JSZip) {
      // Se JSZip não estiver disponível, carregá-lo dinamicamente
      await loadJSZip()
    }

    // Obter o objeto JSZip
    // @ts-ignore - JSZip será definido após o carregamento dinâmico
    const JSZip = window.JSZip
    const zip = new JSZip()

    // Adicionar PDF da proposta ao ZIP
    if (pdfUrl) {
      const pdfBlob = await downloadFile(pdfUrl)
      zip.file("Proposta.pdf", pdfBlob)
    }

    // Adicionar documentos ao ZIP
    for (const [key, url] of Object.entries(documentosUrls)) {
      try {
        const docBlob = await downloadFile(url as string)

        // Nomear o arquivo de forma adequada
        const fileName = getNomeArquivoDocumento(key, url as string)
        zip.file(fileName, docBlob)
      } catch (error) {
        console.error(`Erro ao baixar documento ${key}:`, error)
      }
    }

    // Gerar o arquivo ZIP e fazer download
    const zipBlob = await zip.generateAsync({ type: "blob" })

    // Formatar o nome do cliente para o nome do arquivo
    const nomeFormatado = nomeCliente
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "_")

    // Usar FileSaver para baixar o arquivo
    saveAs(zipBlob, `Proposta_${nomeFormatado}_${propostaId.substring(0, 8)}.zip`)
  } catch (error) {
    console.error("Erro ao criar arquivo ZIP:", error)
    throw error
  }
}

/**
 * Obtém um nome de arquivo adequado para o documento
 * @param key Chave/tipo do documento
 * @param url URL do documento
 * @returns Nome do arquivo
 */
function getNomeArquivoDocumento(key: string, url: string): string {
  // Obter a extensão do arquivo da URL
  const extensao = url.split(".").pop()?.split("?")[0] || "pdf"

  // Mapear a chave para um nome descritivo
  let nomeBase = ""
  switch (key) {
    case "rg_frente":
      nomeBase = "RG_Frente"
      break
    case "rg_verso":
      nomeBase = "RG_Verso"
      break
    case "cpf":
      nomeBase = "CPF"
      break
    case "comprovante_residencia":
      nomeBase = "Comprovante_Residencia"
      break
    case "cns":
      nomeBase = "Cartao_Nacional_Saude"
      break
    default:
      nomeBase = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())
        .replace(/\s/g, "_")
  }

  return `${nomeBase}.${extensao}`
}

/**
 * Carrega dinamicamente a biblioteca JSZip se necessário
 */
async function loadJSZip(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && !window.JSZip) {
      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
      script.integrity =
        "sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOyYE5PdcJxRq5Z8FPat3hGTxKJnueWQ=="
      script.crossOrigin = "anonymous"
      script.referrerPolicy = "no-referrer"
      script.onload = () => {
        console.log("JSZip carregado com sucesso")
        resolve()
      }
      script.onerror = () => {
        reject(new Error("Erro ao carregar JSZip"))
      }
      document.head.appendChild(script)

      // Também precisamos do FileSaver.js
      const fileSaverScript = document.createElement("script")
      fileSaverScript.src = "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"
      fileSaverScript.integrity =
        "sha512-Qlv6VSKh1gDKGoJbnyA5RMXYcvnpIqhO++MhIM2fStMcGT9i2T//tSwYFlcyoRRDcDZ+TYHpH8azBBCyhpSeqw=="
      fileSaverScript.crossOrigin = "anonymous"
      fileSaverScript.referrerPolicy = "no-referrer"
      document.head.appendChild(fileSaverScript)
    } else {
      resolve()
    }
  })
}

// Adicionar tipos para as variáveis globais
declare global {
  interface Window {
    JSZip: any
    saveAs: typeof import("file-saver").saveAs
  }
}

// Função auxiliar para uso em outros contextos
export function saveAs(blob: Blob, filename: string): void {
  if (typeof window !== "undefined" && window.saveAs) {
    window.saveAs(blob, filename)
  } else if (typeof import("file-saver").saveAs === "function") {
    import("file-saver").then((FileSaver) => {
      FileSaver.saveAs(blob, filename)
    })
  } else {
    console.error("FileSaver não está disponível")
  }
}
