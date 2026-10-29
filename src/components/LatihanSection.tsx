import React, { useState } from 'react';
import { User, QuizQuestion } from '../types';
import { INITIAL_MUFRODAT } from '../data/mufrodatData';
import { audioService } from '../services/audioService';
import { authService } from '../services/authService';
import confetti from 'canvas-confetti';
import {
  Award,
  Sparkles,
  CheckCircle,
  XCircle,
  HelpCircle,
  RotateCcw,
  Volume2,
  Trophy,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface LatihanSectionProps {
  user: User;
}

const DEFAULT_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'Apa arti dari mufrodat bahasa Arab di bawah ini?',
    arabic: 'سَيَّارَةٌ',
    options: ['Mobil', 'Sepeda', 'Pesawat', 'Kereta Api'],
    correctAnswer: 'Mobil',
    explanation: 'سَيَّارَةٌ (Sayyāratun) artinya Mobil. Bentuk jamaknya سَيَّارَاتٌ.',
  },
  {
    id: 2,
    question: 'Manakah bahasa Arab yang tepat untuk kata "Buku"?',
    options: ['قَلَمٌ', 'كِتَابٌ', 'سَبُّورَةٌ', 'مِمْسَحَةٌ'],
    correctAnswer: 'كِتَابٌ',
    explanation: 'كِتَابٌ (Kitābun) artinya Buku. Berasal dari kata كَتَبَ (menulis).',
  },
  {
    id: 3,
    question: 'Apa arti dari kata "قِطٌّ" (Qiththun)?',
    arabic: 'قِطٌّ',
    options: ['Anjing', 'Ikan', 'Kucing', 'Singa'],
    correctAnswer: 'Kucing',
    explanation: 'قِطٌّ (Qiththun) artinya Kucing. Sinonimnya adalah هِرٌّ.',
  },
  {
    id: 4,
    question: 'Manakah mufrodat yang berarti "Rumah"?',
    options: ['بَابٌ', 'بَيْتٌ', 'نَافِذَةٌ', 'مَكْتَبٌ'],
    correctAnswer: 'بَيْتٌ',
    explanation: 'بَيْتٌ (Baitun) artinya Rumah. Jamaknya بُيُوتٌ.',
  },
  {
    id: 5,
    question: 'Apa arti dari kata "تُفَّاحَةٌ" (Tuffāhatun)?',
    arabic: 'تُفَّاحَةٌ',
    options: ['Pisang', 'Jeruk', 'Anggur', 'Apel'],
    correctAnswer: 'Apel',
    explanation: 'تُفَّاحَةٌ (Tuffāhatun) artinya Buah Apel.',
  },
  {
    id: 6,
    question: 'Anggota tubuh "عَيْنٌ" (‘Ainun) artinya apa?',
    arabic: 'عَيْنٌ',
    options: ['Hidung', 'Telinga', 'Mata', 'Tangan'],
    correctAnswer: 'Mata',
    explanation: 'عَيْنٌ (‘Ainun) artinya Mata. Jamaknya أَعْيُنٌ atau عُيُونٌ.',
  },
];

export const LatihanSection: React.FC<LatihanSectionProps> = ({ user }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(DEFAULT_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // AI Quiz Generator loading
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (opt: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(opt);
  };

  const handleConfirmAnswer = () => {
    if (!selectedOption || isAnswerSubmitted) return;

    setIsAnswerSubmitted(true);
    const isCorrect = selectedOption === currentQ.correctAnswer;

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      audioService.playCorrectSound();
      authService.addScore(25, 0, true, false);
    } else {
      audioService.playWrongSound();
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsCompleted(true);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setCorrectCount(0);
    setIsCompleted(false);
  };

  // Generate dynamic quiz with Gemini AI
  const handleGenerateAiQuiz = async () => {
    setIsAiLoading(true);
    setAiNotice(null);
    try {
      const res = await fetch('/api/gemini/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'Kehidupan Sehari-hari', difficulty: 'menengah' }),
      });
      const data = await res.json();
      if (data.success && data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        handleRestart();
        setAiNotice('✨ 5 Soal baru berhasil dibuat oleh AI Gemini!');
      } else {
        setAiNotice('Gagal membuat soal AI baru, menggunakan bank soal default.');
      }
    } catch {
      setAiNotice('Koneksi AI gagal, menggunakan bank soal default.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 mb-6">
        <div>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Latihan Mandiri
          </span>
          <h2 className="text-xl font-bold text-slate-800 mt-1">Uji Pemahaman Mufrodat</h2>
          <p className="text-xs text-slate-500">
            Jawab pertanyaan untuk mendapatkan XP dan menaikkan level akunmu!
          </p>
        </div>

        <button
          onClick={handleGenerateAiQuiz}
          disabled={isAiLoading}
          className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{isAiLoading ? 'Membuat Soal AI...' : 'Generate Kuis AI Gemini'}</span>
        </button>
      </div>

      {aiNotice && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{aiNotice}</span>
        </div>
      )}

      {!isCompleted ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100">
          {/* Progress bar */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>Soal {currentIndex + 1} dari {questions.length}</span>
            <span className="text-emerald-700">Benar: {correctCount}</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-6">
            <div
              className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          <div className="mb-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 leading-snug">
              {currentQ.question}
            </h3>

            {currentQ.arabic && (
              <div className="my-4 p-4 bg-emerald-50/70 rounded-2xl text-center border border-emerald-100 flex items-center justify-center gap-3">
                <span className="font-arabic text-4xl sm:text-5xl font-black text-emerald-800 tracking-wide">
                  {currentQ.arabic}
                </span>
                <button
                  onClick={() => audioService.speakArabic(currentQ.arabic || '')}
                  className="p-2 bg-white rounded-xl shadow-xs text-emerald-700 hover:bg-emerald-50 transition"
                  title="Dengarkan lafal"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              const isCorrect = opt === currentQ.correctAnswer;

              let style = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-emerald-50/50 hover:border-emerald-300';

              if (isAnswerSubmitted) {
                if (isCorrect) {
                  style = 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold';
                } else if (isSelected && !isCorrect) {
                  style = 'bg-rose-100 border-rose-500 text-rose-900';
                } else {
                  style = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                }
              } else if (isSelected) {
                style = 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold ring-2 ring-emerald-200';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(opt)}
                  disabled={isAnswerSubmitted}
                  className={`w-full p-4 rounded-2xl border-2 text-left text-sm font-semibold transition flex items-center justify-between ${style}`}
                >
                  <span className="font-arabic text-lg">{opt}</span>
                  {isAnswerSubmitted && isCorrect && (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  )}
                  {isAnswerSubmitted && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-rose-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {isAnswerSubmitted && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-6 text-xs text-slate-700 animate-fade-in">
              <span className="font-bold text-emerald-800 block mb-1">Penjelasan:</span>
              <p>{currentQ.explanation}</p>
            </div>
          )}

          {/* Action button */}
          {!isAnswerSubmitted ? (
            <button
              onClick={handleConfirmAnswer}
              disabled={!selectedOption}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 text-sm transition disabled:opacity-40"
            >
              Kirim Jawaban
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md text-sm transition flex items-center justify-center gap-2"
            >
              <span>{currentIndex < questions.length - 1 ? 'Soal Berikutnya' : 'Lihat Hasil Kuis'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        /* Results Screen */
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-emerald-100 text-center animate-fade-in">
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <Trophy className="w-10 h-10" />
          </div>

          <h3 className="text-2xl font-black text-slate-800">Kuis Selesai!</h3>
          <p className="text-xs text-slate-500 mt-1">
            Kerja bagus! Terus asah kemampuan mufrodatmu setiap hari.
          </p>

          <div className="my-6 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 max-w-sm mx-auto">
            <div className="text-xs font-bold uppercase text-emerald-600">Skor Akhir</div>
            <div className="text-4xl font-black text-emerald-800 my-1">
              {Math.round((correctCount / questions.length) * 100)}%
            </div>
            <div className="text-xs text-slate-600">
              Menjawab benar {correctCount} dari {questions.length} soal (+{correctCount * 25} XP)
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleRestart}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ulangi Kuis</span>
            </button>
            <button
              onClick={handleGenerateAiQuiz}
              disabled={isAiLoading}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Soal AI Baru</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
