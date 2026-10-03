(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }
  function getToken(){ return localStorage.getItem('teplo_token_v1'); }

  let wishes = [];
  let currentTab = 'all';
  let unreadCount = 0;

  /* ===== Секция на главной ===== */
  function buildCard(){
    if ($('wishSection')) return;
    const app = document.querySelector('.app');
    if (!app) return;

    const section = document.createElement('div');
    section.className = 'section wish-section';
    section.id = 'wishSection';
    section.innerHTML =
      '<div class="slabel">Желания</div>' +
      '<div class="wish-card" id="wishCard">' +
        '<span class="wish-icon">⭐</span>' +
        '<div class="wish-info">' +
          '<div class="wish-title">Напиши желание</div>' +
          '<div class="wish-sub" id="wishSub">Расскажи, чего хочется 💫</div>' +
        '</div>' +
        '<span class="wish-badge" id="wishBadge" style="display:none">0</span>' +
      '</div>';

    // Вставляем после карточки серии
    const sections = app.querySelectorAll('.section');
    if (sections.length >= 2) {
      sections[1].parentNode.insertBefore(section, sections[1].nextSibling);
    } else {
      app.appendChild(section);
    }

    $('wishCard').addEventListener('click', openModal);
  }

  /* ===== Модалка ===== */
  function buildModal(){
    if ($('wishModalBg')) return;
    const bg = document.createElement('div');
    bg.className = 'wish-modal-bg';
    bg.id = 'wishModalBg';
    bg.innerHTML = '<div class="wish-modal" id="wishModalInner"></div>';
    document.body.appendChild(bg);
    bg.addEventListener('click', e => { if (e.target.id === 'wishModalBg') closeModal(); });
  }

  function openModal(){
    buildModal();
    renderModal();
    $('wishModalBg').classList.add('show');
    loadWishes();
  }
  function closeModal(){ const m = $('wishModalBg'); if (m) m.classList.remove('show'); }

  function renderModal(){
    const inner = $('wishModalInner');
    if (!inner) return;

    let html = '<div class="wish-modal-title">⭐ Желания</div>';
    html += '<div class="wish-modal-sub">поделись тем, чего хочется</div>';

    html += '<div class="wish-tabs">';
    html += '<button class="wish-tab' + (currentTab === 'all' ? ' active' : '') + '" onclick="wishTab(\'all\')">Все</button>';
    html += '<button class="wish-tab' + (currentTab === 'mine' ? ' active' : '') + '" onclick="wishTab(\'mine\')">Мои</button>';
    html += '<button class="wish-tab' + (currentTab === 'write' ? ' active' : '') + '" onclick="wishTab(\'write\')">Написать</button>';
    html += '</div>';

    if (currentTab === 'write') {
      html += '<textarea class="wish-input" id="wishInput" placeholder="Хочу, чтобы..." maxlength="300"></textarea>';
      html += '<div class="wish-modal-btns">';
      html += '<button class="wish-btn-cancel" onclick="wishTab(\'all\')">Отмена</button>';
      html += '<button class="wish-btn-ok" onclick="submitWish()">Отправить ⭐</button>';
      html += '</div>';
      inner.innerHTML = html;
      setTimeout(() => { const i = $('wishInput'); if (i) i.focus(); }, 200);
      return;
    }

    // Список
    let list = wishes;
    if (currentTab === 'mine') list = wishes.filter(w => w.isMine);

    if (!list.length) {
      html += '<div class="wish-empty">' +
        (currentTab === 'mine' ? 'Ты пока не писал(а) желаний.<br>Тапни «Написать» ↑' : 'Пока желаний нет.<br>Будь первым ⭐') +
        '</div>';
    } else {
      html += '<div class="wish-list">';
      list.forEach(w => {
        const unread = !w.isMine && !w.seen;
        const dt = new Date(w.createdAt);
        const ago = timeAgo(w.createdAt);
        html += '<div class="wish-item' + (unread ? ' unread' : '') + '" data-id="' + w.id + '">';
        html += '<div class="wish-item-head">' +
          '<span class="wem">' + esc(w.fromEmoji) + '</span>' +
          '<span class="wname">' + (w.isMine ? 'Ты' : esc(w.fromName)) + '</span>' +
          '<span class="wtime">' + esc(ago) + '</span>' +
        '</div>';
        html += '<div class="wish-item-text">' + esc(w.text) + '</div>';
        if (w.isMine) {
          html += '<button class="wish-item-del" onclick="deleteWish(\'' + w.id + '\')">✕</button>';
        }
        html += '</div>';
      });
      html += '</div>';
    }

    html += '<div class="wish-modal-btns"><button class="wish-btn-cancel" onclick="wishClose()">Закрыть</button></div>';
    inner.innerHTML = html;

    // Помечаем непрочитанные
    list.forEach(w => {
      if (!w.isMine && !w.seen) markSeen(w.id);
    });
  }

  function timeAgo(ts){
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'только что';
    if (m < 60) return m + ' мин назад';
    const h = Math.floor(m / 60);
    if (h < 24) return h + ' ч назад';
    const d = Math.floor(h / 24);
    if (d < 30) return d + ' дн назад';
    return new Date(ts).toLocaleDateString('ru-RU');
  }

  window.wishTab = function(tab){
    currentTab = tab;
    renderModal();
    if (tab === 'all' || tab === 'mine') loadWishes();
  };
  window.wishClose = closeModal;

  window.submitWish = async function(){
    const t = getToken();
    const input = $('wishInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) { alert('Напиши желание'); return; }
    try {
      input.disabled = true;
      const r = await fetch('/api/wish/create', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ token: t, text })
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'Ошибка');
      currentTab = 'all';
      await loadWishes();
      renderModal();
    } catch(e){
      alert(e.message);
      input.disabled = false;
    }
  };

  window.deleteWish = async function(id){
    if (!confirm('Удалить желание?')) return;
    const t = getToken();
    try {
      await fetch('/api/wish/delete', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ token: t, id })
      });
      await loadWishes();
      renderModal();
    } catch(e){}
  };

  async function markSeen(id){
    const t = getToken();
    try {
      await fetch('/api/wish/seen', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ token: t, id })
      });
      const w = wishes.find(x => x.id === id);
      if (w) w.seen = true;
    } catch(e){}
  }

  async function loadWishes(){
    const t = getToken();
    if (!t) return;
    try {
      const r = await fetch('/api/wish/list?token=' + encodeURIComponent(t));
      const d = await r.json();
      wishes = d.wishes || [];
      updateBadge();
    } catch(e){}
  }

  function updateBadge(){
    const badge = $('wishBadge');
    const sub = $('wishSub');
    if (!badge) return;
    unreadCount = wishes.filter(w => !w.isMine && !w.seen).length;
    if (unreadCount > 0) {
      badge.style.display = '';
      badge.textContent = unreadCount;
      if (sub) sub.textContent = unreadCount === 1 ? 'Новое желание от партнёра 💫' : unreadCount + ' новых желаний 💫';
    } else {
      badge.style.display = 'none';
      if (sub) sub.textContent = 'Расскажи, чего хочется 💫';
    }
  }

  function init(){
    buildCard();
    loadWishes();
    setInterval(loadWishes, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 800));
  } else {
    setTimeout(init, 800);
  }
})();
