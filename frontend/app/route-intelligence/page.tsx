"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileSpreadsheet,
  Map,
  MapPin,
  Package,
  Play,
  RefreshCw,
  Route,
  ShieldCheck,
  Sliders,
  Sparkles,
  Truck,
  Zap
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetHubs, useGetParts, useGetRecommendations, useRunSimulation } from "@/services/queries"
import { RouteOption } from "@/types"
import { cn, formatCurrency } from "@/lib/utils"
import { downloadCSV, downloadExcel, downloadTextPDF } from "@/utils/export"
import apiClient from "@/services/api-client"

function StatTile({
  label,
  value,
  detail,
  icon: Icon,
  tone = "green"
}: {
  label: string
  value: string
  detail?: string
  icon: React.ElementType
  tone?: "green" | "amber" | "rose" | "slate"
}) {
  const tones = {
    
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    slate: "bg-slate-50 text-slate-700"
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
      </div>
      <div className="mt-4 text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-black text-slate-950">{value}</div>
      {detail && <div className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">{detail}</div>}
    </div>
  )
}

function RouteCanvas({ route, originName, destinationName }: { route: RouteOption | null; originName: string; destinationName: string }) {
  const path = route?.path ?? []
  const via = path.slice(1, -1)

  return (
    <div className="relative min-h-[460px] overflow-hidden rounded-[28px] border border-slate-200 bg-[#EEF3F8] shadow-sm">
      <div className="absolute inset-0 opacity-50" style={{
        backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
        backgroundSize: "28px 28px"
      }} />
      <div className="relative z-10 flex items-center justify-between border-b border-white/80 bg-white/90 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-black text-slate-950">Route Simulation</span>
        </div>
        <Badge variant={route ? "success" : "neutral"}>{route ? "Algorithm Ready" : "Waiting"}</Badge>
      </div>

      {!route ? (
        <div className="relative z-10 flex min-h-[390px] flex-col items-center justify-center px-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm">
            <Route className="h-8 w-8" />
          </div>
          <div className="mt-4 text-lg font-black text-slate-900">Generate a route to preview the path</div>
          <div className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
            The engine will rank direct and relay paths using distance, transit time, cost, SLA risk, and hub congestion.
          </div>
        </div>
      ) : (
        <div className="relative z-10 min-h-[390px] p-6">
          <svg className="absolute inset-x-8 top-20 h-56 w-[calc(100%-64px)]" viewBox="0 0 720 260" preserveAspectRatio="none">
            <defs>
              <linearGradient id="routeLine" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="55%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>
            <path d="M 50 185 C 210 35, 460 35, 670 185" fill="none" stroke="#d1d5db" strokeWidth="18" strokeLinecap="round" />
            <path d="M 50 185 C 210 35, 460 35, 670 185" fill="none" stroke="url(#routeLine)" strokeWidth="11" strokeLinecap="round" />
            {via.map((_, index) => {
              const x = via.length === 1 ? 360 : 250 + index * 220
              return <circle key={index} cx={x} cy={78} r="10" fill="#10b981" stroke="#fff" strokeWidth="5" />
            })}
            <circle cx="50" cy="185" r="13" fill="#2563eb" stroke="#fff" strokeWidth="6" />
            <circle cx="670" cy="185" r="13" fill="#ef4444" stroke="#fff" strokeWidth="6" />
          </svg>

          <div className="absolute left-8 top-[245px] max-w-[210px] rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-700">
              <MapPin className="h-4 w-4" /> Origin
            </div>
            <div className="mt-1 text-sm font-black text-slate-950">{originName}</div>
            <div className="mt-1 font-mono text-[10px] font-bold text-slate-400">{path[0]}</div>
          </div>

          <div className="absolute right-8 top-[245px] max-w-[210px] rounded-2xl bg-white p-4 text-right shadow-sm">
            <div className="flex items-center justify-end gap-2 text-xs font-black text-rose-700">
              Destination <MapPin className="h-4 w-4" />
            </div>
            <div className="mt-1 text-sm font-black text-slate-950">{destinationName}</div>
            <div className="mt-1 font-mono text-[10px] font-bold text-slate-400">{path[path.length - 1]}</div>
          </div>

          {via.length > 0 && (
            <div className="absolute left-1/2 top-[120px] max-w-[240px] -translate-x-1/2 rounded-2xl border border-emerald-100 bg-white p-4 text-center shadow-sm">
              <div className="text-xs font-black uppercase tracking-wider text-emerald-700">Controlled relay</div>
              <div className="mt-1 font-mono text-sm font-black text-slate-950">{via.join(" -> ")}</div>
            </div>
          )}

          <div className="absolute bottom-5 left-5 right-5 grid gap-3 md:grid-cols-4">
            <StatTile label="Transit" value={`${route.total_transit_days.toFixed(1)}d`} detail="planned ETA" icon={Clock} tone="green" />
            <StatTile label="Cost" value={formatCurrency(route.total_cost)} detail="estimated freight" icon={Database} tone="green" />
            <StatTile label="Distance" value={`${route.total_distance_km.toFixed(0)} km`} detail="total route" icon={Route} tone="slate" />
            <StatTile label="SLA Success" value={`${route.sla_success_rate.toFixed(1)}%`} detail={route.risk_level} icon={ShieldCheck} tone={route.risk_level === "High" ? "rose" : "green"} />
          </div>
        </div>
      )}
    </div>
  )
}

function RouteCard({
  route,
  index,
  selected,
  onSelect,
  tradeoffScore,
  carbonKg
}: {
  route: RouteOption
  index: number
  selected: boolean
  onSelect: () => void
  tradeoffScore: number
  carbonKg: number
}) {
  const isBest = index === 0
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full rounded-[26px] border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        selected ? "border-emerald-300 ring-4 ring-emerald-100" : isBest ? "border-emerald-200" : "border-white/80"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-slate-950">{isBest ? "Recommended Route" : `Alternative ${index}`}</h3>
            <Badge variant={isBest ? "success" : "neutral"}>{route.risk_level} Risk</Badge>
            {isBest && <Badge variant="info">Best score</Badge>}
            {carbonKg === 0 ? null : <Badge variant="success">{carbonKg.toFixed(0)} kg CO2</Badge>}
          </div>
          <div className="mt-2 font-mono text-xs font-bold text-slate-500">{route.path.join(" -> ")}</div>
        </div>
          <div className="text-right">
            <div className="text-2xl font-black text-slate-950">{route.confidence_score.toFixed(0)}%</div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Confidence</div>
            <div className="mt-2 text-xs font-black text-emerald-700">{tradeoffScore.toFixed(0)} tradeoff score</div>
          </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-emerald-50 p-3">
          <div className="text-lg font-black text-emerald-700">{route.total_transit_days.toFixed(1)}d</div>
          <div className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Transit</div>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-3">
          <div className="text-lg font-black text-emerald-700">{formatCurrency(route.total_cost)}</div>
          <div className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Cost</div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-lg font-black text-slate-800">{route.total_distance_km.toFixed(0)} km</div>
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Distance</div>
        </div>
        <div className="rounded-2xl bg-amber-50 p-3">
          <div className="text-lg font-black text-amber-700">{route.congestion_index.toFixed(0)}%</div>
          <div className="text-[10px] font-black uppercase tracking-wider text-amber-500">Congestion</div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-2xl bg-emerald-50 p-3">
          <div className="text-sm font-black text-emerald-700">{carbonKg.toFixed(0)} kg</div>
          <div className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Carbon estimate</div>
        </div>
        <div className="rounded-2xl bg-rose-50 p-3">
          <div className="text-sm font-black text-rose-700">{route.sla_breach_rate.toFixed(1)}%</div>
          <div className="text-[10px] font-black uppercase tracking-wider text-rose-500">SLA breach history</div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-sm font-black text-slate-800">{route.total_distance_km > 1200 ? "Linehaul" : "Ground"}</div>
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Transport mode</div>
        </div>
      </div>

      <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">{route.explanation}</p>
    </button>
  )
}

function ParetoFrontier({ insights, selectedIndex, onSelect }: {
  insights: { route: RouteOption; index: number; carbonKg: number; score: number }[]
  selectedIndex: number
  onSelect: (index: number) => void
}) {
  if (!insights.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm font-bold text-slate-400">
        Generate routes to view the Pareto frontier.
      </div>
    )
  }

  const maxCost = Math.max(...insights.map((item) => item.route.total_cost), 1)
  const maxTransit = Math.max(...insights.map((item) => item.route.total_transit_days), 1)
  const sorted = [...insights].sort((a, b) => a.route.total_cost - b.route.total_cost)
  const frontier: typeof insights = []
  let bestTransit = Infinity
  sorted.forEach((item) => {
    if (item.route.total_transit_days < bestTransit) {
      frontier.push(item)
      bestTransit = item.route.total_transit_days
    }
  })

  const point = (item: typeof insights[number]) => ({
    x: 44 + (item.route.total_cost / maxCost) * 420,
    y: 222 - (item.route.total_transit_days / maxTransit) * 170,
  })

  const frontierPath = frontier.map(point).map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <svg viewBox="0 0 520 260" className="h-64 w-full">
        <line x1="44" y1="222" x2="488" y2="222" stroke="#cbd5e1" />
        <line x1="44" y1="36" x2="44" y2="222" stroke="#cbd5e1" />
        <text x="250" y="252" textAnchor="middle" className="fill-slate-500 text-[11px] font-bold">Lower cost to higher cost</text>
        <text x="12" y="136" transform="rotate(-90 12 136)" textAnchor="middle" className="fill-slate-500 text-[11px] font-bold">Faster transit</text>
        {frontierPath && <path d={frontierPath} fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
        {insights.map((item) => {
          const p = point(item)
          const active = selectedIndex === item.index
          return (
            <g key={item.index} role="button" onClick={() => onSelect(item.index)} className="cursor-pointer">
              <circle cx={p.x} cy={p.y} r={active ? 9 : 7} fill={active ? "#059669" : "#94a3b8"} stroke="#fff" strokeWidth="3" />
              <text x={p.x} y={p.y - 13} textAnchor="middle" className="fill-slate-700 text-[10px] font-black">{item.score.toFixed(0)}</text>
            </g>
          )
        })}
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-600" /> Pareto-efficient route</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-400" /> Candidate route</span>
      </div>
    </div>
  )
}

export default function RouteIntelligencePage() {
  const { data: hubsData, isLoading: hubsLoading } = useGetHubs({ page: 1, limit: 100 })
  const { data: partsData, isLoading: partsLoading } = useGetParts({ page: 1, limit: 100 })
  const recommendationMutation = useGetRecommendations()
  const simulationMutation = useRunSimulation()

  const hubs = hubsData?.items ?? []
  const parts = partsData?.items ?? []

  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [partNo, setPartNo] = useState("")
  const [quantity, setQuantity] = useState(10)
  const [priority, setPriority] = useState("P1")
  const [deliveryWindow, setDeliveryWindow] = useState(7)
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [message, setMessage] = useState("")
  const [destinationCity, setDestinationCity] = useState("Mumbai")
  const [autoSourceResult, setAutoSourceResult] = useState<any>(null)
  const [autoSourceLoading, setAutoSourceLoading] = useState(false)
  const [tradeoffs, setTradeoffs] = useState({ cost: 30, speed: 30, sla: 25, carbon: 15 })
  const [offlineHubs, setOfflineHubs] = useState<string[]>([])
  const [actualCost, setActualCost] = useState("")
  const [actualTransitDays, setActualTransitDays] = useState("")
  const [actualSlaBreach, setActualSlaBreach] = useState(false)
  const [feedbackNotes, setFeedbackNotes] = useState("")
  const [feedbackStatus, setFeedbackStatus] = useState("")
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  useEffect(() => {
    if (!origin && hubs[0]) setOrigin(hubs[0].hub_id)
    if (!destination && hubs[1]) setDestination(hubs[1].hub_id)
    if (!partNo && parts[0]) setPartNo(parts[0].part_no)
  }, [destination, hubs, origin, partNo, parts])

  const originHub = hubs.find((hub) => hub.hub_id === origin)
  const destinationHub = hubs.find((hub) => hub.hub_id === destination)
  const selectedPart = parts.find((part) => part.part_no === partNo)

  const routes = useMemo(() => {
    const response = autoSourceResult?.recommendation ?? recommendationMutation.data
    const recommended = response?.recommended
    const alternatives = response?.alternatives ?? []
    return recommended ? [recommended, ...alternatives] : []
  }, [autoSourceResult, recommendationMutation.data])

  const routeInsights = useMemo(() => {
    if (!routes.length) return []
    const maxCost = Math.max(...routes.map((route) => route.total_cost), 1)
    const maxTransit = Math.max(...routes.map((route) => route.total_transit_days), 1)
    const maxCarbon = Math.max(...routes.map((route) => route.total_distance_km * 0.19 * quantity), 1)
    const totalWeight = Math.max(1, tradeoffs.cost + tradeoffs.speed + tradeoffs.sla + tradeoffs.carbon)

    return routes.map((route, index) => {
      const carbonKg = route.total_distance_km * 0.19 * quantity
      const costScore = 100 * (1 - route.total_cost / maxCost)
      const speedScore = 100 * (1 - route.total_transit_days / maxTransit)
      const slaScore = Math.max(0, 100 - route.sla_breach_rate)
      const carbonScore = 100 * (1 - carbonKg / maxCarbon)
      const score = (
        costScore * tradeoffs.cost +
        speedScore * tradeoffs.speed +
        slaScore * tradeoffs.sla +
        carbonScore * tradeoffs.carbon
      ) / totalWeight
      return { route, index, carbonKg, score: Math.max(0, score) }
    }).sort((a, b) => b.score - a.score)
  }, [quantity, routes, tradeoffs])

  const selectedRoute = routes[selectedRouteIndex] ?? routes[0] ?? null
  const selectedInsight = routeInsights.find((item) => item.index === selectedRouteIndex) ?? routeInsights[0] ?? null

  useEffect(() => {
    if (!selectedRoute) return
    setActualCost(selectedRoute.total_cost.toFixed(0))
    setActualTransitDays(selectedRoute.total_transit_days.toFixed(1))
    setActualSlaBreach(selectedRoute.sla_breach_rate > 50)
  }, [selectedRoute])

  const runRecommendation = () => {
    setMessage("")
    if (!origin || !destination || !partNo) {
      setMessage("Select origin, destination, and part before running route intelligence.")
      return
    }
    if (origin === destination) {
      setMessage("Origin and destination must be different.")
      return
    }
    setSelectedRouteIndex(0)
    setAutoSourceResult(null)
    recommendationMutation.mutate({
      origin,
      destination,
      part_no: partNo,
      quantity,
      priority,
      required_delivery_window_days: deliveryWindow
    })
  }

  const runAutoSourceRecommendation = async () => {
    setMessage("")
    if (!partNo || !destinationCity.trim()) {
      setMessage("Select a part and destination city before running auto-source routing.")
      return
    }
    setAutoSourceLoading(true)
    setSelectedRouteIndex(0)
    try {
      const response = await apiClient.post("/challenge/recommend/auto-source", {
        part_no: partNo,
        quantity,
        priority,
        destination_city: destinationCity.trim(),
        required_delivery_window_days: deliveryWindow
      })
      setAutoSourceResult(response.data)
      if (response.data?.selected_origin?.hub_id) setOrigin(response.data.selected_origin.hub_id)
      if (response.data?.destination?.hub_id) setDestination(response.data.destination.hub_id)
      setMessage(`Auto-source selected ${response.data?.selected_origin?.hub_name || "best stock hub"} from current inventory.`)
    } catch (error: any) {
      setMessage(error?.response?.data?.detail || "Auto-source recommender failed for this request.")
    } finally {
      setAutoSourceLoading(false)
    }
  }

  const toggleOfflineHub = (hubId: string) => {
    setOfflineHubs((prev) => prev.includes(hubId) ? prev.filter((id) => id !== hubId) : [...prev, hubId])
  }

  const runOfflineSimulation = () => {
    if (offlineHubs.length === 0) {
      setMessage("Select at least one offline hub before running dynamic reroute simulation.")
      return
    }
    setMessage("")
    simulationMutation.mutate({ disabled_hubs: offlineHubs, disabled_tprs: [] })
  }

  const submitRouteFeedback = async () => {
    if (!selectedRoute) {
      setFeedbackStatus("Run route intelligence before logging outcome feedback.")
      return
    }
    setFeedbackLoading(true)
    setFeedbackStatus("")
    try {
      const response = await apiClient.post("/challenge/route-feedback", {
        route_path: selectedRoute.path,
        predicted_cost: selectedRoute.total_cost,
        actual_cost: Number(actualCost || selectedRoute.total_cost),
        predicted_transit_days: selectedRoute.total_transit_days,
        actual_transit_days: Number(actualTransitDays || selectedRoute.total_transit_days),
        predicted_sla_breach_rate: selectedRoute.sla_breach_rate,
        actual_sla_breach: actualSlaBreach,
        notes: feedbackNotes,
      })
      setFeedbackStatus(`${response.data.status}: ${response.data.next_model_action}`)
    } catch {
      setFeedbackStatus("Could not record route outcome feedback.")
    } finally {
      setFeedbackLoading(false)
    }
  }

  const exportRoutes = (format: "pdf" | "csv" | "xlsx") => {
    if (!routes.length) {
      setMessage("Run route intelligence before exporting.")
      return
    }
    const rows = [
      ["Rank", "Path", "Cost", "Transit Days", "Distance KM", "SLA Success", "SLA Breach", "Risk", "Confidence", "Explanation"],
      ...routes.map((route, index) => [
        index + 1,
        route.path.join(" -> "),
        route.total_cost,
        route.total_transit_days,
        route.total_distance_km,
        route.sla_success_rate,
        route.sla_breach_rate,
        route.risk_level,
        route.confidence_score,
        route.explanation
      ])
    ]
    const filename = `route-intelligence-${origin}-${destination}-${new Date().toISOString().slice(0, 10)}`
    if (format === "csv") {
      downloadCSV(`${filename}.csv`, rows)
      return
    }
    if (format === "xlsx") {
      downloadExcel(`${filename}.xls`, [{ name: "Routes", rows }])
      return
    }
    downloadTextPDF(`${filename}.pdf`, "Route Intelligence Recommendation", rows.map((row) => row.join(" | ")))
  }

  const loading = hubsLoading || partsLoading

  return (
    <div className="min-h-[calc(100vh-104px)] space-y-6 bg-[#F6F8FB] p-2 font-sans text-slate-900">
      <section className="rounded-[30px] border border-white/80 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-13 w-13 items-center justify-center rounded-3xl bg-emerald-600 p-3 text-white shadow-lg shadow-emerald-500/20">
              <Route className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">Routing Intelligence</h1>
              <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Big-card route planning powered by the deterministic shortest-path-aware recommendation engine.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => exportRoutes("pdf")}>
              <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
            <Button variant="outline" onClick={() => exportRoutes("csv")}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" onClick={() => exportRoutes("xlsx")}>
              <Database className="mr-2 h-4 w-4" /> Excel
            </Button>
          </div>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
          {message}
        </div>
      )}
      {recommendationMutation.isError && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          Route engine failed to compute this request. Check backend logs or select another origin/destination pair.
        </div>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[460px_minmax(0,1fr)]">
        <Card className="rounded-[28px] border-white/80 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-black">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              Route Request
            </CardTitle>
            <CardDescription>Choose real hubs and parts from the loaded backend dataset.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-12 w-full rounded-2xl" />)}
              </div>
            ) : (
              <>
                <label className="space-y-2 block">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">Origin Hub</span>
                  <select value={origin} onChange={(event) => setOrigin(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100">
                    {hubs.map((hub) => <option key={hub.hub_id} value={hub.hub_id}>{hub.hub_name} ({hub.hub_id})</option>)}
                  </select>
                </label>
                <label className="space-y-2 block">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">Destination Hub</span>
                  <select value={destination} onChange={(event) => setDestination(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100">
                    {hubs.map((hub) => <option key={hub.hub_id} value={hub.hub_id}>{hub.hub_name} ({hub.hub_id})</option>)}
                  </select>
                </label>
                <label className="space-y-2 block">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">Part Number</span>
                  <select value={partNo} onChange={(event) => setPartNo(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100">
                    {parts.map((part) => <option key={part.part_no} value={part.part_no}>{part.part_no} - {part.category}</option>)}
                  </select>
                </label>
                <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                  <label className="space-y-2 block">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-700">Challenge Agent Input: Destination City</span>
                    <input value={destinationCity} onChange={(event) => setDestinationCity(event.target.value)} className="h-12 w-full rounded-2xl border border-emerald-200 bg-white px-3 text-sm font-bold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100" />
                  </label>
                  <Button className="mt-3 h-11 w-full rounded-2xl bg-emerald-600 text-sm font-black hover:bg-emerald-700" isLoading={autoSourceLoading} onClick={runAutoSourceRecommendation}>
                    <Sparkles className="mr-2 h-4 w-4" /> Auto-Select Stock Source
                  </Button>
                  {autoSourceResult?.selected_origin && (
                    <p className="mt-3 text-[11px] font-bold leading-5 text-emerald-800">
                      Selected {autoSourceResult.selected_origin.hub_name} with {autoSourceResult.selected_origin.stock} units in stock, {Number(autoSourceResult.selected_origin.distance_to_destination_km || 0).toFixed(0)} km from destination.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-2 block">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">Quantity</span>
                    <input type="number" min={1} value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100" />
                  </label>
                  <label className="space-y-2 block">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">Window Days</span>
                    <input type="number" min={1} value={deliveryWindow} onChange={(event) => setDeliveryWindow(Math.max(1, Number(event.target.value) || 1))} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100" />
                  </label>
                </div>
                <label className="space-y-2 block">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">Priority</span>
                  <select value={priority} onChange={(event) => setPriority(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100">
                    <option value="P1">P1 - Critical</option>
                    <option value="P2">P2 - High</option>
                    <option value="P3">P3 - Standard</option>
                    <option value="P4">P4 - Economy</option>
                  </select>
                </label>
                <Button className="h-12 w-full rounded-2xl text-base font-black" isLoading={recommendationMutation.isPending} onClick={runRecommendation}>
                  <Play className="mr-2 h-5 w-5" /> Generate Ranked Routes
                </Button>
              </>
            )}

            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Selected Load</div>
              <div className="mt-3 space-y-2 text-sm font-bold text-slate-700">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-600" /> {originHub?.hub_name ?? "Origin not selected"}</div>
                <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-emerald-600" /> {destinationHub?.hub_name ?? "Destination not selected"}</div>
                <div className="flex items-center gap-2"><Package className="h-4 w-4 text-amber-600" /> {selectedPart?.part_description ?? partNo}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            <StatTile label="Routes Found" value={`${routes.length}`} detail="ranked options" icon={Route} tone="green" />
            <StatTile label="Best Transit" value={selectedRoute ? `${selectedRoute.total_transit_days.toFixed(1)}d` : "-"} detail="selected route" icon={Clock} tone="green" />
            <StatTile label="Best Cost" value={selectedRoute ? formatCurrency(selectedRoute.total_cost) : "-"} detail="estimated freight" icon={Database} tone="slate" />
            <StatTile label="Confidence" value={selectedRoute ? `${selectedRoute.confidence_score.toFixed(0)}%` : "-"} detail="engine score" icon={ShieldCheck} tone="amber" />
          </div>

          <Card className="rounded-[28px] border-emerald-100 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black">
                <Sliders className="h-5 w-5 text-emerald-600" />
                Multi-Objective Tradeoff
              </CardTitle>
              <CardDescription>Adjust cost, speed, SLA, and carbon priorities to compare optimal route choices.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {([
                  ["cost", "Cost"],
                  ["speed", "Speed"],
                  ["sla", "SLA"],
                  ["carbon", "Carbon"],
                ] as const).map(([key, label]) => (
                  <label key={key} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      value={tradeoffs[key]}
                      onChange={(event) => setTradeoffs((prev) => ({ ...prev, [key]: Number(event.target.value) }))}
                      className="mt-3 w-full accent-emerald-600"
                    />
                    <span className="mt-1 block text-sm font-black text-emerald-700">{tradeoffs[key]}</span>
                  </label>
                ))}
              </div>
              <ParetoFrontier insights={routeInsights} selectedIndex={selectedRouteIndex} onSelect={setSelectedRouteIndex} />
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-white/80 bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg font-black">
                    <Zap className="h-5 w-5 text-emerald-600" />
                    Ranked Route Cards
                  </CardTitle>
                  <CardDescription>
                    Direct paths and relay paths are scored by transit, distance, SLA reliability, cost, and congestion.
                  </CardDescription>
                </div>
                {routes.length > 0 && <Badge variant="success">{routes.length} options</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendationMutation.isPending ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-44 w-full rounded-[26px]" />)}
                </div>
              ) : routes.length === 0 ? (
                <div className="flex min-h-[310px] flex-col items-center justify-center rounded-[26px] border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                  <AlertTriangle className="h-10 w-10 text-slate-300" />
                  <div className="mt-3 text-lg font-black text-slate-900">No route generated yet</div>
                  <div className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
                    Fill the request card and run the engine. If no options come back, the selected hubs may not have enough coordinate data.
                  </div>
                </div>
              ) : (
                routeInsights.map(({ route, index, score, carbonKg }) => (
                  <RouteCard
                    key={`${route.path.join("-")}-${index}`}
                    route={route}
                    index={index}
                    selected={selectedRouteIndex === index}
                    onSelect={() => setSelectedRouteIndex(index)}
                    tradeoffScore={score}
                    carbonKg={carbonKg}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-5 xl:col-start-2">
          <RouteCanvas route={selectedRoute} originName={originHub?.hub_name ?? origin} destinationName={destinationHub?.hub_name ?? destination} />

          <Card className="rounded-[28px] border-white/80 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Algorithm Evidence
              </CardTitle>
              <CardDescription>Transparent scoring from the deterministic route intelligence service.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ["Direct lane always considered", true],
                ["One-hop relays checked", true],
                ["Detour penalty applied", true],
                ["P1/P2 prioritize speed and distance", priority === "P1" || priority === "P2"],
                ["Delivery-window penalty applied", true],
                ["Historical SLA used when available", true]
              ].map(([label, active]) => (
                <div key={label as string} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="text-xs font-black text-slate-700">{label}</span>
                  {active ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="h-2 w-2 rounded-full bg-slate-300" />}
                </div>
              ))}
              {recommendationMutation.data?.explanation && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800">
                  {recommendationMutation.data.explanation}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-emerald-100 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black">
                <Database className="h-5 w-5 text-emerald-600" />
                Agent Audit Trail
              </CardTitle>
              <CardDescription>Plain-language trace of which rules and data points drove the selected recommendation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedRoute ? (
                [
                  ["Route path", selectedRoute.path.join(" -> ")],
                  ["Decision rule", selectedRoute.path.length <= 2 ? "Direct/nearest stocked lane preferred" : "Relay route selected after detour and SLA scoring"],
                  ["Cost driver", `${formatCurrency(selectedRoute.total_cost)} transport estimate from historical lane scale and distance fallback`],
                  ["SLA driver", `${selectedRoute.sla_breach_rate.toFixed(1)}% breach history used as downrank signal`],
                  ["Carbon driver", `${(selectedInsight?.carbonKg || 0).toFixed(0)} kg CO2 included in multi-objective score`],
                  ["Final score", `${(selectedInsight?.score || selectedRoute.confidence_score).toFixed(1)} route utility / ${selectedRoute.confidence_score.toFixed(0)}% confidence`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-800">{value}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-400">
                  Generate a route to view the audit trail.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-emerald-100 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                Learning Feedback Loop
              </CardTitle>
              <CardDescription>Log actual route outcomes so future SLA and route scoring can be recalibrated.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Actual Transport Cost</span>
                  <input
                    type="number"
                    value={actualCost}
                    onChange={(event) => setActualCost(event.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Actual Transit Days</span>
                  <input
                    type="number"
                    step="0.1"
                    value={actualTransitDays}
                    onChange={(event) => setActualTransitDays(event.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-black text-slate-700">
                <input type="checkbox" checked={actualSlaBreach} onChange={(event) => setActualSlaBreach(event.target.checked)} className="h-4 w-4 accent-emerald-600" />
                Actual shipment breached SLA
              </label>
              <textarea
                value={feedbackNotes}
                onChange={(event) => setFeedbackNotes(event.target.value)}
                placeholder="Outcome notes..."
                className="min-h-20 w-full rounded-2xl border border-slate-200 p-3 text-sm font-semibold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              />
              <Button className="w-full rounded-2xl bg-emerald-600 font-black hover:bg-emerald-700" isLoading={feedbackLoading} onClick={submitRouteFeedback}>
                <Sparkles className="mr-2 h-4 w-4" /> Log Outcome For Learning
              </Button>
              {feedbackStatus && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-bold leading-5 text-emerald-800">
                  {feedbackStatus}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-emerald-100 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black">
                <RefreshCw className="h-5 w-5 text-emerald-600" />
                Dynamic Re-Routing Simulation
              </CardTitle>
              <CardDescription>Simulate hubs going offline mid-transit and calculate affected shipments, reroutes, cost, transit, and SLA impact.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {hubs.slice(0, 10).map((hub) => {
                  const active = offlineHubs.includes(hub.hub_id)
                  return (
                    <button
                      key={hub.hub_id}
                      onClick={() => toggleOfflineHub(hub.hub_id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-[11px] font-black transition",
                        active ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
                      )}
                    >
                      {active ? "Offline: " : ""}{hub.hub_name}
                    </button>
                  )
                })}
              </div>
              <Button className="rounded-2xl bg-emerald-600 font-black hover:bg-emerald-700" isLoading={simulationMutation.isPending} onClick={runOfflineSimulation}>
                <RefreshCw className="mr-2 h-4 w-4" /> Run Reroute Impact
              </Button>

              {simulationMutation.data && (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <StatTile label="Affected" value={`${simulationMutation.data.affected_shipments_count}`} detail="shipments impacted" icon={Truck} tone="rose" />
                    <StatTile label="Rerouted" value={`${simulationMutation.data.rerouted_shipments_count}`} detail="new paths found" icon={Route} tone="green" />
                    <StatTile label="Cost Delta" value={formatCurrency(simulationMutation.data.cost_delta)} detail={`${formatCurrency(simulationMutation.data.original_total_cost)} baseline`} icon={Database} tone={simulationMutation.data.cost_delta > 0 ? "amber" : "green"} />
                    <StatTile label="SLA Delta" value={`${simulationMutation.data.sla_breach_delta.toFixed(1)}%`} detail="breach-rate impact" icon={ShieldCheck} tone={simulationMutation.data.sla_breach_delta > 0 ? "rose" : "green"} />
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-900">
                    {simulationMutation.data.operational_impact_summary}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Transit before / after</p>
                      <p className="mt-2 text-xl font-black text-slate-950">
                        {simulationMutation.data.original_avg_transit_days.toFixed(1)}d{" -> "}{simulationMutation.data.new_avg_transit_days.toFixed(1)}d
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">SLA before / after</p>
                      <p className="mt-2 text-xl font-black text-slate-950">
                        {simulationMutation.data.original_sla_breach_rate.toFixed(1)}%{" -> "}{simulationMutation.data.new_sla_breach_rate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
