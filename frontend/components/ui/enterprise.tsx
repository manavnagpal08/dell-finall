"use client"

import React from "react"
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  FolderOpen
} from "lucide-react"
import { cn } from "@/lib/utils"

// ==================================================
// 1. METRIC CARD
// ==================================================
interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  change?: string | number
  trend?: "up" | "down" | "neutral"
  icon?: React.ReactNode
  subtitle?: string
}

export function MetricCard({ title, value, change, trend, icon, subtitle, className, ...props }: MetricCardProps) {
  return (
    <div 
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200", 
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {icon && <div className="p-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">{icon}</div>}
      </div>
      
      <div className="mt-3 flex items-baseline space-x-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {change && (
          <span 
            className={cn(
              "inline-flex items-center px-1.5 py-0.5 rounded-lg text-xs font-bold",
              trend === "up" && "bg-emerald-50 text-emerald-700",
              trend === "down" && "bg-rose-50 text-rose-700",
              trend === "neutral" && "bg-slate-50 text-slate-700"
            )}
          >
            {trend === "up" && <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />}
            {trend === "down" && <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />}
            {change}
          </span>
        )}
      </div>
      
      {(subtitle || chatInputPlaceholders()) && (
        <p className="mt-1 text-xs text-slate-400 font-medium">{subtitle}</p>
      )}
    </div>
  )
}

function chatInputPlaceholders() {
  return null
}

// ==================================================
// 2. AI INSIGHT CARD
// ==================================================
interface AIInsightCardProps {
  topic: string
  analysis: string
  recommendation?: string
  confidence: number
  onApply?: () => void
}

export function AIInsightCard({ topic, analysis, recommendation, confidence, onApply }: AIInsightCardProps) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/30 to-indigo-50/10 p-5 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 text-blue-500/20">
        <Sparkles className="h-20 w-20 -mr-6 -mt-6" />
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="p-1.5 rounded-lg bg-blue-50 text-brand-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="text-xs font-bold text-blue-900 tracking-wide uppercase">{topic}</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800">
          CONFIDENCE {confidence}%
        </span>
      </div>

      <p className="mt-3 text-xs text-slate-600 leading-relaxed font-medium">
        {analysis}
      </p>

      {recommendation && (
        <div className="mt-3 bg-white/70 border border-blue-50 rounded-xl p-3 text-xs">
          <span className="font-bold text-slate-800">AI Recommendation: </span>
          <span className="text-slate-600">{recommendation}</span>
        </div>
      )}

      {onApply && (
        <div className="mt-4 flex justify-end">
          <button 
            onClick={onApply}
            className="px-3.5 py-1.5 text-xs font-bold bg-brand-primary text-white rounded-xl shadow hover:bg-blue-600 transition-colors"
          >
            Apply Action
          </button>
        </div>
      )}
    </div>
  )
}

// ==================================================
// 3. STATUS BADGE
// ==================================================
interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "delivered" | "delayed" | "cancelled" | "optimal" | "low_stock" | "overstocked"
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-100",
    optimal: "bg-emerald-50 text-emerald-700 border-emerald-100",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
    inactive: "bg-slate-100 text-slate-700 border-slate-200",
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    low_stock: "bg-amber-50 text-amber-700 border-amber-100",
    delayed: "bg-rose-50 text-rose-700 border-rose-100",
    overstocked: "bg-blue-50 text-blue-700 border-blue-100",
    cancelled: "bg-slate-100 text-slate-700 border-slate-200"
  }

  const label = status.replace("_", " ").toUpperCase()

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border", styles[status] || styles.inactive)}>
      {label}
    </span>
  )
}

// ==================================================
// 4. ALERT CARD
// ==================================================
interface AlertCardProps {
  title: string
  description: string
  severity: "info" | "low" | "medium" | "high" | "critical"
  time?: string
  onResolve?: () => void
}

export function AlertCard({ title, description, severity, time, onResolve }: AlertCardProps) {
  const configs = {
    info: { icon: Info, style: "bg-blue-50/50 border-blue-100 text-blue-700" },
    low: { icon: Info, style: "bg-blue-50/50 border-blue-100 text-blue-700" },
    medium: { icon: AlertTriangle, style: "bg-amber-50/50 border-amber-100 text-amber-700" },
    high: { icon: AlertTriangle, style: "bg-amber-50/50 border-amber-100 text-amber-700" },
    critical: { icon: AlertCircle, style: "bg-rose-50/50 border-rose-100 text-rose-700" }
  }

  const config = configs[severity] || configs.info
  const Icon = config.icon

  return (
    <div className={cn("rounded-2xl border p-4 flex items-start space-x-3 transition-colors", config.style)}>
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold">{title}</span>
          {time && <span className="text-[10px] opacity-75 font-semibold">{time}</span>}
        </div>
        <p className="mt-1 opacity-90 leading-relaxed font-medium">{description}</p>
        {onResolve && (
          <button 
            onClick={onResolve}
            className="mt-2.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-[10px] font-bold shadow-sm hover:bg-slate-50 transition-colors"
          >
            Acknowledge
          </button>
        )}
      </div>
    </div>
  )
}

// ==================================================
// 5. TIMELINE
// ==================================================
interface TimelineStep {
  title: string
  desc: string
  date?: string
  active?: boolean
}

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="flow-root text-xs">
      <ul className="-mb-8">
        {steps.map((step, stepIdx) => (
          <li key={stepIdx}>
            <div className="relative pb-8">
              {stepIdx !== steps.length - 1 ? (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white",
                    step.active ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    {stepIdx + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className={cn("font-bold", step.active ? "text-slate-900" : "text-slate-500")}>
                      {step.title}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{step.desc}</p>
                  </div>
                  {step.date && (
                    <div className="text-right text-[10px] whitespace-nowrap text-slate-400 font-semibold">
                      {step.date}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ==================================================
// 6. BREADCRUMBS
// ==================================================
export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav className="flex text-xs font-semibold text-slate-500 mb-4">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        {items.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            {index > 0 && <span className="mx-2 text-slate-300 font-normal">/</span>}
            {item.href ? (
              <a href={item.href} className="hover:text-slate-800 transition-colors">
                {item.name}
              </a>
            ) : (
              <span className="text-slate-800">{item.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// ==================================================
// 7. PAGINATION
// ==================================================
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-xs font-semibold text-slate-700 mt-4">
      <div>
        <p className="text-slate-500">
          Showing page <span className="font-bold text-slate-900">{currentPage}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
        </p>
      </div>
      <div className="flex space-x-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ==================================================
// 8. EMPTY STATE
// ==================================================
export function EmptyState({ title, description, icon: Icon = FolderOpen }: { title: string; description: string; icon?: any }) {
  return (
    <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl bg-white/50 text-xs">
      <Icon className="mx-auto h-10 w-10 text-slate-300" />
      <h3 className="mt-2 font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-slate-500 font-medium max-w-sm mx-auto">{description}</p>
    </div>
  )
}

// ==================================================
// 9. ERROR STATE
// ==================================================
export function ErrorState({ title = "Operation Failed", description = "An error occurred while loading this view.", onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-12 px-4 border border-rose-100 rounded-2xl bg-rose-50/20 text-xs">
      <AlertTriangle className="mx-auto h-10 w-10 text-rose-500" />
      <h3 className="mt-2 font-bold text-rose-900">{title}</h3>
      <p className="mt-1 text-rose-700 font-medium max-w-sm mx-auto">{description}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="mt-4 inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  )
}
