import React, { useState, useEffect } from 'react';
import PlayerView from './components/PlayerView';
import HostView from './components/HostView';
import CreateQuizView from './components/CreateQuizView';
import HistoryView from './components/HistoryView';
import { Monitor, PlusCircle, Lock, Unlock, LogOut, X, KeyRound, History } from 'lucide-react';

export default function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('quizzly_admin_auth') === 'true';
  });
  const [mode, setMode] = useState(() => {
    const isAdmin = sessionStorage.getItem('quizzly_admin_auth') === 'true';
    return isAdmin ? 'host' : 'play';
  });
  const [initialPin, setInitialPin] = useState('');
  const [editingQuiz, setEditingQuiz] = useState(null);

  // Admin login modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pinParam = params.get('pin');
    const modeParam = params.get('mode');

    if (pinParam) {
      setInitialPin(pinParam);
      setMode('play');
    } else if (modeParam === 'host' || modeParam === 'create') {
      if (isAdminLoggedIn) {
        setMode(modeParam);
      } else {
        setMode('play');
        setShowLoginModal(true);
      }
    }
  }, [isAdminLoggedIn]);

  const handleAdminLoginSubmit = (e) => {
    e.preventDefault();
    if (adminPasswordInput === 'admin123') {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('quizzly_admin_auth', 'true');
      setShowLoginModal(false);
      setAdminPasswordInput('');
      setLoginError('');
      setMode('host');
    } else {
      setLoginError('Password admin salah! Silakan coba lagi.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('quizzly_admin_auth');
    setEditingQuiz(null);
    setMode('play');
  };

  const handleStartCreate = () => {
    if (!isAdminLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setEditingQuiz(null);
    setMode('create');
  };

  const handleEditQuiz = (quiz) => {
    if (!isAdminLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setEditingQuiz(quiz);
    setMode('create');
  };

  const handleSelectHost = () => {
    if (!isAdminLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setMode('host');
  };

  return (
    <div className="min-h-screen bg-[#46178f] text-white flex flex-col font-sans">
      {/* GLOBAL NAVIGATION HEADER */}
      <header className="h-[60px] bg-black/30 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 sm:px-8 z-50">
        <div
          onClick={() => setMode(isAdminLoggedIn ? 'host' : 'play')}
          className="flex items-center space-x-2 cursor-pointer select-none"
        >
          <span className="text-2xl font-black tracking-tight text-white drop-shadow">
            Quizz<span className="text-amber-300">ly</span>!
          </span>
        </div>

        {/* RIGHT SIDE: Admin Controls or Lock Button */}
        <div className="flex items-center space-x-2">
          {isAdminLoggedIn ? (
            <div className="flex items-center space-x-2">
              {/* Mode Selector Tabs (Visible ONLY for Admin) */}
              <nav className="flex items-center space-x-1 sm:space-x-1.5 bg-white/10 p-1 rounded-2xl border border-white/15">
                <button
                  onClick={handleSelectHost}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    mode === 'host'
                      ? 'bg-white text-[#46178f] shadow-md'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>Host Layar</span>
                </button>

                <button
                  onClick={handleStartCreate}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    mode === 'create'
                      ? 'bg-white text-[#46178f] shadow-md'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{editingQuiz ? 'Edit Kuis' : 'Buat Kuis'}</span>
                </button>

                <button
                  onClick={() => setMode('history')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    mode === 'history'
                      ? 'bg-white text-[#46178f] shadow-md'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>Riwayat</span>
                </button>
              </nav>

              {/* Logout Button */}
              <button
                onClick={handleAdminLogout}
                className="flex items-center space-x-1.5 bg-red-500/80 hover:bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                title="Keluar dari mode Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Keluar Admin</span>
              </button>
            </div>
          ) : (
            /* Lock Button for Public Visitors (Click to Open Admin Login) */
            <button
              onClick={() => {
                setLoginError('');
                setShowLoginModal(true);
              }}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all cursor-pointer border border-white/15 shadow-sm flex items-center space-x-1.5"
              title="Akses Admin (Host & Pembuat Kuis)"
            >
              <Lock className="w-5 h-5 text-amber-300" />
            </button>
          )}
        </div>
      </header>

      {/* ADMIN LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-pop">
          <div className="bg-white text-gray-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border-2 border-purple-100">
            <button
              onClick={() => {
                setShowLoginModal(false);
                setAdminPasswordInput('');
                setLoginError('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-purple-100 text-[#46178f] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <KeyRound className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-[#46178f]">Akses Admin</h2>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Masukkan password untuk membuka Layar Host dan Pembuat Kuis.
              </p>
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-300 text-red-600 px-3 py-2 rounded-xl text-center text-xs font-bold mb-4 animate-shake">
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Password Admin
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="Masukkan password..."
                  className="w-full text-center text-lg font-bold py-2.5 px-4 rounded-xl border-2 border-gray-200 focus:border-[#46178f] outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#46178f] hover:bg-[#320e6b] active:scale-95 text-white font-extrabold py-3 rounded-xl shadow-lg transition-all cursor-pointer text-sm"
              >
                Masuk sebagai Admin
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col">
        {mode === 'play' && <PlayerView initialPin={initialPin} />}

        {/* Keep HostView persistently mounted when admin is logged in so changing tabs doesn't destroy the active room or PIN */}
        {isAdminLoggedIn && (
          <div className={`flex-1 flex flex-col ${mode === 'host' ? '' : 'hidden'}`}>
            <HostView
              onSwitchToCreate={handleStartCreate}
              onEditQuiz={handleEditQuiz}
            />
          </div>
        )}

        {mode === 'create' && isAdminLoggedIn && (
          <CreateQuizView
            quizToEdit={editingQuiz}
            onBack={() => {
              setEditingQuiz(null);
              setMode('host');
            }}
            onHostCreatedQuiz={() => {
              setEditingQuiz(null);
              setMode('host');
            }}
          />
        )}

        {mode === 'history' && isAdminLoggedIn && (
          <HistoryView />
        )}
      </main>
    </div>
  );
}
