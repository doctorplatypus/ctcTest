import { TouchpointRecord, KPIStats } from '../../types';

/**
 * Calculates deterministic dashboard KPIs from normalized touchpoints.
 * Strictly avoids double-counting revenue or conversions across multi-touch rows.
 */
export function calculateKPIs(records: TouchpointRecord[]): KPIStats {
  if (records.length === 0) {
    return {
      totalRevenue: 0,
      totalConversions: 0,
      avgTouchpoints: 0,
      uniqueCustomers: 0,
      totalTouchpoints: 0,
      convertingJourneysCount: 0,
      conversionRate: 0,
      avgConversionValue: 0,
    };
  }

  // 1. Group records by journey to understand journey-level outcomes
  const journeyMap = new Map<string, TouchpointRecord[]>();
  const customerSet = new Set<string>();

  records.forEach((record) => {
    customerSet.add(record.customerId);
    const existing = journeyMap.get(record.journeyId) || [];
    existing.push(record);
    journeyMap.set(record.journeyId, existing);
  });

  // 2. Track unique conversions and revenue at conversion grain
  // Deduplicate by conversionId if present, otherwise by journeyId
  const conversionMap = new Map<string, number>(); // key -> revenue
  const convertingJourneyIds = new Set<string>();

  journeyMap.forEach((touchpoints, journeyId) => {
    // Check if any touchpoint in this journey is marked converted or carries positive revenue
    const convertedTouchpoints = touchpoints.filter((t) => t.converted || t.revenue > 0);
    if (convertedTouchpoints.length > 0) {
      convertingJourneyIds.add(journeyId);

      convertedTouchpoints.forEach((tp) => {
        const convKey = tp.conversionId || journeyId;
        // Take the maximum recorded revenue for this conversion if multiple touchpoints cite it
        const currentVal = conversionMap.get(convKey) || 0;
        if (tp.revenue > currentVal) {
          conversionMap.set(convKey, tp.revenue);
        } else if (!conversionMap.has(convKey)) {
          conversionMap.set(convKey, tp.revenue);
        }
      });
    }
  });

  // Calculate deduplicated total revenue
  let totalRevenue = 0;
  conversionMap.forEach((rev) => {
    totalRevenue += rev;
  });

  const totalConversions = conversionMap.size;
  const convertingJourneysCount = convertingJourneyIds.size;

  // 3. Calculate Average Touchpoints in converting journeys
  let totalTouchesInConvertingJourneys = 0;
  convertingJourneyIds.forEach((journeyId) => {
    const touches = journeyMap.get(journeyId) || [];
    totalTouchesInConvertingJourneys += touches.length;
  });

  const avgTouchpoints =
    convertingJourneysCount > 0
      ? Number((totalTouchesInConvertingJourneys / convertingJourneysCount).toFixed(1))
      : 0;

  const uniqueCustomers = customerSet.size;
  const totalTouchpoints = records.length;

  const totalJourneys = journeyMap.size;
  const conversionRate =
    totalJourneys > 0
      ? Number(((convertingJourneysCount / totalJourneys) * 100).toFixed(1))
      : 0;

  const avgConversionValue =
    totalConversions > 0
      ? Math.round(totalRevenue / totalConversions)
      : 0;

  return {
    totalRevenue,
    totalConversions,
    avgTouchpoints,
    uniqueCustomers,
    totalTouchpoints,
    convertingJourneysCount,
    conversionRate,
    avgConversionValue,
  };
}
