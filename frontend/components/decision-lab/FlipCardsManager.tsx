"use client";

import React, { useState, useEffect } from "react";
import { DecisionLabData } from "@/services/decision-lab";
import { motion } from "framer-motion";
import { 
  DollarSign, Clock, Package, ChevronRight, Leaf, Activity, Network
} from "lucide-react";

interface FlipCardProps {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  isActive: boolean;
  isFlipped: boolean;
  onHover: (id: string | null) => void;
  onClick: () => void;
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
}

function FlipCard({ id, title, icon: Icon, color, isActive, isFlipped, onHover, onClick, frontContent, backContent }: FlipCardProps) {
  return (
    <div 
      id={`flipcard-${id}`}
      className="relative w-full h-[250px] perspective-1000 shrink-0 mx-2"
      style={{ minWidth: "220px", maxWidth: "260px" }}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
    >
      <motion.div
        className="w-full h-full relative preserve-3d cursor-pointer group"
        animate={{ rotateY: isFlipped ? 180 : 0, scale: isActive && !isFlipped ? 1.05 : 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Front */}
        <div 
          className="absolute inset-0 backface-hidden bg-white rounded-2xl border-[3px] p-5 shadow-sm flex flex-col justify-between transition-all duration-300"
          style={{ 
            borderColor: isActive || isFlipped ? color : "#F1F5F9", 
            boxShadow: isActive || isFlipped ? `0 12px 30px -5px ${color}40, 0 0 15px 0 ${color}20` : '0 2px 10px rgba(0,0,0,0.02)',
            background: isActive || isFlipped ? `linear-gradient(to bottom, #ffffff, ${color}08)` : '#ffffff'
          }}
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110" style={{ background: `linear-gradient(135deg, ${color}ee, ${color})`, boxShadow: `0 6px 14px -2px ${color}80` }}>
              <Icon size={24} strokeWidth={2.5} />
            </div>
            <h3 className="text-[#12161C] font-bold text-[15px] mt-2">{title}</h3>
            {frontContent}
          </div>
          <p className="text-center text-[11px] font-bold flex items-center justify-center gap-1" style={{ color }}>
            Click to Flip <ChevronRight size={14} />
          </p>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 backface-hidden bg-white rounded-2xl border-[3px] p-5 shadow-xl overflow-hidden flex flex-col transition-all duration-300"
          style={{ 
            borderColor: color, 
            transform: "rotateY(180deg)",
            boxShadow: `0 12px 30px -5px ${color}40, 0 0 15px 0 ${color}20`,
            background: `linear-gradient(to bottom, #ffffff, ${color}08)`
          }}
        >
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3 shrink-0">
            <Icon size={16} style={{ color }} strokeWidth={2.5} />
            <h3 className="text-[#12161C] font-bold text-[12px] uppercase tracking-wider">{title}</h3>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3">
            {backContent}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function FlipCardsManager({ data, activeCard, onCardActivate }: { data: DecisionLabData, activeCard: string | null, onCardActivate: (id: string | null) => void }) {
  const cards = ["cost", "transit", "inventory", "carbon", "prediction", "network"];
  const [autoIndex, setAutoIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setAutoIndex((prev) => {
        const next = (prev + 1) % (cards.length * 2);
        const cardIndex = Math.floor(next / 2);
        const isBack = next % 2 === 1;
        const cardId = cards[cardIndex];
        
        setFlippedCards({ [cardId]: isBack });
        
        const el = document.getElementById(`flipcard-${cardId}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });

        return next;
      });
    }, 4000);
    
    return () => clearInterval(interval);
  }, [isPaused, cards]);

  const handleCardClick = (id: string) => {
    setIsPaused(true);
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
    setTimeout(() => setIsPaused(false), 10000);
  };

  const handleHover = (id: string | null) => {
    onCardActivate(id);
    if (id) {
      setIsPaused(true);
    } else {
      setTimeout(() => setIsPaused(false), 5000);
    }
  };
  
  React.useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .perspective-1000 { perspective: 1000px; }
      .preserve-3d { transform-style: preserve-3d; }
      .backface-hidden { backface-visibility: hidden; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const formatUsd = (value: number) => `$${Math.round(value || 0).toLocaleString()}`;
  const formatDays = (value: number) => `${Number(value || 0).toFixed(1)} Days`;
  const currentCarbon = Math.round(data.costAnalysis.currentRouteCost * 0.18);
  const recommendedCarbon = Math.max(0, Math.round(data.costAnalysis.recommendedCost * 0.18));
  const carbonReduction = Math.max(0, currentCarbon - recommendedCarbon);
  const currentRouteHops = Math.max(2, data.caseOverview.routeId.split("-").filter(Boolean).length);
  const recommendedRouteHops = Math.max(1, currentRouteHops - (data.alternatives.length > 0 ? 1 : 0));

  return (
    <div className="flex overflow-x-auto pb-6 pt-2 px-2 no-scrollbar -mx-4 items-center h-full snap-x snap-mandatory">
      
      {/* 1. Cost Analysis */}
      <FlipCard 
        id="cost" title="Cost Analysis" icon={DollarSign} color="#3B82F6"
        isActive={activeCard === "cost"} isFlipped={!!flippedCards["cost"]}
        onHover={handleHover} onClick={() => handleCardClick("cost")}
        frontContent={<p className="text-[#6B7280] text-[13px] leading-relaxed">Understand cost breakdown and AI-driven savings</p>}
        backContent={
          <>
            <div className="flex justify-between items-center bg-white rounded-lg p-2 border border-slate-100 shadow-sm">
              <span className="text-[#6B7280] text-[11px] font-semibold">Current Cost</span>
              <span className="text-slate-900 text-[13px] font-bold line-through">{formatUsd(data.costAnalysis.currentRouteCost)}</span>
            </div>
            <div className="flex justify-between items-center bg-blue-50/50 rounded-lg p-2 border border-blue-100">
              <span className="text-blue-700 text-[11px] font-bold">AI Recommendation</span>
              <span className="text-blue-600 text-[15px] font-black">{formatUsd(data.costAnalysis.recommendedCost)}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[#6B7280] text-[11px] font-semibold">Total Savings</span>
              <span className="text-blue-600 text-[13px] font-bold">{formatUsd(data.costAnalysis.savings)}</span>
            </div>
            <div className="mt-auto bg-blue-50 rounded-lg p-3 border border-blue-100">
              <p className="text-blue-800 text-[10px] font-bold uppercase tracking-wider mb-1">AI Reason</p>
              <p className="text-blue-700 text-[12px] font-medium leading-tight">Backend scored this option at <strong>{data.savingsPercentage.toFixed(1)}%</strong> cost improvement.</p>
            </div>
          </>
        }
      />

      {/* 2. Transit Analysis */}
      <FlipCard 
        id="transit" title="Transit Analysis" icon={Clock} color="#06B6D4"
        isActive={activeCard === "transit"} isFlipped={!!flippedCards["transit"]}
        onHover={handleHover} onClick={() => handleCardClick("transit")}
        frontContent={<p className="text-[#6B7280] text-[13px] leading-relaxed">Delivery time comparison and SLA protection</p>}
        backContent={
          <>
            <div className="flex justify-between items-center bg-white rounded-lg p-2 border border-slate-100 shadow-sm">
              <span className="text-[#6B7280] text-[11px] font-semibold">Historical ETA</span>
              <span className="text-slate-900 text-[13px] font-bold">{formatDays(data.transitAnalysis.currentETA)}</span>
            </div>
            <div className="flex justify-between items-center bg-cyan-50/50 rounded-lg p-2 border border-cyan-100">
              <span className="text-cyan-700 text-[11px] font-bold">Predicted ETA</span>
              <span className="text-cyan-600 text-[15px] font-black">{formatDays(data.transitAnalysis.recommendedETA)}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[#6B7280] text-[11px] font-semibold">Confidence Score</span>
              <span className="text-cyan-600 text-[13px] font-bold">{data.confidencePercentage.toFixed(1)}%</span>
            </div>
            <div className="mt-auto bg-cyan-50 rounded-lg p-3 border border-cyan-100">
              <p className="text-cyan-800 text-[10px] font-bold uppercase tracking-wider mb-1">AI Reason</p>
              <p className="text-cyan-700 text-[12px] font-medium leading-tight">Backend transit model projects {data.etaImprovementDays.toFixed(1)} days saved for this recommendation.</p>
            </div>
          </>
        }
      />

      {/* 3. Inventory Impact */}
      <FlipCard 
        id="inventory" title="Inventory Impact" icon={Package} color="#8B5CF6"
        isActive={activeCard === "inventory"} isFlipped={!!flippedCards["inventory"]}
        onHover={handleHover} onClick={() => handleCardClick("inventory")}
        frontContent={<p className="text-[#6B7280] text-[13px] leading-relaxed">Hub availability & capacity analysis</p>}
        backContent={
          <>
            <div className="flex justify-between items-center bg-white rounded-lg p-2 border border-slate-100 shadow-sm">
              <span className="text-[#6B7280] text-[11px] font-semibold">Origin Stock</span>
              <span className="text-slate-900 text-[13px] font-bold">{data.inventoryImpact.originStock} Units</span>
            </div>
            <div className="flex justify-between items-center bg-purple-50/50 rounded-lg p-2 border border-purple-100">
              <span className="text-purple-700 text-[11px] font-bold">Projected Demand</span>
              <span className="text-purple-600 text-[15px] font-black">{data.inventoryImpact.destinationDemand} Units</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[#6B7280] text-[11px] font-semibold">Network Balance</span>
              <span className="text-purple-600 text-[13px] font-bold">{data.inventoryImpact.overallImpact}</span>
            </div>
            <div className="mt-auto bg-purple-50 rounded-lg p-3 border border-purple-100">
              <p className="text-purple-800 text-[10px] font-bold uppercase tracking-wider mb-1">AI Reason</p>
              <p className="text-purple-700 text-[12px] font-medium leading-tight">{data.inventoryImpact.originStatus}; {data.inventoryImpact.destinationStatus}.</p>
            </div>
          </>
        }
      />

      {/* 4. Carbon Impact */}
      <FlipCard 
        id="carbon" title="Carbon Impact" icon={Leaf} color="#22C55E"
        isActive={activeCard === "carbon"} isFlipped={!!flippedCards["carbon"]}
        onHover={handleHover} onClick={() => handleCardClick("carbon")}
        frontContent={<p className="text-[#6B7280] text-[13px] leading-relaxed">Environmental impact and CO2 savings</p>}
        backContent={
          <>
            <div className="flex justify-between items-center bg-white rounded-lg p-2 border border-slate-100 shadow-sm">
              <span className="text-[#6B7280] text-[11px] font-semibold">Current CO2</span>
              <span className="text-slate-900 text-[13px] font-bold">{currentCarbon} kg</span>
            </div>
            <div className="flex justify-between items-center bg-green-50/50 rounded-lg p-2 border border-green-100">
              <span className="text-green-700 text-[11px] font-bold">Recommended</span>
              <span className="text-green-600 text-[15px] font-black">{recommendedCarbon} kg</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[#6B7280] text-[11px] font-semibold">Total Reduction</span>
              <span className="text-green-600 text-[13px] font-bold">{carbonReduction} kg</span>
            </div>
            <div className="mt-auto bg-green-50 rounded-lg p-3 border border-green-100">
              <p className="text-green-800 text-[10px] font-bold uppercase tracking-wider mb-1">AI Reason</p>
              <p className="text-green-700 text-[12px] font-medium leading-tight">Estimated from backend current and recommended route cost for this decision context.</p>
            </div>
          </>
        }
      />

      {/* 5. Predictive Analytics */}
      <FlipCard 
        id="prediction" title="Prediction Models" icon={Activity} color="#F97316"
        isActive={activeCard === "prediction"} isFlipped={!!flippedCards["prediction"]}
        onHover={handleHover} onClick={() => handleCardClick("prediction")}
        frontContent={<p className="text-[#6B7280] text-[13px] leading-relaxed">Predictive risk assessment and tracking</p>}
        backContent={
          <>
            <div className="flex justify-between items-center bg-white rounded-lg p-2 border border-slate-100 shadow-sm">
              <span className="text-[#6B7280] text-[11px] font-semibold">Risk Probability</span>
              <span className="text-slate-900 text-[13px] font-bold">{data.riskSLA.predictedRisk.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center bg-orange-50/50 rounded-lg p-2 border border-orange-100">
              <span className="text-orange-700 text-[11px] font-bold">Success Likelihood</span>
              <span className="text-orange-600 text-[15px] font-black">{data.riskSLA.slaAchievementProb.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[#6B7280] text-[11px] font-semibold">Model Confidence</span>
              <span className="text-orange-600 text-[13px] font-bold">{data.confidencePercentage.toFixed(1)}%</span>
            </div>
            <div className="mt-auto bg-orange-50 rounded-lg p-3 border border-orange-100">
              <p className="text-orange-800 text-[10px] font-bold uppercase tracking-wider mb-1">AI Reason</p>
              <p className="text-orange-700 text-[12px] font-medium leading-tight">{data.riskSLA.riskFactors[0] || "Backend risk model returned no blocking factors."}</p>
            </div>
          </>
        }
      />

      {/* 6. Network Optimization */}
      <FlipCard 
        id="network" title="Network Optimization" icon={Network} color="#14B8A6"
        isActive={activeCard === "network"} isFlipped={!!flippedCards["network"]}
        onHover={handleHover} onClick={() => handleCardClick("network")}
        frontContent={<p className="text-[#6B7280] text-[13px] leading-relaxed">Route efficiency and network flow analysis</p>}
        backContent={
          <>
            <div className="flex justify-between items-center bg-white rounded-lg p-2 border border-slate-100 shadow-sm">
              <span className="text-[#6B7280] text-[11px] font-semibold">Route Hops</span>
              <span className="text-slate-900 text-[13px] font-bold">{currentRouteHops} to {recommendedRouteHops}</span>
            </div>
            <div className="flex justify-between items-center bg-teal-50/50 rounded-lg p-2 border border-teal-100">
              <span className="text-teal-700 text-[11px] font-bold">Network Utilization</span>
              <span className="text-teal-600 text-[15px] font-black">{data.graphState.hubCapacity}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[#6B7280] text-[11px] font-semibold">Pareto Efficiency</span>
              <span className="text-teal-600 text-[13px] font-bold">{data.recommendationScore.toFixed(1)} Score</span>
            </div>
            <div className="mt-auto bg-teal-50 rounded-lg p-3 border border-teal-100">
              <p className="text-teal-800 text-[10px] font-bold uppercase tracking-wider mb-1">AI Reason</p>
              <p className="text-teal-700 text-[12px] font-medium leading-tight">{data.graphState.route} route decision for {data.caseOverview.origin} to {data.caseOverview.destination}.</p>
            </div>
          </>
        }
      />

    </div>
  );
}
