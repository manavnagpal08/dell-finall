"use client"

import React, { useState, useEffect, useRef } from "react"
import { Search, MapPin, Truck, Package, Wrench, FileText, ChevronRight, X, Clock, Star } from "lucide-react"
import { useGetHubs, useGetTPRs, useGetParts, useGetTransactions } from "@/services/queries"
import { WorkspaceNode } from "@/hooks/use-workspace-state"

interface GlobalSearchProps {
  onSelect: (node: WorkspaceNode) => void
}

export function GlobalSearch({ onSelect }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Queries
  const searchEnabled = debouncedQuery.length > 1
  const { data: hubsData, isLoading: loadingHubs } = useGetHubs({ search: debouncedQuery, page: 1, limit: 5 })
  const { data: tprsData, isLoading: loadingTPRs } = useGetTPRs({ search: debouncedQuery, page: 1, limit: 5 })
  const { data: partsData, isLoading: loadingParts } = useGetParts({ search: debouncedQuery, page: 1, limit: 5 })
  const { data: transData, isLoading: loadingTrans } = useGetTransactions({ search: debouncedQuery, page: 1, limit: 5 })

  const isLoading = loadingHubs || loadingTPRs || loadingParts || loadingTrans
  
  const handleSelect = (node: WorkspaceNode) => {
    onSelect(node)
    setIsOpen(false)
    setQuery("")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-4 border-b border-slate-100">
          <Search className="h-5 w-5 text-slate-400 mr-3" />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Search Hubs, Parts, Routes, Shipments (Ctrl+K)"
            className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 text-lg"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-1 rounded-md hover:bg-slate-100 text-slate-400">
              <X className="h-4 w-4" />
            </button>
          )}
          <div className="ml-3 flex space-x-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
            <span>ESC</span> <span>to close</span>
          </div>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto p-2 flex-1 custom-scrollbar">
          {!searchEnabled && (
            <div className="p-8 text-center text-slate-500">
              <p className="text-sm">Start typing to search across the enterprise.</p>
              <div className="flex items-center justify-center space-x-4 mt-6">
                <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl w-24">
                  <MapPin className="h-5 w-5 text-blue-500 mb-2" />
                  <span className="text-[10px] font-bold uppercase text-slate-600">Hubs</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl w-24">
                  <Truck className="h-5 w-5 text-emerald-500 mb-2" />
                  <span className="text-[10px] font-bold uppercase text-slate-600">Routes</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl w-24">
                  <Package className="h-5 w-5 text-purple-500 mb-2" />
                  <span className="text-[10px] font-bold uppercase text-slate-600">Parts</span>
                </div>
              </div>
            </div>
          )}

          {searchEnabled && isLoading && (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center">
              <div className="h-6 w-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm">Searching enterprise network...</p>
            </div>
          )}

          {searchEnabled && !isLoading && (
            <div className="space-y-4 p-2">
              {/* Hubs Results */}
              {hubsData && hubsData.items.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center">
                    <MapPin className="h-3 w-3 mr-1.5" /> Hubs
                  </h3>
                  <div className="space-y-1">
                    {hubsData.items.map(hub => (
                      <button 
                        key={hub.hub_id}
                        onClick={() => handleSelect({ id: hub.hub_id, type: "hub", label: hub.hub_name, subtitle: `${hub.city}, ${hub.country}`, data: hub })}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 group flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="bg-slate-100 group-hover:bg-blue-100 p-1.5 rounded-md text-slate-500 group-hover:text-blue-600">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="block text-sm font-semibold text-slate-800">{hub.hub_name}</span>
                            <span className="block text-[10px] text-slate-500">{hub.city}, {hub.country}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TPRs Results */}
              {tprsData && tprsData.items.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 mt-4 flex items-center">
                    <Wrench className="h-3 w-3 mr-1.5" /> Repair Centers
                  </h3>
                  <div className="space-y-1">
                    {tprsData.items.map(tpr => (
                      <button 
                        key={tpr.tpr_id}
                        onClick={() => handleSelect({ id: tpr.tpr_id, type: "tpr", label: tpr.tpr_name, subtitle: `${tpr.city}, ${tpr.country}`, data: tpr })}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 group flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="bg-slate-100 group-hover:bg-emerald-100 p-1.5 rounded-md text-slate-500 group-hover:text-emerald-600">
                            <Wrench className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="block text-sm font-semibold text-slate-800">{tpr.tpr_name}</span>
                            <span className="block text-[10px] text-slate-500">{tpr.specialisation}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Parts Results */}
              {partsData && partsData.items.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 mt-4 flex items-center">
                    <Package className="h-3 w-3 mr-1.5" /> Parts & Inventory
                  </h3>
                  <div className="space-y-1">
                    {partsData.items.map(part => (
                      <button 
                        key={part.part_no}
                        onClick={() => handleSelect({ id: part.part_no, type: "part", label: part.part_no, subtitle: part.part_description, data: part })}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 group flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="bg-slate-100 group-hover:bg-purple-100 p-1.5 rounded-md text-slate-500 group-hover:text-purple-600">
                            <Package className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="block text-sm font-semibold text-slate-800">{part.part_no}</span>
                            <span className="block text-[10px] text-slate-500">{part.part_description}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-purple-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Transactions Results */}
              {transData && transData.items.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 mt-4 flex items-center">
                    <Truck className="h-3 w-3 mr-1.5" /> Shipments
                  </h3>
                  <div className="space-y-1">
                    {transData.items.map(tx => (
                      <button 
                        key={tx.transaction_id}
                        onClick={() => handleSelect({ id: tx.transaction_id, type: "transaction", label: tx.transaction_id, subtitle: `${tx.origin_hub_id} → ${tx.tpr_id || tx.destination_location}`, data: tx })}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-orange-50 group flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="bg-slate-100 group-hover:bg-orange-100 p-1.5 rounded-md text-slate-500 group-hover:text-orange-600">
                            <Truck className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="block text-sm font-semibold text-slate-800">{tx.transaction_id}</span>
                            <span className="block text-[10px] text-slate-500">{tx.origin_hub_id} → {tx.tpr_id || tx.destination_location}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-orange-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center"><ChevronRight className="h-3 w-3 mr-1" /> Select</span>
            <span className="flex items-center"><span className="bg-slate-200 px-1 rounded mr-1">↑↓</span> Navigate</span>
          </div>
          <div>Powered by Enterprise Search</div>
        </div>
      </div>
      
      {/* Click outside to close backdrop */}
      <div className="absolute inset-0 z-[-1]" onClick={() => setIsOpen(false)} />
    </div>
  )
}
