import React, { useState } from 'react';
import { UserAccount } from '../types/user';
import { Lock, User, Key, X, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  accounts: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
  onClose: () => void;
  initialUsername?: string;
  targetSchoolName?: string;
  isMandatory?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  accounts,
  onLoginSuccess,
  onClose,
  initialUsername = '',
  targetSchoolName = '',
  isMandatory = false,
}) => {
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sync if initialUsername changes
  React.useEffect(() => {
    if (initialUsername) {
      setUsername(initialUsername);
    }
  }, [initialUsername]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const found = accounts.find(
      (a) =>
        a.username.toLowerCase() === username.trim().toLowerCase() &&
        a.password === password.trim()
    );

    if (found) {
      if (found.status === 'suspended') {
        setError('This institutional account has been frozen by the Super Administrator. Please contact Central Admin.');
        return;
      }
      onLoginSuccess(found);
      onClose();
    } else {
      setError('Invalid Username or Password! Please verify your official credentials provided by Admin.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print font-sans"
      onClick={(e) => {
        if (!isMandatory && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-slate-300 animate-in fade-in zoom-in-95 card-3d">
        <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md btn-3d-blue">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-base">PAPER MAKER SOFTWARE</h3>
              <p className="text-xs text-blue-200">
                {targetSchoolName || 'Official Examination Portal Login'}
              </p>
            </div>
          </div>
          {!isMandatory ? (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              title="Close Login Window"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
              <Lock className="w-3 h-3 text-amber-300" />
              <span>Login Required</span>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-800 bg-white">
          {targetSchoolName && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-3 text-blue-950">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Target Institute:</div>
              <div className="text-sm font-black mt-0.5">{targetSchoolName}</div>
              <p className="text-[11px] text-blue-800 mt-1 font-semibold">
                Please enter your official ID and password to access the examination portal.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl text-rose-900 font-bold text-xs space-y-1">
              <div>⚠️ {error}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-black text-slate-900 mb-1 text-xs">
                Login ID / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter Login ID / Username..."
                  className="w-full pl-9 pr-3 py-2 border-2 border-slate-300 rounded-xl font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-black text-slate-900 mb-1 text-xs">
                Confidential Password
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-indigo-600 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password..."
                  className="w-full pl-9 pr-3 py-2 border-2 border-slate-300 rounded-xl font-bold text-slate-900 focus:border-indigo-600 focus:outline-none text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-3d btn-3d-blue w-full py-3 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>Sign In to School Portal</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </form>

          {/* Pre-Configured Demo Accounts for Quick Evaluation */}
          <div className="pt-3 border-t border-slate-200">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
              <span>Quick Demo Accounts:</span>
              <span className="text-[10px] text-blue-600 font-bold lowercase">one-click fill</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setUsername('pakpattan@smartschool.edu.pk');
                  setPassword('SmartDemo123');
                  setError(null);
                }}
                className="p-2 text-left bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200 rounded-xl transition cursor-pointer"
              >
                <div className="font-extrabold text-[11px] text-blue-950 truncate">The Smart School</div>
                <div className="text-[10px] text-blue-700 font-medium">Pakpattan Branch</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('okara@knowledgeschool.edu.pk');
                  setPassword('KnowledgeDemo123');
                  setError(null);
                }}
                className="p-2 text-left bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200 rounded-xl transition cursor-pointer"
              >
                <div className="font-extrabold text-[11px] text-indigo-950 truncate">The Knowledge School</div>
                <div className="text-[10px] text-indigo-700 font-medium">Okara Branch</div>
              </button>
            </div>
          </div>

          {/* Support & Developer Contact Details Section */}
          <div className="pt-4 border-t border-slate-200 space-y-2.5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-slate-700">
              <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Technical Support & Assistance:</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                If you encounter any query, technical issue, or problem regarding the Paper Maker Software, you can send a screenshot or contact support directly:
              </p>
              <div className="pt-1.5 border-t border-slate-200 text-xs">
                <div className="font-extrabold text-slate-900 text-[12px]">
                  Muhammad Imran Khan
                </div>
                <div className="text-[11px] font-semibold text-blue-700">
                  Software developer
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  MSc Computer Science
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 font-mono text-[11px] font-bold text-slate-800">
                  <a
                    href="tel:03007603964"
                    className="hover:text-blue-600 flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200"
                  >
                    📞 03007603964
                  </a>
                  <a
                    href="tel:03147603964"
                    className="hover:text-blue-600 flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200"
                  >
                    📞 03147603964
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
