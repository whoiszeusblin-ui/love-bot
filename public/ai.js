(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  function getToken(){ return localStorage.getItem('teplo_token_v1'); }

  const IDEAS = ['кот в шляпе', 'закат у моря', 'милые цветы', 'воздушный шар', 'звёздное небо'];

  let currentUrl = null;
  let currentPrompt = '';

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
          '<div class="ai-progress-text" id="aiProgressText">Генерирую...</div>' +
          '<div class="ai-progress-bar"><div class="ai-progress-fill" id="aiProgressFill"></div></div>' +
          '<div class="ai-progress-text" id="aiProgressSub">обычно 5-15 секунд</div>' +
        '</div>' +
        '<div class="ai-result" id="aiResult"></div>' +
        '<div class="ai-btns" id="aiBtns">' +
          '<button class="ai-btn-cancel" onclick="aiClose()">Отмена</button>' +
          '<button class="ai-btn-ok" id="aiSubmit">🎨 Нарисовать</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bg);
    bg.addEventListener('click', e => { if (e.target.id === 'aiModalBg') window.aiClose(); });
    $('aiSubmit').addEventListener('click', generate);

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
      resetBtns();
      currentUrl = null;
      currentPrompt = '';
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

  function resetBtns(){
    const b = $('aiBtns');
    if (b) {
      b.innerHTML =
        '<button class="ai-btn-cancel" onclick="aiClose()">Отмена</button>' +
        '<button class="ai-btn-ok" id="aiSubmit">🎨 Нарисовать</button>';
      $('aiSubmit').addEventListener('click', generate);
    }
  }

  async function generate(){
    const _t = getToken();
    if (!_t) {
      showInlineError('Нет токена — открой сайт по персональной ссылке');
      return;
    }
    console.log('AI: generate start');
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
    const result = $('aiResult');

    btn.disabled = true;
    btn.textContent = 'Генерирую...';
    progress.classList.add('show');
    result.classList.remove('show');
    result.innerHTML = '';
    fill.style.width = '0%';
    ptext.textContent = 'Генерирую...';
    psub.textContent = 'обычно 5-15 секунд';

    let p = 0;
    const interval = setInterval(() => {
      if (p < 90) { p += Math.random() * 6; if (p > 90) p = 90; fill.style.width = p + '%'; }
    }, 400);

    try {
      const r = await fetch('/api/ai-generate', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ token: t, prompt })
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'Ошибка');

      currentUrl = d.url;
      currentPrompt = d.prompt;

      // Загружаем картинку через <img> (проверяем, что она реально открывается)
      ptext.textContent = 'Загружаю картинку...';
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        clearInterval(interval);
        fill.style.width = '100%';
        ptext.textContent = '✅ Готово!';

        result.innerHTML = '';
        const imgEl = document.createElement('img');
        imgEl.src = currentUrl;
        imgEl.alt = 'AI';
        result.appendChild(imgEl);
        result.classList.add('show');
        progress.classList.remove('show');

        // Показываем кнопки: Другая + Отправить
        const btns = $('aiBtns');
        btns.innerHTML =
          '<button class="ai-btn-cancel" id="aiRetry">🔄 Другая</button>' +
          '<button class="ai-btn-ok" id="aiSend">📤 Отправить</button>';
        $('aiRetry').addEventListener('click', () => {
          result.classList.remove('show');
          result.innerHTML = '';
          currentUrl = null;
          resetBtns();
          generate();
        });
        $('aiSend').addEventListener('click', send);
      };
      img.onerror = () => {
        clearInterval(interval);
        progress.classList.remove('show');
        if (window.toastShow) window.toastShow('Не удалось загрузить картинку', true);
        btn.disabled = false;
        btn.textContent = '🎨 Нарисовать';
      };
      img.src = currentUrl;

    } catch(e) {
      clearInterval(interval);
      progress.classList.remove('show');
      if (window.toastShow) window.toastShow('❌ ' + e.message, true);
      btn.disabled = false;
      btn.textContent = '🎨 Нарисовать';
    }
  }

  async function send(){
    if (!currentUrl) return;
    const t = getToken();
    const btn = $('aiSend');
    if (btn) { btn.disabled = true; btn.textContent = 'Отправляю...'; }

    try {
      const r = await fetch('/api/ai-send', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ token: t, to: recipient.id, url: currentUrl, prompt: currentPrompt })
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'Ошибка');

      if (window.toastShow) window.toastShow('🎨 Отправлено ' + recipient.name, false, '🎨');
      if (window.sparks) window.sparks(window.innerWidth/2, window.innerHeight/2);

      setTimeout(() => window.aiClose(), 1200);
    } catch(e) {
      if (window.toastShow) window.toastShow('❌ ' + e.message, true);
      if (btn) { btn.disabled = false; btn.textContent = '📤 Отправить'; }
    }
  }

  function showInlineError(msg){
    const result = $('aiResult');
    if (!result) return;
    result.innerHTML = '<div style="padding:16px;text-align:center;background:linear-gradient(145deg,#ff2164,#c4184d);color:#fff;font-weight:700;border-radius:12px;font-size:13px">❌ ' + msg + '</div>';
    result.classList.add('show');
  }

function addButton(){
    const grid = document.querySelector('.actions');
    if (!grid || $('aiBtn')) return;
    const btn = document.createElement('button');
    btn.className = 'act pink';
    btn.id = 'aiBtn';
    btn.innerHTML = '<span class="ic">🎨</span><span class="lbl">AI-рисунок</span><span class="hint">neural</span>';
    btn.onclick = window.aiOpen;
    const firstBig = grid.querySelector('.act.big');
    if (firstBig && firstBig.nextSibling) {
      grid.insertBefore(btn, firstBig.nextSibling);
    } else {
      grid.insertBefore(btn, grid.firstChild);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(addButton, 1500));
  } else {
    setTimeout(addButton, 1500);
  }
  setTimeout(addButton, 3000);
})();
