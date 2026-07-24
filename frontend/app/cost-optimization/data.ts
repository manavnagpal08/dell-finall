export interface Checkpoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  addedCost: number;
  delay: string;
  reason: string;
}

export interface Leakage {
  category: string;
  value: number;
  percentage: number;
  color: string;
  details: {
    affectedShipments: number;
    historicalTrend: string;
    explanation: string;
    suggestedFix: string;
  };
}

export interface Corridor {
  id: string;
  name: string;
  flowType: "Forward" | "Reverse" | "Part Buy";
  currentCost: number;
  optimizedCost: number;
  potentialSaving: number;
  opportunityScore: number;
  checkpoints: Checkpoint[];
  leakages: Leakage[];
}

export const CORRIDORS: Corridor[] = [
  {
    id: "c1",
    name: "HUB-BLR → HUB-HYD",
    flowType: "Forward",
    currentCost: 2314,
    optimizedCost: 1742,
    potentialSaving: 572,
    opportunityScore: 92,
    checkpoints: [
      { id: "blr", name: "Bangalore Origin", lat: 12.9716, lng: 77.5946, addedCost: 0, delay: "None", reason: "Standard Dispatch" },
      { id: "transit1", name: "Transit Hub A", lat: 14.6819, lng: 77.6006, addedCost: 320, delay: "4 hrs", reason: "Wait for consolidation" },
      { id: "hyd", name: "Hyderabad Dest", lat: 17.3850, lng: 78.4867, addedCost: 150, delay: "1 hr", reason: "Unloading queue" }
    ],
    leakages: [
      { category: "Carrier Premium Pricing", value: 8420, percentage: 35, color: "#EF4444", details: { affectedShipments: 120, historicalTrend: "+12% this month", explanation: "Expedited shipping rates applied unnecessarily to standard tier parts.", suggestedFix: "Switch to standard LTL carrier for non-urgent inventory." } },
      { category: "Underutilized Vehicles", value: 5230, percentage: 22, color: "#F97316", details: { affectedShipments: 45, historicalTrend: "-5% this month", explanation: "Trucks leaving BLR at 40% capacity on Thursdays.", suggestedFix: "Consolidate Thursday dispatches into Friday runs." } },
      { category: "Multi-hop / Extra Handling", value: 4610, percentage: 19, color: "#EAB308", details: { affectedShipments: 89, historicalTrend: "Stable", explanation: "Routing through extra consolidation hub adds handling fees.", suggestedFix: "Direct point-to-point routing." } },
      { category: "Poor Hub Selection", value: 3120, percentage: 13, color: "#3B82F6", details: { affectedShipments: 34, historicalTrend: "+2% this month", explanation: "Using high-cost urban hub instead of suburban node.", suggestedFix: "Route via Suburban Node B." } },
      { category: "Inventory Misalignment", value: 2010, percentage: 8, color: "#10B981", details: { affectedShipments: 12, historicalTrend: "-10% this month", explanation: "Shipping wrong SKU versions causing reverse logistics.", suggestedFix: "Improve BOM matching algorithm." } }
    ]
  },
  {
    id: "c2",
    name: "HUB-SIN → HUB-HYD",
    flowType: "Reverse",
    currentCost: 2114,
    optimizedCost: 1634,
    potentialSaving: 480,
    opportunityScore: 88,
    checkpoints: [
      { id: "sin", name: "Singapore Origin", lat: 1.3521, lng: 103.8198, addedCost: 0, delay: "None", reason: "Standard Dispatch" },
      { id: "maa", name: "Chennai Port", lat: 13.0827, lng: 80.2707, addedCost: 800, delay: "2 Days", reason: "Customs Clearance" },
      { id: "hyd2", name: "Hyderabad Dest", lat: 17.3850, lng: 78.4867, addedCost: 200, delay: "4 hrs", reason: "Last mile traffic" }
    ],
    leakages: [
      { category: "Customs Delays", value: 4500, percentage: 40, color: "#EF4444", details: { affectedShipments: 55, historicalTrend: "+20% this month", explanation: "Incorrect HS codes causing inspection delays.", suggestedFix: "Implement automated HS code validation." } },
      { category: "Premium Airfreight", value: 3000, percentage: 30, color: "#F97316", details: { affectedShipments: 10, historicalTrend: "Stable", explanation: "Using air instead of sea freight for heavy low-priority items.", suggestedFix: "Switch to Ocean LCL." } }
    ]
  },
  {
    id: "c3",
    name: "HUB-CHE → HUB-DEL",
    flowType: "Forward",
    currentCost: 1980,
    optimizedCost: 1201,
    potentialSaving: 779,
    opportunityScore: 85,
    checkpoints: [
      { id: "che", name: "Chennai Hub", lat: 13.0827, lng: 80.2707, addedCost: 0, delay: "None", reason: "Dispatch" },
      { id: "nag", name: "Nagpur Transit", lat: 21.1458, lng: 79.0882, addedCost: 250, delay: "12 hrs", reason: "Driver change" },
      { id: "del", name: "Delhi Hub", lat: 28.6139, lng: 77.2090, addedCost: 100, delay: "2 hrs", reason: "Entry tax processing" }
    ],
    leakages: [
      { category: "Poor Route Selection", value: 3500, percentage: 50, color: "#EF4444", details: { affectedShipments: 200, historicalTrend: "+5% this month", explanation: "Taking older highway route instead of new expressway.", suggestedFix: "Update routing system to mandate new expressway." } }
    ]
  },
  {
    id: "c4",
    name: "HUB-MUM → HUB-DEL",
    flowType: "Part Buy",
    currentCost: 1742,
    optimizedCost: 1201,
    potentialSaving: 541,
    opportunityScore: 79,
    checkpoints: [
      { id: "mum", name: "Mumbai Hub", lat: 19.0760, lng: 72.8777, addedCost: 0, delay: "None", reason: "Dispatch" },
      { id: "del", name: "Delhi Hub", lat: 28.6139, lng: 77.2090, addedCost: 400, delay: "8 hrs", reason: "Congestion" }
    ],
    leakages: [
      { category: "Supplier Margin", value: 2000, percentage: 40, color: "#EF4444", details: { affectedShipments: 50, historicalTrend: "Stable", explanation: "Buying from tier 2 supplier instead of OEM.", suggestedFix: "Consolidate orders to tier 1 OEM." } }
    ]
  },
  {
    id: "c5",
    name: "HUB-KUL → HUB-KOL",
    flowType: "Forward",
    currentCost: 1634,
    optimizedCost: 1083,
    potentialSaving: 551,
    opportunityScore: 75,
    checkpoints: [
      { id: "kul", name: "Kuala Lumpur", lat: 3.1390, lng: 101.6869, addedCost: 0, delay: "None", reason: "Dispatch" },
      { id: "kol", name: "Kolkata Hub", lat: 22.5726, lng: 88.3639, addedCost: 500, delay: "1 Day", reason: "Port congestion" }
    ],
    leakages: [
      { category: "Port Demurrage", value: 1500, percentage: 50, color: "#EF4444", details: { affectedShipments: 25, historicalTrend: "+15% this month", explanation: "Containers sitting idle at port due to missing paperwork.", suggestedFix: "Pre-clearance documentation workflow." } }
    ]
  }
];

export const GLOBAL_KPI = {
  currentCost: 122421,
  optimizedCost: 100385,
  potentialSavings: 22036,
  inventoryImpact: 82614,
  savingsRealized: 13538
};
