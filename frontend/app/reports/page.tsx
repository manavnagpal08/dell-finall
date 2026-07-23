"use client"

import React, { useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  BrainCircuit,
  BookOpen,
  Calendar,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Leaf,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  Wrench
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { downloadCSV, downloadExcel, downloadTextPDF } from "@/utils/export"
import apiClient from "@/services/api-client"
import {
  useGetCarriers,
  useGetConsolidationOpportunities,
  useGetInventoryOptimization,
  useGetNetworkOverview,
  useGetOptimizationDashboard,
  useGetPredictionSummary,
  useGetReverseOptimization,
  useGetScoredCorridors,
  useGetStats,
  useGetTransactions
} from "@/services/queries"
import { cn } from "@/lib/utils"

type ReportFormat = "pdf" | "excel" | "csv"
type ReportStatus = "ready" | "empty" | "loading" | "error"
type ReportDefinition = {
  id: string
  title: string
  type: string
  description: string
  rows: (string | number | boolean | null | undefined)[][]
  metrics: { label: string; value: string }[]
  status: ReportStatus
  source: string
  icon: React.ElementType
  updatedAt: string
}

type CarbonSummary = {
  total_co2_kg: number
  co2_per_shipment: number
  greenest_route: string
  highest_emission_corridor: string
  carbon_savings_ytd_kg: number
  sustainability_score: number
}

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
const numberFormat = new Intl.NumberFormat("en-US")

function safeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function toPercent(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "0%"
  return `${value.toFixed(1)}%`
}

function buildStatus(isLoading: boolean, isError: boolean, rowsCount: number): ReportStatus {
  if (isLoading) return "loading"
  if (isError) return "error"
  if (rowsCount === 0) return "empty"
  return "ready"
}

function ReportBadge({ status }: { status: ReportStatus }) {
  if (status === "ready") return <Badge variant="success">Ready</Badge>
  if (status === "loading") return <Badge variant="info">Loading</Badge>
  if (status === "error") return <Badge variant="error">Source Error</Badge>
  return <Badge variant="neutral">No Data</Badge>
}

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"title" | "records">("records")
  const [statusMessage, setStatusMessage] = useState("")

  const statsQuery = useGetStats()
  const transactionsQuery = useGetTransactions({ page: 1, limit: 500, sort_by: "dispatch_date", sort_order: "desc" })
  const networkQuery = useGetNetworkOverview({})
  const corridorsQuery = useGetScoredCorridors()
  const optimizationQuery = useGetOptimizationDashboard({})
  const predictionQuery = useGetPredictionSummary()
  const reverseQuery = useGetReverseOptimization({})
  const inventoryQuery = useGetInventoryOptimization({})
  const consolidationQuery = useGetConsolidationOpportunities({})
  const carriersQuery = useGetCarriers()
  const carbonQuery = useQuery<CarbonSummary>({
    queryKey: ["carbon-summary-report"],
    queryFn: async () => {
      const response = await apiClient.get("/twin/carbon")
      return response.data
    }
  })
  const readinessQuery = useQuery({
    queryKey: ["production-readiness-report"],
    queryFn: async () => {
      const response = await apiClient.get("/settings/readiness")
      return response.data
    }
  })

  const refreshAll = async () => {
    setStatusMessage("Refreshing report sources...")
    await Promise.all([
      statsQuery.refetch(),
      transactionsQuery.refetch(),
      networkQuery.refetch(),
      corridorsQuery.refetch(),
      optimizationQuery.refetch(),
      predictionQuery.refetch(),
      reverseQuery.refetch(),
      inventoryQuery.refetch(),
      consolidationQuery.refetch(),
      carriersQuery.refetch(),
      carbonQuery.refetch(),
      readinessQuery.refetch()
    ])
    setStatusMessage("Live report sources refreshed.")
  }

  const reports = useMemo<ReportDefinition[]>(() => {
    const now = new Date().toISOString()
    const stats = statsQuery.data
    const transactions = transactionsQuery.data?.items ?? []
    const network = networkQuery.data
    const corridors = corridorsQuery.data ?? []
    const optimization = optimizationQuery.data
    const prediction = predictionQuery.data
    const reverse = reverseQuery.data
    const inventory = inventoryQuery.data
    const consolidation = consolidationQuery.data
    const carriers = carriersQuery.data?.items ?? []
    const carbon = carbonQuery.data
    const readiness = readinessQuery.data
    const exceptions = transactions.filter((tx) => tx.sla_breach || tx.tamper_flag !== "CLEAR")
    const topCostLink = network?.links?.length
      ? [...network.links].sort((a, b) => Number(b.total_cost || 0) - Number(a.total_cost || 0))[0]
      : null
    const riskiestLink = network?.links?.length
      ? [...network.links].sort((a, b) => Number(b.sla_breach_rate || 0) - Number(a.sla_breach_rate || 0))[0]
      : null
    const bestRecommendation = optimization?.recommendations?.length
      ? [...optimization.recommendations].sort((a, b) => Number(b.expected_savings || 0) - Number(a.expected_savings || 0))[0]
      : null
    const projectedSavings = optimization
      ? [...(optimization.recommendations ?? []), ...(optimization.opportunities ?? [])].reduce(
          (sum, item: any) => sum + Number(item.expected_savings ?? item.cost_saving ?? 0),
          0
        )
      : 0

    const executiveRows = stats ? [
      ["Section", "Metric", "Value", "Executive interpretation"],
      ["Network Scale", "Total transactions", stats.total_transactions, "Loaded shipment evidence available for operational review"],
      ["Network Scale", "Forward transactions", stats.forward_transactions, "Customer dispatch flow covered"],
      ["Network Scale", "Reverse transactions", stats.reverse_transactions, "Repair return flow covered"],
      ["Network Scale", "Hubs / TPRs / Parts", `${stats.total_hubs} / ${stats.total_tprs} / ${stats.total_parts}`, "Full workbook network baseline"],
      ["Financial Baseline", "Total logistics cost", stats.total_cost, "Current cost pool represented in the live backend"],
      ["Financial Baseline", "Average transaction cost", stats.average_cost, "Shipment-level cost benchmark"],
      ["Service Risk", "Average transit time", stats.average_transit_time, "Operational speed baseline"],
      ["Service Risk", "SLA breach percentage", stats.sla_breach_percentage, "Primary reliability risk signal"],
      ["Service Risk", "Tamper alert percentage", stats.tamper_alert_percentage, "Security and handling exception signal"],
      ["Cost Corridor", "Highest cost lane", topCostLink ? `${topCostLink.source_id} -> ${topCostLink.target_id}` : "No lane data", topCostLink ? `${currency.format(topCostLink.total_cost)} total cost, ${numberFormat.format(topCostLink.volume)} shipments` : "Load network data first"],
      ["Risk Corridor", "Highest SLA risk lane", riskiestLink ? `${riskiestLink.source_id} -> ${riskiestLink.target_id}` : "No lane data", riskiestLink ? `${toPercent(riskiestLink.sla_breach_rate)} breach risk` : "Load network data first"],
      ["Optimization", "Projected action value", projectedSavings, "Savings surfaced by optimization services"],
      ["Optimization", "Top recommendation", bestRecommendation?.title ?? "No recommendation loaded", bestRecommendation?.impact_summary ?? "Refresh optimization source to populate"]
    ] : []

    const transactionRows = transactions.length ? [
      ["Transaction ID", "Flow", "Priority", "Part", "Origin Hub", "Destination", "Partner", "Quantity", "Logistics Cost", "Expected Days", "Actual Days", "SLA Breach", "Tamper Flag", "Status"],
      ...transactions.map((tx) => [
        tx.transaction_id,
        tx.flow_type,
        tx.priority,
        tx.part_no,
        tx.origin_hub_id,
        tx.destination_location,
        tx.logistics_partner,
        tx.quantity,
        tx.logistics_cost_total_usd,
        tx.transit_days_expected,
        tx.transit_days_actual,
        tx.sla_breach,
        tx.tamper_flag,
        tx.status
      ])
    ] : []

    const exceptionRows = exceptions.length ? [
      ["Transaction ID", "Priority", "Part", "Origin Hub", "Destination", "SLA Breach", "Tamper Flag", "Delay Days", "Notes"],
      ...exceptions.map((tx) => [
        tx.transaction_id,
        tx.priority,
        tx.part_no,
        tx.origin_hub_id,
        tx.destination_location,
        tx.sla_breach,
        tx.tamper_flag,
        tx.transit_days_actual - tx.transit_days_expected,
        tx.notes ?? ""
      ])
    ] : []

    const networkRows = network?.links?.length ? [
      ["Source", "Target", "Flow", "Volume", "Total Cost", "Average Unit Cost", "SLA Breach Rate", "Average Transit Days"],
      ...network.links.map((link) => [
        link.source_id,
        link.target_id,
        link.flow_type,
        link.volume,
        link.total_cost,
        link.avg_cost_per_unit,
        link.sla_breach_rate,
        link.avg_transit_days
      ])
    ] : []

    const corridorRows = corridors.length ? [
      ["Source", "Target", "Distance KM", "Shipments", "Total Cost", "Avg Transit Days", "SLA Success Rate", "Risk Score", "Reliability", "Overall Score", "Status"],
      ...corridors.map((corridor) => [
        corridor.source_id,
        corridor.target_id,
        corridor.distance_km,
        corridor.shipment_count,
        corridor.total_cost,
        corridor.avg_transit_days,
        corridor.sla_success_rate,
        corridor.risk_score,
        corridor.reliability_score,
        corridor.overall_score,
        corridor.status
      ])
    ] : []

    const optimizationRows = optimization?.recommendations?.length || optimization?.opportunities?.length ? [
      ["Record Type", "Title or Type", "Category or Severity", "Expected Savings", "Impact"],
      ...(optimization.recommendations ?? []).map((item) => [
        "Recommendation",
        item.title,
        item.category,
        item.expected_savings,
        item.impact_summary
      ]),
      ...(optimization.opportunities ?? []).map((item) => [
        "Opportunity",
        item.type,
        item.severity,
        item.cost_saving,
        item.description
      ])
    ] : []

    const predictionRows = prediction?.risk_distribution?.length || prediction?.kpis?.length ? [
      ["Section", "Name", "Value", "Source"],
      ...(prediction.kpis ?? []).map((item: any) => ["KPI", item.name, item.value, "/api/v1/predictions/summary"]),
      ...(prediction.risk_distribution ?? []).map((item: any) => ["Risk Distribution", item.level, item.count, "/api/v1/predictions/summary"])
    ] : []

    const reverseRows = reverse?.recommendations?.length || reverse?.opportunities?.length ? [
      ["Record Type", "Title or Type", "Severity or Category", "Expected Savings", "Transit Impact", "Business Reason"],
      ...(reverse.recommendations ?? []).map((item: any) => [
        "Recommendation",
        item.title,
        item.category,
        item.expected_savings,
        `${item.transit_improvement_days} days`,
        item.business_reason
      ]),
      ...(reverse.opportunities ?? []).map((item: any) => [
        "Opportunity",
        item.type,
        item.severity,
        item.cost_saving,
        "",
        item.description
      ])
    ] : []

    const inventoryRows = inventory?.recommendations?.length || inventory?.opportunities?.length ? [
      ["Record Type", "Title or Type", "Severity or Category", "Expected Savings", "SLA Impact", "Business Reason"],
      ...(inventory.recommendations ?? []).map((item: any) => [
        "Recommendation",
        item.title,
        item.category,
        item.expected_savings,
        `${item.sla_improvement_pct}%`,
        item.business_reason
      ]),
      ...(inventory.opportunities ?? []).map((item: any) => [
        "Opportunity",
        item.type,
        item.severity,
        item.cost_saving,
        "",
        item.description
      ])
    ] : []

    const consolidationRows = consolidation?.recommendations?.length || consolidation?.opportunities?.length ? [
      ["Record Type", "Title or Type", "Severity or Category", "Expected Savings", "Confidence", "Business Reason"],
      ...(consolidation.recommendations ?? []).map((item: any) => [
        "Recommendation",
        item.title,
        item.category,
        item.expected_savings,
        `${item.confidence_score}%`,
        item.business_reason
      ]),
      ...(consolidation.opportunities ?? []).map((item: any) => [
        "Opportunity",
        item.type,
        item.severity,
        item.cost_saving,
        "",
        item.description
      ])
    ] : []

    const carrierRows = carriers.length ? [
      ["Carrier", "Shipments", "Lanes", "SLA %", "Cost Score", "Damage %", "Carbon Score", "Status", "Savings", "SLA Breaches", "Tamper Events", "Avg Delay Days", "Total Cost"],
      ...carriers.map((carrier: any) => [
        carrier.name,
        carrier.shipments,
        carrier.lanes,
        carrier.sla,
        carrier.cost,
        carrier.damage,
        carrier.carbon,
        carrier.status,
        carrier.savings,
        carrier.sla_breaches,
        carrier.tamper_events,
        carrier.avg_delay_days,
        carrier.total_cost
      ])
    ] : []

    const carbonRows = carbon ? [
      ["Metric", "Value", "Operational Meaning"],
      ["Total CO2 kg", carbon.total_co2_kg, "Total estimated emissions from the loaded shipment network"],
      ["CO2 per shipment kg", carbon.co2_per_shipment, "Average emissions per transaction"],
      ["Greenest route", carbon.greenest_route, "Lowest-emission corridor currently identified"],
      ["Highest emission corridor", carbon.highest_emission_corridor, "Corridor to prioritize for carbon optimization"],
      ["Carbon savings YTD kg", carbon.carbon_savings_ytd_kg, "Estimated emissions already avoided"],
      ["Sustainability score", carbon.sustainability_score, "Network sustainability score from backend carbon intelligence"]
    ] : []

    const topCarrier = carriers.length
      ? [...carriers].sort((a: any, b: any) => Number(b.sla_breaches || 0) - Number(a.sla_breaches || 0))[0]
      : null
    const topException = exceptions.length
      ? [...exceptions].sort((a, b) => Number(b.logistics_cost_total_usd || 0) - Number(a.logistics_cost_total_usd || 0))[0]
      : null
    const topInventoryAction: any = inventory?.recommendations?.[0] ?? inventory?.opportunities?.[0]
    const topReverseAction: any = reverse?.recommendations?.[0] ?? reverse?.opportunities?.[0]
    const operationsBriefRows = stats ? [
      ["Area", "Current Data Point", "Value", "Operational Action"],
      ["Network", "Loaded transactions", stats.total_transactions, "Use transaction register for shipment-level drilldown"],
      ["Network", "Active hubs / TPRs / parts", `${stats.total_hubs} / ${stats.total_tprs} / ${stats.total_parts}`, "Validate coverage across forward and reverse logistics"],
      ["Cost", "Total logistics cost", stats.total_cost, "Prioritize high-cost corridors and cost-per-km outliers"],
      ["Cost", "Projected optimization value", projectedSavings, "Review optimization action register before approval"],
      ["SLA", "SLA breach rate", `${stats.sla_breach_percentage.toFixed(1)}%`, "Investigate exception register and predictive SLA distribution"],
      ["Security", "Tamper/recheck exposure", `${stats.tamper_alert_percentage.toFixed(1)}%`, "Escalate shipments with tamper or recheck flags"],
      ["Corridor", "Highest-cost lane", topCostLink ? `${topCostLink.source_id} -> ${topCostLink.target_id}` : "No lane data", topCostLink ? `${currency.format(topCostLink.total_cost)} total corridor cost` : "Refresh network overview"],
      ["Corridor", "Highest-risk lane", riskiestLink ? `${riskiestLink.source_id} -> ${riskiestLink.target_id}` : "No lane data", riskiestLink ? `${toPercent(riskiestLink.sla_breach_rate)} SLA breach exposure` : "Refresh network overview"],
      ["Carrier", "Highest breach-exposure partner", topCarrier?.name ?? "No carrier data", topCarrier ? `${topCarrier.sla_breaches} breaches across ${topCarrier.shipments} shipments` : "Refresh carrier scorecard"],
      ["Exception", "Highest-cost active exception", topException?.transaction_id ?? "No exception data", topException ? `${topException.origin_hub_id} to ${topException.destination_location}, ${currency.format(topException.logistics_cost_total_usd)}` : "No breached/tamper transactions in current page"],
      ["Prediction", "Prediction confidence", prediction?.kpis?.find((item: any) => item.name === "Average Confidence")?.value?.toString() ?? "No model summary", "Use Predictive SLA page for risk distribution"],
      ["Reverse Logistics", "Top reverse action", topReverseAction?.title ?? topReverseAction?.type ?? "No reverse action", topReverseAction?.business_reason ?? topReverseAction?.description ?? "Review reverse logistics report"],
      ["Inventory", "Top inventory action", topInventoryAction?.title ?? topInventoryAction?.type ?? "No inventory action", topInventoryAction?.business_reason ?? topInventoryAction?.description ?? "Review inventory balancing report"],
      ["Sustainability", "Network CO2 baseline", carbon ? `${numberFormat.format(carbon.total_co2_kg)} kg` : "No carbon data", carbon ? `Prioritize ${carbon.highest_emission_corridor}` : "Refresh carbon intelligence"],
      ["Sustainability", "Carbon savings YTD", carbon ? `${numberFormat.format(carbon.carbon_savings_ytd_kg)} kg` : "No carbon data", "Use carbon report for greener lane decisions"]
    ] : []

    const readinessRows = readiness ? [
      ["Area", "Status", "Evidence", "Operator Meaning"],
      ["Overall", readiness.production_status, `${readiness.readiness_score}/100`, "Platform readiness score computed by backend controls"],
      ["Data", "Loaded", `${readiness.counts.transactions} transactions, ${readiness.counts.hubs} hubs, ${readiness.counts.tprs} TPRs, ${readiness.counts.parts} parts`, "Workbook-backed operating baseline is available"],
      ["Model", readiness.counts.active_models > 0 ? "Active" : "Rules Ready", `${readiness.counts.active_models} active model records`, "SLA and routing pages can explain risk signals"],
      ["Audit", readiness.counts.audit_records > 0 ? "Active" : "Watch", `${readiness.counts.audit_records} audit records`, "Recommendation actions and feedback are retained"],
      ...readiness.controls.map((control: any) => [
        control.name,
        control.status,
        control.evidence,
        control.status === "Pass" ? "Production control is operating" : "Review before public production launch"
      ]),
      ...readiness.next_actions.map((action: string, index: number) => [
        `Next Action ${index + 1}`,
        "Recommended",
        action,
        "Hardening step for enterprise deployment"
      ])
    ] : []

    return [
      {
        id: "live-operations-brief",
        title: "Operational Intelligence Brief",
        type: "Operations",
        description: "A real-data executive brief summarizing current cost, SLA, corridor, carrier, inventory, reverse-logistics, and carbon signals.",
        rows: operationsBriefRows,
        metrics: [
          { label: "Transactions", value: stats ? numberFormat.format(stats.total_transactions) : "0" },
          { label: "Cost", value: stats ? currency.format(stats.total_cost) : "$0" },
          { label: "SLA Risk", value: stats ? toPercent(stats.sla_breach_percentage) : "0%" },
          { label: "CO2", value: carbon ? `${numberFormat.format(carbon.total_co2_kg)} kg` : "0 kg" }
        ],
        status: buildStatus(
          statsQuery.isLoading || networkQuery.isLoading || optimizationQuery.isLoading || predictionQuery.isLoading || carbonQuery.isLoading,
          statsQuery.isError || networkQuery.isError || optimizationQuery.isError || predictionQuery.isError || carbonQuery.isError,
          operationsBriefRows.length
        ),
        source: "Live backend operations data",
        icon: BookOpen,
        updatedAt: now
      },
      {
        id: "production-readiness-evidence",
        title: "Production Readiness Evidence",
        type: "Governance",
        description: "Security, data, model, audit, and operational readiness evidence generated from the live backend posture endpoint.",
        rows: readinessRows,
        metrics: [
          { label: "Score", value: readiness ? `${readiness.readiness_score}/100` : "0/100" },
          { label: "Data Rows", value: readiness ? numberFormat.format(readiness.counts.transactions) : "0" },
          { label: "Models", value: readiness ? numberFormat.format(readiness.counts.active_models) : "0" },
          { label: "Audit", value: readiness ? numberFormat.format(readiness.counts.audit_records) : "0" }
        ],
        status: buildStatus(readinessQuery.isLoading, readinessQuery.isError, readinessRows.length),
        source: "/api/v1/settings/readiness",
        icon: ShieldCheck,
        updatedAt: now
      },
      {
        id: "live-executive-kpi",
        title: "Executive KPI Summary",
        type: "Operations",
        description: "Current totals, costs, flow mix, SLA breach rate, and tamper rate from the loaded backend dataset.",
        rows: executiveRows,
        metrics: [
          { label: "Transactions", value: stats ? numberFormat.format(stats.total_transactions) : "0" },
          { label: "Total Cost", value: stats ? currency.format(stats.total_cost) : "$0" },
          { label: "SLA Breach", value: stats ? toPercent(stats.sla_breach_percentage) : "0%" },
          { label: "Projected Value", value: currency.format(projectedSavings) }
        ],
        status: buildStatus(statsQuery.isLoading, statsQuery.isError, executiveRows.length),
        source: "/api/v1/dataset/statistics",
        icon: BarChart3,
        updatedAt: now
      },
      {
        id: "live-transaction-register",
        title: "Shipment Transaction Register",
        type: "Transactions",
        description: "Exportable shipment ledger with cost, priority, route, SLA, tamper, and delivery status fields.",
        rows: transactionRows,
        metrics: [
          { label: "Rows", value: numberFormat.format(transactions.length) },
          { label: "P1 Critical", value: numberFormat.format(transactions.filter((tx) => tx.priority === "P1").length) },
          { label: "Breaches", value: numberFormat.format(transactions.filter((tx) => tx.sla_breach).length) }
        ],
        status: buildStatus(transactionsQuery.isLoading, transactionsQuery.isError, transactionRows.length),
        source: "/api/v1/transactions",
        icon: FileSpreadsheet,
        updatedAt: now
      },
      {
        id: "live-exception-register",
        title: "SLA & Exception Register",
        type: "Risk",
        description: "Only real shipments with SLA breaches, tamper flags, or recheck events from the transaction data.",
        rows: exceptionRows,
        metrics: [
          { label: "Exceptions", value: numberFormat.format(exceptions.length) },
          { label: "Tamper/Recheck", value: numberFormat.format(exceptions.filter((tx) => tx.tamper_flag !== "CLEAR").length) },
          { label: "SLA Breaches", value: numberFormat.format(exceptions.filter((tx) => tx.sla_breach).length) }
        ],
        status: buildStatus(transactionsQuery.isLoading, transactionsQuery.isError, exceptionRows.length),
        source: "/api/v1/transactions",
        icon: AlertTriangle,
        updatedAt: now
      },
      {
        id: "live-network-corridors",
        title: "Network Corridor Performance",
        type: "Network",
        description: "Lane-level volume, cost, SLA, and transit metrics from the network overview endpoint.",
        rows: networkRows,
        metrics: [
          { label: "Lanes", value: network ? numberFormat.format(network.links.length) : "0" },
          { label: "Nodes", value: network ? numberFormat.format(network.nodes.length) : "0" },
          { label: "Health", value: network ? `${network.kpis.network_health_score.toFixed(0)}` : "0" }
        ],
        status: buildStatus(networkQuery.isLoading, networkQuery.isError, networkRows.length),
        source: "/api/v1/network/overview",
        icon: Truck,
        updatedAt: now
      },
      {
        id: "live-route-intelligence",
        title: "Route Intelligence Corridor Scores",
        type: "Routing",
        description: "Shortest-path-aware corridor scores, risk, reliability, transit, and status from route intelligence.",
        rows: corridorRows,
        metrics: [
          { label: "Corridors", value: numberFormat.format(corridors.length) },
          { label: "High Risk", value: numberFormat.format(corridors.filter((c) => c.status === "High Risk").length) },
          { label: "Optimal", value: numberFormat.format(corridors.filter((c) => c.status === "Optimal").length) }
        ],
        status: buildStatus(corridorsQuery.isLoading, corridorsQuery.isError, corridorRows.length),
        source: "/api/v1/route-intelligence/corridors",
        icon: ShieldCheck,
        updatedAt: now
      },
      {
        id: "live-optimization-actions",
        title: "Optimization Action Register",
        type: "Optimization",
        description: "Cost-saving recommendations and opportunities calculated by the backend optimization service.",
        rows: optimizationRows,
        metrics: [
          { label: "Actions", value: optimization ? numberFormat.format((optimization.recommendations?.length ?? 0) + (optimization.opportunities?.length ?? 0)) : "0" },
          { label: "Current Score", value: optimization ? optimization.optimization_score_current.toFixed(0) : "0" },
          { label: "Projected Score", value: optimization ? optimization.optimization_score_projected.toFixed(0) : "0" }
        ],
        status: buildStatus(optimizationQuery.isLoading, optimizationQuery.isError, optimizationRows.length),
        source: "/api/v1/optimization/dashboard",
        icon: Database,
        updatedAt: now
      },
      {
        id: "live-sla-prediction",
        title: "SLA Prediction Model Report",
        type: "Prediction",
        description: "Model readiness, evaluated transactions, confidence, and future breach risk distribution from the trained SLA service.",
        rows: predictionRows,
        metrics: [
          { label: "Models", value: prediction?.kpis?.find((item: any) => item.name === "Active Models")?.value?.toString() ?? "0" },
          { label: "Evaluated", value: prediction?.kpis?.find((item: any) => item.name === "Transactions Evaluated")?.value?.toString() ?? "0" },
          { label: "Confidence", value: prediction?.kpis?.find((item: any) => item.name === "Average Confidence")?.value?.toString() ?? "0%" }
        ],
        status: buildStatus(predictionQuery.isLoading, predictionQuery.isError, predictionRows.length),
        source: "/api/v1/predictions/summary",
        icon: BrainCircuit,
        updatedAt: now
      },
      {
        id: "live-reverse-logistics",
        title: "Reverse Logistics Optimization Report",
        type: "Reverse",
        description: "TPR redirection, repair loop savings, queue-delay reductions, and reverse-flow recommendations from backend analysis.",
        rows: reverseRows,
        metrics: [
          { label: "Actions", value: reverse ? numberFormat.format((reverse.recommendations?.length ?? 0) + (reverse.opportunities?.length ?? 0)) : "0" },
          { label: "Savings", value: currency.format(reverse?.metrics?.[0]?.savings_value ?? 0) },
          { label: "Improve", value: reverse?.metrics?.[0] ? toPercent(reverse.metrics[0].improvement_pct) : "0%" }
        ],
        status: buildStatus(reverseQuery.isLoading, reverseQuery.isError, reverseRows.length),
        source: "/api/v1/optimization/reverse",
        icon: Wrench,
        updatedAt: now
      },
      {
        id: "live-inventory-balancing",
        title: "Inventory Balancing Agent Report",
        type: "Inventory",
        description: "Hub stock imbalance, transfer recommendations, buffer recovery, and savings by demand center.",
        rows: inventoryRows,
        metrics: [
          { label: "Actions", value: inventory ? numberFormat.format((inventory.recommendations?.length ?? 0) + (inventory.opportunities?.length ?? 0)) : "0" },
          { label: "Savings", value: currency.format(inventory?.metrics?.[0]?.savings_value ?? 0) },
          { label: "Improve", value: inventory?.metrics?.[0] ? toPercent(inventory.metrics[0].improvement_pct) : "0%" }
        ],
        status: buildStatus(inventoryQuery.isLoading, inventoryQuery.isError, inventoryRows.length),
        source: "/api/v1/optimization/inventory",
        icon: PackageCheck,
        updatedAt: now
      },
      {
        id: "live-consolidation",
        title: "Shipment Consolidation Report",
        type: "Optimization",
        description: "Duplicate shipment consolidation opportunities, expected savings, and utilization evidence.",
        rows: consolidationRows,
        metrics: [
          { label: "Actions", value: consolidation ? numberFormat.format((consolidation.recommendations?.length ?? 0) + (consolidation.opportunities?.length ?? 0)) : "0" },
          { label: "Savings", value: currency.format(consolidation?.metrics?.[0]?.savings_value ?? 0) },
          { label: "Improve", value: consolidation?.metrics?.[0] ? toPercent(consolidation.metrics[0].improvement_pct) : "0%" }
        ],
        status: buildStatus(consolidationQuery.isLoading, consolidationQuery.isError, consolidationRows.length),
        source: "/api/v1/optimization/consolidation",
        icon: Truck,
        updatedAt: now
      },
      {
        id: "live-carrier-scorecard",
        title: "Carrier Scorecard Report",
        type: "Carrier",
        description: "Carrier SLA, cost, damage, carbon, breach, tamper, and delay metrics derived from transaction history.",
        rows: carrierRows,
        metrics: [
          { label: "Carriers", value: carriersQuery.data?.total?.toString() ?? "0" },
          { label: "Shipments", value: numberFormat.format(carriers.reduce((sum: number, carrier: any) => sum + Number(carrier.shipments || 0), 0)) },
          { label: "Breaches", value: numberFormat.format(carriers.reduce((sum: number, carrier: any) => sum + Number(carrier.sla_breaches || 0), 0)) }
        ],
        status: buildStatus(carriersQuery.isLoading, carriersQuery.isError, carrierRows.length),
        source: "/api/v1/carriers",
        icon: ShieldCheck,
        updatedAt: now
      },
      {
        id: "live-carbon-intelligence",
        title: "Carbon Intelligence Report",
        type: "Sustainability",
        description: "CO2 baseline, route emissions, carbon savings, and sustainability score from the carbon intelligence backend.",
        rows: carbonRows,
        metrics: [
          { label: "Total CO2", value: `${numberFormat.format(carbon?.total_co2_kg ?? 0)} kg` },
          { label: "Saved YTD", value: `${numberFormat.format(carbon?.carbon_savings_ytd_kg ?? 0)} kg` },
          { label: "Score", value: carbon ? carbon.sustainability_score.toFixed(1) : "0" }
        ],
        status: buildStatus(carbonQuery.isLoading, carbonQuery.isError, carbonRows.length),
        source: "/api/v1/twin/carbon",
        icon: Leaf,
        updatedAt: now
      }
    ]
  }, [
    carbonQuery.data,
    carbonQuery.isError,
    carbonQuery.isLoading,
    carriersQuery.data,
    carriersQuery.isError,
    carriersQuery.isLoading,
    consolidationQuery.data,
    consolidationQuery.isError,
    consolidationQuery.isLoading,
    corridorsQuery.data,
    corridorsQuery.isError,
    corridorsQuery.isLoading,
    inventoryQuery.data,
    inventoryQuery.isError,
    inventoryQuery.isLoading,
    networkQuery.data,
    networkQuery.isError,
    networkQuery.isLoading,
    optimizationQuery.data,
    optimizationQuery.isError,
    optimizationQuery.isLoading,
    predictionQuery.data,
    predictionQuery.isError,
    predictionQuery.isLoading,
    readinessQuery.data,
    readinessQuery.isError,
    readinessQuery.isLoading,
    reverseQuery.data,
    reverseQuery.isError,
    reverseQuery.isLoading,
    statsQuery.data,
    statsQuery.isError,
    statsQuery.isLoading,
    transactionsQuery.data,
    transactionsQuery.isError,
    transactionsQuery.isLoading
  ])

  const reportTypes = useMemo(() => ["all", ...Array.from(new Set(reports.map((report) => report.type)))], [reports])

  const filteredReports = reports
    .filter((report) => typeFilter === "all" || report.type === typeFilter)
    .filter((report) => {
      const query = searchQuery.trim().toLowerCase()
      if (!query) return true
      return `${report.title} ${report.type} ${report.description} ${report.source}`.toLowerCase().includes(query)
    })
    .sort((a, b) => {
      if (sortBy === "records") return b.rows.length - a.rows.length
      return a.title.localeCompare(b.title)
    })

  const readyReports = reports.filter((report) => report.status === "ready").length
  const totalDataRows = reports.reduce((sum, report) => sum + Math.max(report.rows.length - 1, 0), 0)

  const triggerDownload = (report: ReportDefinition, format: ReportFormat) => {
    if (report.status !== "ready") {
      setStatusMessage(`${report.title} is not ready because the source has no loaded data.`)
      return
    }

    const filename = `${safeFilename(report.title)}-${new Date().toISOString().slice(0, 10)}`
    const coverRows = [
      ["Report", report.title],
      ["Type", report.type],
      ["Source", report.source],
      ["Generated At", new Date().toISOString()],
      ["Data Rows", Math.max(report.rows.length - 1, 0)]
    ]

    if (format === "csv") {
      downloadCSV(`${filename}.csv`, report.rows)
      setStatusMessage(`${report.title} CSV downloaded.`)
      return
    }

    if (format === "excel") {
      const executiveSheets = report.id === "live-executive-kpi" || report.id === "live-operations-brief"
        ? [
            { name: report.id === "live-operations-brief" ? "Operations Brief" : "Executive Brief", rows: report.rows },
            { name: "Decision Metrics", rows: [["Metric", "Value"], ...report.metrics.map((metric) => [metric.label, metric.value])] }
          ]
        : [{ name: "Data", rows: report.rows }]
      downloadExcel(`${filename}.xls`, [
        { name: "Summary", rows: coverRows },
        ...executiveSheets
      ])
      setStatusMessage(`${report.title} Excel file downloaded.`)
      return
    }

    const pdfLines = report.id === "live-executive-kpi" || report.id === "live-operations-brief"
      ? [
          report.id === "live-operations-brief" ? "Operational Intelligence Brief" : "Executive Brief",
          `Generated At: ${new Date().toISOString()}`,
          `Source: ${report.source}`,
          "",
          "Headline Metrics",
          ...report.metrics.map((metric) => `${metric.label}: ${metric.value}`),
          "",
          report.id === "live-operations-brief" ? "Current Operational Signals" : "Decision Summary",
          ...report.rows.slice(1, 14).map((row) => {
            const [section, metric, value, interpretation] = row
            return `${section} - ${metric}: ${value}. ${interpretation}`
          }),
          "",
          "Recommended Operational Actions",
          "1. Review high-cost and high-risk lanes before the next dispatch cycle.",
          "2. Prioritize SLA exceptions and tamper/recheck shipments for triage.",
          "3. Compare carrier, inventory, reverse-logistics, and carbon reports before approval."
        ]
      : [
          `Type: ${report.type}`,
          `Source: ${report.source}`,
          `Generated At: ${new Date().toISOString()}`,
          `Rows: ${Math.max(report.rows.length - 1, 0)}`,
          "",
          ...report.metrics.map((metric) => `${metric.label}: ${metric.value}`),
          "",
          "Preview:",
          ...report.rows.slice(0, 18).map((row) => row.map((cell) => String(cell ?? "")).join(" | "))
        ]
    downloadTextPDF(`${filename}.pdf`, report.title, pdfLines)
    setStatusMessage(`${report.title} PDF downloaded.`)
  }

  const isAnyLoading = reports.some((report) => report.status === "loading")

  return (
    <div className="space-y-6 font-sans text-slate-900">
      <PageHeader
        title="Production Reports"
        description="Download report files generated from live backend records. Empty sources stay disabled until data is loaded."
      />

      <section className="rounded-[28px] border border-white/80 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">Report Center</h2>
                <p className="text-xs font-semibold text-slate-500">Every report below is generated from API data already loaded into the operations platform.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-2xl font-black text-slate-950">{readyReports}/{reports.length}</div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Reports Ready</div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-2xl font-black text-slate-950">{numberFormat.format(totalDataRows)}</div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Live Rows Available</div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-2xl font-black text-slate-950">PDF / Excel / CSV</div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Download Formats</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search reports or sources..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
                {reportTypes.map((type) => (
                  <option key={type} value={type}>{type === "all" ? "All Types" : type}</option>
                ))}
              </select>
              <button onClick={() => setSortBy((prev) => prev === "records" ? "title" : "records")} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50">
                <ArrowUpDown className="h-4 w-4" /> {sortBy === "records" ? "Rows" : "Title"}
              </button>
              <Button variant="outline" onClick={refreshAll} isLoading={isAnyLoading}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
            </div>
            {statusMessage && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
                {statusMessage}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {filteredReports.map((report) => {
          const Icon = report.icon
          const rowsCount = Math.max(report.rows.length - 1, 0)
          const ready = report.status === "ready"
          return (
            <Card key={report.id} className={cn("rounded-[24px] border-white/80 bg-white shadow-sm transition hover:shadow-md", ready && "ring-1 ring-emerald-50")}>
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", ready ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base font-black text-slate-950">{report.title}</CardTitle>
                        <ReportBadge status={report.status} />
                      </div>
                      <CardDescription className="mt-1 text-xs font-semibold">{report.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  {report.metrics.map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <div className="text-lg font-black text-slate-950">{metric.value}</div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{metric.label}</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
                  <div className="flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4 text-slate-400" /> {new Date(report.updatedAt).toLocaleString()}</span>
                    <span className="inline-flex items-center gap-1"><Database className="h-4 w-4 text-slate-400" /> {report.source}</span>
                    <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-slate-400" /> {numberFormat.format(rowsCount)} rows</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button disabled={!ready} onClick={() => triggerDownload(report, "pdf")} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40">
                      <BookOpen className="h-4 w-4" /> PDF
                    </button>
                    <button disabled={!ready} onClick={() => triggerDownload(report, "excel")} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40">
                      <FileSpreadsheet className="h-4 w-4" /> Excel
                    </button>
                    <button disabled={!ready} onClick={() => triggerDownload(report, "csv")} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                      <Download className="h-4 w-4" /> CSV
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
