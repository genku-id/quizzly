import React, { useState, useEffect } from 'react';
import PlayerView from './components/PlayerView';
import HostView from './components/HostView';
import CreateQuizView from './components/CreateQuizView';
import { Smartphone, Monitor, PlusCircle } from 'lucide-react';

export default function App() {
  const [mode, setMode] = useState('play'); // 'play', 'host', 'create'
  const [initialPin, setInitialPin] = useState('');
  const [editingQuiz, setEditingQuiz] = useState(null);

  useEffect(() => {
    // Check URL parameters for direct deep-link (e.g. ?pin=1234 or ?mode=host)
    const params = new URLSearchParams(window.location.search);
    const pinParam = params.get('pin');
    const modeParam = params.get('mode');

    if (pinParam) {
      setInitialPin(pinParam);
      setMode('play');
    } else if (modeParam === 'host') {
      setMode('host');
    } else if (modeParam === 'create') {
      setMode('create');
    }
  }, []);

  const handleStartCreate = () => {
    setEditingQuiz(null);
    setMode('create');
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setMode('create');
  };

  return (
    <div className="min-h-screen bg-[#46178f] text-white flex flex-col font-sans">
      {/* GLOBAL NAVIGATION HEADER */}
      <header className="h-[60px] bg-black/30 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 sm:px-8 z-50">
        <div
          onClick={() => setMode('play')}
          className="flex items-center space-x-2 cursor-pointer select-none"
        >
          <span className="text-2xl font-black tracking-tight text-white drop-shadow">
            Quizz<span className="text-amber-300">ly</span>!
          </span>
        </div>

        {/* Mode Selector Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2 bg-white/10 p-1 rounded-2xl border border-white/15">
          <button
            onClick={() => setMode('play')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              mode === 'play'
                ? 'bg-white text-[#46178f] shadow-md'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Main (HP)</span>
          </button>

          <button
            onClick={() => setMode('host')}
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
        </nav>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col">
        {mode === 'play' && <PlayerView initialPin={initialPin} />}
        {mode === 'host' && (
          <HostView
            onSwitchToCreate={handleStartCreate}
            onEditQuiz={handleEditQuiz}
          />
        )}
        {mode === 'create' && (
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
      </main>
    </div>
  );
}
