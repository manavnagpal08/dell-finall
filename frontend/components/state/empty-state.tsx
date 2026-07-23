import React from "react"
import { Database } from "lucide-react"

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
}

export function EmptyState({
  title = "No data found",
  description = "There are no records to display matching the current criteria.",
  icon = <Database className="h-10 w-10 text-slate-400" />
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-brand-gray-med bg-white rounded-xl shadow-premium">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4 border border-brand-gray-med">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-brand-text-muted max-w-sm">{description}</p>
    </div>
  )
}
