"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Bot, Send, User, Phone, MessageSquare, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Tipo para as mensagens
type Message = {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
}

// Respostas pré-definidas do bot
const botResponses: Record<string, string> = {
  olá: "Olá! Como posso ajudar você hoje?",
  oi: "Olá! Como posso ajudar você hoje?",
  "bom dia": "Bom dia! Como posso ajudar você hoje?",
  "boa tarde": "Boa tarde! Como posso ajudar você hoje?",
  "boa noite": "Boa noite! Como posso ajudar você hoje?",
  planos:
    "Temos diversos planos de saúde disponíveis. Você está procurando um plano individual, familiar ou empresarial?",
  preço:
    "Os preços dos nossos planos variam de acordo com a idade, cobertura e operadora. Posso te ajudar a encontrar o plano ideal para o seu perfil.",
  operadoras:
    "Trabalhamos com as principais operadoras do mercado, como Amil, Bradesco Saúde, SulAmérica, Unimed, entre outras.",
  cobertura:
    "Nossos planos oferecem diferentes níveis de cobertura, desde o básico até o premium, com opções de coparticipação e reembolso.",
  carência:
    "Os períodos de carência variam conforme a operadora e o procedimento. Geralmente, urgências e emergências têm cobertura imediata.",
  documentos:
    "Para contratar um plano, você precisará de RG, CPF, comprovante de residência e, em alguns casos, declaração de saúde.",
  cancelamento:
    "O processo de cancelamento varia conforme a operadora e o tipo de plano. Um de nossos corretores pode te orientar sobre isso.",
  reembolso:
    "O processo de reembolso depende da operadora e do plano contratado. Geralmente, é necessário apresentar nota fiscal e relatório médico.",
  "rede credenciada":
    "Cada operadora possui sua própria rede credenciada de hospitais, clínicas e laboratórios. Posso te ajudar a verificar a rede específica do plano que te interessa.",
  portabilidade:
    "A portabilidade permite mudar de plano sem cumprir novas carências, desde que sejam atendidos alguns requisitos. Um de nossos corretores pode te orientar sobre isso.",
}

export default function AssistenteVirtual() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Olá! Sou o assistente virtual da Contratando Planos. Como posso ajudar você hoje?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Função para rolar para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Função para gerar uma resposta do bot
  const generateBotResponse = (userMessage: string): string => {
    const lowerCaseMessage = userMessage.toLowerCase()

    // Verificar se a mensagem do usuário contém alguma das palavras-chave
    for (const [keyword, response] of Object.entries(botResponses)) {
      if (lowerCaseMessage.includes(keyword)) {
        return response
      }
    }

    // Resposta padrão se nenhuma palavra-chave for encontrada
    return "Desculpe, não entendi completamente. Para informações mais detalhadas, recomendo falar diretamente com um de nossos corretores especializados."
  }

  // Função para enviar mensagem
  const sendMessage = () => {
    if (input.trim() === "") return

    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simular tempo de resposta do bot
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateBotResponse(input),
        sender: "bot",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botResponse])
      setIsTyping(false)
    }, 1000)
  }

  // Função para lidar com a tecla Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage()
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <h1 className="text-3xl font-bold text-center mb-2">Assistente Virtual</h1>
      <p className="text-center text-muted-foreground mb-8">
        Tire suas dúvidas sobre planos de saúde ou fale com um corretor especializado
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna do chat - ocupa 2/3 em telas médias e grandes */}
        <div className="md:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardContent className="flex-1 p-4 flex flex-col">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4 pt-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn("flex", message.sender === "user" ? "justify-end" : "justify-start")}
                    >
                      <div className="flex items-start gap-2 max-w-[80%]">
                        {message.sender === "bot" && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              <Bot size={16} />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "rounded-lg p-3",
                            message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                          )}
                        >
                          <p>{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        {message.sender === "user" && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              <User size={16} />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex items-start gap-2 max-w-[80%]">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot size={16} />
                          </AvatarFallback>
                        </Avatar>
                        <div className="rounded-lg p-3 bg-muted">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="h-2 w-2 rounded-full bg-primary animate-bounce"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="mt-4 flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  className="flex-1"
                />
                <Button onClick={sendMessage} size="icon">
                  <Send size={18} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna lateral - ocupa 1/3 em telas médias e grandes */}
        <div className="space-y-6">
          {/* Card de tópicos populares */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-3">Tópicos Populares</h3>
              <div className="flex flex-wrap gap-2">
                {["Planos", "Preço", "Operadoras", "Cobertura", "Carência", "Documentos", "Reembolso"].map((topic) => (
                  <Badge
                    key={topic}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => {
                      setInput(topic)
                      inputRef.current?.focus()
                    }}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Card de falar com corretor */}
          <Card className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground">
            <CardContent className="p-6">
              <h3 className="font-semibold text-xl mb-3">Fale com um Corretor</h3>
              <p className="mb-4 text-primary-foreground/90">
                Prefere conversar diretamente com um especialista? Nossos corretores estão prontos para ajudar.
              </p>

              <div className="space-y-3">
                <Button
                  variant="secondary"
                  className="w-full group relative overflow-hidden transition-all hover:bg-white hover:text-primary"
                  onClick={() => window.open("https://wa.me/5511999999999", "_blank")}
                >
                  <div className="flex items-center justify-center w-full gap-2">
                    <Phone size={18} className="shrink-0" />
                    <span className="font-medium">WhatsApp</span>
                    <ArrowRight size={16} className="ml-auto transition-transform group-hover:translate-x-1" />
                  </div>
                  <span className="absolute inset-0 flex items-center justify-center w-full h-full text-primary opacity-0 group-hover:opacity-0 transition-opacity">
                    Iniciar conversa
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full bg-transparent border-white/30 text-white group relative overflow-hidden transition-all hover:bg-white hover:text-primary hover:border-transparent"
                  onClick={() => (window.location.href = "/contato")}
                >
                  <div className="flex items-center justify-center w-full gap-2">
                    <MessageSquare size={18} className="shrink-0" />
                    <span className="font-medium">Formulário de Contato</span>
                    <ArrowRight size={16} className="ml-auto transition-transform group-hover:translate-x-1" />
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card de informações adicionais */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-3">Por que contratar com a gente?</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    ✓
                  </div>
                  <span className="text-sm">Atendimento personalizado</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    ✓
                  </div>
                  <span className="text-sm">Melhores preços do mercado</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    ✓
                  </div>
                  <span className="text-sm">Suporte pós-venda</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    ✓
                  </div>
                  <span className="text-sm">Corretores especializados</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
