import { useState } from 'react';
import { createPortal } from 'react-dom';
import { createJenkinsJob, type CreateJenkinsJobParams } from '@/api/jenkinsApi';
import {
  Server,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCode,
  Box,
  Code2,
} from 'lucide-react';

interface CreateJenkinsItemModalProps {
  isOpen: boolean;
  url: string;
  username: string;
  token: string;
  onClose: () => void;
  onSuccess: (jobName: string) => void;
}

const DEFAULT_JENKINSFILE = `pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source repository...'
            }
        }
        stage('Build & Test') {
            steps {
                echo 'Executing automated build and test pipeline...'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying artifact to target environment...'
            }
        }
    }
}`;

export default function CreateJenkinsItemModal({
  isOpen,
  url,
  username,
  token,
  onClose,
  onSuccess,
}: CreateJenkinsItemModalProps) {
  const [jobName, setJobName] = useState('');
  const [description, setDescription] = useState('');
  const [jobType, setJobType] = useState<'pipeline' | 'freestyle'>('pipeline');
  const [pipelineScript, setPipelineScript] = useState(DEFAULT_JENKINSFILE);
  const [loading, setLoading] = useState(false);
  const [createdName, setCreatedName] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const sanitizeName = (val: string) =>
    val.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');

  const handleClose = () => {
    setJobName('');
    setDescription('');
    setJobType('pipeline');
    setPipelineScript(DEFAULT_JENKINSFILE);
    setError('');
    setCreatedName(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeName(jobName);
    if (!cleanName) {
      setError('Item / Job name is required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await createJenkinsJob(url, username, token, {
        jobName: cleanName,
        description: description.trim(),
        jobType,
        pipelineScript: jobType === 'pipeline' ? pipelineScript : undefined,
      });
      setCreatedName(cleanName);
      setTimeout(() => {
        onSuccess(cleanName);
        handleClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to create Jenkins item.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-100">Create New Item (Jenkins Job)</h3>
              <p className="text-xs text-gray-400">Provision a new build pipeline or freestyle project directly in Jenkins</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {createdName ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-success-500/10 text-success-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-gray-100">Jenkins Item Created!</h4>
              <p className="text-xs text-gray-400">
                Item <span className="font-mono text-orange-400 font-bold">{createdName}</span> has been provisioned successfully in Jenkins.
              </p>
            </div>
          ) : (
            <form id="create-jenkins-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Item Name <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  placeholder="e.g. ML-Training-Pipeline"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-700 bg-gray-950 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 font-mono transition-colors"
                  required
                  autoFocus
                />
              </div>

              {/* Job Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">
                  Select Item Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setJobType('pipeline')}
                    className={`p-3.5 rounded-xl border text-left flex flex-col gap-2 transition-all ${
                      jobType === 'pipeline'
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                        : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-orange-500" />
                      <span className="text-xs font-bold text-gray-200">Pipeline</span>
                    </div>
                    <span className="text-[11px] text-gray-400">Declarative Jenkinsfile script with automated stages</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setJobType('freestyle')}
                    className={`p-3.5 rounded-xl border text-left flex flex-col gap-2 transition-all ${
                      jobType === 'freestyle'
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                        : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-orange-500" />
                      <span className="text-xs font-bold text-gray-200">Freestyle Project</span>
                    </div>
                    <span className="text-[11px] text-gray-400">Classic Jenkins job for general build tasks</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Description <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Continuous integration pipeline for model training"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-700 bg-gray-950 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Pipeline Script Code Template (Only if Pipeline selected) */}
              {jobType === 'pipeline' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-orange-400" />
                      Jenkinsfile Pipeline Script
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">Declarative Pipeline syntax</span>
                  </label>
                  <textarea
                    rows={6}
                    value={pipelineScript}
                    onChange={(e) => setPipelineScript(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-colors leading-relaxed"
                  />
                </div>
              )}

              {/* Error banner */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-error-500/10 border border-error-500/20 text-error-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        {!createdName && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-gray-950/60">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="create-jenkins-form"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Item...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Item</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
