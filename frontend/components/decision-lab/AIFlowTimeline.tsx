"use client";

import React from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  { id: 1, title: "Data Ingestion", status: "completed" },
  { id: 2, title: "Issue Detection", status: "completed" },
  { id: 3, title: "Root Cause", status: "completed" },
  { id: 4, title: "Option Generation", status: "completed" },
  { id: 5, title: "Optimal Decision", status: "in-progress" },
  { id: 6, title: "Ready to Approve", status: "pending" },
];

export function AIFlowTimeline() {
  return (
    <div className="bg-white rounded-2xl border border-[#E3E6EA] p-5 shadow-sm mt-4">
      <h3 className="text-[#12161C] font-bold text-sm mb-1">AI DECISION FLOW TIMELINE</h3>
      <p className="text-[#6B7280] text-xs mb-6">Step-by-step AI reasoning journey</p>
      
      <div className="relative flex justify-between items-center w-full px-4">
        {/* Progress Line Background */}
        <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-[#EEF0F3] z-0" />
        
        {/* Animated Progress Line Foreground */}
        <motion.div 
          className="absolute left-8 top-1/2 -translate-y-1/2 h-0.5 bg-[#00B67A] z-0 origin-left"
          style={{ width: "calc(100% - 4rem)" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 0.8 }} // Assuming step 5 is active
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />

        {steps.map((step, idx) => (
          <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
            <motion.div 
              initial={{ 
                scale: 0.8,
                borderColor: "#EEF0F3", 
                color: "#9AA2AE", 
                backgroundColor: "#ffffff",
                boxShadow: "0 0 0 0px rgba(0,182,122,0)"
              }}
              animate={{ 
                scale: 1,
                borderColor: step.status === "completed" || step.status === "in-progress" ? "#00B67A" : "#EEF0F3", 
                color: step.status === "completed" || step.status === "in-progress" ? "#00B67A" : "#9AA2AE", 
                boxShadow: step.status === "in-progress" ? "0 0 0 4px rgba(0,182,122,0.15)" : "0 0 0 0px rgba(0,182,122,0)"
              }}
              transition={{ delay: idx * 0.5, duration: 0.4, type: "spring" }}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white border-2"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.5 + 0.2 }}
              >
                {step.status === "completed" && <CheckCircle2 size={16} />}
                {step.status === "in-progress" && <Clock size={16} className="animate-spin-slow" />}
                {step.status === "pending" && <Circle size={16} />}
              </motion.div>
            </motion.div>
            <motion.div 
              className="text-center w-24"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.5 + 0.3 }}
            >
              <p className={`text-[10px] font-bold ${step.status === "completed" || step.status === "in-progress" ? "text-[#12161C]" : "text-[#9AA2AE]"}`}>
                {step.id}. {step.title}
              </p>
              <p className={`text-[9px] mt-0.5 ${step.status === "completed" ? "text-[#00B67A]" : step.status === "in-progress" ? "text-[#00B67A]" : "text-[#9AA2AE]"}`}>
                {step.status === "completed" ? "Completed" : step.status === "in-progress" ? "In Progress" : "Pending"}
              </p>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}
