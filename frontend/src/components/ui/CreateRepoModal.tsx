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
} from 'lucide-react';

interface CreateRepoModalProps {
  isOpen: boolean;
  username: string;
  token: string; // PAT — required for real repo creation
  onClose: () => void;
  onCreate: (newRepo: RealGitHubRepo) => void;
}

export default function CreateRepoModal({
  isOpen,
  username,
  token,
  onClose,
  onCreate,
}: CreateRepoModalProps) {
  const [repoName, setRepoName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [autoInit, setAutoInit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const sanitize = (v: string) =>
    v.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');

  const handleClose = () => {
    setRepoName('');
    setDescription('');
    setIsPrivate(false);
    setAutoInit(true);
    setError('');
    setCreatedUrl(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = sanitize(repoName);
    if (!name) {
      setError('Repository name is required.');
      return;
    }
    if (!token) {
      setError(
        'A GitHub Personal Access Token (PAT) is required to create repositories. ' +
          'Enter your PAT in Account Settings → Personal Access Token field.'
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
      setError(err instanceof Error ? err.message : 'Unknown GitHub API error');
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
                Create Real GitHub Repository
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Calls <span className="font-mono">POST api.github.com/user/repos</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Owner Badge ── */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary-500/8 border border-primary-500/20 text-xs font-medium text-primary-400">
            <Github className="w-3.5 h-3.5" />
            <span>Repository will be created under</span>
            <span className="font-mono font-bold">@{username || '—'}</span>
          </div>
        </div>

        {/* ── Token Gate Warning ── */}
        {!token && (
          <div className="mx-6 mt-3 p-3 rounded-lg bg-warning-500/10 border border-warning-500/30 text-warning-500 text-xs flex items-start gap-2">
            <Key className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Personal Access Token (PAT) required</p>
              <p className="mt-0.5 text-warning-400">
                Close this modal, click <strong>Account Settings</strong>, and enter your GitHub PAT
                (with <code>repo</code> scope) to enable real repository creation.
              </p>
            </div>
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {createdUrl && (
            <div className="p-3 rounded-lg bg-success-500/10 border border-success-500/30 text-success-500 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="flex-1">Repository created on GitHub!</span>
              <a
                href={createdUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 underline font-semibold hover:text-success-400"
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
                placeholder="e.g. mlops-fraud-detection-v2"
                className="input pl-9"
                required
                disabled={loading || !!createdUrl}
              />
            </div>
            {repoName && (
              <p className="text-[10px] text-gray-500 font-mono pl-1">
                Will be created as: <strong>{sanitize(repoName)}</strong>
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Description{' '}
              <span className="text-[10px] text-gray-500 font-normal">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of this repository..."
              rows={2}
              className="input text-xs"
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
                className={`flex-1 p-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  !isPrivate
                    ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                    : 'border-gray-200 dark:border-gray-800 text-gray-400'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Public
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                disabled={loading || !!createdUrl}
                className={`flex-1 p-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  isPrivate
                    ? 'border-warning-500 bg-warning-500/10 text-warning-400'
                    : 'border-gray-200 dark:border-gray-800 text-gray-400'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Private
              </button>
            </div>
          </div>

          {/* Auto Init Toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={autoInit}
                onChange={(e) => setAutoInit(e.target.checked)}
                disabled={loading || !!createdUrl}
              />
              <div className="w-9 h-5 rounded-full bg-gray-300 dark:bg-gray-700 peer-checked:bg-primary-600 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Initialize with README.md (auto_init)
            </span>
          </label>

          {/* Footer */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {createdUrl ? 'Done' : 'Cancel'}
            </button>

            {!createdUrl && (
              <button
                type="submit"
                disabled={loading || !repoName.trim() || !token}
                className="px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs transition-all shadow-md shadow-primary-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating on GitHub…</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Repository on GitHub</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
