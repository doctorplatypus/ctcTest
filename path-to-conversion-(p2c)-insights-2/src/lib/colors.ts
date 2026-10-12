/**
 * P2C Insights Color System & Design Tokens
 * Built around: Graphite (#18201E) + Deep Teal (#087F73) + Warm Neutral (#F6F7F4) + restrained Amber (#C87818)
 */

export const THEME_COLORS = {
  background: '#F6F7F4',
  surface: '#FFFFFF',
  surfaceSubtle: '#F0F2EE',

  textPrimary: '#18201E',
  textSecondary: '#56615D',
  textMuted: '#7D8782',
  textTable: '#35413D',

  border: '#DCE2DE',
  borderStrong: '#C8D0CB',
  borderHover: '#9BA8A1',
  borderSubtle: '#E4E8E5',

  primary: '#087F73',
  primaryHover: '#06695F',
  primaryActive: '#05554D',
  primarySubtle: '#E8F5F2',
  primaryFilterBorder: '#87C5BA',

  accent: '#C87818',
  accentSubtle: '#FFF5E5',

  success: '#38764A',
  successSubtle: '#EDF6EF',
  warning: '#A86612',
  warningSubtle: '#FFF6E8',
  error: '#B54848',
  errorSubtle: '#FDF0F0',

  chartGrid: '#E4E8E5',
  chartAxis: '#7D8782',
  chartAxisStrong: '#56615D',
  chartTitle: '#18201E',
  chartTooltipBg: '#18201E',
  chartTooltipText: '#FFFFFF',
  chartTooltipSecondary: '#CDD5D1',
};

/**
 * Categorical sequence for marketing channels (ordered & muted)
 */
export const CHANNEL_CATEGORICAL_PALETTE = [
  '#087F73', // Deep Teal
  '#3E63A3', // Slate Blue
  '#C87818', // Warm Amber
  '#745A9C', // Muted Violet
  '#B75D69', // Dusty Rose
  '#4F7B55', // Forest Green
  '#697B89', // Steel
];

/**
 * Fixed deterministic mapping for known channels to guarantee consistent
 * channel-color relationships across all charts and tables.
 */
const KNOWN_CHANNEL_COLORS: Record<string, string> = {
  'Organic Search': '#087F73', // Deep Teal
  'Paid Search': '#3E63A3',    // Slate Blue
  'Email': '#C87818',          // Warm Amber
  'Direct': '#745A9C',         // Muted Violet
  'Social': '#B75D69',         // Dusty Rose
  'Referral': '#4F7B55',       // Forest Green
  'Display': '#697B89',        // Steel
  'organic search': '#087F73',
  'paid search': '#3E63A3',
  'email': '#C87818',
  'direct': '#745A9C',
  'social': '#B75D69',
  'referral': '#4F7B55',
  'display': '#697B89',
};

/**
 * Returns a deterministic color for a given channel name.
 */
export function getChannelColor(channel: string, fallbackIndex: number = 0): string {
  if (KNOWN_CHANNEL_COLORS[channel]) {
    return KNOWN_CHANNEL_COLORS[channel];
  }
  // Deterministic hash based on channel name
  let hash = 0;
  for (let i = 0; i < channel.length; i++) {
    hash = (hash << 5) - hash + channel.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CHANNEL_CATEGORICAL_PALETTE.length;
  return CHANNEL_CATEGORICAL_PALETTE[index] || CHANNEL_CATEGORICAL_PALETTE[fallbackIndex % CHANNEL_CATEGORICAL_PALETTE.length];
}

/**
 * Sequential Teal scale for Touchpoint Sequence steps (low to high emphasis)
 */
export const SEQUENCE_STEP_PALETTE = [
  '#D9EFEB',
  '#B9E1DA',
  '#8ACCC1',
  '#55B4A7',
  '#299B8E',
  '#087F73',
  '#06695F',
];

/**
 * Returns sequential teal tone for a sequence step index (0-indexed or 1-indexed)
 */
export function getSequenceStepColor(index: number, totalSteps: number = 5): string {
  if (totalSteps <= 1) return SEQUENCE_STEP_PALETTE[5]; // '#087F73'
  // Map index across the sequential range
  const paletteIndex = Math.min(index, SEQUENCE_STEP_PALETTE.length - 1);
  return SEQUENCE_STEP_PALETTE[paletteIndex];
}
