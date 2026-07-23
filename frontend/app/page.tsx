"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  GitBranch,
  Leaf,
  Map,
  MessageSquareText,
  Radar,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
  LockKeyhole,
  Wrench,
  Activity,
  Layers,
  Database
} from "lucide-react"

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

const features = [
  {
    title: "Agentic Route Recommender",
    desc: "AI-driven decision tree that ranks logistics paths while evaluating cost, SLA, carbon, and transit tradeoffs in real-time.",
    icon: Route,
    color: "text-[#2E5BFF]",
    bg: "bg-[#2E5BFF]/10",
    border: "border-[#2E5BFF]/20"
  },
  {
    title: "Cost Intelligence Center",
    desc: "Transaction-level audit engine finding money leaks, cost/km outliers, and top corridor reroute savings automatically.",
    icon: BarChart3,
    color: "text-[#00B67A]",
    bg: "bg-[#00B67A]/10",
    border: "border-[#00B67A]/20"
  },
  {
    title: "Dynamic Alert Center",
    desc: "Closed-loop execution engine that turns risk, cost, stock, and congestion signals into accountable next actions.",
    icon: Radar,
    color: "text-rose-500",
    bg: "bg-rose-50",
    border: "border-rose-200"
  },
  {
    title: "Reverse Logistics & Repair",
    desc: "Detects over-capacity repair centers (TPRs) and auto-recommends consolidation or restock transfers.",
    icon: Wrench,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200"
  }
]

const operationalModules = [
  { id: "1", title: "Geospatial Visualization", detail: "Network Map, route lines, TPR capacity, heat/bubble risk, corridor cost flows", icon: Map },
  { id: "2", title: "Route Efficiency", detail: "Top corridors, cost-per-unit-km outliers, bottlenecks, chronic delays", icon: Activity },
  { id: "3", title: "Routing Agent", detail: "Stock-aware AI decision tree, alternatives, SLA downrank, full justification", icon: BrainCircuitIcon },
  { id: "4", title: "Cost Model", detail: "Suboptimal transaction audit, savings by hub/category, top-3 what-if", icon: DollarSignIcon },
  { id: "5", title: "Reverse Logistics", detail: "TPR utilization, closer TPR routing, consolidation, restock alerts", icon: RefreshCw },
  { id: "6", title: "SLA Predictor", detail: "ML metrics, confusion matrix, route risk integration, feedback loop", icon: ShieldCheck },
]

const differentiators = [
  { title: "Dynamic Re-routing", detail: "Simulate a hub outage and auto-reroute affected in-flight shipments in real-time.", icon: RefreshCw },
  { title: "Natural Language Analytics", detail: "Ask questions like 'which hub has most SLA breaches' and get visual answers.", icon: MessageSquareText },
  { title: "Pareto Optimization", detail: "Compare cost, speed, SLA, and carbon on a real Pareto frontier for every shipment.", icon: GitBranch },
  { title: "Carbon-Aware Routing", detail: "Calculate shipment CO2 and surface greener route tradeoffs automatically.", icon: Leaf },
  { title: "Agent Audit Trail", detail: "Every route shows rules fired, data drivers, confidence, and AI justifications.", icon: LockKeyhole },
  { title: "Operational Action Queue", detail: "Turns risk, cost, stock, and repair signals into accountable, one-click next actions.", icon: Radar },
]

// Custom animated flow line for network effect
function FlowLine({ delay = "0s", top = "50%" }: { delay?: string; top?: string }) {
  return (
    <div
      className="absolute left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00B67A]/20 to-transparent overflow-hidden"
      style={{ top }}
    >
      <div
        className="absolute top-0 left-0 h-full w-[150px] bg-gradient-to-r from-transparent via-[#00B67A] to-transparent animate-scan"
        style={{ animationDelay: delay }}
      ></div>
    </div>
  )
}

function BrainCircuitIcon(props: any) {
  return <Sparkles {...props} />
}

function DollarSignIcon(props: any) {
  return <BarChart3 {...props} />
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] selection:bg-[#00B67A] selection:text-white font-sans overflow-hidden">

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[90vh] flex flex-col justify-center border-b border-slate-200 bg-white">

        {/* Animated Background Mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-slate-50 to-transparent"></div>
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#00B67A]/10 blur-[120px] mix-blend-multiply animate-blob"></div>
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-[#2E5BFF]/10 blur-[120px] mix-blend-multiply animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-[#00B67A]/5 blur-[120px] mix-blend-multiply animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-30"></div>

          {/* Animated Supply Chain Lines */}
          <FlowLine top="20%" delay="0s" />
          <FlowLine top="45%" delay="1.5s" />
          <FlowLine top="75%" delay="3s" />

          {/* Floating Nodes */}
          <motion.div
            animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[30%] left-[15%] w-3 h-3 rounded-full bg-[#2E5BFF] shadow-[0_0_20px_#2E5BFF]"
          />
          <motion.div
            animate={{ y: [0, 20, 0], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-[60%] right-[20%] w-4 h-4 rounded-full bg-[#00B67A] shadow-[0_0_20px_#00B67A]"
          />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-10 w-full pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="px-4 py-2 rounded-full bg-[#00B67A]/10 border border-[#00B67A]/20 flex items-center gap-2 shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00B67A] animate-pulse"></span>
                  <span className="text-[11px] font-black text-[#00B67A] uppercase tracking-widest">Enterprise AI Workspace</span>
                </div>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-[75px] font-black tracking-tighter text-slate-900 leading-[1.05] mb-6">
                Intelligent Logistics. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B67A] to-[#008f5d]">
                  Zero Compromise.
                </span>
              </h1>

              <p className="text-lg text-slate-500 font-medium max-w-xl leading-relaxed mb-10">
                The next-generation supply chain command center. Sanchar AI auto-detects money leaks, mitigates SLA risks, and executes network-wide rerouting with a single click.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link href="/dashboard" className="flex items-center gap-2 px-8 py-4 rounded-xl bg-[#00B67A] hover:bg-[#009b68] text-white font-black text-lg transition-all shadow-[0_0_30px_rgba(0,182,122,0.3)] hover:shadow-[0_0_40px_rgba(0,182,122,0.5)]">
                  Enter Command Center <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/network" className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-black text-lg transition-all shadow-sm hover:shadow-md">
                  <Map className="w-5 h-5" /> View Network Map
                </Link>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="relative hidden lg:block"
            >
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 shadow-2xl shadow-[#00B67A]/20 group">
                <Image
                  src="/hero_dashboard.png"
                  alt="Sanchar AI Dashboard Preview"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
              </div>
              <div className="absolute -inset-4 rounded-[2rem] border border-[#00B67A]/20 bg-[#00B67A]/5 -z-10 blur-xl"></div>
            </motion.div>
          </div>
        </div>

        {/* Floating Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-10 w-full mt-24 pb-12"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-[24px] bg-white/80 border border-slate-200/80 backdrop-blur-xl shadow-xl shadow-slate-200/40">
            {[
              { label: "Validated Rows", value: "1,800+" },
              { label: "Network Nodes", value: "20" },
              { label: "Operational Domains", value: "6" },
              { label: "AI Accuracy", value: "94.2%" },
            ].map((stat, idx) => (
              <div key={idx}>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">{stat.label}</p>
                <p className="text-4xl font-black text-slate-900 tracking-tight">{stat.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* --- TRUSTED BY BANNER (Animated Marquee) --- */}
      <section className="py-12 border-b border-slate-200 bg-white overflow-hidden relative">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 mb-8">
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Built for Global Enterprise Scale</p>
        </div>

        {/* CSS Marquee Effect */}
        <div className="flex w-[200%] animate-marquee opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          <div className="flex items-center justify-around w-1/2 px-10 gap-20">
            <span className="text-3xl font-black text-slate-800 tracking-tighter whitespace-nowrap">GLOBAL SUPPLY CHAIN</span>
            <span className="text-3xl font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap"><Layers className="w-8 h-8"/> LOGISTICS CORP</span>
            <span className="text-3xl font-black text-slate-800 italic whitespace-nowrap">GlobalFreight</span>
            <span className="text-3xl font-bold text-slate-800 tracking-widest whitespace-nowrap">AERO<span className="text-[#00B67A]">SPACE</span></span>
          </div>
          <div className="flex items-center justify-around w-1/2 px-10 gap-20">
            <span className="text-3xl font-black text-slate-800 tracking-tighter whitespace-nowrap">GLOBAL SUPPLY CHAIN</span>
            <span className="text-3xl font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap"><Layers className="w-8 h-8"/> LOGISTICS CORP</span>
            <span className="text-3xl font-black text-slate-800 italic whitespace-nowrap">GlobalFreight</span>
            <span className="text-3xl font-bold text-slate-800 tracking-widest whitespace-nowrap">AERO<span className="text-[#00B67A]">SPACE</span></span>
          </div>
        </div>
      </section>

      {/* --- THE AI ENGINE HIGHLIGHTS --- */}
      <section className="py-32 bg-[#F8FAFC] text-slate-900 relative">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-4xl lg:text-5xl font-black tracking-tight mb-4">The AI Engine</motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-slate-500 font-medium max-w-2xl">
              A fully integrated suite of analytical tools designed to give you unprecedented visibility and control over your global network.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
          >
            {features.map((feat, idx) => (
              <motion.div variants={fadeUp} key={idx} className="group p-8 lg:p-10 rounded-[32px] bg-white border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-2xl hover:shadow-[#00B67A]/10 hover:-translate-y-2">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feat.bg} ${feat.color} ${feat.border} border group-hover:scale-110 transition-transform duration-300`}>
                  <feat.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black mb-3">{feat.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- WHY SANCHAR AI? (DIFFERENTIATORS) --- */}
      <section className="py-32 bg-white text-slate-900 relative border-t border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="mb-20 text-center max-w-3xl mx-auto"
          >
            <motion.h2 variants={fadeUp} className="text-4xl lg:text-5xl font-black tracking-tight mb-6">Beyond Traditional Routing</motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-slate-500 font-medium">
              We don't just visualize data. We close the loop between analytics and operational execution.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {differentiators.map((diff, idx) => (
              <motion.div variants={fadeUp} key={idx} className="group p-8 rounded-[24px] bg-[#F8FAFC] border border-slate-200 transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-[#2E5BFF]/10">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-sm group-hover:rotate-12 transition-transform duration-300">
                  <diff.icon className="w-6 h-6 text-[#2E5BFF]" />
                </div>
                <h4 className="text-xl font-black mb-3 text-slate-900 group-hover:text-[#2E5BFF] transition-colors duration-300">{diff.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{diff.detail}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- OPERATIONAL COVERAGE --- */}
      <section className="py-32 bg-[#F8FAFC] border-t border-slate-200 relative">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16"
          >
            <div>
              <motion.div variants={fadeUp} className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-[#00B67A]" />
                <span className="text-[12px] font-black uppercase tracking-widest text-slate-500">Operational Coverage</span>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl lg:text-5xl font-black tracking-tight">Live Network Intelligence</motion.h2>
            </div>
            <motion.p variants={fadeUp} className="text-slate-500 font-medium max-w-md">
              Real operational views for network visibility, route efficiency, recommendations, cost, reverse logistics, and predictive SLA control.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {operationalModules.map((mod) => (
              <motion.div variants={fadeUp} key={mod.id} className="group p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex gap-4 hover:border-[#00B67A] transition-colors duration-300">
                <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 font-black text-sm group-hover:bg-[#00B67A] group-hover:text-white transition-colors duration-300">
                  0{mod.id}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                    {mod.title} <mod.icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#00B67A] transition-colors duration-300" />
                  </h4>
                  <p className="text-xs font-semibold text-slate-500 leading-relaxed">{mod.detail}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-20 text-center">
            <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-xl bg-[#00B67A] hover:bg-[#009b68] text-white font-black text-lg transition-all shadow-[0_0_30px_rgba(0,182,122,0.3)] hover:shadow-[0_0_40px_rgba(0,182,122,0.5)]">
              Launch Application <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 flex items-center justify-center shrink-0">
              <Image src="/logo.png" alt="Sanchar AI Logo" width={48} height={48} className="h-full w-full object-contain" />
            </div>
            <span className="font-black text-slate-900 text-xl tracking-tight">Sanchar AI</span>
          </div>
          <p className="text-sm font-semibold text-slate-400">
            © 2026 Sanchar AI. Logistics intelligence for resilient supply chains.
          </p>
          <div className="flex items-center gap-6 text-sm font-bold text-slate-400">
            <span className="hover:text-slate-900 cursor-pointer transition-colors">Documentation</span>
            <span className="hover:text-slate-900 cursor-pointer transition-colors">API Status</span>
            <span className="hover:text-slate-900 cursor-pointer transition-colors">Security</span>
          </div>
        </div>
      </footer>

    </main>
  )
}
