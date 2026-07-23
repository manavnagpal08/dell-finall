"use client"

import React from "react"
import dynamic from "next/dynamic"
import { NetworkNode, NetworkLink } from "@/types"
import { Skeleton } from "../ui/skeleton"

const MapboxMap = dynamic(
  () => import("./mapbox-map"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-100 border border-brand-gray-med rounded-xl flex items-center justify-center p-6 select-none animate-pulse">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
          <p className="text-xs text-brand-text-muted mt-4">Initializing geographic spatial modules...</p>
        </div>
      </div>
    )
  }
)

interface MapContainerProps {
  nodes: NetworkNode[]
  links: NetworkLink[]
  selectedNodeId: string | null
  selectedLinkId: string | null
  onSelectNode: (node: NetworkNode | null) => void
  onSelectLink: (link: NetworkLink | null) => void
  activeLayer: string
  layerState?: any
  className?: string
}

export function MapContainer(props: MapContainerProps) {
  const { className, ...mapProps } = props
  return (
    <div className={`w-full relative ${className || 'h-full'}`}>
      <MapboxMap {...mapProps} />
    </div>
  )
}

