module.exports = function(app, { binGet, binPut, findByToken, loadUsers, tgSend }) {

  app.post('/api/ai-image', async (req, res) => {
    const { token, to, prompt } = req.body || {};
    const me = findByToken(token);
    if (!me) return res.status(401).json({ error: 'no' });
    if (!to || !prompt || !prompt.trim()) return res.status(400).json({ error: 'Пустой запрос' });
    if (prompt.length > 200) return res.status(400).json({ error: 'Слишком длинно' });

    const receiver = loadUsers().find(u => u.id === to);
    if (!receiver) return res.status(404).json({ error: 'Получатель не найден' });
    if (!receiver.chatId) return res.status(400).json({ error: receiver.name + ' не подключён' });

    try {
      const cleanPrompt = prompt.trim().slice(0, 200);
      const seed = Math.floor(Math.random() * 999999);
      const url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(cleanPrompt)
        + '?width=1024&height=1024&nologo=true&seed=' + seed + '&model=flux';

      console.log('AI: generating "' + cleanPrompt + '"');
      const imgResp = await fetch(url);
      if (!imgResp.ok) throw new Error('Pollinations ответил ' + imgResp.status);
      const buf = await imgResp.arrayBuffer();
      const contentType = imgResp.headers.get('content-type') || 'image/jpeg';
      console.log('AI: got', buf.byteLength, 'bytes');

      const formData = new FormData();
      formData.append('chat_id', receiver.chatId);
      formData.append('photo', new Blob([buf], { type: contentType }), 'ai.jpg');
      formData.append('caption', me.emoji + ' ' + me.name + ' 🎨\n\n"' + cleanPrompt + '"');

      const BOT_TOKEN = process.env.TG_BOT_TOKEN;
      const tgResp = await fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendPhoto', {
        method: 'POST', body: formData
      });
      const tgData = await tgResp.json();
      if (!tgData.ok) throw new Error(tgData.description || 'Telegram error');

      res.json({ ok: true });
    } catch(e) {
      console.error('AI error:', e.message);
      res.status(500).json({ error: e.message });
    }
  });
};
