"use client"

import React from "react"
import { ArrowRight, TrendingDown, TrendingUp, DollarSign, Clock, Leaf } from "lucide-react"

export function ImpactSimulator() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
      <div className="bg-slate-50 border-b border-slate-200 p-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Business Impact Simulator</h3>
      </div>
      
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 space-y-4 md:space-y-0">
          <div className="flex-1 text-center bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Scenario</span>
            <span className="block text-xl font-black text-slate-800">Do Nothing</span>
          </div>
          
          <div className="px-6 flex flex-col items-center">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Simulation</span>
            <ArrowRight className="h-6 w-6 text-slate-300" />
          </div>

          <div className="flex-1 text-center bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Recommended Scenario</span>
            <span className="block text-xl font-black text-indigo-900">Execute Optimization</span>
          </div>
        </div>

        <div className="space-y-4">
          <ComparisonRow 
            label="Logistics Cost" 
            icon={<DollarSign className="h-4 w-4" />}
            current="$125,000" 
            recommended="$110,000" 
            delta="-$15,000"
            positive={true}
          />
          <ComparisonRow 
            label="Average Transit" 
            icon={<Clock className="h-4 w-4" />}
            current="4.2 Days" 
            recommended="3.6 Days" 
            delta="-0.6 Days"
            positive={true}
          />
          <ComparisonRow 
            label="Carbon Footprint" 
            icon={<Leaf className="h-4 w-4" />}
            current="42.5 MT" 
            recommended="38.3 MT" 
            delta="-4.2 MT"
            positive={true}
          />
        </div>
      </div>
    </div>
  )
}

function ComparisonRow({ label, icon, current, recommended, delta, positive }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
      <div className="flex items-center space-x-3 w-1/3">
        <div className="text-slate-400">{icon}</div>
        <span className="text-sm font-bold text-slate-700">{label}</span>
      </div>
      <div className="w-1/4 text-center">
        <span className="text-sm font-semibold text-slate-500">{current}</span>
      </div>
      <div className="w-1/4 text-center">
        <span className="text-sm font-bold text-slate-900">{recommended}</span>
      </div>
      <div className="w-1/6 text-right">
        <span className={`flex items-center justify-end text-sm font-black ${positive ? "text-emerald-500" : "text-rose-500"}`}>
          {positive ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
          {delta}
        </span>
      </div>
    </div>
  )
}
