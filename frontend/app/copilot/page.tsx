"use client"

import React, { useState, useRef, useEffect } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { ChatMessage } from "@/components/copilot/chat-message"
import { ExecutiveSummaries } from "@/components/copilot/executive-summaries"
import { useCopilotChat, useCopilotSummary } from "@/services/queries"
import { Send, Loader2, Sparkles, AlertCircle } from "lucide-react"

export default function CopilotPage() {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([
    {
      role: 'assistant',
      content: 'Welcome to the **Sanchar AI Logistics Copilot**. \n\nI can analyze optimization engines and ML prediction layers to give you deterministic business intelligence. \n\nHow can I help you optimize your supply chain today?'
    }
  ])
  const [input, setInput] = useState("")

  const chatMutation = useCopilotChat()
  const summaryMutation = useCopilotSummary()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, chatMutation.isPending, summaryMutation.isPending])

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return

    const userMsg = { role: 'user' as const, content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")

    chatMutation.mutate({ messages: newMessages }, {
      onSuccess: (data) => {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
      },
      onError: (err) => {
        setMessages(prev => [...prev, { role: 'assistant', content: `**Error:** Failed to connect to Copilot engine. \n\n${err.message}` }])
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleGenerateSummary = (type: string) => {
    const promptMsg = `Generate a ${type} summary of the logistics network.`
    setMessages(prev => [...prev, { role: 'user', content: promptMsg }])

    summaryMutation.mutate({ type }, {
      onSuccess: (data) => {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
      },
      onError: (err) => {
        setMessages(prev => [...prev, { role: 'assistant', content: `**Error:** Failed to generate summary. \n\n${err.message}` }])
      }
    })
  }

  const suggestedPrompts = [
    "Which corridor has the highest cost?",
    "Where are the highest logistics risks?",
    "How much money can be saved by optimizing hubs?",
    "Explain why shipment SHP-123 is high risk."
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))]">
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <PageHeader
          title="Executive AI Copilot"
          description="Interact with the LangGraph orchestrated Decision Intelligence System."
        />
        <div className="mt-4">
          <ExecutiveSummaries
            onGenerate={handleGenerateSummary}
            isGenerating={summaryMutation.isPending || chatMutation.isPending}
          />
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, idx) => (
            <ChatMessage key={idx} role={msg.role} content={msg.content} />
          ))}

          {(chatMutation.isPending || summaryMutation.isPending) && (
            <div className="flex justify-start mb-6">
              <div className="flex max-w-[80%] flex-row items-center space-x-3 bg-white px-5 py-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm ml-14">
                <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
                <span className="text-sm font-medium text-slate-500 animate-pulse">Copilot is reasoning...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Suggested Prompts */}
          {messages.length < 3 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(prompt)}
                  className="text-xs bg-slate-100 hover:bg-brand-primary hover:text-white text-slate-600 px-3 py-1.5 rounded-full transition-colors flex items-center space-x-1"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          )}

          <div className="relative flex items-end">
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-14 py-3 text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary resize-none min-h-[52px] max-h-[150px]"
              placeholder="Ask the Executive Copilot about risks, optimizations, or logistics..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={chatMutation.isPending || summaryMutation.isPending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending || summaryMutation.isPending}
              className="absolute right-2 bottom-2 p-2 bg-brand-primary hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-center space-x-1 text-[10px] text-slate-400">
            <AlertCircle className="h-3 w-3" />
            <span>AI responses are backed by deterministic optimization engines.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
