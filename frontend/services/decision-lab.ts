import apiClient from "./api-client";

export interface DecisionLabData {
  id: string;
  recommendationScore: number;
  potentialSavings: number;
  savingsPercentage: number;
  etaImprovementDays: number;
  slaRiskPercentage: number;
  confidencePercentage: number;
  caseOverview: {
    origin: string;
    destination: string;
    routeId: string;
    partNo: string;
    priority: string;
    quantity: number;
    value: number;
    recommendedAction: string;
    status: string;
  };
  graphState: {
    demand: string;
    inventory: string;
    transit: string;
    slaRisk: string;
    hubCapacity: string;
    cost: string;
    route: string;
  };
  costAnalysis: {
    currentRouteCost: number;
    recommendedCost: number;
    savings: number;
    breakdown: { label: string; value: number }[];
  };
  transitAnalysis: {
    currentETA: number;
    recommendedETA: number;
    improvementPercent: number;
  };
  evidenceSources: {
    id: string;
    title: string;
    records: string;
    status: string;
  }[];
  alternatives: {
    id: string;
    title: string;
    cost: number;
    savingsPercent: number;
    etaImprovement: number;
  }[];
  riskSLA: {
    predictedRisk: number;
    slaAchievementProb: number;
    riskFactors: string[];
  };
  inventoryImpact: {
    originStock: number;
    originStatus: string;
    destinationDemand: number;
    destinationStatus: string;
    overallImpact: string;
  };
}

export const fetchDecisionLabData = async (id: string): Promise<DecisionLabData> => {
  const response = await apiClient.get(`/recommendations/${encodeURIComponent(id)}/decision-context`);
  return response.data;
};

export const executeRecommendation = async (data: DecisionLabData, decision: "Approved" | "Rejected"): Promise<boolean> => {
  await apiClient.post("/recommendations/action-audit", {
    recommendation_id: data.id,
    decision,
    title: data.caseOverview.recommendedAction,
    flow_type: "Decision Lab",
    source: data.caseOverview.origin,
    destination: data.caseOverview.destination,
    category: "Decision Approval",
    estimated_savings_usd: data.potentialSavings,
    confidence_score: data.confidencePercentage,
    reason: decision === "Approved" ? "Approved from AI Decision Lab." : "Rejected from AI Decision Lab.",
  });
  return true;
};