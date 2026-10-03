(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }

  /* Куда должна смотреть каждая грань */
  const TARGETS = {
    1: { x: 0,   y: 0 },
    2: { x: 0,   y: -90 },
    3: { x: -90, y: 0 },
    4: { x: 90,  y: 0 },
    5: { x: 0,   y: 90 },
    6: { x: 0,   y: 180 }
  };

  let cumX = 0, cumY = 0;
  let rolling = false;

  /* ===== OVERLAY ===== */
  function buildOverlay(){
    if ($('diceOverlay')) return;
    const o = document.createElement('div');
    o.className = 'dice-overlay';
    o.id = 'diceOverlay';
    o.innerHTML =
      '<div class="dice-header">' +
        '<button class="dice-close" onclick="diceClose()">✕</button>' +
        '<div class="dice-title">🎲 КУБИК</div>' +
        '<div style="width:42px"></div>' +
      '</div>' +
      '<div class="dice-result" id="diceResult">?</div>' +
      '<div class="dice-scene">' +
        '<div class="dice-cube" id="diceCube">' +
          '<div class="dice-face dice-face--front">1</div>' +
          '<div class="dice-face dice-face--back">6</div>' +
          '<div class="dice-face dice-face--right">2</div>' +
          '<div class="dice-face dice-face--left">5</div>' +
          '<div class="dice-face dice-face--top">3</div>' +
          '<div class="dice-face dice-face--bottom">4</div>' +
        '</div>' +
      '</div>' +
      '<button class="dice-btn" id="diceRoll" onclick="diceRoll()">🎲 Бросить кубик</button>' +
      '<div class="dice-hint">нажми и узнай судьбу 🎯</div>';
    document.body.appendChild(o);
  }

  window.diceOpen = function(){
    buildOverlay();
    $('diceOverlay').classList.add('show');
    if (navigator.vibrate) try { navigator.vibrate(10); } catch(e){}
  };

  window.diceClose = function(){
    const o = $('diceOverlay');
    if (o) o.classList.remove('show');
  };

  window.diceRoll = function(){
    if (rolling) return;
    rolling = true;

    const cube = $('diceCube');
    const result = $('diceResult');
    const btn = $('diceRoll');

    result.classList.remove('show');
    btn.disabled = true;
    btn.textContent = 'Бросаю...';

    // Случайное число 1-6
    const num = Math.floor(Math.random() * 6) + 1;
    const target = TARGETS[num];

    // Считаем следующий угол (не менее 2.5 оборотов вперёд)
    let nextX = target.x;
    while (nextX <= cumX + 900) nextX += 360;
    let nextY = target.y;
    while (nextY <= cumY + 900) nextY += 360;

    // Немного случайного «перекоса» — чтобы каждая анимация была уникальной
    nextX += (Math.random() * 4 - 2);
    nextY += (Math.random() * 4 - 2);

    cube.style.transform = 'rotateX(' + nextX + 'deg) rotateY(' + nextY + 'deg)';

    cumX = nextX;
    cumY = nextY;

    // Вибрация во время броска — серия коротких импульсов
    if (navigator.vibrate) {
      try {
        navigator.vibrate([12, 60, 12, 60, 12, 60, 12, 60, 12, 60, 12, 60, 40]);
      } catch(e){}
    }

    // Показываем результат после завершения анимации
    setTimeout(function(){
      result.textContent = num;
      result.classList.add('show');
      btn.disabled = false;
      btn.textContent = '🎲 Бросить ещё';
      rolling = false;
      if (navigator.vibrate) try { navigator.vibrate([50, 40, 120]); } catch(e){}
    }, 2700);
  };

  /* ===== Автовставка кнопки в games.html ===== */
  function injectTrigger(){
    const app = document.querySelector('.app');
    if (!app || $('diceTrigger')) return;

    const header = app.querySelector('.header');
    if (!header) return;

    const section = document.createElement('div');
    section.className = 'section';
    section.id = 'diceTrigger';
    section.style.marginBottom = '22px';
    section.innerHTML =
      '<div class="slabel">🎲 Кубик Судьбы</div>' +
      '<button class="dice-trigger" onclick="diceOpen()">' +
        '<span class="dt-em">🎲</span>' +
        '<div class="dt-info">' +
          '<div class="dt-title">Бросить кубик</div>' +
          '<div class="dt-sub">для спора · рандом 1-6</div>' +
        '</div>' +
        '<span class="dt-arrow">→</span>' +
      '</button>';

    header.parentNode.insertBefore(section, header.nextSibling);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(injectTrigger, 400); });
  } else {
    setTimeout(injectTrigger, 400);
  }
  setTimeout(injectTrigger, 1500);
})();
