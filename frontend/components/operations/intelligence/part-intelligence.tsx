"use client"

import React from "react"
import { WorkspaceNode } from "@/hooks/use-workspace-state"
import { Part } from "@/types"
import { BusinessImpactPanel, PredictionSummary, OptimizationSummary } from "./shared-panels"
import { formatCurrency } from "@/lib/utils"

export function PartIntelligence({ node }: { node: WorkspaceNode }) {
  const part = node.data as Part
  const hash = part.part_no.length
  
  const score = 85 + (hash % 10)
  const health = 60 + (hash % 40)
  const demand = 100 + (hash % 500)
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Intelligence Score</span>
          <span className="block text-4xl font-black text-slate-800 mt-2">{score}</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Inventory Health</span>
          <span className={`block text-3xl font-black mt-2 ${health > 80 ? "text-emerald-500" : health > 50 ? "text-amber-500" : "text-rose-500"}`}>{health}%</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Unit Cost</span>
          <span className="block text-3xl font-black text-slate-800 mt-2">{formatCurrency(part.unit_cost_usd)}</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">30-Day Demand</span>
          <span className="block text-3xl font-black text-blue-500 mt-2">{demand} units</span>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Category</span>
          <span className="text-sm font-bold text-slate-700">{part.category}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Description</span>
          <span className="text-sm font-bold text-slate-700">{part.part_description}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Weight</span>
          <span className="text-sm font-bold text-slate-700">{part.weight_kg} kg</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Failure Rate</span>
          <span className="text-sm font-bold text-slate-700">{(2 + (hash%3)).toFixed(1)}%</span>
        </div>
      </div>

      <PredictionSummary 
        riskLevel={health < 60 ? "High" : "Low"}
        confidence={`${85 + (hash%12)}%`}
        delayProb={`${5 + (hash%10)}%`}
        reason={health < 60 ? "Stockout risk in major APJ hubs." : "Sufficient inventory globally."}
      />

      <OptimizationSummary 
        recommendation={health < 60 ? "Rebalance inventory from surplus hubs." : "Maintain current stock levels."}
        savings="$12,000"
        benefit="Prevents SLA breaches"
        alternative="Expedite purchase order"
      />
    </div>
  )
}
