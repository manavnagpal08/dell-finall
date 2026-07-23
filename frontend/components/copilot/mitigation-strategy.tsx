"use client"

import React, { useState } from "react"
import { Wand2, Download, Table2, FileText, CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { downloadCSV, downloadTextPDF } from "@/utils/export"

interface MitigationStrategyProps {
  id: string | null
  type: string | null
}

const GENERATION_STEPS = [
  "Analyzing root cause...",
  "Querying inventory API...",
  "Simulating route optimizations...",
  "Formatting action manifest..."
]

export function MitigationStrategy({ id, type }: MitigationStrategyProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  const handleGenerate = () => {
    setIsGenerating(true)
    setStepIndex(0)
    
    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      if (currentStep >= GENERATION_STEPS.length) {
        clearInterval(interval)
        setTimeout(() => {
          setIsGenerating(false)
          setHasGenerated(true)
        }, 600)
      } else {
        setStepIndex(currentStep)
      }
    }, 800)
  }

  const exportCSV = () => {
    const data = [
      ["Part", "Source", "Destination", "Quantity", "Priority", "Expected Benefit"],
      ["Power Supply", "Delhi Hub", "Hyderabad Hub", "45", "High", "$4,500 SLA Savings"],
      ["Compute Module", "Chennai Hub", "Bangalore Hub", "12", "Medium", "Balance Inventory"],
    ]
    downloadCSV(`Mitigation_Plan_${id || "Export"}.csv`, data)
  }

  const exportPDF = () => {
    downloadTextPDF(`Executive_Plan_${id || "Export"}.pdf`, "Executive Mitigation Plan", [
      `Investigation ID: ${id || "Current selection"}`,
      `Investigation Type: ${type || "Operations risk"}`,
      "Move 45 units of Power Supply from Delhi Hub to Hyderabad Hub.",
      "Move 12 Compute Modules from Chennai Hub to Bangalore Hub.",
      "Expected benefit: $4,500 SLA preservation and balanced inventory exposure.",
      "Priority: High",
    ])
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden mb-6 text-white">
      <div className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center">
          <Wand2 className="h-4 w-4 mr-2 text-indigo-400" /> Mitigation Strategy Generator
        </h3>
        {hasGenerated && (
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase font-bold border border-emerald-500/30">
            Plan Ready
          </span>
        )}
      </div>

      <div className="p-6">
        {!isGenerating && !hasGenerated && (
          <div className="text-center py-6">
            <p className="text-sm text-slate-400 mb-6">Detecting issues... AI can generate an automated action manifest based on current optimizations.</p>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/50"
              onClick={handleGenerate}
            >
              <Wand2 className="h-4 w-4 mr-2" /> Generate Mitigation Strategy
            </Button>
          </div>
        )}

        {isGenerating && (
          <div className="py-4 px-8 max-w-md mx-auto space-y-4">
             {GENERATION_STEPS.map((step, idx) => {
                const isComplete = idx < stepIndex
                const isActive = idx === stepIndex
                return (
                  <div key={idx} className={`flex items-center space-x-3 transition-opacity ${isActive || isComplete ? "opacity-100" : "opacity-20"}`}>
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : isActive ? (
                      <div className="h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-600" />
                    )}
                    <span className={`text-sm ${isActive ? "text-indigo-300 font-bold" : "text-slate-400"}`}>{step}</span>
                  </div>
                )
             })}
          </div>
        )}

        {hasGenerated && (
          <div className="animate-fade-in-up">
            <h4 className="text-lg font-bold text-white mb-4">Inventory Relocation Plan</h4>
            
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">Move</span>
                  <span className="block text-sm font-bold text-white">45 Units (Power Supply)</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">From / To</span>
                  <span className="block text-sm font-bold text-white">Delhi &gt; Hyderabad</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">Priority</span>
                  <span className="inline-block text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded border border-rose-500/30 font-bold uppercase">High</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">Expected Benefit</span>
                  <span className="block text-sm font-bold text-emerald-400">$4,500 SLA Preservation</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={exportCSV} className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700">
                <Table2 className="h-4 w-4 mr-2 text-emerald-400" /> Export Action Manifest (CSV)
              </Button>
              <Button onClick={exportPDF} className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700">
                <FileText className="h-4 w-4 mr-2 text-rose-400" /> Export Executive Plan (PDF)
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
