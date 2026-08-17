import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Card, { CardHeader } from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import ProgressBar from '@/components/ui/ProgressBar';
import type { MetricPoint, ServiceHealth } from '@/types';
import {
  Activity,
  Cpu,
  HardDrive,
  Clock,
  Zap,
  Server,
  Radio,
  RefreshCw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

// ── Default Telemetry Data Generator ─────────────────────────────────────────

function generateInitialMetrics(): MetricPoint[] {
  const points: MetricPoint[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 15 * 60 * 1000); // 15-min intervals
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    points.push({
      time: `${hours}:${minutes}`,
      cpu: Math.round(25 + Math.random() * 35),
      memory: Math.round(45 + Math.random() * 25),
      response: Math.round(40 + Math.random() * 60),
    });
  }
  return points;
}

// ── Default Infrastructure Services ─────────────────────────────────────────

const initialServices: ServiceHealth[] = [
  {
    id: 'srv_1',
    name: 'GitHub REST API Gateway',
    status: 'success',
    cpu: 18,
    memory: 42,
    responseTime: 120,
    uptime: '99.98%',
    instances: 3,
  },
  {
    id: 'srv_2',
    name: 'Jenkins CI/CD Automation Node',
    status: 'success',
    cpu: 34,
    memory: 58,
    responseTime: 85,
    uptime: '99.95%',
    instances: 2,
  },
  {
    id: 'srv_3',
    name: 'Supabase PostgreSQL Engine',
    status: 'success',
    cpu: 22,
    memory: 38,
    responseTime: 45,
    uptime: '99.99%',
    instances: 4,
  },
  {
    id: 'srv_4',
    name: 'ML Inference Microservice',
    status: 'success',
    cpu: 62,
    memory: 74,
    responseTime: 190,
    uptime: '99.90%',
    instances: 2,
  },
  {
    id: 'srv_5',
    name: 'Vite Local Dev Server',
    status: 'success',
    cpu: 12,
    memory: 29,
    responseTime: 15,
    uptime: '100%',
    instances: 1,
  },
];

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<MetricPoint[]>(generateInitialMetrics);
  const [services, setServices] = useState<ServiceHealth[]>(initialServices);
  const [isLive, setIsLive] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('1h');

  // ── Live Streaming Simulation Effect ──────────────────────────────────────
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}:${seconds}`;

      setMetrics((prev) => {
        const newPoint: MetricPoint = {
          time: timeStr,
          cpu: Math.min(98, Math.max(10, Math.round(30 + Math.random() * 45))),
          memory: Math.min(95, Math.max(20, Math.round(50 + Math.random() * 30))),
          response: Math.min(500, Math.max(15, Math.round(50 + Math.random() * 110))),
        };
        const maxPoints = timeRange === '1h' ? 10 : 16;
        const updated = [...prev, newPoint];
        return updated.length > maxPoints ? updated.slice(updated.length - maxPoints) : updated;
      });

      // Fluctuate service metrics slightly for realism
      setServices((prevServices) =>
        prevServices.map((s) => ({
          ...s,
          cpu: Math.min(99, Math.max(5, s.cpu + Math.floor(Math.random() * 7 - 3))),
          memory: Math.min(99, Math.max(10, s.memory + Math.floor(Math.random() * 5 - 2))),
          responseTime: Math.max(10, s.responseTime + Math.floor(Math.random() * 11 - 5)),
        }))
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [isLive, timeRange]);

  // ── Safe Metric Access ───────────────────────────────────────────────────
  const latestPoint = useMemo(() => {
    if (!metrics || metrics.length === 0) {
      return { cpu: 0, memory: 0, response: 0 };
    }
    return metrics[metrics.length - 1];
  }, [metrics]);

  const latestCpu = latestPoint.cpu;
  const latestMem = latestPoint.memory;
  const latestResponse = latestPoint.response;

  // Manual snapshot trigger
  const handleRefresh = () => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const newPoint: MetricPoint = {
      time: timeStr,
      cpu: Math.round(25 + Math.random() * 50),
      memory: Math.round(40 + Math.random() * 35),
      response: Math.round(30 + Math.random() * 100),
    };
    setMetrics((prev) => [...prev.slice(1), newPoint]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            Telemetry &amp; Infrastructure Monitoring
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Real-time server metrics, latency streams, and microservice health
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Time range selector */}
          <div className="flex items-center bg-gray-200 dark:bg-gray-800 p-1 rounded-lg text-xs font-semibold">
            {(['1h', '6h', '24h'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  timeRange === r
                    ? 'bg-white dark:bg-gray-900 text-primary-500 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            title="Refresh metrics snapshot"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-md ${
              isLive
                ? 'bg-success-600 hover:bg-success-500 text-white shadow-success-500/20'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
            }`}
          >
            <Radio className={`w-4 h-4 ${isLive ? 'animate-pulse text-white' : ''}`} />
            {isLive ? 'Live Stream ACTIVE' : 'Enable Live Telemetry'}
          </button>
        </div>
      </div>

      {/* ── 1. Top Metrics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Cpu className="w-5 h-5" />}
          label="CPU Load"
          value={`${latestCpu}%`}
          subtext={latestCpu > 80 ? 'High load detected' : 'Optimal threshold'}
          color="primary"
        />
        <MetricCard
          icon={<HardDrive className="w-5 h-5" />}
          label="Memory Usage"
          value={`${latestMem}%`}
          subtext="RAM consumption"
          color="accent"
        />
        <MetricCard
          icon={<Zap className="w-5 h-5" />}
          label="Avg Response"
          value={`${latestResponse}ms`}
          subtext="API Gateway latency"
          color="success"
        />
        <MetricCard
          icon={<Clock className="w-5 h-5" />}
          label="System Uptime"
          value="99.98%"
          subtext="Continuous operational state"
          color="warning"
        />
      </div>

      {/* ── 2. Live Telemetry Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU & Memory Chart */}
        <Card>
          <CardHeader
            title="CPU &amp; Memory Telemetry"
            subtitle="Live usage stream across nodes"
            icon={<Activity className="w-5 h-5" />}
          />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={metrics}>
                <defs>
                  <linearGradient id="monCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="monMem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} />
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} fill="url(#monCpu)" name="CPU %" />
                <Area type="monotone" dataKey="memory" stroke="#06b6d4" strokeWidth={2} fill="url(#monMem)" name="Memory %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Latency Chart */}
        <Card>
          <CardHeader
            title="API Latency Stream"
            subtitle="Request-response duration (ms)"
            icon={<Zap className="w-5 h-5" />}
          />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} />
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} unit="ms" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="response"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981' }}
                  name="Latency (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── 3. Microservice Health Table ── */}
      <Card>
        <CardHeader
          title="Microservice Health Matrix"
          subtitle="Real-time operational status of infrastructure components"
          icon={<Server className="w-5 h-5" />}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <th className="text-left font-medium px-5 py-3">Service</th>
                <th className="text-left font-medium px-5 py-3">Status</th>
                <th className="text-left font-medium px-5 py-3">CPU Usage</th>
                <th className="text-left font-medium px-5 py-3">Memory</th>
                <th className="text-left font-medium px-5 py-3">Latency</th>
                <th className="text-left font-medium px-5 py-3">Uptime</th>
                <th className="text-left font-medium px-5 py-3">Replicas</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-5 py-3 font.semibold font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success-500" />
                    {s.name}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={s.status} size="sm" />
                  </td>
                  <td className="px-5 py-3 w-36">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={s.cpu} size="sm" color={s.cpu > 80 ? 'error' : 'primary'} />
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-400 w-10">{s.cpu}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 w-36">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={s.memory} size="sm" color={s.memory > 80 ? 'error' : 'accent'} />
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-400 w-10">{s.memory}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">
                    {s.responseTime}ms
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300 text-xs font-mono">
                    {s.uptime}
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300 text-xs font-mono">
                    {s.instances} node{s.instances !== 1 ? 's' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  color: 'primary' | 'accent' | 'success' | 'warning';
}) {
  const colorMap = {
    primary: 'bg-primary-500/10 text-primary-600 dark:text-primary-400',
    accent: 'bg-accent-500/10 text-accent-600 dark:text-accent-400',
    success: 'bg-success-500/10 text-success-600 dark:text-success-500',
    warning: 'bg-warning-500/10 text-warning-600 dark:text-warning-500',
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-xl ${colorMap[color]} inline-flex`}>{icon}</div>
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          HEALTHY
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3 font-mono">{value}</p>
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{label}</p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{subtext}</p>
    </Card>
  );
}
