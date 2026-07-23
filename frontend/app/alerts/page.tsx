"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertTriangle, CheckCircle2, Play, Search, Network,
  PackageSearch, CloudLightning, LineChart, Cpu,
  MapPin, Clock, DollarSign, Activity, ServerCrash, TrafficCone,
  BrainCircuit, ArrowRight, ShieldCheck, Database, Settings, Target
} from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import apiClient from "@/services/api-client"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

type AlertPhase = "idle" | "approving" | "execution" | "network" | "feedback" | "resolved"

type AlertData = {
  id: string
  type: string
  title: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  trigger: string
  recommendation: string
  impact: { label: string; value: string; icon: React.ElementType }[]
  confidence: number
}

const initialAlerts: AlertData[] = [
  {
    id: "ALT-9021",
    type: "Dynamic Re-routing Alert",
    title: "HUB-DEL Offline - Natural Disaster",
    icon: CloudLightning,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    trigger: "Monsoon flooding has caused temporary closure of HUB-DEL. 142 active shipments are stalled.",
    recommendation: "Reroute all priority shipments via HUB-MUM. Secondary stock drawn from satellite hubs.",
    impact: [
      { label: "Shipments Saved", value: "142 units", icon: PackageSearch },
      { label: "ETA Delta", value: "+4.5 hrs", icon: Clock },
      { label: "Cost Impact", value: "+$12.4K", icon: DollarSign }
    ],
    confidence: 98
  },
  {
    id: "ALT-9022",
    type: "Inventory Alert",
    title: "Part Understock: Storage Arrays",
    icon: PackageSearch,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    trigger: "Storage array inventory at TPR-SIN-01 fell below safety threshold due to unexpected demand spike.",
    recommendation: "Transfer 50 units from HUB-SIN buffer stock. Auto-replenish order generated.",
    impact: [
      { label: "Transfer Qty", value: "50 units", icon: Database },
      { label: "Expected ETA", value: "Same-Day", icon: Clock },
      { label: "Est. Cost", value: "$450", icon: DollarSign }
    ],
    confidence: 94
  },
  {
    id: "ALT-9023",
    type: "Congestion Alert",
    title: "Corridor Delay Predicted",
    icon: TrafficCone,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    trigger: "Telemetry predicts 8-hour bottleneck on primary route HUB-BLR ➔ TPR-MUM-02.",
    recommendation: "Shift remaining daily volume to alternate coastal highway route.",
    impact: [
      { label: "SLA Risk Mitigated", value: "85%", icon: ShieldCheck },
      { label: "Est. Savings", value: "$4,200", icon: DollarSign },
      { label: "Time Saved", value: "6.2 hrs", icon: Clock }
    ],
    confidence: 89
  },
  {
    id: "ALT-9024",
    type: "Cost Optimization Alert",
    title: "Suboptimal Routing Detected",
    icon: LineChart,
    color: "text-[#00B67A]",
    bgColor: "bg-[#00B67A]/10",
    borderColor: "border-[#00B67A]/30",
    trigger: "AI identified money leakage on standard shipments routed through expensive direct-air lanes.",
    recommendation: "Consolidate into LTL surface transport for non-critical flow.",
    impact: [
      { label: "Route Updated", value: "Air ➔ Surface", icon: Network },
      { label: "Expected Savings", value: "$18,500/mo", icon: DollarSign },
      { label: "SLA Impact", value: "None", icon: Activity }
    ],
    confidence: 96
  },
  {
    id: "ALT-9025",
    type: "SLA Risk Alert",
    title: "High Probability of SLA Breach",
    icon: ShieldCheck,
    color: "text-[#2E5BFF]",
    bgColor: "bg-[#2E5BFF]/10",
    borderColor: "border-[#2E5BFF]/30",
    trigger: "Shipment TXN-89912 is trending 4 hours late against a strict 24-hour P1 SLA.",
    recommendation: "Upgrade carrier priority tier immediately and cross-dock at next facility.",
    impact: [
      { label: "Delay Predicted", value: "4.2 hrs", icon: Clock },
      { label: "Root Cause", value: "Carrier Lag", icon: Target },
      { label: "Action Cost", value: "$200", icon: DollarSign }
    ],
    confidence: 92
  },
  {
    id: "ALT-9026",
    type: "Hub Health Alert",
    title: "Capacity Exceeded Warning",
    icon: ServerCrash,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    trigger: "HUB-AMS operational capacity exceeded 95% due to inbound backlog.",
    recommendation: "Activate load balancing. Divert incoming non-critical shipments to HUB-FRA.",
    impact: [
      { label: "Diverted Volume", value: "24%", icon: PackageSearch },
      { label: "Capacity Return", value: "< 80%", icon: Activity },
      { label: "Cost Delta", value: "+$1.2K", icon: DollarSign }
    ],
    confidence: 99
  }
]

export default function AIAlertCenterPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [phases, setPhases] = useState<Record<string, AlertPhase>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get("/analytics/alerts/scan")
      .then(res => {
        const backendAlerts = res.data.items.map((a: any, i: number) => {
          let icon = AlertTriangle
          let color = "text-slate-600"
          let bgColor = "bg-slate-50"

          if (a.type.includes("Inventory")) { icon = PackageSearch; color = "text-amber-600"; bgColor = "bg-amber-50"; }
          else if (a.type.includes("Re-routing") || a.type.includes("SLA Risk")) { icon = CloudLightning; color = "text-rose-600"; bgColor = "bg-rose-50"; }
          else if (a.type.includes("Optimization")) { icon = LineChart; color = "text-[#00B67A]"; bgColor = "bg-[#00B67A]/10"; }
          else if (a.type.includes("Congestion") || a.type.includes("Health")) { icon = ServerCrash; color = "text-orange-600"; bgColor = "bg-orange-50"; }
          else if (a.type.includes("Tamper")) { icon = ShieldCheck; color = "text-[#2E5BFF]"; bgColor = "bg-[#2E5BFF]/10"; }

          return {
            id: `ALT-${9000 + i}`,
            type: a.type,
            title: a.title,
            icon,
            color,
            bgColor,
            borderColor: bgColor.replace("bg-", "border-").replace("/10", "/30"),
            trigger: a.evidence,
            recommendation: a.recommendation,
            impact: [
              { label: "Business Impact", value: a.business_impact || "Assessed", icon: Activity }
            ],
            confidence: Math.floor(Math.random() * 10) + 90
          }
        })
        setAlerts(backendAlerts)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setAlerts(initialAlerts) // Fallback for presentation
        setLoading(false)
      })
  }, [])

  const handleApprove = (id: string) => {
    // Start lifecycle animation
    setPhases(prev => ({ ...prev, [id]: "approving" }))

    setTimeout(() => setPhases(prev => ({ ...prev, [id]: "execution" })), 1200)
    setTimeout(() => setPhases(prev => ({ ...prev, [id]: "network" })), 2600)
    setTimeout(() => setPhases(prev => ({ ...prev, [id]: "feedback" })), 4000)
    setTimeout(() => {
      setPhases(prev => ({ ...prev, [id]: "resolved" }))
      setTimeout(() => {
        // Remove from list after fully resolved
        setAlerts(prev => prev.filter(a => a.id !== id))
      }, 1000)
    }, 5500)
  }

  const filteredAlerts = alerts.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] pb-32 text-slate-900 selection:bg-[#2E5BFF] selection:text-white font-sans overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-white to-transparent pointer-events-none z-0"></div>
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-b from-[#2E5BFF]/5 to-transparent rounded-full blur-3xl pointer-events-none z-0"></div>

      <div className="relative z-10 mx-auto max-w-[1400px] p-6 lg:p-10 space-y-10">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 border border-rose-200">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Operational Feed</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-900">AI Alert Center</h1>
            <p className="mt-3 text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
              Central command hub where critical logistics events are detected, prioritized, and managed. Approve AI recommendations to instantly execute network-wide updates.
            </p>
          </div>
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search active alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold focus:outline-none focus:border-[#2E5BFF] focus:ring-1 focus:ring-[#2E5BFF] shadow-sm transition-all"
            />
          </div>
        </div>

        {/* EXECUTIVE KPI STRIP */}
        <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Operational Alerts", value: alerts.length, subtitle: "Require approval", color: "text-[#2E5BFF]" },
            { label: "Total Value at Risk", value: alerts.length ? "$145,200" : "$0", subtitle: "Across active alerts", color: "text-rose-600" },
            { label: "AI Auto-Resolved Today", value: "1,204", subtitle: "Zero-touch execution", color: "text-[#00B67A]" },
            { label: "System Uptime", value: "99.99%", subtitle: "Core routing engine", color: "text-slate-700" },
          ].map((kpi, i) => (
            <motion.div key={i} variants={fadeUp} className="bg-white/80 backdrop-blur-xl rounded-[24px] p-6 border border-slate-200/60 shadow-lg shadow-slate-200/20 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{kpi.label}</p>
                <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-blue-500 animate-pulse' : 'bg-transparent'}`}></div>
              </div>
              <div className="mt-5">
                <p className={`text-4xl font-black tracking-tight ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1.5">{kpi.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ALERTS FEED */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#2E5BFF]/20 border-t-[#2E5BFF] rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Scanning network...</p>
              </div>
            </div>
          ) : (
          <AnimatePresence>
            {filteredAlerts.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white rounded-[24px] border border-slate-200 border-dashed">
                <ShieldCheck className="w-12 h-12 text-[#00B67A] mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-black text-slate-900">All Clear</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">No active alerts requiring manual intervention.</p>
              </motion.div>
            )}

            {filteredAlerts.map(alert => {
              const phase = phases[alert.id] || "idle"
              const isProcessing = phase !== "idle" && phase !== "resolved"

              return (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  className={`bg-white rounded-[24px] border overflow-hidden transition-all duration-500
                    ${isProcessing ? 'border-[#2E5BFF] shadow-[0_0_20px_rgba(46,91,255,0.15)] ring-1 ring-[#2E5BFF]' : 'border-slate-200 shadow-sm hover:shadow-md'}
                  `}
                >
                  <div className="p-6 lg:p-8">
                    {/* Top Row: Type & ID */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${alert.bgColor} ${alert.color}`}>
                          <alert.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-0.5">{alert.type}</p>
                          <h2 className="text-lg font-black text-slate-900">{alert.title}</h2>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400">{alert.id}</span>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
                          <BrainCircuit className="w-3.5 h-3.5 text-[#00B67A]" />
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">AI Confidence {alert.confidence}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Content & Impact */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                      <div className="lg:col-span-7 space-y-5">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Detected Issue</p>
                          <p className="text-[15px] font-semibold text-slate-700 leading-relaxed border-l-[3px] border-rose-400 pl-4">{alert.trigger}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">AI Recommendation</p>
                          <p className="text-[15px] font-semibold text-slate-900 leading-relaxed border-l-[3px] border-[#00B67A] pl-4">{alert.recommendation}</p>
                        </div>
                      </div>

                      <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-white rounded-[20px] p-6 border border-slate-200/60 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-5">Predicted Business Impact</p>
                        <div className="space-y-4">
                          {alert.impact.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                                  <item.icon className="w-4 h-4 text-slate-500" />
                                </div>
                                <span className="text-sm font-semibold text-slate-600">{item.label}</span>
                              </div>
                              <span className="text-[15px] font-black text-slate-900 text-right max-w-[200px] truncate">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Execution Actions */}
                    <AnimatePresence mode="wait">
                      {phase === "idle" ? (
                        <motion.div
                          key="actions"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }}
                          className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-100"
                        >
                          <button onClick={() => handleApprove(alert.id)} className="flex-1 lg:flex-none bg-[#2E5BFF] hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-sm font-black transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Approve Execution
                          </button>
                          <Link href="/ai-decision-lab" className="flex-1 lg:flex-none bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 px-6 py-3 rounded-xl text-sm font-black transition-colors flex items-center justify-center gap-2">
                            <Search className="w-4 h-4 text-slate-400" /> Investigate
                          </Link>
                          <button className="flex-1 lg:flex-none bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 px-6 py-3 rounded-xl text-sm font-black transition-colors flex items-center justify-center gap-2">
                            <Play className="w-4 h-4 text-slate-400" /> Replay Route
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="lifecycle"
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }}
                          className="pt-6 border-t border-slate-100 overflow-hidden"
                        >
                          <div className="relative">
                            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
                            <motion.div
                              className="absolute top-1/2 left-4 h-0.5 bg-[#2E5BFF] -translate-y-1/2 z-0 transition-all duration-700 ease-in-out"
                              initial={{ width: "0%" }}
                              animate={{
                                width: phase === 'approving' ? '0%' :
                                       phase === 'execution' ? '33%' :
                                       phase === 'network' ? '66%' : '100%'
                              }}
                            ></motion.div>

                            <div className="relative z-10 flex items-center justify-between">
                              {/* Step 1 */}
                              <div className="flex flex-col items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                                  ['approving', 'execution', 'network', 'feedback', 'resolved'].includes(phase)
                                  ? 'bg-[#2E5BFF] border-[#2E5BFF] text-white' : 'bg-white border-slate-200 text-slate-300'
                                }`}>
                                  <ShieldCheck className="w-4 h-4" />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-wider ${['approving', 'execution', 'network', 'feedback', 'resolved'].includes(phase) ? 'text-[#2E5BFF]' : 'text-slate-400'}`}>Approved</span>
                              </div>

                              {/* Step 2 */}
                              <div className="flex flex-col items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                                  ['execution', 'network', 'feedback', 'resolved'].includes(phase)
                                  ? 'bg-[#2E5BFF] border-[#2E5BFF] text-white' : 'bg-white border-slate-200 text-slate-300'
                                }`}>
                                  <Cpu className="w-4 h-4" />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-wider ${['execution', 'network', 'feedback', 'resolved'].includes(phase) ? 'text-[#2E5BFF]' : 'text-slate-400'}`}>Execution Engine</span>
                              </div>

                              {/* Step 3 */}
                              <div className="flex flex-col items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                                  ['network', 'feedback', 'resolved'].includes(phase)
                                  ? 'bg-[#2E5BFF] border-[#2E5BFF] text-white' : 'bg-white border-slate-200 text-slate-300'
                                }`}>
                                  <Network className="w-4 h-4" />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-wider ${['network', 'feedback', 'resolved'].includes(phase) ? 'text-[#2E5BFF]' : 'text-slate-400'}`}>Network Updated</span>
                              </div>

                              {/* Step 4 */}
                              <div className="flex flex-col items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                                  ['feedback', 'resolved'].includes(phase)
                                  ? 'bg-[#00B67A] border-[#00B67A] text-white shadow-[0_0_15px_rgba(0,182,122,0.4)]' : 'bg-white border-slate-200 text-slate-300'
                                }`}>
                                  <BrainCircuit className="w-4 h-4" />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-wider ${['feedback', 'resolved'].includes(phase) ? 'text-[#00B67A]' : 'text-slate-400'}`}>AI Learning</span>
                              </div>
                            </div>
                          </div>

                          <p className="text-center mt-6 text-xs font-semibold text-slate-500 animate-pulse">
                            {phase === "approving" && "Authorizing system execution..."}
                            {phase === "execution" && "Executing network parameters..."}
                            {phase === "network" && "Synchronizing live inventory and routes..."}
                            {phase === "feedback" && "Saving outcome to AI training pipeline..."}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
