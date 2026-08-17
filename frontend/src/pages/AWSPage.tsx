import { useState } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import { ec2Instances as initialInstances } from '@/api/mockData';
import type { EC2Instance, Status } from '@/types';
import { Cloud, Server, Globe, MapPin, ExternalLink, Cpu, Play, Square, RefreshCw, Filter } from 'lucide-react';

export default function AWSPage() {
  const [instances, setInstances] = useState<EC2Instance[]>(initialInstances);
  const [regionFilter, setRegionFilter] = useState<string>('all');

  const toggleInstanceState = (id: string, action: 'start' | 'stop' | 'reboot') => {
    setInstances((prev) =>
      prev.map((inst) => {
        if (inst.id !== id) return inst;
        if (action === 'start') {
          return {
            ...inst,
            state: 'running' as Status,
            publicIP: inst.publicIP === '—' ? `54.210.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}` : inst.publicIP,
            appUrl: inst.appUrl === '—' ? `http://54.210.42.108:8080` : inst.appUrl,
          };
        }
        if (action === 'stop') {
          return { ...inst, state: 'stopped' as Status, publicIP: '—', appUrl: '—' };
        }
        return { ...inst, state: 'running' as Status };
      })
    );
  };

  const filteredInstances = instances.filter((inst) => {
    return regionFilter === 'all' || inst.region === regionFilter;
  });

  const running = instances.filter((e) => e.state === 'running').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Connection */}
      <Card className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-warning-500/10 text-warning-600 dark:text-warning-500">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AWS Account Connected</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Account: 123456789012 · Region: us-east-1 · {instances.length} instances</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
          <span className="text-xs font-medium text-success-600 dark:text-success-500">Connected</span>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-success-500/10 text-success-600 dark:text-success-500">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{running}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Running Instances</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-error-500/10 text-error-600 dark:text-error-500">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{instances.length - running}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Stopped Instances</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">2</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Regions</p>
          </div>
        </Card>
      </div>

      {/* Instances */}
      <Card>
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-warning-500/10 text-warning-600 dark:text-warning-500">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">EC2 Compute Instances</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manage virtual server instances in cloud</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="input text-xs w-36"
            >
              <option value="all">All Regions</option>
              <option value="us-east-1">us-east-1</option>
              <option value="us-west-2">us-west-2</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <th className="text-left font-medium px-5 py-3">Instance</th>
                <th className="text-left font-medium px-5 py-3">Type</th>
                <th className="text-left font-medium px-5 py-3">Public IP</th>
                <th className="text-left font-medium px-5 py-3">Region</th>
                <th className="text-left font-medium px-5 py-3">App URL</th>
                <th className="text-left font-medium px-5 py-3">State</th>
                <th className="text-right font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInstances.map((inst) => (
                <tr key={inst.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{inst.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{inst.instanceId}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Cpu className="w-3.5 h-3.5" />
                      {inst.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{inst.publicIP}</td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <MapPin className="w-3.5 h-3.5" />
                      {inst.region}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {inst.appUrl !== '—' ? (
                      <a
                        href={inst.appUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline text-xs"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        {inst.appUrl}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={inst.state} size="sm" /></td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {inst.state === 'running' ? (
                        <button
                          onClick={() => toggleInstanceState(inst.id, 'stop')}
                          title="Stop Instance"
                          className="p-1.5 rounded-md bg-error-50 dark:bg-error-900/30 text-error-600 dark:text-error-400 hover:bg-error-100 text-xs font-medium"
                        >
                          <Square className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleInstanceState(inst.id, 'start')}
                          title="Start Instance"
                          className="p-1.5 rounded-md bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 hover:bg-success-100 text-xs font-medium"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => toggleInstanceState(inst.id, 'reboot')}
                        title="Reboot Instance"
                        className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 text-xs font-medium"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
