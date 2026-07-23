"use client"

import React, { useState } from "react"
import { Search, ChevronLeft, ChevronRight, AlertTriangle, ShieldCheck } from "lucide-react"

import { useGetParts } from "@/services/queries"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { EmptyState } from "@/components/state/empty-state"
import { ErrorState } from "@/components/state/error-state"
import { formatCurrency } from "@/lib/utils"

export default function PartsPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(15)

  const { data, isLoading, isError, refetch } = useGetParts({
    search,
    category,
    page,
    limit
  })

  return (
    <div className="space-y-6 select-none">
      <PageHeader 
        title="Parts Catalog" 
        description="Master database of hardware parts, cost parameters, and storage guidelines."
      />

      {/* Toolbar filters */}
      <div className="bg-white rounded-xl border border-brand-gray-med p-4 shadow-premium flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-brand-text-muted" />
          <input
            type="text"
            placeholder="Search Part No, description, category..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-10 w-full pl-9 pr-4 rounded-xl border border-brand-gray-med bg-slate-50/50 text-sm outline-none focus:bg-white focus:border-brand-primary focus:ring-1 focus:ring-blue-100 transition-all text-slate-800"
          />
        </div>

        {/* Category filters */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-brand-text-muted font-semibold uppercase">Category Filter:</span>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="h-10 px-3 rounded-xl border border-brand-gray-med bg-slate-50/50 text-sm outline-none text-slate-700"
          >
            <option value="">All Categories</option>
            <option value="Compute">Compute</option>
            <option value="Storage">Storage</option>
            <option value="Networking">Networking</option>
            <option value="Power">Power</option>
            <option value="Display">Display</option>
            <option value="Cooling">Cooling</option>
            <option value="Peripheral">Peripheral</option>
            <option value="Chassis">Chassis</option>
          </select>
        </div>
      </div>

      {/* Table content */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={refetch} description="Failed to retrieve parts catalog listing." />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No parts found" description="Try refining search criteria or filters." />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Part Number</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Weight (Kg)</TableHead>
                <TableHead className="text-right">Volume (cm³)</TableHead>
                <TableHead className="text-right">Lead Time</TableHead>
                <TableHead className="text-right">Min Stock</TableHead>
                <TableHead className="text-right">Reorder Qty</TableHead>
                <TableHead className="text-center">Handling Flags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((part) => (
                <TableRow key={part.part_no}>
                  <TableCell className="font-mono text-xs font-bold text-brand-primary">{part.part_no}</TableCell>
                  <TableCell className="font-medium text-slate-800">{part.part_description}</TableCell>
                  <TableCell>{part.category}</TableCell>
                  <TableCell className="text-right font-semibold text-slate-900">{formatCurrency(part.unit_cost_usd)}</TableCell>
                  <TableCell className="text-right">{part.weight_kg.toFixed(2)} Kg</TableCell>
                  <TableCell className="text-right">{part.volume_cm3.toLocaleString()} cm³</TableCell>
                  <TableCell className="text-right font-medium text-slate-600">{part.lead_time_days} days</TableCell>
                  <TableCell className="text-right">{part.min_stock_level}</TableCell>
                  <TableCell className="text-right">{part.reorder_quantity}</TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex space-x-1.5 justify-center w-full">
                      {part.fragile && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase" title="Fragile Item">
                          Fragile
                        </span>
                      )}
                      {part.hazardous && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-brand-error border border-rose-100 uppercase" title="Hazardous Material">
                          Hazardous
                        </span>
                      )}
                      {!part.fragile && !part.hazardous && (
                        <span title="Standard Handling">
                          <ShieldCheck className="h-4 w-4 text-slate-400" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination controls */}
          <div className="flex items-center justify-between pt-4">
            <span className="text-xs text-brand-text-muted">
              Showing <span className="font-semibold text-slate-800">{((page - 1) * limit) + 1}</span> to{" "}
              <span className="font-semibold text-slate-800">{Math.min(page * limit, data.total)}</span> of{" "}
              <span className="font-semibold text-slate-800">{data.total}</span> entries
            </span>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <div className="text-xs font-semibold text-slate-700 px-3">
                Page {page} of {Math.ceil(data.total / limit) || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(p + 1, Math.ceil(data.total / limit)))}
                disabled={page >= Math.ceil(data.total / limit)}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
