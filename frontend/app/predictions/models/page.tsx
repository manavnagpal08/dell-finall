"use client"

import React, { useState } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useGetMLModels, useTrainMLModel } from "@/services/queries"
import { Cpu, RotateCw, CheckCircle2, XCircle, Clock } from "lucide-react"

export default function ModelManagementPage() {
  const { data: models, isLoading } = useGetMLModels()
  const trainMutation = useTrainMLModel()
  
  const [targetVar, setTargetVar] = useState("sla_breach")
  
  const handleTrain = () => {
    trainMutation.mutate({
      target_variable: targetVar,
      model_type: "RandomForest",
      test_size: 0.2,
      random_state: 42
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <PageHeader 
          title="Model Registry & Management" 
          description="View active ML models, metrics, and trigger re-training pipelines."
        />
        <div className="flex space-x-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <select 
            value={targetVar} 
            onChange={(e) => setTargetVar(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 outline-none"
          >
            <option value="sla_breach">SLA Breach (Classification)</option>
            <option value="transit_days">Transit Days (Regression)</option>
          </select>
          <Button 
            onClick={handleTrain} 
            disabled={trainMutation.isPending}
            className="bg-brand-primary text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
          >
            {trainMutation.isPending ? <RotateCw className="h-4 w-4 mr-2 animate-spin" /> : <Cpu className="h-4 w-4 mr-2" />}
            {trainMutation.isPending ? "Training..." : "Train New Model"}
          </Button>
        </div>
      </div>

      {trainMutation.isSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center space-x-3 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <div className="text-sm">
            <span className="font-bold block">Model Trained Successfully</span>
            <span className="text-emerald-600 text-xs">New model deployed to active prediction service.</span>
          </div>
        </div>
      )}

      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">Model Name</th>
                <th className="p-4">Version ID</th>
                <th className="p-4">Target Variable</th>
                <th className="p-4">Metrics (Acc / F1)</th>
                <th className="p-4">Status</th>
                <th className="p-4">Training Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading registry...</td></tr>
              )}
              {models?.map((model: any) => (
                <tr key={model.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-800 flex items-center space-x-2">
                    <Cpu className="h-4 w-4 text-slate-400" />
                    <span>{model.model_name}</span>
                  </td>
                  <td className="p-4 font-mono text-slate-500">{model.model_version}</td>
                  <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold">{model.target_variable}</span></td>
                  <td className="p-4 font-bold text-slate-700">
                    {model.accuracy ? `${(model.accuracy*100).toFixed(1)}% / ${(model.f1_score*100).toFixed(1)}%` : "N/A"}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full font-bold ${
                      model.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {model.status === 'Active' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      <span>{model.status}</span>
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">
                    {new Date(model.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {!isLoading && (!models || models.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 space-y-3">
                    <XCircle className="h-8 w-8 mx-auto opacity-50" />
                    <p>No models found in the registry.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
