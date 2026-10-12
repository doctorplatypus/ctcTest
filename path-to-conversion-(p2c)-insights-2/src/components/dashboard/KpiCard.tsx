import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  secondaryContext?: string;
  id?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  secondaryContext,
  id,
}) => {
  return (
    <div
      id={id}
      className="bg-[#FFFFFF] border border-[#DCE2DE] rounded-lg p-4 sm:p-5 shadow-xs flex flex-col justify-between transition-colors hover:border-[#C8D0CB]"
    >
      <div>
        <p className="text-[11px] font-semibold tracking-wider text-[#56615D] uppercase select-none">
          {label}
        </p>
        <p className="mt-1.5 text-2xl sm:text-3xl font-semibold text-[#18201E] tabular-nums tracking-tight">
          {value}
        </p>
      </div>

      {secondaryContext && (
        <p className="mt-2 text-xs text-[#7D8782] leading-normal">
          {secondaryContext}
        </p>
      )}
    </div>
  );
};
