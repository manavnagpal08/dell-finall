"use client"

import React, { useMemo, useState } from "react"
import { BarChart3, Download, FileSpreadsheet, ShieldCheck, TrendingDown, Wrench, Zap } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { downloadCSV, downloadTextPDF } from "@/utils/export"
import { useOperationsStore } from "@/store/operations"

const valueStreams = [
  { name: "Route cost leakage prevented", monthly: 184200, confidence: 92, owner: "Routing Intelligence", icon: TrendingDown },
  { name: "SLA penalties avoided", monthly: 96500, confidence: 88, owner: "Risk Center", icon: ShieldCheck },
  { name: "Repair capacity unlocked", monthly: 74200, confidence: 86, owner: "Reverse Logistics", icon: Wrench },
  { name: "Emergency stock transfer reduction", monthly: 42100, confidence: 81, owner: "Inventory Planning", icon: Zap },
]

const initiatives = [
  { id: "ROI-001", title: "Weekly consolidation on high-cost corridors", status: "In progress", payback: "1.6 months", savings: 62000 },
  { id: "ROI-002", title: "APAC repair queue balancing", status: "Approved", payback: "0.8 months", savings: 38100 },
  { id: "ROI-003", title: "Priority shipment SLA guardrails", status: "Monitoring", payback: "2.1 months", savings: 51400 },
  { id: "ROI-004", title: "Inventory redeployment threshold policy", status: "Queued", payback: "2.8 months", savings: 28700 },
]

export default function RoiBoardPage() {
  const [status, setStatus] = useState("")
  const { actions, scenarios, activeScenarioId, hydrate } = useOperationsStore()

  React.useEffect(() => {
    hydrate()
  }, [hydrate])

  const activeScenario = scenarios.find(s => s.id === activeScenarioId)
  const monthlyValue = useMemo(() => valueStreams.reduce((sum, item) => sum + item.monthly, 0), [])
  const annualizedValue = monthlyValue * 12
  const resolvedActions = actions.filter(a => a.status === "Resolved").length

  const exportRoi = (format: "pdf" | "csv") => {
    const rows = [
      ["Metric", "Value"],
      ["Monthly Value", monthlyValue],
      ["Annualized Value", annualizedValue],
      ["Active Scenario", activeScenario?.name ?? "Baseline"],
      ["Resolved Actions", resolvedActions],
      [],
      ["Value Stream", "Monthly", "Confidence", "Owner"],
      ...valueStreams.map(v => [v.name, v.monthly, `${v.confidence}%`, v.owner]),
      [],
      ["Initiative", "Status", "Payback", "Savings"],
      ...initiatives.map(i => [i.title, i.status, i.payback, i.savings]),
    ]

    if (format === "csv") {
      downloadCSV("roi-board.csv", rows)
    } else {
      downloadTextPDF("roi-board.pdf", "Executive ROI Board", [
        `Monthly Value: ${formatCurrency(monthlyValue)}`,
        `Annualized Value: ${formatCurrency(annualizedValue)}`,
        `Active Scenario: ${activeScenario?.name ?? "Baseline"}`,
        ...valueStreams.map(v => `${v.name}: ${formatCurrency(v.monthly)} / month`),
      ])
    }
    setStatus(`ROI ${format.toUpperCase()} packet downloaded.`)
  }

  return (
    <div className="space-y-6 font-sans text-xs select-none">
      <PageHeader
        title="Executive ROI Board"
        description="Track measurable value created by route optimization, SLA protection, repair balancing, and inventory decisions."
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => exportRoi("pdf")} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-700 hover:bg-slate-50">
              <Download className="h-3.5 w-3.5" /> PDF
            </button>
            <button onClick={() => exportRoi("csv")} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-700 hover:bg-slate-50">
              <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
            </button>
          </div>
        }
      />

      {status && <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">{status}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: "Monthly Value", value: formatCurrency(monthlyValue), detail: "run-rate impact", tone: "bg-emerald-50 text-emerald-700 border-emerald-100" },
          { label: "Annualized Value", value: formatCurrency(annualizedValue), detail: "projected savings", tone: "bg-blue-50 text-blue-700 border-blue-100" },
          { label: "Active Scenario", value: activeScenario?.type ?? "Baseline", detail: activeScenario?.name ?? "Standard operating state", tone: "bg-indigo-50 text-indigo-700 border-indigo-100" },
          { label: "Resolved Actions", value: resolvedActions, detail: "closed operational tasks", tone: "bg-slate-50 text-slate-700 border-slate-200" },
        ].map(card => (
          <div key={card.label} className={`rounded-2xl border p-5 shadow-sm ${card.tone}`}>
            <p className="text-[9px] font-black uppercase tracking-widest">{card.label}</p>
            <p className="mt-3 text-2xl font-black">{card.value}</p>
            <p className="mt-1 text-[10px] font-semibold opacity-80">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-xs font-black uppercase tracking-wider">Value Streams</CardTitle>
            <CardDescription>Quantified monthly impact by operational capability.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {valueStreams.map(stream => {
              const percent = (stream.monthly / monthlyValue) * 100
              return (
                <div key={stream.name} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                        <stream.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{stream.name}</p>
                        <p className="mt-1 text-[10px] font-semibold text-slate-500">{stream.owner} / {stream.confidence}% confidence</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-emerald-700">{formatCurrency(stream.monthly)}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" /> Initiative Tracker
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {initiatives.map(item => (
                <div key={item.id} className="rounded-xl border border-slate-100 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-black text-slate-800">{item.title}</span>
                    <Badge variant={item.status === "Approved" ? "success" : item.status === "Queued" ? "neutral" : "info"}>{item.status}</Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span>{item.id} / Payback {item.payback}</span>
                    <span className="text-emerald-700">{formatCurrency(item.savings)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-blue-50/40">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-wider text-blue-900">Next Best Action</CardTitle>
              <CardDescription>Highest impact work item based on current action queue.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-black text-slate-900">Resolve the Amsterdam customs delay action before approving additional EMEA reroutes.</p>
              <p className="mt-2 text-[10px] font-semibold leading-relaxed text-slate-600">This protects high-priority SLA exposure and prevents air-freight leakage from compounding across the same corridor.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
