import React, { useState } from 'react';
import { RefreshCw, Database, Settings2, Info } from 'lucide-react';
import { ConnectionStatus, DataSourceMode } from '../../types';

interface DashboardHeaderProps {
  status: ConnectionStatus;
  dataSourceMode: DataSourceMode;
  onToggleDataSource: (mode: DataSourceMode) => void;
  onRefresh: () => void;
  onOpenSchemaModal: () => void;
  lastRefreshed: Date;
  isRefreshing: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  status,
  dataSourceMode,
  onToggleDataSource,
  onRefresh,
  onOpenSchemaModal,
  lastRefreshed,
  isRefreshing,
}) => {
  const [showRuntimeInfo, setShowRuntimeInfo] = useState(false);

  const getStatusBadge = () => {
    if (dataSourceMode === 'demo_data') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#FFF5E5] text-[#A86612] border border-[#F2DEBF]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C87818]" />
          DEMO DATA
        </span>
      );
    }

    switch (status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#EDF6EF] text-[#38764A] border border-[#C6E6D4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38764A]" />
            Firestore Connected
          </span>
        );
      case 'connecting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#E8F5F2] text-[#06695F] border border-[#87C5BA]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#087F73] animate-pulse" />
            Connecting…
          </span>
        );
      case 'configuration_required':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#F0F2EE] text-[#56615D] border border-[#DCE2DE]">
            Config Required
          </span>
        );
      case 'empty':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#F0F2EE] text-[#56615D] border border-[#DCE2DE]">
            0 Records Found
          </span>
        );
      case 'error':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#FDF0F0] text-[#B54848] border border-[#F5C7C7]">
            Connection Failed
          </span>
        );
    }
  };

  return (
    <header className="border-b border-[#DCE2DE] bg-[#FFFFFF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Logo & Product Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#18201E] text-[#FFFFFF] flex items-center justify-center font-bold text-xs tracking-wider select-none shrink-0 shadow-xs">
              P2C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-semibold text-[#18201E] tracking-tight">
                  P2C Insights
                </h1>
                <span className="text-xs text-[#7D8782] font-mono">v1.2</span>
              </div>
              <p className="text-xs text-[#56615D]">
                Path-to-Conversion Analytics & Attribution
              </p>
            </div>
          </div>

          {/* Right Controls: Data Status, Refresh, Settings */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            {/* Status Indicator */}
            {getStatusBadge()}

            {/* Mode Switcher: Live Firestore vs Demo Data */}
            <div className="inline-flex rounded-md border border-[#C8D0CB] p-0.5 bg-[#F0F2EE]">
              <button
                type="button"
                onClick={() => onToggleDataSource('demo_data')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                  dataSourceMode === 'demo_data'
                    ? 'bg-[#FFFFFF] text-[#18201E] shadow-xs'
                    : 'text-[#56615D] hover:text-[#18201E]'
                }`}
              >
                Demo Mode
              </button>
              <button
                type="button"
                onClick={() => onToggleDataSource('live_firestore')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                  dataSourceMode === 'live_firestore'
                    ? 'bg-[#FFFFFF] text-[#18201E] shadow-xs'
                    : 'text-[#56615D] hover:text-[#18201E]'
                }`}
              >
                Live Firestore
              </button>
            </div>

            {/* Schema Mapping & Config Modal Trigger */}
            <button
              type="button"
              onClick={onOpenSchemaModal}
              title="Configure Firestore Field Mapping and Connection Settings"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#C8D0CB] bg-[#FFFFFF] hover:bg-[#F0F2EE] hover:border-[#9BA8A1] text-[#35413D] font-medium transition cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5 text-[#56615D]" />
              <span className="hidden md:inline">Schema Mapping</span>
            </button>

            {/* Architecture / Runtime Notice */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRuntimeInfo(!showRuntimeInfo)}
                className="p-1.5 rounded-md border border-[#C8D0CB] bg-[#FFFFFF] hover:bg-[#F0F2EE] hover:border-[#9BA8A1] text-[#56615D] hover:text-[#18201E] transition cursor-pointer"
                title="Runtime Architecture Info"
              >
                <Info className="w-3.5 h-3.5" />
              </button>

              {showRuntimeInfo && (
                <div className="absolute right-0 mt-2 w-72 p-3 bg-[#FFFFFF] border border-[#DCE2DE] rounded-lg shadow-md z-30 text-xs text-[#56615D] space-y-1.5">
                  <p className="font-semibold text-[#18201E]">Runtime Environment Notice</p>
                  <p>
                    Running on <strong>React 19 + Express API</strong> within the AI Studio container environment.
                  </p>
                  <p>
                    All analytics, normalization, attribution, and Gemini schemas are cleanly modularized into <code className="text-[#18201E] bg-[#F0F2EE] px-1 py-0.5 rounded">lib/analytics/</code> and <code className="text-[#18201E] bg-[#F0F2EE] px-1 py-0.5 rounded">api/analyze</code> for 1:1 export into a Next.js App Router application.
                  </p>
                  <div className="pt-1 text-right">
                    <button
                      type="button"
                      onClick={() => setShowRuntimeInfo(false)}
                      className="text-[#087F73] font-medium hover:underline cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Last Refreshed & Refresh Button */}
            <div className="flex items-center gap-2 pl-1 border-l border-[#DCE2DE]">
              <span className="text-[11px] text-[#7D8782] hidden lg:inline tabular-nums">
                Refreshed {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh Dataset"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#C8D0CB] bg-[#FFFFFF] hover:bg-[#F0F2EE] hover:border-[#9BA8A1] text-[#35413D] font-medium transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#56615D] ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
