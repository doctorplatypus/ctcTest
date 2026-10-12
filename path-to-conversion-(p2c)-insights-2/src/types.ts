/**
 * P2C Insights: Path-to-Conversion Type Definitions
 * Strict TypeScript interfaces representing normalized touchpoint data,
 * Firestore raw documents, analytics structures, and Gemini AI contracts.
 */

export type AttributionModelType = 'linear' | 'first_touch' | 'last_touch' | 'position_based';

export type DataSourceMode = 'live_firestore' | 'demo_data';

export type ConnectionStatus = 
  | 'connecting'
  | 'connected'
  | 'demo_mode'
  | 'empty'
  | 'configuration_required'
  | 'error';

/**
 * Normalized Internal Touchpoint Record.
 * All raw Firestore documents are transformed into this uniform schema.
 */
export interface TouchpointRecord {
  id: string;
  customerId: string;
  customerName?: string;
  journeyId: string;
  touchpointId: string;
  channel: string;
  sequenceStep: number;
  timestamp: string; // ISO 8601 string
  converted: boolean;
  conversionId?: string;
  revenue: number;
  type?: string;
  campaign?: string;
  segment?: 'Enterprise' | 'Mid-Market' | 'SMB' | 'B2C' | string;
}

/**
 * Schema Field Mapping Configuration.
 * Maps arbitrary Firestore document field names to internal TouchpointRecord keys.
 */
export interface SchemaFieldMapping {
  customerIdField: string;
  journeyIdField: string;
  touchpointIdField: string;
  channelField: string;
  sequenceStepField: string;
  timestampField: string;
  convertedField: string;
  conversionIdField: string;
  revenueField: string;
  campaignField: string;
  typeField: string;
}

/**
 * Deterministic Dashboard KPI Metrics
 */
export interface KPIStats {
  totalRevenue: number;
  totalConversions: number;
  avgTouchpoints: number;
  uniqueCustomers: number;
  totalTouchpoints: number;
  convertingJourneysCount: number;
  conversionRate: number;
  avgConversionValue: number;
}

/**
 * Channel Performance with Reconciled Attribution
 */
export interface ChannelPerformance {
  channel: string;
  attributedRevenue: number;
  percentage: number;
  touchpointCount: number;
  convertingTouchpoints: number;
  firstTouchCount: number;
  lastTouchCount: number;
  assistingCount: number;
}

/**
 * Sequence Step Performance
 */
export interface SequencePerformance {
  sequenceStep: number;
  stepLabel: string;
  touchpointCount: number;
  convertingCount: number;
  dropOffRate?: number;
}

/**
 * Aggregated Conversion Path
 */
export interface JourneyPathSummary {
  pathKey: string;
  steps: string[];
  conversions: number;
  totalRevenue: number;
  avgTouchpoints: number;
  avgDaysToConvert: number;
}

/**
 * Active Dashboard Filter State
 */
export interface FilterState {
  dateRange: string;
  channel: string;
  conversionStatus: 'all' | 'converted' | 'in_flight';
  attributionModel: AttributionModelType;
  lookbackTouchpoints: number | null; // null represents 'All' touchpoints
  searchQuery: string;
}

/**
 * Gemini AI Structured Analysis Payload and Response
 */
export interface AIAnalysisRequest {
  filters: FilterState;
  kpis: KPIStats;
  channelPerformance: ChannelPerformance[];
  sequencePerformance: SequencePerformance[];
  topPaths: JourneyPathSummary[];
  sampleSize: number;
  model: string;
  temperature: number;
  focus: 'Executive Summary' | 'Channel Performance' | 'Journey Friction' | 'Conversion Opportunities';
}

export interface AIKeyFinding {
  title: string;
  finding: string;
  evidence: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface AIOpportunity {
  title: string;
  recommendation: string;
  reason: string;
}

export interface AIAnalysisResponse {
  summary: string;
  keyFindings: AIKeyFinding[];
  opportunities: AIOpportunity[];
  caveats: string[];
  modelUsed: string;
  temperatureUsed: number;
  generatedAt: string;
}

/**
 * Google Slides Presentation Report Schema & Types
 */
export type SlideType =
  | 'title'
  | 'summary'
  | 'kpi'
  | 'journey'
  | 'channel'
  | 'sequence'
  | 'insights'
  | 'recommendations'
  | 'closing';

export interface SlideMetric {
  label: string;
  value: string;
  context?: string;
}

export interface SlideChartData {
  chartType: 'bar' | 'column' | 'line' | 'pie';
  title: string;
  labels: string[];
  values: number[];
  seriesName?: string;
}

export interface SlideItem {
  type: SlideType;
  title: string;
  subtitle?: string;
  bullets?: string[];
  speakerNotes?: string;
  metrics?: SlideMetric[];
  chart?: SlideChartData;
}

export interface PresentationReport {
  title: string;
  subtitle?: string;
  dateRange?: string;
  executiveSummary: string[];
  slides: SlideItem[];
}

export interface ReportGenerationRequest {
  filters: FilterState;
  kpis: KPIStats;
  channelPerformance: ChannelPerformance[];
  sequencePerformance: SequencePerformance[];
  topPaths: JourneyPathSummary[];
  sampleSize: number;
  analysisResult?: AIAnalysisResponse | null;
  projectName?: string;
}

export interface ReportGenerationResponse {
  success: boolean;
  presentationId?: string;
  presentationUrl?: string;
  title?: string;
  slideCount?: number;
  error?: string;
}

export type ReportProgressStep =
  | 'idle'
  | 'preparing'
  | 'generating_content'
  | 'creating_presentation'
  | 'finalizing'
  | 'success'
  | 'error';

