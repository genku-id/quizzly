import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Calendar, 
  Users, 
  HelpCircle, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  RefreshCw, 
  Folder, 
  FolderOpen,
  Gamepad2,
  Clock
} from 'lucide-react';

export default function HistoryView() {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Track open quiz groups (Set or Array of keys)
  const [expandedQuizKey, setExpandedQuizKey] = useState(null);
  
  // Track open leaderboard table inside a session
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteQuizGroup, setConfirmDeleteQuizGroup] = useState(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/history`);
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Group history by Quiz
  const quizGroups = useMemo(() => {
    const map = new Map();
    historyList.forEach((item) => {
      const key = item.quizId || item.quizTitle || 'uncategorized';
      if (!map.has(key)) {
        map.set(key, {
          key,
          quizId: item.quizId,
          quizTitle: item.quizTitle,
          totalQuestions: item.totalQuestions,
          sessions: [],
        });
      }
      map.get(key).sessions.push(item);
    });

    // Automatically expand the first quiz group by default if none is opened
    const groups = Array.from(map.values());
    return groups;
  }, [historyList]);

  // Set default expanded group to the first one once loaded
  useEffect(() => {
    if (quizGroups.length > 0 && expandedQuizKey === null) {
      setExpandedQuizKey(quizGroups[0].key);
    }
  }, [quizGroups, expandedQuizKey]);

  const handleDeleteItem = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/history/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setHistoryList((prev) => prev.filter((item) => item.id !== id));
        setConfirmDeleteId(null);
      }
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  };

  const handleDeleteGroup = async (sessions) => {
    try {
      for (const s of sessions) {
        await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/history/${s.id}`, {
          method: 'DELETE',
        });
      }
      const deletedIds = new Set(sessions.map((s) => s.id));
      setHistoryList((prev) => prev.filter((item) => !deletedIds.has(item.id)));
      setConfirmDeleteQuizGroup(null);
    } catch (err) {
      console.error('Failed to delete quiz history group:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/history`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setHistoryList([]);
        setConfirmClearAll(false);
        setExpandedQuizKey(null);
      }
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 text-gray-900">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-purple-100">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#46178f] flex items-center space-x-2">
              <Trophy className="w-7 h-7 text-amber-500 inline-block mr-1" />
              <span>Riwayat Permainan</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Dikelompokkan berdasarkan Judul Kuis & setiap sesi 1x main.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={fetchHistory}
              className="p-2 text-gray-500 hover:text-[#46178f] hover:bg-purple-50 rounded-xl transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {historyList.length > 0 && (
              <button
                onClick={() => setConfirmClearAll(true)}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer flex items-center space-x-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Semua</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Confirm Clear All */}
        {confirmClearAll && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border-2 border-red-200">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-black text-gray-800">Hapus Semua Riwayat?</h3>
              <p className="text-xs text-gray-500 mt-1 mb-5">
                Semua data skor dari semua kuis akan dihapus permanen.
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setConfirmClearAll(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-600 hover:bg-gray-100 text-xs"
                >
                  Batal
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
                >
                  Ya, Hapus Semua
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && historyList.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <div className="w-10 h-10 border-4 border-[#46178f] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="font-semibold text-sm">Memuat riwayat permainan...</p>
          </div>
        ) : quizGroups.length === 0 ? (
          /* Empty state */
          <div className="py-16 text-center text-gray-400">
            <div className="w-16 h-16 bg-purple-50 text-purple-300 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-700">Belum Ada Riwayat</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
              Mainkan salah satu kuis sampai selesai (layar Podium), maka hasil skor akan otomatis tersimpan rapi per judul kuis di sini.
            </p>
          </div>
        ) : (
          /* Grouped by Quiz */
          <div className="space-y-5">
            {quizGroups.map((group) => {
              const isGroupOpen = expandedQuizKey === group.key;
              const totalSessions = group.sessions.length;
              const latestDate = group.sessions[0]?.playedAt;

              return (
                <div
                  key={group.key}
                  className={`border-2 rounded-2xl transition-all overflow-hidden ${
                    isGroupOpen
                      ? 'border-[#46178f] bg-purple-50/20 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {/* Quiz Header Bar (Click to Open / Close) */}
                  <div
                    onClick={() => setExpandedQuizKey(isGroupOpen ? null : group.key)}
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isGroupOpen ? 'bg-[#46178f] text-white shadow-md' : 'bg-purple-100 text-[#46178f]'
                      }`}>
                        {isGroupOpen ? <FolderOpen className="w-6 h-6" /> : <Folder className="w-6 h-6" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h2 className="text-lg sm:text-xl font-extrabold text-gray-800 truncate">
                            {group.quizTitle}
                          </h2>
                          <span className="bg-[#46178f]/10 text-[#46178f] text-[11px] font-black px-2 py-0.5 rounded-full whitespace-nowrap">
                            {totalSessions}x Main
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-purple-600" />
                            <span>Terakhir: {formatDate(latestDate)}</span>
                          </span>
                          <span className="hidden sm:inline-block">•</span>
                          <span className="hidden sm:flex items-center space-x-1">
                            <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                            <span>{group.totalQuestions} Soal</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-2">
                      <span className="text-xs font-bold text-gray-400 hidden sm:inline">
                        {isGroupOpen ? 'Tutup Sesi' : 'Buka Riwayat'}
                      </span>
                      <div className={`p-1.5 rounded-xl text-gray-400 hover:text-gray-700 transition-transform ${isGroupOpen ? 'rotate-180 text-[#46178f]' : ''}`}>
                        <ChevronDown className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* SESSIONS LIST UNDER THIS QUIZ */}
                  {isGroupOpen && (
                    <div className="p-4 sm:p-5 pt-2 border-t border-purple-100 bg-gray-50/50 space-y-4">
                      {/* Sub-header info */}
                      <div className="flex justify-between items-center text-xs text-gray-500 pb-1">
                        <span className="font-extrabold uppercase tracking-wider text-purple-900">
                          Daftar Sesi Permainan ({totalSessions}):
                        </span>

                        {confirmDeleteQuizGroup === group.key ? (
                          <div className="flex items-center space-x-1.5 bg-red-100 px-2 py-1 rounded-xl">
                            <span className="text-[11px] font-bold text-red-700">Hapus semua sesi kuis ini?</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGroup(group.sessions);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg"
                            >
                              Ya, Hapus
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteQuizGroup(null);
                              }}
                              className="text-gray-600 text-[11px] font-medium hover:underline"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteQuizGroup(group.key);
                            }}
                            className="text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer flex items-center space-x-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus Riwayat Kuis Ini</span>
                          </button>
                        )}
                      </div>

                      {/* Individual Session Cards */}
                      {group.sessions.map((session, idx) => {
                        const sessionNumber = totalSessions - idx; // e.g. Sesi #2 (newest), Sesi #1 (oldest)
                        const isTableOpen = expandedSessionId === session.id;
                        const top1 = session.podium?.[0];
                        const top2 = session.podium?.[1];
                        const top3 = session.podium?.[2];

                        return (
                          <div
                            key={session.id}
                            className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs transition-all hover:shadow-md"
                          >
                            {/* Session header */}
                            <div className="flex justify-between items-start gap-2 mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center">
                                  #{sessionNumber}
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-extrabold text-sm sm:text-base text-gray-800">
                                      Main ke-{sessionNumber}
                                    </span>
                                    {idx === 0 && (
                                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        Terbaru
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                                    <span className="flex items-center gap-1 font-medium">
                                      <Calendar className="w-3.5 h-3.5 text-purple-600" />
                                      {formatDate(session.playedAt)}
                                    </span>
                                    <span className="flex items-center gap-1 font-medium">
                                      <Users className="w-3.5 h-3.5 text-blue-600" />
                                      {session.totalPlayers} Peserta
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Delete session button */}
                              <div>
                                {confirmDeleteId === session.id ? (
                                  <div className="flex items-center space-x-1.5 bg-red-50 p-1 rounded-xl">
                                    <span className="text-[11px] font-bold text-red-600 px-1">Hapus?</span>
                                    <button
                                      onClick={() => handleDeleteItem(session.id)}
                                      className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg"
                                    >
                                      Ya
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="text-gray-600 text-[11px] px-1 font-medium hover:underline"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDeleteId(session.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                    title="Hapus sesi ini"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Podium Badges for this session (Dynamic based on winnerCount) */}
                            {session.podium && session.podium.length > 0 && (
                              <div className="flex flex-wrap gap-2 p-3 bg-purple-50/40 rounded-xl border border-purple-100 mb-3 text-xs">
                                {session.podium.map((winner) => (
                                  <div
                                    key={winner.rank}
                                    className={`flex-1 min-w-[140px] flex items-center space-x-2 p-2 rounded-lg border ${
                                      winner.rank === 1
                                        ? 'bg-amber-50/90 border-amber-300'
                                        : winner.rank === 2
                                        ? 'bg-slate-50/90 border-slate-300'
                                        : winner.rank === 3
                                        ? 'bg-amber-900/10 border-amber-800/20'
                                        : 'bg-white border-purple-200'
                                    }`}
                                  >
                                    <span className="text-xl">
                                      {winner.rank === 1 ? '🥇' : winner.rank === 2 ? '🥈' : winner.rank === 3 ? '🥉' : '🏅'}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-[9px] font-black uppercase tracking-wider text-purple-900">
                                        Juara {winner.rank}
                                      </div>
                                      <div className="font-extrabold text-gray-800 truncate">{winner.name}</div>
                                    </div>
                                    <div className="font-black text-[#46178f] text-xs">
                                      {winner.score.toLocaleString()} pts
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Toggle Table for All Participants */}
                            <button
                              onClick={() => setExpandedSessionId(isTableOpen ? null : session.id)}
                              className="w-full flex items-center justify-between text-xs font-bold text-[#46178f] hover:bg-purple-50/80 p-2 rounded-xl transition-all cursor-pointer"
                            >
                              <span>
                                {isTableOpen ? 'Tutup Daftar Peserta' : `Lihat Semua Nilai Peserta (${session.leaderboard?.length || 0} orang)`}
                              </span>
                              {isTableOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {/* Full Leaderboard Table */}
                            {isTableOpen && (
                              <div className="mt-3 pt-3 border-t border-gray-100 overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="border-b border-gray-200 text-gray-500 uppercase text-[10px] tracking-wider">
                                      <th className="py-2 px-3 w-12 text-center">Rank</th>
                                      <th className="py-2 px-3">Nama Pemain</th>
                                      <th className="py-2 px-3 text-right">Skor Akhir</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {session.leaderboard && session.leaderboard.length > 0 ? (
                                      session.leaderboard.map((p, pIdx) => (
                                        <tr key={pIdx} className={pIdx < 3 ? 'bg-amber-50/40 font-semibold' : ''}>
                                          <td className="py-2 px-3 text-center font-bold text-gray-500">
                                            {p.rank === 1 ? '🥇 1' : p.rank === 2 ? '🥈 2' : p.rank === 3 ? '🥉 3' : `#${p.rank}`}
                                          </td>
                                          <td className="py-2 px-3 font-bold text-gray-800">{p.name}</td>
                                          <td className="py-2 px-3 text-right font-black text-[#46178f]">
                                            {p.score.toLocaleString()} pts
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan="3" className="py-3 text-center text-gray-400">
                                          Tidak ada data peserta.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
