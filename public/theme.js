(function(){
  const THEMES = [
    { id:'wine',   name:'🌹 Винная',    pink:'#ff2164', mag:'#fb3dff' },
    { id:'soft',   name:'🌸 Нежная',    pink:'#e8768f', mag:'#d97eb8' },
    { id:'night',  name:'🌙 Ночная',    pink:'#9b23ea', mag:'#c46bff' },
    { id:'day',    name:'☀️ Дневная',   pink:'#ff6b8a', mag:'#ff3dab' },
    { id:'nature', name:'🍃 Природная', pink:'#7cb342', mag:'#a5d66a' },
    { id:'cyber',  name:'⚡ Киберпанк', pink:'#00f0ff', mag:'#ff00ea' }
  ];
  let flashTimer = null;

  function ensureThemeStyles(){
    if (document.getElementById('themeStyles')) return;
    const st = document.createElement('style');
    st.id = 'themeStyles';
    st.textContent = 
      '.theme-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
      '.theme-item{padding:16px 12px;border-radius:14px;border:2px solid var(--border);background:var(--card);cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;color:var(--text);text-align:center;transition:all .2s ease;position:relative}' +
      '.theme-item .t-preview{width:100%;height:10px;border-radius:5px;margin-bottom:10px;background:linear-gradient(90deg,var(--t-pink),var(--t-mag))}' +
      '.theme-item .t-name{font-size:13px;font-weight:700}' +
      '.theme-item.active{border-color:var(--pink);box-shadow:0 0 20px var(--fire-glow,rgba(255,33,100,.3))}' +
      '.theme-item.active::after{content:"✓";position:absolute;top:6px;right:10px;color:var(--pink);font-weight:900;font-size:14px}' +
      '.theme-item:active{transform:scale(.95)}';
    document.head.appendChild(st);
  }

  function ensureThemeModal(){
    ensureThemeStyles();
    if (document.getElementById('themeModal')) return;
    const wrap = document.createElement('div');
    wrap.className = 'modal-bg';
    wrap.id = 'themeModal';
    wrap.innerHTML = 
      '<div class="modal" style="max-width:420px">' +
        '<div style="text-align:center;font-size:18px;font-weight:900;color:var(--pink);margin-bottom:4px">🎨 Выбери тему</div>' +
        '<div style="text-align:center;font-size:11px;color:var(--dim);font-family:\'Roboto Mono\',monospace;margin-bottom:16px">6 палитр с плавным переходом</div>' +
        '<div class="theme-grid" id="themeGrid"></div>' +
        '<div class="modal-btns"><button class="btn-cancel" onclick="closeThemePicker()">Закрыть</button></div>' +
      '</div>';
    document.body.appendChild(wrap);
    wrap.addEventListener('click', function(e){
      if (e.target.id === 'themeModal') window.closeThemePicker();
    });
  }

  window.applyTheme = function(id, withFlash){
    if (withFlash !== false) {
      document.body.classList.add('theme-flash');
      clearTimeout(flashTimer);
      flashTimer = setTimeout(function(){
        document.body.classList.remove('theme-flash');
      }, 620);
    }
    const clean = document.body.className
      .split(' ')
      .filter(function(c){ return c && c.indexOf('theme-') !== 0 && c !== 'theme-flash'; })
      .join(' ');
    document.body.className = (clean + ' theme-' + id).trim();
    try { localStorage.setItem('teplo_theme', id); } catch(e){}
  };

  window.openThemePicker = function(){
    ensureThemeModal();
    const g = document.getElementById('themeGrid');
    if (!g) return;
    g.innerHTML = '';
    const cur = localStorage.getItem('teplo_theme') || 'wine';
    THEMES.forEach(function(t){
      const b = document.createElement('button');
      b.className = 'theme-item' + (t.id === cur ? ' active' : '');
      b.style.setProperty('--t-pink', t.pink);
      b.style.setProperty('--t-mag', t.mag);
      b.innerHTML = '<div class="t-preview"></div><div class="t-name">' + t.name + '</div>';
      b.onclick = function(){
        window.applyTheme(t.id);
        g.querySelectorAll('.theme-item').forEach(function(el){ el.classList.remove('active'); });
        b.classList.add('active');
        setTimeout(function(){ window.closeThemePicker(); }, 250);
      };
      g.appendChild(b);
    });
    document.getElementById('themeModal').classList.add('show');
  };

  window.closeThemePicker = function(){
    const m = document.getElementById('themeModal');
    if (m) m.classList.remove('show');
  };

  window.applyTheme(localStorage.getItem('teplo_theme') || 'wine', false);
})();
