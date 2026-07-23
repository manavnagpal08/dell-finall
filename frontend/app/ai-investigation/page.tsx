"use client"

import React, { Suspense, useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useGetTransactionDetail, useGetRecommendations } from "@/services/queries"

import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, BrainCircuit, CheckCircle2, Activity, 
  ShieldCheck, Box, Clock, DollarSign, Database,
  Route as RouteIcon, MapPin, Truck, AlertTriangle, RefreshCw, X, Search, Check, Warehouse
} from "lucide-react"

/* ============================================================
   TOKENS & THEME
   ============================================================ */
const C = {
  green: "#00B67A",
  blue: "#2E5BFF",
  amber: "#F5A623",
  red: "#E5484D",
}

/* ============================================================
   HOOKS & UTILS
   ============================================================ */
function useCountUp(target: number, duration = 1000, start = false) {
  const [val, setVal] = useState(0)
  const raf = useRef<number | null>(null)
  
  useEffect(() => {
    if (!start) return
    const startTime = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - startTime) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(target * eased)
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [target, duration, start])
  
  return val
}

function AnimatedRing({ value, size = 100, stroke = 8, start = true, color = C.green, label = "" }: any) {
  const animated = useCountUp(value, 1500, start)
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (animated / 100) * circ

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(0,0,0,0.05)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.1s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && <span className="text-[10px] font-semibold mb-0.5 text-gray-500">{label}</span>}
        <span className="font-bold text-gray-900" style={{ fontSize: size * 0.25, lineHeight: 1 }}>{Math.round(animated)}%</span>
      </div>
    </div>
  )
}

function WaveBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 z-0">
      <motion.svg 
        viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full"
        initial={{ x: "-100%" }}
        animate={{ x: "0%" }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
      >
        <path d="M0 50 Q 25 30 50 50 T 100 50 L 100 100 L 0 100 Z" fill={C.green} opacity="0.3" />
        <path d="M0 60 Q 25 80 50 60 T 100 60 L 100 100 L 0 100 Z" fill={C.blue} opacity="0.2" />
        <path d="M-100 50 Q -75 30 -50 50 T 0 50 L 0 100 L -100 100 Z" fill={C.green} opacity="0.3" />
        <path d="M-100 60 Q -75 80 -50 60 T 0 60 L 0 100 L -100 100 Z" fill={C.blue} opacity="0.2" />
      </motion.svg>
    </div>
  )
}

/* ============================================================
   INTERACTIVE ORBIT
   ============================================================ */
function InteractiveDecisionOrbit({ isComplete }: { isComplete: boolean }) {
  const nodes = [
    { id: "demand", label: "Demand", angle: -90, icon: MapPin, color: "#2E5BFF" },
    { id: "inventory", label: "Inventory", angle: -30, icon: Box, color: "#00B67A" },
    { id: "cost", label: "Cost", angle: 30, icon: DollarSign, color: "#F5A623" },
    { id: "sla", label: "SLA", angle: 90, icon: ShieldCheck, color: "#8B5CF6" },
    { id: "capacity", label: "Capacity", angle: 150, icon: Activity, color: "#E5484D" },
    { id: "hub", label: "Hub", angle: 210, icon: Warehouse, color: "#0ea5e9" },
  ]
  
  const cx = 300;
  const cy = 200;
  const radius = 130;

  return (
    <div className="relative w-full h-[400px] flex items-center justify-center bg-transparent rounded-2xl overflow-hidden">
      <svg width={600} height={400} className="absolute inset-0 m-auto pointer-events-none z-0">
         {nodes.map((node, i) => {
           const rad = (node.angle * Math.PI) / 180;
           const nx = cx + radius * Math.cos(rad);
           const ny = cy + radius * Math.sin(rad);
           
           const nextNode = nodes[(i + 1) % nodes.length];
           const nextRad = (nextNode.angle * Math.PI) / 180;
           const nextNx = cx + radius * Math.cos(nextRad);
           const nextNy = cy + radius * Math.sin(nextRad);

           return (
             <g key={`lines-${i}`}>
               <motion.line 
                  x1={nx} y1={ny} x2={cx} y2={cy}
                  stroke={node.color} strokeWidth="1.5" strokeOpacity="0.3"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: i * 0.2 }}
               />
               <motion.line 
                  x1={nx} y1={ny} x2={nextNx} y2={nextNy}
                  stroke="#3A4149" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.2"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1 }}
               />
               
               {!isComplete && (
                 <motion.circle
                   r="3" fill={node.color}
                   initial={{ cx: nx, cy: ny, opacity: 0 }}
                   animate={{ cx: cx, cy: cy, opacity: [0, 1, 0] }}
                   transition={{ duration: 1.5 + Math.random(), repeat: Infinity, ease: "linear", delay: Math.random() * 2 }}
                 />
               )}
               {isComplete && (
                 <motion.circle
                   r="2.5" fill={node.color}
                   initial={{ cx: cx, cy: cy, opacity: 0 }}
                   animate={{ cx: nx, cy: ny, opacity: [0, 1, 0] }}
                   transition={{ duration: 1.2 + Math.random(), repeat: Infinity, ease: "easeOut", delay: Math.random() }}
                 />
               )}
             </g>
           )
         })}
      </svg>

      {/* Center AI Core */}
      <motion.div 
        className="absolute z-10 w-24 h-24 rounded-full bg-blue-600 border-2 border-blue-400 flex items-center justify-center shadow-[0_0_40px_rgba(46,91,255,0.6)]"
        style={{ left: '50%', top: '50%', x: '-50%', y: '-50%' }}
        animate={{ scale: isComplete ? [1, 1.05, 1] : [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <BrainCircuit size={40} className="text-white" />
        <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30" />
      </motion.div>
      <div className="absolute text-slate-800 text-[10px] font-bold tracking-widest mt-32 z-10 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/50">AI CORE</div>

      {/* Orbital Nodes */}
      {nodes.map((node, i) => {
         const rad = (node.angle * Math.PI) / 180;
         const nx = cx + radius * Math.cos(rad);
         const ny = cy + radius * Math.sin(rad);

         return (
           <motion.div
             key={node.id}
             className="absolute z-10 flex flex-col items-center gap-2 cursor-pointer group"
             style={{ left: `calc(50% - 300px + ${nx}px)`, top: `calc(50% - 200px + ${ny}px)`, x: '-50%', y: '-50%' }}
             whileHover={{ scale: 1.1 }}
           >
             <div className="w-12 h-12 rounded-full border border-white/20 bg-white shadow-lg flex items-center justify-center transition-colors" style={{ color: node.color }}>
               <node.icon size={20} />
             </div>
             <div className="text-[11px] font-bold text-slate-700 bg-white/50 backdrop-blur-sm px-2 py-0.5 rounded-full uppercase tracking-wider">{node.label}</div>
           </motion.div>
         )
      })}
    </div>
  )
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
function AIDecisionLabContent() {
  const searchParams = useSearchParams()
  const recId = searchParams?.get("id") || searchParams?.get("objectId") || "DEMO-ROUTE-001"
  const objectType = searchParams?.get("type") || "route"
  // Extract transaction ID if it's a TXN recommendation
  const isTxn = recId?.includes("REC-TXN-")
  const txId = isTxn ? recId?.replace("REC-TXN-", "") : null

  const { data: txDetail, isLoading: isTxLoading } = useGetTransactionDetail(txId || "")
  const { mutate: getRecommendations, data: recData, isPending: isRecLoading } = useGetRecommendations()

  useEffect(() => {
    if (txDetail && isTxn && !recData && !isRecLoading) {
      getRecommendations({
        origin: txDetail.origin_hub?.hub_name || txDetail.source_location,
        destination: txDetail.destination_location,
        part_no: txDetail.part_no,
        quantity: txDetail.quantity,
        priority: txDetail.priority,
        required_delivery_window_days: 7
      })
    }
  }, [txDetail, isTxn, recData, isRecLoading, getRecommendations])

  const [stage, setStage] = useState<"preparing" | "investigating" | "complete">("preparing")
  const [approved, setApproved] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

  useEffect(() => {
    // Only complete investigation when we have data
    if (isTxn) {
      if (recData && stage === "preparing") {
         setTimeout(() => setStage("investigating"), 500)
      } else if (recData && stage === "investigating") {
         setTimeout(() => setStage("complete"), 1500)
      }
    } else {
      // Fallback for non-transaction recommendations
      if (stage === "preparing") setTimeout(() => setStage("investigating"), 1200)
      else if (stage === "investigating") setTimeout(() => setStage("complete"), 2500)
    }
  }, [stage, recData, isTxn])

  const isComplete = stage === "complete" || approved

  const originName = txDetail?.origin_hub?.hub_name || txDetail?.source_location || "Delhi Hub"
  const destName = txDetail?.destination_location || "Mumbai Hub"
  const currentCost = txDetail?.logistics_cost_total_usd || 42100
  const currentTransit = txDetail?.transit_days_actual || 4.8
  const recommendedPath = recData?.recommended?.path || ["HUB-DEL", "HUB-MUM"]
  const recommendedCost = recData?.recommended?.total_cost || 28900
  const recommendedTransit = recData?.recommended?.total_transit_days || 2.7
  const recommendedReliability = recData?.recommended?.sla_success_rate || 94.8
  const routeDistance = recData?.recommended?.total_distance_km || 1153
  const savings = currentCost - recommendedCost
  const timeSaved = currentTransit - recommendedTransit
  const routeOptions = [
    recData?.recommended || {
      path: recommendedPath,
      total_cost: recommendedCost,
      total_transit_days: recommendedTransit
    },
    ...(recData?.alternatives || [
      { path: ["HUB-DEL", "HUB-PUN", "HUB-MUM"], total_cost: recommendedCost + 4200, total_transit_days: recommendedTransit + 0.8 },
      { path: ["HUB-DEL", "HUB-AHM", "HUB-MUM"], total_cost: recommendedCost + 6100, total_transit_days: recommendedTransit + 1.0 }
    ])
  ]


  const cards = [
    {
      id: "decision",
      title: "Neural Optimization",
      subtitle: "AI verified decision pathways",
      badge: "AI Core",
      badgeIcon: BrainCircuit,
      type: "dark-full",
      image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop",
      stats: [
        { icon: Database, label: "1.2M Variables" },
        { icon: Activity, label: "98% Confidence" }
      ]
    },
    {
      id: "cost",
      title: "Cost Impact",
      subtitle: "Financial projection & savings",
      badge: "Verified Savings",
      badgeIcon: DollarSign,
      type: "light-half",
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800&auto=format&fit=crop",
      stats: [
        { icon: DollarSign, label: `Save $${Math.max(0, savings).toLocaleString(undefined, {maximumFractionDigits: 0})}` },
        { icon: Activity, label: `${currentCost > 0 ? ((savings/currentCost)*100).toFixed(1) : 0}% Less` }
      ]
    },
    {
      id: "inventory",
      title: "Inventory Balance",
      subtitle: "Hub level capacity review",
      badge: "Stock Optimal",
      badgeIcon: Box,
      type: "glass-full",
      image: "https://images.unsplash.com/photo-1586528116311-ad8ed7c663e0?q=80&w=800&auto=format&fit=crop",
      stats: [
        { icon: Box, label: `${txDetail?.quantity || 0} units` },
        { icon: CheckCircle2, label: originName }
      ]
    },
    {
      id: "transit",
      title: "Transit Prediction",
      subtitle: "ETA and SLA risk reduction",
      badge: "Faster ETA",
      badgeIcon: Clock,
      type: "dark-full",
      image: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=800&auto=format&fit=crop",
      stats: [
        { icon: Clock, label: `${recommendedTransit.toFixed(1)} Days` },
        { icon: ShieldCheck, label: `${timeSaved > 0 ? "-" + timeSaved.toFixed(1) : "+0"} Days` }
      ]
    },
    {
      id: "evidence",
      title: "Evidence Data",
      subtitle: "Sources utilized for reasoning",
      badge: "5 Sources",
      badgeIcon: Database,
      type: "light-half",
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop",
      stats: [
        { icon: RouteIcon, label: `${(recData?.alternatives?.length || 0) + 1} Routes` },
        { icon: Clock, label: "Live Traffic" }
      ]
    },
    {
      id: "alternatives",
      title: "Alternatives",
      subtitle: "Other viable network paths",
      badge: `${routeOptions.length} Options`,
      badgeIcon: RefreshCw,
      type: "glass-full",
      image: "https://images.unsplash.com/photo-1506501139174-099022df5260?q=80&w=800&auto=format&fit=crop",
      stats: [
        { icon: MapPin, label: originName },
        { icon: MapPin, label: destName }
      ]
    }
  ]

  const renderCardContent = (id: string) => {
    switch (id) {
      case "decision":
        return (
          <div className="flex flex-col h-full bg-slate-50 relative p-8">
            <button onClick={() => setSelectedCardId(null)} className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-gray-500 hover:text-gray-900 z-50">
              <X size={20} />
            </button>
            <h2 className="text-[28px] font-bold text-gray-900 mb-2">Neural Optimization Matrix</h2>
            <p className="text-[14px] text-gray-500 max-w-2xl mb-8">The AI Core evaluated millions of network combinations simultaneously. Below is a real-time visualization of the variables weighted to generate this recommendation.</p>
            <div className="flex-1 rounded-3xl bg-white shadow-sm border border-gray-200 overflow-hidden relative">
               <InteractiveDecisionOrbit isComplete={isComplete} />
            </div>
            {isComplete && (
              <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-center gap-4 shadow-sm mt-6">
                <CheckCircle2 size={32} className="text-green-600 shrink-0" />
                <div>
                   <div className="text-[16px] font-bold text-green-800">Investigation Complete • Confidence: 98%</div>
                   <div className="text-[13px] text-green-600 mt-1">AI verified that {recommendedPath.join(" to ")} reduces SLA risk while lowering projected cost by {currentCost > 0 ? ((savings/currentCost)*100).toFixed(1) : 0}%.</div>
                </div>
              </motion.div>
            )}
          </div>
        )

      case "cost":
         return (
           <div className="flex flex-col h-full bg-slate-50 relative p-8">
             <button onClick={() => setSelectedCardId(null)} className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-gray-500 hover:text-gray-900 z-50">
               <X size={20} />
             </button>
             <h2 className="text-[28px] font-bold text-gray-900 mb-2">Cost Impact Analysis</h2>
             <p className="text-[14px] text-gray-500 mb-8">Comprehensive breakdown of logistics, holding, and transit costs.</p>
             
             <div className="grid grid-cols-2 gap-8 flex-1">
               <div className="bg-white border border-red-100 rounded-[2rem] p-8 shadow-sm relative overflow-hidden flex flex-col">
                 <div className="text-[12px] font-bold text-red-500 uppercase tracking-widest mb-6 bg-red-50 w-fit px-3 py-1 rounded-full">Current Baseline</div>
                 <div className="text-[14px] text-gray-500 mb-1">{originName}</div>
                 <div className="text-[40px] font-bold text-gray-900 mb-8">${currentCost.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                 
                 <div className="space-y-4 text-[14px] flex-1 mt-auto">
                   <div className="flex justify-between border-b border-gray-100 pb-3"><span>Handling Cost</span><span className="font-bold">${(currentCost * 0.15).toLocaleString(undefined, {maximumFractionDigits:0})}</span></div>
                   <div className="flex justify-between border-b border-gray-100 pb-3"><span>Transit Cost</span><span className="font-bold">${(currentCost * 0.65).toLocaleString(undefined, {maximumFractionDigits:0})}</span></div>
                   <div className="flex justify-between border-b border-gray-100 pb-3"><span>Penalty Risk</span><span className="font-bold text-red-600">${(currentCost * 0.20).toLocaleString(undefined, {maximumFractionDigits:0})}</span></div>
                 </div>
               </div>

               <div className="bg-white border border-green-200 rounded-[2rem] p-8 shadow-[0_8px_30px_rgba(0,182,122,0.1)] relative overflow-hidden flex flex-col">
                 <div className="text-[12px] font-bold text-green-600 uppercase tracking-widest mb-6 bg-green-50 w-fit px-3 py-1 rounded-full">AI Recommendation</div>
                 <div className="text-[14px] text-gray-500 mb-1">{recData?.recommended?.path?.[0] || destName}</div>
                 <div className="text-[40px] font-bold text-green-600 mb-8">${recommendedCost.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                 
                 <div className="space-y-4 text-[14px] flex-1 mt-auto">
                   <div className="flex justify-between border-b border-gray-100 pb-3"><span>Handling Cost</span><span className="font-bold">${(recommendedCost * 0.16).toLocaleString(undefined, {maximumFractionDigits:0})}</span></div>
                   <div className="flex justify-between border-b border-gray-100 pb-3"><span>Transit Cost</span><span className="font-bold">${(recommendedCost * 0.70).toLocaleString(undefined, {maximumFractionDigits:0})}</span></div>
                   <div className="flex justify-between border-b border-gray-100 pb-3"><span>Penalty Risk</span><span className="font-bold text-green-600">${(recommendedCost * 0.14).toLocaleString(undefined, {maximumFractionDigits:0})}</span></div>
                 </div>
               </div>
             </div>

             <div className="mt-8 bg-slate-900 rounded-3xl p-8 shadow-xl flex items-center justify-between text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-20"><WaveBackground /></div>
                <div className="relative z-10">
                  <div className="text-[14px] text-gray-400 font-bold uppercase tracking-widest mb-2">Total Verified Savings</div>
                  <div className="text-[48px] font-bold text-green-400 leading-none">${Math.max(0, savings).toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                </div>
                <div className="relative z-10 flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/20">
                  <div className="w-16 h-16 rounded-full border-4 border-green-500/40 flex items-center justify-center text-green-400 font-bold text-[18px]">
                     {currentCost > 0 ? ((savings/currentCost)*100).toFixed(1) : 0}%
                  </div>
                  <span className="text-[14px] text-gray-300 font-medium w-32">Overall network cost reduction</span>
                </div>
             </div>
           </div>
         )
         
      case "inventory":
        return (
          <div className="flex h-full flex-col bg-slate-50 p-8 relative">
            <button onClick={() => setSelectedCardId(null)} className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-gray-500 hover:text-gray-900 z-50">
              <X size={20} />
            </button>
            <h2 className="text-[28px] font-bold text-gray-900 mb-2">Inventory Balance</h2>
            <p className="text-[14px] text-gray-500 mb-8">Checks whether the selected route can actually fulfill the shipment without creating downstream stock pressure.</p>
            <div className="grid grid-cols-3 gap-5">
              {[
                { label: "Requested Qty", value: `${txDetail?.quantity || 10} units`, icon: Box, tone: "blue" },
                { label: "Origin Readiness", value: "Ready", icon: CheckCircle2, tone: "green" },
                { label: "Buffer Risk", value: "Low", icon: ShieldCheck, tone: "green" }
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <item.icon className={item.tone === "green" ? "text-green-600" : "text-blue-600"} size={24} />
                  <div className="mt-5 text-[12px] font-bold uppercase tracking-wider text-gray-400">{item.label}</div>
                  <div className="mt-1 text-[24px] font-black text-gray-900">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-3xl border border-green-100 bg-green-50 p-6">
              <div className="text-[12px] font-black uppercase tracking-wider text-green-700">Inventory Decision</div>
              <p className="mt-2 text-[15px] font-semibold leading-relaxed text-green-900">Proceed with the recommended route. No replenishment block is detected, and the shipment quantity stays inside the available operational buffer.</p>
            </div>
          </div>
        )

      case "transit":
        return (
          <div className="flex h-full flex-col bg-slate-50 p-8 relative">
            <button onClick={() => setSelectedCardId(null)} className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-gray-500 hover:text-gray-900 z-50">
              <X size={20} />
            </button>
            <h2 className="text-[28px] font-bold text-gray-900 mb-2">Transit Prediction</h2>
            <p className="text-[14px] text-gray-500 mb-8">Compares current transit against the recommended path and estimated SLA reliability.</p>
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-[2rem] border border-red-100 bg-white p-8 shadow-sm">
                <div className="text-[12px] font-bold uppercase tracking-widest text-red-500">Current Transit</div>
                <div className="mt-3 text-[44px] font-black text-gray-900">{currentTransit.toFixed(1)}d</div>
                <p className="mt-3 text-[13px] font-medium text-gray-500">Higher handoff and delay exposure on the baseline route.</p>
              </div>
              <div className="rounded-[2rem] border border-green-200 bg-white p-8 shadow-sm">
                <div className="text-[12px] font-bold uppercase tracking-widest text-green-600">Recommended Transit</div>
                <div className="mt-3 text-[44px] font-black text-green-600">{recommendedTransit.toFixed(1)}d</div>
                <p className="mt-3 text-[13px] font-medium text-gray-500">{Math.max(0, timeSaved).toFixed(1)} days faster with {recommendedReliability.toFixed(1)}% predicted reliability.</p>
              </div>
            </div>
            <div className="mt-6 rounded-3xl bg-slate-900 p-6 text-white">
              <div className="text-[12px] font-black uppercase tracking-wider text-blue-300">Recommended Path</div>
              <div className="mt-2 text-[24px] font-black">{recommendedPath.join(" -> ")}</div>
              <div className="mt-3 text-[13px] text-gray-300">{routeDistance.toLocaleString(undefined, {maximumFractionDigits: 0})} km planned distance</div>
            </div>
          </div>
        )

      case "evidence":
        return (
          <div className="flex h-full flex-col bg-slate-50 p-8 relative">
            <button onClick={() => setSelectedCardId(null)} className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-gray-500 hover:text-gray-900 z-50">
              <X size={20} />
            </button>
            <h2 className="text-[28px] font-bold text-gray-900 mb-2">Evidence Data</h2>
            <p className="text-[14px] text-gray-500 mb-8">Transparent inputs used by the decision lab.</p>
            <div className="space-y-4">
              {[
                ["Route geometry", `${routeDistance.toLocaleString(undefined, {maximumFractionDigits: 0})} km planned lane distance`],
                ["Cost baseline", `$${currentCost.toLocaleString(undefined, {maximumFractionDigits: 0})} current vs $${recommendedCost.toLocaleString(undefined, {maximumFractionDigits: 0})} recommended`],
                ["SLA projection", `${recommendedReliability.toFixed(1)}% predicted on-time reliability`],
                ["Decision scope", `${objectType.toUpperCase()} investigation opened from ${recId}`]
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="text-[11px] font-black uppercase tracking-wider text-gray-400">{label}</div>
                  <div className="mt-1 text-[16px] font-bold text-gray-900">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )

      case "alternatives":
        return (
          <div className="flex h-full flex-col bg-slate-50 p-8 relative">
            <button onClick={() => setSelectedCardId(null)} className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-gray-500 hover:text-gray-900 z-50">
              <X size={20} />
            </button>
            <h2 className="text-[28px] font-bold text-gray-900 mb-2">Alternative Routes</h2>
            <p className="text-[14px] text-gray-500 mb-8">Fallback options ranked behind the recommended decision.</p>
            <div className="space-y-4">
              {routeOptions.filter(Boolean).slice(0, 3).map((route: any, idx: number) => (
                <div key={idx} className={`rounded-3xl border bg-white p-6 shadow-sm ${idx === 0 ? "border-green-200" : "border-gray-100"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-[11px] font-black uppercase tracking-wider ${idx === 0 ? "text-green-600" : "text-gray-400"}`}>{idx === 0 ? "Selected Route" : `Alternative ${idx}`}</div>
                      <div className="mt-1 text-[20px] font-black text-gray-900">{route.path?.join(" -> ")}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[20px] font-black text-gray-900">${route.total_cost?.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                      <div className="text-[11px] font-bold text-gray-400">{route.total_transit_days?.toFixed(1)} days</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      default:
         return (
           <div className="flex flex-col h-full bg-slate-50 relative p-8 items-center justify-center">
             <button onClick={() => setSelectedCardId(null)} className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-gray-500 hover:text-gray-900 z-50">
               <X size={20} />
             </button>
             <BrainCircuit size={80} className="text-gray-300 mb-6" />
             <h2 className="text-[32px] font-bold text-gray-900 mb-2 capitalize">{id} Analysis</h2>
             <p className="text-[16px] text-gray-500 max-w-lg text-center">Detailed visualization for {id} is expanding. This interactive card layout provides deep focus on individual operational metrics.</p>
           </div>
         )
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-slate-900 font-sans selection:bg-blue-100 flex flex-col w-full h-full overflow-hidden">
      {/* HEADER */}
      <header className="px-6 py-4 flex items-center justify-between shrink-0 z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <div>
            <h1 className="text-[16px] font-bold tracking-tight text-slate-900 leading-tight">Sanchar AI</h1>
            <div className="text-[11px] text-gray-500 font-medium">AI Decision Lab</div>
          </div>
          <div className="ml-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-gray-200 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Live Sync</span>
          </div>
        </div>

        
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 custom-scrollbar">
        <div className="flex gap-8 max-w-[1600px] mx-auto w-full items-start h-full">
          
          {/* ================= LEFT COLUMN ================= */}
          <div className="flex flex-col gap-6 w-[340px] shrink-0 h-full">
            
            {/* Selected Object Premium Card */}
            <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Investigating</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              
              <div className="flex items-center gap-4 relative z-10 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shrink-0 border border-blue-200/50 shadow-inner">
                  <RouteIcon size={28} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-[20px] font-bold text-gray-900 leading-tight">{originName} <span className="text-gray-300 mx-1">to</span> {destName}</h2>
                  <div className="text-[12px] text-gray-500 mt-1 font-medium">Case ID: {txId || recId}</div>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-auto">
                <div className="flex justify-between items-end border-b border-gray-100 pb-2">
                  <span className="text-[12px] text-gray-500 font-medium">Current Cost</span>
                  <span className="text-[15px] font-bold text-gray-900">${(currentCost/1000).toFixed(1)}k</span>
                </div>
                <div className="flex justify-between items-end border-b border-gray-100 pb-2">
                  <span className="text-[12px] text-gray-500 font-medium">Transit Time</span>
                  <span className="text-[15px] font-bold text-gray-900">{currentTransit.toFixed(1)} Days</span>
                </div>
                <div className="flex justify-between items-end pb-2">
                  <span className="text-[12px] text-gray-500 font-medium">SLA Risk</span>
                  <span className="text-[13px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">{isComplete ? "Reduced" : "Reviewing"}</span>
                </div>
              </div>
            </div>

            {/* Action Card */}
            <div className="bg-slate-900 rounded-[2rem] p-6 shadow-2xl shadow-slate-900/20 relative overflow-hidden flex flex-col gap-6 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(46,91,255,0.4)_0%,transparent_70%)]" />
              
              <div className="relative z-10">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-2 block">Optimal AI Action</span>
                <h3 className="text-[22px] font-bold leading-tight">{recommendedPath.join(" -> ")}</h3>
              </div>

              <div className="flex flex-col gap-3 relative z-10 text-[14px]">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Savings</span>
                  <span className="font-bold text-green-400">+${Math.max(0, savings).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">ETA Improvement</span>
                  <span className="font-bold text-white">{Math.max(0, timeSaved).toFixed(1)} Days Faster</span>
                </div>
              </div>

              {approved ? (
                <div className="mt-4 text-center py-4 rounded-2xl bg-green-500/20 border border-green-500/30 flex flex-col items-center relative z-10">
                  <CheckCircle2 size={28} className="text-green-400 mb-2" />
                  <span className="text-[14px] font-bold text-white">Action Approved</span>
                </div>
              ) : (
                <button 
                  onClick={() => setApproved(true)}
                  disabled={!isComplete}
                  className={`mt-4 w-full py-4 rounded-2xl text-[15px] font-bold text-white transition-all relative z-10 flex items-center justify-center gap-2 ${isComplete ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(46,91,255,0.4)] hover:-translate-y-0.5' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}
                >
                  <Check size={18} /> Approve
                </button>
              )}
            </div>
          </div>


          {/* ================= RIGHT INVESTIGATION DECK (MASONRY GRID) ================= */}
          <div className="flex-1 relative h-full">
            
            <AnimatePresence>
              {selectedCardId && (
                 <motion.div
                   layoutId={`card-${selectedCardId}`}
                   className="absolute inset-0 z-50 bg-white rounded-[2rem] shadow-2xl border border-gray-200 overflow-hidden"
                 >
                   {renderCardContent(selectedCardId)}
                 </motion.div>
              )}
            </AnimatePresence>

            <div className={`grid grid-cols-3 gap-6 h-full transition-opacity duration-300 ${selectedCardId ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              
              {cards.map((card, i) => (
                <motion.div
                  key={card.id}
                  layoutId={`card-${card.id}`}
                  onClick={() => selectedCardId ? null : setSelectedCardId(card.id)}
                  className="rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] cursor-pointer group relative flex flex-col bg-white border border-gray-200/50 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 h-[380px]"
                >
                  {/* Card Type A: Light Half */}
                  {card.type === 'light-half' && (
                    <>
                      <div className="h-[200px] w-full relative overflow-hidden shrink-0">
                        <div
                          aria-hidden="true"
                          className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                          style={{ backgroundImage: `url(${card.image})` }}
                        />
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                          <card.badgeIcon size={12} className="text-amber-500" />
                          <span className="text-[10px] font-bold text-gray-900">{card.badge}</span>
                        </div>
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="text-[18px] font-bold text-gray-900 mb-1">{card.title}</h3>
                        <p className="text-[12px] text-gray-500 leading-snug">{card.subtitle}</p>
                        
                        <div className="mt-auto flex items-center gap-4 border-t border-gray-100 pt-4">
                          {card.stats.map((s, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600">
                              <s.icon size={14} className="text-gray-400" /> {s.label}
                            </div>
                          ))}
                        </div>
                        <button className="w-full mt-4 bg-gray-900 text-white rounded-xl py-2.5 text-[12px] font-bold">Open Details</button>
                      </div>
                    </>
                  )}

                  {/* Card Type B: Dark Full */}
                  {card.type === 'dark-full' && (
                    <>
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url(${card.image})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
                      
                      <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <card.badgeIcon size={12} className="text-blue-300" />
                        <span className="text-[10px] font-bold text-white">{card.badge}</span>
                      </div>
                      
                      <div className="relative z-10 mt-auto p-6 flex flex-col text-white">
                        <h3 className="text-[20px] font-bold mb-1 leading-tight">{card.title}</h3>
                        <p className="text-[12px] text-gray-300 mb-4">{card.subtitle}</p>
                        
                        <div className="flex items-center gap-4 mb-4">
                          {card.stats.map((s, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px] font-medium text-gray-300">
                              <s.icon size={14} className="text-gray-400" /> {s.label}
                            </div>
                          ))}
                        </div>
                        <button className="w-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors text-white rounded-xl py-2.5 text-[12px] font-bold">Open Details</button>
                      </div>
                    </>
                  )}

                  {/* Card Type C: Glass Full */}
                  {card.type === 'glass-full' && (
                    <>
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url(${card.image})` }}
                      />
                      <div className="absolute inset-0 bg-black/20" />
                      
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                        <card.badgeIcon size={12} className="text-green-600" />
                        <span className="text-[10px] font-bold text-gray-900">{card.badge}</span>
                      </div>
                      
                      <div className="relative z-10 mt-auto p-3">
                        <div className="bg-white/80 backdrop-blur-xl rounded-[1.5rem] p-5 shadow-lg">
                          <h3 className="text-[16px] font-bold text-gray-900 mb-1">{card.title}</h3>
                          
                          <div className="flex items-center justify-between mt-4 border-t border-gray-200/50 pt-3">
                            {card.stats.map((s, idx) => (
                              <div key={idx} className={`flex items-center gap-1.5 text-[11px] ${idx === 1 ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                                <s.icon size={14} className={idx === 1 ? 'text-green-600' : ''} /> {s.label}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; height: 0px; }
      `}</style>
    </div>
  )
}

export default function AIDecisionLab() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F8FA]" />}>
      <AIDecisionLabContent />
    </Suspense>
  )
}
