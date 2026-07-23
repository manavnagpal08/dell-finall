/**
 * Client-side command parser for common logistics navigation intents.
 */

export interface ParsedCommand {
  intent: "navigate" | "investigate" | "route_request" | "unknown"
  target?: string
  objectId?: string
  objectType?: string
  part?: string
  quantity?: number
  destination?: string
  priority?: string
  originalQuery: string
}

export function parseCommand(query: string): ParsedCommand {
  const q = query.toLowerCase()

  // 1. Route Request Intent
  if (q.includes("emergency") || q.includes("urgent") || q.includes("need") || q.includes("fastest")) {
    return {
      intent: "route_request",
      part: q.includes("compute") ? "Compute Module" : "Standard Part",
      quantity: q.match(/\d+/) ? parseInt(q.match(/\d+/)![0]) : 1,
      destination: q.includes("amsterdam") ? "Amsterdam" : "Unknown",
      priority: q.includes("emergency") || q.includes("urgent") ? "Emergency" : "Standard",
      originalQuery: query
    }
  }

  // 2. Investigate Intent
  if (q.includes("investigate") || q.includes("highest risk") || q.includes("overloaded") || q.includes("bottleneck")) {
    return {
      intent: "investigate",
      objectId: q.includes("shp") ? (query.match(/SHP-\d+/i)?.[0] || "SHP-10025") : "HUB-DEL-001",
      objectType: q.includes("shipment") || q.includes("shp") ? "transaction" : 
                  q.includes("hub") ? "hub" : 
                  q.includes("repair") ? "tpr" : "hub",
      originalQuery: query
    }
  }

  // 3. Navigate Intents
  if (q.includes("optimization") || q.includes("opportunities")) {
    return { intent: "navigate", target: "/optimization", originalQuery: query }
  }
  if (q.includes("executive") || q.includes("dashboard")) {
    return { intent: "navigate", target: "/executive", originalQuery: query }
  }
  if (q.includes("mission control") || q.includes("map")) {
    return { intent: "navigate", target: "/network", originalQuery: query }
  }
  if (q.includes("prediction") || q.includes("risk")) {
    return { intent: "navigate", target: "/predictions/dashboard", originalQuery: query }
  }
  if (q.includes("explorer") || q.includes("locate") || q.includes("find") || q.includes("compare")) {
    return { intent: "navigate", target: "/operations", originalQuery: query }
  }

  // Fallback
  return { intent: "unknown", originalQuery: query }
}
