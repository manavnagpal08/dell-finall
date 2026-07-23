import React from "react"
import Link from "next/link"
import { Database, Plug, Clock, FileText, Webhook, Settings } from "lucide-react"

export default function IntegrationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tabs = [
    { name: "Overview", href: "/integrations", icon: Database },
    { name: "Data Trust", href: "/integrations/data-trust", icon: Database },
    { name: "Connectors", href: "/integrations/connectors", icon: Plug },
    { name: "Sync Jobs", href: "/integrations/jobs", icon: Clock },
    { name: "Audit Logs", href: "/integrations/logs", icon: FileText },
    { name: "Webhooks", href: "/integrations/webhooks", icon: Webhook },
    { name: "Settings", href: "/integrations/settings", icon: Settings },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Enterprise Data Integration Hub
        </h1>
        <p className="text-slate-500">
          Connect external systems, monitor data pipelines, and manage real-time event subscriptions.
        </p>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className="group inline-flex items-center border-b-2 border-transparent py-4 px-1 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700"
            >
              <tab.icon
                className="-ml-0.5 mr-2 h-5 w-5 text-slate-400 group-hover:text-slate-500"
                aria-hidden="true"
              />
              <span>{tab.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {children}
      </div>
    </div>
  )
}
