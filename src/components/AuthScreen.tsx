import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User, ShieldCheck, ArrowRight, AlertCircle, Database } from 'lucide-react';
import { AuthUser } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError('Iltimos, login va parolni kiriting');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // 1. daewoouser / userdaewoo -> Standard Editor/Admin
      if (cleanUser === 'daewoouser' && cleanPass === 'userdaewoo') {
        const authUser: AuthUser = {
          username: 'daewoouser',
          name: 'Daewoo Boshqaruvchi',
          role: 'admin',
          loggedInAt: new Date().toISOString(),
        };
        onLoginSuccess(authUser);
      }
      // 2. admindw / dwadmin -> Viewer Admin (Analytics, Dashboards, Insights, Audit Logs)
      else if (cleanUser === 'admindw' && cleanPass === 'dwadmin') {
        const authUser: AuthUser = {
          username: 'admindw',
          name: 'Admin DW Nazoratchi',
          role: 'viewer',
          loggedInAt: new Date().toISOString(),
        };
        onLoginSuccess(authUser);
      } else {
        setError("Login yoki parol noto'g'ri!");
        setIsLoading(false);
      }
    }, 350);
  };

  return (
    <div className="min-h-screen w-full bg-[#edf6fe] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-mono text-sky-950">
      {/* Background Soft Blue Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-sky-200/50 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white border border-sky-200 rounded-2xl shadow-xl p-8 backdrop-blur-2xl relative z-10 font-mono text-sky-950"
      >
        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-600 text-white shadow-md mb-3.5 border border-sky-500">
            <Database className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-widest text-sky-950 font-mono uppercase">
            DAEWOO
          </h1>
          <p className="text-xs text-sky-900 mt-1 font-mono font-semibold">Dinamik Analitika & Jadvallar Platformasi</p>
        </div>

        {/* Error notification */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3 bg-red-50 border border-red-300 rounded-xl flex items-start gap-2.5 text-xs text-red-800 font-bold"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>{error}</div>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-sky-950 uppercase tracking-wider mb-2 font-mono">
              Login
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-700">
                <User className="w-4 h-4" />
              </div>
              <input
                id="login-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="daewoouser"
                className="w-full pl-10 pr-4 py-2.5 bg-sky-50/50 border border-sky-300 rounded-xl text-sky-950 placeholder-sky-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition font-mono font-medium"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-sky-950 uppercase tracking-wider mb-2 font-mono">
              Parol
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-700">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-sky-50/50 border border-sky-300 rounded-xl text-sky-950 placeholder-sky-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition font-mono font-medium"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            id="login-submit-button"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md border border-sky-700 flex items-center justify-center gap-2 transition duration-150 disabled:opacity-50 cursor-pointer active:scale-98 font-mono"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Tizimga kirish</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>
        </form>

        {/* Security Footer */}
        <div className="mt-7 pt-5 border-t border-sky-200 flex items-center justify-between text-[11px] text-sky-900 font-mono">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Xavfsiz Kirish</span>
          </div>
          <span className="text-sky-700 font-bold font-mono">v2.5.0</span>
        </div>
      </motion.div>
    </div>
  );
};
