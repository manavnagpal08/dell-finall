"use client";

import React, { useMemo } from "react";
import { DecisionLabData } from "@/services/decision-lab";
import { Brain, Package, Map, DollarSign, Clock, ShieldCheck, Database, Zap, Activity, Cloud, Leaf } from "lucide-react";
import { motion } from "framer-motion";

interface NodeItem {
  id: string;
  label: string;
  status: string;
  icon: React.ElementType;
  color: string;
  angle: number;
  delay: number;
}

export function AIDecisionGraph({ activeNode, onNodeHover, data }: { activeNode: string | null, onNodeHover: (id: string | null) => void, data: DecisionLabData }) {
  const nodes: NodeItem[] = useMemo(() => [
    { id: "demand", label: "Demand", status: data.graphState.demand, icon: Activity, color: "#3B82F6", angle: -90, delay: 0 },
    { id: "inventory", label: "Inventory", status: data.graphState.inventory, icon: Package, color: "#8B5CF6", angle: -45, delay: 0.3 },
    { id: "traffic", label: "Traffic", status: data.graphState.route, icon: Map, color: "#F97316", angle: 0, delay: 0.6 },
    { id: "weather", label: "Weather", status: "Clear", icon: Cloud, color: "#06B6D4", angle: 45, delay: 0.9 },
    { id: "carbon", label: "Carbon", status: "Optimized", icon: Leaf, color: "#22C55E", angle: 90, delay: 1.2 },
    { id: "cost", label: "Cost", status: data.graphState.cost, icon: DollarSign, color: "#14B8A6", angle: 135, delay: 1.5 },
    { id: "capacity", label: "Hub Capacity", status: data.graphState.hubCapacity, icon: Database, color: "#64748B", angle: 180, delay: 1.8 },
    { id: "risk", label: "SLA Risk", status: data.graphState.slaRisk, icon: ShieldCheck, color: "#F59E0B", angle: 225, delay: 2.1 },
  ], [data]);

  const centerX = 225;
  const centerY = 225;
  const radius = 175;

  return (
    <div className="relative w-full h-full min-h-[450px] flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 450 450" preserveAspectRatio="xMidYMid meet">
        {/* Connection lines */}
        {nodes.map((node, index) => {
          const rad = (node.angle * Math.PI) / 180;
          const x = centerX + radius * Math.cos(rad);
          const y = centerY + radius * Math.sin(rad);
          const isHovered = activeNode === node.id;
          
          return (
            <g key={`line-${node.id}`}>
              <motion.line
                x1={x} y1={y} x2={centerX} y2={centerY}
                stroke={isHovered ? node.color : "#EEF0F3"}
                strokeWidth={isHovered ? 2 : 1}
                strokeDasharray="4 4"
                className="transition-colors duration-300"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: node.delay }}
              />
              {/* Particles traveling from node to center */}
              {[0, 0.8, 1.6].map((pDelay, i) => (
                <motion.circle
                  key={`particle-${node.id}-${i}`}
                  cx={x} cy={y} r={2.5} fill={node.color}
                  style={{ filter: `drop-shadow(0 0 4px ${node.color})` }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    x: centerX - x,
                    y: centerY - y,
                    opacity: [0, 1, 1, 0],
                    scale: [0.5, 1, 1, 0.5]
                  }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "linear",
                    delay: node.delay + pDelay
                  }}
                />
              ))}
            </g>
          );
        })}
      </svg>

      {/* Nodes Layer */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Central AI Node */}
        <div className="relative flex items-center justify-center z-20">
          <motion.div 
            className="absolute rounded-full border border-[#00B67A]/30"
            animate={{ width: [100, 140, 100], height: [100, 140, 100], opacity: [0.5, 0.1, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute rounded-full border border-[#00B67A]/50"
            animate={{ width: [80, 110, 80], height: [80, 110, 80], opacity: [0.8, 0.2, 0.8] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="w-20 h-20 rounded-full bg-[#00B67A] shadow-[0_0_30px_rgba(0,182,122,0.4)] flex flex-col items-center justify-center text-white z-10">
            <Brain size={28} />
            <span className="text-[10px] font-bold mt-1">AI CORE</span>
          </div>
        </div>

        {/* Satellite Nodes */}
        {nodes.map((node, index) => {
          const rad = (node.angle * Math.PI) / 180;
          // Calculate absolute px position from center based on 400x400 view box logic
          // However, since we are doing absolute positioning within the div, we use percentage offsets or translate
          const translateX = Math.cos(rad) * radius;
          const translateY = Math.sin(rad) * radius;
          const isHovered = activeNode === node.id;

          return (
            <motion.div
              key={node.id}
              className="absolute z-30 flex flex-col items-center justify-center cursor-pointer group"
              style={{ x: translateX, y: translateY }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: node.delay, type: "spring" }}
              onMouseEnter={() => onNodeHover(node.id)}
              onMouseLeave={() => onNodeHover(null)}
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${isHovered ? "bg-white scale-110 shadow-lg" : "bg-white scale-100 shadow-sm"}`}
                style={{ borderColor: node.color, color: node.color }}
              >
                <node.icon size={18} />
              </div>
              <div className="mt-1.5 text-center">
                <p className="text-[11px] font-bold text-[#12161C]">{node.label}</p>
                <p className="text-[9px] font-medium" style={{ color: node.color }}>{node.status}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
