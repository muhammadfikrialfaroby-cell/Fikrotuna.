import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MufrodatItem, ChatMessage, User } from '../types';
import { INITIAL_MUFRODAT } from '../data/mufrodatData';
import { audioService } from '../services/audioService';
import { authService } from '../services/authService';
import confetti from 'canvas-confetti';
import {
  Palette,
  Eraser,
  RotateCcw,
  Trash2,
  Send,
  Volume2,
  Sparkles,
  Trophy,
  Clock,
  CheckCircle,
  HelpCircle,
  Users,
  Lightbulb,
  Keyboard,
  Shuffle,
  Play,
} from 'lucide-react';

interface GarticGameProps {
  user: User;
  customMufrodat?: MufrodatItem[];
}

const COLORS = [
  '#000000',
  '#ef4444',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#78350f',
  '#ffffff',
];

const BOT_PLAYERS = ['Zaid', 'Fatimah', 'Ahmad', 'Aisyah', 'Umar'];

export const GarticGame: React.FC<GarticGameProps> = ({ user, customMufrodat = [] }) => {
  const allWords = [...INITIAL_MUFRODAT, ...customMufrodat];

  // Game Mode: 'draw' (Player draws, bots/AI guess) or 'guess' (System draws, player guesses)
  const [gameMode, setGameMode] = useState<'draw' | 'guess'>('draw');

  // Canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);

  // Game State
  const [currentWord, setCurrentWord] = useState<MufrodatItem>(allWords[0]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isGameActive, setIsGameActive] = useState(false);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [hasGuessedCorrectly, setHasGuessedCorrectly] = useState(false);
  const [revealedHint, setRevealedHint] = useState<string>('');

  // Chat & Guesses
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputGuess, setInputGuess] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Virtual Arabic Keyboard visibility
  const [showArabicKeyboard, setShowArabicKeyboard] = useState(false);

  // AI Assistant status
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Pick a new word
  const pickNewWord = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * allWords.length);
    const selected = allWords[randomIndex];
    setCurrentWord(selected);
    setTimeLeft(60);
    setHasGuessedCorrectly(false);
    clearCanvas();

    // Create hint masks
    const chars = selected.indonesian.split('');
    const mask = chars.map((c, i) => (c === ' ' ? ' ' : i === 0 ? c : '_')).join(' ');
    setRevealedHint(mask);

    setChatMessages((prev) => [
      ...prev,
      {
        id: `sys_${Date.now()}`,
        sender: 'Sistem Gartic',
        role: 'system',
        text:
          gameMode === 'draw'
            ? `Ronde baru! Gambar kata: "${selected.indonesian}" (${selected.arabic})`
            : `Ronde baru! Tebak gambar yang muncul di kanvas!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [allWords, gameMode]);

  // Start new round
  const startRound = () => {
    setIsGameActive(true);
    pickNewWord();
  };

  // Timer countdown
  useEffect(() => {
    if (!isGameActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleRoundTimeout();
          return 60;
        }
        // Auto bot guesses in Draw mode
        if (gameMode === 'draw' && prev % 8 === 0 && !hasGuessedCorrectly) {
          triggerBotGuess();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameActive, gameMode, hasGuessedCorrectly, currentWord]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Round timeout handler
  const handleRoundTimeout = () => {
    audioService.playWrongSound();
    setChatMessages((prev) => [
      ...prev,
      {
        id: `sys_time_${Date.now()}`,
        sender: 'Sistem Gartic',
        role: 'system',
        text: `Waktu habis! Jawabannya adalah: ${currentWord.arabic} (${currentWord.indonesian})`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setTimeout(() => {
      setRound((r) => r + 1);
      pickNewWord();
    }, 2500);
  };

  // Bot guessing behavior in Draw mode
  const triggerBotGuess = () => {
    const bot = BOT_PLAYERS[Math.floor(Math.random() * BOT_PLAYERS.length)];
    const isLucky = Math.random() < 0.25;

    let guessText = '';
    if (isLucky) {
      guessText = currentWord.indonesian;
    } else {
      const wrongWord = allWords[Math.floor(Math.random() * allWords.length)].indonesian;
      guessText = wrongWord;
    }

    const isMatch =
      guessText.toLowerCase().trim() === currentWord.indonesian.toLowerCase().trim();

    setChatMessages((prev) => [
      ...prev,
      {
        id: `bot_${Date.now()}_${Math.random()}`,
        sender: bot,
        role: 'bot',
        text: guessText,
        isCorrect: isMatch,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    if (isMatch && !hasGuessedCorrectly) {
      handleCorrectGuess(bot);
    }
  };

  // Correct guess handler
  const handleCorrectGuess = (guesserName: string) => {
    setHasGuessedCorrectly(true);
    audioService.playCorrectSound();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    const points = Math.max(10, Math.floor(timeLeft * 2.5));
    setScore((s) => s + points);
    authService.addScore(points, points);

    setChatMessages((prev) => [
      ...prev,
      {
        id: `win_${Date.now()}`,
        sender: 'Sistem Gartic',
        role: 'system',
        text: `🎉 Luar biasa! ${guesserName} menebak dengan benar! (+${points} poin)`,
        isCorrect: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    setTimeout(() => {
      setRound((r) => r + 1);
      pickNewWord();
    }, 3000);
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isGameActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save history for undo
    setStrokeHistory((prev) => [...prev.slice(-10), ctx.getImageData(0, 0, canvas.width, canvas.height)]);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#ffffff' : brushColor;
    ctx.lineWidth = isEraser ? brushSize * 2.5 : brushSize;

    setIsDrawing(true);
    audioService.playDrawSound();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isGameActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const undoLastStroke = () => {
    if (strokeHistory.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previousState = strokeHistory[strokeHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setStrokeHistory((prev) => prev.slice(0, -1));
  };

  // Handle Player Guess submission
  const handleSendGuess = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputGuess.trim() || !isGameActive) return;

    const guessText = inputGuess.trim();
    setInputGuess('');

    // Check if correct (either Arabic, Indonesian, or Latin transliteration)
    const normalizedGuess = guessText.toLowerCase().replace(/[\u064B-\u065F]/g, ''); // remove harakat for flexible match
    const targetIndonesian = currentWord.indonesian.toLowerCase();
    const targetLatin = currentWord.latin.toLowerCase();
    const targetArabic = currentWord.arabic.replace(/[\u064B-\u065F]/g, '');

    const isMatch =
      normalizedGuess === targetIndonesian ||
      normalizedGuess === targetLatin ||
      normalizedGuess.includes(targetIndonesian) ||
      guessText === currentWord.arabic ||
      guessText === targetArabic;

    setChatMessages((prev) => [
      ...prev,
      {
        id: `user_${Date.now()}`,
        sender: user.name,
        role: 'user',
        text: guessText,
        isCorrect: isMatch,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    if (isMatch && !hasGuessedCorrectly) {
      handleCorrectGuess(user.name);
    } else {
      audioService.playDrawSound();
    }
  };

  // Call Gemini AI server-side to guess or evaluate sketch
  const askGeminiToGuess = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsAiLoading(true);
    setAiMessage('AI Gemini sedang menganalisis gambar kanvas...');

    try {
      const imageBase64 = canvas.toDataURL('image/png');
      const res = await fetch('/api/gemini/gartic-guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentWord,
          drawingHints: currentWord.drawingHints.join(', '),
          imageBase64,
        }),
      });
      const data = await res.json();

      if (data.guesses && Array.isArray(data.guesses)) {
        data.guesses.forEach((g: any, index: number) => {
          setTimeout(() => {
            setChatMessages((prev) => [
              ...prev,
              {
                id: `ai_${Date.now()}_${index}`,
                sender: g.player || 'Gemini_Bot',
                role: 'bot',
                text: g.text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }, (index + 1) * 700);
        });
      }

      if (data.drawingFeedback) {
        setAiMessage(`🤖 Komentar AI: "${data.drawingFeedback}"`);
      } else {
        setAiMessage(null);
      }
    } catch {
      setAiMessage('AI bot: "Goresan yang mantap, ayo teruskan!"');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Initialize canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 680;
      canvas.height = 420;
      clearCanvas();
    }
    // Start automatically
    startRound();
  }, []);

  const arabicLetters = [
    'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر',
    'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف',
    'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي', 'ة', 'ء',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Top Game Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800">Gartic Mufrodat</h2>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  Ronde {round}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tebak dan gambar kosakata bahasa Arab secara interaktif
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => {
                setGameMode('draw');
                pickNewWord();
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
                gameMode === 'draw'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Mode Gambar</span>
            </button>
            <button
              onClick={() => {
                setGameMode('guess');
                pickNewWord();
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
                gameMode === 'guess'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Mode Tebak Cepat</span>
            </button>
          </div>

          {/* Timer & Scores */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-4 py-2 rounded-2xl">
              <Clock className="w-5 h-5 text-rose-500 animate-spin" style={{ animationDuration: '6s' }} />
              <div>
                <div className="text-[10px] uppercase font-bold text-rose-400">Waktu</div>
                <div className="text-lg font-black text-rose-600 leading-none">{timeLeft}s</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl">
              <Trophy className="w-5 h-5 text-amber-500" />
              <div>
                <div className="text-[10px] uppercase font-bold text-amber-500">Skor Game</div>
                <div className="text-lg font-black text-amber-700 leading-none">{score}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Word Clue Banner */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 p-3.5 rounded-2xl">
          {gameMode === 'draw' ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                Kata Yang Harus Kamu Gambar:
              </span>
              <span className="text-xl font-black text-emerald-700 bg-white px-3.5 py-1 rounded-xl shadow-xs border border-emerald-200">
                {currentWord.indonesian}
              </span>
              <span className="font-arabic text-2xl font-bold text-amber-700 bg-white px-3.5 py-0.5 rounded-xl shadow-xs border border-amber-200">
                {currentWord.arabic}
              </span>
              <button
                onClick={() => audioService.speakArabic(currentWord.arabic)}
                className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
                title="Dengarkan Lafal Arab"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Petunjuk Huruf:
              </span>
              <div className="font-mono text-xl font-bold tracking-widest text-emerald-800 bg-white px-4 py-1.5 rounded-xl border border-emerald-200">
                {revealedHint}
              </div>
              <span className="text-xs text-slate-500">
                (Ketik artinya dalam bahasa Indonesia atau Arab)
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={pickNewWord}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-slate-50 flex items-center gap-1.5 transition"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Ganti Kata
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas & Chat Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Canvas & Drawing Controls */}
        <div className="lg:col-span-8 space-y-4">
          {/* Canvas Box */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-emerald-100 relative overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-[380px] sm:h-[420px] bg-white rounded-2xl border-2 border-dashed border-slate-200 touch-none cursor-crosshair shadow-inner"
            />

            {/* Drawing Hint Bubbles */}
            <div className="absolute top-7 left-7 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium text-slate-600 border border-slate-200 shadow-xs flex items-center gap-1.5 pointer-events-none">
              <Lightbulb className="w-3 h-3 text-amber-500" />
              <span>Tips: {currentWord.drawingHints[0] || 'Gambar bentuk dasarnya'}</span>
            </div>

            {hasGuessedCorrectly && (
              <div className="absolute inset-0 bg-emerald-900/60 backdrop-blur-xs flex items-center justify-center rounded-2xl animate-fade-in">
                <div className="bg-white p-6 rounded-3xl text-center shadow-2xl max-w-sm mx-4 transform scale-105 transition">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Tebakan Benar!</h3>
                  <p className="font-arabic text-3xl font-bold text-emerald-700 my-2">
                    {currentWord.arabic}
                  </p>
                  <p className="text-sm font-semibold text-slate-600">
                    {currentWord.indonesian} ({currentWord.latin})
                  </p>
                  <p className="text-xs text-amber-600 font-bold mt-2">
                    Mempersiapkan ronde berikutnya...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Canvas Toolbar */}
          <div className="bg-white rounded-2xl p-3 shadow-xs border border-emerald-100 flex flex-wrap items-center justify-between gap-3">
            {/* Colors */}
            <div className="flex items-center gap-1.5">
              {COLORS.map((col) => (
                <button
                  key={col}
                  onClick={() => {
                    setBrushColor(col);
                    setIsEraser(false);
                  }}
                  className={`w-7 h-7 rounded-full border-2 transition transform hover:scale-110 ${
                    brushColor === col && !isEraser
                      ? 'border-emerald-600 ring-2 ring-emerald-300 scale-110'
                      : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: col }}
                  title={col}
                />
              ))}
            </div>

            {/* Brush Size Slider */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">Ukuran:</span>
              <input
                type="range"
                min="2"
                max="24"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-20 accent-emerald-600 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-slate-700 w-5">{brushSize}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEraser(!isEraser)}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 border transition ${
                  isEraser
                    ? 'bg-rose-500 text-white border-rose-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title="Penghapus"
              >
                <Eraser className="w-4 h-4" />
                <span className="hidden sm:inline">Penghapus</span>
              </button>

              <button
                onClick={undoLastStroke}
                className="p-2 rounded-xl text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition flex items-center gap-1"
                title="Kembalikan (Undo)"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Undo</span>
              </button>

              <button
                onClick={clearCanvas}
                className="p-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition flex items-center gap-1"
                title="Hapus Semua Kanvas"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Bersihkan</span>
              </button>

              {/* AI Gemini Guess Trigger */}
              <button
                onClick={askGeminiToGuess}
                disabled={isAiLoading}
                className="p-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs hover:from-teal-700 hover:to-emerald-700 transition flex items-center gap-1.5 disabled:opacity-50"
                title="Minta AI Gemini Menebak Gambar"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
                <span>{isAiLoading ? 'AI Menebak...' : 'Tanya AI Gemini'}</span>
              </button>
            </div>
          </div>

          {/* AI Feedback Banner */}
          {aiMessage && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span>{aiMessage}</span>
            </div>
          )}
        </div>

        {/* Right: Gartic.io Room Chat & Guesses Sidebar */}
        <div className="lg:col-span-4 flex flex-col h-[520px] bg-white rounded-3xl p-4 shadow-sm border border-emerald-100">
          {/* Room Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-800 text-sm">Room Tebak Gartic</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span>{BOT_PLAYERS.length + 1} Pemain</span>
            </div>
          </div>

          {/* Chat Feed */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2.5 rounded-2xl text-xs leading-relaxed transition ${
                  msg.isCorrect
                    ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-300 font-bold'
                    : msg.role === 'system'
                    ? 'bg-slate-100 text-slate-600 text-center italic text-[11px]'
                    : msg.role === 'user'
                    ? 'bg-emerald-50 text-slate-800 ml-4 border border-emerald-200'
                    : 'bg-slate-50 text-slate-800 mr-4 border border-slate-200'
                }`}
              >
                {msg.role !== 'system' && (
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-0.5">
                    <span className={msg.role === 'user' ? 'text-emerald-700' : 'text-slate-700'}>
                      {msg.sender}
                    </span>
                    <span>{msg.time}</span>
                  </div>
                )}
                <div>{msg.text}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Virtual Arabic Keyboard Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setShowArabicKeyboard(!showArabicKeyboard)}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg transition"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>{showArabicKeyboard ? 'Sembunyikan Keyboard Arab' : 'Keyboard Arab (Hijaiyah)'}</span>
              </button>
            </div>

            {/* Virtual Arabic Keyboard */}
            {showArabicKeyboard && (
              <div className="grid grid-cols-10 gap-1 p-2 bg-slate-50 rounded-xl mb-2 border border-slate-200">
                {arabicLetters.map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => setInputGuess((prev) => prev + char)}
                    className="font-arabic text-sm py-1 bg-white hover:bg-emerald-100 rounded border border-slate-200 text-slate-800 active:scale-95 transition"
                  >
                    {char}
                  </button>
                ))}
              </div>
            )}

            {/* Guess Input Form */}
            <form onSubmit={handleSendGuess} className="flex gap-2">
              <input
                type="text"
                value={inputGuess}
                onChange={(e) => setInputGuess(e.target.value)}
                placeholder="Ketik tebakanmu di sini..."
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs font-bold text-xs flex items-center justify-center transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
