const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

// Cores para o console
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
}

console.log(`${colors.blue}Iniciando instalação do Material UI e suas dependências...${colors.reset}`)

// Verificar se o package.json existe
const packageJsonPath = path.join(process.cwd(), "package.json")
if (!fs.existsSync(packageJsonPath)) {
  console.error(
    `${colors.red}Erro: package.json não encontrado. Certifique-se de estar no diretório raiz do projeto.${colors.reset}`,
  )
  process.exit(1)
}

try {
  // Ler o package.json atual
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

  // Verificar se as dependências já existem
  const dependencies = packageJson.dependencies || {}
  const needsMui = !dependencies["@mui/material"]
  const needsEmotionReact = !dependencies["@emotion/react"]
  const needsEmotionStyled = !dependencies["@emotion/styled"]

  if (!needsMui && !needsEmotionReact && !needsEmotionStyled) {
    console.log(`${colors.green}Todas as dependências já estão instaladas no package.json.${colors.reset}`)
    process.exit(0)
  }

  // Instalar as dependências
  console.log(`${colors.yellow}Instalando dependências...${colors.reset}`)

  try {
    // Executar o comando npm install
    execSync("npm install @mui/material @emotion/react @emotion/styled --save", {
      stdio: "inherit",
    })

    console.log(`${colors.green}Material UI e suas dependências foram instalados com sucesso!${colors.reset}`)

    // Verificar se o .npmrc existe e tem configurações para legacy-peer-deps
    const npmrcPath = path.join(process.cwd(), ".npmrc")
    if (fs.existsSync(npmrcPath)) {
      const npmrcContent = fs.readFileSync(npmrcPath, "utf8")
      if (!npmrcContent.includes("legacy-peer-deps=true")) {
        console.log(
          `${colors.yellow}Nota: Se você encontrar problemas de peer dependencies, considere adicionar 'legacy-peer-deps=true' ao seu arquivo .npmrc${colors.reset}`,
        )
      }
    } else {
      console.log(
        `${colors.yellow}Nota: Se você encontrar problemas de peer dependencies, considere criar um arquivo .npmrc com 'legacy-peer-deps=true'${colors.reset}`,
      )
    }
  } catch (error) {
    console.error(`${colors.red}Erro ao instalar dependências: ${error.message}${colors.reset}`)
    console.log(
      `${colors.yellow}Tente executar manualmente: npm install @mui/material @emotion/react @emotion/styled --save${colors.reset}`,
    )
    process.exit(1)
  }
} catch (error) {
  console.error(`${colors.red}Erro ao processar package.json: ${error.message}${colors.reset}`)
  process.exit(1)
}
