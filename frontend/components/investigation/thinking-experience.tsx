"use client"

import React from "react"
import { BrainCircuit, CheckCircle2, Circle } from "lucide-react"

interface ThinkingExperienceProps {
  steps: string[]
  currentStepIndex: number
}

export function ThinkingExperience({ steps, currentStepIndex }: ThinkingExperienceProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate-100/[0.04] bg-[size:20px_20px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        <div className="relative mb-12">
          <div className="h-24 w-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin shadow-lg"></div>
          <BrainCircuit className="h-10 w-10 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>

        <h2 className="text-xl font-black text-slate-800 tracking-tight mb-8">AI Investigation in Progress...</h2>

        <div className="w-full space-y-4">
          {steps.map((step, idx) => {
            const isComplete = idx < currentStepIndex
            const isActive = idx === currentStepIndex
            const isPending = idx > currentStepIndex

            return (
              <div 
                key={idx} 
                className={`flex items-center space-x-4 transition-all duration-500 ${
                  isComplete ? "opacity-60 translate-x-0" : 
                  isActive ? "opacity-100 translate-x-2 scale-105" : 
                  "opacity-20 -translate-x-4"
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                ) : isActive ? (
                  <div className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-300 flex-shrink-0" />
                )}
                
                <span className={`text-sm font-bold ${
                  isActive ? "text-indigo-700" : "text-slate-600"
                }`}>
                  {step}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
