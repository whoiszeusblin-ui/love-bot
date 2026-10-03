module.exports = function(app, { findByToken, loadUsers }) {

  // 1. Генерируем URL картинки (не отправляем)
  app.post('/api/ai-generate', async (req, res) => {
    const { token, prompt } = req.body || {};
    const me = findByToken(token);
    if (!me) return res.status(401).json({ error: 'no' });
    if (!prompt || !prompt.trim()) return res.status(400).json({ error: 'Пустой запрос' });
    if (prompt.length > 200) return res.status(400).json({ error: 'Слишком длинно' });

    try {
      const cleanPrompt = prompt.trim().slice(0, 200);
      const seed = Math.floor(Math.random() * 999999);
      const url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(cleanPrompt)
        + '?width=1024&height=1024&nologo=true&seed=' + seed + '&model=flux';
      res.json({ ok: true, url, prompt: cleanPrompt, seed });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  // 2. Отправляем выбранную картинку партнёру
  app.post('/api/ai-send', async (req, res) => {
    const { token, to, url, prompt } = req.body || {};
    const me = findByToken(token);
    if (!me) return res.status(401).json({ error: 'no' });
    if (!to || !url) return res.status(400).json({ error: 'Нет данных' });
    if (url.indexOf('https://image.pollinations.ai/') !== 0) {
      return res.status(400).json({ error: 'Неверный URL' });
    }

    const receiver = loadUsers().find(u => u.id === to);
    if (!receiver) return res.status(404).json({ error: 'Получатель не найден' });
    if (!receiver.chatId) return res.status(400).json({ error: receiver.name + ' не подключён' });

    try {
      console.log('AI: sending to Telegram for ' + receiver.name);
      const imgResp = await fetch(url);
      if (!imgResp.ok) throw new Error('Pollinations ответил ' + imgResp.status);
      const buf = await imgResp.arrayBuffer();
      const contentType = imgResp.headers.get('content-type') || 'image/jpeg';
      console.log('AI: got', buf.byteLength, 'bytes');

      const BOT_TOKEN = process.env.TG_BOT_TOKEN;
      const formData = new FormData();
      formData.append('chat_id', receiver.chatId);
      formData.append('photo', new Blob([buf], { type: contentType }), 'ai.jpg');
      formData.append('caption', me.emoji + ' ' + me.name + ' 🎨\n\n"' + (prompt || '') + '"');

      const tgResp = await fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendPhoto', {
        method: 'POST', body: formData
      });
      const tgData = await tgResp.json();
      if (!tgData.ok) throw new Error(tgData.description || 'Telegram error');

      res.json({ ok: true });
    } catch(e) {
      console.error('AI send error:', e.message);
      res.status(500).json({ error: e.message });
    }
  });
};
