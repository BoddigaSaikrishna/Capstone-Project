import { useState, useEffect } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  fetchJenkinsJobs,
  fetchJenkinsBuilds,
  fetchJenkinsBuildLog,
  triggerJenkinsBuild,
} from '@/api/jenkinsApi';
import type { JenkinsPipeline, JenkinsBuild } from '@/types';
import { formatRelative } from '@/utils/format';
import {
  Server,
  Play,
  FileText,
  Clock,
  History,
  CheckCircle2,
  Key,
  User,
  Globe,
  RefreshCw,
  AlertCircle,
  Settings,
} from 'lucide-react';

export default function JenkinsPage() {
  // Connection states (persisted in localStorage or environment fallback)
  const [url, setUrl] = useState<string>(() => {
    return localStorage.getItem('mldevops_jenkins_url') || import.meta.env.VITE_JENKINS_URL || '';
  });
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('mldevops_jenkins_username') || import.meta.env.VITE_JENKINS_USERNAME || '';
  });
  const [token, setToken] = useState<string>(() => {
    return localStorage.getItem('mldevops_jenkins_token') || import.meta.env.VITE_JENKINS_TOKEN || '';
  });

  const [inputUrl, setInputUrl] = useState(url);
  const [inputUsername, setInputUsername] = useState(username);
  const [inputToken, setInputToken] = useState(token);
  const [showConfig, setShowConfig] = useState(false);

  // Data states
  const [pipelines, setPipelines] = useState<JenkinsPipeline[]>([]);
  const [builds, setBuilds] = useState<JenkinsBuild[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [selectedBuild, setSelectedBuild] = useState<number | null>(null);
  const [buildLog, setBuildLog] = useState<string>('');

  // Loading & error states
  const [loadingPipelines, setLoadingPipelines] = useState(false);
  const [loadingBuilds, setLoadingBuilds] = useState(false);
  const [loadingLog, setLoadingLog] = useState(false);
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);
  const [error, setError] = useState('');

  const isLive = !!(url && username && token);

  // 1. Fetch Pipelines/Jobs on mount or credentials change
  useEffect(() => {
    let isMounted = true;
    async function loadPipelines() {
      setLoadingPipelines(true);
      setError('');
      try {
        const data = await fetchJenkinsJobs(url, username, token);
        if (isMounted) {
          setPipelines(data);
          if (data.length > 0) {
            // Select first job by default to load history
            setSelectedJob(data[0].name);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to connect to Jenkins server');
        }
      } finally {
        if (isMounted) setLoadingPipelines(false);
      }
    }
    loadPipelines();
    return () => {
      isMounted = false;
    };
  }, [url, username, token]);

  // 2. Fetch Builds/History when selectedJob or credentials change
  useEffect(() => {
    let isMounted = true;
    async function loadBuilds() {
      if (!selectedJob) return;
      setLoadingBuilds(true);
      try {
        const data = await fetchJenkinsBuilds(url, selectedJob, username, token);
        if (isMounted) {
          setBuilds(data);
          if (data.length > 0) {
            setSelectedBuild(data[0].number);
          } else {
            setSelectedBuild(null);
            setBuildLog('');
          }
        }
      } catch (e) {
        if (isMounted) setBuilds([]);
      } finally {
        if (isMounted) setLoadingBuilds(false);
      }
    }
    loadBuilds();
    return () => {
      isMounted = false;
    };
  }, [selectedJob, url, username, token]);

  // 3. Fetch Console logs when selectedBuild or selectedJob changes
  useEffect(() => {
    let isMounted = true;
    async function loadLog() {
      if (!selectedJob || selectedBuild === null) {
        setBuildLog('');
        return;
      }
      setLoadingLog(true);
      try {
        const log = await fetchJenkinsBuildLog(url, selectedJob, selectedBuild, username, token);
        if (isMounted) setBuildLog(log);
      } catch (e) {
        if (isMounted) setBuildLog('Failed to load build console output logs.');
      } finally {
        if (isMounted) setLoadingLog(false);
      }
    }
    loadLog();
    return () => {
      isMounted = false;
    };
  }, [selectedJob, selectedBuild, url, username, token]);

  // Save Jenkins server settings
  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    setUrl(inputUrl.trim());
    setUsername(inputUsername.trim());
    setToken(inputToken.trim());
    localStorage.setItem('mldevops_jenkins_url', inputUrl.trim());
    localStorage.setItem('mldevops_jenkins_username', inputUsername.trim());
    localStorage.setItem('mldevops_jenkins_token', inputToken.trim());
    setShowConfig(false);
  };

  // Trigger build execution
  const handleTrigger = async (jobName: string) => {
    setTriggeringJob(jobName);
    try {
      await triggerJenkinsBuild(url, jobName, username, token);
      
      // If we are in live mode, refresh the builds after a small delay
      if (isLive) {
        setTimeout(async () => {
          const updatedBuilds = await fetchJenkinsBuilds(url, jobName, username, token);
          setBuilds(updatedBuilds);
          if (updatedBuilds.length > 0) {
            setSelectedBuild(updatedBuilds[0].number);
          }
        }, 1500);
      } else {
        // If we are running in simulated mock fallback mode
        const newBuildNum = Math.max(...builds.map((b) => b.number), 0) + 1;
        const newBuild: JenkinsBuild = {
          id: `jb_${jobName}_${Date.now()}`,
          number: newBuildNum,
          pipeline: jobName,
          status: 'running',
          duration: 'In progress...',
          timestamp: new Date().toISOString(),
          triggeredBy: 'manual-trigger',
        };
        setBuilds((prev) => [newBuild, ...prev]);
        setSelectedBuild(newBuildNum);
        setBuildLog(`[${new Date().toLocaleTimeString()}] Triggered manual build #${newBuildNum} for ${jobName}...\n[${new Date().toLocaleTimeString()}] Executing pipeline steps...\n[${new Date().toLocaleTimeString()}] Build completed: SUCCESS`);
      }
    } catch (err: any) {
      setError(err.message || `Failed to trigger build for ${jobName}`);
    } finally {
      setTriggeringJob(null);
    }
  };

  const logLines = buildLog.split('\n');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── 1. Top Connection Card ── */}
      <Card className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-600 dark:bg-orange-700 text-white shadow-md shadow-orange-950/30 shrink-0">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Jenkins Server Connection
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border flex items-center gap-1 ${
                isLive 
                  ? 'bg-success-500/10 text-success-500 border-success-500/20'
                  : 'bg-warning-500/10 text-warning-500 border-warning-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-success-500 animate-pulse' : 'bg-warning-500'}`} />
                {isLive ? 'Live Connection' : 'Mock Simulator'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {isLive ? `Connected to ${url}` : 'Using static fallback simulation for demonstration'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="px-3.5 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-md shadow-primary-500/20 transition-all flex items-center gap-1.5"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{showConfig ? 'Close Settings' : 'Configure Server'}</span>
        </button>
      </Card>

      {/* ── 2. Settings Form ── */}
      {showConfig && (
        <Card className="p-5 border border-primary-500/20 bg-primary-500/5 animate-slide-down">
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Key className="w-4 h-4 text-primary-500" />
            Jenkins API Settings
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
                    className="input pl-9"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Jenkins Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={inputUsername}
                    onChange={(e) => setInputUsername(e.target.value)}
                    placeholder="admin"
                    className="input pl-9"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  API Token / Password
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={inputToken}
                    onChange={(e) => setInputToken(e.target.value)}
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="input pl-9"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-gray-400 max-w-md">
                Configure your API token under your Jenkins User profile &rarr; Configure &rarr; Add new API Token.
              </span>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs transition-all shadow-md shadow-primary-500/20"
              >
                Connect Live Server
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-error-500/10 border border-error-500/20 text-error-600 dark:text-error-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── 3. Pipelines ── */}
      <Card>
        <CardHeader title="Pipelines" subtitle="CI/CD job statuses" icon={<Server className="w-5 h-5" />} />
        <div className="overflow-x-auto">
          {loadingPipelines ? (
            <div className="flex justify-center items-center py-10">
              <RefreshCw className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left font-medium px-5 py-3">Pipeline</th>
                  <th className="text-left font-medium px-5 py-3">Last Build</th>
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
                      selectedJob === p.name ? 'bg-primary-500/5' : ''
                    }`}
                  >
                    <td className="px-5 py-3 font-semibold text-gray-900 dark:text-gray-100">{p.name}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400">
                      {p.lastBuild > 0 ? `#${p.lastBuild}` : 'No builds'}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleTrigger(p.name)}
                        disabled={triggeringJob === p.name}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
                      >
                        {triggeringJob === p.name ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        <span>{triggeringJob === p.name ? 'Building...' : 'Build Now'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* ── 4. Build History & Console Logs ── */}
      {selectedJob && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Build history */}
          <Card>
            <CardHeader
              title={`Build History: ${selectedJob}`}
              subtitle="Recent executions"
              icon={<History className="w-5 h-5" />}
            />
            {loadingBuilds ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : (
              <div className="p-5 space-y-2 max-h-96 overflow-y-auto">
                {builds.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
                    No builds found for this job.
                  </p>
                ) : (
                  builds.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBuild(b.number)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selectedBuild === b.number
                          ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-700 shadow-md shadow-primary-500/5'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                          Build #{b.number}
                        </span>
                        <StatusBadge status={b.status} size="sm" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {b.duration}
                        </span>
                        <span>{formatRelative(b.timestamp)}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Triggered by: <span className="font-semibold">{b.triggeredBy}</span>
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </Card>

          {/* Build logs */}
          <Card>
            <CardHeader
              title={`Build #${selectedBuild ?? ''} Console Logs`}
              subtitle="Output stream"
              icon={<FileText className="w-5 h-5" />}
            />
            <div className="p-4">
              {loadingLog ? (
                <div className="flex justify-center items-center py-20">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary-500" />
                </div>
              ) : selectedBuild === null ? (
                <div className="text-center py-20 text-xs text-gray-500 dark:text-gray-400">
                  Select a build to view logs.
                </div>
              ) : (
                <div className="bg-gray-950 dark:bg-black rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto shadow-inner border border-gray-900">
                  {logLines.map((line, i) => {
                    const isStage = line.includes('[Stage') || line.startsWith('➜');
                    const isError = line.toLowerCase().includes('error') || line.toLowerCase().includes('failed') || line.includes('FAILURE');
                    const isSuccess = line.includes('Success') || line.includes('PASSED') || line.includes('SUCCESS');
                    return (
                      <div
                        key={i}
                        className={`py-0.5 whitespace-pre-wrap ${
                          isError
                            ? 'text-error-400 font-semibold'
                            : isSuccess
                            ? 'text-success-400 font-semibold'
                            : isStage
                            ? 'text-accent-400 font-semibold'
                            : 'text-gray-400'
                        }`}
                      >
                        {line}
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
  );
}
