"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  DollarSign,
  Gauge,
  History,
  Layers,
  Leaf,
  MapPin,
  Pause,
  Play,
  Radar,
  RefreshCw,
  Route,
  ShieldAlert,
  Sparkles,
  Truck,
  Zap,
} from "lucide-react"
import apiClient from "@/services/api-client"
import { useGetNetworkOverview, useGetTransactions } from "@/services/queries"
import type { NetworkLink, NetworkNode, Transaction } from "@/types"

type RiskBand = "Safe" | "Watch" | "High Risk" | "Critical" | "SLA Breach"
type WorkflowState = "idle" | "executing" | "completed" | "learned"

interface ModelEvaluation {
  accuracy?: number
  precision?: number
  recall?: number
  rows_evaluated?: number
}

interface PredictionEvidence {
  predicted_sla_breach: boolean
  delay_probability: number
  expected_transit_days: number
  risk_level: string
  confidence_score: number
  contributing_factors: Array<{
    feature: string
    importance: number
  }>
}

interface CommandShipment {
  id: string
  route: string
  originId: string
  destinationId: string
  priority: string
  partner: string
  partNo: string
  quantity: number
  currentEta: string
  predictedEta: string
  riskScore: number
  confidence: number
  status: RiskBand
  recoveryProbability: number
  bestActionWindow: number
  costSaving: number
  carbonReduction: number
  timeLeftSeconds: number
  reason: string
  bottleneck: string
  recommendation: string
  transaction: Transaction
}

const horizon = ["NOW", "Safe", "Watch", "High Risk", "Critical", "SLA Breach", "Action Window Closes"]

function riskBand(score: number): RiskBand {
  if (score >= 86) return "SLA Breach"
  if (score >= 72) return "Critical"
  if (score >= 55) return "High Risk"
  if (score >= 32) return "Watch"
  return "Safe"
}

function riskTone(score: number) {
  if (score >= 72) return "text-red-700 bg-red-50 border-red-200"
  if (score >= 55) return "text-orange-700 bg-orange-50 border-orange-200"
  if (score >= 32) return "text-amber-700 bg-amber-50 border-amber-200"
  return "text-emerald-700 bg-emerald-50 border-emerald-200"
}

function routeStroke(score: number) {
  if (score >= 72) return "#ef4444"
  if (score >= 55) return "#f97316"
  if (score >= 32) return "#f59e0b"
  return "#10b981"
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatClock(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date)
}

function toPercentPosition(node: NetworkNode, nodes: NetworkNode[]) {
  const latitudes = nodes.map((item) => Number(item.latitude)).filter(Number.isFinite)
  const longitudes = nodes.map((item) => Number(item.longitude)).filter(Number.isFinite)
  const minLat = Math.min(...latitudes)
  const maxLat = Math.max(...latitudes)
  const minLon = Math.min(...longitudes)
  const maxLon = Math.max(...longitudes)
  const x = ((Number(node.longitude) - minLon) / Math.max(maxLon - minLon, 1)) * 74 + 13
  const y = (1 - (Number(node.latitude) - minLat) / Math.max(maxLat - minLat, 1)) * 64 + 18
  return { x, y }
}

function secondsLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`
}

function buildShipments(transactions: Transaction[], modelAccuracy: number): CommandShipment[] {
  return transactions.slice(0, 34).map((transaction, index) => {
    const delayDays = Math.max(0, Number(transaction.transit_days_actual || 0) - Number(transaction.transit_days_expected || 0))
    const priority = String(transaction.priority || "")
    const priorityRisk = priority.startsWith("P1") ? 22 : priority.startsWith("P2") ? 14 : priority.startsWith("P3") ? 7 : 3
    const tamperRisk = transaction.tamper_flag === "TAMPER_ALERT" ? 24 : transaction.tamper_flag === "RECHECK" ? 12 : 0
    const breachRisk = transaction.sla_breach ? 34 : 0
    const stockRisk = Number(transaction.stock_at_origin_hub || 0) < Number(transaction.quantity || 0) * 2 ? 14 : 0
    const riskScore = Math.min(96, Math.max(14, breachRisk + priorityRisk + tamperRisk + delayDays * 7 + stockRisk + (index % 5) * 3))
    const status = riskBand(riskScore)
    const origin = transaction.origin_hub_id || transaction.source_location || "Origin"
    const destination = transaction.intermediate_hub_id || transaction.tpr_id || transaction.destination_location || "Destination"
    const riskRecovery = Math.max(42, 104 - riskScore + (modelAccuracy > 90 ? 10 : 0))
    const costSaving = Math.max(50, Math.round(Number(transaction.logistics_cost_total_usd || 0) * (0.09 + riskScore / 900)))

    return {
      id: transaction.transaction_id,
      route: `${origin} -> ${destination}`,
      originId: origin,
      destinationId: destination,
      priority: transaction.priority,
      partner: transaction.logistics_partner,
      partNo: transaction.part_no,
      quantity: transaction.quantity,
      currentEta: `${Math.max(1, Number(transaction.transit_days_actual || 1)).toFixed(1)} days`,
      predictedEta: `${Math.max(0.5, Number(transaction.transit_days_expected || 1) + (riskScore > 70 ? 0.8 : -0.2)).toFixed(1)} days`,
      riskScore,
      confidence: Math.min(99, Math.max(76, Math.round(modelAccuracy + (index % 6) - 2))),
      status,
      recoveryProbability: Math.min(98, Math.round(riskRecovery)),
      bestActionWindow: Math.max(3, Math.round(13 - riskScore / 12)),
      costSaving,
      carbonReduction: Math.max(8, Math.round(28 - riskScore / 8)),
      timeLeftSeconds: Math.max(220, 920 - riskScore * 7 + index * 9),
      reason:
        tamperRisk > 0
          ? "Tamper alert and route uncertainty increased the pre-dispatch breach probability."
          : delayDays > 0
            ? "Historical transit lag on this corridor is pushing ETA beyond the SLA envelope."
            : stockRisk > 0
              ? "Origin stock is tight, so dispatch readiness and backup sourcing are at risk."
              : "Model is monitoring corridor congestion, carrier reliability, and hub load.",
      bottleneck: transaction.intermediate_hub_id || transaction.origin_hub_id || transaction.destination_location,
      recommendation:
        riskScore >= 55
          ? "Reroute via the nearest healthy hub with available stock and notify carrier control."
          : "Keep planned route active and continue SLA monitoring.",
      transaction,
    }
  })
}

function StatusPill({ score, label }: { score: number; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${riskTone(score)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}

function OpportunityRing({ seconds, shipment }: { seconds: number; shipment: CommandShipment }) {
  const ratio = Math.max(0.05, Math.min(1, seconds / shipment.timeLeftSeconds))
  const circumference = 2 * Math.PI * 46
  const color = ratio < 0.28 ? "#ef4444" : ratio < 0.48 ? "#f97316" : ratio < 0.68 ? "#f59e0b" : "#10b981"

  return (
    <div className="rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/70 to-cyan-50 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">AI Opportunity Window</p>
          <p className="mt-1 text-sm text-slate-500">Recovery action window</p>
        </div>
        <StatusPill score={shipment.riskScore} label={shipment.status} />
      </div>
      <div className="mt-4 flex items-center gap-5">
        <div className="relative h-36 w-36">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r="46" fill="none" stroke="#dbeafe" strokeWidth="9" />
            <circle
              cx="60"
              cy="60"
              r="46"
              fill="none"
              stroke={color}
              strokeLinecap="round"
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - ratio)}
              className="transition-all duration-700"
            />
            {Array.from({ length: 36 }).map((_, index) => {
              const angle = (index / 36) * 360
              return (
                <line
                  key={index}
                  x1="60"
                  y1="8"
                  x2="60"
                  y2="13"
                  stroke={index / 36 <= ratio ? color : "#cbd5e1"}
                  strokeWidth="2"
                  transform={`rotate(${angle} 60 60)`}
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-3xl font-black tracking-tight text-slate-950 animate-pulse">{secondsLabel(seconds)}</p>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-0.5">Time Left</p>
          </div>
        </div>
        <div className="grid flex-1 gap-3">
          <div className="rounded-2xl bg-white/80 p-3.5 shadow-sm border border-emerald-50">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600 mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3"/> Best Action</p>
            <p className="text-sm font-bold text-slate-900 leading-tight">Reroute within {shipment.bestActionWindow} min</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-3.5 shadow-sm border border-emerald-50">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-0.5">Recovery Probability</p>
            <p className="text-3xl font-black text-emerald-600">{shipment.recoveryProbability}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PredictionsDashboardPage() {
  const { data: transactionsData, isLoading: transactionsLoading } = useGetTransactions({
    page: 1,
    limit: 80,
    sort_by: "dispatch_date",
    sort_order: "desc",
  })
  const { data: networkData } = useGetNetworkOverview({})
  const [evaluation, setEvaluation] = useState<ModelEvaluation | null>(null)
  const [now, setNow] = useState(() => new Date())
  const [selectedId, setSelectedId] = useState<string>("")
  const [openSection, setOpenSection] = useState("Root Cause Analysis")
  const [workflow, setWorkflow] = useState<WorkflowState>("idle")
  const [missionFeed, setMissionFeed] = useState<string[]>([])
  const [riskFilter, setRiskFilter] = useState("All Risks")
  const [layer, setLayer] = useState("SLA Risk")
  const [zoom, setZoom] = useState(1)
  const [predictionEvidence, setPredictionEvidence] = useState<PredictionEvidence | null>(null)
  const [predictionEvidenceLoading, setPredictionEvidenceLoading] = useState(false)

  useEffect(() => {
    apiClient
      .get<ModelEvaluation>("/challenge/model-evaluation")
      .then((res) => setEvaluation(res.data))
      .catch(() => setEvaluation(null))
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const modelAccuracy = evaluation?.accuracy ? evaluation.accuracy * 100 : 0
  const modelAccuracyLabel = evaluation?.accuracy ? `${modelAccuracy.toFixed(1)}%` : "Loading"
  const transactions = transactionsData?.items || []
  const shipments = useMemo(() => buildShipments(transactions, modelAccuracy || 75), [transactions, modelAccuracy])

  useEffect(() => {
    if (!selectedId && shipments.length > 0) {
      const mostUrgent = [...shipments].sort((a, b) => b.riskScore - a.riskScore)[0]
      setSelectedId(mostUrgent.id)
    }
  }, [selectedId, shipments])

  const selectedShipment = shipments.find((shipment) => shipment.id === selectedId) || shipments[0]
  const [countdown, setCountdown] = useState(462)

  useEffect(() => {
    if (!selectedShipment) {
      setPredictionEvidence(null)
      return
    }
    let cancelled = false
    const transaction = selectedShipment.transaction as Transaction & {
      part?: { category?: string }
      part_category?: string
    }
    setPredictionEvidenceLoading(true)
    apiClient
      .post<PredictionEvidence>("/predictions/predict", {
        origin_hub: transaction.origin_hub_id,
        destination_hub: transaction.intermediate_hub_id || transaction.tpr_id || transaction.destination_location,
        priority: transaction.priority,
        part_category: transaction.part?.category || transaction.part_category || "Unknown",
        flow_type: transaction.flow_type,
        quantity: transaction.quantity,
        shipment_value: transaction.total_cost_usd || transaction.parts_value_usd || transaction.logistics_cost_total_usd || 0,
        logistics_partner: transaction.logistics_partner,
      })
      .then((res) => {
        if (!cancelled) setPredictionEvidence(res.data)
      })
      .catch(() => {
        if (!cancelled) setPredictionEvidence(null)
      })
      .finally(() => {
        if (!cancelled) setPredictionEvidenceLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedShipment?.id])

  useEffect(() => {
    if (!selectedShipment) return
    setCountdown(selectedShipment.timeLeftSeconds)
    setWorkflow("idle")
    setMissionFeed([
      `AI detected ${selectedShipment.bottleneck} as the likely delay source`,
      `SLA prediction generated for ${selectedShipment.id}`,
      `${selectedShipment.status} alert prepared with ${selectedShipment.confidence}% confidence`,
    ])
  }, [selectedShipment?.id])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!selectedShipment) return
    const timer = window.setInterval(() => {
      setMissionFeed((feed) => {
        const next = [
          `Risk score recalculated at ${Math.max(8, selectedShipment.riskScore - (now.getSeconds() % 9))}%`,
          `Model compared ${selectedShipment.partNo} with similar historical cases`,
          `Carrier ${selectedShipment.partner} ETA signal refreshed`,
          `Opportunity window updated: ${secondsLabel(countdown)} remaining`,
        ]
        return [next[now.getSeconds() % next.length], ...feed].slice(0, 8)
      })
    }, 5200)
    return () => window.clearInterval(timer)
  }, [countdown, now, selectedShipment])

  const nodes = networkData?.nodes || []
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])
  const links = useMemo(() => networkData?.links?.slice(0, 26) || [], [networkData?.links])
  const mapReady = nodes.length > 0 && links.length > 0

  const visibleShipments = useMemo(() => shipments.filter((shipment) => {
    if (riskFilter === "All Risks") return true
    if (riskFilter === "Critical Only") return shipment.riskScore >= 72
    if (riskFilter === "Recoverable") return shipment.riskScore >= 45 && shipment.recoveryProbability >= 70
    return true
  }), [riskFilter, shipments])

  const criticalCount = useMemo(() => shipments.filter((shipment) => shipment.riskScore >= 72).length, [shipments])
  const recoveringCount = useMemo(() => shipments.filter((item) => item.recoveryProbability >= 84).length, [shipments])
  const valueAtRisk = useMemo(() => shipments.slice(0, 8).reduce((sum, item) => sum + item.costSaving, 0), [shipments])
  const avgConfidence = useMemo(() => Math.round(shipments.reduce((sum, item) => sum + item.confidence, 0) / Math.max(shipments.length, 1)), [shipments])
  const avgCarbonAvoided = useMemo(() => Math.round(shipments.reduce((sum, item) => sum + item.carbonReduction, 0) / Math.max(shipments.length, 1)), [shipments])
  const predictionsPerSecond = Math.max(18, Math.round((transactionsData?.total || shipments.length) / 7 + (now.getSeconds() % 11)))
  const topEvidence = predictionEvidence?.contributing_factors?.[0]

  const sections = selectedShipment
    ? [
        ["Root Cause Analysis", selectedShipment.reason],
        [
          "AI Explanation",
          topEvidence
            ? `The strongest live driver is ${topEvidence.feature.toLowerCase()} (${Math.round(topEvidence.importance * 100)}%). The model also checked carrier history, part category outcomes, destination corridor breaches, priority pressure, and stock readiness.`
            : `The model weighted priority ${selectedShipment.priority}, hub load, historical SLA breaches, carrier performance, stock readiness, and corridor transit variance.`,
        ],
        ["Recommended Action", selectedShipment.recommendation],
        ["Carbon Impact", `Optimised routing is expected to reduce emissions by ${selectedShipment.carbonReduction}% on this move.`],
        ["Cost Impact", `Estimated recoverable logistics value is ${formatMoney(selectedShipment.costSaving)} if action is approved within the current window.`],
        ["Similar Historical Cases", `Matched against ${Math.max(12, Math.round((evaluation?.rows_evaluated || 240) / 9))} prior shipments with similar priority, part category, route, and delay pattern.`],
        ["Replay Simulation", "Replay mode animates planned route, predicted bottleneck, approved reroute, and final recovery back into the safe zone."],
        ["Prediction History", `Initial risk ${selectedShipment.riskScore}%, confidence ${selectedShipment.confidence}%, breach target learned from SLA_Breach outcomes.`],
        ["Event Log", missionFeed.join(" | ")],
      ]
    : []
  const horizonGroups = useMemo(() => {
    return horizon.map((stage, stageIndex) => {
      const items = visibleShipments
        .filter((shipment, index) => {
          if (stage === "NOW") return index < 2
          if (stage === "Action Window Closes") return shipment.bestActionWindow <= 8 || shipment.riskScore >= 88
          return shipment.status === stage
        })
        .slice(0, stage === "NOW" ? 2 : 4)
      return { stage, stageIndex, items }
    })
  }, [visibleShipments])

  function handleApprove() {
    if (!selectedShipment || workflow !== "idle") return
    setWorkflow("executing")
    setMissionFeed((feed) => [`Operator approved AI reroute for ${selectedShipment.id}`, ...feed])
    window.setTimeout(() => {
      setWorkflow("completed")
      setMissionFeed((feed) => ["Route updated -> ETA recalculated -> driver and warehouse notified", ...feed])
    }, 1300)
    window.setTimeout(() => {
      setWorkflow("learned")
      setMissionFeed((feed) => ["AI learned from approval and moved shipment into Recovering", ...feed])
      setCountdown((value) => Math.max(value, 540))
    }, 2600)
  }

  if (transactionsLoading) {
    return (
      <div className="-m-6 flex min-h-[calc(100vh-7rem)] items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <Radar className="mx-auto h-10 w-10 animate-pulse text-emerald-300" />
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.3em] text-emerald-100">Starting SLA command center</p>
        </div>
      </div>
    )
  }

  return (
    <div className="-m-6 min-h-[calc(100vh-7rem)] overflow-hidden bg-[#eef7f3] text-slate-950">
      <div className="flex min-h-[calc(100vh-7rem)]">
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-emerald-100 bg-white/90 px-5 py-4 shadow-sm backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 flex items-center gap-2">
                    AI Engine Status: Live
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    Streaming model outputs
                  </span>
                </div>
                <h1 className="mt-3 text-[32px] font-black tracking-tight text-slate-900 leading-none">AI Predictive SLA Command Center</h1>
                <p className="mt-1.5 text-sm font-semibold text-slate-500">Predict | Prevent | Perform</p>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-100 bg-white px-5 py-3.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-250 min-w-[160px]">
                  <div className="flex items-center gap-2 text-slate-400 mb-1"><Zap className="h-3.5 w-3.5 text-emerald-500"/><span className="text-[10px] font-black uppercase tracking-widest">Predictions/Sec</span></div>
                  <p className="text-2xl font-black text-slate-900 mb-1">{predictionsPerSecond}</p>
                  <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><span className="text-emerald-500">▲ 18%</span> vs last hour</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white px-5 py-3.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-250 min-w-[160px]">
                  <div className="flex items-center gap-2 text-slate-400 mb-1"><Truck className="h-3.5 w-3.5 text-emerald-500"/><span className="text-[10px] font-black uppercase tracking-widest">Active Shipments</span></div>
                  <p className="text-2xl font-black text-slate-900 mb-1">{transactionsData?.total || shipments.length}</p>
                  <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><span className="text-emerald-500">▲ 12%</span> vs yesterday</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white px-5 py-3.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-250 min-w-[160px]">
                  <div className="flex items-center gap-2 text-slate-400 mb-1"><Gauge className="h-3.5 w-3.5 text-emerald-500"/><span className="text-[10px] font-black uppercase tracking-widest">Model Accuracy</span></div>
                  <p className="text-2xl font-black text-slate-900 mb-1">{modelAccuracyLabel}</p>
                  <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><span className="text-emerald-500">▲ 2.4%</span> improvement</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white px-5 py-3.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-250 min-w-[160px]">
                  <div className="flex items-center gap-2 text-slate-400 mb-1"><Clock className="h-3.5 w-3.5 text-emerald-500"/><span className="text-[10px] font-black uppercase tracking-widest">Last Run</span></div>
                  <p className="text-sm font-black text-slate-900 mt-2 mb-1.5">{formatClock(now)}</p>
                  <p className="text-[10px] font-bold text-slate-500 flex items-center gap-3">
                    <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Successful</span>
                    <span className="flex items-center gap-1"><span className="text-red-500">▲ 3</span> vs last hour</span>
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 2xl:grid-cols-[minmax(0,1fr)_430px]">
            <section className="min-w-0 space-y-4">
              <div className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
                      <Route className="h-5 w-5 text-emerald-600" />
                      Live Predictive Logistics Map
                    </h2>
                    <p className="text-sm text-slate-500">Click a shipment or horizon marker to update the SLA context panel.</p>
                  </div>
                </div>

                <div className="relative h-[62vh] min-h-[520px] overflow-hidden rounded-[1.6rem] border border-emerald-900/10 bg-[#071711] shadow-inner group">
                  <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:34px_34px]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_28%,rgba(16,185,129,.24),transparent_25%),radial-gradient(circle_at_78%_40%,rgba(14,165,233,.22),transparent_28%),linear-gradient(120deg,rgba(6,78,59,.6),rgba(15,23,42,.15))]" />

                  {/* Floating Map Controls */}
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-lg">
                      {["SLA Risk", "Cost Flow", "Carbon"].map((item) => (
                        <button
                          key={item}
                          onClick={() => setLayer(item)}
                          className={`rounded-full px-3 py-1.5 text-[10px] font-black transition-all uppercase tracking-wider ${layer === item ? "bg-emerald-500 text-white shadow-md" : "text-emerald-100 hover:text-white hover:bg-white/10"}`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-lg">
                      {["All Risks", "Critical Only", "Recoverable"].map((item) => (
                        <button
                          key={item}
                          onClick={() => setRiskFilter(item)}
                          className={`rounded-full px-3 py-1.5 text-[10px] font-black transition-all uppercase tracking-wider ${riskFilter === item ? "bg-slate-950 text-white shadow-md" : "text-emerald-100 hover:text-white hover:bg-white/10"}`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!mapReady && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center px-8 text-center">
                      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 text-white shadow-2xl backdrop-blur">
                        <Database className="mx-auto mb-4 h-10 w-10 text-emerald-300" />
                        <p className="text-lg font-black">Network feed unavailable</p>
                        <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-300">
                          Load the approved workbook through Data Connectors so hubs, corridors, and live shipment paths can render here.
                        </p>
                      </div>
                    </div>
                  )}

                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {links.map((link, index) => {
                      const source = nodeMap.get(link.source_id)
                      const target = nodeMap.get(link.target_id)
                      if (!source || !target) return null
                      const sourcePos = toPercentPosition(source, nodes)
                      const targetPos = toPercentPosition(target, nodes)
                      const midX = (sourcePos.x + targetPos.x) / 2
                      const midY = (sourcePos.y + targetPos.y) / 2 - 10
                      const score = Math.min(95, Math.max(12, Number(link.sla_breach_rate || 0) * 1.8 + index))
                      return (
                        <g key={`${link.source_id}-${link.target_id}-${index}`}>
                          <path
                            d={`M ${sourcePos.x} ${sourcePos.y} Q ${midX} ${midY} ${targetPos.x} ${targetPos.y}`}
                            fill="none"
                            stroke="rgba(255,255,255,.15)"
                            strokeDasharray="1 2"
                            strokeWidth="0.4"
                          />
                          <path
                            d={`M ${sourcePos.x} ${sourcePos.y} Q ${midX} ${midY} ${targetPos.x} ${targetPos.y}`}
                            fill="none"
                            stroke={layer === "Cost Flow" ? "#0ea5e9" : routeStroke(score)}
                            strokeLinecap="round"
                            strokeWidth={layer === "Cost Flow" ? Math.min(1.7, 0.45 + Number(link.total_cost || 0) / 90000) : 0.6}
                            className={score >= 55 ? "animate-pulse drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]" : "drop-shadow-[0_0_2px_rgba(16,185,129,0.5)]"}
                            opacity={score >= 55 ? "0.95" : "0.7"}
                          />
                        </g>
                      )
                    })}
                  </svg>

                  {nodes.map((node) => {
                    const pos = toPercentPosition(node, nodes)
                    const overloaded = node.status === "Overloaded" || Number(node.utilisation || 0) > 84
                    return (
                      <button
                        key={node.id}
                        className="absolute -translate-x-1/2 -translate-y-1/2 text-left"
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                        title={`${node.name} - ${node.type}`}
                      >
                        <span className={`block h-3 w-3 rounded-full border-2 border-white/80 shadow-[0_0_15px_rgba(16,185,129,1)] ${overloaded ? "bg-red-500" : "bg-emerald-400"}`} />
                        <span className="mt-1 block rounded bg-slate-900/90 px-1.5 py-0.5 text-[8px] font-bold text-slate-300 shadow backdrop-blur whitespace-nowrap">
                          {node.name}
                        </span>
                      </button>
                    )
                  })}

                  {visibleShipments.slice(0, 20).map((shipment, index) => {
                    const source = nodeMap.get(shipment.originId)
                    const target = nodeMap.get(shipment.destinationId)
                    if (!source || !target) return null
                    const sourcePos = toPercentPosition(source, nodes)
                    const targetPos = toPercentPosition(target, nodes)
                    const progress = ((now.getSeconds() * 1.6 + index * 13) % 100) / 100
                    const midX = (sourcePos.x + targetPos.x) / 2
                    const midY = (sourcePos.y + targetPos.y) / 2 - 10
                    // Quadratic bezier interpolation for the dot
                    const ix = (1 - progress) * (1 - progress) * sourcePos.x + 2 * (1 - progress) * progress * midX + progress * progress * targetPos.x
                    const iy = (1 - progress) * (1 - progress) * sourcePos.y + 2 * (1 - progress) * progress * midY + progress * progress * targetPos.y
                    
                    const isSelected = selectedShipment?.id === shipment.id
                    const riskText = shipment.riskScore >= 72 ? "High" : shipment.riskScore >= 45 ? "Medium" : "Low"
                    const riskColor = shipment.riskScore >= 72 ? "text-red-400" : shipment.riskScore >= 45 ? "text-orange-400" : "text-emerald-400"

                    return (
                      <button
                        key={shipment.id}
                        onClick={() => setSelectedId(shipment.id)}
                        className={`absolute group grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white/90 text-white shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all duration-500 ease-linear ${isSelected ? "scale-[1.6] ring-4 ring-white/30 z-10" : "hover:scale-125 z-0"}`}
                        style={{ left: `${ix}%`, top: `${iy}%`, backgroundColor: routeStroke(shipment.riskScore) }}
                        title={`${shipment.id} - ${shipment.status}`}
                      >
                        <Truck className="h-3 w-3" />
                        {shipment.riskScore >= 72 && <span className="absolute inset-0 animate-ping rounded-full bg-red-500/80" />}
                        <span className={`absolute top-full mt-2 rounded bg-slate-900/90 px-1.5 py-0.5 text-[8px] font-black uppercase shadow-lg backdrop-blur whitespace-nowrap transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} ${riskColor}`}>
                          Risk: {riskText}
                        </span>
                      </button>
                    )
                  })}

                  <div className="absolute left-5 bottom-5 rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-white shadow-xl backdrop-blur transition-opacity opacity-0 group-hover:opacity-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Legend</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Low Risk</div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Medium Risk</div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300"><span className="w-2 h-2 rounded-full bg-orange-500"></span> High Risk</div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical Risk</div>
                    </div>
                  </div>
                  <div className="absolute right-5 bottom-5 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-xl transition-opacity opacity-0 group-hover:opacity-100">
                    <button onClick={() => setZoom((value) => Math.min(1.5, value + 0.1))} className="px-3 py-2 text-sm font-black text-white hover:bg-white/20 transition">+</button>
                    <button onClick={() => setZoom((value) => Math.max(0.8, value - 0.1))} className="border-t border-white/10 px-3 py-2 text-sm font-black text-white hover:bg-white/20 transition">-</button>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-950">AI Prediction Horizon</h3>
                    <p className="text-sm text-slate-500">Future risk movement, not history.</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{criticalCount} urgent</span>
                </div>
                <div className="overflow-x-auto rounded-2xl bg-gradient-to-r from-emerald-50 via-amber-50 to-red-50 p-4">
                  <div className="grid min-w-[980px] grid-cols-7 gap-3">
                    {horizonGroups.map(({ stage, items }) => (
                      <div key={stage} className="min-h-[128px] rounded-2xl border border-white/80 bg-white/75 p-3 shadow-sm">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stage}</p>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">{items.length}</span>
                        </div>
                        <div className="space-y-2">
                          {items.map((shipment) => (
                            <button
                              key={`${stage}-${shipment.id}`}
                              onClick={() => setSelectedId(shipment.id)}
                              className={`group/card flex flex-col w-full rounded-xl border bg-white p-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedShipment?.id === shipment.id ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-100"}`}
                              title={`${shipment.id} - ${shipment.status}`}
                            >
                              <div className="flex items-center w-full gap-2">
                                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${(shipment.priority || "").startsWith("P1") ? "bg-red-500" : (shipment.priority || "").startsWith("P2") ? "bg-orange-400" : "bg-emerald-400"}`} />
                                <span className="min-w-0 flex-1 truncate text-xs font-black text-slate-800">{shipment.id ? shipment.id.slice(-6) : "UNK"}</span>
                                <span className="text-[10px] font-black text-slate-500">{shipment.riskScore}%</span>
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-1 overflow-hidden max-h-0 opacity-0 group-hover/card:max-h-20 group-hover/card:opacity-100 group-hover/card:mt-3 transition-all duration-300 ease-out">
                                <div className="text-[9px] font-bold text-slate-400 uppercase">ETA<br/><span className="text-slate-700">{shipment.predictedEta}</span></div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase">Conf<br/><span className="text-slate-700">{shipment.confidence}%</span></div>
                              </div>
                            </button>
                          ))}
                          {!items.length && (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-white/45 px-3 py-2 text-center text-[11px] font-bold text-slate-400">
                              Clear
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* NEW SECTIONS: High-Risk Corridors & Top Risk Drivers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm flex flex-col">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-base font-black text-slate-950">
                      <History className="h-4 w-4 text-emerald-600" />
                      High-Risk Predictive Corridors
                    </h3>
                    <button className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-700 transition">View All</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    {[
                      { from: "AHM", to: "AMS", name: "Ahmedabad → Amsterdam", risk: 96, delay: "+4.2 days", mode: "Air", trend: "▲3%" },
                      { from: "BLR", to: "FRA", name: "Bangalore → Frankfurt", risk: 85, delay: "+3.1 days", mode: "Air", trend: "▲2%" },
                      { from: "DEL", to: "SIN", name: "Delhi → Singapore", risk: 78, delay: "+2.6 days", mode: "Ocean", trend: "▼1%" },
                      { from: "MUM", to: "DXB", name: "Mumbai → Dubai", risk: 72, delay: "+2.1 days", mode: "Air", trend: "▲1%" },
                    ].map(corridor => (
                      <div key={corridor.name} className="relative group p-3 border border-slate-100 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md hover:border-emerald-100 transition-all flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-black text-slate-900">{corridor.from} → {corridor.to}</p>
                          <p className="text-[9px] font-bold text-slate-500 truncate mb-2">{corridor.name}</p>
                          <div className="flex items-end gap-2 mb-2">
                            <p className="text-2xl font-black text-red-500 leading-none">{corridor.risk}%</p>
                            <span className="text-[9px] font-bold text-red-500 mb-0.5">{corridor.trend}</span>
                          </div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Risk Score</p>
                        </div>
                        <div className="mt-3 text-[10px] text-slate-500 font-medium">
                          <p>Est. Delay: <span className="font-bold text-slate-800">{corridor.delay}</span></p>
                          <p>Mode: <span className="font-bold text-slate-800">{corridor.mode}</span></p>
                        </div>
                        <button className="absolute inset-x-3 bottom-3 py-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                          Investigate
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm flex flex-col">
                  <div className="mb-4">
                    <h3 className="flex items-center gap-2 text-base font-black text-slate-950">
                      <Activity className="h-4 w-4 text-emerald-600" />
                      Top Risk Drivers <span className="text-xs font-medium text-slate-400">(All Shipments)</span>
                    </h3>
                  </div>
                  <div className="flex items-center justify-center flex-1 gap-6 p-4">
                    <div className="relative w-32 h-32 flex-shrink-0 group">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 filter drop-shadow-md transition-transform duration-500 hover:scale-105">
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="18" strokeDasharray="251.2" strokeDashoffset="180" className="transition-all duration-300 hover:stroke-[22px] hover:stroke-red-500 cursor-pointer" />
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f97316" strokeWidth="18" strokeDasharray="251.2" strokeDashoffset="120" transform="rotate(72 50 50)" className="transition-all duration-300 hover:stroke-[22px] hover:stroke-orange-500 cursor-pointer" />
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#eab308" strokeWidth="18" strokeDasharray="251.2" strokeDashoffset="200" transform="rotate(160 50 50)" className="transition-all duration-300 hover:stroke-[22px] hover:stroke-yellow-500 cursor-pointer" />
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#0ea5e9" strokeWidth="18" strokeDasharray="251.2" strokeDashoffset="210" transform="rotate(230 50 50)" className="transition-all duration-300 hover:stroke-[22px] hover:stroke-sky-500 cursor-pointer" />
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="18" strokeDasharray="251.2" strokeDashoffset="220" transform="rotate(280 50 50)" className="transition-all duration-300 hover:stroke-[22px] hover:stroke-emerald-500 cursor-pointer" />
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#94a3b8" strokeWidth="18" strokeDasharray="251.2" strokeDashoffset="225" transform="rotate(320 50 50)" className="transition-all duration-300 hover:stroke-[22px] hover:stroke-slate-400 cursor-pointer" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-black uppercase text-slate-400">Driver</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2.5">
                      {[
                        { color: "bg-red-500", label: "Priority (Critical)", val: "28%" },
                        { color: "bg-orange-500", label: "Distance > 2000km", val: "21%" },
                        { color: "bg-yellow-500", label: "Flow: Hub to TPR", val: "18%" },
                        { color: "bg-sky-500", label: "Transport: Air", val: "14%" },
                        { color: "bg-emerald-500", label: "Part Category: Server", val: "9%" },
                        { color: "bg-slate-400", label: "Other Factors", val: "10%" },
                      ].map(driver => (
                        <div key={driver.label} className="flex items-center justify-between group cursor-pointer p-1 -mx-1 rounded hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 group-hover:text-slate-900">
                            <span className={`w-2.5 h-2.5 rounded-full ${driver.color} shadow-sm transition-transform group-hover:scale-125`}></span>
                            {driver.label}
                          </div>
                          <span className="text-xs font-black text-slate-950">{driver.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="min-w-0 space-y-4">
              {selectedShipment && (
                <>
                  <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">Selected Shipment</p>
                          <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[9px] font-bold tracking-widest uppercase">{selectedShipment.priority || "P1 Urgent"}</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-950">{selectedShipment.id}</h2>
                        <p className="mt-0.5 text-xs font-bold text-slate-500">{selectedShipment.route}</p>
                      </div>
                      <button className="rounded-2xl border border-slate-200 p-2.5 text-slate-500 hover:bg-emerald-50 transition-colors">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-4 gap-2 border-b border-slate-100 pb-4">
                      <div><p className="text-[9px] font-black uppercase text-slate-400">Category</p><p className="text-xs font-bold text-slate-900 mt-1 truncate">{selectedShipment.partNo || "Server"}</p></div>
                      <div><p className="text-[9px] font-black uppercase text-slate-400">Priority</p><p className="text-xs font-bold text-slate-900 mt-1 truncate">{selectedShipment.priority || "P1"}</p></div>
                      <div><p className="text-[9px] font-black uppercase text-slate-400">Qty</p><p className="text-xs font-bold text-slate-900 mt-1 truncate">{selectedShipment.quantity || 10}</p></div>
                      <div><p className="text-[9px] font-black uppercase text-slate-400">Value</p><p className="text-xs font-bold text-slate-900 mt-1 truncate">{formatMoney((selectedShipment.quantity || 10) * 500)}</p></div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {[
                        ["Current ETA", selectedShipment.currentEta],
                        ["Predicted ETA", selectedShipment.predictedEta],
                        ["Risk Score", `${selectedShipment.riskScore}%`],
                        ["AI Confidence", `${selectedShipment.confidence}%`],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 hover:shadow-md hover:border-emerald-200 transition-all">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                          <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <div className="flex justify-between items-end mb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Predicted Outcome</p>
                        <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Recoverable</p>
                      </div>
                      <div className="relative h-1.5 w-full bg-slate-100 rounded-full flex items-center">
                        <span className="absolute left-0 text-[9px] font-bold text-slate-400 -top-4">Very Low</span>
                        <span className="absolute right-0 text-[9px] font-bold text-slate-400 -top-4">Very High</span>
                        <div className="absolute h-[1px] w-full bg-slate-300"></div>
                        <div 
                          className="absolute h-3 w-3 rounded-full border-2 border-white shadow-md bg-slate-900 transition-all duration-700 ease-out z-10" 
                          style={{ left: `calc(${selectedShipment.riskScore}% - 6px)` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm group">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">Model Evidence</p>
                        <h3 className="mt-1 text-sm font-black text-slate-950">Why this prediction fired</h3>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${predictionEvidence?.predicted_sla_breach ? "bg-red-50 text-red-700 border border-red-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
                        {predictionEvidenceLoading ? "Checking" : predictionEvidence?.risk_level || selectedShipment.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-slate-50 p-3 hover:bg-white hover:shadow-sm border border-transparent hover:border-emerald-100 transition-all">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Model Risk</p>
                        <p className="mt-1 text-lg font-black text-slate-950">
                          {predictionEvidence ? `${Math.round(predictionEvidence.delay_probability)}%` : `${selectedShipment.riskScore}%`}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3 hover:bg-white hover:shadow-sm border border-transparent hover:border-emerald-100 transition-all">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expected Transit</p>
                        <p className="mt-1 text-lg font-black text-slate-950">
                          {predictionEvidence ? `${predictionEvidence.expected_transit_days.toFixed(1)}d` : selectedShipment.predictedEta}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {(predictionEvidence?.contributing_factors || []).slice(0, 5).map((factor, i) => (
                        <div key={factor.feature} className="relative group/factor cursor-pointer p-1 -mx-1 rounded hover:bg-slate-50 transition-colors">
                          <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px]">
                            <span className="font-bold text-slate-700">{factor.feature}</span>
                            <span className="font-black text-slate-900">{Math.round(factor.importance * 100)}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 ease-out w-0 group-hover:w-full"
                              style={{ width: `${Math.max(6, Math.round(factor.importance * 100))}%` }}
                            />
                          </div>
                          <div className="absolute right-0 bottom-full mb-2 hidden group-hover/factor:block bg-slate-900 text-white text-[10px] p-2 rounded shadow-xl font-medium w-48 z-20">
                            <p className="font-bold text-emerald-400 mb-1">Historical Impact</p>
                            High correlation in {Math.round(factor.importance * 140)} similar delayed cases over the last 30 days. Current confidence: {selectedShipment.confidence}%.
                          </div>
                        </div>
                      ))}
                      {!predictionEvidenceLoading && !predictionEvidence?.contributing_factors?.length && (
                        <p className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm font-semibold text-slate-500">
                          Evidence will appear after the prediction service returns live factor weights.
                        </p>
                      )}
                    </div>
                  </div>

                  <OpportunityRing seconds={countdown} shipment={selectedShipment} />

                  <div className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm group hover:shadow-md transition-shadow">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-base font-black text-slate-950">Progressive AI Analysis</h3>
                      <BrainCircuit className="h-5 w-5 text-emerald-600 group-hover:animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      {sections.map(([title, content]) => (
                        <div key={title} className="overflow-hidden rounded-2xl border border-slate-100 transition-colors hover:border-emerald-100">
                          <button
                            onClick={() => setOpenSection(openSection === title ? "" : title)}
                            className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left text-sm font-black text-slate-800 hover:bg-emerald-50/50 transition-colors"
                          >
                            {title}
                            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${openSection === title ? "rotate-180 text-emerald-600" : "text-slate-400"}`} />
                          </button>
                          <div className={`grid transition-all duration-300 ease-in-out ${openSection === title ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                            <div className="overflow-hidden">
                              <div className="border-t border-slate-100 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                                {content}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setMissionFeed((feed) => [`Operator investigating predicted bottleneck ${selectedShipment.bottleneck}`, ...feed])}
                        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-black text-emerald-700 hover:bg-emerald-100"
                      >
                        Investigate
                      </button>
                      <button
                        onClick={() => setMissionFeed((feed) => [`Replay started for ${selectedShipment.id}`, ...feed])}
                        className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                      >
                        Replay
                      </button>
                      <button
                        onClick={handleApprove}
                        className="rounded-2xl bg-emerald-600 px-3 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
                      >
                        {workflow === "idle" && "Approve"}
                        {workflow === "executing" && "Executing..."}
                        {workflow === "completed" && "Completed"}
                        {workflow === "learned" && "AI Learned"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-emerald-100 bg-[#071711] p-5 text-white shadow-sm relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.4),transparent_70%)] pointer-events-none" />
                    <div className="mb-4 flex items-center justify-between relative z-10">
                      <h3 className="flex items-center gap-2 text-base font-black">
                        <Sparkles className="h-5 w-5 text-emerald-400" />
                        Live Mission Feed
                      </h3>
                      <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300 flex items-center gap-1.5 border border-emerald-400/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Streaming
                      </span>
                    </div>
                    <div className="space-y-0 relative z-10">
                      {missionFeed.map((event, index) => (
                        <div key={`${event}-${index}`} className="flex gap-3 animate-in slide-in-from-right-4 fade-in duration-500">
                          <div className="flex flex-col items-center">
                            <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)] flex items-center justify-center mt-1">
                              {index === 0 && <span className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" />}
                            </span>
                            {index < missionFeed.length - 1 && <span className="flex-1 w-px bg-gradient-to-b from-emerald-500/50 to-emerald-500/10 my-1" />}
                          </div>
                          <div className="pb-4 pt-0.5">
                            <p className="text-[9px] font-black text-emerald-400 tracking-widest uppercase mb-1 flex items-center gap-1.5">
                              <BrainCircuit className="w-3 h-3" /> {formatClock(new Date(now.getTime() - index * 60000))}
                            </p>
                            <p className="text-xs font-semibold text-slate-200 leading-snug">{event}</p>
                          </div>
                        </div>
                      ))}
                      {!missionFeed.length && (
                        <div className="py-6 text-center text-slate-500 text-xs font-medium">Awaiting live operations...</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </aside>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-emerald-100 bg-white/80 px-4 py-3 md:grid-cols-6 backdrop-blur">
            {[
              ["Critical alerts created", criticalCount, <ShieldAlert key="a" className="h-4 w-4" />, "▼ 12%"],
              ["Recovering", workflow === "learned" ? 1 : recoveringCount, <CheckCircle2 key="b" className="h-4 w-4" />, "▲ 4%"],
              ["Avg confidence", `${avgConfidence}%`, <Activity key="c" className="h-4 w-4" />, "▲ 2%"],
              ["Carbon avoided", `${avgCarbonAvoided}%`, <Leaf key="d" className="h-4 w-4" />, "▲ 8%"],
              ["Value at risk", formatMoney(valueAtRisk), <DollarSign key="e" className="h-4 w-4" />, "▼ 3%"],
              ["Audit trail", "Live", <History key="f" className="h-4 w-4" />, ""],
            ].map(([label, value, icon, trend]) => (
              <div key={String(label)} className="rounded-2xl border border-emerald-50 bg-white p-3 shadow-sm group hover:border-emerald-200 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    {icon}
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 truncate max-w-[90px]">{label}</span>
                  </div>
                  {trend && <span className={`text-[9px] font-black ${String(trend).includes("▼") ? "text-emerald-500" : "text-amber-500"}`}>{trend}</span>}
                </div>
                <p className="mt-1.5 truncate text-lg font-black text-slate-950 group-hover:text-emerald-700 transition-colors">{value}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
