(function(){
  const $ = id => document.getElementById(id);
  const LS = 'teplo_token_v1';
  const EMOJI_DEFAULT = '🦊';

  let me = { id:'', name:'—', emoji:'🦊' };
  let users = [];
  let currentTab = 'in';
  let list = { incoming: [], outgoing: [] };

  // состояние создания
  let draft = { to: null, title: '', count: 5, step: 0, questions: [], current: null };

  // состояние прохождения
  let play = { id: null, questions: [], index: 0, answers: [] };

  function getToken(){ return localStorage.getItem(LS); }

  function toast(msg, err){
    const t = $('toast');
    t.textContent = msg;
    t.classList.toggle('error', !!err);
    t.classList.add('show');
    clearTimeout(window._tt);
    window._tt = setTimeout(() => t.classList.remove('show'), 2600);
  }
  function esc(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }
  function qParam(){ const m = location.search.match(/token=([^&]+)/); return m ? decodeURIComponent(m[1]) : ''; }

  async function init(){
    const t = getToken();
    if (!t) { document.body.innerHTML = '<div style="padding:60px;text-align:center;color:#888">Нужна персональная ссылка 🔒</div>'; return; }

    try {
      const r = await fetch('/api/me?token=' + encodeURIComponent(t));
      if (!r.ok) throw 0;
      const d = await r.json();
      me = d.user;
      $('meE').textContent = me.emoji;
      $('meN').textContent = me.name;
    } catch(e){
      document.body.innerHTML = '<div style="padding:60px;text-align:center;color:#888">Ссылка недействительна 🔒</div>';
      return;
    }

    try {
      const r = await fetch('/api/users?token=' + encodeURIComponent(t));
      const d = await r.json();
      users = d.users || [];
    } catch(e){}

    await loadList();

    // авто-открытие, если пришёл по ссылке ?play=ID
    const playId = (location.search.match(/play=([^&]+)/) || [])[1];
    if (playId) {
      setTimeout(() => openPlay(decodeURIComponent(playId)), 400);
    }
  }

  async function loadList(){
    const t = getToken();
    const box = $('quizList');
    box.innerHTML = '<div class="quiz-empty">Загружаю...</div>';
    try {
      const r = await fetch('/api/quiz/list?token=' + encodeURIComponent(t));
      const d = await r.json();
      list = { incoming: d.incoming || [], outgoing: d.outgoing || [] };
    } catch(e){
      list = { incoming: [], outgoing: [] };
    }
    renderList();
  }

  function switchTab(tab){
    currentTab = tab;
    $('tabIn').classList.toggle('active', tab === 'in');
    $('tabOut').classList.toggle('active', tab === 'out');
    renderList();
  }
  window.switchTab = switchTab;

  function renderList(){
    const box = $('quizList');
    const arr = currentTab === 'in' ? list.incoming : list.outgoing;
    if (!arr.length) {
      box.innerHTML = '<div class="quiz-empty">' +
        (currentTab === 'in'
          ? 'Тебе пока никто не создавал загадок.<br>Нажми <b>+</b> справа снизу, чтобы создать первую!'
          : 'Ты пока не создавал загадок.<br>Нажми <b>+</b> и удиви своего человека 💫') +
        '</div>';
      return;
    }
    box.innerHTML = '';
    arr.forEach((q, i) => {
      const el = document.createElement('div');
      el.className = 'quiz-card' + (q.completed ? ' done' : '') + (currentTab === 'out' ? ' from-me' : '');
      el.style.animationDelay = (i * 0.05) + 's';
      const otherEmoji = currentTab === 'in' ? q.fromEmoji : q.toEmoji;
      const otherName  = currentTab === 'in' ? q.fromName  : q.toName;
      const label = currentTab === 'in' ? 'От' : 'Для';
      const badge = q.completed
        ? '<span class="qc-badge">' + (currentTab === 'in' ? 'ПРОЙДЕНО' : 'ОТВЕТИЛ') + '</span>'
        : '<span class="qc-badge wait">' + (currentTab === 'in' ? 'ЖДЁТ ТЕБЯ' : 'ЖДЁТ ОТВЕТА') + '</span>';
      el.innerHTML =
        '<div class="qc-head">' +
          '<span class="qc-em">' + otherEmoji + '</span>' +
          '<div class="qc-from">' + label + ' <b>' + esc(otherName) + '</b></div>' +
          badge +
        '</div>' +
        '<div class="qc-title">' + esc(q.title) + '</div>' +
        '<div class="qc-meta">' + q.questions + ' вопрос' + (q.questions === 1 ? '' : (q.questions < 5 ? 'а' : 'ов')) + '</div>' +
        '<button class="qc-btn">' + (q.completed ? '👀 Посмотреть результат' : (currentTab === 'in' ? '🎮 Пройти' : '⏳ Ещё не ответил')) + '</button>';
      el.querySelector('.qc-btn').onclick = () => {
        if (currentTab === 'in') {
          openPlay(q.id);
        } else {
          if (q.completed) openPlay(q.id);
          else toast('Ждём ответа от ' + q.toName + ' ⏳');
        }
      };
      box.appendChild(el);
    });
  }

  /* ============ СОЗДАНИЕ ============ */
  window.openCreate = function(){
    if (!users.length) return toast('Нет других пользователей', true);
    draft = { to: users[0].id, title: '', count: 5, step: 0, questions: [], current: null };
    renderCreate();
    $('createModal').classList.add('show');
  };

  function closeCreate(){
    $('createModal').classList.remove('show');
  }
  window.closeCreate = closeCreate;

  function renderCreate(){
    const body = $('createBody');
    let html = '';

    if (draft.step === 0) {
      // Шаг 1: кому + название + количество
      html += '<div class="quiz-step-title">🎯 Новая загадка</div>';
      html += '<div class="quiz-step-sub">шаг 1 · основное</div>';
      html += '<div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin:14px 0 8px;font-family:\'Roboto Mono\',monospace">Кому</div>';
      html += '<div class="quiz-options">';
      users.forEach(u => {
        const cls = draft.to === u.id ? 'selected' : '';
        html += '<button class="quiz-opt ' + cls + '" onclick="pickUser(\'' + u.id + '\')"><span class="num">' + u.emoji + '</span>' + esc(u.name) + '</button>';
      });
      html += '</div>';
      html += '<div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin:18px 0 8px;font-family:\'Roboto Mono\',monospace">Название</div>';
      html += '<input class="input" id="draftTitle" maxlength="60" placeholder="Как хорошо ты меня знаешь?" value="' + esc(draft.title) + '">';
      html += '<div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin:18px 0 8px;font-family:\'Roboto Mono\',monospace">Сколько вопросов</div>';
      html += '<div class="quiz-count-grid">';
      [3,5,7,10].forEach(n => {
        const cls = draft.count === n ? 'active' : '';
        html += '<button class="quiz-count-opt ' + cls + '" onclick="pickCount(' + n + ')">' + n + '</button>';
      });
      html += '</div>';
      html += '<div class="modal-btns"><button class="btn-cancel" onclick="closeCreate()">Отмена</button><button class="btn-ok" onclick="nextStep()">Далее →</button></div>';
    } else if (draft.step >= 1 && draft.step <= draft.count) {
      // Шаги 2..N+1: вопросы
      const idx = draft.step - 1;
      if (!draft.questions[idx]) draft.questions[idx] = { q:'', options:['','',''], correct:0 };
      draft.current = draft.questions[idx];
      html += '<div class="quiz-step-title">Вопрос ' + draft.step + ' / ' + draft.count + '</div>';
      html += '<div class="quiz-step-sub">отметь правильный ответ 👆</div>';
      html += '<input class="input" id="qText" maxlength="200" placeholder="Текст вопроса" value="' + esc(draft.current.q) + '" style="text-align:left;margin-bottom:14px">';
      html += '<div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin:6px 0 10px;font-family:\'Roboto Mono\',monospace">Варианты · тапни номер = правильный</div>';
      draft.current.options.forEach((opt, oi) => {
        const active = draft.current.correct === oi ? 'active' : '';
        html += '<div class="quiz-opt-row">' +
          '<div class="opt-num ' + active + '" onclick="setCorrect(' + oi + ')">' + (oi+1) + '</div>' +
          '<input maxlength="100" placeholder="Вариант ' + (oi+1) + '" value="' + esc(opt) + '" oninput="setOption(' + oi + ', this.value)">' +
          (draft.current.options.length > 2 ? '<button class="opt-del" onclick="removeOption(' + oi + ')">✕</button>' : '') +
        '</div>';
      });
      if (draft.current.options.length < 5) {
        html += '<div class="quiz-mini-btns"><button class="quiz-mini-btn" onclick="addOption()">+ Вариант</button></div>';
      }
      html += '<div class="modal-btns">';
      if (draft.step > 1) html += '<button class="btn-cancel" onclick="prevStep()">← Назад</button>';
      else html += '<button class="btn-cancel" onclick="closeCreate()">Отмена</button>';
      html += '<button class="btn-ok" onclick="nextStep()">' + (draft.step === draft.count ? 'Проверить →' : 'Далее →') + '</button>';
      html += '</div>';
    } else {
      // Шаг N+2: подтверждение
      html += '<div class="quiz-step-title">✅ Готово!</div>';
      html += '<div class="quiz-step-sub">проверь, всё ли верно</div>';
      const target = users.find(u => u.id === draft.to) || { name:'?', emoji:'❓' };
      html += '<div style="padding:14px;background:var(--bg);border:1.5px solid var(--border);border-radius:12px;margin-bottom:12px;text-align:center">';
      html += '<div style="font-size:11px;color:var(--dim);font-family:\'Roboto Mono\',monospace;margin-bottom:4px">для кого</div>';
      html += '<div style="font-size:16px;font-weight:900">' + target.emoji + ' ' + esc(target.name) + '</div>';
      html += '</div>';
      html += '<div style="padding:14px;background:var(--bg);border:1.5px solid var(--border);border-radius:12px;margin-bottom:12px;text-align:center">';
      html += '<div style="font-size:11px;color:var(--dim);font-family:\'Roboto Mono\',monospace;margin-bottom:4px">название</div>';
      html += '<div style="font-size:15px;font-weight:900">' + esc(draft.title || 'Без названия') + '</div>';
      html += '</div>';
      html += '<div style="padding:14px;background:var(--bg);border:1.5px solid var(--border);border-radius:12px;text-align:center">';
      html += '<div style="font-size:11px;color:var(--dim);font-family:\'Roboto Mono\',monospace;margin-bottom:4px">вопросов</div>';
      html += '<div style="font-size:16px;font-weight:900">' + draft.count + '</div>';
      html += '</div>';
      html += '<div class="modal-btns"><button class="btn-cancel" onclick="prevStep()">← Назад</button><button class="btn-ok" onclick="saveQuiz()">Отправить 🚀</button></div>';
    }

    body.innerHTML = html;

    // автофокус
    setTimeout(() => {
      const t = $('qText'); if (t && draft.step >= 1 && draft.step <= draft.count) t.focus();
    }, 200);
  }

  window.pickUser = function(id){
    draft.to = id;
    draft.title = ($('draftTitle') || {}).value || '';
    renderCreate();
  };
  window.pickCount = function(n){
    draft.title = ($('draftTitle') || {}).value || '';
    draft.count = n;
    draft.questions = draft.questions.slice(0, n);
    renderCreate();
  };
  window.setCorrect = function(oi){
    draft.current.correct = oi;
    draft.current.q = ($('qText') || {}).value || '';
    renderCreate();
  };
  window.setOption = function(oi, val){
    draft.current.options[oi] = val;
  };
  window.addOption = function(){
    if (draft.current.options.length < 5) {
      draft.current.q = ($('qText') || {}).value || '';
      draft.current.options.push('');
      renderCreate();
    }
  };
  window.removeOption = function(oi){
    if (draft.current.options.length > 2) {
      draft.current.q = ($('qText') || {}).value || '';
      draft.current.options.splice(oi, 1);
      if (draft.current.correct >= draft.current.options.length) draft.current.correct = 0;
      renderCreate();
    }
  };

  function saveCurrentDraft(){
    if (draft.step >= 1 && draft.step <= draft.count && draft.current) {
      draft.current.q = ($('qText') || {}).value || draft.current.q;
    }
    if (draft.step === 0) {
      draft.title = ($('draftTitle') || {}).value || draft.title;
    }
  }

  window.nextStep = function(){
    saveCurrentDraft();

    if (draft.step === 0) {
      if (!draft.to) return toast('Выбери, для кого', true);
      if (!draft.title.trim()) return toast('Придумай название', true);
    } else if (draft.step >= 1 && draft.step <= draft.count) {
      const cur = draft.questions[draft.step - 1];
      if (!cur.q.trim()) return toast('Напиши вопрос', true);
      const filled = cur.options.filter(o => o.trim());
      if (filled.length < 2) return toast('Минимум 2 варианта', true);
      // Убираем пустые
      const clean = [];
      let correctIdx = -1;
      cur.options.forEach((o, i) => {
        if (o.trim()) {
          if (i === cur.correct) correctIdx = clean.length;
          clean.push(o.trim());
        }
      });
      if (correctIdx < 0) correctIdx = 0;
      cur.options = clean;
      cur.correct = correctIdx;
    }

    draft.step++;
    if (draft.step === draft.count + 1) {
      // финальная проверка - все вопросы заполнены
    }
    renderCreate();
  };

  window.prevStep = function(){
    saveCurrentDraft();
    if (draft.step > 0) draft.step--;
    renderCreate();
  };

  window.saveQuiz = async function(){
    const t = getToken();
    saveCurrentDraft();
    try {
      toast('Отправляю...');
      const r = await fetch('/api/quiz/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: t,
          to: draft.to,
          title: draft.title.trim(),
          questions: draft.questions
        })
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'Ошибка');
      closeCreate();
      toast('✅ Загадка отправлена!', false);
      await loadList();
      switchTab('out');
    } catch(e){
      toast('❌ ' + e.message, true);
    }
  };

  /* ============ ПРОХОЖДЕНИЕ ============ */
  window.openPlay = async function(id){
    try {
      const t = getToken();
      toast('Загружаю...');
      const r = await fetch('/api/quiz/get?id=' + encodeURIComponent(id) + '&token=' + encodeURIComponent(t));
      const d = await r.json();
      if (!d.id) throw new Error(d.error || 'Не найдено');
      play.id = d.id;
      play.questions = d.questions;
      play.index = 0;
      play.answers = [];
      play.isOwner = d.isOwner;
      play.completed = d.completed;
      play.title = d.title;
      play.fromName = d.fromName;
      play.toName = d.toName;
      play.fromEmoji = d.fromEmoji;

      if (d.completed) {
        renderResult(d);
      } else {
        renderQuestion();
      }
      $('playModal').classList.add('show');
    } catch(e){
      toast('❌ ' + e.message, true);
    }
  };

  function renderQuestion(){
    const body = $('playBody');
    const q = play.questions[play.index];
    const total = play.questions.length;
    let html = '<div class="quiz-step-title">' + esc(play.title) + '</div>';
    html += '<div class="quiz-step-sub">от ' + esc(play.fromName) + '</div>';
    html += '<div class="quiz-progress">';
    for (let i = 0; i < total; i++) {
      let cls = 'dot';
      if (i < play.index) cls += ' done';
      else if (i === play.index) cls += ' current';
      html += '<div class="' + cls + '"></div>';
    }
    html += '</div>';
    html += '<div class="quiz-q-title">Вопрос ' + (play.index + 1) + ' / ' + total + '</div>';
    html += '<div class="quiz-q-text">' + esc(q.q) + '</div>';
    html += '<div class="quiz-options">';
    q.options.forEach((opt, i) => {
      html += '<button class="quiz-opt" onclick="pickAnswer(' + i + ')"><span class="num">' + (i+1) + '</span>' + esc(opt) + '</button>';
    });
    html += '</div>';
    body.innerHTML = html;
  }

  window.pickAnswer = function(i){
    play.answers.push(i);
    if (play.index < play.questions.length - 1) {
      play.index++;
      renderQuestion();
    } else {
      submitAnswers();
    }
  };

  async function submitAnswers(){
    const t = getToken();
    try {
      toast('Отправляю результат...');
      const r = await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t, id: play.id, answers: play.answers })
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'Ошибка');
      // догружаем квиз с правильными
      const r2 = await fetch('/api/quiz/get?id=' + encodeURIComponent(play.id) + '&token=' + encodeURIComponent(t));
      const d2 = await r2.json();
      renderResult(d2);
      await loadList();
    } catch(e){
      toast('❌ ' + e.message, true);
    }
  }

  function renderResult(d){
    const body = $('playBody');
    const questions = d.questions || [];
    let correct = 0;
    questions.forEach((q, i) => {
      if (q.userAnswer === q.correct) correct++;
    });
    const total = questions.length;
    const percent = Math.round(correct * 100 / total);

    let emoji, verdict;
    if (percent === 100) { emoji = '🏆'; verdict = 'Идеально!'; }
    else if (percent >= 80) { emoji = '🥇'; verdict = 'Отлично!'; }
    else if (percent >= 60) { emoji = '✨'; verdict = 'Хорошо!'; }
    else if (percent >= 40) { emoji = '🌱'; verdict = 'Неплохо'; }
    else { emoji = '💫'; verdict = 'Будем знакомиться!'; }

    let html = '<div class="quiz-big-score">';
    html += '<span class="score-em">' + emoji + '</span>';
    html += '<div class="score-num">' + correct + ' / ' + total + '</div>';
    html += '<div class="score-label">' + verdict + '</div>';
    html += '</div>';

    html += '<div class="quiz-result-list">';
    questions.forEach((q, i) => {
      const userA = q.userAnswer != null ? q.options[q.userAnswer] : '—';
      const rightA = q.options[q.correct];
      const ok = q.userAnswer === q.correct;
      html += '<div class="quiz-result-item">';
      html += '<div class="qr-q">' + (i+1) + '. ' + esc(q.q) + '</div>';
      html += '<div class="qr-ans ' + (ok ? 'right' : 'your') + '">' + (ok ? '✓' : '✗') + ' Твой ответ: <b>' + esc(userA) + '</b></div>';
      if (!ok) {
        html += '<div class="qr-ans right">✓ Правильно: <b>' + esc(rightA) + '</b></div>';
      }
      html += '</div>';
    });
    html += '</div>';

    html += '<div class="modal-btns"><button class="btn-ok" onclick="closePlay()">Закрыть</button></div>';
    body.innerHTML = html;
  }

  window.closePlay = function(){
    $('playModal').classList.remove('show');
  };

  // клик по фону закрывает
  $('createModal').addEventListener('click', e => { if (e.target.id === 'createModal') closeCreate(); });
  $('playModal').addEventListener('click', e => { if (e.target.id === 'playModal') closePlay(); });

  init();
})();
