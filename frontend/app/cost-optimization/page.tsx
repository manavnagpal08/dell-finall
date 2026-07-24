"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings2, Download, Search, MapPin, 
  Play, ChevronDown, ChevronRight, Activity, 
  TrendingUp, TrendingDown, RefreshCw, BarChart2,
  DollarSign, Map, Zap, FileText, AlertCircle, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CORRIDORS, GLOBAL_KPI, Corridor, Leakage } from "./data";
import { SimulationMap } from "./simulation-map";
import { useUiStore } from "@/store/ui";

export default function CostOptimizationCenter() {
  const [selectedCorridor, setSelectedCorridor] = useState<Corridor | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Cost Leakage");
  const [simulationStep, setSimulationStep] = useState(0);
  const [expandedLeakage, setExpandedLeakage] = useState<string | null>(null);
  const [chartFilter, setChartFilter] = useState("Forward Logistics");
  const { logisticsMode, setLogisticsMode } = useUiStore();

  const displayCorridors = CORRIDORS.filter(c => 
    logisticsMode === "forward" ? c.flowType !== "Reverse" : c.flowType === "Reverse"
  );

  useEffect(() => {
    // Reset simulation and leakage details when corridor changes
    setSimulationStep(0);
    setExpandedLeakage(null);
  }, [selectedCorridor]);

  const playSimulation = (targetCorridor?: Corridor | React.MouseEvent) => {
    const c = (targetCorridor && 'checkpoints' in targetCorridor) ? targetCorridor : selectedCorridor;
    if (!c) return;
    if (simulationStep > 0) return;
    
    setSimulationStep(1);
    
    // Animate through checkpoints
    c.checkpoints.forEach((_, idx) => {
      setTimeout(() => {
        setSimulationStep(idx + 1);
      }, idx * 1200);
    });
  };

  const getKPIs = () => {
    if (!selectedCorridor) {
      const modeMultiplier = logisticsMode === "forward" ? 1 : 0.35;
      return {
        currentCost: GLOBAL_KPI.currentCost * modeMultiplier,
        optimizedCost: GLOBAL_KPI.optimizedCost * modeMultiplier,
        potentialSavings: GLOBAL_KPI.potentialSavings * modeMultiplier,
        inventoryImpact: GLOBAL_KPI.inventoryImpact * modeMultiplier,
        savingsRealized: GLOBAL_KPI.savingsRealized * modeMultiplier,
      };
    }
    // Scale down global KPIs to simulate corridor-specific impacts
    return {
      currentCost: selectedCorridor.currentCost * 50,
      optimizedCost: selectedCorridor.optimizedCost * 50,
      potentialSavings: selectedCorridor.potentialSaving * 50,
      inventoryImpact: selectedCorridor.currentCost * 10,
      savingsRealized: selectedCorridor.potentialSaving * 20
    };
  };

  const kpis = getKPIs();

  return (
    <div className="min-h-screen bg-[#F6F8FB] font-sans text-slate-800 flex flex-col pb-10">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <div>
          <h1 className="text-xl font-black text-[#0F2922] flex items-center gap-2">
            Cost Optimization Center 
            <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full border border-[#10B981]/20 flex items-center gap-1">
              <Zap className="w-3 h-3" /> AI-Powered
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">Identify cost leaks, optimize routes, and reinvest savings for maximum business impact.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Forward vs Reverse Logistics Toggle */}
          <div className="hidden md:flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button 
              onClick={() => setLogisticsMode("forward")} 
              className={cn(
                "px-3 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5", 
                logisticsMode === "forward" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <ChevronRight className="h-3.5 w-3.5" /> Forward Logistics
            </button>
            <button 
              onClick={() => setLogisticsMode("reverse")} 
              className={cn(
                "px-3 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5", 
                logisticsMode === "reverse" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reverse Logistics
            </button>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50">
            15 Jul - 22 Jul 2026 <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            <Settings2 className="w-4 h-4" /> Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#007A5E] text-white rounded-lg text-sm font-bold shadow-sm hover:bg-[#00664d]">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 mb-2">
              <div className="w-6 h-6 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center"><DollarSign className="w-3.5 h-3.5" /></div>
              Total Current Cost
            </div>
            <div className="text-2xl font-black text-slate-900">${kpis.currentCost.toLocaleString()}</div>
            <div className="text-[10px] font-bold text-red-500 bg-red-50 inline-flex items-center px-1.5 py-0.5 rounded mt-2">
              <TrendingUp className="w-3 h-3 mr-1" /> 18.6% vs last 7 days
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 mb-2">
              <div className="w-6 h-6 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center"><BarChart2 className="w-3.5 h-3.5" /></div>
              Optimized Cost
            </div>
            <div className="text-2xl font-black text-slate-900">${kpis.optimizedCost.toLocaleString()}</div>
            <div className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 inline-flex items-center px-1.5 py-0.5 rounded mt-2">
              <TrendingDown className="w-3 h-3 mr-1" /> 17.9% vs current
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 mb-2">
              <div className="w-6 h-6 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center"><Activity className="w-3.5 h-3.5" /></div>
              Total Potential Savings
            </div>
            <div className="text-2xl font-black text-slate-900">${kpis.potentialSavings.toLocaleString()}</div>
            <div className="text-[10px] font-bold text-[#10B981] mt-2 flex items-center justify-between">
              Across {selectedCorridor ? 1 : displayCorridors.length} opportunities
              <span className="bg-[#10B981]/10 px-1.5 py-0.5 rounded flex items-center"><TrendingDown className="w-3 h-3 mr-1" /> 18.0%</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 mb-2">
              <div className="w-6 h-6 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center"><Map className="w-3.5 h-3.5" /></div>
              Inventory Investment Impact
            </div>
            <div className="text-2xl font-black text-slate-900">${kpis.inventoryImpact.toLocaleString()}</div>
            <div className="text-[10px] font-bold text-slate-500 mt-2">
              ROI 73.3% from challenge model
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 mb-2">Savings Realized (MTD)</div>
              <div className="text-2xl font-black text-slate-900">${kpis.savingsRealized.toLocaleString()}</div>
              <div className="text-[10px] font-bold text-slate-500 mt-2">of monthly target</div>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg width="64" height="64" viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#0F2922" strokeWidth="4" strokeDasharray="61, 100" strokeLinecap="round" />
              </svg>
              <span className="text-xs font-black text-slate-900 z-10">61%</span>
            </div>
          </div>
        </div>

        {/* Middle Row: Corridors Table & Cost Leakage */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                Top Cost Corridors <span className="text-[10px] text-slate-400 font-semibold">(By Current Cost)</span>
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-bold text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="pb-3">Corridor</th>
                    <th className="pb-3">Flow Type</th>
                    <th className="pb-3">Current Cost</th>
                    <th className="pb-3">Optimized Cost</th>
                    <th className="pb-3">Potential Saving</th>
                    <th className="pb-3">Opportunity Score</th>
                    <th className="pb-3 text-left pl-6">Action</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] font-bold text-slate-700">
                  {displayCorridors.map((c) => {
                    const isSelected = selectedCorridor?.id === c.id;
                    return (
                      <tr key={c.id} 
                          onClick={() => setSelectedCorridor(c)}
                          className={`border-b border-slate-50 cursor-pointer transition-colors ${isSelected ? 'bg-[#10B981]/5' : 'hover:bg-slate-50'}`}>
                        <td className="py-4 flex items-center gap-2">
                          <div className={`w-1.5 h-6 rounded-full ${isSelected ? 'bg-[#10B981]' : 'bg-transparent'}`} />
                          <span className={isSelected ? 'text-[#0F2922] font-black' : ''}>{c.name}</span>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] ${c.flowType==='Forward'?'bg-green-100 text-green-700':c.flowType==='Reverse'?'bg-blue-100 text-blue-700':'bg-purple-100 text-purple-700'}`}>
                            {c.flowType}
                          </span>
                        </td>
                        <td className="py-4">${c.currentCost.toLocaleString()}</td>
                        <td className="py-4">${c.optimizedCost.toLocaleString()}</td>
                        <td className="py-4 text-[#10B981]">${c.potentialSaving.toLocaleString()}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{width: `${c.opportunityScore}%`, backgroundColor: c.opportunityScore > 80 ? '#10B981' : '#F97316'}} />
                            </div>
                            <span className="w-6 text-right">{c.opportunityScore}%</span>
                          </div>
                        </td>
                        <td className="py-4 text-left pl-6">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedCorridor(c); playSimulation(c); }} className="inline-flex items-center gap-1 text-[#10B981] hover:text-[#007A5E]">
                            <Play className="w-3 h-3 fill-current" /> Simulate Route
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
              <span className="text-[11px] font-bold text-slate-500">Showing {displayCorridors.length} corridors</span>
              <button className="px-4 py-1.5 border border-slate-200 rounded-md text-[11px] font-bold flex items-center gap-1.5 hover:bg-slate-50"><MapPin className="w-3 h-3 text-[#10B981]"/> View All Corridors</button>
            </div>
          </div>

          {/* Cost Leakage Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">Cost Leakage <span className="text-[12px] font-semibold text-slate-400">— Why Costs Increase</span></h2>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {(selectedCorridor ? selectedCorridor.leakages : (displayCorridors[0]?.leakages || [])).map((leakage, i) => (
                <div key={i} className="border border-slate-100 rounded-lg overflow-hidden transition-all">
                  <div 
                    onClick={() => setExpandedLeakage(expandedLeakage === leakage.category ? null : leakage.category)}
                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 ${expandedLeakage === leakage.category ? 'bg-slate-50' : ''}`}
                  >
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: leakage.color}} />
                      {leakage.category}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-black text-slate-900">${leakage.value.toLocaleString()} <span className="text-slate-400 font-semibold">({leakage.percentage}%)</span></span>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{width: `${leakage.percentage}%`, backgroundColor: leakage.color}} />
                      </div>
                    </div>
                  </div>
                  
                  {expandedLeakage === leakage.category && (
                    <div className="p-4 bg-[#F8FAFC] border-t border-slate-100 text-[10px]">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div><span className="text-slate-500 font-bold block mb-1">Affected Shipments</span><span className="font-black text-slate-900">{leakage.details.affectedShipments}</span></div>
                        <div><span className="text-slate-500 font-bold block mb-1">Historical Trend</span><span className="font-black text-red-500">{leakage.details.historicalTrend}</span></div>
                      </div>
                      <div className="space-y-2">
                        <p><strong className="text-slate-700">AI Explanation:</strong> <span className="text-slate-600">{leakage.details.explanation}</span></p>
                        <p><strong className="text-[#10B981]">Suggested Fix:</strong> <span className="text-slate-600">{leakage.details.suggestedFix}</span></p>
                      </div>
                      <button className="mt-3 w-full py-2 bg-white border border-[#10B981] text-[#10B981] font-bold rounded shadow-sm hover:bg-[#10B981]/5">Auto-Resolve Leakage</button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
              <div>
                <div className="text-[10px] font-bold text-slate-500">Total Leakage</div>
                <div className="text-lg font-black text-red-500">${(selectedCorridor ? selectedCorridor.leakages.reduce((sum,l)=>sum+l.value,0) : 24250).toLocaleString()}</div>
              </div>
              <button className="px-4 py-2 border border-slate-200 rounded-md text-[11px] font-bold hover:bg-slate-50">View Details</button>
            </div>
          </div>
        </div>

        {/* Bottom Row: AI Workspace & Route Simulation */}
        <div className="grid grid-cols-[1.1fr_1.9fr] gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-[360px] flex flex-col">
            <div className="mb-4">
              <h2 className="text-base font-black text-slate-900">AI Analysis Workspace</h2>
              <p className="text-[10px] text-slate-500 font-semibold">Choose an analysis to explore insights.</p>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {['Cost Leakage', 'Savings Breakdown', 'Suboptimal Transactions', 'Cost Suggestions', 'Reinvestment Advisor'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-[11px] font-bold whitespace-nowrap rounded-lg border transition-colors ${activeTab === tab ? 'bg-[#10B981]/10 border-[#10B981] text-[#10B981]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-2">
                    {tab === 'Cost Leakage' && <AlertCircle className="w-3.5 h-3.5" />}
                    {tab === 'Savings Breakdown' && <TrendingDown className="w-3.5 h-3.5" />}
                    {tab === 'Suboptimal Transactions' && <FileText className="w-3.5 h-3.5" />}
                    {tab === 'Cost Suggestions' && <Zap className="w-3.5 h-3.5" />}
                    {tab === 'Reinvestment Advisor' && <ShieldCheck className="w-3.5 h-3.5" />}
                    {tab}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex-1 flex flex-col border-2 border-slate-100 rounded-xl bg-slate-50/50 p-4 overflow-y-auto">
               <div className="w-full h-full text-left">
                 {/* Using selected corridor or default to first corridor for global view */}
                 {(() => {
                   const data = selectedCorridor || CORRIDORS[0];
                   return (
                     <>
                   {activeTab === 'Cost Leakage' && (
                     <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                       <h3 className="text-sm font-black text-slate-800">Deep Dive: Cost Leakage Factors</h3>
                       <div className="grid grid-cols-2 gap-4">
                         {data.leakages.map((l, i) => (
                           <div key={i} className="border border-slate-200 p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{l.category}</div>
                             <div className="text-xl font-black mt-1" style={{color: l.color}}>${l.value.toLocaleString()}</div>
                             <p className="text-[11px] mt-2 text-slate-600 font-medium leading-relaxed">{l.details.explanation}</p>
                             <button className="mt-3 w-full py-1.5 border border-slate-200 rounded text-[10px] font-bold text-slate-700 hover:bg-slate-50 hover:text-[#10B981] transition-colors">Apply Auto-Fix</button>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                   
                   {activeTab === 'Savings Breakdown' && (
                     <div className="w-full h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex gap-2 mb-4">
                          {['Forward Logistics', 'Reverse Logistics', 'Part Buy', 'Emergency Shipment'].map(bt => (
                             <button 
                               key={bt} 
                               onClick={() => setChartFilter(bt)}
                               className={`px-3 py-1.5 border text-[10px] font-bold rounded-lg transition-colors ${chartFilter === bt ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                             >
                               {bt}
                             </button>
                          ))}
                        </div>
                        <div className="flex-1 border border-slate-200 rounded-xl bg-white flex flex-col p-5 shadow-sm min-h-[220px]">
                          <div className="text-xs font-bold text-slate-500 mb-4">Projected Savings Over Time ({chartFilter})</div>
                          <div className="flex-1 flex items-end justify-around gap-3 px-4 pb-0 pt-8 border-b border-l border-slate-100 min-h-[120px]">
                             {(
                               chartFilter === 'Forward Logistics' ? [40, 70, 30, 90, 50, 80, 60] :
                               chartFilter === 'Reverse Logistics' ? [20, 40, 80, 40, 30, 60, 90] :
                               chartFilter === 'Part Buy' ? [90, 80, 70, 50, 40, 60, 50] :
                               [10, 20, 15, 30, 25, 40, 20]
                             ).map((h, i) => (
                               <div key={i} className="w-full bg-gradient-to-t from-[#10B981]/80 to-[#34d399] rounded-t-md transition-all duration-700 hover:opacity-80 relative group" style={{height: `${h}%`}}>
                                 <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-2 py-1 rounded transition-opacity pointer-events-none">${(h * 123).toLocaleString()}</div>
                               </div>
                             ))}
                          </div>
                          <div className="flex justify-around mt-2 text-[9px] font-bold text-slate-400">
                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                          </div>
                        </div>
                     </div>
                   )}
                   
                   {activeTab === 'Suboptimal Transactions' && (
                     <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                       {[1, 2, 3].map(i => (
                         <div key={i} className="border border-slate-200 p-4 rounded-xl bg-white text-xs cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all shadow-sm group">
                           <div className="flex justify-between items-center font-black text-sm text-slate-800">
                             <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400 group-hover:text-emerald-500"/> TXN-80{i}42A9</span> 
                             <span className="text-red-500 bg-red-50 px-2 py-1 rounded">Excess: $1,240</span>
                           </div>
                           <p className="text-[11px] text-slate-500 mt-2 font-medium">Carrier delay at transit hub. System bypassed standard routing logic due to perceived SLA risk which did not materialize.</p>
                           <div className="mt-3 pt-3 border-t border-slate-100 flex gap-3">
                             <span className="bg-slate-50 border border-slate-100 px-2 py-1 rounded text-[10px] font-bold text-slate-600">Affected Hubs: Transit Hub B</span>
                             <span className="bg-emerald-50 border border-emerald-100 px-2 py-1 rounded text-[10px] font-bold text-emerald-700">Expected Saving: $800</span>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                   
                   {activeTab === 'Cost Suggestions' && (
                     <div className="w-full space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                       <div className="border border-[#10B981]/40 bg-gradient-to-r from-[#10B981]/10 to-transparent p-4 rounded-xl flex items-center justify-between shadow-sm">
                         <div>
                           <div className="font-black text-sm text-[#0F2922] flex items-center gap-2"><Zap className="w-4 h-4 text-[#10B981]"/> Bypass Urban Transit Hub</div>
                           <div className="text-[11px] text-slate-600 mt-1 font-medium">Route directly to suburban node to avoid $3,120 in congestion delays and handling fees.</div>
                         </div>
                         <button className="px-5 py-2.5 bg-[#10B981] text-white text-[11px] font-bold rounded-lg shadow-sm hover:bg-[#007A5E] hover:shadow-md transition-all transform hover:-translate-y-0.5">Apply Suggestion</button>
                       </div>
                       
                       <div className="border border-orange-500/40 bg-gradient-to-r from-orange-500/10 to-transparent p-4 rounded-xl flex items-center justify-between shadow-sm">
                         <div>
                           <div className="font-black text-sm text-[#0F2922] flex items-center gap-2"><TrendingDown className="w-4 h-4 text-orange-500"/> Consolidate Thursday Runs</div>
                           <div className="text-[11px] text-slate-600 mt-1 font-medium">Merge underutilized trucks leaving BLR on Thursdays to save $5,230 per week.</div>
                         </div>
                         <button className="px-5 py-2.5 bg-orange-500 text-white text-[11px] font-bold rounded-lg shadow-sm hover:bg-orange-600 hover:shadow-md transition-all transform hover:-translate-y-0.5">Apply Suggestion</button>
                       </div>
                     </div>
                   )}
                   
                   {activeTab === 'Reinvestment Advisor' && (
                     <div className="w-full space-y-4 animate-in fade-in scale-95 duration-300">
                       <div className="border border-slate-200 bg-white p-5 rounded-xl shadow-sm hover:border-emerald-200 transition-colors">
                         <div className="flex justify-between items-start mb-2">
                           <div className="font-black text-sm text-slate-900 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-500"/> Automated HS Code Validation API</div>
                           <span className="px-2.5 py-1 bg-green-100 text-green-700 font-bold text-[10px] rounded-md border border-green-200">94% Confidence Score</span>
                         </div>
                         <p className="text-[11px] text-slate-600 mb-5 font-medium leading-relaxed">Invest identified savings into an automated customs clearance API integration to prevent future reverse logistics delays and port demurrage.</p>
                         <div className="grid grid-cols-3 gap-4 text-center text-[11px]">
                           <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg"><div className="font-bold text-slate-500 mb-1">Projected ROI</div><div className="font-black text-xl text-[#10B981]">145%</div></div>
                           <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg"><div className="font-bold text-slate-500 mb-1">Implementation</div><div className="font-black text-xl text-slate-800">$12,000</div></div>
                           <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg"><div className="font-bold text-slate-500 mb-1">Payback Period</div><div className="font-black text-xl text-slate-800">2.4 mos</div></div>
                         </div>
                       </div>
                     </div>
                   )}
                     </>
                   );
                 })()}
                 </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-[360px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">Route Cost Simulation</h2>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500">{selectedCorridor ? 'Active' : 'Hidden'}</span>
            </div>
            
            <div className="flex-1 border border-slate-100 rounded-xl overflow-hidden relative bg-[#F8FAFC]">
              {selectedCorridor ? (
                <>
                  <SimulationMap checkpoints={selectedCorridor.checkpoints} simulationStep={simulationStep} />
                  {simulationStep === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center z-[1000] bg-white/50 backdrop-blur-sm">
                       <button onClick={() => playSimulation()} className="px-6 py-2.5 bg-[#0F2922] text-white font-bold rounded-lg shadow-xl flex items-center gap-2 hover:bg-black transition-transform hover:scale-105">
                         <Play className="w-4 h-4 fill-current" /> Start Simulation
                       </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <MapPin className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-[11px] font-bold text-slate-500">Select any corridor from the list above to simulate and analyze cost build-up at each checkpoint.</p>
                  <p className="text-[9px] text-slate-400 mt-4">Simulation available for Forward, Reverse & Part shipments only.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer Bar */}
        <div className="bg-white px-4 py-3 border border-slate-200 rounded-lg flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            <span>AI Cost Engine scanned 12,845 transactions across 185 corridors</span>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span>Identified 20 suboptimal transactions</span>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[#10B981]">Potential annual savings: $1.27M</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
            Last refreshed: Just now <RefreshCw className="w-3 h-3" />
          </div>
        </div>

      </div>
    </div>
  );
}
