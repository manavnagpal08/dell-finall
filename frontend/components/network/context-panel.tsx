"use client"

import React from "react"
import { 
  X, 
  MapPin, 
  Layers, 
  Package, 
  Activity, 
  Clock, 
  DollarSign, 
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ShieldAlert
} from "lucide-react"
import { NetworkNode, NetworkLink } from "@/types"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { formatCurrency, formatPercent } from "@/lib/utils"

interface ContextPanelProps {
  selectedNode: NetworkNode | null
  selectedLink: NetworkLink | null
  onClear: () => void
}

export function ContextPanel({
  selectedNode,
  selectedLink,
  onClear
}: ContextPanelProps) {

  const getUtilColor = (utilisation: number) => {
    if (utilisation >= 0.85) return "bg-rose-50 border-rose-100 text-rose-700"
    if (utilisation >= 0.60) return "bg-amber-50 border-amber-100 text-amber-700"
    return "bg-emerald-50 border-emerald-100 text-emerald-700"
  }

  const getUtilBarColor = (utilisation: number) => {
    if (utilisation >= 0.85) return "bg-rose-500"
    if (utilisation >= 0.60) return "bg-amber-500"
    return "bg-emerald-500"
  }

  return (
    <div className="h-full w-full bg-white border border-brand-gray-med rounded-xl p-6 shadow-premium flex flex-col justify-between select-none">
      {/* 1. Header selection state */}
      <div className="flex items-start justify-between border-b border-brand-gray-med pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Operational Detail Panel</h3>
          <p className="text-[10px] text-brand-text-muted mt-0.5 uppercase tracking-wider font-semibold">Command Console</p>
        </div>
        {(selectedNode || selectedLink) && (
          <button 
            onClick={onClear} 
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="Clear Selection"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 2. Main Content area */}
      <div className="flex-1 py-6 overflow-y-auto">
        {/* Node detail display */}
        {selectedNode && (
          <div className="space-y-6">
            {/* Title block */}
            <div className="space-y-1">
              <span className="font-mono text-xs font-bold text-brand-primary">{selectedNode.id}</span>
              <h4 className="text-base font-extrabold text-slate-900 leading-tight">{selectedNode.name}</h4>
              <div className="flex items-center space-x-1.5 pt-1.5">
                <Badge variant={selectedNode.type === "Repair Center" ? "success" : "info"}>
                  {selectedNode.type}
                </Badge>
                {selectedNode.status !== "Normal" && (
                  <Badge variant={selectedNode.status === "Overloaded" ? "error" : "warning"}>
                    {selectedNode.status}
                  </Badge>
                )}
              </div>
            </div>

            {/* Geographical details */}
            <div className="flex items-center text-xs text-brand-text-muted font-medium bg-slate-50 border border-brand-gray-med p-3 rounded-xl">
              <MapPin className="h-4 w-4 text-slate-400 mr-2" />
              <span>{selectedNode.city}, {selectedNode.country} (Lat: {selectedNode.latitude.toFixed(2)}, Lon: {selectedNode.longitude.toFixed(2)})</span>
            </div>

            {/* Inbound/Outbound counts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-brand-gray-med p-3.5 rounded-xl bg-slate-50/20 text-center">
                <span className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">Inbound Feeds</span>
                <span className="block text-xl font-extrabold text-slate-900 mt-1">{selectedNode.inbound_shipments_count}</span>
              </div>
              <div className="border border-brand-gray-med p-3.5 rounded-xl bg-slate-50/20 text-center">
                <span className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">Outbound Feeds</span>
                <span className="block text-xl font-extrabold text-slate-900 mt-1">{selectedNode.outbound_shipments_count}</span>
              </div>
            </div>

            {/* Utilization Gauge */}
            <div className="space-y-2 border-t border-brand-gray-med pt-4">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-brand-text-muted uppercase tracking-wider text-[10px]">Utilization Rate</span>
                <span className={`px-2 py-0.5 rounded-full border text-[10px] ${getUtilColor(selectedNode.utilisation)}`}>
                  {formatPercent(selectedNode.utilisation * 100)}
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${getUtilBarColor(selectedNode.utilisation)}`} 
                  style={{ width: `${Math.min(selectedNode.utilisation * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Capacity Numbers */}
            <div className="grid grid-cols-2 gap-2 text-xs border-t border-brand-gray-med pt-4 text-slate-800">
              <div className="flex justify-between p-2 rounded-lg bg-slate-50/50">
                <span className="text-slate-500 font-medium">Stock Load:</span>
                <span className="font-extrabold text-slate-900">{selectedNode.current_stock.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50/50">
                <span className="text-slate-500 font-medium">Limit Max:</span>
                <span className="font-extrabold text-slate-900">{selectedNode.capacity.toLocaleString()}</span>
              </div>
            </div>

            {/* Overload Alert Banner */}
            {selectedNode.status === "Overloaded" && (
              <div className="border border-rose-200 bg-rose-50/30 rounded-xl p-4 flex items-start space-x-3 mt-4">
                <ShieldAlert className="h-5 w-5 text-brand-error flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h5 className="font-bold text-rose-800">Node Bottleneck Alert</h5>
                  <p className="text-rose-700 mt-1 leading-relaxed">
                    This location has breached optimal processing capacity. Inbound transit delays may propagate downstream.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Link detail display */}
        {selectedLink && (
          <div className="space-y-6">
            {/* Title block */}
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <Badge variant={selectedLink.flow_type === "Forward" ? "info" : "success"}>
                  {selectedLink.flow_type} Logistics
                </Badge>
              </div>
              <h4 className="text-base font-extrabold text-slate-900 leading-tight flex items-center pt-2">
                <span>{selectedLink.source_id}</span>
                <ArrowRight className="h-4 w-4 mx-2 text-slate-400" />
                <span>{selectedLink.target_id}</span>
              </h4>
              <p className="text-xs text-brand-text-muted mt-1">Operational shipping corridor analysis</p>
            </div>

            {/* Stats block list */}
            <div className="space-y-3.5">
              {/* Quantities & cost */}
              <div className="border border-brand-gray-med rounded-xl p-4 space-y-3 bg-slate-50/50">
                <h5 className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider flex items-center">
                  <DollarSign className="h-3.5 w-3.5 mr-1 text-slate-400" /> Lane Cost & Flow
                </h5>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Shipped Volume:</span>
                  <span className="font-extrabold text-slate-900">{selectedLink.volume.toLocaleString()} units</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Average Cost per Unit:</span>
                  <span className="font-extrabold text-slate-900">{formatCurrency(selectedLink.avg_cost_per_unit)}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-brand-gray-200 pt-2 mt-2">
                  <span className="font-bold text-slate-950">Total Accumulated Cost:</span>
                  <span className="font-extrabold text-brand-primary">{formatCurrency(selectedLink.total_cost)}</span>
                </div>
              </div>

              {/* Transit & SLA */}
              <div className="border border-brand-gray-med rounded-xl p-4 space-y-3 bg-slate-50/50">
                <h5 className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1 text-slate-400" /> Service SLA performance
                </h5>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Average Transit Duration:</span>
                  <span className="font-extrabold text-slate-900">{selectedLink.avg_transit_days.toFixed(1)} days</span>
                </div>
                <div className="flex justify-between text-xs border-t border-brand-gray-200 pt-2 mt-2">
                  <span className="font-bold text-slate-950">SLA Breach Frequency:</span>
                  <span className={`font-bold ${selectedLink.sla_breach_rate >= 50.0 ? 'text-brand-error' : 'text-slate-800'}`}>
                    {selectedLink.sla_breach_rate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* SLA breach alert banner */}
            {selectedLink.sla_breach_rate >= 50.0 && (
              <div className="border border-rose-200 bg-rose-50/30 rounded-xl p-4 flex items-start space-x-3 mt-4">
                <AlertTriangle className="h-5 w-5 text-brand-error flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h5 className="font-bold text-rose-800">High SLA Delay Risk</h5>
                  <p className="text-rose-700 mt-1 leading-relaxed">
                    This lane experiences a failure rate of &gt;50%. Logistics planners should analyze carrier schedules or seek sea/rail alternatives.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty select state */}
        {!selectedNode && !selectedLink && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-3">
            <div className="h-12 w-12 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900">No Asset Selected</h4>
              <p className="text-[11px] text-brand-text-muted mt-1 leading-relaxed max-w-[200px] mx-auto">
                Interact with the network map: click on any Hub circle, TPR center, or shipping line to inspect operational logs.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Panel footer info */}
      <div className="border-t border-brand-gray-med pt-4 text-[10px] text-brand-text-muted font-medium flex items-center justify-between">
        <span>Operational Ledger: Active</span>
        <span>Local Time: 20:38</span>
      </div>
    </div>
  )
}
