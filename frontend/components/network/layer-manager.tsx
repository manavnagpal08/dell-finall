import React, { useState } from "react"
import { Layers, ChevronDown, ChevronRight, Activity, Map, Package, Search, BarChart3, Clock, Zap } from "lucide-react"

export interface MapLayersState {
  network: {
    primary: boolean
    regional: boolean
    satellite: boolean
    international: boolean
  }
  repair: {
    tpr: boolean
  }
  shipments: {
    forward: boolean
    reverse: boolean
    delivered: boolean
    delayed: boolean
    highRisk: boolean
  }
  heatmaps: {
    active: string // 'none' | 'sla' | 'cost' | 'inventory' | 'utilization' | 'health'
  }
  ai: {
    recommendations: boolean
    xrayMode: boolean
    storyMode: boolean
  }
  timeline: {
    month: number
    speed: number
  }
}

interface LayerManagerProps {
  state: MapLayersState
  onChange: (newState: MapLayersState) => void
}

export function LayerManager({ state, onChange }: LayerManagerProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    network: true,
    repair: true,
    shipments: true,
    heatmaps: false,
    ai: true,
    timeline: false
  })

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const updateNetwork = (key: keyof MapLayersState['network']) => {
    onChange({ ...state, network: { ...state.network, [key]: !state.network[key] } })
  }

  const updateShipments = (key: keyof MapLayersState['shipments']) => {
    onChange({ ...state, shipments: { ...state.shipments, [key]: !state.shipments[key] } })
  }

  const updateAI = (key: keyof MapLayersState['ai']) => {
    onChange({ ...state, ai: { ...state.ai, [key]: !state.ai[key] } })
  }

  const SectionHeader = ({ id, icon: Icon, title }: { id: string, icon: any, title: string }) => (
    <div 
      className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
      onClick={() => toggleSection(id)}
    >
      <div className="flex items-center space-x-2">
        <Icon className="h-4 w-4 text-brand-primary" />
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</span>
      </div>
      {openSections[id] ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
    </div>
  )

  const CheckboxRow = ({ label, checked, onChange, colorClass = "accent-brand-primary" }: { label: string, checked: boolean, onChange: () => void, colorClass?: string }) => (
    <label className="flex items-center space-x-2 py-1.5 px-3 hover:bg-slate-50 cursor-pointer transition-colors">
      <input type="checkbox" checked={checked} onChange={onChange} className={`h-3.5 w-3.5 rounded border-slate-300 ${colorClass}`} />
      <span className="text-xs font-medium text-slate-700">{label}</span>
    </label>
  )

  return (
    <div className="w-full bg-white border border-brand-gray-med rounded-xl shadow-premium overflow-hidden flex flex-col max-h-[800px]">
      <div className="p-4 border-b border-brand-gray-med bg-brand-dark text-white">
        <div className="flex items-center space-x-2">
          <Layers className="h-5 w-5 text-brand-primary" />
          <h2 className="font-bold text-sm">Enterprise GIS Layers</h2>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">Configure mission control map visualization</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Network */}
        <SectionHeader id="network" icon={Map} title="Network Topology" />
        {openSections['network'] && (
          <div className="py-2 border-b border-slate-100 bg-white">
            <CheckboxRow label="Primary Hub" checked={state.network.primary} onChange={() => updateNetwork('primary')} />
            <CheckboxRow label="Regional Hub" checked={state.network.regional} onChange={() => updateNetwork('regional')} />
            <CheckboxRow label="Satellite Hub" checked={state.network.satellite} onChange={() => updateNetwork('satellite')} />
            <CheckboxRow label="International Hub" checked={state.network.international} onChange={() => updateNetwork('international')} />
          </div>
        )}

        {/* Repair Centers */}
        <SectionHeader id="repair" icon={Activity} title="Repair Centers" />
        {openSections['repair'] && (
          <div className="py-2 border-b border-slate-100 bg-white">
            <CheckboxRow label="Show TPR (Third Party Repair)" checked={state.repair.tpr} onChange={() => onChange({ ...state, repair: { tpr: !state.repair.tpr } })} colorClass="accent-emerald-500" />
          </div>
        )}

        {/* Shipments */}
        <SectionHeader id="shipments" icon={Package} title="Live Shipments" />
        {openSections['shipments'] && (
          <div className="py-2 border-b border-slate-100 bg-white">
            <CheckboxRow label="Forward Logistics" checked={state.shipments.forward} onChange={() => updateShipments('forward')} colorClass="accent-blue-500" />
            <CheckboxRow label="Reverse Logistics" checked={state.shipments.reverse} onChange={() => updateShipments('reverse')} colorClass="accent-purple-500" />
            <CheckboxRow label="Delivered (Green)" checked={state.shipments.delivered} onChange={() => updateShipments('delivered')} colorClass="accent-emerald-500" />
            <CheckboxRow label="Delayed (Red)" checked={state.shipments.delayed} onChange={() => updateShipments('delayed')} colorClass="accent-rose-500" />
            <CheckboxRow label="High Risk" checked={state.shipments.highRisk} onChange={() => updateShipments('highRisk')} colorClass="accent-amber-500" />
          </div>
        )}

        {/* Heatmaps */}
        <SectionHeader id="heatmaps" icon={BarChart3} title="Heatmap Layers" />
        {openSections['heatmaps'] && (
          <div className="py-2 px-3 border-b border-slate-100 bg-white space-y-2">
            <select 
              className="w-full h-8 text-xs rounded border border-slate-300 px-2 bg-slate-50 outline-none"
              value={state.heatmaps.active}
              onChange={(e) => onChange({ ...state, heatmaps: { active: e.target.value } })}
            >
              <option value="none">None</option>
              <option value="sla">SLA Breach Risk</option>
              <option value="cost">Accumulated Cost</option>
              <option value="inventory">Inventory Levels</option>
              <option value="utilization">Hub Utilization</option>
              <option value="health">Network Health</option>
            </select>
          </div>
        )}

        {/* AI & Intelligence */}
        <SectionHeader id="ai" icon={Zap} title="AI Intelligence" />
        {openSections['ai'] && (
          <div className="py-2 border-b border-slate-100 bg-white">
            <div className="px-3 py-1 mb-1">
              <div 
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${state.ai.xrayMode ? 'bg-indigo-50 border border-indigo-200' : 'bg-slate-50 border border-slate-200 hover:border-indigo-200'}`}
                onClick={() => updateAI('xrayMode')}
              >
                <div className="flex items-center space-x-2">
                  <Search className={`h-4 w-4 ${state.ai.xrayMode ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className={`text-xs font-bold ${state.ai.xrayMode ? 'text-indigo-900' : 'text-slate-600'}`}>AI X-Ray Mode</span>
                </div>
                <div className={`h-3 w-8 rounded-full relative transition-colors ${state.ai.xrayMode ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-0.5 h-2 w-2 rounded-full bg-white transition-all ${state.ai.xrayMode ? 'left-[22px]' : 'left-[2px]'}`}></div>
                </div>
              </div>
              <p className="text-[9px] text-slate-500 mt-1 px-1">Transforms map to highlight high cost, congestion, and SLA risks.</p>
            </div>
            <CheckboxRow label="AI Recommendations Overlay" checked={state.ai.recommendations} onChange={() => updateAI('recommendations')} />
            <CheckboxRow label="Story Mode Playback" checked={state.ai.storyMode} onChange={() => updateAI('storyMode')} />
          </div>
        )}
      </div>
    </div>
  )
}
