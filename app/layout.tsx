import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import MetaPixel from "@/components/meta-pixel"

export const metadata: Metadata = {
  title: "Contratando Planos",
  description: "Encontre o plano de saúde ideal para você e sua família",
  generator: "v0.dev",
  icons: {
    icon: "https://example.com/path/to/your/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <MetaPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID || ""} />
        {children}
      </body>
    </html>
  )
}
