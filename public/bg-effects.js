(function(){
  function makeStars(){
    if (document.querySelector('.star-layer')) return;
    const layer = document.createElement('div');
    layer.className = 'star-layer';
    const count = 45;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'star';
      s.style.left = (Math.random() * 100) + '%';
      s.style.top = (Math.random() * 100) + '%';
      const size = 1 + Math.random() * 2;
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.animationDuration = (3 + Math.random() * 4) + 's';
      s.style.animationDelay = (-Math.random() * 6) + 's';
      layer.appendChild(s);
    }
    document.body.insertBefore(layer, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(makeStars, 100));
  } else {
    setTimeout(makeStars, 100);
  }
})();
