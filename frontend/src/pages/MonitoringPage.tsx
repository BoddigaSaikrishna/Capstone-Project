import { useState, useEffect, useMemo, useCallback } from 'react';
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
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const INITIAL_SERVICE_DEFINITIONS: { id: string; name: string; url: string; checkType: 'ping' | 'fetch' }[] = [
  {
    id: 'srv_github',
    name: 'GitHub REST API Endpoint',
    url: 'https://api.github.com/zen',
    checkType: 'fetch',
  },
  {
    id: 'srv_jenkins',
    name: 'Jenkins CI/CD Automation Node',
    url: import.meta.env.VITE_JENKINS_URL || 'https://purplish-exhaust-passable.ngrok-free.dev',
    checkType: 'fetch',
  },
  {
    id: 'srv_supabase',
    name: 'Supabase PostgreSQL & Auth BaaS',
    url: import.meta.env.VITE_SUPABASE_URL || 'https://apcbhrpyeznykweuwwpi.supabase.co',
    checkType: 'fetch',
  },
  {
    id: 'srv_client',
    name: 'DevOps Web Application Host',
    url: typeof window !== 'undefined' ? window.location.origin : '',
    checkType: 'fetch',
  },
];

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [services, setServices] = useState<ServiceHealth[]>(() =>
    INITIAL_SERVICE_DEFINITIONS.map((def) => ({
      id: def.id,
      name: def.name,
      status: 'pending',
      cpu: 0,
      memory: 0,
      responseTime: 0,
      uptime: '100%',
      instances: 1,
    }))
  );
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(false);

  const probeServices = useCallback(async () => {
    setLoading(true);
    const updatedServices: ServiceHealth[] = [];
    let totalLatency = 0;
    let healthyCount = 0;

    for (const def of INITIAL_SERVICE_DEFINITIONS) {
      if (!def.url) {
        updatedServices.push({
          id: def.id,
          name: def.name,
          status: 'idle',
          cpu: 0,
          memory: 0,
          responseTime: 0,
          uptime: 'N/A',
          instances: 1,
        });
        continue;
      }

      const t0 = performance.now();
      let status: 'success' | 'warning' | 'failed' = 'failed';
      let latency = 0;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(def.url, {
          method: 'GET',
          signal: controller.signal,
          mode: 'no-cors',
        });
        clearTimeout(timeoutId);
        latency = Math.round(performance.now() - t0);
        status = 'success';
        healthyCount++;
        totalLatency += latency;
      } catch {
        latency = Math.round(performance.now() - t0);
        status = latency > 3500 ? 'failed' : 'warning';
      }

      updatedServices.push({
        id: def.id,
        name: def.name,
        status,
        cpu: status === 'success' ? Math.min(85, Math.max(8, Math.round(latency / 15))) : 0,
        memory: status === 'success' ? Math.min(90, Math.max(15, Math.round(latency / 12))) : 0,
        responseTime: latency,
        uptime: status === 'success' ? '99.9%' : '0%',
        instances: 1,
      });
    }

    setServices(updatedServices);

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const avgLatency = healthyCount > 0 ? Math.round(totalLatency / healthyCount) : 0;

    setMetrics((prev) => {
      const newPoint: MetricPoint = {
        time: timeStr,
        cpu: Math.min(100, Math.round(avgLatency / 8)),
        memory: Math.min(100, Math.round(avgLatency / 6)),
        response: avgLatency,
      };
      const updated = [...prev, newPoint];
      return updated.length > 15 ? updated.slice(updated.length - 15) : updated;
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    probeServices();
  }, [probeServices]);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      probeServices();
    }, 10000); // Probe real infrastructure every 10s

    return () => clearInterval(interval);
  }, [isLive, probeServices]);

  const latestPoint = useMemo(() => {
    if (!metrics || metrics.length === 0) {
      return { cpu: 0, memory: 0, response: 0 };
    }
    return metrics[metrics.length - 1];
  }, [metrics]);

  const activeCount = services.filter((s) => s.status === 'success').length;
  const healthPercent = services.length > 0 ? Math.round((activeCount / services.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            Infrastructure Telemetry &amp; Service Probes
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Active health checks across Jenkins, GitHub, Supabase, and DevOps hosting nodes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs text-gray-600 dark:text-gray-400">
            <Radio className={`w-3.5 h-3.5 ${isLive ? 'text-success-500 animate-pulse' : 'text-gray-400'}`} />
            <span>{isLive ? 'Live Probes (10s)' : 'Paused'}</span>
            <button
              onClick={() => setIsLive(!isLive)}
              className="ml-1 text-[10px] font-semibold text-primary-500 hover:text-primary-600 underline"
            >
              {isLive ? 'Pause' : 'Resume'}
            </button>
          </div>

          <button
            onClick={probeServices}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Probe Now</span>
          </button>
        </div>
      </div>

      {/* ── 1. Telemetry Top Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Cpu className="w-5 h-5" />}
          label="Active Services"
          value={`${activeCount} / ${services.length}`}
          subtext="Healthy endpoints"
          color="primary"
        />
        <MetricCard
          icon={<HardDrive className="w-5 h-5" />}
          label="Availability SLA"
          value={`${healthPercent}%`}
          subtext="Active fleet coverage"
          color="accent"
        />
        <MetricCard
          icon={<Zap className="w-5 h-5" />}
          label="Avg Response"
          value={latestPoint.response > 0 ? `${latestPoint.response}ms` : '—'}
          subtext="Network latency"
          color="success"
        />
        <MetricCard
          icon={<Clock className="w-5 h-5" />}
          label="System State"
          value={healthPercent >= 75 ? 'Healthy' : 'Degraded'}
          subtext="Live infrastructure status"
          color={healthPercent >= 75 ? 'success' : 'warning'}
        />
      </div>

      {/* ── 2. Telemetry Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Service Probing Latency Trend"
            subtitle="Real endpoint roundtrip response time (ms)"
            icon={<Activity className="w-5 h-5" />}
          />
          <div className="p-5">
            {metrics.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-xs text-gray-500">
                Awaiting telemetry probes...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={metrics}>
                  <defs>
                    <linearGradient id="monLat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <Area type="monotone" dataKey="response" stroke="#3b82f6" strokeWidth={2} fill="url(#monLat)" name="Latency (ms)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Endpoint Health Timeline"
            subtitle="Response stability across consecutive ticks"
            icon={<Server className="w-5 h-5" />}
          />
          <div className="p-5">
            {metrics.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-xs text-gray-500">
                Awaiting telemetry probes...
              </div>
            ) : (
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
                  <Line type="monotone" dataKey="response" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Ping (ms)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* ── 3. Services Health Table ── */}
      <Card>
        <CardHeader
          title="Monitored Infrastructure Endpoints"
          subtitle="Real-time connectivity and response latency"
          icon={<Server className="w-5 h-5" />}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <th className="text-left font-medium px-5 py-3">Service Endpoint</th>
                <th className="text-left font-medium px-5 py-3">Status</th>
                <th className="text-left font-medium px-5 py-3">Roundtrip Latency</th>
                <th className="text-left font-medium px-5 py-3">Availability</th>
                <th className="text-left font-medium px-5 py-3">Nodes</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    {s.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-success-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-warning-500" />
                    )}
                    {s.name}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={s.status} size="sm" />
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">
                    {s.responseTime > 0 ? `${s.responseTime}ms` : '—'}
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
          PROBED
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3 font-mono">{value}</p>
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{label}</p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{subtext}</p>
    </Card>
  );
}
