"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart2,
  CheckCircle2,
  Download,
  Filter,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useGetDemandPositioning } from "@/services/queries";
import type { ExecutiveRecommendation, OpportunityCard, OptimizationMetric } from "@/types";

type FlowFilter = "" | "Forward" | "Reverse" | "Part Buy";
type WorkspaceTab = "Waste Leakage" | "Cost Breakdown" | "Suboptimal Routing" | "Stock Suggestions";

const flowOptions: { label: string; value: FlowFilter }[] = [
  { label: "All Flows", value: "" },
  { label: "Forward", value: "Forward" },
  { label: "Reverse", value: "Reverse" },
  { label: "Part Buy", value: "Part Buy" },
];

const formatUsd = (value?: number) =>
  `$${Math.round(value || 0).toLocaleString()}`;

const formatPct = (value?: number) =>
  `${Number(value || 0).toFixed(1)}%`;

const severityStyle: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-100",
  High: "bg-orange-50 text-orange-700 border-orange-100",
  Medium: "bg-amber-50 text-amber-700 border-amber-100",
  Low: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

function pickMetric(metrics: OptimizationMetric[], index: number) {
  return metrics[index] || metrics[0];
}

export default function DemandPositioningCenter() {
  const [flowType, setFlowType] = useState<FlowFilter>("");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("Waste Leakage");
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const filters = useMemo(() => ({ flow_type: flowType || undefined }), [flowType]);

  const dpQuery = useGetDemandPositioning(filters);

  const isLoading = dpQuery.isLoading;
  const isFetching = dpQuery.isFetching;
  const hasError = dpQuery.isError;
  const lastUpdated = dpQuery.dataUpdatedAt;

  const allMetrics = dpQuery.data?.metrics || [];
  const allOpportunities = dpQuery.data?.opportunities || [];
  const allRecommendations = dpQuery.data?.recommendations || [];
  const wasteCostByCity = dpQuery.data?.waste_cost_by_city || {};

  const selectedOpportunity = allOpportunities.find((item) => item.id === selectedOpportunityId) || allOpportunities[0] || null;
  const totalCurrent = allMetrics.reduce((sum, metric) => sum + metric.current_value, 0);
  const totalOptimized = allMetrics.reduce((sum, metric) => sum + metric.optimized_value, 0);
  const totalSavings = allMetrics.reduce((sum, metric) => sum + metric.savings_value, 0);
  const avgImprovement = allMetrics.length ? allMetrics.reduce((sum, metric) => sum + metric.improvement_pct, 0) / allMetrics.length : 0;
  
  const maxCityWaste = Math.max(...Object.values(wasteCostByCity), 1);

  const refreshAll = () => {
    dpQuery.refetch();
  };

  const exportCsv = () => {
    const headers = ["id", "type", "severity", "cost_saving", "description"];
    const rows = allOpportunities.map((item) =>
      [item.id, item.type, item.severity, Math.round(item.cost_saving), `"${item.description.replaceAll('"', '""')}"`].join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "demand-positioning-opportunities.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] font-sans text-slate-800 flex flex-col pb-10">
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-white border-b border-slate-200">
        <div>
          <h1 className="text-xl font-black text-[#0F2922] flex items-center gap-2">
            Predictive Demand Positioning
            <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full border border-[#10B981]/20 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Backend Scored
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Analyze historical cross-city stockouts and optimize local inventory placement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm">
            <Filter className="h-4 w-4 text-slate-400" />
            <select value={flowType} onChange={(event) => setFlowType(event.target.value as FlowFilter)} className="bg-transparent text-sm font-bold outline-none">
              {flowOptions.map((option) => (
                <option key={option.label} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <button onClick={refreshAll} disabled={isFetching} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={exportCsv} disabled={!allOpportunities.length} className="flex items-center gap-2 rounded-lg bg-[#007A5E] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#00664d] disabled:bg-slate-300">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-6">
        {hasError && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> The demand positioning API is unavailable.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          {[
            { label: "Waste Current Cost", value: formatUsd(totalCurrent), sub: `${allMetrics.length} backend metrics`, icon: DollarSignCard },
            { label: "Potential Savings", value: formatUsd(totalSavings), sub: `${allOpportunities.length} opportunities`, icon: Activity },
            { label: "Average Improvement", value: formatPct(avgImprovement), sub: `from backend actions`, icon: ShieldCheck },
            { label: "Recommendations", value: `${allRecommendations.length}`, sub: "ready to inject", icon: CheckCircle2 },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-bold text-slate-500">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#10B981]/10 text-[#10B981]">
                  <kpi.icon className="h-3.5 w-3.5" />
                </div>
                {kpi.label}
              </div>
              <div className="text-2xl font-black text-slate-900">{isLoading ? "--" : kpi.value}</div>
              <div className="mt-2 text-[10px] font-bold text-slate-500">{isLoading ? "Loading backend data" : kpi.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">Demand Optimization Opportunities</h2>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">Stock injections ranked by cross-city SLA breaches and freight waste.</p>
              </div>
              <div className="text-[10px] font-bold text-slate-400">
                Updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "waiting"}
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="border-b border-slate-100 text-[10px] font-bold text-slate-400">
                  <tr>
                    <th className="pb-3">Opportunity</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Severity</th>
                    <th className="pb-3">Savings</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] font-bold text-slate-700">
                  {allOpportunities.map((item) => {
                    const selected = selectedOpportunity?.id === item.id;
                    return (
                      <tr key={item.id} onClick={() => setSelectedOpportunityId(item.id)} className={`cursor-pointer border-b border-slate-50 transition-colors ${selected ? "bg-emerald-50/70" : "hover:bg-slate-50"}`}>
                        <td className="py-4 pr-4">
                          <div className="font-black text-slate-900">{item.id}</div>
                          <div className="mt-1 max-w-[560px] text-[10px] font-semibold leading-4 text-slate-500">{item.description}</div>
                        </td>
                        <td className="py-4">{item.type}</td>
                        <td className="py-4">
                          <span className={`rounded-full border px-2 py-1 text-[9px] font-black ${severityStyle[item.severity] || "bg-slate-50 text-slate-600 border-slate-100"}`}>{item.severity}</span>
                        </td>
                        <td className="py-4 text-[#10B981]">{formatUsd(item.cost_saving)}</td>
                        <td className="py-4">
                          <button onClick={(event) => { event.stopPropagation(); setSelectedOpportunityId(item.id); }} className="rounded-md border border-emerald-200 px-3 py-1.5 text-[10px] font-black text-emerald-700 hover:bg-emerald-50">
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {!isLoading && allOpportunities.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm font-bold text-slate-400">No cross-city stockouts detected by the backend.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-slate-900">Selected Action</h2>
            {selectedOpportunity ? (
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{selectedOpportunity.type}</div>
                  <div className="mt-1 text-lg font-black text-slate-900">{selectedOpportunity.id}</div>
                </div>
                <p className="text-sm font-semibold leading-6 text-slate-600">{selectedOpportunity.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <MetricTile label="Waste Prevention" value={formatUsd(selectedOpportunity.cost_saving)} />
                  <MetricTile label="Severity" value={selectedOpportunity.severity} />
                </div>
              </div>
            ) : (
              <div className="mt-10 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-400">
                Select an opportunity to inspect its details.
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-black text-slate-900">AI Deep Dive</h2>
              <p className="text-[10px] font-semibold text-slate-500">Analyze the raw data grouped by destination.</p>
            </div>

            <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
              {(["Waste Leakage", "Stock Suggestions"] as WorkspaceTab[]).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap rounded-lg border px-4 py-2 text-[11px] font-bold transition-colors ${activeTab === tab ? "border-[#10B981] bg-[#10B981]/10 text-[#10B981]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                  {tab}
                </button>
              ))}
            </div>

            <WorkspaceContent
              activeTab={activeTab}
              selectedOpportunity={selectedOpportunity}
              metrics={allMetrics}
              recommendations={allRecommendations}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black text-slate-900">Waste Cost by City</h2>
            <div className="mt-5 space-y-4">
              {Object.entries(wasteCostByCity).map(([label, value]) => (
                <Bar key={label} label={label} value={value as number} max={maxCityWaste} />
              ))}
              {!Object.keys(wasteCostByCity).length && <EmptyState text="No city waste data returned." />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DollarSignCard(props: React.SVGProps<SVGSVGElement>) {
  return <BarChart2 {...props} />;
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 text-base font-black text-slate-900">{value}</div>
    </div>
  );
}

function WorkspaceContent({
  activeTab,
  selectedOpportunity,
  metrics,
  recommendations,
}: {
  activeTab: WorkspaceTab;
  selectedOpportunity: OpportunityCard | null;
  metrics: OptimizationMetric[];
  recommendations: ExecutiveRecommendation[];
}) {
  if (activeTab === "Waste Leakage") {
    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        {selectedOpportunity ? (
          <>
            <h3 className="text-sm font-black text-slate-800">{selectedOpportunity.type}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{selectedOpportunity.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MetricTile label="Backend ID" value={selectedOpportunity.id} />
              <MetricTile label="Savings" value={formatUsd(selectedOpportunity.cost_saving)} />
            </div>
          </>
        ) : <EmptyState text="No selected opportunity." />}
      </div>
    );
  }

  if (activeTab === "Stock Suggestions") {
    return (
      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div key={rec.id} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-black text-slate-900">{rec.title}</div>
                <div className="mt-1 text-[11px] font-bold text-emerald-700">{rec.category} / {formatUsd(rec.expected_savings)} expected savings</div>
              </div>
              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-emerald-700">{formatPct(rec.confidence_score)} confidence</span>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{rec.business_reason || rec.impact_summary}</p>
          </div>
        ))}
        {!recommendations.length && <EmptyState text="No backend recommendations returned." />}
      </div>
    );
  }

  return null;
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = Math.max(3, Math.min(100, (value / Math.max(max, 1)) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] font-black text-slate-600">
        <span>{label}</span>
        <span>{formatUsd(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[#10B981]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-bold text-slate-400">
      {text}
    </div>
  );
}
