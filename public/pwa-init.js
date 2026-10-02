if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(()=>{});
  });
}

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallBtn();
});

function showInstallBtn() {
  if (document.getElementById('pwa-btn')) return;
  const wrap = document.createElement('div');
  wrap.id = 'pwa-btn';
  wrap.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:linear-gradient(145deg,#ff2164,#fb3dff);color:#fff;padding:14px 20px;border-radius:14px;box-shadow:0 10px 30px rgba(255,33,100,.5);font-family:Lato,system-ui,sans-serif;font-size:14px;font-weight:700;z-index:9999;display:flex;align-items:center;gap:10px;max-width:calc(100vw - 40px);cursor:pointer';
  wrap.innerHTML = '<span style="font-size:20px">📱</span><span>Установить приложение</span>';
  wrap.onclick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const r = await deferredPrompt.userChoice;
    if (r.outcome === 'accepted') wrap.remove();
    deferredPrompt = null;
  };
  document.body.appendChild(wrap);
}

setTimeout(() => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.navigator.standalone === true ||
                       window.matchMedia('(display-mode: standalone)').matches;
  if (isIOS && !isStandalone && !localStorage.getItem('pwa_hint')) {
    const hint = document.createElement('div');
    hint.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#fff;color:#0a0a0a;padding:16px 20px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.5);font-family:system-ui,sans-serif;font-size:13px;z-index:9999;max-width:calc(100vw - 40px);line-height:1.5';
    hint.innerHTML = 'Установи приложение: нажми <b>Поделиться</b> ⎙ → <b>«На экран Домой»</b> <button style="margin-left:12px;padding:6px 12px;background:#010003;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer" onclick="this.parentElement.remove();localStorage.setItem(\'pwa_hint\',\'1\')">ОК</button>';
    document.body.appendChild(hint);
  }
}, 4000);
