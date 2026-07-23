import React from "react"
import { Bot, User, BrainCircuit, Activity, BarChart3, TrendingUp, AlertTriangle } from "lucide-react"

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isAssistant = role === 'assistant'

  return (
    <div className={`flex w-full ${isAssistant ? 'justify-start' : 'justify-end'} mb-6`}>
      <div className={`flex max-w-[85%] ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>

        {/* Avatar */}
        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
          isAssistant ? 'bg-brand-primary text-white mr-4 shadow-md shadow-blue-500/20' : 'bg-slate-200 text-slate-600 ml-4'
        }`}>
          {isAssistant ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
        </div>

        {/* Message Bubble */}
        <div className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAssistant ? 'Sanchar AI Copilot' : 'You'}
            </span>
          </div>

          <div className={`px-6 py-4 rounded-2xl text-sm transition-all duration-300 ${
            isAssistant
              ? 'bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-700 rounded-tl-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]'
              : 'bg-gradient-to-br from-brand-primary to-blue-600 text-white rounded-tr-none shadow-md shadow-brand-primary/20 hover:shadow-lg hover:shadow-brand-primary/30'
          }`}>
            <div
              className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-50"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Lightweight markdown renderer for copilot responses.
// In a full production app, use react-markdown or marked.
function renderMarkdown(text: string) {
  let html = text

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  // Lists
  html = html.replace(/^- (.*)$/gm, '<li class="ml-4 list-disc">$1</li>')
  html = html.replace(/(<li[\s\S]*<\/li>)/, '<ul class="my-2">$1</ul>')

  // Headers
  html = html.replace(/^### (.*)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
  html = html.replace(/^## (.*)$/gm, '<h2 class="text-xl font-bold mt-5 mb-2">$1</h2>')
  html = html.replace(/^# (.*)$/gm, '<h1 class="text-2xl font-black mt-6 mb-3">$1</h1>')

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="p-3 rounded-lg text-xs font-mono my-2 overflow-x-auto"><code>$1</code></pre>')

  // Line breaks
  html = html.replace(/\n/g, '<br />')

  // Fix list breaks
  html = html.replace(/<\/li><br \/>/g, '</li>')
  html = html.replace(/<ul><br \/>/g, '<ul>')

  return html
}
