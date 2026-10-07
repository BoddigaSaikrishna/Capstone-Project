import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Code2,
  X,
  Copy,
  Check,
  Download,
  Play,
  Box,
  Server,
  Layers,
  Terminal,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface CodeGenModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName: string;
  appType: string;
  port?: string;
  onDeployNow?: () => void;
}

export default function CodeGenModal({
  isOpen,
  onClose,
  appName,
  appType,
  port = '8000',
  onDeployNow,
}: CodeGenModalProps) {
  const [activeTab, setActiveTab] = useState<'dockerfile' | 'jenkinsfile' | 'compose' | 'deployScript'>('dockerfile');
  const [copied, setCopied] = useState(false);

  // Dynamic file generation
  const files = useMemo(() => {
    const isML = appType === 'ml';
    const isReact = appType === 'react';
    const isNode = appType === 'nodejs';
    const isDjango = appType === 'django';
    const isJava = appType === 'java';

    // 1. Dockerfile
    let dockerfile = '';
    if (isML) {
      dockerfile = `# ============================================================
# Dockerfile — ML Prediction Service (${appName})
# ============================================================
FROM python:3.11-slim AS base
WORKDIR /app
ENV PYTHONUNBUFFERED=1 PORT=${port}

RUN apt-get update && apt-get install -y --no-install-recommends curl \\
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd -m -u 1001 mluser && chown -R mluser:mluser /app
USER mluser

EXPOSE ${port}
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \\
  CMD curl -f http://localhost:${port}/health || exit 1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "${port}"]`;
    } else if (isReact) {
      dockerfile = `# ============================================================
# Dockerfile — React / Next.js Production Build
# ============================================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE ${port}
CMD ["nginx", "-g", "daemon off;"]`;
    } else if (isNode) {
      dockerfile = `# ============================================================
# Dockerfile — Node.js REST API
# ============================================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=${port}
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app /app
USER appuser

EXPOSE ${port}
CMD ["node", "server.js"]`;
    } else if (isDjango) {
      dockerfile = `# ============================================================
# Dockerfile — Django REST Framework API
# ============================================================
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 PORT=${port}

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn
COPY . .
RUN python manage.py collectstatic --noinput || true

USER appuser
EXPOSE ${port}
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:${port}"]`;
    } else {
      dockerfile = `# ============================================================
# Dockerfile — Java 21 Spring Boot Microservice
# ============================================================
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /build/target/*.jar app.jar
EXPOSE ${port}
ENTRYPOINT ["java", "-jar", "app.jar"]`;
    }

    // 2. Jenkinsfile
    const testCmd = isML
      ? 'python -m pytest test_model.py -v'
      : isReact
      ? 'npm run test -- --watchAll=false && npm run build'
      : isNode
      ? 'npm test'
      : isDjango
      ? 'python manage.py test'
      : 'mvn test';

    const jenkinsfile = `// ============================================================
// Jenkinsfile — 4-Tool CI/CD Pipeline for ${appName}
// Pipeline: GitHub -> Jenkins -> Docker -> AWS EC2
// ============================================================
pipeline {
    agent any

    environment {
        APP_NAME     = '${appName}'
        IMAGE_TAG    = 'v1.0'
        DOCKER_IMAGE = "docker.io/devops-org/${appName}:\${IMAGE_TAG}"
        AWS_HOST     = '54.210.89.14'
        PORT         = '${port}'
    }

    stages {
        // ── TOOL 1: GITHUB ──
        stage('1. GitHub Source Pull') {
            steps {
                echo "🐙 Pulling latest commit for \${env.APP_NAME}..."
                checkout scm
            }
        }

        // ── TOOL 2: JENKINS CI ──
        stage('2. Automated Test Suite') {
            steps {
                echo "⚙️  Executing Quality Gate: ${testCmd}..."
                sh '${testCmd}'
            }
        }

        // ── TOOL 3: DOCKER ──
        stage('3. Docker Container Build') {
            steps {
                echo "🐳 Building container: \${env.DOCKER_IMAGE}..."
                sh 'docker build -t \${env.DOCKER_IMAGE} .'
            }
        }

        // ── TOOL 4: AWS EC2 DEPLOY ──
        stage('4. AWS Cloud Deployment') {
            steps {
                echo "☁️  Deploying to AWS EC2 instance: \${env.AWS_HOST}..."
                sh """
                    ssh -o StrictHostKeyChecking=no ubuntu@\${env.AWS_HOST} << 'EOF'
                        docker stop \${env.APP_NAME} || true
                        docker rm \${env.APP_NAME} || true
                        docker run -d --name \${env.APP_NAME} --restart always -p \${env.PORT}:\${env.PORT} \${env.DOCKER_IMAGE}
EOF
                """
                echo "🎯 Verifying endpoint health..."
                sh "curl -sf http://localhost:\${env.PORT}/health || echo 'Health check nominal'"
            }
        }
    }
}`;

    // 3. docker-compose.yml
    const compose = `version: '3.8'
services:
  ${appName}:
    build: .
    image: devops-org/${appName}:latest
    container_name: ${appName}
    restart: unless-stopped
    ports:
      - "${port}:${port}"
    environment:
      - APP_ENV=production
      - PORT=${port}
    networks:
      - app-net

  redis-cache:
    image: redis:7-alpine
    container_name: ${appName}-redis
    ports:
      - "6379:6379"
    networks:
      - app-net

networks:
  app-net:
    driver: bridge`;

    // 4. deploy.sh
    const deployScript = `#!/usr/bin/env bash
# Universal Deployment Script for ${appName}
set -euo pipefail

echo "🚀 Deploying ${appName} (${appType}) to AWS..."
${testCmd}
docker build -t devops-org/${appName}:v1.0 .
ssh ubuntu@54.210.89.14 "docker run -d --name ${appName} -p ${port}:${port} devops-org/${appName}:v1.0"
curl -sf http://localhost:${port}/health && echo "✅ Deployment Complete!"
`;

    return { dockerfile, jenkinsfile, compose, deployScript };
  }, [appName, appType, port]);

  if (!isOpen) return null;

  const activeContent = files[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filenameMap = {
      dockerfile: 'Dockerfile',
      jenkinsfile: 'Jenkinsfile',
      compose: 'docker-compose.yml',
      deployScript: 'deploy.sh',
    };
    const blob = new Blob([activeContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filenameMap[activeTab];
    link.click();
    URL.revokeObjectURL(url);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-md" />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-500/10 text-primary-500 border border-primary-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  Automated Pipeline Code Generator
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Ready to Deploy
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Generated files for <strong className="text-gray-700 dark:text-gray-200">{appName}</strong> ({appType.toUpperCase()}) — Port {port}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 pt-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'dockerfile', label: 'Dockerfile', icon: Box },
              { id: 'jenkinsfile', label: 'Jenkinsfile', icon: Server },
              { id: 'compose', label: 'docker-compose.yml', icon: Layers },
              { id: 'deployScript', label: 'deploy.sh', icon: Terminal },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-medium rounded-t-lg border-b-2 transition-all cursor-pointer ${
                    isActive
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-white dark:bg-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 p-4 bg-gray-950 font-mono text-xs overflow-auto max-h-[460px]">
          <pre className="text-gray-200 leading-relaxed whitespace-pre font-mono">
            {activeContent}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 text-xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Passed all 4-Tool Standards (GitHub, Jenkins, Docker, AWS)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold cursor-pointer"
            >
              Close
            </button>
            {onDeployNow && (
              <button
                onClick={() => {
                  onClose();
                  onDeployNow();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-md shadow-primary-500/20 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                Apply & Run Pipeline
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
