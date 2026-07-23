"use client"

import React from "react"
import { DecisionType } from "@/hooks/use-investigation-state"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Search, Download } from "lucide-react"

interface DecisionCenterProps {
  currentDecision: DecisionType
  onDecide: (decision: DecisionType) => void
}

export function DecisionCenter({ currentDecision, onDecide }: DecisionCenterProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-white flex-shrink-0">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Decision Center</h3>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
          currentDecision === "Approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
          currentDecision === "Rejected" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
          "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
        }`}>
          {currentDecision}
        </span>
      </div>
      
      <div className="p-6 space-y-4">
        {currentDecision === "Pending" ? (
          <>
            <Button 
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              onClick={() => onDecide("Approved")}
            >
              <CheckCircle2 className="h-5 w-5 mr-2" /> Approve Recommendation
            </Button>
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                className="flex-1 h-12 bg-transparent border-slate-700 hover:bg-slate-800 hover:text-white"
                onClick={() => onDecide("Investigating")}
              >
                <Search className="h-4 w-4 mr-2 text-slate-400" /> Investigate
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 h-12 bg-transparent border-slate-700 hover:bg-rose-900/50 hover:text-rose-400"
                onClick={() => onDecide("Rejected")}
              >
                <XCircle className="h-4 w-4 mr-2 text-rose-400" /> Reject
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-3 ${
              currentDecision === "Approved" ? "bg-emerald-500/20 text-emerald-400" :
              currentDecision === "Rejected" ? "bg-rose-500/20 text-rose-400" :
              "bg-indigo-500/20 text-indigo-400"
            }`}>
              {currentDecision === "Approved" ? <CheckCircle2 className="h-6 w-6" /> :
               currentDecision === "Rejected" ? <XCircle className="h-6 w-6" /> :
               <Search className="h-6 w-6" />}
            </div>
            <p className="text-sm font-bold text-slate-200">Decision Recorded</p>
            <p className="text-xs text-slate-500 mt-1">Stored in local investigation history.</p>
          </div>
        )}

        <div className="pt-4 border-t border-slate-800">
          <Button variant="ghost" className="w-full text-slate-400 hover:text-white hover:bg-slate-800 text-xs">
            <Download className="h-4 w-4 mr-2" /> Export Executive Summary (PDF)
          </Button>
        </div>
      </div>
    </div>
  )
}
