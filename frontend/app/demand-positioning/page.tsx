"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useGetDemandPositioning } from "@/services/queries";
import apiClient from "@/services/api-client";
import {
  Activity,
  AlertCircle,
  BarChart2,
  CheckCircle2,
  Download,
  Filter,
  RefreshCw,
  Zap,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  Check,
  Globe,
  ChevronDown,
  Database,
  MapPin
} from "lucide-react";

interface OpportunityItem {
  id: string;
  partName: string;
  partCode: string;
  demandTag: string;
  source: string;
  sourceQty: number;
  destination: string;
  destQty: number;
  gap: number;
  saving: number;
  priority: "High" | "Medium" | "Low";
  deliveryTimeBefore: number;
  deliveryTimeAfter: number;
  co2Reduction: number;
  repositionQty: number;
  imageUrl: string;
  bullets: string[];
}

const mockOpportunities: OpportunityItem[] = [
  {
    id: "OPP-001",
    partName: "Laptop Motherboard",
    partCode: "PRT-01028",
    demandTag: "High Demand",
    source: "Mumbai WH",
    sourceQty: 42,
    destination: "Hyderabad WH",
    destQty: 5,
    gap: -13,
    saving: 3012,
    priority: "High",
    deliveryTimeBefore: 3.4,
    deliveryTimeAfter: 1.2,
    co2Reduction: 18,
    repositionQty: 13,
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=120&h=120&q=80",
    bullets: [
      "Hyderabad failures increased 42% in last 30 days.",
      "Local inventory at Hyderabad is critically low (5 units).",
      "Average wait time is 3.2 days.",
      "Mumbai warehouse has excess stock (42 units).",
      "Predicted demand for next month: 18 units."
    ]
  },
  {
    id: "OPP-002",
    partName: "RAM 8GB",
    partCode: "PRT-02035",
    demandTag: "Medium Demand",
    source: "Delhi WH",
    sourceQty: 26,
    destination: "Bangalore WH",
    destQty: 8,
    gap: -8,
    saving: 2624,
    priority: "Medium",
    deliveryTimeBefore: 2.8,
    deliveryTimeAfter: 1.0,
    co2Reduction: 12,
    repositionQty: 8,
    imageUrl: "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=120&h=120&q=80",
    bullets: [
      "Bangalore region orders for 8GB RAM spike during end-of-quarter cycles.",
      "Current warehouse stock (8 units) is below safety margin of 15 units.",
      "Saves transit delay of 1.8 days from Northern hubs.",
      "Delhi warehouse reports low outbound commitment for this component type."
    ]
  },
  {
    id: "OPP-003",
    partName: "SSD 512GB",
    partCode: "PRT-03021",
    demandTag: "Medium Demand",
    source: "Mumbai WH",
    sourceQty: 18,
    destination: "Pune WH",
    destQty: 6,
    gap: -6,
    saving: 2473,
    priority: "Medium",
    deliveryTimeBefore: 2.1,
    deliveryTimeAfter: 0.8,
    co2Reduction: 9,
    repositionQty: 6,
    imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=120&h=120&q=80",
    bullets: [
      "Pune local repairs list shows SSD replacements up by 15%.",
      "Saves urgent air freight costs by using short road link from Mumbai.",
      "Stock balance at Mumbai remains within green safety parameters (12 units remaining)."
    ]
  },
  {
    id: "OPP-004",
    partName: "Power Supply 450W",
    partCode: "PRT-04011",
    demandTag: "Low Demand",
    source: "Mumbai WH",
    sourceQty: 32,
    destination: "Hyderabad WH",
    destQty: 12,
    gap: -12,
    saving: 2266,
    priority: "Low",
    deliveryTimeBefore: 3.4,
    deliveryTimeAfter: 1.5,
    co2Reduction: 14,
    repositionQty: 12,
    imageUrl: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=120&h=120&q=80",
    bullets: [
      "Hyderabad warehouse reports persistent stock depletion for enterprise rack components.",
      "Optimizes bulk carrier volumes by combining with motherboard dispatch route."
    ]
  },
  {
    id: "OPP-005",
    partName: "Cooling Fan",
    partCode: "PRT-05012",
    demandTag: "Low Demand",
    source: "Jaipur WH",
    sourceQty: 16,
    destination: "Delhi WH",
    destQty: 8,
    gap: -4,
    saving: 1985,
    priority: "Low",
    deliveryTimeBefore: 1.9,
    deliveryTimeAfter: 0.9,
    co2Reduction: 6,
    repositionQty: 4,
    imageUrl: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=120&h=120&q=80",
    bullets: [
      "Delhi WH stock depleted from summer datacenter hardware refreshes.",
      "Jaipur WH holds excess fan units (16 units) with low localized demand."
    ]
  }
];

export default function DemandPositioningPage() {
  const [selectedPartId, setSelectedPartId] = useState<string>("OPP-001");
  const [activeStep, setActiveStep] = useState<number>(1);
  const [partFilter, setPartFilter] = useState<string>("All Parts");
  const [dateRange, setDateRange] = useState<string>("21 May - 28 May, 2024");
  const [localApproved, setLocalApproved] = useState<Record<string, boolean>>({});

  const { data: backendData, refetch } = useGetDemandPositioning();
  const approvedIds = backendData?.approved_opportunity_ids || [];

  const opportunities = useMemo(() => {
    if (!backendData?.opportunities || backendData.opportunities.length === 0) {
      return mockOpportunities;
    }
    return backendData.opportunities.map((opp, idx) => {
      const template = mockOpportunities[idx % mockOpportunities.length];
      let partCode = template.partCode;
      let partName = template.partName;
      let destination = template.destination;
      let source = template.source;

      const partMatch = opp.description.match(/Part\s+([A-Za-z0-9_-]+)/i);
      if (partMatch) partCode = partMatch[1];
      
      const destMatch = opp.description.match(/shipped\s+to\s+([^,]+)/i);
      if (destMatch) destination = destMatch[1].trim();

      // Make a pretty part name based on part category/code
      if (partCode.includes("PRT-01028")) partName = "High-End Motherboard";
      else if (partCode.includes("PRT-01029")) partName = "Ultra-Fast RAM Module";
      else if (partCode.includes("PRT-01030")) partName = "Enterprise Xeon CPU";
      else if (partCode.includes("PRT-01031")) partName = "Performance SSD Hub";

      return {
        id: opp.id,
        partName: partName,
        partCode: partCode,
        demandTag: opp.severity === "Critical" ? "Critical Shortage" : "High Alert",
        source: source,
        sourceQty: template.sourceQty,
        destination: destination,
        destQty: template.destQty,
        gap: template.gap,
        saving: opp.cost_saving,
        priority: opp.severity,
        deliveryTimeBefore: template.deliveryTimeBefore,
        deliveryTimeAfter: template.deliveryTimeAfter,
        co2Reduction: template.co2Reduction,
        repositionQty: template.repositionQty,
        imageUrl: template.imageUrl,
        bullets: [
          opp.description,
          template.bullets[1] || "Optimizes bulk carrier volumes by combining with motherboard dispatch route."
        ]
      };
    });
  }, [backendData]);

  const selectedPart = useMemo(() => {
    return opportunities.find(o => o.id === selectedPartId) || opportunities[0];
  }, [opportunities, selectedPartId]);

  useEffect(() => {
    if (opportunities && opportunities.length > 0) {
      const exists = opportunities.some(o => o.id === selectedPartId);
      if (!exists) {
        setSelectedPartId(opportunities[0].id);
      }
    }
  }, [opportunities, selectedPartId]);

  const handleApprove = async (id: string) => {
    setLocalApproved(prev => ({ ...prev, [id]: true }));
    try {
      await apiClient.post("/optimization/demand-positioning/approve", { opportunity_id: id });
      refetch();
    } catch (err) {
      console.error("Failed to approve opportunity:", err);
    }
  };

  const exportCsv = () => {
    const headers = ["Opportunity ID", "Part Name", "Part Code", "Source WH", "Destination WH", "Savings USD"];
    const rows = opportunities.map(o => 
      [o.id, o.partName, o.partCode, o.source, o.destination, o.saving].join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "demand-repositioning-plan.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans text-slate-800 flex flex-col pb-10">
      
      {/* 1. TOP HEADER */}
      <header className="px-6 py-4 bg-white border-b border-slate-200/60 flex items-center justify-between z-10 shadow-sm shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">AI Demand Positioning</h1>
            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
              <Zap size={10} className="fill-emerald-600" /> AI Powered
            </span>
          </div>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Place the right stock at the right place, before demand happens.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Dropdown 1 */}
          <div className="relative">
            <select 
              value={partFilter}
              onChange={(e) => setPartFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-9 text-xs font-bold text-slate-700 outline-none hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              <option>All Parts</option>
              <option>Motherboards</option>
              <option>RAM modules</option>
              <option>Storage SSDs</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Date Picker Dropdown */}
          <div className="relative">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-9 text-xs font-bold text-slate-700 outline-none hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              <option>21 May - 28 May, 2024</option>
              <option>1 June - 8 June, 2024</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Export Button */}
          <button 
            onClick={exportCsv}
            className="flex items-center gap-2 bg-[#00B67A] hover:bg-[#009B68] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 transition-colors"
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* 2. TOP KPI CARDS */}
        <div className="grid grid-cols-4 gap-4">
          
          {/* Card 1 */}
          <div className="bg-white rounded-[18px] border border-slate-200/40 p-5 flex items-center gap-4 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white to-emerald-500/[0.01]" />
            <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-sm shrink-0">
              <span className="text-lg font-black">$</span>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Potential Annual Savings</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">$29,353</p>
              <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                <span>↑ 18.8%</span> <span className="text-slate-400 font-semibold">vs last month</span>
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-[18px] border border-slate-200/40 p-5 flex items-center gap-4 shadow-sm relative overflow-hidden group">
            <div className="w-11 h-11 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-sm shrink-0">
              <ShoppingBag size={18} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parts to Reposition</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">46</p>
              <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                <span>↑ 12</span> <span className="text-slate-400 font-semibold">vs last month</span>
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-[18px] border border-slate-200/40 p-5 flex items-center gap-4 shadow-sm relative overflow-hidden group">
            <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm shrink-0">
              <Activity size={18} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Warehouses Affected</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">17</p>
              <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                <span>↑ 4</span> <span className="text-slate-400 font-semibold">vs last month</span>
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-[18px] border border-slate-200/40 p-5 flex items-center gap-4 shadow-sm relative overflow-hidden group">
            <div className="w-11 h-11 rounded-full bg-teal-50 text-teal-500 flex items-center justify-center shadow-sm shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Confidence</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">97%</p>
              <p className="text-[10px] font-bold text-emerald-600 mt-1">
                <span>Very High</span>
              </p>
            </div>
          </div>

        </div>

        {/* 3. STEP TABS TIMELINE */}
        <div className="flex bg-white rounded-xl p-1.5 border border-slate-200/60 shadow-sm gap-2">
          {[
            { id: 1, label: "Demand Opportunities" },
            { id: 2, label: "Nearest Stock Intelligence" },
            { id: 3, label: "Predictive Stock Positioning" }
          ].map((step) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`flex items-center gap-2.5 text-xs font-bold transition-all px-5 py-2.5 rounded-lg flex-1 ${
                activeStep === step.id 
                  ? "bg-[#00B67A]/10 text-[#00B67A]" 
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                activeStep === step.id ? "bg-[#00B67A] text-white" : "bg-slate-200 text-slate-500"
              }`}>
                {step.id}
              </span>
              <span>{step.label}</span>
            </button>
          ))}
        </div>

        {/* 4. MAIN SPLIT COLUMNS */}
        {activeStep === 1 && (
          <div className="grid grid-cols-3 gap-6">
            
            {/* LEFT 2 COLUMNS */}
            <div className="col-span-2 space-y-6">
            
            {/* Table: Top Demand Positioning Opportunities */}
            <div className="bg-white rounded-[18px] border border-slate-200/40 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-base font-black text-slate-950">Top Demand Positioning Opportunities</h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    AI identifies parts that are repeatedly shipped to high-demand locations.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-bold">Sort by:</span>
                  <select className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-600 outline-none hover:bg-slate-100 transition-colors cursor-pointer">
                    <option>Potential Saving</option>
                    <option>Priority</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-bold text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 uppercase text-[9px]">
                      <th className="p-3 pl-4">Part & Details</th>
                      <th className="p-3">Current Flow</th>
                      <th className="p-3">Demand Location</th>
                      <th className="p-3 text-center">Gap (Units)</th>
                      <th className="p-3 text-right">Potential Saving</th>
                      <th className="p-3 text-center">Priority</th>
                      <th className="p-3 text-center pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunities.map((opp) => (
                      <tr 
                        key={opp.id}
                        onClick={() => setSelectedPartId(opp.id)}
                        className={`border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors ${
                          selectedPartId === opp.id ? "bg-emerald-50/20 text-emerald-900 border-l-2 border-l-[#00B67A]" : "border-l-2 border-l-transparent"
                        }`}
                      >
                        <td className="p-3 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg border border-slate-100 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                              <img src={opp.imageUrl} alt={opp.partName} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900">{opp.partName}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{opp.partCode}</div>
                              <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded font-black ${
                                opp.priority === "High" ? "bg-rose-50 text-rose-500" :
                                opp.priority === "Medium" ? "bg-amber-50 text-amber-600" :
                                "bg-emerald-50 text-emerald-600"
                              }`}>
                                {opp.demandTag}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-700">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span>{opp.source}</span>
                            <ArrowRight size={11} className="text-slate-400" />
                          </div>
                          <span className="text-[10px] text-slate-400">{opp.sourceQty} units</span>
                        </td>
                        <td className="p-3">
                          <div className="text-slate-900">{opp.destination}</div>
                          <span className="text-[10px] text-slate-400">{opp.destQty} units</span>
                        </td>
                        <td className="p-3 text-center text-rose-500 text-sm font-black">
                          {opp.gap}
                        </td>
                        <td className="p-3 text-right text-emerald-600 text-sm font-black">
                          ${opp.saving.toLocaleString()}
                          <span className="block text-[9px] text-slate-400 font-semibold">per year</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            opp.priority === "High" ? "bg-rose-50 text-rose-600" :
                            opp.priority === "Medium" ? "bg-amber-50 text-amber-600" :
                            "bg-emerald-50 text-emerald-600"
                          }`}>
                            {opp.priority}
                          </span>
                        </td>
                        <td className="p-3 text-center pr-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {(localApproved[opp.id] || approvedIds.includes(opp.id)) && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100" title="Approved & Injected">
                                <Check size={10} strokeWidth={3} />
                              </span>
                            )}
                            <button 
                              className={`px-3 py-1 rounded-lg transition-colors text-[10px] font-black shadow-sm ${
                                selectedPartId === opp.id
                                  ? "bg-[#00B67A] text-white"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPartId(opp.id);
                              }}
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-center">
                <button className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors">
                  View all opportunities →
                </button>
              </div>
            </div>

            {/* Before vs After Repositioning */}
            <div className="grid grid-cols-2 gap-6">
              
              {/* Card Left: Before vs After Repositioning visual */}
              <div className="bg-white rounded-[18px] border border-slate-200/40 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-900 mb-4">Before vs After Repositioning</h3>
                  
                  <div className="flex items-stretch justify-between gap-4">
                    {/* Before Block */}
                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex-1 text-center flex flex-col justify-between">
                      <div>
                        <div className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Current State</div>
                        <div className="text-xs font-bold text-slate-800 mt-3">{selectedPart.source}</div>
                        <div className="text-xs font-black text-slate-900 mt-0.5">{selectedPart.sourceQty} Units</div>
                        
                        <div className="flex items-center justify-center my-3 text-slate-300">
                          <ArrowRight size={14} />
                        </div>

                        <div className="text-xs font-bold text-slate-800">{selectedPart.destination}</div>
                        <div className="text-xs font-black text-slate-900 mt-0.5">{selectedPart.destQty} Units</div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[9px] font-semibold text-slate-400">
                        <div>
                          <span>Excess Stock</span>
                          <span className="block text-slate-700 font-bold mt-0.5">{selectedPart.sourceQty - selectedPart.repositionQty} Units</span>
                        </div>
                        <div>
                          <span>Stock Gap</span>
                          <span className="block text-rose-600 font-bold mt-0.5">{selectedPart.gap} Units</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle spacer arrow icon */}
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shadow-sm shrink-0">
                        <ChevronRight size={18} />
                      </div>
                    </div>

                    {/* After Block */}
                    <div className="bg-emerald-50/10 rounded-xl p-4 border border-emerald-100/50 flex-1 text-center flex flex-col justify-between">
                      <div>
                        <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">After AI Recommendation</div>
                        <div className="text-xs font-bold text-slate-800 mt-3">{selectedPart.source}</div>
                        <div className="text-xs font-black text-slate-900 mt-0.5">{selectedPart.sourceQty - selectedPart.repositionQty} Units</div>
                        
                        <div className="flex items-center justify-center my-3 text-emerald-300">
                          <ArrowRight size={14} />
                        </div>

                        <div className="text-xs font-bold text-slate-800">{selectedPart.destination}</div>
                        <div className="text-xs font-black text-slate-900 mt-0.5">{selectedPart.destQty + selectedPart.repositionQty} Units</div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-emerald-100 grid grid-cols-2 gap-2 text-[9px] font-semibold text-slate-400">
                        <div>
                          <span>Balanced Stock</span>
                          <span className="block text-slate-700 font-bold mt-0.5">{selectedPart.sourceQty - selectedPart.repositionQty} Units</span>
                        </div>
                        <div>
                          <span>Gap Status</span>
                          <span className="block text-emerald-600 font-black mt-0.5">Gap Resolved</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Right: Warehouse Stock Balance */}
              <div className="bg-white rounded-[18px] border border-slate-200/40 p-6 shadow-sm">
                <h3 className="text-xs font-black text-slate-900 mb-4">Warehouse Stock Balance</h3>
                
                <table className="w-full text-left border-collapse text-xs font-bold text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 uppercase text-[9px]">
                      <th className="p-2.5">Warehouse</th>
                      <th className="p-2.5 text-center">Before</th>
                      <th className="p-2.5 text-center">After</th>
                      <th className="p-2.5 text-center">Change</th>
                      <th className="p-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Mumbai WH", before: 42, after: 29, change: -13, status: "Excess Reduced", color: "text-emerald-600 bg-emerald-50 border border-emerald-100/50" },
                      { name: "Hyderabad WH", before: 5, after: 18, change: 13, status: "Gap Resolved", color: "text-emerald-600 bg-emerald-50 border border-emerald-100/50" },
                      { name: "Delhi WH", before: 28, after: 28, change: 0, status: "No Change", color: "text-slate-400 bg-slate-100" },
                      { name: "Bangalore WH", before: 8, after: 8, change: 0, status: "No Change", color: "text-slate-400 bg-slate-100" },
                      { name: "Pune WH", before: 6, after: 6, change: 0, status: "No Change", color: "text-slate-400 bg-slate-100" }
                    ].map((row) => {
                      const isSource = row.name === selectedPart.source;
                      const isDest = row.name === selectedPart.destination;
                      
                      let beforeVal = row.before;
                      let afterVal = row.after;
                      let changeVal = row.change;
                      let statusText = row.status;
                      let badgeColor = row.color;

                      if (isSource) {
                        beforeVal = selectedPart.sourceQty;
                        afterVal = selectedPart.sourceQty - selectedPart.repositionQty;
                        changeVal = -selectedPart.repositionQty;
                        statusText = "Excess Reduced";
                        badgeColor = "text-emerald-600 bg-emerald-50 border border-emerald-100/50";
                      } else if (isDest) {
                        beforeVal = selectedPart.destQty;
                        afterVal = selectedPart.destQty + selectedPart.repositionQty;
                        changeVal = selectedPart.repositionQty;
                        statusText = "Gap Resolved";
                        badgeColor = "text-emerald-600 bg-emerald-50 border border-emerald-100/50";
                      } else {
                        // Standard values
                        changeVal = 0;
                        statusText = "No Change";
                        badgeColor = "text-slate-400 bg-slate-100/60";
                      }

                      return (
                        <tr key={row.name} className="border-b border-slate-50">
                          <td className="p-2.5 text-slate-800 font-extrabold">{row.name}</td>
                          <td className="p-2.5 text-center text-slate-400">{beforeVal}</td>
                          <td className="p-2.5 text-center text-slate-900 font-black">{afterVal}</td>
                          <td className={`p-2.5 text-center font-black ${
                            changeVal > 0 ? "text-emerald-600" : changeVal < 0 ? "text-rose-500" : "text-slate-400"
                          }`}>
                            {changeVal > 0 ? `+${changeVal}` : changeVal === 0 ? "0" : changeVal}
                          </td>
                          <td className="p-2.5 text-right">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${badgeColor}`}>
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            
            {/* Selected Recommendation Card */}
            <div className="bg-white rounded-[18px] border border-slate-200/40 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black text-slate-950">Selected Recommendation</h3>
                  <span className="bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border border-emerald-100/50">
                    Recommended
                  </span>
                </div>

                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl border border-slate-150 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                      <img src={selectedPart.imageUrl} alt={selectedPart.partName} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-tight">{selectedPart.partName}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{selectedPart.partCode}</p>
                      <span className="inline-block mt-1 text-[9px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded font-black border border-rose-100/50">
                        High Demand
                      </span>
                    </div>
                  </div>
                  
                  {/* Radial / Circle Confidence */}
                  <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="22" cy="22" r="18" fill="none" stroke="#F1F5F9" strokeWidth="3" />
                      <circle cx="22" cy="22" r="18" fill="none" stroke="#00B67A" strokeWidth="3" strokeDasharray="113" strokeDashoffset="2.2" />
                    </svg>
                    <span className="absolute text-[10px] font-black text-slate-900">98%</span>
                  </div>
                </div>

                {/* Inner detailed sections */}
                <div className="grid grid-cols-3 gap-3 py-4 border-b border-slate-100 text-[10px]">
                  {/* Current Situation */}
                  <div className="space-y-2">
                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Current Situation</h5>
                    <div className="text-[9px] font-bold text-slate-500">
                      <span className="block text-slate-400 font-medium">Source Warehouse</span>
                      <span className="text-slate-800 font-black">{selectedPart.source}</span>
                    </div>
                    <div className="text-[9px] font-bold text-slate-500">
                      <span className="block text-slate-400 font-medium">Current Stock</span>
                      <span className="text-slate-800 font-black">{selectedPart.sourceQty} Units</span>
                    </div>
                    <div className="text-[9px] font-bold text-slate-500">
                      <span className="block text-slate-400 font-medium">Destination</span>
                      <span className="text-slate-800 font-black">{selectedPart.destination}</span>
                    </div>
                    <div className="text-[9px] font-bold text-slate-500">
                      <span className="block text-slate-400 font-medium">Current Stock</span>
                      <span className="text-slate-800 font-black">{selectedPart.destQty} Units</span>
                    </div>
                    <div className="text-[9px] font-bold text-slate-500">
                      <span className="block text-slate-400 font-medium">Stock Gap</span>
                      <span className="text-rose-600 font-black">{selectedPart.gap} Units</span>
                    </div>
                    <div className="text-[9px] font-bold text-slate-500">
                      <span className="block text-slate-400 font-medium">Avg. Delivery Time</span>
                      <span className="text-rose-500 font-black">{selectedPart.deliveryTimeBefore} Days</span>
                    </div>
                  </div>

                  {/* AI Recommendation */}
                  <div className="space-y-2 border-x border-slate-100 px-3">
                    <h5 className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">AI Recommendation</h5>
                    <div className="text-[9px] font-bold text-slate-500">
                      <span className="block text-slate-400 font-medium">Transfer From</span>
                      <span className="text-slate-800 font-black">{selectedPart.source}</span>
                    </div>
                    <div className="text-[9px] font-bold text-slate-500">
                      <span className="block text-slate-400 font-medium">Transfer To</span>
                      <span className="text-slate-800 font-black">{selectedPart.destination}</span>
                    </div>
                    <div className="text-[9px] font-bold text-slate-500">
                      <span className="block text-slate-400 font-medium">Recommended Qty</span>
                      <span className="text-emerald-600 font-black">{selectedPart.repositionQty} Units</span>
                    </div>
                    <div className="text-[9px] font-bold text-slate-500">
                      <span className="block text-slate-400 font-medium">Est. Arrival</span>
                      <span className="text-slate-800 font-black">Tomorrow</span>
                    </div>
                    <div className="text-[9px] font-bold text-slate-500">
                      <span className="block text-slate-400 font-medium">Est. Delivery Time</span>
                      <span className="text-emerald-600 font-black">{selectedPart.deliveryTimeAfter} Days</span>
                    </div>
                  </div>

                  {/* Business Impact */}
                  <div className="space-y-2">
                    <h5 className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">Business Impact</h5>
                    <div className="text-[9px] font-bold text-slate-500">
                      <span className="block text-slate-400 font-medium">Potential Saving</span>
                      <span className="text-emerald-600 font-black">${selectedPart.saving.toLocaleString()}</span>
                      <span className="block text-[8px] text-slate-400">per year</span>
                    </div>
                    <div className="text-[9px] font-bold text-slate-500">
                      <span className="block text-slate-400 font-medium">Faster Delivery</span>
                      <span className="text-emerald-600 font-black">{(selectedPart.deliveryTimeBefore - selectedPart.deliveryTimeAfter).toFixed(1)} Days</span>
                      <span className="block text-[8px] text-slate-400 font-semibold">improvement</span>
                    </div>
                    <div className="text-[9px] font-bold text-slate-500">
                      <span className="block text-slate-400 font-medium">CO2 Reduction</span>
                      <span className="text-emerald-600 font-black">{selectedPart.co2Reduction} kg</span>
                      <span className="block text-[8px] text-slate-400 font-semibold">per year</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Approve Button */}
              <div className="mt-4 pt-1">
                {(localApproved[selectedPart.id] || approvedIds.includes(selectedPart.id)) ? (
                  <div className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 py-3 rounded-xl text-xs font-black shadow-sm border border-emerald-100">
                    <Check size={16} strokeWidth={3} /> Approved & Injected
                  </div>
                ) : (
                  <button 
                    onClick={() => handleApprove(selectedPart.id)}
                    className="w-full bg-[#00B67A] hover:bg-[#009B68] text-white py-3 rounded-xl text-xs font-black shadow-md shadow-emerald-500/10 transition-all active:scale-[0.99]"
                  >
                    Approve Transfer Recommendation
                  </button>
                )}
              </div>
            </div>

            {/* Why AI Recommended This */}
            <div className="bg-white rounded-[18px] border border-slate-200/40 p-6 shadow-sm">
              <h3 className="text-xs font-black text-slate-900 mb-4">Why AI Recommended This</h3>
              
              <ul className="space-y-3.5">
                {selectedPart.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start text-[10px] font-bold text-slate-600">
                    <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm border border-emerald-100/50">
                      <CheckCircle2 size={12} className="fill-emerald-50 text-emerald-600" />
                    </div>
                    <span className="leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>
        )}

        {/* STEP 2 CONTENT */}
        {activeStep === 2 && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <div className="bg-white rounded-[18px] border border-slate-200/40 p-12 shadow-sm text-center min-h-[500px] flex flex-col justify-center items-center">
                <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100">
                  <Globe size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800">Nearest Stock Intelligence</h2>
                <p className="text-slate-500 mt-3 font-medium max-w-lg mx-auto leading-relaxed">
                  Scanning all regional distribution centers and satellite nodes to build a comprehensive real-time map of available inventory. Stock levels are continuously verified against SLA commitments and pending allocations.
                </p>
                <div className="mt-8 flex gap-4">
                  <div className="px-6 py-3 bg-blue-50/50 rounded-xl border border-blue-100 text-blue-700 font-bold flex items-center gap-2">
                    <Database size={16}/> 14 Hubs Scanned
                  </div>
                  <div className="px-6 py-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-emerald-700 font-bold flex items-center gap-2">
                    <CheckCircle2 size={16}/> Stock Verified
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-1 space-y-6">
              <div className="bg-white rounded-[18px] border border-slate-200/40 p-6 shadow-sm h-full min-h-[500px]">
                <h3 className="text-sm font-black text-slate-900 mb-6">Stock Availability Map</h3>
                <div className="w-full h-48 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 font-bold mb-6">
                  Map Loading...
                </div>
                <ul className="space-y-4">
                  {[
                    { node: "HUB-BLR", stock: "1,245 units", status: "Optimal" },
                    { node: "HUB-DEL", stock: "432 units", status: "Low" },
                    { node: "HUB-MUM", stock: "890 units", status: "Optimal" },
                  ].map((h, i) => (
                    <li key={i} className="flex justify-between items-center pb-3 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{h.node}</p>
                        <p className={`text-[10px] font-bold ${h.status === 'Optimal' ? 'text-emerald-500' : 'text-amber-500'}`}>{h.status}</p>
                      </div>
                      <span className="text-sm font-black text-slate-700">{h.stock}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 CONTENT */}
        {activeStep === 3 && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <div className="bg-white rounded-[18px] border border-slate-200/40 p-12 shadow-sm text-center min-h-[500px] flex flex-col justify-center items-center">
                <div className="w-20 h-20 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-purple-100">
                  <TrendingUp size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800">Predictive Stock Positioning</h2>
                <p className="text-slate-500 mt-3 font-medium max-w-lg mx-auto leading-relaxed">
                  Forecasting future demand using historical failure rates, upcoming weather anomalies, and scheduled enterprise hardware refresh cycles. We proactively position inventory to meet SLAs before the failure occurs.
                </p>
                <div className="mt-8 flex gap-4">
                  <div className="px-6 py-3 bg-purple-50/50 rounded-xl border border-purple-100 text-purple-700 font-bold flex items-center gap-2">
                    <TrendingUp size={16}/> 94% Prediction Accuracy
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-1 space-y-6">
              <div className="bg-white rounded-[18px] border border-slate-200/40 p-6 shadow-sm h-full min-h-[500px]">
                <h3 className="text-sm font-black text-slate-900 mb-6">Upcoming Demand Triggers</h3>
                <ul className="space-y-4">
                  {[
                    { trigger: "Monsoon Season", impact: "High Risk", location: "Mumbai Region" },
                    { trigger: "Enterprise Refresh", impact: "Medium", location: "Bangalore Tech Park" },
                    { trigger: "Hardware Aging", impact: "Critical", location: "Delhi Server Farms" },
                  ].map((t, i) => (
                    <li key={i} className="flex flex-col gap-1 pb-4 border-b border-slate-100 last:border-0">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800">{t.trigger}</span>
                        <span className={`text-[9px] px-2 py-1 rounded-md font-bold ${t.impact === 'High Risk' || t.impact === 'Critical' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>{t.impact}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1"><MapPin size={10}/> {t.location}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
