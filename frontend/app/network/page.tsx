"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { 
  Layers, 
  MapPin, 
  ChevronRight,
  ChevronDown,
  Wrench,
  Truck,
  Box,
  AlertTriangle,
  BrainCircuit,
  Zap,
  TrendingUp,
  RotateCcw,
  BarChart4,
  Activity,
  Play,
  Pause,
  CheckCircle,
} from "lucide-react"

import { useGetNetworkOverview } from "@/services/queries"
import { MapContainer } from "@/components/network/map-container"
import { NetworkNode, NetworkLink } from "@/types"
import { ErrorState } from "@/components/state/error-state"
import { Badge } from "@/components/ui/badge"
import apiClient from "@/services/api-client"

interface LiveShipment {
  shipment_id: string
  origin: string
  destination: string
  origin_coords: [number, number]
  dest_coords: [number, number]
  progress: number
  eta_hours: number
  status: string
  priority: string
  route_color: string
}

interface CarbonStats {
  total_co2_kg: number
  co2_per_shipment: number
  greenest_route: string
  highest_emission_corridor: string
  carbon_savings_ytd_kg: number
  sustainability_score: number
}

interface TwinHealth {
  network_health_score: number
  total_logistics_cost: number
  total_shipments: number
  forward_shipments: number
  reverse_shipments: number
  active_recommendations: number
  approved_recommendations: number
  money_saved: number
  hub_utilization: number
  tpr_utilization: number
  system_status: string
}

const toLatLng = (coords: [number, number]): [number, number] => {
  const [first, second] = coords
  return Math.abs(first) > 45 && Math.abs(second) <= 45 ? [second, first] : coords
}

export default function MapOverviewPage() {
  const { data: network, isLoading, isError, refetch } = useGetNetworkOverview({})

  // Sidebar views: "layers" | "shipments"
  const [activeTab, setActiveTab] = useState<"layers" | "shipments">("layers")

  // Sidebar toggles
  const [expandedSection, setExpandedSection] = useState<string>("Hubs")
  
  // Layer state to filter map
  const [layerState, setLayerState] = useState<any>({
    network: { primary: true, regional: true, satellite: true, international: true, repair: true },
    shipments: { road: true, air: true, sea: true, rail: true },
    routes: { normal: true, aiRecommended: true },
    ai: { xrayMode: false },
    traffic: { health: true, moderate: true, heavy: true },
    risk: { cost: false, inventory: false, sla: false, congestion: false }
  })

  // Selected object
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [selectedLink, setSelectedLink] = useState<NetworkLink | null>(null)
  const [selectedShipment, setSelectedShipment] = useState<LiveShipment | null>(null)

  // Live Shipments state
  const [shipments, setShipments] = useState<LiveShipment[]>([])
  const [carbon, setCarbon] = useState<CarbonStats | null>(null)
  const [health, setHealth] = useState<TwinHealth | null>(null)
  const [twinError, setTwinError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isTabVisible, setIsTabVisible] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)

  // Expand animation state for the panel
  const [panelReady, setPanelReady] = useState(false)
  useEffect(() => {
    if (selectedNode || selectedLink || selectedShipment) {
      setPanelReady(false)
      const t = setTimeout(() => setPanelReady(true), 150)
      return () => clearTimeout(t)
    }
  }, [selectedNode, selectedLink, selectedShipment])

  const loadTwinData = useCallback(async () => {
    try {
      const [healthRes, shipRes, carbonRes] = await Promise.all([
        apiClient.get("/twin/network-health"),
        apiClient.get("/twin/shipments"),
        apiClient.get("/twin/carbon")
      ])
      setHealth(healthRes.data)
      setShipments(shipRes.data)
      setCarbon(carbonRes.data)
      setTwinError(null)
      if (shipRes.data.length > 0) {
        setSelectedShipment(shipRes.data[0])
      }
    } catch (e) {
      console.error(e)
      setHealth(null)
      setShipments([])
      setCarbon(null)
      setSelectedShipment(null)
      setTwinError("Twin feeds are unavailable. Network topology still uses /network/overview.")
    }
  }, [])

  useEffect(() => {
    loadTwinData()
  }, [loadTwinData])

  useEffect(() => {
    const updateVisibility = () => setIsTabVisible(document.visibilityState === "visible")
    updateVisibility()
    document.addEventListener("visibilitychange", updateVisibility)
    return () => document.removeEventListener("visibilitychange", updateVisibility)
  }, [])

  // Playback timeline animation loop
  useEffect(() => {
    if (!isPlaying || !isTabVisible) return

    const interval = setInterval(() => {
      setShipments(prev =>
        prev.map(s => {
          let nextProg = s.progress + (1.5 * playbackSpeed)
          if (nextProg >= 100) nextProg = 0 // reset loop
          return {
            ...s,
            progress: parseFloat(nextProg.toFixed(1))
          }
        })
      )
    }, 800)

    return () => clearInterval(interval)
  }, [isPlaying, isTabVisible, playbackSpeed])

  const toggleLayer = (category: string, key: string) => {
    setLayerState((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key]
      }
    }))
  }

  const { projectedNodes, projectedLinks } = useMemo(() => {
    const nodes: NetworkNode[] = (network?.nodes || []).map(n => ({ ...n }))
    const links: NetworkLink[] = (network?.links || []).map(l => ({ ...l }))

    shipments.forEach(s => {
      let srcNode = nodes.find(n => n.id === s.origin || n.city === s.origin || n.name === s.origin)
      let dstNode = nodes.find(n => n.id === s.destination || n.city === s.destination || n.name === s.destination)

      if (!srcNode) {
        const [lat, lng] = toLatLng(s.origin_coords)
        srcNode = {
          id: s.origin,
          name: s.origin,
          type: "Shipment Origin",
          city: s.origin,
          country: "Network",
          latitude: lat,
          longitude: lng,
          current_stock: 1,
          capacity: 1,
          utilisation: 0.65,
          status: "Normal",
          inbound_shipments_count: 0,
          outbound_shipments_count: 1
        }
        nodes.push(srcNode)
      }

      if (!dstNode) {
        const [lat, lng] = toLatLng(s.dest_coords)
        dstNode = {
          id: s.destination,
          name: s.destination,
          type: "Delivery Destination",
          city: s.destination,
          country: "Network",
          latitude: lat,
          longitude: lng,
          current_stock: 1,
          capacity: 1,
          utilisation: s.status === "Delayed" ? 0.92 : 0.58,
          status: s.status === "Delayed" ? "Overloaded" : "Normal",
          inbound_shipments_count: 1,
          outbound_shipments_count: 0
        }
        nodes.push(dstNode)
      }

      if (srcNode && dstNode) {
        const ratio = s.progress / 100
        const animLon = srcNode.longitude + (dstNode.longitude - srcNode.longitude) * ratio
        const animLat = srcNode.latitude + (dstNode.latitude - srcNode.latitude) * ratio

        nodes.push({
          id: s.shipment_id,
          name: `Shipment ${s.shipment_id}`,
          type: "Asset In Transit",
          city: "In transit",
          country: "Network",
          latitude: animLat,
          longitude: animLon,
          current_stock: 1,
          capacity: 1,
          utilisation: s.progress / 100,
          status: s.status === "Delayed" ? "Overloaded" : "Normal",
          inbound_shipments_count: 0,
          outbound_shipments_count: 0
        })
      }
    })

    return { projectedNodes: nodes, projectedLinks: links }
  }, [network?.links, network?.nodes, shipments])

  const sections = [
    {
      id: "Hub Types",
      icon: MapPin,
      items: [
        { key: "primary", label: "Primary Hubs", cat: "network" },
        { key: "regional", label: "Regional Hubs", cat: "network" },
        { key: "satellite", label: "Satellite Hubs", cat: "network" },
        { key: "international", label: "International Hubs", cat: "network" },
        { key: "repair", label: "Repair Centers", cat: "network" }
      ]
    },
    {
      id: "Shipment Types",
      icon: Truck,
      items: [
        { key: "road", label: "Road Shipment", cat: "shipments" },
        { key: "air", label: "Air Shipment", cat: "shipments" },
        { key: "sea", label: "Sea Shipment", cat: "shipments" },
        { key: "rail", label: "Rail Shipment", cat: "shipments" }
      ]
    },
    {
      id: "Route Types",
      icon: Zap,
      items: [
        { key: "normal", label: "Normal Route", cat: "routes" },
        { key: "aiRecommended", label: "AI Recommended", cat: "routes" }
      ]
    },
    {
      id: "AI Vision Layers",
      icon: BrainCircuit,
      items: [
        { key: "xrayMode", label: "AI Vision Mode", cat: "ai" }
      ]
    },
    {
      id: "Traffic & Congestion",
      icon: AlertTriangle,
      items: [
        { key: "health", label: "Healthy Route", cat: "traffic" },
        { key: "moderate", label: "Moderate Congestion", cat: "traffic" },
        { key: "heavy", label: "Heavy Congestion", cat: "traffic" }
      ]
    },
    {
      id: "Network Legend",
      icon: Layers,
      items: []
    }
  ]

  const activeMapLayer = layerState.ai.xrayMode
    ? "health"
    : layerState.risk.cost
    ? "cost"
    : layerState.risk.inventory
      ? "inventory"
    : layerState.risk.sla
      ? "sla"
      : layerState.risk.congestion
        ? "utilization"
        : "health"

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-t-[#00C853] border-[#00C853]/20 animate-spin" />
          <p className="mt-4 text-slate-500 font-bold text-xs uppercase tracking-widest">Initializing Map Workspace...</p>
        </div>
      </div>
    )
  }

  if (isError || !network) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 p-8">
        <ErrorState onRetry={refetch} description="Failed to initialize Map Overview queries. The backend API may be unreachable, or the dataset needs to be loaded first." />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full flex overflow-hidden bg-slate-100 font-sans text-xs">
      
      {/* Background Map */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          nodes={projectedNodes} 
          links={projectedLinks}
          selectedNodeId={selectedNode?.id || selectedShipment?.shipment_id || null}
          selectedLinkId={selectedLink ? `${selectedLink.source_id}->${selectedLink.target_id}` : null}
          onSelectNode={(node) => {
            if (node) {
              const matchingShipment = shipments.find(s => s.shipment_id === node.id)
              if (matchingShipment) {
                setSelectedShipment(matchingShipment)
                setSelectedNode(null)
                setSelectedLink(null)
              } else {
                setSelectedNode(node)
                setSelectedShipment(null)
                setSelectedLink(null)
              }
            } else {
              setSelectedNode(null)
            }
          }}
          onSelectLink={(link) => {
            setSelectedLink(link)
            setSelectedNode(null)
            setSelectedShipment(null)
          }}
          activeLayer={activeMapLayer}
          layerState={layerState}
          className="h-full w-full"
        />
      </div>

      {/* Unified Sidebar */}
      <div className="relative z-10 w-[320px] h-full bg-white/90 backdrop-blur-md shadow-[4px_0_24px_rgba(0,0,0,0.05)] border-r border-slate-200/50 flex flex-col pointer-events-auto">
        
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-200/50 space-y-3.5">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#00C853]" />
              Network Workspace
            </h2>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-700">
              {health ? `${health.network_health_score.toFixed(1)}% health` : twinError ? "Topology live" : "Live API"}
            </span>
          </div>
          {twinError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-bold leading-4 text-amber-800">
              {twinError}
            </div>
          )}

          {/* Playback controls (Always visible in Header) */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 p-2 rounded-xl text-[10px] font-bold text-slate-600">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsPlaying(prev => !prev)} 
                className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-200/40 hover:bg-slate-50 transition-colors"
                title={isPlaying ? "Pause Tracking" : "Play Tracking"}
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5 text-rose-500" /> : <Play className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />}
              </button>
              <span className="text-slate-400 font-extrabold text-[8px] uppercase tracking-wider">Network Replay:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.5"
                value={playbackSpeed}
                onChange={e => setPlaybackSpeed(parseFloat(e.target.value))}
                className="w-16 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00C853]"
              />
              <span className="font-mono text-[9px] w-8 text-right bg-white border border-slate-200/50 px-1 py-0.5 rounded shadow-sm">{playbackSpeed.toFixed(1)}x</span>
            </div>
          </div>

          {/* Workspace Tabs */}
          <div className="flex bg-slate-100/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("layers")}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                activeTab === "layers" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Layers Explorer
            </button>
            <button
              onClick={() => setActiveTab("shipments")}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                activeTab === "shipments" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Truck className="h-3 w-3" />
              Live Shipments ({shipments.length})
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {activeTab === "layers" ? (
            <>
              {sections.map((sec) => (
                <div key={sec.id} className="border border-slate-200/50 rounded-xl overflow-hidden bg-white/50 backdrop-blur-sm transition-all duration-200">
                  <button 
                    onClick={() => setExpandedSection(expandedSection === sec.id ? "" : sec.id)}
                    className={`w-full flex items-center justify-between p-3.5 transition-colors ${
                      expandedSection === sec.id ? "bg-green-50/50 border-b border-[#00C853]/10" : "hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <sec.icon className={`h-4 w-4 ${expandedSection === sec.id ? "text-[#00C853]" : "text-slate-400"}`} />
                      <span className={`text-xs font-bold ${expandedSection === sec.id ? "text-[#00C853]" : "text-slate-700"}`}>
                        {sec.id}
                      </span>
                    </div>
                    {expandedSection === sec.id ? <ChevronDown className="h-3.5 w-3.5 text-[#00C853]" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSection === sec.id ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="px-3 pb-3 space-y-1.5 pt-2">
                      {sec.id === "Network Legend" ? (
                        <div className="space-y-2 text-[11px] font-semibold text-slate-700 pl-1">
                          <div className={`flex items-center gap-2 transition-opacity ${layerState.network?.primary ? '' : 'opacity-30'}`}>
                            <span>🟢</span> Primary Hub
                          </div>
                          <div className={`flex items-center gap-2 transition-opacity ${layerState.network?.regional ? '' : 'opacity-30'}`}>
                            <span>🟩</span> Regional Hub
                          </div>
                          <div className={`flex items-center gap-2 transition-opacity ${layerState.network?.satellite ? '' : 'opacity-30'}`}>
                            <span>📦</span> Satellite Hub
                          </div>
                          <div className={`flex items-center gap-2 transition-opacity ${layerState.network?.international ? '' : 'opacity-30'}`}>
                            <span>🌍</span> International Hub
                          </div>
                          <div className={`flex items-center gap-2 transition-opacity ${layerState.network?.repair ? '' : 'opacity-30'}`}>
                            <span>🔧</span> Repair Center
                          </div>
                          <div className={`flex items-center gap-2 transition-opacity ${layerState.shipments?.road ? '' : 'opacity-30'}`}>
                            <span>🚚</span> Road Shipment
                          </div>
                          <div className={`flex items-center gap-2 transition-opacity ${layerState.shipments?.air ? '' : 'opacity-30'}`}>
                            <span>✈</span> Air Shipment
                          </div>
                          <div className={`flex items-center gap-2 transition-opacity ${layerState.shipments?.sea ? '' : 'opacity-30'}`}>
                            <span>🚢</span> Sea Shipment
                          </div>
                          <div className={`flex items-center gap-2 transition-opacity ${layerState.shipments?.rail ? '' : 'opacity-30'}`}>
                            <span>🚂</span> Rail Shipment
                          </div>
                          <div className={`flex items-center gap-2 transition-opacity ${layerState.traffic?.health ? '' : 'opacity-30'}`}>
                            <span>🟢</span> Healthy Route
                          </div>
                          <div className={`flex items-center gap-2 transition-opacity ${layerState.traffic?.moderate ? '' : 'opacity-30'}`}>
                            <span>🟡</span> Moderate Congestion
                          </div>
                          <div className={`flex items-center gap-2 transition-opacity ${layerState.traffic?.heavy ? '' : 'opacity-30'}`}>
                            <span>🔴</span> Heavy Congestion
                          </div>
                          <div className={`flex items-center gap-2 transition-opacity ${layerState.routes?.aiRecommended ? '' : 'opacity-30'}`}>
                            <span>🔵</span> AI Recommended Route
                          </div>
                          <div className={`flex items-center gap-2 transition-opacity ${layerState.ai?.xrayMode ? '' : 'opacity-30'}`}>
                            <span>⚠</span> Predicted SLA Risk
                          </div>
                        </div>
                      ) : (
                        sec.items.map(item => (
                          <label key={item.key} className="flex items-center gap-2.5 p-2 hover:bg-white rounded-lg cursor-pointer group transition-colors shadow-sm border border-transparent hover:border-slate-100">
                            <div className="relative flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={layerState[item.cat] && layerState[item.cat][item.key]}
                                onChange={() => toggleLayer(item.cat, item.key)}
                                className="peer appearance-none w-4 h-4 border border-slate-300 rounded focus:ring-0 checked:bg-[#00C853] checked:border-[#00C853] transition-colors"
                              />
                              <svg className="absolute w-2.5 h-2.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                              {item.label}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            /* Live Shipments List Tab */
            <div className="space-y-3">
              <div className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold pb-1">Transit Ledger</div>
              <div className="border border-slate-200/60 rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left border-collapse text-[10px] font-bold text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 uppercase text-[8px]">
                      <th className="p-2.5">ID</th>
                      <th className="p-2.5">Route</th>
                      <th className="p-2.5">Progress</th>
                      <th className="p-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.length === 0 && (
                      <tr>
                        <td className="p-4 text-center text-slate-400" colSpan={4}>
                          No live shipments returned by the backend.
                        </td>
                      </tr>
                    )}
                    {shipments.map(s => (
                      <tr
                        key={s.shipment_id}
                        onClick={() => {
                          setSelectedShipment(s)
                          setSelectedNode(null)
                          setSelectedLink(null)
                        }}
                        className={`border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors ${selectedShipment?.shipment_id === s.shipment_id ? 'bg-green-50/50 text-green-700' : ''}`}
                      >
                        <td className="p-2.5 font-extrabold text-slate-900">{s.shipment_id}</td>
                        <td className="p-2.5 truncate max-w-[85px]" title={`${s.origin} -> ${s.destination}`}>
                          {s.origin}{" -> "}{s.destination}
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[9px]">{s.progress}%</span>
                            <div className="w-8 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: `${s.progress}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-2.5 text-right">
                          <Badge variant={s.status === "Delayed" ? "error" : "info"} className="text-[8px] px-1 py-0.5">
                            {s.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Carbon Footprint Brief */}
              {carbon && (
                <div className="bg-emerald-50/20 border border-dashed border-emerald-200/80 rounded-xl p-3.5 space-y-2">
                  <p className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    Carbon Footprint Info
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-500">
                    <div>
                      <span className="text-[8px] text-slate-400 block uppercase">CO2 / Shipment</span>
                      <span className="text-slate-800 text-xs font-black">{carbon.co2_per_shipment} kg</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 block uppercase">Eco Score</span>
                      <span className="text-emerald-600 text-xs font-black">{carbon.sustainability_score}/100</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3D Holographic Intelligence Panel (For Nodes) */}
      {selectedNode && (
        <div className={`absolute top-6 right-6 z-20 w-[360px] transition-all duration-500 ease-out pointer-events-auto
          ${panelReady ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-12 scale-95'}
        `}>
          <div className="relative rounded-2xl bg-white/80 backdrop-blur-2xl border border-slate-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_0_20px_rgba(0,200,83,0.15)] overflow-hidden before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:border before:border-[#00C853]/30 before:animate-pulse">
            
            <div className="p-5 border-b border-slate-200/40 flex justify-between items-start bg-gradient-to-b from-white/60 to-transparent">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[#0EA5E9] flex items-center gap-1.5 mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] animate-pulse"></span>
                  {selectedNode.type}
                </p>
                <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedNode.name}</h3>
                <p className="text-xs font-semibold text-slate-500 mt-1">{selectedNode.city}, {selectedNode.country}</p>
              </div>
              <button onClick={() => setSelectedNode(null)} className="p-1.5 rounded-full bg-white/50 hover:bg-slate-100/80 text-slate-500 transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/70 rounded-xl p-3 border border-slate-100 shadow-sm backdrop-blur-sm">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Current Stock</p>
                  <p className="text-xl font-black text-slate-900 mt-1">{(selectedNode.current_stock ?? 0).toLocaleString()}</p>
                </div>
                <div className="bg-white/70 rounded-xl p-3 border border-slate-100 shadow-sm backdrop-blur-sm">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Utilization</p>
                  <p className={`text-xl font-black mt-1 ${(selectedNode.utilisation ?? 0) > 0.85 ? 'text-red-600' : 'text-[#00C853]'}`}>
                    {((selectedNode.utilisation ?? 0) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#f0fdf4]/90 to-white/90 border border-[#bbf7d0]/80 shadow-sm rounded-xl p-4 relative overflow-hidden group">
                <div className="absolute -top-4 -right-4 p-2 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                  <BrainCircuit className="h-24 w-24 text-[#00C853]" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A] flex items-center gap-1.5 mb-2 relative z-10">
                  <SparklesIcon /> AI Intelligence Forecast
                </p>
                <p className="text-xs font-semibold text-slate-700 relative z-10 leading-relaxed">
                  {(selectedNode.utilisation ?? 0) > 0.85 
                    ? "Capacity critical from live hub utilization. Redirect inbound priority flow to lower-utilized regional hubs before SLA exposure expands."
                    : "Operations stable from current utilization and stock. Keep monitoring connected corridors for cost, SLA, and shipment flow changes."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setLayerState((prev: any) => ({
                      ...prev,
                      risk: { ...prev.risk, congestion: true, cost: true }
                    }))
                    setExpandedSection("Risk Layers")
                  }}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#00C853] text-white text-xs font-bold shadow-md shadow-[#00C853]/20 hover:bg-[#16A34A] hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <Zap className="h-3.5 w-3.5" /> Optimize Flow
                </button>
                <button
                  onClick={() => {
                    setLayerState((prev: any) => ({
                      ...prev,
                      ai: { ...prev.ai, xrayMode: true },
                      risk: { ...prev.risk, sla: true, congestion: true }
                    }))
                  }}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white border border-[#00C853]/30 text-[#00C853] text-xs font-bold shadow-sm hover:bg-[#f0fdf4] hover:border-[#00C853] transition-all"
                >
                  <TrendingUp className="h-3.5 w-3.5" /> Forecast View
                </button>
                <button
                  onClick={() => setActiveTab("layers")}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 text-slate-600 text-xs font-bold shadow-sm hover:bg-slate-50 transition-all"
                >
                  <BarChart4 className="h-3.5 w-3.5" /> Details
                </button>
                <button
                  onClick={() => {
                    setActiveTab("shipments")
                    setIsPlaying(true)
                  }}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 text-slate-600 text-xs font-bold shadow-sm hover:bg-slate-50 transition-all"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Timeline
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Corridor Holographic Panel (For Links) */}
      {selectedLink && !selectedNode && (
        <div className={`absolute top-6 right-6 z-20 w-[320px] transition-all duration-500 ease-out pointer-events-auto
          ${panelReady ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-12 scale-95'}
        `}>
          <div className="relative rounded-2xl bg-white/80 backdrop-blur-2xl border border-slate-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_0_20px_rgba(14,165,233,0.15)] overflow-hidden before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:border before:border-[#0EA5E9]/30 before:animate-pulse">
            
            <div className="p-5 border-b border-slate-200/40 bg-gradient-to-b from-white/60 to-transparent">
              <div className="flex justify-between items-start mb-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#00C853] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] animate-pulse"></span>
                  Active Corridor
                </p>
                <button onClick={() => setSelectedLink(null)} className="p-1 rounded-full bg-white/50 hover:bg-slate-100/80 text-slate-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                {selectedLink.source_id} <ChevronRight className="h-4 w-4 text-slate-400" /> {selectedLink.target_id}
              </h3>
            </div>
            
            <div className="p-5 space-y-3.5">
              <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100">
                <span className="font-semibold text-slate-500 flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-slate-400"/> Flow Type</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{selectedLink.flow_type}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100">
                <span className="font-semibold text-slate-500 flex items-center gap-1.5"><Box className="h-3.5 w-3.5 text-slate-400"/> Volume</span>
                <span className="font-black text-slate-900 text-sm">{(selectedLink.volume ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100">
                <span className="font-semibold text-slate-500 flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-slate-400"/> Cost</span>
                <span className="font-black text-[#0EA5E9] text-sm">${(selectedLink.total_cost ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-slate-400"/> SLA Risk</span>
                <span className={`font-black text-sm ${(selectedLink.sla_breach_rate ?? 0) > 30 ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded-md' : 'text-slate-900'}`}>{(selectedLink.sla_breach_rate ?? 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function SparklesIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L13.8 8.6L19.5 10.5L13.8 12.4L12 18L10.2 12.4L4.5 10.5L10.2 8.6L12 3Z" fill="currentColor"/>
    </svg>
  )
}
