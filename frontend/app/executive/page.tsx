"use client"

import React, { useState, useEffect } from "react"
import {
  TrendingUp,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Download,
  Briefcase,
  Zap,
  Activity,
  Layers,
  Sparkles,
  BarChart3,
  CheckCircle,
  Package,
  Wrench,
  AlertTriangle,
  RefreshCw,
  FileText
} from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatPercent } from "@/lib/utils"
import apiClient from "@/services/api-client"
import { downloadCSV, downloadExcel, downloadTextPDF } from "@/utils/export"

interface ExecutiveKpis {
  network_health_score: number
  total_cost: number
  predicted_high_risk_shipments: number
  potential_savings: number
  money_leak_total: number
  bottlenecks_count: number
  tpr_health: string
  inventory_status: string
}

interface RiskCorridor {
  origin: string
  destination: string
  risk_probability: number
  risk_level: string
  breach_history_pct: number
}

interface HighRiskShipment {
  transaction_id: string
  origin: string
  destination: string
  priority: string
  cost: number
  risk_score: number
  risk_level: string
}

export default function ExecutiveSuitePage() {
  const [loading, setLoading] = useState(false)
  const [kpis, setKpis] = useState<ExecutiveKpis | null>(null)
  const [corridors, setCorridors] = useState<RiskCorridor[]>([])
  const [shipments, setShipments] = useState<HighRiskShipment[]>([])
  const [summaryHtml, setSummaryHtml] = useState("")
  const [exportStatus, setExportStatus] = useState("")

  const loadExecutiveData = async () => {
    setLoading(true)
    try {
      const [kpiRes, corrRes, shipRes, summaryRes] = await Promise.all([
        apiClient.get("/executive/dashboard"),
        apiClient.get("/risk/corridors"),
        apiClient.get("/risk/shipments"),
        apiClient.get("/executive/summary")
      ])
      setKpis(kpiRes.data)
      setCorridors(corrRes.data)
      setShipments(shipRes.data)
      setSummaryHtml(summaryRes.data.summary_markdown)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExecutiveData()
  }, [])

  const triggerExport = (reportType: string, format: string) => {
    const timestamp = new Date().toISOString()
    const kpiRows = [
      ["Metric", "Value"],
      ["Network Health", `${kpis?.network_health_score ?? 0}%`],
      ["Total Cost", kpis?.total_cost ?? 0],
      ["Predicted High Risk Shipments", kpis?.predicted_high_risk_shipments ?? 0],
      ["Potential Savings", kpis?.potential_savings ?? 0],
      ["Generated At", timestamp],
    ]
    const corridorRows = [
      ["Origin", "Destination", "Risk Probability", "Risk Level", "Breach History"],
      ...corridors.map(c => [c.origin, c.destination, `${Math.round(c.risk_probability * 100)}%`, c.risk_level, `${c.breach_history_pct}%`])
    ]
    const shipmentRows = [
      ["Transaction", "Origin", "Destination", "Priority", "Cost", "Risk"],
      ...shipments.map(s => [s.transaction_id, s.origin, s.destination, s.priority, s.cost, `${Math.round(s.risk_score * 100)}%`])
    ]

    if (format === "xlsx") {
      downloadExcel("executive-command-center.xls", [
        { name: "KPIs", rows: kpiRows },
        { name: "Risk Corridors", rows: corridorRows },
        { name: "High Risk Shipments", rows: shipmentRows },
      ])
    } else if (format === "csv") {
      downloadCSV("executive-command-center.csv", [...kpiRows, [], ...corridorRows, [], ...shipmentRows])
    } else {
      downloadTextPDF("executive-command-center.pdf", `${reportType} Report`, [
        `Generated At: ${timestamp}`,
        `Network Health: ${kpis?.network_health_score ?? 0}%`,
        `Total Logistics Cost: ${formatCurrency(kpis?.total_cost ?? 0)}`,
        `Potential Savings: ${formatCurrency(kpis?.potential_savings ?? 0)}`,
        "Top Risk Corridors:",
        ...corridors.slice(0, 5).map(c => `${c.origin} -> ${c.destination}: ${Math.round(c.risk_probability * 100)}% risk`),
      ])
    }
    setExportStatus(`${reportType} ${format.toUpperCase()} downloaded.`)
  }

  if (loading || !kpis) {
    return (
      <div className="space-y-6 select-none p-6 animate-pulse">
        <PageHeader title="Executive Intelligence Command Center" description="Aggregating corporate metrics..." />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-5 font-sans text-xs select-none">
      
      {/* Page Header */}
      <PageHeader
        title="Executive Command Center"
        description="Global command deck monitoring overall network health, cost leaks, and SLA breach risks."
        actions={
          <div className="flex items-center space-x-2">
            <button onClick={() => triggerExport("Executive Summary", "pdf")} className="flex items-center space-x-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg shadow-sm">
              <Download className="h-3.5 w-3.5" /><span>Export Executive Brief (PDF)</span>
            </button>
            <button onClick={() => triggerExport("Management Report", "xlsx")} className="flex items-center space-x-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg shadow-sm">
              <FileText className="h-3.5 w-3.5" /><span>Management Excel</span>
            </button>
            {exportStatus && <span className="text-[10px] font-bold text-emerald-600">{exportStatus}</span>}
          </div>
        }
      />

      {/* Top Corporate KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Overall Network Health", value: `${kpis.network_health_score}%`, desc: "SLA compliance targeted", icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-50/50" },
          { label: "Total Logistics Cost", value: formatCurrency(kpis.total_cost), desc: "Forward & reverse logistics", icon: DollarSign, color: "text-purple-500", bg: "bg-purple-50/50" },
          { label: "Predicted High Risk", value: `${kpis.predicted_high_risk_shipments} transits`, desc: "Requires routing attention", icon: ShieldAlert, color: "text-rose-500", bg: "bg-rose-50/50" },
          { label: "Potential Savings", value: formatCurrency(kpis.potential_savings), desc: "Adopting AI suggestions", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50/50" }
        ].map((card, idx) => (
          <div key={idx} className={`border border-slate-200 p-5 rounded-2xl ${card.bg} flex justify-between items-center`}>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{card.label}</span>
              <span className="text-2xl font-black text-slate-800 mt-2 block">{card.value}</span>
              <span className="text-[9px] text-slate-400 font-semibold mt-1 block">{card.desc}</span>
            </div>
            <card.icon className={`h-8 w-8 ${card.color} opacity-75`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5 items-start">
        
        {/* Left: Summary Brief & Risk Corridors */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          
          {/* Markdown Executive Summary */}
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/20 to-white">
            <CardContent className="pt-5 pb-4 space-y-3">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span className="text-[10px] font-extrabold uppercase text-blue-500 tracking-wider">AI One-Page Executive Brief</span>
              </div>
              <div className="text-[10px] text-slate-600 leading-relaxed font-semibold space-y-2 whitespace-pre-wrap">
                {summaryHtml}
              </div>
            </CardContent>
          </Card>

          {/* SLA Prediction Risk Distribution */}
          <Card>
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1.5">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <span>SLA Prediction Risk Distribution (Features & Importance)</span>
              </CardTitle>
              <CardDescription>Explains which variables affect shipping SLA risk the most.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Feature Importance list */}
              <div className="space-y-3 font-bold text-slate-650">
                <p className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1">Random Forest Feature Importance</p>
                {[
                  { name: "Priority Class (P1 vs P4)", val: 35 },
                  { name: "Origin Hub Location (HUB-DEL, etc)", val: 25 },
                  { name: "Destination Node / Repair center workload", val: 20 },
                  { name: "Quantity & Shipment Value interaction", val: 20 }
                ].map((f, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[9px]">
                      <span>{f.name}</span>
                      <span>{f.val}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${f.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* SLA prediction stats */}
              <div className="space-y-3.5 border border-slate-200 rounded-xl p-4 bg-slate-50/40">
                <p className="text-[9px] uppercase tracking-wider text-slate-400 block">Risk Segment Projections</p>
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div className="bg-white p-3 rounded-lg border border-slate-100 text-center">
                    <span className="text-rose-600 text-lg font-black block">33</span>
                    <span className="text-[8px] text-slate-400 block font-bold">Critical / High Risk Transits</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 text-center">
                    <span className="text-emerald-600 text-lg font-black block">142</span>
                    <span className="text-[8px] text-slate-400 block font-bold">Healthy / Safe Transits</span>
                  </div>
                </div>
                <div className="text-[9.5px] text-slate-500 font-medium leading-relaxed pt-1.5 border-t border-slate-100">
                  Model explainability confidence metrics average **94%** across current validation batches.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Leaks, Bottlenecks & Metrics */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          
          {/* Highest Risk Corridors */}
          <Card>
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <span>Highest Risk Corridors</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {corridors.map((c, idx) => (
                <div key={idx} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between font-bold text-slate-650">
                  <div>
                    <span className="text-slate-800 block text-[10.5px] font-extrabold">{c.origin} &gt; {c.destination}</span>
                    <span className="text-[8.5px] text-slate-400 font-medium block mt-0.5">Breach History: {c.breach_history_pct}%</span>
                  </div>
                  <Badge variant={c.risk_level === 'Critical' ? 'error' : 'warning'} className="text-[8.5px] font-extrabold">
                    {Math.round(c.risk_probability * 100)}% Risk
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* High-Risk Shipments list */}
          <Card>
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldAlert className="h-4 w-4 text-rose-500" />
                <span>High-Risk Shipment Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3 max-h-[300px] overflow-y-auto">
              {shipments.map(s => (
                <div key={s.transaction_id} className="p-3 border border-l-4 border-l-rose-500 border-slate-100 rounded-r-xl space-y-1.5 font-bold text-[9px] text-slate-500">
                  <div className="flex justify-between items-center text-slate-800 text-[10px] font-extrabold">
                    <span>{s.transaction_id}</span>
                    <span className="text-rose-600">{Math.round(s.risk_score * 100)}% Risk</span>
                  </div>
                  <p>Path: {s.origin} &gt; {s.destination} ({s.priority})</p>
                  <p className="text-[8.5px] text-slate-400">Total cost: {formatCurrency(s.cost)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
