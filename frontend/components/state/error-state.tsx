import React from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "../ui/button"

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({
  title = "Something went wrong",
  description = "An error occurred while loading data. Please verify your connection or try again.",
  onRetry
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 border border-brand-gray-med bg-rose-50/10 rounded-xl shadow-premium">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 border border-rose-100 text-brand-error mb-4 animate-pulse">
        <AlertCircle className="h-10 w-10" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-brand-text-muted max-w-sm mb-4">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}
