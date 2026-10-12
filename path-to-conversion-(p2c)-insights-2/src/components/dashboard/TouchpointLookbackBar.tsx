import React from 'react';

interface TouchpointLookbackBarProps {
  value: number | null; // null means 'All'
  onChange: (newValue: number | null) => void;
  className?: string;
}

export const TouchpointLookbackBar: React.FC<TouchpointLookbackBarProps> = ({
  value,
  onChange,
  className = '',
}) => {
  // Slider maps: 1 to 10 = specific touchpoint counts, 11 = All (Full path, default)
  const sliderValue = value === null ? 11 : value;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (val === 11) {
      onChange(null); // 'All'
    } else {
      onChange(val);
    }
  };

  const isRecommended = value === null;

  return (
    <div id="touchpoint-lookback-bar" className={`w-full ${className}`}>
      {/* Top Header Row: Title on Left, Value + Recommended Pill on Right */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#4B5563] tracking-wider uppercase select-none">
          TOUCHPOINT LOOKBACK
        </span>
        <div className="flex items-center gap-2 select-none">
          <span className="font-mono text-sm font-semibold text-[#111827]">
            {value === null ? 'All' : value}
          </span>
          {isRecommended ? (
            <span className="px-2 py-0.5 text-xs font-medium text-[#166534] bg-[#F0FDF4] border border-[#BBF7D0] rounded">
              Recommended
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="px-2 py-0.5 text-xs font-medium text-[#06695F] bg-[#E8F5F2] border border-[#87C5BA] rounded hover:bg-[#DDF0EC] transition cursor-pointer flex items-center gap-1"
              title="Click to reset to Recommended (All)"
            >
              <span>{value === 1 ? 'Last Touch' : `${value} Touches`}</span>
              <span className="text-[10px] text-[#087F73] font-normal underline ml-0.5">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Middle Row: Slider Bar */}
      <div className="relative py-1.5 flex items-center">
        <input
          type="range"
          min="1"
          max="11"
          step="1"
          value={sliderValue}
          onChange={handleChange}
          className="lookback-slider"
          aria-label="Touchpoint Lookback Slider"
        />
      </div>

      {/* Bottom Row: Explanatory Subtitle */}
      <p className="text-xs text-[#6B7280] mt-1 leading-relaxed select-none">
        Multi-touch attribution models are optimized for the default lookback of All touchpoints. Change this only to evaluate the immediate pre-conversion window.
      </p>
    </div>
  );
};
