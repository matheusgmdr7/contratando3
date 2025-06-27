/**
 * Utilitário para detectar tipos de arquivo de forma mais precisa
 */

/**
 * Detecta o tipo MIME baseado na assinatura do arquivo (magic numbers)
 */
export async function detectFileTypeFromBuffer(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer
      if (!buffer) {
        resolve(detectMimeTypeFromName(file.name))
        return
      }

      const bytes = new Uint8Array(buffer.slice(0, 12))

      // JPEG
      if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        resolve("image/jpeg")
        return
      }

      // PNG
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
        resolve("image/png")
        return
      }

      // PDF
      if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        resolve("application/pdf")
        return
      }

      // GIF
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
        resolve("image/gif")
        return
      }

      // WebP
      if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
        resolve("image/webp")
        return
      }

      // Se não conseguir detectar pela assinatura, usar o nome do arquivo
      resolve(detectMimeTypeFromName(file.name))
    }

    reader.onerror = () => {
      resolve(detectMimeTypeFromName(file.name))
    }

    // Ler apenas os primeiros 12 bytes para detectar o tipo
    reader.readAsArrayBuffer(file.slice(0, 12))
  })
}

/**
 * Detecta tipo MIME pelo nome do arquivo
 */
export function detectMimeTypeFromName(fileName: string): string {
  const name = fileName.toLowerCase()

  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
    return "image/jpeg"
  }
  if (name.endsWith(".png")) {
    return "image/png"
  }
  if (name.endsWith(".pdf")) {
    return "application/pdf"
  }
  if (name.endsWith(".gif")) {
    return "image/gif"
  }
  if (name.endsWith(".webp")) {
    return "image/webp"
  }
  if (name.endsWith(".bmp")) {
    return "image/bmp"
  }
  if (name.endsWith(".svg")) {
    return "image/svg+xml"
  }

  // Padrão para documentos (geralmente são fotos de documentos)
  return "image/jpeg"
}

/**
 * Valida se o tipo de arquivo é permitido
 */
export function isAllowedFileType(mimeType: string): boolean {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "application/pdf",
  ]

  return allowedTypes.includes(mimeType.toLowerCase())
}

/**
 * Obter extensão recomendada para um tipo MIME
 */
export function getExtensionForMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/bmp": "bmp",
    "application/pdf": "pdf",
    "image/svg+xml": "svg",
  }

  return mimeToExt[mimeType.toLowerCase()] || "jpg"
}
