import { useState, useMemo, useEffect, useRef } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import { logEntries as initialLogEntries } from '@/api/mockData';
import type { LogSource, LogEntry } from '@/types';
import { formatTime } from '@/utils/format';
import {
  ScrollText,
  Server,
  Box,
  Rocket,
  Code2,
  Filter,
  Search,
  Download,
  Trash2,
  Play,
  Pause,
  Cloud,
  Cpu,
  Zap,
  ArrowDown,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Flame,
  XCircle,
  ExternalLink,
} from 'lucide-react';

const sourceConfig: Record<LogSource, { label: string; icon: any; color: string; bg: string }> = {
  jenkins: { label: 'Jenkins', icon: Server, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  docker: { label: 'Docker', icon: Box, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  deployment: { label: 'Deploy', icon: Rocket, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  application: { label: 'App', icon: Code2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  aws: { label: 'AWS', icon: Cloud, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  'ml-inference': { label: 'ML Inference', icon: Cpu, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
};

const levelConfig: Record<string, { text: string; bg: string; border: string }> = {
  INFO: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  WARN: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  ERROR: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  DEBUG: { text: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30' },
};

type FilterType = 'all' | LogSource;

// Realistic stream log generator pool
const simulatedStreamPool: Omit<LogEntry, 'id' | 'timestamp'>[] = [
  {
    source: 'ml-inference',
    level: 'INFO',
    service: 'fraud-model-worker-0',
    message: 'Batch prediction executed: 128 vectors evaluated in 14.1ms (99.8% confidence)',
  },
  {
    source: 'application',
    level: 'INFO',
    service: 'api-gateway',
    message: 'POST /v2/predict 200 OK - client: 192.168.1.104 - 16.2ms',
  },
  {
    source: 'aws',
    level: 'INFO',
    service: 'cloudwatch-agent',
    message: 'Telemetry flush: GPU utilization 42%, VRAM used 3.8GB/24GB on i-0a81b2c3d4e5f6071',
  },
  {
    source: 'docker',
    level: 'INFO',
    service: 'containerd',
    message: 'Health probe /healthz returned healthy (container: fraud-api-worker-2)',
  },
  {
    source: 'ml-inference',
    level: 'DEBUG',
    service: 'torch-onnx-runtime',
    message: 'CUDA kernel execution pipeline synced. TensorRT FP16 quantization active',
  },
  {
    source: 'application',
    level: 'WARN',
    service: 'rate-limiter',
    message: 'Client tier approaching 80% quota threshold (req/s: 820 / 1000 max)',
  },
  {
    source: 'jenkins',
    level: 'INFO',
    service: 'jenkins-runner',
    message: 'Triggering background sanity check on model registry checksum hashes',
  },
  {
    source: 'ml-inference',
    level: 'ERROR',
    service: 'drift-detector',
    message: 'Anomaly detected: unexpected schema field "user_loyalty_score" missing in payload',
  },
];

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogEntries);
  const [filter, setFilter] = useState<FilterType>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isStreaming, setIsStreaming] = useState(true);
  const [streamSpeed, setStreamSpeed] = useState<number>(3000); // ms per tick
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const logContainerRef = useRef<HTMLDivElement>(null);

  // ── Auto-Streaming Simulator ───────────────────────────────────────────────

  useEffect(() => {
    if (!isStreaming) return;

    const timer = setInterval(() => {
      const template = simulatedStreamPool[Math.floor(Math.random() * simulatedStreamPool.length)];
      const newEntry: LogEntry = {
        id: `stream-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        ...template,
      };

      setLogs((prev) => [...prev.slice(-300), newEntry]); // Keep last 300 logs in memory
    }, streamSpeed);

    return () => clearInterval(timer);
  }, [isStreaming, streamSpeed]);

  // ── Auto-scroll Effect ─────────────────────────────────────────────────────

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // ── Filtered Logs Computation ──────────────────────────────────────────────

  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return logs.filter((log) => {
      const sourceMatch = filter === 'all' || log.source === filter;
      const levelMatch = levelFilter === 'all' || log.level === levelFilter;
      const searchMatch =
        !q ||
        log.message.toLowerCase().includes(q) ||
        log.service.toLowerCase().includes(q) ||
        log.level.toLowerCase().includes(q) ||
        log.source.toLowerCase().includes(q);

      return sourceMatch && levelMatch && searchMatch;
    });
  }, [logs, filter, levelFilter, searchQuery]);

  // ── Level Counts ───────────────────────────────────────────────────────────

  const levelCounts = useMemo(() => {
    const counts = { INFO: 0, WARN: 0, ERROR: 0, DEBUG: 0 };
    logs.forEach((l) => {
      if (counts[l.level as keyof typeof counts] !== undefined) {
        counts[l.level as keyof typeof counts]++;
      }
    });
    return counts;
  }, [logs]);

  // ── Export Logs Handler ────────────────────────────────────────────────────

  const handleDownloadLog = () => {
    const content = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level.padEnd(5)}] [${l.service}] ${l.message}`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLog = (log: LogEntry) => {
    const line = `[${log.timestamp}] [${log.level}] [${log.service}] ${log.message}`;
    navigator.clipboard.writeText(line);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Inject a simulated error spike for capstone presentations
  const handleSimulateSpike = () => {
    const errorSpike: LogEntry = {
      id: `err-${Date.now()}`,
      source: 'ml-inference',
      level: 'ERROR',
      service: 'torch-serve-worker-1',
      timestamp: new Date().toISOString(),
      message: 'CRITICAL CUDA Out of Memory (OOM): Tried to allocate 4.2GB on Device 0. Auto-scaling worker spinup initiated',
    };
    setLogs((prev) => [...prev, errorSpike]);
  };

  const filters: { id: FilterType; label: string; icon: any }[] = [
    { id: 'all', label: 'All Sources', icon: ScrollText },
    { id: 'jenkins', label: 'Jenkins', icon: Server },
    { id: 'docker', label: 'Docker', icon: Box },
    { id: 'aws', label: 'AWS Cloud', icon: Cloud },
    { id: 'ml-inference', label: 'ML Inference', icon: Cpu },
    { id: 'deployment', label: 'Deployments', icon: Rocket },
    { id: 'application', label: 'Applications', icon: Code2 },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* ── Page Header & Stream Controls ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gray-900/90 via-gray-900/60 to-gray-950 p-6 rounded-2xl border border-gray-800/80 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isStreaming
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              {isStreaming ? 'Live Stream Active' : 'Stream Paused'}
            </span>
            <span className="text-xs text-gray-500 font-mono">{logs.length} events in memory</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            Centralized Telemetry & Log Streamer
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Aggregated real-time observability across CI/CD builds, Docker engines, AWS nodes, and ML models.
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              isStreaming
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30'
                : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500'
            }`}
          >
            {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isStreaming ? 'Pause Stream' : 'Resume Live'}
          </button>

          {/* Speed Selector */}
          <select
            value={streamSpeed}
            onChange={(e) => setStreamSpeed(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-lg px-2.5 py-2 cursor-pointer focus:outline-none"
          >
            <option value={5000}>Speed: 0.5x</option>
            <option value={3000}>Speed: 1x (Normal)</option>
            <option value={1500}>Speed: 2x (Fast)</option>
            <option value={600}>Speed: 5x (Spike)</option>
          </select>

          {/* Trigger Anomaly / Demo spike */}
          <button
            onClick={handleSimulateSpike}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium cursor-pointer"
            title="Inject simulated error to demonstrate alert handling"
          >
            <Flame className="w-3.5 h-3.5" />
            Simulate Error
          </button>

          {/* Export Log */}
          <button
            onClick={handleDownloadLog}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-medium cursor-pointer"
            title="Download plain text .log file"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            .log
          </button>

          {/* Clear Console */}
          <button
            onClick={() => setLogs([])}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border border-gray-700 cursor-pointer"
            title="Clear buffer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Search Bar & Filter Controls ─────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search log messages, services, status codes, error traces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/90 border border-gray-800 focus:border-primary-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-white px-1.5 py-0.5 rounded bg-gray-800"
              >
                Clear
              </button>
            )}
          </div>

          {/* Severity Level Filter Pills with Counts */}
          <div className="flex items-center gap-1.5 bg-gray-900/80 p-1 rounded-xl border border-gray-800 shrink-0 overflow-x-auto text-xs font-mono">
            <button
              onClick={() => setLevelFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                levelFilter === 'all'
                  ? 'bg-gray-800 text-white font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              ALL ({logs.length})
            </button>
            <button
              onClick={() => setLevelFilter('INFO')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                levelFilter === 'INFO'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                  : 'text-cyan-400 hover:text-cyan-300'
              }`}
            >
              INFO ({levelCounts.INFO})
            </button>
            <button
              onClick={() => setLevelFilter('WARN')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                levelFilter === 'WARN'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              WARN ({levelCounts.WARN})
            </button>
            <button
              onClick={() => setLevelFilter('ERROR')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                levelFilter === 'ERROR'
                  ? 'bg-red-500/20 text-red-300 font-semibold border border-red-500/40'
                  : 'text-red-400 hover:text-red-300'
              }`}
            >
              ERROR ({levelCounts.ERROR})
            </button>
            <button
              onClick={() => setLevelFilter('DEBUG')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                levelFilter === 'DEBUG'
                  ? 'bg-gray-800 text-gray-300 font-semibold'
                  : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              DEBUG ({levelCounts.DEBUG})
            </button>
          </div>
        </div>

        {/* Source Categories Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => {
            const Icon = f.icon;
            const isSelected = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20 font-semibold'
                    : 'bg-gray-900/80 text-gray-400 hover:text-gray-200 border border-gray-800 hover:border-gray-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Log Terminal Viewer ───────────────────────────────────────────── */}
      <Card className="overflow-hidden border border-gray-800 shadow-2xl">
        <div className="bg-gray-900 px-5 py-3 border-b border-gray-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            <span className="font-mono text-gray-300 ml-2">stdout / stderr stream</span>
            <span className="text-gray-500">· {filteredLogs.length} matching entries</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-gray-400 hover:text-gray-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-gray-700 text-primary-600 focus:ring-primary-500 h-3.5 w-3.5 cursor-pointer"
              />
              Auto-scroll
            </label>
            <button
              onClick={() => {
                if (logContainerRef.current) {
                  logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
                }
              }}
              className="text-gray-400 hover:text-white p-1 rounded bg-gray-800"
              title="Jump to Bottom"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div
          ref={logContainerRef}
          className="bg-gray-950 p-4 font-mono text-xs max-h-[580px] overflow-y-auto space-y-1 selection:bg-primary-500/30"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-gray-600 text-center py-16">
              <ScrollText className="w-8 h-8 mx-auto mb-2 text-gray-700" />
              No logs match the current filter or search criteria.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const src = sourceConfig[log.source] || {
                label: log.source,
                icon: Server,
                color: 'text-gray-400',
                bg: 'bg-gray-800',
              };
              const lvl = levelConfig[log.level] || levelConfig.INFO;
              const Icon = src.icon;

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="group flex items-start gap-2.5 py-1 px-2.5 rounded hover:bg-white/[0.04] transition-colors cursor-pointer border border-transparent hover:border-gray-800/80"
                >
                  {/* Timestamp */}
                  <span className="text-gray-500 shrink-0 select-none text-[11px]">
                    {formatTime(log.timestamp)}
                  </span>

                  {/* Level Pill */}
                  <span
                    className={`shrink-0 font-bold px-1.5 py-0.2 rounded text-[10px] uppercase border ${lvl.bg} ${lvl.text} ${lvl.border} w-13 text-center`}
                  >
                    {log.level}
                  </span>

                  {/* Service Badge */}
                  <span
                    className={`shrink-0 flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] border ${src.bg} ${src.color} w-32 truncate`}
                    title={log.service}
                  >
                    <Icon className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{log.service}</span>
                  </span>

                  {/* Log Message */}
                  <span className="text-gray-200 flex-1 break-all group-hover:text-white transition-colors">
                    {searchQuery ? (
                      highlightMatch(log.message, searchQuery)
                    ) : (
                      log.message
                    )}
                  </span>

                  {/* Quick Copy Button on Hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyLog(log);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-opacity shrink-0"
                    title="Copy Line"
                  >
                    {copiedId === log.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* ── Log Inspector Modal / Drawer ─────────────────────────────────── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-950">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    levelConfig[selectedLog.level]?.bg
                  } ${levelConfig[selectedLog.level]?.text}`}
                >
                  {selectedLog.level}
                </span>
                <span className="text-sm font-semibold text-white">Log Event Inspector</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Inspector Content */}
            <div className="p-6 space-y-4 font-mono text-xs">
              <div>
                <p className="text-gray-500 text-[11px] mb-1">Message Payload:</p>
                <div className="p-3 bg-gray-950 rounded-lg border border-gray-800 text-gray-100 break-words font-medium">
                  {selectedLog.message}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-950/60 rounded-lg border border-gray-800">
                  <span className="text-gray-500">Service:</span>
                  <p className="text-gray-200 mt-0.5">{selectedLog.service}</p>
                </div>
                <div className="p-3 bg-gray-950/60 rounded-lg border border-gray-800">
                  <span className="text-gray-500">Source:</span>
                  <p className="text-gray-200 mt-0.5 capitalize">{selectedLog.source}</p>
                </div>
                <div className="p-3 bg-gray-950/60 rounded-lg border border-gray-800">
                  <span className="text-gray-500">Timestamp:</span>
                  <p className="text-gray-200 mt-0.5">{selectedLog.timestamp}</p>
                </div>
                <div className="p-3 bg-gray-950/60 rounded-lg border border-gray-800">
                  <span className="text-gray-500">Event ID:</span>
                  <p className="text-gray-200 mt-0.5">{selectedLog.id}</p>
                </div>
              </div>

              {/* Extended Metadata simulation */}
              <div className="p-3 bg-gray-950/60 rounded-lg border border-gray-800 space-y-1">
                <p className="text-gray-500 font-semibold mb-1">Telemetry Trace Envelope:</p>
                <div className="text-[11px] text-gray-400 space-y-0.5">
                  <p>trace_id: <span className="text-cyan-400">00-4bf92f3577b34da6a3ce929d0e0e4736</span></p>
                  <p>span_id: <span className="text-purple-400">00f067aa0ba902b7</span></p>
                  <p>host: <span className="text-gray-300">ip-10-0-4-82.ec2.internal (us-east-1a)</span></p>
                  <p>container_runtime: <span className="text-gray-300">containerd://sha256:7f3b890a</span></p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800 bg-gray-950 flex justify-between">
              <button
                onClick={() => handleCopyLog(selectedLog)}
                className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-200 font-medium flex items-center gap-1.5 cursor-pointer"
              >
                {copiedId === selectedLog.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Log
                  </>
                )}
              </button>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-xs text-white font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper to highlight search matches ────────────────────────────────────────

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="bg-yellow-500/30 text-yellow-200 font-bold px-0.5 rounded">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
