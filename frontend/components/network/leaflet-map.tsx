"use client"

import React, { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { NetworkNode, NetworkLink } from "@/types"
import { Layers, ChevronDown, ChevronUp, Play, Pause, AlertTriangle } from "lucide-react"
import { useGetRiskOverlay } from "@/services/queries"

interface LeafletMapProps {
  nodes: NetworkNode[]
  links: NetworkLink[]
  selectedNodeId: string | null
  selectedLinkId: string | null
  onSelectNode: (node: NetworkNode | null) => void
  onSelectLink: (link: NetworkLink | null) => void
  activeLayer: string
  layerState?: any
}

// Icons logic
// Icons logic - Fluent UI style approximations
const getHubIconSVG = (type: string, color: string) => {
  if (type === "Repair Center") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`
  } else if (type === "International Hub") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
  } else if (type === "Satellite Hub" || type === "Satellite") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`
  } else if (type === "Regional Hub") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="14" rx="2"/><polyline points="3 8 12 3 21 8"/><line x1="12" y1="22" x2="12" y2="15"/></svg>`
  } else {
    // Primary Hub
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${color}20" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="14" rx="2"/><polyline points="3 8 12 3 21 8"/><line x1="12" y1="22" x2="12" y2="15"/></svg>`
  }
}

const createArc = (start: [number, number], end: [number, number], bend = 0.2): [number, number][] => {
  const points: [number, number][] = [];
  const steps = 30;
  const p1 = { lat: start[0], lng: start[1] };
  const p2 = { lat: end[0], lng: end[1] };
  const midPoint = [(p1.lat + p2.lat) / 2, (p1.lng + p2.lng) / 2];
  const dx = p2.lng - p1.lng;
  const dy = p2.lat - p1.lat;
  const len = Math.sqrt(dx * dx + dy * dy);
  const perpX = -dy / len;
  const perpY = dx / len;
  const controlPoint = [midPoint[0] + perpY * len * bend, midPoint[1] + perpX * len * bend];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const lat = mt * mt * p1.lat + 2 * mt * t * controlPoint[0] + t * t * p2.lat;
    const lng = mt * mt * p1.lng + 2 * mt * t * controlPoint[1] + t * t * p2.lng;
    points.push([lat, lng]);
  }
  return points;
}

const getTransportMode = (sourceId: string, targetId: string) => {
  const h = stableHash(`${sourceId}->${targetId}`) % 100;
  if (h < 25) return "air";
  if (h < 40) return "sea";
  if (h < 60) return "rail";
  return "road";
}

const stableHash = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 100000
  }
  return hash
}

export default function LeafletMap({
  nodes,
  links,
  selectedNodeId,
  selectedLinkId,
  onSelectNode,
  onSelectLink,
  activeLayer,
  layerState
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersLayer = useRef<L.LayerGroup | null>(null)
  const linesLayer = useRef<L.LayerGroup | null>(null)
  const heatLayer = useRef<L.LayerGroup | null>(null)
  const simulationLayer = useRef<L.LayerGroup | null>(null)
  const riskLayer = useRef<L.LayerGroup | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)

  const { data: riskEvents } = useGetRiskOverlay()

  // Filter nodes/links based on layerState
  const visibleNodes = nodes.filter(n => {
    if (!layerState) return true

    // Flat format fallback
    if (layerState.hubs !== undefined) {
      if (n.type === "Repair Center" && !layerState.repairCenters) return false
      if (n.type !== "Repair Center" && !layerState.hubs) return false
      return true
    }

    // Nested format
    if (n.type === "Asset In Transit" && layerState.shipments?.inTransit === false) return false
    if (n.type === "Repair Center" && (!layerState.repair || !layerState.repair.tpr)) return false
    if (n.type === "Repair Center" && layerState.repair?.overloaded && n.status !== "Overloaded") return false
    if (n.type === "Repair Center" && layerState.repair?.normal && n.status === "Overloaded") return false
    if (n.type === "Primary Hub" && (!layerState.network || !layerState.network.primary)) return false
    if (n.type === "Regional Hub" && (!layerState.network || !layerState.network.regional)) return false
    if ((n.type === "Satellite Hub" || n.type === "Satellite") && (!layerState.network || !layerState.network.satellite)) return false
    if (n.type === "International Hub" && (!layerState.network || !layerState.network.international)) return false
    return true
  })

  const visibleLinks = links.filter(l => {
    if (!layerState) return true

    // Flat format fallback
    if (layerState.forwardLogistics !== undefined) {
      if (l.flow_type === "Forward" && !layerState.forwardLogistics) return false
      if (l.flow_type === "Reverse" && !layerState.reverseLogistics) return false
      return true
    }

    // Nested format
    const isAiMode = layerState.ai?.xrayMode;
    const mode = getTransportMode(l.source_id, l.target_id);
    if (!layerState.shipments?.[mode]) return false;
    
    // AI Vision Layers specific filtering if needed, but usually we just style differently
    
    if (l.flow_type === "Forward" && layerState.shipments?.forward === false) return false
    if (l.flow_type === "Reverse" && layerState.shipments?.reverse === false) return false
    if (l.sla_breach_rate > 30 && layerState.shipments?.delayed === false) return false
    
    // Traffic & Congestion filtering
    const isHeavy = l.sla_breach_rate >= 50 || l.volume > 1500;
    const isModerate = !isHeavy && (l.sla_breach_rate >= 20 || l.volume > 800);
    const isHealthy = !isHeavy && !isModerate;
    
    if (isHealthy && layerState.traffic?.health === false) return false;
    if (isModerate && layerState.traffic?.moderate === false) return false;
    if (isHeavy && layerState.traffic?.heavy === false) return false;

    return true
  })

  const activeCostLayerForUi = (
    layerState?.heatmaps?.active && layerState.heatmaps.active !== "none"
      ? layerState.heatmaps.active
      : activeLayer
  ) === "cost" || !!layerState?.risk?.cost

  useEffect(() => {

    if (!mapRef.current) return

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        center: [22, 65],
        zoom: 3,
        minZoom: 2,
        maxZoom: 10,
        zoomControl: false
      })

      // Clean, premium enterprise base map with labels
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; CARTO',
        subdomains: "abcd"
      }).addTo(mapInstance.current)

      L.control.zoom({ position: "bottomright" }).addTo(mapInstance.current)

      linesLayer.current = L.layerGroup().addTo(mapInstance.current)
      heatLayer.current = L.layerGroup().addTo(mapInstance.current)
      markersLayer.current = L.layerGroup().addTo(mapInstance.current)
      simulationLayer.current = L.layerGroup().addTo(mapInstance.current)
      riskLayer.current = L.layerGroup().addTo(mapInstance.current)
    }

    const map = mapInstance.current
    const markers = markersLayer.current!
    const lines = linesLayer.current!
    const heat = heatLayer.current!

    markers.clearLayers()
    lines.clearLayers()
    heat.clearLayers()
    
    // Risk Layer drawing happens in a separate effect


    const activeHeatLayer = layerState?.heatmaps?.active && layerState.heatmaps.active !== "none"
      ? layerState.heatmaps.active
      : activeLayer
    const activeCostLayer = activeHeatLayer === "cost" || !!layerState?.risk?.cost
    const maxVisibleCost = Math.max(1, ...visibleLinks.map(link => Number(link.total_cost || 0)))
    const topCostLinks = new Set(
      [...visibleLinks]
        .sort((a, b) => Number(b.total_cost || 0) - Number(a.total_cost || 0))
        .slice(0, 8)
        .map(link => `${link.source_id}->${link.target_id}`)
    )

    const getLinkStyle = (link: NetworkLink, isSelected: boolean) => {
      const mode = getTransportMode(link.source_id, link.target_id);
      let color = mode === 'road' ? "#10B981" : mode === 'sea' ? "#06B6D4" : mode === 'air' ? "#3B82F6" : "#4B5563";
      let weight = isSelected ? 4 : 1.5;
      let opacity = isSelected ? 0.88 : (mode === 'road' || mode === 'rail' ? 0.35 : 0.6);
      let dashArray = mode === 'air' ? "4, 6" : undefined;
      
      const isHeavy = link.sla_breach_rate >= 50 || link.volume > 1500;
      const isModerate = !isHeavy && (link.sla_breach_rate >= 20 || link.volume > 800);
      const isHealthy = !isHeavy && !isModerate;

      // Traffic coloring (Google Maps style)
      if (layerState?.ai?.xrayMode) {
        if (isHeavy) {
          color = "#DC2626"; // Red pulse for congestion
          weight = isSelected ? 5 : 2.5;
          opacity = isSelected ? 0.9 : 0.5;
        } else if (isModerate) {
          color = "#F59E0B"; // Amber for leakage/moderate
        } else {
          color = "#10B981"; // Healthy Green
        }
      } else {
        if (isHeavy && layerState?.traffic?.heavy) {
          color = "#DC2626";
        } else if (isModerate && layerState?.traffic?.moderate) {
          color = "#F59E0B";
        } else if (isHealthy && layerState?.traffic?.health) {
          color = "#10B981";
        }
      }

      // AI Recommended override
      if (layerState?.ai?.xrayMode && link.total_cost < 200000 && link.sla_breach_rate < 10) {
        color = "#0EA5E9"; // Electric Blue glow
        weight = 2;
        opacity = 0.8;
      }
      
      return { color, weight, opacity, dashArray, mode }
    }

    const nodeHeat = new Map<string, { cost: number; volume: number; sla: number; links: number }>()
    visibleNodes.forEach(node => nodeHeat.set(node.id, { cost: 0, volume: 0, sla: 0, links: 0 }))
    visibleLinks.forEach(link => {
      ;[link.source_id, link.target_id].forEach(id => {
        const current = nodeHeat.get(id)
        if (!current) return
        current.cost += link.total_cost || 0
        current.volume += link.volume || 0
        current.sla += link.sla_breach_rate || 0
        current.links += 1
      })
    })

    const heatColor = (value: number, layer: string) => {
      if (layer === "cost") return value > 750000 ? "#2563EB" : value > 300000 ? "#10B981" : "#93C5FD"
      if (layer === "inventory") return value < 0.25 ? "#EF4444" : value < 0.5 ? "#F59E0B" : "#00C853"
      if (layer === "utilization") return value > 0.85 ? "#EF4444" : value > 0.65 ? "#F59E0B" : "#0EA5E9"
      if (layer === "health") return value > 50 ? "#EF4444" : value > 25 ? "#F59E0B" : "#00C853"
      return value > 50 ? "#EF4444" : value > 25 ? "#F59E0B" : "#00C853"
    }

      if (["sla", "cost", "inventory", "utilization", "health"].includes(activeHeatLayer)) {
      visibleNodes.forEach(node => {
        const aggregate = nodeHeat.get(node.id) || { cost: 0, volume: 0, sla: 0, links: 0 }
        const avgSla = aggregate.links ? aggregate.sla / aggregate.links : 0
        const inventoryRatio = node.capacity ? node.current_stock / node.capacity : 0
        const value =
          activeHeatLayer === "cost" ? aggregate.cost :
          activeHeatLayer === "inventory" ? inventoryRatio :
          activeHeatLayer === "utilization" ? node.utilisation :
          activeHeatLayer === "health" ? Math.max(avgSla, node.status === "Overloaded" ? 80 : 0) :
          avgSla
        const radius =
          activeHeatLayer === "cost" ? Math.max(180000, Math.min(900000, 140000 + aggregate.cost * 0.8)) :
          activeHeatLayer === "inventory" ? Math.max(120000, Math.min(520000, (1 - inventoryRatio) * 520000)) :
          activeHeatLayer === "utilization" ? Math.max(140000, Math.min(650000, node.utilisation * 650000)) :
          Math.max(140000, Math.min(700000, 180000 + value * 7000))
        const color = heatColor(value, activeHeatLayer)

        L.circle([node.latitude, node.longitude], {
          radius,
          color,
          fillColor: color,
          fillOpacity: 0.055,
          opacity: 0.12,
          weight: 1,
          interactive: false,
        }).addTo(heat)

        L.circleMarker([node.latitude, node.longitude], {
          radius: 4,
          color: "#ffffff",
          fillColor: color,
          fillOpacity: 1,
          opacity: 1,
          weight: 2,
          interactive: false,
        }).addTo(heat)
      })
    }

    visibleLinks.forEach((link) => {
      const isSelected = selectedLinkId === `${link.source_id}->${link.target_id}`
      const style = getLinkStyle(link, isSelected)

      if (activeCostLayer) {
        const costRatio = Math.min(1, Number(link.total_cost || 0) / maxVisibleCost)
        L.polyline([link.source_coordinates, link.target_coordinates], {
          color: style.color,
          weight: style.weight + 1.5,
          opacity: 0.1 + costRatio * 0.1,
          interactive: false
        }).addTo(lines)
      }

      const lineCoords = (style.mode === 'air' || style.mode === 'sea') 
        ? createArc(link.source_coordinates, link.target_coordinates)
        : [link.source_coordinates, link.target_coordinates];
        
      if (layerState?.ai?.xrayMode && link.total_cost < 200000 && link.sla_breach_rate < 10) {
        L.polyline(lineCoords, {
          color: "#0EA5E9",
          weight: style.weight + 6,
          opacity: 0.15,
          interactive: false
        }).addTo(lines)
      }

      const polyline = L.polyline(lineCoords, {
        color: style.color,
        weight: style.weight,
        opacity: style.opacity,
        dashArray: style.dashArray,
        interactive: true
      })

      polyline.on("click", () => {
        onSelectNode(null)
        onSelectLink(link)
      })

      let riskInfo = link.sla_breach_rate > 50 ? `<div class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 font-medium text-xs">High Risk Corridor</div>` : ""

      polyline.bindTooltip(
        `<div class="p-3 space-y-1.5 text-xs select-none min-w-[200px] bg-white rounded-xl border border-slate-100 shadow-xl font-sans text-slate-800">
          <div class="font-bold border-b border-slate-100 pb-2 text-slate-900 flex justify-between">
            <span class="uppercase tracking-wider text-[10px] text-slate-400">${link.flow_type} Route</span>
            <span class="text-[#0EA5E9] font-black">${link.source_id}-${link.target_id}</span>
          </div>
          <div class="flex justify-between pt-1"><span>Volume:</span> <span class="font-bold">${(link.volume ?? 0).toLocaleString()}</span></div>
          <div class="flex justify-between"><span>Cost:</span> <span class="font-bold text-[#00C853]">$${(link.total_cost ?? 0).toLocaleString()}</span></div>
          <div class="flex justify-between"><span>Delay Risk:</span> <span class="font-bold ${(link.sla_breach_rate ?? 0) >= 50.0 ? 'text-red-600' : 'text-slate-700'}">${(link.sla_breach_rate ?? 0).toFixed(1)}%</span></div>
          ${riskInfo}
        </div>`,

        { sticky: true, opacity: 1, className: "custom-tooltip" }
      )

      lines.addLayer(polyline)

      if (activeCostLayer && topCostLinks.has(`${link.source_id}->${link.target_id}`)) {
        const midLat = (link.source_coordinates[0] + link.target_coordinates[0]) / 2
        const midLng = (link.source_coordinates[1] + link.target_coordinates[1]) / 2
        const label = L.divIcon({
          className: "cost-corridor-label",
          html: `<div class="rounded-lg border border-white/80 bg-slate-950/90 px-2.5 py-1 text-[10px] font-black text-white shadow-xl">
            $${Math.round(Number(link.total_cost || 0)).toLocaleString()}
          </div>`,
          iconSize: [92, 24],
          iconAnchor: [46, 12]
        })
        L.marker([midLat, midLng], { icon: label, interactive: false }).addTo(lines)
      }
    })

    visibleNodes.forEach((node) => {
      const isSelected = selectedNodeId === node.id
      const isOverloaded = node.status === "Overloaded" || (layerState?.risk?.congestion && node.utilisation > 0.8)

      let bgClass = "bg-white"
      let strokeColor = "#00C853" // Gamma Green for standard Hubs

      if (node.type === "Repair Center") strokeColor = "#2563EB" // Blue for repair
      else if (node.type === "International Hub") strokeColor = "#111827" // Dark for International

      let sizeClass = "h-8 w-8"
      let pulseHtml = ""

      if (isSelected) {
        pulseHtml = `<div class="absolute h-12 w-12 rounded-full bg-[#00C853] opacity-20 animate-ping"></div>`
      } else if (isOverloaded) {
        pulseHtml = `<div class="absolute h-10 w-10 rounded-full bg-red-500 opacity-20 animate-pulse"></div>`
        strokeColor = "#EF4444"
      }
      
      let aiIconHtml = '';
      if (layerState?.ai?.xrayMode) {
        if (node.utilisation > 0.85) {
          aiIconHtml = `<div class="absolute -top-1 -right-1 text-[10px] bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-sm z-20">!</div>`;
        } else if (node.inbound_shipments_count > 15) {
          aiIconHtml = `<div class="absolute -top-1 -right-1 text-[10px] bg-purple-500 text-white w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-sm z-20">+</div>`;
        }
      }

      const svgIcon = getHubIconSVG(node.type, strokeColor)

      const html = `<div class="relative flex items-center justify-center ${sizeClass}">
        ${pulseHtml}
        ${aiIconHtml}
        <div class="relative z-10 flex items-center justify-center h-8 w-8 rounded-full border-2 border-white shadow-md transition-transform duration-200 hover:scale-110 ${bgClass}" style="box-shadow: 0 4px 14px rgba(0,0,0,0.1); outline: 2px solid ${strokeColor}; outline-offset: -2px;">
          ${svgIcon}
        </div>
      </div>`

      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })

      const marker = L.marker([node.latitude, node.longitude], { icon: customIcon })

      marker.on("click", () => {
        onSelectLink(null)
        onSelectNode(node)
        map.setView([node.latitude, node.longitude], Math.max(map.getZoom(), 4), { animate: true })
      })

      // In Map Overview, we rely on the Holographic Panel rather than tooltips if possible.
      // But we can keep a minimal tooltip on hover for quick scanning.
      marker.bindTooltip(
        `<div class="px-3 py-2 text-xs font-bold bg-white text-slate-900 border border-slate-100 shadow-xl rounded-lg">
          ${node.name}
        </div>`,
        { direction: "top", offset: [0, -10], opacity: 1, className: "custom-tooltip" }
      )

      markers.addLayer(marker)
    })

  }, [visibleNodes, visibleLinks, selectedNodeId, selectedLinkId, activeLayer, layerState])

  // Simulation Engine for Moving Shipments
  useEffect(() => {
    if (!simulationLayer.current) return
    const simLayer = simulationLayer.current

    simLayer.clearLayers()
    if (!isPlaying) return

    const activeShipments: any[] = []

    visibleLinks.forEach((link, idx) => {
      const numShipments = Math.max(1, Math.min(2, Math.floor(link.volume / 100)))
      for(let i=0; i<numShipments; i++) {
        let status = "transit"
        if (link.flow_type === "Reverse") status = "reverse"
        else if (link.sla_breach_rate >= 60) status = "delayed"
        else if (link.sla_breach_rate < 15 && idx % 3 === 0) status = "delivered"

        if (status === "delivered" && layerState?.shipments && !layerState.shipments.delivered) continue
        if (status === "delayed" && layerState?.shipments && !layerState.shipments.delayed) continue
        if (status === "reverse" && layerState?.shipments && !layerState.shipments.reverse) continue

        const mode = getTransportMode(link.source_id, link.target_id);
        const hash = stableHash(`${link.source_id}-${link.target_id}-${i}`)
        activeShipments.push({
          id: `shipment-${link.source_id}-${link.target_id}-${i}`,
          source: link.source_coordinates,
          target: link.target_coordinates,
          progress: (hash % 100) / 100,
          speed: (mode === 'air' ? 0.003 : mode === 'sea' ? 0.0005 : 0.001) + ((hash % 17) / 10000),
          status,
          mode,
          costBase: link.total_cost / 100
        })
      }
    })

    const markersMap = new Map<string, L.Marker>()

    const tick = setInterval(() => {
      activeShipments.forEach(s => {
        s.progress += s.speed
        if (s.progress > 1) s.progress = 0

        let pathCoords = s.mode === 'air' || s.mode === 'sea' 
          ? createArc(s.source, s.target) 
          : [s.source, s.target];
        
        let lat = s.source[0];
        let lng = s.source[1];
        
        if (pathCoords.length > 2) {
          const idx = Math.floor(s.progress * (pathCoords.length - 1));
          lat = pathCoords[idx][0];
          lng = pathCoords[idx][1];
        } else {
          lat = s.source[0] + (s.target[0] - s.source[0]) * s.progress;
          lng = s.source[1] + (s.target[1] - s.source[1]) * s.progress;
        }

        let color = "#00C853" // Gamma Green
        if (s.status === "delayed") color = "#DC2626"
        else if (s.status === "transit") color = "#10B981"
        else if (s.status === "reverse") color = "#F59E0B" // Amber
        
        if (layerState?.ai?.xrayMode && s.status !== "delayed") color = "#0EA5E9"; // Electric Blue glow in AI mode

        let marker = markersMap.get(s.id)
        if (!marker) {
          let svgIcon = '';
          if (s.mode === 'road') svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;
          else if (s.mode === 'air') svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5"><path d="M17.8 19.2 16 11l-3.5-3.5C11.3 6.3 9.7 6.1 8 7.5L5 9l4.5 4.5L6 18l-3-1 1-4-2-2 3-3 2 2 3-3L15 4c2.8-2.8 7.2-.8 8 3l-1.8 10-3.4 2.2z"/></svg>`;
          else if (s.mode === 'sea') svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5"><path d="M2 12h20l-2 8H4Z"/><path d="M6 12V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8"/></svg>`;
          else if (s.mode === 'rail') svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5"><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16"/><line x1="12" y1="3" x2="12" y2="19"/><path d="M8 19l-2 3"/><path d="M16 19l2 3"/></svg>`;

          const iconHtml = `
            <div class="relative flex items-center justify-center transition-all duration-300 transform scale-110 shadow-sm" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">
              ${svgIcon}
            </div>
          `
          const customIcon = L.divIcon({
            className: "shipment-marker",
            html: iconHtml,
            iconSize: [8, 8],
            iconAnchor: [4, 4]
          })
          marker = L.marker([lat, lng], { icon: customIcon, interactive: false })
          marker.addTo(simLayer)
          markersMap.set(s.id, marker)
        } else {
          marker.setLatLng([lat, lng])
        }
      })
    }, 50)

    return () => clearInterval(tick)
  }, [visibleLinks, isPlaying, layerState])

  // Risk Overlay Rendering
  useEffect(() => {
    if (!riskLayer.current || !riskEvents) return
    const layer = riskLayer.current
    layer.clearLayers()

    // Draw risk zones (e.g. from GDACS or Weather)
    riskEvents.forEach(risk => {
      const isCritical = risk.severity === 'Critical'
      const color = isCritical ? '#DC2626' : risk.severity === 'High' ? '#F97316' : '#F59E0B'
      
      // Pulse animation marker
      const html = `<div class="relative flex items-center justify-center h-12 w-12">
        <div class="absolute h-full w-full rounded-full animate-ping" style="background-color: ${color}; opacity: 0.3"></div>
        <div class="relative z-10 flex items-center justify-center h-8 w-8 rounded-full border border-white shadow-lg" style="background-color: ${color};">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
      </div>`
      
      const customIcon = L.divIcon({
        className: "risk-marker",
        html,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      })

      const marker = L.marker([risk.latitude, risk.longitude], { icon: customIcon })
      
      marker.bindTooltip(
        `<div class="p-3 w-64 bg-white rounded-xl shadow-2xl border border-red-100 text-sm font-sans">
          <div class="font-bold flex items-center gap-2 border-b border-slate-100 pb-2 mb-2 text-slate-900">
            <span class="px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider text-white" style="background-color: ${color}">${risk.severity}</span>
            <span class="truncate">${risk.title}</span>
          </div>
          <div class="text-xs text-slate-600 mb-3">${risk.description || 'Live alert'}</div>
          
          <div class="grid grid-cols-2 gap-2 mb-3">
            <div class="bg-slate-50 p-2 rounded border border-slate-100 text-center">
              <div class="text-[10px] text-slate-400 font-bold uppercase">Shipments</div>
              <div class="text-lg font-black text-slate-800">${risk.affected_shipments_count}</div>
            </div>
            <div class="bg-slate-50 p-2 rounded border border-slate-100 text-center">
              <div class="text-[10px] text-slate-400 font-bold uppercase">Hubs</div>
              <div class="text-lg font-black text-slate-800">${risk.affected_hubs.length}</div>
            </div>
          </div>
          
          <div class="bg-blue-50 border border-blue-100 text-blue-800 p-2 text-xs rounded font-medium">
            <div class="font-bold mb-1">AI Recommendation:</div>
            ${risk.recommended_action}
          </div>
        </div>`,
        { direction: "top", offset: [0, -20], opacity: 1, className: "custom-tooltip" }
      )
      
      marker.addTo(layer)

      // Add a huge semi-transparent radius circle
      L.circle([risk.latitude, risk.longitude], {
        radius: risk.radius_km * 1000,
        color: color,
        fillColor: color,
        fillOpacity: 0.05,
        weight: 1,
        dashArray: "4, 6",
        interactive: false
      }).addTo(layer)
      
      // Draw warning lines to affected hubs
      visibleNodes.forEach(hub => {
        if (risk.affected_hubs.includes(hub.name)) {
          L.polyline([[risk.latitude, risk.longitude], [hub.latitude, hub.longitude]], {
            color: color,
            weight: 2,
            dashArray: "4, 8",
            opacity: 0.5,
            interactive: false
          }).addTo(layer)
        }
      })
    })
  }, [riskEvents, visibleNodes])

  return (
    <div className="h-full w-full relative bg-slate-50 overflow-hidden" style={{ zIndex: 0 }}>
      <div ref={mapRef} className="h-full w-full z-10" />

      {/* Map Overlay Controls */}
      <div className="absolute top-4 right-4 z-20 flex space-x-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-lg hover:bg-slate-50 transition-colors text-[#00C853]"
          title="Toggle Simulation"
        >
          {isPlaying ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5" fill="currentColor" />}
        </button>
      </div>

      {activeCostLayerForUi && (
        <div className="absolute bottom-5 left-5 z-20 w-[300px] rounded-2xl border border-white/80 bg-white/95 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Corridor Cost Flow</p>
              <p className="mt-1 text-sm font-black text-slate-950">Line thickness and color show total lane cost</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">Live</span>
          </div>
          <div className="mt-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 via-amber-500 to-red-500" />
          <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-500">
            <span>Lower cost</span>
            <span>Highest cost</span>
          </div>
          <p className="mt-3 text-[11px] font-semibold leading-5 text-slate-600">
            Top cost corridors are labeled directly on the map for faster executive review.
          </p>
        </div>
      )}

      <style>{`
        .custom-tooltip {
          background: transparent;
          border: none;
          box-shadow: none;
        }
        .custom-tooltip .leaflet-tooltip-tip {
          display: none;
        }
        .leaflet-container {
          background: #f8fafc;
        }
      `}</style>
    </div>
  )
}
