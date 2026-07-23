"use client"

import React from "react"
import { WorkspaceNode } from "@/hooks/use-workspace-state"
import { Hub } from "@/types"
import { BusinessImpactPanel, PredictionSummary, OptimizationSummary, ObjectTimeline } from "./shared-panels"
import { MapPin, Activity, Package, Share2, Layers } from "lucide-react"
import { formatCurrency, formatPercent } from "@/lib/utils"

export function HubIntelligence({ node }: { node: WorkspaceNode }) {
  const hub = node.data as Hub

  // Deterministic local scoring based on Hub ID
  const hash = hub.hub_id.length * hub.city.length

  const score = 85 + (hash % 10)
  const utilization = 60 + (hash % 35)
  const healthStatus = utilization > 90 ? "Overloaded" : utilization < 65 ? "Underutilized" : "Healthy"
  const healthColor = healthStatus === "Overloaded" ? "text-rose-500" : healthStatus === "Underutilized" ? "text-amber-500" : "text-emerald-500"

  const inventoryValue = 1200000 + (hash * 50000)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Executive Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Intelligence Score</span>
          <span className="block text-4xl font-black text-slate-800 mt-2">{score}</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Hub Utilization</span>
          <div className="flex flex-col items-center mt-2">
            <span className={`text-3xl font-black ${healthColor}`}>{utilization}%</span>
            <span className={`text-[9px] font-bold uppercase ${healthColor} bg-white px-2 mt-1 rounded-full border border-current`}>{healthStatus}</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Inventory Value</span>
          <span className="block text-3xl font-black text-slate-800 mt-2">{formatCurrency(inventoryValue)}</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">SLA Performance</span>
          <span className="block text-3xl font-black text-emerald-500 mt-2">{formatPercent(0.92 + (hash%5)/100)}</span>
        </div>
      </div>

      {/* Object Details */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Region</span>
          <span className="text-sm font-bold text-slate-700">{hub.country}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Location</span>
          <span className="text-sm font-bold text-slate-700">{hub.city}, {hub.country}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Hub Type</span>
          <span className="text-sm font-bold text-slate-700">{hub.hub_type}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Connected Routes</span>
          <span className="text-sm font-bold text-slate-700">{3 + (hash % 6)} Active Lanes</span>
        </div>
      </div>

      {/* Intelligent Summaries */}
      <PredictionSummary
        riskLevel={utilization > 90 ? "High" : utilization > 80 ? "Medium" : "Low"}
        confidence={`${88 + (hash%10)}%`}
        delayProb={`${10 + (hash%25)}%`}
        reason={utilization > 90 ? "Capacity limit approaching during peak hours." : "Normal operational volume."}
      />

      <OptimizationSummary
        recommendation={utilization > 90 ? "Offload 15% traffic to alternate regional hubs." : "Maintain current routing matrix."}
        savings={utilization > 90 ? "$45,200/mo" : "$0"}
        benefit={utilization > 90 ? "Prevents SLA breach penalties." : "Optimal efficiency reached."}
        alternative={utilization > 90 ? "Route via Secondary TPR" : "None"}
      />

      <BusinessImpactPanel
        cost="$125,000/mo"
        projected="$110,000/mo"
        savings="$15,000/mo"
        roi="2.4x"
        carbon="-4.2 MT CO2"
      />

      <ObjectTimeline
        steps={["Shift Started", "Receiving", "Processing", "Dispatching", "Shift End"]}
        activeStep={2 + (hash%2)}
      />

    </div>
  )
}
