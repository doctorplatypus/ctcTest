import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { ChannelPerformance, AttributionModelType } from '../../types';
import { getChannelColor } from '../../lib/colors';

interface RevenueChannelChartProps {
  data: ChannelPerformance[];
  totalAttributedRevenue: number;
  attributionModel: AttributionModelType;
}

const ATTRIBUTION_MODEL_NAMES: Record<AttributionModelType, string> = {
  linear: 'Linear Attribution',
  first_touch: 'First-Touch Attribution',
  last_touch: 'Last-Touch Attribution',
  position_based: 'Position-Based (40/40/20)',
};

export const RevenueChannelChart: React.FC<RevenueChannelChartProps> = ({
  data,
  totalAttributedRevenue,
  attributionModel,
}) => {
  // Format currency for axis and tooltips
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: ChannelPerformance = payload[0].payload;
      const channelColor = getChannelColor(item.channel);
      return (
        <div className="bg-[#18201E] text-[#FFFFFF] border border-[#18201E] p-3 rounded-lg shadow-md text-xs space-y-1">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-xs shrink-0"
              style={{ backgroundColor: channelColor }}
            />
            <p className="font-semibold text-[#FFFFFF]">{item.channel}</p>
          </div>
          <p className="text-[#8ACCC1] font-semibold tabular-nums text-sm">
            {formatCurrency(item.attributedRevenue)}
          </p>
          <div className="text-[#CDD5D1] space-y-0.5 pt-1 border-t border-[#35413D]">
            <p>{item.percentage}% of total attributed revenue</p>
            <p>{item.touchpointCount} total touchpoints ({item.convertingTouchpoints} in converting paths)</p>
            <p className="text-[11px] text-[#CDD5D1]/80">
              First: {item.firstTouchCount} • Last: {item.lastTouchCount} • Assist: {item.assistingCount}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="bg-[#FFFFFF] border border-[#DCE2DE] rounded-lg p-5 shadow-xs flex flex-col justify-center items-center min-h-[300px] text-center">
        <p className="text-xs font-semibold text-[#56615D] uppercase tracking-wider">
          Revenue Contribution by Channel
        </p>
        <p className="mt-2 text-xs text-[#7D8782]">
          No attributed revenue data available for current filter selection.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#DCE2DE] rounded-lg p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <h3 className="text-sm font-semibold text-[#18201E]">
            Revenue Contribution by Channel
          </h3>
          <span className="text-xs text-[#56615D] font-medium">
            Model: <span className="text-[#18201E]">{ATTRIBUTION_MODEL_NAMES[attributionModel]}</span>
          </span>
        </div>
        <p className="text-xs text-[#56615D] mt-0.5">
          Sum of attributed channels reconciles to {formatCurrency(totalAttributedRevenue)}
        </p>
      </div>

      <div className="mt-4 w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
              stroke="#E4E8E5"
            />
            <XAxis
              type="number"
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              tick={{ fill: '#7D8782', fontSize: 11 }}
              axisLine={{ stroke: '#DCE2DE' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="channel"
              tick={{ fill: '#18201E', fontSize: 12, fontWeight: 500 }}
              axisLine={{ stroke: '#DCE2DE' }}
              tickLine={false}
              width={100}
            />
            <Tooltip content={customTooltip} cursor={{ fill: '#F0F2EE' }} />
            <Bar
              dataKey="attributedRevenue"
              radius={[0, 4, 4, 0]}
              barSize={18}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getChannelColor(entry.channel, index)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-[#E4E8E5] flex flex-wrap items-center justify-between text-[11px] text-[#56615D]">
        <span>Top channel: <strong className="text-[#18201E]">{data[0]?.channel || '—'}</strong> ({data[0]?.percentage || 0}%)</span>
        <span className="text-[#7D8782]">Deduplicated at conversion grain</span>
      </div>
    </div>
  );
};
