"use client"

import React, { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  AlertTriangle,
  ArrowDownRight,
  BarChart3,
  Download,
  FileSpreadsheet,
  Gauge,
  Layers3,
  Loader2,
  Route,
  Search,
  ShieldCheck,
  TrendingDown,
} from "lucide-react"
import apiClient from "@/services/api-client"
import { useGetCostOptimization } from "@/services/queries"
import { formatCurrency } from "@/lib/utils"

type CostWhatIf = {
  scenario: string
  current_cost: number
  optimized_cost: number
  total_potential_saving: number
  inventory_investment_needed: number
  corridors: Array<Record<string, any>>
  suboptimal_transactions: Array<Record<string, any>>
  savings_by_hub: Array<{ name: string; potential_saving: number }>
  savings_by_part_category: Array<{ name: string; potential_saving: number }>
  savings_by_partner: Array<{ name: string; potential_saving: number }>
  savings_by_flow_type: Array<{ name: string; potential_saving: number }>
}

const segmentLabels = {
  hub: "Hub",
  part: "Part Category",
  partner: "Logistics Partner",
  flow: "Flow Type",
} as const

function downloadCsv(filename: string, rows: Array<Record<string, any>>) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header] ?? ""
          return `"${String(value).replace(/"/g, '""')}"`
        })
        .join(",")
    ),
  ].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function cleanRouteText(value: unknown) {
  return String(value || "")
    .replace(/[^\x20-\x7E]+/g, " -> ")
    .replace(/\s+-\s+>\s+/g, " -> ")
    .replace(/\s+/g, " ")
    .trim()
}

function CorridorMap({ corridor }: { corridor?: Record<string, any> }) {
  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-3xl border border-emerald-100 bg-slate-950 shadow-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.22),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(20,184,166,0.18),transparent_30%)]" />
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:32px_32px]" />
      {corridor ? (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 360" preserveAspectRatio="none">
          <path d="M 120 235 C 285 275 445 95 640 135" fill="none" stroke="rgba(251,191,36,0.45)" strokeWidth="5" strokeDasharray="10 10" />
          <motion.path
            d="M 120 235 C 290 145 475 210 640 135"
            fill="none"
            stroke="#10b981"
            strokeWidth="7"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
          />
          <motion.circle cx="120" cy="235" r="11" fill="#10b981" animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
          <motion.circle cx="640" cy="135" r="11" fill="#14b8a6" animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} />
          <motion.circle r="6" fill="white" animate={{ cx: [120, 640], cy: [235, 135] }} transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }} />
          <text x="84" y="275" fill="white" fontSize="15" fontWeight="800">{corridor.source}</text>
          <text x="604" y="116" fill="white" fontSize="15" fontWeight="800">{corridor.target}</text>
          <g>
            <rect x="300" y="38" width="180" height="44" rx="22" fill="#10b981" />
            <text x="390" y="66" fill="white" fontSize="15" fontWeight="900" textAnchor="middle">
              {formatCurrency(corridor.potential_saving || 0)} saving
            </text>
          </g>
        </svg>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
          <div>
            <Route className="mx-auto mb-4 h-10 w-10 text-emerald-300" />
            <p className="text-sm font-bold text-white">Select a corridor to inspect the optimized route impact.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CostOptimizationPage() {
  const [whatIf, setWhatIf] = useState<CostWhatIf | null>(null)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [segment, setSegment] = useState<keyof typeof segmentLabels>("hub")
  const [activeCorridor, setActiveCorridor] = useState(0)
  const { data: costData, isLoading: costLoading } = useGetCostOptimization()

  useEffect(() => {
    let mounted = true
    apiClient
      .get("/challenge/cost-what-if")
      .then((res) => {
        if (mounted) setWhatIf(res.data)
      })
      .catch(() => {
        if (mounted) setError("Cost optimization backend is not reachable. Start the backend and reload this page.")
      })
    return () => {
      mounted = false
    }
  }, [])

  const corridors = whatIf?.corridors || []
  const selectedCorridor = corridors[activeCorridor]
  const transactions = whatIf?.suboptimal_transactions || []
  const filteredTransactions = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return transactions
    return transactions.filter((tx) =>
      [tx.transaction_id, tx.corridor, tx.part_category, tx.partner, tx.flow_type]
        .some((value) => String(value || "").toLowerCase().includes(term))
    )
  }, [search, transactions])

  const segmentRows = useMemo(() => {
    if (!whatIf) return []
    if (segment === "hub") return whatIf.savings_by_hub
    if (segment === "part") return whatIf.savings_by_part_category
    if (segment === "partner") return whatIf.savings_by_partner
    return whatIf.savings_by_flow_type
  }, [segment, whatIf])

  const maxSegmentSaving = Math.max(...segmentRows.map((item) => item.potential_saving), 1)
  const totalSavings = whatIf?.total_potential_saving || 0
  const currentCost = whatIf?.current_cost || 0
  const optimizedCost = whatIf?.optimized_cost || 0
  const investment = whatIf?.inventory_investment_needed || 0
  const roi = investment > 0 ? ((totalSavings - investment) / investment) * 100 : 0
  const costMetric = costData?.metrics?.[0]

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-6 pb-24 text-slate-900">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                Workbook-backed cost engine
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">Cost Optimization Center</h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Finds suboptimal transactions, ranks expensive corridors, calculates excess spend, and exports the actual optimization evidence for review.
              </p>
            </div>
            <button
              onClick={() => downloadCsv("sanchar-ai-cost-optimization-transactions.csv", filteredTransactions)}
              disabled={!filteredTransactions.length}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export Evidence CSV
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {error}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Top-3 Current Cost", value: formatCurrency(currentCost), icon: Gauge, hint: whatIf?.scenario || "Loading backend scenario" },
            { label: "Optimized Cost", value: formatCurrency(optimizedCost), icon: TrendingDown, hint: "After approved smarter routing" },
            { label: "Potential Saving", value: formatCurrency(totalSavings), icon: ArrowDownRight, hint: `${transactions.length} suboptimal transaction records` },
            { label: "Inventory Investment", value: formatCurrency(investment), icon: Layers3, hint: `ROI ${roi.toFixed(1)}% from challenge model` },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <kpi.icon className="h-5 w-5" />
                </div>
                {(costLoading || !whatIf) && <Loader2 className="h-4 w-4 animate-spin text-slate-300" />}
              </div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">{kpi.label}</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{kpi.value}</p>
              <p className="mt-2 min-h-10 text-xs font-semibold leading-5 text-slate-500">{kpi.hint}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">Top Corridor What-If</h2>
                <p className="text-sm font-medium text-slate-500">Real top expensive corridors from transaction history.</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{corridors.length} corridors</span>
            </div>
            <div className="space-y-3">
              {corridors.map((item, index) => (
                <button
                  key={`${item.source}-${item.target}`}
                  onClick={() => setActiveCorridor(index)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    activeCorridor === index ? "border-emerald-500 bg-emerald-50/70" : "border-slate-200 bg-white hover:border-emerald-200"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-black text-slate-950">{item.source} -&gt; {item.target}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{item.why_expensive}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black uppercase text-emerald-700">Saving</p>
                      <p className="text-lg font-black text-emerald-700">{formatCurrency(item.potential_saving || 0)}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                    <MiniMetric label="Shipments" value={item.shipments} />
                    <MiniMetric label="Units" value={item.units} />
                    <MiniMetric label="Cost/km/unit" value={(item.cost_per_unit_km || 0).toFixed(3)} />
                    <MiniMetric label="Delay" value={`${(item.delay_days || 0).toFixed(1)}d`} />
                    <MiniMetric label="SLA Breach" value={`${(item.sla_breach_rate || 0).toFixed(1)}%`} danger />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <CorridorMap corridor={selectedCorridor} />
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-black text-slate-950">Network Cost Health</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {costMetric
                  ? `${formatCurrency(costMetric.savings_value)} savings identified across the broader transport network.`
                  : "Waiting for optimization engine summary."}
              </p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(100, Math.max(0, costMetric?.improvement_pct || 0) * 8)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">Savings Breakdown</h2>
                <p className="text-sm font-medium text-slate-500">Aggregated from suboptimal transactions.</p>
              </div>
              <BarChart3 className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="mb-5 grid grid-cols-2 gap-2">
              {Object.entries(segmentLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSegment(key as keyof typeof segmentLabels)}
                  className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                    segment === key ? "border-emerald-500 bg-emerald-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {segmentRows.map((item) => (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">{item.name}</span>
                    <span className="text-emerald-700">{formatCurrency(item.potential_saving)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(item.potential_saving / maxSegmentSaving) * 100}%` }} />
                  </div>
                </div>
              ))}
              {!segmentRows.length && <p className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">No segment data returned yet.</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">Suboptimal Transaction Evidence</h2>
                <p className="text-sm font-medium text-slate-500">Rows where the current route has measurable excess cost.</p>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search transaction, corridor, partner..."
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 md:w-[320px]"
                />
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="max-h-[440px] overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="p-3">Transaction</th>
                      <th className="p-3">Corridor</th>
                      <th className="p-3">Current</th>
                      <th className="p-3">Optimized</th>
                      <th className="p-3 text-emerald-700">Excess</th>
                      <th className="p-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.transaction_id} className="hover:bg-emerald-50/40">
                        <td className="p-3 font-black text-slate-900">{tx.transaction_id}</td>
                        <td className="p-3 font-semibold text-slate-600">{cleanRouteText(tx.corridor)}</td>
                        <td className="p-3 font-semibold text-slate-500">{formatCurrency(tx.current_cost || 0)}</td>
                        <td className="p-3 font-bold text-slate-900">{formatCurrency(tx.optimized_cost || 0)}</td>
                        <td className="p-3 font-black text-emerald-700">{formatCurrency(tx.excess_cost || 0)}</td>
                        <td className="p-3 text-xs font-semibold text-slate-500">{tx.part_category} / {tx.partner} / {tx.flow_type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!filteredTransactions.length && (
                <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                  <FileSpreadsheet className="h-8 w-8 text-slate-300" />
                  <p className="text-sm font-bold text-slate-500">No transaction evidence matches this search.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {!whatIf && !error && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-emerald-600" />
            <p className="font-bold text-slate-600">Loading real cost optimization data from the backend...</p>
          </div>
        )}

        {costData?.opportunities?.length ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-black text-slate-950">Additional Cost Engine Signals</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {costData.opportunities.slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{item.type}</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-800">{cleanRouteText(item.description)}</p>
                  <p className="mt-3 text-lg font-black text-emerald-700">{formatCurrency(item.cost_saving)}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}

function MiniMetric({ label, value, danger = false }: { label: string; value: React.ReactNode; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-white bg-white/80 px-3 py-2 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-black ${danger ? "text-rose-600" : "text-slate-950"}`}>{value}</p>
    </div>
  )
}
