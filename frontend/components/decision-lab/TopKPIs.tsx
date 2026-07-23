"use client";

import React, { useEffect, useState } from "react";
import { DecisionLabData } from "@/services/decision-lab";
import { TrendingUp, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

function AnimatedCounter({ value, prefix = "", suffix = "", decimals = 0 }: { value: number, prefix?: string, suffix?: string, decimals?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const end = value;
    if (start === end) return;
    
    let startTime: number | null = null;
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(start + (end - start) * ease);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <span>{prefix}{count.toFixed(decimals)}{suffix}</span>;
}

function CircularProgress({ value, color }: { value: number, color: string }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="transform -rotate-90 w-12 h-12">
        <circle cx="24" cy="24" r={radius} stroke="#EEF0F3" strokeWidth="4" fill="transparent" />
        <motion.circle 
          cx="24" cy="24" r={radius} 
          stroke={color} 
          strokeWidth="4" 
          fill="transparent" 
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function TopKPIs({ data }: { data: DecisionLabData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* Recommendation Score */}
      <div className="bg-white rounded-2xl p-4 border border-[#E3E6EA] shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
        <div>
          <p className="text-[#6B7280] text-xs font-bold uppercase tracking-wider mb-1">Recommendation Score</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#00B67A]">
              <AnimatedCounter value={data.recommendationScore} decimals={1} />
            </span>
            <span className="text-[#9AA2AE] text-sm font-bold">/100</span>
          </div>
          <p className="text-[#00B67A] text-xs font-semibold mt-1">Excellent</p>
        </div>
        <CircularProgress value={data.recommendationScore} color="#00B67A" />
      </div>

      {/* Potential Savings */}
      <div className="bg-white rounded-2xl p-4 border border-[#E3E6EA] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex justify-between items-start">
          <p className="text-[#6B7280] text-xs font-bold uppercase tracking-wider mb-1">Potential Savings</p>
          <div className="w-6 h-6 rounded-full bg-[#E6F7EF] text-[#00B67A] flex items-center justify-center">
            <TrendingUp size={12} />
          </div>
        </div>
        <div>
          <p className="text-2xl font-black text-[#00B67A]">
            <AnimatedCounter value={data.potentialSavings} prefix="+$" />
          </p>
          <p className="text-[#6B7280] text-xs font-semibold mt-1">{data.savingsPercentage}% vs Current</p>
        </div>
      </div>

      {/* ETA Improvement */}
      <div className="bg-white rounded-2xl p-4 border border-[#E3E6EA] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer">
        <p className="text-[#6B7280] text-xs font-bold uppercase tracking-wider mb-1">ETA Improvement</p>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#047857]">
              <AnimatedCounter value={data.etaImprovementDays} decimals={1} />
            </span>
            <span className="text-[#047857] text-sm font-bold">Days</span>
          </div>
          <p className="text-[#6B7280] text-xs font-semibold mt-1">Faster Delivery</p>
        </div>
        <svg className="w-full h-6 mt-2" viewBox="0 0 100 24" preserveAspectRatio="none">
          <motion.path 
            d="M0 24 Q 20 10, 40 18 T 80 8 L 100 12" 
            fill="none" 
            stroke="#047857" 
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5 }}
          />
        </svg>
      </div>

      {/* SLA Risk */}
      <div className="bg-white rounded-2xl p-4 border border-[#E3E6EA] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex justify-between items-start">
          <p className="text-[#6B7280] text-xs font-bold uppercase tracking-wider mb-1">SLA Risk (AI Predicted)</p>
          <div className="w-6 h-6 rounded-full bg-[#E6F7EF] text-[#047857] flex items-center justify-center">
            <ShieldCheck size={12} />
          </div>
        </div>
        <div>
          <p className="text-2xl font-black text-[#12161C]">
            <AnimatedCounter value={data.slaRiskPercentage} suffix="%" />
          </p>
          <p className="text-[#00B67A] text-xs font-semibold mt-1">Low Risk</p>
        </div>
      </div>

      {/* Confidence */}
      <div className="bg-white rounded-2xl p-4 border border-[#E3E6EA] shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
        <div>
          <p className="text-[#6B7280] text-xs font-bold uppercase tracking-wider mb-1">Confidence</p>
          <p className="text-2xl font-black text-[#12161C]">
            <AnimatedCounter value={data.confidencePercentage} suffix="%" />
          </p>
          <p className="text-[#00B67A] text-xs font-semibold mt-1">Very High</p>
        </div>
        <CircularProgress value={data.confidencePercentage} color="#00B67A" />
      </div>
    </div>
  );
}
