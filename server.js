require('dotenv').config();
const express = require('express');
const multer  = require('multer');
const fs      = require('fs');
const path    = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const BOT_TOKEN = process.env.TG_BOT_TOKEN;
if (!BOT_TOKEN) { console.error('No TG_BOT_TOKEN in .env'); process.exit(1); }

const USERS_FILE = path.join(__dirname, 'users.json');
const loadUsers = () => {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')).users || []; }
  catch (e) { console.error('users.json:', e.message); return []; }
};
const findByToken = t => t ? loadUsers().find(u => u.token === t) : null;

app.use(express.json({ limit: '15mb' }));
app.use(express.static('public'));

app.get('/api/me', (req, res) => {
  const u = findByToken(req.query.token);
  if (!u) return res.status(401).json({ error: 'no' });
  res.json({ user: { id: u.id, name: u.name, emoji: u.emoji } });
});

app.get('/api/users', (req, res) => {
  const me = findByToken(req.query.token);
  if (!me) return res.status(401).json({ error: 'no' });
  res.json({ users: loadUsers().filter(u => u.id !== me.id).map(u => ({
    id: u.id, name: u.name, emoji: u.emoji, ready: !!u.chatId
  })) });
});

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('');
  console.log('  ✅  Server zapushchen');
  console.log('');
  console.log('  📱  Персональные ссылки:');
  console.log('');
  loadUsers().forEach(u => {
    console.log(`   ${u.chatId ? '✓' : '✗'}  ${u.emoji} ${u.name}`);
    console.log(`      http://192.168.0.2:${PORT}/?token=${u.token}`);
    console.log('');
  });
});
