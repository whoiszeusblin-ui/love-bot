module.exports = function(app, { binGet, binPut, findByToken, loadUsers, tgSend, BOT_TOKEN }) {

  /* ===== СОЗДАТЬ ЗАГАДКУ ===== */
  app.post('/api/quiz/create', async (req, res) => {
    const { token, to, title, questions } = req.body || {};
    const me = findByToken(token);
    if (!me) return res.status(401).json({ error: 'no' });
    if (!to || !title || !Array.isArray(questions)) return res.status(400).json({ error: 'Не хватает данных' });

    const target = loadUsers().find(u => u.id === to);
    if (!target) return res.status(404).json({ error: 'Получатель не найден' });
    if (questions.length < 1 || questions.length > 10) return res.status(400).json({ error: 'Вопросов должно быть от 1 до 10' });

    // Валидация и очистка
    const cleaned = [];
    for (const q of questions) {
      const qt = String(q.q || '').trim().slice(0, 200);
      const opts = (Array.isArray(q.options) ? q.options : []).map(o => String(o || '').trim().slice(0, 100)).filter(Boolean);
      const correct = parseInt(q.correct, 10);
      if (!qt || opts.length < 2 || isNaN(correct) || correct < 0 || correct >= opts.length) continue;
      cleaned.push({ q: qt, options: opts.slice(0, 6), correct });
    }
    if (!cleaned.length) return res.status(400).json({ error: 'Нет валидных вопросов' });

    try {
      let data = await binGet();
      if (!data.quizzes) data.quizzes = {};
      const id = 'q_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      data.quizzes[id] = {
        id,
        from: me.id, fromName: me.name, fromEmoji: me.emoji,
        to: target.id, toName: target.name, toEmoji: target.emoji,
        title: String(title).trim().slice(0, 60),
        createdAt: Date.now(),
        questions: cleaned,
        answers: null,
        completedAt: null
      };
      // Чистим старые (оставляем 50 последних)
      const keys = Object.keys(data.quizzes);
      if (keys.length > 50) {
        keys.sort((a,b) => (data.quizzes[a].createdAt||0) - (data.quizzes[b].createdAt||0));
        keys.slice(0, keys.length - 50).forEach(k => delete data.quizzes[k]);
      }
      await binPut(data);

      // Уведомление получателю
      if (target.chatId) {
        await tgSend(target.chatId,
          '🎮 <b>' + me.name + '</b> создал для тебя загадку!\n\n' +
          '<i>' + cleaned.length + ' вопрос(ов) · «' + String(title).trim().slice(0, 60) + '»</i>\n\n' +
          'Открой приложение, чтобы пройти 💫');
      }

      res.json({ ok: true, id });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  /* ===== СПИСОК ЗАГАДОК ===== */
  app.get('/api/quiz/list', async (req, res) => {
    const me = findByToken(req.query.token);
    if (!me) return res.status(401).json({ error: 'no' });
    try {
      const data = await binGet();
      const all = data.quizzes || {};
      const incoming = [];  // мне создали, я не проходил
      const outgoing = [];  // я создал
      Object.values(all).forEach(q => {
        if (q.to === me.id) {
          incoming.push({
            id: q.id, title: q.title,
            fromName: q.fromName, fromEmoji: q.fromEmoji,
            questions: q.questions.length,
            completed: !!q.completedAt
          });
        } else if (q.from === me.id) {
          outgoing.push({
            id: q.id, title: q.title,
            toName: q.toName, toEmoji: q.toEmoji,
            questions: q.questions.length,
            completed: !!q.completedAt,
            score: q.completedAt && q.answers ? q.answers.filter((a, i) => a === q.questions[i].correct).length : null
          });
        }
      });
      incoming.sort((a,b) => (b.completed ? 0 : 1) - (a.completed ? 0 : 1));
      outgoing.sort((a,b) => b.id.localeCompare(a.id));
      res.json({ incoming, outgoing });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  /* ===== ПОЛУЧИТЬ ЗАГАДКУ (без правильных ответов!) ===== */
  app.get('/api/quiz/get', async (req, res) => {
    const me = findByToken(req.query.token);
    if (!me) return res.status(401).json({ error: 'no' });
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'no id' });
    try {
      const data = await binGet();
      const q = (data.quizzes || {})[id];
      if (!q) return res.status(404).json({ error: 'не найдено' });
      if (q.from !== me.id && q.to !== me.id) return res.status(403).json({ error: 'нет доступа' });

      const isOwner = q.from === me.id;
      const isTarget = q.to === me.id;

      // Целевой видит вопросы БЕЗ правильных ответов до отправки
      let questionsOut;
      if (isOwner && q.completedAt) {
        // создатель видит всё после прохождения
        questionsOut = q.questions.map((qq, i) => ({
          q: qq.q, options: qq.options, correct: qq.correct,
          userAnswer: q.answers ? q.answers[i] : null
        }));
      } else if (isTarget && q.completedAt) {
        // цель видит свои ответы + правильные (тоже раскрыты после)
        questionsOut = q.questions.map((qq, i) => ({
          q: qq.q, options: qq.options, correct: qq.correct,
          userAnswer: q.answers ? q.answers[i] : null
        }));
      } else {
        // ещё не прошёл — без правильных
        questionsOut = q.questions.map(qq => ({ q: qq.q, options: qq.options }));
      }

      res.json({
        id: q.id,
        title: q.title,
        from: q.from, fromName: q.fromName, fromEmoji: q.fromEmoji,
        to: q.to, toName: q.toName, toEmoji: q.toEmoji,
        isOwner, isTarget,
        questionsCount: q.questions.length,
        completed: !!q.completedAt,
        questions: questionsOut
      });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  /* ===== ОТПРАВИТЬ ОТВЕТЫ ===== */
  app.post('/api/quiz/answer', async (req, res) => {
    const { token, id, answers } = req.body || {};
    const me = findByToken(token);
    if (!me) return res.status(401).json({ error: 'no' });
    if (!id || !Array.isArray(answers)) return res.status(400).json({ error: 'no data' });
    try {
      const data = await binGet();
      const q = (data.quizzes || {})[id];
      if (!q) return res.status(404).json({ error: 'не найдено' });
      if (q.to !== me.id) return res.status(403).json({ error: 'только получатель может отвечать' });
      if (q.completedAt) return res.status(400).json({ error: 'уже пройдено' });

      const cleaned = answers.slice(0, q.questions.length).map(a => parseInt(a, 10));
      q.answers = cleaned;
      q.completedAt = Date.now();

      const correct = cleaned.filter((a, i) => a === q.questions[i].correct).length;
      const total = q.questions.length;

      await binPut(data);

      // Уведомить создателя
      const owner = loadUsers().find(u => u.id === q.from);
      if (owner && owner.chatId) {
        await tgSend(owner.chatId,
          '🎮 <b>' + me.name + '</b> прошёл твою загадку!\n\n' +
          '«' + q.title + '»\n' +
          '<b>' + correct + ' из ' + total + '</b> правильных');
      }

      res.json({ ok: true, correct, total });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  /* ===== УДАЛИТЬ ЗАГАДКУ (только владелец) ===== */
  app.post('/api/quiz/delete', async (req, res) => {
    const { token, id } = req.body || {};
    const me = findByToken(token);
    if (!me) return res.status(401).json({ error: 'no' });
    try {
      const data = await binGet();
      const q = (data.quizzes || {})[id];
      if (!q) return res.status(404).json({ error: 'не найдено' });
      if (q.from !== me.id) return res.status(403).json({ error: 'только создатель' });
      delete data.quizzes[id];
      await binPut(data);
      res.json({ ok: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });
};
