"use client";

import React from "react";
import { DecisionLabData } from "@/services/decision-lab";
import { GitCommit, Sparkles } from "lucide-react";

export function CaseOverview({ data }: { data: DecisionLabData }) {
  const o = data.caseOverview;
  return (
    <div className="bg-white rounded-2xl border border-[#E3E6EA] p-5 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex gap-4 items-start border-b border-[#EEF0F3] pb-4">
        <div className="w-10 h-10 rounded-xl bg-[#E6F7EF] text-[#00B67A] flex items-center justify-center shrink-0">
          <GitCommit size={20} />
        </div>
        <div>
          <p className="text-[#6B7280] text-[10px] font-bold uppercase tracking-wider mb-1">Case Overview</p>
          <h3 className="text-[#12161C] font-black text-lg flex items-center gap-2">
            {o.origin} <span className="text-[#9AA2AE] font-normal">-&gt;</span> {o.destination}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[#6B7280] text-xs font-medium font-mono">{o.routeId}</span>
            <span className="bg-[#E6F7EF] text-[#047857] text-[10px] font-bold px-2 py-0.5 rounded-md">{o.status}</span>
          </div>
        </div>
      </div>

      {/* Grid details */}
      <div className="grid grid-cols-3 gap-2 pb-4 border-b border-[#EEF0F3]">
        <div>
          <p className="text-[#9AA2AE] text-[10px] font-bold uppercase tracking-wider">Part No.</p>
          <p className="text-[#12161C] text-xs font-bold mt-1">{o.partNo}</p>
        </div>
        <div>
          <p className="text-[#9AA2AE] text-[10px] font-bold uppercase tracking-wider">Priority</p>
          <div className="flex items-center gap-1 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#E5484D]"></div>
            <p className="text-[#12161C] text-xs font-bold">{o.priority}</p>
          </div>
        </div>
        <div>
          <p className="text-[#9AA2AE] text-[10px] font-bold uppercase tracking-wider">Quantity</p>
          <p className="text-[#12161C] text-xs font-bold mt-1">{o.quantity} Units</p>
        </div>
        <div className="col-span-3 mt-2">
          <p className="text-[#9AA2AE] text-[10px] font-bold uppercase tracking-wider">Value</p>
          <p className="text-[#12161C] text-xs font-bold mt-1">${o.value.toLocaleString()}</p>
        </div>
      </div>

      {/* Action */}
      <div className="bg-[#F7F8FA] rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-[#6B7280] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={12} className="text-[#00B67A]" /> Optimal AI Action
          </p>
          <Sparkles size={14} className="text-[#00B67A] opacity-20" />
        </div>
        <h4 className="text-[#12161C] font-black text-sm mb-4">{o.recommendedAction}</h4>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-[#6B7280] text-xs">Total Savings</span>
          <span className="text-[#00B67A] text-xs font-bold">+${data.potentialSavings.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-[#6B7280] text-xs">ETA Improvement</span>
          <span className="text-[#047857] text-xs font-bold">{data.etaImprovementDays} Days Faster</span>
        </div>
      </div>
    </div>
  );
}
