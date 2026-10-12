import React from 'react';
import { JourneyPathSummary } from '../../types';
import { ArrowRight } from 'lucide-react';
import { getChannelColor } from '../../lib/colors';

interface TopPathsTableProps {
  paths: JourneyPathSummary[];
}

export const TopPathsTable: React.FC<TopPathsTableProps> = ({ paths }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="bg-[#FFFFFF] border border-[#DCE2DE] rounded-lg shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-[#DCE2DE]">
        <h3 className="text-sm font-semibold text-[#18201E]">
          Top Converting Multi-Touch Paths
        </h3>
        <p className="text-xs text-[#56615D]">
          Most frequent multi-channel touchpoint sequences leading to completed conversions
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#35413D]">
          <thead className="bg-[#F0F2EE] text-[11px] font-semibold text-[#56615D] uppercase tracking-wider border-b border-[#DCE2DE]">
            <tr>
              <th className="py-3 px-4">Journey Path Sequence</th>
              <th className="py-3 px-4 text-center">Conversions</th>
              <th className="py-3 px-4 text-center">Avg. Touches</th>
              <th className="py-3 px-4 text-center">Velocity (Days)</th>
              <th className="py-3 px-4 text-right">Attributed Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E8E5]">
            {paths.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#7D8782]">
                  No completed conversion paths found in active scope.
                </td>
              </tr>
            ) : (
              paths.slice(0, 8).map((path, idx) => (
                <tr key={idx} className="hover:bg-[#F7F8F6] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {path.steps.map((step, sIdx) => (
                        <React.Fragment key={sIdx}>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#F0F2EE] text-[#35413D] border border-[#DCE2DE]">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: getChannelColor(step) }}
                            />
                            {step}
                          </span>
                          {sIdx < path.steps.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-[#7D8782] shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold tabular-nums text-[#18201E]">
                    {path.conversions}
                  </td>
                  <td className="py-3 px-4 text-center font-mono tabular-nums text-[#56615D]">
                    {path.avgTouchpoints}
                  </td>
                  <td className="py-3 px-4 text-center font-mono tabular-nums text-[#56615D]">
                    {path.avgDaysToConvert}d
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium tabular-nums text-[#38764A]">
                    {formatCurrency(path.totalRevenue)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
