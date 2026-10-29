import { User } from '../types';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const STORAGE_KEY = 'mufrodat_user_session';

class AuthService {
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    this.loadSession();
    this.listenToFirebaseAuth();
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

  private listenToFirebaseAuth() {
    if (typeof window === 'undefined') return;

    onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userDocRef = doc(db, 'users', fbUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          const isAdminEmail = fbUser.email?.toLowerCase() === 'muhammadfikrialfaroby@gmail.com';

          if (docSnap.exists()) {
            const data = docSnap.data() as Partial<User>;
            const fullUser: User = {
              uid: fbUser.uid,
              name: fbUser.displayName || data.name || 'Santri Mufrodat',
              email: fbUser.email || data.email || '',
              role: isAdminEmail ? 'admin' : (data.role || 'student'),
              xp: data.xp ?? 200,
              level: data.level ?? 1,
              wordsLearned: data.wordsLearned ?? 10,
              quizzesCompleted: data.quizzesCompleted ?? 1,
              garticScore: data.garticScore ?? 250,
              garticGamesPlayed: data.garticGamesPlayed ?? 2,
              achievements: data.achievements || ['google_auth'],
              token: await fbUser.getIdToken(),
              avatarUrl: fbUser.photoURL || undefined,
            };
            this.currentUser = fullUser;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fullUser));
            this.notify();
          } else {
            // Initialize new user in Firestore
            const newUser: User = {
              uid: fbUser.uid,
              name: fbUser.displayName || 'Santri Mufrodat',
              email: fbUser.email || '',
              role: isAdminEmail ? 'admin' : 'student',
              xp: isAdminEmail ? 5000 : 150,
              level: isAdminEmail ? 15 : 1,
              wordsLearned: isAdminEmail ? 150 : 5,
              quizzesCompleted: isAdminEmail ? 40 : 1,
              garticScore: isAdminEmail ? 3000 : 200,
              garticGamesPlayed: isAdminEmail ? 30 : 1,
              achievements: isAdminEmail ? ['admin_power', 'master_mufrodat'] : ['welcome_santri'],
              token: await fbUser.getIdToken(),
              avatarUrl: fbUser.photoURL || undefined,
            };

            await setDoc(userDocRef, {
              uid: newUser.uid,
              name: newUser.name,
              email: newUser.email,
              role: newUser.role,
              xp: newUser.xp,
              level: newUser.level,
              wordsLearned: newUser.wordsLearned,
              quizzesCompleted: newUser.quizzesCompleted,
              garticScore: newUser.garticScore,
              garticGamesPlayed: newUser.garticGamesPlayed,
              achievements: newUser.achievements,
              updatedAt: new Date().toISOString(),
            });

            this.currentUser = newUser;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
            this.notify();
          }
        } catch (error) {
          console.error('Error fetching/saving Firestore user data:', error);
        }
      }
    });
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

  // Google Sign-In with Firebase Auth
  public async loginWithGoogle(): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const isAdminEmail = fbUser.email?.toLowerCase() === 'muhammadfikrialfaroby@gmail.com';

      const userDocRef = doc(db, 'users', fbUser.uid);
      let fullUser: User;

      try {
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data();
          fullUser = {
            uid: fbUser.uid,
            name: fbUser.displayName || data.name || 'Santri Mufrodat',
            email: fbUser.email || data.email || '',
            role: isAdminEmail ? 'admin' : (data.role || 'student'),
            xp: data.xp ?? 200,
            level: data.level ?? 1,
            wordsLearned: data.wordsLearned ?? 10,
            quizzesCompleted: data.quizzesCompleted ?? 1,
            garticScore: data.garticScore ?? 250,
            garticGamesPlayed: data.garticGamesPlayed ?? 2,
            achievements: data.achievements || ['google_auth'],
            avatarUrl: fbUser.photoURL || undefined,
          };
        } else {
          fullUser = {
            uid: fbUser.uid,
            name: fbUser.displayName || 'Santri Google',
            email: fbUser.email || '',
            role: isAdminEmail ? 'admin' : 'student',
            xp: isAdminEmail ? 5000 : 150,
            level: isAdminEmail ? 15 : 1,
            wordsLearned: isAdminEmail ? 150 : 5,
            quizzesCompleted: isAdminEmail ? 40 : 1,
            garticScore: isAdminEmail ? 3000 : 200,
            garticGamesPlayed: isAdminEmail ? 30 : 1,
            achievements: ['welcome_santri', 'google_connected'],
            avatarUrl: fbUser.photoURL || undefined,
          };

          await setDoc(userDocRef, {
            uid: fullUser.uid,
            name: fullUser.name,
            email: fullUser.email,
            role: fullUser.role,
            xp: fullUser.xp,
            level: fullUser.level,
            wordsLearned: fullUser.wordsLearned,
            quizzesCompleted: fullUser.quizzesCompleted,
            garticScore: fullUser.garticScore,
            garticGamesPlayed: fullUser.garticGamesPlayed,
            achievements: fullUser.achievements,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (firestoreErr) {
        handleFirestoreError(firestoreErr, OperationType.WRITE, `users/${fbUser.uid}`);
        fullUser = {
          uid: fbUser.uid,
          name: fbUser.displayName || 'Santri Google',
          email: fbUser.email || '',
          role: isAdminEmail ? 'admin' : 'student',
          xp: 200,
          level: 1,
          wordsLearned: 10,
          quizzesCompleted: 1,
          garticScore: 250,
          garticGamesPlayed: 2,
          achievements: ['google_connected'],
          avatarUrl: fbUser.photoURL || undefined,
        };
      }

      this.currentUser = fullUser;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fullUser));
      this.notify();
      return { success: true };
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      return { success: false, message: err.message || 'Gagal login dengan Google' };
    }
  }

  // Admin Login: Username mfikrialfaroby, Password oby112233
  public async loginAdmin(username: string, password: string): Promise<{ success: boolean; message?: string }> {
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
        token: 'token_admin_mfikrialfaroby',
      };
      this.currentUser = adminUser;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser));
      this.notify();

      // Attempt to save/sync admin doc in Firestore if permitted
      try {
        if (auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          await setDoc(userDocRef, { ...adminUser, uid: auth.currentUser.uid, updatedAt: new Date().toISOString() }, { merge: true });
        }
      } catch {}

      return { success: true };
    }
    return { success: false, message: 'Username atau kata sandi admin salah!' };
  }

  // Student username login
  public async loginStudent(username: string, password: string): Promise<{ success: boolean; message?: string }> {
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

  // Logout
  public async logout() {
    try {
      await firebaseSignOut(auth);
    } catch {}
    this.currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.notify();
  }

  // Update Score, XP, and sync to Firestore
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

    // Persist per-user data to Firestore
    if (auth.currentUser && auth.currentUser.uid === this.currentUser.uid) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      try {
        await updateDoc(userRef, {
          xp: this.currentUser.xp,
          level: this.currentUser.level,
          wordsLearned: this.currentUser.wordsLearned,
          quizzesCompleted: this.currentUser.quizzesCompleted,
          garticScore: this.currentUser.garticScore,
          garticGamesPlayed: this.currentUser.garticGamesPlayed,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      }
    }

    // Sync to backend API as secondary backup
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
