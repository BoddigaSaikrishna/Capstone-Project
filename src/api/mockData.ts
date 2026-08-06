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

const now = Date.now();
const ago = (mins: number) => new Date(now - mins * 60000).toISOString();

export const dashboardPipelines: PipelineStatus[] = [
  { id: 'p1', name: 'fraud-detection-api', status: 'running', stage: 'Build Docker Image', progress: 62, startedAt: ago(8) },
  { id: 'p2', name: 'image-classifier-svc', status: 'success', stage: 'Production', progress: 100, startedAt: ago(35) },
  { id: 'p3', name: 'nlp-sentiment-model', status: 'failed', stage: 'Run Tests', progress: 45, startedAt: ago(12) },
  { id: 'p4', name: 'recommendation-engine', status: 'pending', stage: 'Queued', progress: 0, startedAt: ago(2) },
];

export const recentDeployments: Deployment[] = [
  { id: 'd1', app: 'image-classifier-svc', version: 'v2.4.1', environment: 'Production', status: 'success', deployedAt: ago(35), triggeredBy: 'jenkins-bot' },
  { id: 'd2', app: 'fraud-detection-api', version: 'v1.8.0', environment: 'Staging', status: 'running', deployedAt: ago(8), triggeredBy: 'ci-pipeline' },
  { id: 'd3', app: 'nlp-sentiment-model', version: 'v3.0.2', environment: 'Staging', status: 'failed', deployedAt: ago(12), triggeredBy: 'github-actions' },
  { id: 'd4', app: 'recommendation-engine', version: 'v0.9.5', environment: 'Production', status: 'success', deployedAt: ago(120), triggeredBy: 'jenkins-bot' },
  { id: 'd5', app: 'time-series-forecast', version: 'v1.2.0', environment: 'Production', status: 'success', deployedAt: ago(240), triggeredBy: 'manual-deploy' },
];

export const recentActivities: Activity[] = [
  { id: 'a1', type: 'deploy', message: 'image-classifier-svc v2.4.1 deployed to Production', timestamp: ago(35), status: 'success' },
  { id: 'a2', type: 'build', message: 'fraud-detection-api build #142 started', timestamp: ago(8), status: 'running' },
  { id: 'a3', type: 'test', message: 'nlp-sentiment-model tests failed (3 failures)', timestamp: ago(12), status: 'failed' },
  { id: 'a4', type: 'push', message: 'Docker image recommendation-engine:v0.9.5 pushed', timestamp: ago(125), status: 'success' },
  { id: 'a5', type: 'health', message: 'Health check passed for time-series-forecast', timestamp: ago(245), status: 'success' },
  { id: 'a6', type: 'rollback', message: 'anomaly-detector rolled back to v1.1.4', timestamp: ago(300), status: 'warning' },
];

export const systemHealth: SystemHealth = {
  cpu: 42,
  memory: 68,
  uptime: '27d 14h 32m',
  responseTime: 124,
  status: 'success',
};

export const runningApps = [
  { id: 'r1', name: 'image-classifier-svc', version: 'v2.4.1', environment: 'Production', requests: '1.2k/min', latency: '42ms' },
  { id: 'r2', name: 'recommendation-engine', version: 'v0.9.5', environment: 'Production', requests: '3.4k/min', latency: '18ms' },
  { id: 'r3', name: 'time-series-forecast', version: 'v1.2.0', environment: 'Production', requests: '780/min', latency: '95ms' },
  { id: 'r4', name: 'fraud-detection-api', version: 'v1.7.9', environment: 'Production', requests: '2.1k/min', latency: '31ms' },
];

// GitHub
export const githubRepos: GitHubRepo[] = [
  { id: 'g1', name: 'fraud-detection-api', fullName: 'ml-org/fraud-detection-api', branch: 'main', stars: 142, updatedAt: ago(15), language: 'Python', private: false },
  { id: 'g2', name: 'image-classifier-svc', fullName: 'ml-org/image-classifier-svc', branch: 'main', stars: 89, updatedAt: ago(40), language: 'Python', private: false },
  { id: 'g3', name: 'nlp-sentiment-model', fullName: 'ml-org/nlp-sentiment-model', branch: 'develop', stars: 56, updatedAt: ago(12), language: 'Python', private: true },
  { id: 'g4', name: 'recommendation-engine', fullName: 'ml-org/recommendation-engine', branch: 'main', stars: 203, updatedAt: ago(120), language: 'Python', private: false },
  { id: 'g5', name: 'time-series-forecast', fullName: 'ml-org/time-series-forecast', branch: 'main', stars: 34, updatedAt: ago(240), language: 'Python', private: false },
];

export const githubBranches: GitHubBranch[] = [
  { id: 'b1', name: 'main', lastCommit: 'feat: upgrade to PyTorch 2.1', author: 'sarah.chen', updatedAt: ago(15) },
  { id: 'b2', name: 'develop', lastCommit: 'fix: gradient clipping threshold', author: 'mike.r', updatedAt: ago(45) },
  { id: 'b3', name: 'feature/batch-inference', lastCommit: 'add batch inference endpoint', author: 'liam.k', updatedAt: ago(90) },
  { id: 'b4', name: 'release/v2.5.0', lastCommit: 'release prep v2.5.0', author: 'sarah.chen', updatedAt: ago(180) },
];

export const githubCommits: GitHubCommit[] = [
  { id: 'c1', sha: 'a3f8b21', message: 'feat: upgrade to PyTorch 2.1 for faster inference', author: 'sarah.chen', timestamp: ago(15) },
  { id: 'c2', sha: '7d2e9c4', message: 'fix: resolve memory leak in batch processing', author: 'mike.r', timestamp: ago(50) },
  { id: 'c3', sha: '1b9f3a7', message: 'test: add integration tests for prediction API', author: 'liam.k', timestamp: ago(95) },
  { id: 'c4', sha: 'c5e1d88', message: 'docs: update API documentation for v2.4', author: 'priya.s', timestamp: ago(180) },
  { id: 'c5', sha: '9a4c2f6', message: 'refactor: optimize data preprocessing pipeline', author: 'sarah.chen', timestamp: ago(320) },
];

// Jenkins
export const jenkinsPipelines: JenkinsPipeline[] = [
  { id: 'j1', name: 'fraud-detection-ci', status: 'running', lastBuild: 142, duration: '4m 32s', triggeredBy: 'github-webhook' },
  { id: 'j2', name: 'image-classifier-cd', status: 'success', lastBuild: 87, duration: '6m 15s', triggeredBy: 'manual' },
  { id: 'j3', name: 'nlp-sentiment-ci', status: 'failed', lastBuild: 34, duration: '2m 48s', triggeredBy: 'github-webhook' },
  { id: 'j4', name: 'recommendation-deploy', status: 'success', lastBuild: 56, duration: '8m 02s', triggeredBy: 'schedule' },
  { id: 'j5', name: 'forecast-nightly', status: 'idle', lastBuild: 23, duration: '12m 30s', triggeredBy: 'schedule' },
];

export const jenkinsBuilds: JenkinsBuild[] = [
  { id: 'jb1', number: 142, pipeline: 'fraud-detection-ci', status: 'running', duration: '4m 32s', timestamp: ago(8), triggeredBy: 'github-webhook' },
  { id: 'jb2', number: 87, pipeline: 'image-classifier-cd', status: 'success', duration: '6m 15s', timestamp: ago(35), triggeredBy: 'manual' },
  { id: 'jb3', number: 34, pipeline: 'nlp-sentiment-ci', status: 'failed', duration: '2m 48s', timestamp: ago(12), triggeredBy: 'github-webhook' },
  { id: 'jb4', number: 56, pipeline: 'recommendation-deploy', status: 'success', duration: '8m 02s', timestamp: ago(120), triggeredBy: 'schedule' },
  { id: 'jb5', number: 23, pipeline: 'forecast-nightly', status: 'success', duration: '12m 30s', timestamp: ago(720), triggeredBy: 'schedule' },
  { id: 'jb6', number: 86, pipeline: 'image-classifier-cd', status: 'success', duration: '5m 48s', timestamp: ago(300), triggeredBy: 'github-webhook' },
];

export const jenkinsBuildLog = `[2026-07-23 10:14:02] Started by GitHub webhook
[2026-07-23 10:14:03] Running in workspace /var/jenkins/workspace/fraud-detection-ci
[2026-07-23 10:14:05] > git checkout a3f8b21
[2026-07-23 10:14:08] > git rev-parse a3f8b21^{commit}
[2026-07-23 10:14:08] Commit: feat: upgrade to PyTorch 2.1 for faster inference
[2026-07-23 10:14:12] [Stage 1/8] Checkout — Success (3.2s)
[2026-07-23 10:14:15] [Stage 2/8] Install Dependencies — pip install -r requirements.txt
[2026-07-23 10:14:42] Collecting torch==2.1.0
[2026-07-23 10:15:01] Successfully installed torch-2.1.0 scikit-learn-1.3.2
[2026-07-23 10:15:03] [Stage 2/8] Install Dependencies — Success (48.1s)
[2026-07-23 10:15:05] [Stage 3/8] Run Tests — pytest tests/ -v
[2026-07-23 10:15:20] tests/test_model.py::test_inference PASSED
[2026-07-23 10:15:22] tests/test_model.py::test_accuracy PASSED
[2026-07-23 10:15:25] tests/test_api.py::test_predict PASSED
[2026-07-23 10:15:28] tests/test_api.py::test_batch PASSED
[2026-07-23 10:15:30] 42 passed, 0 failed in 25.3s
[2026-07-23 10:15:32] [Stage 3/8] Run Tests — Success (27.1s)
[2026-07-23 10:15:35] [Stage 4/8] Build Docker Image — docker build -t fraud-detection:v1.8.0 .
[2026-07-23 10:16:10] Step 1/12 : FROM python:3.11-slim
[2026-07-23 10:16:12] Step 2/12 : COPY requirements.txt .
[2026-07-23 10:16:15] Step 12/12 : CMD ["gunicorn", "app:app"]
[2026-07-23 10:16:18] Successfully built a4f8c9e2
[2026-07-23 10:16:20] [Stage 4/8] Build Docker Image — Success (45.2s)
[2026-07-23 10:16:22] [Stage 5/8] Push Image — docker push registry.ml-org.io/fraud-detection:v1.8.0
[2026-07-23 10:16:45] Pushed: sha256:9c4a7f2e...
[2026-07-23 10:16:47] [Stage 5/8] Push Image — Success (25.1s)
[2026-07-23 10:16:50] [Stage 6/8] Deploy — kubectl apply -f k8s/
[2026-07-23 10:17:05] deployment.apps/fraud-detection configured
[2026-07-23 10:17:08] [Stage 6/8] Deploy — Success (18.3s)
[2026-07-23 10:16:10] [Stage 7/8] Health Check — curl http://fraud-detection:8080/health
[2026-07-23 10:17:25] {"status":"healthy","model":"loaded"}
[2026-07-23 10:17:28] [Stage 7/8] Health Check — Success (3.1s)
[2026-07-23 10:17:30] [Stage 8/8] Production — Deployment verified
[2026-07-23 10:17:32] Pipeline completed: SUCCESS in 4m 32s`;

// Docker
export const dockerImages: DockerImage[] = [
  { id: 'i1', repository: 'fraud-detection', tag: 'v1.8.0', size: '1.2 GB', createdAt: ago(8) },
  { id: 'i2', repository: 'image-classifier', tag: 'v2.4.1', size: '2.1 GB', createdAt: ago(35) },
  { id: 'i3', repository: 'image-classifier', tag: 'v2.4.0', size: '2.0 GB', createdAt: ago(300) },
  { id: 'i4', repository: 'nlp-sentiment', tag: 'v3.0.1', size: '1.8 GB', createdAt: ago(12) },
  { id: 'i5', repository: 'recommendation-engine', tag: 'v0.9.5', size: '980 MB', createdAt: ago(120) },
  { id: 'i6', repository: 'time-series-forecast', tag: 'v1.2.0', size: '1.5 GB', createdAt: ago(240) },
];

export const dockerContainers: DockerContainer[] = [
  { id: 'ct1', name: 'fraud-detection-svc', image: 'fraud-detection:v1.7.9', status: 'running', ports: '8080:8080', uptime: '3d 4h' },
  { id: 'ct2', name: 'image-classifier-prod', image: 'image-classifier:v2.4.1', status: 'running', ports: '8081:8080', uptime: '5d 12h' },
  { id: 'ct3', name: 'recommendation-prod', image: 'recommendation-engine:v0.9.5', status: 'running', ports: '8082:8080', uptime: '8d 2h' },
  { id: 'ct4', name: 'forecast-prod', image: 'time-series-forecast:v1.2.0', status: 'running', ports: '8083:8080', uptime: '10d 6h' },
  { id: 'ct5', name: 'nlp-sentiment-staging', image: 'nlp-sentiment:v3.0.1', status: 'failed', ports: '8084:8080', uptime: '0h' },
];

// Kubernetes
export const k8sDeployments: K8sDeployment[] = [
  { id: 'k1', name: 'fraud-detection', namespace: 'production', replicas: '3/3', ready: '3/3', status: 'success', age: '3d' },
  { id: 'k2', name: 'image-classifier', namespace: 'production', replicas: '2/2', ready: '2/2', status: 'success', age: '5d' },
  { id: 'k3', name: 'recommendation-engine', namespace: 'production', replicas: '4/4', ready: '4/4', status: 'success', age: '8d' },
  { id: 'k4', name: 'time-series-forecast', namespace: 'production', replicas: '2/2', ready: '2/2', status: 'success', age: '10d' },
  { id: 'k5', name: 'nlp-sentiment', namespace: 'staging', replicas: '1/2', ready: '1/2', status: 'warning', age: '12h' },
];

export const k8sPods: K8sPod[] = [
  { id: 'kp1', name: 'fraud-detection-7d4-x9k2m', namespace: 'production', status: 'running', restarts: 0, node: 'node-prod-1', age: '3d' },
  { id: 'kp2', name: 'fraud-detection-7d4-a3b1n', namespace: 'production', status: 'running', restarts: 0, node: 'node-prod-2', age: '3d' },
  { id: 'kp3', name: 'fraud-detection-7d4-c8f5q', namespace: 'production', status: 'running', restarts: 1, node: 'node-prod-3', age: '3d' },
  { id: 'kp4', name: 'image-classifier-2f8-p1z3', namespace: 'production', status: 'running', restarts: 0, node: 'node-prod-1', age: '5d' },
  { id: 'kp5', name: 'image-classifier-2f8-q4w6', namespace: 'production', status: 'running', restarts: 0, node: 'node-prod-2', age: '5d' },
  { id: 'kp6', name: 'nlp-sentiment-5c2-r7t9', namespace: 'staging', status: 'failed', restarts: 4, node: 'node-staging-1', age: '12h' },
  { id: 'kp7', name: 'recommendation-9e3-s2d4', namespace: 'production', status: 'running', restarts: 0, node: 'node-prod-1', age: '8d' },
];

export const k8sServices: K8sService[] = [
  { id: 'ks1', name: 'fraud-detection-svc', namespace: 'production', type: 'LoadBalancer', clusterIP: '10.96.0.12', ports: '80:8080/TCP', age: '3d' },
  { id: 'ks2', name: 'image-classifier-svc', namespace: 'production', type: 'LoadBalancer', clusterIP: '10.96.0.18', ports: '80:8080/TCP', age: '5d' },
  { id: 'ks3', name: 'recommendation-svc', namespace: 'production', type: 'LoadBalancer', clusterIP: '10.96.0.24', ports: '80:8080/TCP', age: '8d' },
  { id: 'ks4', name: 'forecast-svc', namespace: 'production', type: 'ClusterIP', clusterIP: '10.96.0.31', ports: '8080/TCP', age: '10d' },
];

// AWS
export const ec2Instances: EC2Instance[] = [
  { id: 'e1', instanceId: 'i-0a1b2c3d4e5f6g7h8', name: 'fraud-detection-prod', type: 't3.large', state: 'running', publicIP: '54.210.42.108', appUrl: 'http://54.210.42.108:8080', region: 'us-east-1' },
  { id: 'e2', instanceId: 'i-0b2c3d4e5f6g7h8i9j0', name: 'image-classifier-prod', type: 't3.xlarge', state: 'running', publicIP: '54.198.11.205', appUrl: 'http://54.198.11.205:8081', region: 'us-east-1' },
  { id: 'e3', instanceId: 'i-0c3d4e5f6g7h8i9j0k1', name: 'recommendation-prod', type: 'm5.large', state: 'running', publicIP: '52.20.88.144', appUrl: 'http://52.20.88.144:8082', region: 'us-east-1' },
  { id: 'e4', instanceId: 'i-0d4e5f6g7h8i9j0k1l2', name: 'forecast-prod', type: 't3.medium', state: 'running', publicIP: '3.215.54.92', appUrl: 'http://3.215.54.92:8083', region: 'us-west-2' },
  { id: 'e5', instanceId: 'i-0e5f6g7h8i9j0k1l2m3', name: 'nlp-sentiment-staging', type: 't3.small', state: 'stopped', publicIP: '—', appUrl: '—', region: 'us-east-1' },
];

// ML Applications (seed data — also persisted to Supabase)
export const seedMLApplications: MLApplication[] = [
  {
    id: 'ml1',
    name: 'Fraud Detection API',
    description: 'Real-time credit card fraud detection using gradient-boosted trees with sub-50ms latency.',
    modelType: 'XGBoost Classifier',
    framework: 'XGBoost / scikit-learn',
    version: 'v1.8.0',
    accuracy: 96.4,
    endpoint: 'POST /api/v1/predict',
    status: 'running',
    lastTrained: ago(720),
    repository: 'ml-org/fraud-detection-api',
    createdAt: ago(14400),
  },
  {
    id: 'ml2',
    name: 'Image Classifier Service',
    description: 'ResNet-50 based image classification service supporting 1,000 categories with batch inference.',
    modelType: 'ResNet-50 (CNN)',
    framework: 'PyTorch 2.1',
    version: 'v2.4.1',
    accuracy: 94.2,
    endpoint: 'POST /api/v2/classify',
    status: 'running',
    lastTrained: ago(2880),
    repository: 'ml-org/image-classifier-svc',
    createdAt: ago(21600),
  },
  {
    id: 'ml3',
    name: 'NLP Sentiment Model',
    description: 'Fine-tuned BERT for sentiment analysis on customer reviews with 3-class output.',
    modelType: 'BERT-base',
    framework: 'HuggingFace Transformers',
    version: 'v3.0.2',
    accuracy: 91.7,
    endpoint: 'POST /api/v3/sentiment',
    status: 'failed',
    lastTrained: ago(1440),
    repository: 'ml-org/nlp-sentiment-model',
    createdAt: ago(10800),
  },
  {
    id: 'ml4',
    name: 'Recommendation Engine',
    description: 'Collaborative filtering recommendation system serving 3.4k requests/min in production.',
    modelType: 'Matrix Factorization',
    framework: 'TensorFlow Recommenders',
    version: 'v0.9.5',
    accuracy: 88.9,
    endpoint: 'POST /api/v1/recommend',
    status: 'running',
    lastTrained: ago(4320),
    repository: 'ml-org/recommendation-engine',
    createdAt: ago(18000),
  },
];

// Pipeline stages
export const pipelineStages: PipelineStage[] = [
  { id: 's1', name: 'GitHub', status: 'success', duration: '0.3s', icon: 'Github' },
  { id: 's2', name: 'Checkout', status: 'success', duration: '3.2s', icon: 'GitBranch' },
  { id: 's3', name: 'Install Dependencies', status: 'success', duration: '48.1s', icon: 'Package' },
  { id: 's4', name: 'Run Tests', status: 'success', duration: '27.1s', icon: 'FlaskConical' },
  { id: 's5', name: 'Build Docker Image', status: 'running', duration: '45.2s', icon: 'Box' },
  { id: 's6', name: 'Push Image', status: 'pending', duration: '—', icon: 'Upload' },
  { id: 's7', name: 'Deploy', status: 'pending', duration: '—', icon: 'Rocket' },
  { id: 's8', name: 'Health Check', status: 'pending', duration: '—', icon: 'HeartPulse' },
  { id: 's9', name: 'Production', status: 'pending', duration: '—', icon: 'CheckCircle2' },
];

// Monitoring
export const monitoringMetrics: MetricPoint[] = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  return {
    time: `${hour.toString().padStart(2, '0')}:00`,
    cpu: Math.round(30 + Math.sin(i / 3) * 15 + Math.random() * 10),
    memory: Math.round(55 + Math.cos(i / 4) * 12 + Math.random() * 8),
    response: Math.round(80 + Math.sin(i / 5) * 30 + Math.random() * 20),
  };
});

export const serviceHealth: ServiceHealth[] = [
  { id: 'sh1', name: 'fraud-detection-api', status: 'success', cpu: 38, memory: 62, uptime: '3d 4h', responseTime: 42, instances: 3 },
  { id: 'sh2', name: 'image-classifier-svc', status: 'success', cpu: 55, memory: 71, uptime: '5d 12h', responseTime: 67, instances: 2 },
  { id: 'sh3', name: 'recommendation-engine', status: 'success', cpu: 44, memory: 58, uptime: '8d 2h', responseTime: 18, instances: 4 },
  { id: 'sh4', name: 'time-series-forecast', status: 'warning', cpu: 78, memory: 84, uptime: '10d 6h', responseTime: 95, instances: 2 },
  { id: 'sh5', name: 'nlp-sentiment-staging', status: 'failed', cpu: 0, memory: 0, uptime: '0h', responseTime: 0, instances: 0 },
];

// Logs
export const logEntries: LogEntry[] = [
  { id: 'l1', source: 'jenkins', level: 'INFO', message: 'Build #142 started for fraud-detection-ci', timestamp: ago(8), service: 'jenkins' },
  { id: 'l2', source: 'jenkins', level: 'INFO', message: 'Stage 3/8 Run Tests — 42 passed, 0 failed', timestamp: ago(7), service: 'jenkins' },
  { id: 'l3', source: 'jenkins', level: 'INFO', message: 'Stage 4/8 Build Docker Image — building...', timestamp: ago(6), service: 'jenkins' },
  { id: 'l4', source: 'docker', level: 'INFO', message: 'Container image-classifier-prod health check passed', timestamp: ago(5), service: 'docker' },
  { id: 'l5', source: 'docker', level: 'WARN', message: 'Container nlp-sentiment-staging high memory usage (89%)', timestamp: ago(15), service: 'docker' },
  { id: 'l6', source: 'deployment', level: 'INFO', message: 'Deploying image-classifier-svc v2.4.1 to production', timestamp: ago(35), service: 'k8s' },
  { id: 'l7', source: 'deployment', level: 'ERROR', message: 'Deployment failed for nlp-sentiment-model: image pull error', timestamp: ago(12), service: 'k8s' },
  { id: 'l8', source: 'application', level: 'INFO', message: 'fraud-detection-api: processed 1,247 predictions in last minute', timestamp: ago(1), service: 'fraud-detection' },
  { id: 'l9', source: 'application', level: 'WARN', message: 'recommendation-engine: latency spike detected (180ms)', timestamp: ago(3), service: 'recommendation' },
  { id: 'l10', source: 'application', level: 'ERROR', message: 'nlp-sentiment: model loading failed — CUDA out of memory', timestamp: ago(14), service: 'nlp-sentiment' },
  { id: 'l11', source: 'docker', level: 'INFO', message: 'Pulled image fraud-detection:v1.8.0 (sha256:9c4a7f2e)', timestamp: ago(6), service: 'docker' },
  { id: 'l12', source: 'jenkins', level: 'INFO', message: 'Build #87 completed: SUCCESS in 6m 15s', timestamp: ago(35), service: 'jenkins' },
];

// Reports
export const deploymentHistory: DeploymentHistoryItem[] = [
  { id: 'dh1', app: 'image-classifier-svc', version: 'v2.4.1', environment: 'Production', status: 'success', date: ago(35), duration: '6m 15s' },
  { id: 'dh2', app: 'fraud-detection-api', version: 'v1.8.0', environment: 'Staging', status: 'running', date: ago(8), duration: '4m 32s' },
  { id: 'dh3', app: 'nlp-sentiment-model', version: 'v3.0.2', environment: 'Staging', status: 'failed', date: ago(12), duration: '2m 48s' },
  { id: 'dh4', app: 'recommendation-engine', version: 'v0.9.5', environment: 'Production', status: 'success', date: ago(120), duration: '8m 02s' },
  { id: 'dh5', app: 'time-series-forecast', version: 'v1.2.0', environment: 'Production', status: 'success', date: ago(240), duration: '10m 15s' },
  { id: 'dh6', app: 'image-classifier-svc', version: 'v2.4.0', environment: 'Production', status: 'success', date: ago(720), duration: '5m 48s' },
  { id: 'dh7', app: 'fraud-detection-api', version: 'v1.7.9', environment: 'Production', status: 'success', date: ago(1440), duration: '4m 10s' },
];

export const buildHistory: BuildHistoryItem[] = [
  { id: 'bh1', pipeline: 'fraud-detection-ci', buildNumber: 142, status: 'running', date: ago(8), duration: '4m 32s', testsPassed: 42, testsFailed: 0 },
  { id: 'bh2', pipeline: 'image-classifier-cd', buildNumber: 87, status: 'success', date: ago(35), duration: '6m 15s', testsPassed: 38, testsFailed: 0 },
  { id: 'bh3', pipeline: 'nlp-sentiment-ci', buildNumber: 34, status: 'failed', date: ago(12), duration: '2m 48s', testsPassed: 29, testsFailed: 3 },
  { id: 'bh4', pipeline: 'recommendation-deploy', buildNumber: 56, status: 'success', date: ago(120), duration: '8m 02s', testsPassed: 51, testsFailed: 0 },
  { id: 'bh5', pipeline: 'forecast-nightly', buildNumber: 23, status: 'success', date: ago(720), duration: '12m 30s', testsPassed: 24, testsFailed: 0 },
  { id: 'bh6', pipeline: 'image-classifier-cd', buildNumber: 86, status: 'success', date: ago(300), duration: '5m 48s', testsPassed: 37, testsFailed: 0 },
];

export const testResults: TestResult[] = [
  { id: 'tr1', suite: 'test_model.py', total: 18, passed: 18, failed: 0, skipped: 0, duration: '12.3s', status: 'success' },
  { id: 'tr2', suite: 'test_api.py', total: 12, passed: 12, failed: 0, skipped: 0, duration: '8.1s', status: 'success' },
  { id: 'tr3', suite: 'test_preprocessing.py', total: 8, passed: 7, failed: 1, skipped: 0, duration: '4.2s', status: 'failed' },
  { id: 'tr4', suite: 'test_integration.py', total: 4, passed: 3, failed: 1, skipped: 0, duration: '6.8s', status: 'failed' },
  { id: 'tr5', suite: 'test_inference.py', total: 10, passed: 10, failed: 0, skipped: 0, duration: '5.5s', status: 'success' },
  { id: 'tr6', suite: 'test_utils.py', total: 6, passed: 6, failed: 0, skipped: 0, duration: '2.1s', status: 'success' },
];
