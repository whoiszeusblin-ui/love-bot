(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  function getToken(){ return localStorage.getItem('teplo_token_v1'); }

  const PRESETS = ['😊 Хорошее', '😍 Отличное', '😐 Нормально', '😴 Уставшее', '😢 Грустное', '🤔 Задумчивое'];
  let selectedChip = '';

  function todayKey(){
    return 'teplo_mood_' + new Date().toISOString().slice(0, 10);
  }

  function buildModal(){
    if ($('moodModalBg')) return;
    const bg = document.createElement('div');
    bg.className = 'mood-modal-bg';
    bg.id = 'moodModalBg';
    bg.innerHTML =
      '<div class="mood-modal">' +
        '<span class="mood-emoji">🎭</span>' +
        '<div class="mood-title">Как твоё настроение?</div>' +
        '<div class="mood-sub">поделись с близкими</div>' +
        '<div class="mood-chips" id="moodChips"></div>' +
        '<textarea class="mood-input" id="moodInput" maxlength="100" placeholder="Или напиши своими словами..."></textarea>' +
        '<div class="mood-btns">' +
          '<button class="mood-cancel" onclick="moodClose()">Пропустить</button>' +
          '<button class="mood-ok" id="moodSend">Поделиться</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bg);

    // Чипы-пресеты
    const chips = $('moodChips');
    PRESETS.forEach(p => {
      const b = document.createElement('button');
      b.className = 'mood-chip';
      b.textContent = p;
      b.onclick = () => {
        selectedChip = p;
        $('moodInput').value = p.replace(/^\S+\s*/, ''); // убрать первый эмодзи
        chips.querySelectorAll('.mood-chip').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
      };
      chips.appendChild(b);
    });

    $('moodSend').addEventListener('click', send);
  }

  window.moodOpen = function(){
    buildModal();
    $('moodInput').value = '';
    $('moodModalBg').classList.add('show');
    setTimeout(() => $('moodInput').focus(), 300);
  };

  window.moodClose = function(skip){
    const m = $('moodModalBg');
    if (m) m.classList.remove('show');
    // Если «Пропустить» — запоминаем, что сегодня уже показали
    if (skip !== false) {
      try { localStorage.setItem(todayKey(), 'skipped'); } catch(e){}
    }
  };

  async function send(){
    const t = getToken();
    const text = ($('moodInput').value || '').trim();
    if (!text) { if (window.toastShow) window.toastShow('Напиши или выбери настроение', true); return; }

    const btn = $('moodSend');
    btn.disabled = true;
    btn.textContent = 'Отправляю...';

    try {
      const r = await fetch('/api/mood/set', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ token: t, mood: text })
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'Ошибка');

      try { localStorage.setItem(todayKey(), 'sent'); } catch(e){}
      if (window.toastShow) window.toastShow('🎭 Настроение отправлено', false);
      if (window.sparks) window.sparks(window.innerWidth/2, window.innerHeight/2);
      window.moodClose(false);
    } catch(e) {
      if (window.toastShow) window.toastShow('❌ ' + e.message, true);
      btn.disabled = false;
      btn.textContent = 'Поделиться';
    }
  }

  /* ===== Загрузка настроений партнёров ===== */
  async function loadMoods(){
    const t = getToken();
    if (!t) return;
    try {
      const r = await fetch('/api/mood/list?token=' + encodeURIComponent(t));
      const d = await r.json();
      renderMoods(d.moods || []);
      // Если у меня сегодня нет настроения и я не пропускал — показать окно
      if (!d.mine && !localStorage.getItem(todayKey())) {
        setTimeout(() => window.moodOpen(), 2500);
      }
    } catch(e){}
  }

  function renderMoods(list){
    const app = document.querySelector('.app');
    if (!app) return;
    let bar = $('moodBar');
    if (!list.length) {
      if (bar) bar.remove();
      return;
    }
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'mood-bar';
      bar.id = 'moodBar';
      // Вставляем после rp-bar (Кому отправить), если есть
      const rpBar = $('rpBar');
      if (rpBar && rpBar.parentNode) {
        rpBar.parentNode.insertBefore(bar, rpBar.nextSibling);
      } else {
        app.insertBefore(bar, app.firstChild);
      }
    }
    bar.innerHTML = '';
    list.forEach(m => {
      const el = document.createElement('div');
      el.className = 'mood-badge';
      el.innerHTML =
        '<span class="mb-em">' + m.emoji + '</span>' +
        '<span class="mb-name">' + m.name + ':</span>' +
        '<span class="mb-mood">«' + m.mood + '»</span>';
      bar.appendChild(el);
    });
  }

  function init(){
    loadMoods();
    setInterval(loadMoods, 120000); // обновлять каждые 2 минуты
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1500));
  } else {
    setTimeout(init, 1500);
  }
})();
