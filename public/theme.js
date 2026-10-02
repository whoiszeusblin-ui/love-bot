(function(){
  const STORAGE_KEY = 'teplo_hue';
  let currentHue = 340;
  let raf = null;

  /* ==== HSL → HEX ==== */
  function hslToHex(h, s, l){
    h = ((h % 360) + 360) % 360;
    s /= 100; l /= 100;
    const c = (1 - Math.abs(2*l - 1)) * s;
    const x = c * (1 - Math.abs(((h/60) % 2) - 1));
    const m = l - c/2;
    let r=0, g=0, b=0;
    if (h < 60) { r=c; g=x; }
    else if (h < 120) { r=x; g=c; }
    else if (h < 180) { g=c; b=x; }
    else if (h < 240) { g=x; b=c; }
    else if (h < 300) { r=x; b=c; }
    else { r=c; b=x; }
    const R = Math.round((r+m)*255);
    const G = Math.round((g+m)*255);
    const B = Math.round((b+m)*255);
    return '#' + [R,G,B].map(function(v){
      return ('0'+Math.max(0,Math.min(255,v)).toString(16)).slice(-2);
    }).join('');
  }
  function hslToRgb(h, s, l){
    const hex = hslToHex(h, s, l);
    const r = parseInt(hex.substr(1,2), 16);
    const g = parseInt(hex.substr(3,2), 16);
    const b = parseInt(hex.substr(5,2), 16);
    return { r:r, g:g, b:b };
  }

  /* ==== Основная функция ==== */
  window.applyHue = function(h, opts){
    document.body.classList.remove('theme-wine','theme-soft','theme-night','theme-day','theme-nature','theme-cyber');

    opts = opts || {};
    currentHue = h;
    const root = document.body;

    const pink = hslToHex(h, 78, 55);
    const pinkD = hslToHex(h, 78, 38);
    const mag = hslToHex(h + 60, 80, 60);
    const magD = hslToHex(h + 60, 80, 42);
    const pur = hslToHex(h + 120, 70, 55);
    const purD = hslToHex(h + 120, 70, 38);
    const blue = hslToHex(h + 200, 65, 55);
    const blueD = hslToHex(h + 200, 65, 38);

    const rgb = hslToRgb(h, 78, 55);
    const fireGlow = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.4)';

    root.style.setProperty('--pink', pink);
    root.style.setProperty('--pink-d', pinkD);
    root.style.setProperty('--mag', mag);
    root.style.setProperty('--mag-d', magD);
    root.style.setProperty('--pur', pur);
    root.style.setProperty('--pur-d', purD);
    root.style.setProperty('--blue', blue);
    root.style.setProperty('--blue-d', blueD);
    root.style.setProperty('--fire-glow', fireGlow);

    // Синхронизируем с ползунком, если он есть на странице
    const slider = document.getElementById('hueSlider');
    if (slider && parseInt(slider.value, 10) !== h) slider.value = h;
    const bubble = document.getElementById('hueBubble');
    if (bubble) bubble.style.background = pink;

    if (!opts.noSave) {
      try { localStorage.setItem(STORAGE_KEY, String(h)); } catch(e){}
    }
  };

  /* Плавная анимация перехода к цвету */
  window.animateHueTo = function(target){
    if (raf) cancelAnimationFrame(raf);
    const startHue = currentHue;
    const start = performance.now();
    const duration = 400;
    const diff = target - startHue;
    function step(now){
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const h = startHue + diff * eased;
      window.applyHue(h);
      if (t < 1) raf = requestAnimationFrame(step);
      else raf = null;
    }
    raf = requestAnimationFrame(step);
  };

  /* ==== Инициализация ==== */
  const saved = localStorage.getItem(STORAGE_KEY);
  window.applyHue(saved ? parseFloat(saved) : 340, { noSave: true });

  /* ==== Обработчик ползунка ==== */
  document.addEventListener('input', function(e){
    if (e.target && e.target.id === 'hueSlider') {
      window.applyHue(parseFloat(e.target.value));
    }
  });
})();
