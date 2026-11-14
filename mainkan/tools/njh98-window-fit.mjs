/* NJH98 window-fit check (gate). Opens every Mainkan window (step 1 + step 2) at
 * desktop 1024x576, 1280x800 and phone 844x390, 390x844, and FAILS when a window,
 * button, tab, input or footer row is outside the viewport or cropped by its own container.
 *
 * Run (needs a static server whose root has virtual-office/ and virtual-life-asset-pipeline/):
 *   node mainkan/tools/njh98-window-fit.mjs [baseUrl] [--shots dir]
 *   default baseUrl http://localhost:8901/virtual-office/mainkan/index.html
 * Exit code 0 = clean, 1 = cropped elements (listed), 2 = could not start the game.
 * Uses "Main Tanpa Akun" (guest), never a login. playwright-core + Chrome at /usr/bin/google-chrome.
 * Rule: docs/NJH-ENGINE-LESSONS.md lesson 18 (MUST: no UI window/button/tab cropped on any screen size).
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const args = process.argv.slice(2);
const BASE = args.find(a => /^https?:/.test(a)) || 'http://localhost:8901/virtual-office/mainkan/index.html';
const si = args.indexOf('--shots'); const SHOTS = si >= 0 ? args[si + 1] : null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const SIZES = [
  { tag: 'desktop-1024x576', width: 1024, height: 576 },
  { tag: 'desktop-1280x800', width: 1280, height: 800 },
  { tag: 'phone-844x390', width: 844, height: 390, mobile: true },
  { tag: 'phone-390x844', width: 390, height: 844, mobile: true },
];
// Each opener runs in the Mainkan page and leaves one window open.
const OPENERS = [
  ['status', `document.getElementById('njhDockStatus')?.click()`],
  ['bag', `document.getElementById('gameBag')?.click()`],
  ['nokia', `[...document.querySelectorAll('#njhDock button')].find(b=>/nokia/i.test(b.textContent))?.click()`],
  ['map', `NJH98Mock.openMap()`],
  ['quest', `NJH98Mock.openQuest({npc:{name:'Warga',x:NJH98.playerPos()?.x||0,z:NJH98.playerPos()?.z||0}})`],
  ['report', `NJH98Mock.endDay()`],
  ['slots', `NJH98Mock.openSlots('save')`],
  ['settings', `NJH98Mock.openSettings()`],
  ['credits', `NJH98Mock.openCredits()`],
  ['howto', `NJH98.openHowto()`],
  ['kost', `NJH98Mock.enterDoor({id:'kost'})`],
  ['notice', `NJH98.notice('Info','Pesan uji tata letak jendela.')`],
  ['s2-cook', `NJH98Step2.openCook()`],
  ['s2-fridge', `NJH98Step2.openStorage('fridge')`],
  ['s2-storage', `NJH98Step2.openStorage('storage')`],
  ['s2-shop', `NJH98Step2.openShop()`],
  ['s2-fish', `NJH98Step2.openFish()`],
  ['s2-token', `NJH98Step2.openToken()`],
  ['pause', `document.getElementById('pauseButton')?.click()`],
  ['actbar', `document.getElementById('gameAction')?.click()`],
];

function measure() {
  const VW = innerWidth, VH = innerHeight, T = 1.5, out = [];
  const name = el => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; const c = (typeof el.className === 'string' ? el.className : '').trim().split(/\s+/).filter(Boolean).slice(0, 2); if (c.length) s += '.' + c.join('.'); const t = (el.textContent || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 24); return s + (t ? ' "' + t + '"' : ''); };
  const vis = el => el.checkVisibility ? el.checkVisibility({ visibilityProperty: true }) : el.getClientRects().length > 0;
  const wins = [...document.querySelectorAll('.njh-win,.njh-hud>.w98,#njhNotice,#pauseScreen .njh-pause,#njhActBar,#loginScreen,#characterScreen,.njh-rotate .w98')].filter(w => !w.hidden && vis(w) && w.getBoundingClientRect().width > 1);
  for (const w of wins) {
    const wr = w.getBoundingClientRect(), wn = name(w).split(' "')[0];
    if (wr.left < -T || wr.top < -T || wr.right > VW + T || wr.bottom > VH + T) out.push({ win: wn, el: wn, why: `window outside viewport ${Math.round(wr.left)},${Math.round(wr.top)},${Math.round(wr.right)},${Math.round(wr.bottom)} vs ${VW}x${VH}` });
    const els = [...w.querySelectorAll('button,[role=tab],input,select,textarea,.njh-tabs,.w98-title,.njh-row,.btn')].filter(vis);
    for (const el of els) {
      const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
      if (r.left < -T || r.right > VW + T || r.top < -T || r.bottom > VH + T) {
        // vertically scrolled out of a scroll box is fine; horizontally never.
        let scrolledY = false; for (let a = el.parentElement; a && a !== w.parentElement; a = a.parentElement) { const cs = getComputedStyle(a); if (/auto|scroll/.test(cs.overflowY) && a.scrollHeight > a.clientHeight + 1) { scrolledY = true; break; } }
        if (r.left < -T || r.right > VW + T || !scrolledY) { out.push({ win: wn, el: name(el), why: 'outside viewport' }); continue; }
      }
      for (let a = el.parentElement; a && a !== w.parentElement; a = a.parentElement) {
        const cs = getComputedStyle(a); if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
        const ar = a.getBoundingClientRect();
        const hScroll = /auto|scroll/.test(cs.overflowX), vScroll = /auto|scroll/.test(cs.overflowY);
        const outX = r.left < ar.left - T || r.right > ar.right + T, outY = r.top < ar.top - T || r.bottom > ar.bottom + T;
        if (outX && !(hScroll && a.matches('.njh-tabs'))) { out.push({ win: wn, el: name(el), why: 'cropped horizontally by ' + name(a).split(' "')[0] }); break; }
        if (outY && !vScroll) { out.push({ win: wn, el: name(el), why: 'cropped vertically by ' + name(a).split(' "')[0] }); break; }
      }
    }
    for (const a of [w, ...w.querySelectorAll('*')]) {
      if (!vis(a)) continue; const cs = getComputedStyle(a);
      if (a.scrollWidth > a.clientWidth + 1 && a.clientWidth > 0 && cs.overflowX !== 'visible' && cs.textOverflow !== 'ellipsis' && !a.matches('.njh-tabs,canvas,input,select,textarea') && a.querySelector('button,[role=tab],input,select,.btn'))
        out.push({ win: wn, el: name(a).split(' "')[0], why: `content wider than box ${a.scrollWidth}>${a.clientWidth}` });
    }
    // footer: a close/OK row must be on screen without scrolling
    const foot = [...w.querySelectorAll('[data-close]')].filter(vis).pop();
    if (foot) { const r = foot.getBoundingClientRect(); if (r.bottom > Math.min(VH, wr.bottom) + T || r.right > Math.min(VW, wr.right) + T || r.top < wr.top - T) out.push({ win: wn, el: name(foot), why: 'footer/close button not fully visible' }); }
  }
  return { open: wins.map(w => name(w).split(' "')[0]), flags: out };
}
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
let failures = 0, startErr = 0; const report = [];
for (const sz of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: sz.width, height: sz.height }, isMobile: !!sz.mobile, hasTouch: !!sz.mobile });
  const p = await ctx.newPage();
  try {
    await p.goto(BASE + (BASE.includes('?') ? '&' : '?') + 'cb=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 60000 });
    for (let i = 0; i < 40; i++) { if (await p.locator('#welcomeGuest').isVisible().catch(() => false)) break; const s = p.locator('#skipSplash'); if (await s.isVisible().catch(() => false)) await s.click().catch(() => {}); await p.waitForTimeout(400); }
    // login screen (welcomeContinue), then back and use Main Tanpa Akun
    if (await p.locator('#welcomeContinue').isVisible().catch(() => false)) {
      await p.locator('#welcomeContinue').click();
      await p.locator('#loginScreen').waitFor({ state: 'visible', timeout: 15000 });
      const loginM = await p.evaluate(measure);
      for (const f of loginM.flags) { failures++; console.log(`FAIL [${sz.tag}] login: ${f.el} — ${f.why}`); }
      report.push({ size: sz.tag, window: 'login', open: loginM.open, flags: loginM.flags.length });
      if (SHOTS) await p.screenshot({ path: `${SHOTS}/${sz.tag}-login.png` });
      const back = p.locator('#njhLoginBack');
      if (await back.isVisible().catch(() => false)) await back.click();
      else await p.locator('#welcomeGuest').click().catch(() => {});
      await p.waitForTimeout(300);
    }
    await p.locator('#welcomeGuest').click();
    await p.locator('#characterScreen').waitFor({ state: 'visible', timeout: 20000 });
    const charM = await p.evaluate(measure);
    for (const f of charM.flags) { failures++; console.log(`FAIL [${sz.tag}] character: ${f.el} — ${f.why}`); }
    report.push({ size: sz.tag, window: 'character', open: charM.open, flags: charM.flags.length });
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/${sz.tag}-character.png` });
    await p.locator('#playerName').fill('FitTes'); await p.locator('#ccDay').fill('15'); await p.locator('#ccMonth').fill('01'); await p.locator('#ccYear').fill('1990');
    await p.locator('#ccCreate').click(); await p.locator('#confirmScreen').waitFor({ state: 'visible', timeout: 20000 }); await p.locator('#confirmGo').click();
    for (let i = 0; i < 20; i++) { for (const s of ['#tutorialSkip', '#tutorialDone', '#njhHowtoWinSkip']) { const l = p.locator(s); if (await l.isVisible().catch(() => false)) await l.click().catch(() => {}); } if (await p.locator('#gameScreen').isVisible().catch(() => false)) break; await p.waitForTimeout(400); }
    await p.waitForFunction(() => { try { const w = document.getElementById('semestaFrame')?.contentWindow; return !!(w && w.SemestaLifePlay && w.SemestaLifePlay.state?.()); } catch { return false; } }, { timeout: 90000 });
    await p.waitForTimeout(2500);
  } catch (e) { console.log(`[${sz.tag}] could not start the game: ${String(e).slice(0, 160)}`); startErr++; await ctx.close(); continue; }
  for (const [id, js] of OPENERS) {
    await p.evaluate(() => { try { NJH98.closeWindows(); document.querySelectorAll('.njh-win').forEach(w => w.hidden = true); } catch {} });
    const err = await p.evaluate(js => { try { (0, eval)(js); return null; } catch (e) { return String(e).slice(0, 120); } }, js);
    await p.waitForTimeout(350);
    const m = await p.evaluate(measure);
    if (err || !m.open.length) { report.push({ size: sz.tag, window: id, note: err || 'no window opened' }); continue; }
    for (const f of m.flags) { failures++; console.log(`FAIL [${sz.tag}] ${id}: ${f.el} — ${f.why}`); }
    report.push({ size: sz.tag, window: id, open: m.open, flags: m.flags.length });
    if (process.env.AUDIT && id.startsWith('s2-')) {
      await p.addScriptTag({ path: new URL('./njh98-audit.js', import.meta.url).pathname }).catch(() => {});
      const a = await p.evaluate(() => { try { const r = NJH98Audit.run(); return r.flags.filter(f => /njhCook|njhStore|njhShop2|njhFish|njhTokenWin/.test(f.el)).map(f => f.kind + ' ' + f.el + ' ' + (f.detail || '')); } catch (e) { return ['audit error ' + e]; } });
      for (const f of a) console.log(`audit [${sz.tag}] ${id}: ${f}`);
    }
    if (id === 'pause') await p.evaluate(() => { try { document.getElementById('resumeGame')?.click(); } catch {} });
    if (SHOTS && /s2-shop|s2-cook|s2-fridge|kost|status|bag|pause|actbar|nokia/.test(id)) await p.screenshot({ path: `${SHOTS}/${sz.tag}-${id}.png` });
  }
  await ctx.close();

}
await browser.close();
const notOpened = report.filter(r => r.note);
for (const r of notOpened) console.log(`note [${r.size}] ${r.window}: ${r.note}`);
console.log(`njh98-window-fit: ${report.filter(r => !r.note).length} window checks, ${failures} cropped element(s), ${startErr} start error(s)`);
process.exit(startErr ? 2 : failures ? 1 : 0);
