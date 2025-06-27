import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <Spinner />
      <span className="ml-2">Carregando tabelas...</span>
    </div>
  )
}
