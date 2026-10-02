(function(){
  try {
    // sessionStorage = показывать 1 раз за "сессию браузера"
    // (открыл браузер → splash, перешёл по страницам → без splash, закрыл браузер → splash снова)
    if (sessionStorage.getItem('teplo_splash_shown')) return;
    sessionStorage.setItem('teplo_splash_shown', '1');

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

    setTimeout(function(){
      s.classList.add('hide');
      setTimeout(function(){
        if (s.parentNode) s.parentNode.removeChild(s);
      }, 800);
    }, 2100);
  } catch(e){}
})();
