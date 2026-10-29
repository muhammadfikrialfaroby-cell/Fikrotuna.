import React, { useState } from 'react';
import { MufrodatItem, User } from '../types';
import { CATEGORIES, INITIAL_MUFRODAT } from '../data/mufrodatData';
import { audioService } from '../services/audioService';
import { authService } from '../services/authService';
import {
  Volume2,
  Sparkles,
  Search,
  CheckCircle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  RotateCw,
  Lightbulb,
  X,
  ExternalLink,
} from 'lucide-react';

interface MateriSectionProps {
  user: User;
  customMufrodat?: MufrodatItem[];
}

export const MateriSection: React.FC<MateriSectionProps> = ({ user, customMufrodat = [] }) => {
  const allMufrodat = [...INITIAL_MUFRODAT, ...customMufrodat];

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'flashcard'>('grid');

  // Flashcard mode state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // AI Explain Modal State
  const [selectedItemForAi, setSelectedItemForAi] = useState<MufrodatItem | null>(null);
  const [aiData, setAiData] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Memorized IDs
  const [memorizedIds, setMemorizedIds] = useState<string[]>([]);

  // Filtered list
  const filteredList = allMufrodat.filter((item) => {
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.indonesian.toLowerCase().includes(q) ||
      item.latin.toLowerCase().includes(q) ||
      item.arabic.includes(q);
    return matchCategory && matchSearch;
  });

  const toggleMemorized = (id: string) => {
    if (memorizedIds.includes(id)) {
      setMemorizedIds((prev) => prev.filter((i) => i !== id));
    } else {
      setMemorizedIds((prev) => [...prev, id]);
      authService.addScore(15, 0, false, true);
      audioService.playCorrectSound();
    }
  };

  // Open AI Explainer Modal
  const handleOpenAiExplainer = async (item: MufrodatItem) => {
    setSelectedItemForAi(item);
    setAiData(null);
    setAiError(null);
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/gemini/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          arabicWord: item.arabic,
          meaning: item.indonesian,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setAiData(json.data);
      } else {
        setAiData({
          arabic: item.arabic,
          meaning: item.indonesian,
          transliteration: item.latin,
          exampleSentence: item.example,
          sentenceMeaning: item.exampleMeaning,
          memoryTrick: `Ingatlah gambar: ${item.drawingHints[0]}`,
        });
      }
    } catch {
      setAiData({
        arabic: item.arabic,
        meaning: item.indonesian,
        transliteration: item.latin,
        exampleSentence: item.example,
        sentenceMeaning: item.exampleMeaning,
        memoryTrick: `Visualisasikan "${item.indonesian}" saat melafalkan "${item.arabic}".`,
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="bg-amber-400/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 border border-amber-300/30 mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            Modul Pembelajaran Mufrodat
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Perkaya Kosakata Bahasa Arabmu
          </h1>
          <p className="text-emerald-100 text-sm mt-2 leading-relaxed">
            Pelajari mufrodat tematik berharakat lengkap, dengarkan audio pelafalan asli, dan gunakan bantuan AI Gemini untuk memahami akar kata serta tips mengingatnya.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kosakata (Indonesia, Arab, atau Latin)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              viewMode === 'grid' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            Katalog Kartu
          </button>
          <button
            onClick={() => setViewMode('flashcard')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              viewMode === 'flashcard' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            Mode Flashcard
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setFlashcardIndex(0);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 border ${
              selectedCategory === cat.id
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Flashcard Mode */}
      {viewMode === 'flashcard' && filteredList.length > 0 && (
        <div className="max-w-md mx-auto my-6">
          <div className="bg-slate-100 p-2 rounded-2xl flex items-center justify-between text-xs text-slate-600 font-bold mb-3">
            <span>Kartu {flashcardIndex + 1} dari {filteredList.length}</span>
            <span>Klik kartu untuk membalik</span>
          </div>

          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full h-80 bg-white rounded-3xl p-6 shadow-md border-2 border-emerald-100 flex flex-col items-center justify-center text-center cursor-pointer transition transform hover:scale-[1.02] relative"
          >
            <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
              <RotateCw className="w-3 h-3" />
              <span>Balik</span>
            </div>

            {!isFlipped ? (
              <div className="space-y-4">
                <span className="text-5xl">{filteredList[flashcardIndex].icon}</span>
                <div className="font-arabic text-4xl font-black text-emerald-800">
                  {filteredList[flashcardIndex].arabic}
                </div>
                <div className="text-slate-400 text-xs font-semibold">
                  (Klik untuk melihat arti bahasa Indonesia)
                </div>
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                <div className="text-2xl font-black text-slate-800">
                  {filteredList[flashcardIndex].indonesian}
                </div>
                <div className="text-sm font-semibold text-emerald-700">
                  {filteredList[flashcardIndex].latin}
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-xs text-emerald-900 mt-2">
                  <p className="font-arabic text-base font-bold text-emerald-800 mb-0.5">
                    {filteredList[flashcardIndex].example}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    "{filteredList[flashcardIndex].exampleMeaning}"
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-4 gap-3">
            <button
              onClick={() => {
                setIsFlipped(false);
                setFlashcardIndex((prev) => (prev > 0 ? prev - 1 : filteredList.length - 1));
              }}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => audioService.speakArabic(filteredList[flashcardIndex].arabic)}
              className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
              title="Lafalkan"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setIsFlipped(false);
                setFlashcardIndex((prev) => (prev < filteredList.length - 1 ? prev + 1 : 0));
              }}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      {/* Grid Mode */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredList.map((item) => {
            const isMemorized = memorizedIds.includes(item.id);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl p-5 shadow-xs border transition transform hover:-translate-y-1 relative flex flex-col justify-between ${
                  isMemorized
                    ? 'border-emerald-400 ring-2 ring-emerald-100'
                    : 'border-slate-200/80 hover:border-emerald-300 hover:shadow-md'
                }`}
              >
                {/* Top Badge & Audio */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{item.icon}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => audioService.speakArabic(item.arabic)}
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition"
                        title="Dengarkan Suara"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleMemorized(item.id)}
                        className={`p-2 rounded-xl transition ${
                          isMemorized
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-400 hover:text-emerald-600'
                        }`}
                        title={isMemorized ? 'Sudah Dihafal' : 'Tandai Sudah Hafal'}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Arabic Word with Harakat */}
                  <div className="font-arabic text-3xl font-black text-slate-800 text-right mb-1 tracking-wide">
                    {item.arabic}
                  </div>

                  {/* Latin & Indonesian */}
                  <div className="text-xs font-semibold text-emerald-700">{item.latin}</div>
                  <div className="text-base font-bold text-slate-800 mt-0.5">{item.indonesian}</div>

                  {/* Example Sentence */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 bg-slate-50/70 p-2.5 rounded-xl text-xs">
                    <div className="font-arabic text-right text-emerald-900 font-bold text-sm leading-relaxed mb-0.5">
                      {item.example}
                    </div>
                    <div className="text-[11px] text-slate-500 italic">
                      "{item.exampleMeaning}"
                    </div>
                  </div>
                </div>

                {/* Gemini AI Deep Dive Button */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenAiExplainer(item)}
                    className="w-full py-2 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-800 border border-emerald-200/70 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Bedah Kata (AI Ustadz)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredList.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Kosakata Tidak Ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1">
            Coba gunakan kata kunci lain atau pilih kategori "Semua Kategori".
          </p>
        </div>
      )}

      {/* AI Deep-Dive Modal (Gemini API Integration) */}
      {selectedItemForAi && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 max-h-[90vh] overflow-y-auto animate-fade-in relative">
            <button
              onClick={() => setSelectedItemForAi(null)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Bedah Kosakata AI</h3>
                <p className="text-xs text-slate-500">Analisis tata bahasa dan tips hafalan dari AI Gemini</p>
              </div>
            </div>

            {isAiLoading ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-600 font-medium">
                  Ustadz AI sedang menganalisis kata "{selectedItemForAi.arabic}"...
                </p>
              </div>
            ) : aiData ? (
              <div className="space-y-4 text-xs">
                {/* Word Banner */}
                <div className="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100">
                  <div className="font-arabic text-4xl font-black text-emerald-800 mb-1">
                    {aiData.harakat || aiData.arabic}
                  </div>
                  <div className="font-bold text-slate-800 text-sm">{aiData.meaning}</div>
                  <div className="text-[11px] text-emerald-700">{aiData.transliteration}</div>
                </div>

                {/* Grammar & Root Word Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Jenis Kata</span>
                    <span className="font-bold text-slate-800">{aiData.wordType || 'Isim (Kata Benda)'}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Bentuk Jamak</span>
                    <span className="font-arabic font-bold text-slate-800 text-sm">{aiData.pluralForm || '-'}</span>
                  </div>
                </div>

                {/* Example sentence */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                    Contoh Kalimat (Jumlah Mufidah)
                  </span>
                  <div className="font-arabic text-right text-base font-bold text-emerald-900 mb-0.5">
                    {aiData.exampleSentence}
                  </div>
                  <div className="text-slate-600 italic">{aiData.sentenceMeaning}</div>
                </div>

                {/* Memory trick */}
                {aiData.memoryTrick && (
                  <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-amber-900">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                      <span>Jembatan Keledai / Tips Menghafal</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{aiData.memoryTrick}</p>
                  </div>
                )}

                <button
                  onClick={() => audioService.speakArabic(aiData.arabic)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Dengarkan Pelafalan</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
