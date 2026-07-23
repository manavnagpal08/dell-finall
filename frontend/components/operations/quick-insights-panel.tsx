"use client"

import React from "react"
import { Sparkles, BrainCircuit, ShieldAlert, Activity, AlertTriangle, Zap, Network } from "lucide-react"
import { WorkspaceNode } from "@/hooks/use-workspace-state"

interface QuickInsightsProps {
  node: WorkspaceNode | null
}

export function QuickInsightsPanel({ node }: QuickInsightsProps) {
  if (!node) {
    return (
      <div className="w-80 bg-slate-50 border-l border-slate-200 p-6 flex flex-col hidden lg:flex select-none">
        <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">Context Panel</h2>
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-50">
          <Sparkles className="h-8 w-8 mb-2" />
          <span className="text-xs font-semibold">Select an object</span>
        </div>
      </div>
    )
  }

  const hash = node.id.length
  
  return (
    <div className="w-80 bg-slate-50 border-l border-slate-200 p-6 flex flex-col hidden lg:flex overflow-y-auto custom-scrollbar">
      <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">Context Panel</h2>
      
      <div className="space-y-6">
        <div className="bg-white border border-indigo-100 rounded-xl p-4 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-colors cursor-pointer">
          <div className="absolute top-0 right-0 p-2 opacity-5 transition-transform group-hover:scale-110">
            <BrainCircuit className="h-16 w-16 text-indigo-500" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <h3 className="text-xs font-bold text-slate-800">Reasoning Trace</h3>
            </div>
            <span className="text-[8px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded uppercase font-bold">Active</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed relative z-10">
            {node.type === "transaction" 
              ? "This shipment is at risk due to regional weather patterns affecting the destination TPR." 
              : node.type === "hub"
              ? "Utilization is peaking during afternoon shifts. Re-routing non-critical shipments recommended."
              : "Historical patterns indicate stable performance. No immediate action required."}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-indigo-600 font-bold flex items-center">
            View reasoning evidence
          </div>
        </div>

        {/* Current Alerts */}
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1.5" /> Current Alerts
          </h3>
          <div className="space-y-2">
            {hash % 2 === 0 ? (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg flex items-start space-x-2">
                <ShieldAlert className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-rose-900">SLA Breach Risk</span>
                  <span className="block text-[10px] text-rose-700 mt-0.5">Confidence 88% - Action required</span>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-start space-x-2">
                <Activity className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-emerald-900">System Healthy</span>
                  <span className="block text-[10px] text-emerald-700 mt-0.5">All metrics within thresholds</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Relationships Snapshot */}
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center">
            <Network className="h-3 w-3 mr-1.5" /> Related Objects
          </h3>
          <div className="flex flex-wrap gap-2">
            <span className="inline-block bg-white border border-slate-200 text-[10px] font-bold text-slate-600 px-2.5 py-1 rounded-full cursor-pointer hover:bg-slate-100">
              {node.type === "hub" ? "5 Connected TPRs" : node.type === "transaction" ? "Route: DEL-MUM" : "Parent Hub"}
            </span>
            <span className="inline-block bg-white border border-slate-200 text-[10px] font-bold text-slate-600 px-2.5 py-1 rounded-full cursor-pointer hover:bg-slate-100">
              {3 + (hash%4)} Active Alerts
            </span>
            <span className="inline-block bg-white border border-slate-200 text-[10px] font-bold text-slate-600 px-2.5 py-1 rounded-full cursor-pointer hover:bg-slate-100">
              {12 + (hash%20)} Past Shipments
            </span>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center">
            <Zap className="h-3 w-3 mr-1.5" /> Recent Activity
          </h3>
          <div className="space-y-3 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent pl-8">
            <div className="relative">
              <div className="absolute -left-8 bg-blue-500 h-2 w-2 rounded-full ring-4 ring-white top-1"></div>
              <span className="block text-[10px] text-slate-400 font-bold mb-0.5">10 mins ago</span>
              <span className="block text-xs text-slate-700 font-medium">Optimization scan completed</span>
            </div>
            <div className="relative">
              <div className="absolute -left-8 bg-slate-300 h-2 w-2 rounded-full ring-4 ring-white top-1"></div>
              <span className="block text-[10px] text-slate-400 font-bold mb-0.5">2 hours ago</span>
              <span className="block text-xs text-slate-700 font-medium">Status updated to active</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
