import React from 'react';
import { User } from '../types';
import { BookOpen, Palette, Award, Trophy, Shield, LogOut, Sparkles, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  user: User;
  activeTab: 'materi' | 'gartic' | 'latihan' | 'leaderboard' | 'admin';
  setActiveTab: (tab: 'materi' | 'gartic' | 'latihan' | 'leaderboard' | 'admin') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('materi')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <span className="font-arabic text-xl font-bold">مُفْ</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800 text-lg leading-tight">Mufrodat Fun</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Media Belajar Arab & Gartic.io
              </p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('materi')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'materi'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Materi Kosakata
            </button>

            <button
              onClick={() => setActiveTab('gartic')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'gartic'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Gartic Mufrodat</span>
              <span className="bg-white/20 text-white text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-wider font-extrabold animate-pulse">
                Game
              </span>
            </button>

            <button
              onClick={() => setActiveTab('latihan')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'latihan'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Award className="w-4 h-4 text-teal-600" />
              Latihan Kuis
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'leaderboard'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              Peringkat
            </button>

            {user.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  activeTab === 'admin'
                    ? 'bg-emerald-800 text-white shadow-xs font-bold'
                    : 'text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-400" />
                Panel Admin
              </button>
            )}
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            {/* XP & Level Badge */}
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-full text-xs">
              <span className="flex items-center gap-1 font-bold text-emerald-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {user.xp} XP
              </span>
              <span className="text-emerald-300">|</span>
              <span className="font-semibold text-emerald-700">Level {user.level}</span>
            </div>

            {/* User Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold text-xs uppercase">
                {user.name.charAt(0)}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-none truncate max-w-[130px]">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                  {user.role === 'admin' ? (
                    <span className="text-amber-700 font-bold bg-amber-100 px-1 rounded text-[9px]">ADMIN</span>
                  ) : (
                    <span>Siswa</span>
                  )}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              title="Keluar dari akun"
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition flex items-center gap-1.5 text-xs font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden border-t border-slate-200 bg-white px-2 py-1 flex items-center justify-around overflow-x-auto">
        <button
          onClick={() => setActiveTab('materi')}
          className={`flex flex-col items-center py-1.5 px-2 text-[11px] font-medium rounded-lg ${
            activeTab === 'materi' ? 'text-emerald-700 font-bold' : 'text-slate-600'
          }`}
        >
          <BookOpen className="w-4 h-4 mb-0.5" />
          Materi
        </button>
        <button
          onClick={() => setActiveTab('gartic')}
          className={`flex flex-col items-center py-1.5 px-2 text-[11px] font-medium rounded-lg ${
            activeTab === 'gartic' ? 'text-amber-600 font-bold' : 'text-slate-600'
          }`}
        >
          <Palette className="w-4 h-4 mb-0.5" />
          Gartic
        </button>
        <button
          onClick={() => setActiveTab('latihan')}
          className={`flex flex-col items-center py-1.5 px-2 text-[11px] font-medium rounded-lg ${
            activeTab === 'latihan' ? 'text-teal-700 font-bold' : 'text-slate-600'
          }`}
        >
          <Award className="w-4 h-4 mb-0.5" />
          Kuis
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center py-1.5 px-2 text-[11px] font-medium rounded-lg ${
            activeTab === 'leaderboard' ? 'text-emerald-700 font-bold' : 'text-slate-600'
          }`}
        >
          <Trophy className="w-4 h-4 mb-0.5" />
          Peringkat
        </button>
        {user.role === 'admin' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center py-1.5 px-2 text-[11px] font-medium rounded-lg ${
              activeTab === 'admin' ? 'text-emerald-900 font-bold' : 'text-slate-600'
            }`}
          >
            <Shield className="w-4 h-4 mb-0.5" />
            Admin
          </button>
        )}
      </div>
    </header>
  );
};
