(function(){
  'use strict';

  let raf = null;
  let lastY = window.scrollY;
  let enabled = true;

  /* Отключаем параллакс если пользователь просил "меньше движения" */
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    enabled = false;
  }

  function update(){
    if (!enabled) { raf = null; return; }
    const y = window.scrollY;

    const blob1 = document.querySelector('.bg-anim .blob-1');
    const blob2 = document.querySelector('.bg-anim .blob-2');
    const blob3 = document.querySelector('.bg-anim .blob-3');
    const starLayer = document.querySelector('.star-layer');

    // Скорости: чем меньше множитель, тем сильнее параллакс
    // Отрицательное — движется ВВЕРХ, пока страница вниз (эффект отдаления)
    if (blob1) blob1.style.transform = 'translate(0, ' + (-y * 0.15) + 'px)';
    if (blob2) blob2.style.transform = 'translate(0, ' + (-y * 0.10) + 'px)';
    if (blob3) blob3.style.transform = 'translate(0, ' + (-y * 0.20) + 'px)';
    if (starLayer) starLayer.style.transform = 'translate(0, ' + (-y * 0.05) + 'px)';

    lastY = y;
    raf = null;
  }

  function onScroll(){
    if (raf !== null) return;
    raf = requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // Стартовый вызов
  setTimeout(update, 800);
})();
