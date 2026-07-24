"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  ChevronRight, RefreshCw, Search, MapPin, 
  Zap, Play, Flag, CheckCircle2, Navigation, 
  Sparkles, Clock, ShieldCheck, AlertTriangle
} from "lucide-react";
import { useGetHubs, useGetParts, useGetRecommendations } from "@/services/queries";
import { RouteMap } from "./route-map";

export default function AI_Route_Discovery() {
  const { data: hubsData, isLoading: hubsLoading } = useGetHubs({ page: 1, limit: 100 });
  const { data: partsData, isLoading: partsLoading } = useGetParts({ page: 1, limit: 100 });
  const recommendationMutation = useGetRecommendations();

  const hubs = hubsData?.items ?? [];
  const parts = partsData?.items ?? [];

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [partNo, setPartNo] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [deliveryWindow, setDeliveryWindow] = useState(7);
  const [priority, setPriority] = useState("P1 - Critical");
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [simulationStep, setSimulationStep] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSimulationStep(0);
  }, [selectedRouteIndex]);

  const playSimulation = () => {
    if (simulationStep > 0) return;
    setSimulationStep(1);
    setTimeout(() => setSimulationStep(2), 1500);
    setTimeout(() => setSimulationStep(3), 3500);
  };

  useEffect(() => {
    if (!origin && hubs[0]) setOrigin(hubs[0].hub_id);
    if (!destination && hubs[1]) setDestination(hubs[1].hub_id);
    if (!partNo && parts[0]) setPartNo(parts[0].part_no);
  }, [destination, hubs, origin, partNo, parts]);

  const handleGenerate = () => {
    if (!origin || !destination || !partNo) {
      setMessage("Select origin, destination, and part before generating routes.");
      return;
    }
    if (origin === destination) {
      setMessage("Origin and destination must be different.");
      return;
    }
    setMessage("");
    setSelectedRouteIndex(0);
    recommendationMutation.mutate({
      origin,
      destination,
      part_no: partNo,
      quantity,
      priority,
      required_delivery_window_days: deliveryWindow
    }, {
      onSuccess: () => setLastUpdated(new Date()),
      onError: () => setMessage("Backend route recommendation failed. Please check the route intelligence API."),
    });
  };

  const recommendedRoute = recommendationMutation.data?.recommended || null;
  const alternatives = recommendationMutation.data?.alternatives || [];
  const routes = recommendedRoute ? [recommendedRoute, ...alternatives] : [];
  const selectedRoute = routes[selectedRouteIndex] || null;
  const isLoadingInputs = hubsLoading || partsLoading;
  const isGenerating = recommendationMutation.isPending;
  const selectedOriginHub = hubs.find((h:any)=>h.hub_id===origin);
  const selectedDestinationHub = hubs.find((h:any)=>h.hub_id===destination);
  const selectedPart = parts.find((p:any)=>p.part_no===partNo);
  const costValues = routes.map((route: any) => route.total_cost);
  const etaValues = routes.map((route: any) => route.total_transit_days);
  const minCost = costValues.length ? Math.min(...costValues) : 0;
  const maxCost = costValues.length ? Math.max(...costValues) : 0;
  const minEta = etaValues.length ? Math.min(...etaValues) : 0;
  const maxEta = etaValues.length ? Math.max(...etaValues) : 0;
  const costPadding = Math.max(100, (maxCost - minCost) * 0.15);
  const etaPadding = Math.max(0.5, (maxEta - minEta) * 0.15);
  const costAxisMin = Math.max(0, minCost - costPadding);
  const costAxisMax = maxCost + costPadding;
  const etaAxisMin = Math.max(0, minEta - etaPadding);
  const etaAxisMax = maxEta + etaPadding;
  const routeLabel = selectedRouteIndex === 0 ? "Recommended Route" : `Alternative Route ${selectedRouteIndex}`;

  return (
    <div className="min-h-screen bg-[#F6F8FB] font-sans text-slate-800 flex flex-col">
      {/* 1. Global Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
          <span>Recommendation Center</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 font-bold">AI Route Discovery</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || isLoadingInputs}
            className="flex items-center gap-2 px-4 py-2 bg-[#007A5E] disabled:bg-slate-300 text-white rounded-lg text-sm font-bold hover:bg-[#00664d]"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} /> {routes.length ? "Regenerate Routes" : "Generate Routes"}
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-700">
            <div className={`w-2 h-2 rounded-full ${recommendationMutation.isError ? "bg-red-500" : "bg-[#007A5E]"}`} /> Backend Data
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        
        {/* 2. Left Panel (Route Request) */}
        <div className="w-[320px] shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-y-auto">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-2 text-[#007A5E] font-bold text-base mb-1">
              <Zap className="w-5 h-5" /> Route Request
            </div>
            <p className="text-xs text-slate-500 font-medium">Provide shipment details to discover optimal routes</p>
          </div>
          
          <div className="p-5 flex-1 space-y-5">
            {/* Inputs */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">Origin Hub</label>
              <select value={origin} onChange={e => setOrigin(e.target.value)} disabled={isLoadingInputs} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none disabled:bg-slate-50">
                {hubs.map((h: any) => <option key={h.hub_id} value={h.hub_id}>{h.hub_name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">Destination Hub</label>
              <select value={destination} onChange={e => setDestination(e.target.value)} disabled={isLoadingInputs} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none disabled:bg-slate-50">
                {hubs.map((h: any) => <option key={h.hub_id} value={h.hub_id}>{h.hub_name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">Part / Item</label>
              <select value={partNo} onChange={e => setPartNo(e.target.value)} disabled={isLoadingInputs} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none disabled:bg-slate-50">
                {parts.map((p: any) => <option key={p.part_no} value={p.part_no}>{p.part_no} - {p.part_description}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">Quantity</label>
                <div className="relative">
                  <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm font-bold text-slate-800 outline-none" />
                  <span className="absolute right-3 top-2.5 text-[11px] font-bold text-slate-400">Units</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">Shipment Window</label>
                <div className="relative">
                  <input type="number" value={deliveryWindow} onChange={e => setDeliveryWindow(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm font-bold text-slate-800 outline-none" />
                  <span className="absolute right-3 top-2.5 text-[11px] font-bold text-slate-400">Days</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none">
                <option value="P1 - Critical">P1 - Critical</option>
                <option value="P2 - High">P2 - High</option>
              </select>
            </div>

            {message && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-bold text-amber-800 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {message}
              </div>
            )}

            <button onClick={handleGenerate} disabled={isGenerating || isLoadingInputs} className="w-full py-3 bg-[#007A5E] disabled:bg-slate-300 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#00664d] transition shadow-sm">
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />} {isGenerating ? "Generating from Backend..." : "Generate AI Routes"}
            </button>
          </div>

          <div className="p-5 border-t border-slate-100 bg-slate-50/50 mt-auto">
            <div className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-wider">Selected Load</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                <MapPin className="w-3 h-3 text-[#007A5E]" /> {selectedOriginHub?.hub_name || "Select origin hub"}
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                <Flag className="w-3 h-3 text-[#007A5E]" /> {selectedDestinationHub?.hub_name || "Select destination hub"}
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                <Search className="w-3 h-3 text-[#007A5E]" /> {selectedPart ? `${selectedPart.part_no} - ${selectedPart.part_description}` : "Select part"}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-[9px] font-semibold text-slate-400">
              <CheckCircle2 className="w-3 h-3 text-green-500" /> Inputs loaded from backend hubs and parts
            </div>
          </div>
        </div>

        {/* 3. Right Panel (Main Content) */}
        <div className="flex-1 flex flex-col overflow-y-auto h-full space-y-4">
          
          {/* Top Row: Recommendations */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#007A5E]" /> Recommendations
                </h2>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Backend route intelligence ranks available routes for the selected load</p>
              </div>
              <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Not generated"}
              </div>
            </div>

            {routes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <Sparkles className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                <div className="text-sm font-black text-slate-700">{isGenerating ? "Generating route recommendations..." : "No route recommendation generated yet"}</div>
                <div className="mt-1 text-xs font-semibold text-slate-500">Choose backend hubs and part, then generate routes.</div>
              </div>
            ) : (
            <div className="grid grid-cols-3 gap-4">
              {[
                { title: "Recommended Route", accent: "green", tag: "Best Overall", color: "#10B981" },
                { title: "Alternative Route 1", accent: "blue", tag: "Balanced", color: "#3B82F6" },
                { title: "Alternative Route 2", accent: "orange", tag: "Cost Saving", color: "#F97316" }
              ].map((card, idx) => {
                const r = routes[idx];
                const isActive = selectedRouteIndex === idx;
                return (
                  <div key={idx} onClick={() => r && setSelectedRouteIndex(idx)} className={`rounded-xl border-2 ${isActive ? 'border-[#10B981]' : 'border-slate-100'} ${r ? "cursor-pointer hover:border-[#10B981]" : "opacity-60"} p-4 transition relative`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-white" style={{backgroundColor: card.color}}>
                          <Sparkles className="w-2.5 h-2.5" />
                        </div>
                        <h3 className="text-[13px] font-bold text-slate-900">{card.title}</h3>
                      </div>
                      <div className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{color: card.color, backgroundColor: `${card.color}15`}}>{card.tag}</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400">ETA</div>
                        <div className="text-[14px] font-black text-slate-900">{r ? r.total_transit_days.toFixed(1) : "--"} <span className="text-[10px]">Days</span></div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400">Cost</div>
                        <div className="text-[14px] font-black text-slate-900">{r ? `$${r.total_cost.toLocaleString('en-US', {maximumFractionDigits:0})}` : "--"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400">CO2</div>
                        <div className="text-[14px] font-black text-slate-900">{r ? (r.total_distance_km*0.19*quantity).toFixed(0) : "--"} <span className="text-[10px]">kg</span></div>
                      </div>
                    </div>

                    <div className="absolute right-4 top-[50%] -translate-y-[50%] flex flex-col items-center">
                       <div className="relative w-10 h-10 flex items-center justify-center">
                         <svg width="40" height="40" viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
                           <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={`${card.color}20`} strokeWidth="3" />
                           <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={card.color} strokeWidth="3" strokeDasharray={`${r ? Math.round(r.confidence_score) : 0}, 100`} strokeLinecap="round" />
                         </svg>
                         <span className="text-[10px] font-black text-slate-800 z-10">{r ? Math.round(r.confidence_score) : 0}%</span>
                       </div>
                       <div className="text-[8px] font-bold text-slate-400 text-center mt-1">Confidence</div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 pt-3 border-t border-slate-100">
                      <span>{r ? r.total_distance_km.toFixed(0) : "--"} km</span>
                      <div className="w-1 h-1 rounded-full bg-slate-300" />
                      <span>{r ? r.path.length : "--"} Hubs</span>
                      <div className="w-1 h-1 rounded-full bg-slate-300" />
                      <span>On-time: {r ? r.sla_success_rate.toFixed(0) : "--"}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
            )}
          </div>

          {/* Middle Row: Route Comparison Graph */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex min-h-[360px] shrink-0">
            {/* Left: Scatter Plot (SVG built) */}
            <div className="w-[340px] p-5 border-r border-slate-100 flex flex-col">
              <div>
                <h2 className="text-sm font-black text-slate-900">Route Comparison Graph</h2>
                <p className="text-[10px] text-slate-500 font-semibold mb-6">All routes plotted across time vs cost (click any route)</p>
              </div>
              
              <div className="flex-1 relative mt-4">
                <svg width="100%" height="100%" viewBox="0 0 300 200" preserveAspectRatio="none">
                  {/* Y Axis: Total Cost */}
                  <text x="20" y="-10" className="text-[9px] fill-slate-500 font-bold">Total Cost</text>
                  <text x="20" y="0" className="text-[9px] fill-slate-500">(USD)</text>
                  
                  {(routes.length ? [0, 1, 2, 3, 4, 5].map((step) => costAxisMin + ((costAxisMax - costAxisMin) / 5) * step) : []).map((v, i) => (
                    <g key={i}>
                      <text x="25" y={195 - (i * 38)} className="text-[9px] fill-slate-400 text-right" textAnchor="end">{Math.round(v / 100) / 10}k</text>
                      <line x1="30" y1={190 - (i * 38)} x2="280" y2={190 - (i * 38)} stroke="#F1F5F9" strokeWidth="1" />
                    </g>
                  ))}
                  <line x1="30" y1="10" x2="30" y2="190" stroke="#CBD5E1" strokeWidth="2" />
                  <line x1="30" y1="190" x2="280" y2="190" stroke="#CBD5E1" strokeWidth="2" />
                  
                  {/* X Axis: ETA */}
                  {(routes.length ? [0, 1, 2, 3, 4].map((step) => etaAxisMin + ((etaAxisMax - etaAxisMin) / 4) * step) : []).map((v, i) => (
                    <text key={i} x={30 + (i * 50)} y="205" className="text-[9px] fill-slate-400" textAnchor="middle">{v.toFixed(1)}</text>
                  ))}
                  <text x="155" y="220" className="text-[9px] fill-slate-500 font-bold" textAnchor="middle">ETA (Days)</text>

                  {routes.length === 0 && (
                    <text x="155" y="100" className="text-[11px] fill-slate-400 font-bold" textAnchor="middle">Generate routes to plot backend results</text>
                  )}

                  {/* Lines & Dots for the 3 routes mapped from data */}
                  {routes.map((r, i) => {
                     const color = i === 0 ? "#10B981" : i === 1 ? "#3B82F6" : "#F97316";
                     
                     const getY = (val: number) => 190 - ((Math.max(costAxisMin, Math.min(costAxisMax, val)) - costAxisMin) / Math.max(1, costAxisMax - costAxisMin)) * 190;
                     const getX = (val: number) => 30 + ((Math.max(etaAxisMin, Math.min(etaAxisMax, val)) - etaAxisMin) / Math.max(1, etaAxisMax - etaAxisMin)) * 200;
                     
                     const x = getX(r.total_transit_days);
                     const y = getY(r.total_cost);
                     
                     return (
                       <g key={i} onClick={() => setSelectedRouteIndex(i)} className="cursor-pointer group">
                         {/* Trend curve ending at the dot */}
                         <path d={`M ${Math.max(30, x - 40)} ${Math.max(0, y - 60)} Q ${x - 20} ${y - 10} ${x} ${y}`} fill="none" stroke={color} strokeWidth="2" strokeDasharray={i === 0 ? "none" : "4 4"} opacity="0.6" />
                         
                         <circle cx={x} cy={y} r="6" fill={color} className="transition-transform group-hover:scale-125 origin-center" style={{ transformOrigin: `${x}px ${y}px` }} />
                         
                         {/* Tooltip background for readability */}
                         <rect x={x - 45} y={y - 28} width="90" height="22" rx="4" fill="white" opacity="0.8" />
                         <text x={x} y={y - 18} className={`text-[9px] font-bold ${i===0?'fill-[#10B981]':i===1?'fill-[#3B82F6]':'fill-[#F97316]'}`} textAnchor="middle">
                           {i === 0 ? "Recommended" : `Alt. Route ${i}`}
                         </text>
                         <text x={x} y={y - 9} className="text-[8px] font-bold fill-slate-600" textAnchor="middle">
                           ({r.total_transit_days.toFixed(1)}d, ${r.total_cost.toLocaleString('en-US', {maximumFractionDigits:0})})
                         </text>
                       </g>
                     )
                  })}
                </svg>
              </div>

              <div className="flex items-center justify-between mt-10">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500"><div className="w-2 h-2 rounded-full bg-[#10B981]"/> Recommended</div>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500"><div className="w-2 h-2 rounded-full bg-[#3B82F6]"/> Alternative 1</div>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500"><div className="w-2 h-2 rounded-full bg-[#F97316]"/> Alternative 2</div>
              </div>
            </div>

            {/* Right: Leaflet Map */}
            <div className="flex-1 bg-[#F8FAFC] rounded-r-2xl relative">
               <RouteMap routesToPlot={routes} hubs={hubs} />
            </div>
          </div>

          {/* Bottom Row: Route Preview & Metrics */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 shrink-0 flex items-stretch gap-6">
            <div className="flex-1">
               <div className="flex items-center gap-3 mb-4">
                 <h2 className="text-sm font-black text-slate-900">Route Preview & Metrics</h2>
                 <span className="text-[10px] font-bold text-slate-400">(for selected route)</span>
                 {selectedRoute && <span className="px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] text-[10px] font-bold ml-2">{routeLabel}</span>}
               </div>
               
               <div className="grid grid-cols-6 gap-3">
                 {[
                   { label: "ETA", icon: Clock, val: selectedRoute?.total_transit_days.toFixed(1) || "--", unit: "Days", sub: selectedRoute ? "Backend estimate" : "No route", color: "text-[#10B981]" },
                   { label: "Total Cost", icon: Zap, val: selectedRoute ? `$${selectedRoute.total_cost.toLocaleString('en-US', {maximumFractionDigits:0})}` : "--", unit: "", sub: selectedRoute ? "Backend scored" : "No route", color: "text-[#10B981]" },
                   { label: "Distance", icon: Navigation, val: selectedRoute?.total_distance_km.toLocaleString('en-US', {maximumFractionDigits:0}) || "--", unit: "km", sub: selectedRoute ? `${selectedRoute.path.length} hubs` : "No route", color: "text-[#10B981]" },
                   { label: "CO2 Emission", icon: MapPin, val: selectedRoute ? (selectedRoute.total_distance_km*0.19*quantity).toFixed(0) : "--", unit: "kg", sub: selectedRoute ? "Distance based" : "No route", color: "text-[#10B981]" },
                   { label: "SLA Reliability", icon: ShieldCheck, val: selectedRoute?.sla_success_rate.toFixed(0) || "--", unit: "%", sub: selectedRoute ? "Backend probability" : "No route", color: "text-[#10B981]" },
                   { label: "Confidence Score", icon: CheckCircle2, val: selectedRoute ? Math.round(selectedRoute.confidence_score).toString() : "--", unit: "%", sub: selectedRoute ? "Model confidence" : "No route", color: "text-[#10B981]" }
                 ].map((stat, i) => (
                   <div key={i} className="border border-slate-100 rounded-xl p-3 bg-white shadow-sm flex flex-col justify-between">
                     <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#007A5E] mb-2">
                       <stat.icon className="w-3.5 h-3.5" /> {stat.label}
                     </div>
                     <div>
                       <div className="text-[18px] font-black text-slate-900">{stat.val} <span className="text-[12px]">{stat.unit}</span></div>
                       <div className={`text-[10px] font-bold mt-0.5 ${stat.color}`}>{stat.sub}</div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* Route replay widget */}
            <div className="w-[300px] shrink-0 bg-[#0F2922] rounded-xl p-4 flex flex-col justify-between text-white relative overflow-hidden">
               <div className="flex items-center justify-between mb-4 z-10 relative">
                 <div className="text-[12px] font-bold">Route Replay</div>
                 <div className="flex items-center gap-1.5 bg-[#10B981]/20 px-2 py-1 rounded-full border border-[#10B981]/30">
                   <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full" />
                   <span className="text-[9px] font-bold text-[#10B981]">{selectedRoute ? "Backend Route" : "Waiting"}</span>
                 </div>
               </div>

               <div className="relative z-10">
                 <div className="absolute top-1 left-0 right-0 h-0.5 bg-white/20 border-t border-dashed border-white/30" />
                 
                 {/* Animated Progress Bar */}
                 <div className="absolute top-1 left-0 h-0.5 bg-[#10B981] transition-all duration-1000 ease-in-out" style={{ width: simulationStep === 0 ? '0%' : simulationStep === 1 ? '15%' : simulationStep === 2 ? '65%' : '100%' }} />
                 
                 {/* Playhead Handle */}
                 <div 
                   className="absolute top-1 -mt-3 w-6 h-6 bg-white rounded-md shadow-md flex items-center justify-center text-[#0F2922] cursor-pointer hover:scale-110 transition-all duration-1000 ease-in-out z-20"
                   style={{ left: simulationStep === 0 ? '0%' : simulationStep === 1 ? '15%' : simulationStep === 2 ? '65%' : '100%', transform: 'translateX(-50%)' }}
                   onClick={playSimulation}
                 >
                   <Play className="w-3 h-3 fill-current ml-0.5" />
                 </div>
                 
                 <div className="relative flex justify-between mt-6">
                   <div className="flex flex-col items-center">
                     <div className={`w-2.5 h-2.5 rounded-full ${simulationStep >= 1 ? 'bg-[#10B981]' : 'bg-white/20'} border-2 border-[#0F2922] -mt-7 z-10 transition-colors duration-500`} />
                     <span className="text-[8px] font-bold text-white/80 mt-4">Departed</span>
                   <span className="text-[9px] font-bold text-white">{selectedOriginHub?.hub_name?.split(' ')[0] || "Origin"}</span>
                   </div>
                   
                   <div className="flex flex-col items-center">
                     <div className={`w-2.5 h-2.5 rounded-full ${simulationStep >= 2 ? 'bg-[#10B981]' : 'bg-white/20'} border-2 border-[#0F2922] -mt-7 z-10 transition-colors duration-500`} />
                     <span className="text-[8px] font-bold text-white/80 mt-4">In Transit</span>
                     <span className="text-[9px] font-bold text-white">{selectedRoute ? selectedRoute.path.length : "--"} Hubs</span>
                   </div>
                   
                   <div className="flex flex-col items-center">
                     <div className={`w-2.5 h-2.5 rounded-full ${simulationStep >= 3 ? 'bg-[#10B981]' : 'bg-white/20'} border-2 border-[#0F2922] -mt-7 z-10 transition-colors duration-500`} />
                     <span className="text-[8px] font-bold text-white/80 mt-4">Next Stop</span>
                     <span className="text-[9px] font-bold text-white">Hub Cleared</span>
                   </div>
                   
                   <div className="flex flex-col items-center text-right">
                     <div className={`w-2.5 h-2.5 rounded-full ${simulationStep >= 3 ? 'bg-[#10B981]' : 'bg-white/20'} border-2 border-[#0F2922] -mt-7 z-10 flex items-center justify-center text-white transition-colors duration-500`}><Flag className="w-2 h-2" /></div>
                     <span className="text-[8px] font-bold text-white/80 mt-4">ETA at Dest</span>
                     <span className="text-[9px] font-bold text-[#10B981]">{selectedRoute ? `${selectedRoute.total_transit_days.toFixed(1)} Days` : "--"}</span>
                   </div>
                 </div>
               </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 py-4 mt-auto text-xs font-semibold text-slate-500">
            {selectedRoute ? "Route metrics are generated from the backend route intelligence service." : "Generate a route to unlock backend metrics and replay."}
          </div>
        </div>
      </div>
    </div>
  );
}
