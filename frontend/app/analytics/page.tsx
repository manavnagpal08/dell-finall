"use client"

import React, { useState, useEffect } from "react"
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, AreaChart, Area } from "recharts"
import { RefreshCw, BarChart2, TrendingUp, AlertTriangle } from "lucide-react"

import { useGetStats } from "@/services/queries"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/state/error-state"
import { EmptyState } from "@/components/state/empty-state"
import { formatCurrency, formatPercent } from "@/lib/utils"

const CHART_COLORS = ["#0076f6", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4", "#ec4899", "#64748b"]

export default function AnalyticsPage() {
  const { data: stats, isLoading, isError, refetch } = useGetStats()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isLoading) {
    return (
      <div className="space-y-6 p-4 select-none">
        <PageHeader title="Detailed Analytics" description="Loading detailed statistics and charts..." />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-[350px] rounded-xl" />
          <Skeleton className="h-[350px] rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <ErrorState onRetry={refetch} description="Failed to retrieve detailed logistics analytics. Ensure the API is online." />
      </div>
    )
  }

  if (!stats || stats.total_transactions === 0) {
    return (
      <div className="space-y-6 select-none">
        <PageHeader title="Detailed Analytics" description="Perform financial and operational SLA investigations." />
        <EmptyState title="No analytics data available" description="Please load the logistics workbook in settings to view charts." />
      </div>
    )
  }

  return (
    <div className="space-y-6 select-none">
      <PageHeader 
        title="Detailed Analytics" 
        description="Deeper investigation of logistics costs, cycle durations, and SLA breaches."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-brand-text-muted uppercase">Freight Value Pool</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-2">{formatCurrency(stats.total_cost)}</h3>
              <p className="text-[10px] text-brand-text-muted">Total logistics + parts cost pooled</p>
            </div>
            <div className="rounded-full bg-blue-50 p-2 text-brand-primary border border-blue-100"><TrendingUp className="h-5 w-5" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-brand-text-muted uppercase">Average Transit Time</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-2">{stats.average_transit_time.toFixed(1)} days</h3>
              <p className="text-[10px] text-brand-text-muted">Target cycle average is under 8.0 days</p>
            </div>
            <div className="rounded-full bg-purple-50 p-2 text-purple-600 border border-purple-100"><BarChart2 className="h-5 w-5" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-brand-text-muted uppercase">SLA Breaches</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-2">{formatPercent(stats.sla_breach_percentage)}</h3>
              <p className="text-[10px] text-brand-text-muted">Percentage of transactions exceeding targets</p>
            </div>
            <div className="rounded-full bg-rose-50 p-2 text-brand-error border border-rose-100"><AlertTriangle className="h-5 w-5" /></div>
          </CardContent>
        </Card>
      </div>

      {/* Grid of charts */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Cost pool breakdown bar chart */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Allocation by Category</CardTitle>
            <CardDescription>Value distributions across hardware divisions</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.cost_distribution} margin={{ top: 10, right: 10, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1e6).toFixed(1)}M`} />
                <Tooltip formatter={(v: any) => [formatCurrency(v), "Total Value"]} contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                <Bar dataKey="value" fill="#0076f6" radius={[4, 4, 0, 0]}>
                  {stats.cost_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Country counts pie chart */}
        <Card>
          <CardHeader>
            <CardTitle>Regional Operations Share</CardTitle>
            <CardDescription>Transactional share of geographic origin nodes</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.country_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {stats.country_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [v, "Transactions"]} contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional chart - transit durations */}
      <Card>
        <CardHeader>
          <CardTitle>Logistics Corridor Volumes</CardTitle>
          <CardDescription>Concentrations of shipments crossing primary transit routes</CardDescription>
        </CardHeader>
        <CardContent className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.country_distribution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0076f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#0076f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: any) => [v, "Transactions"]} contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }} />
              <Area type="monotone" dataKey="value" stroke="#0076f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
