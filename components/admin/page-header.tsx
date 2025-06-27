import type React from "react"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  heading?: string
  text?: string
}

export function PageHeader({ title, description, actions, heading, text }: PageHeaderProps) {
  // Compatibilidade com props antigas (heading e text)
  const displayTitle = heading || title
  const displayDescription = text || description

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{displayTitle}</h1>
        {displayDescription && <p className="text-sm text-gray-500 mt-1">{displayDescription}</p>}
      </div>
      {actions && <div className="flex-shrink-0 w-full md:w-auto">{actions}</div>}
    </div>
  )
}

// Também exportamos como padrão para compatibilidade com imports existentes
export default PageHeader
