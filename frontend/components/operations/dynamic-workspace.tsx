"use client"

import React from "react"
import { WorkspaceNode } from "@/hooks/use-workspace-state"
import { ChevronRight, Star, MapPin, Truck, Package, Wrench, Activity, Rocket, BrainCircuit, Route as RouteIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

import { HubIntelligence } from "./intelligence/hub-intelligence"
import { TPRIntelligence } from "./intelligence/tpr-intelligence"
import { PartIntelligence } from "./intelligence/part-intelligence"
import { ShipmentIntelligence } from "./intelligence/shipment-intelligence"
import { RouteIntelligence } from "./intelligence/route-intelligence"

interface WorkspaceProps {
  node: WorkspaceNode | null
  isFavorite: (id: string) => boolean
  toggleFavorite: (node: WorkspaceNode) => void
}

export function DynamicWorkspace({ node, isFavorite, toggleFavorite }: WorkspaceProps) {
  const router = useRouter()

  if (!node) {
    return (
      <div className="flex-1 bg-white flex flex-col items-center justify-center text-slate-400 select-none">
        <Rocket className="h-16 w-16 text-slate-200 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Enterprise Operations Explorer</h2>
        <p className="text-sm mt-2">Select an object from the left pane to view intelligence.</p>
        <p className="text-[10px] mt-4 uppercase tracking-widest font-bold">Press Ctrl+K to search</p>
      </div>
    )
  }

  const isFav = isFavorite(node.id)

  const renderIcon = () => {
    switch(node.type) {
      case "hub": return <MapPin className="h-5 w-5 text-blue-500" />
      case "tpr": return <Wrench className="h-5 w-5 text-emerald-500" />
      case "part": return <Package className="h-5 w-5 text-purple-500" />
      case "transaction": return <Truck className="h-5 w-5 text-orange-500" />
      case "route": return <RouteIcon className="h-5 w-5 text-teal-500" />
      default: return <Activity className="h-5 w-5 text-slate-500" />
    }
  }

  const renderBreadcrumbs = () => (
    <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-6">
      <span>Operations</span>
      <ChevronRight className="h-3 w-3" />
      <span>{node.type === "hub" ? "Hubs" : node.type === "tpr" ? "Repair Centers" : node.type === "part" ? "Parts" : node.type === "route" ? "Routes" : "Shipments"}</span>
      <ChevronRight className="h-3 w-3" />
      <span className="text-slate-700">{node.label}</span>
    </div>
  )

  const renderIntelligenceView = () => {
    switch(node.type) {
      case "hub": return <HubIntelligence node={node} />
      case "tpr": return <TPRIntelligence node={node} />
      case "part": return <PartIntelligence node={node} />
      case "transaction": return <ShipmentIntelligence node={node} />
      case "route": return <RouteIntelligence node={node} />
      default: return <div>Unknown Object Type</div>
    }
  }

  const getStatusTag = () => {
    const hash = node.id.length
    if (node.type === "transaction" && (node.data.sla_breach || hash % 5 === 0)) return { label: "Delayed", color: "bg-rose-100 text-rose-600 border-rose-200" }
    if (node.type === "hub" && hash % 4 === 0) return { label: "Overloaded", color: "bg-amber-100 text-amber-600 border-amber-200" }
    return { label: "Healthy", color: "bg-emerald-100 text-emerald-600 border-emerald-200" }
  }

  const status = getStatusTag()

  return (
    <div className="flex-1 bg-white overflow-y-auto p-8 border-r border-slate-200 custom-scrollbar relative">
      {renderBreadcrumbs()}
      
      {/* Universal Object Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-100">
        <div className="flex items-center space-x-4">
          <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
            {renderIcon()}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black text-slate-900">{node.label}</h1>
              <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-sm text-slate-500 font-medium">{node.subtitle || "Enterprise Asset"}</p>
              <span className="text-slate-300">•</span>
              <p className="text-xs text-slate-400">Last updated: Just now</p>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" className="h-10 bg-white" onClick={() => router.push("/network")}>
            <MapPin className="h-4 w-4 mr-2 text-slate-500" /> Locate
          </Button>
          <button 
            onClick={() => toggleFavorite(node)}
            className={`h-10 w-10 rounded-lg border flex items-center justify-center transition-all ${
              isFav ? "bg-amber-50 border-amber-200 text-amber-500" : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
            }`}
          >
            <Star className={`h-4 w-4 ${isFav ? "fill-amber-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Dynamic Intelligence Body */}
      {renderIntelligenceView()}

      {/* Universal Quick Actions */}
      <div className="mt-12 space-y-4 pt-6 border-t border-slate-100">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200" onClick={() => router.push(`/ai-investigation?objectId=${node.id}&type=${node.type}`)}>
            <BrainCircuit className="h-4 w-4 mr-2" /> Investigate with AI
          </Button>
          <Button variant="outline" className="bg-slate-50" onClick={() => router.push("/predictions/dashboard")}>
            <Activity className="h-4 w-4 mr-2 text-indigo-500" /> Open Predictions
          </Button>
          <Button variant="outline" className="bg-slate-50" onClick={() => router.push("/optimization")}>
            <Activity className="h-4 w-4 mr-2 text-emerald-500" /> Open Optimization
          </Button>
        </div>
      </div>
    </div>
  )
}
