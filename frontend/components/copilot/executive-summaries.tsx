"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, Clock, BarChart4, TrendingUp, AlertOctagon } from "lucide-react"

interface SummariesProps {
  onGenerate: (type: string) => void
  isGenerating: boolean
}

export function ExecutiveSummaries({ onGenerate, isGenerating }: SummariesProps) {
  const summaryTypes = [
    { id: 'daily', title: 'Daily Pulse', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', desc: '24hr logistics operational summary' },
    { id: 'weekly', title: 'Weekly Brief', icon: Calendar, color: 'text-indigo-500', bg: 'bg-indigo-50', desc: '7-day performance and SLA overview' },
    { id: 'optimization', title: 'Savings Report', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Identified optimization opportunities' },
    { id: 'risk', title: 'Risk Analysis', icon: AlertOctagon, color: 'text-red-500', bg: 'bg-red-50', desc: 'High-probability prediction threats' },
    { id: 'board', title: 'Board Summary', icon: BarChart4, color: 'text-purple-500', bg: 'bg-purple-50', desc: 'High-level financial & strategic brief' }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 w-full">
      {summaryTypes.map((type) => (
        <Card 
          key={type.id} 
          className="p-4 cursor-pointer hover:border-brand-primary transition-all hover:shadow-md bg-white border-slate-200 group flex flex-col items-center text-center space-y-3"
          onClick={() => !isGenerating && onGenerate(type.id)}
        >
          <div className={`p-3 rounded-full ${type.bg} ${type.color} group-hover:scale-110 transition-transform`}>
            <type.icon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">{type.title}</h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-tight">{type.desc}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}
