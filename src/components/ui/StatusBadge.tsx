import type { Status } from '@/types';
import { CheckCircle2, Loader2, XCircle, Clock, MinusCircle, AlertTriangle } from 'lucide-react';

export const statusConfig: Record<Status, { label: string; color: string; bg: string; dot: string; icon: typeof CheckCircle2 }> = {
  success: { label: 'Success', color: 'text-success-600 dark:text-success-500', bg: 'bg-success-500/10', dot: 'bg-success-500', icon: CheckCircle2 },
  running: { label: 'Running', color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-500/10', dot: 'bg-primary-500', icon: Loader2 },
  failed: { label: 'Failed', color: 'text-error-600 dark:text-error-500', bg: 'bg-error-500/10', dot: 'bg-error-500', icon: XCircle },
  pending: { label: 'Pending', color: 'text-warning-600 dark:text-warning-500', bg: 'bg-warning-500/10', dot: 'bg-warning-500', icon: Clock },
  warning: { label: 'Warning', color: 'text-warning-600 dark:text-warning-500', bg: 'bg-warning-500/10', dot: 'bg-warning-500', icon: AlertTriangle },
  stopped: { label: 'Stopped', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-500/10', dot: 'bg-gray-400', icon: MinusCircle },
  idle: { label: 'Idle', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-500/10', dot: 'bg-gray-400', icon: MinusCircle },
};

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding} ${cfg.bg} ${cfg.color}`}>
      <Icon className={`w-3 h-3 ${status === 'running' ? 'animate-spin' : ''}`} />
      {cfg.label}
    </span>
  );
}
