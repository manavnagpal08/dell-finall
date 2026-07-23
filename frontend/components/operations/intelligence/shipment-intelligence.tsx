"use client"

import React from "react"
import { WorkspaceNode } from "@/hooks/use-workspace-state"
import { Transaction } from "@/types"
import { BusinessImpactPanel, PredictionSummary, OptimizationSummary, ObjectTimeline } from "./shared-panels"

export function ShipmentIntelligence({ node }: { node: WorkspaceNode }) {
  const tx = node.data as Transaction
  const hash = tx.transaction_id.length
  
  const isDelayed = tx.sla_breach || (hash % 5 === 0)
  const score = isDelayed ? 45 + (hash%15) : 85 + (hash%10)
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Shipment Health</span>
          <span className={`block text-3xl font-black mt-2 ${isDelayed ? "text-rose-500" : "text-emerald-500"}`}>{score}%</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">SLA Status</span>
          <span className={`block text-2xl font-black mt-3 ${tx.sla_breach ? "text-rose-500" : "text-emerald-500"}`}>
            {tx.sla_breach ? "Breached" : "On Track"}
          </span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Priority</span>
          <span className={`block text-2xl font-black mt-3 ${tx.priority === "P1" ? "text-rose-500" : "text-amber-500"}`}>{tx.priority}</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Flow Type</span>
          <span className="block text-xl font-black text-slate-800 mt-3">{tx.flow_type}</span>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Origin Hub</span>
          <span className="text-sm font-bold text-slate-700">{tx.origin_hub_id}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Destination</span>
          <span className="text-sm font-bold text-slate-700">{tx.tpr_id || tx.destination_location}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Part Number</span>
          <span className="text-sm font-bold text-slate-700">{tx.part_no}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Transport</span>
          <span className="text-sm font-bold text-slate-700">{tx.logistics_partner}</span>
        </div>
      </div>

      <PredictionSummary 
        riskLevel={isDelayed ? "High" : "Low"}
        confidence={`${80 + (hash%15)}%`}
        delayProb={`${isDelayed ? 80 : 10 + (hash%15)}%`}
        reason={isDelayed ? "Carrier delay at regional border." : "Optimal weather and traffic conditions."}
      />

      <OptimizationSummary 
        recommendation={isDelayed ? "Expedite via Air Freight for final leg." : "Maintain standard ground transport."}
        savings={isDelayed ? "Saves $4,500 SLA penalty" : "$0"}
        benefit="Meet customer deadline"
        alternative="Reroute through secondary hub"
      />

      <ObjectTimeline 
        steps={["Created", "Dispatched", "In Transit", "Customs", "Delivered"]}
        activeStep={1 + (hash%3)}
      />
    </div>
  )
}
