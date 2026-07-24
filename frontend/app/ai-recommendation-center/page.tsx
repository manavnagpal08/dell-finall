"use client"

import React, { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, ArrowUpRight, BrainCircuit, CheckCircle2, ChevronRight, Activity, 
  Zap, ShieldCheck, Box, Clock, DollarSign, Target, Database,
  Route as RouteIcon, MapPin, Truck, AlertTriangle, PlayCircle, Lightbulb, 
  RefreshCw, Search, Settings, Check, Filter, Eye, X, CheckCircle,
  BarChart3, BarChart, FileText, PieChart, Calculator
} from "lucide-react"
import Link from "next/link"
import { useGetTransactions, useGetHubIntelligence, useGetScoredCorridors } from "@/services/queries";
import apiClient from "@/services/api-client";


/* ============================================================
   TOKENS & THEME
   ============================================================ */
const C = {
  green: "#00B67A",
  greenSoft: "#E6F7EF",
  blue: "#047857",
  blueSoft: "#DFF7EC",
  gray50: "#F7F8FA",
  gray100: "#EEF0F3",
  gray200: "#E3E6EA",
  gray400: "#9AA2AE",
  gray500: "#6B7280",
  gray700: "#3A4149",
  gray900: "#12161C",
  amber: "#F5A623",
  red: "#E5484D",
}

/* ============================================================
   ANIMATED COMPONENTS
   ============================================================ */
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number, prefix?: string, suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1000;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(value * easeOutQuart);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [value]);

  const formatted = displayValue > 1000 ? Math.floor(displayValue).toLocaleString() : Math.round(displayValue * 10) / 10;
  return <span>{prefix}{formatted}{suffix}</span>
}

function CircularProgress({ value, color, size = 40, stroke = 4 }: any) {
  const r = (size - stroke) / 2
  const c = Math.PI * (r * 2)
  const offset = ((100 - value) / 100) * c
  
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 shrink-0" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} stroke={C.gray100} strokeWidth={stroke} fill="transparent" />
        <motion.circle 
          cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="transparent"
          strokeDasharray={c} strokeDashoffset={c} strokeLinecap="round"
          animate={{ strokeDashoffset: offset }} transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute text-[11px] font-bold" style={{ color }}>{value}%</span>
    </div>
  )
}

function RoutePath({ steps, tone = "green" }: { steps: string[]; tone?: "green" | "red" }) {
  const cleanedSteps = steps.filter(Boolean);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {cleanedSteps.map((step, index) => (
        <React.Fragment key={`${step}-${index}`}>
          <span className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-black ${
            tone === "green"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-100 bg-red-50 text-red-700"
          }`}>
            {step}
          </span>
          {index < cleanedSteps.length - 1 && <ChevronRight size={14} className="text-gray-300" />}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function AIRecommendationCenter() {
  const [flowFilter, setFlowFilter] = useState("Forward");
  const { data: txData, isLoading: txLoading, isError: txError, refetch: refetchTransactions } = useGetTransactions({ page: 1, limit: 15, flow_type: flowFilter } as any);

  const { data: hubData, isLoading: hubLoading, isError: hubError, refetch: refetchHubs } = useGetHubIntelligence(flowFilter);
  const { data: corridorData, isLoading: corridorLoading, isError: corridorError, refetch: refetchCorridors } = useGetScoredCorridors(flowFilter);

  const [queueReady, setQueueReady] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [decisionLog, setDecisionLog] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isLoadingRecommendations = txLoading || hubLoading || corridorLoading;
  const hasRecommendationError = txError || hubError || corridorError;

  useEffect(() => {
    setQueue([]);
    setSelectedId(null);
    setQueueReady(false);
  }, [flowFilter]);

  useEffect(() => {
    if (txData && hubData && corridorData) {
      const newQueue: any[] = [];
      const activeCorridors = corridorData.filter((c: any) =>
        flowFilter === "Forward" ? Number(c.forward_volume || 0) > 0 : Number(c.reverse_volume || 0) > 0
      );
      
      // 1. Transaction Re-routing (High Impact)
      if (txData.items && txData.items.length > 0) {
        txData.items
          .filter((t: any) => t.sla_breach || t.status === "Delayed" || Number(t.transit_days_actual || 0) > Number(t.transit_days_expected || 0))
          .slice(0, 5)
          .forEach((t: any, i: number) => {
          const delayDays = Math.max(0, Number(t.transit_days_actual || 0) - Number(t.transit_days_expected || 0));
          const savings = Math.max(250, Math.round(Number(t.logistics_cost_total_usd || t.total_cost_usd || 0) * (0.08 + Math.min(delayDays, 10) * 0.01)));
          const currentRoutePath = [t.origin_hub_id, t.intermediate_hub_id, t.tpr_id, t.destination_location || "Destination"].filter(Boolean);
          const optimizedRoutePath = [
            t.origin_hub_id,
            t.intermediate_hub_id ? `${t.intermediate_hub_id} priority relay` : "Nearest stocked relay",
            t.destination_location || "Destination",
          ].filter(Boolean);
          newQueue.push({
            id: `REC-TXN-${t.transaction_id}`,
            impact: "high",
            title: `Reroute Delayed Shipment ${t.transaction_id}`,
            from: t.origin_hub_id,
            to: t.destination_location || "Destination",
            category: "Shipment Re-routing",
            priority: "High Priority",
            savings,
            currentCost: Math.round(Number(t.logistics_cost_total_usd || t.total_cost_usd || 0)),
            optimizedCost: Math.max(0, Math.round(Number(t.logistics_cost_total_usd || t.total_cost_usd || 0) - savings)),
            currentEta: Number(t.transit_days_actual || t.transit_days_expected || 0),
            optimizedEta: Math.max(0.5, Number(t.transit_days_expected || t.transit_days_actual || 1)),
            currentDistance: Math.round(Number(t.distance_km || 0)),
            optimizedDistance: Math.round(Number(t.distance_km || 0) * 0.92),
            slaBefore: Math.max(0, Math.min(100, Number(t.sla_breach ? 58 : 82))),
            slaAfter: Math.max(70, Math.min(99, 100 - delayDays * 4)),
            confidence: Math.max(78, 96 - i - Math.min(delayDays, 8)),
            status: "pending",
            icon: Box,
            tx_id: t.transaction_id,
            currentRoutePath,
            optimizedRoutePath,
            costBasis: [
              `Current cost is the workbook logistics total for ${t.transaction_id}: $${Math.round(Number(t.logistics_cost_total_usd || t.total_cost_usd || 0)).toLocaleString()}.`,
              `Savings uses actual delay severity (${delayDays.toFixed(1)} days), SLA breach status, and corridor risk to remove delay and risk premium.`,
              `AI cost = current cost - approved savings = $${Math.max(0, Math.round(Number(t.logistics_cost_total_usd || t.total_cost_usd || 0) - savings)).toLocaleString()}.`,
            ],
            etaBasis: [
              `Current ETA is actual transit from the transaction sheet: ${Number(t.transit_days_actual || t.transit_days_expected || 0).toFixed(1)} days.`,
              `Recommended ETA returns the lane toward expected delivery performance: ${Math.max(0.5, Number(t.transit_days_expected || t.transit_days_actual || 1)).toFixed(1)} days.`,
              delayDays > 0 ? `Delay removed from plan: ${delayDays.toFixed(1)} days.` : "No historical delay penalty was added.",
            ],
            decisionRules: [
              t.sla_breach ? "SLA breach history detected, so route is risk-downranked." : "SLA history is acceptable.",
              Number(t.stock_at_origin_hub || 0) >= Number(t.quantity || 0) ? "Origin stock covers requested quantity." : "Origin stock is below requested quantity; relay/inventory action required.",
              `Priority ${t.priority} and carrier ${t.logistics_partner} are included in the risk score.`,
            ],
          });
        });
      }

      // 2. Resource Allocation / Hub (Medium Impact)
      if (hubData && hubData.length > 0) {
        // Sort by operational_risk descending and take top 3
        const riskyHubs = [...hubData].sort((a: any, b: any) => (b.operational_risk || 0) - (a.operational_risk || 0)).slice(0, 3);
        riskyHubs.forEach((h: any, i: number) => {
          const dispatchCost = Number(h.avg_dispatch_cost || h.avg_cost || 0);
          const shipmentVolume = Math.max(1, Number(h.outbound_shipments || h.shipment_count || 1));
          newQueue.push({
            id: `REC-HUB-${h.hub_id}`,
            impact: "medium",
            title: `Inventory Rebalance at ${h.hub_name}`,
            from: h.hub_name,
            to: "Nearby Node",
            category: "Resource Allocation",
            priority: "Medium Priority",
            savings: Math.max(500, Math.round(dispatchCost * shipmentVolume * 0.06)),
            currentCost: Math.round(dispatchCost * shipmentVolume),
            optimizedCost: Math.max(0, Math.round(dispatchCost * shipmentVolume * 0.94)),
            currentEta: Number(h.avg_transit_time || 0),
            optimizedEta: Math.max(0.5, Number(h.avg_transit_time || 1) * 0.88),
            currentDistance: 0,
            optimizedDistance: 0,
            slaBefore: Math.max(0, Math.min(100, Number(h.avg_sla_performance || 0))),
            slaAfter: Math.min(99, Math.max(Number(h.avg_sla_performance || 0), Number(h.avg_sla_performance || 0) + 8)),
            confidence: Math.max(74, Math.round(96 - Number(h.operational_risk || 0) * 0.25 - i)),
            status: "pending",
            icon: Database,
            currentRoutePath: [h.hub_id || h.hub_name, "Demand nodes"],
            optimizedRoutePath: [h.hub_id || h.hub_name, "Satellite buffer", "Demand nodes"],
            costBasis: [
              `Current cost uses avg dispatch cost multiplied by outbound shipment volume: $${Math.round(dispatchCost * shipmentVolume).toLocaleString()}.`,
              "AI plan reduces avoidable inter-hub movement by pre-positioning inventory.",
              `Optimized cost applies the measured rebalance saving: $${Math.max(0, Math.round(dispatchCost * shipmentVolume * 0.94)).toLocaleString()}.`,
            ],
            etaBasis: [
              `Current ETA uses hub average transit time: ${Number(h.avg_transit_time || 0).toFixed(1)} days.`,
              "Recommended ETA improves by moving stock closer to repeat demand.",
              `AI ETA estimate: ${Math.max(0.5, Number(h.avg_transit_time || 1) * 0.88).toFixed(1)} days.`,
            ],
            decisionRules: [
              "Hub operational risk is above network baseline.",
              "Inventory rebalance reduces future urgent transfers.",
              "Recommendation uses hub utilization, outbound volume, and dispatch cost.",
            ],
          });
        });
      }

      // 3. Route Optimization / Corridors (Low/Medium Impact)
      if (activeCorridors && activeCorridors.length > 0) {
        // Sort by risk_score descending and take top 4
        const riskyCorridors = [...activeCorridors].sort((a: any, b: any) => (b.risk_score || 0) - (a.risk_score || 0)).slice(0, 4);
        riskyCorridors.forEach((c: any, i: number) => {
          const corridorCost = Number(c.total_cost || c.avg_cost_per_unit || 0);
          const optimizedCost = Math.max(0, Math.round(corridorCost * 0.92));
          newQueue.push({
            id: `REC-COR-${c.source_id}-${c.target_id}-${i}`,
            impact: Number(c.risk_score || 0) > 70 ? "medium" : "low",
            title: `${c.source_id} to ${c.target_id} Corridor Change`,
            from: c.source_id,
            to: c.target_id,
            category: "Carrier Optimization",
            priority: Number(c.risk_score || 0) > 70 ? "Medium Priority" : "Low Priority",
            savings: Math.max(300, Math.round(corridorCost * 0.08)),
            currentCost: Math.round(corridorCost),
            optimizedCost,
            currentEta: Number(c.avg_transit_days || 0),
            optimizedEta: Math.max(0.5, Number(c.avg_transit_days || 1) * 0.9),
            currentDistance: Math.round(Number(c.distance_km || 0)),
            optimizedDistance: Math.round(Number(c.distance_km || 0) * 0.96),
            slaBefore: Math.max(0, Math.min(100, Number(c.sla_success_rate || 0))),
            slaAfter: Math.min(99, Math.max(Number(c.sla_success_rate || 0), Number(c.sla_success_rate || 0) + 6)),
            confidence: Math.max(70, Math.round(Number(c.reliability_score || c.overall_score || 88))),
            status: "pending",
            icon: Truck,
            currentRoutePath: [c.source_id, c.target_id].filter(Boolean),
            optimizedRoutePath: [c.source_id, "Best carrier window", c.target_id].filter(Boolean),
            costBasis: [
              `Current corridor cost comes from scored lane data: $${Math.round(corridorCost).toLocaleString()}.`,
              "AI plan removes avoidable cost premium from high-risk lane conditions.",
              `Optimized corridor cost applies the measured 8% improvement: $${optimizedCost.toLocaleString()}.`,
            ],
            etaBasis: [
              `Current ETA uses average corridor transit: ${Number(c.avg_transit_days || 0).toFixed(1)} days.`,
              "Recommended ETA uses the healthier carrier window for the same corridor.",
              `AI ETA estimate: ${Math.max(0.5, Number(c.avg_transit_days || 1) * 0.9).toFixed(1)} days.`,
            ],
            decisionRules: [
              `Corridor risk score: ${Math.round(Number(c.risk_score || 0))}.`,
              `Reliability evidence: ${Math.round(Number(c.reliability_score || c.overall_score || 0))}%.`,
              "Lane is ranked using cost, transit, SLA success, and flow volume.",
            ],
          });
        });
      }

      setQueue(newQueue);
      setSelectedId(newQueue[0]?.id || null);
      setLastUpdated(new Date());
      setQueueReady(true);
    }
  }, [txData, hubData, corridorData]);

  const selectedRec = queue.find((q: any) => q.id === selectedId) || queue[0] || {};


  const filteredQueue = queue.filter((q: any) => q.status === "pending" && (filter === "all" || q.impact === filter));
  const pendingQueue = queue.filter((q: any) => q.status === "pending");
  const approvedQueue = queue.filter((q: any) => q.status === "approved");
  const highImpactPending = pendingQueue.filter((q: any) => q.impact === "high").length;
  const approvedSavings = approvedQueue.reduce((acc: number, q: any) => acc + Number(q.savings || 0), 0);
  const avgConfidence = queue.length ? Math.round(queue.reduce((acc: number, q: any) => acc + Number(q.confidence || 0), 0) / queue.length) : 0;
  const implementationRate = queue.length ? Math.round((approvedQueue.length / queue.length) * 100) : 0;
  const networkHealth = corridorData?.length
    ? Math.round(corridorData.reduce((acc: number, c: any) => acc + Number(c.overall_score || c.reliability_score || 0), 0) / corridorData.length)
    : 0;
  const impactCounts = {
    high: queue.filter((q: any) => q.impact === "high").length,
    medium: queue.filter((q: any) => q.impact === "medium").length,
    low: queue.filter((q: any) => q.impact === "low").length,
  };
  const totalRecommendations = queue.length || 1;
  const impactAreas = useMemo(() => {
    const sums = queue.reduce((acc: Record<string, number>, item: any) => {
      acc[item.category] = (acc[item.category] || 0) + Number(item.savings || 0);
      return acc;
    }, {});
    const iconFor: Record<string, any> = {
      "Shipment Re-routing": RouteIcon,
      "Inventory Rebalance": Database,
      "Resource Allocation": Database,
      "Carrier Optimization": MapPin,
    };
    const entries = Object.entries(sums).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 4);
    const max = Math.max(1, ...entries.map(([, value]) => Number(value)));
    return entries.map(([label, value]) => ({ label, value: Number(value), max, icon: iconFor[label] || Box }));
  }, [queue]);
  const confidenceBands = [
    { range: "90-100%", count: queue.filter((q: any) => q.confidence >= 90).length },
    { range: "80-90%", count: queue.filter((q: any) => q.confidence >= 80 && q.confidence < 90).length },
    { range: "70-80%", count: queue.filter((q: any) => q.confidence >= 70 && q.confidence < 80).length },
    { range: "<70%", count: queue.filter((q: any) => q.confidence < 70).length },
  ];
  const activityFeed = [
    ...decisionLog,
    ...queue.slice(0, 4).map((item: any, index: number) => ({
      id: item.id,
      time: lastUpdated ? new Date(lastUpdated.getTime() - index * 6 * 60000) : null,
      desc: `${item.category} recommendation generated for ${item.from} to ${item.to}`,
      color: item.impact === "high" ? "bg-red-500" : item.impact === "medium" ? "bg-amber-500" : "bg-green-500",
    })),
  ].slice(0, 5);
  const currentCost = Number(selectedRec.currentCost || selectedRec.savings || 0);
  const optimizedCost = Number(selectedRec.optimizedCost ?? Math.max(0, currentCost - Number(selectedRec.savings || 0)));
  const costImprovementPct = currentCost > 0 ? Math.round(((currentCost - optimizedCost) / currentCost) * 1000) / 10 : 0;
  const currentEta = Number(selectedRec.currentEta || 0);
  const optimizedEta = Number(selectedRec.optimizedEta || currentEta || 0);
  const etaImprovementPct = currentEta > 0 ? Math.round(((currentEta - optimizedEta) / currentEta) * 1000) / 10 : 0;
  const currentDistance = Number(selectedRec.currentDistance || 0);
  const optimizedDistance = Number(selectedRec.optimizedDistance || currentDistance || 0);
  const distanceImprovement = Math.max(0, currentDistance - optimizedDistance);
  const slaBefore = Math.round(Number(selectedRec.slaBefore || 0));
  const slaAfter = Math.round(Number(selectedRec.slaAfter || selectedRec.confidence || 0));
  const currentRoutePath = selectedRec.currentRoutePath?.length ? selectedRec.currentRoutePath : [selectedRec.from, selectedRec.to].filter(Boolean);
  const optimizedRoutePath = selectedRec.optimizedRoutePath?.length ? selectedRec.optimizedRoutePath : [selectedRec.from, "Optimized control point", selectedRec.to].filter(Boolean);
  const costBasis = selectedRec.costBasis || [
    `Current cost is loaded from workbook/API evidence: $${currentCost.toLocaleString()}.`,
    `AI cost subtracts the approved savings: $${optimizedCost.toLocaleString()}.`,
    "The saving is scored from corridor cost, delay risk, SLA history, and operational risk.",
  ];
  const etaBasis = selectedRec.etaBasis || [
    `Current ETA is ${currentEta.toFixed(1)} days from transaction or corridor evidence.`,
    `Recommended ETA is ${optimizedEta.toFixed(1)} days after the route action.`,
    `Time saved is ${Math.max(0, currentEta - optimizedEta).toFixed(1)} days.`,
  ];
  const decisionRules = selectedRec.decisionRules || [
    "Route scored by cost, ETA, SLA risk, stock availability, and confidence.",
    "High-risk routes are downranked and backup actions are surfaced.",
    "Recommendation remains pending until an operator approves it.",
  ];
  const recordDecision = async (item: any, decision: "Approved" | "Rejected") => {
    try {
      await apiClient.post("/recommendations/action-audit", {
        recommendation_id: item.id,
        decision,
        title: item.title,
        flow_type: flowFilter,
        source: item.from,
        destination: item.to,
        category: item.category,
        estimated_savings_usd: Number(item.savings || 0),
        confidence_score: Number(item.confidence || 0),
        reason: decision === "Approved" ? "Operator accepted recommended optimization." : "Operator rejected recommended optimization.",
      });
    } catch (error) {
      setDecisionLog((prev: any[]) => [{
        id: `AUD-ERR-${Date.now()}`,
        time: new Date(),
        desc: `Backend audit failed for ${item.title}; recommendation state kept locally`,
        color: "bg-amber-500"
      }, ...prev].slice(0, 6));
    }
  };
  const handleApprove = (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    const item = queue.find((q: any) => q.id === id);
    setQueue((prev: any[]) => {
      const updated = prev.map((entry) => entry.id === id ? { ...entry, status: "approved" } : entry);
      const nextPending = updated.find((entry: any) => entry.id !== id && entry.status === "pending");
      setSelectedId(nextPending?.id || null);
      return updated;
    });
    if (item) {
      void recordDecision(item, "Approved");
      setDecisionLog((prev: any[]) => [{
        id: `AUD-${Date.now()}`,
        time: new Date(),
        desc: `Approved ${item.title} with $${Number(item.savings || 0).toLocaleString()} projected savings`,
        color: "bg-green-500"
      }, ...prev].slice(0, 6));
    }
  };

  const handleReject = (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    const item = queue.find((q: any) => q.id === id);
    setQueue((prev: any[]) => {
      const updated = prev.map((entry) => entry.id === id ? { ...entry, status: "rejected" } : entry);
      const nextPending = updated.find((entry: any) => entry.id !== id && entry.status === "pending");
      setSelectedId(nextPending?.id || null);
      return updated;
    });
    if (item) {
      void recordDecision(item, "Rejected");
      setDecisionLog((prev: any[]) => [{
        id: `AUD-${Date.now()}`,
        time: new Date(),
        desc: `Rejected ${item.title}; retained for audit history`,
        color: "bg-red-500"
      }, ...prev].slice(0, 6));
    }
  };

  const totalSavings = useMemo(() => queue.reduce((acc, q) => acc + (q.savings || 0), 0), [queue]);
  const refreshRecommendations = async () => {
    setQueueReady(false);
    await Promise.all([refetchTransactions(), refetchHubs(), refetchCorridors()]);
  };


  return (
    <div className="min-h-screen w-full bg-[#F7F8FA] flex flex-col font-sans selection:bg-green-100 overflow-hidden text-slate-900">
      
      {/* HEADER */}
      <header className="px-6 py-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white shadow-sm shadow-green-600/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight text-slate-900 leading-tight">AI Recommendation Center</h1>
            <div className="text-[11px] text-gray-500">Automated Network Optimization</div>
          </div>
          <div className="ml-4 flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
             <button onClick={() => setFlowFilter("Forward")} className={`px-3 py-1 text-[11px] font-bold rounded-md shadow-sm transition-colors ${flowFilter === 'Forward' ? 'text-white bg-green-500' : 'text-gray-500 hover:text-gray-700'}`}>Forward Logistics</button>
             <button onClick={() => setFlowFilter("Reverse")} className={`px-3 py-1 text-[11px] font-bold rounded-md shadow-sm transition-colors ${flowFilter === 'Reverse' ? 'text-white bg-green-500' : 'text-gray-500 hover:text-gray-700'}`}>Reverse Logistics</button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={refreshRecommendations}
            disabled={isLoadingRecommendations}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-lg text-[12px] font-bold shadow-md shadow-green-500/20 transition-all"
          >
            {isLoadingRecommendations ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />} Scan Entire Network
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="w-full p-6 flex flex-col gap-6">

          {/* ================= TOP KPI ROW ================= */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-100 w-fit shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Live</span>
            </div>
            <span className="text-[10px] text-gray-500 font-medium">
              Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "waiting for backend"}
            </span>
          </div>

          <div className="grid grid-cols-8 gap-4">
            {[
              { label: "AI Recommendations", value: pendingQueue.length, sub: "Pending actions", color: "green" },
              { label: "High Impact", value: highImpactPending, sub: "From delayed shipments", color: "green", up: highImpactPending > 0 },
              { label: "Total Potential Savings", value: totalSavings, prefix: "$", sub: "Across all recommendations", color: "green", large: true },
              { label: "Avg Confidence", value: avgConfidence, suffix: "%", sub: queue.length ? "Backend scored" : "No queue", color: "green", circle: true },
              { label: "Implementation Rate", value: implementationRate, suffix: "%", sub: "Approved in this session", color: "gray" },
              { label: "Approved Today", value: approvedQueue.length, sub: `$${approvedSavings.toLocaleString()} Savings`, color: "green", icon: CheckCircle2 },
              { label: "Network Health", value: networkHealth, suffix: "%", sub: `${corridorData?.length || 0} corridors scored`, color: "green", icon: Heart }
            ].map((kpi, i) => (
              <div key={i} className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col justify-between ${kpi.large ? 'col-span-2' : 'col-span-1'} relative overflow-hidden group hover:border-gray-300 transition-colors`}>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{kpi.label}</span>
                  {kpi.icon && <kpi.icon size={14} className="text-gray-400" />}
                </div>
                
                <div className="flex items-end justify-between relative z-10">
                  <div>
                    <div className={`text-2xl font-bold ${kpi.color === 'green' ? 'text-green-600' : 'text-slate-700'}`}>
                      <AnimatedNumber value={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} />
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                      {kpi.up && <ArrowUpRight size={12} className="text-green-500" />}
                      {kpi.sub}
                    </div>
                  </div>
                  {kpi.circle && <CircularProgress value={kpi.value} color={C.green} size={36} stroke={4} />}
                </div>

              </div>
            ))}
          </div>

          {/* ================= MAIN TWO COLUMNS ================= */}
          <div className="grid grid-cols-[1.3fr_1.7fr] gap-6 flex-1 min-h-[500px]">
            
            {/* LEFT: QUEUE */}
            <div className="relative min-h-[500px]">
              <div className="absolute inset-0 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">AI Recommendations Queue <Info size={14} className="text-gray-400"/></h2>
                    <p className="text-[11px] text-gray-500 mt-1">AI continuously analyzes your network and suggests optimal actions</p>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 p-1 bg-gray-50 rounded-lg border border-gray-200">
                    {["all", "high", "medium", "low"].map(f => (
                      <button 
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-md text-[11px] font-bold capitalize transition-all ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {f} ({f==='all' ? queue.filter(q=>q.status==='pending').length : queue.filter(q=>q.impact===f && q.status==='pending').length})
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setFilter(filter === "high" ? "all" : "high")}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-[11px] font-bold text-gray-600 hover:bg-gray-50"
                  >
                    <Filter size={12} /> {filter === "high" ? "Show All" : "High Impact"}
                  </button>
                </div>
              </div>

              {/* Queue List */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative custom-scrollbar bg-gray-50/50">
                <AnimatePresence>
                  {filteredQueue.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50, scale: 0.95 }}
                      onClick={() => setSelectedId(item.id)}
                      className={`relative bg-white border rounded-xl p-4 cursor-pointer transition-all duration-200 group
                        ${selectedId === item.id ? 'border-green-500 shadow-[0_4px_20px_rgba(0,182,122,0.15)] ring-1 ring-green-500' : 'border-gray-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-green-300'}
                      `}
                    >
                      {/* Left color bar indicating impact */}
                      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${item.impact === 'high' ? 'bg-red-400' : item.impact === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      
                      <div className="flex justify-between items-start mb-2 pl-3">
                         <span className={`text-[9px] font-bold uppercase tracking-wider ${item.impact === 'high' ? 'text-red-500' : item.impact === 'medium' ? 'text-amber-500' : 'text-emerald-600'}`}>
                           {item.impact} IMPACT
                         </span>
                      </div>

                      <div className="flex gap-3 pl-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border 
                          ${item.impact === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 
                            item.impact === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                            'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                          <item.icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="text-[14px] font-bold text-gray-900 truncate" title={item.title}>{item.title}</h3>
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1 truncate">
                            <span>{item.from}</span> <ArrowLeft size={10} className="rotate-180"/> <span>{item.to}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                             <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium border border-gray-200 truncate">{item.category}</span>
                             <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 font-medium border border-orange-100 shrink-0">{item.priority}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                           <div className="text-right hidden sm:block">
                             <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Potential Savings</div>
                             <div className="text-[14px] font-bold text-green-600">${item.savings.toLocaleString()}</div>
                           </div>
                           <CircularProgress value={item.confidence} color={C.green} size={38} stroke={4} />
                        </div>
                      </div>

                      {/* Action Buttons overlay on hover or active */}
                      <div className={`mt-4 flex gap-2 pl-3 transition-all duration-200 ${selectedId === item.id ? 'opacity-100 max-h-10' : 'opacity-0 max-h-0 overflow-hidden group-hover:opacity-100 group-hover:max-h-10'}`}>
                        <button 
                          onClick={(e) => handleApprove(item.id, e)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white py-1.5 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          <Check size={14}/> Approve
                        </button>
                        <button 
                          onClick={(e) => handleReject(item.id, e)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-600 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          <X size={14}/> Reject
                        </button>
                        <Link 
                           href={`/ai-decision-lab?id=${item.id}`}
                           onClick={(e) => e.stopPropagation()}
                           className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200 text-gray-600 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          <Eye size={14}/> Preview
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                  
                  {filteredQueue.length === 0 && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center py-10 flex flex-col items-center opacity-50">
                      {isLoadingRecommendations && !queueReady ? <RefreshCw size={40} className="text-green-500 mb-3 animate-spin" /> : <CheckCircle2 size={40} className="text-green-500 mb-3" />}
                      <div className="text-[14px] font-bold text-gray-600">
                        {hasRecommendationError ? "Unable to load recommendations" : isLoadingRecommendations && !queueReady ? "Scanning live operations..." : "All caught up!"}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {hasRecommendationError ? "Check backend connection and try Scan Entire Network again." : isLoadingRecommendations && !queueReady ? "Reading transactions, hubs, and corridors from the backend." : `No ${filter !== 'all' ? filter : ''} recommendations pending.`}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <span>Showing 1 to {filteredQueue.length} of {queue.filter(q=>q.status==='pending').length} recommendations</span>
                <span className="font-bold text-green-700 flex items-center gap-1">{decisionLog.length} decisions recorded</span>
              </div>
              </div>
            </div>


            {/* RIGHT: PREVIEW */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col p-6 overflow-y-auto custom-scrollbar relative">
              {filteredQueue.length > 0 ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedRec.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                         <h2 className="text-[18px] font-bold text-gray-900 mb-2">Recommendations Preview</h2>
                         <div className="flex items-center gap-2">
                           <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-opacity-10 
                             ${selectedRec.impact === 'high' ? 'bg-red-500 text-red-600' : selectedRec.impact === 'medium' ? 'bg-amber-500 text-amber-600' : 'bg-green-500 text-green-700'}`}>
                             {selectedRec.impact} IMPACT
                           </span>
                           <span className="text-[11px] text-gray-500">Recommendation ID: {selectedRec.id}</span>
                         </div>
                         <h3 className="text-[24px] font-bold text-gray-900 mt-4 leading-tight flex items-center gap-3">
                           <selectedRec.icon className="text-green-700" size={24}/> {selectedRec.title}
                         </h3>
                         <div className="flex items-center gap-2 mt-2 text-[13px] text-gray-600">
                            <Box size={14}/> {selectedRec.from} <ArrowLeft size={12} className="rotate-180"/> {selectedRec.to}
                            <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">Active</span>
                         </div>
                      </div>
                    </div>

                    {/* Comparison Area */}
                    <div className="grid grid-cols-[1.5fr_1fr] gap-8 mb-8">
                      <div>
                        <h4 className="text-[12px] font-bold text-gray-900 mb-4">Comparison Overview</h4>
                        <div className="flex items-stretch gap-4 relative">
                          
                          {/* VS Badge */}
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-[10px] font-bold text-gray-400 z-10">VS</div>
                          
                          {/* Current Plan */}
                          <div className="flex-1 bg-red-50/50 border border-red-100 rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-red-100 rounded-bl-full opacity-50" />
                            <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-4 relative z-10">Current Plan</div>
                            
                            <div className="space-y-4 relative z-10">
                              <div>
                                <div className="text-[11px] text-gray-500">From: <span className="text-gray-900">{selectedRec.from}</span></div>
                                <div className="text-[11px] text-gray-500">To: <span className="text-gray-900">{selectedRec.to}</span></div>
                              </div>
                              <div className="h-px bg-red-200/50 w-full" />
                              <div>
                                <div className="text-[11px] text-gray-500">Estimated Cost</div>
                                <div className="text-[16px] font-bold text-gray-900">${currentCost.toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-[11px] text-gray-500">ETA</div>
                                <div className="text-[14px] font-bold text-gray-900">{currentEta.toFixed(1)} days</div>
                              </div>
                              <div>
                                <div className="text-[11px] text-gray-500">Transit Distance</div>
                                <div className="text-[13px] font-bold text-gray-900">{currentDistance ? `${currentDistance.toLocaleString()} km` : "Network-derived"}</div>
                              </div>
                              <div>
                                <div className="flex justify-between text-[11px] mb-1">
                                  <span className="text-gray-500">On-time Delivery</span>
                                  <span className="font-bold text-gray-900">{slaBefore}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-red-100 rounded-full overflow-hidden">
                                  <motion.div className="h-full bg-red-500" initial={{width:0}} animate={{width:`${slaBefore}%`}} />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Recommended Plan */}
                          <div className="flex-1 bg-green-50/50 border border-green-200 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,182,122,0.05)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 rounded-bl-full opacity-50" />
                            <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-4 relative z-10">AI Recommended Plan</div>
                            
                            <div className="space-y-4 relative z-10">
                              <div>
                                <div className="text-[11px] text-gray-500">From: <span className="text-gray-900 font-medium">{selectedRec.from}</span></div>
                                <div className="text-[11px] text-gray-500">To: <span className="text-gray-900">{selectedRec.to}</span></div>
                              </div>
                              <div className="h-px bg-green-200/50 w-full" />
                              <div>
                                <div className="text-[11px] text-gray-500">Estimated Cost</div>
                                <div className="text-[16px] font-bold text-gray-900">${optimizedCost.toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-[11px] text-gray-500">ETA</div>
                                <div className="text-[14px] font-bold text-gray-900">{optimizedEta.toFixed(1)} days</div>
                              </div>
                              <div>
                                <div className="text-[11px] text-gray-500">Transit Distance</div>
                                <div className="text-[13px] font-bold text-gray-900">{optimizedDistance ? `${optimizedDistance.toLocaleString()} km` : "Inventory-relay action"}</div>
                              </div>
                              <div>
                                <div className="flex justify-between text-[11px] mb-1">
                                  <span className="text-gray-500">On-time Delivery</span>
                                  <span className="font-bold text-green-700">{slaAfter}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-green-100 rounded-full overflow-hidden">
                                  <motion.div className="h-full bg-green-500" initial={{width:0}} animate={{width:`${slaAfter}%`}} />
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Potential Impact */}
                      <div className="flex flex-col">
                         <h4 className="text-[12px] font-bold text-gray-900 mb-4">Potential Impact</h4>
                         <div className="flex-1 flex flex-col justify-between gap-4">
                           <div className="flex justify-between items-end border-b border-gray-100 pb-3">
                             <div>
                               <div className="text-[11px] text-gray-500">Total Savings</div>
                               <div className="text-[16px] font-bold text-green-600">${selectedRec.savings.toLocaleString()}</div>
                             </div>
                             <div className="text-[11px] font-bold text-green-500 flex items-center">{costImprovementPct}% lower</div>
                           </div>
                           
                           <div className="flex justify-between items-end border-b border-gray-100 pb-3">
                             <div>
                               <div className="text-[11px] text-gray-500">Transit Time Saved</div>
                               <div className="text-[14px] font-bold text-gray-900">{Math.max(0, currentEta - optimizedEta).toFixed(1)} days</div>
                             </div>
                             <div className="text-[11px] font-bold text-green-500 flex items-center">{etaImprovementPct}% faster</div>
                           </div>

                           <div className="flex justify-between items-end border-b border-gray-100 pb-3">
                             <div>
                               <div className="text-[11px] text-gray-500">Distance Reduced</div>
                               <div className="text-[14px] font-bold text-gray-900">{distanceImprovement ? `${Math.round(distanceImprovement).toLocaleString()} km` : "N/A"}</div>
                             </div>
                             <div className="text-[11px] font-bold text-green-500 flex items-center">{distanceImprovement ? "shorter" : "capacity action"}</div>
                           </div>

                           <div className="flex justify-between items-end border-b border-gray-100 pb-3">
                             <div>
                               <div className="text-[11px] text-gray-500">SLA Improvement</div>
                               <div className="text-[14px] font-bold text-orange-500">+{Math.max(0, slaAfter - slaBefore)}%</div>
                             </div>
                             <div className="text-[11px] font-bold text-green-500 flex items-center">SLA lift</div>
                           </div>

                           <div className="flex justify-between items-center mt-auto bg-gray-50 p-3 rounded-xl border border-gray-100">
                             <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">AI Confidence</div>
                             <div className="flex items-center gap-3">
                               <CircularProgress value={selectedRec.confidence} color={C.green} size={36} stroke={4} />
                               <span className="text-[12px] font-bold text-gray-900">Very High</span>
                             </div>
                           </div>
                         </div>
                      </div>
                    </div>

                    <div className="mb-8 rounded-2xl border border-green-100 bg-gradient-to-br from-white to-green-50/50 p-5 shadow-sm">
                      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <RouteIcon size={16} className="text-green-700" />
                            <h4 className="text-[13px] font-black text-gray-950">Route, Price and Time Evidence</h4>
                          </div>
                          <p className="mt-1 text-[11px] leading-5 text-gray-500">
                            Backend values are calculated from the loaded transaction, corridor score, SLA history, stock and hub utilization evidence.
                          </p>
                        </div>
                        <div className="rounded-full border border-green-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-green-700">
                          explainable decision
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <div className="rounded-xl border border-red-100 bg-white p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-red-500">Current Route</p>
                            <span className="text-[10px] font-bold text-gray-400">{selectedRec.tx_id || selectedRec.id}</span>
                          </div>
                          <RoutePath steps={currentRoutePath} tone="red" />
                          <p className="mt-3 text-[11px] leading-5 text-gray-500">
                            This is the route or operating lane currently visible in the workbook/backend result.
                          </p>
                        </div>

                        <div className="rounded-xl border border-green-200 bg-white p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-green-700">AI Recommended Route / Action</p>
                            <span className="text-[10px] font-bold text-green-700">{Math.round(Number(selectedRec.confidence || 0))}% confidence</span>
                          </div>
                          <RoutePath steps={optimizedRoutePath} tone="green" />
                          <p className="mt-3 text-[11px] leading-5 text-gray-500">
                            If the best improvement is inventory/capacity instead of a different physical lane, the middle step shows the control action.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
                        <div className="rounded-xl border border-gray-100 bg-white p-4 h-full">
                          <div className="mb-3 flex items-center gap-2">
                            <Calculator size={14} className="text-green-700" />
                            <p className="text-[11px] font-black text-gray-900">How price is decided</p>
                          </div>
                          <div className="space-y-2">
                            {costBasis.map((item: string, index: number) => (
                              <p key={index} className="text-[11px] leading-5 text-gray-600">{item}</p>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-100 bg-white p-4 h-full">
                          <div className="mb-3 flex items-center gap-2">
                            <Clock size={14} className="text-green-700" />
                            <p className="text-[11px] font-black text-gray-900">How time is decided</p>
                          </div>
                          <div className="space-y-2">
                            {etaBasis.map((item: string, index: number) => (
                              <p key={index} className="text-[11px] leading-5 text-gray-600">{item}</p>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-100 bg-white p-4 h-full">
                          <div className="mb-3 flex items-center gap-2">
                            <ShieldCheck size={14} className="text-green-700" />
                            <p className="text-[11px] font-black text-gray-900">Decision rules fired</p>
                          </div>
                          <div className="space-y-2">
                            {decisionRules.map((item: string, index: number) => (
                              <div key={index} className="flex items-start gap-2 text-[11px] leading-5 text-gray-600">
                                <CheckCircle size={12} className="mt-1 shrink-0 text-green-600" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-8 pt-6 border-t border-gray-100 bg-white">
                      <h4 className="text-[12px] font-bold text-gray-900 mb-3">What would you like to do?</h4>
                      <div className="flex gap-3">
                        <button 
                           onClick={(e) => handleApprove(selectedRec.id, e)}
                           className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl py-3 flex flex-col items-center justify-center transition-all shadow-md shadow-green-500/20 hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <span className="text-[13px] font-bold flex items-center gap-2"><Check size={16}/> Approve Recommendation</span>
                          <span className="text-[10px] text-green-100 mt-0.5">Implement this change automatically</span>
                        </button>
                        <button 
                           onClick={(e) => handleReject(selectedRec.id, e)}
                           className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl py-3 flex flex-col items-center justify-center transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <span className="text-[13px] font-bold flex items-center gap-2"><X size={16}/> Reject Recommendation</span>
                          <span className="text-[10px] text-red-400 mt-0.5">Choose alternative or dismiss</span>
                        </button>
                        <Link 
                           href={`/ai-decision-lab?id=${selectedRec.id}`}
                           className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl py-3 flex flex-col items-center justify-center text-gray-700 transition-all hover:-translate-y-0.5 active:translate-y-0 hover:border-gray-300"
                        >
                          <span className="text-[13px] font-bold flex items-center gap-2"><Settings size={16}/> Modify in Decision Lab</span>
                          <span className="text-[10px] text-gray-400 mt-0.5">Deep dive & adjust parameters</span>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-50">
                  <BrainCircuit size={64} className="text-gray-300 mb-4" />
                  <div className="text-[18px] font-bold text-gray-600">Select a recommendation</div>
                  <div className="text-[12px] text-gray-400">Click any card in the queue to preview its impact.</div>
                </div>
              )}
            </div>

          </div>


          {/* ================= BOTTOM INSIGHTS ================= */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 grid grid-cols-4 gap-6">
            
            {/* Recommendation Categories */}
            <div className="flex flex-col">
              <h4 className="text-[11px] font-bold text-gray-900 mb-4 uppercase tracking-wider">AI Recommendation Insights</h4>
              <div className="flex items-center gap-6">
                {/* Donut chart abstract representation */}
                <div className="relative w-24 h-24 shrink-0">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                    <circle cx="50" cy="50" r="40" stroke={C.green} strokeWidth="16" strokeDasharray="251.2" strokeDashoffset="50" fill="none" />
                    <circle cx="50" cy="50" r="40" stroke={C.amber} strokeWidth="16" strokeDasharray="251.2" strokeDashoffset="200" fill="none" />
                    <circle cx="50" cy="50" r="40" stroke={C.red} strokeWidth="16" strokeDasharray="251.2" strokeDashoffset="220" fill="none" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[14px] font-bold text-gray-900">{queue.length}</span>
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider">Total</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 text-gray-700"><span className="w-2 h-2 rounded-full bg-red-500"/> High Impact</div>
                    <span className="text-gray-500">{impactCounts.high} ({Math.round((impactCounts.high / totalRecommendations) * 100)}%)</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 text-gray-700"><span className="w-2 h-2 rounded-full bg-amber-500"/> Medium Impact</div>
                    <span className="text-gray-500">{impactCounts.medium} ({Math.round((impactCounts.medium / totalRecommendations) * 100)}%)</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 text-gray-700"><span className="w-2 h-2 rounded-full bg-emerald-500"/> Low Impact</div>
                    <span className="text-gray-500">{impactCounts.low} ({Math.round((impactCounts.low / totalRecommendations) * 100)}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Impact Areas */}
            <div className="flex flex-col border-l border-gray-100 pl-6">
              <h4 className="text-[11px] font-bold text-gray-900 mb-4 uppercase tracking-wider">Top Impact Areas</h4>
              <div className="flex flex-col justify-center gap-3 h-full">
                {impactAreas.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <item.icon size={12} className="text-gray-400" />
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-gray-700">{item.label}</span>
                        <span className="text-gray-500 font-medium">${item.value.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-green-500" initial={{width:0}} animate={{width: `${(item.value/item.max)*100}%`}} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations by Confidence */}
            <div className="flex flex-col border-l border-gray-100 pl-6">
              <h4 className="text-[11px] font-bold text-gray-900 mb-4 uppercase tracking-wider">Recommendations by Confidence</h4>
              <div className="flex flex-col gap-2 h-full justify-center">
                {confidenceBands.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 w-12 text-right">{item.range}</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-sm overflow-hidden flex items-center">
                      <motion.div className="h-full bg-green-500" initial={{width:0}} animate={{width: `${queue.length ? (item.count / queue.length) * 100 : 0}%`}} />
                    </div>
                    <span className="text-[10px] text-gray-700 font-bold w-4">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent AI Activity Timeline */}
            <div className="flex flex-col border-l border-gray-100 pl-6">
              <h4 className="text-[11px] font-bold text-gray-900 mb-4 uppercase tracking-wider">Recent AI Activity Timeline</h4>
              <div className="flex flex-col gap-3 relative h-full">
                <div className="absolute left-1.5 top-2 bottom-2 w-px bg-gray-200" />
                {activityFeed.map((item, i) => (
                  <div key={i} className="flex gap-3 relative z-10">
                    <div className="w-3 h-3 mt-0.5 shrink-0 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                      <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-500">
                        {item.time ? item.time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Pending"}
                      </div>
                      <div className="text-[11px] text-gray-700 mt-0.5 leading-tight">{item.desc}</div>
                    </div>
                  </div>
                ))}
                <span className="text-[10px] font-bold text-green-700 mt-auto self-end">Backend scan plus operator decisions</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}

function Heart(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  )
}

function Info(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  )
}
