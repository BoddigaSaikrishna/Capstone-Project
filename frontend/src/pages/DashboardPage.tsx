import { useState, useEffect, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import Card, { CardHeader } from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import ProgressBar from '@/components/ui/ProgressBar';
import {
  dashboardPipelines,
  recentDeployments,
  recentActivities,
  systemHealth,
  runningApps,
  monitoringMetrics,
} from '@/api/mockData';
import { formatRelative } from '@/utils/format';
import {
  LayoutDashboard,
  Rocket,
  GitBranch,
  Activity,
  Server,
  Cpu,
  HardDrive,
  Clock,
  Zap,
  TrendingUp,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Github,
  Box,
  Cloud,
  Play,
  RefreshCw,
  ArrowRight,
  Timer,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const pieData = [
  { name: 'Success', value: 18, color: '#10b981' },
  { name: 'Running', value: 3, color: '#3b82f6' },
  { name: 'Failed', value: 2, color: '#ef4444' },
  { name: 'Pending', value: 1, color: '#f59e0b' },
];

const activityIcon: Record<string, typeof Rocket> = {
  deploy: Rocket,
  build: Server,
  test: CheckCircle2,
  push: GitBranch,
  health: Activity,
  rollback: XCircle,
};

// ── 4-Stage Live Pipeline Widget ─────────────────────────────────────────────

type StageStatus = 'idle' | 'running' | 'success' | 'failed';

const STAGES = [
  { id: 1, tool: 'GitHub',  label: 'Code Push',       icon: Github, color: '#6366f1', duration: '~4s',  commit: 'feat: update inference v2.4' },
  { id: 2, tool: 'Jenkins', label: 'Build & Test',    icon: Server, color: '#f59e0b', duration: '~48s', commit: 'Build #152 · 42 tests pass' },
  { id: 3, tool: 'Docker',  label: 'Containerize',    icon: Box,    color: '#0ea5e9', duration: '~22s', commit: 'ml-api:v2.4 pushed to registry' },
  { id: 4, tool: 'AWS EC2', label: 'Deploy & Launch', icon: Cloud,  color: '#10b981', duration: '~18s', commit: '3 EC2 instances updated' },
] as const;

const STAGE_DELAYS = [800, 1800, 1400, 1200];

function LivePipelineWidget() {
  const [statuses, setStatuses] = useState<StageStatus[]>(['success', 'success', 'success', 'success']);
  const [elapsed, setElapsed] = useState<number[]>([4, 48, 22, 18]);
  const [running, setRunning] = useState(false);
  const [runCount, setRunCount] = useState(152);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerRun = () => {
    if (running) return;
    setRunning(true);
    setRunCount((c) => c + 1);
    setStatuses(['running', 'idle', 'idle', 'idle']);
    setElapsed([0, 0, 0, 0]);
    let stageIdx = 0;
    const advance = () => {
      if (stageIdx >= STAGES.length) { setRunning(false); return; }
      const cur = stageIdx;
      let sec = 0;
      timerRef.current = setInterval(() => {
        sec += 1;
        setElapsed((prev) => { const n = [...prev]; n[cur] = sec; return n; });
      }, 1000);
      setTimeout(() => {
        clearInterval(timerRef.current!);
        setStatuses((prev) => {
          const n = [...prev] as StageStatus[];
          n[cur] = 'success';
          if (cur + 1 < STAGES.length) n[cur + 1] = 'running';
          return n;
        });
        stageIdx++;
        advance();
      }, STAGE_DELAYS[cur]);
    };
    advance();
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const allDone = statuses.every((s) => s === 'success') && !running;
  const overallStatus = running ? 'running' : allDone ? 'success' : 'idle';

  const statusColor: Record<StageStatus, string> = {
    idle: 'border-gray-700 bg-gray-900',
    running: 'border-blue-500/60 bg-blue-500/5 shadow-lg shadow-blue-500/10',
    success: 'border-success-500/40 bg-success-500/5',
    failed: 'border-error-500/40 bg-error-500/5',
  };

  return (
    <Card className="border border-gray-200 dark:border-gray-800">
      <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/20">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Live 4-Stage Pipeline Monitor</h3>
            <p className="text-xs text-gray-400">GitHub → Jenkins → Docker → AWS EC2 · Run #{runCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
            overallStatus === 'running' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            overallStatus === 'success' ? 'bg-success-500/10 text-success-400 border-success-500/20' :
            'bg-gray-800 text-gray-400 border-gray-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              overallStatus === 'running' ? 'bg-blue-400 animate-pulse' :
              overallStatus === 'success' ? 'bg-success-400' : 'bg-gray-500'
            }`} />
            {overallStatus === 'running' ? 'RUNNING' : overallStatus === 'success' ? 'ALL PASSED' : 'IDLE'}
          </span>
          <button
            onClick={triggerRun}
            disabled={running}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
          >
            {running ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {running ? 'Running...' : 'Trigger Run'}
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-4 gap-3 relative">
          {STAGES.map((stage, i) => {
            const status = statuses[i];
            const Icon = stage.icon;
            const isRunning = status === 'running';
            const progress = Math.min((elapsed[i] / (STAGE_DELAYS[i] / 1000)) * 100, 95);
            return (
              <div key={stage.id} className="relative">
                {i < STAGES.length - 1 && (
                  <div className="absolute -right-2 top-8 z-10">
                    <ArrowRight className={`w-3.5 h-3.5 transition-colors duration-500 ${
                      statuses[i] === 'success' ? 'text-success-400' : 'text-gray-700'
                    }`} />
                  </div>
                )}
                <div className={`rounded-xl border p-4 transition-all duration-300 ${statusColor[status]}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${stage.color}18`, border: `1px solid ${stage.color}30` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: stage.color }} />
                    </div>
                    <div>
                      {isRunning && <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />}
                      {status === 'success' && <CheckCircle className="w-3 h-3 text-success-400" />}
                      {status === 'failed' && <AlertCircle className="w-3 h-3 text-error-400" />}
                    </div>
                  </div>
                  <p className="text-xs font-bold text-gray-100 leading-tight">{stage.tool}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{stage.label}</p>
                  {isRunning && (
                    <div className="mt-2.5 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${progress}%`, transition: 'width 1s linear' }}
                      />
                    </div>
                  )}
                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Timer className="w-2.5 h-2.5" />
                      {isRunning ? `${elapsed[i]}s` : status === 'success' ? stage.duration : '—'}
                    </span>
                    <span>{status === 'idle' ? 'Queued' : status === 'running' ? 'In Progress' : status === 'success' ? '✓ Done' : '✗ Failed'}</span>
                  </div>
                  {status === 'success' && stage.commit && (
                    <p className="mt-2 text-[9px] text-gray-500 font-mono truncate border-t border-gray-800/60 pt-1.5">{stage.commit}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-4 gap-4">
          {[
            { label: 'Total Runs', value: `${runCount}`, color: 'text-gray-100' },
            { label: 'Success Rate', value: '96.7%', color: 'text-success-400' },
            { label: 'Avg Duration', value: '1m 32s', color: 'text-blue-400' },
            { label: 'Last Triggered', value: running ? 'Just now' : '2 min ago', color: 'text-gray-300' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className={`text-base font-bold font-mono ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const successRate = Math.round((18 / 24) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Rocket className="w-5 h-5" />}
          label="Active Deployments"
          value="3"
          trend="+12%"
          trendUp
          color="primary"
        />
        <StatCard
          icon={<GitBranch className="w-5 h-5" />}
          label="Pipeline Runs (24h)"
          value="24"
          trend="+8%"
          trendUp
          color="accent"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Success Rate"
          value={`${successRate}%`}
          trend="+3%"
          trendUp
          color="success"
        />
        <StatCard
          icon={<Server className="w-5 h-5" />}
          label="Running Services"
          value="4"
          trend="0"
          color="warning"
        />
      </div>

      {/* ── 4-Stage Live Pipeline Widget ─────────────────────────────────────── */}
      <LivePipelineWidget />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CPU/Memory chart */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="System Performance"
            subtitle="CPU & Memory usage over last 24 hours"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monitoringMetrics}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} />
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} fill="url(#cpuGrad)" name="CPU %" />
                <Area type="monotone" dataKey="memory" stroke="#06b6d4" strokeWidth={2} fill="url(#memGrad)" name="Memory %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pipeline status pie */}
        <Card>
          <CardHeader
            title="Pipeline Status"
            subtitle="Last 24 hours"
            icon={<GitBranch className="w-5 h-5" />}
          />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
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
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {pieData.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{p.name}</span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 ml-auto">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* System health + Pipelines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System health */}
        <Card>
          <CardHeader
            title="System Health"
            subtitle="Current infrastructure status"
            icon={<Activity className="w-5 h-5" />}
          />
          <div className="p-5 space-y-4">
            <HealthItem icon={<Cpu className="w-4 h-4" />} label="CPU Usage" value={`${systemHealth.cpu}%`} progress={systemHealth.cpu} color="primary" />
            <HealthItem icon={<HardDrive className="w-4 h-4" />} label="Memory Usage" value={`${systemHealth.memory}%`} progress={systemHealth.memory} color="accent" />
            <HealthItem icon={<Zap className="w-4 h-4" />} label="Response Time" value={`${systemHealth.responseTime}ms`} progress={systemHealth.responseTime / 2} color="success" />
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Uptime</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{systemHealth.uptime}</span>
            </div>
          </div>
        </Card>

        {/* Active pipelines */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Pipeline Status"
            subtitle="Active and recent pipeline runs"
            icon={<GitBranch className="w-5 h-5" />}
          />
          <div className="p-5 space-y-3">
            {dashboardPipelines.map((p) => (
              <div key={p.id} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{p.name}</span>
                    <StatusBadge status={p.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={p.progress} size="sm" color={p.status === 'failed' ? 'error' : p.status === 'success' ? 'success' : 'primary'} />
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{p.stage}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{formatRelative(p.startedAt)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Deployments + Running apps + Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent deployments */}
        <Card>
          <CardHeader
            title="Latest Deployments"
            subtitle="Recent deployment events"
            icon={<Rocket className="w-5 h-5" />}
          />
          <div className="p-5 space-y-3">
            {recentDeployments.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{d.app}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{d.version} · {d.environment}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{formatRelative(d.deployedAt)}</span>
                  <StatusBadge status={d.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Running apps */}
        <Card>
          <CardHeader
            title="Running Applications"
            subtitle="Production ML services"
            icon={<PlayCircle className="w-5 h-5" />}
          />
          <div className="p-5 space-y-3">
            {runningApps.map((app) => (
              <div key={app.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{app.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{app.version} · {app.requests}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-success-600 dark:text-success-500">{app.latency}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">latency</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent activities */}
        <Card>
          <CardHeader
            title="Recent Activities"
            subtitle="Latest DevOps events"
            icon={<Activity className="w-5 h-5" />}
          />
          <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
            {recentActivities.map((a) => {
              const Icon = activityIcon[a.type] ?? Activity;
              return (
                <div key={a.id} className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1.5 rounded-md ${a.status === 'failed' ? 'bg-error-500/10 text-error-600 dark:text-error-500' : a.status === 'success' ? 'bg-success-500/10 text-success-600 dark:text-success-500' : 'bg-primary-500/10 text-primary-600 dark:text-primary-400'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{a.message}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatRelative(a.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  trendUp,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  trendUp?: boolean;
  color: 'primary' | 'accent' | 'success' | 'warning';
}) {
  const colorMap = {
    primary: 'bg-primary-500/10 text-primary-600 dark:text-primary-400',
    accent: 'bg-accent-500/10 text-accent-600 dark:text-accent-500',
    success: 'bg-success-500/10 text-success-600 dark:text-success-500',
    warning: 'bg-warning-500/10 text-warning-600 dark:text-warning-500',
  };
  return (
    <Card hover className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>{icon}</div>
        <span className={`text-xs font-semibold ${trendUp ? 'text-success-600 dark:text-success-500' : 'text-gray-400 dark:text-gray-500'}`}>
          {trend}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </Card>
  );
}

function HealthItem({
  icon,
  label,
  value,
  progress,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  progress: number;
  color: 'primary' | 'accent' | 'success';
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</span>
      </div>
      <ProgressBar value={progress} size="sm" color={color} />
    </div>
  );
}
