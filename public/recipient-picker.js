(function(){
  'use strict';

  function $(id){ return document.getElementById(id); }

  function esc(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }

  /* Создаём панель */
  function buildBar(){
    if ($('rpBar')) return;

    const bar = document.createElement('div');
    bar.className = 'rp-bar';
    bar.id = 'rpBar';
    bar.innerHTML =
      '<span class="rp-label">Кому отправить</span>' +
      '<button class="rp-btn" id="rpBtn" type="button">' +
        '<span class="rp-em" id="rpEm">🌸</span>' +
        '<span class="rp-name" id="rpName">—</span>' +
        '<span class="rp-dot" id="rpDot"></span>' +
        '<span class="rp-arrow">▼</span>' +
      '</button>';

    // Куда вставляем: перед первым .section в .app (там где серия)
    const app = document.querySelector('.app');
    if (!app) return;
    const firstSection = app.querySelector('.section');
    if (firstSection) {
      app.insertBefore(bar, firstSection);
    } else {
      app.insertBefore(bar, app.firstChild);
    }

    $('rpBtn').addEventListener('click', openModal);
  }

  /* Создаём модалку */
  function buildModal(){
    if ($('rpModalBg')) return;

    const bg = document.createElement('div');
    bg.className = 'rp-modal-bg';
    bg.id = 'rpModalBg';
    bg.innerHTML =
      '<div class="rp-modal">' +
        '<div class="rp-modal-title">Кто получатель</div>' +
        '<div class="rp-list" id="rpList"></div>' +
        '<button class="rp-close" id="rpClose" type="button">Закрыть</button>' +
      '</div>';

    document.body.appendChild(bg);

    bg.addEventListener('click', function(e){
      if (e.target.id === 'rpModalBg') closeModal();
    });
    $('rpClose').addEventListener('click', closeModal);
  }

  /* Обновляем кнопку по текущему recipient */
  function refreshBtn(){
    const rpEm = $('rpEm');
    const rpName = $('rpName');
    const rpBtn = $('rpBtn');
    if (!rpEm || !rpName || !rpBtn) return;

    // Данные берём из глобальных переменных index.html
    if (typeof recipient !== 'undefined' && recipient) {
      rpEm.textContent = recipient.emoji || '🌸';
      rpName.textContent = recipient.name || '—';
      rpBtn.classList.toggle('ready', !!recipient.ready);
    } else {
      rpEm.textContent = '🌸';
      rpName.textContent = 'Выбрать';
      rpBtn.classList.remove('ready');
    }
  }

  /* Открыть модалку */
  function openModal(){
    buildModal();
    renderList();
    $('rpModalBg').classList.add('show');
  }

  function closeModal(){
    const m = $('rpModalBg');
    if (m) m.classList.remove('show');
  }

  /* Список получателей */
  function renderList(){
    const list = $('rpList');
    if (!list) return;
    list.innerHTML = '';

    if (typeof allUsers === 'undefined' || !allUsers.length) {
      list.innerHTML = '<div style="text-align:center;color:var(--dim);padding:16px;font-size:13px">Нет получателей</div>';
      return;
    }

    allUsers.forEach(function(u){
      const isActive = (typeof recipient !== 'undefined' && recipient && recipient.id === u.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rp-item' + (isActive ? ' active' : '');
      btn.innerHTML =
        '<span class="rp-em">' + esc(u.emoji) + '</span>' +
        '<span class="rp-name">' + esc(u.name) + '</span>' +
        '<span class="rp-status">' + (u.ready ? 'готов' : 'не подключён') + '</span>';

      btn.addEventListener('click', function(){
        // 1. Сначала закрываем — гарантированно
        closeModal();

        // 2. Потом выбираем — в try/catch, чтобы ошибки не помешали
        try {
          if (typeof window.rpSelectRecipient === 'function') {
            window.rpSelectRecipient(u.id);
          } else {
            console.warn('rpSelectRecipient not defined');
          }
        } catch(err) {
          console.error('rpSelectRecipient error:', err);
        }

        // 3. Обновляем кнопку
        setTimeout(refreshBtn, 50);
      });

      list.appendChild(btn);
    });
  }

  /* Перехватываем клик по старой карточке — не нужно, она скрыта */
  /* Обновляем кнопку при изменениях */
  function startWatch(){
    // Проверяем каждые 400мс, поменялся ли recipient
    setInterval(refreshBtn, 400);
  }

  function init(){
    buildBar();
    refreshBtn();
    startWatch();

    // Сразу пробуем открыть модалку после загрузки, если recipient не выбран
    // (на index.html выбор уже сделан — не надо)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 600); });
  } else {
    setTimeout(init, 600);
  }
})();

/* ===== Скрываем старый заголовок "Кому отправить" и старый блок ===== */
(function(){
  function hideOld(){
    // Находим все .slabel с текстом "кому отправить"
    document.querySelectorAll('.slabel').forEach(function(el){
      var t = (el.textContent || '').trim().toLowerCase();
      if (t === 'кому отправить' || t === 'кому отправить' || t.indexOf('кому отправ') === 0) {
        el.style.display = 'none';
        // Скрываем и родительскую секцию, если она пустая
        var parent = el.parentElement;
        if (parent) {
          var rec = parent.querySelector('.recipients');
          if (rec && rec.style.display === 'none') {
            // Оставляем только если там есть ещё что-то
          }
        }
      }
    });
    // Скрываем сам блок .recipients
    document.querySelectorAll('.recipients').forEach(function(el){
      el.style.display = 'none';
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){
      setTimeout(hideOld, 300);
      setTimeout(hideOld, 1000);
      setTimeout(hideOld, 2500);
    });
  } else {
    setTimeout(hideOld, 300);
    setTimeout(hideOld, 1000);
    setTimeout(hideOld, 2500);
  }
})();
