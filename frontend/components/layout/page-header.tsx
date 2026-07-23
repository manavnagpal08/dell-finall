import React from "react"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 pb-6 border-b border-brand-gray-med mb-8 select-none">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 capitalize">{title}</h1>
        {description && (
          <p className="text-sm text-brand-text-muted">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center space-x-3">{actions}</div>
      )}
    </div>
  )
}
