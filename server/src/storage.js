import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

export function initStorage() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_QUIZZES, null, 2), 'utf-8');
  }
}

export function getAllQuizzes() {
  initStorage();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading quizzes:", err);
    return DEFAULT_QUIZZES;
  }
}

export function getQuizById(id) {
  const list = getAllQuizzes();
  return list.find(q => q.id === id) || null;
}

export function saveQuiz(quiz) {
  initStorage();
  const list = getAllQuizzes();
  const index = list.findIndex(q => q.id === quiz.id);
  if (index >= 0) {
    list[index] = { ...quiz, updatedAt: new Date().toISOString() };
  } else {
    list.unshift({ ...quiz, createdAt: new Date().toISOString() });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');
  return quiz;
}

export function deleteQuiz(id) {
  initStorage();
  let list = getAllQuizzes();
  list = list.filter(q => q.id !== id);
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');
  return true;
}
