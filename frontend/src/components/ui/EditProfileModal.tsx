import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth, UserProfile } from '@/context/AuthContext';
import {
  User,
  X,
  CheckCircle2,
  Shield,
  Building,
  Mail,
  Sparkles,
} from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState<'Admin' | 'Developer' | 'Stakeholder'>(user?.role || 'Developer');
  const [company, setCompany] = useState(user?.company || 'Enterprise Platform');
  const [saved, setSaved] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name: name.trim() || user.name,
      role,
      company: company.trim() || 'Enterprise Platform',
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center text-xs font-bold shadow-md">
              {user.avatarInitials}
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-100">Edit User Profile &amp; Role</h3>
              <p className="text-xs text-gray-400">Update display name, system role &amp; credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {saved ? (
            <div className="py-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-success-500/10 text-success-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-gray-100">Profile Updated Successfully!</h4>
              <p className="text-xs text-gray-400">Your role has been set to <span className="text-primary-400 font-semibold">{role}</span>.</p>
            </div>
          ) : (
            <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary-400" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Boddiga Sai Krishna"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-700 bg-gray-950 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-colors"
                  required
                />
              </div>

              {/* Email (Readonly) */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-800 bg-gray-950/60 text-xs text-gray-500 font-mono cursor-not-allowed"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary-400" />
                  Select Active Platform Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Admin', 'Developer', 'Stakeholder'] as const).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRole(r)}
                      className={`py-2.5 px-3 rounded-xl border text-center text-xs font-semibold transition-all ${
                        role === r
                          ? 'border-primary-500 bg-primary-500/10 text-primary-400 shadow-sm'
                          : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Organization */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-gray-400" />
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Enterprise Platform"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-700 bg-gray-950 text-xs text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-colors"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!saved && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-gray-950/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-profile-form"
              className="px-5 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs transition-all shadow-md shadow-primary-500/20 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
