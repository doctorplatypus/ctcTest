import React, { useState } from 'react';
import { TouchpointRecord } from '../../types';
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { getChannelColor } from '../../lib/colors';

interface TouchpointTableProps {
  records: TouchpointRecord[];
}

type SortField = 'timestamp' | 'customerId' | 'sequenceStep' | 'channel' | 'revenue';

export const TouchpointTable: React.FC<TouchpointTableProps> = ({ records }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Sorting
  const sortedRecords = [...records].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'timestamp') {
      comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    } else if (sortField === 'sequenceStep') {
      comparison = a.sequenceStep - b.sequenceStep;
    } else if (sortField === 'revenue') {
      comparison = a.revenue - b.revenue;
    } else if (sortField === 'customerId') {
      comparison = a.customerId.localeCompare(b.customerId);
    } else if (sortField === 'channel') {
      comparison = a.channel.localeCompare(b.channel);
    }
    return sortAsc ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pageRecords = sortedRecords.slice(startIndex, startIndex + pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="bg-[#FFFFFF] border border-[#DCE2DE] rounded-lg shadow-xs overflow-hidden">
      {/* Table Header */}
      <div className="p-4 sm:p-5 border-b border-[#DCE2DE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#18201E]">
            Normalized Touchpoint Records
          </h3>
          <p className="text-xs text-[#56615D]">
            Underlying journey events mapped via schema normalization layer
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#56615D]">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="h-8 px-2 bg-[#FFFFFF] border border-[#C8D0CB] rounded text-[#18201E] font-medium outline-none cursor-pointer hover:border-[#9BA8A1] focus:border-[#087F73]"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#35413D]">
          <thead className="bg-[#F0F2EE] text-[11px] font-semibold text-[#56615D] uppercase tracking-wider border-b border-[#DCE2DE]">
            <tr>
              <th
                onClick={() => handleSort('timestamp')}
                className="py-3 px-4 cursor-pointer hover:text-[#18201E] transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Timestamp</span>
                  <ArrowUpDown className="w-3 h-3 text-[#7D8782]" />
                </div>
              </th>
              <th
                onClick={() => handleSort('customerId')}
                className="py-3 px-4 cursor-pointer hover:text-[#18201E] transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Customer</span>
                  <ArrowUpDown className="w-3 h-3 text-[#7D8782]" />
                </div>
              </th>
              <th className="py-3 px-4">Journey ID</th>
              <th
                onClick={() => handleSort('sequenceStep')}
                className="py-3 px-4 cursor-pointer hover:text-[#18201E] transition select-none text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Seq</span>
                  <ArrowUpDown className="w-3 h-3 text-[#7D8782]" />
                </div>
              </th>
              <th
                onClick={() => handleSort('channel')}
                className="py-3 px-4 cursor-pointer hover:text-[#18201E] transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Channel</span>
                  <ArrowUpDown className="w-3 h-3 text-[#7D8782]" />
                </div>
              </th>
              <th className="py-3 px-4">Type / Campaign</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th
                onClick={() => handleSort('revenue')}
                className="py-3 px-4 cursor-pointer hover:text-[#18201E] transition select-none text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Revenue</span>
                  <ArrowUpDown className="w-3 h-3 text-[#7D8782]" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E8E5]">
            {pageRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#7D8782]">
                  No touchpoints match the current filter selection.
                </td>
              </tr>
            ) : (
              pageRecords.map((r) => (
                <tr key={r.id} className="hover:bg-[#F7F8F6] transition-colors">
                  <td className="py-2.5 px-4 font-mono text-[11px] text-[#56615D] whitespace-nowrap">
                    {new Date(r.timestamp).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    <span className="text-[#7D8782]">
                      {new Date(r.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="font-medium text-[#18201E]">
                      {r.customerName || r.customerId}
                    </div>
                    {r.customerName && (
                      <div className="text-[10px] text-[#7D8782] font-mono">
                        {r.customerId}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-[#56615D]">
                    {r.journeyId}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F0F2EE] text-[#18201E] font-mono font-medium text-[11px] border border-[#DCE2DE]">
                      {r.sequenceStep}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-xs shrink-0"
                        style={{ backgroundColor: getChannelColor(r.channel) }}
                      />
                      <span className="font-medium text-[#18201E]">{r.channel}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-[11px] text-[#56615D] max-w-xs truncate">
                    {r.type || r.campaign || '—'}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {r.converted ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#EAF5EE] text-[#216E39] border border-[#A9D7B6]">
                        Converted
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#FDF3E7] text-[#8C5311] border border-[#F1CCA0]">
                        In-Flight
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-medium tabular-nums">
                    {r.revenue > 0 ? (
                      <span className="text-[#38764A]">{formatCurrency(r.revenue)}</span>
                    ) : (
                      <span className="text-[#7D8782]">$0</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-3 sm:px-5 border-t border-[#DCE2DE] bg-[#F0F2EE] flex items-center justify-between text-xs text-[#56615D]">
        <div>
          Showing <strong className="text-[#18201E]">{records.length > 0 ? startIndex + 1 : 0}</strong> to{' '}
          <strong className="text-[#18201E]">
            {Math.min(startIndex + pageSize, records.length)}
          </strong>{' '}
          of <strong className="text-[#18201E]">{records.length}</strong> records
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded border border-[#C8D0CB] bg-[#FFFFFF] hover:bg-[#F0F2EE] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[#35413D]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-medium text-[#56615D]">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded border border-[#C8D0CB] bg-[#FFFFFF] hover:bg-[#F0F2EE] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[#35413D]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
