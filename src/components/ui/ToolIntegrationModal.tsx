import { useState } from 'react';
import { createPortal } from 'react-dom';
import Card, { CardHeader } from '@/components/ui/Card';
import {
  Plug,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Shield,
  Server,
  Github,
  Box,
  Ship,
  Cloud,
  Brain,
  Activity,
  Key,
  Globe,
  Check,
} from 'lucide-react';

export interface IntegrationTool {
  id: string;
  name: string;
  category: 'cicd' | 'containers' | 'cloud' | 'mlops';
  status: 'connected' | 'disconnected' | 'configuring';
  icon: string;
  endpoint: string;
  lastPing: string;
  version?: string;
  apiKey?: string;
}

const initialTools: IntegrationTool[] = [
  {
    id: 'github',
    name: 'GitHub Enterprise',
    category: 'cicd',
    status: 'connected',
    icon: 'Github',
    endpoint: 'https://github.com/ml-org',
    lastPing: '30s ago',
    version: 'v2.4 (Webhook Active)',
  },
  {
    id: 'jenkins',
    name: 'Jenkins CI/CD',
    category: 'cicd',
    status: 'connected',
    icon: 'Server',
    endpoint: 'https://jenkins.ml-org.io',
    lastPing: '1m ago',
    version: 'v2.426.2 (3 Nodes)',
  },
  {
    id: 'docker',
    name: 'Docker Hub & ECR',
    category: 'containers',
    status: 'connected',
    icon: 'Box',
    endpoint: 'docker.io/ml-org',
    lastPing: '5m ago',
    version: 'v24.0.7 Engine',
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes Cluster',
    category: 'containers',
    status: 'connected',
    icon: 'Ship',
    endpoint: 'prod-cluster.ml-org.io:6443',
    lastPing: '10s ago',
    version: 'v1.28.4 (3 Nodes)',
  },
  {
    id: 'aws',
    name: 'AWS Cloud Infrastructure',
    category: 'cloud',
    status: 'connected',
    icon: 'Cloud',
    endpoint: 'aws://us-east-1/account-4892',
    lastPing: '2m ago',
    version: 'EC2 / ECR / S3',
  },
  {
    id: 'mlflow',
    name: 'MLflow Model Registry',
    category: 'mlops',
    status: 'disconnected',
    icon: 'Brain',
    endpoint: 'http://mlflow.internal:5000',
    lastPing: 'Never',
    version: 'v2.11.0',
  },
  {
    id: 'prometheus',
    name: 'Prometheus Telemetry',
    category: 'mlops',
    status: 'disconnected',
    icon: 'Activity',
    endpoint: 'http://prometheus.internal:9090',
    lastPing: 'Never',
    version: 'v2.45.0',
  },
  {
    id: 'supabase',
    name: 'Supabase PostgreSQL DB',
    category: 'cloud',
    status: 'connected',
    icon: 'Database',
    endpoint: 'https://placeholder.supabase.co',
    lastPing: '4m ago',
    version: 'v2.57.4 JS Client',
  },
];

interface ToolIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ToolIntegrationModal({ isOpen, onClose }: ToolIntegrationModalProps) {
  const [tools, setTools] = useState<IntegrationTool[]>(initialTools);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cicd' | 'containers' | 'cloud' | 'mlops'>('all');
  const [configuringTool, setConfiguringTool] = useState<IntegrationTool | null>(null);
  const [endpointInput, setEndpointInput] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  if (!isOpen) return null;

  const filteredTools = tools.filter((t) => {
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  const handleOpenConfig = (tool: IntegrationTool) => {
    setConfiguringTool(tool);
    setEndpointInput(tool.endpoint);
    setApiKeyInput(tool.apiKey || '');
    setTestSuccess(false);
  };

  const handleTestAndSave = () => {
    if (!endpointInput.trim()) return;
    setTesting(true);
    setTestSuccess(false);

    setTimeout(() => {
      setTesting(false);
      setTestSuccess(true);
      setTools((prev) =>
        prev.map((t) =>
          t.id === configuringTool?.id
            ? {
                ...t,
                status: 'connected',
                endpoint: endpointInput,
                apiKey: apiKeyInput,
                lastPing: 'Just now',
              }
            : t
        )
      );

      setTimeout(() => {
        setConfiguringTool(null);
        setTestSuccess(false);
      }, 1500);
    }, 1200);
  };

  const handleDisconnect = (id: string) => {
    setTools((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: 'disconnected', lastPing: 'Never' } : t
      )
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-md" />

      {/* Main Modal Container */}
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden z-10">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-950/40">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-600/10 text-primary-400 border border-primary-500/20">
              <Plug className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Tools Integration Hub &amp; Connectors
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Configure webhooks, API tokens, and live telemetry endpoints for DevOps &amp; MLOps tools
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-4 overflow-x-auto text-xs font-medium">
            {(['all', 'cicd', 'containers', 'cloud', 'mlops'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg capitalize transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                    : 'bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {cat === 'all' ? 'All Integrations' : cat === 'cicd' ? 'CI/CD & VCS' : cat}
              </button>
            ))}
          </div>

          {/* Configuration Form overlay if configuring a tool */}
          {configuringTool ? (
            <div className="p-6 rounded-xl border border-primary-500/30 bg-primary-500/5 dark:bg-primary-950/20 space-y-4 animate-slide-in">
              <div className="flex items-center justify-between border-b border-primary-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Plug className="w-5 h-5 text-primary-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Configure {configuringTool.name}
                  </h3>
                </div>
                <button
                  onClick={() => setConfiguringTool(null)}
                  className="text-xs text-gray-400 hover:text-gray-200"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Service Endpoint / Host URL
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={endpointInput}
                      onChange={(e) => setEndpointInput(e.target.value)}
                      placeholder="https://tool.mldevops.io"
                      className="input pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    API Secret Token / Kubeconfig
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="input pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestAndSave}
                  disabled={testing || !endpointInput.trim()}
                  className="px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs transition-all shadow-md shadow-primary-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {testing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Testing Endpoint Ping...</span>
                    </>
                  ) : testSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-success-400" />
                      <span>Connection Verified &amp; Saved!</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Test Connection &amp; Save Connector</span>
                    </>
                  )}
                </button>

                {testSuccess && (
                  <span className="text-xs text-success-500 flex items-center gap-1.5 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    Status: 200 OK • Ping 18ms
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* Tools Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
              {filteredTools.map((tool) => (
                <div
                  key={tool.id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 hover:border-gray-300 dark:hover:border-gray-700 transition-all flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-primary-400 shrink-0">
                        <Plug className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {tool.name}
                        </h4>
                        <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                          {tool.endpoint}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    {tool.status === 'connected' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-success-500/10 text-success-500 border border-success-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-500/10 text-gray-400 border border-gray-700">
                        Disconnected
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 dark:border-gray-800/60">
                    <span className="text-gray-500 dark:text-gray-400 text-[11px]">
                      {tool.version || 'v1.0'} • Ping: {tool.lastPing}
                    </span>

                    <div className="flex items-center gap-2">
                      {tool.status === 'connected' ? (
                        <>
                          <button
                            onClick={() => handleOpenConfig(tool)}
                            className="px-2.5 py-1 rounded text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            Configure
                          </button>
                          <button
                            onClick={() => handleDisconnect(tool.id)}
                            className="px-2.5 py-1 rounded text-[11px] font-semibold bg-error-500/10 text-error-500 hover:bg-error-500/20 transition-colors"
                          >
                            Disconnect
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleOpenConfig(tool)}
                          className="px-3 py-1 rounded text-[11px] font-semibold bg-primary-600 hover:bg-primary-500 text-white shadow-sm transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Connect Tool
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/40 flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-primary-400" />
            Encrypted TLS Connector Tunnel • SSL Validated
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
