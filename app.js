'use strict';

/* ---------- Speicher ---------- */

const KEY = 'finanzapp.v1';
const APP_VERSION = 9;

// [id, Icon, Name, Diagrammfarbe]
const CATS = [
  ['lebensmittel', '🛒', 'Lebensmittel', '#22c55e'], ['essen', '🍔', 'Essen & Trinken', '#f97316'], ['ausgehen', '🍸', 'Ausgehen', '#a855f7'], ['shopping', '🛍️', 'Shopping', '#ec4899'],
  ['mobilitaet', '⛽', 'Auto & Tanken', '#3b82f6'], ['freizeit', '🎮', 'Freizeit', '#06b6d4'], ['sport', '🏋️', 'Sport', '#84cc16'], ['gesundheit', '💊', 'Gesundheit', '#14b8a6'],
  ['geschenke', '🎁', 'Geschenke', '#f43f5e'], ['reisen', '✈️', 'Reisen', '#0ea5e9'], ['haushalt', '🏠', 'Haushalt', '#eab308'], ['technik', '📱', 'Technik', '#6366f1'],
  ['abos', '🔁', 'Abos & Apps', '#8b5cf6'], ['partner', '❤️', 'Dates & Partner', '#ff4d6d'], ['bildung', '📚', 'Bildung', '#10b981'],
  ['steuern', '🧾', 'Steuern', '#c084fc'], ['sonstiges', '✨', 'Sonstiges', '#94a3b8'],
];
const FIXCATS = [
  ['wohnen', '🏠', 'Wohnen', '#f97316'], ['immobilie', '🏢', 'Immobilie (vermietet)', '#fb7185'], ['versicherung', '🛡️', 'Versicherungen', '#a855f7'], ['handy', '📶', 'Handy & Internet', '#06b6d4'],
  ['abos', '🔁', 'Abos & Streaming', '#8b5cf6'], ['auto', '🚗', 'Auto', '#3b82f6'], ['kredit', '💳', 'Kredite & Raten', '#ef4444'], ['sparen', '🐷', 'Sparpläne & Vorsorge', '#22c55e'],
  ['sport', '🏋️', 'Sport & Fitness', '#84cc16'], ['beruf', '💼', 'Beruf & Büro', '#eab308'], ['sonstiges', '✨', 'Sonstiges', '#94a3b8'],
];
const ASSET_TYPES = [
  ['konto', '🏦', 'Sparkonten & Tagesgeld', '#3b82f6'], ['depot', '📈', 'Aktien & ETFs', '#22c55e'], ['versicherung', '🛡️', 'Versicherungen & Rente', '#a855f7'],
  ['gold', '🥇', 'Gold & Edelmetalle', '#eab308'], ['krypto', '🪙', 'Krypto', '#f97316'], ['bauspar', '🏗️', 'Bausparen', '#14b8a6'],
  ['immobilie', '🏢', 'Immobilien', '#fb7185'], ['bar', '💶', 'Girokonto & Bargeld', '#94a3b8'], ['sonstiges', '✨', 'Sonstiges', '#ec4899'],
  ['schulden', '📉', 'Kredite & Schulden', '#ef4444'],
];
const INTERVALS = [[1, 'monatlich'], [3, 'vierteljährlich'], [6, 'halbjährlich'], [12, 'jährlich']];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MON_S = ['Jan', 'Feb', 'März', 'Apr', 'Mai', 'Juni', 'Juli', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const WD = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

function defaultState() {
  return {
    version: 2,
    incomes: [],
    expenses: [],
    fixed: [],
    recIncomes: [],
    assets: [],
    settings: { taxPct: null, saveGoal: '', varBudget: '', startDay: 1 },
  };
}
// Version 2: Fixkosten und feste Einnahmen gelten standardmäßig für alle Monate.
// Bisher wurde automatisch der Monat der Eingabe als Start gesetzt – das wird aufgehoben.
// Bewusst gewählte frühere Startmonate (vor September 2026) bleiben erhalten.
function migrate(s) {
  if ((s.version || 1) >= 2) return;
  for (const f of (s.fixed || []).concat(s.recIncomes || [])) if (f.start && f.start >= '2026-09-01') f.start = '';
  s.version = 2;
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = Object.assign(defaultState(), JSON.parse(raw));
      s.settings = Object.assign(defaultState().settings, s.settings);
      migrate(s);
      return s;
    }
  } catch (e) { /* leerer Start */ }
  return defaultState();
}
let S = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('Speichern fehlgeschlagen – bitte Backup machen'); }
}

/* ---------- Helfer ---------- */

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const num = (v) => { const n = parseFloat(String(v ?? '').replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); return isFinite(n) ? n : 0; };
const round2 = (n) => Math.round(n * 100) / 100;
const eur = (n) => Number(n).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
const eur0 = (n) => Number(n).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const pct = (n) => Math.round(n * 100) + ' %';

function dkey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function parseD(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function today() { return dkey(new Date()); }
function niceDate(k) {
  const d = parseD(k), t = today();
  if (k === t) return 'Heute';
  if (k === dkey(addDays(new Date(), -1))) return 'Gestern';
  return WD[d.getDay()] + ', ' + d.getDate() + '. ' + MON_S[d.getMonth()];
}

/* ---------- Zeiträume (Monat ab Starttag) ---------- */

function sd() { return Math.min(28, Math.max(1, parseInt(S.settings.startDay, 10) || 1)); }
function periodOf(d) {
  const s = sd();
  return d.getDate() >= s ? new Date(d.getFullYear(), d.getMonth(), s) : new Date(d.getFullYear(), d.getMonth() - 1, s);
}
function shiftPeriod(start, n) { return new Date(start.getFullYear(), start.getMonth() + n, sd()); }
function periodEnd(start) { return shiftPeriod(start, 1); }
function periodLabel(start, short) {
  if (sd() === 1) return short ? MON_S[start.getMonth()] + (short === 2 ? ' ' + String(start.getFullYear()).slice(2) : '') : MONTHS[start.getMonth()] + ' ' + start.getFullYear();
  const e = addDays(periodEnd(start), -1);
  if (short) return MON_S[start.getMonth()] + (short === 2 ? ' ' + String(start.getFullYear()).slice(2) : '');
  return start.getDate() + '. ' + MON_S[start.getMonth()] + ' – ' + e.getDate() + '. ' + MON_S[e.getMonth()] + ' ' + e.getFullYear();
}
function inPeriod(k, start) { return k >= dkey(start) && k < dkey(periodEnd(start)); }
function curPeriod() { return periodOf(new Date()); }

/* ---------- Berechnung ---------- */

// Monatsfelder (<input type="month">) <-> interne Zeitraum-Schlüssel
function monthOfKey(k) { if (!k) return ''; const d = parseD(k); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
function keyOfMonth(m) { if (!m) return ''; const [y, mo] = m.split('-').map(Number); return y && mo ? dkey(new Date(y, mo - 1, sd())) : ''; }
function monthName(k) { const d = parseD(k); return MON_S[d.getMonth()] + ' ' + d.getFullYear(); }
function rangeText(f) {
  const parts = [];
  if (f.start) parts.push('seit ' + monthName(f.start));
  if (f.end) parts.push('bis ' + monthName(dkey(shiftPeriod(parseD(f.end), -1))));
  return parts.join(' · ');
}
function rangeFields(f) {
  const to = f.end ? monthOfKey(dkey(shiftPeriod(parseD(f.end), -1))) : '';
  return `<div class="grid2"><label class="field"><span>Gilt seit (leer = immer)</span><input class="input" id="fFrom" type="month" value="${monthOfKey(f.start)}"></label>
    <label class="field"><span>Gilt bis (optional)</span><input class="input" id="fTo" type="month" value="${to}"></label></div>
    <p class="note" style="margin:-2px 0 0">Beide Felder leer = gilt für alle Monate, auch rückwirkend. Nur ausfüllen, wenn ein Posten erst später dazukam oder weggefallen ist.</p>`;
}
function readRange() {
  const start = keyOfMonth($('#fFrom').value);
  const toKey = keyOfMonth($('#fTo').value);
  const end = toKey ? dkey(shiftPeriod(parseD(toKey), 1)) : '';
  if (start && end && end <= start) return null;
  return { start, end };
}

function fixedActive(f, start) {
  const k = dkey(start);
  return (!f.start || f.start < dkey(periodEnd(start))) && (!f.end || f.end > k);
}
function monthly(f) { return num(f.amount) / (f.interval || 1); }

function calc(start) {
  const oneOff = S.incomes.filter((i) => inPeriod(i.date, start)).reduce((a, i) => a + num(i.amount), 0);
  const rent = S.recIncomes.filter((f) => fixedActive(f, start)).reduce((a, f) => a + monthly(f), 0);
  const inc = oneOff + rent;
  const propCost = S.fixed.filter((f) => f.cat === 'immobilie' && fixedActive(f, start)).reduce((a, f) => a + monthly(f), 0);
  const exps = S.expenses.filter((e) => inPeriod(e.date, start));
  const vari = exps.reduce((a, e) => a + num(e.amount), 0);
  const fix = S.fixed.filter((f) => fixedActive(f, start)).reduce((a, f) => a + monthly(f), 0);
  const tax = oneOff * (num(S.settings.taxPct) / 100);
  const saveGoal = num(S.settings.saveGoal);
  const rest = inc - tax - fix - vari;           // was am Ende übrig bleibt (= gespart)
  const free = rest - saveGoal;                  // frei verfügbar nach Sparziel
  const budget = num(S.settings.varBudget) || Math.max(0, inc - tax - fix - saveGoal);
  return { start, inc, oneOff, rent, propCost, vari, fix, tax, saveGoal, rest, free, budget, exps, rate: inc ? rest / inc : 0 };
}
function hasData(start) {
  return S.incomes.some((i) => inPeriod(i.date, start)) || S.expenses.some((e) => inPeriod(e.date, start));
}
function avgIncome(n) {
  const cur = curPeriod();
  const vals = [];
  for (let i = 1; i <= n; i++) {
    const p = shiftPeriod(cur, -i);
    const v = S.incomes.filter((x) => inPeriod(x.date, p)).reduce((a, x) => a + num(x.amount), 0);
    if (v) vals.push(v);
  }
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}
function verdict(c) {
  if (!c.inc) return null;
  if (c.rate >= 0.3) return { em: '🏆', t: 'Richtig stark!', cls: 'good', s: `Du hast ${pct(c.rate)} deiner Einnahmen behalten.` };
  if (c.rate >= 0.15) return { em: '💪', t: 'Gut gemacht', cls: 'good', s: `${pct(c.rate)} Sparquote – solide.` };
  if (c.rate >= 0) return { em: '😐', t: 'Knapp – da geht mehr', cls: '', s: `Nur ${pct(c.rate)} übrig geblieben.` };
  return { em: '😬', t: 'Autsch', cls: 'bad', s: `${eur0(-c.rest)} mehr ausgegeben als reinkam.` };
}
function catInfo(id, fix) { return (fix ? FIXCATS : CATS).find((c) => c[0] === id) || ['sonstiges', '✨', 'Sonstiges', '#94a3b8']; }
function assetType(id) { return ASSET_TYPES.find((t) => t[0] === id) || ASSET_TYPES[8]; }
function catTotals(exps) {
  const m = {};
  for (const e of exps) m[e.cat] = (m[e.cat] || 0) + num(e.amount);
  return Object.entries(m).map(([id, v]) => ({ id, v })).sort((a, b) => b.v - a.v);
}

/* ---------- UI-Zustand ---------- */

const ui = { view: 'uebersicht', period: curPeriod(), expCat: 'alle', withProp: false };
let sheetCtx = null;

function render() {
  $('#view').innerHTML = VIEWS[ui.view]();
  document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.v === ui.view));
}
const VIEWS = {};

function periodNav() {
  const isCur = dkey(ui.period) === dkey(curPeriod());
  return `<div class="weeknav">
    <button class="icon-btn" data-a="pnav" data-n="-1" aria-label="Vorheriger Monat" style="font-size:22px">‹</button>
    <div class="mid"><b>${periodLabel(ui.period)}</b><span class="sub">${isCur ? 'aktueller Monat' : `<button class="link" data-a="pnav" data-n="0">Zum aktuellen Monat</button>`}</span></div>
    <button class="icon-btn" data-a="pnav" data-n="1" aria-label="Nächster Monat" style="font-size:22px">›</button></div>`;
}

/* ---------- Übersicht ---------- */

VIEWS.uebersicht = () => {
  const c = calc(ui.period);
  const isCur = dkey(ui.period) === dkey(curPeriod());
  const fresh = !S.incomes.length && !S.fixed.length && !S.expenses.length && !S.assets.length && !S.recIncomes.length;
  const gear = `<button class="gear" data-a="settings" aria-label="Einstellungen"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></button>`;
  let html = `<div class="row spread"><h1>Finanzen</h1>${gear}</div>`;

  if (fresh) {
    return html + `<div class="card hero" style="margin-top:14px"><div class="sub">Willkommen 👋</div>
      <h2 style="margin:6px 0 10px">So startest du</h2>
      <div class="stack">
        <div class="row"><b class="num">1</b><span class="grow">Leg im Zahnrad oben fest, wie viel Prozent du für <b>Steuern</b> zurücklegst.</span></div>
        <div class="row"><b class="num">2</b><span class="grow">Trag unter <b>Fixkosten</b> alles ein, was regelmäßig abgeht.</span></div>
        <div class="row"><b class="num">3</b><span class="grow">Trag unter <b>Einnahmen</b> deine Provision ein, sobald sie da ist.</span></div>
        <div class="row"><b class="num">4</b><span class="grow">Jede Ausgabe sofort mit dem <b>+</b> unten rechts eintragen – auch den Kaffee.</span></div>
      </div>
      <div class="row" style="margin-top:16px"><button class="btn primary grow" data-a="settings">Los geht's</button><button class="btn grow" data-a="go" data-v="fixkosten">Fixkosten</button></div></div>`;
  }

  html += periodNav();
  const freeLabel = isCur ? 'Frei verfügbar' : 'Ergebnis';
  let sub = '';
  if (isCur && c.inc) {
    const daysLeft = Math.max(1, Math.round((periodEnd(ui.period) - parseD(today())) / 864e5));
    sub = c.free > 0 ? `≈ <b>${eur(c.free / daysLeft)}</b> pro Tag · noch ${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tage'}` : `Du liegst ${eur(-c.free)} drüber`;
  } else if (!isCur && c.inc) {
    sub = c.rest >= 0 ? `${eur(c.rest)} behalten (${pct(c.rate)})` : `${eur(-c.rest)} im Minus`;
  }
  const shown = isCur ? c.free : c.rest;
  html += `<div class="card hero"><div class="sub">${freeLabel}</div>
    <div class="hero-num ${shown < 0 ? 'neg' : ''}">${c.inc || c.vari || c.fix ? eur(shown) : '–'}</div>
    <div class="sub">${sub || (c.inc ? '' : 'Noch keine Einnahme in diesem Monat eingetragen')}</div>
    ${!c.inc ? `<button class="btn primary block" style="margin-top:14px" data-a="addIncome">${isCur ? 'Provision eintragen' : 'Einnahme eintragen'}</button>` : ''}</div>`;

  if (S.settings.taxPct === null) {
    html += `<div class="card" style="margin-top:12px"><h3>Steuerrücklage festlegen</h3>
      <p class="note" style="margin:4px 0 12px">Als Selbstständiger zahlst du deine Steuern selbst. Leg fest, wie viel Prozent jeder Einnahme die App automatisch zurücklegt.</p>
      <button class="btn sm primary" data-a="settings">Jetzt festlegen</button></div>`;
  }

  // Wasserfall
  if (c.inc || c.vari || c.fix) {
    html += `<h2>So setzt sich dein Monat zusammen</h2><div class="card">${waterfall(c)}<p class="note" style="margin:10px 0 0">Tipp: Zeile antippen, um sie zu öffnen.</p></div>`;
  }
  {
    const mine = S.incomes.filter((i) => inPeriod(i.date, ui.period)).sort((a, b) => (a.date < b.date ? 1 : -1));
    const recs = S.recIncomes.filter((f) => fixedActive(f, ui.period));
    if (mine.length || recs.length) {
      html += `<div class="row spread"><h2>Einnahmen ${isCur ? 'diesen Monat' : 'in diesem Monat'}</h2><button class="link" data-a="addIncome">+ Einnahme</button></div>
        <div class="list">${mine.map(incRow).join('')}${recs.map((f) => `<button class="item" data-a="editRec" data-id="${f.id}"><span class="ic">🏢</span><div class="grow"><div class="name">${esc(f.name)}</div><div class="meta">feste Einnahme · antippen zum Ändern</div></div><span class="amt pos">+${eur(monthly(f))}</span></button>`).join('')}</div>`;
    }
  }

  // Variable Ausgaben vs. Budget
  const ratio = c.budget ? c.vari / c.budget : 0;
  html += `<h2>Variable Ausgaben</h2><div class="card">
    <div class="row spread"><span class="big num" style="font-size:28px">${eur(c.vari)}</span><span class="sub small">${c.budget ? 'von ' + eur0(c.budget) + ' Budget' : ''}</span></div>
    ${c.budget ? `<div class="meter ${ratio > 1 ? 'over' : ratio > 0.8 ? 'warn' : ''}"><i style="width:${Math.min(100, ratio * 100)}%"></i></div>
      <div class="sub small">${ratio > 1 ? `<span class="neg">${eur(c.vari - c.budget)} über Budget</span>` : `${pct(ratio)} verbraucht · ${eur(c.budget - c.vari)} übrig`}</div>` : ''}
    ${isCur ? todayStats(c) : ''}</div>`;

  const cats = catTotals(c.exps);
  if (cats.length) {
    html += `<h2>Wofür dein Geld weg ist</h2><div class="card">${donut(cats.slice(0, 8).map((x) => ({ label: catInfo(x.id)[1] + ' ' + catInfo(x.id)[2], v: x.v, color: catInfo(x.id)[3] })), eur0(c.vari), 'ausgegeben')}</div>`;
  }
  const last = c.exps.slice().sort(byDateDesc).slice(0, 5);
  if (last.length) {
    html += `<div class="row spread"><h2>Letzte Ausgaben</h2><button class="link" data-a="go" data-v="ausgaben">Alle</button></div><div class="list">${last.map(expRow).join('')}</div>`;
  }

  if (S.assets.length && isCur) {
    const nw = netWorth();
    html += `<h2>Dein Vermögen</h2><button class="card row" style="width:100%;text-align:left;gap:14px" data-a="go" data-v="vermoegen">
      <div style="width:84px;flex:none">${donut(ASSET_TYPES.filter((t) => t[0] !== 'schulden').map((t) => ({ label: t[2], color: t[3], v: S.assets.filter((a) => a.type === t[0]).reduce((s2, a) => s2 + (assetValue(a) || 0), 0) })), '', '', { legend: false })}</div>
      <div class="grow"><div class="sub small">Nettovermögen</div><div class="big num" style="font-size:26px">${eur0(nw.net)}</div><span class="link">Details ›</span></div></button>`;
  }

  // Fazit Vormonat
  if (isCur) {
    const prev = shiftPeriod(ui.period, -1);
    if (hasData(prev)) {
      const pc = calc(prev), v = verdict(pc);
      if (v) html += `<h2>Fazit ${periodLabel(prev)}</h2><div class="card verdict ${v.cls}"><span class="em">${v.em}</span><div><h3>${v.t}</h3><div class="sub">${v.s}</div></div></div>`;
    }
  }
  return html + '<div style="height:70px"></div>';
};

function todayStats(c) {
  const t = today();
  const dToday = c.exps.filter((e) => e.date === t).reduce((a, e) => a + num(e.amount), 0);
  const wkStart = dkey(addDays(new Date(), -((new Date().getDay() + 6) % 7)));
  const dWeek = S.expenses.filter((e) => e.date >= wkStart && e.date <= t).reduce((a, e) => a + num(e.amount), 0);
  const passed = Math.max(1, Math.round((parseD(t) - c.start) / 864e5) + 1);
  const total = Math.round((periodEnd(c.start) - c.start) / 864e5);
  const forecast = c.vari / passed * total;
  return `<div class="stats" style="margin-top:14px">
    <div class="stat"><b class="num">${eur0(dToday)}</b><span>heute</span></div>
    <div class="stat"><b class="num">${eur0(dWeek)}</b><span>diese Woche</span></div>
    <div class="stat"><b class="num ${c.budget && forecast > c.budget ? 'neg' : ''}">${eur0(forecast)}</b><span>Hochrechnung Monatsende</span></div></div>`;
}

function waterfall(c) {
  const rows = [['Einnahmen', c.inc, 'in', '', 'einnahmen']];
  if (c.tax) rows.push(['Steuer', c.tax, 'out', '#a855f7', 'settings']);
  rows.push(['Fixkosten', c.fix, 'out', '#f97316', 'fixkosten']);
  if (c.saveGoal) rows.push(['Sparziel', c.saveGoal, 'out', '#14b8a6', 'settings']);
  rows.push(['Variabel', c.vari, 'out', '#3b82f6', 'ausgaben']);
  const outs = rows.slice(1).reduce((a, r) => a + r[1], 0);
  const base = Math.max(c.inc, outs, 1);
  let level = c.inc, html = '<div class="wf">';
  rows.forEach(([label, v, kind, col, target], i) => {
    let left, w;
    if (kind === 'in') { left = 0; w = v; }
    else { const from = Math.max(0, level - v); left = from; w = Math.max(0, level) - from; level -= v; }
    html += `<div class="wf-r tap" ${target === 'settings' ? 'data-a="settings"' : `data-a="go" data-v="${target}"`}><span>${kind === 'out' ? '− ' : ''}${label}</span><span class="wf-t"><span class="wf-f ${kind}" style="left:${100 * left / base}%;width:${Math.max(w ? 1.5 : 0, 100 * w / base)}%;animation-delay:${i * 90}ms${col ? ';background:' + col : ''}"></span></span><b>${eur0(v)}</b></div>`;
  });
  const f = c.free;
  html += `<div class="wf-r sum"><span>= Frei</span><span class="wf-t"><span class="wf-f rest ${f < 0 ? 'neg' : ''}" style="left:0;width:${Math.min(100, 100 * Math.abs(f) / base)}%;animation-delay:${rows.length * 90}ms"></span></span><b class="${f < 0 ? 'neg' : 'pos'}">${eur0(f)}</b></div>`;
  return html + '</div>';
}

function incRow(i) {
  return `<button class="item" data-a="editIncome" data-id="${i.id}"><span class="ic">💶</span><div class="grow"><div class="name">${esc(i.label || 'Provision')}</div><div class="meta">${niceDate(i.date)} · antippen zum Ändern</div></div><span class="amt pos">+${eur(num(i.amount))}</span></button>`;
}

/* ---------- Ausgaben ---------- */

const byDateDesc = (a, b) => (a.date === b.date ? (b.t || 0) - (a.t || 0) : a.date < b.date ? 1 : -1);
function expRow(e) {
  const ci = catInfo(e.cat);
  return `<button class="item" data-a="editExpense" data-id="${e.id}"><span class="ic">${ci[1]}</span>
    <div class="grow"><div class="name">${esc(e.note || ci[2])}</div><div class="meta">${e.note ? ci[2] + ' · ' : ''}${niceDate(e.date)}</div></div>
    <span class="amt">−${eur(num(e.amount))}</span></button>`;
}

VIEWS.ausgaben = () => {
  const c = calc(ui.period);
  const used = catTotals(c.exps);
  if (ui.expCat !== 'alle' && !used.some((u) => u.id === ui.expCat)) ui.expCat = 'alle';
  const list = c.exps.filter((e) => ui.expCat === 'alle' || e.cat === ui.expCat).sort(byDateDesc);
  const days = {};
  for (const e of list) (days[e.date] = days[e.date] || []).push(e);
  const filteredSum = list.reduce((a, e) => a + num(e.amount), 0);
  const nDays = Object.keys(days).length;
  return `<h1>Ausgaben</h1>${periodNav()}
    <div class="stats"><div class="stat"><b class="num">${eur0(filteredSum)}</b><span>${ui.expCat === 'alle' ? 'gesamt' : catInfo(ui.expCat)[2]}</span></div>
      <div class="stat"><b class="num">${list.length}</b><span>Einträge</span></div>
      <div class="stat"><b class="num">${nDays ? eur0(filteredSum / Math.max(1, Math.round((Math.min(Date.now(), periodEnd(ui.period)) - ui.period) / 864e5))) : '–'}</b><span>Ø pro Tag</span></div></div>
    ${used.length ? `<div class="chips" style="margin-top:14px"><button class="chip ${ui.expCat === 'alle' ? 'on' : ''}" data-a="expCat" data-c="alle">Alle</button>${used.map((u) =>
      `<button class="chip ${ui.expCat === u.id ? 'on' : ''}" data-a="expCat" data-c="${u.id}">${catInfo(u.id)[1]} ${catInfo(u.id)[2]}</button>`).join('')}</div>` : ''}
    ${list.length ? Object.entries(days).map(([d, es]) => `<div class="daygrp"><div class="daygrp-h"><span>${niceDate(d)}</span><b>−${eur(es.reduce((a, e) => a + num(e.amount), 0))}</b></div>
      <div class="list">${es.map(expRow).join('')}</div></div>`).join('') :
      '<div class="empty">Noch keine Ausgaben in diesem Monat.<br>Tipp unten rechts auf <b>+</b>, um die erste einzutragen.</div>'}
    <div style="height:80px"></div>`;
};

function expenseSheet(e) {
  const isNew = !e;
  e = e || { amount: '', cat: '', note: '', date: today() };
  sheetCtx = { kind: 'expense', id: isNew ? null : e.id, cat: e.cat };
  openSheet(`<div class="sh-head"><h3>${isNew ? 'Ausgabe eintragen' : 'Ausgabe bearbeiten'}</h3></div>
    <div class="sh-body">
      <input class="amount-in" id="fAmount" inputmode="decimal" placeholder="0,00 €" value="${e.amount ? esc(String(e.amount).replace('.', ',')) : ''}" autocomplete="off">
      <div class="cats" id="fCats" style="margin-top:8px">${CATS.map(([id, ic, n]) => `<button class="cat ${e.cat === id ? 'on' : ''}" data-a="pickCat" data-c="${id}"><span class="ic">${ic}</span>${n}</button>`).join('')}</div>
      <div class="grid2" style="margin-top:12px">
        <label class="field"><span>Notiz (optional)</span><input class="input" id="fNote" value="${esc(e.note)}" placeholder="z. B. Kaffee"></label>
        <label class="field"><span>Datum</span><input class="input" id="fDate" type="date" value="${e.date}"></label>
      </div>
    </div>
    <div class="sh-foot row">${isNew ? '<button class="btn grow" data-a="closeSheet">Abbrechen</button>' : `<button class="btn danger" data-a="delExpense">Löschen</button>`}<button class="btn primary grow" data-a="saveExpense">Speichern</button></div>`);
  if (isNew) setTimeout(() => { const a = $('#fAmount'); if (a) a.focus(); }, 250);
}

/* ---------- Fixkosten ---------- */

VIEWS.fixkosten = () => {
  const cur = curPeriod();
  const active = S.fixed.filter((f) => fixedActive(f, cur));
  const sum = active.reduce((a, f) => a + monthly(f), 0);
  const avg = avgIncome(6) || calc(cur).inc;
  const groups = FIXCATS.map((fc) => ({ fc, items: S.fixed.filter((f) => f.cat === fc[0]) })).filter((g) => g.items.length);
  return `<div class="row spread"><h1>Fixkosten</h1><button class="btn sm primary" style="margin-top:16px" data-a="addFixed">+ Neu</button></div>
    <div class="card hero" style="margin-top:12px"><div class="sub">Gehen jeden Monat automatisch ab</div>
      <div class="hero-num">${eur(sum)}</div>
      <div class="sub">${eur0(sum * 12)} pro Jahr${avg ? ` · ${pct(sum / avg)} deines Ø-Einkommens` : ''}</div></div>
    ${active.length ? `<h2>Aufteilung</h2><div class="card">${donut(FIXCATS.map((fc) => ({ label: fc[1] + ' ' + fc[2], color: fc[3], v: active.filter((f) => f.cat === fc[0]).reduce((a, f) => a + monthly(f), 0) })).sort((a, b) => b.v - a.v), eur0(sum), 'pro Monat')}</div>` : ''}
    ${groups.length ? groups.map((g) => `<h2>${g.fc[1]} ${g.fc[2]}</h2><div class="list">${g.items.map((f) => {
      const on = fixedActive(f, cur);
      return `<div class="item ${on ? '' : 'off'}"><button class="grow row" style="text-align:left" data-a="editFixed" data-id="${f.id}">
          <div class="grow"><div class="name">${esc(f.name)}</div><div class="meta">${eur(num(f.amount))} ${INTERVALS.find((i) => i[0] === (f.interval || 1))[1]}${(f.interval || 1) > 1 ? ' · ' + eur(monthly(f)) + '/Monat' : ''}${f.day ? ' · am ' + f.day + '.' : ''}${rangeText(f) ? '<br>' + rangeText(f) : ''}</div></div>
          <span class="amt">${eur(monthly(f))}</span></button>
        <button class="toggle ${on ? 'on' : ''}" data-a="toggleFixed" data-id="${f.id}" aria-label="${on ? 'Pausieren' : 'Aktivieren'}"></button></div>`;
    }).join('')}</div>`).join('') :
      `<div class="empty">Noch keine Fixkosten.<br>Trag alles ein, was regelmäßig abgeht: Handy, Versicherungen, Abos, Auto, Fitnessstudio …</div>`}
    ${S.fixed.length ? '<button class="btn block" style="margin-top:16px" data-a="bulkStart">📅 Alle Fixkosten ab einem Monat gelten lassen</button>' : ''}
    <p class="note" style="margin-top:16px">Jährliche oder vierteljährliche Kosten werden anteilig pro Monat gerechnet – so legst du automatisch dafür zurück. Mit dem Schalter pausierst du einen Posten ab diesem Monat; frühere Monate bleiben unverändert. Ab wann ein Posten gilt, stellst du beim Antippen unter „Gilt seit“ ein.</p>
    <div style="height:70px"></div>`;
};

function fixedSheet(f) {
  const isNew = !f;
  f = f || { name: '', amount: '', interval: 1, cat: 'versicherung', day: '', start: '', end: '' };
  sheetCtx = { kind: 'fixed', id: isNew ? null : f.id };
  openSheet(`<div class="sh-head"><h3>${isNew ? 'Fixkosten hinzufügen' : 'Fixkosten bearbeiten'}</h3></div>
    <div class="sh-body stack">
      <label class="field"><span>Bezeichnung</span><input class="input" id="fName" value="${esc(f.name)}" placeholder="z. B. Handyvertrag"></label>
      <div class="grid2"><label class="field"><span>Betrag (€)</span><input class="input" id="fAmount" inputmode="decimal" value="${f.amount ? esc(String(f.amount).replace('.', ',')) : ''}" placeholder="0,00"></label>
        <label class="field"><span>Wie oft?</span><select class="input" id="fInterval">${INTERVALS.map(([v, l]) => `<option value="${v}" ${v === (f.interval || 1) ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
      <div class="grid2"><label class="field"><span>Kategorie</span><select class="input" id="fCat">${FIXCATS.map(([id, ic, n]) => `<option value="${id}" ${id === f.cat ? 'selected' : ''}>${ic} ${n}</option>`).join('')}</select></label>
        <label class="field"><span>Abbuchung am (Tag)</span><input class="input" id="fDay" inputmode="numeric" value="${esc(f.day || '')}" placeholder="optional"></label></div>
      ${rangeFields(f)}
    </div>
    <div class="sh-foot row">${isNew ? '<button class="btn grow" data-a="closeSheet">Abbrechen</button>' : '<button class="btn danger" data-a="delFixed">Löschen</button>'}<button class="btn primary grow" data-a="saveFixed">Speichern</button></div>`);
}

/* ---------- Einnahmen ---------- */

VIEWS.einnahmen = () => {
  const cur = curPeriod();
  const series = [];
  for (let i = 11; i >= 0; i--) {
    const p = shiftPeriod(cur, -i);
    series.push({ label: periodLabel(p, 1), v: S.incomes.filter((x) => inPeriod(x.date, p)).reduce((a, x) => a + num(x.amount), 0) });
  }
  const nonzero = series.filter((s) => s.v);
  const avg = nonzero.length ? nonzero.reduce((a, s) => a + s.v, 0) / nonzero.length : 0;
  const sorted = S.incomes.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  const groups = {};
  for (const i of sorted) { const k = dkey(periodOf(parseD(i.date))); (groups[k] = groups[k] || []).push(i); }
  const curC = calc(cur);
  const recHtml = S.recIncomes.length ? `<div class="list">${S.recIncomes.map((f) => {
    const on = fixedActive(f, cur);
    return `<div class="item ${on ? '' : 'off'}"><button class="grow row" style="text-align:left" data-a="editRec" data-id="${f.id}"><span class="ic" style="filter:none;background:#fb718522">🏢</span>
      <div class="grow"><div class="name">${esc(f.name)}</div><div class="meta">${eur(num(f.amount))} ${INTERVALS.find((i) => i[0] === (f.interval || 1))[1]}${rangeText(f) ? ' · ' + rangeText(f) : ''}</div></div><span class="amt pos">+${eur(monthly(f))}</span></button>
      <button class="toggle ${on ? 'on' : ''}" data-a="toggleRec" data-id="${f.id}" aria-label="${on ? 'Pausieren' : 'Aktivieren'}"></button></div>`;
  }).join('')}</div>` : '<p class="note" style="margin:0">Mieteinnahmen o. Ä. hier einmal anlegen – sie zählen dann jeden Monat automatisch zu deinen Einnahmen.</p>';
  const prop = curC.rent || curC.propCost ? `<h2>🏢 Immobilien-Bilanz pro Monat</h2><div class="card">
      ${hbars([{ label: 'Miete', v: curC.rent, color: '#22c55e' }, { label: 'Kosten', v: curC.propCost, color: '#fb7185' }])}
      <div style="height:6px"></div>
      <div class="kv"><span>Mieteinnahmen</span><b class="pos">+${eur(curC.rent)}</b></div>
      <div class="kv"><span>Kosten (Fixkosten „Immobilie“)</span><b>−${eur(curC.propCost)}</b></div>
      <div class="kv" style="font-weight:700"><span>= ${curC.rent >= curC.propCost ? 'Überschuss' : 'Unterdeckung'}</span><b class="${curC.rent >= curC.propCost ? 'pos' : 'neg'}">${eur(curC.rent - curC.propCost)}</b></div>
      <p class="note" style="margin:8px 0 0">Kosten wie Kreditrate, Hausgeld, Grundsteuer oder Rücklage trägst du unter Fixkosten mit der Kategorie „Immobilie (vermietet)“ ein.</p></div>` : '';
  return `<div class="row spread"><h1>Einnahmen</h1><button class="btn sm primary" style="margin-top:16px" data-a="addIncome">+ Neu</button></div>
    ${curC.inc ? `<div class="card" style="margin-top:12px">${donut([{ label: 'Provision & Co.', v: curC.oneOff, color: '#22c55e' }, { label: 'Feste Einnahmen (Miete)', v: curC.rent, color: '#fb7185' }], eur0(curC.inc), 'diesen Monat')}</div>` : ''}
    <div class="row spread"><h2>Diesen Monat eingetragen</h2><button class="link" data-a="addIncome">+ Einnahme</button></div>
    ${(() => { const mine = S.incomes.filter((i) => inPeriod(i.date, cur)).sort((a, b) => (a.date < b.date ? 1 : -1));
      return mine.length ? `<div class="list">${mine.map(incRow).join('')}</div>` : '<p class="note" style="margin:0">Noch keine Provision für diesen Monat eingetragen.</p>'; })()}
    <div class="row spread"><h2>Feste Einnahmen</h2><button class="link" data-a="addRec">+ Mieteinnahme</button></div>${recHtml}
    ${prop}
    <h2>Provision & Co.</h2>
    <div class="stats"><div class="stat"><b class="num">${eur0(avgIncome(3))}</b><span>Ø 3 Monate</span></div>
      <div class="stat"><b class="num">${eur0(avgIncome(6))}</b><span>Ø 6 Monate</span></div>
      <div class="stat"><b class="num">${eur0(avgIncome(12))}</b><span>Ø 12 Monate</span></div></div>
    <h2>Letzte 12 Monate</h2><div class="card">${nonzero.length ? barChart(series, avg, '#22c55e') : '<p class="sub" style="margin:0">Sobald du Einnahmen einträgst, siehst du hier, wie stark deine Provision schwankt.</p>'}
      ${nonzero.length > 1 ? `<div class="stats two" style="margin-top:12px"><div class="stat"><b class="num">${eur0(Math.min(...nonzero.map((s) => s.v)))}</b><span>schwächster Monat</span></div><div class="stat"><b class="num">${eur0(Math.max(...nonzero.map((s) => s.v)))}</b><span>stärkster Monat</span></div></div>` : ''}</div>
    ${Object.keys(groups).length ? Object.entries(groups).map(([k, items]) => `<div class="daygrp"><div class="daygrp-h"><span>${periodLabel(parseD(k))}</span><b>${eur(items.reduce((a, i) => a + num(i.amount), 0))}</b></div>
      <div class="list">${items.map(incRow).join('')}</div></div>`).join('') :
      '<div class="empty">Noch keine Einnahmen eingetragen.</div>'}
    <p class="note" style="margin-top:16px">Tipp: Plane mit deinem <b>Ø-Einkommen</b> oder sogar mit dem schwächsten Monat – nicht mit dem besten. So bringen dich schwache Provisionsmonate nicht ins Schwitzen.</p>
    <div style="height:70px"></div>`;
};

function incomeSheet(i) {
  const isNew = !i;
  if (!i) {
    const d = new Date(), payday = new Date(d.getFullYear(), d.getMonth(), 15);
    i = { amount: '', label: 'Provision', date: d.getDate() >= 15 ? dkey(payday) : today() };
  }
  sheetCtx = { kind: 'income', id: isNew ? null : i.id };
  openSheet(`<div class="sh-head"><h3>${isNew ? 'Einnahme eintragen' : 'Einnahme bearbeiten'}</h3></div>
    <div class="sh-body stack">
      <input class="amount-in" id="fAmount" inputmode="decimal" placeholder="0,00 €" value="${i.amount ? esc(String(i.amount).replace('.', ',')) : ''}" autocomplete="off">
      <div class="chips" style="justify-content:center">${['Provision', 'Bonus', 'Erstattung', 'Sonstiges'].map((l) => `<button class="chip ${i.label === l ? 'on' : ''}" data-a="pickLabel" data-l="${l}">${l}</button>`).join('')}</div>
      <div class="grid2"><label class="field"><span>Bezeichnung</span><input class="input" id="fLabel" value="${esc(i.label)}"></label>
        <label class="field"><span>Datum</span><input class="input" id="fDate" type="date" value="${i.date}"></label></div>
    </div>
    <div class="sh-foot row">${isNew ? '<button class="btn grow" data-a="closeSheet">Abbrechen</button>' : '<button class="btn danger" data-a="delIncome">Löschen</button>'}<button class="btn primary grow" data-a="saveIncome">Speichern</button></div>`);
  if (isNew) setTimeout(() => { const a = $('#fAmount'); if (a) a.focus(); }, 250);
}

/* ---------- Vermögen ---------- */

function assetValue(a, upTo) {
  const h = (a.history || []).filter((x) => !upTo || x.date <= upTo);
  return h.length ? num(h[h.length - 1].value) : null;
}
function signed(a, v) { return a.type === 'schulden' ? -Math.abs(v) : v; }
function netWorth(upTo) {
  let assets = 0, debts = 0;
  for (const a of S.assets) { const v = assetValue(a, upTo); if (v === null) continue; if (a.type === 'schulden') debts += Math.abs(v); else assets += v; }
  return { assets, debts, net: assets - debts };
}
function netHistory() {
  const dates = [...new Set(S.assets.flatMap((a) => (a.history || []).map((h) => h.date)))].sort();
  return dates.map((d) => ({ label: parseD(d).getDate() + '.' + (parseD(d).getMonth() + 1) + '.', date: d, v: netWorth(d).net }));
}

VIEWS.vermoegen = () => {
  const nw = netWorth();
  const hist = netHistory();
  const monthAgo = dkey(addDays(new Date(), -30));
  const before = hist.filter((h) => h.date <= monthAgo).pop();
  const delta = before ? nw.net - before.v : null;
  const propVal = S.assets.filter((a) => a.type === 'immobilie').reduce((s2, a) => s2 + (assetValue(a) || 0), 0);
  const showProp = ui.withProp || !propVal;
  const byType = ASSET_TYPES.filter((t) => t[0] !== 'schulden' && (showProp || t[0] !== 'immobilie')).map((t) => ({ label: t[1] + ' ' + t[2], color: t[3], v: S.assets.filter((a) => a.type === t[0]).reduce((s, a) => s + (assetValue(a) || 0), 0) }));
  const groups = ASSET_TYPES.map((t) => ({ t, items: S.assets.filter((a) => a.type === t[0]) })).filter((g) => g.items.length);
  return `<div class="row spread"><h1>Vermögen</h1><button class="btn sm primary" style="margin-top:16px" data-a="addAsset">+ Topf</button></div>
    <div class="card hero" style="margin-top:12px"><div class="sub">Nettovermögen</div>
      <div class="hero-num ${nw.net < 0 ? 'neg' : ''}">${S.assets.length ? eur(nw.net) : '–'}</div>
      <div class="sub">${S.assets.length ? `${eur0(nw.assets)} Vermögen${nw.debts ? ' · ' + eur0(nw.debts) + ' Schulden' : ''}` : 'Leg deinen ersten Topf an – z. B. dein Tagesgeldkonto.'}
      ${delta !== null ? `<br><span class="${delta >= 0 ? 'pos' : 'neg'}" style="font-weight:700">${delta >= 0 ? '▲ +' : '▼ '}${eur0(delta)}</span> in den letzten 30 Tagen` : ''}</div></div>
    ${nw.assets ? `<h2>Wo dein Geld liegt</h2>
      ${propVal ? `<div class="seg"><button class="${showProp ? '' : 'on'}" data-a="propToggle" data-v="0">Ohne Immobilie</button><button class="${showProp ? 'on' : ''}" data-a="propToggle" data-v="1">Alles</button></div>` : ''}
      <div class="card">${donut(byType, eur0(byType.reduce((s2, x) => s2 + x.v, 0)), showProp ? 'Vermögen' : 'ohne Immobilie')}</div>` : ''}
    ${propVal ? (() => {
      const debt = S.assets.filter((a) => a.type === 'schulden').reduce((s2, a) => s2 + Math.abs(assetValue(a) || 0), 0);
      const eq = propVal - debt, share = Math.max(0, Math.min(1, eq / propVal));
      if (!debt) {
        return `<h2>🏢 Deine Immobilie</h2><div class="card">
          <div class="kv"><span>Marktwert</span><b>${eur(propVal)}</b></div>
          <p class="note" style="margin:8px 0 12px">Hast du die Immobilie mit einem Kredit finanziert? Trag die aktuelle Restschuld ein – dann siehst du hier dein echtes Eigenkapital und wie viel Prozent dir schon gehören.</p>
          <button class="btn primary block" data-a="addLoan">+ Kredit / Restschuld eintragen</button></div>`;
      }
      return `<h2>🏢 Deine Immobilie</h2><div class="card">
        <div class="row spread"><span class="sub small">Eigenkapital</span><span class="sub small">${Math.round(share * 100)} % gehören dir</span></div>
        <div class="big num" style="font-size:30px">${eur0(eq)}</div>
        <div class="meter"><i style="width:${share * 100}%;background:linear-gradient(90deg,#fb718588,#fb7185)"></i></div>
        <div class="kv"><span>Marktwert</span><b>${eur(propVal)}</b></div>
        <div class="kv"><span>Restschuld</span><b class="neg">−${eur(debt)}</b></div>
        <button class="btn sm" style="margin-top:10px" data-a="addLoan">+ Weiteren Kredit</button></div>`;
    })() : ''}
    ${hist.length > 1 ? `<h2>Entwicklung</h2><div class="card"><span class="sub small">Nettovermögen</span>${lineChart(hist, '#22c55e')}</div>` : ''}
    ${groups.length ? groups.map((g) => `<h2>${g.t[1]} ${g.t[2]}</h2><div class="list">${g.items.map((a) => {
      const h = a.history || [], v = assetValue(a) || 0, prev = h.length > 1 ? num(h[h.length - 2].value) : null;
      const d = prev === null ? null : v - prev;
      return `<button class="item" data-a="editAsset" data-id="${a.id}"><span class="ic" style="filter:none;background:${g.t[3]}22">${g.t[1]}</span>
        <div class="grow"><div class="name">${esc(a.name)}</div><div class="meta">Stand ${h.length ? niceDate(h[h.length - 1].date) : '–'}${d ? ` · <span class="${(d > 0) !== (a.type === 'schulden') ? 'pos' : 'neg'}">${d > 0 ? '+' : ''}${eur0(d)}</span>` : ''}</div></div>
        <span class="amt ${a.type === 'schulden' ? 'neg' : ''}">${a.type === 'schulden' ? '−' : ''}${eur(Math.abs(v))}</span></button>`;
    }).join('')}</div>`).join('') :
      `<div class="empty">Noch keine Töpfe.<br>Leg für jedes Konto, Depot, jede Versicherung, deinen Goldsparplan und deine Immobilie einen Topf an. Kredite trägst du als „Kredite & Schulden“ ein.</div>`}
    <p class="note" style="margin-top:16px">Tipp: Aktualisiere die Werte einmal im Monat, z. B. am Zahltag. Jeder neue Stand wird gespeichert – daraus entsteht die Entwicklungskurve. Die Immobilie trägst du mit ihrem Marktwert ein und den Restkredit als Schulden.</p>
    <div style="height:70px"></div>`;
};

function assetSheet(a, preset) {
  const isNew = !a;
  a = a || Object.assign({ name: '', type: 'konto', history: [] }, preset);
  const v = assetValue(a);
  sheetCtx = { kind: 'asset', id: isNew ? null : a.id };
  openSheet(`<div class="sh-head"><h3>${isNew ? (a.type === 'schulden' ? 'Kredit eintragen' : 'Neuer Topf') : esc(a.name)}</h3>${isNew && a.type === 'schulden' ? '<p class="sub" style="margin:4px 0 0">Trag die aktuelle Restschuld laut Bank ein – nicht die ursprüngliche Kreditsumme.</p>' : ''}${isNew ? '' : '<p class="sub" style="margin:4px 0 0">Neuen Kontostand eintragen – der alte bleibt im Verlauf.</p>'}</div>
    <div class="sh-body stack">
      <input class="amount-in" id="fAmount" inputmode="decimal" placeholder="0,00 €" value="${v !== null ? esc(String(Math.abs(v)).replace('.', ',')) : ''}" autocomplete="off">
      <label class="field"><span>Bezeichnung</span><input class="input" id="fName" value="${esc(a.name)}" placeholder="z. B. Tagesgeld ING, ETF-Depot, Goldsparplan"></label>
      <label class="field"><span>Art</span><select class="input" id="fType">${ASSET_TYPES.map(([id, ic, n]) => `<option value="${id}" ${id === a.type ? 'selected' : ''}>${ic} ${n}</option>`).join('')}</select></label>
      ${(a.history || []).length > 1 ? `<h2 style="margin:12px 0 0">Verlauf</h2>${lineChart(a.history.map((h) => ({ label: parseD(h.date).getDate() + '.' + (parseD(h.date).getMonth() + 1) + '.', v: num(h.value) })), assetType(a.type)[3])}
        <div class="list">${a.history.slice(-6).reverse().map((h) => `<div class="item"><span class="grow">${niceDate(h.date)}</span><b class="num">${eur(num(h.value))}</b></div>`).join('')}</div>` : ''}
    </div>
    <div class="sh-foot row">${isNew ? '<button class="btn grow" data-a="closeSheet">Abbrechen</button>' : '<button class="btn danger" data-a="delAsset">Löschen</button>'}<button class="btn primary grow" data-a="saveAsset">Speichern</button></div>`);
  setTimeout(() => { const el = $('#fAmount'); if (el) { el.focus(); el.select(); } }, 250);
}

function recSheet(f) {
  const isNew = !f;
  f = f || { name: 'Miete', amount: '', interval: 1, start: '', end: '' };
  sheetCtx = { kind: 'rec', id: isNew ? null : f.id };
  openSheet(`<div class="sh-head"><h3>${isNew ? 'Feste Einnahme' : 'Feste Einnahme bearbeiten'}</h3></div>
    <div class="sh-body stack">
      <label class="field"><span>Bezeichnung</span><input class="input" id="fName" value="${esc(f.name)}" placeholder="z. B. Miete Wohnung"></label>
      <div class="grid2"><label class="field"><span>Betrag (€)</span><input class="input" id="fAmount" inputmode="decimal" value="${f.amount ? esc(String(f.amount).replace('.', ',')) : ''}" placeholder="0,00"></label>
        <label class="field"><span>Wie oft?</span><select class="input" id="fInterval">${INTERVALS.map(([v, l]) => `<option value="${v}" ${v === (f.interval || 1) ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
      ${rangeFields(f)}
      <p class="note" style="margin:0">Auf feste Einnahmen wird keine Steuerrücklage gerechnet – Mieteinnahmen werden nach Abzug der Kosten versteuert. Wenn du dafür etwas zurücklegen willst, leg dir einen Fixkosten-Posten „Steuer Miete“ an.</p>
    </div>
    <div class="sh-foot row">${isNew ? '<button class="btn grow" data-a="closeSheet">Abbrechen</button>' : '<button class="btn danger" data-a="delRec">Löschen</button>'}<button class="btn primary grow" data-a="saveRec">Speichern</button></div>`);
}

/* ---------- Statistik ---------- */

VIEWS.statistik = () => {
  const cur = curPeriod();
  const periods = [];
  for (let i = 11; i >= 0; i--) periods.push(shiftPeriod(cur, -i));
  const cs = periods.map(calc);
  const withInc = cs.filter((c) => c.inc);
  const year = new Date().getFullYear();
  const ycs = [];
  for (let m = 0; m < 12; m++) { const p = periodOf(new Date(year, m, Math.max(sd(), 1))); if (p <= cur) ycs.push(calc(p)); }
  const Y = ycs.reduce((a, c) => ({ inc: a.inc + c.inc, fix: a.fix + (c.inc || c.vari ? c.fix : 0), vari: a.vari + c.vari, tax: a.tax + c.tax }), { inc: 0, fix: 0, vari: 0, tax: 0 });
  const ySaved = Y.inc - Y.fix - Y.vari - Y.tax;

  const c = calc(ui.period), p = calc(shiftPeriod(ui.period, -1));
  const cats = catTotals(c.exps), prevCats = Object.fromEntries(catTotals(p.exps).map((x) => [x.id, x.v]));
  const top = c.exps.slice().sort((a, b) => num(b.amount) - num(a.amount)).slice(0, 5);

  return `<h1>Statistik</h1>
    <h2>Monate im Vergleich</h2><div class="card">${withInc.length || cs.some((x) => x.vari) ? stackChart(cs) : '<p class="sub" style="margin:0">Hier siehst du bald jeden Monat als Balken: was reinkam, was wohin ging und was übrig blieb.</p>'}
      <div class="legend"><span><i style="background:#a855f7"></i>Steuer</span><span><i style="background:#f97316"></i>Fixkosten</span><span><i style="background:#3b82f6"></i>Variabel</span><span><i style="background:#22c55e"></i>Übrig</span><span><i style="background:var(--danger)"></i>Minus</span></div></div>
    <h2>Jahr ${year}</h2><div class="card">
      <div class="kv"><span>Einnahmen</span><b>${eur(Y.inc)}</b></div>
      ${Y.tax ? `<div class="kv"><span>Steuerrücklage</span><b>−${eur(Y.tax)}</b></div>` : ''}
      <div class="kv"><span>Fixkosten</span><b>−${eur(Y.fix)}</b></div>
      <div class="kv"><span>Variable Ausgaben</span><b>−${eur(Y.vari)}</b></div>
      <div class="kv" style="font-weight:700"><span>Behalten</span><b class="${ySaved < 0 ? 'neg' : 'pos'}">${eur(ySaved)}</b></div>
      ${Y.inc ? `<div class="kv"><span>Sparquote</span><b>${pct(ySaved / Y.inc)}</b></div>` : ''}</div>
    ${periodNav()}
    ${(() => { const v = verdict(c); return v ? `<div class="card verdict ${v.cls}"><span class="em">${v.em}</span><div><h3>${v.t}</h3><div class="sub">${v.s}</div></div></div>` : ''; })()}
    ${cats.length ? `<h2>Ausgaben nach Kategorie</h2><div class="card">${donut(cats.map((x) => ({ label: catInfo(x.id)[1] + ' ' + catInfo(x.id)[2], v: x.v, color: catInfo(x.id)[3] })), eur0(c.vari), periodLabel(ui.period, 2))}</div>` : ''}
    <h2>Kategorien vs. Vormonat</h2><div class="card">${cats.length ? '<div class="hbars">' + cats.map((x, i) => {
      const prev = prevCats[x.id] || 0, d = x.v - prev, max = cats[0].v;
      return `<div class="hb"><span class="hb-l">${catInfo(x.id)[1]} ${catInfo(x.id)[2]}</span><span class="hb-t"><span class="hb-f" style="width:${Math.max(4, 100 * x.v / max)}%;animation-delay:${i * 60}ms;background:linear-gradient(90deg, ${catInfo(x.id)[3]}88, ${catInfo(x.id)[3]})"></span></span>
        <b class="num">${eur0(x.v)}<br><span class="small ${d > 0 ? 'neg' : d < 0 ? 'pos' : 'muted'}" style="font-weight:600">${prev ? (d > 0 ? '▲ ' : d < 0 ? '▼ ' : '') + eur0(Math.abs(d)) : 'neu'}</span></b></div>`;
    }).join('') + '</div>' : '<p class="sub" style="margin:0">Keine Ausgaben in diesem Monat.</p>'}</div>
    ${top.length ? `<h2>Größte Ausgaben</h2><div class="list">${top.map(expRow).join('')}</div>` : ''}
    <div style="height:70px"></div>`;
};

/* ---------- Diagramme ---------- */

function hbars(items) {
  if (!items.length) return '<p class="sub small" style="margin:0">Noch keine Daten.</p>';
  const max = Math.max(...items.map((i) => i.v));
  return '<div class="hbars">' + items.map((it, i) => `<div class="hb"><span class="hb-l">${esc(it.label)}</span>
    <span class="hb-t"><span class="hb-f" style="width:${Math.max(4, 100 * it.v / max)}%;animation-delay:${i * 60}ms${it.color ? `;background:linear-gradient(90deg, ${it.color}88, ${it.color})` : ''}"></span></span>
    <b class="num">${eur0(it.v)}</b></div>`).join('') + '</div>';
}

// Ringdiagramm mit Legende
function donut(items, top, bottom, opts = {}) {
  items = items.filter((i) => i.v > 0);
  const total = items.reduce((a, i) => a + i.v, 0);
  if (!total) return '<p class="sub" style="margin:0">Noch keine Daten.</p>';
  const r = 70, c = 2 * Math.PI * r, gap = items.length > 1 ? 2.5 : 0;
  let off = 0, arcs = '';
  items.forEach((it, i) => {
    const len = Math.max(0.5, c * it.v / total - gap);
    arcs += `<circle cx="100" cy="100" r="${r}" class="dn-arc" stroke="${it.color}" stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-off}" style="animation-delay:${i * 70}ms"/>`;
    off += c * it.v / total;
  });
  const legend = opts.legend === false ? '' : `<div class="dn-leg">${items.map((it) => `<div class="dn-row"><i style="background:${it.color}"></i><span class="grow">${esc(it.label)}</span><b class="num">${eur0(it.v)}</b><span class="muted num small" style="width:48px;text-align:right;white-space:nowrap">${Math.round(100 * it.v / total)} %</span></div>`).join('')}</div>`;
  return `<div class="dn"><svg viewBox="0 0 200 200" class="dn-svg"><circle cx="100" cy="100" r="${r}" class="dn-bg"/><g transform="rotate(-90 100 100)">${arcs}</g>
    <text x="100" y="96" text-anchor="middle" class="dn-top">${esc(top)}</text><text x="100" y="118" text-anchor="middle" class="dn-bot">${esc(bottom)}</text></svg></div>${legend}`;
}

// Verlaufskurve
function lineChart(pts, color = '#22c55e') {
  const W = 320, H = 130, P = 8, B = 18;
  const vs = pts.map((p) => p.v);
  let lo = Math.min(...vs), hi = Math.max(...vs);
  if (hi === lo) { hi += 1; lo -= 1; }
  const pad = (hi - lo) * 0.15; lo -= pad; hi += pad;
  const x = (i) => P + (pts.length === 1 ? (W - 2 * P) / 2 : i * (W - 2 * P) / (pts.length - 1));
  const y = (v) => P + (H - P - B) * (1 - (v - lo) / (hi - lo));
  const line = pts.map((p, i) => x(i).toFixed(1) + ',' + y(p.v).toFixed(1)).join(' ');
  const id = 'g' + Math.random().toString(36).slice(2, 7);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    <line class="gl" x1="0" x2="${W}" y1="${H - B}" y2="${H - B}"/>
    <polygon points="${x(0)},${H - B} ${line} ${x(pts.length - 1)},${H - B}" fill="url(#${id})"/>
    <polyline points="${line}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 6px ${color}66)"/>
    ${pts.length <= 24 ? pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.v)}" r="3.5" fill="#fff" stroke="${color}" stroke-width="2"/>`).join('') : ''}
    <text x="${P}" y="${H - 4}">${esc(pts[0].label)}</text><text x="${W - P}" y="${H - 4}" text-anchor="end">${esc(pts[pts.length - 1].label)}</text></svg>`;
}
function barChart(items, avg, color) {
  const W = 320, H = 140, B = 18, T = 16, gap = 5;
  const max = Math.max(1, avg || 0, ...items.map((i) => i.v));
  const bw = (W - gap * (items.length - 1)) / items.length;
  const y = (v) => H - B - (H - B - T) * v / max;
  const best = Math.max(...items.map((i) => i.v));
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${items.map((it, i) => {
    const h = it.v ? Math.max(3, H - B - y(it.v)) : 3, x = i * (bw + gap);
    return `<rect class="br ${it.v ? '' : 'z'} ${it.v && it.v === best ? 'top' : ''}" style="animation-delay:${i * 40}ms${color && it.v ? `;fill:${color};opacity:${it.v === best ? 1 : 0.55}` : ''}" x="${x}" y="${H - B - h}" width="${bw}" height="${h}" rx="4"/>
      <text x="${x + bw / 2}" y="${H - 4}" text-anchor="middle">${esc(it.label)}</text>`;
  }).join('')}${avg ? `<line class="avg" x1="0" x2="${W}" y1="${y(avg)}" y2="${y(avg)}"/><text class="avgt" x="${W}" y="${y(avg) - 4}" text-anchor="end">Ø ${eur0(avg)}</text>` : ''}</svg>`;
}
function stackChart(cs) {
  const W = 320, H = 170, B = 18, T = 6, gap = 5;
  const max = Math.max(1, ...cs.map((c) => Math.max(c.inc, c.tax + c.fix + c.vari)));
  const bw = (W - gap * (cs.length - 1)) / cs.length;
  const sc = (v) => (H - B - T) * v / max;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${cs.map((c, i) => {
    const x = i * (bw + gap);
    let yy = H - B, out = '';
    const active = c.inc || c.vari;
    const parts = active ? [['sb-tax', c.tax], ['sb-fix', c.fix], ['sb-var', c.vari]] : [];
    if (active && c.rest > 0) parts.push(['sb-rest', c.rest]);
    for (const [cls, v] of parts) { const h = sc(v); if (h <= 0) continue; yy -= h; out += `<rect class="${cls}" x="${x}" y="${yy}" width="${bw}" height="${h}"/>`; }
    if (active && c.rest < 0) { const h = Math.min(sc(-c.rest), 14); out += `<rect class="sb-neg" x="${x}" y="${Math.max(T, yy - h - 2)}" width="${bw}" height="${h}" rx="2"/>`; }
    if (!active) out = `<rect class="br z" x="${x}" y="${H - B - 3}" width="${bw}" height="3" rx="1.5"/>`;
    return `<g class="stk" style="animation-delay:${i * 40}ms">${out}</g><text x="${x + bw / 2}" y="${H - 4}" text-anchor="middle">${periodLabel(c.start, 1)}</text>`;
  }).join('')}</svg>`;
}

/* ---------- Sheets ---------- */

function openSheet(html) { $('#sheet .panel').innerHTML = html; $('#sheet').hidden = false; }
function closeSheet() { $('#sheet').hidden = true; $('#sheet .panel').innerHTML = ''; sheetCtx = null; }
function confirmSheet(title, text, yesLabel, onYes) {
  openSheet(`<div class="sh-head"><h3>${title}</h3></div><div class="sh-body"><p class="sub">${text}</p></div>
    <div class="sh-foot row"><button class="btn grow" data-a="closeSheet">Abbrechen</button><button class="btn danger grow" data-a="confirmYes">${yesLabel}</button></div>`);
  sheetCtx = { kind: 'confirm', onYes };
}

function settingsSheet() {
  const st = S.settings;
  openSheet(`<div class="sh-head"><h3>Einstellungen</h3></div>
    <div class="sh-body stack">
      <label class="field"><span>Steuerrücklage in % jeder Einnahme</span><input class="input" id="sTax" inputmode="decimal" value="${st.taxPct === null ? '' : esc(st.taxPct)}" placeholder="z. B. 30"></label>
      <p class="note" style="margin:-2px 0 0">Als Selbstständiger zahlst du Einkommensteuer (und ggf. Umsatzsteuer) selbst nach. Viele legen 25–35 % zurück – wie viel bei dir passt, klärst du am besten mit deinem Steuerberater. 0 = keine Rücklage.</p>
      <label class="field"><span>Sparziel pro Monat (€)</span><input class="input" id="sSave" inputmode="decimal" value="${esc(st.saveGoal)}" placeholder="z. B. 500"></label>
      <label class="field"><span>Budget für variable Ausgaben (€, leer = automatisch)</span><input class="input" id="sBudget" inputmode="decimal" value="${esc(st.varBudget)}" placeholder="automatisch: was nach allem übrig ist"></label>
      <label class="field"><span>Monat beginnt am</span><select class="input" id="sStart">${[1, 15].map((d) => `<option value="${d}" ${sd() === d ? 'selected' : ''}>${d === 1 ? '1. (Kalendermonat)' : '15. (Zahltag der Provision)'}</option>`).join('')}</select></label>
      <h2 style="margin-top:18px">Deine Daten</h2>
      <p class="note" style="margin:0">Alles bleibt nur auf diesem Gerät – nichts wird hochgeladen. Mach regelmäßig ein Backup (z. B. in iCloud Drive oder Google Drive).</p>
      <div class="row"><button class="btn grow" data-a="export">Backup sichern</button><button class="btn grow" data-a="import">Backup laden</button></div>
      <button class="btn block" data-a="csv">Ausgaben als CSV (für Excel)</button>
      <button class="btn danger block" data-a="wipe">Alle Daten löschen</button>
      <p class="note" style="text-align:center;margin:8px 0 0">App-Version ${APP_VERSION}</p>
    </div>
    <div class="sh-foot row"><button class="btn grow" data-a="closeSheet">Schließen</button><button class="btn primary grow" data-a="saveSettings">Speichern</button></div>`);
  sheetCtx = { kind: 'settings' };
}

/* ---------- Aktionen ---------- */

function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const ACT = {
  go(el) { ui.view = el.dataset.v; closeSheet(); render(); window.scrollTo(0, 0); },
  closeSheet,
  confirmYes() { const f = sheetCtx && sheetCtx.onYes; closeSheet(); if (f) f(); },
  pnav(el) { const n = +el.dataset.n; ui.period = n === 0 ? curPeriod() : shiftPeriod(ui.period, n); render(); },
  expCat(el) { ui.expCat = el.dataset.c; render(); },
  settings: settingsSheet,

  addExpense() { expenseSheet(null); },
  editExpense(el) { expenseSheet(S.expenses.find((e) => e.id === el.dataset.id)); },
  pickCat(el) {
    sheetCtx.cat = el.dataset.c;
    document.querySelectorAll('#fCats .cat').forEach((b) => b.classList.toggle('on', b.dataset.c === sheetCtx.cat));
  },
  saveExpense() {
    const amount = round2(num($('#fAmount').value));
    if (amount <= 0) { toast('Bitte einen Betrag eingeben'); return; }
    if (!sheetCtx.cat) { toast('Bitte eine Kategorie wählen'); return; }
    const data = { amount, cat: sheetCtx.cat, note: $('#fNote').value.trim(), date: $('#fDate').value || today() };
    if (sheetCtx.id) Object.assign(S.expenses.find((e) => e.id === sheetCtx.id), data);
    else S.expenses.push({ id: uid(), t: Date.now(), ...data });
    save(); closeSheet(); render();
    const c = calc(periodOf(parseD(data.date)));
    const dayTotal = S.expenses.filter((e) => e.date === data.date).reduce((a, e) => a + num(e.amount), 0);
    toast(`−${eur(amount)} · ${data.date === today() ? 'heute' : 'an dem Tag'} ${eur(dayTotal)}${c.inc ? ' · noch ' + eur0(c.free) + ' frei' : ''}`);
  },
  delExpense() {
    const id = sheetCtx.id;
    confirmSheet('Ausgabe löschen?', 'Der Eintrag wird endgültig entfernt.', 'Löschen', () => { S.expenses = S.expenses.filter((e) => e.id !== id); save(); render(); });
  },

  addFixed() { fixedSheet(null); },
  editFixed(el) { fixedSheet(S.fixed.find((f) => f.id === el.dataset.id)); },
  saveFixed() {
    const name = $('#fName').value.trim(), amount = round2(num($('#fAmount').value));
    if (!name) { toast('Bitte eine Bezeichnung eingeben'); return; }
    if (amount <= 0) { toast('Bitte einen Betrag eingeben'); return; }
    const day = parseInt($('#fDay').value, 10);
    const range = readRange();
    if (!range) { toast('„Gilt bis“ muss nach „Gilt seit“ liegen'); return; }
    const data = { name, amount, interval: +$('#fInterval').value, cat: $('#fCat').value, day: day >= 1 && day <= 31 ? day : '', ...range };
    if (sheetCtx.id) Object.assign(S.fixed.find((f) => f.id === sheetCtx.id), data);
    else S.fixed.push({ id: uid(), ...data });
    save(); closeSheet(); render(); toast('Fixkosten gespeichert');
  },
  toggleFixed(el) {
    const f = S.fixed.find((x) => x.id === el.dataset.id), cur = dkey(curPeriod());
    if (fixedActive(f, curPeriod())) { f.end = cur; toast(f.name + ' pausiert ab diesem Monat'); }
    else { f.end = ''; if (f.start && f.start > cur) f.start = cur; toast(f.name + ' wieder aktiv'); }
    save(); render();
  },
  delFixed() {
    const id = sheetCtx.id;
    confirmSheet('Fixkosten löschen?', 'Der Posten verschwindet auch aus allen vergangenen Monaten. Wenn du ihn nur ab jetzt nicht mehr zahlst, nutz lieber den Schalter in der Liste.', 'Löschen', () => { S.fixed = S.fixed.filter((f) => f.id !== id); save(); render(); });
  },

  bulkStart() {
    const y = new Date().getFullYear();
    openSheet(`<div class="sh-head"><h3>Alle Fixkosten ab …</h3></div><div class="sh-body stack">
      <label class="field"><span>Gilt seit (Monat)</span><input class="input" id="fFrom" type="month" value="${y}-01"></label>
      <p class="note" style="margin:0">Alle ${S.fixed.length} Fixkosten-Posten zählen dann ab diesem Monat – auch rückwirkend. Ein „Gilt bis“ bleibt erhalten. Einzelne Posten, die sich geändert haben, passt du danach per Antippen an.</p></div>
      <div class="sh-foot row"><button class="btn grow" data-a="closeSheet">Abbrechen</button><button class="btn primary grow" data-a="bulkStartYes">Übernehmen</button></div>`);
    sheetCtx = { kind: 'bulk' };
  },
  bulkStartYes() {
    const k = keyOfMonth($('#fFrom').value);
    if (!k) { toast('Bitte einen Monat wählen'); return; }
    let n = 0;
    for (const f of S.fixed) { if (f.end && f.end <= k) continue; f.start = k; n++; }
    save(); closeSheet(); render(); toast(`${n} Posten gelten jetzt ab ${monthName(k)}`);
  },

  addIncome() { incomeSheet(null); },
  editIncome(el) { incomeSheet(S.incomes.find((i) => i.id === el.dataset.id)); },
  pickLabel(el) { $('#fLabel').value = el.dataset.l; el.parentElement.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === el)); },
  saveIncome() {
    const amount = round2(num($('#fAmount').value));
    if (amount <= 0) { toast('Bitte einen Betrag eingeben'); return; }
    const data = { amount, label: $('#fLabel').value.trim() || 'Provision', date: $('#fDate').value || today() };
    const editing = !!sheetCtx.id;
    if (editing) Object.assign(S.incomes.find((i) => i.id === sheetCtx.id), data);
    else S.incomes.push({ id: uid(), ...data });
    save(); closeSheet(); render();
    if (editing) { toast('Einnahme geändert: ' + eur(amount)); return; }
    const avg = avgIncome(6);
    toast(avg ? `+${eur(amount)} · ${amount >= avg ? '▲ ' + eur0(amount - avg) + ' über' : '▼ ' + eur0(avg - amount) + ' unter'} deinem Ø` : `+${eur(amount)} eingetragen`);
  },
  delIncome() {
    const id = sheetCtx.id;
    confirmSheet('Einnahme löschen?', 'Der Eintrag wird endgültig entfernt.', 'Löschen', () => { S.incomes = S.incomes.filter((i) => i.id !== id); save(); render(); });
  },

  addAsset() { assetSheet(null); },
  addLoan() { assetSheet(null, { type: 'schulden', name: S.assets.some((a) => a.type === 'schulden') ? '' : 'Immobilienkredit' }); },
  propToggle(el) { ui.withProp = el.dataset.v === '1'; render(); },
  editAsset(el) { assetSheet(S.assets.find((a) => a.id === el.dataset.id)); },
  saveAsset() {
    const name = $('#fName').value.trim(), raw = $('#fAmount').value.trim();
    if (!name) { toast('Bitte eine Bezeichnung eingeben'); return; }
    if (raw === '') { toast('Bitte den aktuellen Wert eingeben'); return; }
    const value = round2(Math.abs(num(raw))), type = $('#fType').value, t = today();
    let a = sheetCtx.id && S.assets.find((x) => x.id === sheetCtx.id);
    if (!a) { a = { id: uid(), name, type, history: [] }; S.assets.push(a); }
    const old = assetValue(a);
    Object.assign(a, { name, type });
    a.history = (a.history || []).filter((h) => h.date !== t);
    a.history.push({ date: t, value });
    a.history.sort((x, y) => (x.date < y.date ? -1 : 1));
    save(); closeSheet(); render();
    toast(old === null ? name + ' angelegt' : value === old ? 'Stand bestätigt' : `${name}: ${value > old ? '+' : ''}${eur(value - old)}`);
  },
  delAsset() {
    const id = sheetCtx.id;
    confirmSheet('Topf löschen?', 'Der Topf und sein ganzer Verlauf werden entfernt.', 'Löschen', () => { S.assets = S.assets.filter((a) => a.id !== id); save(); render(); });
  },
  addRec() { recSheet(null); },
  editRec(el) { recSheet(S.recIncomes.find((f) => f.id === el.dataset.id)); },
  saveRec() {
    const name = $('#fName').value.trim(), amount = round2(num($('#fAmount').value));
    if (!name) { toast('Bitte eine Bezeichnung eingeben'); return; }
    if (amount <= 0) { toast('Bitte einen Betrag eingeben'); return; }
    const range = readRange();
    if (!range) { toast('„Gilt bis“ muss nach „Gilt seit“ liegen'); return; }
    const data = { name, amount, interval: +$('#fInterval').value, ...range };
    if (sheetCtx.id) Object.assign(S.recIncomes.find((f) => f.id === sheetCtx.id), data);
    else S.recIncomes.push({ id: uid(), ...data });
    save(); closeSheet(); render(); toast('Feste Einnahme gespeichert');
  },
  toggleRec(el) {
    const f = S.recIncomes.find((x) => x.id === el.dataset.id), cur = dkey(curPeriod());
    if (fixedActive(f, curPeriod())) { f.end = cur; toast(f.name + ' pausiert ab diesem Monat'); } else { f.end = ''; toast(f.name + ' wieder aktiv'); }
    save(); render();
  },
  delRec() {
    const id = sheetCtx.id;
    confirmSheet('Feste Einnahme löschen?', 'Sie verschwindet auch aus vergangenen Monaten. Wenn sie nur ab jetzt wegfällt, nutz lieber den Schalter.', 'Löschen', () => { S.recIncomes = S.recIncomes.filter((f) => f.id !== id); save(); render(); });
  },

  saveSettings() {
    const tax = $('#sTax').value.trim();
    S.settings.taxPct = tax === '' ? (S.settings.taxPct === null ? null : 0) : Math.min(80, Math.max(0, num(tax)));
    S.settings.saveGoal = $('#sSave').value.trim() ? String(round2(num($('#sSave').value))) : '';
    S.settings.varBudget = $('#sBudget').value.trim() ? String(round2(num($('#sBudget').value))) : '';
    const oldSd = sd();
    S.settings.startDay = +$('#sStart').value;
    if (oldSd !== sd()) ui.period = curPeriod();
    save(); closeSheet(); render(); toast('Einstellungen gespeichert');
  },
  export() { download('finanzen-backup-' + today() + '.json', JSON.stringify(S, null, 1), 'application/json'); },
  import() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json,.json';
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      f.text().then((t) => {
        const d = JSON.parse(t);
        if (!d || !Array.isArray(d.expenses) || !Array.isArray(d.incomes) || !Array.isArray(d.fixed)) throw new Error('format');
        d.recIncomes = Array.isArray(d.recIncomes) ? d.recIncomes : [];
        d.assets = Array.isArray(d.assets) ? d.assets : [];
        S = Object.assign(defaultState(), d);
        S.settings = Object.assign(defaultState().settings, S.settings);
        save(); closeSheet(); ui.period = curPeriod(); render(); toast('Backup geladen');
      }).catch(() => toast('Diese Datei ist kein gültiges Backup'));
    };
    inp.click();
  },
  csv() {
    const rows = [['Datum', 'Typ', 'Kategorie', 'Beschreibung', 'Betrag']];
    for (const i of S.incomes) rows.push([i.date, 'Einnahme', '', i.label, String(num(i.amount)).replace('.', ',')]);
    for (const e of S.expenses) rows.push([e.date, 'Ausgabe', catInfo(e.cat)[2], e.note, String(-num(e.amount)).replace('.', ',')]);
    rows.sort((a, b) => (a[0] < b[0] ? -1 : 1));
    const csv = '﻿' + rows.map((r) => r.map((c) => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(';')).join('\n');
    download('finanzen-' + today() + '.csv', csv, 'text/csv');
  },
  wipe() {
    confirmSheet('Alle Daten löschen?', 'Einnahmen, Ausgaben, Fixkosten und Einstellungen werden von diesem Gerät gelöscht. Das lässt sich nicht rückgängig machen.', 'Alles löschen',
      () => { S = defaultState(); ui.period = curPeriod(); save(); render(); toast('Alle Daten gelöscht'); });
  },
};

/* ---------- Events ---------- */

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-a]');
  if (!el || el.disabled) return;
  const fn = ACT[el.dataset.a];
  if (fn) { ev.preventDefault(); fn(el, ev); }
});
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter' && ev.target.id === 'fAmount' && sheetCtx) {
    const map = { expense: 'saveExpense', income: 'saveIncome', fixed: 'saveFixed', asset: 'saveAsset', rec: 'saveRec' };
    if (sheetCtx.kind === 'expense' && !sheetCtx.cat) { ev.target.blur(); return; }
    if (map[sheetCtx.kind]) { ev.preventDefault(); ACT[map[sheetCtx.kind]](); }
  }
});

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2800);
}

/* ---------- Start ---------- */

render();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  // Neue Version übernommen -> einmal neu laden, damit das Update sofort sichtbar ist
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
  navigator.serviceWorker.register('sw.js').then((r) => r.update()).catch(() => {});
}
// Migration beim ersten Start nach dem Update speichern
save();
