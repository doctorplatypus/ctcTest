import { AIAnalysisRequest, AIAnalysisResponse } from '../../types';
import { validateAIResponse } from './schema';

/**
 * Sends a prepared analytical summary payload to the server-side Gemini API route.
 * Never passes unnecessary PII (personally identifiable customer data).
 */
export async function runAIAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorMsg = `Server error (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson.error) {
        if (typeof errJson.error === 'string') {
          errorMsg = errJson.error;
        } else if (errJson.error.message) {
          errorMsg = errJson.error.message;
        } else {
          errorMsg = JSON.stringify(errJson.error);
        }
      }
    } catch {
      // Use fallback errorMsg
    }
    throw new Error(errorMsg);
  }

  const rawData = await response.json();

  if (!rawData.success && rawData.error) {
    const msg =
      typeof rawData.error === 'string'
        ? rawData.error
        : rawData.error.message || JSON.stringify(rawData.error);
    throw new Error(msg);
  }

  // Validate structured response
  const validated = validateAIResponse(rawData.data || rawData);
  return validated;
}
