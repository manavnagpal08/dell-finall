"use client"

import React, { useState } from "react"
import { Scan, AlertTriangle, ShieldAlert, Activity, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Issue {
  id: string
  type: string
  priority: "Critical" | "High" | "Medium"
  title: string
  impact: string
}

const MOCK_ISSUES: Issue[] = [
  { id: "HUB-DEL-001", type: "hub", priority: "Critical", title: "Delhi Hub Overload", impact: "$45,200/mo risk" },
  { id: "SHP-10923", type: "transaction", priority: "High", title: "Shipment Delay Risk", impact: "SLA Breach Penalty" },
  { id: "PART-CPU-99", type: "part", priority: "High", title: "Inventory Imbalance", impact: "Stockout in 3 days" },
  { id: "RTE-MUM-DXB", type: "route", priority: "Medium", title: "High Cost Route", impact: "15% above baseline" },
  { id: "TPR-SIN-01", type: "tpr", priority: "Medium", title: "Repair Bottleneck", impact: "Queue > 48hrs" }
]

interface ScannerProps {
  onSelect: (id: string, type: string) => void
  activeId: string | null
}

export function InefficiencyScanner({ onSelect, activeId }: ScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [hasScanned, setHasScanned] = useState(false)
  
  const handleScan = () => {
    setIsScanning(true)
    setTimeout(() => {
      setIsScanning(false)
      setHasScanned(true)
    }, 2500)
  }

  return (
    <div className="w-80 bg-slate-50 border-r border-slate-200 h-full flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">AI Inefficiency Scanner</h2>
        <Button 
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 transition-all"
          onClick={handleScan}
          disabled={isScanning}
        >
          {isScanning ? (
            <span className="flex items-center"><Scan className="h-4 w-4 mr-2 animate-spin" /> Scanning Network...</span>
          ) : (
            <span className="flex items-center"><Scan className="h-4 w-4 mr-2" /> Scan Entire Network</span>
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {!hasScanned && !isScanning && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-4">
            <Scan className="h-12 w-12 text-slate-400 mb-3" />
            <p className="text-xs font-bold text-slate-500 uppercase">Awaiting Scan</p>
            <p className="text-[10px] mt-1 text-slate-400">Click scan to aggregate predictions and optimizations across the enterprise.</p>
          </div>
        )}

        {isScanning && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="relative">
              <div className="h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <Scan className="h-6 w-6 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <p className="text-xs font-bold text-indigo-600 uppercase mt-4 animate-pulse">Aggregating Models...</p>
          </div>
        )}

        {hasScanned && !isScanning && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Investigation Queue ({MOCK_ISSUES.length})</h3>
            
            <div className="space-y-2">
              {MOCK_ISSUES.map(issue => {
                const isActive = activeId === issue.id
                return (
                  <div 
                    key={issue.id}
                    onClick={() => onSelect(issue.id, issue.type)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all group ${
                      isActive 
                        ? "bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-500/20" 
                        : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                        issue.priority === "Critical" ? "bg-rose-100 text-rose-700 border-rose-200" :
                        issue.priority === "High" ? "bg-amber-100 text-amber-700 border-amber-200" :
                        "bg-blue-100 text-blue-700 border-blue-200"
                      }`}>
                        {issue.priority}
                      </span>
                      {isActive && <ArrowRight className="h-3 w-3 text-indigo-500" />}
                    </div>
                    <h4 className={`text-sm font-bold ${isActive ? "text-indigo-900" : "text-slate-800"}`}>{issue.title}</h4>
                    <div className="flex items-center text-[10px] mt-1 text-slate-500 font-medium">
                      <ShieldAlert className="h-3 w-3 mr-1" /> Impact: {issue.impact}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
