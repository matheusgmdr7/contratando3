"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <div className={cn("animate-spin text-muted-foreground", className)} {...props}>
      <Loader2 className="h-4 w-4" />
    </div>
  )
}
