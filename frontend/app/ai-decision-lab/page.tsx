"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchDecisionLabData, DecisionLabData, executeRecommendation } from "@/services/decision-lab";
import { TopKPIs } from "@/components/decision-lab/TopKPIs";
import { CaseOverview } from "@/components/decision-lab/CaseOverview";
import { AIDecisionGraph } from "@/components/decision-lab/AIDecisionGraph";
import { FlipCardsManager } from "@/components/decision-lab/FlipCardsManager";
import { AlternativeRoutes } from "@/components/decision-lab/AlternativeRoutes";
import { AIFlowTimeline } from "@/components/decision-lab/AIFlowTimeline";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import apiClient from "@/services/api-client";
import { Check, X, ArrowLeft, Loader2, RefreshCw, Leaf, GitBranch, PackageCheck, RadioTower, AlertTriangle, TrendingUp, FileText, Activity, DollarSign, Clock, ShieldCheck, PlaySquare, Settings, Box, BarChart2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Suspense } from "react";

function AIDecisionLabContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id") || "latest";
  
  const [data, setData] = useState<DecisionLabData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bonusSuite, setBonusSuite] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchDecisionLabData(id);
        setData(res);
      } catch {
        setError("Decision context could not be loaded from the backend.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    let active = true;
    apiClient
      .post("/challenge/bonus-suite", { disabled_hubs: [], quantity: 10, priority: "P1" })
      .then((res) => {
        if (active) setBonusSuite(res.data);
      })
      .catch(() => {
        if (active) setBonusSuite(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleApprove = async () => {
    if (!data) return;
    setIsExecuting(true);
    setError(null);
    try {
      await executeRecommendation(data, "Approved");
      setSuccess(true);
      setTimeout(() => {
        router.push("/ai-recommendation-center");
      }, 1500);
    } catch {
      setError("Approval could not be recorded in the backend audit log.");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReject = async () => {
    if (!data) return;
    setIsExecuting(true);
    setError(null);
    try {
      await executeRecommendation(data, "Rejected");
      router.push("/ai-recommendation-center");
    } catch {
      setError("Rejection could not be recorded in the backend audit log.");
    } finally {
      setIsExecuting(false);
    }
  };

  if (isLoading || !data) {
    if (error) {
      return (
        <div className="min-h-screen bg-[#F7F8FA] p-6 font-sans flex items-center justify-center">
          <div className="max-w-md rounded-2xl border border-red-100 bg-white p-6 shadow-sm text-center">
            <h2 className="text-lg font-bold text-slate-900">Backend data unavailable</h2>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <Button className="mt-5 bg-[#00B67A] hover:bg-[#009c69] text-white" onClick={() => router.push("/ai-recommendation-center")}>
              Back to Recommendations
            </Button>
          </div>
        </div>
      );
    }
    return <DecisionLabSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-6 font-sans">
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#00B67A] text-white px-6 py-3 rounded-full font-semibold shadow-xl flex items-center gap-2"
          >
            <Check size={20} />
            Recommendation Executed Successfully. Synchronizing...
          </motion.div>
        )}
      </AnimatePresence>
      {error && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {error}
        </div>
      )}

      {/* Header Actions */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-1 text-[#6B7280] hover:text-[#12161C] transition-colors"
          >
            <ArrowLeft size={14} /> Recommendation Center
          </button>
          <span className="text-[#6B7280]">&gt;</span>
          <span className="text-[#12161C] font-bold">Explainable AI</span>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="border-[#E5484D] text-[#E5484D] hover:bg-[#E5484D] hover:text-white"
            onClick={handleReject}
            disabled={isExecuting}
          >
            <X size={16} className="mr-2" /> Reject Recommendation
          </Button>
          <Button 
            className="bg-[#00B67A] hover:bg-[#009c69] text-white shadow-lg shadow-[#00B67A]/20"
            onClick={handleApprove}
            disabled={isExecuting}
          >
            {isExecuting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Check size={16} className="mr-2" />}
            {isExecuting ? "Committing..." : "Approve Recommendation"}
          </Button>
        </div>
      </div>

      {/* Top KPIs */}
      <TopKPIs data={data} />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <CaseOverview data={data} />
          <AlternativeRoutes data={data} onInvestigate={() => setActiveNode("route")} />
        </div>

        {/* Center/Right Column: Graph + FlipCards + Evidence */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-[500px]">
             {/* AI Graph */}
             <div className="xl:col-span-2 bg-white rounded-2xl border border-[#E3E6EA] p-5 shadow-sm flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-center mb-2 z-10">
                  <div>
                    <h2 className="text-[#12161C] font-bold text-lg uppercase tracking-wide">AI DECISION GRAPH</h2>
                    <p className="text-[#6B7280] text-xs">How AI analyzed this request and arrived at the recommendation</p>
                  </div>
                  <div className="flex items-center gap-2 text-[#00B67A] text-xs font-semibold bg-[#E6F7EF] px-2 py-1 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-[#00B67A] animate-pulse" />
                    Processing Complete
                  </div>
                </div>
                <div className="flex-1 relative">
                  <AIDecisionGraph activeNode={activeNode} onNodeHover={setActiveNode} data={data} />
                </div>
             </div>

             {/* Evidence Panel */}
             <div className="xl:col-span-1">
               <EvidencePanel data={data} />
             </div>
          </div>
        </div>
      </div>

      {/* Flip Cards Area */}
      <div className="bg-white rounded-2xl border border-[#E3E6EA] p-5 shadow-sm flex flex-col relative mt-6">
        <div className="mb-2">
          <h2 className="text-[#12161C] font-bold text-lg uppercase tracking-wide">FLIP TO EXPLORE AI INSIGHTS</h2>
          <p className="text-[#6B7280] text-xs">Click on any card to flip and view detailed analysis</p>
        </div>
        <div className="flex-1">
          <FlipCardsManager data={data} activeCard={activeNode} onCardActivate={setActiveNode} />
        </div>
      </div>

      {/* Timeline */}
      <AIFlowTimeline />
      <SupportingIntelligenceTabs data={bonusSuite} />
    </div>
  );
}

const formatUsd = (value?: number) =>
  `$${Math.round(value || 0).toLocaleString()}`;

const formatKg = (value?: number) =>
  `${Math.round(value || 0).toLocaleString()} kg`;

function EvidencePanel({ data }: { data: DecisionLabData }) {
  const primaryEvidence = data.evidenceSources[0];
  const secondaryEvidence = data.evidenceSources[1];
  const rows = [
    { label: primaryEvidence?.title || "Backend Evidence", value: primaryEvidence?.records || data.id, icon: FileText, note: primaryEvidence?.status || "Loaded from decision context" },
    { label: secondaryEvidence?.title || "Route Evidence", value: secondaryEvidence?.records || data.caseOverview.routeId, icon: Activity, note: secondaryEvidence?.status || "Route context available" },
    { label: "Cost Improvement", value: formatUsd(data.costAnalysis.savings), icon: DollarSign, note: `${formatUsd(data.costAnalysis.currentRouteCost)} current vs ${formatUsd(data.costAnalysis.recommendedCost)} recommended` },
    { label: "Transit Improvement", value: `${data.etaImprovementDays.toFixed(1)} Days`, icon: Clock, note: `${data.transitAnalysis.improvementPercent.toFixed(1)}% ETA improvement` },
    { label: "SLA Achievement Probability", value: `${data.riskSLA.slaAchievementProb.toFixed(1)}%`, icon: ShieldCheck, note: `${data.slaRiskPercentage.toFixed(1)}% predicted risk` },
    { label: "Inventory Impact", value: data.inventoryImpact.overallImpact, icon: ShieldCheck, note: `${data.inventoryImpact.originStock} units at origin, ${data.inventoryImpact.destinationDemand} units demand` },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E3E6EA] p-5 shadow-sm flex flex-col relative h-full">
      <div className="mb-2 z-10">
        <h2 className="text-[#12161C] font-bold text-lg uppercase tracking-wide">EVIDENCE FROM HISTORICAL DATA</h2>
        <p className="text-[#6B7280] text-[11px] mt-0.5 leading-relaxed">
          Why AI is confident in this recommendation
        </p>
      </div>
      <div className="flex-1 flex flex-col gap-1 justify-center">
        {rows.map((row, index) => (
          <motion.div 
            key={row.label} 
            className="flex items-center justify-between p-3 py-2.5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15, duration: 0.5, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3 flex-1 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-100/50">
                <row.icon size={14} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-slate-900 truncate">{row.label}</p>
                <p className="text-[10px] text-slate-500 truncate">{row.note}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-2">
              <span className="text-[13px] font-black text-slate-900">{row.value}</span>
              <div className="w-4 h-4 rounded-full bg-[#00B67A] text-white flex items-center justify-center shadow-sm">
                <Check size={10} strokeWidth={3} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-[#F0FDF4] p-3 text-[11px] font-semibold leading-5 text-[#166534] border border-[#DCFCE7] flex items-start gap-2 shadow-sm">
        <div className="mt-0.5 text-[#16A34A]"><Leaf size={14} /></div>
        <p>Evidence is loaded from the backend decision context for route <strong>{data.caseOverview.routeId}</strong>, including transaction, route, inventory, and risk records.</p>
      </div>
    </div>
  );
}

function SupportingIntelligenceTabs({ data }: { data: any | null }) {
  const [activeTab, setActiveTab] = useState("differentiators");

  const tabs = [
    { id: "route", label: "Route Engine", icon: GitBranch },
    { id: "carbon", label: "Carbon Engine", icon: Leaf },
    { id: "pareto", label: "Pareto Engine", icon: BarChart2 },
    { id: "inventory", label: "Inventory Engine", icon: PackageCheck },
    { id: "prediction", label: "Prediction Engine", icon: RadioTower },
    { id: "differentiators", label: "Product Differentiators", icon: Box },
  ];

  const dynamic = data?.dynamic_rerouting?.result;
  const pareto = (data?.multi_objective_pareto?.frontier || []).slice(0, 6);
  const inventory = (data?.inventory_balancing_agent || []).slice(0, 5);
  const tracker = data?.live_route_tracker || [];
  const carbonRoutes = (data?.carbon_optimization?.carbon_optimized_routes || []).slice(0, 4);
  const maxCost = Math.max(...pareto.map((item: any) => item.cost || 0), 1);
  const maxCarbon = Math.max(...pareto.map((item: any) => item.carbon_kg || 0), 1);

  return (
    <div className="rounded-3xl border border-[#D8F3E8] bg-white p-6 shadow-sm flex flex-col mt-2">
      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-[#00B67A] text-white shadow-md shadow-[#00B67A]/20' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="min-h-[250px] flex flex-col">
        {activeTab === "route" && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 flex-1">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-slate-950">Dynamic Re-routing</p>
                <p className="text-xs font-semibold text-slate-500">Hub outage resilience simulation</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricTile label="Affected" value={dynamic ? `${dynamic.affected_shipments_count}` : "--"} />
              <MetricTile label="Rerouted" value={dynamic ? `${dynamic.rerouted_shipments_count}` : "--"} />
              <MetricTile label="Cost Delta" value={formatUsd(dynamic?.cost_delta)} />
              <MetricTile label="SLA Delta" value={dynamic ? `${dynamic.sla_breach_delta.toFixed(1)}%` : "--"} />
            </div>
          </div>
        )}
        
        {activeTab === "carbon" && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 flex-1">
            <p className="text-sm font-black text-slate-950 mb-4">Lowest Carbon Route Candidates</p>
            <div className="space-y-3">
              {carbonRoutes.length ? carbonRoutes.map((item: any) => (
                <div key={item.transaction_id} className="flex items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-sm">
                  <span className="font-bold text-slate-700 text-sm">{item.route?.join(" -> ")}</span>
                  <span className="font-black text-[#047857] bg-green-50 px-3 py-1 rounded-full">{formatKg(item.carbon_kg)} CO2</span>
                </div>
              )) : <p className="text-sm font-semibold text-slate-500">Loading carbon lanes...</p>}
            </div>
          </div>
        )}

        {activeTab === "pareto" && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 flex-1">
            <p className="text-sm font-black text-slate-950 mb-4">Pareto Frontier Analysis</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pareto.length ? pareto.map((item: any) => (
                <div key={item.transaction_id} className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-xs font-black text-slate-900">{item.route?.join(" -> ")}</p>
                    <span className="text-[10px] font-black text-[#047857]">{item.sla_risk.toFixed(0)}% risk</span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <Bar label="Cost" value={item.cost} max={maxCost} tone="green" text={formatUsd(item.cost)} />
                    <Bar label="CO2e" value={item.carbon_kg} max={maxCarbon} tone="blue" text={formatKg(item.carbon_kg)} />
                  </div>
                </div>
              )) : <EmptyState text="Pareto frontier loading from backend..." />}
            </div>
          </div>
        )}

        {activeTab === "inventory" && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 flex-1">
            <p className="text-sm font-black text-slate-950 mb-4">Inventory Balancing Opportunities</p>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              {inventory.length ? inventory.map((item: any) => (
                <div key={`${item.hub_id}-${item.part_no}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900">{item.part_no} / {item.hub_id}</p>
                    <p className="truncate text-xs font-medium text-slate-500 mt-1">{item.reason}</p>
                  </div>
                  <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-md">{item.coverage_ratio}x Coverage</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-[#047857]">+{item.recommended_preposition_qty} Units</span>
                </div>
              )) : <EmptyState text="Inventory opportunities loading..." />}
            </div>
          </div>
        )}

        {activeTab === "prediction" && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 flex-1">
             <p className="text-sm font-black text-slate-950 mb-4">Live Route Tracker & Risk</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tracker.length ? tracker.map((item: any) => (
                <div key={`${item.minute}-${item.status}`} className="flex gap-4 rounded-xl bg-white p-4 shadow-sm items-center">
                  <div className="h-4 w-4 rounded-full bg-[#00B67A] ring-4 ring-emerald-100 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-black text-slate-900">{item.status}</p>
                      <span className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md">T+{item.minute}m</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{item.node} / {item.risk.toFixed(0)}% risk factor</p>
                  </div>
                </div>
              )) : <EmptyState text="Live route tracker loading..." />}
            </div>
          </div>
        )}

        {activeTab === "differentiators" && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-6 flex-1 flex flex-col justify-center items-center text-center">
             <Box size={40} className="text-[#00B67A] mb-4" />
             <h3 className="text-xl font-black text-slate-900">Enterprise AI Product Differentiators</h3>
             <p className="mt-2 text-sm text-slate-600 max-w-lg">
               This backend architecture natively supports resilience simulation, dynamic rerouting, multi-objective pareto analysis, and real-time learning loops.
             </p>
             <div className="mt-6 flex flex-wrap justify-center gap-3">
               <span className="bg-white border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-bold text-[#00B67A] flex items-center gap-2"><Check size={14}/> Resilient</span>
               <span className="bg-white border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-bold text-[#00B67A] flex items-center gap-2"><Check size={14}/> Sustainable</span>
               <span className="bg-white border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-bold text-[#00B67A] flex items-center gap-2"><Check size={14}/> Predictive</span>
               <span className="bg-white border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-bold text-[#00B67A] flex items-center gap-2"><Check size={14}/> Adaptive</span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-base font-black text-slate-950">{value}</p>
    </div>
  );
}

function Bar({ label, value, max, tone, text }: { label: string; value: number; max: number; tone: "green" | "blue"; text: string }) {
  const width = `${Math.max(8, Math.min(100, (value / max) * 100))}%`;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-bold text-slate-500">
        <span>{label}</span>
        <span>{text}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={tone === "green" ? "h-full rounded-full bg-[#00B67A]" : "h-full rounded-full bg-blue-500"} style={{ width }} />
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl bg-white p-4 text-center text-xs font-semibold text-slate-500">{text}</div>;
}

function DecisionLabSkeleton() {
  return (
    <div className="min-h-screen bg-[#F7F8FA] p-6">
      <div className="flex justify-between mb-4">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
        </div>
      </div>
      <Skeleton className="h-28 w-full mb-6 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 flex flex-col gap-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-9 flex flex-col gap-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-[500px]">
            <Skeleton className="h-full w-full rounded-2xl" />
            <Skeleton className="h-full w-full rounded-2xl" />
          </div>
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function AIDecisionLabPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400 w-8 h-8" /></div>}>
      <AIDecisionLabContent />
    </Suspense>
  );
}
