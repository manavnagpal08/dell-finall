"use client"

import { NetworkLink, NetworkNode } from "@/types"

/**
 * Trigger browser print dialogue. Standard CSS overrides (@media print) 
 * will automatically hide navigational headers, sidebar bars, and timeline controls.
 */
export function exportToPDF() {
  if (typeof window !== "undefined") {
    window.print()
  }
}

/**
 * Downloads a structured JSON dataset as a CSV file.
 */
export function exportLinksToCSV(links: NetworkLink[], filename = "shipping_corridors_report.csv") {
  const headers = [
    "Source Node",
    "Destination Node",
    "Flow Type",
    "Transit Volume",
    "Total Cost (USD)",
    "Avg Cost Per Unit (USD)",
    "SLA Breach Rate (%)",
    "Avg Transit Days"
  ]

  const csvRows = [headers.join(",")]

  links.forEach((l) => {
    const row = [
      l.source_id,
      l.target_id,
      l.flow_type,
      l.volume,
      l.total_cost.toFixed(2),
      l.avg_cost_per_unit.toFixed(2),
      l.sla_breach_rate.toFixed(2),
      l.avg_transit_days.toFixed(2)
    ]
    csvRows.push(row.map(val => `"${val}"`).join(","))
  })

  downloadCSVFile(csvRows.join("\n"), filename)
}

export function exportNodesToCSV(nodes: NetworkNode[], filename = "logistics_nodes_report.csv") {
  const headers = [
    "Location ID",
    "Location Name",
    "Type",
    "City",
    "Country",
    "Stock Load",
    "Capacity Limit",
    "Utilisation Rate (%)",
    "Status"
  ]

  const csvRows = [headers.join(",")]

  nodes.forEach((n) => {
    const row = [
      n.id,
      n.name,
      n.type,
      n.city,
      n.country,
      n.current_stock,
      n.capacity,
      (n.utilisation * 100).toFixed(2),
      n.status
    ]
    csvRows.push(row.map(val => `"${val}"`).join(","))
  })

  downloadCSVFile(csvRows.join("\n"), filename)
}

function downloadCSVFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
