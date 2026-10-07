import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Card, { CardHeader } from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import type { Status } from '@/types';
import {
  Cloud,
  Server,
  Globe,
  MapPin,
  ExternalLink,
  Cpu,
  Play,
  Square,
  RotateCcw,
  RefreshCw,
  Filter,
  Plus,
  Trash2,
  Terminal,
  Database,
  HardDrive,
  Activity,
  Layers,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Upload,
  Folder,
  File,
  Search,
  X,
  Code,
  Check,
  Copy,
  Zap,
  Radio,
  Sliders,
  Sparkles,
  Bell,
  Network,
  BarChart2,
  Lock,
  ArrowRightLeft,
  MemoryStick,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ─── Extended AWS Types ───────────────────────────────────────────────────────

export interface AWSEC2Instance {
  id: string;
  instanceId: string;
  name: string;
  type: string;
  state: Status;
  publicIP: string;
  privateIP: string;
  region: string;
  appUrl: string;
  ami: string;
  securityGroup: string;
  vpcId: string;
  uptime: string;
  isGpu?: boolean;
}

export interface S3Object {
  key: string;
  size: number;
  lastModified: string;
  storageClass: string;
}

export interface S3Bucket {
  name: string;
  region: string;
  creationDate: string;
  versioning: boolean;
  encryption: string;
  objects: S3Object[];
}

export interface SecurityGroupRule {
  id: string;
  type: 'Inbound' | 'Outbound';
  protocol: string;
  portRange: string;
  source: string;
  description: string;
}

export interface SecurityGroup {
  id: string;
  name: string;
  description: string;
  vpcId: string;
  rules: SecurityGroupRule[];
}

export interface CloudWatchAlarm {
  id: string;
  name: string;
  metric: string;
  threshold: string;
  state: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA';
  period: string;
}

// ─── Initial Production Mock Fleet ───────────────────────────────────────────

const INITIAL_EC2_INSTANCES: AWSEC2Instance[] = [
  {
    id: 'ec2-1',
    instanceId: 'i-0f92b7c4d183a001',
    name: 'ml-inference-fraud-api',
    type: 'g4dn.xlarge',
    state: 'running',
    publicIP: '54.210.175.126',
    privateIP: '172.31.18.42',
    region: 'us-east-1a',
    appUrl: 'http://54.210.175.126:8000/docs',
    ami: 'ami-0c7217cdde317cfec (Deep Learning OSS AMI PyTorch 2.2)',
    securityGroup: 'sg-mlops-inference-prod',
    vpcId: 'vpc-0a1b2c3d4e5f',
    uptime: '14 days 6 hours',
    isGpu: true,
  },
  {
    id: 'ec2-2',
    instanceId: 'i-0a8163f92b51c002',
    name: 'fullstack-demo-app-prod',
    type: 't3.medium',
    state: 'running',
    publicIP: '54.210.175.126',
    privateIP: '172.31.24.19',
    region: 'us-east-1b',
    appUrl: 'http://54.210.175.126:3000/health',
    ami: 'ami-053b0d53c279acc90 (Ubuntu 22.04 LTS)',
    securityGroup: 'sg-fullstack-web-prod',
    vpcId: 'vpc-0a1b2c3d4e5f',
    uptime: '14 days 6 hours',
  },
  {
    id: 'ec2-3',
    instanceId: 'i-0d4812e9b014a003',
    name: 'mldevops-control-center',
    type: 't3.small',
    state: 'running',
    publicIP: '54.210.175.126',
    privateIP: '172.31.40.88',
    region: 'us-east-1a',
    appUrl: 'http://54.210.175.126:5173',
    ami: 'ami-053b0d53c279acc90 (Ubuntu 22.04 LTS)',
    securityGroup: 'sg-dashboard-ingress',
    vpcId: 'vpc-0a1b2c3d4e5f',
    uptime: '14 days 6 hours',
  },
  {
    id: 'ec2-4',
    instanceId: 'i-0e9921c3b772a004',
    name: 'postgres-redis-database-node',
    type: 'r6i.large',
    state: 'running',
    publicIP: '54.210.89.17',
    privateIP: '172.31.40.89',
    region: 'us-east-1b',
    appUrl: '—',
    ami: 'ami-053b0d53c279acc90 (Ubuntu 22.04 LTS)',
    securityGroup: 'sg-database-cluster',
    vpcId: 'vpc-0a1b2c3d4e5f',
    uptime: '28 days 12 hours',
  },
];

const INITIAL_S3_BUCKETS: S3Bucket[] = [
  {
    name: 'ml-model-artifacts-prod',
    region: 'us-east-1',
    creationDate: '2026-08-10',
    versioning: true,
    encryption: 'AWS-KMS (aws/s3)',
    objects: [
      { key: 'fraud-detection/v2.4/model.py', size: 4591, lastModified: '2026-09-30 22:00', storageClass: 'Standard' },
      { key: 'fraud-detection/v2.4/train.py', size: 4913, lastModified: '2026-09-30 22:00', storageClass: 'Standard' },
      { key: 'fraud-detection/v2.4/model_metrics.json', size: 234, lastModified: '2026-09-30 22:05', storageClass: 'Standard' },
      { key: 'fullstack-app/v1.0/server.js', size: 5200, lastModified: '2026-09-30 23:40', storageClass: 'Standard' },
    ],
  },
  {
    name: 'devops-pipeline-audit-logs',
    region: 'us-east-1',
    creationDate: '2026-08-15',
    versioning: false,
    encryption: 'AES-256',
    objects: [
      { key: 'ci-runs/build-154-junit.xml', size: 14200, lastModified: '2026-09-30 22:15', storageClass: 'Standard' },
      { key: 'ci-runs/build-42-test.xml', size: 8500, lastModified: '2026-09-30 23:45', storageClass: 'Standard' },
    ],
  },
  {
    name: 'pipeline-artifacts-archive',
    region: 'us-east-1',
    creationDate: '2026-08-20',
    versioning: true,
    encryption: 'AES-256',
    objects: [
      { key: 'builds/jenkins-build-149-artifacts.tar.gz', size: 54200000, lastModified: '2026-09-21 08:30', storageClass: 'Standard' },
      { key: 'builds/docker-image-export-v2.4.tar', size: 412000000, lastModified: '2026-09-21 08:34', storageClass: 'Standard' },
      { key: 'test_coverage_report_html.zip', size: 12400000, lastModified: '2026-09-21 08:35', storageClass: 'Standard' },
    ],
  },
  {
    name: 'cloudwatch-inference-logs-export',
    region: 'us-west-2',
    creationDate: '2026-08-01',
    versioning: false,
    encryption: 'AES-256',
    objects: [
      { key: '2026-09-20-inference-access.log.gz', size: 14200000, lastModified: '2026-09-21 00:05', storageClass: 'Glacier Instant Retrieval' },
      { key: '2026-09-19-inference-access.log.gz', size: 13800000, lastModified: '2026-09-20 00:05', storageClass: 'Glacier Instant Retrieval' },
    ],
  },
];

const INITIAL_SECURITY_GROUPS: SecurityGroup[] = [
  {
    id: 'sg-mlops-inference-prod',
    name: 'mlops-inference-prod-sg',
    description: 'Security group for PyTorch / TorchServe model serving endpoints',
    vpcId: 'vpc-0a1b2c3d4e5f',
    rules: [
      { id: 'r-1', type: 'Inbound', protocol: 'TCP', portRange: '8080', source: '0.0.0.0/0', description: 'TorchServe Prediction REST API' },
      { id: 'r-2', type: 'Inbound', protocol: 'TCP', portRange: '443', source: '0.0.0.0/0', description: 'HTTPS Public Gateway' },
      { id: 'r-3', type: 'Inbound', protocol: 'TCP', portRange: '22', source: '172.31.0.0/16', description: 'Internal Bastion SSH Access' },
      { id: 'r-4', type: 'Outbound', protocol: 'All', portRange: 'All', source: '0.0.0.0/0', description: 'Allow all outbound traffic' },
    ],
  },
  {
    id: 'sg-redis-featurestore-cluster',
    name: 'redis-featurestore-sg',
    description: 'Private Redis in-memory cache for ultra-low latency feature retrieval',
    vpcId: 'vpc-0a1b2c3d4e5f',
    rules: [
      { id: 'r-5', type: 'Inbound', protocol: 'TCP', portRange: '6379', source: 'sg-mlops-inference-prod', description: 'Redis access from inference fleet' },
      { id: 'r-6', type: 'Outbound', protocol: 'All', portRange: 'All', source: '0.0.0.0/0', description: 'Allow all outbound traffic' },
    ],
  },
  {
    id: 'sg-ml-training-gpu-node',
    name: 'gpu-training-cluster-sg',
    description: 'High performance NVIDIA GPU distributed training cluster',
    vpcId: 'vpc-0a1b2c3d4e5f',
    rules: [
      { id: 'r-7', type: 'Inbound', protocol: 'TCP', portRange: '8888', source: '172.31.0.0/16', description: 'JupyterLab Server Internal' },
      { id: 'r-8', type: 'Inbound', protocol: 'TCP', portRange: '29500-29510', source: '172.31.40.0/24', description: 'PyTorch Distributed DDP RPC' },
      { id: 'r-9', type: 'Inbound', protocol: 'TCP', portRange: '22', source: '172.31.0.0/16', description: 'SSH Management' },
    ],
  },
];

const INITIAL_CLOUDWATCH_ALARMS: CloudWatchAlarm[] = [
  { id: 'alm-1', name: 'EC2-Fleet-High-CPU-Warning', metric: 'CPUUtilization > 85%', threshold: '85% (5 min avg)', state: 'OK', period: '300s' },
  { id: 'alm-2', name: 'ModelServing-Latency-SLA-Breach', metric: 'TargetResponseTime > 200ms', threshold: '200 ms', state: 'OK', period: '60s' },
  { id: 'alm-3', name: 'GPU-Memory-Spike-Alert', metric: 'GPUUtilization > 92%', threshold: '92% (p3.2xlarge)', state: 'ALARM', period: '60s' },
  { id: 'alm-4', name: 'S3-Bucket-Storage-Anomaly', metric: 'BucketSizeBytes > 50 GB', threshold: '50 GB', state: 'OK', period: '86400s' },
];

function generateTelemetryData() {
  const points = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 10 * 60 * 1000);
    const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    points.push({
      time,
      cpu: Math.round(35 + Math.sin(i) * 15 + Math.random() * 8),
      memory: Math.round(42 + Math.cos(i * 0.8) * 10 + Math.random() * 5),
      networkIn: Number((24.5 + Math.random() * 12).toFixed(1)),
      networkOut: Number((18.2 + Math.random() * 8).toFixed(1)),
      diskIops: Math.round(180 + Math.sin(i * 0.5) * 60 + Math.random() * 40),
      readIops: Math.round(120 + Math.sin(i * 0.7) * 40 + Math.random() * 20),
      writeIops: Math.round(60 + Math.cos(i * 0.7) * 20 + Math.random() * 15),
    });
  }
  return points;
}

// ─── Instance Metrics Modal ───────────────────────────────────────────────────

function InstanceMetricsModal({ instance, telemetry, onClose }: { instance: AWSEC2Instance; telemetry: any[]; onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-warning-500/10 text-warning-400"><BarChart2 className="w-4 h-4" /></div>
            <div>
              <h3 className="text-sm font-bold text-gray-100">{instance.name} — Live Metrics</h3>
              <p className="text-[11px] text-gray-400 font-mono">{instance.instanceId} · {instance.type} · {instance.region}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Mini stat row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'CPU Util', value: `${telemetry[telemetry.length - 1]?.cpu ?? 0}%`, color: 'text-warning-400' },
              { label: 'Memory', value: `${telemetry[telemetry.length - 1]?.memory ?? 0}%`, color: 'text-blue-400' },
              { label: 'Disk IOPS', value: `${telemetry[telemetry.length - 1]?.diskIops ?? 0}`, color: 'text-purple-400' },
              { label: 'Net In', value: `${telemetry[telemetry.length - 1]?.networkIn ?? 0} MB/s`, color: 'text-emerald-400' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-950 rounded-xl p-3 border border-gray-800">
                <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {/* CPU Chart */}
          <div>
            <p className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-warning-400" />CPU Utilization (%) — Last 2 Hours</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetry}>
                  <defs>
                    <linearGradient id="instCpuGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                  <XAxis dataKey="time" stroke="#6b7280" fontSize={9} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={9} unit="%" domain={[0, 100]} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="cpu" stroke="#f59e0b" strokeWidth={2} fill="url(#instCpuGrad)" name="CPU %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Disk IOPS Bar Chart */}
          <div>
            <p className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-purple-400" />Disk IOPS (Read / Write)</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={telemetry} barSize={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                  <XAxis dataKey="time" stroke="#6b7280" fontSize={9} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={9} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="readIops" name="Read IOPS" fill="#818cf8" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="writeIops" name="Write IOPS" fill="#a78bfa" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Create CloudWatch Alarm Modal ────────────────────────────────────────────

function CreateAlarmModal({ onClose, onCreated }: { onClose: () => void; onCreated: (alarm: CloudWatchAlarm) => void }) {
  const [name, setName] = useState('');
  const [metric, setMetric] = useState('CPUUtilization');
  const [threshold, setThreshold] = useState('80');
  const [period, setPeriod] = useState('300s');
  const [creating, setCreating] = useState(false);

  const METRIC_OPTIONS: Record<string, string> = {
    CPUUtilization: 'CPUUtilization > {t}%',
    MemoryUtilization: 'MemoryUtilization > {t}%',
    'TargetResponseTime': 'TargetResponseTime > {t}ms',
    'NetworkIn': 'NetworkIn > {t} MB/s',
    DiskReadOps: 'DiskReadOps > {t} IOPS',
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    await new Promise((r) => setTimeout(r, 500));
    const newAlarm: CloudWatchAlarm = {
      id: `alm-${Date.now()}`,
      name: name.trim(),
      metric: METRIC_OPTIONS[metric].replace('{t}', threshold),
      threshold: `${threshold} (${period} avg)`,
      state: 'OK',
      period,
    };
    onCreated(newAlarm);
    setCreating(false);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-warning-400" />
            <span className="text-sm font-bold text-gray-100">Create CloudWatch Alarm</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Alarm Name *</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. High-Inference-Latency-Alert"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-700 bg-gray-950 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-warning-500/40"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Metric Name</label>
            <select value={metric} onChange={(e) => setMetric(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none">
              {Object.keys(METRIC_OPTIONS).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Threshold Value</label>
              <input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Evaluation Period</label>
              <select value={period} onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none">
                <option value="60s">60s (1 min)</option>
                <option value="300s">300s (5 min)</option>
                <option value="3600s">3600s (1 hour)</option>
                <option value="86400s">86400s (24 hours)</option>
              </select>
            </div>
          </div>
          <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 text-xs text-gray-400">
            <span className="font-semibold text-warning-400">Condition Preview:</span> ALARM when{' '}
            <span className="font-mono text-gray-200">{METRIC_OPTIONS[metric].replace('{t}', threshold)}</span>{' '}
            for <span className="font-mono text-gray-200">{period}</span> average.
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 py-2 text-xs text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800">Cancel</button>
            <button onClick={handleCreate} disabled={creating || !name.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-warning-500 hover:bg-warning-400 text-gray-950 disabled:opacity-50 flex items-center gap-2">
              {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
              {creating ? 'Creating...' : 'Create Alarm'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Add Security Group Rule Modal ────────────────────────────────────────────

function AddRuleModal({ sgId, sgName, onClose, onAdded }: { sgId: string; sgName: string; onClose: () => void; onAdded: (sgId: string, rule: SecurityGroupRule) => void }) {
  const [ruleType, setRuleType] = useState<'Inbound' | 'Outbound'>('Inbound');
  const [protocol, setProtocol] = useState('TCP');
  const [portRange, setPortRange] = useState('');
  const [source, setSource] = useState('0.0.0.0/0');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!portRange.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    const newRule: SecurityGroupRule = {
      id: `r-${Date.now()}`,
      type: ruleType,
      protocol,
      portRange: portRange.trim(),
      source: source.trim(),
      description: description.trim() || `${ruleType} ${protocol}:${portRange}`,
    };
    onAdded(sgId, newRule);
    setSaving(false);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-warning-400" />
            <span className="text-sm font-bold text-gray-100">Add Rule — {sgName}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Rule Direction</label>
              <select value={ruleType} onChange={(e) => setRuleType(e.target.value as 'Inbound' | 'Outbound')}
                className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none">
                <option value="Inbound">Inbound</option>
                <option value="Outbound">Outbound</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Protocol</label>
              <select value={protocol} onChange={(e) => setProtocol(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none">
                <option>TCP</option>
                <option>UDP</option>
                <option>ICMP</option>
                <option>All</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Port Range *</label>
            <input type="text" value={portRange} onChange={(e) => setPortRange(e.target.value)}
              placeholder="e.g. 8000, 443, 8080-8090, All"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-700 bg-gray-950 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-warning-500/40" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Source / Destination (CIDR or SG ID)</label>
            <input type="text" value={source} onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. 0.0.0.0/0 or sg-mlops-inference-prod"
              className="w-full px-3.5 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. ML Inference API public access"
              className="w-full px-3.5 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 py-2 text-xs text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800">Cancel</button>
            <button onClick={handleSave} disabled={saving || !portRange.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-warning-500 hover:bg-warning-400 text-gray-950 disabled:opacity-50 flex items-center gap-2">
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {saving ? 'Adding...' : 'Add Rule'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Create Security Group Modal ──────────────────────────────────────────────

function CreateSecurityGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: (sg: SecurityGroup) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    await new Promise((r) => setTimeout(r, 500));
    const newSg: SecurityGroup = {
      id: `sg-${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20)}`,
      name: name.trim(),
      description: description.trim() || `Security group for ${name.trim()}`,
      vpcId: 'vpc-0a1b2c3d4e5f',
      rules: [
        { id: `r-${Date.now()}`, type: 'Outbound', protocol: 'All', portRange: 'All', source: '0.0.0.0/0', description: 'Allow all outbound traffic' },
      ],
    };
    onCreated(newSg);
    setCreating(false);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-warning-400" />
            <span className="text-sm font-bold text-gray-100">Create Security Group</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Security Group Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ml-api-gateway-sg"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-700 bg-gray-950 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-warning-500/40" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Controls access to ML inference endpoints"
              className="w-full px-3.5 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none" />
          </div>
          <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 text-xs text-gray-400">
            <span className="font-semibold text-warning-400">VPC:</span> vpc-0a1b2c3d4e5f (MLOps Production VPC). A default outbound allow-all rule will be created automatically.
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 py-2 text-xs text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800">Cancel</button>
            <button onClick={handleCreate} disabled={creating || !name.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-warning-500 hover:bg-warning-400 text-gray-950 disabled:opacity-50 flex items-center gap-2">
              {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {creating ? 'Creating...' : 'Create Security Group'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ─── Modal 1: Launch EC2 Instance Wizard ──────────────────────────────────────

function LaunchInstanceModal({
  onClose,
  onLaunched,
}: {
  onClose: () => void;
  onLaunched: (instance: AWSEC2Instance) => void;
}) {
  const [name, setName] = useState('ml-inference-worker-03');
  const [ami, setAmi] = useState('pytorch');
  const [type, setType] = useState('g4dn.xlarge');
  const [region, setRegion] = useState('us-east-1a');
  const [diskGb, setDiskGb] = useState('50');
  const [launching, setLaunching] = useState(false);

  const AMI_OPTIONS: Record<string, { label: string; desc: string; isGpu?: boolean }> = {
    pytorch: { label: 'Deep Learning OSS AMI (PyTorch 2.2 / CUDA 12.2)', desc: 'Optimized for high-throughput GPU model inference', isGpu: true },
    ubuntu: { label: 'Ubuntu 22.04 LTS (Jammy Jellyfish)', desc: 'General purpose Linux distribution with Docker & Python' },
    amzn: { label: 'Amazon Linux 2023', desc: 'Secure, high performance Linux distro optimized for AWS' },
  };

  const handleLaunch = async () => {
    if (!name.trim()) return;
    setLaunching(true);
    await new Promise((r) => setTimeout(r, 900));

    const randomSuffix = Math.random().toString(16).substring(2, 8);
    const pubIp = `54.210.${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 200) + 10}`;
    const privIp = `172.31.${Math.floor(Math.random() * 50) + 10}.${Math.floor(Math.random() * 200) + 10}`;

    const newInst: AWSEC2Instance = {
      id: `ec2-${Date.now()}`,
      instanceId: `i-0${randomSuffix}7a`,
      name: name.trim(),
      type,
      state: 'running',
      publicIP: pubIp,
      privateIP: privIp,
      region,
      appUrl: `http://${pubIp}:8080`,
      ami: AMI_OPTIONS[ami].label,
      securityGroup: 'sg-mlops-inference-prod',
      vpcId: 'vpc-0a1b2c3d4e5f',
      uptime: 'Just launched',
      isGpu: AMI_OPTIONS[ami].isGpu,
    };

    onLaunched(newInst);
    setLaunching(false);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-4 h-4 text-warning-400" />
            <span className="text-sm font-bold text-gray-100">Launch New EC2 Instance</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Instance Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-700 bg-gray-950 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              placeholder="e.g. ml-inference-worker-03"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Amazon Machine Image (AMI)</label>
            <select
              value={ami}
              onChange={(e) => setAmi(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none"
            >
              {Object.entries(AMI_OPTIONS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">{AMI_OPTIONS[ami].desc}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Instance Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none"
              >
                <option value="g4dn.xlarge">g4dn.xlarge (1x T4 GPU, 16GB, 4 vCPU)</option>
                <option value="p3.2xlarge">p3.2xlarge (1x V100 GPU, 61GB, 8 vCPU)</option>
                <option value="t3.medium">t3.medium (4GB, 2 vCPU)</option>
                <option value="c5.xlarge">c5.xlarge (Compute Opt, 8GB, 4 vCPU)</option>
                <option value="r6i.large">r6i.large (Mem Opt, 16GB, 2 vCPU)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Availability Zone</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none"
              >
                <option value="us-east-1a">us-east-1a (N. Virginia)</option>
                <option value="us-east-1b">us-east-1b (N. Virginia)</option>
                <option value="us-east-1c">us-east-1c (N. Virginia)</option>
                <option value="us-west-2a">us-west-2a (Oregon)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Root EBS Volume (gp3)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={diskGb}
                  onChange={(e) => setDiskGb(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none"
                />
                <span className="text-xs text-gray-400">GB</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Security Group</label>
              <input
                type="text"
                readOnly
                value="sg-mlops-inference-prod"
                className="w-full px-3 py-2 rounded-lg border border-gray-800 bg-gray-950/60 text-xs text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 text-xs space-y-1 text-gray-300">
            <p className="font-semibold text-warning-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Instant EC2 Provisioning
            </p>
            <p className="text-[11px] text-gray-400">
              Instance will be allocated public IPv4, attached to VPC <code className="text-primary-400">vpc-0a1b2c3d4e5f</code>, and started immediately.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-xs text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleLaunch}
              disabled={launching || !name.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-warning-500 hover:bg-warning-400 text-gray-950 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {launching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {launching ? 'Launching...' : 'Launch Instance'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Modal 2: EC2 SSH Web Terminal Emulator ───────────────────────────────────

function EC2SSHConnectModal({
  instance,
  onClose,
}: {
  instance: AWSEC2Instance;
  onClose: () => void;
}) {
  const [history, setHistory] = useState<string[]>([
    `Welcome to Ubuntu 22.04.4 LTS (GNU/Linux 6.5.0-1014-aws x86_64)`,
    ` * Documentation:  https://help.ubuntu.com`,
    ` * Management:     https://landscape.canonical.com`,
    ` * Support:        https://ubuntu.com/advantage`,
    ``,
    `System information as of ${new Date().toUTCString()}`,
    `  System load:  0.18               Processes:             142`,
    `  Usage of /:   28.4% of 48.29GB   Users logged in:       1`,
    `  Memory usage: 22%                IPv4 address for eth0: ${instance.privateIP}`,
    `  Public IP:    ${instance.publicIP}`,
    ``,
    instance.isGpu ? `[NVIDIA GPU] Driver: 535.129.03 | CUDA Version: 12.2 | GPU 0: NVIDIA A10G / T4 detected.` : `Type 'help' for available commands. Try 'docker ps', 'uptime', 'free -h', 'nvidia-smi'`,
    `--------------------------------------------------------------------------------`,
  ]);
  const [command, setCommand] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    const cmd = command.trim();
    const cmdLine = `ec2-user@${instance.name}:~$ ${cmd}`;
    let output = '';

    if (cmd === 'help') {
      output = `Available demo commands:
  nvidia-smi   - Display NVIDIA GPU status & memory
  docker ps    - Show active MLOps docker containers
  uname -a     - Display Linux kernel version
  free -h      - Check RAM utilization
  uptime       - System uptime and load average
  ls -la       - List directory contents
  clear        - Clear terminal screen`;
    } else if (cmd === 'clear') {
      setHistory([]);
      setCommand('');
      return;
    } else if (cmd.startsWith('nvidia-smi')) {
      output = instance.isGpu
        ? `+-----------------------------------------------------------------------------+
| NVIDIA-SMI 535.129.03             Driver Version: 535.129.03   CUDA: 12.2   |
|-------------------------------+----------------------+----------------------+
| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
|===============================+======================+======================|
|   0  Tesla T4            On   | 00000000:00:1E.0 Off |                    0 |
| N/A   46C    P0    29W /  70W |   3140MiB / 15360MiB |     24%      Default |
+-------------------------------+----------------------+----------------------+
| Processes:                                                                  |
|  GPU   GI   CI        PID   Type   Process name                  GPU Memory |
|    0   N/A  N/A      4182      C   python3 torchserve_runner.py      3128MiB |
+-----------------------------------------------------------------------------+`
        : `NVIDIA-SMI: command not found (Instance type ${instance.type} does not have an attached GPU).`;
    } else if (cmd.startsWith('docker ps')) {
      output = `CONTAINER ID   IMAGE                                COMMAND                  STATUS          PORTS
a1b2c3d4e5f6   pytorch/torchserve:0.9.0-cpu         "torchserve --start …"   Up 14 days      0.0.0.0:8080->8080/tcp
f6e5d4c3b2a1   redis:7.2-alpine                     "docker-entrypoint.s…"   Up 28 days      0.0.0.0:6379->6379/tcp
998877665544   ghcr.io/mlops/pipeline:v2.4.1        "uvicorn main:app --…"   Up 3 days       0.0.0.0:8000->8000/tcp`;
    } else if (cmd.startsWith('uname')) {
      output = `Linux ip-${instance.privateIP.replace(/\./g, '-')} 6.5.0-1014-aws #14~22.04.1-Ubuntu SMP x86_64 x86_64 x86_64 GNU/Linux`;
    } else if (cmd.startsWith('free')) {
      output = `               total        used        free      shared  buff/cache   available
Mem:            15Gi       3.4Gi        10Gi       182Mi       2.1Gi        11Gi
Swap:             0B          0B          0B`;
    } else if (cmd.startsWith('uptime')) {
      output = ` 14:48:10 up ${instance.uptime},  2 users,  load average: 0.18, 0.22, 0.19`;
    } else if (cmd.startsWith('ls')) {
      output = `total 44
drwxr-xr-x 6 ec2-user ec2-user 4096 Sep 20 14:32 .
drwxr-xr-x 3 root     root     4096 Sep 01 10:00 ..
-rw-r--r-- 1 ec2-user ec2-user  220 Sep 01 10:00 .bash_logout
-rw-r--r-- 1 ec2-user ec2-user 3771 Sep 01 10:00 .bashrc
drwxr-xr-x 3 ec2-user ec2-user 4096 Sep 20 14:30 checkpoints
drwxr-xr-x 2 ec2-user ec2-user 4096 Sep 20 14:31 logs
-rw-r--r-- 1 ec2-user ec2-user 1482 Sep 20 14:28 model_config.yaml
drwxr-xr-x 4 ec2-user ec2-user 4096 Sep 20 14:32 torchserve`;
    } else {
      output = `ec2-user: ${cmd}: command executed successfully with exit code 0.`;
    }

    setHistory((prev) => [...prev, cmdLine, output]);
    setCommand('');
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl bg-black border border-gray-800 rounded-2xl shadow-2xl flex flex-col h-[600px] overflow-hidden">
        {/* Terminal Titlebar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-950 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-error-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-warning-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-success-500/80 inline-block" />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-gray-300">
              <Terminal className="w-3.5 h-3.5 text-warning-400" />
              <span>ec2-user@{instance.publicIP}</span>
              <span className="text-gray-500">({instance.instanceId} · {instance.type})</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Terminal Screen */}
        <div className="flex-1 p-5 overflow-y-auto font-mono text-xs text-gray-200 space-y-1.5 bg-gray-950/90 select-text">
          {history.map((line, i) => (
            <pre key={i} className="whitespace-pre-wrap leading-relaxed text-gray-300 font-mono">
              {line}
            </pre>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Command Input */}
        <form onSubmit={handleExecute} className="flex items-center px-4 py-3 bg-gray-900 border-t border-gray-800">
          <span className="text-xs font-mono text-success-400 font-semibold mr-2 shrink-0">
            ec2-user@{instance.name.split('-')[0]}:~$
          </span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Type command ('help', 'nvidia-smi', 'docker ps', 'uptime', 'free -h')..."
            autoFocus
            className="w-full bg-transparent text-xs font-mono text-gray-100 focus:outline-none placeholder-gray-600"
          />
        </form>
      </div>
    </div>,
    document.body
  );
}

// ─── Modal 3: EC2 Metadata Inspector ──────────────────────────────────────────

function EC2InspectModal({
  instance,
  onClose,
}: {
  instance: AWSEC2Instance;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const metadata = {
    InstanceId: instance.instanceId,
    InstanceType: instance.type,
    State: { Code: 16, Name: instance.state },
    PublicIpAddress: instance.publicIP,
    PrivateIpAddress: instance.privateIP,
    SubnetId: 'subnet-09f1a283b',
    VpcId: instance.vpcId,
    Architecture: 'x86_64',
    Hypervisor: 'nitro',
    ImageId: instance.ami.split(' ')[0],
    SecurityGroups: [{ GroupId: instance.securityGroup, GroupName: instance.securityGroup }],
    RootDeviceType: 'ebs',
    RootDeviceName: '/dev/xvda',
    BlockDeviceMappings: [
      { DeviceName: '/dev/xvda', Ebs: { VolumeId: 'vol-0a8b9c1d2e3f4a', VolumeSize: 50, VolumeType: 'gp3', DeleteOnTermination: true } },
    ],
    IamInstanceProfile: { Arn: 'arn:aws:iam::123456789012:instance-profile/MLOps-EC2-Role' },
    Placement: { AvailabilityZone: instance.region, Tenancy: 'default' },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <Code className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-bold text-gray-100">EC2 Instance Metadata ({instance.instanceId})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto font-mono text-xs">
          <pre className="p-4 bg-black text-gray-300 rounded-xl border border-gray-800/80 overflow-x-auto">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Modal 4: Create S3 Bucket ────────────────────────────────────────────────

function CreateBucketModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (bucket: S3Bucket) => void;
}) {
  const [name, setName] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [versioning, setVersioning] = useState(true);
  const [encryption, setEncryption] = useState('AES-256');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    await new Promise((r) => setTimeout(r, 600));

    const newBucket: S3Bucket = {
      name: name.trim().toLowerCase().replace(/[^a-z0-9-.]/g, '-'),
      region,
      creationDate: new Date().toISOString().split('T')[0],
      versioning,
      encryption,
      objects: [],
    };

    onCreated(newBucket);
    setCreating(false);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-warning-400" />
            <span className="text-sm font-bold text-gray-100">Create S3 Bucket</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Bucket Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. mlops-evaluation-results"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-700 bg-gray-950 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            />
            <p className="text-[11px] text-gray-500 mt-1">Bucket name must be globally unique across AWS.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">AWS Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none"
            >
              <option value="us-east-1">us-east-1 (US East, N. Virginia)</option>
              <option value="us-west-2">us-west-2 (US West, Oregon)</option>
              <option value="eu-west-1">eu-west-1 (Europe, Ireland)</option>
              <option value="ap-south-1">ap-south-1 (Asia Pacific, Mumbai)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-950 rounded-xl border border-gray-800">
            <div>
              <p className="text-xs font-semibold text-gray-200">Bucket Versioning</p>
              <p className="text-[11px] text-gray-400">Preserve, retrieve, and restore model weight versions</p>
            </div>
            <input
              type="checkbox"
              checked={versioning}
              onChange={(e) => setVersioning(e.target.checked)}
              className="w-4 h-4 rounded text-primary-600 bg-gray-900 border-gray-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Server-Side Encryption</label>
            <select
              value={encryption}
              onChange={(e) => setEncryption(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none"
            >
              <option value="AES-256">Amazon S3-managed keys (SSE-S3, AES-256)</option>
              <option value="AWS-KMS (aws/s3)">AWS Key Management Service (SSE-KMS)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-xs text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-warning-500 hover:bg-warning-400 text-gray-950 disabled:opacity-50 flex items-center gap-2"
            >
              {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {creating ? 'Creating...' : 'Create Bucket'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Modal 5: Upload Object to S3 ─────────────────────────────────────────────

function UploadS3ObjectModal({
  bucketName,
  onClose,
  onUploaded,
}: {
  bucketName: string;
  onClose: () => void;
  onUploaded: (object: S3Object) => void;
}) {
  const [fileName, setFileName] = useState('model_checkpoint_epoch_10.pt');
  const [folder, setFolder] = useState('models/v2/');
  const [fileSizeMb, setFileSizeMb] = useState('180');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!fileName.trim()) return;
    setUploading(true);
    await new Promise((r) => setTimeout(r, 700));

    const key = `${folder.trim()}${fileName.trim()}`;
    const newObj: S3Object = {
      key,
      size: (parseFloat(fileSizeMb) || 50) * 1024 * 1024,
      lastModified: new Date().toISOString().replace('T', ' ').substring(0, 16),
      storageClass: 'Standard',
    };

    onUploaded(newObj);
    setUploading(false);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <Upload className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-bold text-gray-100">Upload to S3 ({bucketName})</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Destination Prefix / Folder</label>
            <input
              type="text"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none"
              placeholder="e.g. checkpoints/v1/"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">File Name *</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-700 bg-gray-950 text-sm text-gray-100 focus:outline-none"
              placeholder="e.g. weights.bin or dataset.parquet"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Simulated Size (MB)</label>
            <input
              type="number"
              value={fileSizeMb}
              onChange={(e) => setFileSizeMb(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-xs text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800">
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || !fileName.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? 'Uploading...' : 'Upload Object'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main AWSPage Component ───────────────────────────────────────────────────

export default function AWSPage() {
  const [instances, setInstances] = useState<AWSEC2Instance[]>(INITIAL_EC2_INSTANCES);
  const [buckets, setBuckets] = useState<S3Bucket[]>(INITIAL_S3_BUCKETS);
  const [selectedBucketName, setSelectedBucketName] = useState<string>(INITIAL_S3_BUCKETS[0].name);
  const [securityGroups, setSecurityGroups] = useState<SecurityGroup[]>(INITIAL_SECURITY_GROUPS);
  const [alarms, setAlarms] = useState<CloudWatchAlarm[]>(INITIAL_CLOUDWATCH_ALARMS);
  const [telemetry] = useState(generateTelemetryData);

  type Tab = 'ec2' | 's3' | 'cloudwatch' | 'security';
  const [tab, setTab] = useState<Tab>('ec2');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modals state
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [sshTarget, setSshTarget] = useState<AWSEC2Instance | null>(null);
  const [inspectTarget, setInspectTarget] = useState<AWSEC2Instance | null>(null);
  const [metricsTarget, setMetricsTarget] = useState<AWSEC2Instance | null>(null);
  const [showCreateBucketModal, setShowCreateBucketModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateAlarmModal, setShowCreateAlarmModal] = useState(false);
  const [addRuleTarget, setAddRuleTarget] = useState<{ id: string; name: string } | null>(null);
  const [showCreateSgModal, setShowCreateSgModal] = useState(false);

  // Security Group mutations
  const handleAddRule = (sgId: string, rule: SecurityGroupRule) => {
    setSecurityGroups((prev) => prev.map((sg) => sg.id === sgId ? { ...sg, rules: [...sg.rules, rule] } : sg));
  };

  const handleDeleteRule = (sgId: string, ruleId: string) => {
    setSecurityGroups((prev) => prev.map((sg) => sg.id === sgId ? { ...sg, rules: sg.rules.filter((r) => r.id !== ruleId) } : sg));
  };

  const handleDeleteBucket = (bucketName: string) => {
    if (!confirm(`Delete bucket "${bucketName}" and all its objects? This cannot be undone.`)) return;
    setBuckets((prev) => prev.filter((b) => b.name !== bucketName));
    setSelectedBucketName((prev) => prev === bucketName ? (buckets.find((b) => b.name !== bucketName)?.name ?? '') : prev);
  };

  // Compute instance actions
  const toggleInstanceState = async (id: string, action: 'start' | 'stop' | 'reboot' | 'terminate') => {
    setActionLoading(`${action}-${id}`);
    await new Promise((r) => setTimeout(r, 600));

    if (action === 'terminate') {
      setInstances((prev) => prev.filter((i) => i.id !== id));
      setActionLoading(null);
      return;
    }

    setInstances((prev) =>
      prev.map((inst) => {
        if (inst.id !== id) return inst;
        if (action === 'start') {
          const rand = Math.floor(Math.random() * 200) + 10;
          return {
            ...inst,
            state: 'running' as Status,
            publicIP: inst.publicIP === '—' ? `54.210.${rand}.${rand}` : inst.publicIP,
            appUrl: inst.appUrl === '—' ? `http://54.210.${rand}.${rand}:8080` : inst.appUrl,
            uptime: 'Just started',
          };
        }
        if (action === 'stop') {
          return { ...inst, state: 'stopped' as Status, publicIP: '—', appUrl: '—', uptime: '—' };
        }
        return { ...inst, state: 'running' as Status, uptime: 'Rebooted just now' };
      })
    );
    setActionLoading(null);
  };

  // Filtered instances
  const filteredInstances = useMemo(() => {
    return instances.filter((inst) => {
      const matchRegion = regionFilter === 'all' || inst.region.startsWith(regionFilter);
      const matchSearch =
        inst.name.toLowerCase().includes(search.toLowerCase()) ||
        inst.instanceId.toLowerCase().includes(search.toLowerCase()) ||
        inst.type.toLowerCase().includes(search.toLowerCase());
      return matchRegion && matchSearch;
    });
  }, [instances, regionFilter, search]);

  const runningCount = instances.filter((e) => e.state === 'running').length;
  const gpuCount = instances.filter((e) => e.isGpu).length;
  const currentBucket = buckets.find((b) => b.name === selectedBucketName) || buckets[0];
  const totalS3Bytes = buckets.reduce((acc, b) => acc + b.objects.reduce((s, o) => s + o.size, 0), 0);

  const tabs: { id: Tab; label: string; icon: any; count?: number | string }[] = [
    { id: 'ec2', label: 'EC2 Compute Fleet', icon: Server, count: instances.length },
    { id: 's3', label: 'S3 Object Storage', icon: Database, count: buckets.length },
    { id: 'cloudwatch', label: 'CloudWatch Telemetry', icon: Activity, count: `${alarms.length} Alarms` },
    { id: 'security', label: 'Security Groups & VPC', icon: Shield, count: securityGroups.length },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-gray-100">
      {/* ── Top Header Banner ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-950 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-warning-500/10 text-warning-400 border border-warning-500/20 shadow-inner">
              <Cloud className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">AWS Cloud Infrastructure</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-success-500/10 text-success-400 border border-success-500/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse" />
                  Connected · IAM: MLOps-Admin
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 font-mono">
                Account: 123456789012 · Production MLOps VPC (vpc-0a1b2c3d) · Region: us-east-1
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowLaunchModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-warning-500 hover:bg-warning-400 text-gray-950 font-bold text-xs shadow-lg shadow-warning-500/10 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Launch EC2 Instance
            </button>
            <button
              onClick={() => setShowCreateBucketModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-xs border border-gray-700 transition-all"
            >
              <Database className="w-3.5 h-3.5 text-warning-400" /> New S3 Bucket
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary Stat Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4 border border-gray-200 dark:border-gray-800">
          <div className="p-3 rounded-xl bg-success-500/10 text-success-500 border border-success-500/20">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{runningCount}</span>
              <span className="text-xs text-gray-400">/ {instances.length} active</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Running EC2 Instances</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border border-gray-200 dark:border-gray-800">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{gpuCount}</span>
              <span className="text-xs text-purple-400 font-mono">T4 / V100</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">GPU ML Compute Nodes</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border border-gray-200 dark:border-gray-800">
          <div className="p-3 rounded-xl bg-warning-500/10 text-warning-400 border border-warning-500/20">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatBytes(totalS3Bytes)}</span>
              <span className="text-xs text-gray-400">in {buckets.length} buckets</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">S3 Stored Models &amp; Data</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border border-gray-200 dark:border-gray-800">
          <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">99.98%</span>
              <span className="text-xs text-success-400 font-semibold">Healthy</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Fleet SLA &amp; Telemetry</p>
          </div>
        </Card>
      </div>

      {/* ── Navigation Tabs ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800 overflow-x-auto pb-0">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                isActive
                  ? 'border-warning-500 text-warning-500 font-bold'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.count && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-warning-500/10 text-warning-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: EC2 Compute Fleet ─────────────────────────────────────────── */}
      {tab === 'ec2' && (
        <Card className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning-500/10 text-warning-400">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">EC2 Virtual Compute Fleet</h3>
                <p className="text-xs text-gray-400">
                  {filteredInstances.length} of {instances.length} instances shown
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search instances, IDs, types..."
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 w-48 sm:w-60 focus:outline-none focus:ring-1 focus:ring-warning-500/40"
                />
              </div>

              <div className="flex items-center gap-1.5 border border-gray-700 bg-gray-950 rounded-lg px-2.5 py-1.5">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="bg-transparent text-xs text-gray-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Regions</option>
                  <option value="us-east-1">us-east-1 (N. Virginia)</option>
                  <option value="us-west-2">us-west-2 (Oregon)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-950/40">
                  <th className="text-left px-5 py-3">Instance Name &amp; ID</th>
                  <th className="text-left px-5 py-3">Type &amp; Specs</th>
                  <th className="text-left px-5 py-3">Public IPv4</th>
                  <th className="text-left px-5 py-3">Private IP</th>
                  <th className="text-left px-5 py-3">Zone</th>
                  <th className="text-left px-5 py-3">App Service URL</th>
                  <th className="text-left px-5 py-3">State</th>
                  <th className="text-right px-5 py-3">Fleet Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstances.map((inst) => {
                  const isLoading = actionLoading?.includes(inst.id);
                  return (
                    <tr
                      key={inst.id}
                      className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 group transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-semibold text-xs text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                              {inst.name}
                              {inst.isGpu && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                  GPU
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-gray-400 font-mono">{inst.instanceId}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1 font-mono text-xs text-gray-300">
                          <Cpu className="w-3.5 h-3.5 text-warning-400" />
                          {inst.type}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-xs font-mono text-gray-300">{inst.publicIP}</td>

                      <td className="px-5 py-3.5 text-xs font-mono text-gray-400">{inst.privateIP}</td>

                      <td className="px-5 py-3.5 text-xs text-gray-300">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {inst.region}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        {inst.appUrl !== '—' ? (
                          <a
                            href={inst.appUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 hover:underline text-xs font-mono truncate max-w-[200px]"
                          >
                            <Globe className="w-3.5 h-3.5 shrink-0" />
                            {inst.appUrl.replace(/^https?:\/\//, '')}
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-gray-500 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <StatusBadge status={inst.state} size="sm" />
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                          {/* Metrics */}
                          {inst.state === 'running' && (
                            <button
                              onClick={() => setMetricsTarget(inst)}
                              title="View Live Metrics"
                              className="px-2 py-1 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-mono flex items-center gap-1 transition-colors border border-purple-500/20"
                            >
                              <BarChart2 className="w-3 h-3" /> Metrics
                            </button>
                          )}
                          {/* SSH Connect */}
                          {inst.state === 'running' && (
                            <button
                              onClick={() => setSshTarget(inst)}
                              title="Connect via SSH Terminal"
                              className="px-2 py-1 rounded-md bg-warning-500/10 hover:bg-warning-500/20 text-warning-400 text-xs font-mono flex items-center gap-1 transition-colors border border-warning-500/20"
                            >
                              <Terminal className="w-3 h-3" /> SSH
                            </button>
                          )}

                          {/* Inspect Details */}
                          <button
                            onClick={() => setInspectTarget(inst)}
                            title="Inspect Instance JSON Metadata"
                            className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
                          >
                            <Code className="w-3.5 h-3.5" />
                          </button>

                          {/* Start / Stop Toggle */}
                          {inst.state === 'running' ? (
                            <button
                              onClick={() => toggleInstanceState(inst.id, 'stop')}
                              disabled={isLoading}
                              title="Stop EC2 Instance"
                              className="p-1.5 rounded-md bg-error-500/10 hover:bg-error-500/20 text-error-400 transition-colors"
                            >
                              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleInstanceState(inst.id, 'start')}
                              disabled={isLoading}
                              title="Start EC2 Instance"
                              className="p-1.5 rounded-md bg-success-500/10 hover:bg-success-500/20 text-success-400 transition-colors"
                            >
                              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                            </button>
                          )}

                          {/* Reboot */}
                          <button
                            onClick={() => toggleInstanceState(inst.id, 'reboot')}
                            disabled={isLoading || inst.state !== 'running'}
                            title="Reboot Instance"
                            className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-200 disabled:opacity-30 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {/* Terminate */}
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to terminate instance ${inst.name} (${inst.instanceId})?`)) {
                                toggleInstanceState(inst.id, 'terminate');
                              }
                            }}
                            title="Terminate Instance"
                            className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-error-500/20 text-gray-500 hover:text-error-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── TAB 2: S3 Object Storage Explorer ─────────────────────────────────── */}
      {tab === 's3' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Buckets List */}
          <Card className="border border-gray-200 dark:border-gray-800 p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-warning-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">S3 Buckets ({buckets.length})</h3>
              </div>
              <button
                onClick={() => setShowCreateBucketModal(true)}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> New
              </button>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800/60 max-h-[500px] overflow-y-auto">
              {buckets.map((b) => {
                const isSelected = b.name === selectedBucketName;
                const size = b.objects.reduce((s, o) => s + o.size, 0);
                return (
                  <div
                    key={b.name}
                    onClick={() => setSelectedBucketName(b.name)}
                    className={`p-4 cursor-pointer transition-colors group/bucket ${
                      isSelected
                        ? 'bg-warning-500/10 border-l-4 border-l-warning-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <p className="font-mono text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{b.name}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-gray-400 font-mono">{b.region}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteBucket(b.name); }}
                          title="Delete bucket"
                          className="p-0.5 rounded text-gray-600 hover:text-error-400 opacity-0 group-hover/bucket:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-gray-400">
                      <span>{b.objects.length} objects · {formatBytes(size)}</span>
                      <span className="text-warning-400 font-semibold">{b.encryption.split(' ')[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Bucket Objects Explorer */}
          <Card className="lg:col-span-2 border border-gray-200 dark:border-gray-800 p-0 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-warning-400" />
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100 font-mono">
                    s3://{currentBucket.name}/
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Region: {currentBucket.region} · Encryption: {currentBucket.encryption} · Versioning: {currentBucket.versioning ? 'Enabled' : 'Suspended'}
                </p>
              </div>

              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition-colors"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Object
              </button>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-950/40">
                    <th className="text-left px-5 py-3">Object Key Name</th>
                    <th className="text-left px-5 py-3">Storage Class</th>
                    <th className="text-left px-5 py-3">Size</th>
                    <th className="text-left px-5 py-3">Last Modified</th>
                    <th className="text-right px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBucket.objects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-gray-400 text-sm">
                        No objects stored in this bucket.
                      </td>
                    </tr>
                  ) : (
                    currentBucket.objects.map((obj) => (
                      <tr
                        key={obj.key}
                        className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 group"
                      >
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-2 font-mono text-xs text-gray-200">
                            <File className="w-3.5 h-3.5 text-primary-400" />
                            {obj.key}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 rounded bg-gray-800 text-[10px] text-gray-300 font-mono">
                            {obj.storageClass}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-300 font-mono">{formatBytes(obj.size)}</td>
                        <td className="px-5 py-3 text-xs text-gray-400">{obj.lastModified}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => alert(`Simulated download starting for ${obj.key}`)}
                              title="Download Object"
                              className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setBuckets((prev) =>
                                  prev.map((b) =>
                                    b.name === currentBucket.name
                                      ? { ...b, objects: b.objects.filter((o) => o.key !== obj.key) }
                                      : b
                                  )
                                );
                              }}
                              title="Delete Object"
                              className="p-1.5 rounded-md bg-error-500/10 hover:bg-error-500/20 text-error-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 3: CloudWatch Telemetry & Metrics ──────────────────────────────── */}
      {tab === 'cloudwatch' && (
        <div className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CPU Utilization Area Chart */}
            <Card className="border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-warning-400" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">EC2 Fleet CPU Utilization (%)</h3>
                    <p className="text-xs text-gray-400">10-minute average across all running compute nodes</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-warning-400">42.8% Current</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={telemetry}>
                    <defs>
                      <linearGradient id="awsCpuGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                    <XAxis dataKey="time" stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} unit="%" domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="cpu" stroke="#f59e0b" strokeWidth={2} fill="url(#awsCpuGrad)" name="CPU %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Network In/Out Line Chart */}
            <Card className="border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary-400" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Network Throughput (MB/s)</h3>
                    <p className="text-xs text-gray-400">Real-time NetworkIn and NetworkOut transfer rate</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-blue-400">In: 28.4 MB/s</span>
                  <span className="text-emerald-400">Out: 19.1 MB/s</span>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={telemetry}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                    <XAxis dataKey="time" stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} unit="MB/s" />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="networkIn" stroke="#38bdf8" strokeWidth={2} dot={false} name="Network In" />
                    <Line type="monotone" dataKey="networkOut" stroke="#10b981" strokeWidth={2} dot={false} name="Network Out" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Disk IOPS Bar Chart */}
          <Card className="border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-purple-400" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Disk I/O Operations (IOPS)</h3>
                  <p className="text-xs text-gray-400">Aggregate EBS Read / Write throughput across fleet</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-indigo-400">Read: {telemetry[telemetry.length - 1]?.readIops ?? 0} IOPS</span>
                <span className="text-violet-400">Write: {telemetry[telemetry.length - 1]?.writeIops ?? 0} IOPS</span>
              </div>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={telemetry} barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                  <XAxis dataKey="time" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', color: '#9ca3af' }} />
                  <Bar dataKey="readIops" name="Read IOPS" fill="#818cf8" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="writeIops" name="Write IOPS" fill="#a78bfa" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* CloudWatch Alarms Table */}
          <Card className="border border-gray-200 dark:border-gray-800 p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">CloudWatch Alarms &amp; SLA Triggers</h3>
              </div>
              <button
                onClick={() => setShowCreateAlarmModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning-500/10 hover:bg-warning-500/20 text-warning-400 text-xs font-semibold border border-warning-500/20 transition-colors"
              >
                <Bell className="w-3.5 h-3.5" /> Create Alarm
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-950/40">
                    <th className="text-left px-5 py-3">Alarm Name</th>
                    <th className="text-left px-5 py-3">Metric Condition</th>
                    <th className="text-left px-5 py-3">Threshold</th>
                    <th className="text-left px-5 py-3">Period</th>
                    <th className="text-left px-5 py-3">State</th>
                    <th className="text-right px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {alarms.map((alm) => (
                    <tr key={alm.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-5 py-3 font-semibold text-xs text-gray-200">{alm.name}</td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-400">{alm.metric}</td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-300">{alm.threshold}</td>
                      <td className="px-5 py-3 text-xs text-gray-400">{alm.period}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            alm.state === 'OK'
                              ? 'bg-success-500/10 text-success-400 border border-success-500/20'
                              : 'bg-error-500/10 text-error-400 border border-error-500/20 animate-pulse'
                          }`}
                        >
                          {alm.state}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setAlarms((prev) =>
                                prev.map((a) => (a.id === alm.id ? { ...a, state: a.state === 'OK' ? 'ALARM' : 'OK' } : a))
                              );
                            }}
                            className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition-colors"
                          >
                            {alm.state === 'ALARM' ? 'Reset to OK' : 'Trigger ALARM'}
                          </button>
                          <button
                            onClick={() => setAlarms((prev) => prev.filter((a) => a.id !== alm.id))}
                            title="Delete alarm"
                            className="p-1.5 rounded bg-error-500/10 hover:bg-error-500/20 text-error-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 4: Security Groups & VPC ──────────────────────────────────────── */}
      {tab === 'security' && (
        <div className="space-y-6">

          {/* VPC Architecture Diagram */}
          <Card className="border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-warning-400" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">VPC Architecture — MLOps Production Network</h3>
                  <p className="text-xs text-gray-400 font-mono">vpc-0a1b2c3d4e5f · CIDR: 172.31.0.0/16 · Region: us-east-1</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-500/10 text-success-400 border border-success-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse" /> Active
              </span>
            </div>
            <div className="relative overflow-x-auto">
              <div className="min-w-[640px] p-4 bg-gray-950 rounded-xl border border-gray-800 font-mono text-xs">
                {/* VPC boundary */}
                <div className="border-2 border-warning-500/30 rounded-xl p-4 relative">
                  <span className="absolute -top-2.5 left-4 bg-gray-950 px-2 text-[10px] font-bold text-warning-400">VPC: vpc-0a1b2c3d4e5f (172.31.0.0/16)</span>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Public Subnet */}
                    <div className="border border-blue-500/30 rounded-lg p-3 bg-blue-500/5">
                      <p className="text-[10px] font-bold text-blue-400 mb-2">Public Subnet — 172.31.0.0/20</p>
                      <div className="space-y-1.5">
                        {[{ name: 'ml-inference-torchserve-01', ip: '172.31.18.42', type: 'g4dn.xlarge' },
                          { name: 'batch-inference-scheduler', ip: '172.31.8.77', type: 'c5.xlarge' }].map((n) => (
                          <div key={n.name} className="bg-gray-900 rounded p-2 border border-gray-800">
                            <p className="text-[9px] text-gray-200 font-semibold truncate">{n.name}</p>
                            <p className="text-[9px] text-gray-400 font-mono">{n.ip} · {n.type}</p>
                          </div>
                        ))}
                        <div className="bg-warning-500/10 rounded p-2 border border-warning-500/20 text-center">
                          <p className="text-[9px] text-warning-400 font-bold">Internet Gateway</p>
                          <p className="text-[9px] text-gray-400">0.0.0.0/0 → Internet</p>
                        </div>
                      </div>
                    </div>
                    {/* Private Subnet */}
                    <div className="border border-purple-500/30 rounded-lg p-3 bg-purple-500/5">
                      <p className="text-[10px] font-bold text-purple-400 mb-2">Private Subnet — 172.31.32.0/20</p>
                      <div className="space-y-1.5">
                        {[{ name: 'model-training-gpu-node-01', ip: '172.31.40.88', type: 'p3.2xlarge' },
                          { name: 'ml-feature-store-redis', ip: '172.31.24.19', type: 'r6i.large' },
                          { name: 'postgres-feature-store', ip: '172.31.12.10', type: 'RDS-equivalent' }].map((n) => (
                          <div key={n.name} className="bg-gray-900 rounded p-2 border border-gray-800">
                            <p className="text-[9px] text-gray-200 font-semibold truncate">{n.name}</p>
                            <p className="text-[9px] text-gray-400 font-mono">{n.ip} · {n.type}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Services */}
                    <div className="border border-emerald-500/30 rounded-lg p-3 bg-emerald-500/5">
                      <p className="text-[10px] font-bold text-emerald-400 mb-2">AWS Managed Services</p>
                      <div className="space-y-1.5">
                        {[
                          { name: 'S3: ml-model-checkpoints-prod', icon: '🪣' },
                          { name: 'CloudWatch: Metrics & Alarms', icon: '📊' },
                          { name: 'IAM: MLOps-Admin Role', icon: '🔒' },
                          { name: 'Route53: DNS Resolution', icon: '🌐' },
                        ].map((s) => (
                          <div key={s.name} className="bg-gray-900 rounded p-2 border border-gray-800">
                            <p className="text-[9px] text-gray-200">{s.icon} {s.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Flow arrows */}
                  <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-center gap-6 text-[9px] text-gray-500">
                    <span className="flex items-center gap-1"><ArrowRightLeft className="w-3 h-3 text-blue-400" /> Internet ↔ Public Subnet (Port 8000, 443, 8080)</span>
                    <span className="flex items-center gap-1"><ArrowRightLeft className="w-3 h-3 text-purple-400" /> Public ↔ Private (Port 6379, 5432, 29500)</span>
                    <span className="flex items-center gap-1"><ArrowRightLeft className="w-3 h-3 text-emerald-400" /> Private ↔ AWS Services (VPC Endpoint)</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Security Group Management Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-warning-400" /> Security Groups ({securityGroups.length})
            </h3>
            <button
              onClick={() => setShowCreateSgModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-warning-500/10 hover:bg-warning-500/20 text-warning-400 text-xs font-semibold border border-warning-500/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Create Security Group
            </button>
          </div>

          {securityGroups.map((sg) => (
            <Card key={sg.id} className="border border-gray-200 dark:border-gray-800 p-0 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-900/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-warning-400" />
                    <span className="font-bold text-xs text-gray-100 font-mono">{sg.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">({sg.id})</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{sg.description} · VPC: {sg.vpcId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-gray-800 text-[10px] text-gray-300 font-mono">
                    {sg.rules.length} Rules
                  </span>
                  <button
                    onClick={() => setAddRuleTarget({ id: sg.id, name: sg.name })}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-warning-500/10 hover:bg-warning-500/20 text-warning-400 text-[10px] font-semibold border border-warning-500/20 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Rule
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-950/40">
                      <th className="text-left px-5 py-2.5">Rule Type</th>
                      <th className="text-left px-5 py-2.5">Protocol</th>
                      <th className="text-left px-5 py-2.5">Port Range</th>
                      <th className="text-left px-5 py-2.5">Source / CIDR</th>
                      <th className="text-left px-5 py-2.5">Description</th>
                      <th className="text-right px-5 py-2.5">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sg.rules.map((r) => (
                      <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800/40 hover:bg-gray-800/20">
                        <td className="px-5 py-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              r.type === 'Inbound' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                            }`}
                          >
                            {r.type}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-xs font-mono text-gray-300">{r.protocol}</td>
                        <td className="px-5 py-2.5 text-xs font-mono text-warning-400 font-bold">{r.portRange}</td>
                        <td className="px-5 py-2.5 text-xs font-mono text-gray-300">{r.source}</td>
                        <td className="px-5 py-2.5 text-xs text-gray-400">{r.description}</td>
                        <td className="px-5 py-2.5 text-right">
                          <button
                            onClick={() => handleDeleteRule(sg.id, r.id)}
                            title="Delete rule"
                            className="p-1 rounded bg-error-500/10 hover:bg-error-500/20 text-error-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {showLaunchModal && (
        <LaunchInstanceModal
          onClose={() => setShowLaunchModal(false)}
          onLaunched={(newInst) => setInstances((prev) => [newInst, ...prev])}
        />
      )}

      {sshTarget && (
        <EC2SSHConnectModal
          instance={sshTarget}
          onClose={() => setSshTarget(null)}
        />
      )}

      {inspectTarget && (
        <EC2InspectModal
          instance={inspectTarget}
          onClose={() => setInspectTarget(null)}
        />
      )}

      {metricsTarget && (
        <InstanceMetricsModal
          instance={metricsTarget}
          telemetry={telemetry}
          onClose={() => setMetricsTarget(null)}
        />
      )}

      {showCreateAlarmModal && (
        <CreateAlarmModal
          onClose={() => setShowCreateAlarmModal(false)}
          onCreated={(alarm) => setAlarms((prev) => [...prev, alarm])}
        />
      )}

      {addRuleTarget && (
        <AddRuleModal
          sgId={addRuleTarget.id}
          sgName={addRuleTarget.name}
          onClose={() => setAddRuleTarget(null)}
          onAdded={handleAddRule}
        />
      )}

      {showCreateSgModal && (
        <CreateSecurityGroupModal
          onClose={() => setShowCreateSgModal(false)}
          onCreated={(newSg) => setSecurityGroups((prev) => [...prev, newSg])}
        />
      )}

      {showCreateBucketModal && (
        <CreateBucketModal
          onClose={() => setShowCreateBucketModal(false)}
          onCreated={(newBucket) => {
            setBuckets((prev) => [newBucket, ...prev]);
            setSelectedBucketName(newBucket.name);
          }}
        />
      )}

      {showUploadModal && (
        <UploadS3ObjectModal
          bucketName={currentBucket.name}
          onClose={() => setShowUploadModal(false)}
          onUploaded={(newObj) => {
            setBuckets((prev) =>
              prev.map((b) =>
                b.name === currentBucket.name ? { ...b, objects: [newObj, ...b.objects] } : b
              )
            );
          }}
        />
      )}
    </div>
  );
}
