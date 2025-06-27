import { supabase } from "@/lib/supabase"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { v4 as uuidv4 } from "uuid"

/**
 * Serviço para geração e manipulação de PDFs
 */
export class PDFService {
  /**
   * Verifica se um PDF tem campos de formulário e lista os campos disponíveis
   * @param pdfUrl URL do PDF a ser verificado
   * @returns Objeto com informações sobre os campos do formulário
   */
  static async verificarCamposFormulario(pdfUrl: string): Promise<{
    temCampos: boolean
    totalCampos: number
    campos: string[]
    erro?: string
  }> {
    try {
      console.log("Verificando campos de formulário do PDF:", pdfUrl)

      // Baixar o PDF
      const response = await fetch(pdfUrl)
      if (!response.ok) {
        throw new Error(`Erro ao baixar o PDF: ${response.status} ${response.statusText}`)
      }

      // Obter os bytes do PDF
      const pdfBytes = await response.arrayBuffer()
      if (!pdfBytes || pdfBytes.byteLength === 0) {
        throw new Error("O arquivo PDF baixado está vazio")
      }

      try {
        // Carregar o PDF usando pdf-lib com opção ignoreEncryption
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })

        // Obter o formulário
        const form = pdfDoc.getForm()
        const fields = form.getFields()

        // Listar os campos
        const camposInfo = fields.map((field) => ({
          nome: field.getName(),
          tipo: field.constructor.name,
        }))

        console.log(`PDF tem ${fields.length} campos de formulário:`)
        camposInfo.forEach((campo) => {
          console.log(`- ${campo.nome} (${campo.tipo})`)
        })

        return {
          temCampos: fields.length > 0,
          totalCampos: fields.length,
          campos: camposInfo.map((c) => `${c.nome} (${c.tipo})`),
        }
      } catch (pdfError) {
        console.error("Erro ao processar PDF com pdf-lib:", pdfError)

        // Verificar se é o erro específico "Could not find page for PDFRef"
        if (pdfError.message && pdfError.message.includes("Could not find page for PDFRef")) {
          console.warn(
            "Erro conhecido: 'Could not find page for PDFRef'. Este PDF pode estar corrompido ou usar recursos não suportados.",
          )
          return {
            temCampos: false,
            totalCampos: 0,
            campos: [],
            erro: "Este PDF não pode ser analisado devido a problemas de estrutura. Considere usar um PDF mais simples ou gerado com ferramentas padrão.",
          }
        }

        throw pdfError
      }
    } catch (error) {
      console.error("Erro ao verificar campos do formulário:", error)
      return {
        temCampos: false,
        totalCampos: 0,
        campos: [],
        erro: error.message || "Erro desconhecido ao verificar campos",
      }
    }
  }

  /**
   * Gera um PDF a partir de um HTML
   * @param htmlContent Conteúdo HTML para converter em PDF
   * @param fileName Nome do arquivo PDF a ser gerado
   * @returns URL do PDF gerado
   */
  static async generatePDFFromHTML(htmlContent: string, fileName: string): Promise<string> {
    try {
      console.log("Iniciando geração de PDF a partir de HTML")

      // Verificar se já existe um PDF com este nome no cache
      const cacheKey = `pdf_cache_${fileName}`
      const cachedUrl = localStorage.getItem(cacheKey)

      if (cachedUrl) {
        console.log("PDF encontrado no cache")

        // Verificar se o PDF ainda está acessível
        try {
          const response = await fetch(cachedUrl, { method: "HEAD" })
          if (response.ok) {
            console.log("PDF do cache ainda é válido")
            return cachedUrl
          }
        } catch (e) {
          console.log("PDF do cache não é mais válido")
        }
      }

      // Método alternativo: Criar um PDF simples usando pdf-lib
      // Este método é mais confiável que abrir uma janela para impressão
      console.log("Criando PDF simples a partir do HTML")

      // Extrair o título da proposta do HTML
      let title = "Proposta de Plano de Saúde"
      const titleMatch = htmlContent.match(/<h1>(.*?)<\/h1>/)
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim()
      }

      // Extrair o conteúdo do HTML (simplificado)
      // Remover tags HTML e converter para texto simples
      const content = htmlContent
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, "\n")
        .replace(/\n{2,}/g, "\n\n")
        .trim()

      // Criar um PDF simples com o conteúdo extraído
      return await PDFService.createSimplePDF(title, content, fileName)
    } catch (error) {
      console.error("Erro ao gerar PDF a partir de HTML:", error)
      throw new Error(`Falha ao gerar PDF a partir do HTML: ${error.message || "Erro desconhecido"}`)
    }
  }

  /**
   * Preenche um modelo de PDF com dados
   * @param templateUrl URL do modelo de PDF
   * @param data Dados para preencher o PDF
   * @param fileName Nome do arquivo PDF a ser gerado
   * @returns URL do PDF gerado
   */
  static async fillPDFTemplate(templateUrl: string, data: Record<string, any>, fileName: string): Promise<string> {
    try {
      console.log("Iniciando preenchimento de modelo PDF", { templateUrl, fileName })

      // Verificar se a URL do template é válida
      if (!templateUrl || typeof templateUrl !== "string" || !templateUrl.trim()) {
        console.error("URL do modelo de PDF inválida:", templateUrl)
        throw new Error("URL do modelo de PDF inválida")
      }

      // Verificar se o pdf-lib está instalado corretamente
      if (!PDFDocument) {
        console.error("pdf-lib não está disponível. Verifique se a biblioteca está instalada corretamente.")
        throw new Error("pdf-lib não está disponível. Verifique se a biblioteca está instalada corretamente.")
      }

      // Processar a URL do template para garantir que seja válida
      let processedUrl = templateUrl.trim()

      // Corrigir duplicação de barras no caminho
      processedUrl = processedUrl.replace(/([^:])\/\/+/g, "$1/")

      console.log("URL após correção de barras duplicadas:", processedUrl)

      // Verificar se a URL é um caminho do Supabase Storage
      if (processedUrl.startsWith("/arquivos/") || !processedUrl.startsWith("http")) {
        console.log("URL parece ser um caminho do Supabase Storage, obtendo URL pública")

        // Remover o prefixo "/arquivos/" se existir
        const storagePath = processedUrl.replace(/^\/arquivos\//, "")

        // Obter a URL pública do arquivo
        const { data: urlData } = supabase.storage.from("arquivos").getPublicUrl(storagePath)

        if (!urlData || !urlData.publicUrl) {
          throw new Error(`Não foi possível obter a URL pública para o caminho: ${storagePath}`)
        }

        processedUrl = urlData.publicUrl
        console.log("URL pública obtida:", processedUrl)
      }

      // Verificar se a URL tem protocolo
      if (!processedUrl.startsWith("http://") && !processedUrl.startsWith("https://")) {
        console.log("URL sem protocolo, adicionando https://")
        processedUrl = `https://${processedUrl}`
      }

      // Garantir que a URL esteja corretamente codificada
      try {
        // Verificar se a URL já está codificada
        if (processedUrl.includes("%20") || processedUrl.includes("%")) {
          console.log("URL já parece estar codificada, usando como está")
        } else {
          // Separar a URL base dos parâmetros de consulta
          const urlObj = new URL(processedUrl)

          // Garantir que o pathname esteja corretamente codificada
          urlObj.pathname = urlObj.pathname
            .split("/")
            .map((segment) =>
              // Não codificar segmentos vazios (que representam barras)
              segment === "" ? "" : encodeURIComponent(segment),
            )
            .join("/")

          processedUrl = urlObj.toString()
        }
      } catch (encodeError) {
        console.warn("Erro ao processar URL:", encodeError)
        // Continuar com a URL original se houver erro na codificação
      }

      console.log("URL final processada para download:", processedUrl)

      // Baixar o modelo de PDF
      console.log("Baixando modelo de PDF")
      let templateResponse
      try {
        templateResponse = await fetch(processedUrl, {
          method: "GET",
          headers: {
            Accept: "application/pdf,*/*",
            "Cache-Control": "no-cache",
          },
          cache: "no-store",
        })

        if (!templateResponse.ok) {
          console.error(`Erro HTTP ao baixar modelo: ${templateResponse.status} ${templateResponse.statusText}`)
          console.error("URL utilizada:", processedUrl)

          // Tentar obter mais informações sobre o erro
          let errorBody = ""
          try {
            errorBody = await templateResponse.text()
            console.error("Resposta de erro:", errorBody.substring(0, 500)) // Limitar o tamanho do log
          } catch (textError) {
            console.error("Não foi possível ler o corpo da resposta de erro")
          }

          // Tentar uma abordagem alternativa para URLs do Supabase
          if (processedUrl.includes("supabase") && processedUrl.includes("storage")) {
            console.log("Tentando abordagem alternativa para URL do Supabase...")

            // Extrair o bucket e o caminho do arquivo da URL
            const matches = processedUrl.match(/public\/([^/]+)\/(.+)$/)
            if (matches && matches.length >= 3) {
              const bucket = matches[1]
              const filePath = decodeURIComponent(matches[2])
              console.log(`Bucket extraído: ${bucket}, Caminho do arquivo: ${filePath}`)

              // Tentar obter o arquivo diretamente do storage
              const { data: fileData, error } = await supabase.storage.from(bucket).download(filePath)

              if (error) {
                console.error("Erro ao baixar diretamente do storage:", error)
                throw new Error(`Falha ao baixar o modelo de PDF: ${error.message}`)
              }

              if (fileData) {
                console.log("Arquivo baixado diretamente do storage com sucesso")
                const templateArrayBuffer = await fileData.arrayBuffer()

                try {
                  // Tentar processar o PDF com os bytes obtidos
                  return await PDFService.processLoadedPDF(templateArrayBuffer, data, fileName)
                } catch (processError) {
                  // Verificar se é o erro específico "Could not find page for PDFRef"
                  if (processError.message && processError.message.includes("Could not find page for PDFRef")) {
                    console.warn("Erro conhecido: 'Could not find page for PDFRef'. Usando PDF alternativo.")
                    return await PDFService.createFallbackPDF(data, fileName)
                  }
                  throw processError
                }
              }
            }
          }

          // Tentar com a URL correta para TEST1 se a URL atual parece ser para esse modelo
          if (processedUrl.includes("Proposta%20Amil.pdf") || processedUrl.includes("Proposta Amil.pdf")) {
            console.log("URL parece ser para o modelo Amil, tentando com a URL do TEST1...")
            const urlTest1 =
              "https://jtzbuxoslaotpnwsphqv.supabase.co/storage/v1/object/public/modelos/PROPOSTA%20TEST1.pdf"

            console.log("Tentando com URL alternativa:", urlTest1)
            const testResponse = await fetch(urlTest1, {
              method: "GET",
              headers: {
                Accept: "application/pdf,*/*",
                "Cache-Control": "no-cache",
              },
              cache: "no-store",
            })

            if (testResponse.ok) {
              console.log("URL alternativa funcionou, usando-a")
              templateResponse = testResponse
            } else {
              console.error("URL alternativa também falhou")
              throw new Error(
                `Falha ao baixar o modelo de PDF: ${templateResponse.status} ${templateResponse.statusText}`,
              )
            }
          } else {
            throw new Error(
              `Falha ao baixar o modelo de PDF: ${templateResponse.status} ${templateResponse.statusText}`,
            )
          }
        }
      } catch (fetchError) {
        console.error("Erro ao baixar modelo de PDF:", fetchError)
        throw new Error(`Erro ao baixar modelo de PDF: ${fetchError.message || "Erro de rede"}`)
      }

      // Verificar o tipo de conteúdo
      const contentType = templateResponse.headers.get("content-type")
      console.log("Tipo de conteúdo do modelo:", contentType)
      if (contentType && !contentType.includes("application/pdf") && !contentType.includes("octet-stream")) {
        console.warn(`Tipo de conteúdo inesperado: ${contentType}. Esperado: application/pdf`)
      }

      // Obter o tamanho do arquivo
      const contentLength = templateResponse.headers.get("content-length")
      console.log("Tamanho do modelo:", contentLength ? `${Number.parseInt(contentLength) / 1024} KB` : "Desconhecido")

      // Obter os bytes do modelo
      try {
        const templateArrayBuffer = await templateResponse.arrayBuffer()
        console.log("Modelo de PDF baixado com sucesso, tamanho:", templateArrayBuffer.byteLength)

        if (templateArrayBuffer.byteLength === 0) {
          throw new Error("O arquivo PDF baixado está vazio (0 bytes)")
        }

        try {
          // Carregar o PDF usando pdf-lib com opção ignoreEncryption
          console.log("Carregando PDF com pdf-lib, tamanho:", templateArrayBuffer.byteLength)
          let pdfDoc
          try {
            pdfDoc = await PDFDocument.load(templateArrayBuffer, {
              ignoreEncryption: true,
              throwOnInvalidObject: false,
              parseSpeed: "slow", // Adicionar parsing mais lento mas mais robusto
            })
          } catch (loadError) {
            console.error("Erro ao carregar PDF com pdf-lib:", loadError)

            // Verificar se é o erro específico "Could not find page for PDFRef"
            if (loadError.message && loadError.message.includes("Could not find page for PDFRef")) {
              console.warn(
                "Erro conhecido: 'Could not find page for PDFRef'. PDF pode estar corrompido ou ter estrutura incompatível.",
              )

              // Tentar uma abordagem alternativa: verificar se o PDF tem páginas válidas
              try {
                // Tentar carregar com configurações mais permissivas
                pdfDoc = await PDFDocument.load(templateArrayBuffer, {
                  ignoreEncryption: true,
                  throwOnInvalidObject: false,
                  parseSpeed: "slow",
                  capNumbers: false,
                  throwOnInvalidObject: false,
                })

                // Verificar se conseguimos acessar as páginas
                const pageCount = pdfDoc.getPageCount()
                console.log(`PDF carregado com ${pageCount} páginas após configurações permissivas`)
              } catch (secondError) {
                console.error("Segunda tentativa de carregamento falhou:", secondError)
                console.warn("PDF incompatível com pdf-lib. Usando PDF alternativo.")
                return await PDFService.createFallbackPDF(data, fileName)
              }
            } else {
              throw new Error(
                `Erro ao carregar o PDF com pdf-lib: ${loadError.message || "Formato de arquivo inválido"}`,
              )
            }
          }

          // Verificar se o PDF foi carregado corretamente
          if (!pdfDoc) {
            console.error("PDF não foi carregado corretamente")
            return await PDFService.createFallbackPDF(data, fileName)
          }

          // Verificar se o PDF tem um formulário válido
          let form
          try {
            form = pdfDoc.getForm()
            const fields = form.getFields()
            console.log(`PDF carregado com sucesso. Formulário contém ${fields.length} campos.`)

            if (fields.length === 0) {
              console.warn("O modelo de PDF não contém campos de formulário.")
              return await PDFService.createFallbackPDF(data, fileName)
            }
          } catch (formError) {
            console.error("Erro ao acessar formulário do PDF:", formError)
            if (formError.message && formError.message.includes("Could not find page for PDFRef")) {
              console.warn("Erro ao acessar formulário. Usando PDF alternativo.")
              return await PDFService.createFallbackPDF(data, fileName)
            }
            throw formError
          }

          // Se não tem campos, criar um PDF alternativo com os dados
          // return await PDFService.createFallbackPDF(data, fileName)

          // Se tem campos, continuar com o processamento normal
          return await PDFService.processLoadedPDF(templateArrayBuffer, data, fileName)
        } catch (formError) {
          console.error("Erro ao verificar campos do formulário:", formError)

          // Verificar se é o erro específico "Could not find page for PDFRef"
          if (formError.message && formError.message.includes("Could not find page for PDFRef")) {
            console.warn("Erro conhecido: 'Could not find page for PDFRef'. Usando PDF alternativo.")
            return await PDFService.createFallbackPDF(data, fileName)
          }

          // Se houver outro erro ao verificar os campos, criar um PDF alternativo
          return await PDFService.createFallbackPDF(data, fileName)
        }
      } catch (arrayBufferError) {
        console.error("Erro ao obter arrayBuffer do modelo:", arrayBufferError)
        throw new Error(`Erro ao processar o arquivo PDF: ${arrayBufferError.message || "Erro ao ler o arquivo"}`)
      }
    } catch (error) {
      console.error("Erro ao preencher modelo PDF:", error)

      // Última tentativa: criar um PDF de fallback mesmo após erro
      try {
        console.log("Tentativa final: criando PDF de fallback após erro")
        return await PDFService.createFallbackPDF(data, fileName)
      } catch (fallbackError) {
        console.error("Erro ao criar PDF de fallback:", fallbackError)
        throw error // Lançar o erro original
      }
    }
  }

  /**
   * Processa um PDF já carregado
   * @param templateArrayBuffer Bytes do PDF template
   * @param data Dados para preencher o PDF
   * @param fileName Nome do arquivo PDF a ser gerado
   * @returns URL do PDF gerado
   */
  static async processLoadedPDF(
    templateArrayBuffer: ArrayBuffer,
    data: Record<string, any>,
    fileName: string,
  ): Promise<string> {
    try {
      // Verificar se os bytes do PDF são válidos
      if (
        !templateArrayBuffer ||
        !(templateArrayBuffer instanceof ArrayBuffer) ||
        templateArrayBuffer.byteLength === 0
      ) {
        console.error("Bytes do PDF inválidos:", templateArrayBuffer)
        throw new Error("Os bytes do PDF fornecidos são inválidos ou vazios")
      }

      // Carregar o PDF usando pdf-lib com opção ignoreEncryption
      console.log("Carregando PDF com pdf-lib, tamanho:", templateArrayBuffer.byteLength)
      let pdfDoc
      try {
        pdfDoc = await PDFDocument.load(templateArrayBuffer, { ignoreEncryption: true })
      } catch (loadError) {
        console.error("Erro ao carregar PDF com pdf-lib:", loadError)

        // Verificar se é o erro específico "Could not find page for PDFRef"
        if (loadError.message && loadError.message.includes("Could not find page for PDFRef")) {
          console.warn("Erro conhecido: 'Could not find page for PDFRef'. Usando PDF alternativo.")
          return await PDFService.createFallbackPDF(data, fileName)
        }

        throw new Error(`Erro ao carregar o PDF com pdf-lib: ${loadError.message || "Formato de arquivo inválido"}`)
      }

      // Verificar se o PDF tem um formulário
      const form = pdfDoc.getForm()
      const fields = form.getFields()
      console.log(`PDF carregado com sucesso. Formulário contém ${fields.length} campos.`)

      if (fields.length === 0) {
        console.warn("O modelo de PDF não contém campos de formulário.")
        return await PDFService.createFallbackPDF(data, fileName)
      }

      // Listar os campos disponíveis para debug
      console.log("Campos disponíveis no formulário:")
      fields.forEach((field) => {
        console.log(`- ${field.getName()} (${field.constructor.name})`)
      })

      // Preencher os campos do formulário
      console.log("Preenchendo campos do formulário PDF")
      let camposPreenchidos = 0

      Object.entries(data).forEach(([key, value]) => {
        try {
          // Tentar obter o campo pelo nome exato
          let field = null
          try {
            field = form.getTextField(key)
          } catch (e) {
            // Campo não encontrado ou não é um campo de texto
          }

          // Se não encontrou, tentar variações do nome
          if (!field) {
            const variations = [
              key,
              key.toUpperCase(),
              key.toLowerCase(),
              `txt${key}`,
              `txt_${key}`,
              `field_${key}`,
              key.replace(/_/g, ""),
              key.replace(/[_-]/g, " "),
            ]

            for (const variation of variations) {
              try {
                field = form.getTextField(variation)
                if (field) {
                  console.log(`Campo encontrado com variação: ${variation}`)
                  break
                }
              } catch (e) {
                // Continuar tentando
              }
            }
          }

          // Se encontrou o campo, preencher
          if (field) {
            field.setText(String(value))
            camposPreenchidos++
          } else {
            console.warn(`Campo não encontrado: ${key}`)
          }
        } catch (fieldError) {
          console.warn(`Erro ao preencher campo ${key}:`, fieldError)
        }
      })

      console.log(`Preenchidos ${camposPreenchidos} campos de ${Object.keys(data).length} dados disponíveis`)

      // Achatar o formulário para que os campos preenchidos não sejam editáveis
      try {
        // Verificar se o formulário pode ser achatado
        const fields = form.getFields()
        if (fields.length > 0) {
          console.log("Tentando achatar formulário...")
          form.flatten()
          console.log("Formulário achatado com sucesso")
        }
      } catch (flattenError) {
        console.warn("Erro ao achatar formulário:", flattenError)

        if (flattenError.message && flattenError.message.includes("Could not find page for PDFRef")) {
          console.warn("Erro conhecido ao achatar formulário. Continuando sem achatar.")
          // Continuar sem achatar o formulário - os campos permanecerão editáveis
        } else {
          console.warn("Erro desconhecido ao achatar formulário. Continuando sem achatar.")
        }
        // Não falhar completamente, apenas continuar sem achatar
      }

      // Salvar o PDF preenchido
      console.log("Salvando PDF preenchido")
      let savedPdfBytes
      try {
        savedPdfBytes = await pdfDoc.save()
        console.log("PDF salvo com sucesso, tamanho:", savedPdfBytes.byteLength)
      } catch (saveError) {
        console.error("Erro ao salvar PDF:", saveError)

        // Verificar se é o erro específico "Could not find page for PDFRef"
        if (saveError.message && saveError.message.includes("Could not find page for PDFRef")) {
          console.warn("Erro conhecido: 'Could not find page for PDFRef'. Usando PDF alternativo.")
          return await PDFService.createFallbackPDF(data, fileName)
        }

        throw new Error(`Erro ao salvar o PDF preenchido: ${saveError.message || "Erro ao salvar"}`)
      }

      // Gerar um nome de arquivo único
      const uniqueFileName = `${fileName.replace(/\s+/g, "_")}_${uuidv4()}.pdf`

      // Fazer upload do PDF para o Supabase Storage
      console.log("Fazendo upload do PDF para o Storage:", uniqueFileName)
      let uploadResult
      try {
        uploadResult = await supabase.storage.from("arquivos").upload(`propostas/${uniqueFileName}`, savedPdfBytes, {
          contentType: "application/pdf",
          cacheControl: "3600",
        })

        if (uploadResult.error) {
          throw uploadResult.error
        }
      } catch (uploadError) {
        console.error("Erro ao fazer upload do PDF:", uploadError)
        throw new Error(`Erro ao fazer upload do PDF: ${uploadError.message || "Erro de upload"}`)
      }

      // Obter a URL pública do arquivo
      let urlData
      try {
        urlData = supabase.storage.from("arquivos").getPublicUrl(`propostas/${uniqueFileName}`)
        if (!urlData.data || !urlData.data.publicUrl) {
          throw new Error("Não foi possível obter a URL pública do arquivo")
        }
      } catch (urlError) {
        console.error("Erro ao obter URL pública:", urlError)
        throw new Error(`Erro ao obter URL pública do PDF: ${urlError.message || "Erro ao obter URL"}`)
      }

      console.log("PDF gerado e armazenado com sucesso", urlData.data.publicUrl)
      return urlData.data.publicUrl
    } catch (error) {
      console.error("Erro ao processar PDF carregado:", error)

      // Verificar se é o erro específico "Could not find page for PDFRef"
      if (error.message && error.message.includes("Could not find page for PDFRef")) {
        console.warn("Erro conhecido: 'Could not find page for PDFRef'. Usando PDF alternativo.")
        return await PDFService.createFallbackPDF(data, fileName)
      }

      throw error
    }
  }

  /**
   * Cria um PDF simples com texto
   * @param title Título do PDF
   * @param content Conteúdo do PDF
   * @param fileName Nome do arquivo PDF a ser gerado
   * @returns URL do PDF gerado
   */
  static async createSimplePDF(title: string, content: string, fileName: string): Promise<string> {
    try {
      console.log("Criando PDF simples", { title, fileName })

      // Criar um novo documento PDF
      const pdfDoc = await PDFDocument.create()

      // Adicionar uma página
      const page = pdfDoc.addPage([595.28, 841.89]) // A4

      // Obter a fonte padrão
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      // Definir margens e posição inicial
      const margin = 50
      let y = page.getHeight() - margin

      // Adicionar título
      page.drawText(title, {
        x: margin,
        y,
        size: 18,
        font: boldFont,
        color: rgb(0.1, 0.5, 0.5),
      })

      y -= 40

      // Adicionar conteúdo
      const lines = content.split("\n")
      for (const line of lines) {
        if (y < margin) {
          // Adicionar nova página se necessário
          const newPage = pdfDoc.addPage([595.28, 841.89])
          y = newPage.getHeight() - margin
        }

        if (line.trim()) {
          page.drawText(line.trim(), {
            x: margin,
            y,
            size: 12,
            font,
            color: rgb(0, 0, 0),
          })
        }

        y -= 20
      }

      // Adicionar rodapé
      page.drawText(`Documento gerado em ${new Date().toLocaleString()}`, {
        x: margin,
        y: margin / 2,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5),
      })

      // Salvar o PDF
      const pdfBytes = await pdfDoc.save()

      // Gerar um nome de arquivo único
      const uniqueFileName = `${fileName.replace(/\s+/g, "_")}_${uuidv4()}.pdf`

      // Fazer upload do PDF para o Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("arquivos")
        .upload(`propostas/${uniqueFileName}`, pdfBytes, {
          contentType: "application/pdf",
          cacheControl: "3600",
        })

      if (uploadError) {
        throw new Error(`Erro ao fazer upload do PDF: ${uploadError.message}`)
      }

      // Obter a URL pública do arquivo
      const { data: urlData } = await supabase.storage.from("arquivos").getPublicUrl(`propostas/${uniqueFileName}`)

      console.log("PDF simples gerado com sucesso", urlData.publicUrl)
      return urlData.publicUrl
    } catch (error) {
      console.error("Erro ao criar PDF simples:", error)
      throw new Error(`Falha ao criar o PDF simples: ${error.message || "Erro desconhecido"}`)
    }
  }

  /**
   * Verifica se um PDF é acessível
   * @param url URL do PDF a ser verificado
   * @returns true se o PDF for acessível, false caso contrário
   */
  static async isPDFAccessible(url: string): Promise<boolean> {
    try {
      if (!url) return false

      // Verificar se a URL é válida
      try {
        new URL(url)
      } catch (e) {
        return false
      }

      // Verificar se o PDF está acessível
      const response = await fetch(url, { method: "HEAD" })
      return response.ok
    } catch (error) {
      console.error("Erro ao verificar acessibilidade do PDF:", error)
      return false
    }
  }

  /**
   * Cria um PDF de fallback quando o modelo não pode ser carregado
   * @param data Dados que seriam usados para preencher o modelo
   * @param fileName Nome do arquivo PDF a ser gerado
   * @returns URL do PDF gerado
   */
  static async createFallbackPDF(data: Record<string, any>, fileName: string): Promise<string> {
    try {
      console.log("Criando PDF de fallback", { fileName })

      // Criar um novo documento PDF
      const pdfDoc = await PDFDocument.create()

      // Adicionar uma página
      const page = pdfDoc.addPage([595.28, 841.89]) // A4

      // Obter a fonte padrão
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      // Definir margens e posição inicial
      const margin = 50
      let y = page.getHeight() - margin

      // Adicionar título
      page.drawText("Proposta de Plano de Saúde", {
        x: margin,
        y,
        size: 18,
        font: boldFont,
        color: rgb(0.1, 0.5, 0.5),
      })

      y -= 40

      // Adicionar dados da proposta
      const addField = (label: string, value: string) => {
        if (y < margin + 60) {
          // Adicionar nova página se necessário
          const newPage = pdfDoc.addPage([595.28, 841.89])
          y = newPage.getHeight() - margin
        }

        page.drawText(`${label}:`, {
          x: margin,
          y,
          size: 12,
          font: boldFont,
          color: rgb(0, 0, 0),
        })

        page.drawText(value || "Não informado", {
          x: margin + 150,
          y,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        })

        y -= 25
      }

      // Adicionar dados do cliente
      page.drawText("Dados do Cliente", {
        x: margin,
        y,
        size: 14,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.8),
      })
      y -= 30

      addField("Nome", data.nome || "")
      addField("CPF", data.cpf || "")
      addField("RG", data.rg || "")
      addField("Data de Nascimento", data.data_nascimento || "")
      addField("Email", data.email || "")
      addField("Telefone", data.telefone || "")
      addField("Celular", data.celular || "")

      // Adicionar nome da mãe se disponível
      if (data.nome_mae) {
        addField("Nome da Mãe", data.nome_mae)
      }

      // Adicionar peso e altura se disponíveis
      if (data.peso) {
        addField("Peso", data.peso)
      }
      if (data.altura) {
        addField("Altura", data.altura)
      }

      y -= 20
      page.drawText("Endereço", {
        x: margin,
        y,
        size: 14,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.8),
      })
      y -= 30

      addField("Endereço", data.endereco || "")
      addField("Bairro", data.bairro || "")
      addField("Cidade", data.cidade || "")
      addField("Estado", data.estado || "")
      addField("CEP", data.cep || "")

      y -= 20
      page.drawText("Dados do Plano", {
        x: margin,
        y,
        size: 14,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.8),
      })
      y -= 30

      addField("Plano", data.plano || "")
      addField("Cobertura", data.cobertura || "")
      addField("Acomodação", data.acomodacao || "")
      addField("Valor", data.valor || "")

      // Adicionar dependentes se houver
      for (let i = 1; i <= 5; i++) {
        const nome = data[`dependente${i}_nome`]
        if (nome) {
          if (i === 1) {
            y -= 20
            page.drawText("Dependentes", {
              x: margin,
              y,
              size: 14,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.8),
            })
            y -= 30
          }

          addField(`Dependente ${i} - Nome`, nome)
          addField(`Dependente ${i} - CPF`, data[`dependente${i}_cpf`] || "")
          addField(`Dependente ${i} - Data Nasc.`, data[`dependente${i}_data_nascimento`] || "")
          addField(`Dependente ${i} - Parentesco`, data[`dependente${i}_parentesco`] || "")
          y -= 10
        }
      }

      // Adicionar questionário de saúde se houver
      let questionarioAdicionado = false
      for (let i = 1; i <= 10; i++) {
        const pergunta = data[`pergunta${i}`]
        const resposta = data[`resposta${i}`]

        if (pergunta && resposta) {
          if (!questionarioAdicionado) {
            y -= 20
            page.drawText("Questionário de Saúde", {
              x: margin,
              y,
              size: 14,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.8),
            })
            y -= 30
            questionarioAdicionado = true
          }

          // Adicionar pergunta e resposta
          page.drawText(`${i}. ${pergunta}`, {
            x: margin,
            y,
            size: 11,
            font: boldFont,
            color: rgb(0, 0, 0),
          })
          y -= 20

          page.drawText(`Resposta: ${resposta}`, {
            x: margin + 10,
            y,
            size: 11,
            font,
            color: rgb(0, 0, 0),
          })
          y -= 15

          // Adicionar observação se houver
          const observacao = data[`observacao${i}`]
          if (observacao) {
            page.drawText(`Observação: ${observacao}`, {
              x: margin + 10,
              y,
              size: 10,
              font: font,
              color: rgb(0.3, 0.3, 0.3),
            })
            y -= 20
          }
        }
      }

      // Adicionar rodapé
      page.drawText(`Documento gerado em ${new Date().toLocaleString()}`, {
        x: margin,
        y: margin / 2,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5),
      })

      // Salvar o PDF
      const pdfBytes = await pdfDoc.save()

      // Gerar um nome de arquivo único
      const uniqueFileName = `${fileName.replace(/\s+/g, "_")}_fallback_${uuidv4()}.pdf`

      // Fazer upload do PDF para o Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("arquivos")
        .upload(`propostas/${uniqueFileName}`, pdfBytes, {
          contentType: "application/pdf",
          cacheControl: "3600",
        })

      if (uploadError) {
        throw new Error(`Erro ao fazer upload do PDF: ${uploadError.message}`)
      }

      // Obter a URL pública do arquivo
      const { data: urlData } = await supabase.storage.from("arquivos").getPublicUrl(`propostas/${uniqueFileName}`)

      console.log("PDF de fallback gerado com sucesso", urlData.publicUrl)
      return urlData.publicUrl
    } catch (error) {
      console.error("Erro ao criar PDF de fallback:", error)
      throw new Error(`Falha ao criar o PDF de fallback: ${error.message || "Erro desconhecido"}`)
    }
  }
}
