"use client";

import React from "react";
import { DecisionLabData } from "@/services/decision-lab";
import { ChevronRight, ArrowRightLeft } from "lucide-react";

export function AlternativeRoutes({ data, onInvestigate }: { data: DecisionLabData, onInvestigate: (id: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E3E6EA] p-5 shadow-sm flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-[#EEF0F3] pb-3">
        <h3 className="text-[#12161C] font-bold text-sm">ALTERNATIVE ROUTES ({data.alternatives.length})</h3>
        <ChevronRight size={16} className="text-[#9AA2AE]" />
      </div>
      
      <div className="flex flex-col gap-3">
        {data.alternatives.map((alt) => (
          <div key={alt.id} className="flex justify-between items-center p-3 rounded-xl border border-[#EEF0F3] hover:border-[#00B67A] hover:bg-[#F7F8FA] transition-colors cursor-pointer group" onClick={() => onInvestigate(alt.id)}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E6F7EF] text-[#047857] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <ArrowRightLeft size={14} />
              </div>
              <div>
                <p className="text-[#12161C] text-xs font-bold">{alt.title}</p>
                <p className="text-[#6B7280] text-[10px]">{alt.etaImprovement} Days Faster</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[#00B67A] text-xs font-bold">+${alt.cost.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="text-[#047857] text-xs font-bold mt-2 hover:underline self-start">
        View All Alternatives
      </button>
    </div>
  );
}
