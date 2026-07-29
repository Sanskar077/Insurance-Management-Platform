import { useCallback, useEffect, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  getClaimStatistics,
  getCustomerGrowth,
  getDashboardSummary,
  getPolicyStatistics,
  getPremiumCollection,
} from '@services/report.service';
import type {
  ClaimStatisticsReport,
  CustomerGrowthReport,
  DashboardSummary,
  PolicyStatisticsReport,
  PremiumCollectionReport,
} from '@app-types/report.types';
import { Spinner } from '@components/ui/Spinner';
import { ErrorState } from '@components/ui/ErrorState';
import { ApiError } from '@lib/apiClient';
import { ChartCard, KpiCard } from './ReportCards';
import {
  SERIES,
  STATUS_COLORS,
  formatCompactMoney,
  formatMoney,
  formatMonthLabel,
  gridDefaults,
  tooltipDefaults,
} from './chartTheme';

const MONTH_OPTIONS = [6, 12, 24] as const;

interface ReportsData {
  summary: DashboardSummary;
  growth: CustomerGrowthReport;
  premiums: PremiumCollectionReport;
  policyStats: PolicyStatisticsReport;
  claimStats: ClaimStatisticsReport;
}

export function DashboardPage() {
  const [months, setMonths] = useState<number>(12);
  const [data, setData] = useState<ReportsData | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [summary, growth, premiums, policyStats, claimStats] = await Promise.all([
        getDashboardSummary(),
        getCustomerGrowth(months),
        getPremiumCollection(months),
        getPolicyStatistics(),
        getClaimStatistics(months),
      ]);
      setData({ summary, growth, premiums, policyStats, claimStats });
      setStatus('idle');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load reports');
      setStatus('error');
    }
  }, [months]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink-900)]">
            Reports Dashboard
          </h1>
          <p className="text-sm text-[var(--color-slate-500)]">
            Live business overview — computed from current records, nothing stored.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="report-range"
            className="text-sm font-medium text-[var(--color-slate-600)]"
          >
            Range
          </label>
          <select
            id="report-range"
            value={months}
            onChange={(event) => setMonths(Number(event.target.value))}
            className="rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm text-[var(--color-ink-900)] outline-none transition-colors focus:border-[var(--color-ink-700)] focus:ring-2 focus:ring-[var(--color-ink-700)]/15"
          >
            {MONTH_OPTIONS.map((option) => (
              <option key={option} value={option}>
                Last {option} months
              </option>
            ))}
          </select>
        </div>
      </div>

      {status === 'loading' && <Spinner label="Crunching the numbers…" />}
      {status === 'error' && <ErrorState message={errorMessage} onRetry={load} />}

      {status === 'idle' && data && (
        <>
          <KpiGrid summary={data.summary} />
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CustomerGrowthChart report={data.growth} />
            <PremiumCollectionChart report={data.premiums} />
            <PolicyStatusChart report={data.policyStats} />
            <PolicyTypeChart report={data.policyStats} />
            <ClaimStatusChart report={data.claimStats} />
            <ClaimTrendChart report={data.claimStats} />
          </div>
        </>
      )}
    </div>
  );
}

function KpiGrid({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Customers"
        value={summary.customers.total.toLocaleString()}
        hint={`+${summary.customers.newThisMonth.toLocaleString()} this month`}
      />
      <KpiCard
        label="Active policies"
        value={summary.policies.active.toLocaleString()}
        hint={`${summary.policies.total.toLocaleString()} total · ${summary.policies.expiringInThirtyDays.toLocaleString()} expiring in 30 days`}
        accent="success"
      />
      <KpiCard
        label="Premiums collected"
        value={formatCompactMoney(summary.premiums.totalCollected)}
        hint={`${formatCompactMoney(summary.premiums.pendingAmount)} pending`}
      />
      <KpiCard
        label="Overdue premiums"
        value={summary.premiums.overdueCount.toLocaleString()}
        hint={`${formatCompactMoney(summary.premiums.overdueAmount)} outstanding`}
        accent={summary.premiums.overdueCount > 0 ? 'danger' : 'success'}
      />
      <KpiCard
        label="Total claims"
        value={summary.claims.total.toLocaleString()}
        hint={`${formatCompactMoney(summary.claims.approvedAmount)} approved`}
      />
      <KpiCard
        label="Open claims"
        value={summary.claims.open.toLocaleString()}
        hint="Submitted or under review"
        accent={summary.claims.open > 0 ? 'warning' : 'success'}
      />
      <KpiCard
        label="Policies expiring soon"
        value={summary.policies.expiringInThirtyDays.toLocaleString()}
        hint="Active, ending within 30 days"
        accent={summary.policies.expiringInThirtyDays > 0 ? 'warning' : 'success'}
      />
      <KpiCard label="Documents" value={summary.documents.total.toLocaleString()} hint="On file" />
    </div>
  );
}

function CustomerGrowthChart({ report }: { report: CustomerGrowthReport }) {
  const labels = report.series.map((point) => formatMonthLabel(point.month));
  return (
    <ChartCard title="Customer Growth" subtitle="New customer registrations per month">
      <Line
        data={{
          labels,
          datasets: [
            {
              label: 'New customers',
              data: report.series.map((point) => point.count),
              borderColor: SERIES.primary,
              backgroundColor: SERIES.primaryWash,
              pointBackgroundColor: SERIES.primary,
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 4,
              borderWidth: 2,
              tension: 0.3,
              fill: true,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: tooltipDefaults },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, ticks: { precision: 0 }, grid: gridDefaults },
          },
        }}
      />
    </ChartCard>
  );
}

function PremiumCollectionChart({ report }: { report: PremiumCollectionReport }) {
  const labels = report.due.map((point) => formatMonthLabel(point.month));
  return (
    <ChartCard title="Premium Collection" subtitle="Amount due vs collected per month">
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: 'Collected',
              data: report.collected.map((point) => point.amount),
              backgroundColor: SERIES.primary,
              borderRadius: 4,
              maxBarThickness: 24,
            },
            {
              label: 'Due',
              data: report.due.map((point) => point.amount),
              backgroundColor: SERIES.secondary,
              borderRadius: 4,
              maxBarThickness: 24,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10 } },
            tooltip: {
              ...tooltipDefaults,
              callbacks: {
                label: (context) => `${context.dataset.label}: ${formatMoney(context.parsed.y)}`,
              },
            },
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              grid: gridDefaults,
              ticks: { callback: (value) => formatCompactMoney(Number(value)) },
            },
          },
        }}
      />
    </ChartCard>
  );
}

function PolicyStatusChart({ report }: { report: PolicyStatisticsReport }) {
  return (
    <ChartCard title="Policy Statistics" subtitle="Policies by lifecycle status">
      <Doughnut
        data={{
          labels: report.byStatus.map((row) => row.status.replace(/_/g, ' ')),
          datasets: [
            {
              data: report.byStatus.map((row) => row.count),
              backgroundColor: report.byStatus.map(
                (row) => STATUS_COLORS[row.status] ?? SERIES.primary,
              ),
              borderColor: '#ffffff',
              borderWidth: 2,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: '60%',
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10 } },
            tooltip: tooltipDefaults,
          },
        }}
      />
    </ChartCard>
  );
}

function PolicyTypeChart({ report }: { report: PolicyStatisticsReport }) {
  return (
    <ChartCard title="Policies by Type" subtitle="Distribution across product lines">
      <Bar
        data={{
          labels: report.byType.map((row) => row.type),
          datasets: [
            {
              label: 'Policies',
              data: report.byType.map((row) => row.count),
              backgroundColor: SERIES.primary,
              borderRadius: 4,
              maxBarThickness: 24,
            },
          ],
        }}
        options={{
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: tooltipDefaults },
          scales: {
            x: { beginAtZero: true, ticks: { precision: 0 }, grid: gridDefaults },
            y: { grid: { display: false } },
          },
        }}
      />
    </ChartCard>
  );
}

function ClaimStatusChart({ report }: { report: ClaimStatisticsReport }) {
  return (
    <ChartCard
      title="Claim Statistics"
      subtitle={`Claims by workflow status · ${formatCompactMoney(report.totalApprovedAmount)} approved of ${formatCompactMoney(report.totalClaimedAmount)} claimed`}
    >
      <Doughnut
        data={{
          labels: report.byStatus.map((row) => row.status.replace(/_/g, ' ')),
          datasets: [
            {
              data: report.byStatus.map((row) => row.count),
              backgroundColor: report.byStatus.map(
                (row) => STATUS_COLORS[row.status] ?? SERIES.primary,
              ),
              borderColor: '#ffffff',
              borderWidth: 2,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: '60%',
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10 } },
            tooltip: tooltipDefaults,
          },
        }}
      />
    </ChartCard>
  );
}

function ClaimTrendChart({ report }: { report: ClaimStatisticsReport }) {
  const labels = report.monthlySubmissions.map((point) => formatMonthLabel(point.month));
  return (
    <ChartCard title="Claim Submissions" subtitle="Claims filed per month">
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: 'Claims',
              data: report.monthlySubmissions.map((point) => point.count),
              backgroundColor: SERIES.primary,
              borderRadius: 4,
              maxBarThickness: 24,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: tooltipDefaults },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, ticks: { precision: 0 }, grid: gridDefaults },
          },
        }}
      />
    </ChartCard>
  );
}
