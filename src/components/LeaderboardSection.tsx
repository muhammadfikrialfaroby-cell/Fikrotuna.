import React, { useEffect, useState } from 'react';
import { User, LeaderboardEntry } from '../types';
import { Trophy, Medal, Crown, Star, Flame, Award, Sparkles } from 'lucide-react';

interface LeaderboardSectionProps {
  user: User;
}

export const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({ user }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([
    { rank: 1, name: 'M. Fikri Alfaroby', role: 'admin', score: 3200, badges: '🏆 Ustadz Teladan' },
    { rank: 2, name: 'Ahmad Fauzi', role: 'student', score: 2450, badges: '⭐ Bintang Mufrodat' },
    { rank: 3, name: 'Fatimah Az-Zahra', role: 'student', score: 2180, badges: '🎨 Pelukis Cepat' },
    { rank: 4, name: 'Zaid bin Tsabit', role: 'student', score: 1890, badges: '⚡ Kilat' },
    { rank: 5, name: 'Aisyah Putri', role: 'student', score: 1550, badges: '📖 Penuntut Ilmu' },
    { rank: 6, name: 'Umar Al-Faruq', role: 'student', score: 1420, badges: '🌟 Santri Teladan' },
    { rank: 7, name: 'Bilal bin Rabah', role: 'student', score: 1100, badges: '🎯 Penembak Jitu' },
  ]);

  useEffect(() => {
    fetch('/api/leaderboards')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.leaderboards) {
          setLeaderboard(data.leaderboards);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="inline-flex p-3 bg-amber-100 rounded-3xl text-amber-600 mb-3">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">Papan Peringkat Santri & Siswa</h2>
        <p className="text-xs text-slate-500 mt-1">
          Kumpulkan XP dari hafalan mufrodat, kuis harian, dan kemenangan di game Gartic Mufrodat!
        </p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8 items-end max-w-2xl mx-auto">
        {/* Rank 2 */}
        {leaderboard[1] && (
          <div className="bg-white rounded-3xl p-4 text-center border border-slate-200 shadow-xs flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-slate-600 font-bold text-sm mb-2">
              <Medal className="w-6 h-6 text-slate-400" />
            </div>
            <div className="text-xs font-extrabold text-slate-800 truncate w-full">
              {leaderboard[1].name}
            </div>
            <div className="text-xs text-emerald-600 font-bold mt-1">
              {leaderboard[1].score} Poin
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">{leaderboard[1].badges}</span>
            <div className="mt-3 w-full bg-slate-200 h-16 rounded-t-xl flex items-center justify-center font-black text-slate-500 text-lg">
              #2
            </div>
          </div>
        )}

        {/* Rank 1 */}
        {leaderboard[0] && (
          <div className="bg-gradient-to-b from-amber-50 to-white rounded-3xl p-5 text-center border-2 border-amber-300 shadow-md flex flex-col items-center transform -translate-y-2">
            <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-amber-600 font-bold text-sm mb-2 shadow-sm">
              <Crown className="w-8 h-8 text-amber-500 animate-bounce" />
            </div>
            <div className="text-sm font-black text-slate-800 truncate w-full">
              {leaderboard[0].name}
            </div>
            <div className="text-sm text-amber-700 font-black mt-1">
              {leaderboard[0].score} Poin
            </div>
            <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full mt-1">
              {leaderboard[0].badges}
            </span>
            <div className="mt-3 w-full bg-gradient-to-t from-amber-400 to-amber-300 text-amber-950 h-24 rounded-t-xl flex items-center justify-center font-black text-2xl shadow-inner">
              #1
            </div>
          </div>
        )}

        {/* Rank 3 */}
        {leaderboard[2] && (
          <div className="bg-white rounded-3xl p-4 text-center border border-slate-200 shadow-xs flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 border-2 border-amber-600 flex items-center justify-center text-amber-700 font-bold text-sm mb-2">
              <Medal className="w-6 h-6 text-amber-700" />
            </div>
            <div className="text-xs font-extrabold text-slate-800 truncate w-full">
              {leaderboard[2].name}
            </div>
            <div className="text-xs text-emerald-600 font-bold mt-1">
              {leaderboard[2].score} Poin
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">{leaderboard[2].badges}</span>
            <div className="mt-3 w-full bg-amber-100 h-12 rounded-t-xl flex items-center justify-center font-black text-amber-800 text-base">
              #3
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {leaderboard.map((item, idx) => {
            const isCurrentUser = item.name.toLowerCase() === user.name.toLowerCase();

            return (
              <div
                key={idx}
                className={`p-4 flex items-center justify-between transition ${
                  isCurrentUser ? 'bg-emerald-50/80 font-bold' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-7 text-center font-bold text-slate-500 text-sm">
                    {item.rank <= 3 ? (
                      item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'
                    ) : (
                      `#${item.rank}`
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{item.name}</span>
                      {isCurrentUser && (
                        <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                          Kamu
                        </span>
                      )}
                      {item.role === 'admin' && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">{item.badges}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-emerald-700">{item.score} XP</div>
                  <div className="text-[10px] text-slate-400">Total Poin</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
