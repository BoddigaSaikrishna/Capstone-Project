import { useState, useEffect } from 'react';
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
import { monitoringMetrics as initialMetrics, serviceHealth } from '@/api/mockData';
import { Activity, Cpu, HardDrive, Clock, Zap, Server, Radio } from 'lucide-react';

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setMetrics((prev) => {
        const lastTime = prev[prev.length - 1].time;
        const [h] = lastTime.split(':');
        const nextHour = (parseInt(h, 10) + 1) % 24;
        const formattedHour = `${nextHour.toString().padStart(2, '0')}:00`;
        const newPoint = {
          time: formattedHour,
          cpu: Math.round(30 + Math.random() * 45),
          memory: Math.round(50 + Math.random() * 35),
          response: Math.round(70 + Math.random() * 80),
        };
        return [...prev.slice(1), newPoint];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isLive]);

  const latestCpu = metrics[metrics.length - 1].cpu;
  const latestMem = metrics[metrics.length - 1].memory;
  const latestResponse = metrics[metrics.length - 1].response;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Live mode toggle header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Telemetry & Performance Monitoring</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Real-time infrastructure and service metrics</p>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            isLive
              ? 'bg-success-500 text-white shadow-lg shadow-success-500/20'
              : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800'
          }`}
        >
          <Radio className={`w-4 h-4 ${isLive ? 'animate-pulse' : ''}`} />
          {isLive ? 'Live Streaming ACTIVE' : 'Enable Live Telemetry'}
        </button>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<Cpu className="w-5 h-5" />} label="CPU Usage" value={`${latestCpu}%`} color="primary" />
        <MetricCard icon={<HardDrive className="w-5 h-5" />} label="Memory Usage" value={`${latestMem}%`} color="accent" />
        <MetricCard icon={<Zap className="w-5 h-5" />} label="Avg Response" value={`${latestResponse}ms`} color="success" />
        <MetricCard icon={<Clock className="w-5 h-5" />} label="Uptime" value="27d 14h" color="warning" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="CPU & Memory" subtitle="Live usage stream" icon={<Activity className="w-5 h-5" />} />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={metrics}>
                <defs>
                  <linearGradient id="monCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="monMem" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} fill="url(#monCpu)" name="CPU %" />
                <Area type="monotone" dataKey="memory" stroke="#06b6d4" strokeWidth={2} fill="url(#monMem)" name="Memory %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Response Time" subtitle="Latency stream (ms)" icon={<Zap className="w-5 h-5" />} />
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
                <Line type="monotone" dataKey="response" stroke="#10b981" strokeWidth={2} dot={false} name="Response (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Service health table */}
      <Card>
        <CardHeader title="Service Health" subtitle="Health status of all deployed ML services" icon={<Server className="w-5 h-5" />} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <th className="text-left font-medium px-5 py-3">Service</th>
                <th className="text-left font-medium px-5 py-3">Status</th>
                <th className="text-left font-medium px-5 py-3">CPU</th>
                <th className="text-left font-medium px-5 py-3">Memory</th>
                <th className="text-left font-medium px-5 py-3">Response</th>
                <th className="text-left font-medium px-5 py-3">Uptime</th>
                <th className="text-left font-medium px-5 py-3">Instances</th>
              </tr>
            </thead>
            <tbody>
              {serviceHealth.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{s.name}</td>
                  <td className="px-5 py-3"><StatusBadge status={s.status} size="sm" /></td>
                  <td className="px-5 py-3 w-32">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={s.cpu} size="sm" color={s.cpu > 75 ? 'error' : 'primary'} />
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-8">{s.cpu}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 w-32">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={s.memory} size="sm" color={s.memory > 75 ? 'error' : 'accent'} />
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-8">{s.memory}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{s.responseTime}ms</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{s.uptime}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{s.instances}</td>
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
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'primary' | 'accent' | 'success' | 'warning';
}) {
  const colorMap = {
    primary: 'bg-primary-500/10 text-primary-600 dark:text-primary-400',
    accent: 'bg-accent-500/10 text-accent-600 dark:text-accent-500',
    success: 'bg-success-500/10 text-success-600 dark:text-success-500',
    warning: 'bg-warning-500/10 text-warning-600 dark:text-warning-500',
  };
  return (
    <Card className="p-5">
      <div className={`p-2.5 rounded-lg ${colorMap[color]} inline-flex mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </Card>
  );
}
