import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HISTORY_FILE = path.join(__dirname, '..', 'data', 'history.json');

let memoryHistory = null;

function ensureHistoryFile() {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export async function syncHistoryFromSupabase() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase
      .from('game_history')
      .select('*')
      .order('played_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] Warning fetching history:', error.message);
      return;
    }

    if (data) {
      memoryHistory = data.map((row) => ({
        id: row.id,
        quizId: row.quiz_id,
        quizTitle: row.quiz_title,
        playedAt: row.played_at,
        totalQuestions: row.total_questions,
        totalPlayers: row.total_players,
        winnerCount: row.winner_count || 3,
        podium: row.podium || [],
        leaderboard: row.leaderboard || []
      }));
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(memoryHistory, null, 2), 'utf-8');
      console.log(`[Supabase] Synced ${data.length} game history records from cloud.`);
    }
  } catch (err) {
    console.error('[Supabase] Error syncing history:', err);
  }
}

export function getAllHistory() {
  if (memoryHistory) {
    return memoryHistory;
  }
  ensureHistoryFile();
  try {
    const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
    memoryHistory = JSON.parse(data);
    return memoryHistory;
  } catch (err) {
    console.error('Error reading history file:', err);
    memoryHistory = [];
    return [];
  }
}

export function saveHistoryItem(item) {
  ensureHistoryFile();
  const history = [...getAllHistory()];
  history.unshift(item);
  memoryHistory = history;
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');

  // Asynchronously save to Supabase Cloud
  if (supabase) {
    supabase.from('game_history').insert({
      id: item.id,
      quiz_id: item.quizId,
      quiz_title: item.quizTitle,
      played_at: item.playedAt || new Date().toISOString(),
      total_questions: item.totalQuestions,
      total_players: item.totalPlayers,
      winner_count: item.winnerCount || 3,
      podium: item.podium,
      leaderboard: item.leaderboard
    }).then(({ error }) => {
      if (error) console.error('[Supabase] Error saving game history:', error.message);
      else console.log('[Supabase] Saved game history to cloud for:', item.quizTitle);
    }).catch(e => console.error('[Supabase] History save exception:', e));
  }

  return item;
}

export function deleteHistoryItem(id) {
  ensureHistoryFile();
  const history = getAllHistory().filter((h) => h.id !== id);
  memoryHistory = history;
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');

  if (supabase) {
    supabase.from('game_history').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('[Supabase] Error deleting history item:', error.message);
      else console.log('[Supabase] Deleted history record from cloud:', id);
    }).catch(e => console.error('[Supabase] Delete history exception:', e));
  }

  return true;
}

export function clearAllHistory() {
  ensureHistoryFile();
  memoryHistory = [];
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2), 'utf-8');

  if (supabase) {
    supabase.from('game_history').delete().neq('id', 'dummy_never_match').then(({ error }) => {
      if (error) console.error('[Supabase] Error clearing all history:', error.message);
      else console.log('[Supabase] Cleared all history in cloud.');
    }).catch(e => console.error('[Supabase] Clear history exception:', e));
  }

  return true;
}
