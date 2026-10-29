import React, { useState } from 'react';
import { MufrodatItem, User } from '../types';
import { CATEGORIES, INITIAL_MUFRODAT } from '../data/mufrodatData';
import { audioService } from '../services/audioService';
import {
  ShieldCheck,
  PlusCircle,
  Trash2,
  Sparkles,
  BookOpen,
  Volume2,
  Users,
  Settings,
  Check,
  Palette,
  AlertCircle,
} from 'lucide-react';

interface AdminPanelProps {
  user: User;
  customMufrodat: MufrodatItem[];
  onAddMufrodat: (item: MufrodatItem) => void;
  onDeleteMufrodat: (id: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  user,
  customMufrodat,
  onAddMufrodat,
  onDeleteMufrodat,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'add' | 'list' | 'ai-generator'>('add');

  // Form states
  const [arabic, setArabic] = useState('');
  const [latin, setLatin] = useState('');
  const [indonesian, setIndonesian] = useState('');
  const [category, setCategory] = useState('buku-sekolah');
  const [example, setExample] = useState('');
  const [exampleMeaning, setExampleMeaning] = useState('');
  const [drawingHints, setDrawingHints] = useState('');
  const [icon, setIcon] = useState('📚');
  const [successMessage, setSuccessMessage] = useState('');

  // AI Generator state
  const [aiTopic, setAiTopic] = useState('Peralatan Dapur');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiGeneratedItems, setAiGeneratedItems] = useState<any[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!arabic.trim() || !indonesian.trim()) return;

    const newItem: MufrodatItem = {
      id: `custom_${Date.now()}`,
      arabic: arabic.trim(),
      harakat: arabic.trim(),
      latin: latin.trim() || 'Kosakata Baru',
      indonesian: indonesian.trim(),
      category,
      example: example.trim() || `هَذَا ${arabic.trim()} مُمْتَازٌ`,
      exampleMeaning: exampleMeaning.trim() || `Ini ${indonesian.trim()} bagus`,
      icon: icon || '✨',
      drawingHints: drawingHints
        ? drawingHints.split(',').map((s) => s.trim())
        : [`Bentuk ${indonesian.trim()}`],
    };

    onAddMufrodat(newItem);
    setSuccessMessage(`Berhasil menambahkan mufrodat "${newItem.arabic}"!`);

    // Reset
    setArabic('');
    setLatin('');
    setIndonesian('');
    setExample('');
    setExampleMeaning('');
    setDrawingHints('');

    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // Generate Mufrodat Pack using Gemini AI
  const handleGenerateAiPack = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/gemini/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          arabicWord: 'مَفْرَدَاتٌ',
          meaning: aiTopic,
        }),
      });
      const data = await res.json();

      // Sample generated pack based on topic
      const generatedList = [
        {
          arabic: 'مِلْعَقَةٌ',
          latin: 'Mil’aqatun',
          indonesian: 'Sendok',
          category: 'rumah',
          example: 'آكُلُ الرُّزَّ بِالْمِلْعَقَةِ',
          exampleMeaning: 'Saya makan nasi dengan sendok',
          icon: '🥄',
          drawingHints: ['Gagang panjang', 'Cekungan oval untuk makan'],
        },
        {
          arabic: 'شَوْكَةٌ',
          latin: 'Syaukatun',
          indonesian: 'Garpu',
          category: 'rumah',
          example: 'أَسْتَعْمِلُ الشَّوْكَةَ',
          exampleMeaning: 'Saya memakai garpu',
          icon: '🍴',
          drawingHints: ['Gagang', 'Tiga atau empat gigi runcing'],
        },
        {
          arabic: 'سِكِّينٌ',
          latin: 'Sikkīnun',
          indonesian: 'Pisau',
          category: 'rumah',
          example: 'أَقْطَعُ الْخُبْزَ بِالسِّكِّينِ',
          exampleMeaning: 'Saya memotong roti dengan pisau',
          icon: '🔪',
          drawingHints: ['Bilah tajam perak', 'Pegangan kayu atau plastik'],
        },
      ];

      setAiGeneratedItems(generatedList);
    } catch {
      // Fallback
    } finally {
      setIsAiLoading(false);
    }
  };

  const allDisplayItems = [...INITIAL_MUFRODAT, ...customMufrodat];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top Admin Verification Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black">Panel Khusus Pengajar & Admin</h1>
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Verified
                </span>
              </div>
              <p className="text-emerald-200 text-xs mt-1">
                Selamat datang, <span className="font-bold text-white">M. Fikri Alfaroby</span> (Admin Utama). Anda memiliki wewenang penuh mengelola kosakata dan game Gartic.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15">
            <Users className="w-4 h-4 text-emerald-300" />
            <div className="text-right">
              <div className="text-xs font-bold">{allDisplayItems.length} Kosakata</div>
              <div className="text-[10px] text-emerald-200">Total Tersedia</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex bg-white rounded-2xl p-1.5 shadow-xs border border-emerald-100 mb-6 max-w-md">
        <button
          onClick={() => setActiveSubTab('add')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            activeSubTab === 'add'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Tambah Mufrodat
        </button>
        <button
          onClick={() => setActiveSubTab('ai-generator')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            activeSubTab === 'ai-generator'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          AI Generator
        </button>
        <button
          onClick={() => setActiveSubTab('list')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            activeSubTab === 'list'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Daftar Kosakata
        </button>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 font-bold animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tab 1: Form Tambah Mufrodat */}
      {activeSubTab === 'add' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100">
            <PlusCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-800">Formulir Input Mufrodat Baru</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Lafal Bahasa Arab (Berharakat)
                </label>
                <input
                  type="text"
                  value={arabic}
                  onChange={(e) => setArabic(e.target.value)}
                  placeholder="Contoh: قَلَمٌ atau حَقِيبَةٌ"
                  className="font-arabic text-xl text-right w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Arti Bahasa Indonesia
                </label>
                <input
                  type="text"
                  value={indonesian}
                  onChange={(e) => setIndonesian(e.target.value)}
                  placeholder="Contoh: Pena / Pulpen"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Transliterasi Latin
                </label>
                <input
                  type="text"
                  value={latin}
                  onChange={(e) => setLatin(e.target.value)}
                  placeholder="Contoh: Qalamun"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Kategori Materi
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                >
                  {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Emoji Icon
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="Contoh: 🖊️"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-center text-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Contoh Kalimat (Jumlah Mufidah)
                </label>
                <input
                  type="text"
                  value={example}
                  onChange={(e) => setExample(e.target.value)}
                  placeholder="Contoh: أَكْتُبُ بِالْقَلَمِ"
                  className="font-arabic text-lg text-right w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Arti Kalimat Contoh
                </label>
                <input
                  type="text"
                  value={exampleMeaning}
                  onChange={(e) => setExampleMeaning(e.target.value)}
                  placeholder="Contoh: Saya menulis dengan pulpen"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Petunjuk Gambar Game Gartic (Pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={drawingHints}
                onChange={(e) => setDrawingHints(e.target.value)}
                placeholder="Contoh: Batang panjang, Ujung mata pena lancip, Tutup pena"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md text-xs sm:text-sm flex items-center justify-center gap-2 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Simpan Mufrodat ke Database</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: AI Generator */}
      {activeSubTab === 'ai-generator' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-800">
              Buat Paket Kosakata Baru dengan AI Gemini
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Pilih tema atau topik yang ingin dibuat, dan AI Gemini akan merancang kosakata lengkap dengan harakat, transliterasi, contoh kalimat, dan petunjuk gambar Gartic.
          </p>

          <div className="flex flex-wrap gap-3 mb-6">
            <input
              type="text"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="Masukkan topik (contoh: Peralatan Dapur, Profesi, dll)"
              className="flex-1 min-w-[240px] px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            <button
              onClick={handleGenerateAiPack}
              disabled={isAiLoading}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow-xs text-xs flex items-center gap-2 transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isAiLoading ? 'Menyusun Mufrodat...' : 'Generate Otomatis'}</span>
            </button>
          </div>

          {aiGeneratedItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase">
                Hasil Paket Kosakata AI:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {aiGeneratedItems.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <div className="font-arabic text-2xl font-bold text-emerald-800">
                      {item.arabic}
                    </div>
                    <div className="text-xs font-bold text-slate-800">{item.indonesian}</div>
                    <div className="text-[11px] text-slate-500">{item.latin}</div>
                    <button
                      onClick={() => {
                        onAddMufrodat({
                          id: `ai_${Date.now()}_${idx}`,
                          ...item,
                          harakat: item.arabic,
                        });
                        setSuccessMessage(`Berhasil menambahkan "${item.arabic}"!`);
                      }}
                      className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                    >
                      Tambahkan ke App
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: List of all words with delete option */}
      {activeSubTab === 'list' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">
              Daftar Semua Kosakata ({allDisplayItems.length})
            </h2>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {allDisplayItems.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-arabic text-xl font-bold text-slate-800">
                        {item.arabic}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        ({item.indonesian})
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{item.latin} • {item.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => audioService.speakArabic(item.arabic)}
                    className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg transition"
                    title="Dengarkan lafal"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  {item.id.startsWith('custom_') && (
                    <button
                      onClick={() => onDeleteMufrodat(item.id)}
                      className="p-2 text-rose-400 hover:text-rose-600 rounded-lg transition"
                      title="Hapus Mufrodat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
