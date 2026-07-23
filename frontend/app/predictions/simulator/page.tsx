"use client"

import React, { useState } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { usePredictRisk } from "@/services/queries"
import { Network, AlertTriangle, ShieldCheck, Zap, ServerCrash } from "lucide-react"

export default function SimulatorPage() {
  const predictMutation = usePredictRisk()
  
  const [formData, setFormData] = useState({
    origin_hub: "HUB-DEL",
    destination_hub: "HUB-AMS",
    repair_center: "TPR-AMS-01",
    priority: "P1",
    part_category: "CPU",
    flow_type: "Forward",
    quantity: 10,
    shipment_value: 5000.0
  })

  const handleSimulate = () => {
    predictMutation.mutate(formData)
  }

  const result = predictMutation.data

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Interactive Risk Simulator" 
        description="Test hypotheticals against the live production Random Forest model."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input Form */}
        <Card className="p-6 border-slate-100 shadow-sm space-y-6 bg-white lg:col-span-1">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Network className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-800">Shipment Parameters</h3>
          </div>
          
          <div className="space-y-4 text-xs font-medium">
            <div className="space-y-1.5">
              <label className="text-slate-500 uppercase text-[10px]">Origin Hub</label>
              <select 
                className="w-full h-9 rounded-md border border-slate-200 px-3 outline-none focus:border-brand-primary"
                value={formData.origin_hub}
                onChange={e => setFormData({...formData, origin_hub: e.target.value})}
              >
                <option value="HUB-DEL">HUB-DEL (Delhi)</option>
                <option value="HUB-AMS">HUB-AMS (Amsterdam)</option>
                <option value="HUB-SIN">HUB-SIN (Singapore)</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-slate-500 uppercase text-[10px]">Priority</label>
              <select 
                className="w-full h-9 rounded-md border border-slate-200 px-3 outline-none focus:border-brand-primary"
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value})}
              >
                <option value="P1">P1 (Urgent)</option>
                <option value="P2">P2 (High)</option>
                <option value="P3">P3 (Medium)</option>
                <option value="P4">P4 (Low)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-500 uppercase text-[10px]">Part Category</label>
              <select 
                className="w-full h-9 rounded-md border border-slate-200 px-3 outline-none focus:border-brand-primary"
                value={formData.part_category}
                onChange={e => setFormData({...formData, part_category: e.target.value})}
              >
                <option value="CPU">CPU</option>
                <option value="RAM">RAM</option>
                <option value="Storage">Storage</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-500 uppercase text-[10px]">Quantity</label>
              <input 
                type="number"
                className="w-full h-9 rounded-md border border-slate-200 px-3 outline-none focus:border-brand-primary"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-500 uppercase text-[10px]">Shipment Value (USD)</label>
              <input 
                type="number"
                className="w-full h-9 rounded-md border border-slate-200 px-3 outline-none focus:border-brand-primary"
                value={formData.shipment_value}
                onChange={e => setFormData({...formData, shipment_value: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>

          <Button 
            onClick={handleSimulate} 
            className="w-full bg-brand-primary hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
            disabled={predictMutation.isPending}
          >
            {predictMutation.isPending ? "Running Inference..." : "Simulate Risk"}
          </Button>
        </Card>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {!result && !predictMutation.isPending && (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
              <Zap className="h-12 w-12 mb-4 opacity-50" />
              <p>Configure parameters and run simulation to view ML prediction results.</p>
            </div>
          )}

          {predictMutation.isPending && (
            <div className="h-full flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 p-12">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-10 w-10 bg-blue-200 rounded-full mb-4"></div>
                <div className="h-4 w-32 bg-slate-200 rounded"></div>
              </div>
            </div>
          )}

          {result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <Card className={`p-8 border-2 shadow-sm space-y-4 text-center ${
                result.predicted_sla_breach 
                  ? "bg-red-50 border-red-200 text-red-900" 
                  : "bg-emerald-50 border-emerald-200 text-emerald-900"
              }`}>
                {result.predicted_sla_breach ? (
                  <ServerCrash className="h-12 w-12 mx-auto text-red-500" />
                ) : (
                  <ShieldCheck className="h-12 w-12 mx-auto text-emerald-500" />
                )}
                <h3 className="text-sm font-bold uppercase tracking-wider">SLA Breach Prediction</h3>
                <h2 className="text-3xl font-black">
                  {result.predicted_sla_breach ? "BREACH DETECTED" : "SAFE TRANSIT"}
                </h2>
                <p className="text-xs font-medium opacity-80">
                  Model confidence: {(result.confidence_score * 100).toFixed(1)}%
                </p>
              </Card>

              <Card className="p-8 border-slate-100 shadow-sm space-y-4 text-center bg-white">
                <AlertTriangle className={`h-12 w-12 mx-auto ${
                  result.risk_level === 'Critical' ? 'text-red-500' :
                  result.risk_level === 'High' ? 'text-orange-500' :
                  result.risk_level === 'Medium' ? 'text-amber-500' :
                  result.risk_level === 'Low' ? 'text-emerald-500' : 'text-blue-500'
                }`} />
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Risk Level</h3>
                <h2 className="text-4xl font-black text-slate-800">{result.risk_level}</h2>
                <p className="text-xs font-medium text-slate-400">
                  Delay Probability: {(result.delay_probability * 100).toFixed(1)}%
                </p>
              </Card>
              
              <Card className="p-6 border-slate-100 shadow-sm col-span-1 md:col-span-2 bg-slate-900 text-slate-300 font-mono text-[10px] space-y-2">
                <div className="text-slate-500 border-b border-slate-800 pb-2">RAW INFERENCE PAYLOAD</div>
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
