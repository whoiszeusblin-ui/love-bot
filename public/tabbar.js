(function(){
  function init(){
    if (document.querySelector('.tabbar')) return;
    const path = location.pathname;
    const q = location.search || '';
    const isGames = path.indexOf('games') >= 0;
    const isSettings = path.indexOf('settings') >= 0;
    const nav = document.createElement('nav');
    nav.className = 'tabbar';
    nav.innerHTML =
      '<a href="index.html' + q + '" class="' + (!isGames && !isSettings ? 'active' : '') + '">' +
        '<span class="tb-icon">🏠</span>Главная</a>' +
      '<a href="games.html' + q + '" class="' + (isGames ? 'active' : '') + '">' +
        '<span class="tb-icon">🎮</span>Игры</a>' +
      '<a href="settings.html' + q + '" class="' + (isSettings ? 'active' : '') + '">' +
        '<span class="tb-icon">⚙️</span>Настройки</a>';
    document.body.appendChild(nav);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
