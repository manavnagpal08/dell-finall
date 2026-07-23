"use client"

import React from "react"
import { ShieldAlert, TrendingUp, DollarSign, BrainCircuit, Activity, Clock, CheckCircle2, Navigation, Zap } from "lucide-react"

export function BusinessImpactPanel({ cost, projected, savings, roi, carbon }: { cost: string, projected: string, savings: string, roi: string, carbon: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden text-white">
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <DollarSign className="h-32 w-32" />
      </div>
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
        <TrendingUp className="h-4 w-4 mr-2" /> Business & Financial Impact
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
        <div>
          <span className="block text-[10px] text-slate-400 uppercase font-bold">Current Cost</span>
          <span className="block text-xl font-bold text-slate-200 mt-1">{cost}</span>
        </div>
        <div>
          <span className="block text-[10px] text-blue-400 uppercase font-bold">Projected Cost</span>
          <span className="block text-xl font-black text-blue-400 mt-1">{projected}</span>
        </div>
        <div>
          <span className="block text-[10px] text-emerald-400 uppercase font-bold">Potential Savings</span>
          <span className="block text-xl font-black text-emerald-400 mt-1">{savings}</span>
        </div>
        <div>
          <span className="block text-[10px] text-purple-400 uppercase font-bold">Estimated ROI</span>
          <span className="block text-xl font-black text-purple-400 mt-1">{roi}</span>
        </div>
        <div>
          <span className="block text-[10px] text-teal-400 uppercase font-bold">Carbon Impact</span>
          <span className="block text-xl font-black text-teal-400 mt-1">{carbon}</span>
        </div>
      </div>
    </div>
  )
}

export function PredictionSummary({ riskLevel, confidence, delayProb, reason }: { riskLevel: "High"|"Medium"|"Low", confidence: string, delayProb: string, reason: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center">
        <BrainCircuit className="h-4 w-4 mr-2 text-indigo-500" /> Predictive Intelligence
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <span className="block text-[10px] text-slate-500 uppercase font-bold">Risk Level</span>
          <span className={`block text-lg font-black mt-1 ${riskLevel === "High" ? "text-rose-500" : riskLevel === "Medium" ? "text-amber-500" : "text-emerald-500"}`}>{riskLevel}</span>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500 uppercase font-bold">Confidence</span>
          <span className="block text-lg font-bold text-slate-800 mt-1">{confidence}</span>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500 uppercase font-bold">Delay Probability</span>
          <span className="block text-lg font-bold text-slate-800 mt-1">{delayProb}</span>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500 uppercase font-bold">Primary Factor</span>
          <span className="block text-sm font-semibold text-slate-700 mt-1">{reason}</span>
        </div>
      </div>
    </div>
  )
}

export function OptimizationSummary({ recommendation, savings, benefit, alternative }: { recommendation: string, savings: string, benefit: string, alternative: string }) {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 shadow-sm">
      <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-4 flex items-center">
        <Zap className="h-4 w-4 mr-2 text-emerald-500" /> Optimization Engine
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="col-span-1 md:col-span-2">
          <span className="block text-[10px] text-emerald-600 uppercase font-bold">Current Recommendation</span>
          <span className="block text-sm font-bold text-emerald-950 mt-1">{recommendation}</span>
        </div>
        <div>
          <span className="block text-[10px] text-emerald-600 uppercase font-bold">Direct Benefit</span>
          <span className="block text-lg font-black text-emerald-700 mt-1">{benefit}</span>
        </div>
        <div>
          <span className="block text-[10px] text-emerald-600 uppercase font-bold">Alternative</span>
          <span className="block text-sm font-semibold text-emerald-800 mt-1">{alternative}</span>
        </div>
      </div>
    </div>
  )
}

export function ObjectTimeline({ steps, activeStep }: { steps: string[], activeStep: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-6 flex items-center">
        <Clock className="h-4 w-4 mr-2 text-slate-500" /> Operational Timeline
      </h3>
      <div className="flex items-center justify-between relative px-8">
        <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 left-10 h-0.5 bg-blue-500 -translate-y-1/2 z-0 transition-all duration-1000"
          style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
        />
        
        {steps.map((step, idx) => {
          const isComplete = idx < activeStep
          const isActive = idx === activeStep
          return (
            <div key={idx} className="relative z-10 flex flex-col items-center space-y-2">
              <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center bg-white transition-all ${
                isComplete ? "border-blue-500 text-blue-500" :
                isActive ? "border-blue-500 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse" :
                "border-slate-200 text-slate-300"
              }`}>
                {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${
                isComplete ? "text-slate-700" :
                isActive ? "text-blue-600" :
                "text-slate-400"
              }`}>{step}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
