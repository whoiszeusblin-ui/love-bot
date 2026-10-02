(function(){
  const $ = function(id){ return document.getElementById(id); };

  function esc(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }

  function ensureModal(){
    if ($('clLogModal')) return;
    const w = document.createElement('div');
    w.className = 'modal-bg cl-log-modal';
    w.id = 'clLogModal';
    w.innerHTML =
      '<div class="modal" style="max-width:460px">' +
        '<div class="cl-log-head">' +
          '<span class="cl-log-icon">📜</span>' +
          '<div class="cl-log-title">История обновлений</div>' +
          '<span class="cl-log-count" id="clLogCount">0</span>' +
        '</div>' +
        '<div class="cl-log-list" id="clLogList"></div>' +
        '<div class="modal-btns" style="margin-top:18px">' +
          '<button class="btn-cancel" id="clLogClose" style="flex:1">Закрыть</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(w);
    w.addEventListener('click', function(e){
      if (e.target.id === 'clLogModal') closeLog();
    });
    $('clLogClose').onclick = closeLog;
  }

  function renderList(versions){
    const list = $('clLogList');
    if (!list) return;
    list.innerHTML = '';
    if (!versions.length) {
      list.innerHTML = '<div style="text-align:center;color:var(--dim);padding:20px;font-size:13px">Пока нет записей</div>';
      return;
    }
    versions.forEach(function(v, i){
      const el = document.createElement('div');
      el.className = 'cl-log-item' + (i === 0 ? ' latest' : '');
      let html = '<div class="cl-log-date">' + esc(v.date || '') + '</div>';
      html += '<div class="cl-log-ttl">' + esc(v.title || 'Обновление') + '</div>';
      if (Array.isArray(v.changes) && v.changes.length) {
        html += '<ul class="cl-log-changes">';
        v.changes.forEach(function(c){
          html += '<li>' + esc(c) + '</li>';
        });
        html += '</ul>';
      }
      el.innerHTML = html;
      list.appendChild(el);
    });
    const cnt = $('clLogCount');
    if (cnt) cnt.textContent = versions.length;
  }

  window.openChangelogLog = async function(){
    ensureModal();
    const list = $('clLogList');
    list.innerHTML = '<div style="text-align:center;color:var(--dim);padding:20px;font-size:13px">Загружаю...</div>';
    $('clLogModal').classList.add('show');
    try {
      const r = await fetch('/changelog.json?t=' + Date.now());
      const d = await r.json();
      renderList(d.versions || []);
    } catch(e){
      list.innerHTML = '<div style="text-align:center;color:#ff2164;padding:20px;font-size:13px">Не удалось загрузить</div>';
    }
  };

  function closeLog(){
    const m = $('clLogModal');
    if (m) m.classList.remove('show');
  }

  function injectBtn(){
    const header = document.querySelector('.header');
    if (!header || $('logBtn')) return;
    const b = document.createElement('button');
    b.className = 'theme-btn';
    b.id = 'logBtn';
    b.title = 'История обновлений';
    b.textContent = '📜';
    b.style.marginLeft = '8px';
    b.style.marginRight = '0';
    b.onclick = window.openChangelogLog;
    const me = header.querySelector('.me');
    if (me && me.parentNode) me.parentNode.insertBefore(b, me);
    else header.appendChild(b);
  }

  document.addEventListener('DOMContentLoaded', injectBtn);
})();
