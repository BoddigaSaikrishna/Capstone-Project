import type { NavItem, PageId } from '@/types';
import {
  LayoutDashboard,
  Github,
  Server,
  Box,
  Ship,
  Cloud,
  Brain,
  GitBranch,
  Activity,
  ScrollText,
  FileBarChart,
  ShieldCheck,
  LogIn,
} from 'lucide-react';

const iconMap: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard,
  Github,
  Server,
  Box,
  Ship,
  Cloud,
  Brain,
  GitBranch,
  Activity,
  ScrollText,
  FileBarChart,
  ShieldCheck,
  LogIn,
};

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', group: 'Overview' },
  { id: 'github', label: 'GitHub', icon: 'Github', group: 'Integrations' },
  { id: 'jenkins', label: 'Jenkins', icon: 'Server', group: 'Integrations' },
  { id: 'docker', label: 'Docker', icon: 'Box', group: 'Integrations' },
  { id: 'kubernetes', label: 'Kubernetes', icon: 'Ship', group: 'Integrations' },
  { id: 'aws', label: 'AWS', icon: 'Cloud', group: 'Integrations' },
  { id: 'ml-apps', label: 'ML Applications', icon: 'Brain', group: 'ML Ops' },
  { id: 'pipeline', label: 'Pipeline', icon: 'GitBranch', group: 'ML Ops' },
  { id: 'monitoring', label: 'Monitoring', icon: 'Activity', group: 'Operations' },
  { id: 'logs', label: 'Logs', icon: 'ScrollText', group: 'Operations' },
  { id: 'reports', label: 'Reports', icon: 'FileBarChart', group: 'Operations' },
  { id: 'user-governance', label: 'User Governance', icon: 'ShieldCheck', group: 'Admin' },
];

export function getIcon(name: string) {
  return iconMap[name] ?? LayoutDashboard;
}

export const pageMeta: Record<PageId, { title: string; description: string }> = {
  dashboard: { title: 'Dashboard', description: 'Overview of your ML DevOps pipeline and infrastructure' },
  github: { title: 'GitHub Integration', description: 'Connected repositories, branches, and commits' },
  jenkins: { title: 'Jenkins Integration', description: 'CI/CD pipelines, builds, and logs' },
  docker: { title: 'Docker Module', description: 'Container images and running containers' },
  kubernetes: { title: 'Kubernetes Module', description: 'Deployments, pods, and services' },
  aws: { title: 'AWS Module', description: 'EC2 instances and deployment status' },
  'ml-apps': { title: 'ML Applications', description: 'Registered machine learning applications and model info' },
  pipeline: { title: 'Pipeline Visualization', description: 'End-to-end deployment pipeline stages' },
  monitoring: { title: 'Monitoring', description: 'System health, CPU, memory, and response times' },
  logs: { title: 'Logs', description: 'Aggregated logs from Jenkins, Docker, deployments, and applications' },
  reports: { title: 'Reports', description: 'Deployment history, build history, and test results' },
  'user-governance': { title: 'User Governance & Security', description: 'Manage platform users, roles, invitations, and access control' },
  signin: { title: 'Authentication Gateway', description: 'Sign in or register for access to the ML DevOps Control Center' },
};
