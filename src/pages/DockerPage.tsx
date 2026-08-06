import { useState } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import { dockerImages as initialImages, dockerContainers as initialContainers } from '@/api/mockData';
import type { DockerContainer, Status } from '@/types';
import { formatRelative } from '@/utils/format';
import { Box, Container, Layers, HardDrive, Clock, Play, Square, RefreshCw, Search, Plus, X } from 'lucide-react';

export default function DockerPage() {
  const [containers, setContainers] = useState<DockerContainer[]>(initialContainers);
  const [images] = useState(initialImages);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const toggleContainerStatus = (id: string, action: 'start' | 'stop' | 'restart') => {
    setContainers((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (action === 'start') return { ...c, status: 'running' as Status, uptime: 'Just started' };
        if (action === 'stop') return { ...c, status: 'failed' as Status, uptime: '0h' };
        return { ...c, status: 'running' as Status, uptime: 'Restarted' };
      })
    );
  };

  const filteredContainers = containers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.image.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const runningCount = containers.filter((c) => c.status === 'running').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{images.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Docker Images</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-success-500/10 text-success-600 dark:text-success-500">
            <Container className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{runningCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Running Containers</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-accent-500/10 text-accent-600 dark:text-accent-500">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{containers.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Containers</p>
          </div>
        </Card>
      </div>

      {/* Containers Section */}
      <Card>
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
              <Container className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Docker Containers</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manage and control container lifecycles</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search container..."
                className="input pl-9 text-xs w-44 md:w-56"
              />
            </div>
            {/* Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input text-xs w-32"
            >
              <option value="all">All Status</option>
              <option value="running">Running</option>
              <option value="failed">Stopped</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <th className="text-left font-medium px-5 py-3">Name</th>
                <th className="text-left font-medium px-5 py-3">Image</th>
                <th className="text-left font-medium px-5 py-3">Ports</th>
                <th className="text-left font-medium px-5 py-3">Uptime</th>
                <th className="text-left font-medium px-5 py-3">Status</th>
                <th className="text-right font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContainers.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{c.name}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{c.image}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{c.ports}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{c.uptime}</td>
                  <td className="px-5 py-3"><StatusBadge status={c.status} size="sm" /></td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {c.status === 'running' ? (
                        <button
                          onClick={() => toggleContainerStatus(c.id, 'stop')}
                          title="Stop Container"
                          className="p-1.5 rounded-md bg-error-50 dark:bg-error-900/30 text-error-600 dark:text-error-400 hover:bg-error-100 text-xs font-medium"
                        >
                          <Square className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleContainerStatus(c.id, 'start')}
                          title="Start Container"
                          className="p-1.5 rounded-md bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 hover:bg-success-100 text-xs font-medium"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => toggleContainerStatus(c.id, 'restart')}
                        title="Restart Container"
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

      {/* Images */}
      <Card>
        <CardHeader title="Docker Images" subtitle="Available image versions" icon={<Box className="w-5 h-5" />} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <th className="text-left font-medium px-5 py-3">Repository</th>
                <th className="text-left font-medium px-5 py-3">Tag</th>
                <th className="text-left font-medium px-5 py-3">Size</th>
                <th className="text-left font-medium px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {images.map((img) => (
                <tr key={img.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{img.repository}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-mono">
                      {img.tag}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" />{img.size}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatRelative(img.createdAt)}</span>
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
