import { useState } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import { k8sDeployments as initialDeployments, k8sPods as initialPods, k8sServices as initialServices } from '@/api/mockData';
import type { K8sDeployment } from '@/types';
import { Ship, CircleDot, Network, Search, Plus, Minus } from 'lucide-react';

type Tab = 'deployments' | 'pods' | 'services';

export default function KubernetesPage() {
  const [tab, setTab] = useState<Tab>('deployments');
  const [deployments, setDeployments] = useState<K8sDeployment[]>(initialDeployments);
  const [pods] = useState(initialPods);
  const [services] = useState(initialServices);
  const [search, setSearch] = useState('');

  const scaleDeployment = (id: string, delta: number) => {
    setDeployments((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const currentCount = parseInt(d.replicas.split('/')[0], 10) || 1;
        const newCount = Math.max(1, currentCount + delta);
        return {
          ...d,
          replicas: `${newCount}/${newCount}`,
          ready: `${newCount}/${newCount}`,
          status: 'success',
        };
      })
    );
  };

  const filteredDeployments = deployments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) || d.namespace.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPods = pods.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.namespace.toLowerCase().includes(search.toLowerCase())
  );
  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.namespace.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { id: Tab; label: string; icon: typeof Ship; count: number }[] = [
    { id: 'deployments', label: 'Deployments', icon: Ship, count: deployments.length },
    { id: 'pods', label: 'Pods', icon: CircleDot, count: pods.length },
    { id: 'services', label: 'Services', icon: Network, count: services.length },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Connection */}
      <Card className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
            <Ship className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Kubernetes Cluster Connected</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">prod-cluster.ml-org.io · v1.28.4 · 3 nodes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
          <span className="text-xs font-medium text-success-600 dark:text-success-500">Healthy</span>
        </div>
      </Card>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  tab === t.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                <span className={`px-1.5 py-0.5 rounded text-xs ${tab === t.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${tab}...`}
            className="input pl-9 text-xs w-full sm:w-60"
          />
        </div>
      </div>

      {/* Deployments */}
      {tab === 'deployments' && (
        <Card>
          <CardHeader title="Deployments" subtitle="Kubernetes deployment resources" icon={<Ship className="w-5 h-5" />} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left font-medium px-5 py-3">Name</th>
                  <th className="text-left font-medium px-5 py-3">Namespace</th>
                  <th className="text-left font-medium px-5 py-3">Replicas</th>
                  <th className="text-left font-medium px-5 py-3">Ready</th>
                  <th className="text-left font-medium px-5 py-3">Age</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                  <th className="text-right font-medium px-5 py-3">Scale</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeployments.map((d) => (
                  <tr key={d.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{d.name}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs">{d.namespace}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400 font-mono">{d.replicas}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400 font-mono">{d.ready}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{d.age}</td>
                    <td className="px-5 py-3"><StatusBadge status={d.status} size="sm" /></td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => scaleDeployment(d.id, -1)}
                          title="Scale Down"
                          className="p-1.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => scaleDeployment(d.id, 1)}
                          title="Scale Up"
                          className="p-1.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pods */}
      {tab === 'pods' && (
        <Card>
          <CardHeader title="Pods" subtitle="Kubernetes pod status" icon={<CircleDot className="w-5 h-5" />} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left font-medium px-5 py-3">Name</th>
                  <th className="text-left font-medium px-5 py-3">Namespace</th>
                  <th className="text-left font-medium px-5 py-3">Node</th>
                  <th className="text-left font-medium px-5 py-3">Restarts</th>
                  <th className="text-left font-medium px-5 py-3">Age</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPods.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-5 py-3 font-mono text-xs text-gray-900 dark:text-gray-100">{p.name}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs">{p.namespace}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{p.node}</td>
                    <td className="px-5 py-3">
                      <span className={`font-mono ${p.restarts > 0 ? 'text-warning-600 dark:text-warning-500' : 'text-gray-600 dark:text-gray-400'}`}>
                        {p.restarts}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{p.age}</td>
                    <td className="px-5 py-3"><StatusBadge status={p.status} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Services */}
      {tab === 'services' && (
        <Card>
          <CardHeader title="Services" subtitle="Kubernetes service resources" icon={<Network className="w-5 h-5" />} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left font-medium px-5 py-3">Name</th>
                  <th className="text-left font-medium px-5 py-3">Namespace</th>
                  <th className="text-left font-medium px-5 py-3">Type</th>
                  <th className="text-left font-medium px-5 py-3">Cluster IP</th>
                  <th className="text-left font-medium px-5 py-3">Ports</th>
                  <th className="text-left font-medium px-5 py-3">Age</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{s.name}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs">{s.namespace}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                        s.type === 'LoadBalancer'
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>{s.type}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{s.clusterIP}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{s.ports}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{s.age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
