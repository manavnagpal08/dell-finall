"use client"

import React, { useState } from "react"
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  Eye, 
  X,
  FileText,
  Calendar,
  DollarSign,
  AlertTriangle,
  User,
  Truck
} from "lucide-react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { useGetTransactions, useGetTransactionDetail } from "@/services/queries"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { EmptyState } from "@/components/state/empty-state"
import { ErrorState } from "@/components/state/error-state"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function TransactionsPage() {
  // Page queries state
  const [search, setSearch] = useState("")
  const [flowType, setFlowType] = useState("")
  const [priority, setPriority] = useState("")
  const [slaBreach, setSlaBreach] = useState<boolean | null>(null)
  const [tamperFlag, setTamperFlag] = useState("")
  const [status, setStatus] = useState("")
  
  const [page, setPage] = useState(1)
  const [limit] = useState(15)
  const [sortBy, setSortBy] = useState<string>("dispatch_date")
  const [sortOrder, setSortOrder] = useState<string>("desc")

  // Selected transaction ID for modal view
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useGetTransactions({
    search,
    flow_type: flowType,
    priority,
    sla_breach: slaBreach,
    tamper_flag: tamperFlag,
    status,
    page,
    limit,
    sort_by: sortBy,
    sort_order: sortOrder
  })

  // Toggle sorting on column
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
    setPage(1)
  }

  // Clear all filters
  const resetFilters = () => {
    setSearch("")
    setFlowType("")
    setPriority("")
    setSlaBreach(null)
    setTamperFlag("")
    setStatus("")
    setPage(1)
  }

  return (
    <div className="space-y-6 select-none">
      <PageHeader 
        title="Transactions Log" 
        description="Fuzzy search, filter, and inspect detailed ledger transactions."
        actions={
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Reset Filters
          </Button>
        }
      />

      {/* Filter Toolbar Card */}
      <div className="bg-white rounded-xl border border-brand-gray-med p-4 shadow-premium grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-6 items-center">
        {/* Search Bar */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-brand-text-muted" />
          <input
            type="text"
            placeholder="Search TXN, Part, Carrier, City..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-10 w-full pl-9 pr-4 rounded-xl border border-brand-gray-med bg-slate-50/50 text-sm outline-none focus:bg-white focus:border-brand-primary focus:ring-1 focus:ring-blue-100 transition-all text-slate-800"
          />
        </div>

        {/* Flow Type Filter */}
        <div>
          <select
            value={flowType}
            onChange={(e) => { setFlowType(e.target.value); setPage(1); }}
            className="h-10 w-full px-3 rounded-xl border border-brand-gray-med bg-slate-50/50 text-sm outline-none text-slate-700"
          >
            <option value="">All Flow Types</option>
            <option value="Forward">Forward Logistics</option>
            <option value="Reverse">Reverse Logistics</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <select
            value={priority}
            onChange={(e) => { setPriority(e.target.value); setPage(1); }}
            className="h-10 w-full px-3 rounded-xl border border-brand-gray-med bg-slate-50/50 text-sm outline-none text-slate-700"
          >
            <option value="">All Priorities</option>
            <option value="P1">P1 (Critical)</option>
            <option value="P2">P2 (High)</option>
            <option value="P3">P3 (Medium)</option>
            <option value="P4">P4 (Low)</option>
          </select>
        </div>

        {/* SLA Breach Filter */}
        <div>
          <select
            value={slaBreach === null ? "" : slaBreach ? "true" : "false"}
            onChange={(e) => {
              const val = e.target.value
              setSlaBreach(val === "" ? null : val === "true")
              setPage(1)
            }}
            className="h-10 w-full px-3 rounded-xl border border-brand-gray-med bg-slate-50/50 text-sm outline-none text-slate-700"
          >
            <option value="">All SLA Statuses</option>
            <option value="true">Breached</option>
            <option value="false">On Time</option>
          </select>
        </div>

        {/* Tamper Alert Filter */}
        <div>
          <select
            value={tamperFlag}
            onChange={(e) => { setTamperFlag(e.target.value); setPage(1); }}
            className="h-10 w-full px-3 rounded-xl border border-brand-gray-med bg-slate-50/50 text-sm outline-none text-slate-700"
          >
            <option value="">All Security Flags</option>
            <option value="CLEAR">Clear</option>
            <option value="TAMPER_ALERT">Tamper Alert</option>
            <option value="RECHECK">Recheck Needed</option>
          </select>
        </div>
      </div>

      {/* Transactions Table Section */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={refetch} description="Failed to retrieve transaction history." />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No transactions match filters" description="Try clearing some search or filter configurations." />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">
                  <button className="flex items-center space-x-1 hover:text-slate-900" onClick={() => handleSort("transaction_id")}>
                    <span>Transaction</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Flow</TableHead>
                <TableHead>Part No</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">
                  <button className="inline-flex items-center space-x-1 hover:text-slate-900" onClick={() => handleSort("total_cost_usd")}>
                    <span>Total Cost</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button className="flex items-center space-x-1 hover:text-slate-900" onClick={() => handleSort("dispatch_date")}>
                    <span>Dispatch Date</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Security</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((tx) => (
                <TableRow 
                  key={tx.transaction_id}
                  className="cursor-pointer hover:bg-slate-50/70"
                  onClick={() => setSelectedTxId(tx.transaction_id)}
                >
                  <TableCell className="font-mono text-xs font-bold text-brand-primary">{tx.transaction_id}</TableCell>
                  <TableCell>
                    <Badge variant={tx.flow_type === "Forward" ? "info" : "success"}>
                      {tx.flow_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">{tx.part_no}</TableCell>
                  <TableCell className="text-xs max-w-[120px] truncate">{tx.source_location}</TableCell>
                  <TableCell className="text-xs max-w-[120px] truncate">{tx.destination_location}</TableCell>
                  <TableCell className="text-xs text-slate-500">{tx.logistics_partner}</TableCell>
                  <TableCell className="text-right font-medium">{tx.quantity}</TableCell>
                  <TableCell className="text-right font-semibold text-slate-900">{formatCurrency(tx.total_cost_usd)}</TableCell>
                  <TableCell className="text-xs">{formatDate(tx.dispatch_date)}</TableCell>
                  <TableCell>
                    <Badge variant={tx.sla_breach ? "error" : "success"}>
                      {tx.sla_breach ? "Breach" : "On Time"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.tamper_flag === "CLEAR" ? "neutral" : tx.tamper_flag === "TAMPER_ALERT" ? "error" : "warning"}>
                      {tx.tamper_flag}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400">
                    <Eye className="h-4 w-4" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
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

      {/* Transaction Detailed View Dialog using Radix Primitive */}
      <DialogPrimitive.Root 
        open={selectedTxId !== null} 
        onOpenChange={(open) => { if (!open) setSelectedTxId(null); }}
      >
        <DialogPrimitive.Portal>
          {/* Overlay background */}
          <DialogPrimitive.Overlay className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-sm animate-fade-in" />
          
          {/* Modal Content container */}
          <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-40 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-brand-gray-med bg-white shadow-premium p-6 outline-none animate-slide-up max-h-[85vh] overflow-y-auto">
            {selectedTxId && (
              <TransactionDetailModalContent 
                transactionId={selectedTxId} 
                onClose={() => setSelectedTxId(null)} 
              />
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  )
}

/* Helper Component for Detailed View in Dialog */
function TransactionDetailModalContent({ 
  transactionId, 
  onClose 
}: { 
  transactionId: string
  onClose: () => void 
}) {
  const { data: tx, isLoading, isError } = useGetTransactionDetail(transactionId)

  if (isLoading) {
    return (
      <div className="space-y-6 select-none">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-1/3" />
          <button className="text-slate-400 hover:text-slate-600" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  if (isError || !tx) {
    return (
      <div className="text-center p-6 space-y-4">
        <AlertTriangle className="h-12 w-12 text-brand-error mx-auto" />
        <h3 className="text-base font-semibold">Error Loading Details</h3>
        <p className="text-xs text-brand-text-muted">Could not retrieve extended records for {transactionId}.</p>
        <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 select-none">
      {/* Dialog Header */}
      <div className="flex items-center justify-between border-b border-brand-gray-med pb-4">
        <div>
          <DialogPrimitive.Title className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>Transaction Reference:</span>
            <span className="font-mono text-brand-primary">{tx.transaction_id}</span>
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="text-xs text-brand-text-muted mt-0.5">
            Logistics flow trace and master relations parameters
          </DialogPrimitive.Description>
        </div>
        <button 
          className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        {/* Core Attributes */}
        <div className="space-y-4">
          <div className="border border-brand-gray-med rounded-xl p-4 space-y-3 bg-slate-50/50">
            <h4 className="text-xs font-semibold text-brand-text-muted uppercase flex items-center"><FileText className="h-3.5 w-3.5 mr-1.5" /> Core Parameters</h4>
            
            <div className="flex justify-between">
              <span className="text-slate-500">Flow Pattern:</span>
              <span className="font-semibold text-slate-900">{tx.flow_type} Logistics</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Priority Level:</span>
              <span className="font-semibold text-slate-900">{tx.priority}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction Status:</span>
              <span className="font-semibold text-brand-primary capitalize">{tx.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">QR Code Identifier:</span>
              <span className="font-mono font-semibold text-slate-700 text-xs">{tx.qr_code_id}</span>
            </div>
          </div>

          <div className="border border-brand-gray-med rounded-xl p-4 space-y-3 bg-slate-50/50">
            <h4 className="text-xs font-semibold text-brand-text-muted uppercase flex items-center"><Truck className="h-3.5 w-3.5 mr-1.5" /> Shipment & Cost</h4>
            
            <div className="flex justify-between">
              <span className="text-slate-500">Logistics Carrier:</span>
              <span className="font-semibold text-slate-900">{tx.logistics_partner}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Shipped Quantity:</span>
              <span className="font-semibold text-slate-900">{tx.quantity} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Parts Value:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(tx.parts_value_usd)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Logistics Cost:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(tx.logistics_cost_total_usd)}</span>
            </div>
            <div className="flex justify-between border-t border-brand-gray-med pt-2 mt-2">
              <span className="font-bold text-slate-950">Total Value:</span>
              <span className="font-bold text-brand-primary">{formatCurrency(tx.total_cost_usd)}</span>
            </div>
          </div>
        </div>

        {/* Schedule & Relational Nodes */}
        <div className="space-y-4">
          <div className="border border-brand-gray-med rounded-xl p-4 space-y-3 bg-slate-50/50">
            <h4 className="text-xs font-semibold text-brand-text-muted uppercase flex items-center"><Calendar className="h-3.5 w-3.5 mr-1.5" /> Schedule Timeline</h4>
            
            <div className="flex justify-between">
              <span className="text-slate-500">Dispatched:</span>
              <span className="font-semibold text-slate-900">{formatDate(tx.dispatch_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Expected Delivery:</span>
              <span className="font-semibold text-slate-900">{formatDate(tx.expected_delivery_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Actual Delivery:</span>
              <span className="font-semibold text-slate-900">{formatDate(tx.actual_delivery_date)}</span>
            </div>
            <div className="flex justify-between border-t border-brand-gray-med pt-2 mt-2">
              <span className="text-slate-500">Actual vs Expected:</span>
              <span className="font-semibold text-slate-900">{tx.transit_days_actual} / {tx.transit_days_expected} days</span>
            </div>
          </div>

          {/* Master parts metadata */}
          {tx.part && (
            <div className="border border-brand-gray-med rounded-xl p-4 space-y-3 bg-slate-50/50">
              <h4 className="text-xs font-semibold text-brand-text-muted uppercase flex items-center"><User className="h-3.5 w-3.5 mr-1.5" /> Part Details</h4>
              
              <div className="flex justify-between">
                <span className="text-slate-500">SKU Description:</span>
                <span className="font-semibold text-slate-900 max-w-[150px] truncate" title={tx.part.part_description}>
                  {tx.part.part_description}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-900">{tx.part.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Weight & Fragile:</span>
                <span className="font-semibold text-slate-900">
                  {tx.part.weight_kg.toFixed(1)}kg | {tx.part.fragile ? "Fragile" : "Robust"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alert Banner for Inefficiencies if SLA is breached */}
      {tx.sla_breach && (
        <div className="border border-rose-200 bg-rose-50/30 rounded-xl p-4 flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-brand-error flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-rose-800">SLA Breach Detected</h5>
            <p className="text-[11px] text-rose-700 mt-1 leading-relaxed">
              This shipment exceeded its expected transit timeline by <span className="font-bold">{tx.transit_days_actual - tx.transit_days_expected} days</span>. 
              Review the routing corridor in subsequent phases to optimize transit schedules.
            </p>
          </div>
        </div>
      )}

      {/* Dialog Footer Actions */}
      <div className="flex items-center justify-end space-x-3 border-t border-brand-gray-med pt-4">
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}
