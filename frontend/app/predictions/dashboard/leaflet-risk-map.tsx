"use client"

import React, { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface LeafletRiskMapProps {
  selectedTxId: string
  onSelectTx: (id: string) => void
  mapMode: string
  shipments: any[]
}

export default function LeafletRiskMap({
  selectedTxId,
  onSelectTx,
  mapMode,
  shipments
}: LeafletRiskMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const layersGroup = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize Map
    const map = L.map(mapRef.current, {
      center: [20, 68],
      zoom: 3.5,
      zoomControl: true,
      attributionControl: false
    })
    mapInstance.current = map

    // CartoDB Dark Matter Layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19
    }).addTo(map)

    layersGroup.current = L.layerGroup().addTo(map)

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInstance.current
    const group = layersGroup.current
    if (!map || !group) return

    group.clearLayers()

    // Coordinate mapping for nodes
    const coordinates: Record<string, [number, number]> = {
      "Ahmedabad WH": [23.0225, 72.5714],
      "WestCoast Hub": [19.0760, 72.8777], // Mumbai vicinity
      "Deecan Repairs Hub": [17.3850, 78.4867], // Hyderabad vicinity
      "Singapore Hub": [1.3521, 103.8198],
      "Amsterdam Hub": [52.3676, 4.9041],
      "Bangalore Hub": [12.9716, 77.5946],
      "Dubai Hub": [25.2048, 55.2708],
      "Frankfurt WH": [50.1109, 8.6821],
      "Delhi Hub": [28.6139, 77.2090],
      "Kolkata Satellite": [22.5726, 88.3639],
      "Mumbai Hub": [19.0760, 72.8777],
      "Hyderabad WH": [17.3850, 78.4867],
      "Northindia Repairs Delhi": [28.6139, 77.2090],
      "SouthTech Repairs Chennai": [13.0827, 80.2707]
    }

    // Add path connections for each shipment
    shipments.forEach((s) => {
      const isSelected = s.id === selectedTxId
      const pathNodes = s.path || []
      const latlngs: [number, number][] = []

      pathNodes.forEach((nodeName: string) => {
        const coords = coordinates[nodeName]
        if (coords) latlngs.push(coords)
      })

      if (latlngs.length >= 2) {
        // Draw Polyline
        const polyline = L.polyline(latlngs, {
          color: isSelected ? "#F43F5E" : s.color || "#F59E0B",
          weight: isSelected ? 4 : 2,
          opacity: isSelected ? 0.9 : 0.45,
          dashArray: isSelected ? undefined : "5, 5"
        })

        polyline.on("click", () => {
          onSelectTx(s.id)
        })

        polyline.addTo(group)
      }
    })

    // Add Markers for nodes
    Object.entries(coordinates).forEach(([name, coords]) => {
      // Determine risk color based on name
      let color = "#10B981" // Low risk
      let riskText = "Low"
      if (name.includes("Delhi") || name.includes("Deecan") || name.includes("Kolkata") || name.includes("Chennai")) {
        color = "#EF4444" // Critical
        riskText = "Critical"
      } else if (name.includes("WestCoast") || name.includes("Hyderabad")) {
        color = "#F59E0B" // Medium
        riskText = "Medium"
      } else if (name.includes("Amsterdam") || name.includes("Singapore") || name.includes("Dubai")) {
        color = "#3B82F6" // High/Medium alert
        riskText = "Medium"
      }

      const customHtml = `
        <div class="flex flex-col items-center">
          <div class="w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg relative flex items-center justify-center" style="background-color: ${color}">
            <div class="absolute -inset-1 rounded-full bg-white opacity-20 animate-ping"></div>
          </div>
          <div class="absolute top-4 bg-slate-950/90 text-white font-mono text-[7px] font-bold px-1 py-0.5 rounded border border-slate-800 whitespace-nowrap pointer-events-none shadow-md">
            ${name} <span style="color: ${color}; font-weight: 900;">${riskText}</span>
          </div>
        </div>
      `

      const marker = L.marker(coords, {
        icon: L.divIcon({
          className: "custom-div-icon",
          html: customHtml,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      })

      marker.addTo(group)
    })

  }, [selectedTxId, shipments, mapMode])

  return <div ref={mapRef} className="w-full h-full min-h-[360px] z-10" />
}
