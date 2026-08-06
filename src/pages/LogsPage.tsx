import { useState, useMemo } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import { logEntries } from '@/api/mockData';
import type { LogSource } from '@/types';
import { formatTime } from '@/utils/format';
import { ScrollText, Server, Box, Rocket, Code2, Filter } from 'lucide-react';

const sourceConfig: Record<LogSource, { label: string; icon: typeof Server; color: string }> = {
  jenkins: { label: 'Jenkins', icon: Server, color: 'text-warning-600 dark:text-warning-500' },
  docker: { label: 'Docker', icon: Box, color: 'text-primary-600 dark:text-primary-400' },
  deployment: { label: 'Deployment', icon: Rocket, color: 'text-accent-600 dark:text-accent-500' },
  application: { label: 'Application', icon: Code2, color: 'text-success-600 dark:text-success-500' },
};

const levelConfig: Record<string, string> = {
  INFO: 'text-gray-500 dark:text-gray-400',
  WARN: 'text-warning-600 dark:text-warning-500',
  ERROR: 'text-error-600 dark:text-error-500',
  DEBUG: 'text-gray-400 dark:text-gray-600',
};

type FilterType = 'all' | LogSource;

export default function LogsPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return logEntries.filter((log) => {
      const sourceMatch = filter === 'all' || log.source === filter;
      const levelMatch = levelFilter === 'all' || log.level === levelFilter;
      return sourceMatch && levelMatch;
    });
  }, [filter, levelFilter]);

  const filters: { id: FilterType; label: string; icon: typeof Server }[] = [
    { id: 'all', label: 'All Logs', icon: ScrollText },
    { id: 'jenkins', label: 'Jenkins', icon: Server },
    { id: 'docker', label: 'Docker', icon: Box },
    { id: 'deployment', label: 'Deployment', icon: Rocket },
    { id: 'application', label: 'Application', icon: Code2 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400 mr-1" />
        {filters.map((f) => {
          const Icon = f.icon;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Level filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Level:</span>
        {['all', 'INFO', 'WARN', 'ERROR', 'DEBUG'].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setLevelFilter(lvl)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              levelFilter === lvl
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {lvl === 'all' ? 'All' : lvl}
          </button>
        ))}
      </div>

      {/* Log viewer */}
      <Card>
        <CardHeader
          title="Log Stream"
          subtitle={`${filtered.length} entries`}
          icon={<ScrollText className="w-5 h-5" />}
        />
        <div className="bg-gray-950 dark:bg-black rounded-b-xl p-4 font-mono text-xs max-h-[600px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-gray-600 text-center py-8">No logs matching filter</div>
          ) : (
            filtered.map((log) => {
              const srcCfg = sourceConfig[log.source];
              const Icon = srcCfg.icon;
              return (
                <div key={log.id} className="flex items-start gap-3 py-1.5 hover:bg-white/5 px-2 rounded">
                  <span className="text-gray-600 shrink-0">{formatTime(log.timestamp)}</span>
                  <span className={`shrink-0 font-semibold ${levelConfig[log.level]} w-12`}>{log.level}</span>
                  <span className={`shrink-0 flex items-center gap-1 ${srcCfg.color} w-28`}>
                    <Icon className="w-3 h-3" />
                    {log.service}
                  </span>
                  <span className="text-gray-300">{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
