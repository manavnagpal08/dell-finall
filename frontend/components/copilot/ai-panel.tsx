"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Send,
  X,
  Sparkles,
} from "lucide-react"
import apiClient from "@/services/api-client"
import { Badge } from "@/components/ui/badge"

interface Message {
  role: "user" | "assistant"
  content: string
}

export function AiPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "### Summary\nWelcome to the operations copilot. How can I help optimize your logistics network today?"
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const suggestedQuestions = [
    "Show expensive corridors.",
    "Find money leaks.",
    "Find under-utilized repair centers.",
    "Show inventory days to stockout."
  ]

  const getLocalResponse = (text: string) => {
    const prompt = text.toLowerCase()

    if (prompt.includes("expensive") || prompt.includes("cost") || prompt.includes("money")) {
      return "### Summary\nThe highest cost pressure is concentrated on long-haul hub-to-hub corridors and priority shipments moving through overloaded hubs.\n### Recommended Action\n- Review HUB-DEL to HUB-MUM and HUB-MUM to TPR-PUN-01 first.\n- Consolidate low-priority forward shipments into scheduled batches.\n- Divert urgent repair traffic through the least utilized nearby repair center.\n### Expected Impact\nThis should reduce avoidable expedition cost and protect SLA performance on P1 shipments."
    }

    if (prompt.includes("repair") || prompt.includes("under-utilized") || prompt.includes("underutilized")) {
      return "### Summary\nUnder-utilized repair capacity should be used as a pressure valve for overloaded lanes.\n### Recommended Action\n- Shift eligible reverse logistics work toward TPR-BLR-01 and HUB-HYD-linked capacity.\n- Keep high-priority returns closest to destination demand zones.\n- Monitor repair workload against daily capacity before approving reroutes.\n### Expected Impact\nBetter repair-center balancing improves turnaround time without adding unnecessary transportation cost."
    }

    if (prompt.includes("stock") || prompt.includes("inventory")) {
      return "### Summary\nInventory risk is highest where hub utilization is high and inbound velocity is low.\n### Recommended Action\n- Flag parts below reorder level before SLA-critical dispatches are accepted.\n- Prioritize replenishment into overloaded hubs with active P1 demand.\n- Use the inventory heatmap to identify low-stock nodes before routing.\n### Expected Impact\nThis reduces emergency transfers and protects spare-part availability."
    }

    return "### Summary\nI am using the embedded logistics rules engine while the live inference service reconnects.\n### Recommended Action\n- Use the Digital Twin heatmap to inspect stressed hubs and repair centers.\n- Use Route Intelligence for expensive or delayed corridors.\n- Use Reports to download operational PDF, CSV, or Excel packets.\n### Expected Impact\nThe workspace remains usable for dispatch review, cost triage, and executive reporting during service recovery."
  }

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return
    const userMsg: Message = { role: "user", content: text }
    setMessages(prev => [...prev, userMsg])
    setInputValue("")
    setLoading(true)

    try {
      const chatMessages = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }))
      const response = await apiClient.post("/copilot/chat", {
        messages: chatMessages
      })
      setMessages(prev => [...prev, {
        role: "assistant",
        content: response.data.content
      }])
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: getLocalResponse(text)
      }])
    } finally {
      setLoading(false)
    }
  }

  // Parses lightweight markdown from backend responses.
  const renderMessageContent = (content: string) => {
    return content.split("\n").map((line, idx) => {
      if (line.startsWith("### ")) {
        return <h4 key={idx} className="text-[11px] font-black text-slate-800 uppercase tracking-wider mt-3.5 mb-1.5 first:mt-0">{line.replace("### ", "")}</h4>
      }
      if (line.startsWith("- ")) {
        return <li key={idx} className="ml-4 list-disc text-slate-600 font-medium leading-relaxed my-0.5">{line.replace("- ", "")}</li>
      }
      if (line.startsWith("**MOCKED")) {
        return <Badge key={idx} variant="warning" className="text-[8px] font-extrabold mb-2">LOCAL RESPONSE</Badge>
      }
      return <p key={idx} className="text-slate-650 font-semibold leading-relaxed my-1.5">{line}</p>
    })
  }

  return (
    <div className="h-full flex flex-col bg-white/80 backdrop-blur-2xl border-l border-white/50 w-full shadow-[0_0_50px_rgba(0,0,0,0.1)] font-sans text-xs select-none">

      {/* Panel Header */}
      <div className="p-5 border-b border-slate-200/60 flex items-center justify-between bg-gradient-to-br from-white/90 to-slate-50/90 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#00B67A]/10 rounded-full blur-2xl"></div>
        <div className="flex items-center space-x-3 relative z-10">
          <div className="bg-gradient-to-br from-[#00B67A] to-[#008f5d] text-white p-2 rounded-xl shadow-lg shadow-[#00B67A]/30">
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <span className="font-black text-slate-900 text-sm tracking-tight block">Operations Copilot</span>
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-widest mt-0.5">Route & Cost Intelligence</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200/50 text-slate-400 hover:text-slate-700 transition-colors relative z-10">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gradient-to-b from-slate-50/30 to-white/30 scrollbar-thin scrollbar-thumb-slate-200">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-[20px] max-w-[88%] shadow-sm ${m.role === 'user' ? 'bg-gradient-to-br from-[#00B67A] to-[#009b68] text-white rounded-tr-sm border border-[#00B67A]' : 'bg-white/90 border border-slate-200/80 text-slate-700 rounded-tl-sm backdrop-blur-sm'}`}>
              {m.role === 'user' ? (
                <p className="font-bold text-[13px] leading-relaxed">{m.content}</p>
              ) : (
                <div className="space-y-1.5 text-[12px]">{renderMessageContent(m.content)}</div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="p-4 rounded-[20px] bg-white/90 border border-slate-200/80 rounded-tl-sm flex items-center space-x-2 shadow-sm backdrop-blur-sm">
              <div className="h-2 w-2 bg-[#00B67A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 bg-[#00B67A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 bg-[#00B67A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length === 1 && (
        <div className="p-4 border-t border-slate-200/60 bg-white/60 backdrop-blur-md grid grid-cols-2 gap-2">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="p-2.5 border border-slate-200/80 hover:border-[#00B67A]/50 hover:bg-[#00B67A]/5 rounded-xl text-left text-[10px] font-black text-slate-600 transition-all shadow-sm hover:shadow-md"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-4 border-t border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue) }}
          className="relative flex items-center group"
        >
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Ask about routes, costs, or risk..."
            className="w-full pl-4 pr-12 py-3.5 border border-slate-200/80 rounded-2xl text-slate-900 text-[12px] font-bold bg-white/80 shadow-inner outline-none transition-all focus:bg-white focus:border-[#00B67A]/50 focus:ring-4 focus:ring-[#00B67A]/10 placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className="absolute right-2 p-2 bg-[#00B67A] disabled:opacity-50 disabled:grayscale text-white rounded-xl hover:bg-[#009b68] hover:shadow-lg hover:shadow-[#00B67A]/30 transition-all transform active:scale-95"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

    </div>
  )
}
