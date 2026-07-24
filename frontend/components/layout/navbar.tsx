"use client"

import React, { useState } from "react"
import Image from "next/image"
import {
  Bell,
  User,
  Search,
  ChevronDown,
  Settings,
  LogOut,
  Sparkles,
  Layers,
  Building2,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Menu,
  Globe
} from "lucide-react"
import { useUiStore } from "@/store/ui"
import { useAuthStore } from "@/store/auth"
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function Navbar() {
  const router = useRouter()
  const { toggleAiPanel, aiPanelOpen, toggleMobileSidebar, logisticsMode, setLogisticsMode } = useUiStore()
  const { user, logout } = useAuthStore()
  const supabase = createClient()
  const [workspace, setWorkspace] = useState("Global Supply Chain")
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, title: "SLA Risk Alert", desc: "Route HUB-BLR to HUB-MUM showing high delay risk (38%)", time: "10m ago", read: false, type: "route" },
    { id: 2, title: "Critical Stock", desc: "Part category 'Transceivers' below safety threshold in HUB-MUM", time: "45m ago", read: false, type: "inventory" },
    { id: 3, title: "AI Optimization Recommendation", desc: "Rerouting suggested for 5 pending shipments to save $14,200", time: "2h ago", read: true, type: "ai" }
  ])

  const unreadCount = notifications.filter(n => !n.read).length
  const workspaceMeta: Record<string, { region: string; tenant: string; freshness: string; env: string }> = {
    "Global Supply Chain": { region: "Global", tenant: "Sanchar AI Logistics", freshness: "Updated 2m ago", env: "Production" },
    "North American Operations": { region: "NA", tenant: "Sanchar AI Logistics", freshness: "Updated 5m ago", env: "Production" },
    "EMEA Regions": { region: "EMEA", tenant: "Sanchar AI Logistics", freshness: "Updated 8m ago", env: "Production" },
    "APAC Repair Centers": { region: "APAC", tenant: "Sanchar AI Logistics", freshness: "Updated 3m ago", env: "Production" },
  }
  const activeWorkspace = workspaceMeta[workspace]

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    window.location.href = "/auth/login"
  }

  const initials = (user?.fullName || user?.email || "User")
    .split(/[ @.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join("") || "U"

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/70 backdrop-blur-md px-6 select-none">

      {/* Left: NetOpti Branding & Workspace */}
      <div className="flex items-center space-x-3 md:space-x-4">
        {/* Hamburger Menu (Mobile Only) */}
        <button 
          onClick={toggleMobileSidebar}
          className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Sanchar AI Branding (Removed due to duplicate in sidebar) */}




        {/* Workspace Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
            className="flex items-center space-x-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors border border-slate-200 bg-white shadow-sm"
          >
            <Layers className="h-3.5 w-3.5 text-brand-primary" />
            <span>{workspace}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showWorkspaceMenu && (
            <div className="absolute left-0 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-50 animate-fade-in text-xs">
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Organization Workspaces
              </div>
              {["Global Supply Chain", "North American Operations", "EMEA Regions", "APAC Repair Centers"].map((ws) => (
                <button
                  key={ws}
                  onClick={() => {
                    setWorkspace(ws)
                    setShowWorkspaceMenu(false)
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium",
                    workspace === ws ? "text-brand-primary bg-slate-50 font-bold" : "text-slate-600"
                  )}
                >
                  <span className="block">{ws}</span>
                  <span className="block text-[9px] font-semibold text-slate-400">{workspaceMeta[ws].region} / {workspaceMeta[ws].env}</span>
                </button>
              ))}
            </div>
          )}
        </div>


      </div>

      {/* Middle: Global Search trigger */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <button
          onClick={() => {
            // Trigger CommandCenter / Search Command palette shortcut
            const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true })
            window.dispatchEvent(e)
          }}
          className="w-full flex items-center justify-between text-xs text-slate-400 bg-slate-50 border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-slate-400" />
            <span>Search Shipment, Hub, Route, Vehicle...</span>
          </div>
          <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 bg-white font-mono text-[9px] font-medium text-slate-400">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center space-x-3">
        <button onClick={() => toggleAiPanel()} className="flex h-[38px] items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-emerald-700 shadow-sm transition-colors hover:bg-emerald-100 font-bold text-xs">
          <Sparkles className="h-4 w-4" /> Ask Sathi
        </button>

        <div className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#00B67A]" />
            <span className="text-[13px] font-bold text-[#0F172A]">Live</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <button className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-emerald-700">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh data
          </button>
        </div>
        
        <div onClick={() => router.push('/alerts')} className="relative flex h-[38px] w-[38px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && <div className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-rose-500 border-[2px] border-white" />}
        </div>
        
        <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-[13px] font-bold text-[#0F172A] shadow-sm cursor-pointer hover:bg-slate-100 transition-colors">
          {initials}
        </div>
      </div>
    </header>
  )
}
