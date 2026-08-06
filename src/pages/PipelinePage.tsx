import { useState, useRef, useEffect } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  Github,
  Server,
  Box,
  Cloud,
  Ship,
  Play,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Terminal,
  ExternalLink,
  Sparkles,
  Zap,
  Code,
  Layers,
  Cpu,
} from 'lucide-react';

interface ToolStep {
  id: number;
  tool: 'github' | 'jenkins' | 'docker' | 'aws';
  title: string;
  subtitle: string;
  icon: any;
  status: 'idle' | 'running' | 'success' | 'failed';
  log: string;
  details?: Record<string, string>;
}

export default function PipelinePage() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [repoName, setRepoName] = useState('fraud-detection-api');
  const [commitMsg, setCommitMsg] = useState('feat: update ML inference pipeline v2.4');
  const [autoRun, setAutoRun] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '[INIT] DevOps Automation Pipeline Studio initialized.',
    '[READY] Select GitHub repository and commit code to start workflow.',
  ]);

  const [steps, setSteps] = useState<ToolStep[]>([
    {
      id: 1,
      tool: 'github',
      title: 'Step 1: GitHub (Push Code)',
      subtitle: 'Commit code changes & push to repository',
      icon: Github,
      status: 'idle',
      log: 'Awaiting code commit and git push trigger...',
      details: { Repo: 'fraud-detection-api', Branch: 'main', Commit: 'Pending' },
    },
    {
      id: 2,
      tool: 'jenkins',
      title: 'Step 2: Jenkins (CI/CD Build & Test)',
      subtitle: 'Automated unit tests, model linting & build',
      icon: Server,
      status: 'idle',
      log: 'Awaiting webhook trigger from GitHub...',
      details: { Build: '#149', TestSuite: 'PyTest + ModelLint', Result: 'Pending' },
    },
    {
      id: 3,
      tool: 'docker',
      title: 'Step 3: Docker (Containerization)',
      subtitle: 'Build Docker image & push to Docker Hub / ECR',
      icon: Box,
      status: 'idle',
      log: 'Awaiting artifact from Jenkins build...',
      details: { Image: 'fraud-detection-api:v2.4', Registry: 'docker.io/ml-org', Size: '412MB' },
    },
    {
      id: 4,
      tool: 'aws',
      title: 'Step 4: AWS & Kubernetes (Cluster Deploy)',
      subtitle: 'Deploy container image to production cluster',
      icon: Cloud,
      status: 'idle',
      log: 'Awaiting container image push...',
      details: { Cluster: 'prod-k8s-aws-us-east-1', Replicas: '3/3 Pods', Endpoint: 'Pending' },
    },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Append line to live terminal
  const appendLog = (line: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${line}`]);
  };

  // Run Step 1: GitHub Push
  const handlePushGitHub = () => {
    setActiveStep(1);
    setSteps((prev) =>
      prev.map((s) => (s.id === 1 ? { ...s, status: 'running' } : s))
    );

    appendLog(`[GITHUB] Committing changes: "${commitMsg}" to repository ${repoName}...`);
    appendLog(`[GITHUB] git commit -m "${commitMsg}"`);
    appendLog(`[GITHUB] git push origin main -> 100% (3 objects transferred).`);

    setTimeout(() => {
      setSteps((prev) =>
        prev.map((s) =>
          s.id === 1
            ? {
                ...s,
                status: 'success',
                details: { ...s.details, Commit: 'a7f9b2c (Pushed)', Status: 'Synced' },
              }
            : s
        )
      );
      appendLog(`[GITHUB] ✅ Code successfully pushed to GitHub repository ${repoName}!`);
      appendLog(`[WEBHOOK] Triggering Jenkins CI/CD Webhook notification...`);

      if (autoRun) {
        setTimeout(handleRunJenkins, 1000);
      } else {
        setActiveStep(2);
      }
    }, 1500);
  };

  // Run Step 2: Jenkins Build
  const handleRunJenkins = () => {
    setActiveStep(2);
    setSteps((prev) =>
      prev.map((s) => (s.id === 2 ? { ...s, status: 'running' } : s))
    );

    appendLog(`[JENKINS] Pipeline Job #149 started for ${repoName}.`);
    appendLog(`[JENKINS] Executing environment setup & Python dependencies...`);
    appendLog(`[JENKINS] Running model unit tests (pytest tests/model_test.py)...`);

    setTimeout(() => {
      appendLog(`[JENKINS] Test Results: 14/14 tests passed (100% coverage).`);
      setSteps((prev) =>
        prev.map((s) =>
          s.id === 2
            ? {
                ...s,
                status: 'success',
                details: { ...s.details, Result: '14/14 Tests Passed (100%)' },
              }
            : s
        )
      );
      appendLog(`[JENKINS] ✅ Jenkins Build #149 PASSED. Generating Docker build artifact.`);

      if (autoRun) {
        setTimeout(handleRunDocker, 1000);
      } else {
        setActiveStep(3);
      }
    }, 1800);
  };

  // Run Step 3: Docker Build
  const handleRunDocker = () => {
    setActiveStep(3);
    setSteps((prev) =>
      prev.map((s) => (s.id === 3 ? { ...s, status: 'running' } : s))
    );

    appendLog(`[DOCKER] Building container image: docker build -t ${repoName}:v2.4 .`);
    appendLog(`[DOCKER] Step 1/6: FROM python:3.10-slim`);
    appendLog(`[DOCKER] Step 6/6: Successfully tagged docker.io/ml-org/${repoName}:v2.4`);
    appendLog(`[DOCKER] Pushing image layers to Docker Registry / AWS ECR...`);

    setTimeout(() => {
      setSteps((prev) =>
        prev.map((s) =>
          s.id === 3
            ? {
                ...s,
                status: 'success',
                details: { ...s.details, Status: 'Pushed (sha256:8f4b1e...)' },
              }
            : s
        )
      );
      appendLog(`[DOCKER] ✅ Image docker.io/ml-org/${repoName}:v2.4 pushed to registry.`);

      if (autoRun) {
        setTimeout(handleRunAWS, 1000);
      } else {
        setActiveStep(4);
      }
    }, 1800);
  };

  // Run Step 4: AWS & Kubernetes Deploy
  const handleRunAWS = () => {
    setActiveStep(4);
    setSteps((prev) =>
      prev.map((s) => (s.id === 4 ? { ...s, status: 'running' } : s))
    );

    appendLog(`[AWS/K8S] Connecting to cluster prod-k8s-aws-us-east-1...`);
    appendLog(`[AWS/K8S] kubectl apply -f k8s/deployment.yaml`);
    appendLog(`[AWS/K8S] Deployment "fraud-detection-api" rolling update initialized (3 pods).`);

    setTimeout(() => {
      const endpoint = `https://${repoName}.aws.ml-org.io/v2/predict`;
      setSteps((prev) =>
        prev.map((s) =>
          s.id === 4
            ? {
                ...s,
                status: 'success',
                details: { ...s.details, Endpoint: endpoint, Health: '100% Operational' },
              }
            : s
        )
      );
      appendLog(`[AWS/K8S] ✅ Deployment complete! 3 Pods running on AWS EC2 nodes.`);
      appendLog(`[AWS/K8S] 🚀 Live Production Endpoint: ${endpoint}`);
      setAutoRun(false);
    }, 2000);
  };

  // Auto-run full pipeline chain
  const handleAutoRunFullChain = () => {
    setAutoRun(true);
    handlePushGitHub();
  };

  // Reset entire pipeline
  const handleReset = () => {
    setAutoRun(false);
    setActiveStep(1);
    setSteps([
      {
        id: 1,
        tool: 'github',
        title: 'Step 1: GitHub (Push Code)',
        subtitle: 'Commit code changes & push to repository',
        icon: Github,
        status: 'idle',
        log: 'Awaiting code commit and git push trigger...',
        details: { Repo: repoName, Branch: 'main', Commit: 'Pending' },
      },
      {
        id: 2,
        tool: 'jenkins',
        title: 'Step 2: Jenkins (CI/CD Build & Test)',
        subtitle: 'Automated unit tests, model linting & build',
        icon: Server,
        status: 'idle',
        log: 'Awaiting webhook trigger from GitHub...',
        details: { Build: '#149', TestSuite: 'PyTest + ModelLint', Result: 'Pending' },
      },
      {
        id: 3,
        tool: 'docker',
        title: 'Step 3: Docker (Containerization)',
        subtitle: 'Build Docker image & push to Docker Hub / ECR',
        icon: Box,
        status: 'idle',
        log: 'Awaiting artifact from Jenkins build...',
        details: { Image: `${repoName}:v2.4`, Registry: 'docker.io/ml-org', Size: '412MB' },
      },
      {
        id: 4,
        tool: 'aws',
        title: 'Step 4: AWS & Kubernetes (Cluster Deploy)',
        subtitle: 'Deploy container image to production cluster',
        icon: Cloud,
        status: 'idle',
        log: 'Awaiting container image push...',
        details: { Cluster: 'prod-k8s-aws-us-east-1', Replicas: '3/3 Pods', Endpoint: 'Pending' },
      },
    ]);
    setLogs([
      '[RESET] Pipeline state reset.',
      '[READY] Ready to start new GitHub ➔ Jenkins ➔ Docker ➔ AWS/Kubernetes execution flow.',
    ]);
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Top Header Banner ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              End-to-End DevOps Automation Studio
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-primary-500/10 text-primary-400 font-semibold border border-primary-500/20">
              GitHub ➔ Jenkins ➔ Docker ➔ AWS
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Automated pipeline flow: Push code to GitHub ➔ Auto-trigger Jenkins ➔ Containerize with Docker ➔ Deploy to AWS Kubernetes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Flow</span>
          </button>

          <button
            onClick={handleAutoRunFullChain}
            disabled={autoRun || steps.some((s) => s.status === 'running')}
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all shadow-lg shadow-primary-500/25 flex items-center gap-2 disabled:opacity-60"
          >
            <Play className={`w-4 h-4 ${autoRun ? 'animate-spin' : ''}`} />
            <span>{autoRun ? 'Auto-Executing Tool Chain...' : 'Auto-Run Full 4-Step Chain'}</span>
          </button>
        </div>
      </div>

      {/* ── Visual Flow Nodes Stepper ── */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isCurrent = activeStep === s.id;
            return (
              <div
                key={s.id}
                onClick={() => setActiveStep(s.id)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                  s.status === 'success'
                    ? 'border-success-500/50 bg-success-500/10 dark:bg-success-500/10'
                    : s.status === 'running'
                    ? 'border-primary-500 bg-primary-500/10 ring-2 ring-primary-500/20 animate-pulse'
                    : isCurrent
                    ? 'border-accent-400 bg-accent-500/10'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl ${
                    s.status === 'success'
                      ? 'bg-success-500 text-white'
                      : s.status === 'running'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-gray-500">0{s.id}</span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">{s.title}</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{s.subtitle}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800/60">
                  <StatusBadge status={s.status} size="sm" />
                  {idx < steps.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 hidden md:block" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Active Tool Interactive Workspace Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left 7 Columns: Step Controls */}
        <div className="lg:col-span-7 space-y-6">

          {/* STEP 1: GITHUB CONTROLS */}
          <Card className={`p-6 border-l-4 ${activeStep === 1 ? 'border-l-primary-500' : 'border-l-transparent'}`}>
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gray-900 dark:bg-gray-800 text-white">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    Step 1: GitHub Repository &amp; Code Push
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Select target repository and commit code to trigger Jenkins CI/CD
                  </p>
                </div>
              </div>
              <StatusBadge status={steps[0].status} />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Select GitHub Repository
                  </label>
                  <select
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    className="input cursor-pointer"
                  >
                    <option value="fraud-detection-api">fraud-detection-api (Python/PyTorch)</option>
                    <option value="bert-classifier-v2">bert-classifier-v2 (NLP/Transformers)</option>
                    <option value="recommendation-engine">recommendation-engine (Scikit-Learn)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Commit Message
                  </label>
                  <input
                    type="text"
                    value={commitMsg}
                    onChange={(e) => setCommitMsg(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs font-mono text-gray-500">
                  Branch: <span className="text-primary-400 font-bold">main</span> · Status: {steps[0].details?.Commit}
                </div>

                <button
                  onClick={handlePushGitHub}
                  disabled={steps[0].status === 'running'}
                  className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all shadow-md shadow-primary-500/20 flex items-center gap-2 disabled:opacity-60"
                >
                  <Github className="w-4 h-4" />
                  <span>Push Code to GitHub ➔</span>
                </button>
              </div>
            </div>
          </Card>

          {/* STEP 2: JENKINS CONTROLS */}
          <Card className={`p-6 border-l-4 ${activeStep === 2 ? 'border-l-primary-500' : 'border-l-transparent'}`}>
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary-600/10 text-primary-400 border border-primary-500/20">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    Step 2: Jenkins Automated Build &amp; Testing
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Executes automated PyTest suite and ML model accuracy verification
                  </p>
                </div>
              </div>
              <StatusBadge status={steps[1].status} />
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800 text-xs font-mono space-y-1">
                <p className="text-gray-400">Jenkins Job: <span className="text-gray-200 font-bold">{repoName}-ci-build #149</span></p>
                <p className="text-gray-400">Test Execution: <span className="text-success-500 font-bold">{steps[1].details?.Result}</span></p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Auto-triggered via GitHub Webhook</span>
                <button
                  onClick={handleRunJenkins}
                  disabled={steps[1].status === 'running'}
                  className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all shadow-md shadow-primary-500/20 flex items-center gap-2 disabled:opacity-60"
                >
                  <Server className="w-4 h-4" />
                  <span>Execute Jenkins Build ➔</span>
                </button>
              </div>
            </div>
          </Card>

          {/* STEP 3: DOCKER CONTROLS */}
          <Card className={`p-6 border-l-4 ${activeStep === 3 ? 'border-l-primary-500' : 'border-l-transparent'}`}>
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent-500/10 text-accent-400 border border-accent-500/20">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    Step 3: Docker Image Build &amp; Registry Push
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Package ML dependencies into Docker container &amp; push to ECR / Docker Hub
                  </p>
                </div>
              </div>
              <StatusBadge status={steps[2].status} />
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800 text-xs font-mono space-y-1">
                <p className="text-gray-400">Target Image: <span className="text-accent-400 font-bold">docker.io/ml-org/{repoName}:v2.4</span></p>
                <p className="text-gray-400">Registry Status: <span className="text-success-500 font-bold">{steps[2].details?.Status || 'Pending'}</span></p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Container Size: 412 MB</span>
                <button
                  onClick={handleRunDocker}
                  disabled={steps[2].status === 'running'}
                  className="px-5 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-500 text-white text-xs font-bold transition-all shadow-md shadow-accent-500/20 flex items-center gap-2 disabled:opacity-60"
                >
                  <Box className="w-4 h-4" />
                  <span>Build &amp; Push Docker Image ➔</span>
                </button>
              </div>
            </div>
          </Card>

          {/* STEP 4: AWS & KUBERNETES CONTROLS */}
          <Card className={`p-6 border-l-4 ${activeStep === 4 ? 'border-l-primary-500' : 'border-l-transparent'}`}>
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-success-500/10 text-success-500 border border-success-500/20">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    Step 4: AWS Cloud &amp; Kubernetes Cluster Deployment
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Rolling update deployment onto live production Kubernetes pods
                  </p>
                </div>
              </div>
              <StatusBadge status={steps[3].status} />
            </div>

            <div className="space-y-4">
              {steps[3].details?.Endpoint !== 'Pending' ? (
                <div className="p-4 rounded-xl bg-success-500/10 border border-success-500/30 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-success-500 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Live Production Endpoint Ready
                    </span>
                    <span className="text-[10px] font-mono text-success-400">3/3 Pods Healthy</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 text-xs font-mono text-white flex items-center justify-between">
                    <span className="truncate">{steps[3].details?.Endpoint}</span>
                    <a
                      href={steps[3].details?.Endpoint}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 text-primary-400 hover:underline flex items-center gap-1 shrink-0"
                    >
                      <span>Test Endpoint</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800 text-xs font-mono text-gray-400">
                  Awaiting deployment trigger to generate production endpoint...
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Target: prod-k8s-aws-us-east-1</span>
                <button
                  onClick={handleRunAWS}
                  disabled={steps[3].status === 'running'}
                  className="px-5 py-2.5 rounded-xl bg-success-600 hover:bg-success-500 text-white text-xs font-bold transition-all shadow-md shadow-success-500/20 flex items-center gap-2 disabled:opacity-60"
                >
                  <Cloud className="w-4 h-4" />
                  <span>Deploy to AWS Cluster 🚀</span>
                </button>
              </div>
            </div>
          </Card>

        </div>

        {/* Right 5 Columns: Live Streaming Terminal Console */}
        <div className="lg:col-span-5">
          <Card className="p-0 overflow-hidden h-full flex flex-col justify-between border-gray-800 bg-gray-950 shadow-2xl">
            <div className="p-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary-400" />
                <span className="text-xs font-mono font-bold text-gray-200">Live Pipeline Execution Console</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-error-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-warning-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-success-500" />
              </div>
            </div>

            <div className="p-4 font-mono text-[11px] text-gray-300 space-y-2 overflow-y-auto max-h-[580px] flex-1">
              {logs.map((logLine, idx) => (
                <div
                  key={idx}
                  className={`leading-relaxed ${
                    logLine.includes('✅') || logLine.includes('PASSED')
                      ? 'text-success-400 font-bold'
                      : logLine.includes('🚀')
                      ? 'text-accent-400 font-bold'
                      : logLine.includes('[GITHUB]')
                      ? 'text-primary-300'
                      : logLine.includes('[JENKINS]')
                      ? 'text-warning-300'
                      : logLine.includes('[DOCKER]')
                      ? 'text-accent-300'
                      : 'text-gray-400'
                  }`}
                >
                  {logLine}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            <div className="p-3 bg-gray-900 border-t border-gray-800 text-[10px] font-mono text-gray-500 flex items-center justify-between">
              <span>STREAM: STDOUT / STDERR</span>
              <span className="flex items-center gap-1 text-success-500">
                <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
                Live Log Listener Active
              </span>
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
}
