"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "./api-client"
import { 
  DashboardStatistics, 
  Hub, 
  TPR, 
  Part, 
  Transaction, 
  TransactionDetail, 
  IngestionReport, 
  PaginatedResponse,
  NetworkOverview,
  ScoredCorridor,
  HubIntelligence,
  RecommendationRequest,
  RecommendationResponse,
  SimulationRequest,
  SimulationImpact,
  OptimizationDashboardData,
  CostOptimizationData,
  ReverseOptimizationData,
  InventoryOptimizationData,
  HubOptimizationData,
  ConsolidationData,
  SettingsAuditLog,
  PlatformHealth,
  DemandPositioningData,
  RiskEvent,
  MLModelResponse,
  TrainingResponse,
  TrainingRequest,
  PredictionResponse,
  PredictionRequest
} from "../types"

// 1. Dashboard Statistics Query
export function useGetStats() {
  return useQuery<DashboardStatistics>({
    queryKey: ["statistics"],
    queryFn: async () => {
      const response = await apiClient.get("/dataset/statistics")
      return response.data
    }
  })
}

// 2. Hubs query
export function useGetHubs(params: {
  search?: string
  hub_type?: string
  page: number
  limit: number
}) {
  return useQuery<PaginatedResponse<Hub>>({
    queryKey: ["hubs", params],
    queryFn: async () => {
      const response = await apiClient.get("/hubs", { params })
      return response.data
    }
  })
}

// 3. TPRs query
export function useGetTPRs(params: {
  search?: string
  specialisation?: string
  page: number
  limit: number
}) {
  return useQuery<PaginatedResponse<TPR>>({
    queryKey: ["tprs", params],
    queryFn: async () => {
      const response = await apiClient.get("/tprs", { params })
      return response.data
    }
  })
}

// 4. Parts query
export function useGetParts(params: {
  search?: string
  category?: string
  page: number
  limit: number
}) {
  return useQuery<PaginatedResponse<Part>>({
    queryKey: ["parts", params],
    queryFn: async () => {
      const response = await apiClient.get("/parts", { params })
      return response.data
    }
  })
}

// 5. Transactions query
export function useGetTransactions(params: {
  search?: string
  flow_type?: string
  priority?: string
  sla_breach?: boolean | null
  tamper_flag?: string
  status?: string
  page: number
  limit: number
  sort_by?: string
  sort_order?: string
}) {
  // Build query arguments safely (clean null and undefined keys)
  const cleanedParams: Record<string, any> = {}
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      cleanedParams[key] = val
    }
  })

  return useQuery<PaginatedResponse<Transaction>>({
    queryKey: ["transactions", cleanedParams],
    queryFn: async () => {
      const response = await apiClient.get("/transactions", { params: cleanedParams })
      return response.data
    }
  })
}

// 6. Transaction detail query
export function useGetTransactionDetail(transactionId: string) {
  return useQuery<TransactionDetail>({
    queryKey: ["transaction", transactionId],
    queryFn: async () => {
      const response = await apiClient.get(`/transactions/${transactionId}`)
      return response.data
    },
    enabled: !!transactionId
  })
}

// 7. Load Dataset Mutation
export function useLoadDataset() {
  const queryClient = useQueryClient()
  return useMutation<IngestionReport, Error, { file_path?: string }>({
    mutationFn: async (variables) => {
      const response = await apiClient.post("/dataset/load", variables, { timeout: 180000 })
      return response.data
    },
    onSuccess: () => {
      // Invalidate all queries to trigger a global dashboard refresh
      queryClient.invalidateQueries({ queryKey: ["statistics"] })
      queryClient.invalidateQueries({ queryKey: ["hubs"] })
      queryClient.invalidateQueries({ queryKey: ["tprs"] })
      queryClient.invalidateQueries({ queryKey: ["parts"] })
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["network"] })
    }
  })
}

// 8. Network Overview Query
export function useGetNetworkOverview(params: {
  flow_type?: string
  country?: string
  region?: string
  hub_type?: string
  part_category?: string
  priority?: string
  sla_status?: string
  min_cost?: number
  max_cost?: number
  min_transit?: number
  max_transit?: number
  timeline_month?: number
  search?: string
}) {
  const cleanedParams: Record<string, any> = {}
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      cleanedParams[key] = val
    }
  })

  return useQuery<NetworkOverview>({
    queryKey: ["network", cleanedParams],
    queryFn: async () => {
      const response = await apiClient.get("/network/overview", { params: cleanedParams })
      return response.data
    }
  })
}

// 8.5 Get Risk Overlay Query
export function useGetRiskOverlay() {
  return useQuery<RiskEvent[]>({
    queryKey: ["risk-overlay"],
    queryFn: async () => {
      const response = await apiClient.get("/network/risk-overlay")
      return response.data
    },
    refetchInterval: 60000 // Refresh every minute for live data
  })
}

// 9. Get Scored Corridors Query
export function useGetScoredCorridors(filters?: unknown) {
  return useQuery<ScoredCorridor[]>({
    queryKey: ["scored-corridors", filters],
    queryFn: async () => {
      const response = await apiClient.get("/route-intelligence/corridors")
      return response.data
    }
  })
}

// 10. Get Hub Intelligence Query
export function useGetHubIntelligence(filters?: unknown) {
  return useQuery<HubIntelligence[]>({
    queryKey: ["hub-intelligence", filters],
    queryFn: async () => {
      const response = await apiClient.get("/route-intelligence/hubs")
      return response.data
    }
  })
}

// 11. Post Route Recommendations Mutation
export function useGetRecommendations() {
  return useMutation<RecommendationResponse, Error, RecommendationRequest>({
    mutationFn: async (variables) => {
      const response = await apiClient.post("/route-intelligence/recommend", variables)
      return response.data
    }
  })
}

// 12. Post Scenario Simulation Mutation
export function useRunSimulation() {
  return useMutation<SimulationImpact, Error, SimulationRequest>({
    mutationFn: async (variables) => {
      const response = await apiClient.post("/route-intelligence/simulate", variables)
      return response.data
    }
  })
}

interface OptimizationFilters {
  region?: string
  part_category?: string
  priority?: string
  hub_id?: string
  tpr_id?: string
  flow_type?: string
}

// 13. Get Optimization Dashboard Query
export function useGetOptimizationDashboard(filters: OptimizationFilters = {}) {
  const cleaned: Record<string, any> = {}
  Object.entries(filters).forEach(([key, val]) => {
    if (val) cleaned[key] = val
  })
  return useQuery<OptimizationDashboardData>({
    queryKey: ["optimization-dashboard", cleaned],
    queryFn: async () => {
      const response = await apiClient.get("/optimization/dashboard", { params: cleaned })
      return response.data
    }
  })
}

// 14. Get Cost Optimization Query
export function useGetCostOptimization(filters: OptimizationFilters = {}) {
  const cleaned: Record<string, any> = {}
  Object.entries(filters).forEach(([key, val]) => {
    if (val) cleaned[key] = val
  })
  return useQuery<CostOptimizationData>({
    queryKey: ["optimization-cost", cleaned],
    queryFn: async () => {
      const response = await apiClient.get("/optimization/cost", { params: cleaned })
      return response.data
    }
  })
}

// 15. Get Reverse Optimization Query
export function useGetReverseOptimization(filters: OptimizationFilters = {}) {
  const cleaned: Record<string, any> = {}
  Object.entries(filters).forEach(([key, val]) => {
    if (val) cleaned[key] = val
  })
  return useQuery<ReverseOptimizationData>({
    queryKey: ["optimization-reverse", cleaned],
    queryFn: async () => {
      const response = await apiClient.get("/optimization/reverse", { params: cleaned })
      return response.data
    }
  })
}

// 16. Get Inventory Optimization Query
export function useGetInventoryOptimization(filters: OptimizationFilters = {}) {
  const cleaned: Record<string, any> = {}
  Object.entries(filters).forEach(([key, val]) => {
    if (val) cleaned[key] = val
  })
  return useQuery<InventoryOptimizationData>({
    queryKey: ["optimization-inventory", cleaned],
    queryFn: async () => {
      const response = await apiClient.get("/optimization/inventory", { params: cleaned })
      return response.data
    }
  })
}

// 17. Get Hub Load Optimization Query
export function useGetHubOptimization(filters: OptimizationFilters = {}) {
  const cleaned: Record<string, any> = {}
  Object.entries(filters).forEach(([key, val]) => {
    if (val) cleaned[key] = val
  })
  return useQuery<HubOptimizationData>({
    queryKey: ["optimization-hubs", cleaned],
    queryFn: async () => {
      const response = await apiClient.get("/optimization/hubs", { params: cleaned })
      return response.data
    }
  })
}

// 18. Get Consolidation Opportunities Query
export function useGetConsolidationOpportunities(filters: OptimizationFilters = {}) {
  const cleaned: Record<string, any> = {}
  Object.entries(filters).forEach(([key, val]) => {
    if (val) cleaned[key] = val
  })
  return useQuery<ConsolidationData>({
    queryKey: ["optimization-consolidation", cleaned],
    queryFn: async () => {
      const response = await apiClient.get("/optimization/consolidation", { params: cleaned })
      return response.data
    }
  })
}

// 18.5 Get Demand Positioning Query
export function useGetDemandPositioning(filters: OptimizationFilters = {}) {
  const cleaned: Record<string, any> = {}
  Object.entries(filters).forEach(([key, val]) => {
    if (val) cleaned[key] = val
  })
  return useQuery<DemandPositioningData>({
    queryKey: ["optimization-demand-positioning", cleaned],
    queryFn: async () => {
      const response = await apiClient.get("/optimization/demand-positioning", { params: cleaned })
      return response.data
    }
  })
}

// 19. Get Prediction Summary
export function useGetPredictionSummary() {
  return useQuery<any>({
    queryKey: ["prediction-summary"],
    queryFn: async () => {
      const response = await apiClient.get("/predictions/summary")
      return response.data
    }
  })
}

// 20. Get ML Models
export function useGetMLModels() {
  return useQuery<MLModelResponse[]>({
    queryKey: ["ml-models"],
    queryFn: async () => {
      const response = await apiClient.get("/predictions/models")
      return response.data
    }
  })
}

// 21. Train ML Model Mutation
export function useTrainMLModel() {
  const queryClient = useQueryClient()
  return useMutation<TrainingResponse, Error, TrainingRequest>({
    mutationFn: async (variables) => {
      const response = await apiClient.post("/predictions/train", variables, { timeout: 180000 })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ml-models"] })
      queryClient.invalidateQueries({ queryKey: ["prediction-summary"] })
    }
  })
}

// 22. Predict SLA Breach Mutation
export function usePredictRisk() {
  return useMutation<PredictionResponse, Error, PredictionRequest>({
    mutationFn: async (variables) => {
      const response = await apiClient.post("/predictions/predict", variables)
      return response.data
    }
  })
}

// 23. Copilot Chat Mutation
export function useCopilotChat() {
  return useMutation<any, Error, any>({
    mutationFn: async (variables) => {
      const response = await apiClient.post("/copilot/chat", variables)
      return response.data
    }
  })
}

// 24. Copilot Summaries Mutation
export function useCopilotSummary() {
  return useMutation<any, Error, any>({
    mutationFn: async (variables) => {
      const response = await apiClient.post("/copilot/summaries", variables)
      return response.data
    }
  })
}

// Get Network Health
export function useGetNetworkHealth() {
  return useQuery<any>({
    queryKey: ["network-health"],
    queryFn: async () => {
      const response = await apiClient.get("/network-health")
      return response.data
    }
  })
}


// Get Carriers
export function useGetCarriers() {
  return useQuery<any>({
    queryKey: ["carriers"],
    queryFn: async () => {
      const response = await apiClient.get("/carriers")
      return response.data
    }
  })
}
