export interface Hub {
  hub_id: string;
  hub_name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  hub_type: 'Primary' | 'Regional' | 'Satellite' | 'International';
  primary_region: string;
  inventory_capacity: number;
  current_stock_level: number;
  utilisation_pct: number;
}

export interface TPR {
  tpr_id: string;
  tpr_name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  repair_capacity_per_day: number;
  current_workload: number;
  sla_days: number;
  active_contracts: number;
  specialisation: string;
}

export interface Part {
  part_no: string;
  part_description: string;
  category: string;
  unit_cost_usd: number;
  weight_kg: number;
  volume_cm3: number;
  lead_time_days: number;
  min_stock_level: number;
  reorder_quantity: number;
  fragile: boolean;
  hazardous: boolean;
}

export interface Transaction {
  transaction_id: string;
  flow_type: 'Forward' | 'Reverse';
  part_no: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  source_location: string;
  origin_hub_id: string;
  intermediate_hub_id?: string;
  tpr_id?: string;
  destination_location: string;
  logistics_partner: string;
  quantity: number;
  unit_cost_usd: number;
  parts_value_usd: number;
  logistics_cost_per_unit_usd: number;
  logistics_cost_total_usd: number;
  total_cost_usd: number;
  dispatch_date: string;
  hub1_arrival_date?: string;
  hub2_arrival_date?: string;
  tpr_arrival_date?: string;
  expected_delivery_date: string;
  actual_delivery_date: string;
  transit_days_actual: number;
  transit_days_expected: number;
  sla_breach: boolean;
  stock_at_origin_hub: number;
  stock_at_intermediate_hub?: number;
  stock_at_tpr?: number;
  tamper_flag: 'CLEAR' | 'TAMPER_ALERT' | 'RECHECK';
  status: string;
  qr_code_id: string;
  notes?: string;
}

export interface TransactionDetail extends Transaction {
  part?: Part;
  origin_hub?: Hub;
  intermediate_hub?: Hub;
  tpr?: TPR;
}

export interface ValidationIssue {
  sheet: string;
  row_index: number;
  column: string;
  issue: string;
  severity: 'ERROR' | 'WARNING';
}

export interface IngestionReport {
  status: 'PASS' | 'FAIL';
  sheets_checked: string[];
  rows_processed: { [sheetName: string]: number };
  issues: ValidationIssue[];
  database_populated: boolean;
  message: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface DashboardStatistics {
  total_transactions: number;
  forward_transactions: number;
  reverse_transactions: number;
  total_hubs: number;
  total_tprs: number;
  total_parts: number;
  total_cost: number;
  average_cost: number;
  average_transit_time: number;
  sla_breach_percentage: number;
  tamper_alert_percentage: number;
  cost_distribution: ChartDataPoint[];
  flow_distribution: ChartDataPoint[];
  country_distribution: ChartDataPoint[];
  top_categories_by_cost: ChartDataPoint[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface NetworkKPIs {
  total_nodes: number;
  total_lanes: number;
  average_lane_cost_usd: number;
  sla_breach_rate: number;
  congested_nodes_count: number;
  network_health_score: number;
  average_corridor_cost: number;
  average_transit_time: number;
  active_corridors: number;
  most_connected_hub: string;
  highest_risk_corridor: string;
  average_hub_utilization: number;
  reverse_logistics_ratio: number;
  forward_logistics_ratio: number;
  repair_center_capacity: number;
  operational_availability: number;
}

export interface NetworkNode {
  id: string;
  name: string;
  type: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  current_stock: number;
  capacity: number;
  utilisation: number;
  status: 'Normal' | 'Overloaded' | 'Underutilised';
  inbound_shipments_count: number;
  outbound_shipments_count: number;
}

export interface NetworkLink {
  source_id: string;
  target_id: string;
  flow_type: 'Forward' | 'Reverse';
  volume: number;
  total_cost: number;
  avg_cost_per_unit: number;
  sla_breach_rate: number;
  avg_transit_days: number;
  source_coordinates: [number, number];
  target_coordinates: [number, number];
}

export interface NetworkInsightCard {
  id: string;
  title: string;
  value: string;
  description: string;
  metric_type: 'positive' | 'negative' | 'neutral';
}

export interface NetworkOverview {
  kpis: NetworkKPIs;
  nodes: NetworkNode[];
  links: NetworkLink[];
  insights: NetworkInsightCard[];
}

export interface ScoredCorridor {
  source_id: string;
  target_id: string;
  distance_km: number;
  shipment_count: number;
  total_cost: number;
  avg_cost_per_unit: number;
  avg_transit_days: number;
  sla_success_rate: number;
  sla_breach_rate: number;
  forward_volume: number;
  reverse_volume: number;
  efficiency_score: number;
  risk_score: number;
  reliability_score: number;
  cost_score: number;
  transit_score: number;
  utilization_score: number;
  overall_score: number;
  status: 'Optimal' | 'High Risk' | 'Inefficient' | 'Bottleneck' | 'Normal';
}

export interface HubIntelligence {
  hub_id: string;
  hub_name: string;
  inventory_capacity: number;
  current_inventory: number;
  inbound_shipments: number;
  outbound_shipments: number;
  throughput: number;
  avg_dispatch_cost: number;
  avg_transit_time: number;
  connected_corridors_count: number;
  avg_sla_performance: number;
  operational_risk: number;
  efficiency_score: number;
  top_parts: string[];
  top_destinations: string[];
}

export interface RouteOption {
  path: string[];
  total_cost: number;
  total_transit_days: number;
  total_distance_km: number;
  sla_success_rate: number;
  sla_breach_rate: number;
  risk_level: 'Low' | 'Medium' | 'High';
  confidence_score: number;
  congestion_index: number;
  explanation: string;
}

export interface RecommendationRequest {
  origin: string;
  destination: string;
  part_no: string;
  quantity: number;
  priority: string;
  required_delivery_window_days: number;
}

export interface RecommendationResponse {
  recommended?: RouteOption;
  alternatives: RouteOption[];
  explanation: string;
  verification_status?: string;
  verification_summary?: string;
}

export interface SimulationRequest {
  disabled_hubs: string[];
  disabled_tprs: string[];
}

export interface SimulationImpact {
  affected_shipments_count: number;
  rerouted_shipments_count: number;
  original_total_cost: number;
  new_total_cost: number;
  cost_delta: number;
  original_avg_transit_days: number;
  new_avg_transit_days: number;
  transit_days_delta: number;
  original_sla_breach_rate: number;
  new_sla_breach_rate: number;
  sla_breach_delta: number;
  operational_impact_summary: string;
}

export interface OptimizationMetric {
  name: string;
  current_value: number;
  optimized_value: number;
  savings_value: number;
  improvement_pct: number;
}

export interface ExecutiveRecommendation {
  id: string;
  title: string;
  category: string;
  impact_summary: string;
  expected_savings: number;
  transit_improvement_days: number;
  sla_improvement_pct: number;
  confidence_score: number;
  business_reason: string;
}

export interface OpportunityCard {
  id: string;
  type: string;
  description: string;
  cost_saving: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface OptimizationDashboardData {
  kpis: OptimizationMetric[];
  recommendations: ExecutiveRecommendation[];
  opportunities: OpportunityCard[];
  regional_savings: Record<string, number>;
  category_savings: Record<string, number>;
  optimization_score_current: number;
  optimization_score_projected: number;
}

export interface CostOptimizationData {
  metrics: OptimizationMetric[];
  opportunities: OpportunityCard[];
  recommendations: ExecutiveRecommendation[];
  savings_by_region: Record<string, number>;
}

export interface ReverseOptimizationData {
  metrics: OptimizationMetric[];
  opportunities: OpportunityCard[];
  recommendations: ExecutiveRecommendation[];
  savings_by_repair_center: Record<string, number>;
}

export interface InventoryOptimizationData {
  metrics: OptimizationMetric[];
  opportunities: OpportunityCard[];
  recommendations: ExecutiveRecommendation[];
  savings_by_hub: Record<string, number>;
}

export interface HubOptimizationData {
  metrics: OptimizationMetric[];
  opportunities: OpportunityCard[];
  recommendations: ExecutiveRecommendation[];
  hub_util_current: Record<string, number>;
  hub_util_projected: Record<string, number>;
}

export interface ConsolidationData {
  metrics: OptimizationMetric[];
  opportunities: OpportunityCard[];
  recommendations: ExecutiveRecommendation[];
  savings_by_part_category: Record<string, number>;
}

export interface DemandPositioningData {
  metrics: OptimizationMetric[];
  opportunities: OpportunityCard[];
  recommendations: ExecutiveRecommendation[];
  waste_cost_by_city: Record<string, number>;
  approved_opportunity_ids?: string[];
}

// Predictive intelligence types
export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface MLModelResponse {
  id: number;
  model_name: string;
  model_version: string;
  target_variable: string;
  model_type: string;
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1_score: number | null;
  roc_auc: number | null;
  mae: number | null;
  rmse: number | null;
  r2_score: number | null;
  training_time_sec: number | null;
  status: string;
  created_at: string;
}

export interface PredictionRequest {
  origin_hub: string;
  destination_hub?: string;
  repair_center?: string;
  priority: string;
  part_category: string;
  flow_type: string;
  quantity: number;
  shipment_value: number;
  logistics_partner?: string;
}

export interface PredictionResponse {
  prediction_id: string;
  predicted_sla_breach: boolean;
  delay_probability: number;
  expected_transit_days: number;
  risk_level: string; // Very Low, Low, Medium, High, Critical
  confidence_score: number;
  contributing_factors: FeatureImportance[];
}

export interface TrainingRequest {
  target_variable: string; // sla_breach or transit_days
  model_type: string; // RandomForest
  test_size: number;
  random_state: number;
}

export interface TrainingResponse {
  message: string;
  model: MLModelResponse;
  feature_importance: FeatureImportance[];
}

// Copilot orchestration types
export interface ChatMessageData {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequestData {
  messages: ChatMessageData[];
  context?: any;
}

export interface ChatResponseData {
  message_id: string;
  role: 'user' | 'assistant';
  content: string;
  model: string;
}

export interface SummaryRequestData {
  type: string;
}

export interface User {
  id: number;
  email: string;
  role: string;
  status: string;
  lastActive: string;
}

export interface SettingsAuditLog {
  time: string;
  actor: string;
  action: string;
  resource: string;
  outcome: string;
}

export interface PlatformHealth {
  status: string;
  uptime: string;
  last_deployment: string;
  services: { name: string; status: string; latency: string }[];
}

export interface Organization {
  name: string;
  tenant_id: string;
  plan: string;
  region: string;
  contact_email: string;
}

export interface RiskEvent {
  id: string;
  title: string;
  description: string;
  risk_type: string;
  severity: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  affected_hubs: string[];
  affected_shipments_count: number;
  expected_impact_days: number;
  recommended_action: string;
}

