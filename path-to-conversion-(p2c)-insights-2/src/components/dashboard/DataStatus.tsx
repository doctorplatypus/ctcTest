import React from 'react';
import { AlertTriangle, Info, Database, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ConnectionStatus, DataSourceMode } from '../../types';

interface DataStatusProps {
  status: ConnectionStatus;
  dataSourceMode: DataSourceMode;
  collectionName: string;
  errorMessage?: string;
  recordCount: number;
  onOpenSchemaModal: () => void;
  onSwitchToDemo: () => void;
}

export const DataStatus: React.FC<DataStatusProps> = ({
  status,
  dataSourceMode,
  collectionName,
  errorMessage,
  recordCount,
  onOpenSchemaModal,
  onSwitchToDemo,
}) => {
  // Demo Mode Banner
  if (dataSourceMode === 'demo_data') {
    return (
      <div className="bg-[#FFF5E5] border border-[#F2DEBF] rounded-lg p-3 text-xs text-[#56615D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-[#A86612] shrink-0" />
          <div>
            <strong className="text-[#18201E]">DEMO DATA ACTIVE</strong>: Visualizing isolated development dataset ({recordCount} touchpoints across 10 customer journeys).
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={onOpenSchemaModal}
            className="text-xs font-medium text-[#A86612] hover:text-[#C87818] underline cursor-pointer"
          >
            Connect Live Firestore
          </button>
        </div>
      </div>
    );
  }

  // Live Firestore: Configuration Required
  if (status === 'configuration_required') {
    return (
      <div className="bg-[#FDF0F0] border border-[#F5C7C7] rounded-lg p-3.5 text-xs text-[#56615D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#B54848] shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <span className="font-semibold text-[#18201E]">Firestore Configuration Required</span>: No active Firebase project ID configured.
            <span className="block sm:inline sm:ml-1 text-[#56615D]">You can connect your project credentials or explore with Demo Data.</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onSwitchToDemo}
            className="px-2.5 py-1.5 rounded border border-[#C8D0CB] bg-[#FFFFFF] hover:bg-[#F0F2EE] text-[#35413D] font-medium transition cursor-pointer"
          >
            Switch to Demo Data
          </button>
          <button
            type="button"
            onClick={onOpenSchemaModal}
            className="px-2.5 py-1.5 rounded bg-[#087F73] hover:bg-[#06695F] text-[#FFFFFF] font-medium transition cursor-pointer shadow-xs"
          >
            Configure Credentials
          </button>
        </div>
      </div>
    );
  }

  // Live Firestore: Connection Error
  if (status === 'error') {
    const isPermissionError =
      errorMessage?.toLowerCase().includes('permission') ||
      errorMessage?.toLowerCase().includes('missing or insufficient');

    return (
      <div className="bg-[#FDF0F0] border border-[#F5C7C7] rounded-lg p-4 text-xs text-[#56615D] flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#B54848] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[#18201E]">
                {isPermissionError ? 'Firestore Access Denied (Security Rules)' : 'Firestore Connection Notice'}
              </div>
              <p className="mt-0.5 text-[#56615D] leading-relaxed">
                {errorMessage || 'Could not query collection.'}
              </p>
              {isPermissionError && (
                <div className="mt-2 text-[11px] text-[#56615D] bg-[#FFFFFF] p-2.5 rounded border border-[#F5C7C7] space-y-1">
                  <div className="font-medium text-[#18201E]">Quick Resolution:</div>
                  <div>
                    1. In your Firebase Console, open <strong>Firestore Database &gt; Rules</strong>.
                  </div>
                  <div>
                    2. Add public read access for development:{' '}
                    <code className="bg-[#F0F2EE] px-1.5 py-0.5 rounded font-mono text-[#087F73]">
                      match /{collectionName}/{'{document=**}'} {'{ allow read: if true; }'}
                    </code>
                  </div>
                  <div>
                    3. Or click below to immediately explore with the pre-loaded 48-touchpoint journey dataset.
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={onSwitchToDemo}
              className="px-3 py-1.5 rounded bg-[#087F73] hover:bg-[#06695F] text-[#FFFFFF] font-medium transition cursor-pointer shadow-xs whitespace-nowrap"
            >
              Switch to Demo Data
            </button>
            <button
              type="button"
              onClick={onOpenSchemaModal}
              className="px-2.5 py-1.5 rounded border border-[#C8D0CB] bg-[#FFFFFF] hover:bg-[#F0F2EE] text-[#35413D] font-medium transition cursor-pointer whitespace-nowrap"
            >
              Verify Config
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Live Firestore: Empty Collection
  if (status === 'empty') {
    return (
      <div className="bg-[#F0F2EE] border border-[#DCE2DE] rounded-lg p-3.5 text-xs text-[#56615D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 text-[#56615D] shrink-0" />
          <div>
            <span className="font-semibold text-[#18201E]">No records found</span> in collection <code className="bg-[#E8F5F2] px-1 py-0.5 rounded text-[#06695F]">{collectionName}</code>.
            All metrics reflect true zero state.
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onSwitchToDemo}
            className="text-xs font-medium text-[#087F73] hover:underline cursor-pointer"
          >
            Load Demo Journeys
          </button>
        </div>
      </div>
    );
  }

  return null;
};
