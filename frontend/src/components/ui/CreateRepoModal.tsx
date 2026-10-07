import { useState } from 'react';
import { createPortal } from 'react-dom';
import { createGitHubRepo, RealGitHubRepo } from '@/api/githubApi';
import {
  Github,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  Lock,
  Globe,
  Key,
  ExternalLink,
  Loader2,
  Sparkles,
  User,
  Info,
} from 'lucide-react';

interface CreateRepoModalProps {
  isOpen: boolean;
  username: string;
  token: string; // PAT — required for real repo creation
  onClose: () => void;
  onCreate: (newRepo: RealGitHubRepo) => void;
}

const PUBLIC_ORGS = ['google', 'facebook', 'vercel', 'torvalds', 'microsoft', 'netflix', 'aws'];

export default function CreateRepoModal({
  isOpen,
  username,
  token,
  onClose,
  onCreate,
}: CreateRepoModalProps) {
  const defaultOwner = PUBLIC_ORGS.includes(username.toLowerCase())
    ? 'BoddigaSaikrishna'
    : (username || 'BoddigaSaikrishna');

  const [targetOwner, setTargetOwner] = useState(defaultOwner);
  const [repoName, setRepoName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [autoInit, setAutoInit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const sanitize = (v: string) =>
    v.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');

  const isPublicOrg = PUBLIC_ORGS.includes(targetOwner.trim().toLowerCase());

  const handleClose = () => {
    setRepoName('');
    setDescription('');
    setIsPrivate(false);
    setAutoInit(true);
    setError('');
    setCreatedUrl(null);
    setIsDemoMode(false);
    onClose();
  };

  // ── Create Simulated Repository in Demo Mode ───────────────────────────────
  const handleCreateDemoRepo = () => {
    const name = sanitize(repoName) || 'ML';
    const ownerName = targetOwner.trim() || 'BoddigaSaikrishna';

    const simulatedRepo: RealGitHubRepo = {
      id: Date.now(),
      name: name,
      full_name: `${ownerName}/${name}`,
      description: description.trim() || 'Machine Learning & DevOps Automation Pipeline Repository',
      private: isPrivate,
      html_url: `https://github.com/${ownerName}/${name}`,
      default_branch: 'main',
      stargazers_count: 1,
      forks_count: 0,
      open_issues_count: 0,
      language: 'Python',
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      pushed_at: new Date().toISOString(),
      owner: {
        login: ownerName,
        avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${ownerName}`,
        html_url: `https://github.com/${ownerName}`,
      },
    };

    setIsDemoMode(true);
    setCreatedUrl(simulatedRepo.html_url);
    setError('');
    onCreate(simulatedRepo);
  };

  // ── Real GitHub API Creation ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = sanitize(repoName);
    if (!name) {
      setError('Repository name is required.');
      return;
    }

    if (isPublicOrg) {
      setError(
        `Cannot create repositories under @${targetOwner}. You do not have administrative owner permissions for this external organization. Please change the owner to your personal account (e.g. @BoddigaSaikrishna) or use Demo Mode.`
      );
      return;
    }

    if (!token) {
      setError(
        'A GitHub Personal Access Token (PAT) with "repo" scope is required for real repository creation. You can also click "Create in Demo Mode" below to proceed without a token.'
      );
      return;
    }

    setError('');
    setLoading(true);

    try {
      const created = await createGitHubRepo(
        { name, description: description.trim(), private: isPrivate, auto_init: autoInit },
        token
      );
      setCreatedUrl(created.html_url);
      onCreate(created);
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : 'Unknown GitHub API error';
      setError(
        rawMsg.includes('404')
          ? `GitHub Resource Not Found (404): Your token lacks "repo" creation permissions, or @${targetOwner} is not authorized. You can switch to Demo Mode below to create this repository instantly.`
          : rawMsg
      );
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={handleClose} className="fixed inset-0 bg-black/80 backdrop-blur-md" />

      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden z-10 animate-fade-in">
        {/* ── Header ── */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/60 dark:bg-gray-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gray-900 dark:bg-gray-800 text-white shadow-md">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Create GitHub Repository
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Live GitHub API or Simulated Workspace Demo
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Target Owner Selector ── */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-primary-500/10 border border-primary-500/20 text-xs text-primary-400">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 shrink-0" />
              <span>Target Account / Owner:</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-mono text-gray-400">@</span>
              <input
                type="text"
                value={targetOwner}
                onChange={(e) => setTargetOwner(e.target.value.trim())}
                placeholder="BoddigaSaikrishna"
                className="bg-gray-900 border border-gray-700 rounded px-2 py-0.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-primary-400 w-36"
                disabled={loading || !!createdUrl}
              />
            </div>
          </div>

          {/* Warning if public org is entered */}
          {isPublicOrg && (
            <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>
                <strong>Note:</strong> @{targetOwner} is an external organization. Repositories must be created under your personal GitHub handle (e.g. <strong>@BoddigaSaikrishna</strong>) or in Demo Mode.
              </span>
            </div>
          )}
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Banner with 1-Click Demo Mode Fallback */}
          {error && (
            <div className="p-3.5 rounded-xl bg-error-500/10 border border-error-500/30 text-error-400 text-xs space-y-2.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-error-400" />
                <span className="leading-relaxed">{error}</span>
              </div>
              <div className="pt-2 border-t border-error-500/20 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">Bypass GitHub API limits:</span>
                <button
                  type="button"
                  onClick={handleCreateDemoRepo}
                  className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Create in Demo Mode Now
                </button>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {createdUrl && (
            <div className="p-3 rounded-lg bg-success-500/10 border border-success-500/30 text-success-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="flex-1">
                Repository <strong>{sanitize(repoName) || 'ML'}</strong> created successfully {isDemoMode ? '(Demo Mode)' : 'on GitHub'}!
              </span>
              <a
                href={createdUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 underline font-semibold hover:text-success-300"
              >
                Open <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Repository Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Repository Name <span className="text-error-500">*</span>
            </label>
            <div className="relative">
              <Github className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="e.g. ML, fraud-detection-api"
                className="input pl-9 w-full bg-gray-950 border border-gray-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-primary-500"
                required
                disabled={loading || !!createdUrl}
              />
            </div>
            {repoName && (
              <p className="text-[10px] text-gray-500 font-mono pl-1">
                Will be created as: <strong>{targetOwner}/{sanitize(repoName)}</strong>
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Description <span className="text-[10px] text-gray-500 font-normal">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of this repository..."
              rows={2}
              className="input text-xs w-full bg-gray-950 border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-primary-500"
              disabled={loading || !!createdUrl}
            />
          </div>

          {/* Visibility */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Visibility
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                disabled={loading || !!createdUrl}
                className={`flex-1 p-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !isPrivate
                    ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                    : 'border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Public
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                disabled={loading || !!createdUrl}
                className={`flex-1 p-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isPrivate
                    ? 'border-warning-500 bg-warning-500/10 text-warning-400'
                    : 'border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Private
              </button>
            </div>
          </div>

          {/* Auto Init Toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoInit}
              onChange={(e) => setAutoInit(e.target.checked)}
              disabled={loading || !!createdUrl}
              className="rounded border-gray-700 text-primary-600 focus:ring-primary-500 h-4 w-4"
            />
            <span className="text-xs text-gray-300">
              Initialize with README.md (<code className="text-gray-400">auto_init</code>)
            </span>
          </label>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
            >
              {createdUrl ? 'Done' : 'Cancel'}
            </button>

            {!createdUrl && (
              <div className="flex items-center gap-2">
                {/* Instant Demo Mode button */}
                <button
                  type="button"
                  onClick={handleCreateDemoRepo}
                  className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium border border-gray-700 flex items-center gap-1.5 cursor-pointer"
                  title="Create locally without GitHub credentials"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Demo Mode
                </button>

                {/* Real GitHub API Submit */}
                <button
                  type="submit"
                  disabled={loading || !repoName.trim()}
                  className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs shadow-md shadow-primary-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>{loading ? 'Creating...' : 'Create on GitHub'}</span>
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
