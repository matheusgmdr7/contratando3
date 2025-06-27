console.log("🔍 Verificando instalação do bcryptjs...")

try {
  // Tentar importar bcryptjs
  const bcrypt = require("bcryptjs")

  // Teste básico
  const testPassword = "teste123"
  const hash = bcrypt.hashSync(testPassword, 10)
  const isValid = bcrypt.compareSync(testPassword, hash)

  if (isValid) {
    console.log("✅ bcryptjs instalado e funcionando corretamente!")
    console.log("🔐 Teste de hash/compare: PASSOU")
  } else {
    console.log("❌ bcryptjs instalado mas não está funcionando corretamente")
  }
} catch (error) {
  console.log("❌ bcryptjs não está instalado ou há erro na importação")
  console.log("📋 Execute: npm install bcryptjs @types/bcryptjs")
  console.log("🔧 Ou execute o script: node scripts/install-bcryptjs.js")
}
