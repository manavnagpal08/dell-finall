"use client"

import React, { useState } from "react"
import { Search, MapPin, Layers, Package, TrendingUp } from "lucide-react"

import { useGetHubs } from "@/services/queries"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/state/empty-state"
import { ErrorState } from "@/components/state/error-state"
import { formatPercent } from "@/lib/utils"

export default function HubsPage() {
  const [search, setSearch] = useState("")
  const [hubType, setHubType] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  const { data, isLoading, isError, refetch } = useGetHubs({
    search,
    hub_type: hubType,
    page,
    limit
  })

  // Color helper for utilization percentage
  const getUtilColor = (pct: number) => {
    if (pct >= 0.85) return "bg-rose-500 text-rose-700 bg-rose-50 border-rose-100"      // Critical/Congested
    if (pct >= 0.60) return "bg-amber-500 text-amber-700 bg-amber-50 border-amber-100"  // High
    return "bg-emerald-500 text-emerald-700 bg-emerald-50 border-emerald-100"          // Optimal
  };

  const getUtilBarColor = (pct: number) => {
    if (pct >= 0.85) return "bg-rose-500"
    if (pct >= 0.60) return "bg-amber-500"
    return "bg-emerald-500"
  };

  return (
    <div className="space-y-6 select-none">
      <PageHeader 
        title="Logistics Hubs" 
        description="Monitor network nodes, storage capacities, and stock levels."
      />

      {/* Toolbar Filter */}
      <div className="bg-white rounded-xl border border-brand-gray-med p-4 shadow-premium flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-brand-text-muted" />
          <input
            type="text"
            placeholder="Search hub name, ID, city, country..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-10 w-full pl-9 pr-4 rounded-xl border border-brand-gray-med bg-slate-50/50 text-sm outline-none focus:bg-white focus:border-brand-primary focus:ring-1 focus:ring-blue-100 transition-all text-slate-800"
          />
        </div>

        {/* Hub Type */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-brand-text-muted font-semibold uppercase">Filter Type:</span>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-brand-gray-med">
            {[
              { label: "All", value: "" },
              { label: "Primary", value: "Primary" },
              { label: "Regional", value: "Regional" },
              { label: "Satellite", value: "Satellite" },
              { label: "International", value: "International" }
            ].map((t) => (
              <button
                key={t.label}
                onClick={() => { setHubType(t.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  hubType === t.value 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hub Grid list */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-brand-gray-med p-6 rounded-xl shadow-premium space-y-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-2 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={refetch} description="Failed to retrieve hubs listing." />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No hubs found" description="Try clearing filters or search queries." />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((hub) => {
            const utilPercent = hub.utilisation_pct
            
            return (
              <Card key={hub.hub_id} className="flex flex-col justify-between">
                <div>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                    <div className="space-y-0.5">
                      <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">{hub.hub_id}</span>
                      <CardTitle className="text-base font-bold text-slate-900 mt-1">{hub.hub_name}</CardTitle>
                    </div>
                    <Badge variant={hub.hub_type === "Primary" ? "info" : hub.hub_type === "International" ? "error" : "neutral"}>
                      {hub.hub_type}
                    </Badge>
                  </CardHeader>
                  
                  <CardContent className="pt-2 space-y-4">
                    {/* Location */}
                    <div className="flex items-center text-xs text-brand-text-muted font-medium">
                      <MapPin className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                      <span>{hub.city}, {hub.country}</span>
                    </div>

                    {/* Stock level indicators */}
                    <div className="grid grid-cols-2 gap-4 border-y border-brand-gray-med py-3 text-slate-800">
                      <div>
                        <span className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-wider flex items-center">
                          <Package className="h-3 w-3 mr-1 text-slate-400" /> Current Stock
                        </span>
                        <span className="block text-base font-extrabold mt-1 text-slate-900">{hub.current_stock_level.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-wider flex items-center">
                          <Layers className="h-3 w-3 mr-1 text-slate-400" /> Capacity Limit
                        </span>
                        <span className="block text-base font-extrabold mt-1 text-slate-900">{hub.inventory_capacity.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Progress Bar of Stock utilization */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-brand-text-muted uppercase tracking-wider text-[10px] flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1 text-slate-400" /> Storage Utilisation
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold ${getUtilColor(utilPercent)}`}>
                          {formatPercent(utilPercent * 100)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${getUtilBarColor(utilPercent)}`} 
                          style={{ width: `${Math.min(utilPercent * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
