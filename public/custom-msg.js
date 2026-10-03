(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  function getToken(){ return localStorage.getItem('teplo_token_v1'); }

  function buildModal(){
    if ($('cmModalBg')) return;
    const bg = document.createElement('div');
    bg.className = 'cm-modal-bg';
    bg.id = 'cmModalBg';
    bg.innerHTML =
      '<div class="cm-modal">' +
        '<div class="cm-title">✍️ Личное сообщение</div>' +
        '<div class="cm-sub">напиши, что хочется</div>' +
        '<div class="cm-to" id="cmTo">Кому: <b>—</b></div>' +
        '<textarea class="cm-textarea" id="cmText" maxlength="500" placeholder="Твоё сообщение..."></textarea>' +
        '<div class="cm-counter" id="cmCount">0 / 500</div>' +
        '<div class="cm-btns">' +
          '<button class="cm-cancel" onclick="cmClose()">Отмена</button>' +
          '<button class="cm-ok" id="cmSend">📤 Отправить</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bg);
    bg.addEventListener('click', e => { if (e.target.id === 'cmModalBg') window.cmClose(); });

    const ta = $('cmText');
    ta.addEventListener('input', () => {
      $('cmCount').textContent = ta.value.length + ' / 500';
    });
    $('cmSend').addEventListener('click', send);
  }

  window.cmOpen = function(){
    if (typeof recipient === 'undefined' || !recipient) {
      if (window.toastShow) window.toastShow('Выбери получателя', true);
      return;
    }
    if (!recipient.ready) {
      if (window.toastShow) window.toastShow(recipient.name + ' не подключён', true);
      return;
    }
    buildModal();
    $('cmTo').innerHTML = 'Кому: <b>' + recipient.emoji + ' ' + recipient.name + '</b>';
    $('cmText').value = '';
    $('cmCount').textContent = '0 / 500';
    $('cmModalBg').classList.add('show');
    setTimeout(() => $('cmText').focus(), 250);
  };

  window.cmClose = function(){
    const m = $('cmModalBg');
    if (m) m.classList.remove('show');
  };

  async function send(){
    const t = getToken();
    const text = ($('cmText').value || '').trim();
    if (!text) { if (window.toastShow) window.toastShow('Напиши сообщение', true); return; }

    const btn = $('cmSend');
    btn.disabled = true;
    btn.textContent = 'Отправляю...';

    try {
      const r = await fetch('/api/send-love', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ token: t, to: recipient.id, message: text })
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'Ошибка');

      if (window.toastShow) window.toastShow('✍️ Отправлено ' + recipient.name, false, '💌');
      if (window.sparks) window.sparks(window.innerWidth/2, window.innerHeight/2);
      if (window.addHist) {
        window.addHist({
          icon: '✍️',
          text: 'Ты → <b>' + recipient.name + '</b>: ' + text.slice(0, 40),
          time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        });
      }
      window.cmClose();
    } catch(e) {
      if (window.toastShow) window.toastShow('❌ ' + e.message, true);
      btn.disabled = false;
      btn.textContent = '📤 Отправить';
    }
  }

  function addButton(){
    const grid = document.querySelector('.actions');
    if (!grid || $('cmBtn')) return;
    const btn = document.createElement('button');
    btn.className = 'act pink';
    btn.id = 'cmBtn';
    btn.innerHTML = '<span class="ic">✍️</span><span class="lbl">Написать</span><span class="hint">personal</span>';
    btn.onclick = window.cmOpen;
    // Вставляем перед большой кнопкой «Подумал о тебе»
    const firstBig = grid.querySelector('.act.big');
    if (firstBig) grid.insertBefore(btn, firstBig);
    else grid.insertBefore(btn, grid.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(addButton, 1200));
  } else {
    setTimeout(addButton, 1200);
  }
  setTimeout(addButton, 2500);
})();
