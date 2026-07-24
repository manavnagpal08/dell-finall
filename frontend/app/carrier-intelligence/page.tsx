"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  Leaf,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Truck,
  Zap,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCarriers, useGetTransactions } from "@/services/queries";

type TabId = "Home" | "Rankings" | "Matrix" | "Health" | "Simulator";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function pct(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function statusClass(status: string) {
  if (status === "Preferred") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Review") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

export default function CarrierIntelligencePage() {
  const [activeTab, setActiveTab] = useState<TabId>("Home");
  const [search, setSearch] = useState("");
  const [matrixFilter, setMatrixFilter] = useState("All Lanes");

  const carriersQuery = useGetCarriers();
  const transactionsQuery = useGetTransactions({ page: 1, limit: 500 });

  const carriers = useMemo(() => {
    const list = Array.isArray(carriersQuery.data) ? carriersQuery.data : carriersQuery.data?.items || [];
    return list.map((carrier: any, index: number) => {
      const sla = Number(carrier.sla || 0);
      const tamperRate = Number(carrier.damage || 0);
      const carbon = Number(carrier.carbon || 0);
      const delay = Number(carrier.avg_delay_days || 0);
      const cost = Number(carrier.cost || 0);
      const score = clampScore(
        sla * 0.55 +
        Math.max(0, 100 - tamperRate * 8) * 0.18 +
        carbon * 0.14 +
        Math.max(0, 100 - delay * 12) * 0.13
      );

      return {
        id: `${carrier.name || "carrier"}-${index}`,
        name: carrier.name || "Unknown Carrier",
        status: carrier.status || "Conditional",
        score,
        sla,
        cost,
        tamperRate,
        carbon,
        lanes: Number(carrier.lanes || 0),
        shipments: Number(carrier.shipments || 0),
        savings: Number(carrier.savings || 0),
        totalCost: Number(carrier.total_cost || 0),
        avgDelayDays: delay,
        slaBreaches: Number(carrier.sla_breaches || 0),
        tamperEvents: Number(carrier.tamper_events || 0),
      };
    }).sort((a: any, b: any) => b.score - a.score);
  }, [carriersQuery.data]);

  const transactions = transactionsQuery.data?.items || [];
  const bestCarrier = carriers[0] || null;
  const totalSavings = carriers.reduce((sum: number, carrier: any) => sum + Math.max(0, carrier.savings), 0);
  const totalShipments = carriers.reduce((sum: number, carrier: any) => sum + carrier.shipments, 0);
  const avgSla = carriers.length ? carriers.reduce((sum: number, carrier: any) => sum + carrier.sla, 0) / carriers.length : 0;
  const totalLanes = carriers.reduce((sum: number, carrier: any) => sum + carrier.lanes, 0);
  const totalBreaches = carriers.reduce((sum: number, carrier: any) => sum + carrier.slaBreaches, 0);
  const totalTamper = carriers.reduce((sum: number, carrier: any) => sum + carrier.tamperEvents, 0);

  const laneMatrix = useMemo(() => {
    if (!transactions.length) return [];
    const rows = new Map<string, any>();

    transactions.forEach((tx: any) => {
      const destination = tx.intermediate_hub_id || tx.tpr_id || tx.destination_location || "Unknown";
      const lane = `${tx.origin_hub_id || "Unknown"} -> ${destination}`;
      const currentCarrier = carriers.find((item: any) => item.name === tx.logistics_partner);
      const recommendedCarrier = bestCarrier?.name || tx.logistics_partner || "Unknown";
      const row = rows.get(lane) || {
        id: lane,
        lane,
        currentCarrier: tx.logistics_partner || "Unknown",
        recommendedCarrier,
        shipments: 0,
        currentCost: 0,
        optimizedCost: 0,
        savings: 0,
        slaBreaches: 0,
      };

      row.shipments += 1;
      row.currentCost += Number(tx.logistics_cost_total_usd || 0);
      row.slaBreaches += tx.sla_breach ? 1 : 0;

      if (bestCarrier && currentCarrier && currentCarrier.name !== bestCarrier.name && currentCarrier.cost > bestCarrier.cost) {
        row.recommendedCarrier = bestCarrier.name;
        row.savings += Math.max(0, (currentCarrier.cost - bestCarrier.cost) * Number(tx.quantity || 1));
      }

      row.optimizedCost = Math.max(0, row.currentCost - row.savings);
      rows.set(lane, row);
    });

    return Array.from(rows.values()).sort((a, b) => b.savings - a.savings);
  }, [bestCarrier, carriers, transactions]);

  const filteredCarriers = carriers.filter((carrier: any) =>
    carrier.name.toLowerCase().includes(search.toLowerCase()) ||
    carrier.status.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLaneMatrix = useMemo(() => {
    let result = laneMatrix.filter((row) =>
      row.lane.toLowerCase().includes(search.toLowerCase()) ||
      row.currentCarrier.toLowerCase().includes(search.toLowerCase()) ||
      row.recommendedCarrier.toLowerCase().includes(search.toLowerCase())
    );

    if (matrixFilter === "Highest Saving") result = result.filter((row) => row.savings > 0).sort((a, b) => b.savings - a.savings);
    if (matrixFilter === "Lowest Risk") result = result.sort((a, b) => a.slaBreaches - b.slaBreaches);
    if (matrixFilter === "Highest Volume") result = result.sort((a, b) => b.shipments - a.shipments);
    return result.slice(0, 20);
  }, [laneMatrix, matrixFilter, search]);

  const isLoading = carriersQuery.isLoading || transactionsQuery.isLoading;
  const isFetching = carriersQuery.isFetching || transactionsQuery.isFetching;
  const hasError = carriersQuery.isError || transactionsQuery.isError;
  const lastUpdated = Math.max(carriersQuery.dataUpdatedAt || 0, transactionsQuery.dataUpdatedAt || 0);

  const refresh = () => {
    carriersQuery.refetch();
    transactionsQuery.refetch();
  };

  const exportMatrix = () => {
    const headers = ["lane", "current_carrier", "recommended_carrier", "shipments", "current_cost", "optimized_cost", "savings", "sla_breaches"];
    const rows = filteredLaneMatrix.map((row) =>
      [row.lane, row.currentCarrier, row.recommendedCarrier, row.shipments, Math.round(row.currentCost), Math.round(row.optimizedCost), Math.round(row.savings), row.slaBreaches]
        .map((item) => `"${String(item).replaceAll('"', '""')}"`)
        .join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "carrier-lane-matrix.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-8 pb-24">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-[180px] w-full rounded-3xl" />
        <Skeleton className="h-[420px] w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] font-sans text-slate-800">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-8 py-5">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-[#0F2922]">
            Carrier Intelligence Center <Truck className="h-5 w-5 text-[#10B981]" />
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">Carrier scorecards and lane recommendations computed from loaded transaction history.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-full border border-slate-200 bg-slate-100/70 p-1">
            {(["Home", "Rankings", "Matrix", "Health", "Simulator"] as TabId[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${activeTab === tab ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {tab === "Matrix" ? "Lane Matrix" : tab}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search carriers or lanes"
              className="w-72 rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10"
            />
          </div>
          <button onClick={refresh} disabled={isFetching} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-6 p-8">
        {hasError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            <AlertTriangle className="h-4 w-4" /> Carrier or transaction API unavailable. Loaded sections show backend data only.
          </div>
        )}

        {activeTab === "Home" && (
          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:grid-cols-[1.4fr_1fr]">
              <div className="rounded-2xl bg-[#0A1A16] p-8 text-white">
                <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#10B981]">Top Backend Score</div>
                {bestCarrier ? (
                  <>
                    <h2 className="text-4xl font-black">{bestCarrier.name}</h2>
                    <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-slate-300">
                      Ranked highest from SLA, tamper rate, delay, carbon index, and cost metrics computed by `/carriers`.
                    </p>
                    <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                      <HeroMetric label="Score" value={`${bestCarrier.score}/100`} />
                      <HeroMetric label="SLA" value={pct(bestCarrier.sla)} />
                      <HeroMetric label="Cost / Unit" value={money(bestCarrier.cost)} />
                      <HeroMetric label="Delay" value={`${bestCarrier.avgDelayDays.toFixed(2)}d`} />
                    </div>
                  </>
                ) : (
                  <EmptyState text="No carrier scorecards returned by the backend." dark />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Kpi label="Recoverable Spend" value={money(totalSavings)} sub="Carrier excess-cost opportunity" icon={Zap} />
                <Kpi label="Average SLA" value={pct(avgSla)} sub={`${totalShipments.toLocaleString()} shipments scored`} icon={ShieldCheck} />
                <Kpi label="Active Lanes" value={totalLanes.toLocaleString()} sub="Distinct carrier corridors" icon={Route} />
                <Kpi label="Carriers" value={carriers.length.toLocaleString()} sub="Backend scorecards" icon={Truck} />
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FeatureButton title="Carrier Rankings" text="Compare every carrier by backend scorecard." onClick={() => setActiveTab("Rankings")} />
              <FeatureButton title="Lane Matrix" text="Review lane-level carrier switch opportunities." onClick={() => setActiveTab("Matrix")} />
              <FeatureButton title="Carrier Health" text="Inspect SLA breaches, tamper events, delay, and cost." onClick={() => setActiveTab("Health")} />
            </section>
          </div>
        )}

        {activeTab === "Rankings" && (
          <section className="space-y-4">
            <SectionHeader title="Carrier Rankings" subtitle={`${filteredCarriers.length} carriers matched from backend scorecards`} updatedAt={lastUpdated} />
            {filteredCarriers.map((carrier: any, index: number) => <CarrierCard key={carrier.id} carrier={carrier} rank={index + 1} />)}
            {!filteredCarriers.length && <EmptyState text="No carriers match the current search." />}
          </section>
        )}

        {activeTab === "Matrix" && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionHeader title="Lane Switch Matrix" subtitle={`${filteredLaneMatrix.length} lanes shown from ${laneMatrix.length} transaction lanes`} updatedAt={lastUpdated} />
              <div className="flex flex-wrap gap-2">
                {["All Lanes", "Highest Saving", "Lowest Risk", "Highest Volume"].map((filter) => (
                  <button key={filter} onClick={() => setMatrixFilter(filter)} className={`rounded-full px-4 py-2 text-xs font-bold ${matrixFilter === filter ? "bg-[#10B981] text-white" : "border border-slate-200 bg-white text-slate-600"}`}>
                    {filter}
                  </button>
                ))}
                <button onClick={exportMatrix} disabled={!filteredLaneMatrix.length} className="flex items-center gap-2 rounded-full bg-[#007A5E] px-4 py-2 text-xs font-bold text-white disabled:bg-slate-300">
                  <Download className="h-4 w-4" /> Export Matrix
                </button>
              </div>
            </div>
            <LaneTable rows={filteredLaneMatrix} />
          </section>
        )}

        {activeTab === "Health" && (
          <section className="space-y-5">
            <SectionHeader title="Carrier Health" subtitle={`${totalBreaches} SLA breaches and ${totalTamper} tamper events in loaded transactions`} updatedAt={lastUpdated} />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredCarriers.map((carrier: any) => (
                <div key={carrier.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-black text-slate-900">{carrier.name}</h3>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{carrier.shipments} scored shipments</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${statusClass(carrier.status)}`}>{carrier.status}</span>
                  </div>
                  <HealthRow label="SLA breaches" value={carrier.slaBreaches.toLocaleString()} />
                  <HealthRow label="Tamper events" value={carrier.tamperEvents.toLocaleString()} />
                  <HealthRow label="Average delay" value={`${carrier.avgDelayDays.toFixed(2)} days`} />
                  <HealthRow label="Carbon index" value={`${carrier.carbon.toFixed(1)}/100`} />
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "Simulator" && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader title="Switch Scenario Summary" subtitle="Scenario is calculated from current backend lane matrix savings." updatedAt={lastUpdated} />
            {bestCarrier ? (
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <Kpi label="Target Carrier" value={bestCarrier.name} sub="Current top score" icon={Truck} />
                <Kpi label="Eligible Lanes" value={laneMatrix.filter((row) => row.savings > 0).length.toLocaleString()} sub="Positive savings rows" icon={Route} />
                <Kpi label="Recoverable Cost" value={money(laneMatrix.reduce((sum, row) => sum + row.savings, 0))} sub="Lane matrix savings" icon={Zap} />
                <Kpi label="Avg SLA" value={pct(avgSla)} sub="Carrier portfolio" icon={CheckCircle2} />
              </div>
            ) : <EmptyState text="No carrier data available for scenario summary." />}
          </section>
        )}
      </main>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-black text-white">{value}</div>
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

function FeatureButton({ title, text, onClick }: { title: string; text: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <div className="text-sm font-black text-slate-900">{title}</div>
      <div className="mt-2 text-xs font-semibold leading-5 text-slate-500">{text}</div>
    </button>
  );
}

function SectionHeader({ title, subtitle, updatedAt }: { title: string; subtitle: string; updatedAt: number }) {
  return (
    <div>
      <h2 className="text-xl font-black text-slate-900">{title}</h2>
      <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p>
      <p className="mt-1 text-[10px] font-bold text-slate-400">Updated: {updatedAt ? new Date(updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "waiting"}</p>
    </div>
  );
}

function CarrierCard({ carrier, rank }: { carrier: any; rank: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[280px_1fr_150px]">
      <div>
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rank {rank}</div>
        <h3 className="mt-1 text-lg font-black text-slate-900">{carrier.name}</h3>
        <div className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black ${statusClass(carrier.status)}`}>{carrier.status}</div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <MiniMetric label="SLA" value={pct(carrier.sla)} />
        <MiniMetric label="Cost / Unit" value={money(carrier.cost)} />
        <MiniMetric label="Tamper" value={pct(carrier.tamperRate)} />
        <MiniMetric label="Delay" value={`${carrier.avgDelayDays.toFixed(2)}d`} />
        <MiniMetric label="Savings" value={money(carrier.savings)} />
      </div>
      <div className="flex items-center justify-center rounded-xl bg-emerald-50">
        <div className="text-center">
          <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Score</div>
          <div className="text-3xl font-black text-emerald-700">{carrier.score}</div>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-black text-slate-900">{value}</div>
    </div>
  );
}

function LaneTable({ rows }: { rows: any[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[620px] overflow-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3">Lane</th>
              <th className="px-4 py-3">Current Carrier</th>
              <th className="px-4 py-3">Recommended</th>
              <th className="px-4 py-3">Shipments</th>
              <th className="px-4 py-3">Current Cost</th>
              <th className="px-4 py-3">Optimized Cost</th>
              <th className="px-4 py-3">Savings</th>
              <th className="px-4 py-3">SLA Breaches</th>
            </tr>
          </thead>
          <tbody className="text-[12px] font-bold text-slate-700">
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-900">{row.lane}</td>
                <td className="px-4 py-3">{row.currentCarrier}</td>
                <td className="px-4 py-3 text-emerald-700">{row.recommendedCarrier}</td>
                <td className="px-4 py-3">{row.shipments}</td>
                <td className="px-4 py-3">{money(row.currentCost)}</td>
                <td className="px-4 py-3">{money(row.optimizedCost)}</td>
                <td className="px-4 py-3 text-emerald-700">{money(row.savings)}</td>
                <td className="px-4 py-3">{row.slaBreaches}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <EmptyState text="No lanes match the current search and filter." />}
      </div>
    </div>
  );
}

function HealthRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 text-sm font-bold last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900">{value}</span>
    </div>
  );
}

function EmptyState({ text, dark = false }: { text: string; dark?: boolean }) {
  return (
    <div className={`rounded-xl border border-dashed p-6 text-center text-sm font-bold ${dark ? "border-white/10 bg-white/5 text-slate-300" : "border-slate-200 bg-white text-slate-400"}`}>
      {text}
    </div>
  );
}
