"use client"

import React from "react"
import { Layers, Check } from "lucide-react"

export function AlternativeSolutions() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 p-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Alternative Solutions</h3>
      </div>
      
      <div className="p-6 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-3 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Option</th>
              <th className="p-3 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
              <th className="p-3 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Savings</th>
              <th className="p-3 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risk Level</th>
              <th className="p-3 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confidence</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-indigo-50/50 border-b border-slate-100">
              <td className="p-3 flex items-center space-x-2">
                <Check className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-bold text-indigo-900">Recommended</span>
              </td>
              <td className="p-3 text-xs font-semibold text-slate-700">Offload 15% to secondary hub</td>
              <td className="p-3 text-xs font-bold text-emerald-600">$15,000</td>
              <td className="p-3"><span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded uppercase font-bold">Low</span></td>
              <td className="p-3 text-xs font-black text-slate-800">98%</td>
            </tr>
            <tr className="border-b border-slate-100 hover:bg-slate-50">
              <td className="p-3 text-xs font-bold text-slate-600 pl-9">Alternative A</td>
              <td className="p-3 text-xs font-medium text-slate-600">Expedite via Air Freight</td>
              <td className="p-3 text-xs font-bold text-emerald-600">$4,500</td>
              <td className="p-3"><span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase font-bold">Medium</span></td>
              <td className="p-3 text-xs font-black text-slate-800">92%</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="p-3 text-xs font-bold text-slate-600 pl-9">Alternative B</td>
              <td className="p-3 text-xs font-medium text-slate-600">Hold shipment for 24 hours</td>
              <td className="p-3 text-xs font-bold text-rose-500">-$2,000</td>
              <td className="p-3"><span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded uppercase font-bold">High</span></td>
              <td className="p-3 text-xs font-black text-slate-800">85%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
