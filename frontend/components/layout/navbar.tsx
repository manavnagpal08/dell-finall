"use client"

import React, { useState } from "react"
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
  ShieldCheck,
  Clock3,
  AlertOctagon
} from "lucide-react"
import { useUiStore } from "@/store/ui"
import { useAuthStore } from "@/store/auth"
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"

export function Navbar() {
  const { toggleAiPanel, aiPanelOpen } = useUiStore()
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

      {/* Left: Workspace & Status */}
      <div className="flex items-center space-x-4">
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
      <div className="flex items-center space-x-2 lg:space-x-4">
        <Link
          href="/alerts"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors shadow-sm"
        >
          <AlertOctagon className="h-4 w-4" />
          <span className="text-xs font-bold hidden sm:inline-block">AI Alert Center</span>
        </Link>
        {/* Ask AI Button */}
        <button
          onClick={toggleAiPanel}
          className={cn(
            "p-2 rounded-lg transition-colors relative",
            aiPanelOpen
              ? "bg-blue-50 text-brand-primary"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          )}
          title="Toggle Operations Copilot"
        >
          <Sparkles className="h-4 w-4" />
        </button>

        {/* Notification Bell with counter */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "p-2 rounded-lg transition-colors relative",
              showNotifications ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:bg-slate-100"
            )}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl z-50 animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 px-1">
                <span className="font-bold text-slate-800">Alert Center</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-brand-primary hover:underline font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "p-2 rounded-lg border transition-colors",
                      n.read ? "bg-white border-slate-100" : "bg-blue-50/40 border-blue-100"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <span className={cn("font-bold", n.read ? "text-slate-700" : "text-slate-900")}>
                        {n.title}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">{n.time}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 pl-3 border-l border-slate-200 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-brand-primary font-bold text-xs shadow-sm">
              {initials}
            </div>
            <div className="hidden lg:block text-left text-xs">
              <p className="font-bold text-slate-800">{user?.fullName || "Operations User"}</p>
              <p className="text-[9px] text-slate-400 font-semibold uppercase">{user?.role || "Viewer"}</p>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400 hidden lg:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2.5 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 animate-fade-in text-xs">
              <div className="px-2.5 py-2 border-b border-slate-100 text-[10px] text-slate-400 font-medium">
                Signed in as <span className="font-bold text-slate-700">{user?.email}</span>
                <span className="mt-1 block">Workspace: <span className="font-bold text-slate-700">{workspace}</span></span>
              </div>
              <div className="py-1">
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 flex items-center space-x-2 text-slate-600 transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Profile Overview</span>
                </button>
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 flex items-center space-x-2 text-slate-600 transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>System Settings</span>
                </button>
              </div>
              <div className="border-t border-slate-100 pt-1 mt-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 flex items-center space-x-2 text-slate-600 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
