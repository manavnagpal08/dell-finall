"use client";

import React, { useState, useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

let L: any = null;
if (typeof window !== "undefined") {
  L = require("leaflet");
}

export function RouteMap({ routesToPlot, hubs }: any) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [mapType, setMapType] = useState<"map" | "satellite">("map");
  const [projectedCoordsList, setProjectedCoordsList] = useState<any[][]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || mapInstance) return;
    
    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([20, 78], 4);
    const layer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 });
    layer.addTo(map);
    
    setMapInstance({ map, layer });

    return () => { map.remove(); };
  }, [mapRef]);

  const updateProjected = React.useCallback(() => {
    if (!mapInstance?.map || !routesToPlot || routesToPlot.length === 0) return;
    
    const allProjected = routesToPlot.map((r: any) => {
      const path = r.path ?? [];
      const coords = path.map((hubId: string) => {
        const hub = hubs?.find((h: any) => h.hub_id === hubId);
        return hub ? { lat: hub.latitude, lng: hub.longitude, name: hub.hub_name } : null;
      }).filter(Boolean);

      return coords.map((c: any) => {
        const pt = mapInstance.map.latLngToContainerPoint([c.lat, c.lng]);
        return { x: pt.x, y: pt.y, name: c.name };
      });
    });

    setProjectedCoordsList(allProjected);
  }, [mapInstance, routesToPlot, hubs]);

  useEffect(() => {
    if (mapInstance?.map && routesToPlot && routesToPlot.length > 0) {
      let allCoords: any[] = [];
      routesToPlot.forEach((r: any) => {
        const path = r.path ?? [];
        path.forEach((hubId: string) => {
          const hub = hubs?.find((h: any) => h.hub_id === hubId);
          if (hub) allCoords.push([hub.latitude, hub.longitude]);
        });
      });

      if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords);
        mapInstance.map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 6 });
        
        mapInstance.map.on('move', updateProjected);
        mapInstance.map.on('zoom', updateProjected);
        
        setTimeout(updateProjected, 100);
        setTimeout(updateProjected, 500);
      }
    }
    return () => {
      if (mapInstance?.map) {
        mapInstance.map.off('move', updateProjected);
        mapInstance.map.off('zoom', updateProjected);
      }
    };
  }, [mapInstance, routesToPlot]);

  useEffect(() => {
    if (!mapInstance?.map) return;
    mapInstance.layer.setUrl(
      mapType === "map" 
        ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    );
  }, [mapType, mapInstance]);

  const routeStyles = [
    { color: "#10B981", dash: "none", label: "Recommended Route" },
    { color: "#3B82F6", dash: "6 6", label: "Alternative Route 1" },
    { color: "#F97316", dash: "6 6", label: "Alternative Route 2" },
  ];

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden rounded-r-[16px] flex flex-col">
      <div className="absolute top-4 left-4 z-20 flex items-center bg-slate-100/80 backdrop-blur rounded-lg p-1 border border-slate-200 shadow-sm pointer-events-auto">
        <button 
          onClick={() => setMapType("map")}
          className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${mapType === "map" ? "bg-[#103b40] text-white shadow" : "text-slate-600 hover:text-slate-800"}`}
        >
          Map View
        </button>
        <button 
          onClick={() => setMapType("satellite")}
          className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${mapType === "satellite" ? "bg-[#103b40] text-white shadow" : "text-slate-600 hover:text-slate-800"}`}
        >
          Satellite
        </button>
      </div>

      <div className="absolute top-4 right-4 z-20 flex flex-col bg-white rounded-lg shadow-sm border border-slate-200 pointer-events-auto">
        <button className="w-8 h-8 flex items-center justify-center text-slate-600 font-bold border-b border-slate-100 hover:bg-slate-50">+</button>
        <button className="w-8 h-8 flex items-center justify-center text-slate-600 font-bold border-b border-slate-100 hover:bg-slate-50">-</button>
        <button className="w-8 h-8 flex items-center justify-center text-slate-600 font-bold hover:bg-slate-50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
        </button>
      </div>

      <div ref={mapRef} className={`absolute inset-0 z-0 ${mapType === "map" ? "filter saturate-[0.8] contrast-[1.1] opacity-70" : ""}`} />

      <svg className="absolute inset-0 z-10 w-full h-full pointer-events-none">
        {projectedCoordsList.map((coords, routeIndex) => {
          const style = routeStyles[routeIndex % routeStyles.length];
          return (
            <g key={`route-${routeIndex}`}>
              {coords.map((p1, i) => {
                if (i >= coords.length - 1) return null;
                const p2 = coords[i+1];
                const offsetX = routeIndex === 1 ? -4 : routeIndex === 2 ? 4 : 0;
                return (
                  <g key={`segment-${routeIndex}-${i}`}>
                    <line 
                      x1={p1.x + offsetX} y1={p1.y + offsetX} 
                      x2={p2.x + offsetX} y2={p2.y + offsetX} 
                      stroke={style.color} 
                      strokeWidth={routeIndex === 0 ? "3" : "2"} 
                      strokeDasharray={style.dash}
                    />
                  </g>
                );
              })}
              
              {coords.map((pt, i) => {
                if (routeIndex !== 0) return null;
                return (
                  <g key={`node-${routeIndex}-${i}`}>
                    {/* Add custom icon like in the screenshot for hubs */}
                    <rect x={pt.x - 10} y={pt.y - 10} width="20" height="20" rx="4" fill="#1e293b" />
                    <circle cx={pt.x} cy={pt.y} r="3" fill="#fff" />
                    
                    <rect x={pt.x + 14} y={pt.y - 10} width={pt.name.length * 6 + 10} height="20" rx="10" fill="#0f172a" />
                    <text x={pt.x + 19} y={pt.y + 3} className="text-[9px] font-bold fill-white">
                      {pt.name}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      {(!routesToPlot || routesToPlot.length === 0) && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
          <div className="text-sm font-bold text-slate-500">Generate a route to view map</div>
        </div>
      )}

      {routesToPlot && routesToPlot.length > 0 && (
        <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur rounded-xl p-3 shadow-sm border border-slate-200 pointer-events-auto">
          <div className="space-y-2">
            {routesToPlot.slice(0,3).map((r: any, i: number) => {
              const style = routeStyles[i % routeStyles.length];
              return (
                <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-700">
                  <svg width="20" height="4">
                    <line x1="0" y1="2" x2="20" y2="2" stroke={style.color} strokeWidth="2" strokeDasharray={style.dash} />
                  </svg>
                  {style.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
