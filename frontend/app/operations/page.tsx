"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { useGetNetworkOverview, useGetHubs, useGetTPRs, useGetTransactions } from "@/services/queries";
import { MapContainer } from "@/components/network/map-container";
import QRCode from "react-qr-code";

import {
  Search, Zap, RefreshCw, Filter, ChevronDown, ChevronRight, Truck, MapPin,
  Package, Users, Wrench, Box, Warehouse, Activity, ShieldCheck, AlertTriangle,
  DollarSign, X, ArrowUpRight, ArrowDownRight, CheckCircle2, TrendingUp,
  Map as MapIcon, GitBranch, Table as TableIcon, Locate, BarChart3, Route as RouteIcon,
  ArrowRightLeft, Command, Factory, Globe, QrCode, FileText as FileTextIcon, Info, Share2, AlertCircle, Calendar, CalendarClock, Route, MoreVertical
} from "lucide-react";

/* ============================================================
   TOKENS
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
};

const scoreColor = (v: number) => (v >= 90 ? C.green : v >= 75 ? C.blue : v >= 60 ? C.amber : C.red);
const scoreLabel = (v: number) => (v >= 90 ? "Healthy" : v >= 75 ? "Stable" : v >= 60 ? "Needs Attention" : "Critical");

/* ============================================================
   BACKEND-DERIVED EXPLORER DATA
   ============================================================ */

const getExplorerSections = (mode: string, hubs: any[] = [], tprs: any[] = [], transactions: any[] = [], riskOnly = false, filters: any = {}) => {
  const formatHubs = hubs.map(h => ({
    ...h,
    id: h.hub_id,
    name: h.hub_name || h.hub_id,
    score: Math.round(Math.max(35, Math.min(98, 100 - Math.abs((Number(h.utilisation_pct || 0.5) * 100) - 70) * 0.7))),
    sub: h.hub_type || "Primary Hub",
    count: Math.floor(Math.random() * 80 + 20), // Simulated shipment count
    utilization: Math.round(Number(h.utilisation_pct || 0.5) * 100)
  }));
  const formatTprs = tprs.map(t => ({
    ...t,
    id: t.tpr_id,
    name: t.tpr_name || t.tpr_id,
    score: Math.round(Math.max(35, Math.min(98, 100 - (Number(t.current_workload || 0) / Math.max(1, Number(t.repair_capacity_per_day || 1))) * 26))),
    sub: t.specialisation || "Repair Center",
    count: Number(t.current_workload || 0),
    utilization: Math.round(Number(t.current_workload || 0) / Math.max(1, Number(t.repair_capacity_per_day || 1)) * 100)
  }));

  const forwardTx = transactions.filter(t => t.flow_type !== "Reverse").map(t => ({
    ...t, id: t.transaction_id, name: t.transaction_id, score: t.sla_breach ? 40 : 95, sub: `${t.origin_hub_id} -> ${t.destination_location}`, count: 1, utilization: null
  }));

  const reverseTx = transactions.filter(t => t.flow_type === "Reverse").map(t => ({
    ...t, id: t.transaction_id, name: t.transaction_id, score: t.sla_breach ? 40 : 95, sub: `${t.origin_hub_id} -> ${t.destination_location}`, count: 1, utilization: null
  }));

  const keepRisk = (item: any) => !riskOnly || item.score < 60 || item.sla_breach || item.utilization >= 85;
  
  const applyFilters = (items: any[], type: string) => {
    return items.filter(keepRisk).filter((it: any) => {
      let pass = true;
      if (filters.status && filters.status !== "All Status") {
        const lbl = scoreLabel(it.score);
        if (filters.status === "Healthy" && lbl !== "Healthy") pass = false;
        if (filters.status === "Warning" && (lbl === "Healthy" || lbl === "Critical")) pass = false;
        if (filters.status === "Critical" && lbl !== "Critical") pass = false;
      }
      if (filters.hub && filters.hub !== "All Hubs" && type === "hub") {
        if (!it.hub_type?.toLowerCase().includes(filters.hub.toLowerCase())) pass = false;
      }
      return pass;
    });
  };

  const visibleHubs = applyFilters(formatHubs, "hub");
  const visibleTprs = applyFilters(formatTprs, "tpr");
  const visibleForwardTx = applyFilters(forwardTx, "tx");
  const visibleReverseTx = applyFilters(reverseTx, "tx");

  if (mode === "forward") {
    return [
      { key: "hubs", label: "Hubs", icon: Factory, items: visibleHubs.filter(h => h.hub_type?.toLowerCase().includes("primary") || h.hub_type?.toLowerCase().includes("regional")) },
      { key: "warehouses", label: "Warehouses", icon: Warehouse, items: visibleHubs.filter(h => h.hub_type?.toLowerCase().includes("satellite")) },
      { key: "shipments", label: "Shipments", icon: Truck, items: visibleForwardTx },
      { key: "repair", label: "Repair Centers", icon: Wrench, items: visibleTprs },
      { key: "international", label: "International Facilities", icon: Globe, items: [] },
    ];
  }

  return [
    { key: "repair", label: "Repair Centers", icon: Wrench, items: visibleTprs },
    { key: "shipments", label: "Reverse Shipments", icon: Truck, items: visibleReverseTx },
  ];
};



/* ============================================================
   HOOKS
   ============================================================ */
function useCountUp(target: number, duration = 700) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(from + (target - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);
  return val;
}

/* ============================================================
   SMALL UI PARTS
   ============================================================ */
function ScoreRing({ value, size = 56, stroke = 5 }: any) {
  const animated = useCountUp(value, 900);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animated / 100) * circ;
  const color = scoreColor(value);
  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={C.gray100} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.28, fontWeight: 700, color: C.gray900 }}>{Math.round(animated)}</span>
      </div>
    </div>
  );
}

function Sparkline({ data, color, height = 28 }: any) {
  const [draw, setDraw] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDraw(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const w = 100, h = height;
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((d: number, i: number) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return [x, y];
  });
  const path = pts.map((p: any, i: number) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const len = 220;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <path
        d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={len} strokeDashoffset={draw ? 0 : len}
        style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1)" }}
      />
      {pts.map(([x, y]: any, i: number) => (
        i === pts.length - 1 && (
          <circle key={i} cx={x} cy={y} r="2.5" fill={color} style={{ opacity: draw ? 1 : 0, transition: "opacity 0.4s ease 0.9s" }} />
        )
      ))}
    </svg>
  );
}

function StatusDot({ score }: any) {
  return <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: scoreColor(score) }} />;
}

function KpiCard({ icon: Icon, label, value, suffix = "", delta, accent, trend }: any) {
  const animated = useCountUp(typeof value === "number" ? value : 0, 900);
  const display = typeof value === "number" ? Math.round(animated).toLocaleString() : value;
  return (
    <div className="bg-white rounded-2xl border p-4 flex flex-col gap-2.5 shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: C.gray200 }}>
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: accent + "1a" }}>
          <Icon size={17} style={{ color: accent }} />
        </div>
        {delta && (
          <span className="flex items-center gap-0.5 text-xs font-medium" style={{ color: delta.startsWith("-") ? C.red : C.green }}>
            {delta.startsWith("-") ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
            {delta}
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-semibold tracking-tight" style={{ color: C.gray900 }}>{display}{suffix}</div>
        <div className="text-xs mt-0.5" style={{ color: C.gray500 }}>{label}</div>
      </div>
      {trend && (
        <div className="-mx-1 -mb-1">
          <Sparkline data={trend} color={accent} />
        </div>
      )}
    </div>
  );
}

/* ============================================================
   EXPLORER
   ============================================================ */
function Explorer({ mode, query, selected, onSelect, sections }: any) {
  // Only one section open at a time (accordion)
  const [openSection, setOpenSection] = useState<string>(sections[0]?.key);

  const toggle = (key: string) => {
    setOpenSection(prev => prev === key ? "" : key);
  };

  const q = query.trim().toLowerCase();

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
      {sections.map((sec: any) => {
        const items = q ? sec.items.filter((it: any) => it.name.toLowerCase().includes(q)) : sec.items;
        if (q && items.length === 0) return null;
        const isOpen = openSection === sec.key || !!q;
        const Icon = sec.icon;
        return (
          <div key={sec.key} className="mb-1 border-b pb-1 last:border-0" style={{ borderColor: C.gray100 }}>
            <button
              onClick={() => toggle(sec.key)}
              className="w-full flex items-center justify-between px-2 py-2 hover:bg-gray-50 transition-colors group rounded-md"
            >
              <span className="flex items-center gap-2 text-[14px] font-semibold" style={{ color: C.gray900 }}>
                {isOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                {sec.label} <span className="text-gray-500 font-normal">({sec.items.length})</span>
              </span>
            </button>
            {isOpen && (
              <div className="flex flex-col gap-1 mt-1 pl-4 pr-1 pb-2">
                {items.map((it: any) => {
                  const active = selected && selected.id === it.id;
                  return (
                    <button
                      key={it.id}
                      onClick={() => onSelect(it, sec)}
                      className="w-full flex flex-col items-start px-3 py-2 rounded-lg text-left transition-all border"
                      style={{
                        background: active ? "white" : "transparent",
                        borderColor: active ? C.gray200 : "transparent",
                        boxShadow: active ? "0 1px 3px rgba(0,0,0,0.05)" : "none"
                      }}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <span className="flex items-center gap-2 font-semibold text-[13px]" style={{ color: C.gray900 }}>
                          <Icon size={14} style={{ color: C.green }} />
                          {it.name}
                        </span>
                        <span className="text-[12px] font-bold" style={{ color: scoreColor(it.score) }}>
                          {it.score}%
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between w-full text-[11px] font-medium" style={{ color: C.gray500 }}>
                        <span className="flex items-center gap-1.5">
                          <StatusDot score={it.score} />
                          {scoreLabel(it.score)}
                        </span>
                        <span>{it.count} {sec.key === 'shipments' ? 'Items' : sec.key === 'repair' ? 'Repairs' : 'Shipments'}</span>
                      </div>
                      
                      {it.utilization !== null && (
                        <div className="w-full mt-2">
                          <div className="flex justify-between text-[10px] font-medium mb-1" style={{ color: C.gray400 }}>
                            <span>Capacity Utilization</span>
                            <span style={{ color: it.utilization > 85 ? C.red : C.green }}>{it.utilization}%</span>
                          </div>
                          <div className="w-full h-1 rounded-full bg-gray-100">
                            <div className="h-1 rounded-full" style={{ width: `${Math.min(100, it.utilization)}%`, background: it.utilization > 85 ? C.red : C.green }} />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
                {items.length > 5 && !q && (
                  <button className="text-[11px] font-medium text-gray-500 hover:text-gray-900 text-left pl-2 mt-1">
                    View all {sec.label.toLowerCase()} →
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LiveDataStatus({ stats, filtered }: any) {
  return (
    <div className="bg-white rounded-2xl border p-4 shadow-sm" style={{ borderColor: C.gray200 }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-semibold" style={{ color: C.gray900 }}>Live Data Status</span>
        <span className="text-[11px] font-bold rounded-full px-2 py-1" style={{ color: filtered ? C.amber : C.green, background: filtered ? "#FEF3C7" : C.greenSoft }}>
          {filtered ? "Risk filter on" : "All objects"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Objects", value: stats.objectsScanned },
          { label: "Critical", value: stats.criticalIssues },
          { label: "Warnings", value: stats.warnings },
        ].map((item) => (
          <div key={item.label} className="rounded-xl p-3" style={{ background: C.gray50 }}>
            <div className="text-[10px]" style={{ color: C.gray500 }}>{item.label}</div>
            <div className="text-base font-semibold mt-0.5" style={{ color: C.gray900 }}>{Number(item.value || 0).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============================================================
   FILTER BAR
   ============================================================ */
function OperationsFilterBar({ filters, setFilters, onApply, onReset }: any) {
  const filterConfig = [
    { key: "hub", label: "Hub", options: ["All Hubs", "Primary", "Satellite", "Regional"] },
    { key: "status", label: "Status", options: ["All Status", "Healthy", "Warning", "Critical"] },
    { key: "type", label: "Shipment Type", options: ["All Types", "Inbound", "Outbound"] },
    { key: "transport", label: "Transport", options: ["All Modes", "Air", "Sea", "Road"] },
    { key: "priority", label: "Priority", options: ["All Priorities", "High", "Medium", "Low"] },
    { key: "region", label: "Region", options: ["All Regions", "Americas", "EMEA", "APJ"] },
    { key: "date", label: "Date", icon: Calendar, options: ["Today", "Yesterday", "Last 7 Days"] },
    { key: "aiStatus", label: "AI Status", options: ["All", "Optimized", "Rerouted"] },
  ];

  return (
    <div className="bg-white rounded-xl border p-2.5 flex items-center justify-between shadow-sm mb-4" style={{ borderColor: C.gray200 }}>
      <div className="flex items-center gap-2 flex-wrap">
        {filterConfig.map((f, i) => (
          <div key={i} className="flex flex-col relative group">
            <span className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 ml-1" style={{ color: C.gray500 }}>{f.label}</span>
            <select
              value={filters[f.key]}
              onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value })}
              className="appearance-none flex items-center gap-1.5 px-3 py-1.5 pr-6 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors text-[12px] font-medium outline-none cursor-pointer"
              style={{ borderColor: C.gray200, color: C.gray900 }}
            >
              {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 bottom-2 pointer-events-none" style={{ color: C.gray400 }} />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <button onClick={onReset} className="text-[12px] font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors" style={{ color: C.gray700 }}>
          Reset
        </button>
        <button onClick={onApply} className="text-[12px] font-medium px-4 py-2 rounded-lg text-white transition-colors" style={{ background: C.green }}>
          Apply Filters
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   OBJECT WORKSPACE
   ============================================================ */

function buildObjectMetrics(object: any) {
  if (object.hub_id) {
    const utilization = Number(object.utilisation_pct || 0) * 100
    const stockRatio = Number(object.current_stock_level || 0) / Math.max(1, Number(object.inventory_capacity || 1)) * 100
    return [
      { label: "Capacity / Utilization", value: utilization, icon: Activity, accent: utilization > 85 ? C.red : C.green },
      { label: "Stock Coverage", value: stockRatio, icon: Package, accent: stockRatio < 25 ? C.amber : C.green },
      { label: "Current Stock", value: Number(object.current_stock_level || 0), icon: Box, accent: C.green, raw: true },
      { label: "Network Score", value: object.score, icon: TrendingUp, accent: scoreColor(object.score) },
      { label: "Capacity Limit", value: Number(object.inventory_capacity || 0), icon: Warehouse, accent: C.green, raw: true },
      { label: "Connected Routes", value: Number(object.inbound_shipments_count || 0) + Number(object.outbound_shipments_count || 0), icon: RouteIcon, accent: C.green, raw: true },
    ]
  }

  if (object.tpr_id) {
    const workload = Number(object.current_workload || 0)
    const capacity = Number(object.repair_capacity_per_day || 0)
    const utilization = workload / Math.max(1, capacity) * 100
    return [
      { label: "Repair Utilization", value: utilization, icon: Activity, accent: utilization > 90 ? C.red : C.green },
      { label: "Current Workload", value: workload, icon: Wrench, accent: C.green, raw: true },
      { label: "Daily Capacity", value: capacity, icon: Warehouse, accent: C.green, raw: true },
      { label: "SLA Days", value: Number(object.sla_days || 0), icon: ShieldCheck, accent: C.amber, raw: true },
      { label: "Contracts", value: Number(object.active_contracts || 0), icon: Users, accent: C.green, raw: true },
      { label: "Network Score", value: object.score, icon: TrendingUp, accent: scoreColor(object.score) },
    ]
  }

  const delayDays = Math.max(0, Number(object.transit_days_actual || 0) - Number(object.transit_days_expected || 0))
  const stockCoverage = Number(object.stock_at_origin_hub || 0) / Math.max(1, Number(object.quantity || 1)) * 100
  return [
    { label: "Transit Health", value: Math.max(0, 100 - delayDays * 12), icon: ShieldCheck, accent: delayDays > 0 ? C.red : C.green },
    { label: "Actual Transit", value: Number(object.transit_days_actual || 0), icon: Truck, accent: C.green, raw: true },
    { label: "Expected Transit", value: Number(object.transit_days_expected || 0), icon: RouteIcon, accent: C.green, raw: true },
    { label: "Logistics Cost", value: Number(object.logistics_cost_total_usd || 0), icon: DollarSign, accent: C.amber, raw: true, currency: true },
    { label: "Stock Coverage", value: Math.min(999, stockCoverage), icon: Package, accent: stockCoverage < 150 ? C.amber : C.green },
    { label: "Network Score", value: object.score, icon: TrendingUp, accent: scoreColor(object.score) },
  ]
}

function ObjectWorkspace({ object, section, onOpenAnalytics, onLocate, onOpenQR, timeline, setTimeline }: any) {
  if (!object) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center gap-3" style={{ color: C.gray400 }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: C.gray50 }}>
          <Command size={22} />
        </div>
        <div className="text-sm font-medium" style={{ color: C.gray500 }}>Select an object from the explorer</div>
        <div className="text-xs max-w-xs">Choose a hub, shipment, route or any logistics object to load its live workspace.</div>
      </div>
    );
  }

  const metrics = buildObjectMetrics(object);

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <ScoreRing value={object.score} size={64} />
          <div>
            <div className="text-lg font-semibold tracking-tight" style={{ color: C.gray900 }}>{object.name}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: scoreColor(object.score) + "1a", color: scoreColor(object.score) }}>
                {scoreLabel(object.score)}
              </span>
              <span className="text-xs" style={{ color: C.gray400 }}>{object.sub}</span>
              <span className="text-xs" style={{ color: C.gray400 }}>/ {section?.label}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onLocate} className="text-xs font-medium px-3 py-1.5 rounded-lg border flex items-center gap-1.5 hover:bg-gray-50" style={{ borderColor: C.gray200, color: C.gray700 }}>
            <Locate size={14} /> Locate on Map
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-1">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border p-3" style={{ borderColor: C.gray200 }}>
            <div className="flex items-center gap-1.5 mb-2">
              <m.icon size={13} style={{ color: m.accent }} />
              <span className="text-[11px]" style={{ color: C.gray500 }}>{m.label}</span>
            </div>
            <AnimatedNumber value={m.value} suffix={m.raw ? "" : "%"} currency={m.currency} />
          </div>
        ))}
      </div>
      
      <div className="text-[10px] text-right" style={{ color: C.gray400 }}>
        Values reflect <strong>Today</strong> — driven by the Operations Timeline below.
      </div>

      <div className="mt-1 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold" style={{ color: C.gray900 }}>Operations Timeline</span>
          <span className="text-[10px]" style={{ color: C.gray500 }}>Drag to simulate operational state</span>
        </div>
        <div className="w-full relative py-3">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={timeline} 
            onChange={(e) => setTimeline(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-100 outline-none cursor-pointer relative z-10" 
            style={{ 
              background: `linear-gradient(to right, ${C.green} ${timeline}%, #F3F4F6 ${timeline}%)` 
            }} 
          />
          <style>{`
            input[type=range]::-webkit-slider-thumb {
              -webkit-appearance: none;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              border: 2px solid ${C.green};
              background: white;
              box-shadow: 0 1px 3px rgba(0,0,0,0.2);
              cursor: pointer;
            }
          `}</style>
        </div>
        <div className="flex items-center justify-between text-[11px] font-medium" style={{ color: C.gray400 }}>
          <span style={{ color: timeline < 25 ? C.gray900 : C.gray400, fontWeight: timeline < 25 ? 700 : 500 }}>Yesterday</span>
          <span style={{ color: timeline >= 25 && timeline < 75 ? C.gray900 : C.gray400, fontWeight: timeline >= 25 && timeline < 75 ? 700 : 500 }}>Today</span>
          <span style={{ color: timeline >= 75 && timeline < 95 ? C.gray900 : C.gray400, fontWeight: timeline >= 75 && timeline < 95 ? 700 : 500 }}>Tomorrow</span>
          <span style={{ color: timeline >= 95 ? C.gray900 : C.gray400, fontWeight: timeline >= 95 ? 700 : 500 }}>Next Week</span>
        </div>
      </div>

      <button onClick={onOpenQR} className="mt-2 w-full flex items-center justify-between p-3 rounded-xl border hover:bg-gray-50 transition-colors group" style={{ borderColor: C.greenSoft, background: "#F5FCFB" }}>
        <div className="flex items-center gap-3">
          <div className="p-1 rounded bg-white flex items-center justify-center border" style={{ borderColor: C.greenSoft }}>
            <QRCode value={object ? JSON.stringify({ id: object.id, name: object.name, score: object.score, status: scoreLabel(object.score), sub: object.sub }) : "qr"} size={28} />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[13px] font-bold" style={{ color: C.gray900 }}>Scan / View Shipment QR</span>
            <span className="text-[11px]" style={{ color: C.gray500 }}>Click to scan or enter shipment QR code</span>
          </div>
        </div>
        <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" style={{ color: C.gray400 }} />
      </button>

    </div>
  );
}

function AnimatedNumber({ value, suffix, currency }: any) {
  const v = useCountUp(value, 600);
  const display = currency ? `$${Math.round(v).toLocaleString()}` : `${Math.round(v).toLocaleString()}${suffix || ""}`;
  return <div className="text-xl font-semibold tracking-tight" style={{ color: C.gray900 }}>{display}</div>;
}

/* ============================================================
   NETWORK OVERVIEW
   ============================================================ */
const NODE_POS: any = {
  h1: { x: 30, y: 25 }, h2: { x: 18, y: 62 }, h3: { x: 62, y: 70 }, h4: { x: 48, y: 88 }, h5: { x: 78, y: 55 },
  rr1: { x: 48, y: 88 }, rr2: { x: 30, y: 58 },
};

function FlowDot({ pa, pb, color, duration }: any) {
  const ref = useRef(null);
  return (
    <circle r="3.2" fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }}>
      <animateMotion
        path={`M${pa.x},${pa.y} L${pb.x},${pb.y}`}
        dur={`${duration}s`}
        repeatCount="indefinite"
      />
    </circle>
  );
}

function NetworkOverview({ mode, onSelect, selectedId, networkData }: any) {
  const [view, setView] = useState("flow");
  const [hover, setHover] = useState<string | null>(null);

  const getNodeScore = (n: any) => {
    const utilization = typeof n.utilisation === "number" ? n.utilisation : 0.65;
    const statusPenalty = n.status === "Overloaded" ? 18 : n.status === "Underutilised" ? 8 : 0;
    const score = Math.round(98 - utilization * 28 - statusPenalty);
    return Math.max(42, Math.min(98, score));
  };

  // Calculate bounds dynamically to ensure all global nodes fit on the screen
  const validNodes = (networkData?.nodes || []).filter((n: any) => typeof n.longitude === "number" && typeof n.latitude === "number");

  let minLng = Math.min(...validNodes.map((n: any) => n.longitude));
  let maxLng = Math.max(...validNodes.map((n: any) => n.longitude));
  let minLat = Math.min(...validNodes.map((n: any) => n.latitude));
  let maxLat = Math.max(...validNodes.map((n: any) => n.latitude));

  // Add 25% padding so nodes and their long labels don't hug the absolute edges and get clipped
  const lngPad = (maxLng - minLng) * 0.25 || 15;
  const latPad = (maxLat - minLat) * 0.25 || 15;
  minLng -= lngPad;
  maxLng += lngPad;
  minLat -= latPad;
  maxLat += latPad;

  // Map live network nodes to x/y coordinates dynamically
  const allNodes = (networkData?.nodes || []).map((n: any, index: number, arr: any[]) => {
    let x, y;
    if (view === "topology") {
      // Circular layout
      const angle = (index / arr.length) * 2 * Math.PI;
      const radius = 35; // keep it within 0-100 bounds, centered at 50
      x = 50 + radius * Math.cos(angle);
      y = 50 + radius * Math.sin(angle);
    } else {
      // Dynamic geographical layout
      x = ((n.longitude - minLng) / (maxLng - minLng)) * 100;
      y = 100 - (((n.latitude - minLat) / (maxLat - minLat)) * 100);
    }
    return {
      ...n,
      id: n.id,
      name: n.name || n.id,
      score: getNodeScore(n),
      x,
      y
    };
  }).filter((n: any) => !isNaN(n.x) && !isNaN(n.y));

  const edges = (networkData?.links || []).map((l: any) => [l.source_id, l.target_id]);
  const hubs = allNodes;
  const linkRows = (networkData?.links || [])
    .map((link: any) => {
      const source = hubs.find((h: any) => h.id === link.source_id);
      const target = hubs.find((h: any) => h.id === link.target_id);
      const risk = Number(link.sla_breach_rate || 0);
      const status = risk >= 50 ? "Critical" : risk >= 25 ? "Watch" : "Healthy";
      return {
        ...link,
        sourceName: source?.name || link.source_id,
        targetName: target?.name || link.target_id,
        score: Math.max(35, Math.round(100 - risk)),
        status,
      };
    })
    .sort((a: any, b: any) => (b.sla_breach_rate || 0) - (a.sla_breach_rate || 0))
    .slice(0, 8);

  const networkStats = [
    { label: "Nodes", value: hubs.length },
    { label: "Lanes", value: networkData?.links?.length || 0 },
    { label: "Avg Health", value: hubs.length ? Math.round(hubs.reduce((sum: number, h: any) => sum + h.score, 0) / hubs.length) : 0, suffix: "%" },
  ];


  const views = [
    { key: "gmap", label: "Map View", icon: MapIcon },
    { key: "flow", label: "Flow View", icon: ArrowRightLeft },
    { key: "topology", label: "Topology View", icon: GitBranch },
    { key: "table", label: "Table View", icon: TableIcon },
  ];

  // const edges = mode === "forward"


  const dark = view === "map" || view === "flow" || view === "topology";

  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: C.gray200 }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold" style={{ color: C.gray900 }}>Network Overview</span>
          <div className="hidden md:flex items-center gap-1.5">
            {networkStats.map((stat) => (
              <span key={stat.label} className="rounded-full border bg-slate-50 px-2.5 py-1 text-[10px] font-semibold" style={{ borderColor: C.gray200, color: C.gray700 }}>
                {stat.label}: <span style={{ color: C.green }}>{stat.value}{stat.suffix || ""}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 overflow-x-auto">
          {views.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors"
              style={{ background: view === v.key ? "white" : "transparent", color: view === v.key ? C.gray900 : C.gray500, boxShadow: view === v.key ? "0 1px 2px rgba(0,0,0,0.06)" : "none" }}
            >
              <v.icon size={12} /> {v.label}
            </button>
          ))}
        </div>
      </div>

      {(view === "map" || view === "flow" || view === "topology") && (
        <div
          className="relative rounded-xl overflow-hidden transition-colors duration-500"
          style={{
            minHeight: 560,
            background: dark
              ? "radial-gradient(circle at 30% 20%, #182036 0%, #0B1020 60%, #070A14 100%)"
              : C.gray50,
          }}
        >
          {dark && (
            <div
              className="absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }}
            />
          )}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 560" preserveAspectRatio="none">
            {edges.map(([a, b]: [string, string], i: number) => {

              const pa = hubs.find((h:any) => h.id === a);
              const pb = hubs.find((h:any) => h.id === b);

              if (!pa || !pb) return null;
              const A = { x: (pa.x / 100) * 1000, y: (pa.y / 100) * 560 };
              const B = { x: (pb.x / 100) * 1000, y: (pb.y / 100) * 560 };
              const active = hover === a || hover === b || selectedId === a || selectedId === b;
              const inactiveOpacity = "0.015";
              const lineColor = dark ? (active ? C.green : `rgba(255,255,255,${inactiveOpacity})`) : (active ? C.blue : C.gray200);
              return (
                <g key={i}>
                  <line
                    x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                    stroke={lineColor} strokeWidth={active ? 2 : 1}
                    strokeDasharray={view === "flow" ? "4 5" : "none"}
                    style={{ transition: "all 0.3s" }}
                  />
                  {dark && view === "flow" && (active || i % 8 === 0) && (
                    <FlowDot
                      pa={A}
                      pb={B}
                      color={active ? C.green : `rgba(4, 120, 87, 0.3)`}
                      duration={3 + (i % 4)}
                    />
                  )}
                </g>
              );
            })}
          </svg>
          {hubs.map((h: any) => {
            const pos = h;
            const isSelected = h.id === selectedId;
            const isHover = hover === h.id;
            const color = dark ? (isSelected ? C.green : "#6EE7C7") : scoreColor(h.score);
            const shortName = String(h.name || h.id).replace(/\s*Hub\s*/i, "").replace(/\s*Center\s*/i, "");
            return (
              <button
                key={h.id}
                onMouseEnter={() => setHover(h.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect(h)}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                {isSelected && dark && (
                  <span
                    className="absolute rounded-full animate-ping"
                    style={{ width: 34, height: 34, background: C.green, opacity: 0.35 }}
                  />
                )}
                {isSelected && dark && (
                  <span
                    className="absolute rounded-full"
                    style={{ width: 54, height: 54, background: `radial-gradient(circle, ${C.green}55 0%, transparent 70%)` }}
                  />
                )}
                <div
                  className="relative rounded-full flex items-center justify-center font-bold text-[11px] transition-transform"
                  style={{
                    width: isSelected ? 20 : 14, height: isSelected ? 20 : 14,
                    background: color,
                    boxShadow: dark ? `0 0 10px ${color}, 0 0 20px ${color}66` : (isHover ? "0 4px 14px rgba(0,0,0,0.12)" : "0 2px 6px rgba(0,0,0,0.06)"),
                    transform: isHover ? "scale(1.3)" : "scale(1)",
                    border: "2px solid rgba(255,255,255,0.92)",
                  }}
                />
                <span
                  className="text-[11px] font-black px-2 py-1 rounded-md whitespace-nowrap transition-opacity"
                  style={{
                    color: dark ? "#fff" : C.gray700,
                    background: dark ? "rgba(15,23,42,0.72)" : "white",
                    backdropFilter: dark ? "blur(4px)" : "none",
                    boxShadow: dark ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
                    opacity: 1,
                  }}
                >
                  {h.name}{isSelected ? ` · ${h.score}` : ""}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {view === "gmap" && (
        <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{ height: 560 }}>
          <MapContainer
            nodes={hubs}
            links={networkData?.links || []}
            selectedNodeId={selectedId}
            selectedLinkId={null}
            onSelectNode={onSelect}
            onSelectLink={() => {}}
            activeLayer="all"
          />
        </div>
      )}
    </div>
  );
}



/* ============================================================
   RADAR SCAN STATUS (persistent, explorer footer)
   ============================================================ */
function RadarStatus({ onScan, lastScanLabel }: any) {
  return (
    <div className="mt-3 pt-3 border-t" style={{ borderColor: C.gray100 }}>
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.gray400 }}>Network Scan</span>
      </div>
      <div className="mx-2 rounded-xl p-3 flex flex-col items-center gap-2" style={{ background: C.gray50 }}>
        <div className="relative" style={{ width: 84, height: 84 }}>
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className="absolute inset-0 rounded-full"
              style={{ border: `1px solid ${C.green}33`, transform: `scale(${0.4 * i})`, opacity: 0.7 }}
            />
          ))}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(${C.green}55 0deg, transparent 70deg)`,
              animation: "spin 3s linear infinite",
              maskImage: "radial-gradient(circle, transparent 30%, black 31%)",
              WebkitMaskImage: "radial-gradient(circle, transparent 30%, black 31%)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full" style={{ background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
          </div>
        </div>
        <div className="text-center">
          <div className="text-[11px] font-semibold" style={{ color: C.gray900 }}>Last scan: {lastScanLabel}</div>
          <div className="flex items-center justify-center gap-1 text-[10px] mt-0.5" style={{ color: C.green }}>
            <CheckCircle2 size={11} /> All systems operational
          </div>
        </div>
        <button onClick={onScan} className="text-[11px] font-medium" style={{ color: C.blue }}>
          Run new scan →
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   NETWORK SCAN MODAL
   ============================================================ */
const SCAN_STEPS = [
  "Scanning Hubs", "Scanning Shipments", "Scanning Routes", "Scanning Repair Centers",
  "Scanning Inventory", "Checking SLA", "Checking Capacity", "Calculating Network Health",
  "Finding Optimization Opportunities",
];

function ScanModal({ onClose, stats }: any) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (step >= SCAN_STEPS.length) {
      setDone(true);
      return;
    }
    const id = setTimeout(() => setStep((s) => s + 1), 420);
    return () => clearTimeout(id);
  }, [step]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(18,22,28,0.45)" }}>
      <div className="bg-white rounded-3xl shadow-2xl w-[440px] p-6">
        {!done ? (
          <div className="flex flex-col items-center text-center gap-5 py-4">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full animate-ping" style={{ background: C.greenSoft }} />
              <div className="absolute inset-0 rounded-full flex items-center justify-center" style={{ border: `3px solid ${C.green}` }}>
                <Zap size={26} style={{ color: C.green }} />
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: C.gray900 }}>Running Backend Network Scan</div>
              <div className="text-xs mt-1" style={{ color: C.gray500 }}>{SCAN_STEPS[Math.min(step, SCAN_STEPS.length - 1)]}...</div>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ background: C.gray100 }}>
              <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${(step / SCAN_STEPS.length) * 100}%`, background: C.green }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} style={{ color: C.green }} />
              <span className="text-sm font-semibold" style={{ color: C.gray900 }}>Scan Completed Successfully</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Overall Network Score", value: `${stats.networkScore}/100` },
                { label: "Objects Scanned", value: stats.objectsScanned.toLocaleString() },
                { label: "Critical Issues", value: stats.criticalIssues.toLocaleString() },
                { label: "Warnings", value: stats.warnings.toLocaleString() },
                { label: "Potential Savings", value: `$${stats.potentialSavings.toLocaleString()}` },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-3" style={{ background: C.gray50 }}>
                  <div className="text-[10px]" style={{ color: C.gray500 }}>{s.label}</div>
                  <div className="text-base font-semibold mt-0.5" style={{ color: C.gray900 }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={onClose} className="flex-1 text-xs font-medium py-2.5 rounded-xl border" style={{ borderColor: C.gray200, color: C.gray700 }}>
                Close
              </button>
              <Link href="/ai-investigation" onClick={onClose} className="flex-1 text-center text-xs font-medium py-2.5 rounded-xl text-white" style={{ background: C.gray900 }}>Open Investigation</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   AI SHIPMENT PASSPORT
   ============================================================ */
function AiShipmentPassport({ onClose, object }: any) {
  const [openAccordion, setOpenAccordion] = useState<string>("map");
  const shipmentId = object?.transaction_id || "TXN-20241025";
  const priority = object?.priority || "High";
  const status = object?.status || "In Transit";
  const healthScore = object?.score || 98;

  const toggle = (key: string) => {
    setOpenAccordion(prev => prev === key ? "" : key);
  };

  const accordionsLeft = [
    { key: "summary", label: "Shipment Summary" },
    { key: "route", label: "Route Journey" },
    { key: "map", label: "Live Map" },
  ];

  const accordionsRight = [
    { key: "insights", label: "AI Insights" },
    { key: "timeline", label: "Shipment Timeline" },
    { key: "documents", label: "Documents" },
    { key: "health", label: "Operational Health" },
    { key: "recommendation", label: "AI Recommendation" },
  ];

  const renderAccordionContent = (key: string) => {
    switch (key) {
      case "summary":
        return (
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div><span className="text-gray-500 block mb-0.5">Product</span><span className="font-semibold text-gray-900">PowerEdge R750</span></div>
            <div><span className="text-gray-500 block mb-0.5">Category</span><span className="font-semibold text-gray-900">Enterprise Servers</span></div>
            <div><span className="text-gray-500 block mb-0.5">Weight</span><span className="font-semibold text-gray-900">1,240 kg</span></div>
            <div><span className="text-gray-500 block mb-0.5">Created Date</span><span className="font-semibold text-gray-900">20 Jul 2026</span></div>
          </div>
        );
      case "route":
        return (
          <div className="flex items-center justify-between text-[11px] font-medium text-gray-900 mt-1">
            <div className="flex flex-col items-center gap-1 text-center"><MapPin size={14} className="text-blue-500"/> Origin<br/><span className="text-gray-500 text-[9px]">Bangalore</span></div>
            <div className="flex-1 border-t border-dashed border-gray-300 mx-3 mt-[-10px]"></div>
            <div className="flex flex-col items-center gap-1 text-center"><Factory size={14} className="text-amber-500"/> Hub<br/><span className="text-gray-500 text-[9px]">Dubai</span></div>
            <div className="flex-1 border-t border-dashed border-gray-300 mx-3 mt-[-10px]"></div>
            <div className="flex flex-col items-center gap-1 text-center"><MapPin size={14} className="text-gray-400"/> Dest<br/><span className="text-gray-500 text-[9px]">Singapore</span></div>
          </div>
        );
      case "map":
        return (
          <div className="w-full flex flex-col gap-2">
            <div className="w-full h-32 rounded-lg border bg-[#E8F0FE] relative overflow-hidden flex items-center justify-center">
              {/* SVG to mimic map route */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
                {/* Background faint lines */}
                <path d="M 0 30 Q 150 70 300 20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="8"/>
                <path d="M 0 90 Q 150 50 300 100" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="6"/>
                
                {/* Route Path */}
                <path d="M 40 90 Q 120 20 160 50 T 260 80" fill="none" stroke="#2563EB" strokeWidth="2" strokeDasharray="4 4" />
                
                {/* Points */}
                <circle cx="40" cy="90" r="5" fill="#10B981" />
                <circle cx="160" cy="50" r="5" fill="#2563EB" />
                <circle cx="260" cy="80" r="5" fill="#2563EB" />

                {/* Labels */}
                <text x="40" y="105" fontSize="9" fill="#374151" textAnchor="middle" fontWeight="bold">Bangalore</text>
                <text x="160" y="40" fontSize="9" fill="#374151" textAnchor="middle" fontWeight="bold">Dubai</text>
                <text x="260" y="95" fontSize="9" fill="#374151" textAnchor="middle" fontWeight="bold">Singapore</text>

                {/* Airplane icon over Dubai */}
                <g transform="translate(145, 45)">
                  <path d="M 12 6.5 L 12 3 A 2 2 0 0 0 8 3 L 8 6.5 L 2 10 L 2 12 L 8 10.5 L 8 14 L 6 15.5 L 6 17 L 10 16 L 14 17 L 14 15.5 L 12 14 L 12 10.5 L 18 12 L 18 10 Z" fill="#2563EB" transform="rotate(45) scale(0.6)" />
                </g>
              </svg>
            </div>
            <div className="flex items-center justify-between px-2">
              <span className="flex items-center gap-1.5 text-[9px] font-medium text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Completed</span>
              <span className="flex items-center gap-1.5 text-[9px] font-medium text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> In Progress</span>
              <span className="flex items-center gap-1.5 text-[9px] font-medium text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Upcoming</span>
            </div>
          </div>
        );
      case "insights":
        return (
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div><span className="text-gray-500 block mb-0.5">Delay Risk</span><span className="font-bold text-amber-500">14% (Moderate)</span></div>
            <div><span className="text-gray-500 block mb-0.5">Carbon Impact</span><span className="font-semibold text-gray-900">1.2 Tons CO2</span></div>
          </div>
        );
      case "timeline":
        return (
          <div className="flex flex-col gap-2 relative pl-2.5 border-l-2 border-gray-200 ml-1.5 mt-1">
            <div className="relative text-[10px]"><span className="absolute -left-[15px] top-1 w-1.5 h-1.5 rounded-full bg-green-500"></span><strong className="text-gray-900 block text-[11px]">Shipment Created</strong><span className="text-gray-500">20 Jul, 08:00 AM</span></div>
            <div className="relative text-[10px]"><span className="absolute -left-[15px] top-1 w-1.5 h-1.5 rounded-full bg-green-500"></span><strong className="text-gray-900 block text-[11px]">Reached Bangalore Hub</strong><span className="text-gray-500">21 Jul, 14:30 PM</span></div>
            <div className="relative text-[10px]"><span className="absolute -left-[15px] top-1 w-1.5 h-1.5 rounded-full bg-blue-500"></span><strong className="text-blue-600 block text-[11px]">Current: Customs Clearance</strong><span className="text-gray-500">In Progress (Dubai)</span></div>
          </div>
        );
      case "documents":
        return (
          <div className="flex flex-col gap-1.5">
            <button className="flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-50 border text-left text-[11px] font-semibold text-gray-900"><FileTextIcon size={12} className="text-blue-500"/> Commercial Invoice</button>
            <button className="flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-50 border text-left text-[11px] font-semibold text-gray-900"><FileTextIcon size={12} className="text-green-500"/> Customs Declaration</button>
          </div>
        );
      case "health":
        return (
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div><span className="text-gray-500 block mb-0.5">Temperature</span><span className="font-semibold text-gray-900 flex items-center gap-1"><CheckCircle2 size={10} className="text-green-500"/> Stable (22°C)</span></div>
            <div><span className="text-gray-500 block mb-0.5">Shock Events</span><span className="font-semibold text-gray-900 flex items-center gap-1"><CheckCircle2 size={10} className="text-green-500"/> None Detected</span></div>
          </div>
        );
      case "recommendation":
        return (
          <div className="p-2.5 bg-green-50 rounded-lg border border-green-200">
            <strong className="text-[11px] text-green-800 block mb-1 flex items-center gap-1"><Zap size={12}/> Reroute Recommended</strong>
            <p className="text-[10px] text-green-700 leading-relaxed">Reroute via Hyderabad Hub to bypass Dubai customs delay. Saves est. 14 hours and protects SLA.</p>
          </div>
        );
      default:
        return null;
    }
  };

  const renderAccordion = (acc: { key: string; label: string }) => {
    const isOpen = openAccordion === acc.key;
    return (
      <div key={acc.key} className="bg-white rounded-lg border overflow-hidden transition-all shadow-sm" style={{ borderColor: C.gray200 }}>
        <button onClick={() => toggle(acc.key)} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors">
          <span className="text-[12px] font-bold" style={{ color: C.gray900 }}>{acc.label}</span>
          {isOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
        </button>
        {isOpen && (
          <div className="px-3 pb-3 border-t pt-2.5" style={{ borderColor: C.gray100 }}>
            {renderAccordionContent(acc.key)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all" style={{ background: "rgba(18,22,28,0.5)" }}>
      <div className="w-full max-w-[1100px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>
        
        {/* Top Title Bar */}
        <div className="px-4 py-2.5 flex items-center justify-between border-b" style={{ borderColor: C.gray100 }}>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} style={{ color: C.green }} />
            <span className="font-bold text-[13px]" style={{ color: C.gray900 }}>AI Shipment Passport</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="text-gray-400 hover:text-gray-900 transition-colors">
              <MoreVertical size={16} />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Header Info */}
        <div className="p-4 border-b flex items-center gap-5" style={{ borderColor: C.gray100 }}>
          <div className="w-20 h-20 shrink-0 rounded-xl bg-white border p-1.5 flex items-center justify-center shadow-sm" style={{ borderColor: C.gray200 }}>
             <QRCode value={shipmentId} size={64} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
          </div>
          
          <div className="flex-1 grid grid-cols-3 gap-6">
            {/* Column 1: Shipment ID, Status, Priority */}
            <div className="flex flex-col justify-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.gray500 }}>Shipment ID</div>
              <div className="text-[15px] font-bold tracking-tight mb-1" style={{ color: C.gray900 }}>{shipmentId}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border" style={{ borderColor: C.green, color: C.green, background: C.greenSoft }}>{status}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border" style={{ borderColor: C.red, color: C.red, background: "#FEF2F2" }}>{priority} Priority</span>
              </div>
            </div>

            {/* Column 2: Origin & Current Hub */}
            <div className="flex flex-col justify-center gap-2">
              <div>
                <div className="text-[9px] font-medium text-gray-500">Origin</div>
                <div className="text-[11px] font-semibold text-gray-900 truncate">{object?.origin_hub_id || "Bangalore Hub"}</div>
              </div>
              <div>
                <div className="text-[9px] font-medium text-gray-500">Current Hub</div>
                <div className="text-[11px] font-semibold text-gray-900 truncate">{object?.current_hub_id || "Dubai Hub"}</div>
              </div>
            </div>

            {/* Column 3: ETA, Health, Confidence */}
            <div className="flex flex-col justify-center gap-2">
              <div>
                <div className="text-[9px] font-medium text-gray-500">ETA</div>
                <div className="text-[11px] font-semibold text-gray-900 truncate">24 Jul 2026, 09:45 AM</div>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-[9px] font-medium text-gray-500">AI Health</div>
                  <div className="text-[12px] font-bold" style={{ color: C.green }}>{healthScore}%</div>
                </div>
                <div>
                  <div className="text-[9px] font-medium text-gray-500">Confidence</div>
                  <div className="text-[12px] font-bold flex items-center gap-1" style={{ color: C.green }}>
                    <CheckCircle2 size={10} /> 98%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-[1fr_1fr_240px] gap-5" style={{ background: C.gray50 }}>
          
          {/* Column 1: Accordions Left */}
          <div className="flex flex-col gap-2">
            {accordionsLeft.map(renderAccordion)}
          </div>

          {/* Column 2: Accordions Right */}
          <div className="flex flex-col gap-2">
            {accordionsRight.map(renderAccordion)}
          </div>

          {/* Column 3: Actions */}
          <div className="flex flex-col gap-2">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Actions</div>
            <button className="w-full flex items-center justify-between p-2.5 rounded-lg border bg-white hover:border-green-500 hover:text-green-600 transition-colors group shadow-sm">
              <span className="text-[11px] font-bold" style={{ color: C.gray900 }}>Open in Network Workspace</span>
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full flex items-center gap-2 p-2.5 rounded-lg border bg-white hover:bg-gray-50 transition-colors shadow-sm text-[11px] font-bold text-gray-900">
              <Share2 size={12} className="text-gray-500" /> Share Passport
            </button>
            <button className="w-full flex items-center gap-2 p-2.5 rounded-lg border bg-white hover:bg-gray-50 transition-colors shadow-sm text-[11px] font-bold text-gray-900">
              <FileTextIcon size={12} className="text-gray-500" /> Download PDF
            </button>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-[11px] font-bold text-red-600 shadow-sm">
                <AlertCircle size={12} /> Report Issue
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ============================================================
   ROOT APP
   ============================================================ */
export default function OperationsIntelligenceCenter() {
  const { data: hubData, isLoading: hubsLoading, isError: hubsError, refetch: refetchHubs } = useGetHubs({ page: 1, limit: 100 });
  const { data: tprData, isLoading: tprsLoading, isError: tprsError, refetch: refetchTprs } = useGetTPRs({ page: 1, limit: 100 });
  const { data: txData, isLoading: txLoading, isError: txError, refetch: refetchTransactions } = useGetTransactions({ page: 1, limit: 100 });
  const { data: networkData, refetch: refetchNetwork } = useGetNetworkOverview({});

  const [mode, setMode] = useState("forward");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<any>({ label: "Hubs" });
  const [scanning, setScanning] = useState(false);
  const [passportOpen, setPassportOpen] = useState(false);
  const [refreshSpin, setRefreshSpin] = useState(false);
  const [riskOnly, setRiskOnly] = useState(false);
  const [workspaceNotice, setWorkspaceNotice] = useState("");
  const [lastScanLabel, setLastScanLabel] = useState("Not run yet");
  const defaultFilters = { hub: "All Hubs", status: "All Status", type: "All Types", transport: "All Modes", priority: "All Priorities", region: "All Regions", date: "Today", aiStatus: "All" };
  const [filters, setFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [timeline, setTimeline] = useState(50);
  
  const isLoadingData = hubsLoading || tprsLoading || txLoading;
  const hasDataError = hubsError || tprsError || txError;

  const sections = getExplorerSections(mode, hubData?.items, tprData?.items, txData?.items, riskOnly, appliedFilters);
  const scanStats = useMemo(() => {
    const hubs = hubData?.items || [];
    const tprs = tprData?.items || [];
    const txs = txData?.items || [];
    const networkScore = Math.round(Number(networkData?.kpis?.network_health_score || 0));
    const criticalIssues =
      hubs.filter((hub: any) => Number(hub.utilisation_pct || 0) >= 0.9).length +
      tprs.filter((tpr: any) => Number(tpr.current_workload || 0) / Math.max(1, Number(tpr.repair_capacity_per_day || 1)) >= 0.9).length +
      txs.filter((tx: any) => tx.sla_breach).length;
    const warnings =
      hubs.filter((hub: any) => Number(hub.utilisation_pct || 0) >= 0.75 && Number(hub.utilisation_pct || 0) < 0.9).length +
      txs.filter((tx: any) => !tx.sla_breach && Number(tx.transit_days_actual || 0) > Number(tx.transit_days_expected || 0)).length;
    const potentialSavings = Math.round(
      txs.reduce((sum: number, tx: any) => {
        const delay = Math.max(0, Number(tx.transit_days_actual || 0) - Number(tx.transit_days_expected || 0));
        return sum + Number(tx.logistics_cost_total_usd || 0) * Math.min(0.3, delay * 0.04);
      }, 0)
    );

    return {
      networkScore,
      objectsScanned: hubs.length + tprs.length + txs.length + Number(networkData?.links?.length || 0),
      criticalIssues,
      warnings,
      potentialSavings,
    };
  }, [hubData?.items, networkData?.kpis?.network_health_score, networkData?.links?.length, tprData?.items, txData?.items]);

  const allItems = useMemo(() => {
    return sections.flatMap((s) => s.items.map((it) => ({ ...it, __section: s })));
  }, [sections]);

  useEffect(() => {
    if (!selected && allItems.length > 0) {
      setSelected(allItems[0]);
      setSelectedSection(allItems[0].__section);
    }
  }, [allItems, selected]);


  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allItems.filter((it: any) => it.name.toLowerCase().includes(q)).slice(0, 6);
  }, [query, allItems]);

  const handleSelect = useCallback((obj: any, sec: any) => {
    setSelected(obj);
    setSelectedSection(sec || obj.__section);
    setWorkspaceNotice("");
  }, []);

  const switchMode = (m: string) => {
    if (m === mode) return;
    setMode(m);
    setSelected(null);
    setSelectedSection({ label: m === "forward" ? "Hubs" : "Repair Centers" });
    setQuery("");
    setWorkspaceNotice("");
  };

  const handleRefresh = () => {
    setRefreshSpin(true);
    refetchHubs();
    refetchTprs();
    refetchTransactions();
    refetchNetwork();
    setLastScanLabel(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    setTimeout(() => setRefreshSpin(false), 700);
  };

  const handleLocate = () => {
    if (!selected) return;
    setWorkspaceNotice(`${selected.name} is selected in the network overview. Use Map View or Flow View to inspect connected lanes.`);
  };

  const handleOpenAnalytics = () => {
    if (!selected) return;
    setWorkspaceNotice(`Analytics loaded from current backend metrics for ${selected.name}. Key health and cost indicators are shown in the workspace cards.`);
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: C.gray50, fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px);} to { opacity: 1; transform: translateY(0);} }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; }
      `}</style>

      {scanning && <ScanModal onClose={() => setScanning(false)} stats={scanStats} />}
      {passportOpen && <AiShipmentPassport onClose={() => setPassportOpen(false)} object={selected} />}

      {/* HEADER */}
      <div className="px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <div>
            <div className="text-[15px] font-semibold tracking-tight" style={{ color: C.gray900 }}>Operations Intelligence Center</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: hasDataError ? C.red : C.green }} />
              <span className="text-[11px] font-medium" style={{ color: hasDataError ? C.red : C.green }}>{hasDataError ? "API ISSUE" : isLoadingData ? "LOADING" : "LIVE"}</span>
              <span className="text-[11px]" style={{ color: C.gray400 }}> / Backend verified</span>
            </div>
          </div>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.gray400 }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hubs, shipments, routes, parts, customers..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-[13px] outline-none border focus:ring-2"
            style={{ borderColor: C.gray200, background: C.gray50, color: C.gray900 }}
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-xl border shadow-lg overflow-hidden z-30" style={{ borderColor: C.gray200 }}>
              {searchResults.map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => { handleSelect(r, r.__section); setQuery(""); }}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left"
                >
                  <span className="flex items-center gap-2 text-[12px]" style={{ color: C.gray900 }}>
                    <StatusDot score={r.score} /> {r.name}
                    <span style={{ color: C.gray400 }}>· {r.__section.label}</span>
                  </span>
                  <span className="text-[11px] font-semibold" style={{ color: scoreColor(r.score) }}>{r.score}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setScanning(true)}
            className="flex items-center gap-1.5 text-[13px] font-medium text-white px-3.5 py-2 rounded-xl transition-transform active:scale-95"
            style={{ background: C.blue }}
          >
            <Zap size={14} /> Scan Entire Network
          </button>
          <button onClick={handleRefresh} className="w-9 h-9 rounded-xl border flex items-center justify-center" style={{ borderColor: C.gray200 }}>
            <RefreshCw size={14} style={{ color: C.gray700, transition: "transform 0.7s", transform: refreshSpin ? "rotate(360deg)" : "rotate(0deg)" }} />
          </button>
          <button onClick={() => setRiskOnly((value) => !value)} className="w-9 h-9 rounded-xl border flex items-center justify-center" style={{ borderColor: riskOnly ? C.amber : C.gray200, background: riskOnly ? "#FEF3C7" : "white" }} title={riskOnly ? "Show all objects" : "Show risk objects only"}>
            <Filter size={14} style={{ color: riskOnly ? C.amber : C.gray700 }} />
          </button>
        </div>
      </div>

      {/* MODE TOGGLE */}
      <div className="px-6 pt-4">
        <div className="inline-flex p-1 rounded-xl" style={{ background: C.gray100 }}>
          {[
            { key: "forward", label: "Forward Logistics" },
            { key: "reverse", label: "Reverse Logistics" },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => switchMode(m.key)}
              className="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-300"
              style={{
                background: mode === m.key ? "white" : "transparent",
                color: mode === m.key ? C.gray900 : C.gray500,
                boxShadow: mode === m.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 grid gap-4 p-6" style={{ gridTemplateColumns: "340px minmax(0, 1fr)" }}>
        {/* LEFT EXPLORER */}
        <div className="bg-white rounded-2xl border p-3 shadow-sm flex flex-col" style={{ borderColor: C.gray200, maxHeight: "calc(100vh - 190px)" }}>
          <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.gray400 }}>Explorer</div>
          <div className="flex-1 overflow-y-auto">
            {hasDataError ? (
              <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-[12px] font-semibold text-red-700">
                Backend data did not load. Keep backend running on port 8000, then click refresh.
              </div>
            ) : isLoadingData ? (
              <div className="space-y-2 p-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : (
              <Explorer mode={mode} query={query} selected={selected} onSelect={handleSelect} sections={sections} />
            )}
          </div>
          <RadarStatus onScan={() => { setLastScanLabel(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })); setScanning(true); }} lastScanLabel={lastScanLabel} />
        </div>

        {/* CENTER */}
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 flex flex-col">
            <OperationsFilterBar 
              filters={filters} 
              setFilters={setFilters} 
              onApply={() => setAppliedFilters(filters)} 
              onReset={() => { setFilters(defaultFilters); setAppliedFilters(defaultFilters); }} 
            />
            <div className="flex-1">
              <NetworkOverview mode={mode} selectedId={selected?.id} onSelect={(o: any) => handleSelect(o, { label: "Hub" })} networkData={networkData} />
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: C.gray200, minHeight: 320 }}>
              <ObjectWorkspace
                object={selected}
                section={selectedSection}
                onOpenAnalytics={handleOpenAnalytics}
                onLocate={handleLocate}
                onOpenQR={() => setPassportOpen(true)}
                timeline={timeline}
                setTimeline={setTimeline}
              />
              {workspaceNotice && (
                <div className="mt-3 rounded-xl border px-3 py-2 text-[11px] font-semibold" style={{ borderColor: C.greenSoft, background: C.greenSoft, color: C.blue }}>
                  {workspaceNotice}
                </div>
              )}
            </div>
            <LiveDataStatus stats={scanStats} filtered={riskOnly} />
          </div>
        </div>
      </div>

      <div className="px-6 pb-3 pt-1 flex items-center justify-end text-[10px] font-medium" style={{ color: C.gray400 }}>
        Data last updated: 12 seconds ago <span className="ml-2 w-1.5 h-1.5 rounded-full bg-green-500 inline-block mr-1"></span> <span style={{ color: C.gray900 }}>Live</span>
      </div>

    </div>
  );
}
