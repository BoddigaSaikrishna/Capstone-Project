import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { PageId } from '@/types';
import {
  Bell,
  X,
  CheckCheck,
  AlertTriangle,
  ShieldAlert,
  GitBranch,
  Activity,
  Server,
  Trash2,
  ExternalLink,
  Filter,
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  category: 'critical' | 'security' | 'pipeline' | 'infrastructure';
  read: boolean;
  targetPage?: PageId;
}

const initialNotifications: NotificationItem[] = [
  {
    id: 'n1',
    title: 'High CPU Utilization Alert',
    message: 'Node prod-k8s-node-2 CPU sustained above 89% for 5 mins.',
    timestamp: '2m ago',
    category: 'critical',
    read: false,
    targetPage: 'monitoring',
  },
  {
    id: 'n2',
    title: 'Pending Stakeholder Invite Expiring',
    message: 'Access link for client@enterprise.com expires in 24 hours.',
    timestamp: '15m ago',
    category: 'security',
    read: false,
    targetPage: 'user-governance',
  },
  {
    id: 'n3',
    title: 'Pipeline Deployment Succeeded',
    message: 'ml-pipeline-bert-v2 successfully deployed to prod namespace.',
    timestamp: '45m ago',
    category: 'pipeline',
    read: false,
    targetPage: 'pipeline',
  },
  {
    id: 'n4',
    title: 'Docker Image Security Vulnerability',
    message: 'CVE-2026-1049 detected in image torch-inference:v1.4.',
    timestamp: '1h ago',
    category: 'critical',
    read: true,
    targetPage: 'docker',
  },
  {
    id: 'n5',
    title: 'RBAC Policy Modified',
    message: 'Role Developer permissions updated by Sarah Chen.',
    timestamp: '2h ago',
    category: 'security',
    read: true,
    targetPage: 'user-governance',
  },
  {
    id: 'n6',
    title: 'AWS Auto-Scale Triggered',
    message: 'Added 2 g4dn.xlarge GPU instances to cluster pool.',
    timestamp: '3h ago',
    category: 'infrastructure',
    read: true,
    targetPage: 'aws',
  },
];

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (page: PageId) => void;
}

export default function NotificationDrawer({ isOpen, onClose, onNavigate }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [filter, setFilter] = useState<'all' | 'critical' | 'security' | 'pipeline'>('all');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    return n.category === filter;
  });

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getCategoryBadge = (category: NotificationItem['category']) => {
    switch (category) {
      case 'critical':
        return {
          icon: AlertTriangle,
          color: 'text-error-500 bg-error-500/10 border-error-500/20',
          label: 'Critical',
        };
      case 'security':
        return {
          icon: ShieldAlert,
          color: 'text-warning-500 bg-warning-500/10 border-warning-500/20',
          label: 'Security',
        };
      case 'pipeline':
        return {
          icon: GitBranch,
          color: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
          label: 'Pipeline',
        };
      case 'infrastructure':
      default:
        return {
          icon: Server,
          color: 'text-accent-400 bg-accent-500/10 border-accent-500/20',
          label: 'Infra',
        };
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400 relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-error-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Notifications &amp; Alerts
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Real-time telemetry and RBAC events
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub-header controls: Filter & Mark Read */}
          <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2 bg-gray-50/50 dark:bg-gray-950/40">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-gray-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" />
              </span>
              {(['all', 'critical', 'security', 'pipeline'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-all ${
                    filter === cat
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200/60 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Mark All Read */}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 shrink-0"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Read All
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredNotifications.map((n) => {
              const categoryBadge = getCategoryBadge(n.category);
              const CategoryIcon = categoryBadge.icon;

              return (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`p-4 rounded-xl border transition-all relative group cursor-pointer ${
                    !n.read
                      ? 'bg-primary-500/5 dark:bg-primary-950/20 border-primary-500/30'
                      : 'bg-white dark:bg-gray-900/60 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
                >
                  {/* Unread blue dot */}
                  {!n.read && (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                  )}

                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg border shrink-0 ${categoryBadge.color}`}>
                      <CategoryIcon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${categoryBadge.color}`}
                        >
                          {categoryBadge.label}
                        </span>
                        <span className="text-[11px] text-gray-400">{n.timestamp}</span>
                      </div>

                      <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                        {n.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        {n.message}
                      </p>

                      {/* Action buttons */}
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800/60">
                        {n.targetPage && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onClose();
                              if (onNavigate && n.targetPage) onNavigate(n.targetPage);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            <span>Inspect Resource</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(n.id);
                          }}
                          className="text-gray-400 hover:text-error-500 p-1 rounded transition-colors ml-auto"
                          title="Dismiss notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredNotifications.length === 0 && (
              <div className="py-16 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
                <Activity className="w-8 h-8 text-gray-600" />
                <p>No notifications found in this category.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-center bg-gray-50/50 dark:bg-gray-950/40">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Monitoring active • 6 total notifications registered
            </p>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
