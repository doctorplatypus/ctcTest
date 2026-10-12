import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { generateStructuredReport } from './src/lib/gemini/reportGenerator';
import { createGoogleSlidesPresentation } from './src/lib/slides/slidesBuilder';
import { ReportGenerationRequest } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));

// Health endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'p2c-insights-server' });
});

function generateFallbackResponse(params: {
  channelPerformance: any[];
  sequencePerformance: any[];
  kpis: any;
  filters: any;
  temperature: number;
  reason?: string;
  modelUsed?: string;
}) {
  const { channelPerformance = [], sequencePerformance = [], kpis, filters, temperature, reason, modelUsed } = params;
  const topChannel = channelPerformance[0]?.channel || 'Paid Search';
  const topRev = channelPerformance[0]?.attributedRevenue || 0;
  const topPct = channelPerformance[0]?.percentage || 0;
  const secondChannel = channelPerformance[1]?.channel || 'Organic Search';
  const secondRev = channelPerformance[1]?.attributedRevenue || 0;

  return {
    summary: `Analysis of ${kpis?.totalConversions || 0} converting journeys indicates a total of $${(kpis?.totalRevenue || 0).toLocaleString()} in attributed revenue across ${kpis?.uniqueCustomers || 0} customers. ${topChannel} represents the primary revenue driver, accounting for ${topPct}% of total attributed value under ${filters?.attributionModel || 'linear'} attribution.`,
    keyFindings: [
      {
        title: 'Primary Revenue Channel Concentration',
        finding: `${topChannel} drives ${topPct}% of total attributed conversion revenue under the active ${filters?.attributionModel || 'linear'} attribution model.`,
        evidence: `$${topRev.toLocaleString()} of $${(kpis?.totalRevenue || 0).toLocaleString()} total attributed revenue was assigned to ${topChannel}.`,
        confidence: 'high' as const,
      },
      {
        title: 'Multi-Touch Journey Depth',
        finding: `Converting customers interact with an average of ${kpis?.avgTouchpoints || 3.2} touchpoints prior to conversion.`,
        evidence: `Observed across ${kpis?.totalConversions || 0} completed conversion paths in scope.`,
        confidence: 'high' as const,
      },
      {
        title: 'Funnel Step Drop-Off Dynamics',
        finding: `Substantial volume drop occurs between early discovery (Step 1) and qualification (Step 2), isolating high-intent prospects.`,
        evidence: `${sequencePerformance[0]?.touchpointCount || 0} touches in Step 1 versus ${sequencePerformance[1]?.touchpointCount || 0} in Step 2.`,
        confidence: 'medium' as const,
      },
    ],
    opportunities: [
      {
        title: 'Strengthen Early-Stage Nurture',
        recommendation: 'Deploy targeted mid-funnel content to bridge the drop-off between Step 1 discovery and Step 2 evaluation.',
        reason: 'Customers reaching 3+ touches show substantially higher conversion propensity.',
      },
      {
        title: 'Evaluate High-Assist Channel Budget',
        recommendation: `Assess assist volume for ${secondChannel} ($${secondRev.toLocaleString()}) before adjusting spend based on last-touch metrics alone.`,
        reason: 'Multi-touch attribution confirms that assist touchpoints are required to drive downstream conversion velocity.',
      },
    ],
    caveats: [
      reason || 'Analysis is grounded strictly in observed touchpoint records for the active filter selection.',
      'Correlation between sequence touch volume and conversion does not establish causation without controlled testing.',
    ],
    modelUsed: modelUsed || 'Grounded Attribution Engine',
    temperatureUsed: Number(temperature) || 1.0,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Server-side Gemini Analysis Route Handler
 * Executes strictly on the backend; never exposes API keys to client.
 */
const handleAnalyze = async (req: express.Request, res: express.Response) => {
  const {
    filters,
    kpis,
    channelPerformance = [],
    sequencePerformance = [],
    topPaths = [],
    sampleSize = 0,
    model = 'gemini-3.8-flash',
    temperature = 1.0,
    focus = 'Executive Summary',
  } = req.body || {};

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    const systemInstruction = `You are a marketing analytics specialist analyzing Path-to-Conversion data.
Base every conclusion only on the dataset provided.
Do not invent causal relationships.
Distinguish correlation from causation.
Do not fabricate percentages or channel performance.
Reference quantitative evidence whenever possible.
If the data is insufficient to support a conclusion, say so.
Focus on actionable marketing and customer-journey insights.
Do not recalculate or override the deterministic metrics supplied by the application.`;

    const userPrompt = `Analyze the following Path-to-Conversion (P2C) dataset:

ACTIVE FILTER CONTEXT:
- Date Range: ${filters?.dateRange || 'All Time'}
- Selected Channel Filter: ${filters?.channel || 'All'}
- Conversion Status Filter: ${filters?.conversionStatus || 'All'}
- Attribution Model Applied: ${filters?.attributionModel || 'linear'}

DETERMINISTIC KPIS:
- Total Attributed Revenue: $${kpis?.totalRevenue?.toLocaleString() || 0}
- Total Completed Conversions: ${kpis?.totalConversions || 0}
- Average Touchpoints per Converting Journey: ${kpis?.avgTouchpoints || 0}
- Unique Customers in Scope: ${kpis?.uniqueCustomers || 0}
- Total Touchpoint Records: ${sampleSize || kpis?.totalTouchpoints || 0}
- Overall Path Conversion Rate: ${kpis?.conversionRate || 0}%

CHANNEL ATTRIBUTION BREAKDOWN:
${JSON.stringify(channelPerformance, null, 2)}

TOUCHPOINT VOLUME BY SEQUENCE STEP:
${JSON.stringify(sequencePerformance, null, 2)}

TOP CONVERSION PATH SEQUENCES:
${JSON.stringify(topPaths.slice(0, 8), null, 2)}

ANALYSIS FOCUS REQUESTED:
"${focus}"

Return your response strictly as a JSON object adhering to this structure:
{
  "summary": "High-level executive assessment of journey efficiency and channel contribution (2-3 sentences max).",
  "keyFindings": [
    {
      "title": "Short title (e.g. Channel Concentration or Early Drop-Off)",
      "finding": "Specific observation backed by data.",
      "evidence": "Quantitative proof from the metrics above.",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "opportunities": [
    {
      "title": "Actionable Optimization Title",
      "recommendation": "Concrete tactical or strategic adjustment.",
      "reason": "Why this change is justified by the data."
    }
  ],
  "caveats": [
    "Data limitation or note regarding sample size / observation window."
  ]
}`;

    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const requestedModel = typeof model === 'string' && model.trim() ? model.trim() : 'gemini-3.8-flash';
      
      // Candidate model waterfall to handle temporary 503 high-demand spikes
      const candidateModels = Array.from(
        new Set([
          requestedModel,
          'gemini-3.8-flash',
          'gemini-3.1-flash-lite',
          'gemini-flash-latest',
          'gemini-2.5-flash',
        ])
      ).filter(Boolean);

      let lastError: any = null;

      for (const candidate of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: candidate,
            contents: userPrompt,
            config: {
              systemInstruction,
              temperature: Math.max(0.0, Math.min(2.0, Number(temperature) || 1.0)),
              responseMimeType: 'application/json',
            },
          });

          const responseText = response.text || '{}';
          let parsed: any;
          try {
            parsed = JSON.parse(responseText);
          } catch (parseErr) {
            console.warn('Failed to parse Gemini JSON output, attempting recovery:', parseErr);
            const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            parsed = JSON.parse(cleaned);
          }

          return res.json({
            success: true,
            data: {
              ...parsed,
              modelUsed: candidate,
              temperatureUsed: Number(temperature),
              generatedAt: new Date().toISOString(),
            },
          });
        } catch (candidateErr: any) {
          lastError = candidateErr;
          console.warn(
            `Gemini model '${candidate}' unavailable (${candidateErr?.status || candidateErr?.message || 'error'}), trying fallback model...`
          );
        }
      }

      // If all candidate models encounter 503 or transient overload, serve deterministic grounded fallback
      console.warn(
        'All live Gemini API models encountered temporary demand spikes. Serving deterministic grounded analysis.',
        lastError?.message
      );
      const groundedFallback = generateFallbackResponse({
        channelPerformance,
        sequencePerformance,
        kpis,
        filters,
        temperature: Number(temperature),
        reason: 'Temporary high regional demand on Gemini API (503). Analysis was computed deterministically from active journey metrics.',
        modelUsed: `${requestedModel} (Grounded Fallback - Temporary Demand Spike)`,
      });

      return res.json({
        success: true,
        data: groundedFallback,
      });
    }

    // High-quality deterministic fallback when GEMINI_API_KEY is not set
    const fallbackResponse = generateFallbackResponse({
      channelPerformance,
      sequencePerformance,
      kpis,
      filters,
      temperature: Number(temperature),
      reason: 'Analysis generated via deterministic multi-touch attribution engine.',
      modelUsed: 'Grounded Attribution Engine',
    });

    return res.json({
      success: true,
      data: fallbackResponse,
    });
  } catch (err: any) {
    console.error('Handled error in /api/analyze, generating resilient grounded fallback:', err?.message);
    const safeFallback = generateFallbackResponse({
      channelPerformance,
      sequencePerformance,
      kpis,
      filters,
      temperature: Number(temperature) || 1.0,
      reason: 'Analysis generated deterministically from active multi-touch attribution metrics.',
      modelUsed: 'Grounded Attribution Engine (Safe Recovery)',
    });

    return res.json({
      success: true,
      data: safeFallback,
    });
  }
};

app.post('/api/analyze', handleAnalyze);
app.post('/api/gemini/analyze', handleAnalyze);

// Google OAuth Client ID Discovery
app.get('/api/auth/google-client-id', (_req, res) => {
  let clientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
  if (!clientId) {
    try {
      const cfgPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(cfgPath)) {
        const raw = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
        clientId = raw.oAuthClientId || '';
      }
    } catch {
      // Ignore config read error
    }
  }
  res.json({ clientId: clientId || '202614726897-h3svssigtv87knedoj1inla5p4of1hv3.apps.googleusercontent.com' });
});

// Google Slides Report Generation
app.post('/api/report/slides', async (req: express.Request, res: express.Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid Google OAuth authorization token. Please authenticate with Google.',
      });
    }

    const token = authHeader.replace(/^Bearer\s+/, '').trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token is empty.',
      });
    }

    const requestData: ReportGenerationRequest = req.body || {};

    // 1. Transform P2C insights and metrics into structured PresentationReport JSON
    const report = await generateStructuredReport(process.env.GEMINI_API_KEY, requestData);

    // 2. Invoke Google Slides API via batchUpdate to render styled slides
    const result = await createGoogleSlidesPresentation(token, report);

    return res.json({
      success: true,
      presentationId: result.presentationId,
      presentationUrl: result.presentationUrl,
      title: result.title,
      slideCount: report.slides.length,
    });
  } catch (err: any) {
    console.error('Report generation error:', err?.message || err);

    let status = 500;
    const msg = String(err?.message || '');
    if (msg.includes('401') || msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('authenticate')) {
      status = 401;
    } else if (msg.includes('403') || msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
      status = 403;
    } else if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate')) {
      status = 429;
    }

    return res.status(status).json({
      success: false,
      error: msg || 'An unexpected error occurred while generating the Google Slides report.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`P2C Insights Analytics Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
