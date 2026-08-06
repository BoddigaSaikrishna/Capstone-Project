import type { PageId } from '@/types';
import { navItems, getIcon } from '@/config/navigation';
import { Brain, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ activePage, onNavigate, collapsed, onToggleCollapse }: SidebarProps) {

  const groups = [...new Set(navItems.map((n) => n.group))];

  return (
    <aside
      className={`fixed left-0 top-0 z-30 h-screen flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-600 text-white shrink-0">
          <Brain className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">ML DevOps</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Control Center</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {groups.map((group) => (
          <div key={group}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">
                {group}
              </p>
            )}
            <div className="space-y-0.5">
              {navItems
                .filter((n) => n.group === group)
                .map((item) => {
                  const Icon = getIcon(item.icon);
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`nav-item w-full ${isActive ? 'nav-item-active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={onToggleCollapse}
          className="nav-item w-full justify-center"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
