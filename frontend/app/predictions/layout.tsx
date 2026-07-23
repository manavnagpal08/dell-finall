import React from "react"
import Link from "next/link"
import { BrainCircuit, Activity, Cpu, Database, Network } from "lucide-react"

export default function PredictionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white">
        <div className="flex h-12 items-center px-6">
          <div className="flex items-center space-x-2 text-brand-primary">
            <BrainCircuit className="h-5 w-5" />
            <span className="font-bold">Predictive Intelligence</span>
          </div>
          <nav className="ml-8 flex items-center space-x-6 text-sm font-medium">
            <Link href="/predictions/dashboard" className="flex items-center text-slate-500 hover:text-slate-900 transition-colors">
              <Activity className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/predictions/simulator" className="flex items-center text-slate-500 hover:text-slate-900 transition-colors">
              <Network className="mr-2 h-4 w-4" />
              Risk Simulator
            </Link>
            <Link href="/predictions/models" className="flex items-center text-slate-500 hover:text-slate-900 transition-colors">
              <Cpu className="mr-2 h-4 w-4" />
              Model Management
            </Link>
            <Link href="/predictions/analytics" className="flex items-center text-slate-500 hover:text-slate-900 transition-colors">
              <Database className="mr-2 h-4 w-4" />
              Analytics
            </Link>
          </nav>
        </div>
      </div>
      <div className="flex-1 p-6 overflow-auto bg-slate-50">
        {children}
      </div>
    </div>
  )
}
