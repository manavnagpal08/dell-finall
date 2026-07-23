"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Leaf, Fuel, IndianRupee, TreePine, CloudLightning } from "lucide-react"

function AnimatedCounter({ from = 0, to, duration = 1.5, decimals = 0, suffix = "" }: { from?: number, to: number, duration?: number, decimals?: number, suffix?: string }) {
  const [value, setValue] = useState(from)

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      // Easing function (easeOutQuart)
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const current = from + (to - from) * easeProgress;

      setValue(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [from, to, duration]);

  return <span>{value.toFixed(decimals)}{suffix}</span>
}

interface SustainabilityOverviewProps {
  carbonSavedYtd?: number;
  optimizationsCount?: number;
  fuelSaved?: number;
  costSaved?: number;
  treesPlanted?: number;
  carbonScore?: number;
}

export function SustainabilityOverview({
  carbonSavedYtd = 0,
  optimizationsCount = 0,
  fuelSaved = 0,
  costSaved = 0,
  treesPlanted = 0,
  carbonScore = 0
}: SustainabilityOverviewProps) {
  return (
    <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col gap-6 relative overflow-hidden">

      {/* Background flare */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00B67A]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-2">
        <Leaf className="w-5 h-5 text-[#00B67A]" />
        <h3 className="font-bold text-slate-900 text-sm">Sustainability Overview</h3>
      </div>

      <div className="space-y-3">
        {/* Card 1 */}
        <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-full bg-[#E6F7EF] flex items-center justify-center text-[#00B67A] shrink-0">
            <CloudLightning className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500">Carbon Saved YTD</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight"><AnimatedCounter to={carbonSavedYtd} decimals={0} /> kg</p>
            <p className="text-[10px] font-bold text-[#00B67A] mt-1 flex items-center gap-1">Real-time data</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-full border-2 border-[#00B67A]/20 flex items-center justify-center text-[#00B67A] shrink-0">
            <Leaf className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500">AI Optimizations</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight"><AnimatedCounter to={optimizationsCount} /></p>
            <p className="text-[10px] font-bold text-[#00B67A] mt-1 flex items-center gap-1">Based on evaluated shipments</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-full bg-[#EAEFFF] flex items-center justify-center text-[#2E5BFF] shrink-0">
            <Fuel className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500">Fuel Saved</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight"><AnimatedCounter to={fuelSaved} /> L</p>
            <p className="text-[10px] font-bold text-[#00B67A] mt-1 flex items-center gap-1">Estimated conversion</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-full bg-[#E6F7EF] flex items-center justify-center text-[#00B67A] shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500">Cost Saved</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight">$<AnimatedCounter to={costSaved} decimals={0} /> USD</p>
            <p className="text-[10px] font-bold text-[#00B67A] mt-1 flex items-center gap-1">Derived from savings</p>
          </div>
        </div>

        {/* Card 5 */}
        <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-full border-2 border-[#00B67A]/20 flex items-center justify-center text-[#00B67A] shrink-0">
            <TreePine className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500">Equivalent Trees</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight"><AnimatedCounter to={treesPlanted} /></p>
            <p className="text-[10px] font-bold text-slate-400 mt-1">Tree-years equivalent</p>
          </div>
        </div>

        {/* Card 6 */}
        <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-[#E6F7EF] flex items-center justify-center text-[#00B67A] shrink-0">
            <Leaf className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500">Network Carbon Score</p>
            <div className="flex items-end gap-1 mt-0.5">
              <p className="text-2xl font-black text-slate-900 tracking-tight"><AnimatedCounter to={carbonScore} decimals={1} /></p>
              <p className="text-sm font-bold text-slate-400 mb-1">/100</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, carbonScore))}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#00B67A] to-[#2E5BFF] rounded-full"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
