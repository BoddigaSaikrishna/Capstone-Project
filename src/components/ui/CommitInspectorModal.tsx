import { useState } from 'react';
import { createPortal } from 'react-dom';
import { GitCommit, X, Copy, Check, ShieldCheck, FileCode, CheckCircle2, User } from 'lucide-react';

export interface CommitDetail {
  sha: string;
  message: string;
  author: string;
  email?: string;
  timestamp: string;
  verified?: boolean;
}

interface CommitInspectorModalProps {
  isOpen: boolean;
  commit: CommitDetail | null;
  repoName: string;
  onClose: () => void;
}

export default function CommitInspectorModal({
  isOpen,
  commit,
  repoName,
  onClose,
}: CommitInspectorModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !commit) return null;

  const handleCopySha = () => {
    navigator.clipboard.writeText(commit.sha);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-md" />

      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden z-10">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent-500/10 text-accent-400 border border-accent-500/20">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Commit Inspector
              </h3>
              <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                {repoName}
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

        {/* Content */}
        <div className="p-6 space-y-5">

          {/* SHA Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">SHA:</span>
              <span className="font-mono text-xs text-primary-400 font-bold">{commit.sha}</span>
            </div>
            <button
              onClick={handleCopySha}
              className="px-2.5 py-1 rounded text-xs font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy SHA'}</span>
            </button>
          </div>

          {/* Commit Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Commit Message
            </label>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
              {commit.message}
            </div>
          </div>

          {/* Author info */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary-500/10 text-primary-400 flex items-center justify-center text-xs font-bold shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{commit.author}</p>
                <p className="text-[10px] text-gray-500 truncate">{commit.email || 'developer@ml-org.io'}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-success-500 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-success-500">Verified Commit</p>
                <p className="text-[10px] text-gray-500">{commit.timestamp}</p>
              </div>
            </div>
          </div>

          {/* Changed Files Mock Summary */}
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Changed Files (3)</span>
              <span className="text-[11px] text-success-500 font-mono">+48 -12</span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="p-2 rounded bg-gray-50 dark:bg-gray-800/40 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-gray-300">
                  <FileCode className="w-3.5 h-3.5 text-primary-400" />
                  src/models/bert_classifier.py
                </span>
                <span className="text-[11px] text-success-500">+32 -4</span>
              </div>
              <div className="p-2 rounded bg-gray-50 dark:bg-gray-800/40 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-gray-300">
                  <FileCode className="w-3.5 h-3.5 text-accent-400" />
                  Dockerfile
                </span>
                <span className="text-[11px] text-success-500">+10 -2</span>
              </div>
              <div className="p-2 rounded bg-gray-50 dark:bg-gray-800/40 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-gray-300">
                  <FileCode className="w-3.5 h-3.5 text-warning-500" />
                  pipeline-config.yaml
                </span>
                <span className="text-[11px] text-success-500">+6 -6</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/40 flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-success-500" />
            CI/CD Pipeline Build Passed
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
