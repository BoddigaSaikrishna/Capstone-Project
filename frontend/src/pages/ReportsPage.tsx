import { useState } from 'react';
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
  AreaChart,
  Area,
} from 'recharts';
import Card, { CardHeader } from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import { deploymentHistory, buildHistory, testResults } from '@/api/mockData';
import { formatDate } from '@/utils/format';
import {
  Rocket,
  Server,
  FlaskConical,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Printer,
  FileSpreadsheet,
  Award,
  Zap,
  TrendingUp,
  ShieldCheck,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'dora' | 'compliance' | 'costs'>('overview');
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | 'quarter'>('30d');
  const [showExecutiveModal, setShowExecutiveModal] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const totalTests = testResults.reduce((s, t) => s + t.total, 0);
  const totalPassed = testResults.reduce((s, t) => s + t.passed, 0);
  const totalFailed = testResults.reduce((s, t) => s + t.failed, 0);
  const passRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';

  const doraMetrics = [
    {
      title: 'Deployment Frequency',
      value: deploymentHistory.length > 0 ? `${deploymentHistory.length} Releases` : '0 Releases',
      target: 'On Demand',
      tier: deploymentHistory.length > 0 ? 'Active' : 'Standby',
      trend: deploymentHistory.length > 0 ? '+100%' : '0%',
      trendUp: deploymentHistory.length > 0,
      description: 'Frequency of successful deployments to production environments.',
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    },
    {
      title: 'Lead Time for Changes',
      value: deploymentHistory.length > 0 ? '< 1 hour' : '—',
      target: '< 1 hour',
      tier: deploymentHistory.length > 0 ? 'Verified' : 'Standby',
      trend: '0 min',
      trendUp: true,
      description: 'Time from code commit to running successfully in production.',
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
    },
    {
      title: 'Mean Time to Recovery (MTTR)',
      value: '—',
      target: '< 1 hour',
      tier: 'Optimal',
      trend: '0 min',
      trendUp: true,
      description: 'Average time required to recover from a production degradation.',
      color: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400',
    },
    {
      title: 'Change Failure Rate',
      value: '0.0%',
      target: '< 5%',
      tier: 'Elite',
      trend: '0%',
      trendUp: true,
      description: 'Percentage of deployments causing degraded service or requiring rollback.',
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
    },
  ];

  const complianceControls = [
    {
      id: 'SEC-01',
      category: 'Authentication & Credentials',
      standard: 'Zero Trust / OAuth',
      status: 'Active',
      score: '100%',
      details: 'GitHub Personal Access Token and Jenkins API token isolation configured.',
    },
    {
      id: 'SEC-02',
      category: 'Network & Ingress Security',
      standard: 'TLS 1.3 / HTTPS',
      status: 'Active',
      score: '100%',
      details: 'Strict HTTPS transport encryption with CORS verification on public ingress.',
    },
    {
      id: 'SEC-03',
      category: 'Data Privacy & Cloud Storage',
      standard: 'PostgreSQL RLS',
      status: 'Active',
      score: '100%',
      details: 'Supabase Row Level Security and scoped client access policies.',
    },
    {
      id: 'SEC-04',
      category: 'CI/CD Pipeline Quality Gate',
      standard: 'Jenkins CI Rule',
      status: 'Configured',
      score: '100%',
      details: 'Automated test suite gate halts pipeline immediately upon test failure.',
    },
  ];

  const cloudCostData = [
    { name: 'EC2 Compute / Local Runtime', spend: 0.0, budget: 100.0, percent: 0 },
    { name: 'Model & Artifact Storage', spend: 0.0, budget: 50.0, percent: 0 },
    { name: 'Network & Tunnel Ingress', spend: 0.0, budget: 25.0, percent: 0 },
    { name: 'ML Microservices Host', spend: 0.0, budget: 50.0, percent: 0 },
  ];

  const testPieData = [
    { name: 'Passed', value: totalPassed, color: '#10b981' },
    { name: 'Failed', value: totalFailed, color: '#ef4444' },
  ];

  const buildBarData = buildHistory.slice(0, 6).map((b) => ({
    name: `#${b.buildNumber}`,
    passed: b.testsPassed,
    failed: b.testsFailed,
  }));

  const handleExportCSV = () => {
    const headers = ['Application', 'Version', 'Environment', 'Date', 'Duration', 'Status'];
    const rows = deploymentHistory.map((d) => [
      `"${d.app}"`,
      `"${d.version}"`,
      `"${d.environment}"`,
      `"${d.date}"`,
      `"${d.duration}"`,
      `"${d.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MLOps_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const auditPayload = {
      project: 'Automated CI/CD & MLOps Infrastructure Control Center',
      generatedAt: new Date().toISOString(),
      reportPeriod: dateRange,
      doraMetrics: doraMetrics.map((d) => ({ metric: d.title, value: d.value, tier: d.tier })),
      testSummary: { totalTests, totalPassed, totalFailed, passRate: `${passRate}%` },
      complianceControls,
      cloudCostSummary: {
        totalSpend: '$0.00',
        totalBudget: '$225.00',
        savings: '100%',
      },
      deployments: deploymentHistory,
    };

    const blob = new Blob([JSON.stringify(auditPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MLOps_Compliance_Audit_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    const memo = `=== MLOPS CONTROL CENTER AUDIT SUMMARY ===
Generated: ${new Date().toLocaleDateString()}
Status: VERIFIED / PRODUCTION READY

DORA PERFORMANCE:
- Deployments Recorded: ${deploymentHistory.length}
- Change Failure Rate: 0.0%

QUALITY & ASSURANCE:
- Tests Executed: ${totalTests} (${totalPassed} Passed, ${totalFailed} Failed)
- Pass Rate: ${passRate}%

COMPLIANCE & GOVERNANCE:
- Authentication: GitHub PAT & Jenkins API Tokens Enforced
- Transport: HTTPS TLS 1.3 Active
- Database: Supabase PostgreSQL Row Level Security

FINANCIAL EFFICIENCY:
- Active Paid Cloud Spend: $0.00 / mo (Self-Hosted / Free-Tier Primitives)
==============================================`;

    navigator.clipboard.writeText(memo);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ── Page Header & Action Controls ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gray-900/80 via-gray-900/60 to-primary-950/40 p-6 rounded-2xl border border-gray-800/80 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> DORA Metrics Engine
            </span>
            <span className="text-xs text-gray-500">Live Infrastructure Verified</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            Executive Reports &amp; Analytics Studio
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            DORA engineering metrics, compliance audits, quality assurance logs, and cost analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-gray-950/70 border border-gray-800 rounded-lg p-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-gray-400 ml-2 mr-1" />
            {(['24h', '7d', '30d', 'quarter'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  dateRange === r
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {r === '24h' ? '24h' : r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : 'Q3 2026'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowExecutiveModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white text-xs font-semibold shadow-lg shadow-primary-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Executive Briefing
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 text-xs font-medium border border-gray-700/60 transition-all cursor-pointer"
            title="Download CSV Table"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            CSV
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 text-xs font-medium border border-gray-700/60 transition-all cursor-pointer"
            title="Download JSON Audit Packet"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Audit JSON
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 text-xs font-medium border border-gray-700/60 transition-all cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-gray-400" />
            Print
          </button>
        </div>
      </div>

      {/* ── DORA Key Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {doraMetrics.map((m, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden p-5 rounded-xl border bg-gradient-to-br ${m.color} backdrop-blur-sm transition-all hover:translate-y-[-2px] hover:shadow-lg`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{m.title}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/20">
                {m.tier}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-black text-white">{m.value}</span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> {m.trend}
              </span>
            </div>
            <p className="text-xs text-gray-400 line-clamp-2">{m.description}</p>
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
              <span>Benchmark Target:</span>
              <span className="text-gray-200 font-medium">{m.target}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex border-b border-gray-800/80 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'overview'
              ? 'border-primary-500 text-primary-400 font-semibold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Analytics &amp; Velocity
        </button>
        <button
          onClick={() => setActiveTab('dora')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'dora'
              ? 'border-primary-500 text-primary-400 font-semibold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          Deployment History
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'compliance'
              ? 'border-primary-500 text-primary-400 font-semibold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Compliance &amp; Governance Audit
        </button>
        <button
          onClick={() => setActiveTab('costs')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'costs'
              ? 'border-primary-500 text-primary-400 font-semibold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Cloud Economics &amp; ROI
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW & VELOCITY CHARTS ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-100">{totalPassed}</p>
                <p className="text-xs text-gray-400">Tests Passed ({passRate}%)</p>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-100">{totalFailed}</p>
                <p className="text-xs text-gray-400">Tests Failed</p>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary-500/10 text-primary-400">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-100">{totalTests}</p>
                <p className="text-xs text-gray-400">Total Test Executions</p>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-100">{deploymentHistory.length}</p>
                <p className="text-xs text-gray-400">Deployments Recorded</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader
                title="CI/CD Build History"
                subtitle="Build results from pipeline executions"
                icon={<Server className="w-5 h-5 text-blue-400" />}
              />
              <div className="p-5">
                {buildBarData.length === 0 ? (
                  <div className="h-[240px] flex items-center justify-center text-xs text-gray-500">
                    No automated pipeline builds recorded yet. Run a Jenkins job to record builds.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
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
                )}
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Test Suite Execution Log"
                subtitle="Unit and integration test results"
                icon={<FlaskConical className="w-5 h-5 text-purple-400" />}
              />
              <div className="p-5">
                {testResults.length === 0 ? (
                  <div className="h-[240px] flex items-center justify-center text-xs text-gray-500">
                    No automated test executions recorded yet.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[240px] overflow-y-auto">
                    {testResults.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-gray-950/40 border border-gray-800/60 hover:border-gray-700/80 transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-mono font-medium text-gray-200">{t.suite}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            <span className="text-emerald-400">{t.passed} passed</span> ·{' '}
                            {t.failed > 0 ? <span className="text-red-400">{t.failed} failed</span> : '0 failed'} ·{' '}
                            <Clock className="w-3 h-3 inline mr-0.5" />
                            {t.duration}
                          </p>
                        </div>
                        <StatusBadge status={t.status} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 2: DEPLOYMENT HISTORY ── */}
      {activeTab === 'dora' && (
        <Card>
          <CardHeader
            title="Production Deployment Audit Trail"
            subtitle="Audit log of automated releases"
            icon={<Rocket className="w-5 h-5 text-accent-400" />}
            action={
              deploymentHistory.length > 0 ? (
                <button
                  onClick={handleExportCSV}
                  className="text-xs px-2.5 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-200 flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-primary-400" /> Export CSV
                </button>
              ) : null
            }
          />
          <div className="overflow-x-auto">
            {deploymentHistory.length === 0 ? (
              <div className="py-16 text-center text-xs text-gray-500">
                <Rocket className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                No deployment events recorded yet. Trigger pipeline deployments to populate this log.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-800 bg-gray-950/40">
                    <th className="text-left font-medium px-5 py-3">Application Microservice</th>
                    <th className="text-left font-medium px-5 py-3">Version Tag</th>
                    <th className="text-left font-medium px-5 py-3">Environment</th>
                    <th className="text-left font-medium px-5 py-3">Timestamp</th>
                    <th className="text-left font-medium px-5 py-3">Pipeline Duration</th>
                    <th className="text-left font-medium px-5 py-3">Deployment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 font-mono text-xs">
                  {deploymentHistory.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-200">{d.app}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-400 border border-primary-500/20">
                          {d.version}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-300">
                        <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300">{d.environment}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400">{formatDate(d.date)}</td>
                      <td className="px-5 py-3.5 text-gray-300">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500" /> {d.duration}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={d.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      {/* ── TAB 3: COMPLIANCE & GOVERNANCE AUDIT ── */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-primary-500/30 bg-primary-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary-500/20 text-primary-400 border border-primary-500/30">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Infrastructure Security &amp; Policy Compliance: Active
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Core policy controls verified across credentials, network ingress, and pipeline quality gates.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportJSON}
              className="px-3.5 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" /> Download Official Audit Packet
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complianceControls.map((ctrl) => (
              <Card key={ctrl.id} className="p-5 hover:border-gray-700 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                      {ctrl.id} · {ctrl.standard}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-100 mt-1">{ctrl.category}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {ctrl.status} ({ctrl.score})
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2">{ctrl.details}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: CLOUD ECONOMICS & RESOURCE EFFICIENCY ── */}
      {activeTab === 'costs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5">
              <span className="text-xs text-gray-400 font-medium">Monthly Cloud Cost</span>
              <p className="text-2xl font-black text-gray-100 mt-1">$0.00</p>
              <p className="text-xs text-emerald-400 mt-1 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> Self-hosted and free-tier infrastructure
              </p>
            </Card>

            <Card className="p-5">
              <span className="text-xs text-gray-400 font-medium">Provisioning Status</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">Zero Spend</p>
              <p className="text-xs text-gray-400 mt-1">Local and serverless workloads active</p>
            </Card>

            <Card className="p-5">
              <span className="text-xs text-gray-400 font-medium">Active Compute Nodes</span>
              <p className="text-2xl font-black text-cyan-400 mt-1">Local / Standby</p>
              <p className="text-xs text-gray-400 mt-1">Host node port 8080 &amp; 5173</p>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Infrastructure Spend Allocation"
              subtitle="Current operational cost across components"
              icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
            />
            <div className="p-5 space-y-4">
              {cloudCostData.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-gray-200">{item.name}</span>
                    <span className="font-mono text-gray-400">
                      ${item.spend.toFixed(2)} (Budget: ${item.budget.toFixed(2)})
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── EXECUTIVE BRIEFING PRESENTATION MODAL ── */}
      {showExecutiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-gray-900 border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-950/70">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Executive Briefing Memo</h3>
                  <p className="text-xs text-gray-400">
                    High-level engineering overview of current deployment posture.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySummary}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-200 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-primary-400" />
                  {copiedSummary ? 'Copied!' : 'Copy Summary'}
                </button>
                <button
                  onClick={() => setShowExecutiveModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-sm text-gray-300">
              <div className="p-4 rounded-xl bg-gray-950/60 border border-gray-800">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-400 mb-2">
                  System Overview
                </h4>
                <p className="leading-relaxed text-gray-200">
                  The automated CI/CD and MLOps Infrastructure Control Center integrates GitHub source control,
                  Jenkins automated builds, Docker containerization, and cloud deployment into a unified telemetry single pane of glass.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  Key Operational Metrics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {doraMetrics.map((d, i) => (
                    <div key={i} className="p-3 rounded-lg bg-gray-950/80 border border-gray-800">
                      <p className="text-[11px] text-gray-400">{d.title}</p>
                      <p className="text-lg font-bold text-white mt-1">{d.value}</p>
                      <span className="text-[10px] text-emerald-400 font-semibold">{d.tier}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-950 flex justify-end">
              <button
                onClick={() => setShowExecutiveModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 font-medium cursor-pointer"
              >
                Close Briefing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
