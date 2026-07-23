"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export type DecisionType = "Pending" | "Approved" | "Rejected" | "Investigating"

export interface InvestigationRecord {
  id: string
  objectId: string
  objectType: string
  date: string
  recommendation: string
  decision: DecisionType
  confidence: number
}

const THINKING_STEPS = [
  "Reading historical logistics data",
  "Loading optimization results",
  "Evaluating network capacity",
  "Predicting SLA impact",
  "Estimating business value",
  "Computing confidence score",
  "Preparing executive recommendation"
]

export function useInvestigationState() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const initialObjectId = searchParams.get("objectId")
  const initialType = searchParams.get("type")

  const [activeObjectId, setActiveObjectId] = useState<string | null>(initialObjectId)
  const [activeObjectType, setActiveObjectType] = useState<string | null>(initialType)
  
  // Thinking Simulation State
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingStep, setThinkingStep] = useState(0)

  // Decision History
  const [history, setHistory] = useState<InvestigationRecord[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ai_investigation_history")
      if (stored) setHistory(JSON.parse(stored))
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("ai_investigation_history", JSON.stringify(history))
  }, [history])

  // Trigger thinking when a new object is selected
  useEffect(() => {
    if (activeObjectId) {
      setIsThinking(true)
      setThinkingStep(0)
      
      let currentStep = 0
      const interval = setInterval(() => {
        currentStep++
        if (currentStep >= THINKING_STEPS.length) {
          clearInterval(interval)
          setTimeout(() => setIsThinking(false), 800) // slight pause at 100%
        } else {
          setThinkingStep(currentStep)
        }
      }, 600) // 600ms per step

      return () => clearInterval(interval)
    }
  }, [activeObjectId])

  const investigate = (id: string, type: string) => {
    setActiveObjectId(id)
    setActiveObjectType(type)
    router.replace(`/ai-investigation?objectId=${id}&type=${type}`)
  }

  const recordDecision = (decision: DecisionType, recommendation: string, confidence: number) => {
    if (!activeObjectId || !activeObjectType) return

    const record: InvestigationRecord = {
      id: `INV-${Math.floor(Math.random() * 100000)}`,
      objectId: activeObjectId,
      objectType: activeObjectType,
      date: new Date().toISOString(),
      recommendation,
      decision,
      confidence
    }

    setHistory(prev => [record, ...prev])
  }

  const currentDecision = history.find(h => h.objectId === activeObjectId)?.decision || "Pending"

  return {
    activeObjectId,
    activeObjectType,
    isThinking,
    thinkingStep,
    thinkingSteps: THINKING_STEPS,
    investigate,
    recordDecision,
    currentDecision,
    history
  }
}
