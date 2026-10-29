import React, { useState, useEffect } from 'react';
import { User, MufrodatItem } from './types';
import { authService } from './services/authService';
import { LoginModal } from './components/LoginModal';
import { Navbar } from './components/Navbar';
import { MateriSection } from './components/MateriSection';
import { GarticGame } from './components/GarticGame';
import { LatihanSection } from './components/LatihanSection';
import { LeaderboardSection } from './components/LeaderboardSection';
import { AdminPanel } from './components/AdminPanel';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'materi' | 'gartic' | 'latihan' | 'leaderboard' | 'admin'>('materi');
  const [customMufrodat, setCustomMufrodat] = useState<MufrodatItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('mufrodat_custom_items');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Listen to auth changes
  useEffect(() => {
    const unsubscribe = authService.subscribe((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Save custom mufrodat
  const handleAddMufrodat = (item: MufrodatItem) => {
    setCustomMufrodat((prev) => {
      const updated = [item, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('mufrodat_custom_items', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleDeleteMufrodat = (id: string) => {
    setCustomMufrodat((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mufrodat_custom_items', JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Mandatory Login Gate: If no user is logged in, show Login Screen
  if (!user) {
    return <LoginModal onSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={() => authService.logout()}
      />

      {/* Main Content Area based on Tab */}
      <main className="flex-1 pb-16">
        {activeTab === 'materi' && (
          <MateriSection user={user} customMufrodat={customMufrodat} />
        )}

        {activeTab === 'gartic' && (
          <GarticGame user={user} customMufrodat={customMufrodat} />
        )}

        {activeTab === 'latihan' && <LatihanSection user={user} />}

        {activeTab === 'leaderboard' && <LeaderboardSection user={user} />}

        {activeTab === 'admin' && user.role === 'admin' && (
          <AdminPanel
            user={user}
            customMufrodat={customMufrodat}
            onAddMufrodat={handleAddMufrodat}
            onDeleteMufrodat={handleDeleteMufrodat}
          />
        )}
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Mufrodat Fun - Media Pembelajaran Bahasa Arab & Game Gartic.io</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Ditenagai oleh AI Gemini 3.8</span>
            <span>•</span>
            <span>Express Backend Siap Vercel</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
