"use client"

import React, { useMemo } from "react"
import { motion } from "framer-motion"
import { Leaf, Droplets, ArrowRight } from "lucide-react"

interface NodeData {
  id: number
  x: number
  y: number
  impact: "high" | "medium" | "low" | "pending"
  metrics: {
    carbon: number
    fuel: number
    distance: number
    confidence: number
  }
}

interface PathData {
  d: string
  depth: number
  pulseDuration: number
  pulseDelay: number
}

export function AiSustainabilityTree({
  selectedLeaf,
  onSelectLeaf
}: {
  selectedLeaf: number | null
  onSelectLeaf: (id: number | null) => void
}) {

  // Generate a beautiful symmetrical fractal tree
  const { paths, leaves } = useMemo(() => {
    let seed = 123
    const random = () => {
      const x = Math.sin(seed++) * 10000
      return x - Math.floor(x)
    }
    const makePath = (d: string, depth: number): PathData => ({
      d,
      depth,
      pulseDuration: 3 + random() * 2,
      pulseDelay: random() * 4
    })
    const newPaths: PathData[] = [];
    const newLeaves: NodeData[] = [];
    let leafId = 0;

    function branch(x: number, y: number, angle: number, length: number, depth: number, thickness: number) {
      if (depth === 0) {
        // Create a leaf
        const impactRoll = random();
        let impact: NodeData["impact"] = "high";
        if (impactRoll > 0.4) impact = "medium";
        if (impactRoll > 0.7) impact = "low";
        if (impactRoll > 0.9) impact = "pending";

        newLeaves.push({
          id: leafId++,
          x,
          y,
          impact,
          metrics: {
            carbon: Math.floor(random() * 200 + 50),
            fuel: Math.floor(random() * 50 + 10),
            distance: Math.floor(random() * 300 + 50),
            confidence: Math.floor(random() * 15 + 85),
          }
        });
        return;
      }

      // Calculate end point using bezier curve for smooth organic-circuit look
      const endX = x + Math.cos(angle) * length;
      const endY = y + Math.sin(angle) * length;

      const cp1X = x;
      const cp1Y = y + (endY - y) / 2;
      const cp2X = endX;
      const cp2Y = y + (endY - y) / 2;

      const d = `M ${x} ${y} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
      newPaths.push(makePath(d, thickness));

      // Branch out (Symmetrical)
      const numBranches = 2;
      const spread = (Math.PI / 2.5) * (depth / 6); // Wider spread at bottom, narrower at top

      for (let i = 0; i < numBranches; i++) {
        const newAngle = angle - spread/2 + (spread / (numBranches - 1)) * i;
        const newLength = length * 0.8;
        branch(endX, endY, newAngle, newLength, depth - 1, thickness - 1);
      }

      // Middle branch for depth > 2 to make it fuller
      if (depth > 2) {
         branch(endX, endY, angle + (random() - 0.5) * 0.2, length * 0.6, depth - 1, thickness - 1);
      }
    }

    // Start Main Trunk
    const startX = 500;
    const startY = 850;

    // Draw thick roots spreading outwards
    for(let i=0; i<7; i++) {
       const rootEndX = startX + (i - 3) * 120;
       const rootEndY = 980;
       newPaths.push(makePath(
         `M ${startX} ${startY} C ${startX} ${startY + 60}, ${rootEndX} ${startY + 30}, ${rootEndX} ${rootEndY}`,
         6
       ));
    }

    // Trunk and branches
    branch(startX, startY, -Math.PI / 2, 200, 6, 6);

    return { paths: newPaths, leaves: newLeaves };
  }, []);

  const activeLeaf = selectedLeaf !== null ? leaves.find(l => l.id === selectedLeaf) : null;

  return (
    <div className="relative w-full h-[700px] flex items-center justify-center -mt-10">

      {/* Background radial glow specifically for the tree */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00B67A]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* The SVG Tree */}
      <svg
        viewBox="0 0 1000 1000"
        className="w-full h-full max-w-[900px] max-h-[900px] overflow-visible drop-shadow-sm z-10"
      >
        <defs>
          <linearGradient id="tree-grad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#2E5BFF" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#00B67A" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#00B67A" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Draw Branches */}
        {paths.map((p, i) => (
          <g key={`path-${i}`}>
            {/* Base static path */}
            <path
              d={p.d}
              fill="none"
              stroke="url(#tree-grad)"
              strokeWidth={p.depth * 1.5 + 1}
              strokeLinecap="round"
              className="opacity-30"
            />
            {/* Animated energy pulse */}
            <motion.path
              d={p.d}
              fill="none"
              stroke="#00B67A"
              strokeWidth={p.depth * 0.8 + 0.5}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1, 1],
                opacity: [0, 1, 0],
                pathOffset: [0, 0, 1]
              }}
              transition={{
                duration: p.pulseDuration,
                repeat: Infinity,
                ease: "linear",
                delay: p.pulseDelay
              }}
            />
          </g>
        ))}

        {/* Draw Leaves */}
        {leaves.map((leaf) => {
          const isSelected = selectedLeaf === leaf.id;

          let color = "#00B67A"; // high impact
          if (leaf.impact === "medium") color = "#10b981";
          if (leaf.impact === "low") color = "#2E5BFF";
          if (leaf.impact === "pending") color = "#cbd5e1";

          return (
            <g
              key={`leaf-${leaf.id}`}
              onMouseEnter={() => onSelectLeaf(leaf.id)}
              onMouseLeave={() => onSelectLeaf(null)}
              className="cursor-pointer"
            >
              {/* Pulse effect */}
              {(isSelected || leaf.impact === "high") && (
                <motion.circle
                  cx={leaf.x}
                  cy={leaf.y}
                  r={isSelected ? 16 : 8}
                  fill={color}
                  className="blur-md opacity-50"
                  animate={isSelected ? { scale: [1, 1.5, 1], opacity: [0.6, 0.9, 0.6] } : { scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              {/* Leaf shape */}
              <motion.path
                d={`M ${leaf.x} ${leaf.y - 8} Q ${leaf.x + 8} ${leaf.y}, ${leaf.x} ${leaf.y + 8} Q ${leaf.x - 8} ${leaf.y}, ${leaf.x} ${leaf.y - 8} Z`}
                fill={isSelected ? "#fff" : color}
                stroke={color}
                strokeWidth={isSelected ? 3 : 0}
                initial={{ scale: 0 }}
                animate={{ scale: isSelected ? 1.5 : 1 }}
                transition={{ duration: 0.2 }}
                style={{ filter: isSelected ? `drop-shadow(0 0 12px ${color})` : 'drop-shadow(0 0 2px rgba(0,0,0,0.1))' }}
              />
            </g>
          )
        })}
      </svg>

      {/* Floating Glassmorphism Hover Card */}
      {activeLeaf && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute z-50 bg-white/90 backdrop-blur-2xl border border-white rounded-2xl p-5 shadow-[0_20px_40px_rgba(0,0,0,0.15),_0_0_0_1px_rgba(255,255,255,0.7)] pointer-events-none w-[240px]"
          style={{
            left: `calc(50% + ${activeLeaf.x - 500}px * (100% / 1000) + 30px)`,
            top: `calc(50% + ${activeLeaf.y - 500}px * (100% / 1000) - 120px)`
          }}
        >
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <Leaf className="w-4 h-4 text-[#00B67A]" />
            <div>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-1">BLR <ArrowRight className="w-3 h-3 text-slate-400" /> HYD</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">Shipment #S{3200 + activeLeaf.id}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-2">
                <Leaf className="w-3.5 h-3.5 text-[#00B67A]" />
                <span className="text-xs font-semibold text-slate-500">Carbon Saved</span>
              </div>
              <span className="text-sm font-black text-slate-800">{activeLeaf.metrics.carbon} kg</span>
            </div>

            <div className="flex justify-between items-end">
              <div className="flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5 text-[#2E5BFF]" />
                <span className="text-xs font-semibold text-slate-500">Fuel Saved</span>
              </div>
              <span className="text-sm font-black text-slate-800">{activeLeaf.metrics.fuel} L</span>
            </div>

            <div className="flex justify-between items-end">
              <div className="flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Distance</span>
              </div>
              <span className="text-sm font-black text-slate-800">-{activeLeaf.metrics.distance} km</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Confidence</span>
              <span className="text-xs font-black text-[#00B67A]">{activeLeaf.metrics.confidence}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#00B67A] rounded-full" style={{ width: `${activeLeaf.metrics.confidence}%` }} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Tree Health Indicator */}
      <div className="absolute bottom-6 left-6 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col items-center justify-center w-36 z-20">
        <div className="flex items-center gap-1 mb-3">
          <Leaf className="w-4 h-4 text-[#00B67A]" />
          <span className="text-xs font-bold text-slate-500">Tree Health</span>
        </div>

        {/* Circular Progress */}
        <div className="relative w-20 h-20 flex items-center justify-center mb-3">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#f1f5f9" strokeWidth="8" />
            <motion.circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke="#00B67A"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="213.6"
              initial={{ strokeDashoffset: 213.6 }}
              animate={{ strokeDashoffset: 213.6 * (1 - 0.92) }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
          </svg>
          <span className="absolute text-lg font-black text-slate-900">92%</span>
        </div>

        <span className="text-sm font-bold text-[#00B67A]">Healthy</span>
        <span className="text-[10px] text-slate-400 text-center mt-1.5 leading-tight font-medium">Keep optimizing, keep growing!</span>
      </div>

    </div>
  )
}
