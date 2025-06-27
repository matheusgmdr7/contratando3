"use client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, Mail, AlertTriangle, ExternalLink, MessageSquare } from "lucide-react"
import { toast } from "sonner"

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  clienteNome: string
  clienteEmail: string
  linkProposta: string
  emailEnviado: boolean
}

export function SuccessModal({
  isOpen,
  onClose,
  clienteNome,
  clienteEmail,
  linkProposta,
  emailEnviado,
}: SuccessModalProps) {
  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(linkProposta)
      toast.success("Link copiado para a área de transferência!")
    } catch (error) {
      console.error("Erro ao copiar link:", error)
      toast.error("Não foi possível copiar o link")
    }
  }

  const abrirLink = () => {
    window.open(linkProposta, "_blank")
  }

  const abrirWhatsApp = () => {
    const mensagem = `Olá ${clienteNome}! Sua proposta de plano de saúde foi criada. Para completar o processo, acesse: ${linkProposta}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensagem)}`
    window.open(whatsappUrl, "_blank")
  }

  const copiarMensagemWhatsApp = async () => {
    const mensagem = `Olá ${clienteNome}! Sua proposta de plano de saúde foi criada. Para completar o processo, acesse: ${linkProposta}`
    try {
      await navigator.clipboard.writeText(mensagem)
      toast.success("Mensagem copiada! Cole no WhatsApp do cliente.")
    } catch (error) {
      toast.error("Não foi possível copiar a mensagem")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Proposta Criada com Sucesso!
          </DialogTitle>
          <DialogDescription>
            A proposta foi criada para <strong>{clienteNome}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status do Email */}
          <div className="p-4 rounded-lg border">
            {emailEnviado ? (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-green-700">✅ Email enviado automaticamente!</p>
                  <p className="text-sm text-gray-600">
                    O cliente <strong>{clienteNome}</strong> recebeu um email em <strong>{clienteEmail}</strong> com o
                    link para completar a proposta.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-700">⚠️ Email não foi enviado automaticamente</p>
                  <p className="text-sm text-gray-600">
                    Você precisará enviar o link manualmente para <strong>{clienteEmail}</strong>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Use os botões abaixo para enviar via WhatsApp ou copiar o link
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Ações Rápidas - Mostrar sempre, mas destacar quando email não foi enviado */}
          <div
            className={`space-y-3 p-4 rounded-lg ${emailEnviado ? "bg-gray-50" : "bg-amber-50 border border-amber-200"}`}
          >
            <p className="text-sm font-medium">
              {emailEnviado ? "📱 Envie também via WhatsApp:" : "🚨 Envie o link para o cliente:"}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={abrirWhatsApp} className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </Button>

              <Button variant="outline" size="sm" onClick={copiarMensagemWhatsApp} className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Copiar Msg
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copiarLink} className="flex-1 flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Copiar Link
              </Button>

              <Button variant="outline" size="sm" onClick={abrirLink} className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Abrir
              </Button>
            </div>
          </div>

          {/* Instruções */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">📋 Próximos passos:</p>
            <ul className="text-sm text-blue-700 space-y-1">
              {emailEnviado ? (
                <>
                  <li>✅ Cliente receberá email com instruções</li>
                  <li>🔔 Você será notificado quando completar</li>
                  <li>📱 Use WhatsApp como lembrete se necessário</li>
                </>
              ) : (
                <>
                  <li>
                    📱 <strong>Envie via WhatsApp</strong> (recomendado)
                  </li>
                  <li>📧 Ou envie por email manual</li>
                  <li>🔔 Você será notificado quando completar</li>
                </>
              )}
            </ul>
          </div>

          {/* Botões Finais */}
          <div className="flex gap-2 pt-2">
            <Button onClick={onClose} className="flex-1 bg-[#168979] hover:bg-[#13786a]">
              Fechar
            </Button>
            {!emailEnviado && (
              <Button variant="outline" onClick={abrirWhatsApp} className="flex-1">
                <MessageSquare className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
