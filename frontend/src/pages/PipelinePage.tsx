import { useState, useRef, useEffect } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  Github,
  Server,
  Box,
  Cloud,
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
  Globe,
  ChevronDown,
  Brain,
  Monitor,
  Coffee,
  Code2,
} from 'lucide-react';
import CodeGenModal from '@/components/ui/CodeGenModal';

// ── App Deployment Profiles ────────────────────────────────────────────────────────────

const APP_PROFILES: Record<string, {
  label: string;
  icon: any;
  color: string;
  repos: string[];
  defaultCommit: string;
  language: string;
  testCmd: string;
  testResult: string;
  dockerBase: string;
  imageTag: string;
  imageSize: string;
  registry: string;
  awsService: string;
  port: string;
  endpointPath: string;
  jenkinsBuildLogs: string[];
  dockerBuildLogs: string[];
  awsDeployLogs: string[];
}> = {
  ml: {
    label: 'ML Application (Python/FastAPI)',
    icon: Brain,
    color: '#8b5cf6',
    repos: ['fraud-detection-api'],
    defaultCommit: 'feat: update ML inference pipeline v2.4',
    language: 'Python 3.11',
    testCmd: 'pytest test_model.py -v',
    testResult: '4/4 Tests Passed (100% accuracy gate)',
    dockerBase: 'FROM python:3.11-slim',
    imageTag: 'v2.4',
    imageSize: '412MB',
    registry: 'docker.io/ml-org',
    awsService: 'EC2 (g4dn.xlarge — GPU)',
    port: '8000',
    endpointPath: '/predict',
    jenkinsBuildLogs: [
      '[JENKINS] Pipeline Job started — Python ML Application.',
      '[JENKINS] pip install -r requirements.txt (FastAPI, PyTorch, scikit-learn)...',
      '[JENKINS] Running pytest test_model.py -v...',
      '[JENKINS] Test Results: 4/4 tests passed (100% accuracy gate passed).',
      '[JENKINS] Model accuracy validated: 100.0% on benchmark holdout set.',
    ],
    dockerBuildLogs: [
      '[DOCKER] Building image: FROM python:3.11-slim',
      '[DOCKER] COPY requirements.txt && pip install --no-cache-dir -r requirements.txt',
      '[DOCKER] COPY . . && EXPOSE 8000',
      '[DOCKER] CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]',
    ],
    awsDeployLogs: [
      '[AWS] Connecting to EC2 fleet (g4dn.xlarge — NVIDIA GPU)...',
      '[AWS] docker pull ml-org/{repo}:v2.4 on EC2 instance...',
      '[AWS] docker run -p 8000:8000 ml-org/{repo}:v2.4',
      '[AWS] Health check: GET /health → 200 OK (latency: 1.85ms).',
    ],
  },
  react: {
    label: 'React / Next.js Frontend',
    icon: Monitor,
    color: '#38bdf8',
    repos: ['ecommerce-storefront'],
    defaultCommit: 'feat: add product listing page with filters',
    language: 'Node.js 20 / TypeScript',
    testCmd: 'npm run test -- --watchAll=false && npm run build',
    testResult: '38/38 Tests Passed — Build: 2.1MB (Vite)',
    dockerBase: 'FROM node:20-alpine AS builder',
    imageTag: 'v1.8',
    imageSize: '89MB',
    registry: 'docker.io/web-org',
    awsService: 'EC2 (t3.medium — Nginx)',
    port: '80',
    endpointPath: '/',
    jenkinsBuildLogs: [
      '[JENKINS] Pipeline Job started — React/Next.js Frontend.',
      '[JENKINS] npm ci — Installing packages...',
      '[JENKINS] npm run test -- --watchAll=false...',
      '[JENKINS] Test Results: 38/38 tests passed.',
      '[JENKINS] npm run build — Output: /dist (2.1 MB gzipped).',
    ],
    dockerBuildLogs: [
      '[DOCKER] Multi-stage build: FROM node:20-alpine AS builder',
      '[DOCKER] COPY package*.json && npm ci --only=production',
      '[DOCKER] RUN npm run build — Generating static assets...',
      '[DOCKER] FROM nginx:alpine — COPY --from=builder /dist /usr/share/nginx/html',
    ],
    awsDeployLogs: [
      '[AWS] Connecting to EC2 fleet (t3.medium — Nginx static hosting)...',
      '[AWS] docker pull web-org/{repo}:v1.8 on EC2 instance.',
      '[AWS] docker run -p 80:80 web-org/{repo}:v1.8 — Nginx started.',
      '[AWS] Health check: GET / → 200 OK. CDN cache invalidated.',
    ],
  },
  nodejs: {
    label: 'FullStack Cloud App (Node.js REST API)',
    icon: Server,
    color: '#4ade80',
    repos: ['fullstack-demo-app'],
    defaultCommit: 'feat: add catalog API and embedded UI',
    language: 'Node.js 20 / Pure HTTP',
    testCmd: 'node test/api.test.js',
    testResult: '5/5 Tests Passed — Jenkins Quality Gate: PASSED',
    dockerBase: 'FROM node:20-alpine',
    imageTag: 'v1.0',
    imageSize: '145MB',
    registry: 'docker.io/devops-org',
    awsService: 'EC2 (t3.medium — Load Balanced)',
    port: '3000',
    endpointPath: '/health',
    jenkinsBuildLogs: [
      '[JENKINS] Pipeline Job started — Node.js Express REST API.',
      '[JENKINS] npm ci — Installing dependencies...',
      '[JENKINS] Running Mocha + Supertest integration tests...',
      '[JENKINS] Test Results: 61/61 tests passed (97% API coverage).',
      '[JENKINS] npm run lint — ESLint: 0 errors, 0 warnings.',
    ],
    dockerBuildLogs: [
      '[DOCKER] Building: FROM node:20-alpine',
      '[DOCKER] COPY package*.json && npm ci --only=production',
      '[DOCKER] COPY . . && EXPOSE 3000',
      '[DOCKER] CMD ["node", "server.js"] — PM2 process manager attached.',
    ],
    awsDeployLogs: [
      '[AWS] Connecting to EC2 load-balanced fleet (t3.large x3)...',
      '[AWS] docker pull api-org/{repo}:v3.1 on 3 instances.',
      '[AWS] docker run -p 3000:3000 api-org/{repo}:v3.1',
      '[AWS] ALB target group health check: /api/v3/health → 200 OK.',
    ],
  },
  django: {
    label: 'Django / Python REST Framework',
    icon: Code,
    color: '#f97316',
    repos: ['crm-backend-django', 'inventory-api-drf', 'blog-platform-django'],
    defaultCommit: 'feat: add pagination to /api/products/ endpoint',
    language: 'Python 3.12 / Django 5.0',
    testCmd: 'python manage.py test --verbosity=2',
    testResult: '88/88 Tests Passed — Django TestCase suite',
    dockerBase: 'FROM python:3.12-slim',
    imageTag: 'v2.0',
    imageSize: '278MB',
    registry: 'docker.io/django-org',
    awsService: 'EC2 (t3.medium — Gunicorn/Nginx)',
    port: '8080',
    endpointPath: '/api/v2/health/',
    jenkinsBuildLogs: [
      '[JENKINS] Pipeline Job started — Django REST Framework API.',
      '[JENKINS] pip install -r requirements.txt (Django, DRF, psycopg2, celery)...',
      '[JENKINS] python manage.py test --verbosity=2...',
      '[JENKINS] Test Results: 88/88 tests passed.',
      '[JENKINS] python manage.py collectstatic --noinput.',
    ],
    dockerBuildLogs: [
      '[DOCKER] Building: FROM python:3.12-slim',
      '[DOCKER] RUN pip install gunicorn && pip install -r requirements.txt',
      '[DOCKER] COPY . /app && python manage.py collectstatic',
      '[DOCKER] CMD ["gunicorn", "config.wsgi:application", "--workers", "4"]',
    ],
    awsDeployLogs: [
      '[AWS] Connecting to EC2 fleet (t3.medium — Gunicorn + Nginx)...',
      '[AWS] docker pull django-org/{repo}:v2.0 on 2 instances.',
      '[AWS] python manage.py migrate — DB migrations applied.',
      '[AWS] docker run -p 8080:8080 django-org/{repo}:v2.0 — Gunicorn started.',
    ],
  },
  java: {
    label: 'Java Spring Boot Microservice',
    icon: Coffee,
    color: '#fb923c',
    repos: ['order-service-spring', 'inventory-ms-java', 'auth-service-spring'],
    defaultCommit: 'feat: add circuit breaker to OrderService',
    language: 'Java 21 / Spring Boot 3.2',
    testCmd: 'mvn test (JUnit5 + Mockito)',
    testResult: '74/74 Tests Passed — Jacoco: 91% coverage',
    dockerBase: 'FROM eclipse-temurin:21-jre-alpine',
    imageTag: 'v4.2',
    imageSize: '195MB',
    registry: 'docker.io/java-org',
    awsService: 'EC2 (t3.large — Spring Boot)',
    port: '8080',
    endpointPath: '/actuator/health',
    jenkinsBuildLogs: [
      '[JENKINS] Pipeline Job started — Java Spring Boot Microservice.',
      '[JENKINS] mvn clean install — Resolving 143 Maven dependencies...',
      '[JENKINS] Running JUnit5 + Mockito test suite...',
      '[JENKINS] Test Results: 74/74 tests passed (Jacoco: 91% coverage).',
      '[JENKINS] mvn package -DskipTests — JAR: target/app.jar (58MB)',
    ],
    dockerBuildLogs: [
      '[DOCKER] Multi-stage: FROM maven:3.9-eclipse-temurin-21 AS build',
      '[DOCKER] RUN mvn clean package -DskipTests',
      '[DOCKER] FROM eclipse-temurin:21-jre-alpine',
      '[DOCKER] COPY --from=build target/app.jar /app.jar && EXPOSE 8080',
    ],
    awsDeployLogs: [
      '[AWS] Connecting to EC2 fleet (t3.large x3 — Spring Boot)...',
      '[AWS] docker pull java-org/{repo}:v4.2 on 3 instances.',
      '[AWS] docker run -p 8080:8080 java-org/{repo}:v4.2',
      '[AWS] Spring Actuator health: GET /actuator/health → {"status":"UP"}',
    ],
  },
};

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
  const [appType, setAppType] = useState<keyof typeof APP_PROFILES>('ml');
  const profile = APP_PROFILES[appType];

  const [activeStep, setActiveStep] = useState<number>(1);
  const [repoName, setRepoName] = useState(profile.repos[0]);
  const [commitMsg, setCommitMsg] = useState(profile.defaultCommit);
  const [autoRun, setAutoRun] = useState(false);
  const [awsHost, setAwsHost] = useState('54.210.175.126');
  const [showCodeGenModal, setShowCodeGenModal] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '[INIT] DevOps Automation Pipeline Studio initialized.',
    '[READY] Select your app type and repository, then trigger the workflow.',
  ]);

  // When app type changes, reset pipeline and update repo/commit
  useEffect(() => {
    const p = APP_PROFILES[appType];
    setRepoName(p.repos[0]);
    setCommitMsg(p.defaultCommit);
    handleResetSteps(p.repos[0], appType);
  }, [appType]);

  const makeSteps = (repo: string, type: keyof typeof APP_PROFILES): ToolStep[] => {
    const p = APP_PROFILES[type];
    return [
      {
        id: 1, tool: 'github',
        title: 'Step 1: GitHub (Push Code)',
        subtitle: `Commit & push ${p.language} code to repository`,
        icon: Github, status: 'idle',
        log: 'Awaiting code commit and git push trigger...',
        details: { Repo: repo, Branch: 'main', Language: p.language, Commit: 'Pending' },
      },
      {
        id: 2, tool: 'jenkins',
        title: 'Step 2: Jenkins (CI/CD Build & Test)',
        subtitle: `Run automated tests — ${p.testCmd}`,
        icon: Server, status: 'idle',
        log: 'Awaiting webhook trigger from GitHub...',
        details: { Build: '#153', TestSuite: p.testCmd, Result: 'Pending' },
      },
      {
        id: 3, tool: 'docker',
        title: 'Step 3: Docker (Containerization)',
        subtitle: `Build image — ${p.dockerBase.split('\n')[0].replace('FROM ', '')}`,
        icon: Box, status: 'idle',
        log: 'Awaiting artifact from Jenkins build...',
        details: { Image: `${repo}:${p.imageTag}`, Registry: p.registry, Size: p.imageSize },
      },
      {
        id: 4, tool: 'aws',
        title: 'Step 4: AWS Cloud Infrastructure (Deploy)',
        subtitle: `Deploy container to ${p.awsService}`,
        icon: Cloud, status: 'idle',
        log: 'Awaiting container image push...',
        details: { Region: 'us-east-1', Service: p.awsService, Port: p.port, Endpoint: 'Pending' },
      },
    ];
  };

  const [steps, setSteps] = useState<ToolStep[]>(() => makeSteps(profile.repos[0], 'ml'));
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const appendLog = (line: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${line}`]);
  };

  const handleResetSteps = (repo: string, type: keyof typeof APP_PROFILES) => {
    setAutoRun(false);
    setActiveStep(1);
    setSteps(makeSteps(repo, type));
    setLogs([
      '[RESET] Pipeline state reset.',
      `[READY] App type: ${APP_PROFILES[type].label} — Ready to run pipeline.`,
    ]);
  };

  // Run Step 1: GitHub Push
  const handlePushGitHub = () => {
    setActiveStep(1);
    setSteps((prev) => prev.map((s) => (s.id === 1 ? { ...s, status: 'running' } : s)));
    appendLog(`[GITHUB] Committing: "${commitMsg}" to ${repoName}...`);
    appendLog(`[GITHUB] git add . && git commit -m "${commitMsg}"`);
    appendLog(`[GITHUB] git push origin main → 100% (objects transferred).`);
    setTimeout(() => {
      setSteps((prev) => prev.map((s) => s.id === 1 ? { ...s, status: 'success', details: { ...s.details, Commit: 'a7f9b2c (Pushed)', Status: 'Synced' } } : s));
      appendLog(`[GITHUB] ✅ Code pushed to ${repoName}. Triggering Jenkins webhook...`);
      if (autoRun) setTimeout(handleRunJenkins, 1000); else setActiveStep(2);
    }, 1500);
  };

  // Run Step 2: Jenkins Build
  const handleRunJenkins = () => {
    setActiveStep(2);
    setSteps((prev) => prev.map((s) => (s.id === 2 ? { ...s, status: 'running' } : s)));
    appendLog(`[JENKINS] Pipeline Job #153 started for ${repoName} (${profile.label}).`);
    profile.jenkinsBuildLogs.forEach((line, i) => setTimeout(() => appendLog(line), i * 300));
    setTimeout(() => {
      setSteps((prev) => prev.map((s) => s.id === 2 ? { ...s, status: 'success', details: { ...s.details, Result: profile.testResult } } : s));
      appendLog(`[JENKINS] ✅ Build #153 PASSED — ${profile.testResult}.`);
      if (autoRun) setTimeout(handleRunDocker, 1000); else setActiveStep(3);
    }, 1800);
  };

  // Run Step 3: Docker Build
  const handleRunDocker = () => {
    setActiveStep(3);
    setSteps((prev) => prev.map((s) => (s.id === 3 ? { ...s, status: 'running' } : s)));
    appendLog(`[DOCKER] Building: docker build -t ${repoName}:${profile.imageTag} .`);
    profile.dockerBuildLogs.forEach((line, i) => setTimeout(() => appendLog(line), i * 300));
    appendLog(`[DOCKER] Successfully tagged ${profile.registry}/${repoName}:${profile.imageTag}`);
    appendLog(`[DOCKER] Pushing image (${profile.imageSize}) to registry...`);
    setTimeout(() => {
      setSteps((prev) => prev.map((s) => s.id === 3 ? { ...s, status: 'success', details: { ...s.details, Status: `Pushed (sha256:8f4b1e...)` } } : s));
      appendLog(`[DOCKER] ✅ ${profile.registry}/${repoName}:${profile.imageTag} pushed to registry.`);
      if (autoRun) setTimeout(handleRunAWS, 1000); else setActiveStep(4);
    }, 1800);
  };

  // Run Step 4: AWS Deploy
  const handleRunAWS = () => {
    setActiveStep(4);
    setSteps((prev) => prev.map((s) => (s.id === 4 ? { ...s, status: 'running' } : s)));
    const targetHost = awsHost.trim() || '54.210.175.126';
    appendLog(`[AWS] Connecting to ${profile.awsService} production fleet (${targetHost})...`);
    profile.awsDeployLogs.map((l) => l.replace('{repo}', repoName)).forEach((line, i) => setTimeout(() => appendLog(line), i * 400));
    setTimeout(() => {
      const endpoint = `http://${targetHost}:${profile.port}${appType === 'ml' ? '/docs' : profile.endpointPath}`;
      setSteps((prev) => prev.map((s) => s.id === 4 ? { ...s, status: 'success', details: { ...s.details, Endpoint: endpoint, Health: '100% Operational' } } : s));
      appendLog(`[AWS] ✅ Deployment complete on ${profile.awsService}!`);
      appendLog(`[AWS] 🚀 Live Production Endpoint: ${endpoint}`);
      if (appType === 'ml') {
        appendLog(`[AWS] 💡 Swagger UI: http://${targetHost}:${profile.port}/docs (Interactive Testing)`);
        appendLog(`[AWS] 💡 Local Endpoint: http://localhost:${profile.port}/docs`);
        appendLog(`[AWS] 💡 POST /predict is ready for inference payloads.`);
      }
      setAutoRun(false);
    }, 2000);
  };

  // Auto-run full pipeline chain
  const handleAutoRunFullChain = () => {
    setAutoRun(true);
    handlePushGitHub();
  };

  // Reset entire pipeline
  const handleReset = () => handleResetSteps(repoName, appType);

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
              GitHub ➡ Jenkins ➡ Docker ➡ AWS
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Universal deployment pipeline — supports any FullStack, ML, API, or Microservice application
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCodeGenModal(true)}
            className="px-3.5 py-2 rounded-xl border border-primary-500/30 bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 dark:text-primary-400 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>✨ Auto-Generate Code</span>
          </button>

          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Flow</span>
          </button>

          <button
            onClick={handleAutoRunFullChain}
            disabled={autoRun || steps.some((s) => s.status === 'running')}
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all shadow-lg shadow-primary-500/25 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            <Play className={`w-4 h-4 ${autoRun ? 'animate-spin' : ''}`} />
            <span>{autoRun ? 'Auto-Executing Tool Chain...' : 'Auto-Run Full 4-Step Chain'}</span>
          </button>
        </div>
      </div>

      {/* ── App Type Selector ── */}
      <Card className="p-4 border border-gray-200 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <Globe className="w-4 h-4 text-primary-400" />
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">App Type</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(APP_PROFILES).map(([key, p]) => {
              const Icon = p.icon;
              const isActive = appType === key;
              return (
                <button
                  key={key}
                  onClick={() => setAppType(key as keyof typeof APP_PROFILES)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isActive
                      ? 'text-white border-transparent shadow-md'
                      : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200 hover:border-gray-600'
                  }`}
                  style={isActive ? { backgroundColor: p.color, boxShadow: `0 4px 12px ${p.color}40` } : {}}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {p.label.split(' ')[0]} {p.label.split(' ')[1]}
                </button>
              );
            })}
          </div>
          <div className="ml-auto text-[10px] font-mono text-gray-500 hidden sm:block">
            <span className="text-gray-400 font-semibold">{profile.label}</span>{' '}· Base: <span className="text-warning-400">{profile.dockerBase.replace('FROM ', '').split(' ')[0]}</span>{' '}· Port: <span className="text-primary-400">{profile.port}</span>
          </div>
        </div>
      </Card>

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
                    Select target repository and commit <span className="font-semibold text-primary-400">{profile.language}</span> code
                  </p>
                </div>
              </div>
              <StatusBadge status={steps[0].status} />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    GitHub Repository
                  </label>
                  <select
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    className="input cursor-pointer"
                  >
                    {profile.repos.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
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
                  Branch: <span className="text-primary-400 font-bold">main</span> &nbsp;·&nbsp; Lang: <span className="text-warning-400 font-bold">{profile.language}</span>
                </div>

                <button
                  onClick={handlePushGitHub}
                  disabled={steps[0].status === 'running'}
                  className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all shadow-md shadow-primary-500/20 flex items-center gap-2 disabled:opacity-60"
                >
                  <Github className="w-4 h-4" />
                  <span>Push Code to GitHub ➡</span>
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
                    {profile.testCmd}
                  </p>
                </div>
              </div>
              <StatusBadge status={steps[1].status} />
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800 text-xs font-mono space-y-1">
                <p className="text-gray-400">Jenkins Job: <span className="text-gray-200 font-bold">{repoName}-ci-build #153</span></p>
                <p className="text-gray-400">Test Suite: <span className="text-warning-400 font-semibold">{profile.testCmd}</span></p>
                <p className="text-gray-400">Result: <span className="text-success-500 font-bold">{steps[1].details?.Result}</span></p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Auto-triggered via GitHub Webhook</span>
                <button
                  onClick={handleRunJenkins}
                  disabled={steps[1].status === 'running'}
                  className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all shadow-md shadow-primary-500/20 flex items-center gap-2 disabled:opacity-60"
                >
                  <Server className="w-4 h-4" />
                  <span>Execute Jenkins Build ➡</span>
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
                    Package app into Docker container &amp; push to ECR / Docker Hub
                  </p>
                </div>
              </div>
              <StatusBadge status={steps[2].status} />
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800 text-xs font-mono space-y-1">
                <p className="text-gray-400">Base Image: <span className="text-accent-400 font-bold">{profile.dockerBase.replace('FROM ', '').split(' AS')[0]}</span></p>
                <p className="text-gray-400">Target Image: <span className="text-accent-400 font-bold">{profile.registry}/{repoName}:{profile.imageTag}</span></p>
                <p className="text-gray-400">Registry Status: <span className="text-success-500 font-bold">{steps[2].details?.Status || 'Pending'}</span></p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Container Size: ~{profile.imageSize}</span>
                <button
                  onClick={handleRunDocker}
                  disabled={steps[2].status === 'running'}
                  className="px-5 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-500 text-white text-xs font-bold transition-all shadow-md shadow-accent-500/20 flex items-center gap-2 disabled:opacity-60"
                >
                  <Box className="w-4 h-4" />
                  <span>Build &amp; Push Docker Image ➡</span>
                </button>
              </div>
            </div>
          </Card>

          {/* STEP 4: AWS CONTROLS */}
          <Card className={`p-6 border-l-4 ${activeStep === 4 ? 'border-l-primary-500' : 'border-l-transparent'}`}>
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-success-500/10 text-success-500 border border-success-500/20">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    Step 4: AWS Cloud Production Deployment
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Deploy to <span className="font-semibold text-success-400">{profile.awsService}</span> — Port {profile.port}
                  </p>
                </div>
              </div>
              <StatusBadge status={steps[3].status} />
            </div>

            <div className="space-y-4">
              {/* Host Configuration */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-primary-400" />
                    Target Host / EC2 Public IP:
                  </label>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setAwsHost('54.210.175.126')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${awsHost === '54.210.175.126' ? 'bg-primary-500 text-white font-bold' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 hover:text-gray-200'}`}
                    >
                      AWS EC2
                    </button>
                    <button
                      type="button"
                      onClick={() => setAwsHost('localhost')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${awsHost === 'localhost' ? 'bg-primary-500 text-white font-bold' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 hover:text-gray-200'}`}
                    >
                      Localhost
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={awsHost}
                  onChange={(e) => setAwsHost(e.target.value)}
                  placeholder="54.210.175.126 or localhost"
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-xs font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-500"
                />
              </div>

              {steps[3].details?.Endpoint !== 'Pending' ? (
                <div className="p-4 rounded-xl bg-success-500/10 border border-success-500/30 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-success-500 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Live Production Endpoints Active
                    </span>
                    <span className="text-[10px] font-mono text-success-400">{profile.awsService}</span>
                  </div>

                  {/* Primary Link (Swagger Docs for ML, direct endpoint for Web) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold">
                      <span>{appType === 'ml' ? '📘 Interactive API Docs (Swagger UI):' : '🌐 Production App URL:'}</span>
                      <span className="text-primary-400 font-mono">Port {profile.port}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/50 text-xs font-mono text-white flex items-center justify-between border border-gray-800">
                      <span className="truncate text-success-400 font-bold">
                        http://{awsHost.trim() || 'localhost'}:{profile.port}{appType === 'ml' ? '/docs' : profile.endpointPath}
                      </span>
                      <a
                        href={`http://${awsHost.trim() || 'localhost'}:{profile.port}${appType === 'ml' ? '/docs' : profile.endpointPath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 px-2.5 py-1 rounded bg-primary-600 hover:bg-primary-500 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
                      >
                        <span>Open Docs</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Secondary Links for ML: Health & Predict */}
                  {appType === 'ml' && (
                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
                      <div className="p-2 rounded bg-black/30 border border-gray-800 flex items-center justify-between">
                        <span className="text-gray-400">Health: <span className="text-gray-200">/health</span></span>
                        <a
                          href={`http://${awsHost.trim() || 'localhost'}:${profile.port}/health`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary-400 hover:underline flex items-center gap-0.5"
                        >
                          GET <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <div className="p-2 rounded bg-black/30 border border-gray-800 flex items-center justify-between">
                        <span className="text-gray-400">Inference: <span className="text-gray-200">/predict</span></span>
                        <span className="px-1.5 py-0.5 rounded bg-warning-500/20 text-warning-400 text-[10px] font-bold">
                          POST only
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Clarification tip */}
                  <div className="text-[11px] text-gray-400 leading-relaxed bg-black/20 p-2 rounded border border-gray-800/60">
                    💡 <strong className="text-gray-300">Browser Navigation Note:</strong> ML models use <code className="text-primary-400">POST /predict</code> for inference data. Opening it directly in Chrome will give <code className="text-warning-400">405 Method Not Allowed</code>. Use the Swagger UI link above (<code className="text-success-400">/docs</code>) to send test predictions with interactive JSON forms.
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800 text-xs font-mono text-gray-400">
                  Target: {profile.awsService} ({awsHost}) — Port {profile.port} — Awaiting deployment trigger...
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Region: us-east-1 · {profile.awsService}</span>
                <button
                  onClick={handleRunAWS}
                  disabled={steps[3].status === 'running'}
                  className="px-5 py-2.5 rounded-xl bg-success-600 hover:bg-success-500 text-white text-xs font-bold transition-all shadow-md shadow-success-500/20 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <Cloud className="w-4 h-4" />
                  <span>Deploy to AWS 🚀</span>
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

      {/* ── In-App Automated Pipeline Code Generator Modal ── */}
      <CodeGenModal
        isOpen={showCodeGenModal}
        onClose={() => setShowCodeGenModal(false)}
        appName={repoName}
        appType={appType}
        port={profile.port}
        onDeployNow={handleAutoRunFullChain}
      />

    </div>
  );
}
