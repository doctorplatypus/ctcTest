import React from 'react';
import { KPIStats } from '../../types';
import { KpiCard } from './KpiCard';

interface KpiGridProps {
  kpis: KPIStats;
}

export const KpiGrid: React.FC<KpiGridProps> = ({ kpis }) => {
  const formattedRevenue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(kpis.totalRevenue);

  const revenueSecondary =
    kpis.totalConversions > 0
      ? `Across ${kpis.totalConversions} deduplicated conversion events`
      : 'No conversions recorded in filtered set';

  const conversionsSecondary =
    kpis.totalTouchpoints > 0
      ? `${kpis.conversionRate}% path conversion rate`
      : 'No journey data';

  const avgTouchesSecondary =
    kpis.convertingJourneysCount > 0
      ? `Calculated across ${kpis.convertingJourneysCount} converting paths`
      : 'Awaiting converting path data';

  const customersSecondary =
    kpis.uniqueCustomers > 0
      ? `Represented in ${kpis.totalTouchpoints} total touchpoints`
      : '0 customer records';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard
        id="kpi-total-revenue"
        label="Total Revenue"
        value={formattedRevenue}
        secondaryContext={revenueSecondary}
      />
      <KpiCard
        id="kpi-total-conversions"
        label="Total Conversions"
        value={kpis.totalConversions.toLocaleString()}
        secondaryContext={conversionsSecondary}
      />
      <KpiCard
        id="kpi-avg-touchpoints"
        label="Avg. Touchpoints"
        value={kpis.avgTouchpoints > 0 ? kpis.avgTouchpoints.toFixed(1) : '—'}
        secondaryContext={avgTouchesSecondary}
      />
      <KpiCard
        id="kpi-unique-customers"
        label="Unique Customers"
        value={kpis.uniqueCustomers.toLocaleString()}
        secondaryContext={customersSecondary}
      />
    </div>
  );
};
