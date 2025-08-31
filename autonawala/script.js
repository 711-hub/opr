
function buildDirectUrl(domain){
  return 'https://check.skiddle.id/?domain=' + encodeURIComponent(domain) + '&json=true';
}
const MAX_CONCURRENT = 8;        
const REQ_TIMEOUT    = 12000;   
const USE_PROXY      = true;     

const $ = sel => document.querySelector(sel);
function nowStr(){ return new Date().toLocaleString(); }
function clampInt(v,min,max){ return Math.max(min, Math.min(max, Math.floor(v))); }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function normalizeDomain(input){
  if (!input) return null;
  let s = String(input).trim();
  if (!s) return null;
  try {
    if (/^https?:\/\//i.test(s) || /^\/\//.test(s)) { const u = new URL(s.startsWith('//') ? 'http:'+s : s); s = u.hostname; }
  } catch {}
  s = s.replace(/:\d+$/,'').replace(/\.$/,'').toLowerCase();
  if (!/^[a-z0-9.-]+$/.test(s)) return null;
  if (!s.includes('.') && !['localhost'].includes(s)) return null;
  return s.replace(/^\*\./,'');
}
function limitedParallel(execs, limit){
  return new Promise((resolve) => {
    let i = 0, active = 0, done = 0;
    const results = new Array(execs.length);
    const tick = () => {
      while (active < limit && i < execs.length) {
        const idx = i++, fn = execs[idx]; active++;
        fn().then(r=>results[idx]=r).catch(e=>results[idx]={error:String(e)})
          .finally(()=>{ active--; done++; (done===execs.length)?resolve(results):tick(); });
      }
    };
    tick();
  });
}


const elUrls = $('#urls'), elInterval = $('#interval'), elSaveList = $('#saveList');
const elStart = $('#start'), elStop = $('#stop'), elReset = $('#reset');
const elApiLabel = $('#apiLabel'), elStatusRun = $('#statusRun');
const elStatTotal = $('#statTotal'), elStatOk = $('#statOk'), elStatBad = $('#statBad'), elStatLast = $('#statLast');
const tblAll = document.querySelector('#tblAll tbody');
const tblBlocked = document.querySelector('#tblBlocked tbody');

let CHECK_TIMER = null;
let LIST = [];
let MAP = new Map();        
let BLOCKED_MAP = new Map(); 


if (elApiLabel) elApiLabel.textContent = 'https://check.skiddle.id/?domain={domain}&json=true';

const store = {
  load(){ try{ return JSON.parse(localStorage.getItem('acb-data')) || {list:[],interval:30}; }catch{ return {list:[],interval:30}; } },
  save(v){ localStorage.setItem('acb-data', JSON.stringify(v)); }
};

function renderAllTable(){
  tblAll.innerHTML = '';
  let i=1, rows=[];
  for (const d of LIST){
    const m = MAP.get(d) || {};
    const status = m.blocked===true ? `<span class="bad">Terblokir</span>` :
                   m.blocked===false ? `<span class="ok">Link Aman</span>` :
                                       `<span class="warn">Belum dicek</span>`;
    rows.push(`<tr>
      <td class="mono">${i++}</td>
      <td class="mono">${escapeHtml(d)}</td>
      <td>${status}</td>
      <td class="small mono">${m.source?escapeHtml(m.source):'-'}</td>
      <td class="small">${m.reason?escapeHtml(m.reason):'-'}</td>
      <td class="small">${m.lastCheck||'-'}</td>
    </tr>`);
  }
  tblAll.innerHTML = rows.join('');
}
function renderBlockedTable(){
  tblBlocked.innerHTML = '';
  let i=1, rows=[];
  for (const [d,info] of BLOCKED_MAP){
    rows.push(`<tr>
      <td class="mono">${i++}</td>
      <td class="mono">${escapeHtml(d)}</td>
      <td class="small">${info.source?escapeHtml(info.source):'-'}</td>
      <td class="small">${info.reason?escapeHtml(info.reason):'-'}</td>
      <td class="small">${info.since||'-'}</td>
    </tr>`);
  }
  tblBlocked.innerHTML = rows.join('');
}
function renderStats(){
  if (elStatTotal) elStatTotal.textContent = LIST.length;
  let ok=0,bad=0;
  for (const d of LIST){
    const m = MAP.get(d); if (!m) continue;
    if (m.blocked===true) bad++; else if (m.blocked===false) ok++;
  }
  if (elStatOk) elStatOk.textContent = ok;
  if (elStatBad) elStatBad.textContent = bad;
}
async function fetchJsonWithFallback(directUrl){
  try {
    const r = await fetchWithTimeout(directUrl);
    return await r.json();
  } catch(e){  }

  try {
    const url = 'https://corsproxy.io/?' + encodeURIComponent(directUrl);
    const r = await fetchWithTimeout(url);
    return await r.json();
  } catch(e){}

  try {
    const url = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(directUrl);
    const r = await fetchWithTimeout(url);
    return await r.json();
  } catch(e){}

 
  const u = 'https://api.allorigins.win/get?url=' + encodeURIComponent(directUrl) + '&cache=' + Date.now();
  const rr = await fetchWithTimeout(u);
  const box = await rr.json(); 
  try { return JSON.parse(box.contents); }
  catch(e){ throw new Error('Proxy returned non-JSON'); }
}

function fetchWithTimeout(url){
  const controller = new AbortController();
  const t = setTimeout(()=>controller.abort(), REQ_TIMEOUT);
  return fetch(url, { signal: controller.signal }).finally(()=>clearTimeout(t));
}

async function checkOne(domain){
  const url = buildDirectUrl(domain);
  const data = USE_PROXY ? await fetchJsonWithFallback(url)
                         : await (await fetchWithTimeout(url)).json();
  
  const key = Object.keys(data)[0] || domain;
  const isBlocked = !!(data[key] && data[key].blocked === true);
  return { blocked: isBlocked, raw: data, source: 'skiddle' };
}


async function runCheckAll(){
  if (LIST.length === 0) return;
  if (elStatLast) elStatLast.textContent = nowStr();

  const jobs = LIST.map(d => async ()=>{
    try{
      const got = await checkOne(d);
      const ts = nowStr();
      MAP.set(d, { blocked: got.blocked, source: got.source, reason: '', lastCheck: ts, raw: got.raw });
      if (got.blocked){
        if (!BLOCKED_MAP.has(d)) BLOCKED_MAP.set(d, { since: ts, source: got.source, reason: '' });
      } else {
        if (BLOCKED_MAP.has(d)) BLOCKED_MAP.delete(d);
      }
    }catch(e){
      MAP.set(d, { blocked: null, source: 'error', reason: String(e?.message || e), lastCheck: nowStr() });
    }
  });

  await limitedParallel(jobs, MAX_CONCURRENT);
  renderAllTable(); renderBlockedTable(); renderStats();
}

function readListFromTextarea(){
  const lines = elUrls.value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const set = new Set();
  for (const line of lines){ const d = normalizeDomain(line); if (d) set.add(d); }
  LIST = Array.from(set).slice(0,200);
}
function fillTextareaFromList(){ elUrls.value = LIST.join('\n'); }
function saveState(){ store.save({ list: LIST, interval: clampInt(+elInterval.value||30,5,600) }); }
function loadState(){
  const { list, interval } = store.load();
  LIST = Array.isArray(list)?list:[];
  elInterval.value = interval || 30;
  fillTextareaFromList();
  renderAllTable(); renderBlockedTable(); renderStats();
}
function startLoop(){
  if (LIST.length===0){ readListFromTextarea(); saveState(); }
  if (LIST.length===0){ alert('Daftar domain kosong. Isi textarea lalu Simpan.'); return; }
  const sec = clampInt(+elInterval.value||30,5,600);
  elInterval.value = sec; saveState();
  if (CHECK_TIMER) clearInterval(CHECK_TIMER);
  CHECK_TIMER = setInterval(runCheckAll, sec*1000);
  runCheckAll();
  elStatusRun.textContent = `Status: berjalan (setiap ${sec} dtk)`;
  elStatusRun.classList.remove('warn'); elStatusRun.classList.add('ok');
}
function stopLoop(){
  if (CHECK_TIMER) clearInterval(CHECK_TIMER);
  CHECK_TIMER = null;
  elStatusRun.textContent = 'Status: berhenti';
  elStatusRun.classList.remove('ok'); elStatusRun.classList.add('warn');
}
function resetAll(){
  stopLoop();
  LIST = []; MAP.clear(); BLOCKED_MAP.clear();
  try{ localStorage.removeItem('acb-data'); }catch{}
  elUrls.value = ''; elInterval.value = 30;
  if (elStatTotal) elStatTotal.textContent = 0;
  if (elStatOk) elStatOk.textContent = 0;
  if (elStatBad) elStatBad.textContent = 0;
  if (elStatLast) elStatLast.textContent = '-';
  tblAll.innerHTML = ''; tblBlocked.innerHTML = '';
  elStatusRun.textContent = 'Status: berhenti';
  elStatusRun.classList.remove('ok'); elStatusRun.classList.add('warn');
}

elSaveList.addEventListener('click', ()=>{ readListFromTextarea(); saveState(); renderAllTable(); renderBlockedTable(); renderStats(); });
elStart.addEventListener('click', startLoop);
elStop.addEventListener('click', stopLoop);
elReset.addEventListener('click', ()=>{ if (confirm('Hapus semua daftar & reset dari awal?')) resetAll(); });

loadState();
stopLoop();