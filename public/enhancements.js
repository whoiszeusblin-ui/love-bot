(function(){
  function $(id){ return document.getElementById(id); }

  /* ===== Перестройка шапки ===== */
  function enhanceBrand(){
    const header = document.querySelector('.header');
    if (!header || header.classList.contains('rebuilt')) return;

    // Берём оригинальный .me ЦЕЛИКОМ (со всеми id) — так profile.js сможет обновлять имя
    const meEl = header.querySelector('.me');

    // Центрированный логотип
    const logoWrap = document.createElement('div');
    logoWrap.className = 'header-center-logo';
    logoWrap.innerHTML =
      '<span class="hcl-bg">Т</span>' +
      '<span class="hcl-title">ТЕПЛО</span>' +
      '<span class="hcl-sub">messages · with love</span>';

    const parent = header.parentNode;
    parent.insertBefore(logoWrap, header);

    if (meEl) {
      // Переносим .me (тот же самый DOM-элемент) в компактный блок
      const compact = document.createElement('div');
      compact.className = 'header-compact';
      compact.appendChild(meEl); // переносим оригинал, не клон
      parent.insertBefore(compact, header.nextSibling);
    }

    header.classList.add('rebuilt');
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
      const ds = toDateStr(d);
      result.push({
        label: labels[i],
        filled: marked.has(ds),
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
