"use client"

import React, { useState } from "react"
import { 
  ChevronRight, 
  ChevronDown, 
  MapPin, 
  Truck, 
  Package, 
  Wrench, 
  Clock, 
  Star,
  BarChart,
  Search,
  FolderOpen,
  Activity
} from "lucide-react"

import { WorkspaceNode } from "@/hooks/use-workspace-state"
import { useGetHubs, useGetTPRs, useGetParts, useGetTransactions } from "@/services/queries"

interface ExplorerProps {
  activeNode: WorkspaceNode | null
  favorites: WorkspaceNode[]
  recentObjects: WorkspaceNode[]
  onSelectNode: (node: WorkspaceNode) => void
}

export function OperationsExplorer({ activeNode, favorites, recentObjects, onSelectNode }: ExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    "favorites": true,
    "recent": true,
    "hubs": false,
    "routes": false,
    "tprs": false,
    "parts": false,
    "transactions": false
  })

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => ({ ...prev, [folder]: !prev[folder] }))
  }

  // Pre-fetch some data for the explorer tree
  const { data: hubsData } = useGetHubs({ page: 1, limit: 10 })
  const { data: tprsData } = useGetTPRs({ page: 1, limit: 10 })
  const { data: partsData } = useGetParts({ page: 1, limit: 10 })
  const { data: transData } = useGetTransactions({ page: 1, limit: 10 })

  const renderNode = (node: WorkspaceNode, icon: React.ReactNode) => {
    const isActive = activeNode?.id === node.id
    return (
      <button 
        key={node.id}
        onClick={() => onSelectNode(node)}
        className={`w-full flex items-center space-x-2 px-6 py-1.5 text-xs transition-colors group ${
          isActive ? "bg-blue-50 text-blue-700 font-bold border-r-2 border-blue-500" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <span className={`opacity-70 group-hover:opacity-100 ${isActive ? "text-blue-500" : ""}`}>
          {icon}
        </span>
        <span className="truncate">{node.label}</span>
      </button>
    )
  }

  const renderFolder = (id: string, label: string, icon: React.ReactNode, children: React.ReactNode, count?: number) => {
    const isExpanded = expandedFolders[id]
    return (
      <div className="mb-1">
        <button 
          onClick={() => toggleFolder(id)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-md transition-colors group"
        >
          <div className="flex items-center space-x-2">
            {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
            <span className="text-brand-primary">{icon}</span>
            <span>{label}</span>
          </div>
          {count !== undefined && <span className="text-[10px] text-slate-400 bg-slate-200 px-1.5 rounded">{count}</span>}
        </button>
        {isExpanded && (
          <div className="mt-1 space-y-0.5">
            {children}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-64 bg-slate-50 border-r border-slate-200 h-full flex flex-col select-none">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3">Enterprise Explorer</h2>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search (Ctrl+K)" 
            className="w-full bg-white border border-slate-200 text-xs rounded-md pl-9 pr-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
            readOnly // Managed by global search
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-2">
        
        {/* Favorites */}
        {renderFolder("favorites", "Favorites", <Star className="h-4 w-4 text-amber-500 fill-amber-500/20" />, (
          favorites.length === 0 ? (
            <div className="px-8 py-2 text-[10px] text-slate-400 italic">No favorites pinned</div>
          ) : (
            favorites.map(fav => renderNode(fav, <Star className="h-3 w-3" />))
          )
        ), favorites.length)}

        {/* Recent */}
        {renderFolder("recent", "Recent Objects", <Clock className="h-4 w-4" />, (
          recentObjects.length === 0 ? (
            <div className="px-8 py-2 text-[10px] text-slate-400 italic">No recent objects</div>
          ) : (
            recentObjects.map(obj => renderNode(obj, <Clock className="h-3 w-3" />))
          )
        ))}

        <div className="my-4 border-t border-slate-200 mx-2" />

        {/* Hubs */}
        {renderFolder("hubs", "Hubs", <MapPin className="h-4 w-4" />, (
          hubsData?.items.map(hub => renderNode(
            { id: hub.hub_id, type: "hub", label: hub.hub_name, subtitle: hub.city, data: hub }, 
            <MapPin className="h-3 w-3" />
          ))
        ))}

        {/* Routes */}
        {renderFolder("routes", "Routes", <Activity className="h-4 w-4 text-teal-500" />, (
          [
            { id: "RTE-DEL-BLR", origin: "Delhi Hub", destination: "Bangalore Hub", distance: 2150, cost_per_km: 1.15 },
            { id: "RTE-MUM-DXB", origin: "Mumbai Hub", destination: "Dubai TPR", distance: 1920, cost_per_km: 2.80 },
            { id: "RTE-MAA-SIN", origin: "Chennai Hub", destination: "Singapore TPR", distance: 2900, cost_per_km: 2.45 }
          ].map(route => renderNode(
            { id: route.id, type: "route", label: `${route.origin.split(" ")[0]} ➔ ${route.destination.split(" ")[0]}`, subtitle: `${route.distance} km`, data: route }, 
            <Activity className="h-3 w-3 text-teal-500" />
          ))
        ))}

        {/* Repair Centers */}
        {renderFolder("tprs", "Repair Centers", <Wrench className="h-4 w-4" />, (
          tprsData?.items.map(tpr => renderNode(
            { id: tpr.tpr_id, type: "tpr", label: tpr.tpr_name, subtitle: tpr.city, data: tpr }, 
            <Wrench className="h-3 w-3" />
          ))
        ))}

        {/* Parts */}
        {renderFolder("parts", "Parts & Inventory", <Package className="h-4 w-4" />, (
          partsData?.items.map(part => renderNode(
            { id: part.part_no, type: "part", label: part.part_no, data: part }, 
            <Package className="h-3 w-3" />
          ))
        ))}

        {/* Shipments */}
        {renderFolder("transactions", "Shipments", <Truck className="h-4 w-4" />, (
          transData?.items.map(tx => renderNode(
            { id: tx.transaction_id, type: "transaction", label: tx.transaction_id, data: tx }, 
            <Truck className="h-3 w-3" />
          ))
        ))}

        {/* Analytics */}
        {renderFolder("analytics", "Analytics", <BarChart className="h-4 w-4" />, (
          <div className="px-8 py-2 text-[10px] text-slate-400 italic">Operational views</div>
        ))}
      </div>
    </div>
  )
}
