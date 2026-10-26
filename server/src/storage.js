import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'quizzes.json');

const DEFAULT_QUIZZES = [
  {
    id: "demo-quiz-1",
    title: "Kuis Pengetahuan Umum Seru 🚀",
    description: "Uji wawasan seru bareng teman-teman!",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "q1",
        question: "Ibukota negara Indonesia yang baru di Kalimantan Timur adalah...?",
        timeLimit: 20,
        options: [
          { text: "Nusantara (IKN)", isCorrect: true },
          { text: "Balikpapan", isCorrect: false },
          { text: "Samarinda", isCorrect: false },
          { text: "Pontianak", isCorrect: false }
        ]
      },
      {
        id: "q2",
        question: "Berapa hasil dari 7 x 8 + 6?",
        timeLimit: 15,
        options: [
          { text: "56", isCorrect: false },
          { text: "62", isCorrect: true },
          { text: "64", isCorrect: false },
          { text: "58", isCorrect: false }
        ]
      },
      {
        id: "q3",
        question: "Planet terdekat dari Matahari dalam tata surya kita adalah...?",
        timeLimit: 20,
        options: [
          { text: "Venus", isCorrect: false },
          { text: "Mars", isCorrect: false },
          { text: "Merkurius", isCorrect: true },
          { text: "Bumi", isCorrect: false }
        ]
      },
      {
        id: "q4",
        question: "Bahasa pemrograman apa yang berjalan secara native di browser web?",
        timeLimit: 20,
        options: [
          { text: "Python", isCorrect: false },
          { text: "JavaScript", isCorrect: true },
          { text: "Java", isCorrect: false },
          { text: "C++", isCorrect: false }
        ]
      },
      {
        id: "q5",
        question: "Candi Borobudur terletak di provinsi mana?",
        timeLimit: 15,
        options: [
          { text: "DI Yogyakarta", isCorrect: false },
          { text: "Jawa Timur", isCorrect: false },
          { text: "Jawa Barat", isCorrect: false },
          { text: "Jawa Tengah", isCorrect: true }
        ]
      }
    ]
  }
];

let memoryQuizzes = null;

export function initStorage() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_QUIZZES, null, 2), 'utf-8');
  }
}

export async function syncQuizzesFromSupabase() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('quizzes').select('*');
    if (error) {
      console.warn('[Supabase] Warning fetching quizzes:', error.message);
      return;
    }
    if (data && data.length > 0) {
      memoryQuizzes = data.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        createdAt: row.created_at,
        questions: row.questions || []
      }));
      fs.writeFileSync(DATA_FILE, JSON.stringify(memoryQuizzes, null, 2), 'utf-8');
      console.log(`[Supabase] Synced ${data.length} quizzes from cloud.`);
    } else if (data && data.length === 0) {
      console.log('[Supabase] Table quizzes empty, seeding default quiz...');
      const seedItem = DEFAULT_QUIZZES[0];
      await supabase.from('quizzes').insert({
        id: seedItem.id,
        title: seedItem.title,
        description: seedItem.description,
        created_at: seedItem.createdAt,
        questions: seedItem.questions
      });
    }
  } catch (err) {
    console.error('[Supabase] Error syncing quizzes:', err);
  }
}

export function getAllQuizzes() {
  if (memoryQuizzes) {
    return memoryQuizzes;
  }
  initStorage();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    memoryQuizzes = JSON.parse(raw);
    return memoryQuizzes;
  } catch (err) {
    console.error("Error reading quizzes:", err);
    memoryQuizzes = DEFAULT_QUIZZES;
    return DEFAULT_QUIZZES;
  }
}

export function getQuizById(id) {
  const list = getAllQuizzes();
  return list.find(q => q.id === id) || null;
}

export function saveQuiz(quiz) {
  initStorage();
  const list = [...getAllQuizzes()];
  const index = list.findIndex(q => q.id === quiz.id);
  const now = new Date().toISOString();
  let savedItem;

  if (index >= 0) {
    savedItem = { ...quiz, updatedAt: now };
    list[index] = savedItem;
  } else {
    savedItem = { ...quiz, createdAt: now };
    list.unshift(savedItem);
  }

  memoryQuizzes = list;
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');

  // Asynchronously sync to Supabase Cloud
  if (supabase) {
    supabase.from('quizzes').upsert({
      id: savedItem.id,
      title: savedItem.title,
      description: savedItem.description || '',
      created_at: savedItem.createdAt || now,
      questions: savedItem.questions || []
    }).then(({ error }) => {
      if (error) console.error('[Supabase] Error saving quiz:', error.message);
      else console.log('[Supabase] Saved quiz to cloud:', savedItem.title);
    }).catch(e => console.error('[Supabase] Save exception:', e));
  }

  return savedItem;
}

export function deleteQuiz(id) {
  initStorage();
  let list = getAllQuizzes().filter(q => q.id !== id);
  memoryQuizzes = list;
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');

  // Asynchronously delete from Supabase Cloud
  if (supabase) {
    supabase.from('quizzes').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('[Supabase] Error deleting quiz:', error.message);
      else console.log('[Supabase] Deleted quiz from cloud:', id);
    }).catch(e => console.error('[Supabase] Delete exception:', e));
  }

  return true;
}
