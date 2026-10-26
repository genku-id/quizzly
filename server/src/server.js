import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { getAllQuizzes, getQuizById, saveQuiz, deleteQuiz, syncQuizzesFromSupabase } from './storage.js';
import { getAllHistory, deleteHistoryItem, clearAllHistory, syncHistoryFromSupabase } from './historyStorage.js';
import { RoomManager } from './rooms.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const roomManager = new RoomManager(io);

// === REST API ===

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/quizzes', (req, res) => {
  res.json(getAllQuizzes());
});

app.get('/api/quizzes/:id', (req, res) => {
  const quiz = getQuizById(req.params.id);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
  res.json(quiz);
});

app.post('/api/quizzes', (req, res) => {
  const { title, description, questions } = req.body;
  if (!title || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'Invalid quiz payload' });
  }

  const newQuiz = {
    id: req.body.id || `quiz-${uuidv4()}`,
    title,
    description: description || '',
    questions: questions.map((q, idx) => ({
      id: q.id || `q-${idx + 1}`,
      question: q.question,
      timeLimit: Number(q.timeLimit) || 20,
      options: q.options || []
    }))
  };

  const saved = saveQuiz(newQuiz);
  res.status(201).json(saved);
});

app.put('/api/quizzes/:id', (req, res) => {
  const { title, description, questions } = req.body;
  if (!title || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'Invalid quiz payload' });
  }

  const existing = getQuizById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const updatedQuiz = {
    id: req.params.id,
    title,
    description: description || '',
    createdAt: existing.createdAt || new Date().toISOString(),
    questions: questions.map((q, idx) => ({
      id: q.id || `q-${idx + 1}`,
      question: q.question,
      timeLimit: Number(q.timeLimit) || 20,
      options: q.options || []
    }))
  };

  const saved = saveQuiz(updatedQuiz);
  res.json(saved);
});

app.post('/api/quizzes/:id/duplicate', (req, res) => {
  const existing = getQuizById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const duplicated = {
    ...existing,
    id: `quiz-${uuidv4()}`,
    title: `${existing.title} (Salinan)`,
    createdAt: new Date().toISOString()
  };

  const saved = saveQuiz(duplicated);
  res.status(201).json(saved);
});

app.delete('/api/quizzes/:id', (req, res) => {
  deleteQuiz(req.params.id);
  res.json({ success: true });
});

// === HISTORY API ===
app.get('/api/history', (req, res) => {
  res.json(getAllHistory());
});

app.delete('/api/history/:id', (req, res) => {
  deleteHistoryItem(req.params.id);
  res.json({ success: true });
});

app.delete('/api/history', (req, res) => {
  clearAllHistory();
  res.json({ success: true });
});

// Serve frontend build if present (for single-service deployment)
const distPath = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// === SOCKET.IO REALTIME HANDLERS ===

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // 1. Host creates a room
  socket.on('host:create_room', ({ quizId }) => {
    const quiz = getQuizById(quizId);
    if (!quiz) {
      return socket.emit('host:error', { message: 'Kuis tidak ditemukan!' });
    }

    const room = roomManager.createRoom(quiz, socket.id);
    socket.join(`host:${room.pin}`);

    console.log(`[Host] Created room PIN: ${room.pin} for quiz "${quiz.title}"`);
    socket.emit('host:room_created', {
      pin: room.pin,
      quizTitle: quiz.title,
      totalQuestions: quiz.questions.length
    });
  });

  // 2. Player joins room via PIN & Nickname
  socket.on('player:join', ({ pin, nickname }) => {
    const cleanPin = pin ? pin.toString().trim() : '';
    const res = roomManager.addPlayer(cleanPin, socket.id, nickname);

    if (res.error) {
      return socket.emit('player:join_error', { message: res.error });
    }

    socket.join(`players:${cleanPin}`);
    console.log(`[Player] ${nickname} joined room ${cleanPin}`);

    socket.emit('player:join_success', {
      pin: cleanPin,
      nickname: res.player.name
    });

    // Notify host about new player
    io.to(`host:${cleanPin}`).emit('game:player_joined', {
      playerId: socket.id,
      name: res.player.name,
      totalPlayers: res.room.players.size,
      playerList: Array.from(res.room.players.values()).map(p => ({ id: p.id, name: p.name }))
    });
  });

  // 3. Host starts game
  socket.on('host:start_game', ({ pin, winnerCount }) => {
    const success = roomManager.startGame(pin, winnerCount);
    if (!success) {
      socket.emit('host:error', { message: 'Gagal memulai kuis (pastikan ada pemain yang bergabung).' });
    }
  });

  // 4. Player submits answer
  socket.on('player:submit_answer', ({ pin, optionIndex }) => {
    roomManager.submitAnswer(pin, socket.id, optionIndex);
  });

  // 5. Host advances (Result -> Leaderboard -> Next Question / Podium)
  socket.on('host:advance', ({ pin }) => {
    roomManager.advanceGame(pin);
  });

  // 6. Host kicks player
  socket.on('host:kick', ({ pin, targetPlayerId }) => {
    const kicked = roomManager.kickPlayer(pin, targetPlayerId);
    if (kicked) {
      io.to(targetPlayerId).emit('player:kicked', { message: 'Kamu telah dikeluarkan oleh host.' });
      const room = roomManager.getRoom(pin);
      if (room) {
        io.to(`host:${pin}`).emit('game:player_left', {
          playerId: targetPlayerId,
          totalPlayers: room.players.size,
          playerList: Array.from(room.players.values()).map(p => ({ id: p.id, name: p.name }))
        });
      }
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const removed = roomManager.removePlayer(socket.id);
    if (removed) {
      const { room, player } = removed;
      console.log(`[Player] ${player.name} disconnected from ${room.pin}`);
      io.to(`host:${room.pin}`).emit('game:player_left', {
        playerId: socket.id,
        name: player.name,
        totalPlayers: room.players.size,
        playerList: Array.from(room.players.values()).map(p => ({ id: p.id, name: p.name }))
      });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
  console.log(`🚀 Quizzly Realtime Server running on port ${PORT}`);
  await syncQuizzesFromSupabase();
  await syncHistoryFromSupabase();
});
