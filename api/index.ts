import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy init Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory data store for sessions, custom words, and user data
interface UserData {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
  xp: number;
  level: number;
  wordsLearned: number;
  quizzesCompleted: number;
  garticScore: number;
  garticGamesPlayed: number;
  achievements: string[];
  lastActive: string;
}

const memoryUsers: Record<string, UserData> = {
  admin_mfikrialfaroby: {
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
    lastActive: new Date().toISOString(),
  },
};

// Default high scores for Gartic Mufrodat
const leaderboards = [
  { rank: 1, name: 'M. Fikri Alfaroby', role: 'admin', score: 3200, badges: '🏆 Ustadz' },
  { rank: 2, name: 'Ahmad Fauzi', role: 'student', score: 2450, badges: '⭐ Bintang Mufrodat' },
  { rank: 3, name: 'Fatimah Az-Zahra', role: 'student', score: 2180, badges: '🎨 Pelukis Cepat' },
  { rank: 4, name: 'Zaid bin Tsabit', role: 'student', score: 1890, badges: '⚡ Kilat' },
  { rank: 5, name: 'Aisyah Putri', role: 'student', score: 1550, badges: '📖 Penuntut Ilmu' },
];

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Admin and Student Authentication endpoint
app.post('/api/login', (req: Request, res: Response) => {
  try {
    const { username, password, type, googleProfile } = req.body;

    // Check Admin credentials explicitly requested:
    // Username: mfikrialfaroby, Kata Sandi: oby112233
    if (username === 'mfikrialfaroby' && password === 'oby112233') {
      const adminUser: UserData = {
        uid: 'admin_mfikrialfaroby',
        name: 'M. Fikri Alfaroby (Admin)',
        email: 'muhammadfikrialfaroby@gmail.com',
        role: 'admin',
        xp: memoryUsers['admin_mfikrialfaroby']?.xp || 5000,
        level: memoryUsers['admin_mfikrialfaroby']?.level || 15,
        wordsLearned: memoryUsers['admin_mfikrialfaroby']?.wordsLearned || 150,
        quizzesCompleted: memoryUsers['admin_mfikrialfaroby']?.quizzesCompleted || 42,
        garticScore: memoryUsers['admin_mfikrialfaroby']?.garticScore || 3200,
        garticGamesPlayed: memoryUsers['admin_mfikrialfaroby']?.garticGamesPlayed || 35,
        achievements: ['master_mufrodat', 'gartic_champion', 'admin_power', 'streak_7'],
        lastActive: new Date().toISOString(),
      };
      memoryUsers['admin_mfikrialfaroby'] = adminUser;
      res.json({
        success: true,
        user: adminUser,
        token: `token_${Date.now()}_admin`,
      });
      return;
    }

    // Google Sign-In or regular Student login
    if (type === 'google' && googleProfile) {
      const uid = googleProfile.uid || `google_${googleProfile.email?.split('@')[0] || Date.now()}`;
      const existing = memoryUsers[uid];
      const studentUser: UserData = existing || {
        uid,
        name: googleProfile.name || 'Pelajar Arab',
        email: googleProfile.email || 'pelajar@mufrodat.id',
        role: 'student',
        xp: 150,
        level: 1,
        wordsLearned: 10,
        quizzesCompleted: 1,
        garticScore: 250,
        garticGamesPlayed: 2,
        achievements: ['first_login'],
        lastActive: new Date().toISOString(),
      };
      memoryUsers[uid] = studentUser;
      res.json({
        success: true,
        user: studentUser,
        token: `token_${Date.now()}_${uid}`,
      });
      return;
    }

    // Regular student username/password login
    if (username && password) {
      if (username.toLowerCase() === 'mfikrialfaroby') {
        res.status(401).json({
          success: false,
          message: 'Kata sandi akun admin salah! Periksa kembali.',
        });
        return;
      }
      const uid = `student_${username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const existing = memoryUsers[uid];
      const studentUser: UserData = existing || {
        uid,
        name: username,
        email: `${username}@mufrodat.local`,
        role: 'student',
        xp: 100,
        level: 1,
        wordsLearned: 8,
        quizzesCompleted: 1,
        garticScore: 200,
        garticGamesPlayed: 1,
        achievements: ['first_login'],
        lastActive: new Date().toISOString(),
      };
      memoryUsers[uid] = studentUser;
      res.json({
        success: true,
        user: studentUser,
        token: `token_${Date.now()}_${uid}`,
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: 'Username dan kata sandi wajib diisi.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Fetch user profile / progress
app.get('/api/user-data/:uid', (req: Request, res: Response) => {
  const { uid } = req.params;
  const user = memoryUsers[uid];
  if (!user) {
    res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    return;
  }
  res.json({ success: true, user });
});

// Update user progress / XP / score
app.post('/api/user-data/:uid', (req: Request, res: Response) => {
  const { uid } = req.params;
  const updates = req.body;
  if (!memoryUsers[uid]) {
    memoryUsers[uid] = {
      uid,
      name: updates.name || 'Santri/Pelajar',
      email: updates.email || '',
      role: 'student',
      xp: 0,
      level: 1,
      wordsLearned: 0,
      quizzesCompleted: 0,
      garticScore: 0,
      garticGamesPlayed: 0,
      achievements: [],
      lastActive: new Date().toISOString(),
    };
  }

  const current = memoryUsers[uid];
  if (typeof updates.xpDelta === 'number') {
    current.xp += updates.xpDelta;
    current.level = Math.floor(current.xp / 300) + 1;
  }
  if (typeof updates.wordsLearnedDelta === 'number') {
    current.wordsLearned += updates.wordsLearnedDelta;
  }
  if (typeof updates.quizzesCompletedDelta === 'number') {
    current.quizzesCompleted += updates.quizzesCompletedDelta;
  }
  if (typeof updates.garticScoreDelta === 'number') {
    current.garticScore += updates.garticScoreDelta;
  }
  if (typeof updates.garticGamesPlayedDelta === 'number') {
    current.garticGamesPlayed += updates.garticGamesPlayedDelta;
  }
  if (updates.newAchievement && !current.achievements.includes(updates.newAchievement)) {
    current.achievements.push(updates.newAchievement);
  }
  current.lastActive = new Date().toISOString();

  // Update leaderboard if score is high
  const existingLb = leaderboards.find((l) => l.name === current.name);
  if (existingLb) {
    existingLb.score = Math.max(existingLb.score, current.garticScore);
  } else if (current.garticScore > 500) {
    leaderboards.push({
      rank: leaderboards.length + 1,
      name: current.name,
      role: current.role,
      score: current.garticScore,
      badges: current.role === 'admin' ? '🏆 Ustadz' : '🌟 Pelajar Aktif',
    });
  }
  leaderboards.sort((a, b) => b.score - a.score);
  leaderboards.forEach((item, idx) => (item.rank = idx + 1));

  res.json({ success: true, user: current, leaderboards });
});

// Leaderboard endpoint
app.get('/api/leaderboards', (_req: Request, res: Response) => {
  res.json({ success: true, leaderboards });
});

// AI Gemini Server-side Feature 1: Mufrodat In-Depth Explanation
app.post('/api/gemini/explain', async (req: Request, res: Response) => {
  try {
    const { arabicWord, meaning } = req.body;
    if (!arabicWord) {
      res.status(400).json({ error: 'Kata Arab (mufrodat) diperlukan' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback if no API key configured
      res.json({
        arabic: arabicWord,
        meaning: meaning || 'Kosakata Bahasa Arab',
        transliteration: 'Lafadz bahasa Arab',
        wazan: 'Bentuk Isim / Fiil dasar',
        jama: 'Jamak taktsir / salim sesuai qawaid',
        exampleSentence: `هَذَا ${arabicWord} جَمِيلٌ جِدًّا (Ini ${meaning || 'kata'} sangat bagus)`,
        tipsMengingat: `Kaitkan kata "${meaning}" dengan bunyi ${arabicWord} untuk memperkuat ingatan visual.`,
      });
      return;
    }

    const prompt = `Kamu adalah ustadz/guru pakar Bahasa Arab yang ramah dan interaktif.
Jelaskan kosakata mufrodat bahasa Arab berikut:
Kata: "${arabicWord}"
Arti: "${meaning || ''}"

Berikan respon JSON murni dengan format:
{
  "arabic": "${arabicWord}",
  "harakat": "Lafaz lengkap dengan harakat tasykil yang benar",
  "transliteration": "Transliterasi latin Indonesia (contoh: Sayyarah)",
  "meaning": "Arti bahasa Indonesia lengkap",
  "wordType": "Isim (Kata Benda) / Fi'il (Kata Kerja) / Harf",
  "rootWord": "Akar kata / Wazan 3 huruf jika ada",
  "pluralForm": "Bentuk jamak (مُفْرَد & جَمْع) jika isim",
  "exampleSentence": "Contoh kalimat (jumlah mufidah) berharakat lengkap",
  "sentenceMeaning": "Arti kalimat contoh dalam bahasa Indonesia",
  "synonym": "Sinonim (muradif) dalam bahasa Arab jika ada",
  "antonym": "Antonim (dhidd) dalam bahasa Arab jika ada",
  "memoryTrick": "Tips/jembatan keledai seru untuk mengingat kosakata ini dengan mudah"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Gemini Explain Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Gagal memproses penjelasan dengan AI',
    });
  }
});

// AI Gemini Server-side Feature 2: Gartic Guess / Sketch Judge
// Evaluates player's drawing and generates funny bot guesses in Gartic room!
app.post('/api/gemini/gartic-guess', async (req: Request, res: Response) => {
  try {
    const { currentWord, drawingHints, imageBase64 } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Smart simulated responses when key is not active
      const cannedGuesses = [
        'Apakah itu... ' + (currentWord?.meaning || 'sesuatu') + '?',
        'Wah goresannya menarik, mirip ' + (currentWord?.indonesian || 'gambar itu') + '!',
        'Aku tebak: ' + (currentWord?.arabic || 'مَا هَذَا؟'),
      ];
      const randomGuess = cannedGuesses[Math.floor(Math.random() * cannedGuesses.length)];
      res.json({
        success: true,
        guess: randomGuess,
        confidence: 0.85,
        botComment: 'Gambar yang bagus! Terus lanjutkan!',
      });
      return;
    }

    const parts: any[] = [];
    if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.includes('base64,')) {
      const cleanBase64 = imageBase64.split('base64,')[1];
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: cleanBase64,
        },
      });
    }

    const promptText = `Kamu adalah bot AI penonton dan pemain di game tebak gambar Gartic Mufrodat Bahasa Arab.
Kata target yang sedang digambar pemain adalah:
- Arab: "${currentWord?.arabic || ''}"
- Indonesia: "${currentWord?.meaning || currentWord?.indonesian || ''}"
- Petunjuk tambahan: "${drawingHints || 'Pemain sedang menggambar di kanvas'}"

Buat 3 tebakan/komentar singkat seru ala pemain Gartic.io:
1. Satu tebakan salah yang mendekati/lucu.
2. Satu petunjuk kecil dalam bahasa Arab/Indonesia.
3. Satu tebakan tepat atau hampir tepat.

Kembalikan JSON format:
{
  "guesses": [
    {"player": "AI_Umar", "text": "tebakan 1"},
    {"player": "AI_Aisyah", "text": "tebakan 2"},
    {"player": "AI_BotArab", "text": "tebakan 3"}
  ],
  "drawingFeedback": "Komentar ramah mengenai gaya gambarnya"
}`;
    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error('Gemini Gartic Guess Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Gagal memanggil AI Gartic',
    });
  }
});

// AI Gemini Server-side Feature 3: Dynamic Arabic Quiz Generator
app.post('/api/gemini/generate-quiz', async (req: Request, res: Response) => {
  try {
    const { category, difficulty } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      res.json({
        success: false,
        message: 'GEMINI_API_KEY belum disetel, menggunakan kuis bawaan aplikasi.',
      });
      return;
    }

    const prompt = `Buatkan 5 soal latihan mufrodat Bahasa Arab pilihan ganda untuk kategori "${category || 'Kehidupan Sehari-hari'}" tingkat ${difficulty || 'pemula'}.
Setiap soal harus memiliki:
- Pertanyaan (dalam bahasa Indonesia atau menyajikan mufrodat Arab)
- 4 Pilihan jawaban (options A, B, C, D)
- Kunci jawaban yang benar (correctAnswer)
- Penjelasan singkat (explanation) dengan harakat dan arti

Format output JSON:
{
  "questions": [
    {
      "id": 1,
      "question": "Apa arti dari kata 'سَيَّارَةٌ' (Sayyarah)?",
      "arabic": "سَيَّارَةٌ",
      "options": ["Mobil", "Sepeda", "Pesawat", "Kereta"],
      "correctAnswer": "Mobil",
      "explanation": "سَيَّارَةٌ (Sayyarah) artinya Mobil. Bentuk jamaknya سَيَّارَاتٌ."
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, questions: parsed.questions || [] });
  } catch (error: any) {
    console.error('Quiz Generation Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export default app without app.listen (crucial for Vercel Serverless)
export default app;
