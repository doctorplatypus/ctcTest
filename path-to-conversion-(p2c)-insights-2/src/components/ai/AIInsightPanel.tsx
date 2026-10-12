import React from 'react';
import { AIAnalysisResponse, AIKeyFinding, AIOpportunity } from '../../types';
import { ShieldCheck, Target, AlertCircle } from 'lucide-react';

interface AIInsightPanelProps {
  response: AIAnalysisResponse;
  headerAction?: React.ReactNode;
}

export const AIInsightPanel: React.FC<AIInsightPanelProps> = ({ response, headerAction }) => {
  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[#EAF5EE] text-[#216E39] border border-[#A9D7B6]">
            High Confidence
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[#FDF3E7] text-[#8C5311] border border-[#F1CCA0]">
            Medium Confidence
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[#F0F2EE] text-[#56615D] border border-[#DCE2DE]">
            Low Confidence
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-[#FFFFFF]">
      {/* Insight Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4E8E5]">
        <div>
          <h4 className="text-xs font-bold text-[#18201E] uppercase tracking-wider">
            Gemini Insights & Pattern Telemetry
          </h4>
          <p className="text-[11px] text-[#7D8782]">
            Attribution patterns, drop-off dynamics, and high-assist recommendations
          </p>
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      {/* 1. Executive Summary */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-[#56615D] uppercase tracking-wider">
          Executive Summary
        </h4>
        <div className="p-4 rounded-lg bg-[#F0F2EE] border border-[#DCE2DE] text-xs sm:text-sm text-[#18201E] leading-relaxed">
          {response.summary}
        </div>
      </div>

      {/* 2. Key Findings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-[#56615D] uppercase tracking-wider">
            Key Findings ({response.keyFindings.length})
          </h4>
          <span className="text-[11px] text-[#7D8782]">Grounded in observed path metrics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {response.keyFindings.map((finding: AIKeyFinding, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-lg border border-[#DCE2DE] bg-[#FFFFFF] flex flex-col justify-between space-y-3 hover:border-[#C8D0CB] transition"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h5 className="text-xs font-semibold text-[#18201E]">
                    {finding.title}
                  </h5>
                  {getConfidenceBadge(finding.confidence)}
                </div>
                <p className="text-xs text-[#56615D] leading-normal">
                  {finding.finding}
                </p>
              </div>

              <div className="pt-2.5 border-t border-[#E4E8E5] text-[11px] text-[#18201E] bg-[#F0F2EE] p-2 rounded">
                <strong className="text-[#56615D] block mb-0.5 uppercase tracking-wider text-[9px]">
                  Data Evidence:
                </strong>
                {finding.evidence}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Opportunities */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-[#56615D] uppercase tracking-wider">
          Conversion Opportunities ({response.opportunities.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {response.opportunities.map((opp: AIOpportunity, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-lg border border-[#DCE2DE] bg-[#FFFFFF] space-y-2 hover:border-[#C8D0CB] transition"
            >
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-[#087F73] shrink-0" />
                <h5 className="text-xs font-semibold text-[#18201E]">
                  {opp.title}
                </h5>
              </div>
              <p className="text-xs text-[#18201E] leading-normal">
                {opp.recommendation}
              </p>
              <p className="text-[11px] text-[#56615D] pt-1">
                <strong>Rationale:</strong> {opp.reason}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Caveats & Methodological Constraints */}
      {response.caveats && response.caveats.length > 0 && (
        <div className="pt-4 border-t border-[#E4E8E5] space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#7D8782] uppercase tracking-wider">
            <AlertCircle className="w-3 h-3" />
            <span>Analytical Caveats & Data Constraints</span>
          </div>
          <ul className="list-disc list-inside text-xs text-[#56615D] space-y-1 pl-1">
            {response.caveats.map((cav, idx) => (
              <li key={idx}>{cav}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Metadata Footnote */}
      <div className="pt-3 border-t border-[#E4E8E5] flex flex-wrap items-center justify-between text-[11px] text-[#7D8782]">
        <span>Model: <strong className="text-[#56615D] font-mono">{response.modelUsed}</strong> (temp {response.temperatureUsed})</span>
        <span>Generated: {new Date(response.generatedAt).toLocaleString()}</span>
      </div>
    </div>
  );
};
