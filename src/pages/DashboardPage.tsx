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
