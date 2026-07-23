"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) return null

  return (
    <nav className="flex items-center space-x-2 text-xs text-brand-text-muted select-none">
      <Link href="/dashboard" className="flex items-center hover:text-slate-900 transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.map((segment, index) => {
        const url = `/${segments.slice(0, index + 1).join("/")}`
        const isLast = index === segments.length - 1
        const title = segment.charAt(0).toUpperCase() + segment.slice(1)

        return (
          <React.Fragment key={url}>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            {isLast ? (
              <span className="font-semibold text-slate-900">{title}</span>
            ) : (
              <Link href={url} className="hover:text-slate-900 transition-colors capitalize">
                {title}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
