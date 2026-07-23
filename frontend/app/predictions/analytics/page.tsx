"use client"

import React from "react"
import { PageHeader } from "@/components/layout/page-header"
import { Card } from "@/components/ui/card"
import { MetricCard, AIInsightCard } from "@/components/ui/enterprise"
import { AlertTriangle, TrendingUp, Compass, Network, Activity } from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from "recharts"

// --- Mock Data ---

const featureImportanceData = [
  { name: "Priority (Critical)", value: 0.35, fill: "#ef4444" },
  { name: "Distance > 2000km", value: 0.22, fill: "#f97316" },
  { name: "Flow: Hub to TPR", value: 0.18, fill: "#f59e0b" },
  { name: "Transport: Air", value: 0.12, fill: "#3b82f6" },
  { name: "Part Category: Server", value: 0.08, fill: "#10b981" },
  { name: "Other", value: 0.05, fill: "#94a3b8" }
]

const timeSeriesData = [
  { month: "Jan", historical: 42, predicted: 45 },
  { month: "Feb", historical: 38, predicted: 40 },
  { month: "Mar", historical: 55, predicted: 50 },
  { month: "Apr", historical: 48, predicted: 52 },
  { month: "May", historical: 62, predicted: 58 },
  { month: "Jun", historical: 59, predicted: 65 },
  { month: "Jul", historical: 70, predicted: 72 },
  { month: "Aug", historical: null, predicted: 68 },
  { month: "Sep", historical: null, predicted: 60 },
  { month: "Oct", historical: null, predicted: 75 },
  { month: "Nov", historical: null, predicted: 85 },
  { month: "Dec", historical: null, predicted: 90 },
]

const riskyCorridors = [
  { origin: "Shanghai Hub", dest: "Frankfurt TPR", probability: "85%", change: "+12%", trend: "up", mode: "Air" },
  { origin: "Taipei Hub", dest: "Tokyo TPR", probability: "72%", change: "+5%", trend: "up", mode: "Ocean" },
  { origin: "Austin Hub", dest: "Monterrey TPR", probability: "45%", change: "-8%", trend: "down", mode: "Ground" },
  { origin: "London Hub", dest: "Dublin TPR", probability: "60%", change: "+2%", trend: "up", mode: "Air" }
]

export default function PredictiveAnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Predictive Analytics"
        description="Deep dive into historical versus predicted performance trends and model feature influence."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Time Series Chart */}
        <Card className="lg:col-span-2 p-6 border border-slate-200/60 shadow-sm space-y-5 bg-white/70 backdrop-blur-xl rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shadow-sm">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">SLA Breach Forecast</h3>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">12-Month Projection</p>
              </div>
            </div>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              Confidence Interval: ±4.2%
            </span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 11, fontWeight: 500, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    fontWeight: 600,
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="historical" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorHistorical)" name="Historical" />
                <Area type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPredicted)" name="Predicted" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Feature Importance */}
        <Card className="lg:col-span-1 p-6 border border-slate-200/60 shadow-sm space-y-5 bg-white/70 backdrop-blur-xl rounded-2xl flex flex-col">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl shadow-sm">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Feature Importance</h3>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Model Weights</p>
            </div>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureImportanceData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} width={120} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${(Number(value || 0) * 100).toFixed(1)}%`, 'Weight']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {featureImportanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

      {/* Riskiest Corridors Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center space-x-2 px-2">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">High-Risk Predictive Corridors</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {riskyCorridors.map((route, idx) => (
            <MetricCard
              key={idx}
              title={`${route.origin} → ${route.dest}`}
              value={route.probability}
              change={route.change}
              trend={route.trend as any}
              subtitle={`Transport Mode: ${route.mode}`}
              icon={<Compass className="h-4 w-4" />}
            />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <AIInsightCard
          topic="Analytics Observation"
          analysis="Our Random Forest models indicate that Priority (Critical) shipments sent via Air transport over distances exceeding 2000km account for 68% of predicted SLA breaches in Q4. Seasonal capacity constraints at Taipei Hub are significantly amplifying this risk."
          recommendation="Enable AI Recommendations for all critical flights out of Taipei to automatically assess ocean/ground alternatives or carrier bypassing."
          confidence={88}
        />
      </div>

    </div>
  )
}
