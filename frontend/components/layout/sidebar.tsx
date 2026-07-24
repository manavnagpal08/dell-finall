"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { 
  Home,
  Package,
  ShieldAlert,
  Coins,
  RefreshCw,
  FileText,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Compass,
  Briefcase,
  Activity,
  LockKeyhole,
  Database,
  Plug,
  BarChart3,
  BrainCircuit,
  Leaf,
  Map,
  Network,
  Sparkles,
  TrendingUp,
  Shield
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
      { name: "Routing", href: "/routing", icon: Map },
    ]
  },
  {
    title: "Optimization",
    items: [
      { name: "Cost Optimization", href: "/cost-optimization", icon: Coins },
      { name: "Demand Positioning", href: "/demand-positioning", icon: Package },
      { name: "Risk Center", href: "/predictions", icon: ShieldAlert },
      { name: "Carrier Intelligence Center", href: "/carrier-intelligence", icon: BarChart3 },
      { name: "AI Sustainability Tree", href: "/sustainability", icon: Leaf },
    ]
  },
  {
    title: "Management",
    items: [
      { name: "Data Connectors", href: "/integrations/connectors", icon: Plug },
      { name: "Analytics Reports", href: "/reports", icon: FileText },
      { name: "System Settings", href: "/settings", icon: Settings },
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
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useUiStore()
  const { user } = useAuthStore()
  const [isHovered, setIsHovered] = React.useState(false)
  const visibleSections = sections
  const isExpanded = !sidebarCollapsed || isHovered

  return (
    <>
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex h-full flex-col bg-white text-slate-800 select-none transition-all duration-300 border-r border-slate-100",
          isExpanded ? "w-[280px]" : "w-20",
          !mobileSidebarOpen && "-translate-x-full md:translate-x-0",
          sidebarCollapsed && isHovered && "shadow-2xl"
        )}
      >
      {/* Brand Header */}
      <div className="flex h-20 items-center justify-between px-5 border-b border-slate-100 bg-white">
        <Link href="/dashboard" className="flex items-center space-x-3 overflow-hidden">
          <div className="flex h-10 w-10 items-center justify-center shrink-0">
            <Image src="/logo.png" alt="Sanchar AI Logo" width={40} height={40} className="h-full w-full object-contain" />
          </div>
          {isExpanded && (
            <div>
              <span className="text-[15px] font-bold tracking-tight text-slate-900 block leading-none whitespace-nowrap">
                Sanchar AI
              </span>
            </div>
          )}
        </Link>
        <button 
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
        {visibleSections.map((sec, secIdx) => {
          return (
            <div key={sec.title} className={cn("space-y-1.5", secIdx > 0 && "mt-8")}>
              {isExpanded ? (
                <div className="flex items-center justify-between px-3 mb-3">
                  <span className="text-[10px] font-black text-slate-400/80 uppercase tracking-wider whitespace-nowrap">
                    {sec.title}
                  </span>
                </div>
              ) : (
                <div className="flex justify-center mb-3">
                  <div className="h-0.5 w-6 bg-slate-200 rounded-full" />
                </div>
              )}
              
              <div className="space-y-1">
                {sec.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                  const allowedRoles = restrictedRoutes[item.href]
                  const isRestrictedForRole = !!allowedRoles && !!user?.role && !allowedRoles.includes(user.role)
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={cn(
                        "flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                        isActive 
                          ? "bg-[#e6f7ef] text-[#059669]"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      )}
                    >
                      {/* Active Indicator Left Border */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r bg-[#059669]" />
                      )}
                      
                      <div className="flex items-center gap-3.5">
                        <item.icon className={cn(
                          "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                          isActive ? "text-[#059669]" : "text-slate-500 group-hover:text-slate-600"
                        )} strokeWidth={2.5} />
                        
                        {isExpanded && (
                          <span className={cn(
                            "text-[13px] whitespace-nowrap overflow-hidden text-ellipsis", 
                            isActive ? "font-bold text-[#059669]" : "font-bold text-slate-600 group-hover:text-slate-800"
                          )}>
                            {item.name}
                          </span>
                        )}
                      </div>
                      
                      {isExpanded && isRestrictedForRole && (
                        <div className="ml-auto">
                          <LockKeyhole className="h-3.5 w-3.5 text-slate-300" />
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 mt-auto border-t border-slate-100 overflow-hidden">
        {isExpanded ? (
          <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold text-xs shrink-0">
                 AD
               </div>
               <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                 <p className="text-[13px] font-bold text-slate-900">Admin User</p>
                 <p className="text-[11px] font-medium text-slate-500">Administrator</p>
               </div>
             </div>
             <ChevronDown size={14} className="text-slate-400 shrink-0" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold text-xs mx-auto cursor-pointer shrink-0">
            AD
          </div>
        )}
      </div>
    </aside>
    </>
  )
}
