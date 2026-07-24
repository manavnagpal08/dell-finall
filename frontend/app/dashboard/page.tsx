"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import {
  Activity,
  ArrowRight,
  Bell,
  Clock,
  DollarSign,
  MessageSquare,
  Package,
  RefreshCw,
  ShieldCheck,
  Target,
} from "lucide-react"
import { useGetHubs, useGetNetworkOverview, useGetOptimizationDashboard, useGetStats, useGetTPRs, useGetTransactions } from "@/services/queries"
import { formatCompactCurrency, formatCurrency } from "@/lib/utils"

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

const clampPercentage = (value: number) => Math.max(0, Math.min(100, value))
const formatPercentage = (value: number) => `${clampPercentage(value).toFixed(1)}%`
const formatDays = (value: number) => `${value.toFixed(1)}d`

const getReadinessLabel = (percentage: number) => {
  if (percentage >= 80) return "Healthy"
  if (percentage >= 60) return "Watch"
  return "At Risk"
}

function AIReadinessGauge({ percentage }: { percentage: number }) {
  const safePercentage = clampPercentage(percentage)

  return (
    <div className="flex w-full flex-col items-center bg-white">
      <div className="mb-6 flex w-full items-center justify-between">
        <span className="text-[14px] font-bold text-[#0F172A]">AI Network Readiness</span>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          LIVE
        </span>
      </div>

      <div className="relative flex w-full max-w-[260px] flex-col items-center">
        <svg className="h-auto w-full overflow-visible" viewBox="-110 -115 220 125" aria-hidden="true">
          <g transform="rotate(180)">
            <path d="M 90 0 A 90 90 0 0 1 63.64 63.64" fill="none" stroke="#dc2626" strokeWidth="14" />
            <path d="M 63.64 63.64 A 90 90 0 0 1 0 90" fill="none" stroke="#f59e0b" strokeWidth="14" />
            <path d="M 0 90 A 90 90 0 0 1 -90 0" fill="none" stroke="#10b981" strokeWidth="14" />

            {[...Array(15)].map((_, i) => (
              <line
                key={`gap-${i}`}
                x1="82"
                y1="0"
                x2="98"
                y2="0"
                stroke="white"
                strokeWidth="3.5"
                transform={`rotate(${(i + 1) * (180 / 16)})`}
              />
            ))}

            <path d="M 72 0 A 72 72 0 0 1 -72 0" fill="none" stroke="#e2e8f0" strokeWidth="1.5" />

            {[...Array(17)].map((_, i) => (
              <line
                key={`tick-${i}`}
                x1="72"
                y1="0"
                x2="66"
                y2="0"
                stroke="#cbd5e1"
                strokeWidth="1.5"
                transform={`rotate(${i * (180 / 16)})`}
              />
            ))}

            <g transform={`rotate(${safePercentage * 1.8})`} className="transition-transform duration-1000 ease-out">
              <polygon points="69,-4 86,0 69,4" fill="#065f46" />
            </g>
          </g>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-end pb-3">
          <span className="text-[44px] font-black leading-none tracking-tight text-[#0F172A]">{safePercentage.toFixed(0)}%</span>
          <span className="mt-1 text-[13px] font-bold text-slate-500">{getReadinessLabel(safePercentage)}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-col items-center pb-2">
        <div className="flex items-center gap-1 text-[14px] font-bold text-[#10b981]">
          <ArrowRight className="h-4 w-4 -rotate-90" strokeWidth={3} />
          {formatPercentage(safePercentage)}
        </div>
        <span className="mt-0.5 text-[12px] font-medium text-slate-400">Network health score</span>
      </div>
    </div>
  )
}

export default function MissionControlPage() {
  const { data: stats, refetch: refetchStats, isLoading: statsLoading, isError: statsError } = useGetStats()
  const { data: healthData, refetch: refetchHealth, isLoading: networkLoading, isError: networkError } = useGetNetworkOverview({})
  const { data: txData, refetch: refetchTx, isLoading: txLoading, isError: txError } = useGetTransactions({
    page: 1,
    limit: 20,
    sort_by: "dispatch_date",
    sort_order: "desc",
  })
  const { data: hubsData, isLoading: hubsLoading, isError: hubsError } = useGetHubs({ page: 1, limit: 100 })
  const { data: tprsData, isLoading: tprsLoading, isError: tprsError } = useGetTPRs({ page: 1, limit: 100 })
  const { data: optimizationData, isLoading: optimizationLoading, isError: optimizationError } = useGetOptimizationDashboard({})

  const [activeSummaryIndex, setActiveSummaryIndex] = useState(0)

  useEffect(() => {
    const bannerInterval = setInterval(() => {
      setActiveSummaryIndex((prev) => (prev + 1) % 5)
    }, 5000)

    return () => clearInterval(bannerInterval)
  }, [])

  const handleRefresh = () => {
    refetchStats()
    refetchHealth()
    refetchTx()
  }

  const isDashboardLoading = statsLoading || networkLoading || txLoading || hubsLoading || tprsLoading || optimizationLoading
  const backendError = statsError || networkError || txError || hubsError || tprsError || optimizationError

  const healthScore = Number(healthData?.kpis?.network_health_score || 0)
  const totalShipments = Number(stats?.total_transactions || 0)
  const logisticsCost = Number(stats?.total_cost || 0)
  const averageShipmentCost = Number(stats?.average_cost || 0)
  const slaBreachPct = Number(stats?.sla_breach_percentage || 0)
  const tamperAlertPct = Number(stats?.tamper_alert_percentage || 0)
  const onTimeDelivery = clampPercentage(100 - slaBreachPct)
  const activeCorridors = Number(healthData?.kpis?.active_corridors || 0)
  const avgTransitTime = Number(healthData?.kpis?.average_transit_time || stats?.average_transit_time || 0)
  const averageLaneCost = Number(healthData?.kpis?.average_lane_cost_usd || 0)
  const highestRiskCorridor = healthData?.kpis?.highest_risk_corridor || "No risky corridor detected"
  const projectedSavings = optimizationData
    ? [...(optimizationData.recommendations || []), ...(optimizationData.opportunities || [])].reduce(
        (sum, item: any) => sum + Number(item.expected_savings ?? item.cost_saving ?? 0),
        0
      )
    : 0
  const savingsPct = logisticsCost ? (projectedSavings / logisticsCost) * 100 : 0

  const hubs = hubsData?.items || []
  const overloadedHubs = hubs.filter((hub) => Number(hub.utilisation_pct || 0) >= 0.85).length
  const avgUtilization = hubs.length ? (hubs.reduce((sum, hub) => sum + Number(hub.utilisation_pct || 0), 0) / hubs.length) * 100 : 0
  const underutilizedHub = [...hubs].sort((a, b) => Number(a.utilisation_pct || 0) - Number(b.utilisation_pct || 0))[0]

  const tprs = tprsData?.items || []
  const overloadedTprs = tprs.filter((tpr) => {
    const capacity = Number(tpr.repair_capacity_per_day || 0)
    return capacity > 0 && Number(tpr.current_workload || 0) / capacity >= 1.25
  }).length
  const totalRepairCapacity = tprs.reduce((sum, tpr) => sum + Number(tpr.repair_capacity_per_day || 0), 0)
  const totalRepairWorkload = tprs.reduce((sum, tpr) => sum + Number(tpr.current_workload || 0), 0)
  const tprCapacityPct = totalRepairCapacity ? (totalRepairWorkload / totalRepairCapacity) * 100 : 0

  const transactionItems = txData?.items || []
  const priorityRank = (priority: string) => {
    if (priority.startsWith("P1")) return 0
    if (priority.startsWith("P2")) return 1
    if (priority.startsWith("P3")) return 2
    return 3
  }
  const priorityRows = [...transactionItems]
    .sort((a, b) => {
      const rankDiff = priorityRank(String(a.priority || "")) - priorityRank(String(b.priority || ""))
      if (rankDiff !== 0) return rankDiff
      return Number(b.sla_breach) - Number(a.sla_breach)
    })
    .slice(0, 6)

  const summaries = [
    `Analyzed ${totalShipments.toLocaleString()} shipments across ${stats?.total_hubs || 0} hubs and ${stats?.total_tprs || 0} repair centers. Current SLA breach risk is ${formatPercentage(slaBreachPct)} and network health is ${formatPercentage(healthScore)}.`,
    `Cost intelligence: total shipment cost is ${formatCompactCurrency(logisticsCost)} with an average shipment cost of ${formatCurrency(averageShipmentCost)}.`,
    `Network insight: ${activeCorridors.toLocaleString()} active corridors are visible. Highest risk corridor is ${highestRiskCorridor}.`,
    `Capacity signal: ${overloadedHubs} hubs and ${overloadedTprs} repair centers are overloaded based on current utilization and workload.`,
    `Data quality signal: tamper alerts account for ${formatPercentage(tamperAlertPct)} of logistics transactions.`,
  ]

  const metrics = [
    { label: "Total Shipments", value: totalShipments.toLocaleString(), sub: "Loaded from transactions", icon: Package, color: "emerald" },
    { label: "Total Cost", value: formatCompactCurrency(logisticsCost), sub: `${formatCurrency(averageShipmentCost)} avg/shipment`, icon: DollarSign, color: "rose" },
    { label: "SLA Breach Rate", value: formatPercentage(slaBreachPct), sub: "Calculated from SLA breaches", icon: ShieldCheck, color: slaBreachPct > 30 ? "rose" : "emerald" },
    { label: "Active Corridors", value: activeCorridors.toLocaleString(), sub: "From network topology", icon: Activity, color: "emerald" },
    { label: "On-Time Delivery", value: formatPercentage(onTimeDelivery), sub: "Derived from SLA rate", icon: Clock, color: "emerald" },
    { label: "Optimization Proof", value: formatPercentage(savingsPct), sub: `${formatCompactCurrency(projectedSavings)} identified`, icon: Target, color: savingsPct >= 15 ? "emerald" : "rose" },
  ]

  const quickActions = [
    { label: "AI Recommendations", desc: "View route optimizations", href: "/ai-recommendation-center", icon: MessageSquare, color: "text-emerald-600 bg-white" },
    { label: "Cost Analysis", desc: "View logistics breakdown", href: "/cost-optimization", icon: DollarSign, color: "text-emerald-600 bg-white" },
    { label: "Risk Center", desc: "Predict SLA performance", href: "/predictions", icon: ShieldCheck, color: "text-amber-500 bg-white" },
    { label: "Reverse Logistics", desc: "Manage returns flow", href: "/cost-optimization", icon: RefreshCw, color: "text-slate-600 bg-white" },
  ]

  return (
    <div className="min-h-screen bg-slate-50/30 pb-24 font-sans text-[#0F172A]">
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-8 flex flex-col items-start justify-between md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#0F172A]">Hello, Rahul! 👋</h1>
            <p className="mt-1 text-[13px] font-medium text-slate-500">Here's the real-time AI intelligence across your logistics network.</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm border border-emerald-200">
              R
            </div>
            <span className="text-[14px] font-bold text-slate-700">Administrator</span>
          </div>
        </motion.div>

        {backendError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
            Dashboard APIs are not responding fully. Values that loaded successfully are shown; missing sections stay empty instead of using mock data.
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
              {metrics.map((metric) => (
                <div key={metric.label} className="relative flex min-h-[120px] flex-col justify-center rounded-[12px] border border-slate-200 bg-white p-5 shadow-sm transition-all">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="text-emerald-600">
                      <metric.icon className="h-4 w-4" strokeWidth={2.5} />
                    </div>
                    <span className="text-[12px] font-bold text-[#0F172A]">{metric.label}</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-black text-[#0F172A]">{metric.value}</span>
                  </div>
                  <div className="mt-1">
                    <span className={`text-[10px] font-bold ${metric.color === "emerald" ? "text-emerald-500" : "text-rose-500"}`}>{metric.sub}</span>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="relative flex flex-col overflow-hidden rounded-[16px] border border-[#115e4f] bg-[#0b4d3c] shadow-sm">
              <div className="flex items-center gap-2 border-b border-white/10 px-6 py-4">
                <Target className="h-5 w-5 text-emerald-400" />
                <span className="text-[15px] font-bold tracking-wide text-white">AI Executive Insights</span>
              </div>

              <div className="flex w-full flex-col items-stretch justify-between gap-8 p-6 md:flex-row">
                <div className="grid flex-1 grid-cols-1 gap-6 pt-2 md:grid-cols-3">
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium text-emerald-100/70">Average Lane Cost</p>
                    <p className="text-[26px] font-bold text-white">{formatCurrency(averageLaneCost)}</p>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium text-emerald-100/70">Highest Risk Corridor</p>
                    <p className="text-[16px] font-bold leading-tight text-[#ff6b6b]">{highestRiskCorridor}</p>
                    <p className="mt-1.5 text-[11px] text-emerald-100/60">Calculated from corridor breach rates</p>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium text-emerald-100/70">Underutilized Hub</p>
                    <p className="text-[16px] font-bold text-white">{underutilizedHub?.hub_name || "No hub data"}</p>
                    <p className="mt-1.5 text-[11px] text-emerald-100/60">Utilization: {formatPercentage(Number(underutilizedHub?.utilisation_pct || 0) * 100)}</p>
                  </div>
                </div>

                <div className="relative flex w-full flex-col justify-start rounded-[12px] border border-[#00B67A]/60 bg-transparent p-5 shadow-[0_0_15px_rgba(0,182,122,0.15)] md:w-[420px]">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-[12px] font-bold text-emerald-100">
                      <Target className="h-3.5 w-3.5" /> AI Executive Summary
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-100/70">
                      <RefreshCw className="h-3 w-3" /> Live data
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSummaryIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[13px] font-normal leading-relaxed text-emerald-50/90"
                    >
                      {summaries[activeSummaryIndex]}
                    </motion.div>
                  </AnimatePresence>

                  <div className="mt-auto flex items-center justify-end gap-1.5 pt-4">
                    {summaries.map((_, idx) => (
                      <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${activeSummaryIndex === idx ? "w-1.5 bg-[#00B67A]" : "w-1.5 bg-white/20"}`} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href} className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-500/30">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg border border-slate-100 p-2 shadow-sm ${action.color}`}>
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-[#0F172A]">{action.label}</p>
                      <p className="mt-0.5 text-[10px] font-medium text-slate-500">{action.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-emerald-500" />
                </Link>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-[15px] font-black text-[#0F172A]">Priority Work Queue</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{priorityRows.length} Pending Tasks</span>
                </div>
                <Link href="/operations" className="flex items-center gap-1 text-[12px] font-bold text-[#00B67A] transition-colors hover:text-[#047857]">
                  View All
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="px-2 py-3">Priority</th>
                      <th className="px-2 py-3">Transaction</th>
                      <th className="px-2 py-3">Flow</th>
                      <th className="px-2 py-3">Route</th>
                      <th className="px-2 py-3">Cost</th>
                      <th className="px-2 py-3">Transit</th>
                      <th className="px-2 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {priorityRows.map((row) => (
                      <tr key={row.transaction_id} className="group transition-colors hover:bg-slate-50/50">
                        <td className="px-2 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              String(row.priority).startsWith("P1")
                                ? "bg-rose-50 text-rose-600"
                                : String(row.priority).startsWith("P2")
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            {row.priority}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-[12px] font-bold text-[#0F172A]">{row.transaction_id}</td>
                        <td className="px-2 py-3 text-[12px] font-medium text-slate-500">{row.flow_type}</td>
                        <td className="flex items-center gap-1 px-2 py-3 text-[12px] font-bold text-[#0F172A]">
                          {row.origin_hub_id} <ArrowRight className="h-3 w-3 text-slate-400" /> {row.destination_location}
                        </td>
                        <td className="px-2 py-3 text-[12px] font-medium text-slate-600">{formatCurrency(row.logistics_cost_total_usd || 0)}</td>
                        <td className="px-2 py-3 text-[12px] font-medium text-slate-600">{formatDays(Number(row.transit_days_actual || 0))}</td>
                        <td className="px-2 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${row.sla_breach ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                            {row.sla_breach ? "Breached" : "On Track"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!txLoading && priorityRows.length === 0 && (
                  <div className="border-t border-slate-100 py-8 text-center text-[13px] font-medium text-slate-500">
                    No transactions are available for the priority queue.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
            <motion.div variants={fadeUp} className="overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <AIReadinessGauge percentage={healthScore} />
            </motion.div>

            <motion.div variants={fadeUp} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-[13px] font-bold text-[#0F172A]">Operational Snapshot</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col justify-center rounded-xl border border-slate-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <p className="mb-1 text-[10px] font-bold text-slate-400">Hub Utilization</p>
                  <p className="mb-1 text-[18px] font-black text-[#0F172A]">{formatPercentage(avgUtilization)}</p>
                  <p className="text-[10px] font-bold text-amber-500">{overloadedHubs} overloaded</p>
                </div>
                <div className="flex flex-col justify-center rounded-xl border border-slate-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <p className="mb-1 text-[10px] font-bold text-slate-400">Repair Workload</p>
                  <p className="mb-1 text-[18px] font-black text-[#0F172A]">
                    {totalRepairWorkload.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">units</span>
                  </p>
                </div>
                <div className="flex flex-col justify-center rounded-xl border border-slate-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <p className="mb-1 text-[10px] font-bold text-slate-400">TPR Capacity</p>
                  <p className="mb-1 text-[18px] font-black text-[#0F172A]">{formatPercentage(tprCapacityPct)}</p>
                  <p className="text-[10px] font-bold text-[#00B67A]">{totalRepairCapacity.toLocaleString()} daily cap</p>
                </div>
                <div className="flex flex-col justify-center rounded-xl border border-slate-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <p className="mb-1 text-[10px] font-bold text-slate-400">Transit Time</p>
                  <p className="mb-1 text-[18px] font-black text-[#0F172A]">{formatDays(avgTransitTime)}</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-[13px] font-bold text-[#0F172A]">SLA Risk Alerts</h2>
                <Link href="/predictions" className="text-[10px] font-medium text-slate-400 hover:text-slate-600">View SLA Center</Link>
              </div>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-rose-500" />
                    <div>
                      <p className="text-[12px] font-bold text-[#0F172A]">{highestRiskCorridor}</p>
                      <p className="mt-0.5 text-[10px] font-medium text-slate-500">{formatPercentage(slaBreachPct)} live SLA breach rate</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-amber-500" />
                    <div>
                      <p className="text-[12px] font-bold text-[#0F172A]">Overloaded Hubs</p>
                      <p className="mt-0.5 text-[10px] font-medium text-slate-500">Calculated from hub utilization</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-amber-500">{overloadedHubs} Hubs</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-[#00B67A]" />
                    <div>
                      <p className="text-[12px] font-bold text-[#0F172A]">Tamper Alert Rate</p>
                      <p className="mt-0.5 text-[10px] font-medium text-slate-500">Calculated from Logistics Transactions</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#00B67A]">{formatPercentage(tamperAlertPct)}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 hidden md:flex items-center justify-between border-t border-slate-200 bg-white p-3 px-8">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-[#0F172A]">Executive Summary</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <div className="flex items-center gap-12">
            <div>
              <p className="mb-0.5 text-[10px] font-bold text-slate-400">SLA Breach Risk</p>
              <p className="text-[13px] font-black text-rose-500">{formatPercentage(slaBreachPct)}</p>
            </div>
            <div>
              <p className="mb-0.5 text-[10px] font-bold text-slate-400">Avg Transit Time</p>
              <p className="text-[13px] font-black text-[#0F172A]">{formatDays(avgTransitTime)}</p>
            </div>
            <div>
              <p className="mb-0.5 text-[10px] font-bold text-slate-400">Total Hubs / TPRs</p>
              <p className="text-[13px] font-black text-[#0F172A]">{stats?.total_hubs || 0} / {stats?.total_tprs || 0}</p>
            </div>
            <div>
              <p className="mb-0.5 text-[10px] font-bold text-slate-400">On-Time Delivery</p>
              <p className="text-[13px] font-black text-[#0F172A]">{formatPercentage(onTimeDelivery)}</p>
            </div>
            <div>
              <p className="mb-0.5 text-[10px] font-bold text-slate-400">Avg Cost / Shipment</p>
              <p className="text-[13px] font-black text-rose-500">{formatCurrency(averageShipmentCost)}</p>
            </div>
            <div>
              <p className="mb-0.5 text-[10px] font-bold text-slate-400">Tamper Alert Rate</p>
              <p className="text-[13px] font-black text-[#00B67A]">{formatPercentage(tamperAlertPct)}</p>
            </div>
          </div>
        </div>

        <Link href="/recommendations" className="flex items-center gap-2 rounded-lg bg-[#115e59] px-5 py-2.5 text-[12px] font-medium text-white transition-colors hover:bg-[#0f514e]">
          Next Best Action <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
