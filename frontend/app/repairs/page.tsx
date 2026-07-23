"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Wrench,
  Clock,
  Download,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Package,
  Layers,
  Activity,
  PlusCircle,
  TrendingDown,
  Info,
  MapPin,
  Truck,
  FileSpreadsheet,
  FileText
} from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import apiClient from "@/services/api-client"
import { MapContainer } from "@/components/network/map-container"
import { NetworkNode, NetworkLink } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { downloadCSV, downloadTextPDF } from "@/utils/export"



interface TprMetric {
  tpr_id: string
  tpr_name: string
  capacity: number
  current_load: number
  avg_repair_time: number
  utilization_pct: number
  efficiency_score: number
}

interface StockoutPrediction {
  part_no: string
  hub_id: string
  current_stock: number
  avg_daily_usage: number
  days_remaining: number
  critical_level: string
  recommendation: string
}

interface SmartSwap {
  overloaded_tpr: string
  alternative_tpr: string
  workload_reduction_units: number
  transit_days_difference: number
  business_benefit: string
}

interface RedeploymentPlan {
  part_no: string
  excess_location: string
  low_stock_location: string
  best_destination: string
  est_cost: number
  transit_days: number
  benefit: string
}

interface ConsolidationOpp {
  current_shipments: number
  proposed_consolidation: string
  savings_usd: number
  transit_impact: string
}

export default function ReverseLogisticsPage() {
  const [loading, setLoading] = useState(false)
  const [tprs, setTprs] = useState<TprMetric[]>([])
  const [stockouts, setStockouts] = useState<StockoutPrediction[]>([])
  const [swaps, setSwaps] = useState<SmartSwap[]>([])
  const [redeployments, setRedeployments] = useState<RedeploymentPlan[]>([])
  const [consolidations, setConsolidations] = useState<ConsolidationOpp[]>([])
  const [reverseProof, setReverseProof] = useState<any>(null)
  const [selectedTpr, setSelectedTpr] = useState<TprMetric | null>(null)
  const [exportStatus, setExportStatus] = useState("")

  // Map Data
  const [mapNodes, setMapNodes] = useState<NetworkNode[]>([])
  const [mapLinks, setMapLinks] = useState<NetworkLink[]>([])

  const loadReverseData = useCallback(async () => {
    setLoading(true)
    try {
      const [tprRes, stockRes, swapRes, deployRes, consRes, proofRes] = await Promise.all([
        apiClient.get("/reverse/tpr"),
        apiClient.get("/reverse/stockout"),
        apiClient.get("/reverse/swapping"),
        apiClient.get("/reverse/redeployment"),
        apiClient.get("/reverse/consolidation"),
        apiClient.get("/challenge/reverse-proof")
      ])
      setTprs(tprRes.data)
      setStockouts(stockRes.data)
      setSwaps(swapRes.data)
      setRedeployments(deployRes.data)
      setConsolidations(consRes.data)
      setReverseProof(proofRes.data)
      if (tprRes.data.length > 0) {
        setSelectedTpr(tprRes.data[0])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReverseData()
  }, [loadReverseData])

  // Build Map Nodes
  useEffect(() => {
    if (tprs.length === 0) return

    const nodes: NetworkNode[] = tprs.map((t, idx) => ({
      id: t.tpr_id,
      name: t.tpr_name,
      type: "Repair Center",
      city: "Repair Region",
      country: "India",
      latitude: 12.9716 + (idx * 0.5), // heuristic coordinates spread

      longitude: 77.5946 + (idx * 0.5),
      current_stock: t.current_load,
      capacity: t.capacity,
      utilisation: t.utilization_pct,
      status: "Normal",
      inbound_shipments_count: 0,
      outbound_shipments_count: 0
    }))

    // Add redeployment hub targets if any
    redeployments.forEach((r, idx) => {
      nodes.push({
        id: r.low_stock_location,
        name: `${r.low_stock_location} Hub`,
        type: "Primary Hub",
        city: r.low_stock_location,
        country: "India",
        latitude: 19.0760 + (idx * 0.4),
        longitude: 72.8777 + (idx * 0.4),
        current_stock: 0,
        capacity: 0,
        utilisation: 0,
        status: "Normal",
        inbound_shipments_count: 0,
        outbound_shipments_count: 0
      })
    })

    // Construct redeployment links
    const links: NetworkLink[] = redeployments.map((r, idx) => {
      const srcNode = nodes.find(n => n.id === r.excess_location)
      const dstNode = nodes.find(n => n.id === r.low_stock_location)
      return {
        source_id: r.excess_location,
        target_id: r.low_stock_location,
        source_coordinates: srcNode ? [srcNode.latitude, srcNode.longitude] : [12.9716, 77.5946],
        target_coordinates: dstNode ? [dstNode.latitude, dstNode.longitude] : [19.0760, 72.8777],
        flow_type: "Reverse",
        volume: 1,
        total_cost: r.est_cost,
        avg_cost_per_unit: r.est_cost,
        sla_breach_rate: 0,
        avg_transit_days: r.transit_days
      }
    })

    setMapNodes(nodes)
    setMapLinks(links)
  }, [tprs, redeployments])

  const triggerExport = (fmt: string) => {
    const rows = [
      ["Section", "Metric", "Value"],
      ...tprs.map(t => ["TPR Capacity", t.tpr_id, `${t.utilization_pct}% utilization; ${t.current_load}/${t.capacity} active load`]),
      ...stockouts.map(s => ["Stockout Risk", `${s.part_no} at ${s.hub_id}`, `${s.days_remaining} days remaining; ${s.recommendation}`]),
      ...swaps.map(s => ["Smart Swap", `${s.overloaded_tpr} -> ${s.alternative_tpr}`, s.business_benefit]),
      ...redeployments.map(r => ["Redeployment", `${r.excess_location} -> ${r.low_stock_location}`, `${formatCurrency(r.est_cost)}; ${r.benefit}`]),
      ...consolidations.map(c => ["Consolidation", c.proposed_consolidation, `${formatCurrency(c.savings_usd)} savings; ${c.transit_impact}`]),
    ]

    if (fmt === "csv") {
      downloadCSV("reverse-logistics-report.csv", rows)
    } else {
      downloadTextPDF("reverse-logistics-report.pdf", "Reverse Logistics Report", rows.map(row => row.join(": ")))
    }
    setExportStatus(`Reverse logistics ${fmt.toUpperCase()} downloaded.`)
  }

  if (loading || tprs.length === 0) {
    return (
      <div className="space-y-6 select-none p-4 animate-pulse">
        <PageHeader title="Reverse Logistics Center" description="Loading repair pipelines..." />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-5 font-sans text-xs select-none">
      
      {/* Page Header */}
      <PageHeader
        title="Reverse Logistics Center"
        description="Monitor vendor repair pipelines, swap workloads, and optimize inventory redeployments."
        actions={
          <div className="flex items-center space-x-2">
            <button onClick={() => triggerExport("pdf")} className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg shadow-sm">
              <Download className="h-3 w-3" /><span>Export PDF</span>
            </button>
            <button onClick={() => triggerExport("csv")} className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg shadow-sm">
              <FileSpreadsheet className="h-3 w-3" /><span>Export CSV</span>
            </button>
            {exportStatus && <span className="text-[10px] font-bold text-emerald-600">{exportStatus}</span>}
          </div>
        }
      />

      {/* Main Layout Grid */}
      <div className="grid grid-cols-12 gap-5 items-start">
        
        {/* Left Column: TPR Capacity Dashboard & Map */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          
          {/* Map */}
          <Card>
            <CardContent className="p-0 overflow-hidden rounded-xl h-[280px]">
              <MapContainer
                nodes={mapNodes}
                links={mapLinks}
                selectedNodeId={null}
                selectedLinkId={null}
                onSelectNode={() => {}}
                onSelectLink={() => {}}
                activeLayer="network"
              />
            </CardContent>
          </Card>

          {/* TPR Capacity & Load Dashboard */}
          <Card>
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1.5">
                <Wrench className="h-4 w-4 text-blue-500" />
                <span>Third-Party Repair Vendor (TPR) Dashboard</span>
              </CardTitle>
              <CardDescription>Live repair capacity, stock pipeline levels, and utilization rates.</CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
              <table className="w-full text-left border-collapse text-[10px] font-bold text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[8px] py-2">
                    <th>Repair Center</th>
                    <th>ID</th>
                    <th>Capacity/Day</th>
                    <th>Current Load</th>
                    <th>Avg Repair Days</th>
                    <th>Utilization</th>
                    <th>Efficiency</th>
                  </tr>
                </thead>
                <tbody>
                  {tprs.map((t) => (
                    <tr
                      key={t.tpr_id}
                      onClick={() => setSelectedTpr(t)}
                      className={`border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer ${selectedTpr?.tpr_id === t.tpr_id ? 'bg-blue-50/20' : ''}`}
                    >
                      <td className="py-2.5 font-extrabold text-slate-850">{t.tpr_name}</td>
                      <td className="py-2.5 font-mono">{t.tpr_id}</td>
                      <td className="py-2.5">{t.capacity} units</td>
                      <td className="py-2.5">{t.current_load} units</td>
                      <td className="py-2.5">{t.avg_repair_time} days</td>
                      <td className="py-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold ${t.utilization_pct > 80 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {t.utilization_pct}%
                        </span>
                      </td>
                      <td className="py-2.5 font-black text-blue-600">{t.efficiency_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI swaps, Stockout predictors, Redeployments */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          
          {/* Smart Repair Swapping */}
          <Card className="bg-slate-900 text-slate-200 border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-800/60">
              <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1.5 text-blue-400">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span>Smart Repair Swapping (Workloads)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {swaps.map((s, idx) => (
                <div key={idx} className="p-3 border border-slate-800 bg-slate-850/40 rounded-xl space-y-2 text-[9px] text-slate-350 font-bold">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold text-white block">Swap: {s.overloaded_tpr} ➔ {s.alternative_tpr}</span>
                  </div>
                  <p className="text-slate-400 font-medium">Expected Workload Reduction: <span className="text-white font-bold">{s.workload_reduction_units} units</span></p>
                  <p className="text-slate-400 font-medium">Transit Shift: {s.transit_days_difference > 0 ? `+${s.transit_days_difference}` : s.transit_days_difference} Days</p>
                  <p className="text-blue-400 font-bold">↪ Benefit: {s.business_benefit}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Days Until Stockout Predictor */}
          <Card>
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>Days Until Stockout Predictor</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2.5 max-h-[220px] overflow-y-auto">
              {stockouts.map((st, idx) => (
                <div key={idx} className="p-2.5 border border-slate-100 rounded-xl flex items-center justify-between font-bold text-[9px] text-slate-500">
                  <div>
                    <span className="text-slate-800 block text-[10px] font-extrabold">{st.hub_id} Hub</span>
                    <span className="block mt-0.5">Part: {st.part_no} | Usage: {st.avg_daily_usage}/day</span>
                    <span className="block text-[8px] text-blue-600 mt-1">↪ {st.recommendation}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${st.critical_level === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                      {st.days_remaining} Days
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Redeployment Plans */}
          <Card>
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1.5">
                <Activity className="h-4 w-4 text-blue-500" />
                <span>Redeployment Opportunities</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {redeployments.map((r, idx) => (
                <div key={idx} className="p-3 border border-slate-100 rounded-xl space-y-1.5 font-bold text-slate-650">
                  <div className="flex justify-between items-center text-slate-800 text-[10px] font-extrabold">
                    <span>Part: {r.part_no}</span>
                    <span className="text-blue-600">Cost: {formatCurrency(r.est_cost)}</span>
                  </div>
                  <p className="text-[9.5px]">Path: {r.excess_location} ➔ {r.low_stock_location} ({r.transit_days}d transit)</p>
                  <p className="text-[9px] text-slate-500 font-medium leading-normal">{r.benefit}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>

      {reverseProof && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1.5">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>Closer TPR Recommendations</span>
              </CardTitle>
              <CardDescription>Reverse shipments routed farther than necessary when a capable TPR has capacity.</CardDescription>
            </CardHeader>
            <CardContent className="pt-3 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-[10px] font-bold text-slate-600">
                <thead className="text-[8px] uppercase text-slate-400">
                  <tr>
                    <th className="py-2">Transaction</th>
                    <th>Current TPR</th>
                    <th>Recommended TPR</th>
                    <th>KM Saved</th>
                  </tr>
                </thead>
                <tbody>
                  {(reverseProof.closer_tpr_recommendations || []).slice(0, 8).map((row: any) => (
                    <tr key={row.transaction_id} className="border-t border-slate-100">
                      <td className="py-2.5 font-mono text-slate-900">{row.transaction_id}</td>
                      <td>{row.current_tpr}</td>
                      <td className="text-emerald-700">{row.recommended_tpr}</td>
                      <td>{Number(row.distance_saved_km || 0).toFixed(0)} km</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1.5">
                <Package className="h-4 w-4 text-emerald-600" />
                <span>Batching and Restock Evidence</span>
              </CardTitle>
              <CardDescription>Consolidation candidates and repair-input restock alerts from loaded parts data.</CardDescription>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {(reverseProof.repair_consolidation_opportunities || []).slice(0, 4).map((row: any) => (
                <div key={`${row.origin_hub}-${row.tpr_id}-${row.part_no}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-black text-slate-900">{row.origin_hub} to {row.tpr_id}</span>
                    <span className="text-[10px] font-black text-emerald-700">{formatCurrency(row.estimated_batch_saving)} saving</span>
                  </div>
                  <p className="mt-1 text-[9px] font-bold text-slate-500">{row.shipments} shipments / {row.units} units / part {row.part_no}</p>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2">
                {(reverseProof.restock_alerts || []).slice(0, 4).map((row: any) => (
                  <div key={row.part_no} className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                    <p className="text-[10px] font-black text-amber-900">{row.part_no}</p>
                    <p className="mt-1 text-[9px] font-bold text-amber-700">Min {row.min_stock_level} / reorder {row.reorder_quantity}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
export { Wrench }
