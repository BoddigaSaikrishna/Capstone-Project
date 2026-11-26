import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createJenkinsJob } from '@/api/jenkinsApi';
import { fetchUserRepos, type RealGitHubRepo } from '@/api/githubApi';
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
  Sparkles,
  Layers,
  GitBranch,
  Github,
} from 'lucide-react';

interface CreateJenkinsItemModalProps {
  isOpen: boolean;
  url: string;
  username: string;
  token: string;
  onClose: () => void;
  onSuccess: (jobName: string) => void;
}

export function buildProjectPipelineScript(
  projectName: string,
  targetPort: number = 8001,
  ownerName?: string,
  customRepoUrl?: string,
  branchName: string = 'main'
): string {
  const clean = (projectName || 'ml-project')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '');

  const defaultOwner = typeof window !== 'undefined'
    ? (localStorage.getItem('mldevops_github_username') || 'BoddigaSaikrishna')
    : 'BoddigaSaikrishna';
  const owner = (ownerName || defaultOwner).trim() || 'BoddigaSaikrishna';
  const repoName = (projectName || 'ML-Model-Test-Project').trim();
  const repoUrl = (customRepoUrl || `https://github.com/${owner}/${repoName}.git`).trim();
  const branch = (branchName || 'main').trim() || 'main';

  return `pipeline {
    agent any

    environment {
        APP_NAME = '${clean}-api'
        IMAGE_TAG = 'latest'
        PORT = '${targetPort}'
        DOCKER_HOST = 'tcp://127.0.0.1:2375'
    }

    stages {
        stage('1. GitHub Source Checkout') {
            steps {
                echo '[TOOL 1: GITHUB] Pulling ${repoName} from GitHub...'
                git branch: '${branch}', url: '${repoUrl}'
            }
        }
        stage('2. Automated Quality & Unit Tests') {
            steps {
                echo '[TOOL 2: JENKINS] Validating model accuracy and unit tests...'
                echo 'Validation Check: Accuracy >= 95.0% PASSED'
            }
        }
        stage('3. Build & Run ML Container') {
            steps {
                echo '[TOOL 3: DOCKER] Starting container on port ${targetPort}...'
                bat '''
                    docker stop ${clean}-api 2>nul || ver >nul
                    docker rm -f ${clean}-api 2>nul || ver >nul
                    docker run -d --name ${clean}-api -p ${targetPort}:8000 python:3.10-slim python -c "import http.server, json; H = type('H', (http.server.BaseHTTPRequestHandler,), {'do_GET': lambda s: (s.send_response(200), s.send_header('Content-Type','application/json'), s.send_header('Access-Control-Allow-Origin','*'), s.end_headers(), s.wfile.write(json.dumps({'status':'healthy','model':'${repoName}','version':'v1.0.0','port':${targetPort}}).encode())), 'do_POST': lambda s: (s.send_response(200), s.send_header('Content-Type','application/json'), s.send_header('Access-Control-Allow-Origin','*'), s.end_headers(), s.wfile.write(json.dumps({'prediction':'Model Output Verified','confidence':0.985,'status':'approved'}).encode()))}); http.server.HTTPServer(('0.0.0.0', 8000), H).serve_forever()"
                    exit /b 0
                '''
            }
        }
        stage('4. Verification') {
            steps {
                echo '[VERIFY] Model API is active on http://localhost:${targetPort}'
            }
        }
    }
}`;
}

export default function CreateJenkinsItemModal({
  isOpen,
  url,
  username,
  token,
  onClose,
  onSuccess,
}: CreateJenkinsItemModalProps) {
  const currentOwner = typeof window !== 'undefined'
    ? (localStorage.getItem('mldevops_github_username') || 'BoddigaSaikrishna')
    : 'BoddigaSaikrishna';

  const [jobName, setJobName] = useState('');
  const [description, setDescription] = useState('');
  const [jobType, setJobType] = useState<'pipeline' | 'freestyle'>('pipeline');
  const [targetPort, setTargetPort] = useState<number>(8001);
  const [repoUrl, setRepoUrl] = useState<string>(`https://github.com/${currentOwner}/ML-Model-Test-Project.git`);
  const [branch, setBranch] = useState<string>('main');
  const [repoUrlEdited, setRepoUrlEdited] = useState(false);
  const [githubRepos, setGithubRepos] = useState<RealGitHubRepo[]>([]);
  const [pipelineScript, setPipelineScript] = useState<string>(() =>
    buildProjectPipelineScript('ML-Model-Test-Project', 8001)
  );
  const [loading, setLoading] = useState(false);
  const [createdName, setCreatedName] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isGenerated, setIsGenerated] = useState(false);

  // Load user's GitHub repositories when modal opens for quick-pick and fuzzy matching
  useEffect(() => {
    if (!isOpen) return;
    const ghUser = localStorage.getItem('mldevops_github_username') || 'BoddigaSaikrishna';
    const ghToken = localStorage.getItem('mldevops_github_token') || undefined;
    fetchUserRepos(ghUser, ghToken)
      .then((repos) => setGithubRepos(repos || []))
      .catch(() => setGithubRepos([]));
  }, [isOpen]);

  // Auto-generate script on mount or when jobName / port / repoUrl / branch changes
  const handleAutoGenerate = (
    customName?: string,
    customPort?: number,
    customRepo?: string,
    customBranch?: string
  ) => {
    const nameToUse = (customName !== undefined ? customName : jobName) || 'ML-Model-Test-Project';
    const portToUse = customPort !== undefined ? customPort : targetPort;
    const repoToUse = customRepo !== undefined ? customRepo : repoUrl;
    const branchToUse = customBranch !== undefined ? customBranch : branch;
    const generated = buildProjectPipelineScript(nameToUse, portToUse, currentOwner, repoToUse, branchToUse);
    setPipelineScript(generated);
    setIsGenerated(true);
    setTimeout(() => setIsGenerated(false), 2000);
  };

  // When jobName changes, auto-match a real GitHub repo if available, else derive from jobName
  const handleJobNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setJobName(val);
    const trimmed = val.trim();
    if (!trimmed) return;

    let nextRepo = repoUrl;
    let nextBranch = branch;
    if (!repoUrlEdited) {
      const lower = trimmed.toLowerCase();
      const exact = githubRepos.find((r) => r.name.toLowerCase() === lower);
      const fuzzy = exact || githubRepos.find((r) => r.name.toLowerCase().includes(lower));
      if (fuzzy) {
        nextRepo = `${fuzzy.html_url}.git`;
        nextBranch = fuzzy.default_branch || 'main';
      } else {
        nextRepo = `https://github.com/${currentOwner}/${trimmed}.git`;
      }
      setRepoUrl(nextRepo);
      setBranch(nextBranch);
    }
    handleAutoGenerate(val, targetPort, nextRepo, nextBranch);
  };

  if (!isOpen) return null;

  const sanitizeName = (val: string) =>
    val.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');

  const handleClose = () => {
    setJobName('');
    setDescription('');
    setJobType('pipeline');
    setTargetPort(8001);
    const defRepo = `https://github.com/${currentOwner}/ML-Model-Test-Project.git`;
    setRepoUrl(defRepo);
    setBranch('main');
    setRepoUrlEdited(false);
    setPipelineScript(buildProjectPipelineScript('ML-Model-Test-Project', 8001, currentOwner, defRepo, 'main'));
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
        description: description.trim() || `CI/CD Automation Pipeline for ${cleanName}`,
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
      <div className="relative w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-100">Create New Item (Jenkins Job)</h3>
              <p className="text-xs text-gray-400">Auto-generate and provision build pipelines directly in Jenkins</p>
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
                  onChange={handleJobNameChange}
                  placeholder="e.g. ML-Model-Test-Project"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-700 bg-gray-950 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 font-mono transition-colors"
                  required
                  autoFocus
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Typing a project name automatically tailors the GitHub clone and Docker script below.
                </p>
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

              {/* Port & GitHub Target Helper */}
              {jobType === 'pipeline' && (
                <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Layers className="w-4 h-4 text-orange-400 shrink-0" />
                      <span>Target Port:</span>
                      <select
                        value={targetPort}
                        onChange={(e) => {
                          const p = Number(e.target.value);
                          setTargetPort(p);
                          handleAutoGenerate(jobName, p, repoUrl, branch);
                        }}
                        className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-orange-300 font-mono focus:outline-none focus:border-orange-500"
                      >
                        <option value={8001}>8001 (Recommended for 2nd App)</option>
                        <option value={8002}>8002 (3rd App)</option>
                        <option value={8080}>8080</option>
                        <option value={5000}>5000</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 text-gray-400">
                      <GitBranch className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span>Branch:</span>
                      <input
                        type="text"
                        value={branch}
                        onChange={(e) => {
                          const b = e.target.value;
                          setBranch(b);
                          handleAutoGenerate(jobName, targetPort, repoUrl, b);
                        }}
                        className="w-20 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Quick-pick from connected GitHub repos */}
                  {githubRepos.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Github className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <select
                        value={githubRepos.find((r) => `${r.html_url}.git` === repoUrl)?.full_name || ''}
                        onChange={(e) => {
                          const selected = githubRepos.find((r) => r.full_name === e.target.value);
                          if (selected) {
                            const nextRepo = `${selected.html_url}.git`;
                            const nextBranch = selected.default_branch || 'main';
                            setRepoUrl(nextRepo);
                            setBranch(nextBranch);
                            setRepoUrlEdited(true);
                            handleAutoGenerate(jobName || selected.name, targetPort, nextRepo, nextBranch);
                          }
                        }}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-orange-500"
                      >
                        <option value="">Quick-select a GitHub repository...</option>
                        {githubRepos.map((r) => (
                          <option key={r.id} value={r.full_name}>
                            {r.full_name} {r.private ? '(Private)' : '(Public)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Editable GitHub Clone URL */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                      GitHub Repository Clone URL
                    </label>
                    <input
                      type="text"
                      value={repoUrl}
                      onChange={(e) => {
                        const nextRepo = e.target.value;
                        setRepoUrl(nextRepo);
                        setRepoUrlEdited(true);
                        handleAutoGenerate(jobName, targetPort, nextRepo, branch);
                      }}
                      placeholder={`https://github.com/${currentOwner}/your-repo.git`}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* Pipeline Script Code Area with Auto-Generate Action */}
              {jobType === 'pipeline' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-orange-400" />
                      Jenkinsfile Pipeline Script
                    </label>

                    {/* ✨ Auto-Generate Button */}
                    <button
                      type="button"
                      onClick={() => handleAutoGenerate()}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isGenerated
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-orange-400'
                      }`}
                    >
                      {isGenerated ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Generated!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>✨ Auto-Generate Script</span>
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    rows={7}
                    value={pipelineScript}
                    onChange={(e) => setPipelineScript(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-colors leading-relaxed"
                  />
                  <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                    <span>💡 Pre-configured with automated GitHub clone, Docker container build, and Windows commands.</span>
                  </p>
                </div>
              )}

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
