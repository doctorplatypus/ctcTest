import { TouchpointRecord, AttributionModelType, ChannelPerformance } from '../../types';

/**
 * Attribution Engine.
 * Reconciles revenue attribution across marketing channels based on specified model.
 * Sum of all channel revenues reconciles exactly to total attributed conversion revenue.
 */
export function calculateChannelAttribution(
  records: TouchpointRecord[],
  model: AttributionModelType = 'linear'
): ChannelPerformance[] {
  if (records.length === 0) {
    return [];
  }

  // 1. Group records by journey and sort by sequenceStep or timestamp
  const journeyMap = new Map<string, TouchpointRecord[]>();
  const channelTotals = new Map<
    string,
    {
      attributedRevenue: number;
      touchpointCount: number;
      convertingTouchpoints: number;
      firstTouchCount: number;
      lastTouchCount: number;
      assistingCount: number;
    }
  >();

  // Ensure all channels present in the data are initialized
  records.forEach((record) => {
    const ch = record.channel || 'Unknown';
    if (!channelTotals.has(ch)) {
      channelTotals.set(ch, {
        attributedRevenue: 0,
        touchpointCount: 0,
        convertingTouchpoints: 0,
        firstTouchCount: 0,
        lastTouchCount: 0,
        assistingCount: 0,
      });
    }
    const stat = channelTotals.get(ch)!;
    stat.touchpointCount += 1;

    const journeyTouches = journeyMap.get(record.journeyId) || [];
    journeyTouches.push(record);
    journeyMap.set(record.journeyId, journeyTouches);
  });

  // 2. Process each journey's conversion and apply selected attribution model
  let totalAttributedRevenue = 0;

  journeyMap.forEach((touches) => {
    // Sort chronologically by sequence step or timestamp
    touches.sort((a, b) => {
      if (a.sequenceStep !== b.sequenceStep) {
        return a.sequenceStep - b.sequenceStep;
      }
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    const isConvertingJourney = touches.some((t) => t.converted);
    const firstTouch = touches[0];
    const lastTouch = touches[touches.length - 1];

    // Track First / Last / Assist touchpoint positions
    if (firstTouch) {
      const ftStat = channelTotals.get(firstTouch.channel);
      if (ftStat) ftStat.firstTouchCount += 1;
    }

    if (touches.length > 1 && lastTouch) {
      const ltStat = channelTotals.get(lastTouch.channel);
      if (ltStat) ltStat.lastTouchCount += 1;
    }

    // Assisting touches are those between first and last (or non-last in multi-touch)
    if (touches.length > 2) {
      for (let i = 1; i < touches.length - 1; i++) {
        const midStat = channelTotals.get(touches[i].channel);
        if (midStat) midStat.assistingCount += 1;
      }
    }

    // Only attributing revenue for converting journeys
    if (!isConvertingJourney) {
      return;
    }

    // Determine journey conversion revenue (deduplicated)
    const convertedRows = touches.filter((t) => t.converted);
    const journeyRevenue = Math.max(...convertedRows.map((t) => t.revenue), 0);

    if (journeyRevenue <= 0) {
      return;
    }

    totalAttributedRevenue += journeyRevenue;

    // Apply attribution weights
    const n = touches.length;

    touches.forEach((touch, index) => {
      let weight = 0;

      switch (model) {
        case 'first_touch':
          weight = index === 0 ? 1 : 0;
          break;

        case 'last_touch':
          weight = index === n - 1 ? 1 : 0;
          break;

        case 'position_based':
          // U-Shaped (40% first, 40% last, 20% split among middle)
          if (n === 1) {
            weight = 1;
          } else if (n === 2) {
            weight = 0.5;
          } else {
            if (index === 0 || index === n - 1) {
              weight = 0.4;
            } else {
              weight = 0.2 / (n - 2);
            }
          }
          break;

        case 'linear':
        default:
          weight = 1 / n;
          break;
      }

      const assignedRevenue = journeyRevenue * weight;
      const chStat = channelTotals.get(touch.channel);
      if (chStat) {
        chStat.attributedRevenue += assignedRevenue;
        chStat.convertingTouchpoints += 1;
      }
    });
  });

  // 3. Compile sorted output with percentage contribution
  const result: ChannelPerformance[] = [];

  channelTotals.forEach((data, channel) => {
    const percentage =
      totalAttributedRevenue > 0
        ? Number(((data.attributedRevenue / totalAttributedRevenue) * 100).toFixed(1))
        : 0;

    result.push({
      channel,
      attributedRevenue: Math.round(data.attributedRevenue),
      percentage,
      touchpointCount: data.touchpointCount,
      convertingTouchpoints: data.convertingTouchpoints,
      firstTouchCount: data.firstTouchCount,
      lastTouchCount: data.lastTouchCount,
      assistingCount: data.assistingCount,
    });
  });

  // Sort descending by attributed revenue
  return result.sort((a, b) => b.attributedRevenue - a.attributedRevenue);
}
