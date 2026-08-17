import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import type { PageId } from '@/types';
import { pageMeta } from '@/config/navigation';
import NotificationDrawer from '@/components/ui/NotificationDrawer';
import ToolIntegrationModal from '@/components/ui/ToolIntegrationModal';
import EditProfileModal from '@/components/ui/EditProfileModal';
import { Search, Bell, Moon, Sun, Activity, LogOut, LogIn, ChevronDown, Shield, Plug, User } from 'lucide-react';

interface TopbarProps {
  activePage: PageId;
  onNavigate?: (page: PageId) => void;
}

export default function Topbar({ activePage, onNavigate }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [toolsModalOpen, setToolsModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const meta = pageMeta[activePage] || { title: 'Dashboard', description: 'ML DevOps Control Center' };

  return (
    <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{meta.title}</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 w-64">
          <Search className="w-4 h-4" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-sm w-full text-gray-700 dark:text-gray-300 placeholder-gray-400"
          />
        </div>

        {/* Tools Integration Hub Trigger Button */}
        <button
          onClick={() => setToolsModalOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 dark:text-primary-400 border border-primary-500/20 text-xs font-semibold transition-all"
        >
          <Plug className="w-3.5 h-3.5" />
          <span>Tools Hub</span>
        </button>

        {/* Live status */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg bg-success-500/10 text-success-600 dark:text-success-500">
          <Activity className="w-4 h-4" />
          <span className="text-xs font-medium">All systems operational</span>
        </div>

        {/* Notifications Button */}
        <button
          onClick={() => setNotificationOpen(true)}
          className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          title="Notifications & Alerts"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error-500 animate-pulse" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User Profile / Authentication Menu */}
        <div className="relative pl-3 border-l border-gray-200 dark:border-gray-800">
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-primary-500/20">
                  {user.avatarInitials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5 text-primary-400" />
                    {user.role}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] bg-primary-500/10 text-primary-400 font-mono">
                      Role: {user.role}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setProfileModalOpen(true);
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-primary-400" />
                    Edit Profile &amp; Role
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      if (onNavigate) onNavigate('user-governance');
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <Shield className="w-3.5 h-3.5 text-primary-400" />
                    Governance &amp; RBAC
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      if (onNavigate) onNavigate('signin');
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <LogIn className="w-3.5 h-3.5 text-accent-400" />
                    Switch User / Auth Page
                  </button>

                  <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                      if (onNavigate) onNavigate('signin');
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-error-600 dark:text-error-400 hover:bg-error-500/10 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onNavigate && onNavigate('signin')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-md shadow-primary-500/20 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications Drawer */}
      <NotificationDrawer isOpen={notificationOpen} onClose={() => setNotificationOpen(false)} />

      {/* Tools Integration Hub Modal */}
      <ToolIntegrationModal isOpen={toolsModalOpen} onClose={() => setToolsModalOpen(false)} />

      {/* Edit Profile & Role Modal */}
      <EditProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </header>
  );
}
