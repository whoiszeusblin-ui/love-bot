(function(){
  try {
    const KEY = 'teplo_splash_shown';
    const NOW = Date.now();
    const shown = parseInt(localStorage.getItem(KEY) || '0', 10);
    // Не показывать, если уже видели за последние 30 минут
    if (shown && NOW - shown < 30 * 60 * 1000) return;

    const s = document.createElement('div');
    s.id = 'splash';
    s.innerHTML =
      '<div class="splash-fire">🔥</div>' +
      '<div class="splash-title">' +
        '<span class="splash-letter">Т</span>' +
        '<span class="splash-letter">Е</span>' +
        '<span class="splash-letter">П</span>' +
        '<span class="splash-letter">Л</span>' +
        '<span class="splash-letter">О</span>' +
      '</div>' +
      '<div class="splash-sub">messages · with love</div>';

    document.documentElement.appendChild(s);
    try { localStorage.setItem(KEY, String(NOW)); } catch(e){}

    setTimeout(function(){
      s.classList.add('hide');
      setTimeout(function(){
        if (s.parentNode) s.parentNode.removeChild(s);
      }, 800);
    }, 2100);
  } catch(e){}
})();
