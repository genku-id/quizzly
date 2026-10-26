import React, { useState, useEffect } from 'react';
import { socket } from '../services/socket';
import { ANSWER_SHAPES, generateRandomNickname } from '../constants/theme';
import { CheckCircle2, XCircle, Flame, Trophy, Dices } from 'lucide-react';

export default function PlayerView({ initialPin = '' }) {
  const [step, setStep] = useState(initialPin ? 'ENTER_NAME' : 'ENTER_PIN');
  const [pin, setPin] = useState(initialPin);
  const [nickname, setNickname] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [optionsCount, setOptionsCount] = useState(4);
  const [selectedOption, setSelectedOption] = useState(null);
  const [roundResult, setRoundResult] = useState(null);
  const [finalPodium, setFinalPodium] = useState(null);

  useEffect(() => {
    // Socket event listeners for player
    socket.on('player:join_error', ({ message }) => {
      setErrorMsg(message);
    });

    socket.on('player:join_success', ({ pin, nickname }) => {
      setPin(pin);
      setNickname(nickname);
      setStep('LOBBY');
      setErrorMsg('');
    });

    socket.on('player:kicked', ({ message }) => {
      alert(message);
      setStep('ENTER_PIN');
      setSelectedOption(null);
    });

    socket.on('player:get_ready', ({ countdown }) => {
      setStep('GET_READY');
      setCountdown(countdown);
      setSelectedOption(null);
      setRoundResult(null);
    });

    socket.on('player:get_ready_tick', ({ countdown }) => {
      setCountdown(countdown);
    });

    socket.on('player:question_start', ({ optionsCount }) => {
      setStep('QUESTION');
      setOptionsCount(optionsCount || 4);
      setSelectedOption(null);
    });

    socket.on('player:answer_recorded', ({ selectedOptionIndex }) => {
      setSelectedOption(selectedOptionIndex);
      setStep('SUBMITTED');
    });

    socket.on('player:round_result', (data) => {
      setRoundResult(data);
      setStep('ROUND_RESULT');
    });

    socket.on('player:leaderboard', () => {
      // Stay on round result
    });

    socket.on('player:podium', (data) => {
      setFinalPodium(data);
      setStep('PODIUM');
    });

    return () => {
      socket.off('player:join_error');
      socket.off('player:join_success');
      socket.off('player:kicked');
      socket.off('player:get_ready');
      socket.off('player:get_ready_tick');
      socket.off('player:question_start');
      socket.off('player:answer_recorded');
      socket.off('player:round_result');
      socket.off('player:leaderboard');
      socket.off('player:podium');
    };
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!pin.trim() || !nickname.trim()) {
      setErrorMsg('PIN dan Nickname wajib diisi!');
      return;
    }
    setErrorMsg('');
    socket.emit('player:join', { pin: pin.trim(), nickname: nickname.trim() });
  };

  const handleSelectOption = (idx) => {
    if (selectedOption !== null) return;
    if (navigator.vibrate) navigator.vibrate(50);
    setSelectedOption(idx);
    setStep('SUBMITTED');
    socket.emit('player:submit_answer', { pin, optionIndex: idx });
  };

  const handleRandomizeName = () => {
    const randomName = generateRandomNickname();
    setNickname(randomName);
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex flex-col justify-center items-center p-4">
      {/* 1. ENTER PIN / NICKNAME */}
      {(step === 'ENTER_PIN' || step === 'ENTER_NAME') && (
        <div className="w-full max-w-sm bg-white text-gray-900 rounded-3xl p-6 shadow-2xl animate-pop">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-[#46178f] tracking-wide">Quizzly!</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Gabung & Mainkan Kuis Bersama</p>
          </div>

          {errorMsg && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-xl text-center text-sm font-semibold mb-4">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Game PIN</label>
              <input
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Contoh: 1234"
                className="w-full text-center text-2xl font-black tracking-widest py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-[#46178f] outline-none transition-all"
                autoFocus={!pin}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Nama / Nickname</label>
                <button
                  type="button"
                  onClick={handleRandomizeName}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-[#46178f] hover:text-[#25076b] cursor-pointer"
                  title="Pilih nama acak lucu"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Nama Acak</span>
                </button>
              </div>

              <input
                type="text"
                maxLength={18}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ketik nama atau klik Nama Acak..."
                className="w-full text-center text-lg font-bold py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-[#46178f] outline-none transition-all"
                autoFocus={!!pin}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#26890c] hover:bg-[#1f7309] active:scale-95 text-white font-extrabold text-lg py-3 rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Masuk Permainan
            </button>
          </form>
        </div>
      )}

      {/* 2. LOBBY WAITING SCREEN */}
      {step === 'LOBBY' && (
        <div className="text-center max-w-sm bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 animate-pop">
          <div className="w-20 h-20 bg-white text-[#46178f] rounded-full flex items-center justify-center font-black text-3xl mx-auto shadow-xl mb-4">
            {nickname.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-2xl font-black text-white">Kamu Sudah Masuk!</h2>
          <p className="text-lg font-bold text-amber-300 mt-1">{nickname}</p>
          <div className="mt-6 flex items-center justify-center space-x-2 text-white/80 text-sm">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
            <span>Lihat namamu di layar proyektor host...</span>
          </div>
        </div>
      )}

      {/* 3. GET READY */}
      {step === 'GET_READY' && (
        <div className="text-center animate-pop">
          <p className="text-lg font-extrabold text-white/80 uppercase tracking-widest mb-2">Bersiaplah!</p>
          <div className="w-32 h-32 rounded-full border-8 border-amber-400 bg-white/10 flex items-center justify-center mx-auto shadow-2xl">
            <span className="text-6xl font-black text-white">{countdown}</span>
          </div>
        </div>
      )}

      {/* 4. QUESTION CONTROLLER (2 OR 4 BIG BUTTONS) */}
      {step === 'QUESTION' && (
        <div className={`w-full max-w-lg h-[75vh] p-2 gap-3 ${
          optionsCount === 2 ? 'flex flex-col' : 'grid grid-cols-2'
        }`}>
          {ANSWER_SHAPES.slice(0, optionsCount).map((shape) => (
            <button
              key={shape.index}
              onClick={() => handleSelectOption(shape.index)}
              className={`${shape.bgClass} ${shape.activeClass} text-white rounded-3xl flex items-center justify-center shadow-2xl active:scale-95 transition-transform cursor-pointer border-4 border-black/10 flex-1`}
            >
              <div className={optionsCount === 2 ? 'scale-175' : 'scale-150'}>
                {shape.svg}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 5. SUBMITTED STATE */}
      {step === 'SUBMITTED' && selectedOption !== null && (
        <div className="text-center max-w-sm p-6 animate-pop">
          <div
            className={`w-28 h-28 rounded-3xl ${ANSWER_SHAPES[selectedOption]?.bgClass} flex items-center justify-center mx-auto shadow-2xl mb-6`}
          >
            <div className="scale-150">{ANSWER_SHAPES[selectedOption]?.svg}</div>
          </div>
          <h2 className="text-2xl font-black text-white">Jawaban Terkirim!</h2>
          <p className="text-white/80 font-medium mt-2">Menunggu pemain lain & waktu habis...</p>
          <div className="mt-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
          </div>
        </div>
      )}

      {/* 6. ROUND RESULT FEEDBACK */}
      {step === 'ROUND_RESULT' && roundResult && (
        <div
          className={`w-full max-w-md rounded-3xl p-8 text-center text-white shadow-2xl animate-pop ${
            roundResult.isCorrect ? 'bg-[#26890c]' : 'bg-[#e21b3c]'
          }`}
        >
          <div className="flex justify-center mb-4">
            {roundResult.isCorrect ? (
              <CheckCircle2 className="w-24 h-24 text-white drop-shadow-md" />
            ) : (
              <XCircle className="w-24 h-24 text-white drop-shadow-md" />
            )}
          </div>

          <h2 className="text-3xl font-black">
            {roundResult.isCorrect ? 'BENAR!' : 'SALAH!'}
          </h2>

          <div className="my-6 bg-black/20 rounded-2xl p-4 space-y-2">
            <div className="text-4xl font-extrabold text-amber-300">
              +{roundResult.pointsEarned.toLocaleString()}
            </div>
            <p className="text-xs uppercase tracking-wider font-bold text-white/80">Poin Diperoleh</p>

            <div className="pt-2 border-t border-white/20 flex justify-around text-sm font-bold">
              <div>
                <span>Total: </span>
                <span className="text-amber-200">{roundResult.totalScore.toLocaleString()}</span>
              </div>
              <div>
                <span>Peringkat: </span>
                <span className="text-white">#{roundResult.rank}</span>
              </div>
            </div>
          </div>

          {roundResult.streak > 1 && (
            <div className="inline-flex items-center space-x-1 bg-amber-400 text-amber-950 font-black px-4 py-1.5 rounded-full text-sm shadow-md animate-bounce">
              <Flame className="w-4 h-4 fill-amber-950" />
              <span>{roundResult.streak} Jawaban Benar Beruntun!</span>
            </div>
          )}

          <p className="text-xs text-white/70 mt-4">Lihat papan peringkat di layar utama host</p>
        </div>
      )}

      {/* 7. PODIUM FINAL */}
      {step === 'PODIUM' && finalPodium && (
        <div className="w-full max-w-sm bg-white text-gray-900 rounded-3xl p-8 text-center shadow-2xl animate-pop">
          <div className="w-20 h-20 bg-amber-400 text-amber-950 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Trophy className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-[#46178f]">Game Selesai!</h2>
          <p className="text-gray-600 font-bold mt-1 text-sm">
            {finalPodium.isWinner ? `🎉 Selamat! Kamu Juara ${finalPodium.rank}!` : 'Kamu finis di peringkat:'}
          </p>

          <div className="text-6xl font-black text-[#e21b3c] my-4">
            #{finalPodium.rank}
          </div>

          <div className="bg-gray-100 rounded-2xl p-4 font-bold text-gray-700">
            Total Skor: <span className="text-[#26890c] text-xl font-extrabold">{finalPodium.totalScore.toLocaleString()}</span>
          </div>

          <p className="text-xs text-gray-400 mt-6">Terima kasih sudah bermain di Quizzly! 🎉</p>
        </div>
      )}
    </div>
  );
}
