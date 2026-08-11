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

// Clear all mock datasets so the dashboards/tables start in a clean empty state

export const dashboardPipelines: PipelineStatus[] = [];
export const recentDeployments: Deployment[] = [];
export const recentActivities: Activity[] = [];

export const systemHealth: SystemHealth = {
  cpu: 0,
  memory: 0,
  uptime: '0s',
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

// ML Applications (Seed falls back to empty if database empty)
export const seedMLApplications: MLApplication[] = [];

// Pipeline stages
export const pipelineStages: PipelineStage[] = [];

// Monitoring
export const monitoringMetrics: MetricPoint[] = [];
export const serviceHealth: ServiceHealth[] = [];

// Logs
export const logEntries: LogEntry[] = [];

// Reports
export const deploymentHistory: DeploymentHistoryItem[] = [];
export const buildHistory: BuildHistoryItem[] = [];
export const testResults: TestResult[] = [];
