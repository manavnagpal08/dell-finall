"use client"

import React from "react"
import { WorkspaceNode } from "@/hooks/use-workspace-state"
import { TPR } from "@/types"
import { BusinessImpactPanel, PredictionSummary, OptimizationSummary, ObjectTimeline } from "./shared-panels"
import { formatPercent } from "@/lib/utils"

export function TPRIntelligence({ node }: { node: WorkspaceNode }) {
  const tpr = node.data as TPR
  const hash = tpr.tpr_id.length * tpr.city.length
  
  const score = 80 + (hash % 15)
  const readiness = 70 + (hash % 30)
  const capacity = Math.round((tpr.current_workload / Math.max(tpr.repair_capacity_per_day, 1)) * 100)
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Intelligence Score</span>
          <span className="block text-4xl font-black text-slate-800 mt-2">{score}</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Repair Readiness</span>
          <span className={`block text-3xl font-black mt-2 ${readiness > 85 ? "text-emerald-500" : "text-amber-500"}`}>{readiness}%</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Current Capacity</span>
          <span className="block text-3xl font-black text-blue-500 mt-2">{capacity}%</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Repair Yield</span>
          <span className="block text-3xl font-black text-emerald-500 mt-2">{formatPercent(0.9 + (hash%9)/100)}</span>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Region</span>
          <span className="text-sm font-bold text-slate-700">{tpr.country}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Location</span>
          <span className="text-sm font-bold text-slate-700">{tpr.city}, {tpr.country}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Specialisation</span>
          <span className="text-sm font-bold text-slate-700">{tpr.specialisation}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Available Engineers</span>
          <span className="text-sm font-bold text-slate-700">{12 + (hash % 10)}</span>
        </div>
      </div>

      <PredictionSummary 
        riskLevel={capacity > 85 ? "High" : "Low"}
        confidence={`${90 + (hash%8)}%`}
        delayProb={`${5 + (hash%15)}%`}
        reason={capacity > 85 ? "High inbound volume exceeding daily repair throughput." : "Sufficient engineer availability."}
      />

      <OptimizationSummary 
        recommendation={capacity > 85 ? "Divert pending repairs to alternate TPR." : "Accept all inbound shipments."}
        savings="$8,500/mo"
        benefit="Maintains SLA"
        alternative="Cross-train 2 engineers"
      />

      <ObjectTimeline 
        steps={["Queueing", "Diagnostics", "Repairing", "QA Testing", "Ready for Dispatch"]}
        activeStep={1 + (hash%3)}
      />
    </div>
  )
}
