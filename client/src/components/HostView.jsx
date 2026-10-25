import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../services/socket';
import { soundManager } from '../services/audio';
import { ANSWER_SHAPES, LOBBY_TRACKS } from '../constants/theme';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  Users,
  Play,
  ArrowRight,
  Trophy,
  Check,
  X,
  Flame,
  Maximize2,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Music
} from 'lucide-react';

export default function HostView({ onSwitchToCreate, onEditQuiz }) {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [previewQuizId, setPreviewQuizId] = useState(null);
  const [pin, setPin] = useState(null);
  const [step, setStep] = useState('SELECT_QUIZ'); // SELECT_QUIZ, LOBBY, GET_READY, QUESTION, RESULT, LEADERBOARD, PODIUM

  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [timeLeft, setTimeLeft] = useState(20);
  const [answersCount, setAnswersCount] = useState(0);
  const [resultData, setResultData] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [podiumData, setPodiumData] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedLobbyTrack, setSelectedLobbyTrack] = useState(LOBBY_TRACKS[0]);

  const questionTimerRef = useRef(null);

  const fetchQuizzes = () => {
    fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/quizzes`)
      .then(res => res.json())
      .then(data => {
        setQuizzes(data);
        if (data.length > 0 && !selectedQuiz) {
          setSelectedQuiz(data[0]);
        }
      })
      .catch(err => console.error("Error fetching quizzes:", err));
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Socket listeners for host
  useEffect(() => {
    socket.on('host:room_created', (data) => {
      setPin(data.pin);
      setStep('LOBBY');
      setPlayers([]);
      soundManager.playMusic('lobby', selectedLobbyTrack.file, true);
    });

    socket.on('host:error', (data) => {
      alert(data.message || 'Terjadi kesalahan pada room host.');
    });

    socket.on('game:player_joined', (data) => {
      setPlayers(data.playerList || []);
    });

    socket.on('game:player_left', (data) => {
      setPlayers(data.playerList || []);
    });

    socket.on('game:get_ready', (data) => {
      soundManager.stopMusic();
      setStep('GET_READY');
      setCountdown(data.countdown);
      setCurrentQuestion(data);
    });

    socket.on('game:get_ready_tick', (data) => {
      setCountdown(data.countdown);
    });

    socket.on('game:question_start', (data) => {
      setStep('QUESTION');
      setCurrentQuestion(data);
      setTimeLeft(data.timeLimit);
      setAnswersCount(0);

      // Play corresponding suspense timer music
      const musicFile = data.timeLimit <= 10
        ? '/audio/answer_10sec.mp3'
        : data.timeLimit <= 20
        ? '/audio/answer_20sec.mp3'
        : '/audio/answer_30sec.mp3';

      soundManager.playMusic('timer', musicFile, false);

      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
      let t = data.timeLimit;
      questionTimerRef.current = setInterval(() => {
        t -= 1;
        setTimeLeft(t);
        if (t <= 0) {
          clearInterval(questionTimerRef.current);
        }
      }, 1000);
    });

    socket.on('game:answer_count_update', (data) => {
      setAnswersCount(data.answeredCount);
    });

    socket.on('game:question_result', (data) => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
      soundManager.stopMusic();
      soundManager.playSfx('correct', '/audio/correct.mp3');
      setResultData(data);
      setStep('RESULT');
    });

    socket.on('game:leaderboard', (data) => {
      soundManager.playSfx('points', '/audio/points.mp3');
      setLeaderboardData(data);
      setStep('LEADERBOARD');
    });

    socket.on('game:podium', (data) => {
      soundManager.stopMusic();
      soundManager.playMusic('podium', '/audio/podium.mp3', false);
      setPodiumData(data);
      setStep('PODIUM');

      try {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          confetti({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0 } });
          confetti({ particleCount: 100, angle: 120, spread: 55, origin: { x: 1 } });
        }, 500);
      } catch (e) {}
    });

    return () => {
      socket.off('host:room_created');
      socket.off('host:error');
      socket.off('game:player_joined');
      socket.off('game:player_left');
      socket.off('game:get_ready');
      socket.off('game:get_ready_tick');
      socket.off('game:question_start');
      socket.off('game:answer_count_update');
      socket.off('game:question_result');
      socket.off('game:leaderboard');
      socket.off('game:podium');
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, [selectedLobbyTrack]);

  const handleStartRoom = () => {
    if (!selectedQuiz) return;
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('host:create_room', { quizId: selectedQuiz.id });
  };

  const handleStartGame = () => {
    if (players.length === 0) {
      alert('Tunggu minimal 1 pemain untuk bergabung!');
      return;
    }
    socket.emit('host:start_game', { pin });
  };

  const handleAdvance = () => {
    socket.emit('host:advance', { pin });
  };

  const handleKick = (targetId) => {
    if (confirm('Keluarkan pemain ini dari room?')) {
      socket.emit('host:kick', { pin, targetPlayerId: targetId });
    }
  };

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleChangeLobbyTrack = (trackId) => {
    const track = LOBBY_TRACKS.find(t => t.id === trackId) || LOBBY_TRACKS[0];
    setSelectedLobbyTrack(track);
    if (step === 'LOBBY') {
      soundManager.playMusic('lobby', track.file, true);
    }
  };

  const handleDeleteQuiz = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Yakin ingin menghapus kuis ini? Tindakan tidak bisa dibatalkan.')) return;
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/quizzes/${id}`, {
        method: 'DELETE'
      });
      fetchQuizzes();
      if (selectedQuiz?.id === id) setSelectedQuiz(null);
    } catch (err) {
      alert('Gagal menghapus kuis.');
    }
  };

  const handleDuplicateQuiz = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/quizzes/${id}/duplicate`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchQuizzes();
      }
    } catch (err) {
      alert('Gagal menduplikat kuis.');
    }
  };

  const joinUrl = `${window.location.origin}?pin=${pin}`;

  return (
    <div className="w-full min-h-[calc(100vh-60px)] flex flex-col justify-between">
      {/* TOP CONTROLS BAR (HOST ONLY) */}
      <div className="flex justify-between items-center px-6 py-3 bg-black/20 backdrop-blur-md border-b border-white/10 text-white">
        <div className="flex items-center space-x-3">
          <span className="font-black text-xl text-amber-300 tracking-wide">Quizzly HOST</span>
          {pin && (
            <span className="bg-white/20 text-white font-mono px-3 py-1 rounded-full text-sm font-bold">
              PIN: {pin}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {step === 'LOBBY' && (
            <div className="flex items-center space-x-2 bg-white/15 px-3 py-1.5 rounded-xl border border-white/20 text-xs font-bold">
              <Music className="w-4 h-4 text-amber-300" />
              <select
                value={selectedLobbyTrack.id}
                onChange={(e) => handleChangeLobbyTrack(e.target.value)}
                className="bg-transparent text-white font-bold outline-none cursor-pointer"
              >
                {LOBBY_TRACKS.map(t => (
                  <option key={t.id} value={t.id} className="text-gray-900 font-bold">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
            title="Layar Penuh"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 1. SELECT QUIZ */}
      {step === 'SELECT_QUIZ' && (
        <div className="max-w-3xl mx-auto my-auto p-6 bg-white text-gray-900 rounded-3xl shadow-2xl w-full">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-2xl font-black text-[#46178f]">Daftar Kuis Anda</h2>
            <button
              onClick={onSwitchToCreate}
              className="text-xs font-bold text-[#46178f] hover:underline cursor-pointer"
            >
              + Buat Kuis Baru
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-6">Pilih kuis yang ingin dipandu, atau tinjau, edit, dan duplikat bank soal.</p>

          <div className="space-y-3 max-h-[48vh] overflow-y-auto mb-6 pr-1">
            {quizzes.map((q) => {
              const isSelected = selectedQuiz?.id === q.id;
              const isPreviewOpen = previewQuizId === q.id;

              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuiz(q)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#46178f] bg-purple-50/60 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-3">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-extrabold text-lg text-gray-800">{q.title}</h3>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#46178f] text-white flex items-center justify-center text-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{q.description || 'Kuis interaktif'}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs font-bold text-[#46178f] bg-purple-100 px-2.5 py-0.5 rounded-full">
                          {q.questions.length} Pertanyaan
                        </span>
                      </div>
                    </div>

                    {/* Action buttons (Preview, Edit, Duplicate, Delete) */}
                    <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setPreviewQuizId(isPreviewOpen ? null : q.id)}
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          isPreviewOpen ? 'bg-[#46178f] text-white' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                        title="Tinjau Pertanyaan"
                      >
                        {isPreviewOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => onEditQuiz(q)}
                        className="p-2 text-gray-500 hover:text-[#46178f] hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                        title="Edit Kuis"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleDuplicateQuiz(e, q.id)}
                        className="p-2 text-gray-500 hover:text-[#26890c] hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                        title="Duplikat Kuis"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleDeleteQuiz(e, q.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Hapus Kuis"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* PREVIEW ACCORDION */}
                  {isPreviewOpen && (
                    <div className="mt-4 pt-3 border-t border-purple-200 space-y-2 text-xs">
                      <p className="font-extrabold uppercase text-[#46178f] tracking-wider">Daftar Pertanyaan:</p>
                      {q.questions.map((item, idx) => (
                        <div key={idx} className="bg-white p-2.5 rounded-xl border border-gray-200">
                          <div className="font-bold text-gray-800">
                            {idx + 1}. {item.question} <span className="text-gray-400 font-normal">({item.timeLimit}s)</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 mt-2">
                            {item.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center justify-between ${
                                  opt.isCorrect
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                <span className="truncate">{opt.text}</span>
                                {opt.isCorrect && <Check className="w-3.5 h-3.5 ml-1 flex-shrink-0" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onSwitchToCreate}
              className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 font-bold rounded-xl transition-all cursor-pointer"
            >
              + Buat Kuis Baru
            </button>
            <button
              onClick={handleStartRoom}
              disabled={!selectedQuiz}
              className="flex-1 py-3 px-4 bg-[#26890c] hover:bg-[#1f7309] text-white font-extrabold rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Buka Room Host</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. LOBBY */}
      {step === 'LOBBY' && (
        <div className="flex-1 flex flex-col justify-between p-8 max-w-6xl mx-auto w-full">
          {/* Top Banner with PIN & QR Code */}
          <div className="bg-white text-gray-900 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">Bergabung di HP:</span>
              <div className="text-2xl font-black text-[#46178f]">{window.location.host}</div>
              <p className="text-xs text-gray-500">Buka di browser HP atau scan QR Code di samping</p>
            </div>

            <div className="text-center bg-gray-50 border-2 border-gray-200 px-8 py-3 rounded-2xl shadow-inner">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400 block mb-1">Game PIN</span>
              <div className="text-6xl font-black tracking-widest font-mono text-black">{pin}</div>
            </div>

            <div className="bg-white p-2 rounded-2xl border-2 border-gray-200 shadow-sm flex items-center justify-center">
              <QRCodeSVG value={joinUrl} size={110} />
            </div>
          </div>

          {/* Players joined grid */}
          <div className="my-8 flex-1">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2 text-white font-bold text-xl">
                <Users className="w-6 h-6 text-amber-300" />
                <span>Peserta ({players.length}):</span>
              </div>
              {players.length === 0 && (
                <span className="text-white/60 text-sm animate-pulse">Menunggu pemain memasukkan PIN...</span>
              )}
            </div>

            <div className="flex flex-wrap gap-3 max-h-[40vh] overflow-y-auto p-2">
              {players.map((p) => (
                <div
                  key={p.id}
                  className="group bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 px-5 py-2.5 rounded-2xl text-white font-extrabold text-lg flex items-center space-x-3 shadow-lg animate-pop"
                >
                  <span>{p.name}</span>
                  <button
                    onClick={() => handleKick(p.id)}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity cursor-pointer"
                    title="Keluarkan pemain"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Start button */}
          <div className="flex justify-end">
            <button
              onClick={handleStartGame}
              disabled={players.length === 0}
              className="bg-[#26890c] hover:bg-[#1f7309] disabled:opacity-40 text-white font-black text-2xl py-4 px-12 rounded-2xl shadow-2xl transition-all cursor-pointer flex items-center space-x-3"
            >
              <Play className="w-7 h-7 fill-white" />
              <span>Mulai Kuis</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. GET READY */}
      {step === 'GET_READY' && (
        <div className="flex-1 flex flex-col justify-center items-center text-center p-8">
          <span className="text-2xl font-black text-amber-300 uppercase tracking-widest mb-4">
            Pertanyaan {currentQuestion?.questionIndex + 1} dari {currentQuestion?.totalQuestions}
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white max-w-4xl leading-tight mb-10 drop-shadow-lg">
            {currentQuestion?.questionText}
          </h2>
          <div className="w-36 h-36 rounded-full border-8 border-amber-400 bg-white/10 flex items-center justify-center shadow-2xl animate-pop">
            <span className="text-7xl font-black text-white">{countdown}</span>
          </div>
        </div>
      )}

      {/* 4. ACTIVE QUESTION */}
      {step === 'QUESTION' && currentQuestion && (
        <div className="flex-1 flex flex-col justify-between p-6 max-w-6xl mx-auto w-full">
          {/* Question Text */}
          <div className="bg-white text-gray-900 rounded-3xl p-6 text-center shadow-2xl mb-6">
            <h2 className="text-2xl md:text-4xl font-extrabold">{currentQuestion.question}</h2>
          </div>

          {/* Timer & Live Answer Counter */}
          <div className="flex justify-between items-center px-4 mb-6">
            <div className="w-20 h-20 rounded-full border-6 border-[#e21b3c] bg-white text-gray-900 flex items-center justify-center font-black text-3xl shadow-xl">
              {timeLeft}
            </div>

            <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl text-white font-black text-xl shadow-lg border border-white/20">
              {answersCount} / {currentQuestion.totalPlayers} Terjawab
            </div>
          </div>

          {/* Options Grid (2 or 4 Options) */}
          <div className={`grid gap-4 flex-1 max-h-[45vh] ${
            currentQuestion.options.length === 2 ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'
          }`}>
            {currentQuestion.options.map((optText, idx) => {
              const shape = ANSWER_SHAPES[idx] || ANSWER_SHAPES[0];
              return (
                <div
                  key={idx}
                  className={`${shape.bgClass} text-white rounded-3xl p-6 flex items-center space-x-4 shadow-xl border-4 border-black/10`}
                >
                  <div className="scale-125 flex-shrink-0">{shape.svg}</div>
                  <span className="text-2xl md:text-3xl font-extrabold flex-1 leading-snug">{optText}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. QUESTION RESULT (STATISTICS BAR CHART) */}
      {step === 'RESULT' && resultData && currentQuestion && (
        <div className="flex-1 flex flex-col justify-between p-6 max-w-6xl mx-auto w-full">
          <div className="bg-white text-gray-900 rounded-3xl p-6 text-center shadow-2xl mb-6">
            <h2 className="text-2xl md:text-3xl font-extrabold">{currentQuestion.question}</h2>
          </div>

          {/* Bar Chart Distribution */}
          <div className={`grid gap-4 h-[40vh] items-end px-4 mb-6 ${
            resultData.stats.length === 2 ? 'grid-cols-2 max-w-2xl mx-auto w-full' : 'grid-cols-4'
          }`}>
            {resultData.stats.map((count, idx) => {
              const shape = ANSWER_SHAPES[idx] || ANSWER_SHAPES[0];
              const isCorrect = idx === resultData.correctOptionIndex;
              const maxVal = Math.max(...resultData.stats, 1);
              const heightPct = Math.max((count / maxVal) * 85, 12);

              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end">
                  <div className="font-black text-2xl text-white mb-2">{count}</div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full ${shape.bgClass} rounded-2xl flex flex-col items-center justify-between p-3 shadow-xl border-4 ${
                      isCorrect ? 'border-amber-300 ring-4 ring-amber-300/50' : 'border-transparent opacity-85'
                    }`}
                  >
                    <div>{isCorrect && <Check className="w-8 h-8 text-white drop-shadow-md stroke-[3]" />}</div>
                    <div>{shape.svg}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action button */}
          <div className="flex justify-end">
            <button
              onClick={handleAdvance}
              className="bg-white hover:bg-gray-100 text-[#46178f] font-black text-xl py-3 px-8 rounded-2xl shadow-2xl transition-all cursor-pointer flex items-center space-x-2"
            >
              <span>Lihat Leaderboard</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* 6. LEADERBOARD TOP 10 */}
      {step === 'LEADERBOARD' && leaderboardData && (
        <div className="flex-1 flex flex-col justify-between p-8 max-w-4xl mx-auto w-full">
          <div className="text-center mb-6">
            <h2 className="text-4xl font-black text-amber-300 drop-shadow-md tracking-wider">PAPAN PERINGKAT</h2>
            <p className="text-white/80 font-semibold mt-1">Top 10 Pemain Terbaik Sementara</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-2">
            {leaderboardData.top10.map((p) => (
              <div
                key={p.id}
                className="bg-white text-gray-900 rounded-2xl p-4 flex items-center justify-between shadow-xl animate-pop border-l-8 border-[#46178f]"
              >
                <div className="flex items-center space-x-4">
                  <span className="w-9 h-9 rounded-full bg-gray-100 text-[#46178f] font-black flex items-center justify-center text-lg">
                    {p.rank}
                  </span>
                  <span className="text-2xl font-black text-gray-800">{p.name}</span>
                  {p.streak > 1 && (
                    <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 text-xs font-black px-2 py-0.5 rounded-full">
                      <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{p.streak}</span>
                    </span>
                  )}
                </div>

                <div className="text-2xl font-black text-[#26890c]">
                  {p.score.toLocaleString()} <span className="text-xs text-gray-400 font-bold uppercase">pts</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleAdvance}
              className="bg-[#26890c] hover:bg-[#1f7309] text-white font-black text-xl py-3 px-8 rounded-2xl shadow-2xl transition-all cursor-pointer flex items-center space-x-2"
            >
              <span>{leaderboardData.isLastQuestion ? 'Lihat Podium Juara!' : 'Soal Berikutnya'}</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* 7. PODIUM */}
      {step === 'PODIUM' && podiumData && (
        <div className="flex-1 flex flex-col justify-between items-center p-8 max-w-5xl mx-auto w-full">
          <div className="text-center mb-4">
            <h2 className="text-5xl font-black text-amber-300 drop-shadow-md tracking-wider">PODIUM JUARA!</h2>
            <p className="text-white/80 font-semibold mt-1">Selamat kepada para pemenang!</p>
          </div>

          {/* 3-Step Podium Bars */}
          <div className="flex items-end justify-center w-full max-w-3xl h-[45vh] gap-4 mb-8">
            {/* 2nd Place */}
            {podiumData.top3[1] && (
              <div className="flex-1 flex flex-col items-center animate-pop" style={{ animationDelay: '0.2s' }}>
                <span className="text-xl font-black text-white mb-2">{podiumData.top3[1].name}</span>
                <span className="text-sm font-extrabold text-amber-200 mb-2">
                  {podiumData.top3[1].score.toLocaleString()} pts
                </span>
                <div className="w-full h-44 bg-gray-300 text-gray-800 rounded-t-3xl flex flex-col items-center justify-center shadow-2xl border-t-4 border-white">
                  <span className="text-5xl font-black">2</span>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {podiumData.top3[0] && (
              <div className="flex-1 flex flex-col items-center animate-pop" style={{ animationDelay: '0.6s' }}>
                <Trophy className="w-12 h-12 text-amber-300 mb-1 drop-shadow-lg" />
                <span className="text-2xl font-black text-white mb-1">{podiumData.top3[0].name}</span>
                <span className="text-base font-extrabold text-amber-300 mb-2">
                  {podiumData.top3[0].score.toLocaleString()} pts
                </span>
                <div className="w-full h-64 bg-amber-400 text-amber-950 rounded-t-3xl flex flex-col items-center justify-center shadow-2xl border-t-4 border-amber-200">
                  <span className="text-7xl font-black">1</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {podiumData.top3[2] && (
              <div className="flex-1 flex flex-col items-center animate-pop" style={{ animationDelay: '0.4s' }}>
                <span className="text-xl font-black text-white mb-2">{podiumData.top3[2].name}</span>
                <span className="text-sm font-extrabold text-amber-200 mb-2">
                  {podiumData.top3[2].score.toLocaleString()} pts
                </span>
                <div className="w-full h-32 bg-amber-700 text-amber-100 rounded-t-3xl flex flex-col items-center justify-center shadow-2xl border-t-4 border-amber-600">
                  <span className="text-4xl font-black">3</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => {
                soundManager.stopMusic();
                setStep('SELECT_QUIZ');
              }}
              className="bg-white hover:bg-gray-100 text-[#46178f] font-black text-lg py-3 px-8 rounded-2xl shadow-xl transition-all cursor-pointer"
            >
              Mainkan Kuis Lain
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
