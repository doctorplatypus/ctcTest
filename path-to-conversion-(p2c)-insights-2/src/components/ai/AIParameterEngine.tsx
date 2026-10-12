import React, { useState } from 'react';
import { Play, Loader2, Cpu } from 'lucide-react';
import { AIAnalysisResponse, FilterState, KPIStats, ChannelPerformance, SequencePerformance, JourneyPathSummary } from '../../types';
import { runAIAnalysis } from '../../lib/gemini/analyze';
import { AIInsightPanel } from './AIInsightPanel';
import { GenerateReportButton } from '../report/GenerateReportButton';

interface AIParameterEngineProps {
  filters: FilterState;
  kpis: KPIStats;
  channelPerformance: ChannelPerformance[];
  sequencePerformance: SequencePerformance[];
  topPaths: JourneyPathSummary[];
  sampleSize: number;
}

type FocusOption =
  | 'Executive Summary'
  | 'Channel Performance'
  | 'Journey Friction'
  | 'Conversion Opportunities';

export const AIParameterEngine: React.FC<AIParameterEngineProps> = ({
  filters,
  kpis,
  channelPerformance,
  sequencePerformance,
  topPaths,
  sampleSize,
}) => {
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [temperature, setTemperature] = useState<number>(1.0);
  const [focus, setFocus] = useState<FocusOption>('Executive Summary');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResponse | null>(null);

  const handleRunAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await runAIAnalysis({
        filters,
        kpis,
        channelPerformance,
        sequencePerformance,
        topPaths,
        sampleSize,
        model: selectedModel,
        temperature,
        focus,
      });
      setAnalysisResult(result);
    } catch (err: any) {
      console.warn('AI Analysis notice:', err);
      setError(
        err.message || 'Analysis could not be generated. Please retry or adjust parameters.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#DCE2DE] rounded-lg shadow-xs overflow-hidden">
      {/* Control Surface Header */}
      <div className="p-4 sm:p-5 border-b border-[#DCE2DE] bg-[#F0F2EE]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#18201E] text-[#FFFFFF] flex items-center justify-center shrink-0 shadow-xs">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#18201E] tracking-tight">
                AI Parameter Engine
              </h3>
              <p className="text-xs text-[#56615D]">
                Analyze the active P2C dataset with Gemini.
              </p>
            </div>
          </div>

          <div className="text-xs text-[#56615D]">
            Data Scope: <strong className="text-[#18201E]">{sampleSize} touchpoints</strong> across {kpis.uniqueCustomers} customers
          </div>
        </div>
      </div>

      {/* Parameter Controls Grid */}
      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-5 border-b border-[#DCE2DE]">
        {/* 1. Model Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-[#56615D] uppercase tracking-wider block">
            Model Selector
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full h-9 px-3 bg-[#FFFFFF] border border-[#C8D0CB] rounded-md text-xs font-medium text-[#18201E] outline-none hover:border-[#9BA8A1] focus:border-[#087F73] focus:ring-1 focus:ring-[#087F73]/25 transition cursor-pointer"
          >
            <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended — High Throughput)</option>
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra-Low Latency)</option>
            <option value="gemini-2.5-flash">gemini-2.5-flash (Standard Flash)</option>
            <option value="gemini-2.5-pro">gemini-2.5-pro (Deep Reasoning)</option>
          </select>
          <p className="text-[11px] text-[#7D8782]">
            Server-side execution with automated fallback cascade.
          </p>
        </div>

        {/* 2. Temperature Control with Recommended Badge & Helper Text */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-[#56615D] uppercase tracking-wider">
              Temperature
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-semibold text-[#18201E] tabular-nums">
                {temperature.toFixed(1)}
              </span>
              {temperature === 1.0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#EAF5EE] text-[#216E39] border border-[#A9D7B6]">
                  Recommended
                </span>
              )}
            </div>
          </div>
          <input
            type="range"
            min="0.0"
            max="2.0"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full p2c-slider cursor-pointer"
          />
          <p className="text-[11px] text-[#7D8782] leading-tight">
            Gemini 3 models are optimized for the default temperature of 1.0. Change this only for experimentation.
          </p>
        </div>

        {/* 3. Analysis Focus Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-[#56615D] uppercase tracking-wider block">
            Analysis Focus
          </label>
          <select
            value={focus}
            onChange={(e) => setFocus(e.target.value as FocusOption)}
            className="w-full h-9 px-3 bg-[#FFFFFF] border border-[#C8D0CB] rounded-md text-xs font-medium text-[#18201E] outline-none hover:border-[#9BA8A1] focus:border-[#087F73] focus:ring-1 focus:ring-[#087F73]/25 transition cursor-pointer"
          >
            <option value="Executive Summary">Executive Summary</option>
            <option value="Channel Performance">Channel Performance</option>
            <option value="Journey Friction">Journey Friction</option>
            <option value="Conversion Opportunities">Conversion Opportunities</option>
          </select>
          <p className="text-[11px] text-[#7D8782]">
            Guides prompt context and output specialization.
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-4 sm:px-5 py-3.5 bg-[#F0F2EE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-[#56615D]">
          Deterministic metrics and attribution weights will be structured and dispatched.
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={isLoading || sampleSize === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#18201E] hover:bg-[#2A3734] text-[#FFFFFF] text-xs font-semibold tracking-wide transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing active dataset…</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Analysis</span>
              </>
            )}
          </button>

          <GenerateReportButton
            filters={filters}
            kpis={kpis}
            channelPerformance={channelPerformance}
            sequencePerformance={sequencePerformance}
            topPaths={topPaths}
            sampleSize={sampleSize}
            analysisResult={analysisResult}
            onTriggerAnalysis={handleRunAnalysis}
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="m-4 sm:m-5 p-3.5 rounded-lg bg-[#FDF0F0] border border-[#F1B5B5] text-xs text-[#9C3838]">
          <strong>Analysis failed:</strong> {error}
        </div>
      )}

      {/* Structured Output Presentation */}
      {analysisResult ? (
        <AIInsightPanel
          response={analysisResult}
          headerAction={
            <GenerateReportButton
              filters={filters}
              kpis={kpis}
              channelPerformance={channelPerformance}
              sequencePerformance={sequencePerformance}
              topPaths={topPaths}
              sampleSize={sampleSize}
              analysisResult={analysisResult}
              onTriggerAnalysis={handleRunAnalysis}
            />
          }
        />
      ) : (
        !isLoading && (
          <div className="p-8 text-center text-xs text-[#7D8782]">
            Click <strong className="text-[#18201E]">Run Analysis</strong> to examine channel performance, drop-off sequence points, and path opportunities with Gemini, or generate an executive Google Slides report directly.
          </div>
        )
      )}
    </div>
  );
};
