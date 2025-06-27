"use client"

import type React from "react"

import { useRef, useState } from "react"
import { useFormContext } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

// Componente de assinatura simples sem react-signature-canvas
function SimpleSignatureCanvas({ onSignatureChange }: { onSignatureChange: (signature: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    const canvas = canvasRef.current
    if (!canvas) return

    // Converter para base64 e notificar mudança
    const dataURL = canvas.toDataURL("image/png")
    onSignatureChange(dataURL)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    onSignatureChange("")
  }

  // Suporte para touch (mobile)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const touch = e.touches[0]
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    })

    setIsDrawing(true)
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.beginPath()
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing) return

    const touch = e.touches[0]
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top)
    ctx.stroke()
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    stopDrawing()
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={400}
        height={160}
        className="w-full h-40 bg-white rounded-md border border-gray-200 cursor-crosshair touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "none" }}
      />
      <div className="flex justify-end mt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          className="text-gray-500 bg-transparent"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      </div>
    </div>
  )
}

export default function Step7Signature() {
  const { control, setValue } = useFormContext()
  const [isSigned, setIsSigned] = useState(false)

  const handleSignatureChange = (signature: string) => {
    setIsSigned(!!signature)
    setValue("assinatura", signature)
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
                    <SimpleSignatureCanvas onSignatureChange={handleSignatureChange} />
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
