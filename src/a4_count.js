
/* ═══════════════════════════════════════════════════════════════
   [Mil-Kit · COUNT] 군별 사용자 수
   - 입영통지서에서 고른 군을 DB(public.milkit_force_count)에 1씩 센다
   - <meta name="counter-api" content="https://…"> 에 API 주소가 있으면 서버 값이 기준(실시간)
   - API가 없을 때: data.js 스냅샷 값 + 이 기기에서 센 수(localStorage 'mine')
     → 처음 화면으로 돌아가거나 새로고침해도 내 입대 수가 사라지지 않는다
   ═══════════════════════════════════════════════════════════════ */
const FORCE_KEYS=['육군','해군','공군','해병','기타'];
const CNT={api:((document.querySelector('meta[name="counter-api"]')||{}).content||'').trim().replace(/\/$/,''),
  base:Object.assign(Object.fromEntries(FORCE_KEYS.map(f=>[f,0])),(window.MK_DATA||{}).counts||{}),
  mine:LS.get('mine',{}),live:false,v:{}};
function recount(){ CNT.v=Object.fromEntries(FORCE_KEYS.map(f=>[f,(+CNT.base[f]||0)+(CNT.live?0:(+CNT.mine[f]||0))])); }
recount();
/* 1,234 → 1.2k · 56,000 → 56k · 1,200,000 → 1.2m */
function kfmt(n){
  n=Math.max(0,+n||0);
  const f=(v,s)=>(v<10?(Math.floor(v*10)/10).toFixed(1).replace(/\.0$/,''):String(Math.floor(v)))+s;
  return n>=1e6?f(n/1e6,'m'):n>=1e3?f(n/1e3,'k'):String(n);
}
const countTotal=()=>Object.values(CNT.v).reduce((a,b)=>a+(+b||0),0);
function refreshCountUI(){
  document.querySelectorAll('[data-cnt]').forEach(el=>{
    const t=kfmt(el.dataset.cnt==='all'?countTotal():CNT.v[el.dataset.cnt]);
    if(el.textContent!==t){el.textContent=t; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');}
  });
}
function takeServer(j){ if(j&&typeof j==='object'){ CNT.base=Object.assign(CNT.base,j); CNT.live=true; CNT.mine={}; LS.set('mine',{}); recount(); refreshCountUI(); } }
async function loadCounts(){
  if(!CNT.api) return;
  try{ const r=await fetch(CNT.api+'/counts',{cache:'no-store'}); if(r.ok) takeServer(await r.json()); }catch(e){}
}
function hitForce(f){
  if(!CNT.api||!CNT.live){ CNT.mine[f]=(+CNT.mine[f]||0)+1; LS.set('mine',CNT.mine); }
  recount(); if(CNT.live) CNT.v[f]++; refreshCountUI();
  if(!CNT.api) return;
  fetch(CNT.api+'/hit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({force:f}),keepalive:true})
    .then(r=>r.ok?r.json():null).then(takeServer).catch(()=>{});
}
/* 군별 카운트 띠 — 숫자를 누르면 그 군 롤링페이퍼 · sm: 작은 크기(내 군 강조) */
function countStrip(sm){
  return `<div class="cstrip ${sm?'sm':''}">${FORCE5.map(f=>`<button class="${sm&&S.force===f.n?'me':''}" data-paper="${f.n}" aria-label="${f.n} 롤링페이퍼"><i>${f.i}</i><em>${f.n}</em><b data-cnt="${f.n}">${kfmt(CNT.v[f.n])}</b></button>`).join('')}</div>`;
}
const countLine=()=>S.force?`벌써 ${S.force} ${kfmt(CNT.v[S.force])}명이 요리했어요 🔥`:`벌써 ${kfmt(countTotal())}명이 요리했어요 🔥`;
