
/* ═══════════════════════════════════════════════════════════════
   [Mil-Kit v5 · CARD] 전역카드 · 명함 · 선후임 공유(도전장)
   이름·연락처는 명함 그리기에만 쓰이고 저장·전송되지 않는다.
   ═══════════════════════════════════════════════════════════════ */
const CARD={kind:'dis',name:'',tel:''};

/* 도전장 링크: #ch=<{f,m,w}> — 군·메뉴·관계만 담는다 */
const CH=(()=>{try{const m=location.hash.match(/ch=([^&]+)/); if(!m) return null;
  const o=JSON.parse(decodeURIComponent(m[1])); const s=v=>String(v||'').slice(0,20);
  return (o&&o.m)?{f:s(o.f),m:s(o.m),w:['선임','후임','동기'].includes(o.w)?o.w:'동기'}:null;}catch(e){return null;}})();

function resMenu(){ const R=S.res, top=R&&R.posts[0]; return top?(top.job?top.job[2]:top.title):'맞춤 공고'; }
function courseField(){ const R=S.res; return (S.ans.qnField||[])[0]||(R&&R.certs[0]&&R.certs[0].it.obligfldcd); }
function courseItems(){
  const R=S.res, field=courseField();
  return ['05','04','03'].map(sc=>(R?R.certs.map(c=>c.it):[]).find(x=>x.obligfldcd===field&&x.seriescd===sc)||QNET_ITEMS.find(x=>x.obligfldcd===field&&x.seriescd===sc))
    .filter(Boolean).slice(0,3);
}
const COURSE=[['🥗','애피타이저'],['🍖','메인'],['🍰','디저트']];

function rrect(c,x,y,w,h,r){ c.beginPath(); if(c.roundRect){c.roundRect(x,y,w,h,r);return;}
  c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath(); }
function cut(s,n){ s=String(s); return s.length>n?s.slice(0,n-1)+'…':s; }

/* ── 전역카드 (세로 300×420) ── */
function drawDischarge(x){
  const W=300,H=420,t=fth(), menu=resMenu(), co=courseItems();
  const T=(s,w,sz,c,px,py,al='center',mw)=>{x.font=`${w} ${sz}px ${KFONT}`;x.fillStyle=c;x.textAlign=al;x.fillText(String(s),px,py,mw||W-36);};
  x.save(); rrect(x,0,0,W,H,18); x.clip();
  const g=x.createLinearGradient(0,0,W,H); g.addColorStop(0,t.c1); g.addColorStop(1,t.c2); x.fillStyle=g; x.fillRect(0,0,W,H);
  x.globalAlpha=.06; x.fillStyle='#fff'; for(let i=-H;i<W;i+=18){x.beginPath();x.moveTo(i,0);x.lineTo(i+8,0);x.lineTo(i+8+H,H);x.lineTo(i+H,H);x.fill();} x.globalAlpha=1;
  T('MIL-KIT','900',10,t.acc,18,26,'left'); T('DEMO','800',9,'rgba(255,255,255,.5)',W-18,26,'right');
  T('전 역 증','900',22,'#fff',W/2,58); T(`${S.force} · 병장 만기전역`,'700',11.5,'rgba(255,255,255,.75)',W/2,77);
  x.fillStyle='rgba(255,255,255,.12)'; rrect(x,W/2-68,90,136,150,18); x.fill();
  x.save(); x.translate(W/2-56,98); x.imageSmoothingEnabled=false; paint(x,2.5,0); x.restore();
  T(CARD.name.trim()||'병장 ○○○','900',22,'#fff',W/2,270);
  T(`${mosLabel()} · 복무 ${months()}개월`,'600',12,'rgba(255,255,255,.8)',W/2,290);
  x.fillStyle='rgba(255,255,255,.2)'; x.fillRect(24,304,W-48,1);
  T('오늘의 메뉴','800',10,t.acc,W/2,324); T(`${menu} 정식`,'900',18,'#fff',W/2,346);
  const cw=(W-36-12)/3;
  co.forEach((it,i)=>{const bx=18+i*(cw+6); x.fillStyle='rgba(255,255,255,.14)'; rrect(x,bx,360,cw,36,9); x.fill();
    T(`${COURSE[i][0]} ${COURSE[i][1]}`,'700',8.5,'rgba(255,255,255,.7)',bx+cw/2,374,'center',cw-6);
    T(cut(it.jmfldnm,9),'800',9.5,'#fff',bx+cw/2,389,'center',cw-6);});
  T(`${new Date().toLocaleDateString('ko-KR')} · 부대명·임무 정보는 담지 않아요`,'600',8.5,'rgba(255,255,255,.45)',W/2,H-10);
  x.restore();
}
/* ── 명함 (가로 450×260) ── */
function drawNamecard(x){
  const W=450,H=260,t=fth(), menu=resMenu(), co=courseItems();
  const T=(s,w,sz,c,px,py,al='left',mw)=>{x.font=`${w} ${sz}px ${KFONT}`;x.fillStyle=c;x.textAlign=al;x.fillText(String(s),px,py,mw||270);};
  x.save(); rrect(x,0,0,W,H,14); x.clip(); x.fillStyle='#fff'; x.fillRect(0,0,W,H);
  x.fillStyle=t.c2; x.fillRect(0,0,10,H);
  T(`희망 직무 · ${menu}`,'800',15,'#191F28',34,46); x.fillStyle=t.c2; x.fillRect(34,56,26,3);
  T(`${S.force} ${mosLabel()} 출신 · 병장 만기전역`,'600',11.5,'#8B95A1',34,78);
  T(CARD.name.trim()||'홍길동','800',34,'#191F28',34,132);
  T(co.length?`준비 자격 ${co.slice(0,2).map(c=>c.jmfldnm).join(' → ')}`:'자격 준비 중','700',12.5,t.c2,34,156,'left',280);
  x.fillStyle='#E5E8EB'; x.fillRect(34,172,230,1);
  T('M.','800',11,t.c2,34,196); T(CARD.tel.trim()||'010-0000-0000','600',12.5,'#4E5968',54,196);
  T('S.','800',11,t.c2,34,216); T(`${months()}개월 복무 · ${S.major||''} 전공`,'600',12.5,'#4E5968',54,216);
  T('Mil-Kit · Your Next Step','700',10,'#B0B8C1',34,240);
  x.fillStyle='#F2F4F6'; rrect(x,W-136,34,104,132,14); x.fill();
  x.save(); x.translate(W-129,42); x.imageSmoothingEnabled=false; paint(x,2,0); x.restore();
  T('DEMO','800',9,'#C4CAD1',W-26,H-18,'right');
  x.restore(); x.strokeStyle='#E5E8EB'; x.lineWidth=1; rrect(x,.5,.5,W-1,H-1,14); x.stroke();
}
const CARD_DIM={dis:[300,420,drawDischarge],nc:[450,260,drawNamecard]};
function renderCard(cv,k,cssW){
  const [W,H,fn]=CARD_DIM[k], s=cssW/W, d=Math.min(4,(window.devicePixelRatio||1)*s);
  cv.width=Math.round(W*d); cv.height=Math.round(H*d); cv.style.width=Math.round(W*s)+'px'; cv.style.height=Math.round(H*s)+'px';
  const x=cv.getContext('2d'); x.setTransform(d,0,0,d,0,0); x.clearRect(0,0,W,H); fn(x);
}
function cardFile(k){
  const cv=document.createElement('canvas'), [W]=CARD_DIM[k]; renderCard(cv,k,W*3/((window.devicePixelRatio||1)));
  return new Promise(r=>cv.toBlob(b=>r(b?new File([b],k==='dis'?'Mil-Kit_전역카드.png':'Mil-Kit_명함.png',{type:'image/png'}):null),'image/png'));
}
/* 공유는 '클릭 순간'에 바로 호출해야 한다 (iOS Safari는 await 뒤 share()를 막는다).
   그래서 이미지 파일은 시트를 열 때 미리 만들어 둔다. */
const SHARE={file:{}};
function prepCard(k){ SHARE.file[k]=null; cardFile(k).then(f=>{SHARE.file[k]=f;}); }
function canShareFile(f){ try{return !!(f&&navigator.canShare&&navigator.canShare({files:[f]}));}catch(e){return false;} }
function downloadFile(f){
  try{ const a=document.createElement('a'); a.download=f.name; a.href=URL.createObjectURL(f); document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),4000); toast('이미지를 저장했어요'); }catch(e){ toast('이 환경에서는 저장이 막혀 있어요'); }
}
function shareCardImage(k,text){
  haptic();
  const f=SHARE.file[k];
  if(!f){toast('이미지를 준비 중이에요. 잠시 후 다시 눌러주세요');prepCard(k);return;}
  if(canShareFile(f)){ navigator.share(text?{files:[f],text}:{files:[f]}).catch(e=>{if(e&&e.name!=='AbortError') downloadFile(f);}); return; }
  downloadFile(f);
}
function copyText(t,msg){
  const ok=()=>toast(msg||'복사했어요');
  const legacy=()=>{try{const ta=document.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;opacity:0';
    document.body.appendChild(ta);ta.select();const r=document.execCommand('copy');ta.remove();r?ok():toast('복사가 막혀 있어요 · 길게 눌러 복사해 주세요');}
    catch(e){toast('복사가 막혀 있어요');}};
  if(navigator.clipboard&&window.isSecureContext) navigator.clipboard.writeText(t).then(ok,legacy); else legacy();
}

/* ── 카드 시트 (요약 '오늘의 메뉴' 옆 아이콘) ── */
function openCardSheet(k){
  haptic(); CARD.kind=k;
  openSheet(`<h3>${k==='dis'?'🎖️ 전역카드':'🪪 명함'}</h3>
    <div class="seg mini" style="margin-top:8px"><button class="${k==='dis'?'on':''}" data-ck="dis">전역카드</button><button class="${k==='nc'?'on':''}" data-ck="nc">명함</button></div>
    <div class="cvbox sh" id="cvbox"><canvas id="cardCv"></canvas></div>
    <div class="ncin"><input class="inp" id="ncName" maxlength="10" placeholder="이름 (카드에만 표시)" value="${esc(CARD.name)}">
      ${k==='nc'?`<input class="inp" id="ncTel" maxlength="13" inputmode="tel" placeholder="연락처 (선택)" value="${esc(CARD.tel)}">`:''}</div>
    <p class="fine" style="margin:6px 0 0">이름·연락처는 카드 그리기에만 쓰이고 저장·전송되지 않아요.</p>
    <div class="sfoot"><button class="btn sub sm" id="cvSave">🖼️ 저장·공유</button><button class="btn sm" id="cvInv">📤 선후임에게 보내기</button></div>`,sh=>{
    const box=$('cvbox'), [W,H]=CARD_DIM[k];
    const draw=()=>{const bw=box.clientWidth-8, bh=k==='dis'?Math.min(innerHeight*0.44,bw*H/W):bw*H/W;
      box.style.height=Math.round(bh+8)+'px'; renderCard($('cardCv'),k,Math.min(bw,bh*W/H));};
    requestAnimationFrame(draw); prepCard(k);
    sh.querySelectorAll('[data-ck]').forEach(b=>b.onclick=()=>{if(b.dataset.ck!==k) openCardSheet(b.dataset.ck);});
    let pt=0; const re=()=>{clearTimeout(pt);pt=setTimeout(()=>prepCard(k),350);};
    $('ncName').oninput=e=>{CARD.name=e.target.value;draw();re();};
    if($('ncTel')) $('ncTel').oninput=e=>{CARD.tel=e.target.value;draw();re();};
    $('cvSave').onclick=()=>shareCardImage(k);
    $('cvInv').onclick=()=>openInvite();
  });
}

/* ── 선후임에게 공유하기 (카카오톡 · 이미지 · 링크) ── */
const SITE_URL='https://kthyeok.github.io/mil-kit/';
const OG_IMAGE=SITE_URL+'og.png';
function kakaoKey(){ const m=document.querySelector('meta[name="kakao-js-key"]'); return m?m.content.trim():''; }
function kakaoReady(){
  const key=kakaoKey(); if(!key||!window.Kakao) return false;
  try{ if(!Kakao.isInitialized()) Kakao.init(key); return Kakao.isInitialized()&&!!Kakao.Share; }catch(e){ return false; }
}
function inviteText(to){
  const menu=resMenu(), me=`${S.force} ${mosLabel()}`;
  return {
    '후임':`야, 내 군생활(${me}) 요리해봤더니 "${menu} 정식" 나왔다 🍳\n너도 해봐. 뭐 나오는지 보자.`,
    '선임':`선임님! 제 군생활 요리해봤더니 "${menu} 정식" 나왔습니다 🫡\n선임님은 무슨 메뉴 나오실지 궁금합니다. 한번 해보십시오!`,
    '동기':`동기야 이거 해봐 ㅋㅋ 나 "${menu} 정식" 나옴 🍳\n너는 뭐 나오는지 보자!`}[to];
}
const FROM={'후임':'선임','선임':'후임','동기':'동기'};   // 받는 사람 입장에서 보낸 사람
function inviteUrl(to){
  const base=/^https?:/.test(location.protocol)?location.href.split('#')[0]:SITE_URL;
  return base+'#ch='+encodeURIComponent(JSON.stringify({f:S.force,m:resMenu(),w:FROM[to]}));
}
const KAKAO_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#191919" d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.9 5.2 4.7 6.6l-1 3.6c-.1.3.3.6.6.4l4.2-2.8c.5.1 1 .1 1.5.1 5.5 0 10-3.5 10-7.9S17.5 3 12 3z"/></svg>';
function sendKakao(to){
  const u=inviteUrl(to);
  /* ① 카카오 JavaScript 키가 있으면: 카카오톡 공유 카드 */
  if(kakaoReady()){
    try{
      Kakao.Share.sendDefault({objectType:'feed',
        content:{title:`🍳 ${resMenu()} 정식이 나왔어요!`,description:`${FROM[to]}이 보낸 도전장 · 당신의 군생활을 요리해 드립니다`,
          imageUrl:OG_IMAGE,imageWidth:1200,imageHeight:630,link:{mobileWebUrl:u,webUrl:u}},
        buttons:[{title:'나도 요리해 보기',link:{mobileWebUrl:u,webUrl:u}}]});
      return;
    }catch(e){}
  }
  /* ② 휴대폰 공유창 — 카카오톡을 고르면 문구 + 링크 미리보기 카드가 간다 */
  if(navigator.share){
    navigator.share({title:'Mil-Kit · 당신의 군생활을 요리해 드립니다',text:inviteText(to),url:u})
      .catch(e=>{if(e&&e.name!=='AbortError') copyText(inviteText(to)+'\n'+u,'복사했어요 · 카카오톡 대화창에 붙여넣어 주세요');});
    return;
  }
  /* ③ PC — 복사해서 붙여넣기 */
  copyText(inviteText(to)+'\n'+u,'복사했어요 · 카카오톡 대화창에 붙여넣어 주세요');
}
function openInvite(){
  haptic();
  let to='후임';
  prepCard('dis');
  const kk=kakaoReady();
  openSheet(`<h3>선후임에게 공유하기</h3><p class="sub" style="margin:4px 0 10px">링크를 받은 사람도 바로 요리해 볼 수 있어요</p>
    <div class="seg" id="toSeg">${['후임','선임','동기'].map(w=>`<button data-w="${w}" class="${w===to?'on':''}">${w}에게</button>`).join('')}</div>
    <div class="invmsg"><span class="ivh">💬 미리보기</span><p id="ivTxt"></p>
      <div class="ivcard"><img src="og.png" alt="" onerror="this.remove()"><b>🍳 Mil-Kit</b><span>당신의 군생활을 요리해 드립니다</span></div></div>
    <p class="fine" id="ivNote">${kk?'카카오톡 공유 카드로 보내요.':navigator.share?'공유 창에서 <b>카카오톡</b>을 골라주세요. 링크 미리보기 카드가 함께 가요.':'PC에서는 문구와 링크를 복사해요. 카카오톡 대화창에 붙여넣어 주세요.'}
      받는 사람 화면에 도전장이 떠요(군·메뉴만 담겨요).</p>
    <button class="btn kakao" id="ivKakao">${KAKAO_ICON} 카카오톡으로 보내기</button>
    <div class="shrow"><button class="btn sub sm" id="ivImg">🖼️ 전역카드 이미지</button><button class="btn sub sm" id="ivCopy">🔗 링크 복사</button></div>`,sh=>{
    const sync=()=>{$('ivTxt').textContent=inviteText(to);};
    sync();
    sh.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{haptic();to=b.dataset.w;sh.querySelectorAll('[data-w]').forEach(x=>x.classList.toggle('on',x===b));sync();});
    $('ivKakao').onclick=()=>{haptic();sendKakao(to);};
    $('ivImg').onclick=()=>shareCardImage('dis',inviteText(to)+'\n'+inviteUrl(to));
    $('ivCopy').onclick=()=>{haptic();copyText(inviteText(to)+'\n'+inviteUrl(to),'문구와 링크를 복사했어요');};
  });
}
