import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Presentation,
  X,
  AlertTriangle,
  HardDrive,
  Copy,
  Check,
} from 'lucide-react';
import { PresentationReport, SlideItem } from '../../types';

interface SlideDeckViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: PresentationReport | null;
  quotaExceeded?: boolean;
  onRetryGoogleSlides?: () => void;
}

export const SlideDeckViewerModal: React.FC<SlideDeckViewerModalProps> = ({
  isOpen,
  onClose,
  report,
  quotaExceeded = false,
  onRetryGoogleSlides,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [copiedHtml, setCopiedHtml] = useState(false);

  useEffect(() => {
    setCurrentSlideIndex(0);
  }, [report, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        setCurrentSlideIndex((prev) =>
          report?.slides ? Math.min(prev + 1, report.slides.length - 1) : prev
        );
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, report, onClose]);

  if (!isOpen || !report || !report.slides || report.slides.length === 0) {
    return null;
  }

  const slides = report.slides;
  const slide = slides[currentSlideIndex] || slides[0];
  const slideCount = slides.length;

  const handleDownloadHtml = () => {
    const htmlContent = generateSelfContainedHtml(report);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(report.title || 'P2C_Presentation').replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#18201E]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-[#FFFFFF] border border-[#DCE2DE] rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] max-h-[860px] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deck-modal-title"
      >
        {/* Header Bar */}
        <div className="px-5 py-3 border-b border-[#E4E8E5] bg-[#F0F2EE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#087F73] text-[#FFFFFF] flex items-center justify-center shadow-xs">
              <Presentation className="w-4 h-4" />
            </div>
            <div>
              <h3 id="deck-modal-title" className="text-sm font-semibold text-[#18201E]">
                {report.title || 'Path-to-Conversion Executive Report'}
              </h3>
              <p className="text-[11px] text-[#56615D]">
                Interactive Executive Deck • {slideCount} slides formatted for presentation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="h-8 px-3 rounded-lg border border-[#C8D0CB] bg-[#FFFFFF] hover:bg-[#F6F7F4] text-xs font-semibold text-[#18201E] flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Download presentation as self-contained HTML file"
            >
              {copiedHtml ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#087F73]" />
                  <span className="text-[#087F73]">Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-[#56615D]" />
                  <span>Download Deck (HTML)</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="w-8 h-8 rounded-lg text-[#7D8782] hover:text-[#18201E] hover:bg-[#E4E8E5] flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notice Banner (If Google Drive Quota Full) */}
        {quotaExceeded && (
          <div className="px-5 py-2.5 bg-[#FFF9E6] border-b border-[#F7E2A4] text-xs text-[#7A5B00] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#B28200]" />
              <span>
                <strong>Google Drive Storage Quota Full:</strong> Your presentation is fully rendered below and ready to download. To save directly into Google Slides, empty your Google Drive Trash.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://drive.google.com/drive/trash"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold underline text-[#8A6300] hover:text-[#5C4200]"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Empty Drive Trash</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              {onRetryGoogleSlides && (
                <button
                  type="button"
                  onClick={onRetryGoogleSlides}
                  className="px-2.5 py-1 rounded bg-[#F1D77C] hover:bg-[#E8CA66] font-semibold text-[#4F3900] text-[11px] cursor-pointer transition"
                >
                  Retry Sync
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Presentation Stage */}
        <div className="flex-1 bg-[#2C3532] p-4 sm:p-6 overflow-hidden flex items-center justify-center">
          {/* 16:9 Slide Canvas */}
          <div className="w-full max-w-4xl aspect-[16/9] bg-[#FFFFFF] rounded-xl shadow-2xl border border-[#C8D0CB] overflow-hidden flex flex-col relative select-none">
            {/* Top Teal Accent Banner */}
            <div className="h-1.5 w-full bg-[#087F73] shrink-0" />

            {/* Slide Header */}
            <div className="px-8 pt-6 pb-4 border-b border-[#E4E8E5] shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#087F73]">
                  {getSlideCategory(slide.type)}
                </span>
                <span className="text-[11px] font-mono font-semibold text-[#8A948F]">
                  Slide {currentSlideIndex + 1} of {slideCount}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#18201E] tracking-tight">
                {slide.title}
              </h2>
              {slide.subtitle && (
                <p className="text-xs sm:text-sm text-[#56615D] mt-0.5 font-normal">
                  {slide.subtitle}
                </p>
              )}
            </div>

            {/* Slide Body */}
            <div className="flex-1 px-8 py-5 overflow-y-auto flex flex-col justify-center">
              {slide.type === 'title' ? (
                <div className="space-y-4 my-auto">
                  <div className="p-5 rounded-xl bg-[#F6F7F4] border border-[#DCE2DE] space-y-2">
                    <h3 className="text-base font-bold text-[#18201E]">
                      Multi-Touch Path-to-Conversion Intelligence
                    </h3>
                    <p className="text-xs text-[#56615D] leading-relaxed">
                      Comprehensive multi-touch attribution analysis evaluating touchpoint velocity, assist dynamics, and conversion paths across {report.dateRange || 'analyzed date range'}.
                    </p>
                    <p className="text-[11px] text-[#7D8782] italic">
                      Methodology: Grounded deterministic telemetry &amp; Gemini pattern synthesis.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#DCE2DE] text-center text-xs font-semibold text-[#7D8782]">
                    Report Period: {report.dateRange || 'Active Selection'} &bull; Confidential Executive Briefing &bull; P2C Analytics Engine
                  </div>
                </div>
              ) : slide.type === 'kpi' && slide.metrics && slide.metrics.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-auto">
                  {slide.metrics.slice(0, 4).map((m, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#FFFFFF] border border-[#DCE2DE] shadow-2xs flex flex-col justify-between h-36"
                    >
                      <span className="text-[10px] font-bold text-[#7D8782] uppercase tracking-wider">
                        {m.label}
                      </span>
                      <span className="text-2xl font-bold text-[#087F73] my-auto">
                        {m.value}
                      </span>
                      {m.context && (
                        <span className="text-[11px] text-[#56615D] leading-tight">
                          {m.context}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 my-auto">
                  {/* Top Highlight Metrics */}
                  {slide.metrics && slide.metrics.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {slide.metrics.slice(0, 3).map((m, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-[#F6F7F4] border border-[#DCE2DE]"
                        >
                          <p className="text-xs font-bold text-[#18201E]">
                            <span className="text-[#087F73]">{m.label}:</span> {m.value}
                          </p>
                          {m.context && (
                            <p className="text-[10px] text-[#56615D] mt-0.5">
                              {m.context}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bullet Points Container */}
                  {slide.bullets && slide.bullets.length > 0 && (
                    <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#DCE2DE] shadow-2xs space-y-2.5">
                      {slide.bullets.map((b, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#18201E] leading-relaxed">
                          <span className="text-[#087F73] font-bold mt-0.5">•</span>
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Slide Footer */}
            <div className="px-8 py-3 border-t border-[#E4E8E5] bg-[#FFFFFF] flex items-center justify-between text-[10px] text-[#8A948F] shrink-0">
              <span>Generated from P2C Insights Analytics Engine</span>
              <span>Slide {currentSlideIndex + 1} of {slideCount}</span>
            </div>
          </div>
        </div>

        {/* Carousel Bottom Control Bar */}
        <div className="px-5 py-3 border-t border-[#E4E8E5] bg-[#F0F2EE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-md py-1">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlideIndex(idx)}
                className={`w-6 h-6 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center justify-center ${
                  idx === currentSlideIndex
                    ? 'bg-[#087F73] text-[#FFFFFF] shadow-2xs'
                    : 'bg-[#FFFFFF] text-[#56615D] border border-[#DCE2DE] hover:bg-[#E4E8E5]'
                }`}
                title={`Go to slide ${idx + 1}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentSlideIndex((prev) => Math.max(prev - 1, 0))}
              disabled={currentSlideIndex === 0}
              className="h-8 px-3 rounded-lg border border-[#C8D0CB] bg-[#FFFFFF] hover:bg-[#F6F7F4] disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold text-[#18201E] flex items-center gap-1 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentSlideIndex((prev) => Math.min(prev + 1, slideCount - 1))
              }
              disabled={currentSlideIndex === slideCount - 1}
              className="h-8 px-3.5 rounded-lg bg-[#087F73] hover:bg-[#06695F] disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold text-[#FFFFFF] flex items-center gap-1 transition cursor-pointer shadow-2xs"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function getSlideCategory(type: string): string {
  switch (type) {
    case 'title':
      return 'EXECUTIVE BRIEFING';
    case 'summary':
      return 'EXECUTIVE SUMMARY';
    case 'kpi':
      return 'KPI SCORECARD';
    case 'journey':
      return 'CUSTOMER JOURNEY DEPTH';
    case 'channel':
      return 'CHANNEL ATTRIBUTION';
    case 'sequence':
      return 'SEQUENCE DROPS & CONVERSION';
    case 'insights':
      return 'STRATEGIC INSIGHTS';
    case 'recommendations':
      return 'RECOMMENDED ACTIONS';
    default:
      return 'PATH-TO-CONVERSION REPORT';
  }
}

function generateSelfContainedHtml(report: PresentationReport): string {
  const slides = report.slides || [];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(report.title || 'P2C Insights Report')}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #F0F2EE;
      color: #18201E;
      margin: 0;
      padding: 24px;
    }
    .deck-container {
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }
    .slide {
      background: #FFFFFF;
      border: 1px solid #DCE2DE;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      aspect-ratio: 16 / 9;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      page-break-after: always;
      position: relative;
    }
    .top-accent {
      height: 6px;
      background: #087F73;
      width: 100%;
    }
    .slide-header {
      padding: 24px 32px 16px;
      border-bottom: 1px solid #E4E8E5;
    }
    .category {
      font-size: 11px;
      font-weight: 700;
      color: #087F73;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      margin: 4px 0 0 0;
    }
    .subtitle {
      font-size: 13px;
      color: #56615D;
      margin-top: 2px;
    }
    .slide-body {
      padding: 24px 32px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 16px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .kpi-card {
      padding: 16px;
      background: #F6F7F4;
      border: 1px solid #DCE2DE;
      border-radius: 8px;
    }
    .kpi-val {
      font-size: 24px;
      font-weight: 700;
      color: #087F73;
      margin: 8px 0 4px 0;
    }
    .bullet-card {
      background: #FFFFFF;
      border: 1px solid #DCE2DE;
      border-radius: 8px;
      padding: 16px;
    }
    .bullet-item {
      margin-bottom: 12px;
      font-size: 13px;
      line-height: 1.5;
    }
    .slide-footer {
      padding: 12px 32px;
      border-top: 1px solid #E4E8E5;
      font-size: 11px;
      color: #7D8782;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { background: none; padding: 0; }
      .slide { box-shadow: none; border: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="deck-container">
    ${slides
      .map(
        (s, idx) => `
      <div class="slide">
        <div class="top-accent"></div>
        <div class="slide-header">
          <div class="category">${escapeHtml(getSlideCategory(s.type))}</div>
          <h2 class="title">${escapeHtml(s.title)}</h2>
          ${s.subtitle ? `<div class="subtitle">${escapeHtml(s.subtitle)}</div>` : ''}
        </div>
        <div class="slide-body">
          ${
            s.metrics && s.metrics.length > 0
              ? `
            <div class="kpi-grid">
              ${s.metrics
                .slice(0, 4)
                .map(
                  (m) => `
                <div class="kpi-card">
                  <div style="font-size: 10px; font-weight: 700; color: #7D8782; text-transform: uppercase;">${escapeHtml(m.label)}</div>
                  <div class="kpi-val">${escapeHtml(m.value)}</div>
                  ${m.context ? `<div style="font-size: 11px; color: #56615D;">${escapeHtml(m.context)}</div>` : ''}
                </div>
              `
                )
                .join('')}
            </div>
          `
              : ''
          }
          ${
            s.bullets && s.bullets.length > 0
              ? `
            <div class="bullet-card">
              ${s.bullets
                .map(
                  (b) => `
                <div class="bullet-item">• ${escapeHtml(b)}</div>
              `
                )
                .join('')}
            </div>
          `
              : ''
          }
        </div>
        <div class="slide-footer">
          <span>P2C Insights Presentation Report</span>
          <span>Slide ${idx + 1} of ${slides.length}</span>
        </div>
      </div>
    `
      )
      .join('')}
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
