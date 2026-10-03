require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '15mb' }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const BOT_TOKEN = process.env.TG_BOT_TOKEN;
const JSONBIN_KEY = process.env.JSONBIN_KEY;
const JSONBIN_BIN = process.env.JSONBIN_BIN;
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN}`;

if (!BOT_TOKEN) { console.error('No TG_BOT_TOKEN'); process.exit(1); }
if (!JSONBIN_KEY || !JSONBIN_BIN) { console.error('No JSONBIN vars'); process.exit(1); }

const USERS_FILE = path.join(__dirname, 'users.json');
const loadUsers = () => { try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')).users || []; } catch(e) { return []; } };
const findByToken = t => t ? loadUsers().find(u => u.token === t) : null;

/* ============ JSONBIN ============ */
async function binGet() {
  const r = await fetch(`${JSONBIN_URL}/latest`, { headers: { 'X-Master-Key': JSONBIN_KEY } });
  const d = await r.json();
  return d.record || {};
}
async function binPut(record) {
  const r = await fetch(JSONBIN_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_KEY },
    body: JSON.stringify(record)
  });
  return r.ok;
}

/* ============ TELEGRAM ============ */
async function tgSend(chatId, text) {
  if (!chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
  } catch(e) {}
}

/* ============ ДАТЫ ============ */
function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function yesterdayStr() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
function dayWord(n) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'день';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'дня';
  return 'дней';
}

/* ============ STREAK LOGIC ============ */
function ensureStreaks(data) {
  if (!data.streaks) data.streaks = {};
  if (!data.punishments) data.punishments = [];
  const users = loadUsers();
  const today = todayStr();
  const yest = yesterdayStr();
  let changed = false;

  users.forEach(u => {
    if (!data.streaks[u.id]) {
      data.streaks[u.id] = {
        name: u.name, emoji: u.emoji, current: 0, best: 0,
        lastCheckIn: null, missed: false, achievement: null
      };
      changed = true;
    }
    const s = data.streaks[u.id];
    if (s.name !== u.name) { s.name = u.name; changed = true; }
    if (s.emoji !== u.emoji) { s.emoji = u.emoji; changed = true; }
    // Проверка пропуска: если lastCheckIn есть, но он НЕ сегодня и НЕ вчера
    if (s.lastCheckIn && s.lastCheckIn !== today && s.lastCheckIn !== yest) {
      if (s.current > 0) { s.current = 0; changed = true; }
      if (!s.missed) { s.missed = true; changed = true; }
    }
  });
  return { data, changed };
}

/* ============ API: ME ============ */
app.get('/api/me', (req, res) => {
  const u = findByToken(req.query.token);
  if (!u) return res.status(401).json({ error: 'no' });
  res.json({ user: { id: u.id, name: u.name, emoji: u.emoji } });
});

/* ============ API: USERS ============ */
app.get('/api/users', (req, res) => {
  const me = findByToken(req.query.token);
  if (!me) return res.status(401).json({ error: 'no' });
  res.json({ users: loadUsers().filter(u => u.id !== me.id).map(u => ({
    id: u.id, name: u.name, emoji: u.emoji, ready: !!u.chatId
  })) });
});

/* ============ API: STREAKS ============ */
app.get('/api/streaks', async (req, res) => {
  const me = findByToken(req.query.token);
  if (!me) return res.status(401).json({ error: 'no' });
  try {
    let data = await binGet();
    const r = ensureStreaks(data);
    if (r.changed) await binPut(r.data);
    res.json({
      streaks: r.data.streaks,
      me: r.data.streaks[me.id],
      today: todayStr(),
      yesterday: yesterdayStr(),
      punishments: (r.data.punishments || []).slice(0, 10)
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

/* ============ API: CHECKIN ============ */
app.post('/api/checkin', async (req, res) => {
  const { token } = req.body || {};
  const me = findByToken(token);
  if (!me) return res.status(401).json({ error: 'no' });
  try {
    let data = await binGet();
    const r = ensureStreaks(data);
    data = r.data;
    const today = todayStr();
    const yest = yesterdayStr();
    const s = data.streaks[me.id];

    if (s.lastCheckIn === today) {
      return res.json({ ok: true, already: true, current: s.current, best: s.best });
    }

    if (s.lastCheckIn === yest) s.current = (s.current || 0) + 1;
    else s.current = 1;
    s.lastCheckIn = today;
    s.missed = false;
    if (s.current > (s.best || 0)) s.best = s.current;

    const ACH = [
      { days: 5, name: '🥉 Начало пути' },
      { days: 10, name: '🥈 Первая десятка' },
      { days: 30, name: '🥇 Месяц силы' },
      { days: 100, name: '💎 Легенда' }
    ];
    if (!s.achievements) s.achievements = [];
    let newAch = null;
    for (const a of ACH) {
      if (s.current >= a.days && !s.achievements.includes(a.days)) {
        s.achievements.push(a.days);
        newAch = a;
      }
    }

    await binPut(data);

    const others = loadUsers().filter(u => u.id !== me.id && u.chatId);
    const msg = `🔥 <b>${me.name}</b> сделала серию в <b>${s.current} ${dayWord(s.current)}</b>!`;
    for (const o of others) await tgSend(o.chatId, msg);

    if (newAch) {
      const achMsg = `🏆 <b>${me.name}</b> получила достижение: <b>${newAch.name}</b>`;
      for (const o of others) await tgSend(o.chatId, achMsg);
    }

    res.json({ ok: true, current: s.current, best: s.best, achievement: newAch });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

/* ============ API: PUNISH (НАЗНАЧИТЬ ДРУГОМУ) ============ */
app.post('/api/punish', async (req, res) => {
  const { token, to, text } = req.body || {};
  const me = findByToken(token);       // кто назначает
  if (!me) return res.status(401).json({ error: 'no' });
  if (!to || !text || !text.trim()) return res.status(400).json({ error: 'Пусто' });

  const target = loadUsers().find(u => u.id === to);
  if (!target) return res.status(404).json({ error: 'Получатель не найден' });
  if (target.id === me.id) return res.status(400).json({ error: 'Себе нельзя' });

  try {
    let data = await binGet();
    const r = ensureStreaks(data);
    data = r.data;

    const sTarget = data.streaks[target.id];
    if (!sTarget) return res.status(400).json({ error: 'Нет данных' });
    if (!sTarget.missed) return res.status(400).json({ error: target.name + ' не пропустила день' });

    // сохраняем наказание
    data.punishments.unshift({
      from: me.name, fromEmoji: me.emoji,
      to: target.name, toEmoji: target.emoji,
      text: text.trim().slice(0, 200),
      date: todayStr()
    });
    data.punishments = data.punishments.slice(0, 20);
    // сбрасываем флаг miss, чтобы не назначали повторно
    sTarget.missed = false;

    await binPut(data);

    // Отправляем наказание ТОМУ, кому назначено
    if (target.chatId) {
      await tgSend(target.chatId,
        `😈 <b>Наказание от ${me.name}</b>\n\n${text.trim()}\n\n<i>Причина: пропущенный день серии</i>`);
    }

    // Отправляем остальным (для информации)
    const others = loadUsers().filter(u => u.id !== me.id && u.id !== target.id && u.chatId);
    for (const o of others) {
      await tgSend(o.chatId,
        `😈 <b>${me.name}</b> назначил наказание <b>${target.name}</b>:\n\n${text.trim()}`);
    }

    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

/* ============ API: SEND LOVE ============ */
app.post('/api/send-love', async (req, res) => {
  const { token, to, message } = req.body || {};
  const s = findByToken(token);
  if (!s) return res.status(401).json({ error: 'no' });
  if (!to || !message) return res.status(400).json({ error: 'no to/message' });
  const r = loadUsers().find(u => u.id === to);
  if (!r) return res.status(404).json({ error: 'not found' });
  if (!r.chatId) return res.status(400).json({ error: r.name + ' не подключён' });
  const text = `${s.emoji} <b>${s.name}</b>\n\n${message}`.slice(0, 1000);
  try {
    const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: r.chatId, text, parse_mode: 'HTML' })
    });
    const d = await resp.json();
    if (!d.ok) return res.status(500).json({ error: d.description });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ============ API: SEND PHOTO ============ */
app.post('/api/send-photo', upload.single('photo'), async (req, res) => {
  const { token, to, caption, kind } = req.body || {};
  const s = findByToken(token);
  if (!s) return res.status(401).json({ error: 'no' });
  if (!to || !req.file) return res.status(400).json({ error: 'no to/photo' });
  const r = loadUsers().find(u => u.id === to);
  if (!r) return res.status(404).json({ error: 'not found' });
  if (!r.chatId) return res.status(400).json({ error: r.name + ' не подключён' });
  const cap = kind === 'drawing' ? '🎨 рисунок для тебя' : (caption || '📸 фото');
  try {
    const fd = new FormData();
    fd.append('chat_id', r.chatId);
    fd.append('photo', new Blob([req.file.buffer], { type: req.file.mimetype }), 'image.png');
    fd.append('caption', `${s.emoji} ${s.name}: ${cap}`);
    const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: 'POST', body: fd });
    const d = await resp.json();
    if (!d.ok) return res.status(500).json({ error: d.description });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ============ STATIC ============ */
require("./wish-routes")(app, { binGet, binPut, findByToken, loadUsers, tgSend });
require("./quiz-routes")(app, { binGet, binPut, findByToken, loadUsers, tgSend, BOT_TOKEN });
require("./profile-routes")(app, { binGet, binPut, findByToken, loadUsers, tgSend });
app.use(express.static('public'));

/* ============ START ============ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('');
  console.log('  ✅  Server zapushchen');
  console.log('');
  loadUsers().forEach(u => {
    console.log(`   ${u.chatId ? '✓' : '✗'}  ${u.emoji} ${u.name}`);
  });
  console.log('');
});
