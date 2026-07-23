"use client"

import React from "react"
import { AlertTriangle, Lightbulb, Search, Network, LineChart, FileText, Activity } from "lucide-react"

interface RCAProps {
  type: string | null
  id: string | null
}

export function RootCauseAnalysis({ type, id }: RCAProps) {
  const hash = (id || "").length

  // Deterministic local scoring based on object type
  const getReasoning = () => {
    if (type === "hub") {
      return {
        problem: "Hub utilization exceeding 94% threshold during peak hours.",
        rootCause: "Unbalanced network routing causing artificial bottleneck.",
        operational: "Incoming shipment volume from APJ region spiked by 22% while outbound carrier capacity remained static.",
        financial: "High risk of SLA breach penalties ($45,200 exposed).",
        historical: "Similar bottleneck in Q3 resolved by offloading 15% to secondary hubs.",
        exec: `This hub is currently overloaded due to an unexpected 22% spike in inbound volume combined with static carrier capacity. To prevent $45,200 in potential SLA penalties, we recommend immediately offloading 15% of non-critical shipments to nearby regional hubs. This matches a successful historical intervention from Q3.`
      }
    }

    if (type === "transaction") {
      return {
        problem: "Shipment predicted to miss SLA by 14 hours.",
        rootCause: "Carrier delay at regional border crossing.",
        operational: "Severe weather warning in transit corridor reducing average speed by 40%.",
        financial: "Critical priority shipment; SLA breach incurs 100% freight penalty.",
        historical: "Alternative air-freight route historically saves 18 hours in similar conditions.",
        exec: `This critical shipment is predicted to breach SLA by 14 hours due to severe weather at the border crossing. Because of the high financial penalty associated with this delay, we recommend upgrading the final transit leg to Air Freight, which historical data confirms will save 18 hours and preserve the SLA.`
      }
    }

    return {
      problem: "Inefficiency detected in standard operational flow.",
      rootCause: "Sub-optimal resource allocation.",
      operational: "Current configuration does not match predicted demand.",
      financial: "Opportunity to reduce operational expenditure.",
      historical: "Standard baseline optimization.",
      exec: `Our analysis indicates an opportunity to optimize this asset's resource allocation to better match predicted demand. Implementing the recommended changes will align operations with historical best-practices and reduce overall expenditure.`
    }
  }

  const data = getReasoning()

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center space-x-2">
        <Search className="h-4 w-4 text-slate-500" />
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Root Cause Analysis</h3>
      </div>

      <div className="p-6 space-y-6">

        {/* Executive Summary */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Lightbulb className="h-4 w-4 text-indigo-500" />
            <h4 className="text-xs font-bold text-indigo-900 uppercase">Executive Summary</h4>
          </div>
          <p className="text-sm text-indigo-950 leading-relaxed font-medium">
            {data.exec}
          </p>
        </div>

        {/* Structured Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <span className="flex items-center text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">
              <AlertTriangle className="h-3 w-3 mr-1" /> Problem Statement
            </span>
            <p className="text-sm font-semibold text-slate-800">{data.problem}</p>
          </div>
          <div>
            <span className="flex items-center text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">
              <Network className="h-3 w-3 mr-1" /> Root Cause
            </span>
            <p className="text-sm font-semibold text-slate-800">{data.rootCause}</p>
          </div>
          <div>
            <span className="flex items-center text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">
              <Activity className="h-3 w-3 mr-1" /> Operational Reason
            </span>
            <p className="text-sm font-semibold text-slate-800">{data.operational}</p>
          </div>
          <div>
            <span className="flex items-center text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">
              <LineChart className="h-3 w-3 mr-1" /> Financial Reason
            </span>
            <p className="text-sm font-semibold text-slate-800">{data.financial}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
           <span className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              <FileText className="h-3 w-3 mr-1" /> Historical Comparison
            </span>
            <p className="text-sm font-medium text-slate-600 italic">"{data.historical}"</p>
        </div>

      </div>
    </div>
  )
}
