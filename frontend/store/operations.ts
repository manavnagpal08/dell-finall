import { create } from "zustand"

export interface OperationalScenario {
  id: string
  name: string
  type: string
  owner: string
  status: "Ready" | "Active" | "Archived"
  impact: string
  updatedAt: string
  kpiDelta: {
    shipments: number
    cost: number
    slaBreaches: number
    health: number
  }
}

export interface OperationsAction {
  id: string
  title: string
  owner: string
  severity: "Critical" | "High" | "Medium" | "Low"
  status: "Open" | "Assigned" | "Resolved"
  corridor: string
  due: string
}

interface OperationsState {
  scenarios: OperationalScenario[]
  actions: OperationsAction[]
  activeScenarioId: string
  hydrated: boolean
  hydrate: () => void
  activateScenario: (id: string) => void
  saveScenarioSnapshot: () => void
  assignAction: (id: string) => void
  resolveAction: (id: string) => void
}

const defaultScenarios: OperationalScenario[] = [
  {
    id: "SCN-APAC-001",
    name: "APAC repair capacity surge",
    type: "Repair Load",
    owner: "Operations Control",
    status: "Active",
    impact: "Balances Bangalore and Hyderabad repair queues for P1 returns.",
    updatedAt: "2026-07-20 09:10",
    kpiDelta: { shipments: 24, cost: -18500, slaBreaches: -6, health: 1.8 }
  },
  {
    id: "SCN-EMEA-014",
    name: "Amsterdam customs backlog",
    type: "Route Delay",
    owner: "Regional Routing",
    status: "Ready",
    impact: "Preloads alternate lanes through Bangalore and Singapore hubs.",
    updatedAt: "2026-07-20 08:45",
    kpiDelta: { shipments: 41, cost: 32000, slaBreaches: 14, health: -4.2 }
  },
  {
    id: "SCN-NA-022",
    name: "Critical stock protection",
    type: "Inventory Risk",
    owner: "Inventory Planning",
    status: "Archived",
    impact: "Protects transceiver safety stock at high-volume depot nodes.",
    updatedAt: "2026-07-19 21:30",
    kpiDelta: { shipments: 8, cost: -9200, slaBreaches: -3, health: 0.9 }
  }
]

const defaultActions: OperationsAction[] = [
  { id: "ACT-1001", title: "Approve APAC repair overflow plan", owner: "Repair Operations", severity: "High", status: "Open", corridor: "HUB-BLR / TPR-HYD-01", due: "Today 14:30" },
  { id: "ACT-1002", title: "Investigate Amsterdam customs delay", owner: "Regional Routing", severity: "Critical", status: "Assigned", corridor: "HUB-AMS / HUB-SIN", due: "Today 12:00" },
  { id: "ACT-1003", title: "Export weekly cost leakage packet", owner: "Finance Operations", severity: "Medium", status: "Open", corridor: "Global", due: "Tomorrow 09:00" }
]

const storageKey = "sanchar_operations_state"

const writeState = (state: Pick<OperationsState, "scenarios" | "actions" | "activeScenarioId">) => {
  if (typeof window === "undefined") return
  window.localStorage.setItem(storageKey, JSON.stringify(state))
}

export const useOperationsStore = create<OperationsState>((set, get) => ({
  scenarios: defaultScenarios,
  actions: defaultActions,
  activeScenarioId: "SCN-APAC-001",
  hydrated: false,

  hydrate: () => {
    if (typeof window === "undefined" || get().hydrated) return
    const stored = window.localStorage.getItem(storageKey)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        set({ ...parsed, hydrated: true })
        return
      } catch {
        window.localStorage.removeItem(storageKey)
      }
    }
    writeState(get())
    set({ hydrated: true })
  },

  activateScenario: (id) => {
    const scenarios = get().scenarios.map(s => ({
      ...s,
      status: s.id === id ? "Active" as const : s.status === "Active" ? "Ready" as const : s.status
    }))
    set({ scenarios, activeScenarioId: id })
    writeState({ scenarios, actions: get().actions, activeScenarioId: id })
  },

  saveScenarioSnapshot: () => {
    const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ")
    const scenario: OperationalScenario = {
      id: `SCN-${Date.now().toString().slice(-6)}`,
      name: "Current operations snapshot",
      type: "Network Baseline",
      owner: "Operations Control",
      status: "Ready",
      impact: "Captures current filters, freshness state, and scenario controls for later comparison.",
      updatedAt: timestamp,
      kpiDelta: { shipments: 0, cost: 0, slaBreaches: 0, health: 0 }
    }
    const scenarios = [scenario, ...get().scenarios]
    set({ scenarios })
    writeState({ scenarios, actions: get().actions, activeScenarioId: get().activeScenarioId })
  },

  assignAction: (id) => {
    const actions = get().actions.map(a => a.id === id ? { ...a, status: "Assigned" as const } : a)
    set({ actions })
    writeState({ scenarios: get().scenarios, actions, activeScenarioId: get().activeScenarioId })
  },

  resolveAction: (id) => {
    const actions = get().actions.map(a => a.id === id ? { ...a, status: "Resolved" as const } : a)
    set({ actions })
    writeState({ scenarios: get().scenarios, actions, activeScenarioId: get().activeScenarioId })
  }
}))
