import {
  TouchpointRecord,
  SequencePerformance,
  JourneyPathSummary,
  FilterState,
} from '../../types';

/**
 * Calculates touchpoint volume by sequence position.
 * Strictly guarantees numeric ordering (1, 2, 3, 4, 5...) and never lexicographical (1, 10, 2).
 */
export function calculateSequenceVolume(records: TouchpointRecord[]): SequencePerformance[] {
  if (records.length === 0) {
    return [];
  }

  const stepMap = new Map<number, { touchpointCount: number; convertingCount: number }>();

  records.forEach((record) => {
    const step = Number(record.sequenceStep) || 1;
    const current = stepMap.get(step) || { touchpointCount: 0, convertingCount: 0 };
    current.touchpointCount += 1;
    if (record.converted) {
      current.convertingCount += 1;
    }
    stepMap.set(step, current);
  });

  // Extract unique numeric steps and sort strictly numerically in ascending order
  const sortedSteps = Array.from(stepMap.keys()).sort((a, b) => a - b);

  const result: SequencePerformance[] = [];
  let previousCount: number | null = null;

  sortedSteps.forEach((step) => {
    const data = stepMap.get(step)!;
    let dropOffRate: number | undefined = undefined;

    if (previousCount !== null && previousCount > 0) {
      const drop = ((previousCount - data.touchpointCount) / previousCount) * 100;
      dropOffRate = Number(Math.max(0, drop).toFixed(1));
    }

    result.push({
      sequenceStep: step,
      stepLabel: `Step ${step}`,
      touchpointCount: data.touchpointCount,
      convertingCount: data.convertingCount,
      dropOffRate,
    });

    previousCount = data.touchpointCount;
  });

  return result;
}

/**
 * Aggregates top conversion paths by sequence pattern.
 */
export function calculateTopConversionPaths(records: TouchpointRecord[]): JourneyPathSummary[] {
  if (records.length === 0) {
    return [];
  }

  // Group by journey
  const journeyMap = new Map<string, TouchpointRecord[]>();

  records.forEach((record) => {
    const list = journeyMap.get(record.journeyId) || [];
    list.push(record);
    journeyMap.set(record.journeyId, list);
  });

  const pathAgg = new Map<
    string,
    {
      steps: string[];
      conversions: number;
      totalRevenue: number;
      totalTouches: number;
      totalDurationDays: number;
    }
  >();

  journeyMap.forEach((touches, journeyId) => {
    // Only analyze paths that converted
    const hasConverted = touches.some((t) => t.converted);
    if (!hasConverted) return;

    // Sort by sequenceStep or timestamp
    touches.sort((a, b) => a.sequenceStep - b.sequenceStep);

    const steps = touches.map((t) => t.channel);
    const pathKey = steps.join(' → ');

    const convertedRows = touches.filter((t) => t.converted);
    const rev = Math.max(...convertedRows.map((t) => t.revenue), 0);

    // Calculate days between first and last touch
    const firstTime = new Date(touches[0].timestamp).getTime();
    const lastTime = new Date(touches[touches.length - 1].timestamp).getTime();
    const days = Math.max(1, Math.round((lastTime - firstTime) / (1000 * 60 * 60 * 24)));

    if (!pathAgg.has(pathKey)) {
      pathAgg.set(pathKey, {
        steps,
        conversions: 0,
        totalRevenue: 0,
        totalTouches: 0,
        totalDurationDays: 0,
      });
    }

    const current = pathAgg.get(pathKey)!;
    current.conversions += 1;
    current.totalRevenue += rev;
    current.totalTouches += touches.length;
    current.totalDurationDays += days;
  });

  const result: JourneyPathSummary[] = [];

  pathAgg.forEach((data, pathKey) => {
    result.push({
      pathKey,
      steps: data.steps,
      conversions: data.conversions,
      totalRevenue: data.totalRevenue,
      avgTouchpoints: Number((data.totalTouches / data.conversions).toFixed(1)),
      avgDaysToConvert: Math.round(data.totalDurationDays / data.conversions),
    });
  });

  // Sort by conversions descending, then revenue
  return result.sort((a, b) => b.conversions - a.conversions || b.totalRevenue - a.totalRevenue);
}

/**
 * Filter touchpoints based on active user filter selections.
 */
export function applyFilters(records: TouchpointRecord[], filters: FilterState): TouchpointRecord[] {
  // 1. Channel, status, and search filters
  const baseFiltered = records.filter((r) => {
    // Channel filter
    if (filters.channel !== 'all' && r.channel !== filters.channel) {
      return false;
    }

    // Conversion status filter
    if (filters.conversionStatus === 'converted' && !r.converted) {
      return false;
    }
    if (filters.conversionStatus === 'in_flight' && r.converted) {
      return false;
    }

    // Search query filter
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const matchCustomer = r.customerId.toLowerCase().includes(q) || (r.customerName && r.customerName.toLowerCase().includes(q));
      const matchChannel = r.channel.toLowerCase().includes(q);
      const matchJourney = r.journeyId.toLowerCase().includes(q);
      const matchCampaign = r.campaign ? r.campaign.toLowerCase().includes(q) : false;
      const matchType = r.type ? r.type.toLowerCase().includes(q) : false;

      if (!matchCustomer && !matchChannel && !matchJourney && !matchCampaign && !matchType) {
        return false;
      }
    }

    return true;
  });

  // 2. Touchpoint Lookback Window Filter
  // If lookbackTouchpoints is set (e.g., last 3 touches), keep only the final N touchpoints of each journey
  if (filters.lookbackTouchpoints !== null && filters.lookbackTouchpoints !== undefined && filters.lookbackTouchpoints > 0) {
    const lookbackLimit = filters.lookbackTouchpoints;
    const journeyMap = new Map<string, TouchpointRecord[]>();

    baseFiltered.forEach((r) => {
      const list = journeyMap.get(r.journeyId) || [];
      list.push(r);
      journeyMap.set(r.journeyId, list);
    });

    const windowedRecords: TouchpointRecord[] = [];

    journeyMap.forEach((touches) => {
      // Sort touchpoints chronologically in sequence
      touches.sort((a, b) => {
        if (a.sequenceStep !== b.sequenceStep) {
          return a.sequenceStep - b.sequenceStep;
        }
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });

      // Retain only the trailing N touchpoints (lookback window leading up to conversion or most recent state)
      const sliced = touches.slice(-lookbackLimit);
      windowedRecords.push(...sliced);
    });

    return windowedRecords;
  }

  return baseFiltered;
}
