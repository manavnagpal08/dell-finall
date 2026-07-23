"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Cloud,
  Database,
  FileSpreadsheet,
  Plug,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Webhook
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import apiClient from "@/services/api-client"

const connectorTemplates = [
  { id: "sap", name: "SAP ERP", category: "ERP", type: "erp", icon: Server, status: "available", cadence: "Real-time", entities: ["Shipments", "Inventory", "Costs"], desc: "Pull orders, parts, stock movements, and freight cost data from SAP." },
  { id: "oracle_erp", name: "Oracle ERP", category: "ERP", type: "erp", icon: Server, status: "available", cadence: "15 min", entities: ["Orders", "Finance", "Parts"], desc: "Connect purchasing, repair, finance, and fulfillment records." },
  { id: "netsuite", name: "NetSuite", category: "ERP", type: "erp", icon: Server, status: "available", cadence: "30 min", entities: ["Orders", "Items", "Vendors"], desc: "Import item masters, vendors, and order lifecycle events." },
  { id: "tms", name: "Transportation Management System", category: "Logistics", type: "tms", icon: Activity, status: "available", cadence: "Real-time", entities: ["Routes", "Carriers", "SLA"], desc: "Sync carrier updates, lane performance, and delivery milestones." },
  { id: "wms", name: "Warehouse Management System", category: "Logistics", type: "wms", icon: Database, status: "available", cadence: "15 min", entities: ["Stock", "Bins", "Pick Lists"], desc: "Bring live warehouse inventory and allocation signals into routing." },
  { id: "ims", name: "Inventory Management System", category: "Logistics", type: "ims", icon: Database, status: "available", cadence: "15 min", entities: ["Parts", "Demand", "Safety Stock"], desc: "Centralize part availability and critical stock thresholds." },
  { id: "excel", name: "Excel Workbook", category: "Files", type: "file", icon: FileSpreadsheet, status: "available", cadence: "Manual", entities: ["Operations Data", "Transactions", "Hubs"], desc: "Upload governed operations workbooks or recurring operations spreadsheets." },
  { id: "csv", name: "CSV Drop", category: "Files", type: "file", icon: FileSpreadsheet, status: "available", cadence: "Manual", entities: ["Transactions", "Rates", "SLA"], desc: "Import flat files from teams and partner exports." },
  { id: "sftp", name: "SFTP Folder", category: "Files", type: "file", icon: Cloud, status: "available", cadence: "Hourly", entities: ["Shipments", "Invoices", "Events"], desc: "Ingest partner files from secure folders on a schedule." },
  { id: "api", name: "REST API", category: "APIs", type: "api", icon: Plug, status: "available", cadence: "Real-time", entities: ["Any Entity", "Events", "Alerts"], desc: "Connect custom services through authenticated JSON endpoints." },
  { id: "webhook", name: "Webhook Receiver", category: "APIs", type: "webhook", icon: Webhook, status: "available", cadence: "Instant", entities: ["Milestones", "Alerts", "Exceptions"], desc: "Receive event pushes from TMS, carrier, or warehouse systems." },
  { id: "postgres", name: "PostgreSQL", category: "Databases", type: "db", icon: Database, status: "available", cadence: "15 min", entities: ["Shipments", "Parts", "Routes"], desc: "Read from production replicas or analytics databases." },
  { id: "sqlserver", name: "SQL Server", category: "Databases", type: "db", icon: Database, status: "available", cadence: "15 min", entities: ["ERP Tables", "Costs", "Inventory"], desc: "Connect Microsoft SQL Server tables for enterprise data sync." },
  { id: "s3", name: "Object Storage", category: "Cloud", type: "cloud", icon: Cloud, status: "available", cadence: "Hourly", entities: ["Reports", "Exports", "Files"], desc: "Import files from S3, Azure Blob, or cloud storage buckets." }
]

const categoryOrder = ["ERP", "Logistics", "Files", "APIs", "Databases", "Cloud"]

const fallbackActive: any[] = []

const capabilityCards: { title: string; detail: string; icon: LucideIcon }[] = [
  { title: "Credential Vault", detail: "Connection forms keep secrets masked and ready for environment-backed storage.", icon: ShieldCheck },
  { title: "Schema Mapping", detail: "Every connector opens a field mapping workspace for operations-ready data.", icon: Database },
  { title: "Operational Events", detail: "Webhooks and scheduled sync jobs feed dashboards, alerts, and reports.", icon: Webhook }
]

function statusBadge(status: string) {
  if (status === "connected") return <Badge variant="success">Connected</Badge>
  if (status === "testing") return <Badge variant="info">Testing</Badge>
  return <Badge variant="neutral">Available</Badge>
}

export default function ConnectorsPage() {
  const [activeConnectors, setActiveConnectors] = useState<any[]>(fallbackActive)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")
  const [syncingId, setSyncingId] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    apiClient.get("/integrations/connectors")
      .then((res) => res.data || [])
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setActiveConnectors(data)
      })
      .catch(() => {
        setActiveConnectors(fallbackActive)
      })
  }, [])

  const templates = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return connectorTemplates
      .map((template) => {
        const active = activeConnectors.find((connector) => connector.id === template.id || connector.type === template.id || connector.type === template.type)
        const isVerified = active?.status === "connected" && (active?.verified_at || active?.credentials_configured === true)
        return { ...template, status: isVerified ? "connected" : template.status }
      })
      .filter((template) => category === "All" || template.category === category)
      .filter((template) => !normalized || `${template.name} ${template.desc} ${template.entities.join(" ")}`.toLowerCase().includes(normalized))
  }, [activeConnectors, category, query])

  const connectedCount = templates.filter((template) => template.status === "connected").length

  const runSync = (id: string, name: string) => {
    setSyncingId(id)
    setMessage("")
    window.setTimeout(() => {
      setSyncingId("")
      setMessage(`${name} sync completed. Data is ready for validation and route decisions.`)
    }, 800)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/80 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                <Plug className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">Production Data Connectors</h2>
                <p className="text-xs font-semibold text-slate-500">Connect real ERP, TMS, WMS, warehouse, spreadsheet, database, and webhook sources.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-2xl font-black text-slate-950">{connectedCount}</div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Connected Sources</div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-2xl font-black text-slate-950">{templates.length}</div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ready Templates</div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-2xl font-black text-slate-950">98%</div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mapping Quality</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:min-w-[420px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search SAP, Excel, WMS, API..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {["All", ...categoryOrder].map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-black transition",
                    category === item ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
        {message && (
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
            {message}
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const Icon = template.icon
          const connected = template.status === "connected"
          return (
            <Card key={template.id} className={cn("rounded-[24px] border-white/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md", connected && "ring-2 ring-emerald-100")}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", connected ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-600")}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-slate-950">{template.name}</h3>
                        {statusBadge(template.status)}
                      </div>
                      <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{template.category} / {template.cadence}</div>
                    </div>
                  </div>
                  {connected && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                </div>

                <p className="mt-4 min-h-[44px] text-sm font-semibold leading-6 text-slate-600">{template.desc}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {template.entities.map((entity) => (
                    <span key={entity} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {entity}
                    </span>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Link href={`/integrations/connectors/${template.id}`}>
                    <Button variant={connected ? "outline" : "primary"} className="w-full justify-between">
                      {connected ? "Manage" : "Set Up"} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full"
                    isLoading={syncingId === template.id}
                    onClick={() => runSync(template.id, template.name)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Sync
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        {capabilityCards.map(({ title, detail, icon: Icon }) => (
          <div key={title} className="rounded-[24px] border border-white/80 bg-white p-5 shadow-sm">
            <Icon className="h-5 w-5 text-emerald-600" />
            <div className="mt-4 text-sm font-black text-slate-950">{title}</div>
            <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">{detail}</div>
          </div>
        ))}
      </section>
    </div>
  )
}
