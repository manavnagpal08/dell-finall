"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Rocket, 
  Activity, 
  TrendingUp, 
  BrainCircuit, 
  Briefcase, 
  PlayCircle,
  X,
  Menu
} from "lucide-react"
import { useDemo } from "@/components/providers/demo-provider"

export function CommandCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { startStoryMode, isDemoMode } = useDemo()

  const toggleOpen = () => setIsOpen(!isOpen)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  if (isDemoMode) return null



  const navigate = (path: string) => {
    router.push(path)
    setIsOpen(false)
  }

  const handleOpenProductTour = () => {
    setIsOpen(false)
    startStoryMode()
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4 print:hidden">
      {/* Expanded Menu */}
      {isOpen && (
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-2 rounded-2xl shadow-2xl flex flex-col space-y-1 w-64 animate-fade-in-up">
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Actions</span>
          </div>
          
          <button onClick={() => navigate("/dashboard")} className="flex items-center space-x-3 w-full p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group">
            <div className="bg-blue-50 p-1.5 rounded-lg group-hover:bg-blue-100 transition-colors">
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-800">Mission Overview</span>
            </div>
          </button>

          <button onClick={() => navigate("/network")} className="flex items-center space-x-3 w-full p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group">
            <div className="bg-emerald-50 p-1.5 rounded-lg group-hover:bg-emerald-100 transition-colors">
              <Rocket className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-800">Network Health</span>
            </div>
          </button>

          <button onClick={() => navigate("/optimization")} className="flex items-center space-x-3 w-full p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group">
            <div className="bg-purple-50 p-1.5 rounded-lg group-hover:bg-purple-100 transition-colors">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-800">Optimization</span>
            </div>
          </button>

          <button onClick={() => navigate("/predictions/dashboard")} className="flex items-center space-x-3 w-full p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group">
            <div className="bg-indigo-50 p-1.5 rounded-lg group-hover:bg-indigo-100 transition-colors">
              <BrainCircuit className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-800">Prediction</span>
            </div>
          </button>

          <button onClick={() => navigate("/executive")} className="flex items-center space-x-3 w-full p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group border-b border-slate-100 pb-3 mb-1">
            <div className="bg-slate-100 p-1.5 rounded-lg group-hover:bg-slate-200 transition-colors">
              <Briefcase className="h-4 w-4 text-slate-700" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-800">Executive Summary</span>
            </div>
          </button>

          <button onClick={handleOpenProductTour} className="flex items-center justify-center space-x-2 w-full p-3 rounded-xl bg-brand-primary hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-500/20 group mt-2">
            <PlayCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Open Product Tour</span>
          </button>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        onClick={toggleOpen}
        className={`h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 ${isOpen ? 'bg-slate-800 text-white rotate-90' : 'bg-brand-primary text-white shadow-blue-500/30'}`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
    </div>
  )
}
