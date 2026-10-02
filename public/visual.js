(function(){
  'use strict';

  const RIPPLE_SEL = '.btn, .act, .settings-item, .rec, .theme-btn, .faq-q, .quiz-opt, .logout, .btn-item, .qc-btn, .quiz-tab, .ib, .icon-btn, .quiz-fab, .pitem';

  document.addEventListener('pointerdown', function(e){
    const target = e.target.closest(RIPPLE_SEL);
    if (!target) return;
    if (target.disabled) return;

    const cs = getComputedStyle(target);
    if (cs.position === 'static') target.style.position = 'relative';

    // найти/создать clip
    let clip = null;
    for (let i = 0; i < target.children.length; i++) {
      const c = target.children[i];
      if (c.classList && c.classList.contains('ripple-clip')) { clip = c; break; }
    }
    if (!clip) {
      clip = document.createElement('span');
      clip.className = 'ripple-clip';
      target.appendChild(clip);
    }

    const rect = target.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const maxDist = Math.max(
      Math.hypot(px, py),
      Math.hypot(rect.width - px, py),
      Math.hypot(px, rect.height - py),
      Math.hypot(rect.width - px, rect.height - py)
    );
    const size = maxDist * 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-fx';
    ripple.style.left = (px - size / 2) + 'px';
    ripple.style.top = (py - size / 2) + 'px';
    ripple.style.width = size + 'px';
    ripple.style.height = size + 'px';
    clip.appendChild(ripple);
    setTimeout(function(){ ripple.remove(); }, 700);
  }, { passive: true });

  /* ===== Переход между вкладками ===== */
  /* Проверяем поддержку View Transitions API */
  const hasViewTransitions = 'startViewTransition' in document;

  document.addEventListener('click', function(e){
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href) return;
    if (href.indexOf('http') === 0) return;
    if (href.indexOf('#') === 0) return;
    if (href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;

    // Если View Transitions работает — пусть браузер сам делает красивый переход
    if (hasViewTransitions) return;

    // Fallback: fade-out перед переходом
    e.preventDefault();
    document.body.classList.add('page-leaving');
    setTimeout(function(){ location.href = href; }, 240);
  });

  /* ===== Улучшения — glass + gradient borders ===== */
  function enhance(){
    const glassSel = '.modal, .hue-wrap, .stats, .btn-item, .faq-item, .settings-item, .pick .pc, .picker-card, .cl-modal, .rec, .act.dark, .hitem, .hempty, .fire-card.off, .quiz-card, .quiz-result-item, .history-item';
    document.querySelectorAll(glassSel).forEach(function(el){
      el.classList.add('glass');
    });
    const borderSel = '.settings-item, .hue-wrap, .btn-item, .faq-item, .rec, .stats';
    document.querySelectorAll(borderSel).forEach(function(el){
      el.classList.add('grad-border');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){
      enhance();
      setTimeout(enhance, 500);
      setTimeout(enhance, 1500);
    });
  } else {
    enhance();
    setTimeout(enhance, 500);
    setTimeout(enhance, 1500);
  }
})();
