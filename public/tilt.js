(function(){
  'use strict';

  /* ============================================================
     ЧАСТЬ 1. 3D-НАКЛОН ПРИ ТАПЕ
     ============================================================ */

  const TILT_SELECTOR = '.act, .rec, .settings-item, .faq-item, .wish-item, .dice-trigger, .quiz-card, .hitem, .btn-item';
  const MAX_TILT = 14; // градусов

  let activeEl = null;

  function reset(el){
    if (!el) return;
    el.classList.remove('tilting');
    el.style.transform = '';
    el.style.removeProperty('--tilt-x');
    el.style.removeProperty('--tilt-y');
  }

  function tiltAt(el, clientX, clientY){
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (clientX - r.left) / r.width;
    const y = (clientY - r.top) / r.height;

    // Наклон: влево-вправо → rotateY, вверх-вниз → rotateX
    const rotY = (x - 0.5) * 2 * MAX_TILT;   // -14..14
    const rotX = -(y - 0.5) * 2 * MAX_TILT;  // -14..14

    el.classList.add('tilting');
    el.style.transform = 'perspective(700px) rotateX(' + rotX.toFixed(2) + 'deg) rotateY(' + rotY.toFixed(2) + 'deg) scale(0.96)';
    el.style.setProperty('--tilt-x', (x * 100).toFixed(1) + '%');
    el.style.setProperty('--tilt-y', (y * 100).toFixed(1) + '%');
  }

  document.addEventListener('pointerdown', function(e){
    const el = e.target.closest(TILT_SELECTOR);
    if (!el) return;
    if (el.disabled) return;
    activeEl = el;
    tiltAt(el, e.clientX, e.clientY);
  }, { passive: true });

  document.addEventListener('pointermove', function(e){
    if (!activeEl) return;
    tiltAt(activeEl, e.clientX, e.clientY);
  }, { passive: true });

  document.addEventListener('pointerup', function(){
    if (!activeEl) return;
    const el = activeEl;
    activeEl = null;
    // Короткая задержка, чтобы .tilting не убрался раньше
    setTimeout(function(){ reset(el); }, 40);
  }, { passive: true });

  document.addEventListener('pointercancel', function(){
    if (!activeEl) return;
    const el = activeEl;
    activeEl = null;
    reset(el);
  }, { passive: true });


  /* ============================================================
     ЧАСТЬ 2. ГИРОСКОП (параллакс глубины)
     ============================================================ */

  const GYRO_MAX_SHIFT = 8;      // максимум сдвига в px
  const GYRO_MAX_TILT = 2;       // максимум наклона контейнера в градусах
  const GYRO_DEADZONE = 2;       // мёртвая зона в градусах — не реагируем на мелкие шумы

  let baseBeta = null;
  let baseGamma = null;
  let gyroEnabled = false;

  function onOrientation(e){
    if (e.beta === null || e.gamma === null) return;

    if (baseBeta === null){
      baseBeta = e.beta;
      baseGamma = e.gamma;
      return;
    }

    let dBeta = e.beta - baseBeta;
    let dGamma = e.gamma - baseGamma;

    // Мёртвая зона — не дёргаемся от микро-шумов
    if (Math.abs(dBeta) < GYRO_DEADZONE) dBeta = 0;
    if (Math.abs(dGamma) < GYRO_DEADZONE) dGamma = 0;

    // Ограничиваем до ±20° реального наклона
    dBeta = Math.max(-20, Math.min(20, dBeta));
    dGamma = Math.max(-20, Math.min(20, dGamma));

    // Считаем сдвиг
    const shiftX = (dGamma / 20) * GYRO_MAX_SHIFT;
    const shiftY = (dBeta / 20) * GYRO_MAX_SHIFT;
    const rotX = (dBeta / 20) * GYRO_MAX_TILT;
    const rotY = (dGamma / 20) * GYRO_MAX_TILT;

    const app = document.querySelector('.app');
    if (app){
      app.style.transform =
        'translate3d(' + shiftX.toFixed(2) + 'px, ' + shiftY.toFixed(2) + 'px, 0) ' +
        'perspective(1000px) rotateX(' + rotX.toFixed(2) + 'deg) rotateY(' + rotY.toFixed(2) + 'deg)';
    }
  }

  async function enableGyro(){
    if (gyroEnabled) return;

    // iOS 13+ — требует явное разрешение
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function'){
      try {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result !== 'granted'){
          console.log('Гироскоп: разрешение не получено');
          return;
        }
      } catch(e){
        console.log('Гироскоп: ошибка запроса', e);
        return;
      }
    }

    if (!window.DeviceOrientationEvent) {
      console.log('Гироскоп: не поддерживается');
      return;
    }

    window.addEventListener('deviceorientation', onOrientation, { passive: true });
    gyroEnabled = true;
    console.log('Гироскоп: включён');
  }

  // На iOS нужно разрешение по клику — вешаем на первый тап
  let gyroAsked = false;
  document.addEventListener('click', function(){
    if (gyroAsked) return;
    gyroAsked = true;
    setTimeout(enableGyro, 300);
  }, { once: true });

  // На Android — можно включить сразу
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission !== 'function'){
    setTimeout(enableGyro, 800);
  }

  // При возврате фокуса — пересчёт базы
  document.addEventListener('visibilitychange', function(){
    if (!document.hidden){
      baseBeta = null;
      baseGamma = null;
    }
  });

})();
