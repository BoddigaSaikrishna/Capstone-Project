import { useState } from 'react';
import { createPortal } from 'react-dom';
import { GitBranch, X, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

interface CreateBranchModalProps {
  isOpen: boolean;
  repoName: string;
  existingBranches: string[];
  onClose: () => void;
  onCreate: (newBranchName: string, sourceBranch: string) => void;
}

export default function CreateBranchModal({
  isOpen,
  repoName,
  existingBranches,
  onClose,
  onCreate,
}: CreateBranchModalProps) {
  const [branchName, setBranchName] = useState('');
  const [sourceBranch, setSourceBranch] = useState(existingBranches[0] || 'main');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) {
      setError('Please enter a valid branch name');
      return;
    }

    const sanitized = branchName.trim().toLowerCase().replace(/\s+/g, '-');
    if (existingBranches.includes(sanitized)) {
      setError(`Branch '${sanitized}' already exists`);
      return;
    }

    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      onCreate(sanitized, sourceBranch);
      setTimeout(() => {
        setSuccess(false);
        setBranchName('');
        onClose();
      }, 1000);
    }, 800);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-md" />

      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden z-10">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-600/10 text-primary-400 border border-primary-500/20">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Create New Branch
              </h3>
              <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                Target Repo: {repoName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-success-500/10 border border-success-500/30 text-success-500 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Branch '{branchName}' created successfully!</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Source Branch
            </label>
            <select
              value={sourceBranch}
              onChange={(e) => setSourceBranch(e.target.value)}
              className="input cursor-pointer"
            >
              {existingBranches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              New Branch Name
            </label>
            <div className="relative">
              <GitBranch className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g. feature/ml-pipeline-v2"
                className="input pl-9"
                required
              />
            </div>
            <p className="text-[11px] text-gray-500">
              Branch names are automatically formatted with hyphens.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !branchName.trim()}
              className="px-5 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs transition-all shadow-md shadow-primary-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Branch</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
