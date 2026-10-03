module.exports = function(app, { binGet, binPut, findByToken, loadUsers, tgSend }) {

  app.post('/api/wish/create', async (req, res) => {
    const { token, text } = req.body || {};
    const me = findByToken(token);
    if (!me) return res.status(401).json({ error: 'no' });
    if (!text || !text.trim()) return res.status(400).json({ error: 'Пусто' });
    try {
      let data = await binGet();
      if (!data.wishes) data.wishes = [];
      const id = 'w_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      data.wishes.unshift({
        id,
        from: me.id,
        fromName: me.name,
        fromEmoji: me.emoji,
        text: text.trim().slice(0, 300),
        createdAt: Date.now(),
        seenBy: []
      });
      if (data.wishes.length > 100) data.wishes = data.wishes.slice(0, 100);
      await binPut(data);

      const others = loadUsers().filter(u => u.id !== me.id && u.chatId);
      const msg = `🌟 <b>${me.name}</b> написал(а) желание!\n\nЗагляни в приложение 💫`;
      for (const o of others) await tgSend(o.chatId, msg);

      res.json({ ok: true, id });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/wish/list', async (req, res) => {
    const me = findByToken(req.query.token);
    if (!me) return res.status(401).json({ error: 'no' });
    try {
      const data = await binGet();
      const list = (data.wishes || []).slice(0, 30).map(w => ({
        id: w.id,
        from: w.from,
        fromName: w.fromName,
        fromEmoji: w.fromEmoji,
        text: w.text,
        createdAt: w.createdAt,
        isMine: w.from === me.id,
        seen: (w.seenBy || []).includes(me.id)
      }));
      res.json({ wishes: list });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/wish/seen', async (req, res) => {
    const { token, id } = req.body || {};
    const me = findByToken(token);
    if (!me) return res.status(401).json({ error: 'no' });
    try {
      const data = await binGet();
      const w = (data.wishes || []).find(x => x.id === id);
      if (!w) return res.json({ ok: true });
      if (!w.seenBy) w.seenBy = [];
      if (!w.seenBy.includes(me.id)) {
        w.seenBy.push(me.id);
        await binPut(data);
      }
      res.json({ ok: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/wish/delete', async (req, res) => {
    const { token, id } = req.body || {};
    const me = findByToken(token);
    if (!me) return res.status(401).json({ error: 'no' });
    try {
      const data = await binGet();
      const w = (data.wishes || []).find(x => x.id === id);
      if (!w || w.from !== me.id) return res.status(403).json({ error: 'нельзя' });
      data.wishes = data.wishes.filter(x => x.id !== id);
      await binPut(data);
      res.json({ ok: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });
};
