import React from 'react';
import { Filter, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { FilterState, AttributionModelType } from '../../types';
import { TouchpointLookbackBar } from './TouchpointLookbackBar';

interface DashboardFiltersProps {
  filters: FilterState;
  onFilterChange: (updated: Partial<FilterState>) => void;
  onResetFilters: () => void;
  availableChannels: string[];
  totalRecordsCount: number;
  filteredRecordsCount: number;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableChannels,
  totalRecordsCount,
  filteredRecordsCount,
}) => {
  const isDateFiltered = filters.dateRange !== 'Last 30 Days';
  const isChannelFiltered = filters.channel !== 'all';
  const isStatusFiltered = filters.conversionStatus !== 'all';
  const isAttributionFiltered = filters.attributionModel !== 'linear';
  const isLookbackFiltered = filters.lookbackTouchpoints !== null;
  const isSearchFiltered = filters.searchQuery.trim() !== '';

  const isFiltered =
    isDateFiltered ||
    isChannelFiltered ||
    isStatusFiltered ||
    isAttributionFiltered ||
    isLookbackFiltered ||
    isSearchFiltered;

  const selectBaseClass =
    'h-9 px-2.5 py-1.5 rounded-md font-medium text-xs outline-none transition cursor-pointer hover:border-[#9BA8A1] focus:border-[#087F73] focus:ring-1 focus:ring-[#087F73]/25';

  return (
    <div className="bg-[#FFFFFF] border border-[#DCE2DE] rounded-lg p-3 sm:p-4 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        {/* Left Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
          {/* Date Range Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
            <label className="text-[11px] font-semibold text-[#56615D] uppercase tracking-wider">
              Date Range:
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => onFilterChange({ dateRange: e.target.value })}
              className={`${selectBaseClass} ${
                isDateFiltered
                  ? 'bg-[#E8F5F2] text-[#06695F] border border-[#87C5BA]'
                  : 'bg-[#FFFFFF] text-[#18201E] border border-[#C8D0CB]'
              }`}
            >
              <option value="Last 30 Days">Last 30 Days (Aug 2026)</option>
              <option value="Last 90 Days">Last 90 Days</option>
              <option value="All Time">All Time</option>
            </select>
          </div>

          {/* Marketing Channel Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
            <label className="text-[11px] font-semibold text-[#56615D] uppercase tracking-wider">
              Channel:
            </label>
            <select
              value={filters.channel}
              onChange={(e) => onFilterChange({ channel: e.target.value })}
              className={`${selectBaseClass} ${
                isChannelFiltered
                  ? 'bg-[#E8F5F2] text-[#06695F] border border-[#87C5BA]'
                  : 'bg-[#FFFFFF] text-[#18201E] border border-[#C8D0CB]'
              }`}
            >
              <option value="all">All Channels</option>
              {availableChannels.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>

          {/* Conversion Status Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
            <label className="text-[11px] font-semibold text-[#56615D] uppercase tracking-wider">
              Status:
            </label>
            <select
              value={filters.conversionStatus}
              onChange={(e) =>
                onFilterChange({
                  conversionStatus: e.target.value as 'all' | 'converted' | 'in_flight',
                })
              }
              className={`${selectBaseClass} ${
                isStatusFiltered
                  ? 'bg-[#E8F5F2] text-[#06695F] border border-[#87C5BA]'
                  : 'bg-[#FFFFFF] text-[#18201E] border border-[#C8D0CB]'
              }`}
            >
              <option value="all">All Touchpoints</option>
              <option value="converted">Converted Only</option>
              <option value="in_flight">In-Flight Only</option>
            </select>
          </div>

          {/* Attribution Model Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
            <label className="text-[11px] font-semibold text-[#56615D] uppercase tracking-wider">
              Attribution:
            </label>
            <select
              value={filters.attributionModel}
              onChange={(e) =>
                onFilterChange({
                  attributionModel: e.target.value as AttributionModelType,
                })
              }
              className={`${selectBaseClass} ${
                isAttributionFiltered
                  ? 'bg-[#E8F5F2] text-[#06695F] border border-[#87C5BA]'
                  : 'bg-[#FFFFFF] text-[#18201E] border border-[#C8D0CB]'
              }`}
            >
              <option value="linear">Linear (Equal Share)</option>
              <option value="first_touch">First Touch (Acquisition)</option>
              <option value="last_touch">Last Touch (Conversion Closer)</option>
              <option value="position_based">Position Based (U-Shaped 40/20/40)</option>
            </select>
          </div>
        </div>

        {/* Right Search Input and Reset Action */}
        <div className="flex items-center gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#E4E8E5]">
          <div className="relative flex-1 sm:w-56">
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              placeholder="Search customer, campaign..."
              className={`w-full h-9 pl-8 pr-3 rounded-md text-xs placeholder-[#7D8782] outline-none transition hover:border-[#9BA8A1] focus:border-[#087F73] focus:ring-1 focus:ring-[#087F73]/25 ${
                isSearchFiltered
                  ? 'bg-[#E8F5F2] text-[#06695F] border border-[#87C5BA]'
                  : 'bg-[#FFFFFF] text-[#18201E] border border-[#C8D0CB]'
              }`}
            />
            <Search className="w-3.5 h-3.5 text-[#7D8782] absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              title="Reset all filters to default"
              className="h-9 px-2.5 py-1.5 rounded-md border border-[#C8D0CB] bg-[#FFFFFF] hover:bg-[#F0F2EE] hover:border-[#9BA8A1] text-xs font-medium text-[#56615D] hover:text-[#18201E] transition inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-[#56615D]" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <div className="text-[11px] text-[#7D8782] hidden xl:block tabular-nums whitespace-nowrap pl-1">
            {filteredRecordsCount} / {totalRecordsCount} touches
          </div>
        </div>
      </div>

      {/* Touchpoint Lookback Parameter Slider Bar - Google AI Studio Style */}
      <div className="pt-3.5 mt-3.5 border-t border-[#E8ECE9]">
        <TouchpointLookbackBar
          value={filters.lookbackTouchpoints}
          onChange={(val) => onFilterChange({ lookbackTouchpoints: val })}
        />
      </div>
    </div>
  );
};
