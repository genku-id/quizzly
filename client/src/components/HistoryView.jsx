import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Users, HelpCircle, Trash2, ChevronDown, ChevronUp, AlertCircle, RefreshCw } from 'lucide-react';

export default function HistoryView() {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
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

  const handleClearAll = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/history`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setHistoryList([]);
        setConfirmClearAll(false);
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
              Catatan hasil kuis, peringkat juara, dan skor akhir seluruh peserta.
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
                Semua data skor dan riwayat permainan akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
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
        ) : historyList.length === 0 ? (
          /* Empty state */
          <div className="py-16 text-center text-gray-400">
            <div className="w-16 h-16 bg-purple-50 text-purple-300 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-700">Belum Ada Riwayat</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
              Mainkan salah satu kuis sampai selesai (layar Podium), maka hasil skor para peserta akan otomatis tersimpan di sini.
            </p>
          </div>
        ) : (
          /* History items list */
          <div className="space-y-4">
            {historyList.map((item) => {
              const isExpanded = expandedId === item.id;
              const top1 = item.podium?.[0];
              const top2 = item.podium?.[1];
              const top3 = item.podium?.[2];

              return (
                <div
                  key={item.id}
                  className="border-2 border-gray-100 hover:border-purple-200 rounded-2xl p-4 sm:p-5 transition-all bg-white shadow-xs"
                >
                  {/* Top line: title, date, delete */}
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-gray-800 flex items-center gap-2">
                        <span>{item.quizTitle}</span>
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-purple-600" />
                          {formatDate(item.playedAt)}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          {item.totalPlayers} Peserta
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                          {item.totalQuestions} Soal
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      {confirmDeleteId === item.id ? (
                        <div className="flex items-center space-x-1.5 bg-red-50 p-1 rounded-xl">
                          <span className="text-[11px] font-bold text-red-600 px-1">Hapus?</span>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-2 py-1 rounded-lg"
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
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          title="Hapus riwayat sesi ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Podium Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-purple-50/50 rounded-xl border border-purple-100 mb-3 text-xs">
                    {/* Juara 1 */}
                    <div className="flex items-center space-x-2 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      <span className="text-xl">🥇</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Juara 1</div>
                        <div className="font-extrabold text-gray-800 truncate">{top1 ? top1.name : '-'}</div>
                      </div>
                      <div className="font-black text-amber-600 text-xs">{top1 ? `${top1.score.toLocaleString()} pts` : '-'}</div>
                    </div>

                    {/* Juara 2 */}
                    <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-xl">🥈</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Juara 2</div>
                        <div className="font-extrabold text-gray-800 truncate">{top2 ? top2.name : '-'}</div>
                      </div>
                      <div className="font-black text-slate-600 text-xs">{top2 ? `${top2.score.toLocaleString()} pts` : '-'}</div>
                    </div>

                    {/* Juara 3 */}
                    <div className="flex items-center space-x-2 bg-amber-900/10 p-2 rounded-lg border border-amber-800/20">
                      <span className="text-xl">🥉</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Juara 3</div>
                        <div className="font-extrabold text-gray-800 truncate">{top3 ? top3.name : '-'}</div>
                      </div>
                      <div className="font-black text-amber-800 text-xs">{top3 ? `${top3.score.toLocaleString()} pts` : '-'}</div>
                    </div>
                  </div>

                  {/* Toggle Accordion for Full Leaderboard */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="w-full flex items-center justify-between text-xs font-bold text-[#46178f] hover:bg-purple-50/80 p-2 rounded-xl transition-all cursor-pointer"
                  >
                    <span>
                      {isExpanded ? 'Tutup Daftar Peserta' : `Lihat Semua Peserta (${item.leaderboard?.length || 0})`}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* Expanded Full Leaderboard Table */}
                  {isExpanded && (
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
                          {item.leaderboard && item.leaderboard.length > 0 ? (
                            item.leaderboard.map((p, idx) => (
                              <tr key={idx} className={idx < 3 ? 'bg-amber-50/40 font-semibold' : ''}>
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
    </div>
  );
}
