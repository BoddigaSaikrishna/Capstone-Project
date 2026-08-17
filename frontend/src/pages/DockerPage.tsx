import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  testDockerConnection,
  fetchDockerContainers,
  fetchDockerImages,
  fetchDockerVolumes,
  fetchDockerNetworks,
  fetchContainerLogs,
  fetchContainerStats,
  startContainer,
  stopContainer,
  restartContainer,
  removeContainer,
  pullImage,
  removeImage,
  formatBytes,
  getContainerName,
  getContainerPorts,
  mapDockerState,
  type DockerContainer,
  type DockerImage,
  type DockerVolume,
  type DockerNetwork,
  type DockerSystemInfo,
  type DockerStats,
} from '@/api/dockerApi';
import {
  Box,
  Layers,
  HardDrive,
  Network,
  Play,
  Square,
  RotateCcw,
  Trash2,
  RefreshCw,
  Search,
  Terminal,
  BarChart2,
  X,
  ChevronDown,
  ChevronRight,
  Download,
  Wifi,
  WifiOff,
  AlertCircle,
  Info,
  Activity,
  Cpu,
  MemoryStick,
  ArrowDown,
  ArrowUp,
  Database,
  Server,
} from 'lucide-react';

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StateBadge({ state }: { state: string }) {
  const s = state?.toLowerCase();
  const cls =
    s === 'running'
      ? 'bg-success-500/10 text-success-500 border border-success-500/20'
      : s === 'paused'
      ? 'bg-warning-500/10 text-warning-500 border border-warning-500/20'
      : s === 'exited'
      ? 'bg-error-500/10 text-error-500 border border-error-500/20'
      : 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {s === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />}
      {state || 'unknown'}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex items-center gap-4 hover:shadow-lg transition-shadow">
      <div className={`p-3 rounded-xl ${color} flex-shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Log Viewer Modal ─────────────────────────────────────────────────────────
function LogModal({
  containerId,
  containerName,
  onClose,
}: {
  containerId: string;
  containerName: string;
  onClose: () => void;
}) {
  const [logs, setLogs] = useState('Loading logs...');
  const [tail, setTail] = useState(100);
  const logRef = useRef<HTMLPreElement>(null);

  const load = useCallback(async () => {
    try {
      const text = await fetchContainerLogs(containerId, tail);
      setLogs(text || '(No output)');
      setTimeout(() => logRef.current?.scrollTo(0, logRef.current.scrollHeight), 50);
    } catch (e: any) {
      setLogs(`Error: ${e.message}`);
    }
  }, [containerId, tail]);

  useEffect(() => { load(); }, [load]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl bg-gray-950 border border-gray-800 rounded-2xl flex flex-col shadow-2xl" style={{ maxHeight: '88vh' }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-success-400" />
            <span className="text-sm font-bold text-gray-100">Logs — <span className="font-mono text-success-400">{containerName}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={tail}
              onChange={(e) => setTail(Number(e.target.value))}
              className="text-xs bg-gray-900 border border-gray-800 text-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {[50, 100, 200, 500].map((n) => (
                <option key={n} value={n}>Last {n} lines</option>
              ))}
            </select>
            <button onClick={load} className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <pre
          ref={logRef}
          className="flex-1 overflow-auto p-4 text-xs font-mono text-green-300 leading-relaxed whitespace-pre-wrap bg-gray-950"
          style={{ minHeight: 300 }}
        >
          {logs}
        </pre>
      </div>
    </div>,
    document.body
  );
}

// ─── Stats Popover ────────────────────────────────────────────────────────────
function StatsPopover({
  containerId,
  containerName,
  onClose,
}: {
  containerId: string;
  containerName: string;
  onClose: () => void;
}) {
  const [stats, setStats] = useState<DockerStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const s = await fetchContainerStats(containerId);
        if (active) setStats(s);
      } catch (e: any) {
        if (active) setError(e.message);
      }
    };
    poll();
    const t = setInterval(poll, 3000);
    return () => { active = false; clearInterval(t); };
  }, [containerId]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-bold text-gray-100">Stats — <span className="font-mono text-primary-400">{containerName}</span></span>
            <span className="text-[10px] bg-success-500/10 text-success-500 border border-success-500/20 px-1.5 py-0.5 rounded-full">Live · 3s</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-red-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
          {error ? (
            <div className="text-center py-8 text-error-400 text-sm">{error}</div>
          ) : !stats ? (
            <div className="text-center py-8 text-gray-400 text-sm animate-pulse">Loading live stats...</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* CPU */}
              <div className="col-span-2 bg-gray-950 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-primary-400" /> CPU Usage</span>
                  <span className="text-sm font-bold text-primary-400">{stats.cpu_percent.toFixed(2)}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(stats.cpu_percent, 100)}%` }}
                  />
                </div>
              </div>
              {/* Memory */}
              <div className="col-span-2 bg-gray-950 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 flex items-center gap-1.5"><MemoryStick className="w-3.5 h-3.5 text-accent-400" /> Memory</span>
                  <span className="text-sm font-bold text-accent-400">
                    {formatBytes(stats.memory_usage)} / {formatBytes(stats.memory_limit)} ({stats.memory_percent.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(stats.memory_percent, 100)}%` }}
                  />
                </div>
              </div>
              {/* Network */}
              <div className="bg-gray-950 rounded-xl p-4 border border-gray-800">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><ArrowDown className="w-3 h-3 text-success-400" /> Net RX</p>
                <p className="text-base font-bold text-success-400">{formatBytes(stats.network_rx)}</p>
              </div>
              <div className="bg-gray-950 rounded-xl p-4 border border-gray-800">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><ArrowUp className="w-3 h-3 text-warning-400" /> Net TX</p>
                <p className="text-base font-bold text-warning-400">{formatBytes(stats.network_tx)}</p>
              </div>
              {/* Block I/O */}
              <div className="bg-gray-950 rounded-xl p-4 border border-gray-800">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Database className="w-3 h-3 text-blue-400" /> Block Read</p>
                <p className="text-base font-bold text-blue-400">{formatBytes(stats.block_read)}</p>
              </div>
              <div className="bg-gray-950 rounded-xl p-4 border border-gray-800">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Database className="w-3 h-3 text-purple-400" /> Block Write</p>
                <p className="text-base font-bold text-purple-400">{formatBytes(stats.block_write)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Pull Image Modal ─────────────────────────────────────────────────────────
function PullImageModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [imageName, setImageName] = useState('');
  const [pulling, setPulling] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handlePull = async () => {
    if (!imageName.trim()) return;
    setPulling(true); setError('');
    try {
      await pullImage(imageName.trim());
      setDone(true);
      setTimeout(() => { onDone(); onClose(); }, 1200);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPulling(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <Download className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-bold text-gray-100">Pull Docker Image</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {done ? (
            <p className="text-center py-4 text-success-400 font-semibold">✔ Image pulled successfully!</p>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Image Name</label>
                <input
                  type="text"
                  value={imageName}
                  onChange={(e) => setImageName(e.target.value)}
                  placeholder="e.g. nginx:latest, python:3.11, ubuntu:22.04"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-700 bg-gray-950 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
                  onKeyDown={(e) => e.key === 'Enter' && handlePull()}
                />
              </div>
              {error && (
                <div className="flex items-start gap-2 p-3 bg-error-500/10 border border-error-500/20 rounded-lg text-xs text-error-400">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={onClose} className="px-4 py-2 text-xs text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800 transition-colors">Cancel</button>
                <button
                  onClick={handlePull}
                  disabled={pulling || !imageName.trim()}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-50 flex items-center gap-2 transition-all"
                >
                  {pulling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {pulling ? 'Pulling...' : 'Pull Image'}
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

// ─── Main DockerPage ──────────────────────────────────────────────────────────

type TabId = 'containers' | 'images' | 'volumes' | 'networks';

export default function DockerPage() {
  const [tab, setTab] = useState<TabId>('containers');
  const [connected, setConnected] = useState<boolean | null>(null);
  const [sysInfo, setSysInfo] = useState<DockerSystemInfo | null>(null);
  const [connectError, setConnectError] = useState('');
  const [connecting, setConnecting] = useState(false);

  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [images, setImages] = useState<DockerImage[]>([]);
  const [volumes, setVolumes] = useState<DockerVolume[]>([]);
  const [networks, setNetworks] = useState<DockerNetwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string>('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [logTarget, setLogTarget] = useState<{ id: string; name: string } | null>(null);
  const [statsTarget, setStatsTarget] = useState<{ id: string; name: string } | null>(null);
  const [showPullModal, setShowPullModal] = useState(false);

  // Connect & load data
  const connect = useCallback(async () => {
    setConnecting(true); setConnectError('');
    try {
      const info = await testDockerConnection();
      setSysInfo(info);
      setConnected(true);
      await loadAll();
    } catch (e: any) {
      setConnected(false);
      setConnectError(e.message);
    } finally {
      setConnecting(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c, i, v, n] = await Promise.all([
        fetchDockerContainers(),
        fetchDockerImages(),
        fetchDockerVolumes(),
        fetchDockerNetworks(),
      ]);
      setContainers(c);
      setImages(i);
      setVolumes(v);
      setNetworks(n);
    } catch { /* silently ignore partial failures */ }
    setLoading(false);
  }, []);

  useEffect(() => { connect(); }, [connect]);

  // Container actions
  const handleContainerAction = async (
    id: string,
    action: 'start' | 'stop' | 'restart' | 'remove'
  ) => {
    setActionLoading(id + action);
    try {
      if (action === 'start') await startContainer(id);
      else if (action === 'stop') await stopContainer(id);
      else if (action === 'restart') await restartContainer(id);
      else if (action === 'remove') await removeContainer(id, true);
      await new Promise((r) => setTimeout(r, 600));
      const fresh = await fetchDockerContainers();
      setContainers(fresh);
    } catch (e: any) {
      alert(`Action failed: ${e.message}`);
    }
    setActionLoading('');
  };

  const handleRemoveImage = async (id: string) => {
    if (!confirm('Remove this image?')) return;
    setActionLoading('img' + id);
    try {
      await removeImage(id, false);
      setImages((prev) => prev.filter((i) => i.Id !== id));
    } catch (e: any) {
      alert(`Failed: ${e.message}`);
    }
    setActionLoading('');
  };

  // Filter containers
  const filteredContainers = containers.filter((c) => {
    const name = getContainerName(c).toLowerCase();
    const img = (c.Image ?? '').toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = !q || name.includes(q) || img.includes(q);
    const matchStatus = statusFilter === 'all' || c.State?.toLowerCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  const runningCount = containers.filter((c) => c.State === 'running').length;
  const tabs: { id: TabId; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'containers', label: 'Containers', icon: <Box className="w-4 h-4" />, count: containers.length },
    { id: 'images', label: 'Images', icon: <Layers className="w-4 h-4" />, count: images.length },
    { id: 'volumes', label: 'Volumes', icon: <HardDrive className="w-4 h-4" />, count: volumes.length },
    { id: 'networks', label: 'Networks', icon: <Network className="w-4 h-4" />, count: networks.length },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Top Connection Banner ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${connected === true ? 'bg-success-500 animate-pulse' : connected === false ? 'bg-error-500' : 'bg-gray-400'}`} />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Docker Engine
            {sysInfo && (
              <span className="ml-2 text-xs font-mono text-success-500">
                v{sysInfo.ServerVersion} · {sysInfo.OperatingSystem} · {sysInfo.NCPU} CPU · {formatBytes(sysInfo.MemTotal)} RAM
              </span>
            )}
          </span>
          {connected === false && (
            <span className="text-xs text-error-400 flex items-center gap-1">
              <WifiOff className="w-3.5 h-3.5" />
              {connectError || 'Cannot connect to Docker Engine on localhost:2375'}
            </span>
          )}
          {connecting && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Connecting...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {connected === true && tab === 'images' && (
            <button
              onClick={() => setShowPullModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition-all shadow-md shadow-primary-500/20"
            >
              <Download className="w-3.5 h-3.5" /> Pull Image
            </button>
          )}
          <button
            onClick={connect}
            disabled={connecting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${connecting ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Docker not connected notice ───────────────────────────────────── */}
      {connected === false && (
        <div className="bg-warning-500/5 border border-warning-500/20 rounded-xl p-5 flex items-start gap-3">
          <Info className="w-5 h-5 text-warning-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-warning-300 space-y-1">
            <p className="font-semibold text-warning-200">Docker Engine TCP API not reachable</p>
            <p className="text-xs text-warning-400 leading-relaxed">
              To enable live Docker data, open <strong>Docker Desktop → Settings → General</strong> and check
              <em> "Expose daemon on tcp://localhost:2375 without TLS"</em>, then click <strong>Apply & Restart</strong>.
              <br />
              The page is currently showing <strong>live mock fallback data</strong> for demonstration.
            </p>
          </div>
        </div>
      )}

      {/* ── Stat Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Running Containers"
          value={connected ? runningCount : '—'}
          icon={<Activity className="w-5 h-5" />}
          color="bg-success-500/10 text-success-500"
          sub={sysInfo ? `${sysInfo.ContainersPaused} paused · ${sysInfo.ContainersStopped} stopped` : undefined}
        />
        <StatCard
          label="Total Containers"
          value={connected ? containers.length : '—'}
          icon={<Box className="w-5 h-5" />}
          color="bg-primary-500/10 text-primary-500"
        />
        <StatCard
          label="Docker Images"
          value={connected ? images.length : '—'}
          icon={<Layers className="w-5 h-5" />}
          color="bg-accent-500/10 text-accent-500"
          sub={
            images.length
              ? `${formatBytes(images.reduce((s, i) => s + (i.Size || 0), 0))} total`
              : undefined
          }
        />
        <StatCard
          label="Volumes"
          value={connected ? volumes.length : '—'}
          icon={<HardDrive className="w-5 h-5" />}
          color="bg-warning-500/10 text-warning-500"
          sub={networks.length ? `${networks.length} networks` : undefined}
        />
      </div>

      {/* ── Tab Navigation ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800 overflow-x-auto pb-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
              tab === t.id
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t.icon}
            {t.label}
            {connected && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                tab === t.id ? 'bg-primary-500/10 text-primary-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Containers ───────────────────────────────────────────────── */}
      {tab === 'containers' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
                <Box className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Containers</h3>
                <p className="text-xs text-gray-400">{filteredContainers.length} of {containers.length} shown</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or image..."
                  className="pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 w-44"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-2 focus:outline-none"
              >
                <option value="all">All States</option>
                <option value="running">Running</option>
                <option value="exited">Exited</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-16 text-center text-gray-400 animate-pulse text-sm">Loading containers...</div>
          ) : filteredContainers.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No containers found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-950/40">
                    <th className="text-left px-5 py-3">Container</th>
                    <th className="text-left px-5 py-3">Image</th>
                    <th className="text-left px-5 py-3">Ports</th>
                    <th className="text-left px-5 py-3">State</th>
                    <th className="text-right px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContainers.map((c) => {
                    const name = getContainerName(c);
                    const ports = getContainerPorts(c);
                    const isRunning = c.State === 'running';
                    const loading = actionLoading.startsWith(c.Id);
                    return (
                      <tr key={c.Id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isRunning ? 'bg-success-500 animate-pulse' : 'bg-gray-400'}`} />
                            <div>
                              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 font-mono">{name}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{c.Id.slice(0, 12)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-mono max-w-[180px] truncate">{c.Image}</td>
                        <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-mono">{ports}</td>
                        <td className="px-5 py-3"><StateBadge state={c.State} /></td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Stats */}
                            {isRunning && (
                              <button
                                onClick={() => setStatsTarget({ id: c.Id, name })}
                                title="Live Stats"
                                className="p-1.5 rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 transition-colors"
                              >
                                <BarChart2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {/* Logs */}
                            <button
                              onClick={() => setLogTarget({ id: c.Id, name })}
                              title="View Logs"
                              className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
                            >
                              <Terminal className="w-3.5 h-3.5" />
                            </button>
                            {/* Start / Stop */}
                            {isRunning ? (
                              <button
                                onClick={() => handleContainerAction(c.Id, 'stop')}
                                disabled={!!loading}
                                title="Stop"
                                className="p-1.5 rounded-md bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 hover:bg-error-100 transition-colors"
                              >
                                <Square className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleContainerAction(c.Id, 'start')}
                                disabled={!!loading}
                                title="Start"
                                className="p-1.5 rounded-md bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400 hover:bg-success-100 transition-colors"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {/* Restart */}
                            <button
                              onClick={() => handleContainerAction(c.Id, 'restart')}
                              disabled={!!loading}
                              title="Restart"
                              className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
                            >
                              <RotateCcw className={`w-3.5 h-3.5 ${loading && actionLoading === c.Id + 'restart' ? 'animate-spin' : ''}`} />
                            </button>
                            {/* Remove */}
                            <button
                              onClick={() => handleContainerAction(c.Id, 'remove')}
                              disabled={!!loading}
                              title="Remove"
                              className="p-1.5 rounded-md bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 hover:bg-error-100 transition-colors"
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
          )}
        </div>
      )}

      {/* ── Tab: Images ───────────────────────────────────────────────────── */}
      {tab === 'images' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent-500/10 text-accent-600 dark:text-accent-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Docker Images</h3>
                <p className="text-xs text-gray-400">
                  {images.length} images · {formatBytes(images.reduce((s, i) => s + (i.Size || 0), 0))} total
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPullModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Pull Image
            </button>
          </div>
          {loading ? (
            <div className="py-16 text-center text-gray-400 animate-pulse text-sm">Loading images...</div>
          ) : images.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No images found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-950/40">
                    <th className="text-left px-5 py-3">Repository:Tag</th>
                    <th className="text-left px-5 py-3">Image ID</th>
                    <th className="text-left px-5 py-3">Size</th>
                    <th className="text-left px-5 py-3">Created</th>
                    <th className="text-right px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {images.map((img) => {
                    const tag = img.RepoTags?.[0] ?? '<none>:<none>';
                    const [repo, tagPart] = tag.includes(':') ? tag.split(':') : [tag, 'latest'];
                    return (
                      <tr key={img.Id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 group">
                        <td className="px-5 py-3">
                          <div>
                            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 font-mono">{repo}</p>
                            <span className="px-1.5 py-0.5 mt-1 inline-block rounded bg-primary-500/10 text-primary-500 text-[10px] font-mono">{tagPart}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-400 font-mono">{img.Id.replace('sha256:', '').slice(0, 12)}</td>
                        <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-300">{formatBytes(img.Size)}</td>
                        <td className="px-5 py-3 text-xs text-gray-500">{new Date(img.Created * 1000).toLocaleDateString()}</td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleRemoveImage(img.Id)}
                            disabled={actionLoading === 'img' + img.Id}
                            title="Remove Image"
                            className="p-1.5 rounded-md bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 hover:bg-error-100 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Volumes ──────────────────────────────────────────────────── */}
      {tab === 'volumes' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning-500/10 text-warning-600 dark:text-warning-400">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Docker Volumes</h3>
              <p className="text-xs text-gray-400">{volumes.length} volumes mounted</p>
            </div>
          </div>
          {volumes.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No volumes found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-950/40">
                    <th className="text-left px-5 py-3">Name</th>
                    <th className="text-left px-5 py-3">Driver</th>
                    <th className="text-left px-5 py-3">Mount Point</th>
                    <th className="text-left px-5 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {volumes.map((v) => (
                    <tr key={v.Name} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-5 py-3 text-xs font-mono font-semibold text-gray-900 dark:text-gray-100 max-w-[200px] truncate">{v.Name}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded bg-accent-500/10 text-accent-500 text-[10px] font-semibold">{v.Driver}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400 font-mono max-w-[250px] truncate">{v.Mountpoint}</td>
                      <td className="px-5 py-3 text-xs text-gray-400">{v.CreatedAt ? new Date(v.CreatedAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Networks ─────────────────────────────────────────────────── */}
      {tab === 'networks' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Docker Networks</h3>
              <p className="text-xs text-gray-400">{networks.length} networks configured</p>
            </div>
          </div>
          {networks.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No networks found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-950/40">
                    <th className="text-left px-5 py-3">Name</th>
                    <th className="text-left px-5 py-3">Driver</th>
                    <th className="text-left px-5 py-3">Scope</th>
                    <th className="text-left px-5 py-3">Subnet</th>
                    <th className="text-left px-5 py-3">Containers</th>
                  </tr>
                </thead>
                <tbody>
                  {networks.map((n) => (
                    <tr key={n.Id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-5 py-3 text-xs font-semibold text-gray-900 dark:text-gray-100 font-mono">{n.Name}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-semibold">{n.Driver}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400">{n.Scope}</td>
                      <td className="px-5 py-3 text-xs text-gray-400 font-mono">
                        {n.IPAM?.Config?.[0]?.Subnet ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400">
                        {Object.keys(n.Containers ?? {}).length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {logTarget && (
        <LogModal
          containerId={logTarget.id}
          containerName={logTarget.name}
          onClose={() => setLogTarget(null)}
        />
      )}
      {statsTarget && (
        <StatsPopover
          containerId={statsTarget.id}
          containerName={statsTarget.name}
          onClose={() => setStatsTarget(null)}
        />
      )}
      {showPullModal && (
        <PullImageModal
          onClose={() => setShowPullModal(false)}
          onDone={loadAll}
        />
      )}
    </div>
  );
}
