import { useState } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import { jenkinsPipelines as initialPipelines, jenkinsBuilds as initialBuilds, jenkinsBuildLog } from '@/api/mockData';
import type { JenkinsBuild, Status } from '@/types';
import { formatRelative } from '@/utils/format';
import { Server, Play, FileText, Clock, History, CheckCircle2 } from 'lucide-react';

export default function JenkinsPage() {
  const [pipelines, setPipelines] = useState(initialPipelines);
  const [builds, setBuilds] = useState<JenkinsBuild[]>(initialBuilds);
  const [selectedBuild, setSelectedBuild] = useState<number | null>(142);
  const [logsMap, setLogsMap] = useState<Record<number, string>>({
    142: jenkinsBuildLog,
  });
  const [buildingName, setBuildingName] = useState<string | null>(null);

  const handleTrigger = (name: string) => {
    setBuildingName(name);
    const newBuildNum = Math.max(...builds.map((b) => b.number)) + 1;
    const newBuild: JenkinsBuild = {
      id: `jb_${Date.now()}`,
      number: newBuildNum,
      pipeline: name,
      status: 'running' as Status,
      duration: 'In progress...',
      timestamp: new Date().toISOString(),
      triggeredBy: 'manual-trigger',
    };

    setBuilds((prev) => [newBuild, ...prev]);
    setSelectedBuild(newBuildNum);

    const initialLog = `[${new Date().toLocaleTimeString()}] Started by manual trigger\n[${new Date().toLocaleTimeString()}] Initializing build #${newBuildNum} for ${name}...\n[${new Date().toLocaleTimeString()}] Fetching source branch...\n[${new Date().toLocaleTimeString()}] Executing pipeline steps...`;
    setLogsMap((prev) => ({ ...prev, [newBuildNum]: initialLog }));

    // Simulate completion after 3 seconds
    setTimeout(() => {
      setBuilds((prev) =>
        prev.map((b) =>
          b.number === newBuildNum
            ? { ...b, status: 'success' as Status, duration: '0m 45s' }
            : b
        )
      );
      setPipelines((prev) =>
        prev.map((p) =>
          p.name === name
            ? { ...p, lastBuild: newBuildNum, status: 'success' as Status, duration: '0m 45s' }
            : p
        )
      );
      setLogsMap((prev) => ({
        ...prev,
        [newBuildNum]: `${initialLog}\n[${new Date().toLocaleTimeString()}] Tests passed: 32 passed, 0 failed\n[${new Date().toLocaleTimeString()}] Build completed: SUCCESS`,
      }));
      setBuildingName(null);
    }, 3000);
  };

  const activeLogContent = (selectedBuild && logsMap[selectedBuild]) || jenkinsBuildLog;
  const logLines = activeLogContent.split('\n');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Connection */}
      <Card className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-warning-500/10 text-warning-600 dark:text-warning-500">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Jenkins Server Connected</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">jenkins.ml-org.io · {pipelines.length} pipelines · v2.440.3</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
          <span className="text-xs font-medium text-success-600 dark:text-success-500">Online</span>
        </div>
      </Card>

      {/* Pipelines */}
      <Card>
        <CardHeader title="Pipelines" subtitle="CI/CD pipeline status" icon={<Server className="w-5 h-5" />} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <th className="text-left font-medium px-5 py-3">Pipeline</th>
                <th className="text-left font-medium px-5 py-3">Last Build</th>
                <th className="text-left font-medium px-5 py-3">Duration</th>
                <th className="text-left font-medium px-5 py-3">Triggered By</th>
                <th className="text-left font-medium px-5 py-3">Status</th>
                <th className="text-right font-medium px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {pipelines.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{p.name}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">#{p.lastBuild}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{p.duration}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{p.triggeredBy}</td>
                  <td className="px-5 py-3"><StatusBadge status={p.status} size="sm" /></td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleTrigger(p.name)}
                      disabled={buildingName === p.name}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium transition-colors disabled:opacity-50 shadow-sm"
                    >
                      {buildingName === p.name ? <CheckCircle2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      {buildingName === p.name ? 'Building...' : 'Build Now'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Build history */}
        <Card>
          <CardHeader title="Build History" subtitle="Recent builds" icon={<History className="w-5 h-5" />} />
          <div className="p-5 space-y-2 max-h-96 overflow-y-auto">
            {builds.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBuild(b.number)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedBuild === b.number
                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-700'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Build #{b.number}</span>
                  <StatusBadge status={b.status} size="sm" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{b.pipeline}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{b.duration}</span>
                  <span>{formatRelative(b.timestamp)}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Build logs */}
        <Card>
          <CardHeader
            title={`Build #${selectedBuild ?? ''} Console Logs`}
            subtitle="Output stream"
            icon={<FileText className="w-5 h-5" />}
          />
          <div className="p-4">
            <div className="bg-gray-950 dark:bg-black rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
              {logLines.map((line, i) => {
                const isStage = line.includes('[Stage');
                const isError = line.toLowerCase().includes('error') || line.toLowerCase().includes('failed');
                const isSuccess = line.includes('Success') || line.includes('PASSED') || line.includes('SUCCESS');
                return (
                  <div
                    key={i}
                    className={`py-0.5 ${
                      isError ? 'text-error-400' : isSuccess ? 'text-success-400' : isStage ? 'text-accent-400' : 'text-gray-400'
                    }`}
                  >
                    {line}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
