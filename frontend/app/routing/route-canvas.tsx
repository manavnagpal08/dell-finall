"use client";

import React, { useState, useEffect, useRef } from "react";
import { Navigation, Loader2, Truck, Plane, Ship, Train, CheckCircle2, Clock, MapPin, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";

function getTransportMode(distance: number, index: number) {
  if (distance > 3000) return { mode: 'Sea', icon: Ship, color: '#06B6D4', dash: '4 6' };
  if (distance > 1000) return { mode: 'Air', icon: Plane, color: '#3B82F6', dash: '8 8' };
  if (index % 2 !== 0) return { mode: 'Rail', icon: Train, color: '#F97316', dash: 'none' };
  return { mode: 'Truck', icon: Truck, color: '#10B981', dash: 'none' };
}

export function RouteCanvas({ route, originName, destinationName, hubs }: any) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [leaflet, setLeaflet] = useState<any>(null);
  const [simulationState, setSimulationState] = useState<"idle" | "playing" | "completed">("idle");
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(-1);
  const [vehicleProgress, setVehicleProgress] = useState(0); 
  const [events, setEvents] = useState<string[]>([]);
  const [projectedCoords, setProjectedCoords] = useState<{x: number, y: number, name: string, hub_id: string}[]>([]);
  
  const path = route?.path ?? [];
  const coords = path.map((hubId: string) => {
    const hub = hubs?.find((h: any) => h.hub_id === hubId);
    return hub ? { lat: hub.latitude, lng: hub.longitude, name: hub.hub_name, hub_id: hubId } : null;
  }).filter(Boolean);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || mapInstance) return;

    let map: any;
    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([20, 78], 4);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
      setLeaflet(L);
      setMapInstance(map);
    });

    return () => { if (map) map.remove(); };
  }, [mapRef]);

  const updateProjected = React.useCallback(() => {
    if (!mapInstance || coords.length === 0) return;
    const newCoords = coords.map((c: any) => {
      const pt = mapInstance.latLngToContainerPoint([c.lat, c.lng]);
      return { x: pt.x, y: pt.y, name: c.name, hub_id: c.hub_id };
    });
    setProjectedCoords(newCoords);
  }, [mapInstance, coords]);

  useEffect(() => {
    if (mapInstance && leaflet && coords.length > 0) {
      const bounds = leaflet.latLngBounds(coords.map((c: any) => [c.lat, c.lng]));
      mapInstance.flyToBounds(bounds, { padding: [80, 80], maxZoom: 6 });
      
      mapInstance.on('move', updateProjected);
      mapInstance.on('zoom', updateProjected);
      
      setTimeout(updateProjected, 100);
      setTimeout(updateProjected, 500);
    }
    return () => {
      if (mapInstance) {
        mapInstance.off('move', updateProjected);
        mapInstance.off('zoom', updateProjected);
      }
    };
  }, [mapInstance, leaflet, route, coords, updateProjected]);

  useEffect(() => {
    if (simulationState !== "playing" || projectedCoords.length < 2) return;

    let segment = 0;
    setActiveSegmentIndex(0);
    setEvents([`Simulation started at ${projectedCoords[0].name}`]);

    const runSegment = () => {
      if (segment >= projectedCoords.length - 1) {
        setSimulationState("completed");
        setEvents(prev => [`🎉 Shipment successfully delivered to ${projectedCoords[projectedCoords.length-1].name}!`, ...prev]);
        return;
      }
      
      setVehicleProgress(0);
      setEvents(prev => [`Vehicle departed ${projectedCoords[segment].name}`, ...prev]);
      
      const startTime = performance.now();
      const duration = 3000; 
      
      const animateFrame = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setVehicleProgress(progress);
        
        if (progress < 1) {
          requestAnimationFrame(animateFrame);
        } else {
          setEvents(prev => [`Arrived at ${projectedCoords[segment+1].name}. Loading...`, ...prev]);
          setTimeout(() => {
            segment++;
            setActiveSegmentIndex(segment);
            runSegment();
          }, 1500);
        }
      };
      requestAnimationFrame(animateFrame);
    };

    runSegment();
  }, [simulationState]);

  const startSimulation = () => {
    if (simulationState === "playing") return;
    setSimulationState("playing");
  };

  let vx = 0, vy = 0, currentMode = null;
  if (activeSegmentIndex >= 0 && activeSegmentIndex < projectedCoords.length - 1) {
    const p1 = projectedCoords[activeSegmentIndex];
    const p2 = projectedCoords[activeSegmentIndex + 1];
    if (p1 && p2) {
      vx = p1.x + (p2.x - p1.x) * vehicleProgress;
      vy = p1.y + (p2.y - p1.y) * vehicleProgress;
      const dist = route?.total_distance_km / (coords.length - 1);
      currentMode = getTransportMode(dist || 500, activeSegmentIndex);
    }
  }

  return (
    <div className="relative min-h-[580px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm flex flex-col">
      <div className="relative z-20 flex items-center justify-between border-b border-white/80 bg-white/90 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-black text-slate-950">Enterprise Logistics Simulation</span>
        </div>
        <div className="flex gap-3 items-center">
           {simulationState === "completed" && <Badge variant="success">SLA Maintained</Badge>}
           <Badge variant={route ? "info" : "neutral"}>{route ? "AI Engine Ready" : "Awaiting Input"}</Badge>
           {route && (
             <button onClick={startSimulation} disabled={simulationState === "playing"} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm">
               {simulationState === "playing" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
               {simulationState === "playing" ? "Simulating..." : simulationState === "completed" ? "Replay Route" : "Simulate Journey"}
             </button>
           )}
        </div>
      </div>

      <div className="relative flex-1 bg-[#EEF3F8]">
        <div ref={mapRef} className="absolute inset-0 z-0 filter saturate-[0.85] contrast-[1.1]" />
        
        {!route && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-sm">
            <div className="text-center bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-600">Generate a route to start simulation</p>
            </div>
          </div>
        )}

        <svg className="absolute inset-0 z-10 w-full h-full pointer-events-none">
          {projectedCoords.map((p1, i) => {
            if (i >= projectedCoords.length - 1) return null;
            const p2 = projectedCoords[i+1];
            const isVisible = simulationState === 'completed' || activeSegmentIndex > i;
            const isDrawing = activeSegmentIndex === i && simulationState === 'playing';
            
            if (!isVisible && !isDrawing) return null;

            const mode = getTransportMode((route?.total_distance_km || 1000) / (coords.length - 1), i);

            return (
              <g key={`segment-${i}`}>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#E2E8F0" strokeWidth="4" />
                <motion.line
                  x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke={mode.color} strokeWidth="4" strokeDasharray={mode.dash}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: isVisible ? 1 : vehicleProgress }}
                  transition={{ duration: 0 }}
                />
              </g>
            );
          })}
          
          {projectedCoords.map((pt, i) => {
            const isReached = simulationState === 'completed' || activeSegmentIndex > i || (activeSegmentIndex === i && vehicleProgress > 0);
            const isCurrentWait = activeSegmentIndex === i && vehicleProgress === 0 && simulationState === 'playing';
            
            return (
              <g key={`node-${i}`}>
                {isCurrentWait && (
                  <motion.circle cx={pt.x} cy={pt.y} r="20" fill="#10B981" fillOpacity="0.2" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} />
                )}
                <circle cx={pt.x} cy={pt.y} r="6" fill={isReached ? "#10B981" : "#94A3B8"} stroke="#fff" strokeWidth="3" />
                <text x={pt.x} y={pt.y - 12} textAnchor="middle" className="text-[10px] font-bold fill-slate-800" style={{ textShadow: '0 1px 2px white, 0 -1px 2px white, 1px 0 2px white, -1px 0 2px white' }}>
                  {pt.name}
                </text>
              </g>
            );
          })}
        </svg>

        <AnimatePresence>
          {simulationState === "playing" && currentMode && (
            <motion.div
              className="absolute z-20"
              style={{ left: vx, top: vy, translateX: '-50%', translateY: '-50%' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <div className="relative group">
                <div className="w-10 h-10 bg-white rounded-full shadow-lg border-2 flex items-center justify-center" style={{ borderColor: currentMode.color }}>
                  <currentMode.icon className="w-5 h-5" style={{ color: currentMode.color }} />
                </div>
                
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 bg-white/95 backdrop-blur rounded-xl shadow-xl border border-slate-100 p-3 pointer-events-none">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-slate-500">In Transit</span>
                    <span className="text-[10px] font-black uppercase" style={{ color: currentMode.color }}>{currentMode.mode} Freight</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 mb-2 truncate">
                    Confidence: 97%
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500 font-semibold">Progress</span>
                      <span className="font-bold text-slate-700">{Math.round(vehicleProgress * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-300" style={{ width: `${vehicleProgress * 100}%`, backgroundColor: currentMode.color }} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {simulationState === "completed" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center"
            >
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-emerald-100 p-6 w-[340px] text-center pointer-events-auto">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-1">Shipment Delivered</h2>
                <p className="text-sm font-semibold text-emerald-600 mb-4">SLA Maintained successfully</p>
                <button onClick={() => setSimulationState("idle")} className="w-full bg-slate-900 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-slate-800">
                  Close Replay
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Event Timeline styling updated to match the Enterprise white theme instead of dark mode */}
      <div className="h-32 bg-slate-50 overflow-hidden flex flex-col relative z-20 border-t border-slate-100">
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-200">
           <div className="h-full bg-emerald-500 transition-all duration-300" 
                style={{ width: simulationState === 'idle' ? '0%' : simulationState === 'completed' ? '100%' : `${((activeSegmentIndex + vehicleProgress) / (coords.length - 1)) * 100}%` }} />
        </div>
        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-white">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Clock className="w-3 h-3" /> Live Event Log
          </span>
          <span className="text-[10px] font-black text-emerald-600">
            System Online
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
           {events.length === 0 && <div className="text-xs text-slate-400 font-semibold italic">Awaiting simulation start...</div>}
           {events.map((evt, i) => (
             <div key={i} className="flex items-start gap-3 text-xs animate-in fade-in slide-in-from-bottom-2">
               <span className="text-slate-400 font-mono mt-0.5 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span> 
               <span className={`font-semibold ${i === 0 ? 'text-slate-900' : 'text-slate-500'}`}>
                 {evt.includes('🎉') || evt.includes('successfully') ? <span className="text-emerald-600 font-bold">{evt}</span> : evt}
               </span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
