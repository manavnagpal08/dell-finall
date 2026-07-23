"use client"

import React, { useEffect, useMemo, useState } from "react"
import { CheckCircle2, ClipboardCheck, Download, FileSpreadsheet, Play, ShieldAlert, TimerReset } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { downloadCSV, downloadTextPDF } from "@/utils/export"
import { useOperationsStore } from "@/store/operations"

const playbooks = [
  {
    id: "PB-SLA-001",
    name: "Priority SLA Rescue",
    trigger: "P1 shipment breach probability above 35%",
    owner: "Regional Routing",
    eta: "18 min",
    status: "Ready",
    steps: ["Freeze non-critical dispatches", "Check nearest repair-center workload", "Evaluate alternate hub path", "Assign route owner", "Export incident packet"],
  },
  {
    id: "PB-STOCK-004",
    name: "Critical Stock Protection",
    trigger: "Safety stock below threshold at active hub",
    owner: "Inventory Planning",
    eta: "24 min",
    status: "Ready",
    steps: ["Lock outgoing low-priority stock", "Find excess source node", "Create redeployment task", "Notify route operations", "Monitor stock recovery"],
  },
  {
    id: "PB-REPAIR-009",
    name: "Repair Queue Balancing",
    trigger: "TPR utilization above 85%",
    owner: "Repair Operations",
    eta: "30 min",
    status: "Ready",
    steps: ["Identify overload node", "Find compatible repair center", "Move low-risk workload", "Recalculate ETA", "Close balancing action"],
  },
]

export default function PlaybooksPage() {
  const [activePlaybookId, setActivePlaybookId] = useState("PB-SLA-001")
  const [executed, setExecuted] = useState<string[]>([])
  const [status, setStatus] = useState("")
  const { actions, hydrate, assignAction } = useOperationsStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const activePlaybook = playbooks.find(p => p.id === activePlaybookId) ?? playbooks[0]
  const openCriticalActions = useMemo(() => actions.filter(a => a.status !== "Resolved" && (a.severity === "Critical" || a.severity === "High")), [actions])

  const executePlaybook = () => {
    setExecuted(prev => Array.from(new Set([...prev, activePlaybook.id])))
    const firstOpen = openCriticalActions.find(a => a.status === "Open")
    if (firstOpen) assignAction(firstOpen.id)
    setStatus(`${activePlaybook.name} executed. Priority action ownership updated.`)
  }

  const exportPlaybook = (format: "pdf" | "csv") => {
    const rows = [
      ["Playbook", activePlaybook.name],
      ["Trigger", activePlaybook.trigger],
      ["Owner", activePlaybook.owner],
      ["ETA", activePlaybook.eta],
      [],
      ["Step", "Action"],
      ...activePlaybook.steps.map((step, index) => [index + 1, step]),
    ]
    if (format === "csv") {
      downloadCSV(`${activePlaybook.id.toLowerCase()}-playbook.csv`, rows)
    } else {
      downloadTextPDF(`${activePlaybook.id.toLowerCase()}-playbook.pdf`, activePlaybook.name, rows.map(row => row.join(": ")))
    }
    setStatus(`${activePlaybook.name} ${format.toUpperCase()} packet downloaded.`)
  }

  return (
    <div className="space-y-6 font-sans text-xs select-none">
      <PageHeader
        title="Automation Playbooks"
        description="Standard operating procedures for repeatable route, inventory, repair, and SLA response workflows."
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => exportPlaybook("pdf")} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-700 hover:bg-slate-50">
              <Download className="h-3.5 w-3.5" /> PDF
            </button>
            <button onClick={() => exportPlaybook("csv")} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-700 hover:bg-slate-50">
              <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
            </button>
          </div>
        }
      />

      {status && <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">{status}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: "Ready Playbooks", value: playbooks.length, tone: "bg-blue-50 text-blue-700 border-blue-100" },
          { label: "Executed Today", value: executed.length, tone: "bg-emerald-50 text-emerald-700 border-emerald-100" },
          { label: "High Priority Actions", value: openCriticalActions.length, tone: "bg-amber-50 text-amber-700 border-amber-100" },
          { label: "Avg Response ETA", value: "24m", tone: "bg-slate-50 text-slate-700 border-slate-200" },
        ].map(card => (
          <div key={card.label} className={`rounded-2xl border p-5 shadow-sm ${card.tone}`}>
            <p className="text-[9px] font-black uppercase tracking-widest">{card.label}</p>
            <p className="mt-3 text-3xl font-black">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-xs font-black uppercase tracking-wider">Playbook Library</CardTitle>
            <CardDescription>Select a response workflow.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {playbooks.map(playbook => (
              <button
                key={playbook.id}
                onClick={() => setActivePlaybookId(playbook.id)}
                className={`w-full rounded-xl border p-4 text-left transition ${activePlaybookId === playbook.id ? "border-blue-200 bg-blue-50/60" : "border-slate-200 bg-white hover:bg-slate-50"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-800">{playbook.name}</span>
                  {executed.includes(playbook.id) ? <Badge variant="success">Executed</Badge> : <Badge variant="info">Ready</Badge>}
                </div>
                <p className="mt-1 text-[10px] font-semibold text-slate-500">{playbook.id} / {playbook.owner}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-black text-slate-900">{activePlaybook.name}</CardTitle>
                <CardDescription>{activePlaybook.trigger}</CardDescription>
              </div>
              <button onClick={executePlaybook} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-[10px] font-black text-white hover:bg-slate-700">
                <Play className="h-3.5 w-3.5" /> Execute
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <TimerReset className="h-4 w-4 text-blue-600" />
                <p className="mt-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Target ETA</p>
                <p className="mt-1 text-sm font-black text-slate-800">{activePlaybook.eta}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <ClipboardCheck className="h-4 w-4 text-blue-600" />
                <p className="mt-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Owner</p>
                <p className="mt-1 text-sm font-black text-slate-800">{activePlaybook.owner}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <ShieldAlert className="h-4 w-4 text-blue-600" />
                <p className="mt-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Linked Actions</p>
                <p className="mt-1 text-sm font-black text-slate-800">{openCriticalActions.length}</p>
              </div>
            </div>
            <div className="space-y-3">
              {activePlaybook.steps.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-black text-blue-700">{index + 1}</span>
                  <span className="flex-1 text-sm font-bold text-slate-700">{step}</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
