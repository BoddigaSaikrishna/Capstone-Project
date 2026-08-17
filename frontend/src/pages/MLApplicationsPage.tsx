import { useState } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import ProgressBar from '@/components/ui/ProgressBar';
import { useMLApplications } from '@/hooks/useMLApplications';
import type { Status } from '@/types';
import { formatRelative } from '@/utils/format';
import {
  Brain,
  Plus,
  Trash2,
  X,
  Code,
  Tag,
  Target,
  Globe,
  GitBranch,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const statusOptions: Status[] = ['running', 'success', 'failed', 'pending', 'idle', 'warning'];

export default function MLApplicationsPage() {
  const { apps, loading, error, addApp, deleteApp } = useMLApplications();
  const [showModal, setShowModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const detail = apps.find((a) => a.id === selectedApp);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{apps.length} registered ML applications</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Models persisted to Supabase PostgreSQL</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Register Application
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error-500/10 text-error-600 dark:text-error-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app) => (
            <Card key={app.id} hover className="p-5" onClick={() => setSelectedApp(app.id)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{app.name}</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{app.version}</p>
                  </div>
                </div>
                <StatusBadge status={app.status} size="sm" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{app.description}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Model Accuracy</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{app.accuracy}%</span>
                </div>
                <ProgressBar value={app.accuracy} size="sm" color={app.accuracy >= 90 ? 'success' : app.accuracy >= 80 ? 'primary' : 'warning'} />
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                <span className="text-xs text-gray-400 dark:text-gray-500">{app.modelType}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{formatRelative(app.lastTrained)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={() => setSelectedApp(null)}>
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{detail.name}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{detail.version}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={detail.status} />
                <button onClick={() => setSelectedApp(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">{detail.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem icon={<Code className="w-4 h-4" />} label="Model Type" value={detail.modelType} />
                <DetailItem icon={<Tag className="w-4 h-4" />} label="Framework" value={detail.framework} />
                <DetailItem icon={<Target className="w-4 h-4" />} label="Accuracy" value={`${detail.accuracy}%`} />
                <DetailItem icon={<Globe className="w-4 h-4" />} label="Endpoint" value={detail.endpoint} />
                <DetailItem icon={<GitBranch className="w-4 h-4" />} label="Repository" value={detail.repository} />
                <DetailItem icon={<Clock className="w-4 h-4" />} label="Last Trained" value={formatRelative(detail.lastTrained)} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Model Accuracy</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{detail.accuracy}%</span>
                </div>
                <ProgressBar value={detail.accuracy} color={detail.accuracy >= 90 ? 'success' : 'primary'} />
              </div>
              <button
                onClick={() => {
                  deleteApp(detail.id);
                  setSelectedApp(null);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-error-500/10 text-error-600 dark:text-error-500 text-sm font-medium hover:bg-error-500/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Application
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Register modal */}
      {showModal && (
        <RegisterModal
          onClose={() => setShowModal(false)}
          onRegister={(app) => {
            addApp(app);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
        {icon}
        {label}
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

function RegisterModal({
  onClose,
  onRegister,
}: {
  onClose: () => void;
  onRegister: (app: Omit<import('@/types').MLApplication, 'id' | 'createdAt'>) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    modelType: '',
    framework: '',
    version: '',
    accuracy: 0,
    endpoint: '',
    status: 'pending' as Status,
    repository: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister({
      ...form,
      lastTrained: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Register ML Application</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <FormField label="Application Name" required>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="e.g. Fraud Detection API"
            />
          </FormField>
          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input min-h-[80px] resize-none"
              placeholder="What does this ML application do?"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Model Type">
              <input
                value={form.modelType}
                onChange={(e) => setForm({ ...form, modelType: e.target.value })}
                className="input"
                placeholder="e.g. ResNet-50"
              />
            </FormField>
            <FormField label="Framework">
              <input
                value={form.framework}
                onChange={(e) => setForm({ ...form, framework: e.target.value })}
                className="input"
                placeholder="e.g. PyTorch 2.1"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Version">
              <input
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                className="input"
                placeholder="e.g. v1.0.0"
              />
            </FormField>
            <FormField label="Accuracy (%)">
              <input
                type="number"
                min="0"
                max="100"
                value={form.accuracy}
                onChange={(e) => setForm({ ...form, accuracy: Number(e.target.value) })}
                className="input"
              />
            </FormField>
          </div>
          <FormField label="Prediction Endpoint">
            <input
              value={form.endpoint}
              onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
              className="input"
              placeholder="e.g. POST /api/v1/predict"
            />
          </FormField>
          <FormField label="Repository">
            <input
              value={form.repository}
              onChange={(e) => setForm({ ...form, repository: e.target.value })}
              className="input"
              placeholder="e.g. ml-org/my-model"
            />
          </FormField>
          <FormField label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
              className="input"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </FormField>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors">
              Register Application
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
        {label} {required && <span className="text-error-500">*</span>}
      </label>
      {children}
    </div>
  );
}
