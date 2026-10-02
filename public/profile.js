(function(){
  const $ = function(id){ return document.getElementById(id); };
  const LS = 'teplo_token_v1';
  const EMOJI = ['🦊','🐱','🐶','🐰','🐼','🦁','🐯','🐻','🐨','🐮','🐷','🐸','🐵','🦄','🐉','🌸','🌹','🌷','🌻','🌼','💐','⭐','🌟','✨','💫','💖','💕','💗','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🥰','😍','😘','😊','😎','🤗','☀️','🌙','💋','🎁','🍕','☕','🍰','🌹','🐶'];
  const COLORS = ['pink','mag','pur','blue','dark'];

  let profile = { name:'', emoji:'🦊', buttons:[] };
  let editingId = null;
  let editEmoji = '💋';
  let editColor = 'pink';

  function getToken(){ return localStorage.getItem(LS); }
  function esc(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

  async function loadProfile(){
    const t = getToken();
    if (!t) return;
    try {
      const r = await fetch('/api/profile?token=' + encodeURIComponent(t));
      const d = await r.json();
      if (d && d.name) profile = d;
    } catch(e){}
    applyHeader();
    renderCustom();
  }

  function applyHeader(){
    if ($('meE')) $('meE').textContent = profile.emoji;
    if ($('meN')) $('meN').textContent = profile.name;
  }

  function renderCustom(){
    const grid = document.querySelector('.actions');
    if (!grid) return;
    grid.querySelectorAll('.act.custom').forEach(el=>el.remove());
    profile.buttons.forEach(b=>{
      const btn = document.createElement('button');
      btn.className = 'act custom ' + (b.color || 'pink');
      btn.innerHTML = '<span class="ic">'+b.emoji+'</span><span class="lbl">'+esc(b.label)+'</span><span class="hint">custom</span>';
      btn.onclick = function(){ window.send(b.message); };
      grid.insertBefore(btn, grid.firstChild);
    });
  }

  function ensureSettings(){
    if ($('profileModal')) return;
    const w = document.createElement('div');
    w.className = 'modal-bg settings-modal'; w.id = 'profileModal';
    w.innerHTML =
      '<div class="modal">' +
        '<div class="profile-modal-title">⚙️ Настройки профиля</div>' +
        '<div class="profile-modal-sub">имя, emoji и свои кнопки</div>' +
        '<div class="profile-label">Твой emoji</div>' +
        '<div class="emoji-grid" id="emojiGrid"></div>' +
        '<div class="profile-label">Твоё имя</div>' +
        '<input class="profile-input" id="nameInput" maxlength="30" placeholder="Как тебя звать?" autocomplete="off">' +
        '<div class="profile-label">Твои кнопки</div>' +
        '<div class="buttons-list" id="buttonsList"></div>' +
        '<button class="btn-add" id="btnAddCustom">+ Добавить кнопку</button>' +
        '<div class="modal-btns" style="margin-top:18px">' +
          '<button class="btn-cancel" id="profCancel">Отмена</button>' +
          '<button class="btn-ok" id="profSave">Сохранить</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(w);
    w.addEventListener('click', e=>{ if (e.target.id === 'profileModal') closeProfile(); });
    $('btnAddCustom').onclick = openEditor;
    $('profCancel').onclick = closeProfile;
    $('profSave').onclick = saveProfile;
  }

  function renderEmoji(){
    const g = $('emojiGrid'); if (!g) return;
    g.innerHTML = '';
    EMOJI.forEach(em=>{
      const b = document.createElement('button');
      b.className = 'emoji-pick' + (em === profile.emoji ? ' active' : '');
      b.textContent = em;
      b.onclick = ()=>{ profile.emoji = em; renderEmoji(); };
      g.appendChild(b);
    });
  }

  function renderBtns(){
    const l = $('buttonsList'); if (!l) return;
    l.innerHTML = '';
    if (!profile.buttons.length) {
      l.innerHTML = '<div style="text-align:center;color:var(--dim);font-size:12px;padding:12px">Пока пусто. Добавь первую кнопку!</div>';
      return;
    }
    profile.buttons.forEach(b=>{
      const el = document.createElement('div');
      el.className = 'btn-item';
      el.innerHTML =
        '<span class="bi-em">'+b.emoji+'</span>' +
        '<div class="bi-info">' +
          '<div class="bi-label">'+esc(b.label)+'</div>' +
          '<div class="bi-msg">'+esc(b.message)+'</div>' +
        '</div>' +
        '<button class="bi-del">✕</button>';
      el.querySelector('.bi-del').onclick = ()=>{
        profile.buttons = profile.buttons.filter(x=>x.id !== b.id);
        renderBtns();
      };
      l.appendChild(el);
    });
  }

  function ensureEditor(){
    if ($('btnEditor')) return;
    const w = document.createElement('div');
    w.className = 'modal-bg'; w.id = 'btnEditor';
    w.style.zIndex = '6000';
    w.innerHTML =
      '<div class="modal" style="max-width:420px">' +
        '<div class="profile-modal-title" id="edTitle">Новая кнопка</div>' +
        '<div class="profile-modal-sub">emoji, название, что отправить</div>' +
        '<div class="profile-label">Emoji</div>' +
        '<div class="emoji-grid" id="edEmojiGrid"></div>' +
        '<div class="profile-label">Название кнопки</div>' +
        '<input class="profile-input" id="edLabel" maxlength="20" placeholder="Поцелуй">' +
        '<div class="profile-label">Что отправится партнёру?</div>' +
        '<input class="profile-input" id="edMsg" maxlength="200" placeholder="💋 *чмок*">' +
        '<div class="profile-label">Цвет кнопки</div>' +
        '<div class="color-row" id="edColors"></div>' +
        '<div class="modal-btns" style="margin-top:18px">' +
          '<button class="btn-cancel" id="edCancel">Отмена</button>' +
          '<button class="btn-ok" id="edSave">Сохранить</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(w);
    w.addEventListener('click', e=>{ if (e.target.id === 'btnEditor') closeEditor(); });
    $('edCancel').onclick = closeEditor;
    $('edSave').onclick = saveEditor;
  }

  function renderEditorEmoji(){
    const g = $('edEmojiGrid'); if (!g) return;
    g.innerHTML = '';
    EMOJI.forEach(em=>{
      const b = document.createElement('button');
      b.className = 'emoji-pick' + (em === editEmoji ? ' active' : '');
      b.textContent = em;
      b.onclick = ()=>{ editEmoji = em; renderEditorEmoji(); };
      g.appendChild(b);
    });
  }

  function renderEditorColors(){
    const c = $('edColors'); if (!c) return;
    c.innerHTML = '';
    COLORS.forEach(col=>{
      const b = document.createElement('button');
      b.className = 'color-pick ' + col + (col === editColor ? ' active' : '');
      b.onclick = ()=>{ editColor = col; renderEditorColors(); };
      c.appendChild(b);
    });
  }

  function openEditor(){
    ensureEditor();
    editingId = null;
    editEmoji = '💋';
    editColor = 'pink';
    $('edTitle').textContent = 'Новая кнопка';
    $('edLabel').value = '';
    $('edMsg').value = '';
    renderEditorEmoji();
    renderEditorColors();
    $('btnEditor').classList.add('show');
    setTimeout(()=>$('edLabel').focus(), 300);
  }

  function closeEditor(){
    const w = $('btnEditor');
    if (w) w.classList.remove('show');
  }

  function saveEditor(){
    const label = ($('edLabel').value || '').trim();
    const message = ($('edMsg').value || '').trim();
    if (!label) { if (window.toastShow) window.toastShow('Придумай название', true); return; }
    if (!message) { if (window.toastShow) window.toastShow('Напиши текст сообщения', true); return; }
    if (profile.buttons.length >= 8 && !editingId) {
      if (window.toastShow) window.toastShow('Максимум 8 кнопок', true);
      return;
    }
    profile.buttons.push({
      id: 'btn_' + Date.now(),
      emoji: editEmoji,
      label: label.slice(0,20),
      message: message.slice(0,200),
      color: editColor
    });
    renderBtns();
    closeEditor();
  }

  window.profileOpen = function(){
    ensureSettings();
    $('nameInput').value = profile.name || '';
    renderEmoji();
    renderBtns();
    $('profileModal').classList.add('show');
  };

  function closeProfile(){
    const m = $('profileModal');
    if (m) m.classList.remove('show');
  }

  async function saveProfile(){
    const t = getToken();
    if (!t) return;
    const nn = ($('nameInput').value || '').trim();
    if (nn) profile.name = nn;
    try {
      if (window.toastShow) window.toastShow('Сохраняю...');
      const r = await fetch('/api/profile', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          token: t,
          name: profile.name,
          emoji: profile.emoji,
          buttons: profile.buttons
        })
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'Ошибка');
      applyHeader();
      renderCustom();
      closeProfile();
      if (window.toastShow) window.toastShow('✅ Сохранено', false, '💾');
    } catch(e){
      if (window.toastShow) window.toastShow('❌ ' + e.message, true);
    }
  }

  function injectBtn(){
    const header = document.querySelector('.header');
    if (!header || $('settingsBtn')) return;
    const b = document.createElement('button');
    b.className = 'theme-btn';
    b.id = 'settingsBtn';
    b.title = 'Настройки профиля';
    b.textContent = '⚙️';
    b.style.marginLeft = '8px';
    b.style.marginRight = '0';
    b.onclick = window.profileOpen;
    const me = header.querySelector('.me');
    if (me && me.parentNode) me.parentNode.insertBefore(b, me);
    else header.appendChild(b);
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    injectBtn();
    loadProfile();
  });
})();
