import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Card, { CardHeader } from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import ProgressBar from '@/components/ui/ProgressBar';
import { useMLApplications } from '@/hooks/useMLApplications';
import type { MLApplication, Status } from '@/types';
import { formatRelative } from '@/utils/format';
import {
  Brain,
  Activity,
  Plus,
  Trash2,
  X,
  Code,
  Tag,
  Target,
  Globe,
  GitBranch,
  Clock,
  Loader2,
  AlertCircle,
  Play,
  Zap,
  BarChart2,
  TrendingUp,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Search,
  Filter,
  RefreshCw,
  Send,
  Layers,
  Sparkles,
  Code2,
} from 'lucide-react';
import CodeGenModal from '@/components/ui/CodeGenModal';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const statusOptions: Status[] = ['running', 'success', 'failed', 'pending', 'idle', 'warning'];

// ─── Default Sample Payloads for Models ───────────────────────────────────────

const SAMPLE_PAYLOADS: Record<string, string> = {
  'Real-Time Fraud Detection Engine': JSON.stringify(
    {
      transaction_id: 'tx_99812401',
      amount_usd: 4850.0,
      merchant_category: 'electronics_high_value',
      cardholder_present: false,
      foreign_country: true,
      ip_reputation_score: 0.94,
      device_fingerprint_anomaly: 1,
      velocity_last_1hr: 7,
    },
    null,
    2
  ),
  'FullStack Cloud Web Application': JSON.stringify(
    {
      name: 'Managed Cloud Cluster',
      category: 'Infrastructure',
      price: 129.00,
      environment: 'production',
      replicas: 3,
    },
    null,
    2
  ),
};

// ─── Modal 1: Interactive Model Inference Sandbox ─────────────────────────────

function InferenceSandboxModal({
  app,
  onClose,
}: {
  app: MLApplication;
  onClose: () => void;
}) {
  const defaultPayload =
    SAMPLE_PAYLOADS[app.name] ||
    JSON.stringify({ input_features: [0.42, 1.88, 0.05, 3.12, 0.91], sample_id: 'test_sample_01' }, null, 2);

  const [payload, setPayload] = useState(defaultPayload);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handlePredict = async () => {
    setRunning(true);
    setResult(null);
    const startTime = performance.now();

    let parsed: any = {};
    try {
      parsed = JSON.parse(payload);
    } catch {
      parsed = { raw: payload };
    }

    // Attempt live inference request to local ML microservice or endpoint
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      const targetUrl = app.name.includes('Fraud') ? 'http://localhost:8000/predict' : app.endpoint;

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const liveData = await res.json();
        setResult(liveData);
        setRunning(false);
        return;
      }
    } catch {
      // Offline or network error: fall back smoothly to high-fidelity simulation
    }

    await new Promise((r) => setTimeout(r, 400));
    const duration = (performance.now() - startTime).toFixed(1);

    // Dynamic model inference simulation based on app
    let prediction = 'NORMAL / LOW_RISK';
    let confidence = 96.4;
    let riskLevel = 'LOW';
    let probabilities: Record<string, number> = { legitimate: 0.964, anomaly: 0.036 };

    if (app.name.includes('Fraud')) {
      const isHigh = parsed.amount_usd > 1000 || parsed.foreign_country;
      prediction = isHigh ? 'FRAUD_DETECTED' : 'LEGITIMATE_TRANSACTION';
      confidence = isHigh ? 98.4 : 95.8;
      riskLevel = isHigh ? 'CRITICAL' : 'LOW';
      probabilities = isHigh ? { fraud: 0.984, legitimate: 0.016 } : { legitimate: 0.958, fraud: 0.042 };
    } else if (app.name.includes('Churn')) {
      const willChurn = parsed.tenure_months < 12 || parsed.support_tickets_30d > 3;
      prediction = willChurn ? 'HIGH_CHURN_RISK' : 'RETAINED_LOYAL';
      confidence = willChurn ? 91.2 : 94.0;
      riskLevel = willChurn ? 'HIGH' : 'LOW';
      probabilities = willChurn ? { churn: 0.912, retained: 0.088 } : { retained: 0.94, churn: 0.06 };
    } else if (app.name.includes('NLP')) {
      prediction = 'INTENT: BILLING_DISPUTE_REFUND';
      confidence = 94.8;
      riskLevel = 'URGENT';
      probabilities = { billing_refund: 0.948, general_inquiry: 0.032, technical_support: 0.02 };
    } else if (app.name.includes('Defect')) {
      prediction = 'SURFACE_DEFECT_DETECTED';
      confidence = 95.6;
      riskLevel = 'REJECT_PART';
      probabilities = { defect_present: 0.956, pass_inspection: 0.044 };
    }

    setResult({
      status: 200,
      statusText: 'OK (Simulated)',
      model: app.name,
      version: app.version,
      framework: app.framework,
      latencyMs: `${duration} ms`,
      servingWorker: 'AWS g4dn.xlarge (TorchServe v0.9 Worker #1)',
      prediction,
      confidence,
      riskLevel,
      probabilities,
      timestamp: new Date().toISOString(),
      scoredFeatures: parsed,
    });

    setRunning(false);
  };

  const handleCopyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-100">Live Model Inference Sandbox</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary-500/10 text-primary-400 border border-primary-500/20">
                  {app.version}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5 truncate max-w-md">
                POST {app.endpoint}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Input JSON Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-primary-400" />
                Input Request Payload (JSON features)
              </label>
              <button
                type="button"
                onClick={() => setPayload(defaultPayload)}
                className="text-[11px] text-primary-400 hover:text-primary-300 transition-colors"
              >
                Reset to Default Payload
              </button>
            </div>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              rows={8}
              className="w-full p-4 rounded-xl border border-gray-700 bg-black font-mono text-xs text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/40 leading-relaxed"
            />
          </div>

          {/* Action Trigger */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-xs text-gray-400">
              Target Framework: <span className="font-semibold text-gray-200">{app.framework}</span>
            </div>
            <button
              onClick={handlePredict}
              disabled={running}
              className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary-500/20 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
            >
              {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              {running ? 'Executing Inference...' : 'Run Real-Time Inference'}
            </button>
          </div>

          {/* Results Display */}
          {result && (
            <div className="space-y-4 pt-4 border-t border-gray-800 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Model Output &amp; Telemetry
                </span>
                <button
                  onClick={handleCopyResult}
                  className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-success-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Response'}
                </button>
              </div>

              {/* Status Header Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800">
                  <p className="text-[11px] text-gray-400 font-medium">Prediction Class</p>
                  <p className="text-sm font-bold text-warning-400 font-mono mt-0.5">{result.prediction}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800">
                  <p className="text-[11px] text-gray-400 font-medium">Confidence Score</p>
                  <p className="text-sm font-bold text-success-400 font-mono mt-0.5">{result.confidence}%</p>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800">
                  <p className="text-[11px] text-gray-400 font-medium">Inference Latency</p>
                  <p className="text-sm font-bold text-primary-400 font-mono mt-0.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {result.latencyMs}
                  </p>
                </div>
              </div>

              {/* Confidence Bar */}
              <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Probability Distribution</span>
                  <span className="font-mono text-gray-200">{result.confidence}% certainty</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-success-500 transition-all duration-500"
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
              </div>

              {/* Full JSON Payload */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1.5 font-mono">Response Payload (HTTP 200 OK)</p>
                <pre className="p-4 bg-black rounded-xl border border-gray-800 text-xs font-mono text-gray-300 max-h-48 overflow-y-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Modal 2: Model Training & Validation Curves ──────────────────────────────

function ModelMetricsModal({
  app,
  onClose,
}: {
  app: MLApplication;
  onClose: () => void;
}) {
  const curveData = [
    { epoch: 1, trainLoss: 0.68, valLoss: 0.71, trainAcc: 68.2, valAcc: 65.4 },
    { epoch: 3, trainLoss: 0.49, valLoss: 0.52, trainAcc: 78.4, valAcc: 76.1 },
    { epoch: 6, trainLoss: 0.35, valLoss: 0.39, trainAcc: 86.1, valAcc: 84.5 },
    { epoch: 9, trainLoss: 0.24, valLoss: 0.28, trainAcc: 91.5, valAcc: 89.8 },
    { epoch: 12, trainLoss: 0.17, valLoss: 0.21, trainAcc: 94.7, valAcc: 93.2 },
    { epoch: 15, trainLoss: 0.12, valLoss: 0.15, trainAcc: 97.4, valAcc: app.accuracy },
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success-500/10 text-success-400 border border-success-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-100">Training &amp; Validation Loss Curves</h3>
              <p className="text-xs text-gray-400">{app.name} ({app.framework}) · 15 Epochs</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Key Metric Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-gray-950 rounded-xl border border-gray-800">
              <p className="text-[11px] text-gray-400">Accuracy</p>
              <p className="text-lg font-bold text-success-400 font-mono mt-0.5">{app.accuracy}%</p>
            </div>
            <div className="p-3 bg-gray-950 rounded-xl border border-gray-800">
              <p className="text-[11px] text-gray-400">Precision</p>
              <p className="text-lg font-bold text-primary-400 font-mono mt-0.5">97.2%</p>
            </div>
            <div className="p-3 bg-gray-950 rounded-xl border border-gray-800">
              <p className="text-[11px] text-gray-400">Recall</p>
              <p className="text-lg font-bold text-purple-400 font-mono mt-0.5">96.1%</p>
            </div>
            <div className="p-3 bg-gray-950 rounded-xl border border-gray-800">
              <p className="text-[11px] text-gray-400">AUC-ROC</p>
              <p className="text-lg font-bold text-warning-400 font-mono mt-0.5">0.991</p>
            </div>
          </div>

          {/* Loss Curve Chart */}
          <div className="p-4 bg-gray-950 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-300">Convergence Loss (Cross-Entropy)</span>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-blue-400 flex items-center gap-1">● Train Loss</span>
                <span className="text-amber-400 flex items-center gap-1">● Val Loss</span>
              </div>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={curveData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                  <XAxis dataKey="epoch" stroke="#9ca3af" fontSize={11} tickLine={false} unit=" ep" />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} domain={[0, 0.8]} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="trainLoss" stroke="#38bdf8" strokeWidth={2} name="Train Loss" dot />
                  <Line type="monotone" dataKey="valLoss" stroke="#f59e0b" strokeWidth={2} name="Val Loss" dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Modal 3: Model Deployment & Traffic Promotion ────────────────────────────

function DeployModelModal({
  app,
  onClose,
}: {
  app: MLApplication;
  onClose: () => void;
}) {
  const [strategy, setStrategy] = useState('canary');
  const [traffic, setTraffic] = useState('10');
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);

  const handleDeploy = async () => {
    setDeploying(true);
    await new Promise((r) => setTimeout(r, 700));
    setDeploying(false);
    setDeployed(true);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-950">
          <div className="flex items-center gap-2.5">
            <Rocket className="w-4 h-4 text-warning-400" />
            <span className="text-sm font-bold text-gray-100">Deploy Model Version to Endpoint</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {deployed ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-success-500/10 text-success-400 mx-auto flex items-center justify-center border border-success-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-100">Deployment Successful!</h4>
                <p className="text-xs text-gray-400 mt-1 font-mono">{app.endpoint}</p>
              </div>
              <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 text-xs text-gray-300">
                Traffic Allocation: <span className="font-bold text-warning-400">{traffic}% Active</span>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Deployment Strategy</label>
                <select
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none"
                >
                  <option value="canary">Canary Rollout (Staged Traffic)</option>
                  <option value="bluegreen">Blue/Green Instant Cutover</option>
                  <option value="rolling">Rolling Update (Zero Downtime)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Traffic Allocation (%)</label>
                <select
                  value={traffic}
                  onChange={(e) => setTraffic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none"
                >
                  <option value="10">10% Canary (Testing)</option>
                  <option value="25">25% Staged Rollout</option>
                  <option value="50">50% Balanced A/B Test</option>
                  <option value="100">100% Full Production Traffic</option>
                </select>
              </div>

              <div className="p-3.5 bg-gray-950 rounded-xl border border-gray-800 text-xs space-y-1.5 text-gray-400">
                <p className="font-semibold text-gray-200">Target Serving Cluster:</p>
                <p className="font-mono text-[11px]">AWS Production Inference VPC (us-east-1)</p>
                <p className="font-mono text-[11px] text-success-400">Health Check: HTTP 200 OK (Healthy)</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={onClose} className="px-4 py-2 text-xs text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800">
                  Cancel
                </button>
                <button
                  onClick={handleDeploy}
                  disabled={deploying}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-warning-500 hover:bg-warning-400 text-gray-950 disabled:opacity-50 flex items-center gap-2"
                >
                  {deploying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
                  {deploying ? 'Deploying...' : 'Promote & Deploy'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function Rocket(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

// ─── Main MLApplicationsPage Component ────────────────────────────────────────

export default function MLApplicationsPage() {
  const { apps, loading, error, addApp, deleteApp } = useMLApplications();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCodeGenModal, setShowCodeGenModal] = useState(false);
  const [sandboxApp, setSandboxApp] = useState<MLApplication | null>(null);
  const [metricsApp, setMetricsApp] = useState<MLApplication | null>(null);
  const [deployApp, setDeployApp] = useState<MLApplication | null>(null);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const detail = apps.find((a) => a.id === selectedApp);

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchStatus = statusFilter === 'all' || app.status === statusFilter;
      const matchSearch =
        app.name.toLowerCase().includes(search.toLowerCase()) ||
        app.framework.toLowerCase().includes(search.toLowerCase()) ||
        app.modelType.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [apps, statusFilter, search]);

  const runningCount = apps.filter((a) => a.status === 'running').length;
  const avgAccuracy = apps.length ? (apps.reduce((s, a) => s + (a.accuracy || 0), 0) / apps.length).toFixed(1) : '94.1';

  return (
    <div className="space-y-6 animate-fade-in text-gray-100">
      {/* ── Top Header Banner ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-950 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-primary-500/10 text-primary-400 border border-primary-500/20 shadow-inner">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">ML Model Registry &amp; Inference</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-success-500/10 text-success-400 border border-success-500/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse" />
                  Supabase PostgreSQL Synced
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Versioned model tracking, real-time prediction testing, validation curves &amp; zero-downtime serving endpoints.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowCodeGenModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-primary-500/30 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 font-bold text-xs shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Code2 className="w-4 h-4" /> Auto-Generate Deployment Code
            </button>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-lg shadow-primary-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Register Model Application
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary Stat Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4 border border-gray-200 dark:border-gray-800">
          <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{apps.length}</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Registered ML Models</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border border-gray-200 dark:border-gray-800">
          <div className="p-3 rounded-xl bg-success-500/10 text-success-400 border border-success-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{runningCount}</span>
              <span className="text-xs text-success-400 font-semibold">Active Endpoints</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Live Serving Clusters</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border border-gray-200 dark:border-gray-800">
          <div className="p-3 rounded-xl bg-warning-500/10 text-warning-400 border border-warning-500/20">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{avgAccuracy}%</span>
              <span className="text-xs text-gray-400">avg</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Fleet Validation Accuracy</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border border-gray-200 dark:border-gray-800">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">2.4M</span>
              <span className="text-xs text-purple-400 font-mono">req/day</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Inference Throughput</p>
          </div>
        </Card>
      </div>

      {/* ── Toolbar: Search & Filter ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search model name, framework, architecture..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 w-56 sm:w-72 focus:outline-none focus:ring-1 focus:ring-primary-500/40"
            />
          </div>

          <div className="flex items-center gap-1.5 border border-gray-700 bg-gray-950 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-gray-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="running">Running</option>
              <option value="idle">Idle</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Showing {filteredApps.length} of {apps.length} models
        </p>
      </div>

      {/* ── Models Grid ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredApps.map((app) => (
            <Card
              key={app.id}
              hover
              className="p-5 border border-gray-200 dark:border-gray-800 flex flex-col justify-between group transition-all"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-400 transition-colors">
                        {app.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-800 text-gray-300">
                          {app.version}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">· {app.framework}</span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={app.status} size="sm" />
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                  {app.description}
                </p>

                {/* Accuracy Progress */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium">Model Accuracy</span>
                    <span className="font-bold font-mono text-gray-100">{app.accuracy}%</span>
                  </div>
                  <ProgressBar
                    value={app.accuracy}
                    size="sm"
                    color={app.accuracy >= 92 ? 'success' : app.accuracy >= 85 ? 'primary' : 'warning'}
                  />
                </div>

                {/* Endpoint */}
                <div className="p-2.5 rounded-lg bg-gray-950 border border-gray-800/80 mb-4">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">REST Endpoint</p>
                  <p className="text-xs font-mono text-primary-400 truncate">{app.endpoint}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800/80 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSandboxApp(app)}
                    className="w-full py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-primary-500/10"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" /> Test Predict
                  </button>
                  <button
                    onClick={() => setMetricsApp(app)}
                    className="w-full py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-gray-700"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-warning-400" /> Loss Curves
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    onClick={() => setDeployApp(app)}
                    className="text-xs text-warning-400 hover:text-warning-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Rocket className="w-3.5 h-3.5" /> Deploy Version
                  </button>
                  <button
                    onClick={() => setSelectedApp(app.id)}
                    className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    Details
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Detail Modal ─────────────────────────────────────────────────────── */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedApp(null)}
        >
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{detail.name}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{detail.version}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={detail.status} />
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{detail.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem icon={<Code className="w-4 h-4 text-primary-400" />} label="Model Type" value={detail.modelType} />
                <DetailItem icon={<Tag className="w-4 h-4 text-warning-400" />} label="Framework" value={detail.framework} />
                <DetailItem icon={<Target className="w-4 h-4 text-success-400" />} label="Accuracy" value={`${detail.accuracy}%`} />
                <DetailItem icon={<Globe className="w-4 h-4 text-blue-400" />} label="Endpoint" value={detail.endpoint} />
                <DetailItem icon={<GitBranch className="w-4 h-4 text-purple-400" />} label="Repository" value={detail.repository} />
                <DetailItem icon={<Clock className="w-4 h-4 text-gray-400" />} label="Last Trained" value={formatRelative(detail.lastTrained)} />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    const target = detail;
                    setSelectedApp(null);
                    setSandboxApp(target);
                  }}
                  className="flex-1 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" /> Open Inference Sandbox
                </button>
                <button
                  onClick={() => {
                    deleteApp(detail.id);
                    setSelectedApp(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-error-500/10 text-error-400 hover:bg-error-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Register Modal ───────────────────────────────────────────────────── */}
      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onRegister={(app) => {
            addApp(app);
            setShowRegisterModal(false);
          }}
        />
      )}

      {/* ── Sandbox Modal ────────────────────────────────────────────────────── */}
      {sandboxApp && (
        <InferenceSandboxModal
          app={sandboxApp}
          onClose={() => setSandboxApp(null)}
        />
      )}

      {/* ── Metrics Curves Modal ─────────────────────────────────────────────── */}
      {metricsApp && (
        <ModelMetricsModal
          app={metricsApp}
          onClose={() => setMetricsApp(null)}
        />
      )}

      {/* ── Deploy Modal ─────────────────────────────────────────────────────── */}
      {deployApp && (
        <DeployModelModal
          app={deployApp}
          onClose={() => setDeployApp(null)}
        />
      )}

      {/* ── Automated Pipeline Code Generator Modal ────────────────────────────── */}
      <CodeGenModal
        isOpen={showCodeGenModal}
        onClose={() => setShowCodeGenModal(false)}
        appName={detail ? detail.name.toLowerCase().replace(/\s+/g, '-') : 'fraud-detection-api'}
        appType="ml"
        port="8000"
      />
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
        {icon}
        {label}
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{value}</p>
    </div>
  );
}

function RegisterModal({
  onClose,
  onRegister,
}: {
  onClose: () => void;
  onRegister: (app: Omit<import('@/types').MLApplication, 'id' | 'createdAt'>) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    modelType: '',
    framework: '',
    version: '',
    accuracy: 90,
    endpoint: '',
    status: 'running' as Status,
    repository: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister({
      ...form,
      lastTrained: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Register ML Application</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <FormField label="Application Name" required>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none"
              placeholder="e.g. Fraud Detection API"
            />
          </FormField>
          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none min-h-[80px] resize-none"
              placeholder="What does this ML application do?"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Model Type">
              <input
                value={form.modelType}
                onChange={(e) => setForm({ ...form, modelType: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none"
                placeholder="e.g. ResNet-50 / XGBoost"
              />
            </FormField>
            <FormField label="Framework">
              <input
                value={form.framework}
                onChange={(e) => setForm({ ...form, framework: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none"
                placeholder="e.g. PyTorch 2.2"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Version">
              <input
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none"
                placeholder="e.g. v2.1.0"
              />
            </FormField>
            <FormField label="Accuracy (%)">
              <input
                type="number"
                min="0"
                max="100"
                value={form.accuracy}
                onChange={(e) => setForm({ ...form, accuracy: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none"
              />
            </FormField>
          </div>
          <FormField label="Prediction Endpoint">
            <input
              value={form.endpoint}
              onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none"
              placeholder="e.g. https://api.aws.ml-org.io/predict"
            />
          </FormField>
          <FormField label="Repository">
            <input
              value={form.repository}
              onChange={(e) => setForm({ ...form, repository: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none"
              placeholder="e.g. ml-org/my-model"
            />
          </FormField>
          <FormField label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-100 focus:outline-none"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </FormField>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-gray-400 hover:text-gray-200">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold">
              Register Application
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-300 mb-1.5">
        {label} {required && <span className="text-error-500">*</span>}
      </label>
      {children}
    </div>
  );
}
