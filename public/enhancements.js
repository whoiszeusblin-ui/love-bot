(function(){
  function $(id){ return document.getElementById(id); }

  /* ===== Перестройка шапки ===== */
  function enhanceBrand(){
    const header = document.querySelector('.header');
    if (!header || header.classList.contains('rebuilt')) return;

    const meEl = header.querySelector('.me');

    const logoWrap = document.createElement('div');
    logoWrap.className = 'header-center-logo';
    logoWrap.innerHTML =
      '<span class="hcl-bg">Т</span>' +
      '<span class="hcl-title">ТЕПЛО</span>' +
      '<span class="hcl-sub">messages · with love</span>';

    const parent = header.parentNode;
    parent.insertBefore(logoWrap, header);

    if (meEl) {
      const compact = document.createElement('div');
      compact.className = 'header-compact';
      compact.appendChild(meEl);
      parent.insertBefore(compact, header.nextSibling);
    }

    header.classList.add('rebuilt');
  }

  /* ===== Перестройка быстрых действий ===== */
  function rebuildActions(){
    const grid = document.querySelector('.actions');
    if (!grid || grid.classList.contains('rebuilt')) return;

    // Убираем все старые НЕ-кастомные кнопки, кастомные оставляем
    Array.prototype.slice.call(grid.querySelectorAll('.act:not(.custom)')).forEach(function(el){
      el.remove();
    });

    grid.classList.add('rebuilt');

    function mk(cls, icon, lbl, hint, handler){
      const b = document.createElement('button');
      b.className = 'act ' + cls;
      b.innerHTML = '<span class="ic">' + icon + '</span>' +
                    '<span class="lbl">' + lbl + '</span>' +
                    (hint ? '<span class="hint">' + hint + '</span>' : '');
      b.onclick = handler;
      return b;
    }

    // Большая сверху
    grid.appendChild(mk('pink big', '💖', 'Подумал о тебе', 'thinking',
      function(){ window.send('💖 Я подумал(а) о тебе прямо сейчас!'); }));

    // Ряд 1
    grid.appendChild(mk('mag small', '😘', 'Скучаю', '',
      function(){ window.send('😘 Скучаю по тебе...'); }));
    grid.appendChild(mk('pur small', '☕', 'Утро', '',
      function(){ window.send('☕ Доброе утро! Пусть день будет тёплым 🌤'); }));
    grid.appendChild(mk('blue small', '🌙', 'Ночь', '',
      function(){ window.send('🌙 Спокойной ночи, сладких снов ✨'); }));

    // Ряд 2
    grid.appendChild(mk('dark small', '🤗', 'Обнимаю', '',
      function(){ window.send('🤗 Обнимаю тебя крепко-крепко!'); }));
    grid.appendChild(mk('dark small', '⚡', 'Срочно', '',
      function(){ window.send('⚡ Позвони мне срочно, если можешь 💕'); }));
    grid.appendChild(mk('pink small', '🎨', 'Рисунок', '',
      function(){ if (window.goDraw) window.goDraw(); }));

    // Большая снизу
    grid.appendChild(mk('dark big', '📸', 'Отправить фото', 'из галереи',
      function(){ const f = document.getElementById('f'); if (f) f.click(); }));
  }

  /* ===== Календарь недели ===== */
  function toDateStr(d){
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return y + '-' + m + '-' + day;
  }

  function buildWeek(current, lastCheckIn){
    const today = new Date();
    const todayIdx = (today.getDay() + 6) % 7;
    const marked = new Set();
    if (lastCheckIn && current > 0) {
      const last = new Date(lastCheckIn + 'T00:00:00');
      for (let i = 0; i < current; i++) {
        const d = new Date(last);
        d.setDate(d.getDate() - i);
        marked.add(toDateStr(d));
      }
    }
    const labels = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
    const result = [];
    for (let i = 0; i < 7; i++) {
      const daysAgo = todayIdx - i;
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      result.push({
        label: labels[i],
        filled: marked.has(toDateStr(d)),
        today: i === todayIdx,
        future: i > todayIdx
      });
    }
    return result;
  }

  function renderWeek(current, lastCheckIn){
    const cal = $('weekCalendar');
    const bar = $('weekProgressBar');
    const txt = $('weekProgressText');
    if (!cal) return;

    const week = buildWeek(current, lastCheckIn);
    cal.innerHTML = '';
    let markedCount = 0;
    let pastCount = 0;

    week.forEach(function(d){
      const el = document.createElement('div');
      el.className = 'wc-day';
      const dotCls = 'wc-dot' + (d.filled ? ' filled' : '') + (d.today ? ' today' : '') + (d.future ? ' future' : '');
      el.innerHTML = '<div class="wc-label">' + d.label + '</div><div class="' + dotCls + '"></div>';
      cal.appendChild(el);
      if (!d.future) {
        pastCount++;
        if (d.filled) markedCount++;
      }
    });

    if (bar) {
      const pct = pastCount ? Math.round(markedCount * 100 / pastCount) : 0;
      setTimeout(function(){ bar.style.width = pct + '%'; }, 150);
    }
    if (txt) {
      const word = markedCount === 1 ? 'день' : (markedCount < 5 ? 'дня' : 'дней');
      txt.textContent = markedCount + ' ' + word + ' из ' + pastCount + ' на этой неделе';
    }
  }

  function enhanceFireCard(){
    const card = $('fireCard');
    if (!card || $('weekCalendar')) return;
    const btn = $('fireBtn');

    const cal = document.createElement('div');
    cal.className = 'week-calendar';
    cal.id = 'weekCalendar';

    const prog = document.createElement('div');
    prog.className = 'wc-progress';
    prog.innerHTML = '<div class="wc-progress-bar" id="weekProgressBar"></div>';

    const txt = document.createElement('div');
    txt.className = 'wc-progress-text';
    txt.id = 'weekProgressText';

    if (btn && btn.parentNode) {
      btn.parentNode.insertBefore(cal, btn);
      btn.parentNode.insertBefore(prog, btn);
      btn.parentNode.insertBefore(txt, btn);
    } else {
      card.appendChild(cal);
      card.appendChild(prog);
      card.appendChild(txt);
    }
  }

  /* ===== Данные ===== */
  let fetching = false;
  async function fetchStreaksAndRender(){
    if (fetching) return;
    fetching = true;
    try {
      const t = localStorage.getItem('teplo_token_v1');
      if (!t) return;
      const r = await fetch('/api/streaks?token=' + encodeURIComponent(t));
      const d = await r.json();
      if (d.me) renderWeek(d.me.current || 0, d.me.lastCheckIn || null);
    } catch(e){} finally { fetching = false; }
  }

  function apply(){
    enhanceBrand();
    rebuildActions();
    enhanceFireCard();
    setTimeout(fetchStreaksAndRender, 900);
    setTimeout(fetchStreaksAndRender, 2500);
    document.addEventListener('click', function(e){
      if (e.target && e.target.id === 'fireBtn') setTimeout(fetchStreaksAndRender, 1400);
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(apply, 200); });
  } else {
    setTimeout(apply, 200);
  }
})();
