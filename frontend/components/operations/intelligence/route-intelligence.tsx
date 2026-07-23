"use client"

import React from "react"
import { WorkspaceNode } from "@/hooks/use-workspace-state"
import { BusinessImpactPanel, PredictionSummary, OptimizationSummary } from "./shared-panels"
import { formatCurrency } from "@/lib/utils"

export function RouteIntelligence({ node }: { node: WorkspaceNode }) {
  const route = node.data
  const hash = node.id.length
  
  const score = 75 + (hash % 15)
  const utilization = 60 + (hash % 35)
  const delayRate = 5 + (hash % 20)
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Route Efficiency</span>
          <span className="block text-4xl font-black text-slate-800 mt-2">{score}%</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Avg Transit Time</span>
          <span className="block text-3xl font-black text-blue-500 mt-2">{2 + (hash%4)} Days</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Historical Delay Rate</span>
          <span className={`block text-3xl font-black mt-2 ${delayRate > 15 ? "text-rose-500" : "text-emerald-500"}`}>{delayRate}%</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Carbon Score</span>
          <span className="block text-3xl font-black text-teal-500 mt-2">{80 + (hash%15)}/100</span>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Origin</span>
          <span className="text-sm font-bold text-slate-700">{route.origin}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Destination</span>
          <span className="text-sm font-bold text-slate-700">{route.destination}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Distance</span>
          <span className="text-sm font-bold text-slate-700">{route.distance} km</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Avg Cost / km</span>
          <span className="text-sm font-bold text-slate-700">{formatCurrency(route.cost_per_km)}</span>
        </div>
      </div>

      <PredictionSummary 
        riskLevel={delayRate > 15 ? "High" : "Low"}
        confidence={`${85 + (hash%10)}%`}
        delayProb={`${delayRate + 5}%`}
        reason={delayRate > 15 ? "Severe weather warnings along corridor." : "Clear passage expected."}
      />

      <OptimizationSummary 
        recommendation={delayRate > 15 ? "Consolidate shipments to larger vehicles." : "Maintain current schedule."}
        savings="$22,500/mo"
        benefit="Reduces carbon footprint by 15%"
        alternative="Shift 20% volume to rail transport"
      />

      <BusinessImpactPanel 
        cost="$85,000/mo"
        projected="$62,500/mo"
        savings="$22,500/mo"
        roi="1.8x"
        carbon="-12 MT CO2"
      />
    </div>
  )
}
