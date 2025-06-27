const fs = require("fs")
const path = require("path")

console.log("🔧 Verificando e corrigindo dependências...")

try {
  const packageJsonPath = path.join(process.cwd(), "package.json")
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

  // Verificar dependências problemáticas
  const problematicDeps = ["install-mui.js", "mui-dependencies.json", "transpile.config.js"]

  // Remover arquivos problemáticos se existirem
  problematicDeps.forEach((file) => {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`❌ Removido arquivo problemático: ${file}`)
    }
  })

  // Verificar se todas as dependências estão corretas
  const requiredDeps = {
    bcryptjs: "^2.4.3",
    "@supabase/supabase-js": "^2.45.4",
    next: "15.0.3",
    react: "^18.3.1",
    "react-dom": "^18.3.1",
  }

  let needsUpdate = false
  Object.entries(requiredDeps).forEach(([dep, version]) => {
    if (!packageJson.dependencies[dep] || packageJson.dependencies[dep] !== version) {
      packageJson.dependencies[dep] = version
      needsUpdate = true
      console.log(`✅ Atualizado: ${dep}@${version}`)
    }
  })

  // Verificar devDependencies
  const requiredDevDeps = {
    "@types/bcryptjs": "^2.4.6",
    typescript: "^5.6.3",
  }

  Object.entries(requiredDevDeps).forEach(([dep, version]) => {
    if (!packageJson.devDependencies[dep] || packageJson.devDependencies[dep] !== version) {
      packageJson.devDependencies[dep] = version
      needsUpdate = true
      console.log(`✅ Atualizado devDep: ${dep}@${version}`)
    }
  })

  if (needsUpdate) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    console.log("📦 package.json atualizado!")
  }

  console.log("✅ Verificação concluída!")
} catch (error) {
  console.error("❌ Erro:", error.message)
}
