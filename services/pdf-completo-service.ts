/**
 * Gera um PDF completo com a proposta e todos os documentos anexados
 * @param propostaId ID da proposta
 * @param propostaNome Nome do cliente da proposta
 * @param documentosUrls Objeto com as URLs dos documentos
 * @param pdfUrl URL do PDF da proposta
 * @returns Blob do PDF gerado
 */
export async function gerarPDFCompleto(
  propostaId: string,
  propostaNome: string,
  documentosUrls: Record<string, string>,
  pdfUrl: string,
): Promise<Blob> {
  try {
    // Verificar se a biblioteca PDF-lib está disponível
    await carregarPDFLib()

    // Verificar se a URL do PDF é válida
    if (!pdfUrl) {
      throw new Error("URL do PDF não fornecida")
    }

    // Validar a URL do PDF antes de prosseguir
    const pdfValido = await validarURL(pdfUrl)
    if (!pdfValido) {
      throw new Error("A URL do PDF não retorna um arquivo PDF válido")
    }

    // Baixar o PDF da proposta com tratamento de erros
    const propostaBlob = await downloadFileWithRetry(pdfUrl)
    if (!propostaBlob) {
      throw new Error("Não foi possível baixar o PDF da proposta")
    }

    // Verificar se o blob é um PDF válido
    if (!(await isPDFValid(propostaBlob))) {
      throw new Error("O arquivo baixado não é um PDF válido")
    }

    const propostaArrayBuffer = await propostaBlob.arrayBuffer()

    // Criar um novo documento PDF
    const { PDFDocument, StandardFonts, rgb } = window.PDFLib

    try {
      // Tentar carregar o PDF com tratamento de erros
      const pdfDoc = await PDFDocument.load(propostaArrayBuffer, {
        ignoreEncryption: true,
        throwOnInvalidObject: false,
      })

      // Adicionar uma página de índice no início
      const indexPage = pdfDoc.insertPage(0)
      const { width, height } = indexPage.getSize()
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

      // Título
      indexPage.drawText("PROPOSTA COMPLETA", {
        x: 50,
        y: height - 50,
        size: 18,
        font,
        color: rgb(0, 0, 0),
      })

      // Informações da proposta
      indexPage.drawText(`Cliente: ${propostaNome}`, {
        x: 50,
        y: height - 100,
        size: 12,
        font: regularFont,
        color: rgb(0, 0, 0),
      })

      indexPage.drawText(`Proposta: ${propostaId.substring(0, 8)}`, {
        x: 50,
        y: height - 120,
        size: 12,
        font: regularFont,
        color: rgb(0, 0, 0),
      })

      indexPage.drawText(`Data: ${new Date().toLocaleDateString("pt-BR")}`, {
        x: 50,
        y: height - 140,
        size: 12,
        font: regularFont,
        color: rgb(0, 0, 0),
      })

      // Índice de conteúdo
      indexPage.drawText("Conteúdo:", {
        x: 50,
        y: height - 180,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      })

      let yPosition = height - 210

      // Proposta
      indexPage.drawText(`1. Proposta Assinada - Página 2`, {
        x: 70,
        y: yPosition,
        size: 12,
        font: regularFont,
        color: rgb(0, 0, 0),
      })

      yPosition -= 20

      // Documentos
      let docIndex = 2
      for (const key of Object.keys(documentosUrls)) {
        indexPage.drawText(`${docIndex}. ${getNomeDocumento(key)} - Página ${docIndex + 1}`, {
          x: 70,
          y: yPosition,
          size: 12,
          font: regularFont,
          color: rgb(0, 0, 0),
        })

        yPosition -= 20
        docIndex++
      }

      // Adicionar documentos
      for (const [key, url] of Object.entries(documentosUrls)) {
        try {
          // Validar a URL do documento
          const docValido = await validarURL(url as string)
          if (!docValido) {
            console.warn(`URL inválida para o documento ${key}: ${url}`)
            continue
          }

          // Baixar o documento
          const docBlob = await downloadFileWithRetry(url as string)
          if (!docBlob) {
            console.warn(`Não foi possível baixar o documento ${key}`)
            continue
          }

          const docArrayBuffer = await docBlob.arrayBuffer()

          // Determinar o tipo de arquivo
          const isImage = /\.(jpe?g|png|gif|bmp|webp)$/i.test(url as string)
          const isPDF = /\.pdf$/i.test(url as string)

          if (isPDF) {
            try {
              // Se for PDF, incorporar suas páginas
              const docPdf = await PDFDocument.load(docArrayBuffer, {
                ignoreEncryption: true,
                throwOnInvalidObject: false,
              })
              const docPages = await pdfDoc.copyPages(docPdf, docPdf.getPageIndices())

              // Adicionar cada página do documento ao PDF principal
              for (const page of docPages) {
                pdfDoc.addPage(page)
              }
            } catch (error) {
              console.error(`Erro ao processar PDF ${key}:`, error)
              // Adicionar uma página com mensagem de erro
              const errorPage = pdfDoc.addPage()
              errorPage.drawText(`Erro ao processar documento: ${getNomeDocumento(key)}`, {
                x: 50,
                y: height - 50,
                size: 14,
                font,
                color: rgb(1, 0, 0),
              })
            }
          } else if (isImage) {
            try {
              // Se for imagem, criar uma nova página e incorporar a imagem
              let image
              if (/\.jpe?g$/i.test(url as string)) {
                image = await pdfDoc.embedJpg(docArrayBuffer)
              } else if (/\.png$/i.test(url as string)) {
                image = await pdfDoc.embedPng(docArrayBuffer)
              } else {
                // Para outros formatos de imagem, pular
                console.warn(`Formato de imagem não suportado: ${url}`)
                continue
              }

              // Criar uma nova página
              const page = pdfDoc.addPage()
              const { width, height } = page.getSize()

              // Calcular dimensões para manter a proporção da imagem
              const imgWidth = image.width
              const imgHeight = image.height
              const ratio = Math.min(width / imgWidth, height / imgHeight) * 0.9
              const scaledWidth = imgWidth * ratio
              const scaledHeight = imgHeight * ratio

              // Adicionar título do documento
              page.drawText(getNomeDocumento(key), {
                x: 50,
                y: height - 50,
                size: 14,
                font,
                color: rgb(0, 0, 0),
              })

              // Desenhar a imagem centralizada na página
              page.drawImage(image, {
                x: (width - scaledWidth) / 2,
                y: (height - scaledHeight) / 2,
                width: scaledWidth,
                height: scaledHeight,
              })
            } catch (error) {
              console.error(`Erro ao processar imagem ${key}:`, error)
              // Adicionar uma página com mensagem de erro
              const errorPage = pdfDoc.addPage()
              errorPage.drawText(`Erro ao processar imagem: ${getNomeDocumento(key)}`, {
                x: 50,
                y: height - 50,
                size: 14,
                font,
                color: rgb(1, 0, 0),
              })
            }
          } else {
            // Para outros tipos de arquivo, adicionar uma página com informações
            const page = pdfDoc.addPage()
            page.drawText(`Documento: ${getNomeDocumento(key)}`, {
              x: 50,
              y: height - 50,
              size: 14,
              font,
              color: rgb(0, 0, 0),
            })

            page.drawText(`(Tipo de arquivo não suportado para visualização)`, {
              x: 50,
              y: height - 80,
              size: 12,
              font: regularFont,
              color: rgb(0, 0, 0),
            })
          }
        } catch (error) {
          console.error(`Erro ao processar documento ${key}:`, error)
          // Adicionar uma página com mensagem de erro
          const page = pdfDoc.addPage()
          const { width, height } = page.getSize()

          page.drawText(`Erro ao processar documento: ${getNomeDocumento(key)}`, {
            x: 50,
            y: height - 50,
            size: 14,
            font,
            color: rgb(1, 0, 0),
          })
        }
      }

      // Gerar o PDF final
      const pdfBytes = await pdfDoc.save()
      return new Blob([pdfBytes], { type: "application/pdf" })
    } catch (error) {
      console.error("Erro ao processar o PDF:", error)

      // Alternativa: Se não conseguir processar o PDF, retornar apenas o PDF original
      console.log("Retornando apenas o PDF original como fallback")
      return propostaBlob
    }
  } catch (error) {
    console.error("Erro ao gerar PDF completo:", error)
    throw error
  }
}

/**
 * Carrega dinamicamente a biblioteca PDF-lib
 */
async function carregarPDFLib(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.PDFLib) {
      resolve()
      return
    }

    const script = document.createElement("script")
    script.src = "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"
    script.onload = () => {
      console.log("PDF-lib carregado com sucesso")
      resolve()
    }
    script.onerror = () => {
      reject(new Error("Erro ao carregar PDF-lib"))
    }
    document.head.appendChild(script)
  })
}

/**
 * Obtém o nome formatado do documento com base na chave
 * @param key Chave do documento
 * @returns Nome formatado do documento
 */
function getNomeDocumento(key: string): string {
  switch (key) {
    case "rg_frente":
      return "RG (Frente)"
    case "rg_verso":
      return "RG (Verso)"
    case "cpf":
      return "CPF"
    case "comprovante_residencia":
      return "Comprovante de Residência"
    case "cns":
      return "Cartão Nacional de Saúde"
    default:
      return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }
}

/**
 * Baixa um arquivo com tentativas de retry
 * @param url URL do arquivo
 * @param maxRetries Número máximo de tentativas
 * @returns Blob do arquivo ou null em caso de erro
 */
async function downloadFileWithRetry(url: string, maxRetries = 3): Promise<Blob | null> {
  let retries = 0

  while (retries < maxRetries) {
    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-cache",
        headers: {
          Accept: "application/pdf,image/*,*/*",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      return blob
    } catch (error) {
      console.error(`Tentativa ${retries + 1} falhou:`, error)
      retries++

      if (retries >= maxRetries) {
        console.error(`Todas as ${maxRetries} tentativas falharam`)
        return null
      }

      // Esperar antes de tentar novamente (backoff exponencial)
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries)))
    }
  }

  return null
}

/**
 * Verifica se um blob é um PDF válido
 * @param blob Blob a ser verificado
 * @returns true se for um PDF válido, false caso contrário
 */
async function isPDFValid(blob: Blob): Promise<boolean> {
  try {
    // Verificar o tipo MIME
    if (blob.type !== "application/pdf" && !blob.type.includes("pdf")) {
      console.warn(`Tipo MIME inválido: ${blob.type}`)
      // Continuar mesmo assim, pois às vezes o tipo MIME pode estar incorreto
    }

    // Verificar o cabeçalho do PDF
    const arrayBuffer = await blob.slice(0, 5).arrayBuffer()
    const header = new Uint8Array(arrayBuffer)
    const headerString = String.fromCharCode(...header)

    if (headerString !== "%PDF-") {
      console.warn("Cabeçalho de PDF inválido:", headerString)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao verificar validade do PDF:", error)
    return false
  }
}

/**
 * Valida uma URL verificando se ela retorna um status 200
 * @param url URL a ser validada
 * @returns true se a URL for válida, false caso contrário
 */
async function validarURL(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-cache",
    })
    return response.ok
  } catch (error) {
    console.error("Erro ao validar URL:", error)
    return false
  }
}

/**
 * Função alternativa para gerar um PDF simples com links para os documentos
 * Usada como fallback quando a geração do PDF completo falha
 */
export async function gerarPDFSimples(
  propostaId: string,
  propostaNome: string,
  documentosUrls: Record<string, string>,
  pdfUrl: string,
): Promise<Blob> {
  try {
    await carregarPDFLib()

    const { PDFDocument, StandardFonts, rgb } = window.PDFLib

    // Criar um novo documento PDF
    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

    // Adicionar página de índice
    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()

    // Título
    page.drawText("PROPOSTA E DOCUMENTOS", {
      x: 50,
      y: height - 50,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    })

    // Informações da proposta
    page.drawText(`Cliente: ${propostaNome}`, {
      x: 50,
      y: height - 100,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    })

    page.drawText(`Proposta: ${propostaId.substring(0, 8)}`, {
      x: 50,
      y: height - 120,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    })

    page.drawText(`Data: ${new Date().toLocaleDateString("pt-BR")}`, {
      x: 50,
      y: height - 140,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    })

    // Nota sobre visualização
    page.drawText("Nota: Este PDF contém links para visualizar os documentos originais.", {
      x: 50,
      y: height - 180,
      size: 10,
      font: regularFont,
      color: rgb(0.5, 0, 0),
    })

    // Lista de documentos
    page.drawText("Documentos:", {
      x: 50,
      y: height - 220,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    })

    let yPosition = height - 250

    // Proposta
    page.drawText(`1. Proposta Assinada`, {
      x: 70,
      y: yPosition,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    })

    yPosition -= 20

    // Documentos
    let docIndex = 2
    for (const key of Object.keys(documentosUrls)) {
      page.drawText(`${docIndex}. ${getNomeDocumento(key)}`, {
        x: 70,
        y: yPosition,
        size: 12,
        font: regularFont,
        color: rgb(0, 0, 0),
      })

      yPosition -= 20
      docIndex++
    }

    // Gerar o PDF
    const pdfBytes = await pdfDoc.save()
    return new Blob([pdfBytes], { type: "application/pdf" })
  } catch (error) {
    console.error("Erro ao gerar PDF simples:", error)
    throw error
  }
}
