import { useState } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import {
  ShieldCheck,
  UserPlus,
  Users,
  MailWarning,
  ShieldOff,
  Send,
  Trash2,
  RefreshCw,
  Ban,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

type Role = 'Admin (Full Platform Control)' | 'Developer (Build & Deploy Access)' | 'Stakeholder (Read-Only Metrics & Testing Access)';

type UserStatus = 'Active' | 'Pending' | 'Expired';
type TokenValidity = 'Valid' | 'Expires in 24h' | 'Invalid';

interface ManagedUser {
  id: string;
  identity: string;
  role: Role;
  status: UserStatus;
  token: TokenValidity;
}

const roleOptions: Role[] = [
  'Admin (Full Platform Control)',
  'Developer (Build & Deploy Access)',
  'Stakeholder (Read-Only Metrics & Testing Access)',
];

const initialUsers: ManagedUser[] = [
  {
    id: '1',
    identity: 'Sarah Chen',
    role: 'Developer (Build & Deploy Access)',
    status: 'Active',
    token: 'Valid',
  },
  {
    id: '2',
    identity: 'client@enterprise.com',
    role: 'Stakeholder (Read-Only Metrics & Testing Access)',
    status: 'Pending',
    token: 'Expires in 24h',
  },
  {
    id: '3',
    identity: 'guest@external.com',
    role: 'Stakeholder (Read-Only Metrics & Testing Access)',
    status: 'Expired',
    token: 'Invalid',
  },
];

function getRoleBadge(role: Role) {
  if (role.startsWith('Admin')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-500/10 text-primary-400">
        Admin
      </span>
    );
  }
  if (role.startsWith('Developer')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-500/10 text-accent-400">
        Developer
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400">
      Stakeholder
    </span>
  );
}

function getStatusPill(status: UserStatus) {
  if (status === 'Active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-success-500/10 text-success-500">
        <CheckCircle2 className="w-3 h-3" />
        Active
      </span>
    );
  }
  if (status === 'Pending') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-warning-500/10 text-warning-500">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-error-500/10 text-error-500">
      <XCircle className="w-3 h-3" />
      Expired
    </span>
  );
}

function getTokenPill(token: TokenValidity) {
  if (token === 'Valid') {
    return <span className="font-mono text-xs text-success-500">● Valid</span>;
  }
  if (token === 'Expires in 24h') {
    return <span className="font-mono text-xs text-warning-500">⚠ Expires in 24h</span>;
  }
  return <span className="font-mono text-xs text-error-500">✕ Invalid</span>;
}

export default function UserGovernancePage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>(roleOptions[2]);
  const [inviteSent, setInviteSent] = useState(false);
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);

  const handleInvite = () => {
    if (!email.trim()) return;
    setInviteSent(true);
    setTimeout(() => setInviteSent(false), 3000);
    setEmail('');
  };

  const handleRevoke = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: 'Expired' as UserStatus, token: 'Invalid' as TokenValidity } : u
      )
    );
  };

  const handleResend = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, token: 'Expires in 24h' as TokenValidity } : u
      )
    );
  };

  const handleDelete = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const expiredCount = users.filter((u) => u.status === 'Expired').length;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Section Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary-500/10 text-primary-400">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-100">User Governance &amp; Security</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage platform access, role assignments, and invitation lifecycle
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
          <span className="text-xs font-medium text-success-500">Security Module Active</span>
        </div>
      </div>

      {/* TOP ROW — INVITE NEW USER CONTROL */}
      <Card>
        <CardHeader
          title="Invite New Stakeholder or Team Member"
          subtitle="Send a secure, time-limited invitation link via corporate email"
          icon={<UserPlus className="w-5 h-5" />}
        />
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="invite-email" className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Corporate Email Address
              </label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@company.com"
                className="input"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="invite-role" className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Assign Platform Role
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="input appearance-none cursor-pointer"
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <button
              id="send-invite-btn"
              onClick={handleInvite}
              disabled={!email.trim()}
              className={`relative inline-flex items-center gap-2.5 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg ${
                email.trim()
                  ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-[1.02]'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              Send Secure Invitation Link
              {email.trim() && (
                <span className="absolute inset-0 rounded-lg ring-1 ring-primary-400/30 pointer-events-none" />
              )}
            </button>

            {inviteSent && (
              <span className="inline-flex items-center gap-1.5 text-xs text-success-500 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Invitation sent successfully
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* MIDDLE ROW — METRIC TALLY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Card 1: Total Active Users */}
        <div className="card p-5 flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-success-500/70 to-transparent" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-success-500/10 text-success-500">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-gray-400">Total Active Users</span>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-gray-100 tracking-tight">
              12&nbsp;<span className="text-base font-normal text-gray-500">Users</span>
            </p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-success-500/10 text-success-500">
              <TrendingUp className="w-3 h-3" />
              +5% this week
            </span>
          </div>
        </div>

        {/* Card 2: Pending Invitations */}
        <div className="card p-5 flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-warning-500/70 to-transparent" />
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-warning-500/10 text-warning-500">
              <MailWarning className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-gray-400">Pending Invitation Links</span>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-gray-100 tracking-tight">
              3&nbsp;<span className="text-base font-normal text-gray-500">Links</span>
            </p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-warning-500/10 text-warning-500 animate-pulse-slow">
              <AlertCircle className="w-3 h-3" />
              Expiring Soon
            </span>
          </div>
        </div>

        {/* Card 3: Revoked / Expired Sessions */}
        <div className="card p-5 flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-error-500/70 to-transparent" />
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-error-500/10 text-error-500">
              <ShieldOff className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-gray-400">Revoked / Expired Sessions</span>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-gray-100 tracking-tight">
              {expiredCount}&nbsp;<span className="text-base font-normal text-gray-500">Sessions</span>
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW — USER LIFECYCLE TABLE */}
      <Card>
        <CardHeader
          title="User Management Directory"
          subtitle="Active user lifecycle, role assignments, and token validity"
          icon={<ShieldCheck className="w-5 h-5" />}
          action={
            <span className="text-xs text-gray-500">
              {users.length} record{users.length !== 1 ? 's' : ''}
            </span>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <th className="text-left font-medium px-5 py-3">User Identity</th>
                <th className="text-left font-medium px-5 py-3">Assigned Role</th>
                <th className="text-left font-medium px-5 py-3">System Status</th>
                <th className="text-left font-medium px-5 py-3">Token Validity</th>
                <th className="text-right font-medium px-5 py-3">Security Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  {/* Identity */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 text-xs font-bold shrink-0">
                        {user.identity.includes('@')
                          ? user.identity[0].toUpperCase()
                          : user.identity.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{user.identity}</span>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-5 py-3.5">{getRoleBadge(user.role)}</td>

                  {/* Status */}
                  <td className="px-5 py-3.5">{getStatusPill(user.status)}</td>

                  {/* Token */}
                  <td className="px-5 py-3.5">{getTokenPill(user.token)}</td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right">
                    {user.status === 'Active' && (
                      <button
                        id={`revoke-${user.id}`}
                        onClick={() => handleRevoke(user.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-error-500/10 text-error-500 hover:bg-error-500/20 border border-error-500/20 hover:border-error-500/40 transition-all duration-150"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Revoke Access
                      </button>
                    )}
                    {user.status === 'Pending' && (
                      <button
                        id={`resend-${user.id}`}
                        onClick={() => handleResend(user.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-warning-500/10 text-warning-500 hover:bg-warning-500/20 border border-warning-500/20 hover:border-warning-500/40 transition-all duration-150"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Resend Link
                      </button>
                    )}
                    {user.status === 'Expired' && (
                      <button
                        id={`delete-${user.id}`}
                        onClick={() => handleDelete(user.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 border border-gray-700 hover:border-gray-600 transition-all duration-150"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Record
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-500 text-sm">
                    No user records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
