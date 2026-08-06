import { useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Brain,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  ArrowRight,
  Github,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Cpu,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

interface SignInPageProps {
  onSuccess?: () => void;
}

export default function SignInPage({ onSuccess }: SignInPageProps) {
  const { login } = useAuth();
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Admin' | 'Developer' | 'Stakeholder'>('Developer');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your corporate email address');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your account password');
      return;
    }

    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      login(email, role, mode === 'register' ? name : undefined);
      if (onSuccess) {
        onSuccess();
      }
    }, 800);
  };

  const handleQuickLogin = (demoEmail: string, demoRole: 'Admin' | 'Developer' | 'Stakeholder', demoName: string) => {
    setEmail(demoEmail);
    setPassword('••••••••••••');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      login(demoEmail, demoRole, demoName);
      if (onSuccess) {
        onSuccess();
      }
    }, 600);
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      setError('Enter your email above to receive a password reset link.');
      return;
    }
    setError('');
    setForgotSent(true);
    setTimeout(() => setForgotSent(false), 4000);
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4 md:p-8 animate-fade-in">
      {/* Outer ambient glow container */}
      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/90 shadow-2xl overflow-hidden backdrop-blur-xl">

        {/* Top ambient highlight line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-600 via-accent-400 to-primary-600 z-10" />

        {/* ══════════════════════════════════════════
            LEFT PANEL — BRANDING & FEATURE SHOWCASE
        ══════════════════════════════════════════ */}
        <div className="lg:col-span-5 p-8 lg:p-10 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 text-gray-100 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-gray-800">
          
          {/* Subtle background radial glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-accent-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Brand header */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/25">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white">ML DevOps</h1>
                <p className="text-xs font-mono text-primary-400">Control Center v2.4</p>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-white leading-tight">
                Enterprise AI Infrastructure &amp; Pipeline Governance
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                Single sign-on gateway for managing Kubernetes deployments, CI/CD builds, and production ML endpoints.
              </p>
            </div>
          </div>

          {/* Feature Bullets */}
          <div className="relative z-10 my-8 space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/40 border border-gray-800/60">
              <Cpu className="w-5 h-5 text-accent-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-200">Continuous Training &amp; Deployments</p>
                <p className="text-[11px] text-gray-400">Automated Jenkins &amp; Docker pipeline triggers</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/40 border border-gray-800/60">
              <Activity className="w-5 h-5 text-success-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-200">Real-time Cluster Telemetry</p>
                <p className="text-[11px] text-gray-400">Live memory, CPU, and endpoint status</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/40 border border-gray-800/60">
              <ShieldCheck className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-200">Role-Based Access Control (RBAC)</p>
                <p className="text-[11px] text-gray-400">Enforced token lifecycle &amp; identity security</p>
              </div>
            </div>
          </div>

          {/* Operational Pill Footer */}
          <div className="relative z-10 pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
              <span>Production Nodes: Online</span>
            </div>
            <span className="font-mono text-[10px] text-gray-500">SSL 256-BIT</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            RIGHT PANEL — FORM CONTROLS
        ══════════════════════════════════════════ */}
        <div className="lg:col-span-7 p-8 lg:p-10 flex flex-col justify-between">
          <div>
            {/* Header Tabs */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(''); }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    mode === 'signin'
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    mode === 'register'
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Sparkles className="w-3.5 h-3.5 text-warning-500" />
                Secure Portal
              </span>
            </div>

            {/* Title / Description */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {mode === 'signin' ? 'Welcome back' : 'Join the ML DevOps Team'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {mode === 'signin'
                  ? 'Enter your corporate credentials to access the control center'
                  : 'Register a new account with assigned platform permissions'}
              </p>
            </div>

            {/* Alert Error Banner */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-error-500/10 border border-error-500/30 text-error-600 dark:text-error-400 text-xs flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Forgot Email Notification */}
            {forgotSent && (
              <div className="mb-4 p-3 rounded-lg bg-success-500/10 border border-success-500/30 text-success-600 dark:text-success-400 text-xs flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password reset instructions sent to {email}.</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sarah Chen"
                      className="input pl-9"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Corporate Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@mldevops.io"
                    className="input pl-9"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="input pl-9 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role selection in register mode */}
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Request Platform Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="input cursor-pointer"
                  >
                    <option value="Admin">Admin (Full Infrastructure Control)</option>
                    <option value="Developer">Developer (Build &amp; Deploy Access)</option>
                    <option value="Stakeholder">Stakeholder (Read-Only Metrics)</option>
                  </select>
                </div>
              )}

              {/* Remember me */}
              {mode === 'signin' && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-700 text-primary-600 focus:ring-primary-500 bg-gray-50 dark:bg-gray-800"
                    />
                    Remember this session for 30 days
                  </label>
                </div>
              )}

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Sign In to Control Center' : 'Create Account & Access'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-3 text-gray-400 font-mono text-[10px]">
                  Or quick login with demo profile
                </span>
              </div>
            </div>

            {/* Quick Demo Login Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('sarah.chen@mldevops.io', 'Admin', 'Sarah Chen')}
                className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-primary-500 dark:hover:border-primary-500 bg-gray-50 dark:bg-gray-800/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-500">Sarah Chen</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary-500/10 text-primary-400 font-mono">Admin</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">sarah.chen@mldevops.io</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('alex.rivera@mldevops.io', 'Developer', 'Alex Rivera')}
                className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-accent-500 dark:hover:border-accent-500 bg-gray-50 dark:bg-gray-800/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-accent-400">Alex Rivera</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-accent-500/10 text-accent-400 font-mono">Dev</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">alex.rivera@mldevops.io</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('stakeholder@enterprise.com', 'Stakeholder', 'Enterprise Client')}
                className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 bg-gray-50 dark:bg-gray-800/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-gray-300">Client Demo</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-500/10 text-gray-400 font-mono">View</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">client@enterprise.com</p>
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-primary-400" />
              Protected by OAuth2 &amp; Encrypted Sessions
            </span>
            <button
              type="button"
              onClick={() => handleQuickLogin('guest@mldevops.io', 'Developer', 'Guest User')}
              className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              Continue as Guest
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
