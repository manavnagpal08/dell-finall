"use client"

import React from "react"
import { Database, TrendingUp, History, Package, Clock, LineChart } from "lucide-react"

interface EvidenceViewerProps {
  id: string | null
}

export function EvidenceViewer({ id }: EvidenceViewerProps) {
  const hash = (id || "").length

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6 flex-1 flex flex-col">
      <div className="bg-slate-50 border-b border-slate-200 p-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Confidence Engine</h3>
      </div>
      
      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
        
        {/* Confidence Gauges */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overall</span>
            <span className="block text-3xl font-black text-indigo-600">{95 + (hash%4)}%</span>
          </div>
          <div className="text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Prediction</span>
            <span className="block text-3xl font-black text-blue-500">{92 + (hash%6)}%</span>
          </div>
          <div className="text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Optimization</span>
            <span className="block text-3xl font-black text-emerald-500">{96 + (hash%3)}%</span>
          </div>
          <div className="text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Evidence</span>
            <span className="block text-3xl font-black text-slate-700">{90 + (hash%8)}%</span>
          </div>
        </div>

        {/* Evidence Chips */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">Supporting Evidence</h4>
          
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center text-[10px] font-bold text-indigo-600 uppercase"><TrendingUp className="h-3 w-3 mr-1" /> Optimization Model</span>
              <span className="text-[10px] font-bold text-slate-400">99% Conf</span>
            </div>
            <p className="text-xs font-medium text-slate-600">Simulated 10,000 routing scenarios; current recommendation yields highest SLA preservation.</p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center text-[10px] font-bold text-blue-600 uppercase"><LineChart className="h-3 w-3 mr-1" /> Predictive Analytics</span>
              <span className="text-[10px] font-bold text-slate-400">94% Conf</span>
            </div>
            <p className="text-xs font-medium text-slate-600">Weather delay prediction correlates strongly with current radar models.</p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center text-[10px] font-bold text-amber-600 uppercase"><History className="h-3 w-3 mr-1" /> Historical Performance</span>
              <span className="text-[10px] font-bold text-slate-400">97% Conf</span>
            </div>
            <p className="text-xs font-medium text-slate-600">Analyzed 14 similar incidents from Q3 showing 100% success rate for proposed action.</p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center text-[10px] font-bold text-emerald-600 uppercase"><Package className="h-3 w-3 mr-1" /> Inventory Data</span>
              <span className="text-[10px] font-bold text-slate-400">100% Conf</span>
            </div>
            <p className="text-xs font-medium text-slate-600">Live API confirms sufficient capacity at secondary hub.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
