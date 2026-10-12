import { AIAnalysisResponse } from '../../types';

export const AI_RESPONSE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: 'Concise executive summary of key path-to-conversion dynamics observed in the dataset.',
    },
    keyFindings: {
      type: 'array',
      description: 'Quantitative findings backed strictly by observed data evidence.',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          finding: { type: 'string' },
          evidence: { type: 'string' },
          confidence: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
          },
        },
        required: ['title', 'finding', 'evidence', 'confidence'],
      },
    },
    opportunities: {
      type: 'array',
      description: 'Specific, actionable optimization recommendations based on channel efficiency or funnel drop-offs.',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          recommendation: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['title', 'recommendation', 'reason'],
      },
    },
    caveats: {
      type: 'array',
      description: 'Data constraints, sample size caveats, or correlation vs causation cautions.',
      items: { type: 'string' },
    },
  },
  required: ['summary', 'keyFindings', 'opportunities', 'caveats'],
};

/**
 * Validates and sanitizes the parsed Gemini output.
 */
export function validateAIResponse(data: any): AIAnalysisResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid AI response: Expected an object.');
  }

  const summary = typeof data.summary === 'string' ? data.summary : 'No summary provided.';

  const keyFindings = Array.isArray(data.keyFindings)
    ? data.keyFindings.map((kf: any) => ({
        title: String(kf.title || 'Observation'),
        finding: String(kf.finding || ''),
        evidence: String(kf.evidence || 'Observed in active dataset metrics.'),
        confidence: ['high', 'medium', 'low'].includes(String(kf.confidence).toLowerCase())
          ? (String(kf.confidence).toLowerCase() as 'high' | 'medium' | 'low')
          : 'medium',
      }))
    : [];

  const opportunities = Array.isArray(data.opportunities)
    ? data.opportunities.map((op: any) => ({
        title: String(op.title || 'Optimization Opportunity'),
        recommendation: String(op.recommendation || ''),
        reason: String(op.reason || ''),
      }))
    : [];

  const caveats = Array.isArray(data.caveats)
    ? data.caveats.map((c: any) => String(c))
    : [];

  return {
    summary,
    keyFindings,
    opportunities,
    caveats,
    modelUsed: data.modelUsed || 'gemini-2.5-flash',
    temperatureUsed: Number(data.temperatureUsed) || 1.0,
    generatedAt: data.generatedAt || new Date().toISOString(),
  };
}
