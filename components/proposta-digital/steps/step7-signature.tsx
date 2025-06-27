"use client"

import { useRef, useState } from "react"
import { useFormContext } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import SignatureCanvas from "react-signature-canvas"

export default function Step7Signature() {
  const { control, setValue } = useFormContext()
  const sigCanvas = useRef(null)
  const [isSigned, setIsSigned] = useState(false)

  const clearSignature = () => {
    sigCanvas.current.clear()
    setValue("assinatura", "")
    setIsSigned(false)
  }

  const handleSignatureEnd = () => {
    if (!sigCanvas.current.isEmpty()) {
      setIsSigned(true)
      const signatureData = sigCanvas.current.toDataURL()
      setValue("assinatura", signatureData)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Assinatura Digital</h3>
        <p className="text-sm text-gray-500 mb-6">
          Assine no campo abaixo para finalizar sua proposta. Sua assinatura confirma que todas as informações
          fornecidas são verdadeiras.
        </p>

        <FormField
          control={control}
          name="assinatura"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sua Assinatura</FormLabel>
              <FormControl>
                <Card className="p-4 border-2 border-dashed">
                  <div className="bg-gray-50 rounded-md">
                    <SignatureCanvas
                      ref={sigCanvas}
                      canvasProps={{
                        className: "w-full h-40 bg-white rounded-md border border-gray-200",
                      }}
                      onEnd={handleSignatureEnd}
                    />
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearSignature}
                      className="text-gray-500"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                  </div>
                </Card>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">Declaração</h4>
              <p className="text-sm text-amber-700 mt-1">
                Ao assinar este documento, declaro que todas as informações fornecidas são verdadeiras e estou ciente
                das condições do plano de saúde selecionado. Autorizo o uso dos meus dados para fins de análise e
                contratação do plano.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
