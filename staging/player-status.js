(function () {
  'use strict';
  // Player Status / Notifications tabs — staging only.
  // Display the EXISTING life simulation's values; do not create a second simulation.
  if (window.__vcStatusTabsLoaded) return;
  const drawer = document.getElementById('ndrawer');
  const original = document.getElementById('dockb');
  if (!drawer || !original || !drawer.contains(original)) {
    console.warn('[player-status] original notification drawer unavailable');
    return;
  }
  window.__vcStatusTabsLoaded = true;

  const css = document.createElement('style');
  css.id = 'vc-player-status-styles';
  css.textContent = `
    #vc-status-tabs{display:grid;grid-template-columns:1fr 1fr;gap:0;margin:8px 10px 0;
      border:2px solid #141923;background:#283243;position:relative;z-index:1}
    #vc-status-tabs .vc-ps-tab{border:0;border-radius:0;padding:11px 5px;min-height:43px;
      font:700 11px/1.2 "Courier New",monospace;letter-spacing:.2px;text-align:center;
      color:#d7e0f0;background:#30394b;cursor:pointer;touch-action:manipulation}
    #vc-status-tabs .vc-ps-tab[aria-selected="true"]{color:#161b28;background:#ffe08c}
    #vc-status-tabs .vc-ps-tab + .vc-ps-tab{border-left:2px solid #141923}
    #vc-player-status{box-sizing:border-box;margin:0;padding:12px 12px 24px;overflow-y:auto;
      overscroll-behavior:contain;color:#e9eff5;font:12px/1.45 "Courier New",monospace;
      min-height:140px;max-height:min(64dvh,620px)}
    #vc-player-status[hidden]{display:none!important}
    #vc-player-status .vc-ps-title{font:700 15px/1.3 "Courier New",monospace;margin:0 0 3px;color:#ffe08c}
    #vc-player-status .vc-ps-sub{margin:0 0 13px;color:#aab8c8;font-size:10px}
    #vc-player-status .vc-ps-name{font-weight:700;color:#f4f6fc;padding:6px 8px;margin-bottom:12px;
      border:1px solid #606d7e;background:#27303d}
    #vc-player-status .vc-ps-row{margin-bottom:12px}
    #vc-player-status .vc-ps-rowhead{display:flex;justify-content:space-between;gap:8px;
      margin-bottom:5px;font-size:11px;font-weight:700}
    #vc-player-status .vc-ps-rowhead output{font-variant-numeric:tabular-nums}
    #vc-player-status .vc-ps-track{height:12px;border:1px solid #798594;
      background:#303c4d;overflow:hidden}
    #vc-player-status .vc-ps-fill{display:block;height:100%;width:0%;background:#67cfa0;
      transition:width .15s linear}
    #vc-player-status .vc-ps-row[data-kind="bladder"] .vc-ps-fill{background:#78baf5}
    #vc-player-status .vc-ps-row.is-warning .vc-ps-fill{background:#f1c66a}
    #vc-player-status .vc-ps-row.is-danger .vc-ps-fill{background:#ee737b}
    #vc-player-status .vc-ps-row p{font:10px/1.4 "Courier New",monospace;color:#aebaca;margin:4px 0 0}
    #vc-player-status .vc-ps-hint{font-size:10px;color:#ffe08c;min-height:14px;margin:9px 0}
    #vc-player-status details{border:1px solid #69798e;background:#202a39;padding:9px;margin-top:11px}
    #vc-player-status summary{color:#ffe08c;font-weight:700;cursor:pointer;touch-action:manipulation}
    #vc-player-status .vc-ps-rules{padding:8px 0 0;font-size:10px;line-height:1.55}
    #vc-player-status .vc-ps-rules p{margin:0 0 7px}
    #vc-player-status .vc-ps-foot{font-size:9px;line-height:1.6;color:#9eafbf;margin-top:12px}
    body.mob #vc-player-status{max-height:min(54dvh,460px)}
  `;
  document.head.appendChild(css);

  const tabs = document.createElement('div');
  tabs.id = 'vc-status-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Panel notifikasi dan status pemain');
  tabs.innerHTML =
    '<button type="button" class="vc-ps-tab" id="vc-tab-notifs" role="tab" ' +
    'aria-controls="dockb" aria-selected="true">🔔 Notifikasi</button>' +
    '<button type="button" class="vc-ps-tab" id="vc-tab-player" role="tab" ' +
    'aria-controls="vc-player-status" aria-selected="false">👤 Status Player</button>';
  drawer.insertBefore(tabs, original);

  const panel = document.createElement('section');
  panel.id = 'vc-player-status';
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', 'vc-tab-player');
  panel.hidden = true;
  panel.innerHTML = `
    <h3 class="vc-ps-title">STATUS PLAYER</h3>
    <p class="vc-ps-sub">Kebutuhan karakter · live selama bermain</p>
    <div class="vc-ps-name" id="vc-ps-user">Login untuk melihat status</div>
    <div id="vc-ps-meters">
      <div class="vc-ps-row" data-kind="fullness">
        <div class="vc-ps-rowhead"><span>🍚 Kenyang</span><output>— / 100</output></div>
        <div class="vc-ps-track" role="progressbar" aria-label="Kenyang" aria-valuemin="0" aria-valuemax="100"><span class="vc-ps-fill"></span></div>
        <p>Makan untuk menambah kenyang.</p>
      </div>
      <div class="vc-ps-row" data-kind="energy">
        <div class="vc-ps-rowhead"><span>💤 Energi</span><output>— / 100</output></div>
        <div class="vc-ps-track" role="progressbar" aria-label="Energi" aria-valuemin="0" aria-valuemax="100"><span class="vc-ps-fill"></span></div>
        <p>Tidur memulihkan energi.</p>
      </div>
      <div class="vc-ps-row" data-kind="hygiene">
        <div class="vc-ps-rowhead"><span>🧼 Kebersihan</span><output>— / 100</output></div>
        <div class="vc-ps-track" role="progressbar" aria-label="Kebersihan" aria-valuemin="0" aria-valuemax="100"><span class="vc-ps-fill"></span></div>
        <p>Mandi mengembalikan kebersihan.</p>
      </div>
      <div class="vc-ps-row" data-kind="bladder">
        <div class="vc-ps-rowhead"><span>🚽 Kebelet</span><output>— / 100</output></div>
        <div class="vc-ps-track" role="progressbar" aria-label="Kebelet" aria-valuemin="0" aria-valuemax="100"><span class="vc-ps-fill"></span></div>
        <p>Semakin tinggi, semakin ingin pipis.</p>
      </div>
    </div>
    <p id="vc-ps-alert" class="vc-ps-hint" role="status" aria-live="polite"></p>
    <details id="vc-ps-rules">
      <summary>📖 Aturan kebutuhan & aktivitas</summary>
      <div class="vc-ps-rules">
        <p><strong>🍚 Makan:</strong> +40 Kenyang (aksi makan masih tes).</p>
        <p><strong>💤 Tidur:</strong> +25 Energi per menit. Duduk: +2 Energi per menit.</p>
        <p><strong>🥤 Minum:</strong> +15 Kebelet (aksi minum masih tes).</p>
        <p><strong>🚿 Mandi:</strong> Kebersihan kembali ke 100 (aksi mandi masih tes).</p>
        <p><strong>🚽 WC kantor:</strong> Gunakan Action di depan toilet untuk mengosongkan Kebelet tanpa penalti Kebersihan.</p>\n        <p><strong>🚽 Pipis sembarangan:</strong> Kebelet kembali ke 0, Kebersihan -20. Muncul lewat Action dekat tembok.</p>
        <p><strong>⏱️ Saat bermain:</strong> Kenyang -10, Energi -8, Kebersihan -5, Kebelet +20 tiap 15 menit (kecuali pemulihan saat istirahat).</p>
        <p><strong>⚠️ Kebelet mencapai 100:</strong> otomatis ngompol, Kebersihan -30.</p>
      </div>
    </details>
    <p class="vc-ps-foot">LOCAL TEST · tersimpan di browser per akun · tidak bertambah/berkurang saat offline · belum disinkronkan ke multiplayer server.</p>
  `;
  original.insertAdjacentElement('afterend', panel);

  const notifTab = tabs.querySelector('#vc-tab-notifs');
  const playerTab = tabs.querySelector('#vc-tab-player');
  let selected = 'notifs';

  function sync() {
    if (selected !== 'player' || !document.body.classList.contains('nd-on')) return;
    const mp = window.__mp;
    const live = !!(mp && mp.status === 'live' && mp.me &&
      !(window.__lifeBridge && window.__lifeBridge.isSpectator &&
      window.__lifeBridge.isSpectator()));
    panel.querySelector('#vc-ps-user').textContent = live
      ? '👤 ' + String(mp.me).slice(0, 36)
      : '🔒 Login sebagai player untuk melihat kebutuhan';
    const source = document.getElementById('vclife');
    const categories = ['fullness','energy','hygiene','bladder'];
    const readings = {};
    for (const kind of categories) {
      const meter = panel.querySelector('.vc-ps-row[data-kind="' + kind + '"]');
      const src = source && source.querySelector('.life-bar.' + kind + ' .life-barlabel span:last-child');
      const raw = src ? Number.parseInt(src.textContent, 10) : NaN;
      const value = live && Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : null;
      readings[kind] = value;
      meter.querySelector('output').textContent = value === null ? '— / 100' : value + ' / 100';
      meter.querySelector('.vc-ps-fill').style.width = (value === null ? 0 : value) + '%';
      const bar = meter.querySelector('[role="progressbar"]');
      if (value === null) bar.removeAttribute('aria-valuenow');
      else bar.setAttribute('aria-valuenow', String(value));
      const danger = value !== null && (kind === 'bladder' ? value >= 90 : value <= 10);
      const warning = value !== null && (kind === 'bladder' ? value >= 70 : value <= 30);
      meter.classList.toggle('is-danger', danger);
      meter.classList.toggle('is-warning', warning && !danger);
    }
    const alert = panel.querySelector('#vc-ps-alert');
    if (!live) alert.textContent = 'Status hanya tampil setelah login.';
    else if (readings.bladder >= 90) alert.textContent = '⚠️ Kebelet banget! Cari tempat pipis.';
    else if (readings.energy <= 10) alert.textContent = '⚠️ Energi hampir habis. Coba tidur.';
    else if (readings.fullness <= 10) alert.textContent = '⚠️ Lapar! Perlu makan.';
    else if (readings.hygiene <= 10) alert.textContent = '⚠️ Karakter sangat kotor.';
    else alert.textContent = 'Status kebutuhan diperbarui otomatis.';
  }

  function showTab(which) {
    selected = which === 'player' ? 'player' : 'notifs';
    const status = selected === 'player';
    notifTab.setAttribute('aria-selected', String(!status));
    playerTab.setAttribute('aria-selected', String(status));
    notifTab.tabIndex = status ? -1 : 0;
    playerTab.tabIndex = status ? 0 : -1;
    original.style.setProperty('display', status ? 'none' : '', status ? 'important' : '');
    if (!status) original.style.removeProperty('display');
    panel.hidden = !status;
    if (status) sync();
  }
  for (const eventName of ['pointerdown','pointerup','touchstart','touchend','keydown','keyup']) {
    tabs.addEventListener(eventName, event => event.stopPropagation());
  }
  notifTab.addEventListener('click', event => { event.stopPropagation(); showTab('notifs'); });
  playerTab.addEventListener('click', event => { event.stopPropagation(); showTab('player'); });
  showTab('notifs');
  window.setInterval(sync, 1000);
  window.__vcPlayerStatusTabs = { showTab, sync };
  console.info('[player-status] tabbed notification drawer ready');
})();