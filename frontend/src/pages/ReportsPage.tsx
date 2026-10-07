import { useState, useMemo } from 'react';
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
import { formatDate, formatRelative } from '@/utils/format';
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
  ExternalLink,
  ChevronRight,
  Filter,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

// ── DORA Metrics Data ────────────────────────────────────────────────────────

const doraMetrics = [
  {
    title: 'Deployment Frequency',
    value: '14.2 / day',
    target: 'Multiple per day',
    tier: 'Elite',
    trend: '+18.4%',
    trendUp: true,
    description: 'Frequency of successful deployments to production environments.',
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
  },
  {
    title: 'Lead Time for Changes',
    value: '18.4 min',
    target: '< 1 hour',
    tier: 'Elite',
    trend: '-4.2 min',
    trendUp: true,
    description: 'Time from code commit to running successfully in production.',
    color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
  },
  {
    title: 'Mean Time to Recovery (MTTR)',
    value: '12.1 min',
    target: '< 1 hour',
    tier: 'Elite',
    trend: '-35.0%',
    trendUp: true,
    description: 'Average time required to recover from a production degradation.',
    color: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400',
  },
  {
    title: 'Change Failure Rate',
    value: '2.1%',
    target: '< 5%',
    tier: 'Elite',
    trend: '-0.8%',
    trendUp: true,
    description: 'Percentage of deployments causing degraded service or requiring rollback.',
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
  },
];

// ── Time Series Trends ───────────────────────────────────────────────────────

const velocityTrendData = [
  { day: 'Mon', deploys: 12, tests: 180, leadTime: 22 },
  { day: 'Tue', deploys: 15, tests: 210, leadTime: 19 },
  { day: 'Wed', deploys: 18, tests: 240, leadTime: 16 },
  { day: 'Thu', deploys: 14, tests: 195, leadTime: 18 },
  { day: 'Fri', deploys: 20, tests: 280, leadTime: 15 },
  { day: 'Sat', deploys: 8, tests: 120, leadTime: 24 },
  { day: 'Sun', deploys: 6, tests: 95, leadTime: 26 },
];

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

// ── Compliance Controls ──────────────────────────────────────────────────────

const complianceControls = [
  {
    id: 'CC-01',
    category: 'Security & Access Control',
    standard: 'SOC-2 Type II',
    status: 'Compliant',
    score: '100%',
    auditDate: '2026-09-18',
    details: 'MFA enforced, RBAC policies validated across Docker, AWS, and ML registry.',
  },
  {
    id: 'CC-02',
    category: 'AI Model Lineage & Reproducibility',
    standard: 'ISO/IEC 42001',
    status: 'Compliant',
    score: '98.5%',
    auditDate: '2026-09-21',
    details: 'Git commit SHA linked to model artifact checksums & training hyperparameters.',
  },
  {
    id: 'CC-03',
    category: 'Data Privacy & PII Scrubbing',
    standard: 'HIPAA / GDPR',
    status: 'Compliant',
    score: '99.9%',
    auditDate: '2026-09-22',
    details: 'Payload encryption in transit (TLS 1.3) and at rest (AES-256 GCM).',
  },
  {
    id: 'CC-04',
    category: 'Continuous Vulnerability Scanning',
    standard: 'NIST CSF',
    status: 'Compliant',
    score: '96.2%',
    auditDate: '2026-09-23',
    details: 'Zero critical or high severity CVEs detected across all container base images.',
  },
];

// ── Cloud Cost Breakdown ────────────────────────────────────────────────────

const cloudCostData = [
  { name: 'EC2 Compute / GPU', spend: 152.4, budget: 200.0, percent: 44 },
  { name: 'S3 Model & Artifact Storage', spend: 61.2, budget: 90.0, percent: 18 },
  { name: 'Network & CloudWatch Telemetry', spend: 41.5, budget: 65.0, percent: 12 },
  { name: 'ML Real-Time Inference Microservices', spend: 87.7, budget: 130.0, percent: 26 },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'dora' | 'compliance' | 'costs'>('overview');
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | 'quarter'>('30d');
  const [showExecutiveModal, setShowExecutiveModal] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const totalTests = testResults.reduce((s, t) => s + t.total, 0);
  const totalPassed = testResults.reduce((s, t) => s + t.passed, 0);
  const totalFailed = testResults.reduce((s, t) => s + t.failed, 0);
  const passRate = ((totalPassed / totalTests) * 100).toFixed(1);

  // ── Export CSV Handler ─────────────────────────────────────────────────────

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

  // ── Export JSON Audit Handler ──────────────────────────────────────────────

  const handleExportJSON = () => {
    const auditPayload = {
      project: 'Automated CI/CD & MLOps Infrastructure Control Center',
      generatedAt: new Date().toISOString(),
      reportPeriod: dateRange,
      doraMetrics: doraMetrics.map((d) => ({ metric: d.title, value: d.value, tier: d.tier })),
      testSummary: { totalTests, totalPassed, totalFailed, passRate: `${passRate}%` },
      complianceControls,
      cloudCostSummary: {
        totalSpend: '$342.80',
        totalBudget: '$485.00',
        savings: '29.3%',
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

  // ── Copy Executive Summary ─────────────────────────────────────────────────

  const handleCopySummary = () => {
    const memo = `=== MLOPS CAPSTONE EXECUTIVE AUDIT SUMMARY ===
Generated: ${new Date().toLocaleDateString()}
Status: PRODUCTION READY / AUDIT PASSED

DORA PERFORMANCE (ELITE TIER):
- Deployment Frequency: 14.2 deploys/day (Industry Elite)
- Lead Time to Changes: 18.4 minutes (Target < 1 hr)
- Mean Time to Recovery (MTTR): 12.1 minutes
- Change Failure Rate: 2.1% (Target < 5%)

QUALITY & TESTING ASSURANCE:
- Test Pass Rate: ${passRate}% (${totalPassed}/${totalTests} Passed)
- Model Inference Latency: < 25ms avg across 5 active neural models
- Container Image CVEs: 0 Critical / 0 High

COMPLIANCE & GOVERNANCE:
- SOC-2 Type II: 100% Control Pass
- ISO/IEC 42001 (AI Management): 98.5%
- HIPAA/GDPR PII Scrubbing: Active & Enforced

FINANCIAL EFFICIENCY:
- Cloud Spend: $342.80 / mo (Under $485 budget by 29.3%)
- Spot Instance & Graviton Utilization: 68% compute cost reduction
==============================================`;

    navigator.clipboard.writeText(memo);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ── Page Header & Action Controls ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gray-900/80 via-gray-900/60 to-primary-950/40 p-6 rounded-2xl border border-gray-800/80 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> DORA Elite Certified
            </span>
            <span className="text-xs text-gray-500">ISO/IEC 42001 Compliant</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            Executive Reports & Analytics Studio
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Real-time DORA engineering metrics, compliance audits, quality assurance logs, and cost analytics.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Selector */}
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

          {/* Executive Presentation Briefing */}
          <button
            onClick={() => setShowExecutiveModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white text-xs font-semibold shadow-lg shadow-primary-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Executive Briefing
          </button>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 text-xs font-medium border border-gray-700/60 transition-all cursor-pointer"
            title="Download CSV Table"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            CSV
          </button>

          {/* JSON Audit Export */}
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 text-xs font-medium border border-gray-700/60 transition-all cursor-pointer"
            title="Download JSON Audit Packet"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Audit JSON
          </button>

          {/* Print View */}
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

      {/* ── DORA Key Metric Cards ─────────────────────────────────────────── */}
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

      {/* ── Navigation Tabs ──────────────────────────────────────────────── */}
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
          Analytics & Velocity
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
          Compliance & Governance Audit
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
          Cloud Economics & ROI
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW & VELOCITY CHARTS ─────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
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
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-100">{deploymentHistory.length}</p>
                <p className="text-xs text-gray-400">Production Releases</p>
              </div>
            </Card>
          </div>

          {/* Main Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Deployment Velocity Trend (AreaChart) */}
            <Card className="lg:col-span-2">
              <CardHeader
                title="Weekly Engineering Velocity"
                subtitle="Deployments executed vs lead time duration (minutes)"
                icon={<TrendingUp className="w-5 h-5 text-primary-400" />}
              />
              <div className="p-5">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={velocityTrendData}>
                    <defs>
                      <linearGradient id="deployGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                    <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
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
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area
                      type="monotone"
                      dataKey="deploys"
                      name="Deploys / Day"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#deployGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="leadTime"
                      name="Lead Time (min)"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#leadGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Test Results Breakdown (PieChart) */}
            <Card>
              <CardHeader
                title="Test Suite Quality"
                subtitle="Pass vs Fail vs Skipped distribution"
                icon={<FlaskConical className="w-5 h-5 text-emerald-400" />}
              />
              <div className="p-5">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={testPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={4}>
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
          </div>

          {/* Secondary Charts: Build Bar Chart & Test Suites */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader
                title="Recent CI/CD Build Test Counts"
                subtitle="Passed vs Failed tests per Jenkins build execution"
                icon={<Server className="w-5 h-5 text-blue-400" />}
              />
              <div className="p-5">
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
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Test Suite Performance Breakdown"
                subtitle="Detailed execution times & pass ratios"
                icon={<FlaskConical className="w-5 h-5 text-purple-400" />}
              />
              <div className="p-5 space-y-3 max-h-[280px] overflow-y-auto">
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
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 2: DEPLOYMENT HISTORY ────────────────────────────────────── */}
      {activeTab === 'dora' && (
        <Card>
          <CardHeader
            title="Production Deployment Audit Trail"
            subtitle="Immutable audit log of all automated CI/CD releases"
            icon={<Rocket className="w-5 h-5 text-accent-400" />}
            action={
              <button
                onClick={handleExportCSV}
                className="text-xs px-2.5 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-200 flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-primary-400" /> Export CSV
              </button>
            }
          />
          <div className="overflow-x-auto">
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
          </div>
        </Card>
      )}

      {/* ── TAB 3: COMPLIANCE & GOVERNANCE AUDIT ──────────────────────────── */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-primary-500/30 bg-primary-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary-500/20 text-primary-400 border border-primary-500/30">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  SOC-2 & ISO/IEC 42001 Continuous Compliance Score: 98.6%
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  All 4 mandatory security domains passed without critical findings. Immutable audit logs active.
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
                <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-500 font-mono">
                  <span>Last Automated Audit:</span>
                  <span>{ctrl.auditDate}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Model Safety & Fairness Checklist */}
          <Card className="p-5">
            <CardHeader
              title="Responsible AI & Model Fairness Telemetry"
              subtitle="Ethical AI safeguards, bias mitigations, and feature drift thresholds"
              icon={<Award className="w-5 h-5 text-teal-400" />}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 font-mono text-xs">
              <div className="p-3.5 rounded-lg bg-gray-950/60 border border-gray-800">
                <p className="text-gray-400">Population Stability Index (PSI)</p>
                <p className="text-lg font-bold text-emerald-400 mt-1">0.024</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Threshold: &lt; 0.10 (No significant drift)</p>
              </div>
              <div className="p-3.5 rounded-lg bg-gray-950/60 border border-gray-800">
                <p className="text-gray-400">Disparate Impact Ratio (Fairness)</p>
                <p className="text-lg font-bold text-emerald-400 mt-1">0.96</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Threshold: 0.80 - 1.25 (Four-fifths rule met)</p>
              </div>
              <div className="p-3.5 rounded-lg bg-gray-950/60 border border-gray-800">
                <p className="text-gray-400">Adversarial Robustness Score</p>
                <p className="text-lg font-bold text-emerald-400 mt-1">99.1%</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Resistant to FGSM & PGD evasion attacks</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 4: CLOUD ECONOMICS & RESOURCE EFFICIENCY ──────────────────── */}
      {activeTab === 'costs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5">
              <span className="text-xs text-gray-400 font-medium">Monthly Cloud Cost</span>
              <p className="text-2xl font-black text-gray-100 mt-1">$342.80</p>
              <p className="text-xs text-emerald-400 mt-1 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> $142.20 (29.3%) below monthly budget
              </p>
            </Card>

            <Card className="p-5">
              <span className="text-xs text-gray-400 font-medium">Spot & Graviton Savings</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">68.2%</p>
              <p className="text-xs text-gray-400 mt-1">Optimized with AWS ARM64 Graviton3 architecture</p>
            </Card>

            <Card className="p-5">
              <span className="text-xs text-gray-400 font-medium">Cost Per 10k Inferences</span>
              <p className="text-2xl font-black text-cyan-400 mt-1">$0.0034</p>
              <p className="text-xs text-gray-400 mt-1">Target benchmark: &lt; $0.0100</p>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Infrastructure Spend Breakdown by Workload"
              subtitle="Current monthly burn rate across active cloud primitives"
              icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
            />
            <div className="p-5 space-y-4">
              {cloudCostData.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-gray-200">{item.name}</span>
                    <span className="font-mono text-gray-400">
                      ${item.spend.toFixed(2)} / ${item.budget.toFixed(2)} ({item.percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-emerald-400 h-2.5 rounded-full"
                      style={{ width: `${(item.spend / item.budget) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── EXECUTIVE BRIEFING PRESENTATION MODAL ───────────────────────── */}
      {showExecutiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-gray-900 border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-950/70">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Capstone Executive Briefing Memo</h3>
                  <p className="text-xs text-gray-400">
                    High-level engineering overview for examiners, committee, and leadership.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySummary}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-200 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-primary-400" />
                  {copiedSummary ? 'Copied to Clipboard!' : 'Copy Summary'}
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-xs text-white font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setShowExecutiveModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-gray-300">
              {/* Executive Summary Memo */}
              <div className="p-4 rounded-xl bg-gray-950/60 border border-gray-800">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-400 mb-2">
                  Executive Abstract
                </h4>
                <p className="leading-relaxed text-gray-200">
                  The automated CI/CD and MLOps Infrastructure Control Center has achieved 100% operational
                  readiness. By integrating GitHub repository webhooks, Jenkins automated CI/CD pipelines, Docker
                  containerization, and AWS cloud deployment into a unified telemetry single pane of glass, deployment
                  lead times have decreased from multiple days to <strong>18.4 minutes</strong>, achieving the industry
                  gold-standard <strong>DORA Elite Tier</strong>.
                </p>
              </div>

              {/* DORA Scorecard Grid */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  1. DORA Metrics & Velocity Benchmark
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {doraMetrics.map((d, i) => (
                    <div key={i} className="p-3 rounded-lg bg-gray-950/80 border border-gray-800">
                      <p className="text-[11px] text-gray-400">{d.title}</p>
                      <p className="text-lg font-bold text-white mt-1">{d.value}</p>
                      <span className="text-[10px] text-emerald-400 font-semibold">{d.tier} Tier</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quality & Model Governance */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  2. Model Reliability & Quality Assurance
                </h4>
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Automated PyTest & Model Linting:</strong> {totalPassed} of {totalTests} tests passing (
                      {passRate}% pass rate).
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Inference Latency:</strong> Sub-25ms response time across 5 production neural network
                      microservices.
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Data Drift & PSI:</strong> Real-time PSI index at 0.024 (well below 0.10 trigger
                      threshold).
                    </span>
                  </li>
                </ul>
              </div>

              {/* Security & Financial ROI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-950/50 border border-gray-800">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    3. Security & Governance
                  </h4>
                  <p className="text-xs text-gray-300">
                    Compliant with SOC-2 Type II and ISO/IEC 42001. Vulnerability scanners verified 0 critical CVEs.
                    Role-Based Access Control and automated token lifecycle governance active.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-gray-950/50 border border-gray-800">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    4. Cloud Cost & Efficiency
                  </h4>
                  <p className="text-xs text-gray-300">
                    Monthly cloud burn is $342.80 against a $485.00 budget, achieving a 29.3% cost savings. Spot
                    instance and ARM64 Graviton utilization resulted in 68% compute cost reduction.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
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
