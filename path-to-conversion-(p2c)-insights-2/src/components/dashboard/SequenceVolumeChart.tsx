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
import { SequencePerformance } from '../../types';
import { getSequenceStepColor } from '../../lib/colors';

interface SequenceVolumeChartProps {
  data: SequencePerformance[];
  totalTouchpoints: number;
}

export const SequenceVolumeChart: React.FC<SequenceVolumeChartProps> = ({
  data,
  totalTouchpoints,
}) => {
  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: SequencePerformance = payload[0].payload;
      return (
        <div className="bg-[#18201E] text-[#FFFFFF] border border-[#18201E] p-3 rounded-lg shadow-md text-xs space-y-1">
          <p className="font-semibold text-[#FFFFFF]">{item.stepLabel}</p>
          <p className="text-[#8ACCC1] font-semibold tabular-nums text-sm">
            {item.touchpointCount.toLocaleString()} touchpoints
          </p>
          <div className="text-[#CDD5D1] space-y-0.5 pt-1 border-t border-[#35413D]">
            <p>{item.convertingCount} converting touchpoints</p>
            {item.dropOffRate !== undefined && (
              <p className="text-[#C87818]">
                {item.dropOffRate}% drop-off from previous step
              </p>
            )}
            <p className="text-[11px] text-[#CDD5D1]/80">
              {totalTouchpoints > 0
                ? `${((item.touchpointCount / totalTouchpoints) * 100).toFixed(1)}% of all touchpoints`
                : ''}
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
          Touchpoint Volume by Sequence Step
        </p>
        <p className="mt-2 text-xs text-[#7D8782]">
          No sequence data available for current filter selection.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#DCE2DE] rounded-lg p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <h3 className="text-sm font-semibold text-[#18201E]">
            Touchpoint Volume by Sequence Step
          </h3>
          <span className="text-xs text-[#56615D]">
            Numeric sequence: Step 1 ➔ Step {data[data.length - 1]?.sequenceStep || 1}
          </span>
        </div>
        <p className="text-xs text-[#56615D] mt-0.5">
          Distribution of interactions across customer journey progression
        </p>
      </div>

      <div className="mt-4 w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
              stroke="#E4E8E5"
            />
            <XAxis
              dataKey="stepLabel"
              tick={{ fill: '#18201E', fontSize: 11 }}
              axisLine={{ stroke: '#DCE2DE' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#7D8782', fontSize: 11 }}
              axisLine={{ stroke: '#DCE2DE' }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={customTooltip} cursor={{ fill: '#F0F2EE' }} />
            <Bar
              dataKey="touchpointCount"
              radius={[4, 4, 0, 0]}
              barSize={32}
            >
              {data.map((_, index) => (
                <Cell
                  key={`seq-cell-${index}`}
                  fill={getSequenceStepColor(index, data.length)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-[#E4E8E5] flex flex-wrap items-center justify-between text-[11px] text-[#56615D]">
        <span>Initial awareness: <strong className="text-[#18201E]">{data[0]?.touchpointCount || 0} touches</strong> at Step 1</span>
        <span className="text-[#7D8782]">Strict numeric sequence ordering</span>
      </div>
    </div>
  );
};
