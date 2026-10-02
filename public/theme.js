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

  window.applyTheme = function(id, withFlash){
    if (withFlash !== false) {
      document.body.classList.add('theme-flash');
      clearTimeout(flashTimer);
      flashTimer = setTimeout(function(){
        document.body.classList.remove('theme-flash');
      }, 620);
    }
    // Сохраняем остальные классы, кроме theme-*
    const clean = document.body.className
      .split(' ')
      .filter(function(c){ return c && c.indexOf('theme-') !== 0; })
      .join(' ');
    document.body.className = (clean + ' theme-' + id).trim();
    try { localStorage.setItem('teplo_theme', id); } catch(e){}
  };

  window.openThemePicker = function(){
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
        window.closeThemePicker();
        // Обновить активность в пикере
        setTimeout(function(){
          const items = g.querySelectorAll('.theme-item');
          items.forEach(function(el, i){ el.classList.toggle('active', THEMES[i].id === t.id); });
        }, 50);
      };
      g.appendChild(b);
    });
    const modal = document.getElementById('themeModal');
    if (modal) modal.classList.add('show');
  };

  window.closeThemePicker = function(){
    const modal = document.getElementById('themeModal');
    if (modal) modal.classList.remove('show');
  };

  // Первая загрузка — без вспышки
  window.applyTheme(localStorage.getItem('teplo_theme') || 'wine', false);

  document.addEventListener('DOMContentLoaded', function(){
    const modal = document.getElementById('themeModal');
    if (modal) {
      modal.addEventListener('click', function(e){
        if (e.target.id === 'themeModal') window.closeThemePicker();
      });
    }
  });
})();
