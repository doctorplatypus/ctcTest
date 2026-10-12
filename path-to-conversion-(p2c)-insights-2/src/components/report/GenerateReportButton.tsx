import React, { useState } from 'react';
import { Presentation, Loader2, Check, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import {
  FilterState,
  KPIStats,
  ChannelPerformance,
  SequencePerformance,
  JourneyPathSummary,
  AIAnalysisResponse,
  ReportProgressStep,
  ReportGenerationResponse,
} from '../../types';
import { requestGoogleAccessToken, getActiveAccessToken, clearCachedAccessToken } from '../../lib/auth/googleAuth';
import { buildDeterministicReport } from '../../lib/gemini/reportGenerator';
import { createGoogleSlidesPresentation } from '../../lib/slides/slidesBuilder';
import { ReportResultModal } from './ReportResultModal';
import { ReportAuthModal } from './ReportAuthModal';
import { SlideDeckViewerModal } from './SlideDeckViewerModal';
import { PresentationReport } from '../../types';

interface GenerateReportButtonProps {
  filters: FilterState;
  kpis: KPIStats;
  channelPerformance: ChannelPerformance[];
  sequencePerformance: SequencePerformance[];
  topPaths: JourneyPathSummary[];
  sampleSize: number;
  analysisResult: AIAnalysisResponse | null;
  onTriggerAnalysis?: () => void;
  className?: string;
}

export const GenerateReportButton: React.FC<GenerateReportButtonProps> = ({
  filters,
  kpis,
  channelPerformance,
  sequencePerformance,
  topPaths,
  sampleSize,
  analysisResult,
  onTriggerAnalysis,
  className = '',
}) => {
  const [step, setStep] = useState<ReportProgressStep>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [activeReport, setActiveReport] = useState<PresentationReport | null>(null);
  const [createdPresentation, setCreatedPresentation] = useState<{
    id: string;
    url: string;
    title: string;
    slideCount: number;
  } | null>(null);

  const getProgressLabel = (currentStep: ReportProgressStep): string => {
    switch (currentStep) {
      case 'preparing':
        return 'Preparing report…';
      case 'generating_content':
        return 'Generating slide content…';
      case 'creating_presentation':
        return 'Creating presentation…';
      case 'finalizing':
        return 'Finalizing report…';
      case 'success':
        return 'Report Ready';
      case 'error':
        return 'Try Again';
      case 'idle':
      default:
        return 'Generate Report';
    }
  };

  const isGenerating =
    step === 'preparing' ||
    step === 'generating_content' ||
    step === 'creating_presentation' ||
    step === 'finalizing';

  const hasData = sampleSize > 0 && kpis && (kpis.totalConversions > 0 || kpis.totalTouchpoints > 0);

  const executeReportGeneration = async (accessToken: string) => {
    try {
      setErrorMessage(null);
      setIsQuotaExceeded(false);
      setStep('preparing');

      // Generate local presentation model immediately so it is available regardless of cloud quota
      const localReport = buildDeterministicReport({
        filters,
        kpis,
        channelPerformance,
        sequencePerformance,
        topPaths,
        sampleSize,
        analysisResult,
      });
      setActiveReport(localReport);

      // Step 2: Content generation progress indicator
      setTimeout(() => {
        setStep((prev) => (prev === 'preparing' ? 'generating_content' : prev));
      }, 700);

      // Step 3: Presentation creation progress indicator
      setTimeout(() => {
        setStep((prev) =>
          prev === 'generating_content' || prev === 'preparing' ? 'creating_presentation' : prev
        );
      }, 2000);

      // Dispatch to secure server endpoint with safe JSON handling and client fallback
      let presentationUrl = '';
      let presentationId = '';
      let presentationTitle = 'Path-to-Conversion Insights Report';
      let slideCount = 9;

      try {
        const response = await fetch('/api/report/slides', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            filters,
            kpis,
            channelPerformance,
            sequencePerformance,
            topPaths,
            sampleSize,
            analysisResult,
            projectName: 'P2C Analytics Engine',
          }),
        });

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data: ReportGenerationResponse = await response.json();
          if (response.ok && data.success && data.presentationUrl) {
            presentationUrl = data.presentationUrl;
            presentationId = data.presentationId || '';
            presentationTitle = data.title || presentationTitle;
            slideCount = data.slideCount || slideCount;
          } else {
            throw new Error(data.error || `Server returned error status ${response.status}`);
          }
        } else {
          // If proxy returned HTML (e.g. 504 Gateway Timeout), throw to trigger client-side fallback
          throw new Error('Server request timed out or returned non-JSON response.');
        }
      } catch (serverErr: any) {
        console.warn('Server report generation unavailable or timed out, executing direct client creation:', serverErr?.message);
        
        // Direct resilient fallback: build deterministic report & call Google Slides API directly
        const directResult = await createGoogleSlidesPresentation(accessToken, localReport);
        presentationUrl = directResult.presentationUrl;
        presentationId = directResult.presentationId;
        presentationTitle = directResult.title;
        slideCount = localReport.slides.length;
      }

      setStep('finalizing');

      setCreatedPresentation({
        id: presentationId,
        url: presentationUrl,
        title: presentationTitle,
        slideCount,
      });

      setStep('success');
      setIsResultModalOpen(true);
    } catch (err: any) {
      console.error('Presentation generation error:', err);
      const msg = err?.message || 'Failed to generate Google Slides report. Please retry.';
      const isQuota =
        msg.toLowerCase().includes('storage quota') ||
        msg.toLowerCase().includes('quota has been exceeded') ||
        msg.toLowerCase().includes('quota exceeded');

      setIsQuotaExceeded(isQuota);
      setErrorMessage(msg);
      setStep('error');

      if (isQuota) {
        // Automatically pop up in-app interactive slide deck viewer so the user is never blocked
        setIsViewerModalOpen(true);
      }
    }
  };

  const handleGenerateClick = async () => {
    if (isGenerating) return; // Prevent duplicate clicks

    // Validation: Require minimum reportable dataset
    if (!hasData) {
      setErrorMessage('No touchpoint or journey data is available to generate a report.');
      setStep('error');
      return;
    }

    setErrorMessage(null);

    try {
      // If recovering from an error, force interactive consent to ensure Google displays the permission checkboxes
      const forceConsent = step === 'error' || Boolean(errorMessage);
      let token = forceConsent ? null : getActiveAccessToken();
      if (!token) {
        token = await requestGoogleAccessToken(forceConsent);
      }

      await executeReportGeneration(token);
    } catch (authErr: any) {
      const authMsg = authErr?.message || '';
      console.warn('OAuth token requirement:', authMsg);

      // If client ID missing or user interaction required, open helper
      if (
        authMsg.includes('Client ID is missing') ||
        authMsg.includes('Google Identity Services SDK') ||
        authMsg.includes('access_denied')
      ) {
        setIsAuthModalOpen(true);
      } else {
        // Retry with interactive prompt
        try {
          const token = await requestGoogleAccessToken(true);
          await executeReportGeneration(token);
        } catch (interactiveErr: any) {
          setErrorMessage(interactiveErr?.message || 'Google account authorization failed.');
          setStep('error');
        }
      }
    }
  };

  return (
    <div className={`relative inline-flex flex-col items-start ${className}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleGenerateClick}
          disabled={isGenerating || !hasData}
          aria-label="Generate Google Slides presentation report"
          aria-busy={isGenerating}
          className={`group inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-semibold tracking-wide transition shadow-xs cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#087F73] focus-visible:ring-offset-2 ${
            step === 'success'
              ? 'bg-[#18201E] hover:bg-[#25322F] text-[#FFFFFF]'
              : step === 'error'
              ? 'bg-[#9C3838] hover:bg-[#852F2F] text-[#FFFFFF]'
              : 'bg-[#087F73] hover:bg-[#06695F] text-[#FFFFFF] active:scale-[0.98]'
          } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#FFFFFF]" />
              <span>{getProgressLabel(step)}</span>
            </>
          ) : step === 'success' ? (
            <>
              <Check className="w-4 h-4 text-[#A9D7B6]" />
              <span>Report Ready</span>
            </>
          ) : step === 'error' ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-[#FFFFFF]" />
              <span>Try Again</span>
            </>
          ) : (
            <>
              <Presentation className="w-4 h-4 text-[#FFFFFF] transition group-hover:scale-105" />
              <span>Generate Report</span>
            </>
          )}
        </button>

        {/* View Previous Deck Button (if already generated in session or stored locally) */}
        {activeReport && !isGenerating && (
          <button
            type="button"
            onClick={() => setIsViewerModalOpen(true)}
            className="text-xs text-[#087F73] hover:text-[#06695F] hover:underline font-semibold px-2 py-1 transition cursor-pointer flex items-center gap-1"
          >
            <span>View Slide Deck</span>
          </button>
        )}
      </div>

      {/* Inline Error / Quota Notice */}
      {errorMessage && (
        <div
          className={`mt-2.5 p-3 rounded-lg border text-xs flex items-start gap-2.5 max-w-lg animate-in fade-in shadow-xs ${
            isQuotaExceeded
              ? 'bg-[#FFF9E6] border-[#F7E2A4] text-[#7A5B00]'
              : 'bg-[#FDF0F0] border-[#F1B5B5] text-[#9C3838]'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <p className="font-semibold leading-snug">
              {isQuotaExceeded
                ? "Google Drive storage quota exceeded: Your Google Drive account is 100% full. Google cannot save new files until storage is freed."
                : errorMessage}
            </p>
            
            {activeReport && (
              <p className="text-[11px] text-[#56615D]">
                Your executive report has been compiled and is ready to view and download offline right now.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {activeReport && (
                <button
                  type="button"
                  onClick={() => setIsViewerModalOpen(true)}
                  className="px-2.5 py-1 rounded-md bg-[#087F73] hover:bg-[#06695F] text-[#FFFFFF] font-semibold text-[11px] cursor-pointer transition shadow-2xs"
                >
                  Open Slide Deck Viewer
                </button>
              )}

              {isQuotaExceeded && (
                <a
                  href="https://drive.google.com/drive/trash"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold text-[#8A6300] hover:text-[#5C4200] cursor-pointer"
                >
                  Empty Drive Trash &rarr;
                </a>
              )}

              <button
                type="button"
                onClick={async () => {
                  try {
                    clearCachedAccessToken();
                    setStep('preparing');
                    const token = await requestGoogleAccessToken(true);
                    await executeReportGeneration(token);
                  } catch (e: any) {
                    setErrorMessage(e?.message || 'Google authorization failed.');
                    setStep('error');
                  }
                }}
                className="underline font-medium hover:text-[#18201E] cursor-pointer"
              >
                Retry
              </button>

              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="underline font-medium text-[#7D8782] hover:text-[#18201E] cursor-pointer"
              >
                OAuth Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive In-App Slide Deck Viewer */}
      <SlideDeckViewerModal
        isOpen={isViewerModalOpen}
        onClose={() => setIsViewerModalOpen(false)}
        report={activeReport}
        quotaExceeded={isQuotaExceeded}
        onRetryGoogleSlides={async () => {
          setIsViewerModalOpen(false);
          await handleGenerateClick();
        }}
      />

      {/* Success Modal */}
      {createdPresentation && (
        <ReportResultModal
          isOpen={isResultModalOpen}
          onClose={() => setIsResultModalOpen(false)}
          title={createdPresentation.title}
          presentationUrl={createdPresentation.url}
          slideCount={createdPresentation.slideCount}
        />
      )}

      {/* Setup / Auth Modal */}
      <ReportAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthorize={async () => {
          try {
            const token = await requestGoogleAccessToken(true);
            await executeReportGeneration(token);
          } catch (err: any) {
            setErrorMessage(err?.message || 'Google authorization failed.');
            setStep('error');
          }
        }}
      />
    </div>
  );
};
