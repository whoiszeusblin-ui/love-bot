(function(){
  const LS_KEY = 'teplo_last_seen_v';

  const css = `
    .cl-bg{position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(14px);z-index:5000;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity .4s cubic-bezier(.16,1,.3,1);pointer-events:none}
    .cl-bg.show{opacity:1;pointer-events:auto}
    .cl-modal{background:linear-gradient(145deg,var(--card,#0b0b0e),var(--bg,#010003));border:1.5px solid var(--pink,#ff2164);border-radius:22px;padding:28px 24px;max-width:420px;width:100%;box-shadow:0 30px 80px rgba(0,0,0,.7),0 0 60px var(--fire-glow,rgba(255,33,100,.3));transform:scale(.9);transition:transform .5s cubic-bezier(.34,1.56,.64,1);max-height:85vh;overflow-y:auto}
    .cl-bg.show .cl-modal{transform:scale(1)}
    .cl-emoji{font-size:52px;text-align:center;margin-bottom:8px;animation:clPop 1.6s ease-in-out infinite;display:block}
    @keyframes clPop{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
    .cl-modal h2{font-size:22px;font-weight:900;text-align:center;margin:0 0 4px;color:var(--text,#fff)}
    .cl-version{font-size:11px;text-align:center;color:var(--dim,#5f5f68);font-family:'Roboto Mono',monospace;letter-spacing:.1em;text-transform:uppercase;margin-bottom:18px}
    .cl-modal h3{font-size:15px;font-weight:900;color:var(--pink,#ff2164);margin:0 0 12px;text-align:center}
    .cl-list{list-style:none;padding:0;margin:0 0 20px}
    .cl-list li{padding:10px 14px;background:rgba(255,255,255,.05);border-radius:10px;margin-bottom:8px;font-size:13px;color:var(--text,#fff);line-height:1.4;border-left:3px solid var(--pink,#ff2164)}
    .cl-btn{width:100%;padding:14px;border:none;border-radius:12px;background:linear-gradient(145deg,var(--pink,#ff2164),var(--mag,#fb3dff));color:#fff;font-family:inherit;font-size:15px;font-weight:900;cursor:pointer;box-shadow:0 6px 0 rgba(0,0,0,.4),0 10px 24px var(--fire-glow,rgba(255,33,100,.4));transition:transform .15s ease}
    .cl-btn:active{transform:translateY(4px);box-shadow:0 2px 0 rgba(0,0,0,.4)}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // Простой хэш от строки — стабильно и без зависимостей
  function hashStr(s){
    let h = 0;
    for (let i = 0; i < s.length; i++){
      h = ((h << 5) - h) + s.charCodeAt(i);
      h = h & h;
    }
    return h.toString(36);
  }

  function showModal(data, signature){
    const bg = document.createElement('div');
    bg.className = 'cl-bg';
    let html = '<div class="cl-modal">';
    html += '<span class="cl-emoji">🎉</span>';
    html += '<h2>Что нового</h2>';
    html += '<div class="cl-version">' + data.date + '</div>';
    html += '<h3>' + data.title + '</h3>';
    html += '<ul class="cl-list">';
    data.changes.forEach(function(c){ html += '<li>' + c + '</li>'; });
    html += '</ul>';
    html += '<button class="cl-btn">Отлично!</button>';
    html += '</div>';
    bg.innerHTML = html;
    document.body.appendChild(bg);

    setTimeout(function(){ bg.classList.add('show'); }, 50);

    bg.querySelector('.cl-btn').onclick = function(){
      bg.classList.remove('show');
      setTimeout(function(){ bg.remove(); }, 400);
      try { localStorage.setItem(LS_KEY, signature); } catch(e) {}
    };
  }

  setTimeout(function(){
    fetch('/changelog.json?t=' + Date.now())
      .then(function(r){ return r.json(); })
      .then(function(data){
        const versions = data.versions || [];
        if (!versions.length) return;
        const latest = versions[0];
        const signature = hashStr(JSON.stringify(latest));
        const seen = localStorage.getItem(LS_KEY);
        if (seen === signature) return;
        showModal(latest, signature);
      })
      .catch(function(){});
  }, 2500);
})();
