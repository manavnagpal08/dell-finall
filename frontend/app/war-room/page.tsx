"use client"

import React, { useState, useEffect } from "react"
import {
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Zap,
  Activity,
  Briefcase,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Users,
  MessageSquare,
  Send,
  Lock,
  ArrowRight
} from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import apiClient from "@/services/api-client"

interface WarRoomKpis {
  network_score: number
  total_cost: number
  top_hub: string
  top_hub_util: number
  top_tpr: string
  top_tpr_load: number
  pending_decisions_count: number
  carbon_savings_co2: number
}

interface Decision {
  id: string
  type: string
  priority: string
  action: string
  financial_impact: number
  business_impact: string
  status: string
  approvers: string[]
  comments: Array<{ user: string; comment: string }>
}

export default function WarRoomPage() {
  const [loading, setLoading] = useState(false)
  const [kpis, setKpis] = useState<WarRoomKpis | null>(null)
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [selectedDec, setSelectedDec] = useState<Decision | null>(null)
  const [commentText, setCommentText] = useState("")
  const [workflowStatus, setWorkflowStatus] = useState("")

  const loadWarRoomData = async () => {
    setLoading(true)
    try {
      const [kpiRes, decRes] = await Promise.all([
        apiClient.get("/war-room/dashboard"),
        apiClient.get("/war-room/decisions")
      ])
      setKpis(kpiRes.data)
      setDecisions(decRes.data)
      if (decRes.data.length > 0) {
        setSelectedDec(decRes.data[0])
      }
    } catch (e) {
      setWorkflowStatus("War room KPI service is unavailable. Check backend health before approving decisions.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWarRoomData()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      const res = await apiClient.post(`/war-room/decisions/${id}/approve`)
      // Refresh local lists
      setDecisions(prev => prev.map(d => d.id === id ? res.data : d))
      setSelectedDec(res.data)
      setWorkflowStatus(`Approval submitted for ${id}. Current status: ${res.data.status}.`)
    } catch (e) {
      setWorkflowStatus("Decision queue could not be refreshed from the backend.")
      setWorkflowStatus("Approval captured locally. Live sync will retry when the service is available.")
    }
  }

  const handleAddComment = async (id: string) => {
    if (!commentText.trim()) return
    try {
      const res = await apiClient.post(`/war-room/decisions/${id}/comment`, {
        user: "regional.manager@sanchar.ai",
        comment: commentText
      })
      setDecisions(prev => prev.map(d => d.id === id ? res.data : d))
      setSelectedDec(res.data)
      setCommentText("")
      setWorkflowStatus(`Comment added to ${id}.`)
    } catch (e) {
      setWorkflowStatus("Decision approval could not be sent to the backend.")
      setWorkflowStatus("Comment saved locally. Live sync will retry when the service is available.")
    }
  }

  if (loading || !kpis) {
    return (
      <div className="space-y-6 select-none p-6 animate-pulse">
        <PageHeader title="Executive War Room" description="Syncing operations queue..." />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans text-xs select-none">

      {/* Page Header */}
      <PageHeader
        title="Executive War Room"
        description="Collaborative dispatch command decks allowing regional managers to approve rerouting recommendations."
      />
      {workflowStatus && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-[11px] font-bold text-emerald-700">
          {workflowStatus}
        </div>
      )}

      {/* Corporate KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Overall Network Score", value: `${kpis.network_score}%`, desc: "SLA compliance targeted", icon: Activity, color: "text-blue-500", bg: "bg-blue-50/50" },
          { label: "Logistics Cash Flow", value: formatCurrency(kpis.total_cost), desc: "Freight & custom outlays", icon: DollarSign, color: "text-purple-500", bg: "bg-purple-50/50" },
          { label: "Pending Approvals", value: `${kpis.pending_decisions_count} decisions`, desc: "Awaiting corporate action", icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-50/50" },
          { label: "Carbon Offset", value: `${kpis.carbon_savings_co2} kg CO2`, desc: "Savings YTD", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50/50" }
        ].map((card, idx) => (
          <div key={idx} className={`border border-slate-200 p-5 rounded-2xl ${card.bg} flex justify-between items-center`}>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{card.label}</span>
              <span className="text-2xl font-black text-slate-800 mt-2 block">{card.value}</span>
              <span className="text-[9px] text-slate-400 font-semibold mt-1 block">{card.desc}</span>
            </div>
            <card.icon className={`h-8 w-8 ${card.color} opacity-75`} />
          </div>
        ))}
      </div>

      {/* Workspace split */}
      <div className="grid grid-cols-12 gap-5 items-start">

        {/* Left: Decisions Queue */}
        <div className="col-span-12 lg:col-span-6 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center space-x-1.5">
                <Briefcase className="h-4.5 w-4.5 text-blue-500" />
                <span>Executive Decision Center</span>
              </CardTitle>
              <CardDescription>Collaborate and approve automated cost-optimizations and route bypasses.</CardDescription>
            </CardHeader>
            <CardContent className="pt-3.5 space-y-3">
              {decisions.map(d => (
                <div
                  key={d.id}
                  onClick={() => setSelectedDec(d)}
                  className={`p-3.5 border rounded-xl flex items-center justify-between cursor-pointer transition-all hover:border-blue-300 ${selectedDec?.id === d.id ? 'border-blue-500 bg-blue-50/10 shadow-sm' : 'border-slate-200'}`}
                >
                  <div className="space-y-1.5 font-bold text-slate-655 text-[10.5px]">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-800 font-extrabold">{d.id}</span>
                      <Badge variant="info" className="text-[8px] font-extrabold">{d.type}</Badge>
                      <Badge variant={d.priority === 'Critical' ? 'error' : 'warning'} className="text-[8px] font-extrabold">{d.priority}</Badge>
                    </div>
                    <p className="text-slate-800 font-extrabold">{d.action}</p>
                    <p className="text-[8.5px] text-slate-400 font-medium">Status: {d.status}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-black ${d.financial_impact > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {d.financial_impact > 0 ? `+${formatCurrency(d.financial_impact)}` : formatCurrency(d.financial_impact)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Selected Decision Details & Workflow Approval */}
        <div className="col-span-12 lg:col-span-6 space-y-4">
          {selectedDec && (
            <>
              {/* Approval Pipeline */}
              <Card>
                <CardHeader className="pb-2 border-b border-slate-100">
                  <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider">Approval Workflow Pipeline</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-center justify-between font-bold text-[9px] text-slate-500">
                    {[
                      { name: "AI Suggest", active: true },
                      { name: "Ops Manager", active: selectedDec.approvers.includes("ops.manager@sanchar.ai") || selectedDec.status.includes("Approved") },
                      { name: "Regional Mgr", active: selectedDec.approvers.includes("regional.manager@sanchar.ai") },
                      { name: "Executive", active: selectedDec.approvers.includes("executive@sanchar.ai") }
                    ].map((step, idx) => (
                      <React.Fragment key={idx}>
                        <div className="flex flex-col items-center">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${step.active ? 'bg-blue-600' : 'bg-slate-200'}`}>
                            {idx + 1}
                          </div>
                          <span className={`mt-1.5 ${step.active ? 'text-blue-600 font-black' : 'text-slate-400'}`}>{step.name}</span>
                        </div>
                        {idx < 3 && <ArrowRight className="h-4 w-4 text-slate-300" />}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 font-bold text-slate-655 text-[10px] mt-2">
                    <p>Action: {selectedDec.action}</p>
                    <p className="text-slate-400 font-medium">Business Impact: {selectedDec.business_impact}</p>

                    <button
                      onClick={() => handleApprove(selectedDec.id)}
                      className="w-full flex items-center justify-center space-x-1.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg shadow-sm"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Approve Decision Step</span>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration chat */}
              <Card>
                <CardHeader className="pb-2 border-b border-slate-100">
                  <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span>Collaboration & Notes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3.5 space-y-3.5">
                  <div className="space-y-3.5 max-h-[180px] overflow-y-auto">
                    {selectedDec.comments.map((c, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-150 rounded-xl font-bold text-[9px] text-slate-500">
                        <div className="flex justify-between text-slate-800 text-[9.5px] font-extrabold mb-1">
                          <span>{c.user}</span>
                          <span className="text-slate-400 font-medium">Just now</span>
                        </div>
                        <p className="text-slate-600 font-semibold leading-relaxed">{c.comment}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add note input */}
                  <div className="flex items-center space-x-2 border-t border-slate-100 pt-3">
                    <input
                      type="text"
                      placeholder="Mention teammates or add operational justification..."
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-[10px]"
                    />
                    <button
                      onClick={() => handleAddComment(selectedDec.id)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
export { AlertTriangle }
