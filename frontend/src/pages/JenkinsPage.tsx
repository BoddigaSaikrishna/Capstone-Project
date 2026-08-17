import { useState, useEffect, useCallback } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  testJenkinsConnection,
  fetchJenkinsJobs,
  fetchJenkinsBuilds,
  fetchJenkinsBuildLog,
  triggerJenkinsBuild,
  type JenkinsServerInfo,
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
} from 'lucide-react';
import CreateJenkinsItemModal from '@/components/ui/CreateJenkinsItemModal';

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
  const [showConfig, setShowConfig] = useState(!url); // Auto-open config if no URL

  // ── Connection state ─────────────────────────────────────────────────────────
  const [serverInfo, setServerInfo] = useState<JenkinsServerInfo | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState('');

  // ── Data states ───────────────────────────────────────────────────────────────
  const [pipelines, setPipelines] = useState<JenkinsPipeline[]>([]);
  const [builds, setBuilds] = useState<JenkinsBuild[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [selectedBuild, setSelectedBuild] = useState<number | null>(null);
  const [buildLog, setBuildLog] = useState<string>('');
  const [createItemOpen, setCreateItemOpen] = useState(false);

  // ── Loading states ────────────────────────────────────────────────────────────
  const [loadingPipelines, setLoadingPipelines] = useState(false);
  const [loadingBuilds, setLoadingBuilds] = useState(false);
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

  // ── Auto-test when credentials are configured on mount ───────────────────────
  useEffect(() => {
    if (isConfigured) {
      runConnectionTest(url, username, token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch Jobs on credentials change ─────────────────────────────────────────
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
      // Wait a moment then refresh builds
      setTimeout(async () => {
        try {
          const data = await fetchJenkinsBuilds(url, jobName, username, token);
          setBuilds(data);
          if (data.length > 0) setSelectedBuild(data[0].number);
        } catch { /* Ignore refresh errors */ }
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
      // Ignore refresh error
    }
  };

  const logLines = buildLog.split('\n');

  // ── Connection status badge ───────────────────────────────────────────────────
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
                Jenkins CI/CD Server
              </h3>
              {statusBadge}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {connectionStatus === 'connected' && serverInfo
                ? <>Node: <span className="font-mono text-orange-400 font-bold">{serverInfo.nodeName}</span> · {pipelines.length} jobs loaded · {serverInfo.numExecutors} executors</>
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

      {/* ── 2. Configuration Form ── */}
      {showConfig && (
        <Card className="p-5 border border-orange-500/20 bg-orange-500/5 animate-fade-in">
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Key className="w-4 h-4 text-orange-500" />
            Jenkins Server Settings
          </h4>
          <form onSubmit={handleSaveConnection} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Jenkins URL
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://abc123.ngrok-free.app"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-colors"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Use your ngrok tunnel URL when Jenkins is local
                </p>
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
                Generate API token: Jenkins &rarr; User &rarr; Configure &rarr; API Token &rarr; Add new Token
              </span>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-all shadow-md shadow-orange-500/20 flex items-center gap-2"
              >
                {connectionStatus === 'testing' ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting...</>
                ) : (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> Connect &amp; Test</>
                )}
              </button>
            </div>
          </form>

          {/* Connection test result */}
          {connectionStatus === 'error' && connectionError && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-error-500/10 border border-error-500/20 text-error-500 text-xs">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Connection failed</p>
                <p className="text-error-400 mt-0.5">{connectionError}</p>
              </div>
            </div>
          )}
          {connectionStatus === 'connected' && serverInfo && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-success-500/10 border border-success-500/20 text-success-500 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Successfully connected to Jenkins</p>
                <p className="text-success-400 mt-0.5">
                  Node: {serverInfo.nodeName} · Version: {serverInfo.version} · {serverInfo.numExecutors} executors
                </p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── 3. Server Stats row (only when connected) ── */}
      {connectionStatus === 'connected' && serverInfo && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <Server className="w-4 h-4" />, label: 'Node Name', value: serverInfo.nodeName, color: 'orange' },
            { icon: <Cpu className="w-4 h-4" />, label: 'Executors', value: `${serverInfo.numExecutors} slots`, color: 'primary' },
            { icon: <Zap className="w-4 h-4" />, label: 'Total Jobs', value: `${pipelines.length} pipeline${pipelines.length !== 1 ? 's' : ''}`, color: 'success' },
          ].map((stat) => (
            <Card key={stat.label} className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-500 dark:text-${stat.color}-400`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── 4. Not configured empty state ── */}
      {!isConfigured && (
        <Card className="p-12 flex flex-col items-center justify-center text-center gap-4">
          <div className="p-4 rounded-full bg-orange-500/10">
            <Server className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Jenkins Not Connected</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
              Click <strong>"Connect Server"</strong> above, enter your Jenkins URL (ngrok or public), username, and API token to load live pipeline data.
            </p>
          </div>
          <button
            onClick={() => setShowConfig(true)}
            className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-all flex items-center gap-2"
          >
            <Settings className="w-3.5 h-3.5" /> Configure Jenkins
          </button>
        </Card>
      )}

      {/* ── 5. Error banner ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-error-500/10 border border-error-500/20 text-error-600 dark:text-error-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs">Dismiss</button>
        </div>
      )}

      {/* ── 6. Pipelines table ── */}
      {isConfigured && (
        <Card>
          <CardHeader title="Pipelines" subtitle="Live CI/CD job list from Jenkins" icon={<Server className="w-5 h-5" />} />
          {loadingPipelines ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              <span className="ml-2 text-sm text-gray-500">Loading jobs from Jenkins...</span>
            </div>
          ) : pipelines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-gray-500 dark:text-gray-400 gap-2">
              <Server className="w-6 h-6 text-gray-300 dark:text-gray-600" />
              <p className="text-sm">No jobs found on this Jenkins server.</p>
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
                      <td className="px-5 py-3 font-semibold text-gray-900 dark:text-gray-100">
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
      )}

      {/* ── 7. Build History + Console Log ── */}
      {isConfigured && selectedJob && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Build History */}
          <Card>
            <CardHeader
              title={`Build History`}
              subtitle={`${selectedJob}`}
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
                        ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-700 shadow-sm shadow-orange-500/10'
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

          {/* Console Log */}
          <Card>
            <CardHeader
              title={selectedBuild !== null ? `Build #${selectedBuild} — Console` : 'Console Log'}
              subtitle="Live output from Jenkins"
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
                  <p className="text-xs">Select a build to view its console output.</p>
                </div>
              ) : (
                <div className="bg-gray-950 dark:bg-black rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto shadow-inner border border-gray-800">
                  {logLines.map((line, i) => {
                    const isErr = line.toLowerCase().includes('error') || line.includes('FAILURE') || line.toLowerCase().includes('failed');
                    const isOk  = line.includes('SUCCESS') || line.includes('PASSED') || line.includes('success');
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

      {/* Create New Jenkins Item Modal */}
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
