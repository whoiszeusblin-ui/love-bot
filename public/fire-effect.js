(function(){
  let sparkTimer = null;
  let emberTimer = null;

  function makeSpark(wrap){
    const s = document.createElement('span');
    s.className = 'fire-spark';
    const angle = (Math.random() - 0.5) * 80;
    const dist = 30 + Math.random() * 60;
    s.style.setProperty('--dx', Math.round(Math.sin(angle * Math.PI / 180) * dist) + 'px');
    s.style.setProperty('--dy', '-' + Math.round(dist + Math.random() * 40) + 'px');
    const size = 3 + Math.random() * 4;
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    s.style.animationDuration = (1.2 + Math.random() * 0.8) + 's';
    wrap.appendChild(s);
    setTimeout(function(){ s.remove(); }, 2200);
  }

  function makeEmber(wrap){
    const e = document.createElement('span');
    e.className = 'fire-ember';
    const angle = (Math.random() - 0.5) * 60;
    const dist = 20 + Math.random() * 40;
    e.style.setProperty('--dx', Math.round(Math.sin(angle * Math.PI / 180) * dist) + 'px');
    e.style.setProperty('--dy', '-' + Math.round(dist + Math.random() * 30) + 'px');
    e.style.animationDuration = (2.0 + Math.random() * 1.2) + 's';
    wrap.appendChild(e);
    setTimeout(function(){ e.remove(); }, 3400);
  }

  function start(wrap){
    if (sparkTimer) return;
    function loopSpark(){
      if (wrap.classList.contains('cold')) { sparkTimer = setTimeout(loopSpark, 800); return; }
      makeSpark(wrap);
      sparkTimer = setTimeout(loopSpark, 180 + Math.random() * 260);
    }
    function loopEmber(){
      if (wrap.classList.contains('cold')) { emberTimer = setTimeout(loopEmber, 1200); return; }
      makeEmber(wrap);
      emberTimer = setTimeout(loopEmber, 400 + Math.random() * 400);
    }
    loopSpark();
    loopEmber();
  }

  function setup(){
    const emoji = document.getElementById('fireEmoji');
    if (!emoji || emoji.parentElement.classList.contains('fire-wrap')) return;

    // Оборачиваем emoji в контейнер
    const wrap = document.createElement('div');
    wrap.className = 'fire-wrap' + (emoji.classList.contains('cold') ? ' cold' : '');
    emoji.parentNode.insertBefore(wrap, emoji);
    wrap.appendChild(emoji);

    // Добавляем свечение под огнём
    const glow = document.createElement('div');
    glow.className = 'fire-glow';
    wrap.appendChild(glow);

    // Следим за классом cold у emoji
    const observer = new MutationObserver(function(){
      const isCold = emoji.classList.contains('cold');
      wrap.classList.toggle('cold', isCold);
    });
    observer.observe(emoji, { attributes: true, attributeFilter: ['class'] });

    start(wrap);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(setup, 400); });
  } else {
    setTimeout(setup, 400);
  }
})();
