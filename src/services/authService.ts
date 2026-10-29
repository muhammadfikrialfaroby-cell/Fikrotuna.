import { User } from '../types';

const STORAGE_KEY = 'mufrodat_user_session';

class AuthService {
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load session', e);
    }
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public subscribe(cb: (user: User | null) => void): () => void {
    this.listeners.push(cb);
    cb(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.currentUser));
  }

  public async loginAdmin(username: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        this.currentUser = data.user;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        this.notify();
        return { success: true };
      }
      return { success: false, message: data.message || 'Login gagal, periksa kredensial admin.' };
    } catch {
      // Local fallback verification in case API is temporarily unavailable
      if (username === 'mfikrialfaroby' && password === 'oby112233') {
        const adminUser: User = {
          uid: 'admin_mfikrialfaroby',
          name: 'M. Fikri Alfaroby (Admin)',
          email: 'muhammadfikrialfaroby@gmail.com',
          role: 'admin',
          xp: 5000,
          level: 15,
          wordsLearned: 150,
          quizzesCompleted: 42,
          garticScore: 3200,
          garticGamesPlayed: 35,
          achievements: ['master_mufrodat', 'gartic_champion', 'admin_power', 'streak_7'],
          token: 'token_admin_local',
        };
        this.currentUser = adminUser;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser));
        this.notify();
        return { success: true };
      }
      return { success: false, message: 'Username atau kata sandi admin salah!' };
    }
  }

  public async loginStudent(username: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        this.currentUser = data.user;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        this.notify();
        return { success: true };
      }
      return { success: false, message: data.message || 'Login siswa gagal.' };
    } catch {
      // Fallback local student
      const uid = `student_${username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const user: User = {
        uid,
        name: username,
        email: `${username}@mufrodat.local`,
        role: 'student',
        xp: 120,
        level: 1,
        wordsLearned: 12,
        quizzesCompleted: 1,
        garticScore: 240,
        garticGamesPlayed: 2,
        achievements: ['first_login'],
        token: `token_${Date.now()}`,
      };
      this.currentUser = user;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      this.notify();
      return { success: true };
    }
  }

  public async loginWithGoogle(email?: string, name?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const googleProfile = {
        uid: `google_${(email || 'user').split('@')[0]}`,
        name: name || 'Santri Google',
        email: email || 'santri@mufrodat.app',
      };

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'google', googleProfile }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        this.currentUser = data.user;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        this.notify();
        return { success: true };
      }
      throw new Error(data.message || 'Gagal login Google');
    } catch {
      // Fallback
      const user: User = {
        uid: 'google_user_' + Date.now(),
        name: name || 'Santri Google',
        email: email || 'santri.google@gmail.com',
        role: 'student',
        xp: 200,
        level: 1,
        wordsLearned: 15,
        quizzesCompleted: 2,
        garticScore: 350,
        garticGamesPlayed: 3,
        achievements: ['first_login', 'google_connected'],
        token: `google_token_${Date.now()}`,
      };
      this.currentUser = user;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      this.notify();
      return { success: true };
    }
  }

  public logout() {
    this.currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.notify();
  }

  public async addScore(xpGained: number, garticScoreGained = 0, isQuiz = false, isWord = false) {
    if (!this.currentUser) return;

    this.currentUser.xp += xpGained;
    this.currentUser.level = Math.floor(this.currentUser.xp / 300) + 1;
    if (garticScoreGained > 0) {
      this.currentUser.garticScore += garticScoreGained;
      this.currentUser.garticGamesPlayed += 1;
    }
    if (isQuiz) {
      this.currentUser.quizzesCompleted += 1;
    }
    if (isWord) {
      this.currentUser.wordsLearned += 1;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentUser));
    this.notify();

    // Sync to backend asynchronously
    try {
      fetch(`/api/user-data/${this.currentUser.uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          xpDelta: xpGained,
          garticScoreDelta: garticScoreGained,
          garticGamesPlayedDelta: garticScoreGained > 0 ? 1 : 0,
          quizzesCompletedDelta: isQuiz ? 1 : 0,
          wordsLearnedDelta: isWord ? 1 : 0,
        }),
      }).catch(() => {});
    } catch {}
  }
}

export const authService = new AuthService();
