module.exports = function(app, { binGet, binPut, findByToken, loadUsers, tgSend }) {

  /* Получить профиль */
  app.get('/api/profile', async (req, res) => {
    const me = findByToken(req.query.token);
    if (!me) return res.status(401).json({ error: 'no' });
    try {
      const data = await binGet();
      const p = (data.profiles || {})[me.id] || {};
      res.json({
        name: p.name || me.name,
        emoji: p.emoji || me.emoji,
        buttons: p.buttons || []
      });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  /* Сохранить профиль */
  app.post('/api/profile', async (req, res) => {
    const { token, name, emoji, buttons } = req.body || {};
    const me = findByToken(token);
    if (!me) return res.status(401).json({ error: 'no' });
    try {
      let data = await binGet();
      if (!data.profiles) data.profiles = {};
      if (!data.profiles[me.id]) data.profiles[me.id] = {};
      const p = data.profiles[me.id];

      if (typeof name === 'string') p.name = name.slice(0, 30).trim() || me.name;
      if (typeof emoji === 'string') p.emoji = emoji.slice(0, 4).trim() || me.emoji;

      if (Array.isArray(buttons)) {
        p.buttons = buttons.slice(0, 8).map(function(b) {
          return {
            id: String(b.id || (Date.now() + Math.random())).slice(0, 40),
            emoji: String(b.emoji || '💖').slice(0, 4),
            label: String(b.label || 'Действие').slice(0, 20),
            message: String(b.message || '💖').slice(0, 200),
            color: ['pink','mag','pur','blue','dark'].indexOf(b.color) >= 0 ? b.color : 'pink'
          };
        });
      }

      await binPut(data);
      res.json({ ok: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });
};
