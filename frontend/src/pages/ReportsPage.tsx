import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import Card, { CardHeader } from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import { deploymentHistory, buildHistory, testResults } from '@/api/mockData';
import { formatDate, formatRelative } from '@/utils/format';
import { FileBarChart, Rocket, Server, FlaskConical, CheckCircle2, XCircle, Clock } from 'lucide-react';

const testPieData = [
  { name: 'Passed', value: testResults.reduce((s, t) => s + t.passed, 0), color: '#10b981' },
  { name: 'Failed', value: testResults.reduce((s, t) => s + t.failed, 0), color: '#ef4444' },
  { name: 'Skipped', value: testResults.reduce((s, t) => s + t.skipped, 0), color: '#f59e0b' },
];

const buildBarData = buildHistory.slice(0, 6).map((b) => ({
  name: `#${b.buildNumber}`,
  passed: b.testsPassed,
  failed: b.testsFailed,
}));

export default function ReportsPage() {
  const totalTests = testResults.reduce((s, t) => s + t.total, 0);
  const totalPassed = testResults.reduce((s, t) => s + t.passed, 0);
  const totalFailed = testResults.reduce((s, t) => s + t.failed, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-success-500/10 text-success-600 dark:text-success-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalPassed}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tests Passed</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-error-500/10 text-error-600 dark:text-error-500">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalFailed}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tests Failed</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalTests}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Test Cases</p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test results pie */}
        <Card>
          <CardHeader title="Test Results Distribution" subtitle="Across all test suites" icon={<FlaskConical className="w-5 h-5" />} />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={testPieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                  {testPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Build test results bar */}
        <Card>
          <CardHeader title="Build Test Results" subtitle="Passed vs Failed per build" icon={<Server className="w-5 h-5" />} />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={buildBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="passed" fill="#10b981" name="Passed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" fill="#ef4444" name="Failed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Deployment history */}
      <Card>
        <CardHeader title="Deployment History" subtitle="All deployment events" icon={<Rocket className="w-5 h-5" />} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <th className="text-left font-medium px-5 py-3">Application</th>
                <th className="text-left font-medium px-5 py-3">Version</th>
                <th className="text-left font-medium px-5 py-3">Environment</th>
                <th className="text-left font-medium px-5 py-3">Date</th>
                <th className="text-left font-medium px-5 py-3">Duration</th>
                <th className="text-left font-medium px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {deploymentHistory.map((d) => (
                <tr key={d.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{d.app}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-mono">
                      {d.version}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{d.environment}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{formatDate(d.date)}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{d.duration}</span>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={d.status} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Build history + Test results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Build History" subtitle="Recent CI/CD builds" icon={<Server className="w-5 h-5" />} />
          <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
            {buildHistory.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Build #{b.buildNumber}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{b.pipeline} · {b.testsPassed} passed, {b.testsFailed} failed</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{formatRelative(b.date)}</span>
                  <StatusBadge status={b.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Test Results" subtitle="By test suite" icon={<FlaskConical className="w-5 h-5" />} />
          <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
            {testResults.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-mono text-gray-900 dark:text-gray-100">{t.suite}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.passed} passed · {t.failed} failed · {t.skipped} skipped · {t.duration}</p>
                </div>
                <StatusBadge status={t.status} size="sm" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
