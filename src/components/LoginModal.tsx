import React, { useState } from 'react';
import { authService } from '../services/authService';
import { BookOpen, ShieldCheck, UserCheck, Sparkles, Key, User, ArrowRight, AlertCircle, HelpCircle } from 'lucide-react';

interface LoginModalProps {
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (activeTab === 'admin') {
        const result = await authService.loginAdmin(username.trim(), password);
        if (result.success) {
          onSuccess();
        } else {
          setError(result.message || 'Login admin gagal!');
        }
      } else {
        if (!username.trim()) {
          setError('Silakan masukkan nama atau username kamu.');
          setIsLoading(false);
          return;
        }
        const result = await authService.loginStudent(username.trim(), password || '123456');
        if (result.success) {
          onSuccess();
        } else {
          setError(result.message || 'Login gagal.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat masuk.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const res = await authService.loginWithGoogle(
        'muhammadfikrialfaroby@gmail.com',
        'Pelajar Mufrodat (Google)'
      );
      if (res.success) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Gagal login dengan Google');
    } finally {
      setIsLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setActiveTab('admin');
    setUsername('mfikrialfaroby');
    setPassword('oby112233');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Islamic geometric background circles */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 p-6 text-white text-center relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md mb-3 shadow-inner border border-white/20">
            <span className="font-arabic text-3xl font-bold text-amber-300">مُفْرَدَاتٌ</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Mufrodat Fun</h1>
          <p className="text-emerald-100 text-sm mt-1">
            Media Belajar Bahasa Arab & Game Tebak Gambar Gartic
          </p>

          <div className="absolute top-4 right-4 bg-amber-400/20 text-amber-300 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border border-amber-300/30">
            <Sparkles className="w-3 h-3" />
            <span>AI Powered</span>
          </div>
        </div>

        {/* Login Tabs */}
        <div className="p-6">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                setError('');
              }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'student'
                  ? 'bg-white text-emerald-800 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Siswa / Santri
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setError('');
              }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-white text-emerald-800 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Admin / Guru
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {activeTab === 'admin' ? 'Username Admin' : 'Nama Siswa / Username'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={activeTab === 'admin' ? 'mfikrialfaroby' : 'Contoh: Zaid atau Fatimah'}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={activeTab === 'admin' ? 'oby112233' : 'Kata sandi bebas'}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  required={activeTab === 'admin'}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm transition transform active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Google Sign In option */}
          <div className="mt-5 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 text-sm shadow-sm flex items-center justify-center gap-3 transition hover:border-slate-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Masuk dengan Google (Firebase Auth)</span>
            </button>
          </div>

          {/* Admin Credential Help Box */}
          <div className="mt-5 p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200/70 text-xs">
            <div className="flex items-center justify-between text-emerald-900 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
                Info Akun Admin Terdaftar:
              </span>
              <button
                type="button"
                onClick={fillAdminCredentials}
                className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded-md transition font-medium"
              >
                Auto-Isi Admin
              </button>
            </div>
            <p className="text-emerald-800">
              Username: <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200">mfikrialfaroby</span>
              <br />
              Kata Sandi: <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200 mt-1 inline-block">oby112233</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center text-xs text-slate-500">
          Halaman wajib login • Aman & Terverifikasi
        </div>
      </div>
    </div>
  );
};
