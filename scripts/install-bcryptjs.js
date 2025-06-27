const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("🔧 Instalando bcryptjs...")

try {
  // Verificar se package.json existe
  const packageJsonPath = path.join(process.cwd(), "package.json")
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error("package.json não encontrado")
  }

  // Ler package.json atual
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

  // Adicionar bcryptjs às dependências
  if (!packageJson.dependencies) {
    packageJson.dependencies = {}
  }

  if (!packageJson.devDependencies) {
    packageJson.devDependencies = {}
  }

  // Adicionar as dependências
  packageJson.dependencies["bcryptjs"] = "^2.4.3"
  packageJson.devDependencies["@types/bcryptjs"] = "^2.4.6"

  // Salvar package.json atualizado
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

  console.log("✅ bcryptjs adicionado ao package.json")
  console.log("✅ @types/bcryptjs adicionado ao package.json")

  // Tentar executar npm install
  try {
    console.log("📦 Executando npm install...")
    execSync("npm install", { stdio: "inherit" })
    console.log("🎉 Instalação concluída com sucesso!")
  } catch (installError) {
    console.log("⚠️  Não foi possível executar npm install automaticamente.")
    console.log("📋 Execute manualmente: npm install")
  }
} catch (error) {
  console.error("❌ Erro durante a instalação:", error.message)

  // Fallback: criar arquivo com instruções
  const instructionsPath = path.join(process.cwd(), "INSTALL_BCRYPTJS.md")
  const instructions = `# Instalação do bcryptjs

## Opção 1: Manual
Execute no terminal:
\`\`\`bash
npm install bcryptjs @types/bcryptjs
\`\`\`

## Opção 2: Adicionar ao package.json
Adicione estas linhas ao seu package.json:

**dependencies:**
\`\`\`json
"bcryptjs": "^2.4.3"
\`\`\`

**devDependencies:**
\`\`\`json
"@types/bcryptjs": "^2.4.6"
\`\`\`

Depois execute: \`npm install\`

## Verificar instalação
Execute: \`node -e "console.log(require('bcryptjs'))"\`
`

  fs.writeFileSync(instructionsPath, instructions)
  console.log("📄 Instruções salvas em INSTALL_BCRYPTJS.md")
}
