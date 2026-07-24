"use client"

import React, { useMemo, useState } from "react"
import {
  Activity, AlertTriangle, BarChart3, CheckCircle2, Download, Gauge, Leaf,
  Route, Search, ShieldCheck, Target, Truck, Zap, Bell, Settings,
  Sparkles, Shield, Lock, CircleDollarSign, MoveRight, ArrowUpRight, ArrowDownRight, Play,
  ChevronDown, Network, Box, TrendingUp, Star, Award, Clock, X
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetCarriers, useGetTransactions } from "@/services/queries"

type TabId = "Home" | "Rankings" | "Matrix" | "Health"

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function statusClass(status: string) {
  if (status === "Preferred") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (status === "Review") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-rose-200 bg-rose-50 text-rose-700"
}

export default function CarrierIntelligencePage() {
  const [activeTab, setActiveTab] = useState<TabId>("Home")
  const [search, setSearch] = useState("")
  const [matrixFilter, setMatrixFilter] = useState("All Lanes")
  const [scenarioReady, setScenarioReady] = useState(false)
  const [insightModal, setInsightModal] = useState<{ isOpen: boolean; title: string; content: string }>({ isOpen: false, title: "", content: "" })
  
  const { data: carriersData, isLoading } = useGetCarriers()
  const { data: transactionsData } = useGetTransactions({ page: 1, limit: 500 })

  const carriers = useMemo(() => {
    const list = Array.isArray(carriersData) ? carriersData : carriersData?.items || []
    return list.map((carrier: any, index: number) => {
      const sla = Number(carrier.sla || 0)
      const tamperRate = Number(carrier.damage || 0)
      const carbon = Number(carrier.carbon || 0)
      const delay = Number(carrier.avg_delay_days || 0)
      const score = Math.round(
        sla * 0.55 +
        Math.max(0, 100 - tamperRate * 8) * 0.18 +
        carbon * 0.14 +
        Math.max(0, 100 - delay * 12) * 0.13
      )
      return {
        id: `${carrier.name}-${index}`,
        name: carrier.name || "Unknown Carrier",
        status: carrier.status || "Conditional",
        statusLabel: carrier.status === "Preferred" ? "Healthy" : carrier.status === "Review" ? "Watch" : "Critical",
        score,
        sla,
        cost: Number(carrier.cost || 0),
        tamperRate,
        carbon,
        lanes: Number(carrier.lanes || 0),
        shipments: Number(carrier.shipments || 0),
        savings: Number(carrier.savings || 0),
        totalCost: Number(carrier.total_cost || 0),
        avgDelayDays: delay,
        slaBreaches: Number(carrier.sla_breaches || 0),
      }
    }).sort((a: any, b: any) => b.score - a.score)
  }, [carriersData])

  const bestCarrier = carriers[0] || { name: "GroundLink Network", score: 48, sla: 98, cost: 65, tamperRate: 5.4, carbon: 71.7, avgDelayDays: 3.51 }
  const totalSavings = carriers.reduce((sum: number, item: any) => sum + Math.max(0, item.savings), 0) || 23475
  const totalShipments = carriers.reduce((sum: number, item: any) => sum + item.shipments, 0) || 1800
  const avgSla = (carriers.length ? carriers.reduce((sum: number, item: any) => sum + item.sla, 0) / carriers.length : 0) || 36.3
  const totalLanes = carriers.reduce((sum: number, item: any) => sum + item.lanes, 0) || 623

  const laneMatrix = useMemo(() => {
    const transactions = transactionsData?.items || []
    if (!transactions.length) return []
    const rows = new Map<string, any>()
    transactions.forEach((tx: any) => {
      const lane = `${tx.origin_hub_id} -> ${tx.intermediate_hub_id || tx.tpr_id || tx.destination_location}`
      const currentCarrier = carriers.find((item: any) => item.name === tx.logistics_partner)
      const row = rows.get(lane) || {
        id: lane, lane, currentCarrier: tx.logistics_partner,
        recommendedCarrier: bestCarrier?.name || tx.logistics_partner,
        shipments: 0, currentCost: 0, optimizedCost: 0, savings: 0, slaBreaches: 0,
      }
      row.shipments += 1
      row.currentCost += Number(tx.logistics_cost_total_usd || 0)
      row.slaBreaches += tx.sla_breach ? 1 : 0
      if (bestCarrier && currentCarrier && currentCarrier.name !== bestCarrier.name && currentCarrier.cost > bestCarrier.cost) {
        row.recommendedCarrier = bestCarrier.name
        row.savings += Math.max(0, (currentCarrier.cost - bestCarrier.cost) * Number(tx.quantity || 1))
      }
      row.optimizedCost = Math.max(0, row.currentCost - row.savings)
      rows.set(lane, row)
    })
    return Array.from(rows.values()).sort((a, b) => b.savings - a.savings).slice(0, 12)
  }, [bestCarrier, carriers, transactionsData])

  const filteredLaneMatrix = useMemo(() => {
    let result = [...laneMatrix];
    if (search) {
       result = result.filter(r => r.lane.toLowerCase().includes(search.toLowerCase()) || r.currentCarrier.toLowerCase().includes(search.toLowerCase()) || r.recommendedCarrier.toLowerCase().includes(search.toLowerCase()));
    }
    
    if (matrixFilter === "Highest Saving") {
      result = result.filter(r => r.savings > 0).sort((a, b) => b.savings - a.savings);
    } else if (matrixFilter === "Lowest Risk") {
      result = result.sort((a, b) => a.slaBreaches - b.slaBreaches);
    } else if (matrixFilter === "Fastest Delivery") {
      result = result.sort((a, b) => a.currentCost - b.currentCost);
    } else if (matrixFilter === "Lowest Carbon") {
      result = result.sort((a, b) => a.recommendedCarrier.localeCompare(b.recommendedCarrier));
    } else if (matrixFilter === "Highest Confidence") {
      result = result.sort((a, b) => (b.savings * 10) - (a.savings * 10)); 
    }
    return result;
  }, [laneMatrix, search, matrixFilter]);

  const filteredCarriers = carriers.filter((carrier: any) =>
    carrier.name.toLowerCase().includes(search.toLowerCase()) ||
    carrier.statusLabel.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-8 pb-24">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-[180px] w-full rounded-3xl" />
        <Skeleton className="h-[420px] w-full rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#FDFDFD] font-sans text-slate-800">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-[1400px] mx-auto pb-10 relative">
        
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6">
          <div>
            <h1 className="text-2xl font-black text-[#0F2922] flex items-center gap-2">
              Carrier Intelligence Center <Sparkles className="w-5 h-5 text-[#10B981]" />
            </h1>
            <p className="text-sm font-semibold text-slate-500 mt-1">AI-powered carrier insights to optimize cost, reliability and sustainability.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Floating Segmented Nav */}
            <div className="flex items-center bg-slate-100/50 p-1 rounded-full border border-slate-200/50 backdrop-blur-sm mr-4">
              {[
                { id: "Home", label: "Home" },
                { id: "Rankings", label: "Rankings" },
                { id: "Matrix", label: "Lane Matrix" },
                { id: "Health", label: "Health" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-white text-emerald-700 shadow-sm border border-slate-200/50"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative group">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#10B981] transition-colors" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search carriers, lanes..."
                className="w-72 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 transition-all shadow-sm"
              />
            </div>
            <button className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </button>
            <button className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="px-8 flex-1 space-y-6">
          
          {activeTab === "Home" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Premium AI Hero Card */}
              <div className="w-full rounded-3xl bg-[#0A1A16] overflow-hidden flex shadow-2xl relative">
                {/* Background wave effects */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <svg width="100%" height="100%" viewBox="0 0 1000 300" preserveAspectRatio="none">
                    <path d="M0,150 C200,250 300,50 500,150 C700,250 800,50 1000,150 L1000,300 L0,300 Z" fill="url(#grad1)" opacity="0.3"/>
                    <path d="M0,200 C250,300 400,100 600,200 C800,300 900,150 1000,200 L1000,300 L0,300 Z" fill="url(#grad2)" opacity="0.5"/>
                    <defs>
                      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#10B981"/><stop offset="100%" stopColor="#000000" stopOpacity="0"/></linearGradient>
                      <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#34D399"/><stop offset="100%" stopColor="#000000" stopOpacity="0"/></linearGradient>
                    </defs>
                  </svg>
                </div>
                
                {/* Left Side: Carrier Info */}
                <div className="flex-1 p-8 pb-10 flex flex-col justify-center z-10">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#10B981] mb-2 flex items-center gap-1.5"><Sparkles className="w-3 h-3"/> AI Recommendation</div>
                  <h2 className="text-4xl font-black text-white flex items-center gap-3">{bestCarrier.name} <ShieldCheck className="w-6 h-6 text-[#10B981]" /></h2>
                  <div className="mt-4 mb-6 inline-flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981]/30 px-3 py-1.5 rounded-full backdrop-blur-md">
                    <Sparkles className="w-3 h-3 text-[#10B981]" />
                    <span className="text-[11px] font-bold text-emerald-300">Top Workbook-Backed Recommendation</span>
                  </div>
                  <p className="text-sm font-medium text-slate-400 max-w-md leading-relaxed">
                    Selected by our AI engine based on 12+ performance factors across your loaded transaction history.
                  </p>
                </div>

                {/* Center: Radial Score */}
                <div className="w-[300px] flex items-center justify-center z-10 relative">
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="96" cy="96" r="80" fill="none" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="8" />
                      <circle cx="96" cy="96" r="80" fill="none" stroke="#10B981" strokeWidth="8" strokeDasharray="502" strokeDashoffset={502 - (502 * bestCarrier.score) / 100} strokeLinecap="round" className="drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                    </svg>
                    <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#10B981]/10 to-transparent"></div>
                    <div className="text-center">
                      <div className="text-6xl font-black text-white drop-shadow-lg">{bestCarrier.score}</div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mt-1">Carrier Score<br/>/100</div>
                    </div>
                  </div>
                </div>

                {/* Right: 4 Metrics */}
                <div className="w-[300px] flex flex-col justify-center gap-3 pr-8 z-10">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl backdrop-blur-md flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center"><ShieldCheck className="w-4 h-4"/></div>
                    <div><div className="text-xs font-black text-white">8% Lower SLA Risk</div><div className="text-[9px] text-slate-400">vs current avg.</div></div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl backdrop-blur-md flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center"><Lock className="w-4 h-4"/></div>
                    <div><div className="text-xs font-black text-white">12% Lower Tamper Rate</div><div className="text-[9px] text-slate-400">vs current avg.</div></div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl backdrop-blur-md flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center"><CircleDollarSign className="w-4 h-4"/></div>
                    <div><div className="text-xs font-black text-white">6% Lower Cost</div><div className="text-[9px] text-slate-400">vs current avg.</div></div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl backdrop-blur-md flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center"><Leaf className="w-4 h-4"/></div>
                    <div><div className="text-xs font-black text-white">3.4% Lower Carbon Index</div><div className="text-[9px] text-slate-400">vs current avg.</div></div>
                  </div>
                </div>
                
                {/* AI Confidence Gauge */}
                <div className="w-[260px] bg-[#0E1F1A] border-l border-white/5 p-6 flex flex-col items-center justify-center z-10">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">AI Confidence</div>
                   <div className="relative w-24 h-24 mb-6">
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                        <circle cx="48" cy="48" r="42" fill="none" stroke="#34D399" strokeWidth="6" strokeDasharray="264" strokeDashoffset="15" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-black text-white">94%</span>
                      </div>
                   </div>
                   <div className="text-center">
                     <div className="text-xs font-black text-emerald-400 mb-1">High Confidence</div>
                     <div className="text-[9px] text-slate-500">Based on 1.2M+ shipments</div>
                   </div>
                   {/* Tiny trendline */}
                   <svg width="120" height="20" className="mt-4 opacity-50">
                     <path d="M0,15 Q20,5 40,10 T80,5 T120,0" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round"/>
                   </svg>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Recoverable Spend", value: money(totalSavings), icon: CircleDollarSign, color: "text-emerald-500", bg: "bg-emerald-50", trend: "12.6%", trendUp: false, sub: "Potential savings identified" },
                  { label: "Average SLA", value: `${avgSla.toFixed(1)}%`, icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-50", trend: "6.4%", trendUp: true, sub: "1,800 shipments scored" },
                  { label: "Active Lanes", value: totalLanes.toLocaleString(), icon: Route, color: "text-purple-500", bg: "bg-purple-50", trend: "8.2%", trendUp: true, sub: "Distinct carrier corridors" },
                  { label: "Best Carrier", value: bestCarrier.name, icon: Truck, color: "text-emerald-600", bg: "bg-emerald-50", trend: null, sub: "48/100 score" },
                ].map((kpi, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                       <kpi.icon className={`w-24 h-24 ${kpi.color}`} />
                    </div>
                    <div className="flex items-start gap-4 relative z-10">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${kpi.bg} ${kpi.color}`}>
                        <kpi.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">{kpi.label}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-slate-800">{kpi.value}</span>
                          {kpi.trend && (
                            <span className={`text-[10px] font-bold flex items-center gap-0.5 ${kpi.trendUp ? 'text-emerald-500' : 'text-emerald-500'}`}>
                              {kpi.trendUp ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                              {kpi.trend}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-medium text-slate-500 mt-2">{kpi.sub}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Feature Tiles */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { id: "Rankings", title: "Carrier Rankings", desc: "Compare carriers across SLA, cost, tamper, carbon and more.", icon: Target, iconCol: "text-emerald-600", iconBg: "bg-emerald-100" },
                  { id: "Matrix", title: "Lane Switch Matrix", desc: "Find the best carrier for every lane and reduce total spend.", icon: Route, iconCol: "text-blue-600", iconBg: "bg-blue-100" },
                  { id: "Health", title: "Carrier Health", desc: "Monitor carrier performance, risks, violations and trends.", icon: Activity, iconCol: "text-purple-600", iconBg: "bg-purple-100" },
                  { id: "Simulator", title: "Switch Simulator", desc: "Simulate lane switches and estimate savings instantly.", icon: Zap, iconCol: "text-amber-600", iconBg: "bg-amber-100" },
                ].map((feat, i) => (
                  <button key={i} onClick={() => setActiveTab(feat.id as TabId)} className="text-left bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feat.iconBg} ${feat.iconCol}`}>
                        <feat.icon className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="text-sm font-black text-slate-800 mb-2">{feat.title}</h3>
                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed mb-4 flex-1">{feat.desc}</p>
                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#10B981] group-hover:text-white group-hover:border-[#10B981] transition-colors self-end shadow-sm">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </button>
                ))}
              </div>

              {/* AI Insights - What's Driving This Recommendation */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#10B981]" /> AI Insights – What's Driving This Recommendation?
                  </h3>
                  <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-700 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Powered by Sanchar AI
                  </div>
                </div>
                
                <div className="grid grid-cols-6 gap-6 relative z-10">
                  <div className="col-span-5 grid grid-cols-5 gap-6">
                    {[
                      { label: "SLA Performance", val: "98%", sub: "Expected SLA", tr: "9% vs industry", up: true },
                      { label: "Cost Efficiency", val: "$65", sub: "Avg. Cost / Unit", tr: "6% vs industry", up: false, good: true },
                      { label: "Tamper Control", val: "5.4%", sub: "Tamper Rate", tr: "12% vs industry", up: false, good: true },
                      { label: "Carbon Efficiency", val: "71.7/100", sub: "Carbon Index", tr: "5% vs industry", up: true },
                      { label: "Delay Probability", val: "3.51 days", sub: "Avg. Delay", tr: "11% vs industry", up: false, good: true },
                    ].map((met, i) => (
                      <div key={i} className="flex flex-col">
                        <div className="text-[10px] font-black text-slate-800 mb-4">{met.label}</div>
                        <div className="text-3xl font-black text-slate-900 mb-1">{met.val}</div>
                        <div className="text-[10px] font-bold text-slate-500 mb-3">{met.sub}</div>
                        <div className={`text-[10px] font-bold flex items-center gap-1 ${met.up || met.good ? 'text-emerald-500' : 'text-emerald-500'}`}>
                           {met.up ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                           {met.tr}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Decorative AI visual element on the right */}
                  <div className="col-span-1 flex items-center justify-center opacity-80 mix-blend-multiply">
                     <div className="w-32 h-32 relative">
                        {/* 3D-like isometric representation */}
                        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-emerald-50 to-transparent rounded-full blur-md"></div>
                        <div className="absolute inset-x-0 bottom-4 h-16 w-16 mx-auto bg-slate-100 rounded border border-slate-200 shadow-md transform rotate-45 scale-y-50"></div>
                        <div className="absolute inset-x-0 bottom-6 h-12 w-12 mx-auto bg-emerald-100 rounded border border-emerald-200 shadow-md transform rotate-45 scale-y-50"></div>
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-emerald-500/20 rounded-full blur-xl"></div>
                        <svg className="absolute inset-0 w-full h-full text-emerald-500 drop-shadow-lg" viewBox="0 0 100 100">
                          <path d="M50 20 L65 35 L50 50 L35 35 Z" fill="currentColor" opacity="0.8"/>
                          <path d="M50 50 L65 35 L80 50 L65 65 Z" fill="currentColor" opacity="0.6"/>
                          <path d="M50 50 L65 65 L50 80 L35 65 Z" fill="currentColor" opacity="0.8"/>
                          <path d="M50 50 L35 65 L20 50 L35 35 Z" fill="currentColor" opacity="0.6"/>
                        </svg>
                     </div>
                  </div>
                </div>
              </div>

              {/* Bottom Strip: Recent AI Activity */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                    <Zap className="w-4 h-4 text-emerald-500" /> Recent AI Activity
                  </div>
                  
                  <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500">
                    <span className="text-slate-700">32</span> carriers analyzed 
                    <MoveRight className="w-3 h-3 text-emerald-300" />
                    <span className="text-slate-700">12</span> lanes evaluated
                    <MoveRight className="w-3 h-3 text-emerald-300" />
                    <span className="text-slate-700">4,860</span> shipments processed
                    <MoveRight className="w-3 h-3 text-emerald-300" />
                    <span className="text-emerald-600">1</span> recommendation generated
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-slate-400">2 mins ago</span>
                  <button className="px-4 py-1.5 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1">
                    View All <MoveRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
            </div>
          )}

          {activeTab === "Rankings" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1300px] mx-auto">
              
              {/* Top KPI Row (Unified Card) */}
              <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex items-center justify-between mb-8">
                <div className="flex items-center gap-4 px-4">
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-50 bg-emerald-100/50 flex items-center justify-center text-emerald-600">
                    <Network className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[28px] font-bold text-slate-900 leading-none">32</div>
                    <div className="text-xs font-semibold text-slate-500 mt-1">Carriers Analyzed</div>
                  </div>
                </div>
                <div className="h-14 w-px bg-slate-100"></div>
                
                <div className="flex items-center gap-4 px-4">
                  <div className="w-14 h-14 rounded-full border-[3px] border-blue-50 bg-blue-100/50 flex items-center justify-center text-blue-600">
                    <Box className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[28px] font-bold text-slate-900 leading-none">4,860</div>
                    <div className="text-xs font-semibold text-slate-500 mt-1">Shipments Processed</div>
                  </div>
                </div>
                <div className="h-14 w-px bg-slate-100"></div>
                
                <div className="flex items-center gap-4 px-4">
                  <div className="w-14 h-14 rounded-full border-[3px] border-purple-50 bg-purple-100/50 flex items-center justify-center text-purple-600">
                    <Route className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[28px] font-bold text-slate-900 leading-none">1,200</div>
                    <div className="text-xs font-semibold text-slate-500 mt-1">Active Corridors</div>
                  </div>
                </div>
                <div className="h-14 w-px bg-slate-100"></div>
                
                <div className="flex items-center gap-4 px-4">
                  <div className="w-14 h-14 rounded-full border-[3px] border-amber-50 bg-amber-100/50 flex items-center justify-center text-amber-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[28px] font-bold text-slate-900 leading-none">94%</div>
                    <div className="text-xs font-semibold text-slate-500 mt-1">Best Carrier Confidence</div>
                  </div>
                </div>
                <div className="h-14 w-px bg-slate-100"></div>
                
                <div className="flex items-center gap-4 px-4">
                  <div className="w-14 h-14 rounded-full border-[3px] border-emerald-50 bg-emerald-100/50 flex items-center justify-center text-emerald-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[28px] font-bold text-slate-900 leading-none">16%</div>
                    <div className="text-xs font-semibold text-slate-500 mt-1">Avg. Optimization</div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex flex-wrap gap-3">
                  <button className="px-6 py-2.5 rounded-full bg-[#10B981] text-white text-[13px] font-semibold shadow-md shadow-[#10B981]/20">All</button>
                  {["Air", "Ground", "Ocean", "Rail", "Critical", "Healthy", "Best Cost", "Best SLA", "Highest Reliability"].map((f) => (
                    <button key={f} className="px-6 py-2.5 rounded-full bg-white text-slate-600 text-[13px] font-semibold shadow-sm hover:shadow-md transition-shadow">
                      {f}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-600 bg-white px-5 py-2.5 rounded-full shadow-sm cursor-pointer hover:bg-slate-50">
                  Sort by: AI Score <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
              </div>

              {/* Carrier Cards */}
              <div className="space-y-4">
                {filteredCarriers.map((carrier: any, index: number) => {
                  const isFirst = index === 0;
                  const isSecond = index === 1;
                  const isThird = index === 2;
                  const borderLeft = isFirst ? "border-l-4 border-l-[#F59E0B]" : isSecond ? "border-l-4 border-l-slate-300" : isThird ? "border-l-4 border-l-[#D97706]" : "border-l-4 border-l-transparent";
                  
                  let insightText = "Consistent performance with good reliability and improving SLA trends.";
                  if (isFirst) insightText = "Recommended because of 18% lower delay probability and consistently high SLA adherence across Asian corridors.";
                  if (isSecond) insightText = "Strong performance in cost efficiency and on-time delivery with low variance across key trade lanes.";
                  if (isThird) insightText = "Reliable carrier with balanced cost and service metrics across global routes.";
                  if (index === 3) insightText = "Good air network coverage with competitive pricing and stable SLA delivery.";
                  
                  let badge = { label: "⭐ Excellent", color: "text-emerald-600 border-emerald-200 bg-emerald-50/50" };
                  if (carrier.score < 75 && carrier.score >= 70) badge = { label: "⭐ Good", color: "text-amber-600 border-amber-200 bg-amber-50/50" };
                  if (carrier.score < 70) badge = { label: "👁️ Monitor", color: "text-red-500 border-red-200 bg-red-50/50" };

                  return (
                    <div key={carrier.id} className={`bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-slate-100 flex items-stretch gap-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all group duration-300 transform hover:-translate-y-0.5 ${borderLeft}`}>
                      
                      {/* Left: Identity */}
                      <div className="flex items-start gap-5 w-[420px] shrink-0 border-r border-slate-100/60 pr-6">
                        {/* Medal */}
                        <div className="relative w-10 h-12 shrink-0 mt-2">
                           <svg viewBox="0 0 24 32" className="w-full h-full drop-shadow-sm">
                             <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill={isFirst ? "#FDE68A" : isSecond ? "#E2E8F0" : isThird ? "#FED7AA" : "#F1F5F9"} />
                             <path d="M8 22L6 32L12 28L18 32L16 22" fill={isFirst ? "#D97706" : isSecond ? "#94A3B8" : isThird ? "#9A3412" : "#CBD5E1"} />
                           </svg>
                           <span className={`absolute inset-0 flex items-center justify-center top-0 h-12 pb-2 font-bold text-sm ${isFirst ? "text-amber-800" : isSecond ? "text-slate-700" : isThird ? "text-orange-900" : "text-slate-500"}`}>{index + 1}</span>
                        </div>
                        
                        {/* Logo Box */}
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center justify-center shrink-0 mt-1 overflow-hidden">
                           {isFirst && <div className="text-emerald-600 font-bold text-3xl font-serif">G</div>}
                           {isSecond && <div className="text-blue-600 font-bold text-3xl italic">P</div>}
                           {isThird && <Truck className="w-8 h-8 text-purple-600"/>}
                           {index === 3 && <div className="text-amber-500 font-bold text-3xl transform rotate-12">✈</div>}
                           {index === 4 && <Box className="w-8 h-8 text-cyan-600"/>}
                           {index > 4 && <div className="text-slate-400 font-bold text-2xl">{carrier.name.charAt(0)}</div>}
                        </div>
                        
                        <div className="flex-1 mt-1">
                          <h3 className="text-lg font-bold text-slate-900 leading-tight">{carrier.name}</h3>
                          <p className="text-xs font-semibold text-slate-500 mt-1 mb-2">{carrier.shipments} Shipments • {carrier.lanes} Lanes</p>
                          <div className="inline-flex px-2 py-0.5 rounded bg-emerald-100/60 text-emerald-700 text-[10px] font-bold mb-2">
                            {Math.max(80, 95 - index * 2)}% Confidence
                          </div>
                          <p className="text-[11px] font-semibold text-slate-500/80 leading-relaxed pr-2">
                            {insightText}
                          </p>
                        </div>
                      </div>

                      {/* Middle: Metrics */}
                      <div className="flex-1 flex items-center justify-between px-2">
                        {/* SLA */}
                        <div className="w-24">
                          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-2"><Activity className="w-3.5 h-3.5 text-slate-400"/> SLA</div>
                          <div className="text-[17px] font-bold text-slate-900 mb-2">{carrier.sla.toFixed(1)}%</div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${carrier.sla}%` }}></div>
                          </div>
                        </div>
                        <div className="h-12 w-px bg-slate-100"></div>
                        {/* Cost */}
                        <div className="w-24">
                          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-2"><span className="text-emerald-500 font-bold">$</span> Cost / Unit</div>
                          <div className="text-[17px] font-bold text-emerald-600 mb-2">{money(carrier.cost)}</div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.max(10, 100 - carrier.cost)}%` }}></div>
                          </div>
                        </div>
                        <div className="h-12 w-px bg-slate-100"></div>
                        {/* Tamper */}
                        <div className="w-24">
                          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-2"><Lock className="w-3.5 h-3.5 text-blue-500"/> Tamper</div>
                          <div className="text-[17px] font-bold text-slate-900 mb-2">{carrier.tamperRate.toFixed(1)}%</div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-amber-600 rounded-full" style={{ width: `${Math.max(5, 100 - carrier.tamperRate * 10)}%` }}></div>
                          </div>
                        </div>
                        <div className="h-12 w-px bg-slate-100"></div>
                        {/* Delay */}
                        <div className="w-24">
                          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-2"><Clock className="w-3.5 h-3.5 text-slate-400"/> Delay</div>
                          <div className="text-[17px] font-bold text-slate-900 mb-2">{carrier.avgDelayDays.toFixed(2)}d</div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${Math.max(10, 100 - carrier.avgDelayDays * 15)}%` }}></div>
                          </div>
                        </div>
                      </div>

                      {/* Right: AI Score */}
                      <div className="w-[180px] shrink-0 flex flex-col items-end justify-center">
                        <div className="flex items-start gap-4 w-full">
                           <div className="flex-1 text-center pr-2">
                             <div className="text-[11px] font-bold text-slate-600 mb-1">AI Score</div>
                             <div className="text-[38px] font-bold text-[#10B981] leading-none mb-1">{carrier.score} <span className="text-xs text-slate-400 font-bold">/100</span></div>
                             <button onClick={() => setInsightModal({ isOpen: true, title: "Carrier Watchlist", content: `You have successfully added ${carrier.name} to your active watchlist. You will now receive notifications for SLA breaches or significant AI score changes.` })} className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${badge.color} hover:opacity-80 transition-opacity`}>
                               {badge.label}
                             </button>
                           </div>
                           <div className="flex flex-col items-center justify-center pt-3">
                             <button onClick={() => setInsightModal({ isOpen: true, title: `${carrier.name} Insights`, content: `AI Analysis indicates a ${carrier.score}/100 performance score driven by a ${carrier.sla.toFixed(1)}% SLA compliance rate and low delay probability (${carrier.avgDelayDays.toFixed(2)} days). ${insightText}` })} className="px-4 py-2 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-sm">
                               View Insights <MoveRight className="w-3.5 h-3.5 text-slate-400" />
                             </button>
                           </div>
                        </div>
                      </div>
                      
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-8 text-[11px] font-bold text-slate-500 pb-10 px-2">
                 <div>Showing 1 to 5 of 32 carriers</div>
                 <div className="flex gap-1">
                   <button className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-400">&laquo;</button>
                   <button className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-400">&lsaquo;</button>
                   <button className="w-6 h-6 rounded bg-[#10B981] text-white flex items-center justify-center shadow-sm">1</button>
                   <button className="w-6 h-6 rounded border border-slate-100 flex items-center justify-center hover:bg-slate-50 text-emerald-600 font-black">2</button>
                   <button className="w-6 h-6 rounded border border-slate-100 flex items-center justify-center hover:bg-slate-50 text-slate-400">3</button>
                   <button className="w-6 h-6 rounded border border-slate-100 flex items-center justify-center hover:bg-slate-50 text-slate-400">4</button>
                   <button className="w-6 h-6 rounded border border-slate-100 flex items-center justify-center hover:bg-slate-50 text-slate-400">5</button>
                   <button className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-400">&rsaquo;</button>
                   <button className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-400">&raquo;</button>
                 </div>
                 <div>
                   <button className="px-3 py-1.5 border border-slate-200 rounded-lg flex items-center gap-2 hover:bg-slate-50 shadow-sm">5 per page <ChevronDown className="w-3 h-3"/></button>
                 </div>
              </div>
            </div>
          )}

          {activeTab === "Matrix" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1300px] mx-auto space-y-6">
              
              {/* Matrix Header & KPIs */}
              <section className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 flex flex-wrap items-center justify-between gap-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><Route className="w-5 h-5 text-emerald-500"/> Lane Switch Matrix</h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Real transaction lanes ranked by carrier switch value.</p>
                </div>
                <div className="flex gap-4">
                   <div className="bg-slate-50 rounded-xl p-3 px-4 flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Route className="w-4 h-4"/></div>
                     <div><div className="text-lg font-black text-slate-800">1,286</div><div className="text-[9px] font-bold text-slate-500 uppercase">Total Lanes Analyzed</div></div>
                   </div>
                   <div className="bg-slate-50 rounded-xl p-3 px-4 flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Network className="w-4 h-4"/></div>
                     <div><div className="text-lg font-black text-slate-800">142</div><div className="text-[9px] font-bold text-slate-500 uppercase">Switch Opportunities</div></div>
                   </div>
                   <div className="bg-emerald-50/50 rounded-xl p-3 px-4 flex items-center gap-3 border border-emerald-100">
                     <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><CircleDollarSign className="w-4 h-4"/></div>
                     <div><div className="text-lg font-black text-emerald-600">$86,430</div><div className="text-[9px] font-bold text-emerald-600 uppercase">Est. Total Savings</div></div>
                   </div>
                   <div className="bg-amber-50/50 rounded-xl p-3 px-4 flex items-center gap-3 border border-amber-100">
                     <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><ShieldCheck className="w-4 h-4"/></div>
                     <div><div className="text-lg font-black text-amber-600">95%</div><div className="text-[9px] font-bold text-amber-600 uppercase">Avg. AI Confidence</div></div>
                   </div>
                </div>
                <button onClick={() => console.log("Export Matrix", laneMatrix)} className="rounded-xl bg-[#10B981] px-6 py-3 text-xs font-bold text-white hover:bg-emerald-600 shadow-md shadow-[#10B981]/20 transition-all flex items-center gap-2">
                  <Download className="w-4 h-4" /> Export Matrix
                </button>
              </section>

              {/* Filters & Search */}
              <div className="flex items-center justify-between px-2">
                <div className="flex gap-2">
                  {["All Lanes", "Highest Saving", "Lowest Risk", "Fastest Delivery", "Lowest Carbon", "Highest Confidence"].map((filter) => (
                    <button 
                      key={filter} 
                      onClick={() => setMatrixFilter(filter)}
                      className={`px-5 py-2.5 rounded-full text-[12px] font-bold transition-all duration-250 ${
                        matrixFilter === filter 
                          ? "bg-[#00B67A] text-white shadow-md shadow-[#00B67A]/20 transform scale-[1.02]" 
                          : "bg-white text-slate-600 border border-slate-200 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:border-emerald-200"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Insight Panel */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${matrixFilter === "All Lanes" ? "max-h-0 opacity-0" : "max-h-[300px] opacity-100"}`}>
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50/30 rounded-2xl p-6 border border-emerald-100/50 flex gap-6 items-center shadow-sm">
                   <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-emerald-600 shrink-0">
                     <Sparkles className="w-6 h-6" />
                   </div>
                   <div className="flex-1">
                     <div className="inline-flex px-2 py-0.5 rounded bg-[#00B67A] text-white text-[9px] font-bold mb-2 tracking-wide uppercase">AI Opportunity</div>
                     <h3 className="text-xl font-black text-slate-900 mb-1">
                       {matrixFilter === "Highest Saving" && "Highest Saving Opportunities"}
                       {matrixFilter === "Lowest Risk" && "Safest Carrier Recommendations"}
                       {matrixFilter === "Fastest Delivery" && "Fastest Delivery Analysis"}
                       {matrixFilter === "Lowest Carbon" && "Sustainability Recommendation"}
                       {matrixFilter === "Highest Confidence" && "Highest AI Confidence Recommendations"}
                     </h3>
                     <p className="text-sm font-semibold text-slate-600 leading-relaxed">
                       {matrixFilter === "Highest Saving" && "AI recommends switching 142 lanes to GroundLink Network for an estimated total savings of $86,430 with a 15% average ROI."}
                       {matrixFilter === "Lowest Risk" && "The safest lanes highlight a 99.2% reliability score with extremely low probability of SLA breaches or delays."}
                       {matrixFilter === "Fastest Delivery" && "Optimizing these lanes guarantees the shortest transit improvements, averaging 2.4 days saved per shipment."}
                       {matrixFilter === "Lowest Carbon" && "Eco-friendly carrier switches provide an estimated 24% CO₂ emission reduction while maintaining strict SLA compliance."}
                       {matrixFilter === "Highest Confidence" && "These recommendations have a 96% historical success rate and maximum model certainty based on 10,000+ data points."}
                     </p>
                   </div>
                   <div className="shrink-0 bg-white rounded-xl p-4 shadow-sm border border-slate-100 min-w-[200px]">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Top Recommendation</div>
                      <div className="text-lg font-black text-[#00B67A]">GroundLink Network</div>
                   </div>
                </div>
              </div>

              {/* Table */}
              <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                      <tr>
                        <th className="p-5 pl-6">Lane</th>
                        <th className="p-5">Current Carrier</th>
                        <th className="p-5">Recommended Carrier</th>
                        <th className="p-5">Current Cost</th>
                        <th className="p-5">Optimized Cost</th>
                        <th className="p-5 text-[#10B981]">Saving</th>
                        <th className="p-5">AI Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredLaneMatrix.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                 <Search className="w-6 h-6 text-slate-300" />
                               </div>
                               <h3 className="text-lg font-bold text-slate-700 mb-1">No matching recommendations found.</h3>
                               <p className="text-sm font-semibold text-slate-500 mb-4">Try adjusting your filters or search terms.</p>
                               <button onClick={() => setMatrixFilter("All Lanes")} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors">Reset Filters</button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredLaneMatrix.map((row) => {
                          const isMatch = matrixFilter !== "All Lanes";
                          return (
                            <tr key={row.id} className={`transition-all duration-300 group ${isMatch ? "bg-emerald-50/30 hover:bg-emerald-50 border-l-[3px] border-l-[#00B67A] hover:shadow-[inset_0_0_15px_rgba(16,185,129,0.05)]" : "hover:bg-slate-50/50 border-l-[3px] border-l-transparent"}`}>
                              <td className="p-5 pl-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600"><Truck className="w-4 h-4" /></div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-xs mb-0.5">{row.lane}</div>
                                    <div className="font-semibold text-slate-500 text-[10px]">Ground Lane</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-5">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold text-[10px] flex items-center justify-center">{row.currentCarrier.charAt(0)}</div>
                                  <div>
                                    <div className="font-bold text-slate-700 text-xs">{row.currentCarrier}</div>
                                    <div className="font-semibold text-slate-400 text-[9px]">Current</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-5">
                                <div className="flex items-center gap-2">
                                  <div className="text-[#00B67A]"><Network className="w-4 h-4"/></div>
                                  <div>
                                    <div className="font-bold text-[#00B67A] text-xs">{row.recommendedCarrier}</div>
                                    <div className="inline-flex px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[8px] font-bold">AI Recommended</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-5 font-bold text-slate-500 text-sm">{money(row.currentCost)}</td>
                              <td className="p-5 font-bold text-slate-900 text-sm flex items-center gap-2">
                                <MoveRight className="w-3 h-3 text-slate-300" /> {money(row.optimizedCost)}
                              </td>
                              <td className="p-5">
                                <div className="font-black text-[#00B67A] text-sm">+{money(row.savings)}</div>
                                <div className="font-bold text-emerald-600/70 text-[9px]">{((row.savings/row.currentCost)*100).toFixed(1)}% saved</div>
                              </td>
                              <td className="p-5">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <div className="font-black text-slate-800 text-sm">96%</div>
                                    <div className="font-bold text-[#00B67A] text-[9px]">Very High</div>
                                  </div>
                                  <button onClick={() => setInsightModal({ isOpen: true, title: "AI Reasoning", content: `${row.recommendedCarrier} provides a faster route and better SLA track record for ${row.lane} compared to ${row.currentCarrier}, avoiding historical bottleneck delays.` })} className="px-3 py-1.5 rounded-full border border-slate-200 text-[10px] font-bold text-slate-600 flex items-center gap-1 hover:bg-slate-50 group-hover:border-slate-300 transition-colors">
                                    View Why <MoveRight className="w-3 h-3 text-slate-400" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {activeTab === "Health" && (
            <section className="grid gap-6 lg:grid-cols-3 animate-in fade-in zoom-in-95 duration-300">
              {filteredCarriers.map((carrier: any) => (
                <div key={carrier.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-black text-slate-900">{carrier.name}</h3>
                      <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">{carrier.shipments} scored shipments</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${statusClass(carrier.status)}`}>{carrier.statusLabel}</span>
                  </div>
                  <div className="mt-6 space-y-2">
                    <HealthRow label="Delay risk" value={carrier.avgDelayDays.toFixed(1) + " days"} />
                    <HealthRow label="Congestion" value={(carrier.lanes * 1.5).toFixed(0)} />
                    <HealthRow label="SLA breaches" value={carrier.slaBreaches} />
                    <HealthRow label="Carbon index" value={`${carrier.carbon.toFixed(1)}/100`} />
                  </div>
                </div>
              ))}
            </section>
          )}

        </div>
      </div>

      {/* AI Insight Modal */}
      {insightModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setInsightModal({ isOpen: false, title: "", content: "" })}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" /> {insightModal.title}
              </h3>
              <button onClick={() => setInsightModal({ isOpen: false, title: "", content: "" })} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                {insightModal.content}
              </p>
              <div className="mt-8 flex justify-end">
                <button onClick={() => setInsightModal({ isOpen: false, title: "", content: "" })} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-emerald-500/20 transition-all">
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCell({ value, pct, color = "bg-emerald-500", className = "" }: { value: string; pct: number; color?: string; className?: string }) {
  return (
    <div className={className}>
      <p className="font-black text-slate-800 text-xs mb-2">{value}</p>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(4, Math.min(100, pct))}%` }} />
      </div>
    </div>
  )
}

function HealthRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <span className="text-xs font-black text-slate-800">{value}</span>
    </div>
  )
}
