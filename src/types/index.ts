// Core shared types for the ML DevOps Control Center

export type Theme = 'light' | 'dark';

export type PageId =
  | 'dashboard'
  | 'github'
  | 'jenkins'
  | 'docker'
  | 'kubernetes'
  | 'aws'
  | 'ml-apps'
  | 'pipeline'
  | 'monitoring'
  | 'logs'
  | 'reports'
  | 'user-governance'
  | 'signin';

export type Status = 'success' | 'running' | 'failed' | 'pending' | 'idle' | 'warning' | 'stopped';

export interface NavItem {
  id: PageId;
  label: string;
  icon: string;
  group: string;
}

// Dashboard
export interface PipelineStatus {
  id: string;
  name: string;
  status: Status;
  stage: string;
  progress: number;
  startedAt: string;
}

export interface Deployment {
  id: string;
  app: string;
  version: string;
  environment: string;
  status: Status;
  deployedAt: string;
  triggeredBy: string;
}

export interface Activity {
  id: string;
  type: 'deploy' | 'build' | 'test' | 'push' | 'health' | 'rollback';
  message: string;
  timestamp: string;
  status: Status;
}

export interface SystemHealth {
  cpu: number;
  memory: number;
  uptime: string;
  responseTime: number;
  status: Status;
}

// GitHub
export interface GitHubRepo {
  id: string;
  name: string;
  fullName: string;
  branch: string;
  stars: number;
  updatedAt: string;
  language: string;
  private: boolean;
}

export interface GitHubBranch {
  id: string;
  name: string;
  lastCommit: string;
  author: string;
  updatedAt: string;
}

export interface GitHubCommit {
  id: string;
  sha: string;
  message: string;
  author: string;
  timestamp: string;
}

// Jenkins
export interface JenkinsPipeline {
  id: string;
  name: string;
  status: Status;
  lastBuild: number;
  duration: string;
  triggeredBy: string;
}

export interface JenkinsBuild {
  id: string;
  number: number;
  pipeline: string;
  status: Status;
  duration: string;
  timestamp: string;
  triggeredBy: string;
}

// Docker
export interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  size: string;
  createdAt: string;
}

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: Status;
  ports: string;
  uptime: string;
}

// Kubernetes
export interface K8sDeployment {
  id: string;
  name: string;
  namespace: string;
  replicas: string;
  ready: string;
  status: Status;
  age: string;
}

export interface K8sPod {
  id: string;
  name: string;
  namespace: string;
  status: Status;
  restarts: number;
  node: string;
  age: string;
}

export interface K8sService {
  id: string;
  name: string;
  namespace: string;
  type: string;
  clusterIP: string;
  ports: string;
  age: string;
}

// AWS
export interface EC2Instance {
  id: string;
  instanceId: string;
  name: string;
  type: string;
  state: Status;
  publicIP: string;
  appUrl: string;
  region: string;
}

// ML Applications
export interface MLApplication {
  id: string;
  name: string;
  description: string;
  modelType: string;
  framework: string;
  version: string;
  accuracy: number;
  endpoint: string;
  status: Status;
  lastTrained: string;
  repository: string;
  createdAt: string;
}

// Pipeline
export interface PipelineStage {
  id: string;
  name: string;
  status: Status;
  duration: string;
  icon: string;
}

// Monitoring
export interface MetricPoint {
  time: string;
  cpu: number;
  memory: number;
  response: number;
}

export interface ServiceHealth {
  id: string;
  name: string;
  status: Status;
  cpu: number;
  memory: number;
  uptime: string;
  responseTime: number;
  instances: number;
}

// Logs
export type LogSource = 'jenkins' | 'docker' | 'deployment' | 'application';
export interface LogEntry {
  id: string;
  source: LogSource;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  timestamp: string;
  service: string;
}

// Reports
export interface DeploymentHistoryItem {
  id: string;
  app: string;
  version: string;
  environment: string;
  status: Status;
  date: string;
  duration: string;
}

export interface BuildHistoryItem {
  id: string;
  pipeline: string;
  buildNumber: number;
  status: Status;
  date: string;
  duration: string;
  testsPassed: number;
  testsFailed: number;
}

export interface TestResult {
  id: string;
  suite: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: string;
  status: Status;
}
