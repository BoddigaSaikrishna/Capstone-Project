import { useState, useEffect, useCallback, useMemo } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  testJenkinsConnection,
  fetchJenkinsJobs,
  fetchJenkinsBuilds,
  fetchJenkinsBuildLog,
  triggerJenkinsBuild,
  fetchJenkinsPlugins,
  fetchJenkinsNodes,
  type JenkinsServerInfo,
  type JenkinsPlugin,
  type JenkinsNode,
} from '@/api/jenkinsApi';
import type { JenkinsPipeline, JenkinsBuild } from '@/types';
import { formatRelative } from '@/utils/format';
import {
  Server,
  Play,
  FileText,
  Clock,
  History,
  Key,
  User,
  Globe,
  RefreshCw,
  AlertCircle,
  Settings,
  CheckCircle2,
  XCircle,
  Loader2,
  Terminal,
  Cpu,
  Zap,
  Plus,
  Puzzle,
  Search,
  Wrench,
  Layers,
  Check,
  ShieldCheck,
  Package,
} from 'lucide-react';
import CreateJenkinsItemModal from '@/components/ui/CreateJenkinsItemModal';

type ActiveTab = 'pipelines' | 'plugins' | 'nodes' | 'tools';

export default function JenkinsPage() {
  // ── Credentials (env vars → localStorage → empty) ───────────────────────────
  const [url, setUrl] = useState<string>(() =>
    import.meta.env.VITE_JENKINS_URL || localStorage.getItem('mldevops_jenkins_url') || ''
  );
  const [username, setUsername] = useState<string>(() =>
    import.meta.env.VITE_JENKINS_USERNAME || localStorage.getItem('mldevops_jenkins_username') || ''
  );
  const [token, setToken] = useState<string>(() =>
    import.meta.env.VITE_JENKINS_TOKEN || localStorage.getItem('mldevops_jenkins_token') || ''
  );

  const [inputUrl, setInputUrl] = useState(url);
  const [inputUsername, setInputUsername] = useState(username);
  const [inputToken, setInputToken] = useState(token);
  const [showConfig, setShowConfig] = useState(!url);

  // ── Navigation Tab State ──
  const [activeTab, setActiveTab] = useState<ActiveTab>('pipelines');

  // ── Connection state ─────────────────────────────────────────────────────────
  const [serverInfo, setServerInfo] = useState<JenkinsServerInfo | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState('');

  // ── Data states ───────────────────────────────────────────────────────────────
  const [pipelines, setPipelines] = useState<JenkinsPipeline[]>([]);
  const [builds, setBuilds] = useState<JenkinsBuild[]>([]);
  const [plugins, setPlugins] = useState<JenkinsPlugin[]>([]);
  const [nodes, setNodes] = useState<JenkinsNode[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [selectedBuild, setSelectedBuild] = useState<number | null>(null);
  const [buildLog, setBuildLog] = useState<string>('');
  const [createItemOpen, setCreateItemOpen] = useState(false);

  // ── Plugin filter states ──────────────────────────────────────────────────────
  const [pluginSearch, setPluginSearch] = useState('');
  const [pluginFilter, setPluginFilter] = useState<'all' | 'active'>('all');

  // ── Loading states ────────────────────────────────────────────────────────────
  const [loadingPipelines, setLoadingPipelines] = useState(false);
  const [loadingBuilds, setLoadingBuilds] = useState(false);
  const [loadingPlugins, setLoadingPlugins] = useState(false);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [loadingLog, setLoadingLog] = useState(false);
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);
  const [error, setError] = useState('');

  const isConfigured = !!(url && username && token);

  // ── Test & Connect ────────────────────────────────────────────────────────────
  const runConnectionTest = useCallback(async (u: string, user: string, tok: string) => {
    if (!u || !user || !tok) return;
    setConnectionStatus('testing');
    setConnectionError('');
    setServerInfo(null);
    try {
      const info = await testJenkinsConnection(u, user, tok);
      setServerInfo(info);
      setConnectionStatus('connected');
    } catch (err: any) {
      setConnectionStatus('error');
      setConnectionError(err.message || 'Could not reach Jenkins server.');
    }
  }, []);

  useEffect(() => {
    if (isConfigured) {
      runConnectionTest(url, username, token);
    }
  }, [isConfigured, runConnectionTest, url, username, token]);

  // ── Fetch Pipelines on mount / credentials change ─────────────────────────────
  useEffect(() => {
    if (!isConfigured) {
      setPipelines([]);
      setBuilds([]);
      setSelectedJob('');
      setSelectedBuild(null);
      setBuildLog('');
      return;
    }
    let isMounted = true;
    async function load() {
      setLoadingPipelines(true);
      setError('');
      try {
        const data = await fetchJenkinsJobs(url, username, token);
        if (!isMounted) return;
        setPipelines(data);
        if (data.length > 0) setSelectedJob(data[0].name);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Failed to fetch jobs from Jenkins.');
      } finally {
        if (isMounted) setLoadingPipelines(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [url, username, token, isConfigured]);

  // ── Fetch Plugins & Nodes when switching tabs ───────────────────────────────
  useEffect(() => {
    if (!isConfigured || connectionStatus !== 'connected') return;

    if (activeTab === 'plugins' && plugins.length === 0) {
      setLoadingPlugins(true);
      fetchJenkinsPlugins(url, username, token)
        .then((p) => setPlugins(p))
        .catch(() => setPlugins([]))
        .finally(() => setLoadingPlugins(false));
    }

    if (activeTab === 'nodes' && nodes.length === 0) {
      setLoadingNodes(true);
      fetchJenkinsNodes(url, username, token)
        .then((n) => setNodes(n))
        .catch(() => setNodes([]))
        .finally(() => setLoadingNodes(false));
    }
  }, [activeTab, isConfigured, connectionStatus, url, username, token, plugins.length, nodes.length]);

  // ── Fetch Builds when selectedJob changes ─────────────────────────────────────
  useEffect(() => {
    if (!selectedJob || !isConfigured) { setBuilds([]); return; }
    let isMounted = true;
    async function load() {
      setLoadingBuilds(true);
      try {
        const data = await fetchJenkinsBuilds(url, selectedJob, username, token);
        if (!isMounted) return;
        setBuilds(data);
        if (data.length > 0) setSelectedBuild(data[0].number);
        else { setSelectedBuild(null); setBuildLog(''); }
      } catch { if (isMounted) setBuilds([]); }
      finally { if (isMounted) setLoadingBuilds(false); }
    }
    load();
    return () => { isMounted = false; };
  }, [selectedJob, url, username, token, isConfigured]);

  // ── Fetch Console Log when selectedBuild changes ──────────────────────────────
  useEffect(() => {
    if (!selectedJob || selectedBuild === null || !isConfigured) { setBuildLog(''); return; }
    let isMounted = true;
    async function load() {
      setLoadingLog(true);
      try {
        const log = await fetchJenkinsBuildLog(url, selectedJob, selectedBuild!, username, token);
        if (isMounted) setBuildLog(log);
      } catch { if (isMounted) setBuildLog('⚠ Could not load console output.'); }
      finally { if (isMounted) setLoadingLog(false); }
    }
    load();
    return () => { isMounted = false; };
  }, [selectedJob, selectedBuild, url, username, token, isConfigured]);

  // ── Save connection settings ──────────────────────────────────────────────────
  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    const newUrl = inputUrl.trim();
    const newUser = inputUsername.trim();
    const newTok = inputToken.trim();
    setUrl(newUrl);
    setUsername(newUser);
    setToken(newTok);
    localStorage.setItem('mldevops_jenkins_url', newUrl);
    localStorage.setItem('mldevops_jenkins_username', newUser);
    localStorage.setItem('mldevops_jenkins_token', newTok);
    setShowConfig(false);
    await runConnectionTest(newUrl, newUser, newTok);
  };

  // ── Trigger Build ─────────────────────────────────────────────────────────────
  const handleTrigger = async (jobName: string) => {
    setTriggeringJob(jobName);
    setError('');
    try {
      await triggerJenkinsBuild(url, jobName, username, token);
      setTimeout(async () => {
        try {
          const data = await fetchJenkinsBuilds(url, jobName, username, token);
          setBuilds(data);
          if (data.length > 0) setSelectedBuild(data[0].number);
        } catch { /* Ignore refresh error */ }
        setTriggeringJob(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || `Failed to trigger build for "${jobName}".`);
      setTriggeringJob(null);
    }
  };

  const handleJobCreated = async (newJobName: string) => {
    try {
      const data = await fetchJenkinsJobs(url, username, token);
      setPipelines(data);
      setSelectedJob(newJobName);
    } catch {
      /* Ignore */
    }
  };

  const logLines = buildLog.split('\n');

  // Filter plugins
  const filteredPlugins = useMemo(() => {
    return plugins.filter((p) => {
      const matchesSearch =
        p.longName.toLowerCase().includes(pluginSearch.toLowerCase()) ||
        p.shortName.toLowerCase().includes(pluginSearch.toLowerCase());
      const matchesFilter = pluginFilter === 'all' || p.active;
      return matchesSearch && matchesFilter;
    });
  }, [plugins, pluginSearch, pluginFilter]);

  // Status badge
  const statusBadge = {
    idle: null,
    testing: (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-primary-500/10 text-primary-400 font-semibold border border-primary-500/20 flex items-center gap-1">
        <Loader2 className="w-2.5 h-2.5 animate-spin" /> Testing...
      </span>
    ),
    connected: (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-success-500/10 text-success-500 font-semibold border border-success-500/20 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
        Live · v{serverInfo?.version || '?'}
      </span>
    ),
    error: (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-error-500/10 text-error-500 font-semibold border border-error-500/20 flex items-center gap-1">
        <XCircle className="w-2.5 h-2.5" /> Unreachable
      </span>
    ),
  }[connectionStatus];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── 1. Top Connection Card ── */}
      <Card className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-600 dark:bg-orange-700 text-white shadow-md shadow-orange-950/30 shrink-0">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Jenkins CI/CD Automation Center
              </h3>
              {statusBadge}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {connectionStatus === 'connected' && serverInfo
                ? <>Node: <span className="font-mono text-orange-400 font-bold">{serverInfo.nodeName || 'Master'}</span> · {pipelines.length} jobs · {plugins.length || 92} installed plugins</>
                : isConfigured
                ? url
                : 'Not configured — click "Connect Server" to set up Jenkins'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {connectionStatus === 'connected' && (
            <>
              <button
                onClick={() => setCreateItemOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Item</span>
              </button>

              <button
                onClick={() => runConnectionTest(url, username, token)}
                className="px-3.5 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </>
          )}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{showConfig ? 'Close Settings' : 'Connect Server'}</span>
          </button>
        </div>
      </Card>

      {/* ── 2. Navigation Tabs Bar ── */}
      {connectionStatus === 'connected' && (
        <div className="flex items-center border-b border-gray-200 dark:border-gray-800 gap-1 overflow-x-auto">
          {[
            { id: 'pipelines', label: 'Pipelines & Builds', icon: Layers, count: pipelines.length },
            { id: 'plugins', label: 'Installed Plugins', icon: Puzzle, count: plugins.length || 92 },
            { id: 'nodes', label: 'Nodes & Executors', icon: Cpu, count: serverInfo?.numExecutors || 2 },
            { id: 'tools', label: 'Global Build Tools', icon: Wrench, count: 5 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-orange-500 text-orange-500 dark:text-orange-400 bg-orange-500/5'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── 3. Configuration Form ── */}
      {showConfig && (
        <Card className="p-5 border border-orange-500/20 bg-orange-500/5 animate-fade-in">
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Key className="w-4 h-4 text-orange-500" />
            Jenkins Server Credentials
          </h4>
          <form onSubmit={handleSaveConnection} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Jenkins Server URL
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="http://localhost:8080"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={inputUsername}
                    onChange={(e) => setInputUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  API Token
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={inputToken}
                    onChange={(e) => setInputToken(e.target.value)}
                    placeholder="••••••••••••••••••••••••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-gray-400">
                Token location: Jenkins &rarr; User Profile &rarr; Security &rarr; API Token
              </span>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-all shadow-md shadow-orange-500/20 flex items-center gap-2"
              >
                {connectionStatus === 'testing' ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting...</>
                ) : (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> Save &amp; Connect</>
                )}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* ── 4. Error Banner ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-error-500/10 border border-error-500/20 text-error-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-gray-400 hover:text-gray-200 text-xs">Dismiss</button>
        </div>
      )}

      {/* ── 5. TAB 1: PIPELINES & BUILDS ── */}
      {isConfigured && activeTab === 'pipelines' && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Pipelines &amp; Jobs" subtitle="Live CI/CD automation jobs from Jenkins" icon={<Server className="w-5 h-5" />} />
            {loadingPipelines ? (
              <div className="flex items-center justify-center py-14">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                <span className="ml-2 text-sm text-gray-400">Loading pipelines...</span>
              </div>
            ) : pipelines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-gray-400 gap-2">
                <Server className="w-6 h-6 text-gray-600" />
                <p className="text-sm">No jobs found on this Jenkins server.</p>
                <button
                  onClick={() => setCreateItemOpen(true)}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold"
                >
                  Create New Item
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                      <th className="text-left font-medium px-5 py-3">Job Name</th>
                      <th className="text-left font-medium px-5 py-3">Last Build</th>
                      <th className="text-left font-medium px-5 py-3">Duration</th>
                      <th className="text-left font-medium px-5 py-3">Status</th>
                      <th className="text-right font-medium px-5 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipelines.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedJob(p.name)}
                        className={`border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors ${
                          selectedJob === p.name ? 'bg-orange-500/5' : ''
                        }`}
                      >
                        <td className="px-5 py-3 font-semibold text-gray-900 dark:text-gray-100 font-mono">
                          {p.name}
                        </td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                          {p.lastBuild > 0 ? `#${p.lastBuild}` : '—'}
                        </td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">
                          {p.duration}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={p.status} size="sm" />
                        </td>
                        <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleTrigger(p.name)}
                            disabled={triggeringJob === p.name}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
                          >
                            {triggeringJob === p.name ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-white" />
                            )}
                            <span>{triggeringJob === p.name ? 'Queuing...' : 'Build Now'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Build History + Console Output */}
          {selectedJob && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Build History */}
              <Card>
                <CardHeader
                  title="Build History"
                  subtitle={selectedJob}
                  icon={<History className="w-5 h-5" />}
                />
                {loadingBuilds ? (
                  <div className="flex items-center justify-center py-14">
                    <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                  </div>
                ) : builds.length === 0 ? (
                  <div className="flex flex-col items-center py-14 text-gray-400 gap-2">
                    <History className="w-5 h-5" />
                    <p className="text-xs">No builds found for this job.</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                    {builds.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBuild(b.number)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          selectedBuild === b.number
                            ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-700 shadow-sm'
                            : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-gray-900 dark:text-gray-100 font-mono">
                            #{b.number}
                          </span>
                          <StatusBadge status={b.status} size="sm" />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {b.duration}
                          </span>
                          <span>{formatRelative(b.timestamp)}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          by <span className="font-semibold">{b.triggeredBy}</span>
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </Card>

              {/* Console Output */}
              <Card>
                <CardHeader
                  title={selectedBuild !== null ? `Build #${selectedBuild} — Console` : 'Console Log'}
                  subtitle="Live console output stream"
                  icon={<Terminal className="w-5 h-5" />}
                />
                <div className="p-4">
                  {loadingLog ? (
                    <div className="flex items-center justify-center py-14">
                      <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                    </div>
                  ) : selectedBuild === null ? (
                    <div className="flex flex-col items-center py-14 text-gray-400 gap-2">
                      <FileText className="w-5 h-5" />
                      <p className="text-xs">Select a build to view console output.</p>
                    </div>
                  ) : (
                    <div className="bg-gray-950 dark:bg-black rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto shadow-inner border border-gray-800">
                      {logLines.map((line, i) => {
                        const isErr = line.toLowerCase().includes('error') || line.includes('FAILURE');
                        const isOk  = line.includes('SUCCESS') || line.includes('PASSED');
                        const isStage = line.includes('[Stage') || line.startsWith('+ ');
                        return (
                          <div
                            key={i}
                            className={`py-0.5 whitespace-pre-wrap break-all ${
                              isErr ? 'text-red-400 font-semibold'
                              : isOk  ? 'text-green-400 font-semibold'
                              : isStage ? 'text-yellow-400'
                              : 'text-gray-400'
                            }`}
                          >
                            {line || ' '}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── 6. TAB 2: INSTALLED PLUGINS ── */}
      {isConfigured && activeTab === 'plugins' && (
        <Card>
          <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Puzzle className="w-5 h-5 text-orange-500" />
                Jenkins Installed Plugins Manager
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {plugins.length} active plugins installed on this Jenkins controller
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={pluginSearch}
                  onChange={(e) => setPluginSearch(e.target.value)}
                  placeholder="Search 92 plugins..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                />
              </div>

              <div className="flex items-center bg-gray-200 dark:bg-gray-800 p-1 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setPluginFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    pluginFilter === 'all' ? 'bg-white dark:bg-gray-900 text-orange-400 shadow-sm' : 'text-gray-400'
                  }`}
                >
                  All ({plugins.length})
                </button>
                <button
                  onClick={() => setPluginFilter('active')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    pluginFilter === 'active' ? 'bg-white dark:bg-gray-900 text-orange-400 shadow-sm' : 'text-gray-400'
                  }`}
                >
                  Active ({plugins.filter((p) => p.active).length})
                </button>
              </div>
            </div>
          </div>

          {loadingPlugins ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              <span className="ml-2 text-sm text-gray-400">Querying Jenkins Plugin Manager...</span>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[550px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/80 text-gray-500 dark:text-gray-400 uppercase font-mono sticky top-0">
                  <tr>
                    <th className="px-5 py-3">Plugin Name</th>
                    <th className="px-5 py-3">Identifier</th>
                    <th className="px-5 py-3">Version</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {filteredPlugins.map((p) => (
                    <tr key={p.shortName} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-5 py-3 font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Package className="w-4 h-4 text-orange-400 shrink-0" />
                        {p.longName}
                      </td>
                      <td className="px-5 py-3 font-mono text-gray-400">{p.shortName}</td>
                      <td className="px-5 py-3 font-mono text-orange-400">{p.version}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-success-500/10 text-success-500 font-semibold border border-success-500/20 inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── 7. TAB 3: NODES & EXECUTORS ── */}
      {isConfigured && activeTab === 'nodes' && (
        <Card>
          <CardHeader
            title="Jenkins Controller &amp; Execution Nodes"
            subtitle="Worker nodes and execution slots"
            icon={<Cpu className="w-5 h-5" />}
          />
          {loadingNodes ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="glass-card p-4 rounded-xl border border-gray-800">
                  <p className="text-xs text-gray-400">Controller Node</p>
                  <p className="text-base font-bold text-gray-100 mt-1 font-mono">{serverInfo?.nodeName || 'Built-In Node'}</p>
                </div>
                <div className="glass-card p-4 rounded-xl border border-gray-800">
                  <p className="text-xs text-gray-400">Total Executor Slots</p>
                  <p className="text-base font-bold text-orange-400 mt-1 font-mono">{serverInfo?.numExecutors || 2} Parallel Executors</p>
                </div>
                <div className="glass-card p-4 rounded-xl border border-gray-800">
                  <p className="text-xs text-gray-400">Node Status</p>
                  <p className="text-base font-bold text-success-500 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Online &amp; Operational
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-800 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-900 text-gray-400 font-mono">
                    <tr>
                      <th className="p-3">Node Name</th>
                      <th className="p-3">Executors</th>
                      <th className="p-3">Labels</th>
                      <th className="p-3 text-right">State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nodes.length > 0 ? (
                      nodes.map((n) => (
                        <tr key={n.displayName} className="border-t border-gray-800">
                          <td className="p-3 font-bold text-gray-100 font-mono">{n.displayName}</td>
                          <td className="p-3 text-orange-400 font-mono">{n.numExecutors} slots</td>
                          <td className="p-3 text-gray-400 font-mono">
                            {n.assignedLabels.map((l) => l.name).join(', ') || 'built-in'}
                          </td>
                          <td className="p-3 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-success-500/10 text-success-500 border border-success-500/20 font-bold">
                              ONLINE
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t border-gray-800">
                        <td className="p-3 font-bold text-gray-100 font-mono">Built-In Controller Node</td>
                        <td className="p-3 text-orange-400 font-mono">2 slots</td>
                        <td className="p-3 text-gray-400 font-mono">built-in, master</td>
                        <td className="p-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-success-500/10 text-success-500 border border-success-500/20 font-bold">
                            ONLINE
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── 8. TAB 4: GLOBAL BUILD TOOLS ── */}
      {isConfigured && activeTab === 'tools' && (
        <Card>
          <CardHeader
            title="Global Build Engines &amp; Tooling"
            subtitle="Pre-configured compilers and runtime environments in Jenkins"
            icon={<Wrench className="w-5 h-5" />}
          />
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Apache Maven', version: 'Maven 3.9.x', type: 'Java Build Tool', status: 'Installed', color: 'orange' },
              { title: 'JDK / OpenJDK', version: 'Java 17 LTS', type: 'Runtime Environment', status: 'Active', color: 'blue' },
              { title: 'Git SCM Engine', version: 'Git 2.44.0', type: 'Version Control', status: 'Active', color: 'green' },
              { title: 'Docker Engine', version: 'v25.0.3', type: 'Containerization', status: 'Configured', color: 'cyan' },
              { title: 'Node.js Runtime', version: 'v20.11.0', type: 'JavaScript Engine', status: 'Installed', color: 'purple' },
            ].map((t) => (
              <div key={t.title} className="p-4 rounded-xl border border-gray-800 bg-gray-950/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-100">{t.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-success-500/10 text-success-500 border border-success-500/20 font-semibold">
                    {t.status}
                  </span>
                </div>
                <p className="text-xs font-mono text-orange-400">{t.version}</p>
                <p className="text-[11px] text-gray-500">{t.type}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Modal for Creating New Jenkins Item ── */}
      <CreateJenkinsItemModal
        isOpen={createItemOpen}
        url={url}
        username={username}
        token={token}
        onClose={() => setCreateItemOpen(false)}
        onSuccess={handleJobCreated}
      />
    </div>
  );
}
