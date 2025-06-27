import { VerificarCamposPDF } from "@/components/admin/ferramentas/verificar-campos-pdf"

export default function VerificarPDFPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Ferramenta de Verificação de PDF</h1>
      <VerificarCamposPDF />
    </div>
  )
}
