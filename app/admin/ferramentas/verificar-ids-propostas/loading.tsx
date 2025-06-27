import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-gray-600">Carregando ferramenta de verificação...</p>
        </div>
      </div>
    </div>
  )
}
