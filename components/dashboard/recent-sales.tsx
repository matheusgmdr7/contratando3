import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { PropostaCorretor } from "@/types/corretores"
import { formatarMoeda } from "@/lib/utils"
import { FileText } from "lucide-react"

export function RecentSales({ data }: { data: PropostaCorretor[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center">
        <FileText className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">Sem propostas recentes</h3>
        <p className="mt-2 text-sm text-muted-foreground">Suas propostas mais recentes aparecerão aqui.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {data.map((proposta) => (
        <div key={proposta.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {proposta.nome_cliente ? proposta.nome_cliente.substring(0, 2).toUpperCase() : "CL"}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{proposta.nome_cliente || "Cliente"}</p>
            <p className="text-sm text-muted-foreground">{proposta.email_cliente || "Email não informado"}</p>
          </div>
          <div className="ml-auto font-medium">
            {proposta.valor_proposta ? formatarMoeda(proposta.valor_proposta) : "Valor não informado"}
          </div>
        </div>
      ))}
    </div>
  )
}
