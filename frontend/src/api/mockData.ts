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

// ── Real / Empty Operational State (Zero Dummy Data) ─────────────────────────
export const dashboardPipelines: PipelineStatus[] = [];
export const recentDeployments: Deployment[] = [];
export const recentActivities: Activity[] = [];

export const systemHealth: SystemHealth = {
  cpu: 0,
  memory: 0,
  uptime: 'Active',
  responseTime: 0,
  status: 'idle',
};

export const runningApps: { id: string; name: string; version: string; environment: string; requests: string; latency: string; }[] = [];

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

// ML Applications
export const seedMLApplications: MLApplication[] = [];

// Pipeline stages
export const pipelineStages: PipelineStage[] = [
  { id: 'stg-1', name: 'Tool 1: GitHub Source Checkout', status: 'idle', duration: '—', icon: 'Github' },
  { id: 'stg-2', name: 'Tool 2: Jenkins Automated Test Gate', status: 'idle', duration: '—', icon: 'FlaskConical' },
  { id: 'stg-3', name: 'Tool 3: Docker Container Build & Package', status: 'idle', duration: '—', icon: 'Box' },
  { id: 'stg-4', name: 'Tool 4: AWS EC2 Cloud Rollout & Healthcheck', status: 'idle', duration: '—', icon: 'Cloud' },
];

// Telemetry & Metrics
export const monitoringMetrics: MetricPoint[] = [];
export const servicesHealth: ServiceHealth[] = [];

// Logs
export const logEntries: LogEntry[] = [];

// Reports & Audit Records
export const deploymentHistory: DeploymentHistoryItem[] = [];
export const buildHistory: BuildHistoryItem[] = [];
export const testResults: TestResult[] = [];
