"use client"

import React, { useState, useEffect } from "react"
import {
  Sparkles,
  Play,
  ArrowRight,
  ArrowLeft,
  Activity,
  Award,
  Layers,
  HelpCircle,
  Clock,
  BookOpen,
  DollarSign,
  TrendingDown,
  Cpu,
  Database,
  Lock,
  Globe,
  Flame,
  FileText
} from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<"tour" | "impact" | "architecture">("tour")
  const [tourStep, setTourStep] = useState(0)
  const [reviewMode, setReviewMode] = useState(false)
  const [timer, setTimer] = useState(480)


  useEffect(() => {
    const saved = localStorage.getItem("review_mode") === "true"
    setReviewMode(saved)
  }, [])

  const toggleReviewMode = () => {
    const nextVal = !reviewMode
    setReviewMode(nextVal)
    localStorage.setItem("review_mode", String(nextVal))
    window.dispatchEvent(new Event("storage"))
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 480))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const tourSteps = [
    {
      title: "1. Mission Control Center",
      desc: "Live operational hub displaying logistics assets, SLA alerts, and hub workloads.",
      value: "Reduces critical delay response latency from hours to minutes.",
      ai: "Highlights predicted breaches using historical SLA features.",
      href: "/dashboard"
    },
    {
      title: "2. Operations Copilot",
      desc: "Natural language assistant parsing databases to answer complex logistics questions.",
      value: "Enables natural voice queries of logistics databases.",
      ai: "Orchestrated tool-calling loops executing local SQL helpers.",
      href: "/dashboard"
    },
    {
      title: "3. Interactive Digital Twin",
      desc: "Live animated coordinate mapping of routes, parts inventory health, and carbon footprint outputs.",
      value: "Improves spatial network visibility across dispatch zones.",
      ai: "Simulates 'What-If' scenarios like offline hubs using alternative routing loops.",
      href: "/twin"
    },
    {
      title: "4. Executive War Room",
      desc: "Multi-level approval center to authorize and comment on cost saving and bypass routes.",
      value: "Introduces secure, auditable execution lines for managers.",
      ai: "Ranks routes dynamically by cost, speed, capacity, and risk.",
      href: "/war-room"
    }
  ]

  const currentStep = tourSteps[tourStep]

  return (
    <div className="space-y-6 font-sans text-xs select-none">

      {/* Page Header */}
      <PageHeader
        title="Executive Scenario Deck"
        description="Product onboarding workspace for scenario review, architecture context, and business impact."
        actions={
          <div className="flex items-center space-x-3.5">
            {/* Presentation timer */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-xl font-bold font-mono">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>Session: {formatTimer(timer)}</span>
            </div>

            <button
              onClick={toggleReviewMode}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-extrabold shadow-sm border transition-colors ${reviewMode ? 'bg-amber-500 border-amber-600 text-white animate-pulse' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              <Award className="h-4 w-4" />
              <span>{reviewMode ? "Product Tour Active" : "Enable Product Tour"}</span>
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm max-w-sm">
        {[
          { key: "tour", label: "Guided Product Tour", icon: Play },
          { key: "impact", label: "Business Impact", icon: Award },
          { key: "architecture", label: "Architecture Explorer", icon: Layers }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`flex items-center space-x-1.5 flex-1 px-3 py-1.5 rounded-lg font-bold text-[10px] transition-colors ${activeTab === t.key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <t.icon className="h-3.5 w-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5 items-start">

        {/* Main interactive cards */}
        <div className="col-span-12 lg:col-span-8 space-y-4">

          {/* Guided Tour Tab */}
          {activeTab === "tour" && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center space-x-1.5">
                    <Sparkles className="h-4.5 w-4.5 text-blue-500 animate-spin" />
                    <span>{currentStep.title}</span>
                  </CardTitle>
                  <CardDescription>Step-by-step product tour detailing workflows and operational value.</CardDescription>
                </div>
                <Badge variant="info" className="text-[9px] font-extrabold">{tourStep + 1} / 4</Badge>
              </CardHeader>
              <CardContent className="pt-3.5 space-y-4 font-bold text-slate-655 text-[10.5px]">
                <p className="text-slate-800 text-[11px] leading-relaxed">{currentStep.desc}</p>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div>
                    <span className="text-[8px] text-slate-400 block uppercase">Business Value</span>
                    <span className="text-slate-700 font-semibold block mt-0.5">{currentStep.value}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 block uppercase">AI Orchestration</span>
                    <span className="text-slate-700 font-semibold block mt-0.5">{currentStep.ai}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <div className="flex space-x-2">
                    <button
                      disabled={tourStep === 0}
                      onClick={() => setTourStep(prev => prev - 1)}
                      className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button
                      disabled={tourStep === tourSteps.length - 1}
                      onClick={() => setTourStep(prev => prev + 1)}
                      className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  <a
                    href={currentStep.href}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg shadow-sm"
                  >
                    <span>Launch Interface</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Business Impact Tab */}
          {activeTab === "impact" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center space-x-1.5">
                  <Award className="h-4.5 w-4.5 text-blue-500" />
                  <span>Business Impact metrics</span>
                </CardTitle>
                <CardDescription>KPI gains achieved across operations segments using the live platform.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {[
                  { name: "Estimated Cost Savings", val: "$142,000", desc: "12.4% reduction via direct bypasses" },
                  { name: "Avg Route Speed", val: "+1.8 days", desc: "SLA compliance improvements" },
                  { name: "Carbon Emission Offset", val: "1,420 kg CO2", desc: "Greenest routing filters" },
                  { name: "Copilot Automation Accuracy", val: "94.2%", desc: "Structured workflow accuracy" }
                ].map((k, idx) => (
                  <div key={idx} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 font-bold">
                    <span className="text-[8px] text-slate-400 block uppercase tracking-wider">{k.name}</span>
                    <span className="text-lg font-black text-slate-800 mt-1 block">{k.val}</span>
                    <span className="text-[8.5px] text-slate-400 block font-semibold mt-0.5">{k.desc}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Interactive Architecture Explorer */}
          {activeTab === "architecture" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center space-x-1.5">
                  <Layers className="h-4.5 w-4.5 text-blue-500" />
                  <span>Interactive Architecture Explorer</span>
                </CardTitle>
                <CardDescription>Visual mapping of our enterprise stack components. Click each block to view role details.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {[
                  { name: "Next.js Frontend Client", tech: "React, Tailwind, mapbox-gl", desc: "Visualizes the mapping layers, simulation controls, and collapsible chat panel.", icon: Globe },
                  { name: "FastAPI Backend API", tech: "Python, Uvicorn", desc: "Handles local DB lookups, carbon footprint calculators, and model integrations.", icon: Cpu },
                  { name: "Supabase & Postgres DB", tech: "Postgres SQL, Row Level Security", desc: "Stores active logistics transactions and hub capacity metrics.", icon: Database },
                  { name: "Operations Copilot Service", tech: "Secure inference API", desc: "Drives natural language query interpretation and formatted brief summaries.", icon: Sparkles }
                ].map((c, idx) => (
                  <div key={idx} className="p-3.5 border border-slate-150 hover:border-blue-300 rounded-xl bg-white space-y-2 cursor-pointer font-bold text-slate-655">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                        <c.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-slate-800 font-extrabold block text-[10.5px]">{c.name}</span>
                        <span className="text-[8px] text-slate-400 block font-mono mt-0.5">{c.tech}</span>
                      </div>
                    </div>
                    <p className="text-[9.5px] text-slate-400 font-medium leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

        </div>

        {/* Right Sidebar: Talking Points */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1.5">
                <Award className="h-4 w-4 text-amber-500" />
                <span>Pitch Talking Points</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3.5 space-y-3 font-bold text-slate-550 text-[10px] leading-relaxed">
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                <span className="text-slate-800 block mb-1">➔ Innovation Angle:</span>
                <p className="text-slate-500 font-medium">Unlike static dashboards, our twin runs calculations over real regional logistics records.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                <span className="text-slate-800 block mb-1">➔ AI groundings:</span>
                <p className="text-slate-500 font-medium">The copilot is grounded on approved logistics data queries to keep analysis tied to operational evidence.</p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
