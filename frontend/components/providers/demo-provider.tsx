"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

type StoryStep =
  | "idle"
  | "welcome"
  | "network_overview"
  | "cost_corridor"
  | "busiest_hub"
  | "sla_risk"
  | "optimization"
  | "prediction"
  | "financial_impact"
  | "savings"
  | "complete"

interface DemoContextType {
  isDemoMode: boolean
  activeStoryStep: StoryStep
  startStoryMode: () => void
  stopStoryMode: () => void
  nextStep: () => void
}

const DemoContext = createContext<DemoContextType | undefined>(undefined)

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [activeStoryStep, setActiveStoryStep] = useState<StoryStep>("idle")
  const router = useRouter()
  const pathname = usePathname()

  const sequence: StoryStep[] = [
    "welcome",
    "network_overview",
    "cost_corridor",
    "busiest_hub",
    "sla_risk",
    "optimization",
    "prediction",
    "financial_impact",
    "savings",
    "complete"
  ]

  const startStoryMode = () => {
    setIsDemoMode(true)
    setActiveStoryStep("welcome")
    router.push("/dashboard") // Start at dashboard
  }

  const stopStoryMode = () => {
    setIsDemoMode(false)
    setActiveStoryStep("idle")
  }

  const nextStep = () => {
    if (!isDemoMode || activeStoryStep === "idle" || activeStoryStep === "complete") return
    const currentIndex = sequence.indexOf(activeStoryStep)
    if (currentIndex < sequence.length - 1) {
      const next = sequence[currentIndex + 1]
      setActiveStoryStep(next)
    }
  }

  // Handle automatic routing based on story step
  useEffect(() => {
    if (!isDemoMode) return

    switch (activeStoryStep) {
      case "welcome":
        if (pathname !== "/dashboard") router.push("/dashboard")
        break
      case "network_overview":
      case "cost_corridor":
      case "busiest_hub":
      case "sla_risk":
        if (pathname !== "/network") router.push("/network")
        break
      case "optimization":
        if (pathname !== "/optimization") router.push("/optimization")
        break
      case "prediction":
        if (!pathname.startsWith("/predictions")) router.push("/predictions/dashboard")
        break
      case "financial_impact":
      case "savings":
        if (pathname !== "/executive") router.push("/executive")
        break
      case "complete":
        // End of tour
        break
    }
  }, [activeStoryStep, isDemoMode, pathname, router])

  return (
    <DemoContext.Provider value={{ isDemoMode, activeStoryStep, startStoryMode, stopStoryMode, nextStep }}>
      {children}

      {/* Global Story Mode Overlay UI */}
      {isDemoMode && activeStoryStep !== "idle" && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl border border-slate-700 flex items-center space-x-6 animate-fade-in-up">
          <div className="flex flex-col">
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Scenario Walkthrough</span>
            <span className="text-sm font-semibold">
              {activeStoryStep === "welcome" && "Welcome to Sanchar AI Mission Control"}
              {activeStoryStep === "network_overview" && "Global Network Overview"}
              {activeStoryStep === "cost_corridor" && "Highlighting Highest Cost Corridor"}
              {activeStoryStep === "busiest_hub" && "Identifying Busiest Hub"}
              {activeStoryStep === "sla_risk" && "Analyzing Highest SLA Risk"}
              {activeStoryStep === "optimization" && "Running Optimization Engines"}
              {activeStoryStep === "prediction" && "Predictive Analytics Forecast"}
              {activeStoryStep === "financial_impact" && "Executive Financial Impact"}
              {activeStoryStep === "savings" && "Estimated Annual Savings"}
              {activeStoryStep === "complete" && "Mission Complete"}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={stopStoryMode}
              className="text-xs px-3 py-1.5 rounded-full hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={nextStep}
              className="text-xs px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-full font-bold transition-colors"
            >
              {activeStoryStep === "complete" ? "Finish" : "Next Step ➔"}
            </button>
          </div>
        </div>
      )}
    </DemoContext.Provider>
  )
}

export function useDemo() {
  const context = useContext(DemoContext)
  if (context === undefined) {
    throw new Error("useDemo must be used within a DemoProvider")
  }
  return context
}
