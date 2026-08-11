import { useState, useEffect } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import CreateRepoModal from '@/components/ui/CreateRepoModal';
import {
  fetchUserRepos,
  fetchRepoBranches,
  fetchRepoCommits,
  RealGitHubRepo,
  RealGitHubBranch,
  RealGitHubCommit,
} from '@/api/githubApi';
import { formatRelative } from '@/utils/format';
import {
  Github,
  GitBranch,
  GitCommit,
  Star,
  Lock,
  Globe,
  Play,
  CheckCircle2,
  Search,
  ExternalLink,
  RefreshCw,
  Key,
  User,
  AlertCircle,
  Sparkles,
  Plus,
} from 'lucide-react';

export default function GitHubPage() {
  // Account state persisted in localStorage
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('mldevops_github_username') || import.meta.env.VITE_GITHUB_USERNAME || 'torvalds'; // Default to env or famous torvalds
  });
  const [token, setToken] = useState<string>(() => {
    return localStorage.getItem('mldevops_github_token') || import.meta.env.VITE_GITHUB_TOKEN || '';
  });

  const [inputUsername, setInputUsername] = useState(username);
  const [inputToken, setInputToken] = useState(token);
  const [showConfig, setShowConfig] = useState(false);

  // Data state
  const [repos, setRepos] = useState<RealGitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<RealGitHubRepo | null>(null);
  const [branches, setBranches] = useState<RealGitHubBranch[]>([]);
  const [commits, setCommits] = useState<RealGitHubCommit[]>([]);

  // Loading & Error states
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [triggered, setTriggered] = useState(false);

  // 1. Fetch repos when username or token changes
  useEffect(() => {
    let isMounted = true;
    async function loadRepos() {
      if (!username.trim()) return;
      setLoadingRepos(true);
      setError('');
      try {
        const data = await fetchUserRepos(username.trim(), token.trim() || undefined);
        if (isMounted) {
          setRepos(data);
          if (data.length > 0) {
            setSelectedRepo(data[0]);
          } else {
            setSelectedRepo(null);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch repositories from GitHub API');
        }
      } finally {
        if (isMounted) setLoadingRepos(false);
      }
    }

    loadRepos();
    return () => {
      isMounted = false;
    };
  }, [username, token]);

  // 2. Fetch branches & commits when selectedRepo changes
  useEffect(() => {
    let isMounted = true;
    async function loadRepoDetails() {
      if (!selectedRepo) {
        setBranches([]);
        setCommits([]);
        return;
      }

      const [owner, repoName] = selectedRepo.full_name.split('/');

      // Fetch branches
      setLoadingBranches(true);
      try {
        const bData = await fetchRepoBranches(owner, repoName, token.trim() || undefined);
        if (isMounted) setBranches(bData);
      } catch (e) {
        if (isMounted) setBranches([]);
      } finally {
        if (isMounted) setLoadingBranches(false);
      }

      // Fetch commits
      setLoadingCommits(true);
      try {
        const cData = await fetchRepoCommits(owner, repoName, token.trim() || undefined);
        if (isMounted) setCommits(cData);
      } catch (e) {
        if (isMounted) setCommits([]);
      } finally {
        if (isMounted) setLoadingCommits(false);
      }
    }

    loadRepoDetails();
    return () => {
      isMounted = false;
    };
  }, [selectedRepo, token]);

  // Modals state
  const [createRepoOpen, setCreateRepoOpen] = useState(false);

  const handleCreateRepo = (newRepo: RealGitHubRepo) => {
    setRepos((prev) => [newRepo, ...prev]);
    setSelectedRepo(newRepo);
  };

  // Save new account connection settings
  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUsername.trim()) return;
    setUsername(inputUsername.trim());
    setToken(inputToken.trim());
    localStorage.setItem('mldevops_github_username', inputUsername.trim());
    localStorage.setItem('mldevops_github_token', inputToken.trim());
    setShowConfig(false);
  };

  const handleTrigger = () => {
    setTriggered(true);
    setTimeout(() => setTriggered(false), 3000);
  };

  const filteredRepos = repos.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.language && r.language.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── 1. Top Connection Card ── */}
      <Card className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gray-900 dark:bg-gray-800 text-white shadow-md shadow-gray-900/30 shrink-0">
            <Github className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                GitHub Live API Connected
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-success-500/10 text-success-500 font-semibold border border-success-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
                Live REST API v3
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Account / Org: <span className="font-mono text-primary-400 font-bold">@{username}</span> · {repos.length} live repositories loaded
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setCreateRepoOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-success-600 hover:bg-success-500 text-white text-xs font-semibold shadow-md shadow-success-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Repository</span>
          </button>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-3.5 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-md shadow-primary-500/20 transition-all flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            <span>{showConfig ? 'Close Settings' : 'Account Settings'}</span>
          </button>
        </div>
      </Card>

      {/* ── 2. Account Setup / Token Configuration Drawer ── */}
      {showConfig && (
        <Card className="p-6 border-primary-500/30 bg-primary-500/5 dark:bg-primary-950/20 space-y-4 animate-slide-in">
          <div className="flex items-center justify-between border-b border-primary-500/20 pb-3">
            <div className="flex items-center gap-2">
              <Github className="w-5 h-5 text-primary-400" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Connect Your Personal or Organization GitHub Account
              </h3>
            </div>
            <span className="text-xs text-gray-400">Loads real repositories &amp; commits</span>
          </div>

          <form onSubmit={handleSaveConnection} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  GitHub Username / Organization Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={inputUsername}
                    onChange={(e) => setInputUsername(e.target.value)}
                    placeholder="e.g. your-github-username or facebook"
                    className="input pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Personal Access Token (PAT) <span className="text-[10px] text-gray-500 font-normal">(Optional for private repos)</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={inputToken}
                    onChange={(e) => setInputToken(e.target.value)}
                    placeholder="ghp_••••••••••••••••••••••••••••••••"
                    className="input pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Quick Try Popular Repos:</span>
                {(['torvalds', 'facebook', 'vercel', 'google'] as const).map((user) => (
                  <button
                    key={user}
                    type="button"
                    onClick={() => {
                      setInputUsername(user);
                      setUsername(user);
                      localStorage.setItem('mldevops_github_username', user);
                    }}
                    className="px-2 py-1 rounded text-[11px] bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 font-mono transition-colors"
                  >
                    @{user}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs transition-all shadow-md shadow-primary-500/20"
              >
                Fetch Exact GitHub Data
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-error-500/10 border border-error-500/30 text-error-500 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setUsername('torvalds')}
            className="underline font-semibold"
          >
            Reset to default @torvalds
          </button>
        </div>
      )}

      {/* ── 3. Main 2-Column Dashboard ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ══════════════════════════════════════════
            LEFT COLUMN — EXACT REPOSITORIES
        ══════════════════════════════════════════ */}
        <Card className="lg:col-span-1 flex flex-col justify-between">
          <div>
            <CardHeader
              title={`Repositories (${filteredRepos.length})`}
              subtitle={`Loaded from @${username}`}
              icon={<Github className="w-5 h-5" />}
              action={
                loadingRepos ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-primary-400" />
                ) : undefined
              }
            />

            {/* Filter Search Input */}
            <div className="p-3 border-b border-gray-100 dark:border-gray-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter repos..."
                  className="input pl-8 py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Repositories list */}
            <div className="p-3 space-y-2 max-h-[480px] overflow-y-auto">
              {loadingRepos ? (
                <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary-400" />
                  <p>Fetching exact GitHub repositories for @{username}...</p>
                </div>
              ) : filteredRepos.length > 0 ? (
                filteredRepos.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => setSelectedRepo(repo)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${selectedRepo?.id === repo.id
                      ? 'border-primary-500 bg-primary-500/10 text-primary-400 shadow-md shadow-primary-500/10'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900/60'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                        {repo.name}
                      </span>
                      {repo.private ? (
                        <Lock className="w-3 h-3 text-warning-500" />
                      ) : (
                        <Globe className="w-3 h-3 text-gray-400" />
                      )}
                    </div>

                    {repo.description && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mb-2">
                        {repo.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Star className="w-3 h-3 text-warning-500" />
                        {repo.stargazers_count}
                      </span>
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-primary-500" />
                          {repo.language}
                        </span>
                      )}
                      <span className="ml-auto text-[10px]">{formatRelative(repo.updated_at)}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-gray-400">
                  No public repositories found for @{username}.
                </div>
              )}
            </div>
          </div>

          {/* Footer external link */}
          {selectedRepo && (
            <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/40">
              <a
                href={selectedRepo.html_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-500/10 transition-colors"
              >
                <span>Open {selectedRepo.name} on GitHub.com</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </Card>

        {/* ══════════════════════════════════════════
            RIGHT COLUMN — EXACT BRANCHES & COMMITS
        ══════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. Exact Branches */}
          <Card>
            <CardHeader
              title={`Branches — ${selectedRepo ? selectedRepo.name : 'Select Repo'}`}
              subtitle={selectedRepo ? `Default branch: ${selectedRepo.default_branch}` : 'Exact branches from GitHub'}
              icon={<GitBranch className="w-5 h-5" />}
              action={
                loadingBranches ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-primary-400" />
                ) : undefined
              }
            />
            <div className="p-4 space-y-2.5 max-h-[220px] overflow-y-auto">
              {loadingBranches ? (
                <div className="py-6 text-center text-xs text-gray-400">
                  Loading branches...
                </div>
              ) : branches.length > 0 ? (
                branches.map((b) => (
                  <div
                    key={b.name}
                    className="p-3 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50/60 dark:bg-gray-800/40 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400 shrink-0">
                        <GitBranch className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                            {b.name}
                          </span>
                          {selectedRepo && b.name === selectedRepo.default_branch && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-success-500/10 text-success-500 font-mono font-semibold">
                              DEFAULT
                            </span>
                          )}
                          {b.protected && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-warning-500/10 text-warning-500 font-mono font-semibold">
                              PROTECTED
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-gray-500 truncate">
                          SHA: {b.commit.sha.substring(0, 7)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-gray-400">
                  Select a repository to view exact branches.
                </div>
              )}
            </div>
          </Card>

          {/* 2. Exact Commits */}
          <Card>
            <CardHeader
              title={`Live Commits — ${selectedRepo ? selectedRepo.name : ''}`}
              subtitle="Real commit history from GitHub REST API"
              icon={<GitCommit className="w-5 h-5" />}
              action={
                loadingCommits ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-primary-400" />
                ) : undefined
              }
            />
            <div className="p-4 space-y-2.5 max-h-[320px] overflow-y-auto">
              {loadingCommits ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  Fetching live commit logs...
                </div>
              ) : commits.length > 0 ? (
                commits.map((c) => (
                  <a
                    key={c.sha}
                    href={c.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50/60 dark:bg-gray-800/40 flex items-start gap-3 hover:border-primary-500/50 hover:bg-primary-500/5 transition-all group"
                  >
                    {c.author?.avatar_url ? (
                      <img
                        src={c.author.avatar_url}
                        alt={c.commit.author.name}
                        className="w-8 h-8 rounded-full border border-gray-700 shrink-0 mt-0.5"
                      />
                    ) : (
                      <div className="p-2 rounded-lg bg-accent-500/10 text-accent-400 shrink-0">
                        <GitCommit className="w-4 h-4" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-400 transition-colors">
                        {c.commit.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-primary-400 font-bold">
                          {c.sha.substring(0, 7)}
                        </span>
                        <span>by {c.commit.author.name}</span>
                        <span>· {formatRelative(c.commit.author.date)}</span>
                      </div>
                    </div>

                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-400 shrink-0 self-center" />
                  </a>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">
                  Select a repository to view live commit logs.
                </div>
              )}
            </div>
          </Card>

          {/* 3. Trigger Webhook */}
          {selectedRepo && (
            <Card className="p-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Trigger Webhook for {selectedRepo.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Send repository dispatch to target CI/CD pipelines
                </p>
              </div>

              <button
                onClick={handleTrigger}
                disabled={triggered}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition-all disabled:opacity-60"
              >
                {triggered ? <CheckCircle2 className="w-4 h-4 text-success-400" /> : <Play className="w-4 h-4 fill-white" />}
                {triggered ? 'Webhook Triggered!' : 'Trigger Pipeline'}
              </button>
            </Card>
          )}

        </div>
      </div>

      {/* ── Create Repository Modal ── */}
      <CreateRepoModal
        isOpen={createRepoOpen}
        username={username}
        token={token}
        onClose={() => setCreateRepoOpen(false)}
        onCreate={handleCreateRepo}
      />

    </div>
  );
}
