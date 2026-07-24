"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Download,
  RefreshCw,
  Search,
  ShieldAlert,
  Truck,
} from "lucide-react";
import apiClient from "@/services/api-client";
import { useGetNetworkOverview, useGetPredictionSummary, useGetTransactions } from "@/services/queries";
import type { Transaction } from "@/types";

interface ModelEvaluation {
  target?: string;
  source?: string;
  model?: string;
  rows_evaluated?: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
  features?: string[];
}

interface PredictionEvidence {
  prediction_id?: string;
  predicted_sla_breach: boolean;
  delay_probability: number;
  expected_transit_days: number;
  risk_level: string;
  confidence_score: number;
  contributing_factors: Array<{ feature: string; importance: number }>;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

function pct(value?: number) {
  return `${((value || 0) * 100).toFixed(1)}%`;
}

function riskScore(tx: Transaction) {
  const delayDays = Math.max(0, Number(tx.transit_days_actual || 0) - Number(tx.transit_days_expected || 0));
  const priority = String(tx.priority || "");
  const priorityRisk = priority.startsWith("P1") ? 22 : priority.startsWith("P2") ? 14 : priority.startsWith("P3") ? 7 : 3;
  const tamperRisk = tx.tamper_flag === "TAMPER_ALERT" ? 24 : tx.tamper_flag === "RECHECK" ? 12 : 0;
  const breachRisk = tx.sla_breach ? 34 : 0;
  const stockRisk = Number(tx.stock_at_origin_hub || 0) < Number(tx.quantity || 0) * 2 ? 14 : 0;
  return Math.min(96, Math.max(0, breachRisk + priorityRisk + tamperRisk + delayDays * 7 + stockRisk));
}

function riskLevel(score: number) {
  if (score >= 72) return "Critical";
  if (score >= 55) return "High";
  if (score >= 32) return "Medium";
  if (score >= 16) return "Low";
  return "Very Low";
}

function tone(level: string) {
  if (level === "Critical") return "border-red-100 bg-red-50 text-red-700";
  if (level === "High") return "border-orange-100 bg-orange-50 text-orange-700";
  if (level === "Medium") return "border-amber-100 bg-amber-50 text-amber-700";
  return "border-emerald-100 bg-emerald-50 text-emerald-700";
}

export default function PredictionsDashboardPage() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [evaluation, setEvaluation] = useState<ModelEvaluation | null>(null);
  const [evidence, setEvidence] = useState<PredictionEvidence | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  const summaryQuery = useGetPredictionSummary();
  const transactionsQuery = useGetTransactions({ page: 1, limit: 120, sort_by: "dispatch_date", sort_order: "desc" });
  const networkQuery = useGetNetworkOverview({});

  useEffect(() => {
    apiClient
      .get<ModelEvaluation>("/challenge/model-evaluation")
      .then((res) => setEvaluation(res.data))
      .catch(() => setEvaluation(null));
  }, []);

  const transactions = transactionsQuery.data?.items || [];
  const riskyTransactions = useMemo(() => {
    return transactions
      .map((tx: Transaction) => {
        const score = riskScore(tx);
        return {
          tx,
          score,
          level: riskLevel(score),
          route: `${tx.origin_hub_id || tx.source_location || "Unknown"} -> ${tx.intermediate_hub_id || tx.tpr_id || tx.destination_location || "Unknown"}`,
        };
      })
      .filter((item) =>
        item.tx.transaction_id.toLowerCase().includes(search.toLowerCase()) ||
        item.route.toLowerCase().includes(search.toLowerCase()) ||
        String(item.tx.logistics_partner || "").toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => b.score - a.score);
  }, [search, transactions]);

  useEffect(() => {
    if (!selectedId && riskyTransactions.length) setSelectedId(riskyTransactions[0].tx.transaction_id);
  }, [riskyTransactions, selectedId]);

  const selected = riskyTransactions.find((item) => item.tx.transaction_id === selectedId) || riskyTransactions[0] || null;

  useEffect(() => {
    if (!selected) {
      setEvidence(null);
      return;
    }
    let cancelled = false;
    setEvidenceLoading(true);
    apiClient
      .post<PredictionEvidence>("/predictions/predict", {
        origin_hub: selected.tx.origin_hub_id,
        destination_hub: selected.tx.intermediate_hub_id || selected.tx.tpr_id || selected.tx.destination_location,
        priority: selected.tx.priority,
        part_category: (selected.tx as any).part?.category || (selected.tx as any).part_category || "Unknown",
        flow_type: selected.tx.flow_type,
        quantity: selected.tx.quantity,
        shipment_value: selected.tx.total_cost_usd || selected.tx.parts_value_usd || selected.tx.logistics_cost_total_usd || 0,
        logistics_partner: selected.tx.logistics_partner,
      })
      .then((res) => { if (!cancelled) setEvidence(res.data); })
      .catch(() => { if (!cancelled) setEvidence(null); })
      .finally(() => { if (!cancelled) setEvidenceLoading(false); });
    return () => { cancelled = true; };
  }, [selected?.tx.transaction_id]);

  const summary = summaryQuery.data;
  const distribution = summary?.risk_distribution || [];
  const kpis = summary?.kpis || [];
  const criticalCount = distribution.find((item: any) => item.level === "Critical")?.count || 0;
  const highCount = distribution.find((item: any) => item.level === "High")?.count || 0;
  const totalEvaluated = kpis.find((item: any) => item.name === "Transactions Evaluated")?.value || transactionsQuery.data?.total || 0;
  const averageConfidence = kpis.find((item: any) => item.name === "Average Confidence")?.value || "Unavailable";
  const valueAtRisk = riskyTransactions.slice(0, 12).reduce((sum, item) => sum + Number(item.tx.logistics_cost_total_usd || 0), 0);
  const isLoading = summaryQuery.isLoading || transactionsQuery.isLoading;
  const hasError = summaryQuery.isError || transactionsQuery.isError || networkQuery.isError;
  const lastUpdated = Math.max(summaryQuery.dataUpdatedAt || 0, transactionsQuery.dataUpdatedAt || 0, networkQuery.dataUpdatedAt || 0);

  const refresh = () => {
    summaryQuery.refetch();
    transactionsQuery.refetch();
    networkQuery.refetch();
  };

  const exportRisks = () => {
    const headers = ["transaction_id", "route", "risk_score", "risk_level", "carrier", "priority", "logistics_cost"];
    const rows = riskyTransactions.map((item) =>
      [item.tx.transaction_id, item.route, item.score, item.level, item.tx.logistics_partner, item.tx.priority, item.tx.logistics_cost_total_usd]
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "risk-center-shipments.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center bg-slate-50">
        <div className="text-center">
          <ShieldAlert className="mx-auto h-10 w-10 animate-pulse text-emerald-600" />
          <p className="mt-4 text-sm font-black uppercase tracking-widest text-slate-500">Loading backend risk center</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-800">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-8 py-5">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-950">
            Risk Center <ShieldAlert className="h-6 w-6 text-emerald-600" />
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">SLA breach risk from prediction summary, transaction history, and live prediction evidence.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search transaction, route, or carrier"
              className="w-80 rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
          <button onClick={refresh} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={exportRisks} disabled={!riskyTransactions.length} className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:bg-slate-300">
            <Download className="h-4 w-4" /> Export Risks
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] space-y-6 p-8">
        {hasError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            <AlertTriangle className="h-4 w-4" /> One or more risk APIs are unavailable. Loaded sections show backend data only.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <Kpi label="Transactions Evaluated" value={Number(totalEvaluated).toLocaleString()} sub="Prediction summary" icon={Activity} />
          <Kpi label="Critical Risk" value={criticalCount.toLocaleString()} sub="Backend distribution" icon={ShieldAlert} />
          <Kpi label="High Risk" value={highCount.toLocaleString()} sub="Backend distribution" icon={AlertTriangle} />
          <Kpi label="Average Confidence" value={String(averageConfidence)} sub="Prediction summary" icon={BrainCircuit} />
          <Kpi label="Value In Top Risks" value={money(valueAtRisk)} sub="Current visible transactions" icon={Truck} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1.4fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle title="Risk Distribution" subtitle={`Updated ${lastUpdated ? new Date(lastUpdated).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "waiting"}`} />
            <div className="mt-6 space-y-4">
              {distribution.map((item: any) => {
                const total = distribution.reduce((sum: number, row: any) => sum + Number(row.count || 0), 0);
                const width = total ? Math.max(2, (Number(item.count || 0) / total) * 100) : 0;
                return (
                  <div key={item.level}>
                    <div className="mb-1 flex items-center justify-between text-xs font-black text-slate-600">
                      <span>{item.level}</span>
                      <span>{Number(item.count || 0).toLocaleString()}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-600" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <Metric label="Accuracy" value={evaluation?.accuracy ? pct(evaluation.accuracy) : "Unavailable"} />
              <Metric label="Precision" value={evaluation?.precision ? pct(evaluation.precision) : "Unavailable"} />
              <Metric label="Recall" value={evaluation?.recall ? pct(evaluation.recall) : "Unavailable"} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle title="Highest Risk Shipments" subtitle={`${riskyTransactions.length} visible transaction risks`} />
            <div className="mt-4 max-h-[520px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="pb-3">Transaction</th>
                    <th className="pb-3">Route</th>
                    <th className="pb-3">Carrier</th>
                    <th className="pb-3">Risk</th>
                    <th className="pb-3">Cost</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] font-bold text-slate-700">
                  {riskyTransactions.slice(0, 30).map((item) => (
                    <tr key={item.tx.transaction_id} onClick={() => setSelectedId(item.tx.transaction_id)} className={`cursor-pointer border-b border-slate-50 hover:bg-slate-50 ${selected?.tx.transaction_id === item.tx.transaction_id ? "bg-emerald-50/70" : ""}`}>
                      <td className="py-3 pr-3 font-black text-slate-900">{item.tx.transaction_id}</td>
                      <td className="py-3 pr-3">{item.route}</td>
                      <td className="py-3 pr-3">{item.tx.logistics_partner}</td>
                      <td className="py-3 pr-3">
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${tone(item.level)}`}>{item.score}% {item.level}</span>
                      </td>
                      <td className="py-3">{money(Number(item.tx.logistics_cost_total_usd || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!riskyTransactions.length && <EmptyState text="No matching transactions returned." />}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle title="Selected Prediction Evidence" subtitle={selected ? selected.tx.transaction_id : "No shipment selected"} />
            {selected ? (
              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Shipment</div>
                  <div className="mt-1 text-lg font-black text-slate-900">{selected.route}</div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Metric label="Priority" value={selected.tx.priority || "Unavailable"} />
                    <Metric label="Quantity" value={String(selected.tx.quantity || 0)} />
                    <Metric label="Actual Transit" value={`${Number(selected.tx.transit_days_actual || 0).toFixed(1)}d`} />
                    <Metric label="Expected Transit" value={`${Number(selected.tx.transit_days_expected || 0).toFixed(1)}d`} />
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Prediction Service</div>
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${tone(evidence?.risk_level || selected.level)}`}>{evidenceLoading ? "Checking" : evidence?.risk_level || selected.level}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Metric label="Model Risk" value={evidence ? `${Math.round(evidence.delay_probability)}%` : `${selected.score}%`} />
                    <Metric label="Expected Transit" value={evidence ? `${evidence.expected_transit_days.toFixed(1)}d` : "Unavailable"} />
                    <Metric label="Confidence" value={evidence ? `${Math.round(evidence.confidence_score)}%` : "Unavailable"} />
                    <Metric label="Predicted Breach" value={evidence ? (evidence.predicted_sla_breach ? "Yes" : "No") : "Unavailable"} />
                  </div>
                </div>
                <div className="lg:col-span-2 rounded-2xl bg-slate-50 p-4">
                  <div className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Contributing Factors</div>
                  <div className="space-y-3">
                    {(evidence?.contributing_factors || []).map((factor) => (
                      <div key={factor.feature}>
                        <div className="mb-1 flex justify-between text-xs font-black text-slate-600">
                          <span>{factor.feature}</span>
                          <span>{Math.round(factor.importance * 100)}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white">
                          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.max(4, factor.importance * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                    {!evidenceLoading && !evidence?.contributing_factors?.length && <EmptyState text="Prediction factors are unavailable for this shipment." />}
                  </div>
                </div>
              </div>
            ) : <EmptyState text="Select a transaction to view prediction evidence." />}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle title="Network Risk Context" subtitle="Loaded from network overview" />
            <div className="mt-5 space-y-3">
              <Metric label="Network Health" value={`${Number(networkQuery.data?.kpis?.network_health_score || 0).toFixed(1)}%`} />
              <Metric label="SLA Breach Rate" value={`${Number(networkQuery.data?.kpis?.sla_breach_rate || 0).toFixed(1)}%`} />
              <Metric label="Highest Risk Corridor" value={networkQuery.data?.kpis?.highest_risk_corridor || "Unavailable"} />
              <Metric label="Congested Nodes" value={String(networkQuery.data?.kpis?.congested_nodes_count || 0)} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Kpi({ label, value, sub, icon: Icon }: { label: string; value: string; sub: string; icon: React.ElementType }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Icon className="h-5 w-5" /></div>
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-black text-slate-900">{value}</div>
      <div className="mt-2 text-[11px] font-semibold text-slate-500">{sub}</div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-black text-slate-900">{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-bold text-slate-400">{text}</div>;
}
