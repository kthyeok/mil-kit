
/* ═══════════════════════════════════════════════════════════════
   [Mil-Kit · PAPER] 군별 롤링페이퍼 (public.milkit_rolling_paper)
   - 통계 숫자([data-paper])를 누르면 그 군의 롤링페이퍼가 열린다
   - API가 있으면 서버에 저장·조회, 없으면 data.js 스냅샷 + 이 기기에 남긴 글
   ═══════════════════════════════════════════════════════════════ */
const PAPER={local:LS.get('papers',[]),cache:{}};
const PAPER_BAD=/씨발|시발|ㅅㅂ|ㅆㅂ|병신|ㅂㅅ|개새|좆|존나|지랄|꺼져|닥쳐|느금|fuck|shit/gi;
const PAPER_LINK=/https?:|www\.|\.(com|net|kr|io|me|ly)\b/i;
const NOTE_C=['#FFF4B8','#FFDDE4','#D9EEFF','#DDF6E4','#EEE5FF','#FFE8CC'];
const paperClean=(v,max)=>String(v||'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max).replace(PAPER_BAD,m=>'*'.repeat(m.length));
function ago(t){
  const s=Math.max(0,(Date.now()-new Date(t).getTime())/1000);
  return s<60?'방금':s<3600?`${Math.floor(s/60)}분 전`:s<86400?`${Math.floor(s/3600)}시간 전`:s<86400*30?`${Math.floor(s/86400)}일 전`:new Date(t).toLocaleDateString('ko-KR');
}
async function loadPapers(f){
  if(CNT.api){
    try{ const r=await fetch(`${CNT.api}/papers?force=${encodeURIComponent(f)}&limit=40`,{cache:'no-store'});
      if(r.ok){ PAPER.cache[f]=await r.json(); return {list:PAPER.cache[f],live:true}; } }catch(e){}
  }
  const snap=((window.MK_DATA||{}).papers||{})[f]||[];
  const mine=PAPER.local.filter(p=>p.force===f);
  return {list:[...mine,...snap].sort((a,b)=>new Date(b.at)-new Date(a.at)),live:false};
}
function noteHtml(p,i){
  const c=NOTE_C[Math.abs((p.id||i)*7+(p.msg||'').length)%NOTE_C.length], rot=((p.id||i)%5-2)*1.1;
  return `<div class="note ${p.mine?'mine':''}" style="--c:${c};--r:${rot}deg"><p>${esc(p.msg)}</p><span>— ${esc(p.name||'익명의 예비역')}<em>${ago(p.at)}</em></span></div>`;
}
/* 저장: API가 있으면 DB, 아니면 이 기기 — 저장된 글을 돌려준다 */
async function postPaper(f,name,msg){
  let saved=null;
  if(CNT.api){ try{ const r=await fetch(CNT.api+'/papers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({force:f,name,msg})});
      if(r.ok) saved=await r.json(); else if(r.status===429) toast('잠시 후 다시 남겨주세요'); }catch(e){} }
  if(!saved){ saved={id:Date.now(),name,msg,at:new Date().toISOString(),force:f,local:true}; PAPER.local.unshift(saved); PAPER.local=PAPER.local.slice(0,50); LS.set('papers',PAPER.local); }
  saved.mine=true; return saved;
}
async function openPapers(f){
  haptic();
  if(!FORCE_KEYS.includes(f)) f=S.force||'육군';
  openSheet(`<div class="pph"><h3>📜 ${f} 롤링페이퍼</h3><span>${f} <b data-cnt="${f}">${kfmt(CNT.v[f])}</b>명이 요리했어요</span></div>
    <div class="ppseg">${FORCE5.map(x=>`<button class="${x.n===f?'on':''}" data-pf="${x.n}">${x.i} ${x.n}</button>`).join('')}</div>
    <div class="pplist" id="ppl"><div class="ppload">불러오는 중…</div></div>
    <div class="ppw"><input class="inp" id="ppn" maxlength="12" placeholder="닉네임 (선택)">
      <div class="ppbox"><textarea id="ppm" maxlength="80" rows="2" placeholder="${f} 전우들에게 한마디 (80자)"></textarea><b id="ppc">0/80</b></div>
      <button class="btn sm" id="ppgo">✍️ ${f} 롤링페이퍼에 남기기</button>
      <p class="fine" id="ppnote"></p></div>`,async sh=>{
    sh.querySelectorAll('[data-pf]').forEach(b=>b.onclick=()=>openPapers(b.dataset.pf));
    $('ppm').oninput=e=>{$('ppc').textContent=`${e.target.value.length}/80`;};
    const {list,live}=await loadPapers(f);
    if(!$('ppl')) return;
    $('ppl').innerHTML=list.length?list.map(noteHtml).join(''):`<div class="ppempty"><span>📝</span><b>아직 ${f} 롤링페이퍼가 비어 있어요</b><small>첫 번째 한마디를 남겨보세요</small></div>`;
    $('ppnote').textContent=live?'남긴 글은 모두에게 보여요. 욕설은 가려지고 링크는 남길 수 없어요.'
      :CNT.api?'서버에 연결하지 못해 이 기기에만 저장돼요.':'아직 서버(API)가 연결되지 않아 이 기기에만 저장돼요.';
    $('ppgo').onclick=async()=>{
      const msg=paperClean($('ppm').value,80), name=paperClean($('ppn').value,12);
      if(msg.length<2){toast('두 글자 이상 적어주세요');return;}
      if(PAPER_LINK.test(msg+name)){toast('링크는 남길 수 없어요');return;}
      haptic(); $('ppgo').disabled=true;
      const saved=await postPaper(f,name,msg);
      const box=$('ppl'); if(!box) return;
      if(box.querySelector('.ppempty')) box.innerHTML='';
      box.insertAdjacentHTML('afterbegin',noteHtml(saved,0)); box.scrollTop=0;
      $('ppm').value=''; $('ppc').textContent='0/80'; $('ppgo').disabled=false;
      if(typeof party==='function') party('small');
      toast(saved.local?'이 기기에 남겼어요':'롤링페이퍼에 남겼어요');
    };
  });
}
/* 통계 숫자 어디서든 누르면 롤링페이퍼 (타일 선택보다 먼저 가로챈다) */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-paper]'); if(!el) return;
  e.preventDefault(); e.stopPropagation(); openPapers(el.dataset.paper);
},true);
