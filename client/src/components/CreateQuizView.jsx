import React, { useState, useEffect } from 'react';
import { ANSWER_SHAPES } from '../constants/theme';
import { Plus, Trash2, CheckCircle2, Save, ArrowLeft, Play, Copy, HelpCircle } from 'lucide-react';

export default function CreateQuizView({ onBack, onHostCreatedQuiz, quizToEdit = null }) {
  const [title, setTitle] = useState(quizToEdit ? quizToEdit.title : '');
  const [description, setDescription] = useState(quizToEdit ? quizToEdit.description || '' : '');
  const [questions, setQuestions] = useState(
    quizToEdit && quizToEdit.questions?.length > 0
      ? quizToEdit.questions.map(q => ({
          ...q,
          type: q.options?.length === 2 ? 'true_false' : 'multiple_choice'
        }))
      : [
          {
            id: 'q-1',
            type: 'multiple_choice',
            question: '',
            timeLimit: 20,
            options: [
              { text: '', isCorrect: true },
              { text: '', isCorrect: false },
              { text: '', isCorrect: false },
              { text: '', isCorrect: false }
            ]
          }
        ]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedQuiz, setSavedQuiz] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddQuestion = (type = 'multiple_choice') => {
    const newOptions = type === 'true_false'
      ? [
          { text: 'Salah', isCorrect: false },
          { text: 'Benar', isCorrect: true }
        ]
      : [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ];

    setQuestions([
      ...questions,
      {
        id: `q-${Date.now()}`,
        type,
        question: '',
        timeLimit: 20,
        options: newOptions
      }
    ]);
  };

  const handleDuplicateQuestion = (idx) => {
    const q = questions[idx];
    const cloned = {
      ...q,
      id: `q-${Date.now()}`,
      options: q.options.map(o => ({ ...o }))
    };
    const nextQuestions = [...questions];
    nextQuestions.splice(idx + 1, 0, cloned);
    setQuestions(nextQuestions);
  };

  const handleToggleQuestionType = (qIdx, newType) => {
    const updated = [...questions];
    const q = updated[qIdx];
    q.type = newType;
    if (newType === 'true_false') {
      q.options = [
        { text: 'Salah', isCorrect: false },
        { text: 'Benar', isCorrect: true }
      ];
    } else {
      q.options = [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ];
    }
    setQuestions(updated);
  };

  const handleRemoveQuestion = (idx) => {
    if (questions.length <= 1) {
      alert('Kuis harus memiliki minimal 1 pertanyaan!');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionTextChange = (idx, text) => {
    const updated = [...questions];
    updated[idx].question = text;
    setQuestions(updated);
  };

  const handleTimeLimitChange = (idx, sec) => {
    const updated = [...questions];
    updated[idx].timeLimit = Number(sec);
    setQuestions(updated);
  };

  const handleOptionTextChange = (qIdx, optIdx, text) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx].text = text;
    setQuestions(updated);
  };

  const handleSetCorrectOption = (qIdx, optIdx) => {
    const updated = [...questions];
    updated[qIdx].options = updated[qIdx].options.map((opt, i) => ({
      ...opt,
      isCorrect: i === optIdx
    }));
    setQuestions(updated);
  };

  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Judul kuis tidak boleh kosong!');
      return;
    }

    // Validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setErrorMsg(`Pertanyaan nomor ${i + 1} masih kosong!`);
        return;
      }
      const filledOptions = q.options.filter(o => o.text.trim().length > 0);
      if (filledOptions.length < 2) {
        setErrorMsg(`Pertanyaan nomor ${i + 1} harus memiliki minimal 2 pilihan jawaban!`);
        return;
      }
      const hasCorrect = q.options.some(o => o.isCorrect && o.text.trim().length > 0);
      if (!hasCorrect) {
        setErrorMsg(`Pertanyaan nomor ${i + 1} belum memilih kunci jawaban yang benar!`);
        return;
      }
    }

    setErrorMsg('');
    setIsSaving(true);

    const isEditMode = !!quizToEdit;
    const url = isEditMode
      ? `${import.meta.env.VITE_BACKEND_URL || ''}/api/quizzes/${quizToEdit.id}`
      : `${import.meta.env.VITE_BACKEND_URL || ''}/api/quizzes`;
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          questions
        })
      });

      if (!res.ok) throw new Error('Gagal menyimpan kuis');
      const data = await res.json();
      setSavedQuiz(data);
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan kuis.');
    } finally {
      setIsSaving(false);
    }
  };

  if (savedQuiz) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white text-gray-900 rounded-3xl shadow-2xl text-center animate-pop">
        <div className="w-16 h-16 bg-emerald-100 text-[#26890c] rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-[#46178f]">
          {quizToEdit ? 'Perubahan Kuis Disimpan!' : 'Kuis Berhasil Dibuat!'}
        </h2>
        <p className="text-lg font-bold text-gray-700 mt-2">{savedQuiz.title}</p>
        <p className="text-sm text-gray-500 mb-8">{savedQuiz.questions.length} Pertanyaan tersimpan di server.</p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3 px-4 border-2 border-gray-300 hover:bg-gray-100 font-bold rounded-xl transition-all cursor-pointer"
          >
            Kembali ke Daftar Kuis
          </button>
          <button
            onClick={() => onHostCreatedQuiz(savedQuiz)}
            className="flex-1 py-3 px-4 bg-[#26890c] hover:bg-[#1f7309] text-white font-extrabold rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Host Kuis Ini Sekarang</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
        <h1 className="text-2xl md:text-3xl font-black text-amber-300">
          {quizToEdit ? 'Edit Kuis' : 'Buat Kuis Baru'}
        </h1>
      </div>

      {errorMsg && (
        <div className="bg-red-500/90 text-white font-bold p-4 rounded-2xl mb-6 shadow-lg border border-red-300">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSaveQuiz} className="space-y-6">
        {/* Title & Description Card */}
        <div className="bg-white text-gray-900 rounded-3xl p-6 shadow-xl space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">
              Judul Kuis *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Kuis Cerdas Cermat Kemerdekaan"
              className="w-full text-xl font-bold py-2.5 px-4 rounded-xl border-2 border-gray-200 focus:border-[#46178f] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">
              Deskripsi Singkat (Opsional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat tentang kuis ini..."
              className="w-full text-sm font-medium py-2 px-4 rounded-xl border-2 border-gray-200 focus:border-[#46178f] outline-none"
            />
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {questions.map((q, qIdx) => (
            <div key={q.id} className="bg-white text-gray-900 rounded-3xl p-6 shadow-xl border-2 border-purple-100">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                <span className="font-black text-lg text-[#46178f]">
                  Soal #{qIdx + 1}
                </span>

                <div className="flex items-center space-x-2">
                  {/* Question Type Toggle */}
                  <div className="bg-gray-100 p-1 rounded-xl flex items-center text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => handleToggleQuestionType(qIdx, 'multiple_choice')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        q.type === 'multiple_choice'
                          ? 'bg-[#46178f] text-white shadow'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      4 Opsi
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleQuestionType(qIdx, 'true_false')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        q.type === 'true_false'
                          ? 'bg-[#46178f] text-white shadow'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Benar/Salah
                    </button>
                  </div>

                  {/* Time limit dropdown */}
                  <div className="flex items-center space-x-1.5 bg-gray-100 px-3 py-1.5 rounded-xl text-sm font-bold">
                    <span className="text-gray-500 text-xs">Waktu:</span>
                    <select
                      value={q.timeLimit}
                      onChange={(e) => handleTimeLimitChange(qIdx, e.target.value)}
                      className="bg-transparent font-extrabold text-[#46178f] outline-none cursor-pointer text-xs"
                    >
                      <option value={5}>5s</option>
                      <option value={10}>10s</option>
                      <option value={15}>15s</option>
                      <option value={20}>20s</option>
                      <option value={30}>30s</option>
                      <option value={60}>60s</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDuplicateQuestion(qIdx)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    title="Duplikat pertanyaan ini"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Hapus soal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <input
                type="text"
                required
                value={q.question}
                onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                placeholder="Ketik pertanyaan kuis di sini..."
                className="w-full text-lg font-bold py-3 px-4 rounded-2xl border-2 border-gray-200 focus:border-[#46178f] outline-none mb-4"
              />

              {/* Options Grid */}
              <div className={`grid gap-3 ${q.options.length === 2 ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                {q.options.map((opt, optIdx) => {
                  const shape = ANSWER_SHAPES[optIdx];
                  return (
                    <div
                      key={optIdx}
                      className={`flex items-center p-2.5 rounded-2xl border-2 transition-all ${
                        opt.isCorrect
                          ? 'border-emerald-500 bg-emerald-50/60'
                          : 'border-gray-200'
                      }`}
                    >
                      {/* Shape Icon */}
                      <div className={`w-10 h-10 rounded-xl ${shape.bgClass} flex items-center justify-center flex-shrink-0 text-white p-2 shadow-sm`}>
                        {shape.svg}
                      </div>

                      {/* Option Text Input */}
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(qIdx, optIdx, e.target.value)}
                        placeholder={`Pilihan ${shape.label}...`}
                        className="flex-1 mx-2 text-sm font-bold bg-transparent outline-none text-gray-800"
                      />

                      {/* Correct Answer Checkbox button */}
                      <button
                        type="button"
                        onClick={() => handleSetCorrectOption(qIdx, optIdx)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer ${
                          opt.isCorrect
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                            : 'border-gray-300 text-transparent hover:border-gray-400'
                        }`}
                        title="Tandai sebagai jawaban benar"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={() => handleAddQuestion('multiple_choice')}
            className="flex-1 py-3 px-4 border-2 border-dashed border-white/60 hover:border-white text-white font-extrabold rounded-2xl transition-all flex items-center justify-center space-x-2 cursor-pointer hover:bg-white/10"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Pilihan Ganda (4 Opsi)</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddQuestion('true_false')}
            className="flex-1 py-3 px-4 border-2 border-dashed border-amber-300/80 hover:border-amber-300 text-amber-300 font-extrabold rounded-2xl transition-all flex items-center justify-center space-x-2 cursor-pointer hover:bg-amber-400/10"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Benar/Salah (2 Opsi)</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 py-3 px-6 bg-[#26890c] hover:bg-[#1f7309] text-white font-black text-lg rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{isSaving ? 'Menyimpan...' : (quizToEdit ? 'Simpan Perubahan' : 'Simpan Kuis')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
