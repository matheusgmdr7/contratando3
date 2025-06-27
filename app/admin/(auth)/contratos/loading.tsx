import { Spinner } from "@/components/ui/spinner"

export default function ContratosLoading() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
        <h2 className="mt-4 text-xl font-semibold">Carregando contratos...</h2>
        <p className="text-muted-foreground">Aguarde enquanto carregamos os dados.</p>
      </div>
    </div>
  )
}
