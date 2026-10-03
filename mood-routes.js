module.exports = function(app, { binGet, binPut, findByToken, loadUsers, tgSend }) {

  /* Установить настроение */
  app.post('/api/mood/set', async (req, res) => {
    const { token, mood } = req.body || {};
    const me = findByToken(token);
    if (!me) return res.status(401).json({ error: 'no' });
    if (!mood || !mood.trim()) return res.status(400).json({ error: 'Пусто' });

    const cleanMood = mood.trim().slice(0, 100);
    try {
      let data = await binGet();
      if (!data.moods) data.moods = {};
      const today = new Date().toISOString().slice(0, 10);
      data.moods[me.id] = {
        name: me.name,
        emoji: me.emoji,
        mood: cleanMood,
        date: today,
        timestamp: Date.now()
      };
      await binPut(data);

      // Уведомляем остальных
      const others = loadUsers().filter(u => u.id !== me.id && u.chatId);
      const msg = '🎭 <b>' + me.name + '</b> поделился настроением:\n\n💬 «' + cleanMood + '»';
      for (const o of others) await tgSend(o.chatId, msg);

      res.json({ ok: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  /* Получить настроения всех */
  app.get('/api/mood/list', async (req, res) => {
    const me = findByToken(req.query.token);
    if (!me) return res.status(401).json({ error: 'no' });
    try {
      const data = await binGet();
      const moods = data.moods || {};
      const today = new Date().toISOString().slice(0, 10);
      const list = [];
      Object.keys(moods).forEach(id => {
        const m = moods[id];
        if (id === me.id) return;
        // только свежие (сегодняшние)
        if (m.date === today) {
          list.push({
            id,
            name: m.name,
            emoji: m.emoji,
            mood: m.mood,
            timestamp: m.timestamp
          });
        }
      });
      // своё настроение на сегодня
      const mine = moods[me.id] && moods[me.id].date === today ? moods[me.id].mood : null;
      res.json({ moods: list, mine });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });
};
