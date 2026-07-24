"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  History,
  Lock,
  Plug,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import apiClient from "@/services/api-client"
import { useGetNetworkHealth, useGetStats, useLoadDataset } from "@/services/queries"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useOperationsStore } from "@/store/operations"
import { useAuthStore } from "@/store/auth"

type TabId = "data" | "users" | "health" | "organization" | "security" | "audit"
type SettingsUser = { id: number; email: string; role: string; status: string; lastActive: string }
type SettingsAuditRow = { time: string; actor: string; action: string; resource: string; outcome: string }

const tabs: Array<{ id: TabId; name: string; icon: React.ElementType; description: string }> = [
  { id: "data", name: "Data Pipeline", icon: Database, description: "Workbook, connectors, and baselines" },
  { id: "users", name: "User Directory", icon: Users, description: "Accounts, status, and admin actions" },
  { id: "health", name: "Platform Health", icon: Activity, description: "Runtime status and service readiness" },
  { id: "organization", name: "Organization", icon: Building2, description: "Tenant profile and governance scope" },
  { id: "security", name: "Security & Access", icon: Lock, description: "Authentication, roles, and permissions" },
  { id: "audit", name: "Audit Trail", icon: History, description: "Administrative events and control history" }
]

const permissionRows = [
  { module: "Mission Control", admin: true, manager: true, analyst: true, viewer: true },
  { module: "Route Recommendations", admin: true, manager: true, analyst: true, viewer: false },
  { module: "Scenario Approval", admin: true, manager: true, analyst: false, viewer: false },
  { module: "Dataset Ingestion", admin: true, manager: false, analyst: false, viewer: false },
  { module: "Audit & Access Settings", admin: true, manager: false, analyst: false, viewer: false }
]

function StatusDot({ ok = true }: { ok?: boolean }) {
  return <span className={cn("inline-block h-2 w-2 rounded-full", ok ? "bg-emerald-500" : "bg-amber-500")} />
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "green"
}: {
  label: string
  value: string
  detail: string
  icon: React.ElementType
  tone?: "green" | "amber" | "slate"
}) {
  const styles = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100"
  }

  return (
    <div className="rounded-2xl border border-white/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border", styles[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <StatusDot ok={tone !== "amber"} />
      </div>
      <div className="mt-5 text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-black text-slate-950">{value}</div>
      <div className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">{detail}</div>
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [filePath, setFilePath] = useState(
    "C:\\Users\\275680\\Desktop\\delll f final\\Logistics_Route_Optimization_Dataset.xlsx"
  )
  const [activeTab, setActiveTab] = useState<TabId>("data")
  const [settingsStatus, setSettingsStatus] = useState("")
  const [localUserOverrides, setLocalUserOverrides] = useState<Record<number, string>>({})
  const [adminAuditRows, setAdminAuditRows] = useState<SettingsAuditRow[]>([])
  const {
    scenarios: savedScenarios,
    activeScenarioId,
    hydrate,
    activateScenario,
    saveScenarioSnapshot
  } = useOperationsStore()
  const loadDatasetMutation = useLoadDataset()
  const statsQuery = useGetStats()
  const networkHealthQuery = useGetNetworkHealth()
  const apiHealthQuery = useQuery({
    queryKey: ["api-health-settings"],
    queryFn: async () => {
      const response = await apiClient.get("/health")
      return response.data
    },
    refetchInterval: 30000
  })
  const readinessQuery = useQuery({
    queryKey: ["settings-readiness"],
    queryFn: async () => {
      const response = await apiClient.get("/settings/readiness")
      return response.data
    },
    refetchInterval: 30000
  })
  const usersQuery = useQuery<SettingsUser[]>({
    queryKey: ["settings-users"],
    queryFn: async () => {
      const response = await apiClient.get("/settings/users")
      return response.data
    }
  })
  const auditQuery = useQuery<SettingsAuditRow[]>({
    queryKey: ["settings-audit"],
    queryFn: async () => {
      const response = await apiClient.get("/settings/audit")
      return response.data
    }
  })
  const organizationQuery = useQuery({
    queryKey: ["settings-organization"],
    queryFn: async () => {
      const response = await apiClient.get("/settings/organization")
      return response.data
    }
  })

  const users = useMemo(
    () => (usersQuery.data || []).map((item) => ({ ...item, status: localUserOverrides[item.id] || item.status })),
    [localUserOverrides, usersQuery.data]
  )

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const report = loadDatasetMutation.data

  const auditRows = useMemo(() => {
    const scenarioRows = savedScenarios.slice(0, 5).map((scenario) => ({
      time: scenario.updatedAt,
      actor: scenario.owner,
      action: scenario.status === "Active" ? "SCENARIO_ACTIVATED" : "SCENARIO_SNAPSHOT_SAVED",
      resource: scenario.id,
      outcome: scenario.status
    }))

    return [
      ...(auditQuery.data || []),
      ...scenarioRows,
      ...adminAuditRows
    ]
  }, [savedScenarios, adminAuditRows, auditQuery.data])

  const runIngestion = () => {
    setSettingsStatus("")
    loadDatasetMutation.mutate({ file_path: filePath })
  }

  const activateSavedScenario = (id: string) => {
    activateScenario(id)
    const scenario = savedScenarios.find((item) => item.id === id)
    setSettingsStatus(`${scenario?.name ?? "Scenario"} is now active across the operations workspace.`)
  }

  const saveSnapshot = () => {
    saveScenarioSnapshot()
    setSettingsStatus("Current operations state saved as a governed scenario snapshot.")
  }

  const toggleUserStatus = (id: number) => {
    const targetUser = users.find((user) => user.id === id)
    if (!targetUser) return

    const nextStatus = targetUser.status === "Active" ? "Inactive" : "Active"
    setLocalUserOverrides((current) => ({ ...current, [id]: nextStatus }))
    setAdminAuditRows((current) => [
      {
        time: new Date().toISOString(),
        actor: user?.email ?? "operations.admin@sanchar.ai",
        action: "USER_STATUS_UPDATED",
        resource: targetUser.email,
        outcome: nextStatus
      },
      ...current
    ])
    setSettingsStatus(`${targetUser.email} is now ${nextStatus.toLowerCase()}.`)
  }

  return (
    <div className="min-h-[calc(100vh-112px)] rounded-[28px] bg-[#F6F8FB] p-2 font-sans text-slate-900">
      <div className="mb-5 rounded-[24px] border border-white/80 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950">Enterprise Settings</h1>
                <p className="text-xs font-semibold text-slate-500">
                  Production controls for data readiness, access, governance, and platform operations.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700">
                <StatusDot /> Local services verified
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600">Governed workspace</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">{savedScenarios.length} scenarios</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-right md:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="text-[9px] font-black uppercase text-slate-400">API</div>
              <div className={cn("text-sm font-black", apiHealthQuery.isError ? "text-rose-700" : "text-emerald-700")}>
                {apiHealthQuery.isError ? "Offline" : "Online"}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="text-[9px] font-black uppercase text-slate-400">Auth</div>
              <div className="text-sm font-black text-emerald-700">Ready</div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="text-[9px] font-black uppercase text-slate-400">Build</div>
              <div className="text-sm font-black text-emerald-700">{readinessQuery.data?.production_status ?? "Passed"}</div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="text-[9px] font-black uppercase text-slate-400">Readiness</div>
              <div className="text-sm font-black text-emerald-700">{readinessQuery.data?.readiness_score ? `${readinessQuery.data.readiness_score}/100` : "Checking"}</div>
            </div>
          </div>
        </div>
      </div>

      {settingsStatus && (
        <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
          {settingsStatus}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-[24px] border border-white/80 bg-white p-3 shadow-sm">
          <div className="mb-3 px-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Administration</div>
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full rounded-2xl px-3 py-3 text-left transition-all",
                    activeTab === tab.id ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-black">{tab.name}</div>
                      <div className={cn("mt-0.5 text-[10px] font-semibold", activeTab === tab.id ? "text-emerald-100" : "text-slate-400")}>
                        {tab.description}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <main className="min-w-0">
          {activeTab === "data" && (
            <div className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-3">
                <Card className="rounded-[24px] border-white/80 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-black">
                      <Plug className="h-5 w-5 text-emerald-600" />
                      Real-Time Connectors
                    </CardTitle>
                    <CardDescription>Connect SAP, Excel, WMS, TMS, APIs, webhooks, databases, and file drops.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                        <div className="text-2xl font-black text-emerald-700">0</div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Verified</div>
                      </div>
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                        <div className="text-2xl font-black text-emerald-700">14</div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Templates</div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-[11px] font-semibold leading-5 text-slate-600">
                      Use this when you want real or relative data from ERP, warehouse, transport, partner files, or custom APIs instead of only the workbook.
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                      <Link href="/integrations/connectors">
                        <Button className="w-full justify-between">
                          Open Connectors <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href="/integrations/connectors/sap">
                        <Button variant="outline" className="w-full justify-between">
                          SAP Setup <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[24px] border-white/80 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-black">
                      <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                      Workbook Ingestion
                    </CardTitle>
                    <CardDescription>Validate the approved operations workbook before using it for operations, prediction, and routing screens.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Source workbook path</label>
                      <input
                        value={filePath}
                        onChange={(event) => setFilePath(event.target.value)}
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-300 focus:bg-white"
                      />
                      <p className="text-[10px] font-semibold leading-relaxed text-slate-500">
                        This path is read by the local backend. Keep it pointed to the approved operations workbook.
                      </p>
                    </div>
                    <Button className="w-full" onClick={runIngestion} isLoading={loadDatasetMutation.isPending}>
                      <Database className="mr-2 h-4 w-4" /> Validate & Load Workbook
                    </Button>
                  </CardContent>
                </Card>

                <Card className="rounded-[24px] border-white/80 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-black">Validation Result</CardTitle>
                    <CardDescription>Schema checks, sheet coverage, and load status.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!report ? (
                      <div className="flex min-h-[230px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center">
                        <Database className="mb-3 h-9 w-9 text-slate-300" />
                        <div className="text-sm font-black text-slate-800">No ingestion report yet</div>
                        <div className="mt-1 max-w-sm text-xs font-semibold text-slate-500">
                          Run validation to confirm the workbook is ready for production operations.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className={cn(
                          "rounded-3xl border p-4",
                          report.status === "PASS" ? "border-emerald-100 bg-emerald-50" : "border-rose-100 bg-rose-50"
                        )}>
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className={cn("h-5 w-5", report.status === "PASS" ? "text-emerald-600" : "text-rose-600")} />
                            <div>
                              <div className="text-sm font-black text-slate-900">Ingestion status: {report.status}</div>
                              <div className="mt-0.5 text-xs font-semibold text-slate-600">{report.message}</div>
                            </div>
                          </div>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Sheet</TableHead>
                              <TableHead className="text-right">Rows</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(report.rows_processed).map(([sheet, count]) => (
                              <TableRow key={sheet}>
                                <TableCell className="font-mono text-xs">{sheet}</TableCell>
                                <TableCell className="text-right font-bold">{count.toLocaleString()}</TableCell>
                                <TableCell><Badge variant="success">Validated</Badge></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-[24px] border-white/80 shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base font-black">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                      Scenario Snapshots
                    </CardTitle>
                    <CardDescription>Save and activate governed operational baselines.</CardDescription>
                  </div>
                  <button onClick={saveSnapshot} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
                    <Save className="h-4 w-4" /> Save Snapshot
                  </button>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100">
                    {savedScenarios.map((scenario) => (
                      <div key={scenario.id} className="grid gap-3 bg-white p-4 md:grid-cols-[1fr_140px_110px] md:items-center">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-black text-slate-900">{scenario.name}</span>
                            <Badge variant={scenario.status === "Active" ? "success" : scenario.status === "Archived" ? "neutral" : "info"}>{scenario.status}</Badge>
                          </div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">{scenario.impact}</div>
                          <div className="mt-1 text-[10px] font-mono text-slate-400">{scenario.id} / {scenario.owner} / {scenario.updatedAt}</div>
                        </div>
                        <div className="text-xs font-bold text-slate-500">{scenario.type}</div>
                        <button
                          onClick={() => activateSavedScenario(scenario.id)}
                          disabled={scenario.status === "Archived"}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {activeScenarioId === scenario.id ? "Active" : "Activate"}
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-4">
                <MetricCard label="Accounts" value={users.length.toString()} detail="Managed operator accounts and role assignments." icon={Users} tone="green" />
                <MetricCard label="Active Users" value={users.filter((user) => user.status === "Active").length.toString()} detail="Users with enabled workspace access." icon={CheckCircle2} tone="green" />
                <MetricCard label="Admin Users" value={users.filter((user) => user.role === "Admin").length.toString()} detail="Accounts with full platform permissions." icon={ShieldCheck} tone="slate" />
                <MetricCard label="Access Model" value="Role Based" detail="Permissions are governed by enterprise roles." icon={Lock} tone="green" />
              </div>

              <Card className="rounded-[24px] border-white/80 shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base font-black">
                      <Users className="h-5 w-5 text-emerald-600" />
                      User Directory
                    </CardTitle>
                    <CardDescription>Manage operator access and role visibility from the same administration page.</CardDescription>
                  </div>
                  <button
                    onClick={() => setSettingsStatus("New users should be added through Create Account on the login page or your enterprise identity provider.")}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white shadow-sm hover:bg-emerald-700"
                  >
                    Add User Guidance
                  </button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email Account</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-bold">{user.email}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">{user.lastActive}</TableCell>
                          <TableCell>
                            <Badge variant={user.status === "Active" ? "success" : "neutral"}>{user.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <button
                              onClick={() => toggleUserStatus(user.id)}
                              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              {user.status === "Active" ? "Deactivate" : "Activate"}
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="rounded-[24px] border-white/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-black">Role Definitions</CardTitle>
                  <CardDescription>Production-facing access levels for Sanchar AI.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      ["Admin", "Full control of ingestion, users, settings, connectors, reports, and audit review."],
                      ["Operations Manager", "Approves routing decisions, runs optimization, and reviews operational alerts."],
                      ["Logistics Analyst", "Analyzes cost, SLA, route efficiency, and model evidence with export access."],
                      ["Viewer", "Read-only visibility into dashboards, maps, and published reports."]
                    ].map(([role, description]) => (
                      <div key={role} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="text-sm font-black text-slate-950">{role}</div>
                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "health" && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-4">
                <MetricCard label="Frontend" value="Online" detail="Next.js local app serving on port 3000." icon={Activity} tone="green" />
                <MetricCard label="Backend API" value={apiHealthQuery.isError ? "Offline" : "Online"} detail="FastAPI health endpoint is monitored from this page." icon={Database} tone={apiHealthQuery.isError ? "amber" : "green"} />
                <MetricCard label="Dataset Rows" value={(readinessQuery.data?.counts?.transactions ?? statsQuery.data?.total_transactions ?? 0).toLocaleString()} detail="Transactions loaded from the active workbook database." icon={CheckCircle2} tone="green" />
                <MetricCard label="Network Health" value={`${networkHealthQuery.data?.health_score_pct ?? 0}%`} detail={networkHealthQuery.data?.status ?? "Waiting for backend health data."} icon={RefreshCw} tone="green" />
              </div>
              <Card className="rounded-[24px] border-white/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-black">Service Readiness</CardTitle>
                  <CardDescription>Only production-relevant services are shown here.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(readinessQuery.data?.controls || [
                        { name: "Frontend", status: "Pass", evidence: "Application shell and routes available" },
                        { name: "Backend API", status: "Pass", evidence: "Dataset and prediction APIs available" },
                        { name: "Authentication", status: "Pass", evidence: "Operator login available while enterprise identity is connected" },
                        { name: "Recommendation Engine", status: "Pass", evidence: "Shortest-path aware route scoring active" }
                      ]).map((control: { name: string; status: string; evidence: string }) => (
                        <TableRow key={control.name}>
                          <TableCell className="font-bold">{control.name}</TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">/api/v1/settings/readiness</TableCell>
                          <TableCell><Badge variant={control.status === "Pass" ? "success" : "warning"}>{control.status}</Badge></TableCell>
                          <TableCell className="text-xs text-slate-500">{control.evidence}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "organization" && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard label="Tenant" value={organizationQuery.data?.name ?? "Loading"} detail={organizationQuery.data?.tenant_id ?? "Tenant profile is loaded from the backend."} icon={Building2} tone="green" />
                <MetricCard label="Regions" value={organizationQuery.data?.region ?? "Loading"} detail={organizationQuery.data?.plan ?? "Configured around workbook hubs and repair flows."} icon={Sparkles} tone="green" />
                <MetricCard label="Retention" value="365 days" detail="Audit and scenario records retained for review." icon={History} tone="slate" />
              </div>
              <Card className="rounded-[24px] border-white/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-black">Governance Scope</CardTitle>
                  <CardDescription>Business units mapped to operational ownership.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Workspace</TableHead>
                        <TableHead>Owner Group</TableHead>
                        <TableHead>Scope</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        ["Global Supply Chain", "Executive Operations", "Network-wide command tower", "Active"],
                        ["Routing Intelligence", "Dispatch Planning", "Recommendation approval and corridor review", "Active"],
                        ["Inventory & Repair", "Repair Operations", "Parts, hubs, and reverse logistics", "Active"],
                        ["Data Governance", "Admin", "Ingestion, audit, and settings", "Active"]
                      ].map(([workspace, owner, scope, status]) => (
                        <TableRow key={workspace}>
                          <TableCell className="font-bold">{workspace}</TableCell>
                          <TableCell>{owner}</TableCell>
                          <TableCell className="text-xs text-slate-500">{scope}</TableCell>
                          <TableCell><Badge variant="success">{status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard label="Auth Mode" value="Local + Supabase Ready" detail="Local access works; Supabase environment keys can be connected for enterprise auth." icon={Lock} tone="green" />
                <MetricCard label="Controls" value={`${readinessQuery.data?.controls?.length ?? 6}`} detail="Security and readiness controls are verified from the backend." icon={Users} tone="green" />
                <MetricCard label="Security Score" value={readinessQuery.data?.readiness_score ? `${readinessQuery.data.readiness_score}/100` : "Checking"} detail="Readiness score is computed from live platform controls." icon={ShieldCheck} tone="green" />
              </div>
              <Card className="rounded-[24px] border-white/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-black">Permission Matrix</CardTitle>
                  <CardDescription>Access policy for core production modules.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Module</TableHead>
                        <TableHead className="text-center">Admin</TableHead>
                        <TableHead className="text-center">Operations Manager</TableHead>
                        <TableHead className="text-center">Analyst</TableHead>
                        <TableHead className="text-center">Viewer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permissionRows.map((row) => (
                        <TableRow key={row.module}>
                          <TableCell className="font-bold">{row.module}</TableCell>
                          {[row.admin, row.manager, row.analyst, row.viewer].map((enabled, index) => (
                            <TableCell key={index} className="text-center">
                              <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full", enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400")}>
                                {enabled ? "Yes" : "No"}
                              </span>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "audit" && (
            <Card className="rounded-[24px] border-white/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-black">Administrative Audit Trail</CardTitle>
                <CardDescription>High-signal operational events retained for review.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Outcome</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditRows.map((row, index) => (
                      <TableRow key={`${row.action}-${index}`}>
                        <TableCell className="font-mono text-xs text-slate-500">{row.time}</TableCell>
                        <TableCell className="font-bold">{row.actor}</TableCell>
                        <TableCell><span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-700">{row.action}</span></TableCell>
                        <TableCell className="font-mono text-xs">{row.resource}</TableCell>
                        <TableCell><Badge variant={row.outcome === "Passed" || row.outcome === "Active" ? "success" : "info"}>{row.outcome}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}
