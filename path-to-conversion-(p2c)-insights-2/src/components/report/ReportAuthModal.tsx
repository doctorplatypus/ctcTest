import React, { useState, useEffect } from 'react';
import { KeyRound, ExternalLink, X, Check, AlertCircle } from 'lucide-react';
import { getGoogleClientId, saveCustomClientId } from '../../lib/auth/googleAuth';

interface ReportAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorize: () => void;
}

export const ReportAuthModal: React.FC<ReportAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthorize,
}) => {
  const [clientId, setClientId] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      getGoogleClientId().then((id) => {
        if (id) setClientId(id);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (clientId.trim()) {
      saveCustomClientId(clientId.trim());
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18201E]/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-[#FFFFFF] border border-[#DCE2DE] rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E4E8E5] bg-[#F0F2EE] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#18201E] text-[#FFFFFF] flex items-center justify-center shadow-xs">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 id="auth-modal-title" className="text-sm font-semibold text-[#18201E]">
                Google Account Authorization
              </h3>
              <p className="text-[11px] text-[#56615D]">
                Grant permission to generate Google Slides presentations
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
        <div className="p-5 space-y-4 text-xs text-[#35413D]">
          <div className="p-3.5 rounded-lg bg-[#F6F7F4] border border-[#DCE2DE] space-y-2">
            <h4 className="font-semibold text-[#18201E] flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-[#087F73]" />
              <span>Required Permissions:</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[#56615D] pl-1 text-[11px]">
              <li>
                <code className="font-mono bg-[#FFFFFF] px-1 py-0.5 rounded border border-[#E4E8E5]">
                  .../auth/presentations
                </code>{' '}
                — Creates and populates presentation slides with your journey insights.
              </li>
              <li>
                <code className="font-mono bg-[#FFFFFF] px-1 py-0.5 rounded border border-[#E4E8E5]">
                  .../auth/drive.file
                </code>{' '}
                — Saves the newly created presentation directly to your personal or workspace Google Drive.
              </li>
            </ul>
            <div className="pt-2 border-t border-[#E4E8E5] text-[11px] text-[#42524B] space-y-1">
              <p className="font-semibold text-[#18201E]">Troubleshooting Checklist:</p>
              <p>• <strong>Consent Popup Checkbox:</strong> When Google opens the sign-in window, make sure to check the box for <em>"See, edit, create, and delete all your Google Slides presentations"</em> before clicking Continue.</p>
              <p>• <strong>Enable Google Slides API:</strong> In Google Cloud Console, go to <em>APIs & Services &gt; Library</em>, search for <em>Google Slides API</em>, and verify it is <strong>Enabled</strong> for your project.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#56615D] uppercase tracking-wider block">
              Google OAuth Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
              className="w-full h-9 px-3 bg-[#FFFFFF] border border-[#C8D0CB] rounded-md text-xs font-mono text-[#18201E] outline-none focus:border-[#087F73] focus:ring-1 focus:ring-[#087F73]/25 transition"
            />
            <p className="text-[11px] text-[#7D8782]">
              Configured via Google Cloud Console OAuth 2.0 Web Client.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-3.5 bg-[#F0F2EE] border-t border-[#E4E8E5] flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1.5 rounded-md border border-[#C8D0CB] bg-[#FFFFFF] hover:bg-[#F6F7F4] text-xs font-medium text-[#35413D] transition flex items-center gap-1.5 cursor-pointer"
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-[#087F73]" /> : null}
            <span>{isSaved ? 'Saved' : 'Update Client ID'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md border border-[#C8D0CB] bg-[#FFFFFF] hover:bg-[#F6F7F4] text-xs font-medium text-[#35413D] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onAuthorize();
              }}
              className="px-4 py-1.5 rounded-md bg-[#087F73] hover:bg-[#06695F] text-[#FFFFFF] text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <span>Connect with Google</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
