import { useState } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import type { PageId } from '@/types';
import DashboardPage from '@/pages/DashboardPage';
import GitHubPage from '@/pages/GitHubPage';
import JenkinsPage from '@/pages/JenkinsPage';
import DockerPage from '@/pages/DockerPage';
import KubernetesPage from '@/pages/KubernetesPage';
import AWSPage from '@/pages/AWSPage';
import MLApplicationsPage from '@/pages/MLApplicationsPage';
import PipelinePage from '@/pages/PipelinePage';
import MonitoringPage from '@/pages/MonitoringPage';
import LogsPage from '@/pages/LogsPage';
import ReportsPage from '@/pages/ReportsPage';
import UserGovernancePage from '@/pages/UserGovernancePage';
import SignInPage from '@/pages/SignInPage';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState<PageId>('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  // 🔒 If user is NOT authenticated, display full-screen Sign In page first!
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <SignInPage onSuccess={() => setPage('dashboard')} />
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage />;
      case 'github': return <GitHubPage />;
      case 'jenkins': return <JenkinsPage />;
      case 'docker': return <DockerPage />;
      case 'kubernetes': return <KubernetesPage />;
      case 'aws': return <AWSPage />;
      case 'ml-apps': return <MLApplicationsPage />;
      case 'pipeline': return <PipelinePage />;
      case 'monitoring': return <MonitoringPage />;
      case 'logs': return <LogsPage />;
      case 'reports': return <ReportsPage />;
      case 'user-governance': return <UserGovernancePage />;
      case 'signin': return <SignInPage onSuccess={() => setPage('dashboard')} />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar activePage={page} onNavigate={setPage} collapsed={collapsed} onToggleCollapse={() => setCollapsed(c => !c)} />
      <div className={`transition-all ${collapsed ? 'ml-16' : 'ml-64'}`}>
        <Topbar activePage={page} onNavigate={setPage} />
        <main className="p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
