import { saveHistoryItem } from './historyStorage.js';

export class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // pin -> roomData
  }

  generatePin() {
    let pin;
    do {
      pin = Math.floor(1000 + Math.random() * 9000).toString();
    } while (this.rooms.has(pin));
    return pin;
  }

  createRoom(quiz, hostSocketId) {
    const pin = this.generatePin();
    const room = {
      pin,
      hostSocketId,
      quiz,
      state: 'LOBBY', // LOBBY, GET_READY, QUESTION, RESULT, LEADERBOARD, PODIUM
      currentQuestionIndex: -1,
      questionStartTime: null,
      questionTimer: null,
      countdownTimer: null,
      players: new Map(), // socketId -> playerData
      answers: new Map(), // socketId -> { optionIndex, timeTaken, isCorrect, points }
    };

    this.rooms.set(pin, room);
    return room;
  }

  getRoom(pin) {
    return this.rooms.get(pin);
  }

  addPlayer(pin, socketId, nickname) {
    const room = this.rooms.get(pin);
    if (!room) return { error: "Room tidak ditemukan!" };
    if (room.state !== 'LOBBY') return { error: "Permainan sudah dimulai!" };

    // Check duplicate name
    for (const p of room.players.values()) {
      if (p.name.toLowerCase() === nickname.trim().toLowerCase()) {
        return { error: "Nama sudah dipakai di room ini!" };
      }
    }

    const player = {
      id: socketId,
      name: nickname.trim(),
      score: 0,
      streak: 0,
      connected: true
    };

    room.players.set(socketId, player);
    return { player, room };
  }

  removePlayer(socketId) {
    for (const room of this.rooms.values()) {
      if (room.players.has(socketId)) {
        const player = room.players.get(socketId);
        room.players.delete(socketId);
        return { room, player };
      }
    }
    return null;
  }

  kickPlayer(pin, targetPlayerId) {
    const room = this.rooms.get(pin);
    if (!room) return null;
    if (room.players.has(targetPlayerId)) {
      const p = room.players.get(targetPlayerId);
      room.players.delete(targetPlayerId);
      return p;
    }
    return null;
  }

  startGame(pin) {
    const room = this.rooms.get(pin);
    if (!room || room.players.size === 0) return false;
    this.startGetReady(pin, 0);
    return true;
  }

  startGetReady(pin, questionIndex) {
    const room = this.rooms.get(pin);
    if (!room) return;

    room.state = 'GET_READY';
    room.currentQuestionIndex = questionIndex;
    room.answers.clear();

    const q = room.quiz.questions[questionIndex];
    let count = 5;

    this.io.to(`host:${pin}`).emit('game:get_ready', {
      questionIndex,
      totalQuestions: room.quiz.questions.length,
      questionText: q.question,
      timeLimit: q.timeLimit,
      countdown: count
    });

    this.io.to(`players:${pin}`).emit('player:get_ready', {
      questionIndex,
      totalQuestions: room.quiz.questions.length,
      countdown: count
    });

    if (room.countdownTimer) clearInterval(room.countdownTimer);

    room.countdownTimer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        this.io.to(`host:${pin}`).emit('game:get_ready_tick', { countdown: count });
        this.io.to(`players:${pin}`).emit('player:get_ready_tick', { countdown: count });
      } else {
        clearInterval(room.countdownTimer);
        room.countdownTimer = null;
        this.startQuestion(pin);
      }
    }, 1000);
  }

  startQuestion(pin) {
    const room = this.rooms.get(pin);
    if (!room) return;

    room.state = 'QUESTION';
    room.questionStartTime = Date.now();
    const q = room.quiz.questions[room.currentQuestionIndex];
    const duration = q.timeLimit || 20;

    // Send full data with option texts to host
    this.io.to(`host:${pin}`).emit('game:question_start', {
      questionIndex: room.currentQuestionIndex,
      question: q.question,
      options: q.options.map(o => o.text),
      timeLimit: duration,
      totalPlayers: room.players.size,
      answersCount: 0
    });

    // Send minimal shape/button count to players (fast & low bandwidth)
    this.io.to(`players:${pin}`).emit('player:question_start', {
      questionIndex: room.currentQuestionIndex,
      optionsCount: q.options.length,
      timeLimit: duration
    });

    if (room.questionTimer) clearTimeout(room.questionTimer);

    room.questionTimer = setTimeout(() => {
      this.endQuestion(pin);
    }, duration * 1000);
  }

  submitAnswer(pin, socketId, optionIndex) {
    const room = this.rooms.get(pin);
    if (!room || room.state !== 'QUESTION') return false;
    if (room.answers.has(socketId)) return false; // Already answered

    const player = room.players.get(socketId);
    if (!player) return false;

    const q = room.quiz.questions[room.currentQuestionIndex];
    const duration = q.timeLimit || 20;
    const elapsedSeconds = Math.min(duration, (Date.now() - room.questionStartTime) / 1000);

    const isCorrect = q.options[optionIndex]?.isCorrect || false;
    let pointsEarned = 0;

    if (isCorrect) {
      // Dynamic speed-based scoring: 500 to 1000 points
      const decayRatio = (elapsedSeconds / duration) * 0.5;
      pointsEarned = Math.round(1000 * (1 - decayRatio));
      player.streak += 1;
    } else {
      player.streak = 0;
    }

    player.score += pointsEarned;

    room.answers.set(socketId, {
      optionIndex,
      elapsedSeconds,
      isCorrect,
      pointsEarned
    });

    // Notify player that answer was recorded
    this.io.to(socketId).emit('player:answer_recorded', {
      selectedOptionIndex: optionIndex
    });

    // Update host on answer count
    this.io.to(`host:${pin}`).emit('game:answer_count_update', {
      answeredCount: room.answers.size,
      totalPlayers: room.players.size
    });

    // Early finish: if all active players answered, end round immediately
    if (room.answers.size >= room.players.size) {
      if (room.questionTimer) {
        clearTimeout(room.questionTimer);
        room.questionTimer = null;
      }
      setTimeout(() => this.endQuestion(pin), 300);
    }

    return true;
  }

  endQuestion(pin) {
    const room = this.rooms.get(pin);
    if (!room || room.state !== 'QUESTION') return;

    room.state = 'RESULT';
    const q = room.quiz.questions[room.currentQuestionIndex];
    const correctOptionIndex = q.options.findIndex(o => o.isCorrect);

    // Distribution stats
    const stats = new Array(q.options.length).fill(0);
    for (const ans of room.answers.values()) {
      if (ans.optionIndex >= 0 && ans.optionIndex < stats.length) {
        stats[ans.optionIndex]++;
      }
    }

    // Sort players for current ranking
    const rankedPlayers = Array.from(room.players.values())
      .sort((a, b) => b.score - a.score);

    // Notify host
    this.io.to(`host:${pin}`).emit('game:question_result', {
      correctOptionIndex,
      stats,
      totalAnswers: room.answers.size,
      totalPlayers: room.players.size
    });

    // Notify each player with individual feedback
    for (const [sId, p] of room.players.entries()) {
      const ans = room.answers.get(sId);
      const isCorrect = ans ? ans.isCorrect : false;
      const points = ans ? ans.pointsEarned : 0;
      const rank = rankedPlayers.findIndex(x => x.id === sId) + 1;

      this.io.to(sId).emit('player:round_result', {
        isCorrect,
        pointsEarned: points,
        totalScore: p.score,
        streak: p.streak,
        rank,
        answered: !!ans
      });
    }
  }

  showLeaderboard(pin) {
    const room = this.rooms.get(pin);
    if (!room) return;

    room.state = 'LEADERBOARD';

    const rankedPlayers = Array.from(room.players.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Top 10

    const isLastQuestion = room.currentQuestionIndex >= room.quiz.questions.length - 1;

    this.io.to(`host:${pin}`).emit('game:leaderboard', {
      top10: rankedPlayers.map((p, idx) => ({
        rank: idx + 1,
        id: p.id,
        name: p.name,
        score: p.score,
        streak: p.streak
      })),
      isLastQuestion
    });

    this.io.to(`players:${pin}`).emit('player:leaderboard', {
      isLastQuestion
    });
  }

  showPodium(pin) {
    const room = this.rooms.get(pin);
    if (!room) return;

    room.state = 'PODIUM';

    const allRanked = Array.from(room.players.values())
      .sort((a, b) => b.score - a.score);

    const top3 = allRanked.slice(0, 3).map((p, idx) => ({
      rank: idx + 1,
      id: p.id,
      name: p.name,
      score: p.score
    }));

    this.io.to(`host:${pin}`).emit('game:podium', {
      top3,
      allPlayers: allRanked.map((p, idx) => ({
        rank: idx + 1,
        name: p.name,
        score: p.score
      }))
    });

    // Auto-save game session to history
    try {
      saveHistoryItem({
        id: `hist-${Date.now()}`,
        quizId: room.quiz.id,
        quizTitle: room.quiz.title,
        playedAt: new Date().toISOString(),
        totalQuestions: room.quiz.questions.length,
        totalPlayers: allRanked.length,
        podium: top3.map(p => ({ rank: p.rank, name: p.name, score: p.score })),
        leaderboard: allRanked.map((p, idx) => ({ rank: idx + 1, name: p.name, score: p.score }))
      });
    } catch (err) {
      console.error('[History] Failed to auto-save game history:', err);
    }

    for (const [sId, p] of room.players.entries()) {
      const rank = allRanked.findIndex(x => x.id === sId) + 1;
      this.io.to(sId).emit('player:podium', {
        rank,
        totalScore: p.score,
        isWinner: rank <= 3
      });
    }
  }

  advanceGame(pin) {
    const room = this.rooms.get(pin);
    if (!room) return;

    if (room.state === 'RESULT') {
      this.showLeaderboard(pin);
    } else if (room.state === 'LEADERBOARD') {
      const isLastQuestion = room.currentQuestionIndex >= room.quiz.questions.length - 1;
      if (isLastQuestion) {
        this.showPodium(pin);
      } else {
        this.startGetReady(pin, room.currentQuestionIndex + 1);
      }
    }
  }

  deleteRoom(pin) {
    const room = this.rooms.get(pin);
    if (room) {
      if (room.countdownTimer) clearInterval(room.countdownTimer);
      if (room.questionTimer) clearTimeout(room.questionTimer);
      this.rooms.delete(pin);
    }
  }
}
