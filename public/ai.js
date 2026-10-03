(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  function getToken(){ return localStorage.getItem('teplo_token_v1'); }

  const IDEAS = ['кот в шляпе', 'закат у моря', 'милые цветы', 'воздушный шар', 'звёздное небо'];

  function buildModal(){
    if ($('aiModalBg')) return;
    const bg = document.createElement('div');
    bg.className = 'ai-modal-bg';
    bg.id = 'aiModalBg';
    bg.innerHTML =
      '<div class="ai-modal">' +
        '<div class="ai-title">🎨 AI-рисунок</div>' +
        '<div class="ai-sub">опиши, что хочешь, и я нарисую</div>' +
        '<div class="ai-label">Что нарисовать?</div>' +
        '<textarea class="ai-textarea" id="aiPrompt" maxlength="200" placeholder="Например: милые коты в космосе"></textarea>' +
        '<div class="ai-ideas" id="aiIdeas"></div>' +
        '<div class="ai-progress" id="aiProgress">' +
          '<div class="ai-progress-text" id="aiProgressText">Идёт генерация...</div>' +
          '<div class="ai-progress-bar"><div class="ai-progress-fill" id="aiProgressFill"></div></div>' +
          '<div class="ai-progress-text" id="aiProgressSub">обычно занимает 5-15 секунд</div>' +
        '</div>' +
        '<div class="ai-result" id="aiResult"></div>' +
        '<div class="ai-btns">' +
          '<button class="ai-btn-cancel" onclick="aiClose()">Отмена</button>' +
          '<button class="ai-btn-ok" id="aiSubmit">🎨 Нарисовать</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bg);
    bg.addEventListener('click', e => { if (e.target.id === 'aiModalBg') aiClose(); });
    $('aiSubmit').addEventListener('click', generate);

    // идеи
    const ideas = $('aiIdeas');
    IDEAS.forEach(text => {
      const b = document.createElement('button');
      b.className = 'ai-idea';
      b.textContent = text;
      b.onclick = () => { $('aiPrompt').value = text; };
      ideas.appendChild(b);
    });
  }

  window.aiClose = function(){
    const m = $('aiModalBg');
    if (m) m.classList.remove('show');
    setTimeout(() => {
      if ($('aiPrompt')) $('aiPrompt').value = '';
      if ($('aiProgress')) $('aiProgress').classList.remove('show');
      if ($('aiResult')) { $('aiResult').classList.remove('show'); $('aiResult').innerHTML = ''; }
      if ($('aiSubmit')) $('aiSubmit').disabled = false;
    }, 300);
  };

  window.aiOpen = function(){
    if (typeof recipient === 'undefined' || !recipient) {
      if (window.toastShow) window.toastShow('Выбери получателя', true);
      return;
    }
    if (!recipient.ready) {
      if (window.toastShow) window.toastShow(recipient.name + ' не подключён', true);
      return;
    }
    buildModal();
    $('aiModalBg').classList.add('show');
    setTimeout(() => { const t = $('aiPrompt'); if (t) t.focus(); }, 300);
  };

  async function generate(){
    const t = getToken();
    const prompt = ($('aiPrompt').value || '').trim();
    if (!prompt) {
      if (window.toastShow) window.toastShow('Напиши, что нарисовать', true);
      return;
    }

    const btn = $('aiSubmit');
    const progress = $('aiProgress');
    const fill = $('aiProgressFill');
    const ptext = $('aiProgressText');
    const psub = $('aiProgressSub');

    btn.disabled = true;
    btn.textContent = 'Генерирую...';
    progress.classList.add('show');
    $('aiResult').classList.remove('show');
    $('aiResult').innerHTML = '';
    fill.style.width = '0%';
    ptext.textContent = 'Идёт генерация...';
    psub.textContent = 'обычно занимает 5-15 секунд';

    // Анимируем прогресс-бар до 90%
    let p = 0;
    const interval = setInterval(() => {
      if (p < 90) { p += Math.random() * 8; if (p > 90) p = 90; fill.style.width = p + '%'; }
    }, 400);

    try {
      const r = await fetch('/api/ai-image', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ token: t, to: recipient.id, prompt })
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'Ошибка');

      clearInterval(interval);
      fill.style.width = '100%';
      ptext.textContent = '✅ Отправлено!';
      psub.textContent = recipient.name + ' уже видит рисунок';

      // Показываем визуально «успех»
      $('aiResult').innerHTML = '<div style="padding:20px;text-align:center;background:linear-gradient(145deg,var(--pink),var(--mag));color:#fff;font-weight:900">🎨 Рисунок отправлен!</div>';
      $('aiResult').classList.add('show');

      if (window.toastShow) window.toastShow('Рисунок отправлен ' + recipient.name, false, '🎨');
      if (window.sparks) window.sparks(window.innerWidth/2, window.innerHeight/2);

      setTimeout(() => window.aiClose(), 2000);
    } catch(e) {
      clearInterval(interval);
      progress.classList.remove('show');
      if (window.toastShow) window.toastShow('❌ ' + e.message, true);
      btn.disabled = false;
      btn.textContent = '🎨 Нарисовать';
    }
  }

  /* Добавляем кнопку в быстрые действия */
  function addButton(){
    const grid = document.querySelector('.actions');
    if (!grid || $('aiBtn')) return;
    const btn = document.createElement('button');
    btn.className = 'act pink';
    btn.id = 'aiBtn';
    btn.innerHTML = '<span class="ic">🎨</span><span class="lbl">AI-рисунок</span><span class="hint">neural</span>';
    btn.onclick = window.aiOpen;
    // Вставляем после «Рисунок»
    const firstBig = grid.querySelector('.act.big');
    if (firstBig && firstBig.nextSibling) {
      grid.insertBefore(btn, firstBig.nextSibling);
    } else {
      grid.insertBefore(btn, grid.firstChild);
    }
  }

  function init(){
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(addButton, 1500));
    } else {
      setTimeout(addButton, 1500);
    }
    setTimeout(addButton, 3000);
  }
  init();
})();
