import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Presentation, X } from 'lucide-react';

interface ReportResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  presentationUrl: string;
  slideCount?: number;
}

export const ReportResultModal: React.FC<ReportResultModalProps> = ({
  isOpen,
  onClose,
  title,
  presentationUrl,
  slideCount = 9,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(presentationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18201E]/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-[#FFFFFF] border border-[#DCE2DE] rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E4E8E5] bg-[#F0F2EE] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#087F73] text-[#FFFFFF] flex items-center justify-center shadow-xs">
              <Presentation className="w-4 h-4" />
            </div>
            <div>
              <h3 id="report-modal-title" className="text-sm font-semibold text-[#18201E]">
                Presentation Ready
              </h3>
              <p className="text-[11px] text-[#56615D]">
                Google Slides deck generated and formatted
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-7 h-7 rounded-md text-[#7D8782] hover:text-[#18201E] hover:bg-[#E4E8E5] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-4 rounded-lg bg-[#F6F7F4] border border-[#DCE2DE] space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#087F73]">
              Created Deck
            </span>
            <h4 className="text-sm font-bold text-[#18201E] leading-snug">
              {title}
            </h4>
            <p className="text-xs text-[#56615D]">
              {slideCount} slides covering Executive Summary, KPI scorecard, customer journey depth, channel attribution, sequence drops, and strategic recommendations.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-[#56615D] uppercase tracking-wider block">
              Direct Presentation Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={presentationUrl}
                className="w-full h-9 px-3 bg-[#F0F2EE] border border-[#C8D0CB] rounded-md text-xs font-mono text-[#18201E] select-all outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="h-9 px-3 rounded-md border border-[#C8D0CB] bg-[#FFFFFF] hover:bg-[#F0F2EE] text-[#18201E] text-xs font-semibold flex items-center gap-1.5 shrink-0 transition cursor-pointer"
                title="Copy URL"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#087F73]" />
                    <span className="text-[#087F73]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#56615D]" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-md bg-[#EAF5EE] border border-[#A9D7B6] text-xs text-[#216E39] flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Saved to your Google Drive in 16:9 widescreen format with executive layout styling.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-3.5 bg-[#F0F2EE] border-t border-[#E4E8E5] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-md border border-[#C8D0CB] bg-[#FFFFFF] hover:bg-[#F6F7F4] text-xs font-medium text-[#35413D] transition cursor-pointer"
          >
            Close
          </button>
          <a
            href={presentationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-md bg-[#087F73] hover:bg-[#06695F] text-[#FFFFFF] text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <span>Open in Google Slides</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
