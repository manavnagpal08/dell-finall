"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Mic, BrainCircuit, X, Command, Activity, Compass, TrendingUp, LayoutDashboard } from "lucide-react"
import { parseCommand, ParsedCommand } from "./command-parser"

const SUGGESTIONS = [
  "Find highest risk shipment",
  "Open Mission Control",
  "Show optimization savings",
  "Investigate Delhi Hub",
  "Locate bottlenecks",
  "Find best repair center",
  "We have an urgent emergency in Amsterdam. Need 3 compute modules immediately."
]

export function AiCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedResult, setParsedResult] = useState<ParsedCommand | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && e.ctrlKey && e.shiftKey) {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery("")
      setParsedResult(null)
    }
  }, [isOpen])

  const executeCommand = (cmd: ParsedCommand) => {
    if (cmd.intent === "navigate" && cmd.target) {
      router.push(cmd.target)
    } else if (cmd.intent === "investigate") {
      router.push(`/ai-investigation?objectId=${cmd.objectId}&type=${cmd.objectType}`)
    } else if (cmd.intent === "route_request") {
      // Simulate taking them to a pre-filled investigation or optimization page
      router.push(`/ai-investigation?objectId=EMERGENCY-AMSTERDAM&type=route`)
    } else {
      // Unknown fallback
      router.push(`/operations`)
    }
    setIsOpen(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsProcessing(true)
    
    // Simulate network delay for LLM parsing
    setTimeout(() => {
      const parsed = parseCommand(query)
      setParsedResult(parsed)
      
      // Briefly show the parsed intent JSON to the user before routing (to prove it works)
      setTimeout(() => {
        setIsProcessing(false)
        executeCommand(parsed)
      }, 1200)
    }, 800)
  }

  const handleVoiceInput = () => {
    // Mocking voice input populating the field
    setQuery("We have an urgent emergency in Amsterdam. Need 3 compute modules immediately.")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-slate-900/40 backdrop-blur-sm px-4">
      
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in-up">
        
        <form onSubmit={handleSubmit} className="flex items-center px-4 py-4 border-b border-slate-100">
          <BrainCircuit className="h-5 w-5 text-indigo-500 mr-3 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-lg text-slate-800 placeholder-slate-400"
            placeholder="Ask AI Copilot to investigate, navigate, or optimize..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isProcessing}
          />
          <button type="button" onClick={handleVoiceInput} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors" title="Speak (Mock)">
            <Mic className="h-5 w-5" />
          </button>
          <div className="flex items-center text-[10px] font-bold text-slate-300 ml-2 px-2 py-1 bg-slate-50 rounded border border-slate-100">
            <kbd className="font-sans">ESC</kbd>
          </div>
        </form>

        <div className="p-2">
          {isProcessing ? (
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <div className="h-8 w-8 border-2 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Parsing Intent...</p>
            </div>
          ) : parsedResult ? (
            <div className="p-4 bg-slate-900 rounded-xl m-2 font-mono text-[10px] text-emerald-400">
              <span className="text-slate-500 block mb-2">// Copilot parsed structured JSON</span>
              <pre>{JSON.stringify(parsedResult, null, 2)}</pre>
            </div>
          ) : query.length > 0 ? (
            <div className="p-4 flex items-center justify-center text-sm text-slate-500">
              Press Enter to ask AI Copilot
            </div>
          ) : (
            <div className="py-2">
              <h3 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Suggested Commands</h3>
              <div className="space-y-1">
                {SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center group transition-colors"
                    onClick={() => {
                      setQuery(suggestion)
                      inputRef.current?.focus()
                    }}
                  >
                    <Search className="h-4 w-4 mr-3 text-slate-400 group-hover:text-indigo-500" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-slate-50 p-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-[10px] font-semibold text-slate-400 flex items-center"><Command className="h-3 w-3 mr-1" /> + Shift + K to toggle</span>
          </div>
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Enterprise AI Copilot</span>
        </div>
      </div>

    </div>
  )
}
