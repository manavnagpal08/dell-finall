"use client"

import React, { useState, useEffect } from "react"
import { useGetHubs, useGetParts, useGetRecommendations } from "@/services/queries"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, MapPin, Truck, ShieldCheck, Clock, Play,
  Edit3, Pause, RotateCcw, ChevronDown, Calendar,
  Map as MapIcon, ArrowRight, Activity, Maximize, AlertCircle, Sparkles, RefreshCw
} from "lucide-react"

/* ============================================================
   SVG MAP SIMULATION COMPONENT
   ============================================================ */
function RouteSimulationMap({ route, originName, destName, hubs, isPlaying, togglePlay }: any) {
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const pathNodes = route?.path?.length ? route.path : []
  const routeKey = pathNodes.join("|")
  const hubById = new Map((hubs || []).map((hub: any) => [hub.hub_id, hub]))
  const routePoints = React.useMemo(() => {
    if (!pathNodes.length) return []
    const geoNodes = pathNodes.map((id: string, index: number) => {
      const hub: any = hubById.get(id)
      const lat = Number(hub?.latitude)
      const lon = Number(hub?.longitude)
      return {
        id,
        label: hub?.hub_name || id,
        lat: Number.isFinite(lat) ? lat : null,
        lon: Number.isFinite(lon) ? lon : null,
        index,
      }
    })
    const valid = geoNodes.filter((node: any) => node.lat !== null && node.lon !== null)
    if (valid.length >= 2) {
      const minLat = Math.min(...valid.map((node: any) => node.lat))
      const maxLat = Math.max(...valid.map((node: any) => node.lat))
      const minLon = Math.min(...valid.map((node: any) => node.lon))
      const maxLon = Math.max(...valid.map((node: any) => node.lon))
      const latRange = Math.max(1, maxLat - minLat)
      const lonRange = Math.max(1, maxLon - minLon)
      return geoNodes.map((node: any) => {
        if (node.lat === null || node.lon === null) {
          const ratio = geoNodes.length === 1 ? 0.5 : node.index / (geoNodes.length - 1)
          return { ...node, x: 88 + ratio * 224, y: 370 - ratio * 240 }
        }
        return {
          ...node,
          x: 88 + ((node.lon - minLon) / lonRange) * 224,
          y: 370 - ((node.lat - minLat) / latRange) * 240,
        }
      })
    }
    return geoNodes.map((node: any) => {
      const ratio = geoNodes.length === 1 ? 0.5 : node.index / (geoNodes.length - 1)
      return { ...node, x: 88 + ratio * 224, y: 370 - ratio * 240 }
    })
  }, [hubs, routeKey])
  const routePathD = React.useMemo(() => {
    if (routePoints.length < 2) return "M 200 100 Q 280 250 180 400"
    if (routePoints.length === 2) {
      const [first, last] = routePoints
      const controlX = (first.x + last.x) / 2 + 52
      const controlY = (first.y + last.y) / 2 - 32
      return `M ${first.x.toFixed(1)} ${first.y.toFixed(1)} Q ${controlX.toFixed(1)} ${controlY.toFixed(1)} ${last.x.toFixed(1)} ${last.y.toFixed(1)}`
    }
    return routePoints.reduce((path: string, point: any, index: number) => {
      if (index === 0) return `M ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
      return `${path} L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
    }, "")
  }, [routePoints])
  const currentPathD = React.useMemo(() => {
    if (routePoints.length < 2) return "M 200 100 Q 120 250 180 400"
    const first = routePoints[0]
    const last = routePoints[routePoints.length - 1]
    const controlX = (first.x + last.x) / 2 - 48
    const controlY = (first.y + last.y) / 2 + 34
    return `M ${first.x.toFixed(1)} ${first.y.toFixed(1)} Q ${controlX.toFixed(1)} ${controlY.toFixed(1)} ${last.x.toFixed(1)} ${last.y.toFixed(1)}`
  }, [routePoints])

  useEffect(() => {
    if (!isPlaying) return
    let timer: any;
    if (step === 0) timer = setTimeout(() => setStep(1), 500) // Show map
    else if (step === 1) timer = setTimeout(() => setStep(2), 1500) // Draw current route
    else if (step === 2) timer = setTimeout(() => setStep(3), 800) // Fade old route
    else if (step === 3) timer = setTimeout(() => setStep(4), 500) // Draw new route
    else if (step === 4) {
      // Progress animation
      let p = 0;
      const interval = setInterval(() => {
        p += 1.5; // Slightly slower for smoothness
        setProgress(p)
        if (p >= 100) {
          clearInterval(interval)
          setStep(5) // Finished
          if (togglePlay) togglePlay(false) // Auto pause when done
        }
      }, 40)
      return () => clearInterval(interval)
    }
    return () => clearTimeout(timer)
  }, [step, isPlaying, togglePlay])

  useEffect(() => {
    if (!route) {
      setStep(0)
      setProgress(0)
      if (togglePlay) togglePlay(false)
      return
    }
    setStep(0)
    setProgress(0)
    if (togglePlay) togglePlay(true)
  }, [route, togglePlay])

  return (
    <div className="relative w-full h-full min-h-[500px] bg-[#E9EBEF] rounded-[20px] overflow-hidden border border-gray-200 shadow-sm flex flex-col">
      {/* Header inside map */}
      <div className="flex items-center justify-between px-5 py-3 bg-white/90 backdrop-blur-md border-b border-gray-100 z-10">
        <div className="flex items-center gap-2">
          <MapIcon size={16} className="text-emerald-600" />
          <span className="text-[13px] font-bold text-gray-800">Route Simulation</span>
        </div>
        <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-full border border-green-100">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-green-700">Live Navigation</span>
        </div>
      </div>

      <div className="relative flex-1 bg-[#F1F3F4]">
        {/* Map Background Pattern (Simulating Google Maps roads) */}
        <div className="absolute inset-0 opacity-30" style={{ 
          backgroundImage: 'linear-gradient(#fff 2px, transparent 2px), linear-gradient(90deg, #fff 2px, transparent 2px), linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
          backgroundPosition: '-2px -2px, -2px -2px, -1px -1px, -1px -1px'
        }} />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        
        {!route && (
          <div className="absolute inset-0 z-20 flex items-center justify-center px-8 text-center">
            <div className="rounded-2xl border border-emerald-100 bg-white/90 px-6 py-5 shadow-sm">
              <MapIcon size={28} className="mx-auto mb-3 text-emerald-600" />
              <div className="text-sm font-black text-slate-900">Ready for live route discovery</div>
              <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
                Select real origin, destination, part, quantity, and priority to generate ranked route options from the backend.
              </p>
            </div>
          </div>
        )}

        {/* SVG Drawing Layer */}
        {route && <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 400 500">
          <defs>
            {/* Traffic Gradient for AI Route */}
            <linearGradient id="trafficGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="40%" stopColor="#10B981" />
              <stop offset="45%" stopColor="#F4B400" />
              <stop offset="55%" stopColor="#F4B400" />
              <stop offset="60%" stopColor="#10B981" />
              <stop offset="85%" stopColor="#10B981" />
              <stop offset="90%" stopColor="#EA4335" />
              <stop offset="100%" stopColor="#EA4335" />
            </linearGradient>
            
            {/* Drop Shadow for markers */}
            <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Current route baseline */}
          <AnimatePresence>
            {step >= 1 && step < 3 && (
              <motion.path 
                initial={{ pathLength: 0, opacity: 1 }} 
                animate={{ pathLength: 1, opacity: 1 }} 
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                d={currentPathD} fill="none" stroke="#9AA0A6" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" 
              />
            )}
            {step >= 3 && (
              <motion.path 
                initial={{ opacity: 1 }} 
                animate={{ opacity: 0.3 }} 
                d={currentPathD} fill="none" stroke="#9AA0A6" strokeWidth="8" strokeLinecap="round" 
              />
            )}
          </AnimatePresence>
          
          {/* AI Recommended Route (Thick Google Maps Blue with traffic) */}
          <AnimatePresence>
            {step >= 3 && (
              <>
                {/* Thick route border */}
                <motion.path 
                  initial={{ pathLength: 0 }} 
                  animate={{ pathLength: 1 }} 
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  d={routePathD} fill="none" stroke="#047857" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"
                />
                {/* Inner traffic gradient */}
                <motion.path 
                  initial={{ pathLength: 0 }} 
                  animate={{ pathLength: 1 }} 
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  d={routePathD} fill="none" stroke="url(#trafficGradient)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
                />
              </>
            )}
          </AnimatePresence>
          
          {/* Nodes & Pins */}
          <AnimatePresence>
            {step >= 1 && (
              <>
                {routePoints.map((point: any, index: number) => {
                  const isStart = index === 0
                  const isEnd = index === routePoints.length - 1
                  const label = isStart ? originName : isEnd ? destName : point.label
                  return (
                    <motion.g key={`${point.id}-${index}`} initial={{ scale: 0 }} animate={{ scale: 1 }} transform={`translate(${point.x}, ${point.y})`} filter="url(#drop-shadow)">
                      <rect x="-44" y="-32" width="88" height="18" rx="5" fill={isEnd ? "#FEE2E2" : isStart ? "#D1FAE5" : "#FFFFFF"} opacity="0.96" />
                      <text x="0" y="-19" fontSize="8" fontWeight="bold" fill={isEnd ? "#DC2626" : "#047857"} textAnchor="middle">{label || point.id}</text>
                      {isEnd ? (
                        <>
                          <path d="M0 -24C-6.6 -24 -12 -18.6 -12 -12C-12 -3 -0 12 -0 12C0 12 12 -3 12 -12C12 -18.6 6.6 -24 0 -24Z" fill="#EA4335" />
                          <circle cy="-12" r="3" fill="white" />
                        </>
                      ) : (
                        <>
                          <circle r="10" fill="white" />
                          <circle r={isStart ? 7 : 6} fill={isStart ? "#10B981" : "#F4B400"} />
                        </>
                      )}
                    </motion.g>
                  )
                })}
                
                {/* Old Route Midpoint Tooltip */}
                {step < 3 && (
                  <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ opacity: 0 }} transform="translate(120, 250)">
                    <rect x="-35" y="-12" width="70" height="24" rx="4" fill="#5F6368" filter="url(#drop-shadow)" />
                    <text x="0" y="4" fontSize="11" fontWeight="bold" fill="white" textAnchor="middle">{route?.est_transit_days ? (route.est_transit_days * 1.5).toFixed(1) : 4}d</text>
                  </motion.g>
                )}
                
                {/* New Route Midpoint Tooltip (Traffic warning) */}
                {step >= 3 && (
                  <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transform="translate(260, 230)">
                    {/* Red tooltip box */}
                    <rect x="-10" y="-30" width="100" height="40" rx="4" fill="#EA4335" filter="url(#drop-shadow)" />
                    {/* Tooltip pointer */}
                    <path d="M -10 -10 L -18 0 L -10 10 Z" fill="#EA4335" transform="translate(15, -10) rotate(90)" />
                    <text x="12" y="-15" fontSize="13" fontWeight="bold" fill="white">{route?.est_transit_days?.toFixed(1) || 2}d</text>
                    <text x="12" y="2" fontSize="9" fill="white">Heavy traffic</text>
                    <circle cx="0" cy="-10" r="1" fill="white" opacity="0" />
                  </motion.g>
                )}
              </>
            )}
          </AnimatePresence>

          {/* Truck / Navigation Arrow Animation */}
          {step >= 4 && (
            <motion.g 
              style={{ 
                offsetPath: `path('${routePathD}')`,
                offsetDistance: `${progress}%`,
                rotate: 'auto'
              }}
              filter="url(#drop-shadow)"
            >
              {/* Navigation Arrow instead of truck to look more like Google Maps */}
              <circle r="14" fill="white" />
              <path d="M-6 -6 L10 0 L-6 6 L-2 0 Z" fill="#10B981" transform="rotate(-90)" />
            </motion.g>
          )}
        </svg>}

        {/* Floating Google Maps style ETA pill */}
        <AnimatePresence>
          {route && step >= 3 && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
               <div className="bg-[#059669] text-white px-4 py-2 rounded-full shadow-lg text-[16px] font-medium flex items-center gap-2 border-2 border-white">
                 <span>{(route?.est_transit_days * 24).toFixed(0)} hrs transit</span>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zoom Controls Right */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md border border-gray-100 flex flex-col z-20 overflow-hidden">
          <button className="p-2.5 border-b border-gray-100 hover:bg-gray-50 text-gray-700 font-bold">+</button>
          <button className="p-2.5 border-b border-gray-100 hover:bg-gray-50 text-gray-700 font-bold">-</button>
          <button className="p-2.5 hover:bg-gray-50 text-gray-700"><MapPin size={16} /></button>
        </div>
      </div>

      {/* Playback Controls Area */}
      <div className="bg-white px-5 py-4 border-t border-gray-100 z-20 shrink-0">
         <div className="bg-[#F8F9FA] rounded-[16px] p-4 flex flex-col gap-4 border border-gray-200/60 shadow-sm">
            {/* Confidence Score Bar */}
            <div className="flex items-center gap-4">
              <div className="w-24">
                <span className="text-[10px] font-bold text-gray-500 block">Confidence Score</span>
                <span className="text-[20px] font-black text-gray-900">{route?.confidence_score?.toFixed(0) || 0}%</span>
              </div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden relative">
                <motion.div initial={{ width: 0 }} animate={{ width: `${route?.confidence_score || 0}%` }} transition={{ duration: 1, delay: 0.5 }} className="absolute h-full bg-[#059669] rounded-full" />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button onClick={() => togglePlay(!isPlaying)} className="w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center hover:bg-emerald-700 shadow-md transition-colors shrink-0">
                {isPlaying && step < 5 ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>
              
              <div className="flex-1 relative h-6 flex items-center">
                 <div className="absolute w-full h-1 bg-gray-200 rounded-full" />
                 <div className="absolute h-1 bg-[#059669] rounded-full transition-all duration-75" style={{ width: `${progress}%` }} />
                 <div className="absolute w-3 h-3 bg-white border-2 border-[#059669] rounded-full shadow-sm cursor-pointer transition-all duration-75" style={{ left: `${progress}%`, transform: 'translateX(-50%)' }} />
              </div>

              <div className="text-[9px] font-bold text-gray-500 flex flex-col items-end shrink-0 w-16">
                 <span>1.5x</span>
                 <span>Speed</span>
              </div>
              <button onClick={() => { setStep(0); setProgress(0); togglePlay(true); }} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <RotateCcw size={16} />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Maximize size={16} />
              </button>
            </div>
         </div>
      </div>
    </div>
  )
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function RecommendationsPage() {
  // API Hooks
  const { data: hubsData } = useGetHubs({ page: 1, limit: 100 })
  const hubs = hubsData?.items || []
  const { data: partsData } = useGetParts({ page: 1, limit: 100 })
  const parts = partsData?.items || []
  const { mutate: getRecommendations, data: recData, isPending: loading } = useGetRecommendations()

  // Form State
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [partNo, setPartNo] = useState("")
  const [quantity, setQuantity] = useState(10)
  const [priority, setPriority] = useState("P1")
  const [deliveryWindow, setDeliveryWindow] = useState(7)
  const [message, setMessage] = useState("")
  
  // Simulation State
  const [isPlaying, setIsPlaying] = useState(true)
  const [replayKey, setReplayKey] = useState(0)
  const [simulatingRouteIndex, setSimulatingRouteIndex] = useState<number>(0)

  useEffect(() => {
    if (!origin && hubs[0]) setOrigin(hubs[0].hub_id)
    if (!destination && hubs[1]) setDestination(hubs[1].hub_id)
    if (!partNo && parts[0]) setPartNo(parts[0].part_no)
  }, [destination, hubs, origin, partNo, parts])

  const originHub = hubs.find((hub: any) => hub.hub_id === origin)
  const destinationHub = hubs.find((hub: any) => hub.hub_id === destination)
  const selectedPart = parts.find((part: any) => part.part_no === partNo)

  const handleGenerate = () => {
    setMessage("")
    if (!origin || !destination || !partNo) {
      setMessage("Select origin, destination, and part before generating route options.")
      return
    }
    if (origin === destination) {
      setMessage("Origin and destination must be different for route discovery.")
      return
    }
    setSimulatingRouteIndex(0)

    getRecommendations({
      origin,
      destination,
      part_no: partNo,
      quantity: quantity,
      priority: priority,
      required_delivery_window_days: deliveryWindow
    })
  }

  // Derive routes from API or use fallbacks if not yet generated
  const recommendedRoute = recData?.recommended || null
  const alternatives = recData?.alternatives || []
  const allRoutes = recommendedRoute ? [recommendedRoute, ...alternatives] : []

  const activeRoute = allRoutes[simulatingRouteIndex] || null
  const activeDistanceKm = activeRoute?.total_distance_km ?? 0
  const activeTransitDays = activeRoute?.total_transit_days ?? 0
  const activeCost = activeRoute?.total_cost ?? 0
  const activeReliability = activeRoute?.sla_success_rate ?? 0
  const activeCo2Kg = activeDistanceKm * Math.max(quantity, 1) * 0.08

  const handleSimulate = (routeIndex: number) => {
    setSimulatingRouteIndex(routeIndex)
    setReplayKey(k => k + 1)
    setIsPlaying(true)
  }

  
  return (
    <div className="flex flex-col h-[calc(100vh-100px)] w-full font-sans text-slate-800">
      
      <div className="flex-1 flex overflow-x-auto gap-5 min-h-0 pb-2 px-2 custom-scrollbar">
        {message && (
          <div className="fixed left-1/2 top-24 z-40 -translate-x-1/2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 shadow-sm">
            {message}
          </div>
        )}
        
        {/* ==================================================
            1. CREATE SHIPMENT REQUEST (LEFT)
            ================================================== */}
        <div className="w-[320px] shrink-0 flex flex-col bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 relative h-full overflow-y-auto custom-scrollbar">
           <div className="flex items-center gap-2 text-emerald-700 mb-5 shrink-0">
             <Sparkles size={16} /> <span className="font-bold text-[14px]">Create Route Request</span>
           </div>

           <div className="mb-5 grid grid-cols-3 gap-2 shrink-0">
             <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
               <div className="text-[9px] font-black uppercase text-emerald-700">Hubs</div>
               <div className="text-sm font-black text-slate-900">{hubs.length}</div>
             </div>
             <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
               <div className="text-[9px] font-black uppercase text-emerald-700">Parts</div>
               <div className="text-sm font-black text-slate-900">{parts.length}</div>
             </div>
             <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
               <div className="text-[9px] font-black uppercase text-emerald-700">Mode</div>
               <div className="text-sm font-black text-slate-900">Live</div>
             </div>
           </div>

           <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 shrink-0">
             <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-500">
               <Edit3 size={14} className="text-emerald-600" /> Backend Route Discovery
             </div>
             <p className="mt-2 text-[11px] font-medium leading-5 text-slate-500">
               Select real hub and part records. The engine ranks direct and relay paths by cost, distance, transit, SLA history, and congestion.
             </p>
           </div>

           {/* Form Fields */}
           <div className="space-y-4 flex-1">
             <div>
               <label className="text-[10px] font-bold text-gray-500 mb-1.5 block">Origin Hub</label>
               <div className="relative">
                 <MapPin size={14} className="absolute left-3 top-2.5 text-gray-400" />
                 <select value={origin} onChange={e => setOrigin(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-[11px] font-bold text-gray-800 outline-none appearance-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100">{hubs.map((h: any) => <option key={h.hub_id} value={h.hub_id}>{h.hub_name}</option>)}</select>
                 <ChevronDown size={14} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
               </div>
             </div>
             
             <div>
               <label className="text-[10px] font-bold text-gray-500 mb-1.5 block">Destination City</label>
               <div className="relative">
                 <MapPin size={14} className="absolute left-3 top-2.5 text-gray-400" />
                 <select value={destination} onChange={e => setDestination(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-[11px] font-bold text-gray-800 outline-none appearance-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100">{hubs.map((h: any) => <option key={h.hub_id} value={h.hub_id}>{h.hub_name}</option>)}</select>
                 <ChevronDown size={14} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
               </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className="text-[10px] font-bold text-gray-500 mb-1.5 block">Part Number</label>
                 <div className="relative">
                   <select value={partNo} onChange={e => setPartNo(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-bold text-gray-800 outline-none appearance-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100">
                     {parts.map((part: any) => <option key={part.part_no} value={part.part_no}>{part.part_no}</option>)}
                   </select>
                   <Search size={12} className="absolute right-3 top-2.5 text-gray-400" />
                 </div>
               </div>
               <div>
                 <label className="text-[10px] font-bold text-gray-500 mb-1.5 block">Part Category</label>
                 <div className="relative">
                   <select value={selectedPart?.category || ""} disabled className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-bold text-gray-800 outline-none appearance-none">
                     <option>{selectedPart?.category || "Select part"}</option>
                   </select>
                   <ChevronDown size={14} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                 </div>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className="text-[10px] font-bold text-gray-500 mb-1.5 block">Quantity</label>
                 <input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-bold text-gray-800 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100" />
               </div>
               <div>
                 <label className="text-[10px] font-bold text-gray-500 mb-1.5 block">Priority</label>
                 <div className="relative">
                   <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl pl-6 pr-3 py-2 text-[11px] font-bold text-gray-800 outline-none appearance-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"><option value="P1">P1 - Critical</option><option value="P2">P2 - High</option><option value="P3">P3 - Medium</option><option value="P4">P4 - Low</option></select>
                   <div className="absolute left-2.5 top-3 w-1.5 h-1.5 bg-red-500 rounded-full" />
                   <ChevronDown size={14} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                 </div>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className="text-[10px] font-bold text-gray-500 mb-1.5 block">Shipment Type</label>
                 <div className="relative">
                   <select disabled className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-bold text-gray-800 outline-none appearance-none">
                     <option>Forward Logistics</option>
                   </select>
                   <ChevronDown size={14} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                 </div>
               </div>
               <div>
                 <label className="text-[10px] font-bold text-gray-500 mb-1.5 block">Logistics Partner</label>
                 <div className="relative">
                   <select disabled className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-bold text-gray-800 outline-none appearance-none">
                     <option>Selected by route engine</option>
                   </select>
                   <ChevronDown size={14} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                 </div>
               </div>
             </div>

             <div>
               <label className="text-[10px] font-bold text-gray-500 mb-1.5 block">Delivery Window Days</label>
               <div className="relative">
                 <input type="number" min={1} value={deliveryWindow} onChange={e => setDeliveryWindow(Math.max(1, Number(e.target.value) || 1))} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-bold text-gray-800 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100" />
                 <Calendar size={12} className="absolute right-3 top-2.5 text-gray-400" />
               </div>
             </div>
           </div>

           <div className="mt-6 shrink-0">
             <button onClick={handleGenerate} disabled={loading} className="w-full py-3 bg-gradient-to-r from-emerald-700 to-green-400 text-white rounded-[12px] font-bold text-[12px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-opacity disabled:opacity-70">
               {loading ? <span className="animate-spin"><RefreshCw size={14} /></span> : <Sparkles size={14} />} 
               {loading ? "Analyzing Network..." : "Generate AI Routes"}
             </button>
             <div className="flex items-start gap-2 mt-4 px-2">
               <ShieldCheck size={14} className="text-green-500 shrink-0 mt-0.5" />
               <p className="text-[9px] text-gray-500 font-medium">Engine reads live hub, part, corridor, SLA, cost, and congestion data.</p>
             </div>
           </div>
        </div>

        {/* ==================================================
            2. TOP AI RECOMMENDED ROUTES (MIDDLE)
            ================================================== */}
        <div className="w-[380px] shrink-0 h-full flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 px-1 shrink-0">
            <h2 className="text-[15px] font-black text-gray-900">Top AI Recommended Routes</h2>
            <span className="text-[9px] font-bold text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200 shadow-sm">{allRoutes.length} Routes Found</span>
          </div>

          {recData && (
            <div className="mb-3 rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-emerald-600" />
                  <span className="text-[11px] font-black text-slate-900">{recData.verification_status || "Deterministic engine verified"}</span>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-700">Real data</span>
              </div>
              <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">
                {recData.verification_summary || recData.explanation}
              </p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-8 space-y-4">
            
            
            {/* Route A - Primary Recommendation */}
            {recommendedRoute && (
            <div className={`bg-white rounded-[20px] p-5 border-2 ${simulatingRouteIndex === 0 ? 'border-green-500 shadow-sm shadow-green-500/10' : 'border-gray-200'} relative overflow-visible transition-all`}>
               <div className={`absolute left-3 top-5 h-7 w-7 ${simulatingRouteIndex === 0 ? 'bg-green-500' : 'bg-gray-400'} text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-md ring-4 ring-white`}>1</div>
               
               <div className="pl-10">
                 <div className="flex justify-between items-start mb-4">
                   <div className="min-w-0 flex-1 pr-3">
                     <div className="flex items-center gap-2 mb-1">
                       <h3 className={`text-[15px] font-black ${simulatingRouteIndex === 0 ? 'text-green-600' : 'text-gray-800'}`}>Recommended Route</h3>
                       <span className="text-[9px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded"><Sparkles size={10} fill="currentColor" /> AI Recommended</span>
                     </div>
                     <p className="text-[10px] font-semibold leading-4 text-gray-500 break-words">{recommendedRoute.path?.join(" -> ")}</p>
                   </div>
                   <div className="flex flex-col items-center">
                     <div className="relative w-12 h-12 flex items-center justify-center rounded-full border-4 border-gray-100">
                       <div className="absolute inset-0 rounded-full border-4 border-green-500" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 0 100%, 0 0, 50% 0)' }} />
                       <span className="text-[12px] font-black text-gray-900 z-10">{Math.round(recommendedRoute.confidence_score || 98)}%</span>
                     </div>
                     <span className="text-[8px] font-bold text-gray-400 uppercase mt-1">Confidence</span>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-2 mb-4">
                   <div>
                     <span className="text-[9px] font-bold text-gray-400 block uppercase">ETA</span>
                     <span className="text-[14px] font-black text-gray-900">{recommendedRoute.total_transit_days?.toFixed(1)} Days</span>
                   </div>
                   <div>
                     <span className="text-[9px] font-bold text-gray-400 block uppercase">Est. Cost</span>
                     <span className="text-[14px] font-black text-gray-900">${recommendedRoute.total_cost?.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                   </div>
                   <div>
                     <span className="text-[9px] font-bold text-gray-400 block uppercase">Distance</span>
                     <span className="text-[14px] font-black text-gray-900">{recommendedRoute.total_distance_km?.toLocaleString(undefined, {maximumFractionDigits:0})} km</span>
                   </div>
                   <div>
                     <span className="text-[9px] font-bold text-gray-400 block uppercase">Reliability</span>
                     <span className="text-[14px] font-black text-gray-900">{recommendedRoute.sla_success_rate?.toFixed(1)}%</span>
                   </div>
                 </div>

                 <div className="flex gap-2">
                   <button onClick={() => handleSimulate(0)} className={`flex-1 py-2.5 ${simulatingRouteIndex === 0 ? 'bg-green-500 text-white hover:bg-green-600 shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5`}>
                     <Play size={12} fill="currentColor" /> Simulate Route
                   </button>
                 </div>
               </div>
            </div>
            )}

            {/* Alternatives */}
            {alternatives.map((alt: any, idx: number) => (
            <div key={idx} className={`bg-white rounded-[20px] p-5 border ${simulatingRouteIndex === idx + 1 ? 'border-emerald-400 shadow-sm shadow-emerald-500/10' : 'border-gray-200'} relative overflow-visible transition-all`}>
               <div className={`absolute left-3 top-5 h-7 w-7 ${simulatingRouteIndex === idx + 1 ? 'bg-emerald-500' : 'bg-gray-400'} text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-md ring-4 ring-white`}>{idx + 2}</div>
               
               <div className="pl-10">
                 <div className="flex justify-between items-start mb-4">
                   <div className="flex-1 pr-2 min-w-0">
                     <h3 className="text-[15px] font-black text-gray-900 mb-1">Alternative {idx + 1}</h3>
                     <p className="text-[10px] font-semibold leading-4 text-gray-500 break-words" title={alt.path?.join(" -> ")}>{alt.path?.join(" -> ")}</p>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-2 mb-4">
                   <div>
                     <span className="text-[9px] font-bold text-gray-400 block uppercase">ETA</span>
                     <span className="text-[14px] font-black text-gray-900">{alt.total_transit_days?.toFixed(1)} Days</span>
                   </div>
                   <div>
                     <span className="text-[9px] font-bold text-gray-400 block uppercase">Est. Cost</span>
                     <span className="text-[14px] font-black text-gray-900">${alt.total_cost?.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                   </div>
                   <div>
                     <span className="text-[9px] font-bold text-gray-400 block uppercase">Distance</span>
                     <span className="text-[14px] font-black text-gray-900">{alt.total_distance_km?.toLocaleString(undefined, {maximumFractionDigits:0})} km</span>
                   </div>
                   <div>
                     <span className="text-[9px] font-bold text-gray-400 block uppercase">Reliability</span>
                     <span className="text-[14px] font-black text-gray-900">{alt.sla_success_rate?.toFixed(1)}%</span>
                   </div>
                 </div>

                 <div className="flex gap-2">
                   <button onClick={() => handleSimulate(idx + 1)} className={`flex-1 py-2.5 ${simulatingRouteIndex === idx + 1 ? 'bg-emerald-500 text-white hover:bg-emerald-700 shadow-sm' : 'bg-white border border-gray-200 text-emerald-700 hover:bg-gray-50'} rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5`}>
                     <Play size={12} fill="currentColor" /> Simulate Route
                   </button>
                 </div>
               </div>
            </div>
            ))}

            {!recData && !loading && (
              <div className="p-8 text-center text-gray-400 text-[12px] font-medium border-2 border-dashed border-gray-200 rounded-[20px]">
                Click "Generate AI Routes" to analyze paths.
              </div>
            )}

            {recData && !recommendedRoute && !loading && (
              <div className="p-8 text-center text-red-500 text-[12px] font-medium border-2 border-dashed border-red-200 rounded-[20px] bg-red-50">
                <AlertCircle className="mx-auto mb-2" size={24} />
                {recData.explanation || "No active routes found linking the origin to destination."}
              </div>
            )}

          </div>
        </div>

        {/* ==================================================
            3. ROUTE SIMULATION (RIGHT)
            ================================================== */}
        <div className="flex-1 min-w-[500px] shrink-0 h-full flex flex-col">
           <RouteSimulationMap 
             route={activeRoute ? { ...activeRoute, est_transit_days: activeRoute.total_transit_days } : null}
             originName={originHub?.hub_name || origin}
             destName={destinationHub?.hub_name || destination}
             hubs={hubs}
             isPlaying={isPlaying} 
             togglePlay={setIsPlaying}
             key={replayKey}
           />
        </div>

      </div>

      {/* ==================================================
          BOTTOM KPI BAR
          ================================================== */}
      <div className="flex items-center justify-between bg-white rounded-2xl px-8 py-4 border border-gray-100 shadow-sm shrink-0 mx-2 mt-4">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <MapIcon size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 mb-0.5">Total Distance</div>
            <div className="text-[15px] font-black text-gray-900">{activeDistanceKm.toLocaleString(undefined, {maximumFractionDigits:0})} km</div>
          </div>
        </div>

        <div className="w-px h-10 bg-gray-200" />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 mb-0.5">Transit Time</div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-black text-gray-900">{activeTransitDays.toFixed(1)} Days</span>
            </div>
            <div className="text-[9px] font-bold text-gray-500 flex items-center gap-0.5">ETA Delivery</div>
          </div>
        </div>

        <div className="w-px h-10 bg-gray-200" />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center">
            <ArrowRight size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 mb-0.5">Estimated Cost</div>
            <div className="text-[15px] font-black text-gray-900">${activeCost.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
            <div className="text-[9px] font-bold text-gray-500 flex items-center gap-0.5">Total Freight</div>
          </div>
        </div>

        <div className="w-px h-10 bg-gray-200" />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 mb-0.5">On-time Delivery</div>
            <div className="text-[15px] font-black text-gray-900">{activeReliability.toFixed(1)}%</div>
            <div className="text-[9px] font-bold text-gray-500">Predicted Reliability</div>
          </div>
        </div>

        <div className="w-px h-10 bg-gray-200" />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center">
            <Activity size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 mb-0.5">CO2 Emission</div>
            <div className="text-[15px] font-black text-gray-900">{activeCo2Kg.toLocaleString(undefined, {maximumFractionDigits:0})} kg</div>
            <div className="text-[9px] font-bold text-gray-500 flex items-center gap-0.5">Estimated Impact</div>
          </div>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>
    </div>
  )
}
