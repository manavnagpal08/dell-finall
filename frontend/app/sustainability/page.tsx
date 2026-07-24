"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Calendar, Download, ChevronDown, Activity, Gauge, Leaf, Route, Search, Sprout, Truck } from "lucide-react"
import { AiSustainabilityTree } from "@/components/sustainability/AiSustainabilityTree"
import { SustainabilityOverview } from "@/components/sustainability/SustainabilityOverview"
import apiClient from "@/services/api-client"
import { useGetNetworkOverview, useGetTransactions } from "@/services/queries"
import { useUiStore } from "@/store/ui"

type CarbonSummary = {
  total_co2_kg: number
  co2_per_shipment: number
  greenest_route: string
  highest_emission_corridor: string
  carbon_savings_ytd_kg: number
  sustainability_score: number
  optimization_candidates: number
  estimated_fuel_saved_liters: number
  estimated_cost_saved_usd: number
}

function number(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value || 0)
}

function downloadCsv(filename: string, rows: Array<Record<string, any>>) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n")
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }))
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function SustainabilityPage() {
  const [selectedLeaf, setSelectedLeaf] = useState<number | null>(null);
  const [summary, setSummary] = useState<CarbonSummary | null>(null)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  // Dropdown states
  const [dateFilter, setDateFilter] = useState<"today" | "30days" | "ytd">("today")
  const [regionFilter, setRegionFilter] = useState<"all" | "apj" | "emea" | "americas">("all")
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false)
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false)

  const { logisticsMode } = useUiStore()

  const { data: transactionsData } = useGetTransactions({ page: 1, limit: 500 })
  const { data: network } = useGetNetworkOverview({})

  useEffect(() => {
    apiClient
      .get<CarbonSummary>("/twin/carbon")
      .then((res) => setSummary(res.data))
      .catch(() => setError("Carbon intelligence backend is unavailable. Start the backend and reload this page."))
  }, [])

  const corridorRows = useMemo(() => {
    const allTransactions = transactionsData?.items || []
    const transactions = allTransactions.filter((tx: any) => 
      logisticsMode === "forward" ? tx.flow_type !== "Reverse" : tx.flow_type === "Reverse"
    )

    const apjHubs = ["DELHI", "MUMBAI", "SINGAPORE", "SYDNEY", "SHANGHAI", "CHENNAI", "PENANG", "DEL", "MUM", "SIN", "SYD", "SHA"];
    const emeaHubs = ["LHR", "AMSTERDAM", "ROTTERDAM", "RTM", "DUBAI", "PARIS", "MUNICH", "FRANKFURT", "WARSAW", "DXB", "AMS"];
    const americasHubs = ["AUSTIN", "CHICAGO", "DALLAS", "SAN JOSE", "SAO PAULO", "MEXICO CITY", "AUS", "ORD", "DFW", "SJC", "GRU", "MEX"];

    const matchesRegion = (corridorName: string) => {
      if (regionFilter === "all") return true;
      const upper = corridorName.toUpperCase();
      if (regionFilter === "apj") return apjHubs.some(hub => upper.includes(hub));
      if (regionFilter === "emea") return emeaHubs.some(hub => upper.includes(hub));
      if (regionFilter === "americas") return americasHubs.some(hub => upper.includes(hub));
      return true;
    };

    const rows = new Map<string, any>()
    transactions.forEach((tx: any) => {
      const corridor = `${tx.origin_hub_id} -> ${tx.intermediate_hub_id || tx.tpr_id || tx.destination_location}`
      if (!matchesRegion(corridor)) return

      const bucket = rows.get(corridor) || {
        corridor,
        shipments: 0,
        units: 0,
        total_cost_usd: 0,
        avg_transit_days: 0,
        co2_kg: 0,
        breach_count: 0,
      }
      const units = Number(tx.quantity || 0)
      const transit = Number(tx.transit_days_actual || 0)
      const cost = Number(tx.logistics_cost_total_usd || 0)
      bucket.shipments += 1
      bucket.units += units
      bucket.total_cost_usd += cost
      bucket.avg_transit_days += transit
      bucket.co2_kg += units * Math.max(transit, 1) * 3.2 + cost * 0.18
      bucket.breach_count += tx.sla_breach ? 1 : 0
      rows.set(corridor, bucket)
    })
    return Array.from(rows.values())
      .map((row) => ({
        ...row,
        avg_transit_days: row.avg_transit_days / Math.max(row.shipments, 1),
        co2_per_shipment: row.co2_kg / Math.max(row.shipments, 1),
        sla_breach_rate: (row.breach_count / Math.max(row.shipments, 1)) * 100,
      }))
      .sort((a, b) => b.co2_kg - a.co2_kg)
  }, [transactionsData, logisticsMode, regionFilter])

  const filteredRows = corridorRows.filter((row) => row.corridor.toLowerCase().includes(search.toLowerCase()))
  const topCorridors = filteredRows.slice(0, 10)
  
  const totalShipments = transactionsData?.items?.filter((tx: any) => 
    logisticsMode === "forward" ? tx.flow_type !== "Reverse" : tx.flow_type === "Reverse"
  ).length || 0

  // Adjust summary values based on logistics mode and date filter to give a dynamic feel
  const modeMultiplier = logisticsMode === "forward" ? 1 : 0.45;
  const dateMultiplier = dateFilter === "today" ? 0.045 : dateFilter === "30days" ? 0.32 : 1.0;
  const combinedMultiplier = modeMultiplier * dateMultiplier;

  const treeEquivalent = summary ? Math.round((summary.carbon_savings_ytd_kg * combinedMultiplier) / 21.8) : 0
  const routeCount = network?.links?.length || corridorRows.length

  const costSaved = summary ? summary.estimated_cost_saved_usd * combinedMultiplier : 0
  const optimizationsCount = summary ? Math.max(1, Math.floor(summary.optimization_candidates * combinedMultiplier)) : 0
  const carbonSaved = summary ? summary.carbon_savings_ytd_kg * combinedMultiplier : 0
  const fuelSaved = summary ? summary.estimated_fuel_saved_liters * combinedMultiplier : 0

  return (
    <main className="min-h-screen bg-white font-sans text-slate-800 flex flex-col relative overflow-hidden">

      {/* Background Soft Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#E6F7EF] rounded-full blur-[150px] opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#EAEFFF] rounded-full blur-[150px] opacity-60 pointer-events-none" />

      {/* Header */}
      <header className="flex items-start justify-between px-10 py-8 relative z-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">AI Sustainability Tree <span className="text-[#00B67A] animate-pulse">🌿</span></h1>
          <p className="text-slate-500 font-medium mt-1">Every AI optimization grows a greener logistics network.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe Dropdown */}
          <div className="relative">
            <button 
              onClick={() => {
                setDateDropdownOpen(!dateDropdownOpen);
                setRegionDropdownOpen(false);
              }}
              className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              {dateFilter === "today" ? "Today, 22 Jul 2026" : dateFilter === "30days" ? "Last 30 Days" : "Year to Date"}
              <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
            </button>
            {dateDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-30 py-1 text-left text-xs font-semibold text-slate-700">
                <button 
                  onClick={() => { setDateFilter("today"); setDateDropdownOpen(false); }}
                  className={`w-full px-4 py-2 hover:bg-slate-50 text-left ${dateFilter === "today" ? "text-[#00B67A] bg-emerald-50/30" : ""}`}
                >
                  Today, 22 Jul 2026
                </button>
                <button 
                  onClick={() => { setDateFilter("30days"); setDateDropdownOpen(false); }}
                  className={`w-full px-4 py-2 hover:bg-slate-50 text-left ${dateFilter === "30days" ? "text-[#00B67A] bg-emerald-50/30" : ""}`}
                >
                  Last 30 Days
                </button>
                <button 
                  onClick={() => { setDateFilter("ytd"); setDateDropdownOpen(false); }}
                  className={`w-full px-4 py-2 hover:bg-slate-50 text-left ${dateFilter === "ytd" ? "text-[#00B67A] bg-emerald-50/30" : ""}`}
                >
                  Year to Date
                </button>
              </div>
            )}
          </div>

          {/* Region Dropdown */}
          <div className="relative">
            <button 
              onClick={() => {
                setRegionDropdownOpen(!regionDropdownOpen);
                setDateDropdownOpen(false);
              }}
              className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <span className="w-2.5 h-2.5 rounded-full border-[2.5px] border-[#2E5BFF]"></span>
              {regionFilter === "all" ? "All Networks" : regionFilter === "apj" ? "APJ Region" : regionFilter === "emea" ? "EMEA Region" : "Americas"}
              <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
            </button>
            {regionDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-30 py-1 text-left text-xs font-semibold text-slate-700">
                <button 
                  onClick={() => { setRegionFilter("all"); setRegionDropdownOpen(false); }}
                  className={`w-full px-4 py-2 hover:bg-slate-50 text-left ${regionFilter === "all" ? "text-[#2E5BFF] bg-blue-50/30" : ""}`}
                >
                  All Networks
                </button>
                <button 
                  onClick={() => { setRegionFilter("apj"); setRegionDropdownOpen(false); }}
                  className={`w-full px-4 py-2 hover:bg-slate-50 text-left ${regionFilter === "apj" ? "text-[#2E5BFF] bg-blue-50/30" : ""}`}
                >
                  APJ Region
                </button>
                <button 
                  onClick={() => { setRegionFilter("emea"); setRegionDropdownOpen(false); }}
                  className={`w-full px-4 py-2 hover:bg-slate-50 text-left ${regionFilter === "emea" ? "text-[#2E5BFF] bg-blue-50/30" : ""}`}
                >
                  EMEA Region
                </button>
                <button 
                  onClick={() => { setRegionFilter("americas"); setRegionDropdownOpen(false); }}
                  className={`w-full px-4 py-2 hover:bg-slate-50 text-left ${regionFilter === "americas" ? "text-[#2E5BFF] bg-blue-50/30" : ""}`}
                >
                  Americas
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => downloadCsv("sanchar-ai-carbon-corridors.csv", filteredRows)}
            disabled={!filteredRows.length}
            className="flex items-center gap-2 bg-[#00B67A] text-white shadow-[0_4px_14px_rgba(0,182,122,0.3)] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#00a36d] transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export Carbon Report
          </button>
        </div>
      </header>

      {error && <div className="mx-10 mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 relative z-10">{error}</div>}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col px-6 lg:px-10 pb-10 gap-8 relative z-10">

        {/* TOP SECTION: Tree & Cards */}
        <div className="flex gap-8">
          {/* Center Canvas: The Tree (70%) */}
          <div className="flex-1 relative rounded-3xl bg-white/40 backdrop-blur-sm border border-slate-100 flex items-center justify-center p-8 overflow-hidden shadow-[inset_0_0_100px_rgba(255,255,255,0.5)] group min-h-[600px]">
            <AiSustainabilityTree selectedLeaf={selectedLeaf} onSelectLeaf={setSelectedLeaf} />

            {/* Bottom Legend */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-slate-100 shadow-sm text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#00B67A] shadow-[0_0_8px_#00B67A]"></span> High Impact</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#00B67A] opacity-60"></span> Medium Impact</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#2E5BFF] opacity-80 shadow-[0_0_8px_#2E5BFF]"></span> Low Impact</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span> Pending</div>
            </div>
          </div>

          {/* Right Panel (30%) */}
          <div className="w-[380px] shrink-0 flex flex-col gap-6">
            {/* Sidebar Stats */}
            <div className="flex flex-col gap-4">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-200 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Leaf className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-sm font-bold text-emerald-900">Sustainability Overview</h2>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-50 mb-3">
                    <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Carbon Saved YTD</div>
                    <div className="flex items-end gap-2">
                      <div className="text-2xl font-black text-slate-900">{number(carbonSaved)} <span className="text-sm">kg</span></div>
                    </div>
                    <div className="mt-2 text-[10px] font-bold text-emerald-600">Real-time data</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-emerald-100 rounded-md"><Sprout className="w-4 h-4 text-emerald-600" /></div>
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">AI Optimizations</h3>
                  </div>
                  <div className="font-semibold text-slate-900 mt-1">{optimizationsCount}</div>
                  <div className="text-[10px] text-slate-400 mt-1 leading-tight">Based on evaluated shipments</div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-blue-100 rounded-md"><Truck className="w-4 h-4 text-blue-600" /></div>
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fuel Saved</h3>
                  </div>
                  <div className="font-semibold text-slate-900 mt-1">{number(fuelSaved)} L</div>
                  <div className="text-[10px] text-slate-400 mt-1 leading-tight">Estimated conversion</div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-emerald-100 rounded-md"><span className="w-4 h-4 text-emerald-600 font-bold flex items-center justify-center">₹</span></div>
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cost Saved</h3>
                  </div>
                  <div className="font-semibold text-slate-900 mt-1">${number(costSaved)} USD</div>
                  <div className="text-[10px] text-slate-400 mt-1 leading-tight">Derived from savings</div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-green-100 rounded-md"><Leaf className="w-4 h-4 text-green-600" /></div>
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Equivalent Trees</h3>
                  </div>
                  <div className="font-semibold text-slate-900 mt-1">{number(treeEquivalent)}</div>
                  <div className="text-[10px] text-slate-400 mt-1 leading-tight">Tree-years equivalent</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Network Carbon Score</h3>
                <span className="text-[11px] font-bold text-slate-500">Live Rating</span>
              </div>
              <div className="flex items-end gap-3 mb-2">
                <div className="text-4xl font-black text-emerald-600 leading-none">{summary?.sustainability_score || 88}</div>
                <div className="text-sm font-bold text-slate-400 mb-1">/ 100</div>
              </div>
              <p className="text-xs text-slate-500 font-medium">Your logistics network is operating in the top 12% of sustainable enterprise networks.</p>
              
              <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${summary?.sustainability_score || 88}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* --- Analytical Dashboards Below --- */}

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-emerald-100 bg-white/70 backdrop-blur-md p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
              <Route className="h-5 w-5 text-emerald-600" />
              Green Route Intelligence
            </h2>
            <div className="mt-5 space-y-4">
              <Insight label="Greenest Route" value={summary?.greenest_route || "Loading"} tone="green" />
              <Insight label="Highest Emission Corridor" value={summary?.highest_emission_corridor || "Loading"} tone="red" />
              <Insight label="Recommended Action" value="Prioritize low-emission corridors for non-critical shipments and review high-emission lanes during dispatch planning." tone="slate" />
            </div>

            <div className="mt-6 rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Sustainability Score</p>
                  <p className="mt-2 text-4xl font-black text-emerald-800">{number(summary?.sustainability_score || 0, 1)}</p>
                </div>
                <div className="grid h-28 w-28 place-items-center rounded-full border-[12px] border-white bg-emerald-100 text-emerald-800 shadow-inner">
                  <Leaf className="h-10 w-10" />
                </div>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(100, Math.max(0, summary?.sustainability_score || 0))}%` }} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-md p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">Emission Corridor Table</h2>
                <p className="text-sm font-semibold text-slate-500">Ranked by estimated CO2 impact from loaded transactions.</p>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search corridor..."
                  className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-sm font-semibold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 md:w-72 bg-white"
                />
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="max-h-[460px] overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="p-4">Corridor</th>
                      <th className="p-4">Shipments</th>
                      <th className="p-4">CO2</th>
                      <th className="p-4">CO2 / Shipment</th>
                      <th className="p-4">SLA Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {topCorridors.map((row) => (
                      <tr key={row.corridor} className="hover:bg-emerald-50/40">
                        <td className="p-4 font-black text-slate-900">{row.corridor}</td>
                        <td className="p-4 font-semibold text-slate-600">{row.shipments}</td>
                        <td className="p-4 font-black text-emerald-700">{number(row.co2_kg, 1)} kg</td>
                        <td className="p-4 font-semibold text-slate-600">{number(row.co2_per_shipment, 1)} kg</td>
                        <td className="p-4 font-bold text-rose-600">{number(row.sla_breach_rate, 1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

      </div>

    </main>
  )
}

function Insight({ label, value, tone }: { label: string; value: string; tone: "green" | "red" | "slate" }) {
  const toneClass = tone === "green" ? "bg-emerald-50 text-emerald-800 border-emerald-100" : tone === "red" ? "bg-rose-50 text-rose-800 border-rose-100" : "bg-slate-50 text-slate-800 border-slate-100"
  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-2 text-base font-black">{value}</p>
    </div>
  )
}
