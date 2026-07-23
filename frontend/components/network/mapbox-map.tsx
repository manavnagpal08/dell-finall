"use client"

import { NetworkLink, NetworkNode } from "@/types"
import LeafletMap from "./leaflet-map"

interface MapboxMapProps {
  nodes: NetworkNode[]
  links: NetworkLink[]
  selectedNodeId: string | null
  selectedLinkId: string | null
  onSelectNode: (node: NetworkNode | null) => void
  onSelectLink: (link: NetworkLink | null) => void
  activeLayer: string
  layerState?: unknown
}

export default function MapboxMap(props: MapboxMapProps) {
  return <LeafletMap {...props} />
}
