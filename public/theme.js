(function(){
  const PRESETS = [
    { id:'wine',   name:'🌹', color:'#ff2164' },
    { id:'soft',   name:'🌸', color:'#e8768f' },
    { id:'night',  name:'🌙', color:'#9b23ea' },
    { id:'day',    name:'☀️', color:'#ff6b8a' },
    { id:'nature', name:'🍃', color:'#7cb342' },
    { id:'cyber',  name:'⚡', color:'#00f0ff' }
  ];

  let flashTimer = null;
  let currentColor = '#ff2164';

  /* ==== Цветовые утилиты ==== */
  function hexToRgb(hex){
    hex = hex.replace('#','');
    if (hex.length === 3) hex = hex.split('').map(function(c){return c+c;}).join('');
    return {
      r: parseInt(hex.substring(0,2), 16),
      g: parseInt(hex.substring(2,4), 16),
      b: parseInt(hex.substring(4,6), 16)
    };
  }
  function rgbToHex(r, g, b){
    function h(x){ x = Math.max(0, Math.min(255, Math.round(x))); return ('0'+x.toString(16)).slice(-2); }
    return '#' + h(r) + h(g) + h(b);
  }
  function rgbToHsl(r, g, b){
    r/=255; g/=255; b/=255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h, s, l = (max+min)/2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d/(2-max-min) : d/(max+min);
      switch(max){
        case r: h = (g-b)/d + (g<b?6:0); break;
        case g: h = (b-r)/d + 2; break;
        default: h = (r-g)/d + 4;
      }
      h /= 6;
    }
    return { h: h*360, s: s*100, l: l*100 };
  }
  function hslToRgb(h, s, l){
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
    return { r: (r+m)*255, g: (g+m)*255, b: (b+m)*255 };
  }
  function hslCss(h, s, l){ const c = hslToRgb(h, s, l); return 'rgb(' + Math.round(c.r) + ',' + Math.round(c.g) + ',' + Math.round(c.b) + ')'; }

  /* ==== Применить цвет ==== */
  function applyColor(hex, withFlash){
    currentColor = hex;
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    // Основной
    const pink = hex;
    const pinkD = rgbToHex(rgb.r * 0.7, rgb.g * 0.7, rgb.b * 0.7);
    const fireGlow = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.4)';

    // Комплементарные
    const mag = hslCss(hsl.h + 60, hsl.s, hsl.l);
    const magD = hslCss(hsl.h + 60, hsl.s, hsl.l * 0.7);
    const pur = hslCss(hsl.h + 120, hsl.s, hsl.l);
    const purD = hslCss(hsl.h + 120, hsl.s, hsl.l * 0.7);
    const blue = hslCss(hsl.h + 180, hsl.s, hsl.l);
    const blueD = hslCss(hsl.h + 180, hsl.s, hsl.l * 0.7);

    const root = document.documentElement;
    root.style.setProperty('--pink', pink);
    root.style.setProperty('--pink-d', pinkD);
    root.style.setProperty('--mag', mag);
    root.style.setProperty('--mag-d', magD);
    root.style.setProperty('--pur', pur);
    root.style.setProperty('--pur-d', purD);
    root.style.setProperty('--blue', blue);
    root.style.setProperty('--blue-d', blueD);
    root.style.setProperty('--fire-glow', fireGlow);

    // убираем класс темы — inline-стили приоритетнее
    document.body.classList.remove('theme-wine','theme-soft','theme-night','theme-day','theme-nature','theme-cyber');

    if (withFlash !== false) {
      document.body.classList.add('theme-flash');
      clearTimeout(flashTimer);
      flashTimer = setTimeout(function(){ document.body.classList.remove('theme-flash'); }, 620);
    }

    try {
      localStorage.setItem('teplo_custom_color', hex);
      localStorage.removeItem('teplo_theme');
    } catch(e){}
  }

  /* ==== UI ==== */
  function ensureStyles(){
    if (document.getElementById('cpStyles')) return;
    const st = document.createElement('style');
    st.id = 'cpStyles';
    st.textContent = 
      '.cp-presets{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:20px}' +
      '.cp-preset{aspect-ratio:1;border-radius:12px;border:2px solid transparent;cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center;transition:all .2s ease;padding:0;font-family:inherit}' +
      '.cp-preset:active{transform:scale(.9)}' +
      '.cp-preset.active{border-color:#fff;transform:scale(1.08);box-shadow:0 4px 14px rgba(0,0,0,.4)}' +
      '.cp-preview{width:80px;height:80px;border-radius:50%;margin:0 auto 20px;box-shadow:0 8px 30px rgba(0,0,0,.5),inset 0 2px 4px rgba(255,255,255,.25);transition:background .3s ease}' +
      '.cp-row{margin-bottom:14px}' +
      '.cp-label{display:flex;justify-content:space-between;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--dim,#5f5f68);font-family:\'Roboto Mono\',monospace;margin-bottom:6px}' +
      '.cp-num{color:var(--pink,#ff2164);font-weight:900}' +
      '.cp-slider{width:100%;height:8px;border-radius:4px;-webkit-appearance:none;appearance:none;outline:none;cursor:pointer}' +
      '.cp-slider.r{background:linear-gradient(90deg,#000,#f00)}' +
      '.cp-slider.g{background:linear-gradient(90deg,#000,#0f0)}' +
      '.cp-slider.b{background:linear-gradient(90deg,#000,#00f)}' +
      '.cp-slider::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:#fff;border:2px solid rgba(0,0,0,.3);box-shadow:0 2px 8px rgba(0,0,0,.4);cursor:pointer}' +
      '.cp-slider::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#fff;border:2px solid rgba(0,0,0,.3);cursor:pointer}';
    document.head.appendChild(st);
  }

  function ensureModal(){
    ensureStyles();
    if (document.getElementById('themeModal')) return;
    const wrap = document.createElement('div');
    wrap.className = 'modal-bg';
    wrap.id = 'themeModal';
    wrap.innerHTML = 
      '<div class="modal" style="max-width:420px">' +
        '<div style="text-align:center;font-size:18px;font-weight:900;color:var(--pink);margin-bottom:4px">🎨 Цвет приложения</div>' +
        '<div style="text-align:center;font-size:11px;color:var(--dim);font-family:\'Roboto Mono\',monospace;margin-bottom:18px">пресеты или свой RGB</div>' +
        '<div class="cp-presets" id="cpPresets"></div>' +
        '<div class="cp-preview" id="cpPreview"></div>' +
        '<div class="cp-row"><div class="cp-label"><span>R · красный</span><span class="cp-num" id="cpValR">255</span></div><input type="range" min="0" max="255" value="33" class="cp-slider r" id="cpR"></div>' +
        '<div class="cp-row"><div class="cp-label"><span>G · зелёный</span><span class="cp-num" id="cpValG">33</span></div><input type="range" min="0" max="255" value="33" class="cp-slider g" id="cpG"></div>' +
        '<div class="cp-row"><div class="cp-label"><span>B · синий</span><span class="cp-num" id="cpValB">100</span></div><input type="range" min="0" max="255" value="100" class="cp-slider b" id="cpB"></div>' +
        '<div class="modal-btns"><button class="btn-cancel" onclick="closeThemePicker()">Закрыть</button><button class="btn-ok" onclick="applyCustomFromSliders()">Применить</button></div>' +
      '</div>';
    document.body.appendChild(wrap);
    wrap.addEventListener('click', function(e){ if (e.target.id === 'themeModal') window.closeThemePicker(); });

    ['cpR','cpG','cpB'].forEach(function(id){
      document.getElementById(id).addEventListener('input', updatePreview);
    });
  }

  function updatePreview(){
    const r = parseInt(document.getElementById('cpR').value, 10);
    const g = parseInt(document.getElementById('cpG').value, 10);
    const b = parseInt(document.getElementById('cpB').value, 10);
    document.getElementById('cpValR').textContent = r;
    document.getElementById('cpValG').textContent = g;
    document.getElementById('cpValB').textContent = b;
    document.getElementById('cpPreview').style.background = 'rgb(' + r + ',' + g + ',' + b + ')';
    if (window._cpThrottle) clearTimeout(window._cpThrottle);
    window._cpThrottle = setTimeout(function(){ applyColor(rgbToHex(r, g, b), false); }, 30);
  }

  window.applyCustomFromSliders = function(){
    const r = parseInt(document.getElementById('cpR').value, 10);
    const g = parseInt(document.getElementById('cpG').value, 10);
    const b = parseInt(document.getElementById('cpB').value, 10);
    applyColor(rgbToHex(r, g, b));
    window.closeThemePicker();
  };

  window.openThemePicker = function(){
    ensureModal();
    const g = document.getElementById('cpPresets');
    g.innerHTML = '';
    PRESETS.forEach(function(p){
      const b = document.createElement('button');
      b.className = 'cp-preset' + (p.color.toLowerCase() === currentColor.toLowerCase() ? ' active' : '');
      b.style.background = p.color;
      b.textContent = p.name;
      b.onclick = function(){
        applyColor(p.color);
        // обновить превью
        const rgb = hexToRgb(p.color);
        document.getElementById('cpR').value = rgb.r;
        document.getElementById('cpG').value = rgb.g;
        document.getElementById('cpB').value = rgb.b;
        updatePreview();
        g.querySelectorAll('.cp-preset').forEach(function(el){ el.classList.remove('active'); });
        b.classList.add('active');
      };
      g.appendChild(b);
    });
    // загрузить текущий цвет в слайдеры
    const cur = hexToRgb(currentColor);
    document.getElementById('cpR').value = cur.r;
    document.getElementById('cpG').value = cur.g;
    document.getElementById('cpB').value = cur.b;
    updatePreview();
    document.getElementById('themeModal').classList.add('show');
  };

  window.closeThemePicker = function(){
    const m = document.getElementById('themeModal');
    if (m) m.classList.remove('show');
  };

  // инициализация — если сохранён свой цвет, применяем его; иначе wine
  const saved = localStorage.getItem('teplo_custom_color');
  if (saved) applyColor(saved, false);
  else applyColor('#ff2164', false);
})();
