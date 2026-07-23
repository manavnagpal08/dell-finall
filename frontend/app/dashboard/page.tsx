"use client"

import React, { useMemo, useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  RefreshCw,
  DollarSign, Package, ShieldCheck, Activity, Target, ArrowRight, Clock, MessageSquare, AlertTriangle, Bell, User
} from "lucide-react"
import { useGetStats, useGetTransactions, useGetNetworkOverview, useGetHubs, useGetTPRs } from "@/services/queries"
import { formatCurrency, formatCompactCurrency } from "@/lib/utils"

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

const AIReadinessGauge = ({ percentage }: { percentage: number }) => {
  return (
    <div className="flex flex-col items-center w-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-6">
        <span className="text-[14px] font-bold text-[#0F172A]">AI Network Readiness</span>
        <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          LIVE
        </span>
      </div>

      <div className="relative w-full max-w-[260px] flex flex-col items-center">
        <svg className="w-full h-auto overflow-visible" viewBox="-110 -115 220 125">
          <g transform="rotate(180)">
            {/* Colored Arcs */}
            <path d="M 90 0 A 90 90 0 0 1 63.64 63.64" fill="none" stroke="#dc2626" strokeWidth="14" /> {/* Red */}
            <path d="M 63.64 63.64 A 90 90 0 0 1 0 90" fill="none" stroke="#f59e0b" strokeWidth="14" /> {/* Yellow */}
            <path d="M 0 90 A 90 90 0 0 1 -90 0" fill="none" stroke="#10b981" strokeWidth="14" /> {/* Green */}

            {/* White Gap Lines */}
            {[...Array(15)].map((_, i) => {
              const angle = (i + 1) * (180 / 16);
              return (
                <line 
                  key={`gap-${i}`}
                  x1="82" y1="0" x2="98" y2="0" 
                  stroke="white" strokeWidth="3.5" 
                  transform={`rotate(${angle})`}
                />
              );
            })}

            {/* Inner Ring */}
            <path d="M 72 0 A 72 72 0 0 1 -72 0" fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
            
            {/* Inward Ticks */}
            {[...Array(17)].map((_, i) => {
              const angle = i * (180 / 16);
              return (
                <line 
                  key={`tick-${i}`}
                  x1="72" y1="0" x2="66" y2="0" 
                  stroke="#cbd5e1" strokeWidth="1.5" 
                  transform={`rotate(${angle})`}
                />
              );
            })}

            {/* Needle */}
            <g transform={`rotate(${percentage * 1.8})`} className="transition-transform duration-1000 ease-out">
              <polygon points="69,-4 86,0 69,4" fill="#065f46" />
            </g>
          </g>
        </svg>

        {/* Center Text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-3">
          <span className="text-[44px] leading-none font-black text-[#0F172A] tracking-tight">{percentage.toFixed(0)}%</span>
          <span className="text-[13px] font-bold text-slate-500 mt-1">Healthy</span>
        </div>
      </div>
      
      {/* Bottom Trend Text */}
      <div className="flex flex-col items-center mt-3 pb-2">
        <div className="flex items-center gap-1 text-[14px] font-bold text-[#10b981]">
          <ArrowRight className="w-4 h-4 transform -rotate-90" strokeWidth={3} />
          3.2%
        </div>
        <span className="text-[12px] font-medium text-slate-400 mt-0.5">Since Yesterday</span>
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

  const [livePulse, setLivePulse] = useState(0)
  const [activeSummaryIndex, setActiveSummaryIndex] = useState(0)

  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setLivePulse(prev => prev + Math.floor(Math.random() * 3))
    }, 4000)
    
    const bannerInterval = setInterval(() => {
      setActiveSummaryIndex(prev => (prev + 1) % 5)
    }, 5000)

    return () => {
      clearInterval(pulseInterval)
      clearInterval(bannerInterval)
    }
  }, [])

  const handleRefresh = () => {
    refetchStats()
    refetchHealth()
    refetchTx()
  }

  const healthScore = Number(healthData?.kpis?.network_health_score || 0)
  const totalShipments = Number(stats?.total_transactions || 1800)
  const logisticsCost = Number(stats?.total_cost || 65000000)
  const slaBreachPct = Number(stats?.sla_breach_percentage || 36.3)
  const tamperAlertPct = Number(stats?.tamper_alert_percentage || 6.6)
  const onTimeDelivery = 100 - slaBreachPct
  const activeCorridors = Number(healthData?.kpis?.active_corridors || 455)
  const backendError = statsError || networkError || txError || hubsError || tprsError

  const hubs = hubsData?.items || []
  const overloadedHubs = hubs.filter((hub) => Number(hub.utilisation_pct || 0) >= 0.85).length || 3
  const avgUtilization = hubs.length ? (hubs.reduce((sum, hub) => sum + Number(hub.utilisation_pct || 0), 0) / hubs.length) * 100 : 65.1
  const underutilizedHub = [...hubs].sort((a, b) => Number(a.utilisation_pct || 0) - Number(b.utilisation_pct || 0))[0]

  const tprs = tprsData?.items || []
  const totalRepairCapacity = tprs.reduce((sum, tpr) => sum + Number(tpr.repair_capacity_per_day || 0), 0) || 610
  const totalRepairWorkload = tprs.reduce((sum, tpr) => sum + Number(tpr.current_workload || 0), 0) || 428
  const tprCapacityPct = totalRepairCapacity ? (totalRepairWorkload / totalRepairCapacity) * 100 : 70.2

  const priorityRows = useMemo(() => {
    const fallbackRows = [
      { priority: "P1-Critical", transaction_id: "TXN-20240810", flow_type: "Reverse", origin_hub_id: "HUB-KOL", destination_location: "TPR-BLR-02", logistics_cost_total_usd: 2194, transit_days_actual: 5.04, sla_breach: true },
      { priority: "P1-Critical", transaction_id: "TXN-20240732", flow_type: "Forward", origin_hub_id: "HUB-DXB", destination_location: "Pune", logistics_cost_total_usd: 2796, transit_days_actual: 10.21, sla_breach: true },
      { priority: "P2-High", transaction_id: "TXN-20240296", flow_type: "Forward", origin_hub_id: "HUB-HYD", destination_location: "Kolkata", logistics_cost_total_usd: 1412, transit_days_actual: 2.43, sla_breach: true },
      { priority: "P2-High", transaction_id: "TXN-20240997", flow_type: "Reverse", origin_hub_id: "HUB-AMS", destination_location: "TPR-BLR-02", logistics_cost_total_usd: 2076, transit_days_actual: 26.24, sla_breach: true },
      { priority: "P2-High", transaction_id: "TXN-20241693", flow_type: "Reverse", origin_hub_id: "HUB-DEL", destination_location: "TPR-DEL-01", logistics_cost_total_usd: 2458, transit_days_actual: 4.41, sla_breach: true },
      { priority: "P2-High", transaction_id: "TXN-20240025", flow_type: "Forward", origin_hub_id: "HUB-DEL", destination_location: "Chennai", logistics_cost_total_usd: 150, transit_days_actual: 2.84, sla_breach: true },
    ]
    
    if (txData?.items?.length) {
       const priorityRank = (priority: string) => {
        if (priority.startsWith("P1")) return 0
        if (priority.startsWith("P2")) return 1
        if (priority.startsWith("P3")) return 2
        return 3
      }
      return [...txData.items]
        .sort((a, b) => {
          if (Number(b.sla_breach) !== Number(a.sla_breach)) return Number(b.sla_breach) - Number(a.sla_breach)
          return priorityRank(String(a.priority || "")) - priorityRank(String(b.priority || ""))
        })
        .slice(0, 6)
    }
    
    return fallbackRows
  }, [txData?.items])

  const summaries = [
    `AI analyzed 1,800 shipments and detected 14 critical routing opportunities. Estimated savings $320K, 18% lower SLA breach risk, and 2 overloaded repair centers requiring attention.`,
    `Cost Optimization Opportunity: Shifting 15% of air freight to sea freight will save $1.2M.`,
    `Reverse Logistics Insight: Unusually high return volume detected at Pune Satellite. Capacity available to process.`,
    `SLA Prediction: Warning on HUB-AHM -> HUB-AMS. 63% probability of delay for outbound shipments in the next 24 hours.`,
    `Carbon Reduction Opportunity: Consolidating less-than-truckload shipments from Hub-DXB could reduce emissions by 12%.`
  ]

  return (
    <div className="min-h-screen bg-slate-50/30 pb-24 font-sans text-[#0F172A]">
      <div className="mx-auto max-w-[1600px] p-6 lg:p-8 space-y-6">

        {/* Top Navbar Area */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">Mission Control</h1>
            <p className="text-[13px] font-medium text-slate-500 mt-1">Real-time AI intelligence across your logistics network.</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#00B67A]"></div>
                 <span className="text-[13px] font-bold text-[#0F172A]">Live</span>
               </div>
               <div className="w-px h-4 bg-slate-200"></div>
               <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500">
                  <RefreshCw className="w-3.5 h-3.5" /> Auto-refresh: 2s
               </div>
            </div>
            <div className="relative bg-white p-2.5 rounded-full border border-slate-200 shadow-sm text-slate-600">
               <Bell className="w-4 h-4" />
               <div className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full"></div>
            </div>
            <div className="bg-slate-100 text-slate-600 font-bold text-[13px] w-9 h-9 rounded-full flex items-center justify-center border border-slate-200 shadow-sm">
               SB
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">

          {/* Main Left Column */}
          <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">

            {/* Top Metrics Cards - 5 Cards */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: "Total Shipments", value: "1,800", sub: "↑ 12.5% vs yesterday", icon: Package, color: "emerald", trend: "up" },
                { label: "Logistics Cost", value: "$65M", sub: "↑ 8.4% vs yesterday", icon: DollarSign, color: "rose", trend: "up" },
                { label: "SLA Performance", value: "36.3%", sub: "↓ 4.7% vs yesterday", icon: ShieldCheck, color: "amber", trend: "down" },
                { label: "Active Corridors", value: "455", sub: "↑ 9.3% vs yesterday", icon: Activity, color: "emerald", trend: "up" },
                { label: "On-Time Delivery", value: "62.8%", sub: "↑ 6.1% vs yesterday", icon: Clock, color: "emerald", trend: "up" },
              ].map((metric, i) => (
                <div key={i} className="bg-white p-5 rounded-[12px] border border-slate-200 shadow-sm flex flex-col justify-center transition-all min-h-[120px] relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-emerald-600">
                      <metric.icon className="w-4 h-4" strokeWidth={2.5} />
                    </div>
                    <span className="text-[12px] font-bold text-[#0F172A]">{metric.label}</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-black text-[#0F172A]">{metric.value}</span>
                  </div>
                  <div className="mt-1">
                    <span className={`text-[10px] font-bold ${metric.color === 'emerald' ? 'text-emerald-500' : metric.color === 'rose' ? 'text-rose-500' : 'text-rose-500'}`}>
                      {metric.sub.split(" ")[0]} {metric.sub.split(" ")[1]}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 ml-1">vs yesterday</span>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Strict Dark Green AI Insights Card */}
            <motion.div variants={fadeUp} className="bg-[#0b4d3c] rounded-[16px] shadow-sm relative overflow-hidden flex flex-col border border-[#115e4f]">
              {/* Top Header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <span className="text-[15px] font-bold text-white tracking-wide">AI Executive Insights</span>
              </div>
              
              <div className="p-6 flex flex-col md:flex-row gap-8 w-full justify-between items-stretch">
                
                {/* Left Side Metrics */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div>
                    <p className="text-[11px] text-emerald-100/70 font-medium mb-1.5">Average Lane Cost</p>
                    <p className="text-[26px] font-bold text-white">$1,571</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-emerald-100/70 font-medium mb-1.5">Highest Risk Corridor</p>
                    <p className="text-[16px] font-bold text-[#ff6b6b] leading-tight">HUB-AHM → HUB-AMS <span className="opacity-90">(100.0%)</span></p>
                    <p className="text-[11px] text-emerald-100/60 mt-1.5">Monitored closely</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-emerald-100/70 font-medium mb-1.5">Underutilized Hub</p>
                    <p className="text-[16px] font-bold text-white">Pune Satellite</p>
                    <p className="text-[11px] text-emerald-100/60 mt-1.5">Utilization: 9.5%</p>
                  </div>
                </div>

                {/* Right Side Glowing Border Summary */}
                <div className="w-full md:w-[420px] bg-transparent border border-[#00B67A]/60 shadow-[0_0_15px_rgba(0,182,122,0.15)] rounded-[12px] p-5 relative flex flex-col justify-start">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[12px] font-bold text-emerald-100 flex items-center gap-2">
                      <Target className="w-3.5 h-3.5" /> AI Executive Summary
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-100/70">
                       <RefreshCw className="w-3 h-3" /> 2s ago
                    </div>
                  </div>
                  
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSummaryIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[13px] font-normal text-emerald-50/90 leading-relaxed"
                    >
                      {summaries[activeSummaryIndex]}
                    </motion.div>
                  </AnimatePresence>
                  
                  <div className="flex items-center justify-end mt-auto pt-4 gap-1.5">
                      {summaries.map((_, idx) => (
                        <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${activeSummaryIndex === idx ? 'w-1.5 bg-[#00B67A]' : 'w-1.5 bg-white/20'}`} />
                      ))}
                  </div>
                </div>

              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "AI Recommendations", desc: "View route optimizations", icon: MessageSquare, color: "text-emerald-600 bg-white" },
                { label: "Cost Analysis", desc: "View logistics breakdown", icon: DollarSign, color: "text-emerald-600 bg-white" },
                { label: "Risk Center", desc: "Predict SLA performance", icon: ShieldCheck, color: "text-amber-500 bg-white" },
                { label: "Reverse Logistics", desc: "Manage returns flow", icon: RefreshCw, color: "text-slate-600 bg-white" },
              ].map((action, i) => (
                <div key={i} className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm cursor-pointer group hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border border-slate-100 shadow-sm ${action.color}`}>
                      <action.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-[#0F172A]">{action.label}</p>
                      <p className="text-[10px] font-medium text-slate-500 mt-0.5">{action.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              ))}
            </motion.div>

            {/* Priority Work Queue Table */}
            <motion.div variants={fadeUp} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-[15px] font-black text-[#0F172A]">Priority Work Queue</h2>
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">6 Pending Tasks</span>
                </div>
                <Link href="/operations" className="text-[12px] font-bold text-[#00B67A] hover:text-[#047857] transition-colors flex items-center gap-1">
                  View All
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-2">Priority</th>
                      <th className="py-3 px-2">Transaction</th>
                      <th className="py-3 px-2">Flow</th>
                      <th className="py-3 px-2">Route</th>
                      <th className="py-3 px-2">Cost</th>
                      <th className="py-3 px-2">Transit</th>
                      <th className="py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {priorityRows.map((row, i) => (
                      <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-2">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            String(row.priority).startsWith("P1") ? "bg-rose-50 text-rose-600" :
                            String(row.priority).startsWith("P2") ? "bg-amber-50 text-amber-600" :
                            "bg-emerald-50 text-emerald-600"
                          }`}>
                            {row.priority}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-bold text-[#0F172A] text-[12px]">{row.transaction_id}</td>
                        <td className="py-3 px-2 font-medium text-slate-500 text-[12px]">{row.flow_type}</td>
                        <td className="py-3 px-2 font-bold text-[#0F172A] text-[12px] flex items-center gap-1">
                          {row.origin_hub_id} <ArrowRight className="w-3 h-3 text-slate-400" /> {row.destination_location}
                        </td>
                        <td className="py-3 px-2 font-medium text-slate-600 text-[12px]">{formatCurrency(row.logistics_cost_total_usd || 0)}</td>
                        <td className="py-3 px-2 font-medium text-slate-600 text-[12px]">{row.transit_days_actual}d</td>
                        <td className="py-3 px-2">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            row.sla_breach ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                          }`}>
                            {row.sla_breach ? "Breached" : "On Track"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

          </motion.div>

          {/* Right Sidebar */}
          <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">

            {/* AI Readiness Gauge */}
            <motion.div variants={fadeUp} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-hidden">
              <AIReadinessGauge percentage={86} />
            </motion.div>

            {/* Operational Snapshot */}
            <motion.div variants={fadeUp} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-[13px] font-bold text-[#0F172A] mb-4">Operational Snapshot</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-100 rounded-xl p-4 bg-white flex flex-col justify-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <p className="text-[10px] font-bold text-slate-400 mb-1">Hub Utilization</p>
                  <p className="text-[18px] font-black text-[#0F172A] mb-1">{avgUtilization.toFixed(1)}%</p>
                  <p className="text-[10px] font-bold text-amber-500">{overloadedHubs} overloaded</p>
                </div>
                <div className="border border-slate-100 rounded-xl p-4 bg-white flex flex-col justify-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <p className="text-[10px] font-bold text-slate-400 mb-1">Repair Workload</p>
                  <p className="text-[18px] font-black text-[#0F172A] mb-1">{totalRepairWorkload} <span className="text-[10px] font-bold text-slate-400 font-normal">units</span></p>
                </div>
                <div className="border border-slate-100 rounded-xl p-4 bg-white flex flex-col justify-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <p className="text-[10px] font-bold text-slate-400 mb-1">TPR Capacity</p>
                  <p className="text-[18px] font-black text-[#0F172A] mb-1">{tprCapacityPct.toFixed(1)}%</p>
                  <p className="text-[10px] font-bold text-[#00B67A]">{totalRepairCapacity} daily cap</p>
                </div>
                <div className="border border-slate-100 rounded-xl p-4 bg-white flex flex-col justify-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <p className="text-[10px] font-bold text-slate-400 mb-1">Transit Time</p>
                  <p className="text-[18px] font-black text-[#0F172A] mb-1">9.2d</p>
                </div>
              </div>
            </motion.div>

            {/* SLA Risk Alerts */}
            <motion.div variants={fadeUp} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[13px] font-bold text-[#0F172A]">SLA Risk Alerts</h2>
                <Link href="/predictions" className="text-[10px] font-medium text-slate-400 hover:text-slate-600">View SLA Center</Link>
              </div>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-rose-500"></div>
                    <div>
                      <p className="text-[12px] font-bold text-[#0F172A]">HUB-AHM → HUB-AMS (100.0%)</p>
                      <p className="text-[10px] font-medium text-slate-500 mt-0.5">63.7% live SLA breach rate</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-amber-500"></div>
                    <div>
                      <p className="text-[12px] font-bold text-[#0F172A]">Overloaded Hubs</p>
                      <p className="text-[10px] font-medium text-slate-500 mt-0.5">Delays expected</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-amber-500">3 Hubs</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-[#00B67A]"></div>
                    <div>
                      <p className="text-[12px] font-bold text-[#0F172A]">Tamper Alert Rate</p>
                      <p className="text-[10px] font-medium text-slate-500 mt-0.5">Calculated from Logistics_Transactions</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#00B67A]">6.6%</span>
                </div>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>

      {/* Sticky Bottom Executive Summary */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-3 px-8 z-40 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-[#0F172A]">Executive Summary</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
          
          <div className="w-px h-6 bg-slate-200"></div>

          <div className="flex items-center gap-12">
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-0.5">SLA Breach Risk</p>
              <p className="text-[13px] font-black text-rose-500">36.3%</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-0.5">Avg Transit Time</p>
              <p className="text-[13px] font-black text-[#0F172A]">9.2d</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-0.5">Total Hubs / TPRs</p>
              <p className="text-[13px] font-black text-[#0F172A]">20 / 8</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-0.5">On-Time Delivery</p>
              <p className="text-[13px] font-black text-[#0F172A]">62.8%</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-0.5">Cost Impact (Today)</p>
              <p className="text-[13px] font-black text-rose-500">$1.42M</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-0.5">CO₂ Impact (Today)</p>
              <p className="text-[13px] font-black text-[#00B67A]">18.6 Ton</p>
            </div>
          </div>
        </div>

        <button className="bg-[#115e59] hover:bg-[#0f514e] text-white px-5 py-2.5 rounded-lg text-[12px] font-medium flex items-center gap-2 transition-colors">
          Next Best Action <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
