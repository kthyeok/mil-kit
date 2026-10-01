
/* ═══════════════════════════════════════════════════════════════
   [Mil-Kit · COUNT] 군별 사용자 수
   - 입영통지서에서 고른 군을 DB(public.milkit_force_count)에 1씩 센다
   - <meta name="counter-api" content="https://…"> 에 카운터 API 주소가 있으면 실시간,
     없으면 data.js 스냅샷에 담긴 값(+ 이 기기에서 방금 센 1)을 보여준다
   ═══════════════════════════════════════════════════════════════ */
const CNT={api:((document.querySelector('meta[name="counter-api"]')||{}).content||'').trim().replace(/\/$/,''),
  v:Object.assign({육군:0,해군:0,공군:0,해병:0,기타:0},(window.MK_DATA||{}).counts||{}),live:false};
/* 1,234 → 1.2k · 56,000 → 56k · 1,200,000 → 1.2m */
function kfmt(n){
  n=Math.max(0,+n||0);
  const f=(v,s)=>(v<10?(Math.floor(v*10)/10).toFixed(1).replace(/\.0$/,''):String(Math.floor(v)))+s;
  return n>=1e6?f(n/1e6,'m'):n>=1e3?f(n/1e3,'k'):String(n);
}
const countTotal=()=>Object.values(CNT.v).reduce((a,b)=>a+(+b||0),0);
function refreshCountUI(){
  document.querySelectorAll('[data-cnt]').forEach(el=>{
    const v=el.dataset.cnt==='all'?countTotal():CNT.v[el.dataset.cnt];
    if(el.textContent!==kfmt(v)){el.textContent=kfmt(v); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');}
  });
}
async function loadCounts(){
  if(!CNT.api) return;
  try{ const r=await fetch(CNT.api+'/counts',{cache:'no-store'}); if(r.ok){Object.assign(CNT.v,await r.json()); CNT.live=true; refreshCountUI();} }catch(e){}
}
function hitForce(f){
  CNT.v[f]=(+CNT.v[f]||0)+1; refreshCountUI();
  if(!CNT.api) return;
  fetch(CNT.api+'/hit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({force:f}),keepalive:true})
    .then(r=>r.ok?r.json():null).then(j=>{if(j){Object.assign(CNT.v,j); CNT.live=true; refreshCountUI();}}).catch(()=>{});
}
/* 군별 카운트 띠 — sm: 작은 크기 · 내 군 강조 */
function countStrip(sm){
  return `<div class="cstrip ${sm?'sm':''}">${FORCE5.map(f=>`<span class="${sm&&S.force===f.n?'me':''}"><i>${f.i}</i><em>${f.n}</em><b data-cnt="${f.n}">${kfmt(CNT.v[f.n])}</b></span>`).join('')}</div>`;
}
const countLine=()=>S.force?`벌써 ${S.force} ${kfmt(CNT.v[S.force])}명이 요리했어요 🔥`:`벌써 ${kfmt(countTotal())}명이 요리했어요 🔥`;
