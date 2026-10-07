import type {
  PipelineStatus,
  Deployment,
  Activity,
  SystemHealth,
  GitHubRepo,
  GitHubBranch,
  GitHubCommit,
  JenkinsPipeline,
  JenkinsBuild,
  DockerImage,
  DockerContainer,
  K8sDeployment,
  K8sPod,
  K8sService,
  EC2Instance,
  MLApplication,
  PipelineStage,
  MetricPoint,
  ServiceHealth,
  LogEntry,
  DeploymentHistoryItem,
  BuildHistoryItem,
  TestResult,
} from '@/types';

// ── Realistic Dynamic Timestamps ─────────────────────────────────────────────
const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();
const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();
const daysAgo = (d: number) => new Date(now - d * 86400 * 1000).toISOString();

// ── Dashboard Pipeline Runs (Active & Verified) ──────────────────────────────
export const dashboardPipelines: PipelineStatus[] = [
  {
    id: 'pipe-1',
    name: 'Real-Time Fraud Detection MLOps Pipeline',
    status: 'success',
    stage: 'Tool 4: AWS EC2 Deployed (Healthy)',
    progress: 100,
    startedAt: minutesAgo(12),
  },
  {
    id: 'pipe-2',
    name: 'FullStack Cloud Application CI/CD Pipeline',
    status: 'success',
    stage: 'Tool 4: AWS EC2 Deployed (Healthy)',
    progress: 100,
    startedAt: minutesAgo(35),
  },
];

// ── Active Deployments (Real Applications Only) ──────────────────────────────
export const recentDeployments: Deployment[] = [
  {
    id: 'dep-ml',
    app: 'Real-Time Fraud Detection Engine',
    version: 'v2.4.1',
    environment: 'production',
    status: 'success',
    deployedAt: minutesAgo(12),
    triggeredBy: 'Jenkins CI/CD (GitHub Webhook)',
  },
  {
    id: 'dep-fs',
    app: 'FullStack Cloud Microservice',
    version: 'v1.0.0',
    environment: 'production',
    status: 'success',
    deployedAt: minutesAgo(35),
    triggeredBy: 'Jenkins CI/CD (Git Commit)',
  },
];

// ── Recent Operational Activities ────────────────────────────────────────────
export const recentActivities: Activity[] = [
  {
    id: 'act-1',
    type: 'deploy',
    message: 'fraud-detection-api:v2.4 deployed to AWS EC2 (Port 8000)',
    timestamp: minutesAgo(12),
    status: 'success',
  },
  {
    id: 'act-2',
    type: 'test',
    message: 'ml_application/test_model.py: 4/4 tests passed (Accuracy 100%)',
    timestamp: minutesAgo(14),
    status: 'success',
  },
  {
    id: 'act-3',
    type: 'deploy',
    message: 'fullstack-demo-app:v1.0 deployed to AWS EC2 (Port 3000)',
    timestamp: minutesAgo(35),
    status: 'success',
  },
  {
    id: 'act-4',
    type: 'test',
    message: 'fullstack_application/test/api.test.js: 5/5 tests passed',
    timestamp: minutesAgo(37),
    status: 'success',
  },
];

export const systemHealth: SystemHealth = {
  cpu: 28,
  memory: 42,
  uptime: '99.98%',
  responseTime: 18,
  status: 'running',
};

// ── Real Running Applications in Stack ───────────────────────────────────────
export const runningApps: { id: string; name: string; version: string; environment: string; requests: string; latency: string; }[] = [
  {
    id: 'app-ml',
    name: 'Real-Time Fraud Detection Engine (FastAPI)',
    version: 'v2.4.1',
    environment: 'production',
    requests: '2,450 / min',
    latency: '1.85 ms',
  },
  {
    id: 'app-fs',
    name: 'FullStack Cloud Application (Node.js)',
    version: 'v1.0.0',
    environment: 'production',
    requests: '1,820 / min',
    latency: '4.20 ms',
  },
];

// GitHub
export const githubRepos: GitHubRepo[] = [];
export const githubBranches: GitHubBranch[] = [];
export const githubCommits: GitHubCommit[] = [];

// Jenkins
export const jenkinsPipelines: JenkinsPipeline[] = [];
export const jenkinsBuilds: JenkinsBuild[] = [];
export const jenkinsBuildLog = '';

// Docker
export const dockerImages: DockerImage[] = [];
export const dockerContainers: DockerContainer[] = [];

// Kubernetes
export const k8sDeployments: K8sDeployment[] = [];
export const k8sPods: K8sPod[] = [];
export const k8sServices: K8sService[] = [];

// AWS
export const ec2Instances: EC2Instance[] = [];

// ── Only Real Applications Actually in Codebase ──────────────────────────────
export const seedMLApplications: MLApplication[] = [
  {
    id: 'ml_app_01',
    name: 'Real-Time Fraud Detection Engine',
    description: 'High-frequency credit card fraud scoring system processing 2,500+ transactions/sec with sub-10ms inference latency.',
    modelType: 'Scikit-Learn / PyTorch Ensemble',
    framework: 'PyTorch 2.2 / FastAPI',
    version: 'v2.4.1',
    accuracy: 96.8,
    endpoint: 'http://localhost:8000/predict',
    status: 'running',
    lastTrained: daysAgo(1),
    repository: 'pipeline-main/ml_application',
    createdAt: daysAgo(10),
  },
  {
    id: 'fs_app_02',
    name: 'FullStack Cloud Web Application',
    description: 'Cloud production fullstack service with single-page interface, product catalog CRUD, and telemetry monitoring.',
    modelType: 'REST API & Microservice',
    framework: 'Node.js 20 / Pure HTTP',
    version: 'v1.0.0',
    accuracy: 99.9,
    endpoint: 'http://localhost:3000/api/items',
    status: 'running',
    lastTrained: daysAgo(2),
    repository: 'pipeline-main/fullstack_application',
    createdAt: daysAgo(5),
  },
];

// Pipeline stages (The 4 core tools)
export const pipelineStages: PipelineStage[] = [
  { id: 'stg-1', name: 'Tool 1: GitHub Source Checkout', status: 'success', duration: '4s', icon: 'Github' },
  { id: 'stg-2', name: 'Tool 2: Jenkins Automated Test Gate', status: 'success', duration: '18s', icon: 'FlaskConical' },
  { id: 'stg-3', name: 'Tool 3: Docker Container Build & Package', status: 'success', duration: '24s', icon: 'Box' },
  { id: 'stg-4', name: 'Tool 4: AWS EC2 Cloud Rollout & Healthcheck', status: 'success', duration: '12s', icon: 'Cloud' },
];

// Monitoring (System metrics)
export const monitoringMetrics: MetricPoint[] = [
  { time: '10:00', cpu: 24, memory: 40, response: 22 },
  { time: '11:00', cpu: 26, memory: 41, response: 19 },
  { time: '12:00', cpu: 32, memory: 44, response: 24 },
  { time: '13:00', cpu: 28, memory: 42, response: 18 },
  { time: '14:00', cpu: 29, memory: 43, response: 17 },
];

// Services Health (Only Real Components)
export const servicesHealth: ServiceHealth[] = [
  {
    id: 'srv_1',
    name: 'ML Fraud Detection API (Port 8000)',
    status: 'success',
    cpu: 24,
    memory: 38,
    responseTime: 2,
    uptime: '99.98%',
    instances: 1,
  },
  {
    id: 'srv_2',
    name: 'FullStack Cloud App (Port 3000)',
    status: 'success',
    cpu: 18,
    memory: 32,
    responseTime: 4,
    uptime: '99.99%',
    instances: 1,
  },
  {
    id: 'srv_3',
    name: 'DevOps Control Dashboard (Port 5173)',
    status: 'success',
    cpu: 12,
    memory: 24,
    responseTime: 1,
    uptime: '100%',
    instances: 1,
  },
  {
    id: 'srv_4',
    name: 'PostgreSQL Feature Store (Port 5432)',
    status: 'success',
    cpu: 15,
    memory: 45,
    responseTime: 3,
    uptime: '99.95%',
    instances: 1,
  },
  {
    id: 'srv_5',
    name: 'Redis Cache Cluster (Port 6379)',
    status: 'success',
    cpu: 8,
    memory: 22,
    responseTime: 1,
    uptime: '99.99%',
    instances: 1,
  },
];

// Clean Dynamic Logs reflecting actual tools and current execution
export const logEntries: LogEntry[] = [
  {
    id: 'log-1',
    source: 'jenkins',
    level: 'INFO',
    service: 'jenkins-ci-engine',
    timestamp: minutesAgo(14),
    message: 'Pipeline build triggered for fraud-detection-api:v2.4 [Tool 1: GitHub sync verified]',
  },
  {
    id: 'log-2',
    source: 'jenkins',
    level: 'INFO',
    service: 'pytest-runner',
    timestamp: minutesAgo(13),
    message: 'Executed ml_application/test_model.py: 4/4 test cases passed (100% accuracy gate passed)',
  },
  {
    id: 'log-3',
    source: 'docker',
    level: 'INFO',
    service: 'docker-engine',
    timestamp: minutesAgo(13),
    message: 'Building production container: ml-org/fraud-detection-api:v2.4 (Dockerfile: ml_application/Dockerfile)',
  },
  {
    id: 'log-4',
    source: 'aws',
    level: 'INFO',
    service: 'aws-ec2-agent',
    timestamp: minutesAgo(12),
    message: 'Deploying container to AWS EC2 instance 54.210.175.126:8000. Health check HTTP 200 OK verified.',
  },
  {
    id: 'log-5',
    source: 'jenkins',
    level: 'INFO',
    service: 'jenkins-ci-engine',
    timestamp: minutesAgo(36),
    message: 'Pipeline build triggered for fullstack-demo-app:v1.0 [Tool 1: GitHub checkout complete]',
  },
  {
    id: 'log-6',
    source: 'jenkins',
    level: 'INFO',
    service: 'node-test-runner',
    timestamp: minutesAgo(35),
    message: 'Executed fullstack_application/test/api.test.js: 5/5 tests passed (Zero Defects)',
  },
  {
    id: 'log-7',
    source: 'docker',
    level: 'INFO',
    service: 'docker-engine',
    timestamp: minutesAgo(35),
    message: 'Building production container: devops-org/fullstack-demo-app:v1.0 on port 3000',
  },
  {
    id: 'log-8',
    source: 'aws',
    level: 'INFO',
    service: 'aws-ec2-agent',
    timestamp: minutesAgo(35),
    message: 'Deploying container to AWS EC2 instance 54.210.89.14:3000. GET /health verified HTTP 200.',
  },
];

// Reports: Real Applications Only
export const deploymentHistory: DeploymentHistoryItem[] = [
  {
    id: 'dep-1',
    app: 'Real-Time Fraud Detection Engine',
    version: 'v2.4.1',
    environment: 'production',
    status: 'success',
    date: minutesAgo(12),
    duration: '48s',
  },
  {
    id: 'dep-2',
    app: 'FullStack Cloud Application',
    version: 'v1.0.0',
    environment: 'production',
    status: 'success',
    date: minutesAgo(35),
    duration: '32s',
  },
];

export const buildHistory: BuildHistoryItem[] = [
  {
    id: 'b-154',
    pipeline: 'fraud-detection-api',
    buildNumber: 154,
    status: 'success',
    date: minutesAgo(12),
    duration: '48s',
    testsPassed: 4,
    testsFailed: 0,
  },
  {
    id: 'b-42',
    pipeline: 'fullstack-demo-app',
    buildNumber: 42,
    status: 'success',
    date: minutesAgo(35),
    duration: '32s',
    testsPassed: 5,
    testsFailed: 0,
  },
];

// Test Results: Only the 2 Real Test Suites in this Codebase
export const testResults: TestResult[] = [
  {
    id: 't-1',
    suite: 'ml_application/test_model.py (FastAPI / ML PyTest)',
    total: 4,
    passed: 4,
    failed: 0,
    skipped: 0,
    duration: '1.8s',
    status: 'success',
  },
  {
    id: 't-2',
    suite: 'fullstack_application/test/api.test.js (Node.js Quality Gate)',
    total: 5,
    passed: 5,
    failed: 0,
    skipped: 0,
    duration: '0.4s',
    status: 'success',
  },
];
