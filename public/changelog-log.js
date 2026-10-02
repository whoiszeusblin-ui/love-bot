(function(){
  const $ = function(id){ return document.getElementById(id); };
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }

  function ensureStyles(){
    if (document.getElementById('clLogStyles')) return;
    const st = document.createElement('style');
    st.id = 'clLogStyles';
    st.textContent = 
      '.cl-log-head{display:flex;align-items:center;gap:10px;margin-bottom:18px}' +
      '.cl-log-icon{font-size:28px}' +
      '.cl-log-title{font-size:18px;font-weight:900;color:var(--text);flex:1}' +
      '.cl-log-count{font-size:11px;padding:4px 10px;background:var(--pink);color:#fff;border-radius:20px;font-family:Roboto Mono,monospace;font-weight:700}' +
      '.cl-log-list{display:flex;flex-direction:column;gap:10px;max-height:60vh;overflow-y:auto;padding-right:4px}' +
      '.cl-log-item{background:var(--bg);border:1.5px solid var(--border);border-radius:14px;overflow:hidden;transition:border-color .3s ease}' +
      '.cl-log-item.latest{border-color:var(--pink);box-shadow:0 0 20px var(--fire-glow,rgba(255,33,100,.2))}' +
      '.cl-log-toggle{width:100%;padding:16px 18px;background:transparent;border:none;cursor:pointer;font-family:inherit;text-align:left;color:var(--text);position:relative;display:block}' +
      '.cl-log-toggle:active{background:rgba(255,255,255,.04)}' +
      '.cl-log-date{font-size:11px;color:var(--dim);font-family:Roboto Mono,monospace;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px}' +
      '.cl-log-ttl{font-size:15px;font-weight:900;color:var(--pink);margin-bottom:6px;padding-right:24px}' +
      '.cl-log-meta{font-size:11px;color:var(--dim);font-family:Roboto Mono,monospace}' +
      '.cl-log-arrow{position:absolute;right:16px;top:50%;transform:translateY(-50%);color:var(--dim);font-size:14px;transition:transform .3s cubic-bezier(.16,1,.3,1)}' +
      '.cl-log-item.open .cl-log-arrow{transform:translateY(-50%) rotate(180deg)}' +
      '.cl-log-body{max-height:0;overflow:hidden;transition:max-height .4s cubic-bezier(.16,1,.3,1)}' +
      '.cl-log-item.open .cl-log-body{max-height:600px}' +
      '.cl-log-changes{list-style:none;padding:0 18px 16px;margin:0}' +
      '.cl-log-changes li{padding:8px 12px;font-size:13px;color:var(--muted);line-height:1.45;background:rgba(255,255,255,.03);border-radius:8px;margin-bottom:6px;border-left:3px solid var(--pink)}';
    document.head.appendChild(st);
  }

  function ensureModal(){
    ensureStyles();
    if ($('clLogModal')) return;
    const w = document.createElement('div');
    w.className = 'modal-bg';
    w.id = 'clLogModal';
    w.innerHTML = 
      '<div class="modal" style="max-width:460px">' +
        '<div class="cl-log-head">' +
          '<span class="cl-log-icon">📜</span>' +
          '<div class="cl-log-title">История обновлений</div>' +
          '<span class="cl-log-count" id="clLogCount">0</span>' +
        '</div>' +
        '<div class="cl-log-list" id="clLogList"></div>' +
        '<div class="modal-btns"><button class="btn-cancel" onclick="closeChangelogLog()">Закрыть</button></div>' +
      '</div>';
    document.body.appendChild(w);
    w.addEventListener('click', function(e){
      if (e.target.id === 'clLogModal') window.closeChangelogLog();
    });
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
      el.className = 'cl-log-item' + (i === 0 ? ' latest open' : '');
      const changesCount = (v.changes || []).length;
      const cntWord = changesCount === 1 ? 'е' : (changesCount < 5 ? 'я' : 'й');
      let html = '<button class="cl-log-toggle">' +
        '<div class="cl-log-date">' + esc(v.date || '') + '</div>' +
        '<div class="cl-log-ttl">' + esc(v.title || 'Обновление') + '</div>' +
        '<div class="cl-log-meta">' + changesCount + ' изменени' + cntWord + ' · нажми, чтобы раскрыть</div>' +
        '<span class="cl-log-arrow">▼</span>' +
      '</button>' +
      '<div class="cl-log-body">';
      if (Array.isArray(v.changes) && v.changes.length) {
        html += '<ul class="cl-log-changes">';
        v.changes.forEach(function(c){ html += '<li>' + esc(c) + '</li>'; });
        html += '</ul>';
      }
      html += '</div>';
      el.innerHTML = html;
      el.querySelector('.cl-log-toggle').onclick = function(){
        el.classList.toggle('open');
      };
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

  window.closeChangelogLog = function(){
    const m = $('clLogModal');
    if (m) m.classList.remove('show');
  };
})();
