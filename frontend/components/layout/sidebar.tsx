"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { 
  Home,
  Package,
  AlertTriangle,
  Truck,
  Coins,
  RefreshCw,
  ShieldAlert,
  FileText,
  ShieldCheck,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Compass,
  Briefcase,
  Activity,
  LockKeyhole,
  Database,
  Plug,
  BarChart3,
  BrainCircuit,
  Leaf,
  Map
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUiStore } from "@/store/ui"
import { useAuthStore, UserRole } from "@/store/auth"

const sections = [
  {
    title: "Operations",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Network Map", href: "/network", icon: Compass },
      { name: "Operations Explorer", href: "/operations", icon: Package },
      { name: "AI Recommendation Center", href: "/ai-recommendation-center", icon: RefreshCw },
      { name: "AI Decision Lab", href: "/ai-decision-lab", icon: BrainCircuit },
      { name: "Routing Intelligence", href: "/route-intelligence", icon: Truck },
      { name: "Routing", href: "/routing", icon: Map },
      { name: "Route Discovery", href: "/recommendations", icon: Compass },
    ]
  },
  {
    title: "Optimization",
    items: [
      { name: "Cost Optimization", href: "/cost-optimization", icon: Coins },
      { name: "Risk Center", href: "/predictions", icon: ShieldAlert },
      { name: "Carrier Intelligence Center", href: "/carrier-intelligence", icon: BarChart3 },
      { name: "AI Sustainability Tree", href: "/sustainability", icon: Leaf },
    ]
  },
  {
    title: "Management",
    items: [
      { name: "Data Connectors", href: "/integrations/connectors", icon: Plug },
      { name: "Reports", href: "/reports", icon: FileText },
      { name: "Settings", href: "/settings", icon: Settings },
    ]
  }

]

const restrictedRoutes: Record<string, UserRole[]> = {
  "/recommendations": ["Admin", "Operations Manager"],
  "/cost-optimization": ["Admin", "Operations Manager", "Logistics Analyst"],
  "/war-room": ["Admin", "Operations Manager"],
  "/integrations": ["Admin", "Operations Manager"],
  "/admin": ["Admin"],
  "/settings": ["Admin", "Operations Manager"],
}

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { user } = useAuthStore()
  const visibleSections = sections


  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex h-full flex-col border-r border-slate-200 bg-white text-slate-800 select-none transition-all duration-300",
        sidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100 bg-slate-50/50">
        <Link href="/dashboard" className="flex items-center space-x-3 overflow-hidden">
          <div className="flex h-10 w-10 items-center justify-center shrink-0">
            <Image src="/logo.png" alt="Sanchar AI Logo" width={40} height={40} className="h-full w-full object-contain drop-shadow-sm" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-sm font-bold tracking-wider text-slate-800 font-sans truncate">
              Sanchar AI
            </span>
          )}
        </Link>
        <button 
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 space-y-4 px-3 py-4 overflow-y-auto">
        {visibleSections.map((sec) => (
          <div key={sec.title} className="space-y-1">
            {!sidebarCollapsed && (
              <span className="px-3 text-[8.5px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                {sec.title}
              </span>
            )}
            {sec.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
              const allowedRoles = restrictedRoutes[item.href]
              const isRestrictedForRole = !!allowedRoles && !!user?.role && !allowedRoles.includes(user.role)
              
              return (
                <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 group relative",
                  isActive 
                    ? "bg-[#D1FAE5]/60 text-[#059669] font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-[#059669]" />
                )}
                <item.icon 
                  className={cn(
                    "h-4.5 w-4.5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105",
                    isActive ? "text-[#059669]" : "text-slate-400 group-hover:text-slate-600"
                  )} 
                />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {isRestrictedForRole && <LockKeyhole className="h-3 w-3 text-slate-300" />}
                  </>
                )}
              </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 text-center bg-slate-50/30">
        {!sidebarCollapsed ? (
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sanchar AI OS</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Production v1.0.0</p>
          </div>
        ) : (
          <span className="text-xs font-bold text-slate-400">S</span>
        )}
      </div>
    </aside>
  )
}
