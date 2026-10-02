(function(){
  function init(){
    if (document.querySelector('.bg-anim')) return;

    const wrap = document.createElement('div');
    wrap.className = 'bg-anim';

    // три градиентных пятна
    for (let i = 1; i <= 3; i++) {
      const b = document.createElement('div');
      b.className = 'blob blob-' + i;
      wrap.appendChild(b);
    }

    // 12 медленных частиц
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = (Math.random() * 100) + '%';
      const size = 2 + Math.random() * 4;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.animationDuration = (18 + Math.random() * 22) + 's';
      p.style.animationDelay = (-Math.random() * 30) + 's';
      wrap.appendChild(p);
    }

    // вставляем первым элементом в body, чтобы фон был позади всего
    document.body.insertBefore(wrap, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
