"use client"

import React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Navbar } from "./navbar"
import { useUiStore } from "@/store/ui"
import { seededOperator, useAuthStore } from "@/store/auth"
import { cn } from "@/lib/utils"

import { AiPanel } from "../copilot/ai-panel"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarCollapsed, aiPanelOpen, toggleAiPanel, setAiPanelOpen } = useUiStore()
  const { isAuthenticated, isLoading, setSession } = useAuthStore()
  const isPublicPage = pathname === "/" || pathname.startsWith("/auth")

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicPage) {
      router.push("/auth/login")
    }
  }, [isAuthenticated, isLoading, isPublicPage, router])

  React.useEffect(() => {
    setAiPanelOpen(false)
  }, [pathname, setAiPanelOpen])

  if (isPublicPage) {
    return <>{children}</>
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-slate-600">
        <div className="rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm font-semibold shadow-sm">
          {isLoading ? "Opening secure workspace..." : "Redirecting to sign in..."}
        </div>
      </div>
    )
  }

  const isFullWidthPage = pathname === "/network" || pathname === "/operations" || pathname === "/ai-investigation" || pathname === "/ai-recommendation-center" || pathname === "/recommendations" || pathname === "/cost-optimization"

  return (
    <div className="min-h-screen flex bg-[#f5f7fb] text-slate-900 selection:bg-blue-100 font-sans">
      <Sidebar />

      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 min-h-screen pl-0",
          sidebarCollapsed ? "md:pl-20" : "md:pl-64"
        )}
      >
        <Navbar />

        <main className={cn("flex-1 overflow-y-auto", !isFullWidthPage && "p-6 md:p-8")}>
          <div className={cn("mx-auto", !isFullWidthPage && "max-w-[1440px]", isFullWidthPage && "h-[calc(100vh-64px)] w-full")}>
            {children}
          </div>
        </main>
      </div>

      {aiPanelOpen && (
        <aside className="fixed bottom-0 right-0 z-50 flex h-full md:h-[520px] w-full md:w-[360px] md:bottom-24 md:right-6 flex-col overflow-hidden md:rounded-lg border border-slate-200 bg-white text-slate-800 shadow-2xl">
          <AiPanel onClose={toggleAiPanel} />
        </aside>
      )}
    </div>
  )
}


