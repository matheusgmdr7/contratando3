const fs = require("fs")
const path = require("path")

console.log("🧹 Limpando arquivos de build...")

const foldersToClean = [".next", "node_modules/.cache", "dist"]

const filesToClean = ["package-lock.json", "yarn.lock"]

try {
  // Limpar pastas
  foldersToClean.forEach((folder) => {
    const folderPath = path.join(process.cwd(), folder)
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true })
      console.log(`❌ Removido: ${folder}`)
    }
  })

  // Limpar arquivos de lock (manter apenas um)
  filesToClean.forEach((file) => {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`❌ Removido: ${file}`)
    }
  })

  console.log("✅ Limpeza concluída!")
  console.log("📋 Execute: npm install")
} catch (error) {
  console.error("❌ Erro na limpeza:", error.message)
}
