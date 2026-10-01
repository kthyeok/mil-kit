
/* ═══════════════════════════════════════════════════════════════
   [Mil-Kit v5 · APP] 병사 전용 · 진급 이벤트로 API 조건 수집 → 잡코리아 + Q-Net
   흐름: 스플래시 → 입대(군) → 신상명세서(학력·전공) → 자대배치(주특기)
        → 이병·일병·상병·병장 이벤트 → 진급 → 요리(API 호출) → 결과 · 카드 · 공유
   ═══════════════════════════════════════════════════════════════ */
const S={scr:'splash',force:null,mos:null,edu:null,major:null,hs:null,
  stats:{str:0,tech:0,lead:0,dili:0,comm:0},items:new Set(['cap']),ans:{},si:0,ei:0,rk:0,hist:[],
  svc:'soldier',pickJob:null,mosQ:'',mosCat:'전체',mosPage:0,res:null,tab:'sum',page:0,lastGain:{}};
const fam=()=>S.mos?S.mos.직군:null;
const rankIdx=()=>S.rk;
const months=()=>(DS_SERVICE.find(x=>x.군별===S.force)||{}).복무기간_개월||18;
const EV_ALL=RANK5.flatMap(r=>EVENTS[r].map(e=>({...e,rank:r})));
const STEPS_TOTAL=3+EV_ALL.length+RANK5.length+1;

/* ── 진행률 ── */
function stepNo(){
  if(S.scr==='force') return 1; if(S.scr==='form') return 2; if(S.scr==='mos') return 3;
  const done=RANK5.slice(0,S.si).reduce((a,r)=>a+EVENTS[r].length+1,0);
  if(S.scr==='ev') return 3+done+S.ei+1;
  if(S.scr==='promo') return 3+done+EVENTS[RANK5[S.si]].length+1;
  return STEPS_TOTAL;
}
function render(){
  document.documentElement.classList.toggle('compact',innerHeight<720);
  const full=S.scr==='splash'||S.scr==='cook';
  $('app').classList.toggle('notop',full);
  $('app').classList.toggle('gray',S.scr==='result');
  $('prog').hidden=full||S.scr==='result';
  $('progBar').style.width=Math.min(100,stepNo()/STEPS_TOTAL*100)+'%';
  $('back').hidden=!['form','mos','ev'].includes(S.scr);
  const TB={force:['STEP 1','📮','입영 통지서'],form:['STEP 2','🏛️','병무청 신상명세서'],mos:['STEP 3','🏕️','자대 배치 면담'],
    ev:[RANK5[S.si],rankMark(S.si),`${S.force} ${RANK5[S.si]} 생활`],result:['완성','🍽️','오늘의 메뉴']}[S.scr];
  $('tbTitle').innerHTML=TB?`<span class="tbc ${S.scr==='ev'?'rk':''}">${TB[0]}</span><span class="tbi">${TB[1]}</span><b class="tbt">${TB[2]}</b>`:'';
  $('tbStep').textContent=S.scr==='ev'?`${S.ei+1}/${EVENTS[RANK5[S.si]].length}`:'';
  $('scr').className=S.scr==='result'?'hub':'';

  $('cta').innerHTML='';
  ({splash:scSplash,force:scForce,form:scForm,mos:scMos,ev:scEvent,promo:scPromo,cook:scCook,result:scResult})[S.scr]();
}
/* 계급장(병) — 이병 1줄 · 일병 2줄 · 상병 3줄 · 병장 4줄 */
function rankMark(i){ return `<svg class="rkm" viewBox="0 0 14 18" aria-hidden="true">${Array.from({length:i+1},(_,k)=>`<rect x="1" y="${15-k*4.4}" width="12" height="2.6" rx="1"/>`).join('')}</svg>`; }
let rzT=0; addEventListener('resize',()=>{clearTimeout(rzT);rzT=setTimeout(()=>{if(!$('sheetBg').classList.contains('on')) render();},150);});
function go(scr,o={},dir=1){Object.assign(S,o);S.scr=scr;slide(dir,render);}   // dir: 1 앞으로 · -1 뒤로

/* ═══ 0. 스플래시 — 거꾸로 놓인 군모 냄비 · 2초 요리 ═══ */
const CAP_CFG={
  '육군':{cam:['#4E5A33','#7E8B57','#5E4B33','#2E3322','#9AA36E','#6B7A4A'],base:'#6B7A4A',line:'#3D4628',tape:'#2E3322',ink:'#E9E4C9',label:'대한민국 육군'},
  '공군':{cam:['#4F5E70','#7D8DA0','#3C4756','#2A323C','#A3B1C2','#64748A'],base:'#64748A',line:'#36414E',tape:'#2A323C',ink:'#DCE6F2',label:'대한민국 공군'},
  '기타':{cam:['#4E5A33','#7E8B57','#5E4B33','#2E3322','#9AA36E','#6B7A4A'],base:'#6B7A4A',line:'#3D4628',tape:'#2E3322',ink:'#E9E4C9',label:'대한민국'},
  '해병':{cam:['#6A5A3A','#8C7B52','#4B4130','#2F2A1E','#A8956A','#7A6A46'],base:'#7A6A46',line:'#3F3626',tape:'#C0392B',ink:'#F2C230',label:'해병대'}};
function capSvg(kind='육군'){
  const steam=`<g class="steam">${['#3E8E41','#1D4ED8','#38BDF8','#EF4444'].map((c,i)=>`<path class="st st${i}" d="M${62+i*25} 56c-9-11 8-17 0-29s8-17 1-27" stroke="${c}" stroke-width="7" stroke-linecap="round" fill="none"/>`).join('')}</g>`;
  /* 해군: 흰 수병모 + 검은 띠 '대한민국 해군' */
  if(kind==='해군') return `<svg class="capsvg" viewBox="0 0 200 170" aria-hidden="true">${steam}
    <defs><clipPath id="navyBody"><path d="M34 66 Q36 122 62 136 Q100 150 138 136 Q164 122 166 66 Z"/></clipPath>
      <linearGradient id="navySh" x1="0" x2="1"><stop offset="0" stop-color="#E4E7EA"/><stop offset=".45" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D9DDE2"/></linearGradient></defs>
    <path d="M34 66 Q36 122 62 136 Q100 150 138 136 Q164 122 166 66 Z" fill="url(#navySh)" stroke="#C3C9D0" stroke-width="2"/>
    <g clip-path="url(#navyBody)"><rect x="20" y="84" width="160" height="16" fill="#1B1F2A"/>
      <text x="100" y="95.5" font-size="8.5" text-anchor="middle" font-weight="900" fill="#D4AF37" font-family="sans-serif" letter-spacing="2">대한민국 해군</text>
      <path d="M40 120 Q100 136 160 120" stroke="#E1E5EA" stroke-width="2" fill="none"/></g>
    <g class="mark" transform="translate(100 120)" fill="none" stroke="#2B4A7A" stroke-width="2.2" stroke-linecap="round">
      <circle cx="0" cy="-9" r="2.6"/><path d="M0 -6.4 V9"/><path d="M-6 -2 H6"/><path d="M-8 4 Q-6 10 0 10 Q6 10 8 4"/></g>
    <ellipse cx="100" cy="66" rx="70" ry="15" fill="#FFFFFF" stroke="#C3C9D0" stroke-width="2"/><ellipse cx="100" cy="67" rx="60" ry="10" fill="#2A3140"/>
  </svg>`;
  const C=CAP_CFG[kind]||CAP_CFG['육군'], r=mulberry32(7);
  const marine=kind==='해병';
  const body=marine?'M28 66 L36 118 L52 141 L148 141 L164 118 L172 66 Z':'M30 66 L42 132 Q44 141 53 141 L147 141 Q156 141 158 132 L170 66 Z';
  const px=Array.from({length:120},()=>{const w=4+Math.floor(r()*3)*3;return `<rect x="${Math.round(26+r()*170)}" y="${Math.round(58+r()*92)}" width="${w}" height="${w-(r()<.5?0:3)}" fill="${C.cam[Math.floor(r()*C.cam.length)]}"/>`;}).join('');
  const flag=`<rect x="80" y="86" width="40" height="27" rx="2" fill="#fff" stroke="${C.line}" stroke-width="1.2"/>
      <circle cx="100" cy="99.5" r="7" fill="#0047A0"/><path d="M93 99.5 a7 7 0 0 1 14 0 a3.5 3.5 0 0 1 -7 0 a3.5 3.5 0 0 0 -7 0Z" fill="#C8102E"/>
      <g fill="#111"><rect x="83" y="89" width="7" height="1.4" transform="rotate(35 86.5 89.7)"/><rect x="83" y="91.4" width="7" height="1.4" transform="rotate(35 86.5 92.1)"/>
        <rect x="110" y="89" width="7" height="1.4" transform="rotate(-35 113.5 89.7)"/><rect x="110" y="91.4" width="7" height="1.4" transform="rotate(-35 113.5 92.1)"/>
        <rect x="83" y="107" width="7" height="1.4" transform="rotate(-35 86.5 107.7)"/><rect x="83" y="109.4" width="7" height="1.4" transform="rotate(-35 86.5 110.1)"/>
        <rect x="110" y="107" width="7" height="1.4" transform="rotate(35 113.5 107.7)"/><rect x="110" y="109.4" width="7" height="1.4" transform="rotate(35 113.5 110.1)"/></g>`;
  /* 해병: 팔각모 + 금색 닻·별 마크 */
  const emblem=marine?`<g fill="#D4AF37" stroke="#8A6D12" stroke-width=".8"><path d="M100 84 l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>
      <path d="M98.6 100 h2.8 v10 q5.5-.6 8-5.4 l2.4 1.4 q-3.6 7.6-12.2 8.2 q-8.6-.6-12.2-8.2 l2.4-1.4 q2.5 4.8 8 5.4z"/><rect x="94" y="102" width="12" height="2.4" rx="1"/></g>`:flag;
  return `<svg class="capsvg" viewBox="0 0 200 170" aria-hidden="true">
    <defs><clipPath id="capBody${kind}"><path d="${body}"/></clipPath>
      <clipPath id="capBrim${kind}"><path d="M148 124 Q184 120 194 140 Q172 152 146 142 Z"/></clipPath></defs>${steam}
    <path d="M148 124 Q184 120 194 140 Q172 152 146 142 Z" fill="${C.line}"/>
    <g clip-path="url(#capBrim${kind})" opacity=".7">${px}</g>
    <path d="M152 130 Q180 128 188 140" stroke="${C.tape}" stroke-width="1" stroke-dasharray="3 2" fill="none"/>
    <path d="${body}" fill="${C.base}"/>
    <g clip-path="url(#capBody${kind})">${px}</g>
    <path d="${body}" fill="none" stroke="${C.line}" stroke-width="2.5"/>
    ${marine?`<path d="M36 118 L164 118 M52 141 L44 70 M148 141 L156 70" stroke="${C.line}" stroke-width="1.2" opacity=".55" fill="none"/>`
      :`<path d="M100 66 L100 140" stroke="${C.line}" stroke-width="1" stroke-dasharray="3 2" opacity=".6"/>`}
    <ellipse cx="100" cy="66" rx="70" ry="14" fill="${C.line}"/><ellipse cx="100" cy="67" rx="63" ry="10" fill="#1F2416"/>
    <g class="mark">${emblem}
      <rect x="70" y="118" width="60" height="10" rx="1.5" fill="${C.tape}"/>
      <text x="100" y="125.6" font-size="6.6" text-anchor="middle" font-weight="900" fill="${C.ink}" font-family="sans-serif" letter-spacing=".4">${C.label}</text></g>
  </svg>`;
}
function scSplash(){
  $('scr').innerHTML=`<div class="splash" id="splash">
    <div class="sp-txt"><b>당신의 군생활을</b><b>요리해 드립니다</b></div>
    <div class="sp-stage">
      <span class="ing i1">🎖️</span><span class="ing i2">⭐</span><span class="ing i3">📜</span><span class="ing i4">🪖</span>
      ${capSvg()}
      <div class="flame"><i></i><i></i><i></i></div>
    </div>
    <div class="sp-brand">${typeof MILKIT_LOGO==='function'?'':''}<b>Mil-Kit</b><span>Your Next Step</span></div>
    ${CH?`<div class="chal"><b>🫡 ${esc(CH.w)}이 보낸 도전장</b><span>${esc(CH.f)} · "${esc(CH.m)} 정식" — 나는 뭐가 나올까?</span></div>`
      :`<p class="sp-note">실제 채용공고 ${won(JK_DB.length)}건 · 국가자격 ${won(QNET_ITEMS.length)}종${MK.at?` (${MK.at.slice(0,10)} 기준)`:''}<br>입력은 이 기기 안에서만 쓰여요.</p>`}
  </div>`;
  $('cta').innerHTML=`<button class="btn hold" id="start">🍳 ${CH?'나도 요리해 보기':'요리 시작하기'}</button>`;
  $('start').onclick=()=>{haptic();go('force');};
  const done=()=>{const s=$('splash');if(!s||s.classList.contains('done')) return;s.classList.add('done');$('start').classList.remove('hold');};
  if(window.gsap&&!FX.reduce){ document.querySelectorAll('.sp-txt b').forEach(b=>{b.innerHTML=[...b.textContent].map(ch=>`<i class="ch">${ch===' '?'&nbsp;':ch}</i>`).join('');});
    gsap.from('.sp-txt .ch',{y:28,opacity:0,rotate:8,duration:.55,ease:'back.out(2.2)',stagger:.035});
    gsap.from('.capsvg',{y:-90,scale:.7,duration:.8,ease:'bounce.out',delay:.15}); }
  setTimeout(done,2100);
  $('splash').onclick=done;
}

/* ═══ 1. 입대 — 군 선택 ═══ */
function scForce(){
  $('scr').innerHTML=`
    <div class="letter up"><span>📨</span><div><b>입영통지서가 도착했습니다</b><small>어느 군으로 입대했나요?</small></div></div>
    <div class="fgrid f5">${FORCE5.map((f,n)=>`<button class="opt tile up ${S.force===f.n?'on':''} ${f.n==='기타'?'wide':''}" style="--d:${60+n*40}ms" data-f="${f.n}">
      <span class="ck">✓</span><span class="big">${f.i}</span><span class="tt">${f.n}</span>
      <span class="dd">${f.d||`복무 ${(DS_SERVICE.find(x=>x.군별===f.n)||{}).복무기간_개월}개월 · 특기 ${DS_MOS.filter(x=>x.군별===f.n).length}종`}</span></button>`).join('')}</div>`;
  $('scr').querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{haptic();S.force=b.dataset.f;
    $('scr').querySelectorAll('.opt').forEach(o=>o.classList.toggle('on',o===b));$('next').disabled=false;$('next').textContent=`${S.force} 입대하기`;});
  $('cta').innerHTML=`<button class="btn" id="next" ${S.force?'':'disabled'}>${S.force?S.force+' 입대하기':'군을 골라주세요'}</button>`;
  $('next').onclick=()=>{haptic();go('form');};
}

/* ═══ 2. 훈련소 신상명세서 — 학력(edu1) · 전공 ═══ */
function scForm(){
  $('scr').innerHTML=`
    <div class="mma"><div class="mma-av">${npcSvg('mma')}</div>
      <div class="mma-b"><em>병무청 담당자</em><p>${S.force} 입영을 축하드려요! 배치에 참고하도록 <b>신상명세서</b>를 작성해 주세요 ✍️</p></div></div>
    <div class="paper handoff">
      <div class="ph2"><span class="emb"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18.5" fill="#fff" stroke="#1F3B73" stroke-width="2"/>
          <circle cx="20" cy="20" r="9" fill="#0047A0"/><path d="M11 20a9 9 0 0 1 18 0a4.5 4.5 0 0 1-9 0a4.5 4.5 0 0 0-9 0Z" fill="#C8102E"/></svg></span>
        <div class="pt"><small>병무청 서식 제12호</small><b>신 상 명 세 서</b><span>${S.force} 입영 대상자용</span></div>
        <span class="serial"><i class="bar"></i><em>No. ${new Date().getFullYear()}-${String(Math.floor(1000+Math.random()*8999))}</em></span></div>
      <div class="pf"><label>최종 학력</label><div class="chips5 edu">${EDU5.map(([v,l])=>`<button class="chip ${S.edu===v?'on':''}" data-e="${v}">${l}</button>`).join('')}</div></div>
      <div class="pf grow"><label>전공 <small>${S.edu===3?'(고졸이면 관심 있는 계열)':''}</small></label>
        <div class="chips5 mj">${MAJOR5.map(([m])=>`<button class="chip ${S.major===m?'on':''}" data-m="${m}">${m}</button>`).join('')}</div></div>
      <div class="pfoot"><span class="pseal">🔒 기재 내용은 이 기기 안에서만 쓰여요</span>
        <span class="sign">병 무 청 장<i class="stamp">병무<br>청장</i></span></div>
    </div>`;
  const sync=()=>{const ok=S.edu!=null&&S.major;$('next').disabled=!ok;$('next').textContent=ok?'제출하고 자대 배치 받기':'학력과 전공을 골라주세요';};
  $('scr').querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{haptic();S.edu=+b.dataset.e;
    $('scr').querySelectorAll('[data-e]').forEach(x=>x.classList.toggle('on',x===b));
    $('scr').querySelector('.pf.grow label small').textContent=S.edu===3?'(고졸이면 관심 있는 계열)':'';sync();});
  $('scr').querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{haptic();S.major=b.dataset.m;
    $('scr').querySelectorAll('[data-m]').forEach(x=>x.classList.toggle('on',x===b));sync();});
  $('cta').innerHTML=`<button class="btn" id="next" disabled></button>`;sync();
  $('next').onclick=()=>{haptic();go('mos');};
}

/* ═══ 3. 자대 배치 — 주특기 (병무청 418종) ═══ */
function mosList(){
  if(S.force!=='기타') return DS_MOS.filter(m=>m.군별===S.force);
  const seen=new Set(); return DS_MOS.filter(m=>!seen.has(m.특기명)&&seen.add(m.특기명));
}
const FAM5={combat:['🎯','전투·경계'],comm:['📡','통신·전자'],it:['💻','전산·IT'],mech:['🔧','정비·공병'],
  trans:['🚚','수송·운전'],admin:['🗂️','행정·지원'],medic:['🏥','의무'],food:['🍳','조리·급양']};
function topBy(L,key,n){const c={};L.forEach(m=>c[m[key]]=(c[m[key]]||0)+1);return Object.keys(c).sort((a,b)=>c[b]-c[a]).slice(0,n);}
function scMos(){
  const all=mosList();
  const fams=Object.keys(FAM5).map(k=>({k,L:all.filter(m=>m.직군===k)})).filter(x=>x.L.length).sort((a,b)=>b.L.length-a.L.length);
  $('scr').innerHTML=`
    <div class="scene2 sm up"><div class="sc-art">${forceArt(S.force)}<span class="sc-npc">${npcSvg(S.force)}</span>
        <span class="sc-tag">🏕️ ${S.force} 자대 배치 면담</span><span class="sc-me"><canvas id="cM"></canvas></span></div>
      <div class="sc-bub"><em>${S.force} 교관</em>${esc(MOS_ASK[S.force]||MOS_ASK['육군'])}</div></div>
    <div class="famgrid up" style="--d:60ms">${fams.map(f=>`<button class="opt famt ${S.mos&&S.mos.직군===f.k?'on':''}" data-k="${f.k}">
      <span class="em">${FAM5[f.k][0]}</span><span class="tx"><span class="tt">${FAM5[f.k][1]}</span><span class="dd">${esc(topBy(f.L,'분야',3).join('·'))}</span></span></button>`).join('')}</div>
    <div class="subpick up" style="--d:120ms" id="sub"></div>`;
  mount($('cM'),34);
  const sub=()=>{const f=S.mos&&fams.find(x=>x.k===S.mos.직군);
    if(!f){$('sub').innerHTML=`<span class="sl">세부 특기</span><span class="sh">위에서 하고 싶은 일을 먼저 골라주세요</span>`;return;}
    const seen=new Set(), names=[];
    const base=n=>n.replace(/^\([^)]*\)\s*/,'');   // "(맞춤)보수" → "보수" 중복 정리
    const pool=[...f.L].sort((x,y)=>(/^\(/.test(x.특기명))-(/^\(/.test(y.특기명)));
    topBy(f.L,'분야',8).forEach(b=>pool.filter(m=>m.분야===b).forEach(m=>{const k=base(m.특기명);if(!seen.has(k)&&names.length<6){seen.add(k);names.push(m);}}));
    if(!names.some(m=>m.특기명===S.mos.특기명)) names[names.length-1]=S.mos;
    $('sub').innerHTML=`<span class="sl">세부 특기 <small>${f.L.length}종 중 대표</small></span><div class="subchips">${names.map((m,i)=>`<button class="chip ${m.특기명===S.mos.특기명?'on':''}" data-i="${i}">${esc(m.특기명)}</button>`).join('')}</div>`;
    $('sub').querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{haptic();S.mos=names[+b.dataset.i];sub();sync();});};
  const sync=()=>{const m=S.mos;$('next').disabled=!m;$('next').textContent=m?`"${m.특기명}" 해보고 싶습니다!`:'하고 싶은 일을 골라주세요';};
  $('scr').querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{haptic();const f=fams.find(x=>x.k===b.dataset.k);
    const top=topBy(f.L,'분야',1)[0]; S.mos=f.L.find(m=>m.분야===top)||f.L[0];
    $('scr').querySelectorAll('.famt').forEach(o=>o.classList.toggle('on',o===b));sub();sync();});
  $('cta').innerHTML=`<button class="btn" id="next" disabled></button>`;sub();sync();
  $('next').onclick=()=>{haptic();
    const b=FAMILY_BASE[S.mos.직군]; S.stats={str:0,tech:0,lead:0,dili:0,comm:0}; SK.forEach(k=>S.stats[k]+=b[k]);
    S.items=new Set(['cap',FAM_TOOL[S.mos.직군]]); S.rk=0;S.si=0;S.ei=0;S.hist=[];
    go('ev');};
}

/* ═══ 4. 계급별 이벤트 — 답이 곧 API 조건 ═══ */
const curEv=()=>EVENTS[RANK5[S.si]][S.ei];
function evOpts(e){ const O=e.opts?e.opts():[]; return O.map((o,i)=>[o,i]).sort((x,y)=>(!!y[0].star-!!x[0].star)||x[1]-y[1]).map(x=>x[0]); }   // ★ 추천을 맨 위로
function answerLabel(e,v){
  if(e.kind==='slider') return v?`${won(v[0])}~${won(v[1])}만원`:'상관없음';
  if(e.kind==='text') return v||'(건너뜀)';
  const O=evOpts(e), f=x=>(O.find(o=>o.v===x)||{l:x}).l;
  return Array.isArray(v)?(v.length?v.map(f).join(', '):'(패스)'):f(v);
}
function scEvent(){
  const e=curEv(), rank=RANK5[S.si], O=evOpts(e), cur=S.ans[e.id];
  const sel=new Set(Array.isArray(cur)?cur:[]);
  $('scr').innerHTML=`
    <div class="scene2 up"><div class="sc-art">${forceArt(S.force)}<span class="sc-npc">${npcSvg(S.force)}</span>
        <span class="sc-tag">${e.scene} ${e.where}</span><span class="sc-rk">${rank}</span><span class="sc-me"><canvas id="cE"></canvas></span></div>
      <div class="sc-bub"><em>${e.npc}</em>${esc(e.q).replace(/\n/g,'<br>')}</div></div>
    <div class="evbody up" style="--d:60ms" id="evb"></div>
    <div class="evfoot"><span>🔒 답은 <b>${e.why}</b> 조건으로만 쓰여요</span><span>${rank} ${S.ei+1}/${EVENTS[rank].length}</span></div>`;
  mount($('cE'),44);
  const b=$('evb');
  if(e.kind==='single'){
    b.className='evbody up evsingle';
    b.innerHTML=O.map((o,i)=>`<button class="evopt ${cur===o.v?'on':''}" data-i="${i}"><b>${o.l}</b>${o.sub?`<span>${o.sub}</span>`:''}</button>`).join('');
    b.querySelectorAll('[data-i]').forEach(x=>x.onclick=()=>{haptic(10);x.classList.add('on');setTimeout(()=>answer(O[+x.dataset.i].v),160);});
  } else if(e.kind==='multi'){
    b.className='evbody up evmulti';
    b.innerHTML=O.map((o,i)=>`<button class="evchip ${sel.has(o.v)?'on':''}" data-i="${i}">${o.l}${o.star?'<i>★</i>':''}</button>`).join('');
    b.querySelectorAll('[data-i]').forEach(x=>x.onclick=()=>{const v=O[+x.dataset.i].v;
      if(sel.has(v)) sel.delete(v); else { if(sel.size>=e.max){toast(`${e.max}개까지 고를 수 있어요`);return;} sel.add(v); }
      haptic();x.classList.toggle('on',sel.has(v));sync();});
    $('cta').innerHTML=`<div class="btn-row"><button class="btn sub" id="pass" style="flex:0 0 96px">패스</button><button class="btn" id="ok"></button></div>`;
    const sync=()=>{$('ok').disabled=!sel.size;$('ok').textContent=sel.size?`이걸로! (${sel.size}/${e.max})`:`골라주세요 (최대 ${e.max})`;};sync();
    $('ok').onclick=()=>{haptic();answer([...sel]);}; $('pass').onclick=()=>{haptic();answer([]);};
    if(O.some(o=>o.star)) $('scr').querySelector('.evfoot span').innerHTML+=` · <i class="st">★ 주특기·전공 추천</i>`;
  } else if(e.kind==='slider'){
    let lo=Array.isArray(cur)?cur[0]:3200;
    b.className='evbody up evslider';
    b.innerHTML=`<div class="salbig" id="salv"></div><input type="range" class="range" id="sal" min="2400" max="6000" step="100" value="${lo}" aria-label="희망 연봉 하한">
      <div class="salcmp" id="salc"></div>`;
    const draw=()=>{$('salv').innerHTML=`${won(lo)} ~ ${won(lo+1000)}<small>만 원 (연봉 · 세전)</small>`;
      $('salc').innerHTML=`월 약 <b>${won(lo/12)}만 원</b> · 병장 월급의 <b>${(lo/12/150).toFixed(1)}배</b>`;};draw();
    $('sal').oninput=x=>{lo=+x.target.value;draw();haptic(3);};
    $('cta').innerHTML=`<div class="btn-row"><button class="btn sub" id="any" style="flex:0 0 108px">상관없음</button><button class="btn" id="ok">이 정도면 OK</button></div>`;
    $('ok').onclick=()=>{haptic();answer([lo,lo+1000]);}; $('any').onclick=()=>{haptic();answer(null);};
  } else if(e.kind==='text'){
    const sug=[...new Set(JK_JOBS.filter(j=>(S.ans.rpcd||[]).includes(j[0])).flatMap(j=>j[4].split(',')))].slice(0,8);
    b.className='evbody up evtext';
    b.innerHTML=`<div class="rolling"><input class="inp" id="kw" maxlength="16" placeholder="예) 보안관제, 정비, 물류" value="${esc(cur||'')}"><small>— 후임들 롤링페이퍼에 남겨요</small></div>
      <div class="quick">${(sug.length?sug:['정비','보안','물류','전기','조리','안전']).map(k=>`<button data-k="${esc(k)}">#${esc(k)}</button>`).join('')}</div>`;
    b.querySelectorAll('[data-k]').forEach(x=>x.onclick=()=>{haptic();$('kw').value=x.dataset.k;});
    $('cta').innerHTML=`<div class="btn-row"><button class="btn sub" id="skip" style="flex:0 0 108px">건너뛰기</button><button class="btn" id="ok">남기고 전역 준비</button></div>`;
    $('ok').onclick=()=>{haptic();answer($('kw').value.trim());}; $('skip').onclick=()=>{haptic();answer('');};
  }
}
function answer(v){
  const e=curEv();
  S.hist.push({stats:{...S.stats},si:S.si,ei:S.ei,items:new Set(S.items)});
  S.ans[e.id]=v;
  if(e.id==='rbcd') S.ans.rpcd=(S.ans.rpcd||[]).filter(p=>JK_JOBS.some(j=>j[0]===p&&v.includes(j[1])));
  const g=e.gain||{}; Object.entries(g).forEach(([k,n])=>S.stats[k]+=n);
  S.lastGain[RANK5[S.si]]=Object.assign(S.lastGain[RANK5[S.si]]||{},Object.fromEntries(Object.entries(g).map(([k,n])=>[k,((S.lastGain[RANK5[S.si]]||{})[k]||0)+n])));
  if(S.ei<EVENTS[RANK5[S.si]].length-1){S.ei++;slide(1,render);}
  else promote();
}
function promote(){
  const r=RANK5[S.si]; S.rk++;
  const it=RANK_ITEM[r]; if(it) S.items.add(it);
  if(S.si===1) S.items.add('helmet');
  if(r==='병장') ['cert','namecard'].forEach(k=>S.items.add(k));   // 정복(dress)은 빼서 군별 군복 유지
  go('promo');
}
function scPromo(){
  const r=RANK5[S.si], next=NEXT5[r], last=next==='전역', g=S.lastGain[r]||{};
  const got=EVENTS[r].map(e=>({w:e.why,a:answerLabel(e,S.ans[e.id])}));
  $('scr').innerHTML=`
    <div class="stage pop grow fstage" id="pst">${forceArt(S.force)}<canvas id="cP"></canvas></div>
    <div class="celebrate">
      <div class="badge-up up">${last?'전역 명령':'진급 발령'}</div>
      <div class="rankbig up" style="--d:80ms">${last?'<em>전역</em>! 이제 요리할 시간':`<em>${next}</em>(으)로 진급!`}</div>
      <div class="deltas">${SK.filter(k=>g[k]).map((k,i)=>`<b class="pop" style="--d:${160+i*60}ms">${SN(k).i} ${SN(k).n} <i>+${g[k]}</i></b>`).join('')}
        ${RANK_ITEM[r]?`<b class="pop" style="--d:420ms">${iemoji(RANK_ITEM[r])} ${iname(RANK_ITEM[r])}</b>`:''}</div>
    </div>
    <div class="card up collected" style="--d:300ms"><div class="ct">🧺 이번 계급에서 모은 재료</div>
      ${got.map(x=>`<div class="cl"><span>${x.w}</span><b>${esc(x.a)}</b></div>`).join('')}</div>`;
  requestAnimationFrame(()=>{const h=Math.max(70,$('pst').clientHeight-16);mount($('cP'),Math.min(200,Math.floor(h*GW/GH)));});
  setTimeout(()=>party(last?'big':'small'),380);
  if(window.gsap&&!FX.reduce) gsap.fromTo('.rankbig',{scale:.6},{scale:1,duration:.6,ease:'back.out(2.4)',delay:.1,clearProps:'transform'});
  $('cta').innerHTML=`<button class="btn" id="next">${last?'🍳 요리 완성하기':'계속 복무하기'}</button>`;
  $('next').onclick=()=>{haptic();if(last) go('cook'); else go('ev',{si:S.si+1,ei:0});};
}

/* ═══ 5. 두 API 요청 조립 ═══ */
function buildJK(){
  const a=S.ans, q={Size:100,Page:1,Ob:a.ob||'2'};
  if(a.kw) q.Keyword=a.kw;
  if(a.rbcd&&a.rbcd.length) q.rbcd=a.rbcd.join(',');
  if(a.rpcd&&a.rpcd.length) q.rpcd=a.rpcd.join(',');
  if(a.area&&a.area.length) q.area=a.area.slice(0,6).join(',');
  q.edu1=eduCode(S.edu||3);
  if(a.career&&a.career!=='0') q.mcareerchk=a.career;
  if(a.jtype&&a.jtype.length) q.Jtype=a.jtype.slice(0,3).join(',');
  if(a.pay){q.pay='1';q.payterm=a.pay.join(',');}
  if(a.ctype&&a.ctype!=='0') q.ctype=a.ctype;
  return q;
}
function qnFilter(){ return {obligfldcd:S.ans.qnField||[],seriescd:S.ans.qnSeries&&S.ans.qnSeries!=='all'?S.ans.qnSeries:null,major:S.major}; }
/* ═══ 6. 요리 중 — 실제 호출 순서대로 ═══ */
const COOK_STEPS=[['📮','채용공고 모으는 중'],['📜','자격증 정보 모으는 중'],['🔗','공고와 자격 연결'],['🍽️','코스 플레이팅']];
function scCook(){
  $('scr').innerHTML=`<div class="splash cook">
    <div class="sp-stage small">${capSvg(S.force)}<div class="flame"><i></i><i></i><i></i></div></div>
    <div class="anlt"><b id="apct">0%</b><span>당신의 군생활을 요리하는 중</span></div>
    <div class="abar"><i id="abar"></i></div>
    <div class="asteps">${COOK_STEPS.map(s=>`<div class="astep"><span class="ai">${s[0]}</span><span class="an">${s[1]}</span><span class="ac"></span></div>`).join('')}</div></div>`;
  const T=2600,t0=performance.now(),N=COOK_STEPS.length;
  (function tk(t){ if(S.scr!=='cook'||!$('abar')) return;
    const p=Math.min(1,(t-t0)/T),e=1-Math.pow(1-p,2.2);
    $('abar').style.width=e*100+'%';$('apct').textContent=Math.round(e*100)+'%';
    document.querySelectorAll('.astep').forEach((s,i)=>{s.classList.toggle('doing',e>=i/N&&e<(i+1)/N);s.classList.toggle('done',e>=(i+1)/N);});
    if(p<1) requestAnimationFrame(tk); else setTimeout(()=>{S.res=cookResult();go('result',{tab:'sum',page:0});},300);
  })(t0);
}

/* ═══ 결과 계산 — 두 API 응답 결합 ═══ */
const AREA_NAME=Object.fromEntries(JK_AREA1);
function payText(g){
  const [a,b]=String(g.GI_Pay_Term||'0,0').split(',').map(Number), r=b&&b!==a?`${won(a)}~${won(b)}`:won(a);
  switch(+g.GI_Pay){case 1:return `연봉 ${r}만원`;case 2:return `월급 ${r}만원`;case 5:return `시급 ${r}원`;case 4:return `일급 ${r}원`;case 6:return `건별 ${r}원`;}
  return g.GI_Pay_Flag==='1'?'면접 후 결정':'회사 내규';
}
function areaText(g){
  const n=c=>AREA_NAME[/^\d/.test(c)?'1000':c[0]+'000']||'';
  const u=[...new Set(g.areas.map(n).filter(Boolean))];
  return u.length?u[0]+(u.length>1?` 외 ${u.length-1}곳`:''):'지역 미기재';
}
function cookResult(){
  const q0=buildJK(), notes=[];
  let q={...q0}, r=jobkoreaList(q);
  /* 결과가 너무 적으면 조건을 하나씩 넓힌다 (화면에 안내) — ctype은 스냅샷에 컬럼이 없어 거르지 않는다 */
  for(const [k,lab] of [['payterm','급여'],['Jtype','고용형태'],['Keyword','검색어'],['area','근무지역'],['rpcd','소분류'],['mcareerchk','경력']]){
    if(+r.DataList.TotalCnt>=6) break;
    if(q[k]!=null){delete q[k]; if(k==='payterm') delete q.pay; notes.push(lab); r=jobkoreaList(q);}
  }
  const qn=qnetGetList().response.body.items.item;
  const today=new Date(new Date().toDateString());
  const posts=r.DataList.Items.map(g=>{
    const end=g.GI_End_Date&&g.GI_End_Date<'2060'?new Date(g.GI_End_Date+'T00:00:00'):null;
    return {g,title:g.GI_Subject,co:g.C_Name,area:areaText(g),pay:payText(g),url:g.JK_URL,
      dday:end?Math.round((end-today)/86400000):null,job:JK_JOBS.find(j=>g.parts.includes(j[0])),
      certs:g.certs.map(c=>QN_BY[c]).filter(Boolean)};});
  /* 관련 자격 = 공고 내용·직무로 연결된 자격 + 사지방에서 고른 분야·등급의 종목 */
  const f=qnFilter(), need={};
  posts.forEach(p=>p.certs.forEach(c=>{need[c.jmcd]=(need[c.jmcd]||0)+1;}));
  let pool=qn.filter(x=>need[x.jmcd]||(f.obligfldcd.includes(x.obligfldcd)&&(f.seriescd?x.seriescd===f.seriescd:['05','04','03'].includes(x.seriescd))));
  if(!pool.length) pool=qn.filter(x=>majorQn().includes(x.obligfldcd)&&x.seriescd==='05');
  const certs=pool.map(x=>({it:x,need:need[x.jmcd]||0,el:eligibility(x),pick:f.obligfldcd.includes(x.obligfldcd)}))
    .sort((a,b)=>b.need-a.need||(b.pick-a.pick)||(b.el.ok-a.el.ok)||b.it.seriescd.localeCompare(a.it.seriescd)).slice(0,30);
  return {q:q0,qUsed:q,notes,raw:r,total:+r.DataList.TotalSumCnt,posts,certs,qnTotal:qn.length};
}

/* ═══ 7. 결과 — 요약 · 채용공고(잡코리아) · 필요 자격(Q-Net) ═══ */
function scResult(){
  const R=S.res;
  $('scr').innerHTML=`<div class="seg" style="margin-top:4px">
      <button class="${S.tab==='sum'?'on':''}" data-t="sum">요약</button>
      <button class="${S.tab==='post'?'on':''}" data-t="post">채용공고<em>${R.total>99?'99+':R.total}</em></button>
      <button class="${S.tab==='cert'?'on':''}" data-t="cert">자격증<em>${R.certs.length}</em></button></div>
    <div id="rbody" class="rbody"></div>`;
  document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{haptic();S.tab=b.dataset.t;S.page=0;render();});
  if(S.tab==='card') S.tab='sum';
  ({sum:resSum,post:resPost,cert:resCert})[S.tab]($('rbody'));
  $('cta').innerHTML=`<div class="btn-row"><button class="btn sub" id="again" style="flex:0 0 104px">다시 요리</button><button class="btn" id="inv">📤 선후임에게 공유하기</button></div>`;
  $('inv').onclick=openInvite;
  $('again').onclick=()=>{haptic();Object.assign(S,{partied:false,force:null,mos:null,edu:null,major:null,ans:{},si:0,ei:0,rk:0,hist:[],lastGain:{},res:null,mosQ:'',mosCat:'전체',mosPage:0});go('force');};
}
function resSum(box){
  const R=S.res, tc=R.certs.filter(c=>c.need).slice(0,3), ok=R.certs.filter(c=>c.el.ok).length;
  const menu=resMenu(), field=courseField(), road=courseItems();
  box.innerHTML=`
    <div class="card menu up"><div class="mrow"><div class="cv"><canvas id="cR"></canvas></div>
      <div class="mtx"><span class="k">오늘의 메뉴</span><b>${esc(menu)} 정식</b><small>${S.force} ${esc(S.mos.특기명)} · 곁들임 ${tc[0]?esc(tc[0].it.jmfldnm):'자격 코스'}</small></div>
      <div class="mico"><button data-card="dis" aria-label="전역카드">🎖️<span>전역카드</span></button><button data-card="nc" aria-label="명함">🪪<span>명함</span></button></div></div>
      <div class="kvs"><div><b data-count="${R.total}">0</b><span>맞춤 공고</span></div><div><b data-count="${R.certs.length}">0</b><span>관련 자격</span></div><div><b style="color:var(--green)" data-count="${ok}">0</b><span>지금 응시 가능</span></div></div>
      ${CH?`<p class="fine vs">🫡 ${esc(CH.w)}: <b>${esc(CH.m)} 정식</b> vs 나: <b>${esc(menu)} 정식</b></p>`
        :R.notes.length?`<p class="fine relax">공고가 적어 조건 ${R.notes.length}개(${R.notes.join('·')})를 넓혀 찾았어요</p>`:''}</div>
    <div class="card up course" style="--d:60ms"><div class="ch"><b>🍽️ 코스 서비스</b><span>${field?QN_OBLIG[field]:'추천'} 분야 자격 코스</span></div>
      <div class="road3">${road.map((x,i)=>{const e=eligibility(x);return `<button class="rd ${e.ok?'ok':''}" data-j="${x.jmcd}"><i>${COURSE[i][0]} ${COURSE[i][1]}</i><b>${esc(x.jmfldnm)}</b><span>${e.ok?'✓ ':''}${e.t}</span></button>`;}).join('<em>→</em>')}</div></div>
    <div class="card up need grow" style="--d:120ms"><div class="ct">공고와 가장 많이 연결된 자격</div>
      ${tc.length?tc.map(c=>certRow(c)).join(''):'<p class="fine">요구 자격이 없는 공고 위주예요. 위 코스로 준비해 보세요.</p>'}</div>`;
  mount($('cR'),56); countUp(box); stagger('.rbody>.card',box);
  if(!S.partied){S.partied=true;setTimeout(()=>party('big'),450);}
  box.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>{haptic();openCert(b.dataset.j);});
  box.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>openCardSheet(b.dataset.card));
}
function certRow(c){
  return `<button class="crow" data-j="${c.it.jmcd}"><span class="sb s${c.it.seriescd}">${c.it.qualgbcd==='S'?'전문':c.it.seriesnm}</span>
    <span class="bd"><b>${esc(c.it.jmfldnm)}</b><span>${c.it.obligfldnm.trim()||'국가전문자격'}${c.need?` · 관련 공고 ${c.need}건`:''}</span></span>
    <em class="${c.el.ok?'ok':'no'}">${c.el.t}</em></button>`;
}
function resPost(box){
  const R=S.res;
  box.innerHTML=`<div class="fgrid one" id="pg"></div><div id="ppg"></div>`;
  box.className='rbody col';
  if(!R.posts.length){$('pg').innerHTML='<div class="empty">조건에 맞는 공고가 없어요. 다시 요리하며 답을 바꿔보세요.</div>';return;}
  requestAnimationFrame(()=>{
    const r=fillPaged($('pg'),R.posts.length,86,S.page,i=>{const p=R.posts[i];
      return `<button class="post2" data-i="${i}"><span class="co">${esc(p.co)}${/전역|군필|병역|제대/.test(p.title+p.g.GI_Keyword)?' · 🎖️군필 우대':''}</span>
        <b class="ti">${esc(p.title)}</b>
        <span class="mt">${esc(p.area)} · ${esc(p.g.career_label||JK_CAREER[+p.g.GI_Career]||'')} · ${esc(p.pay)} · ${p.dday==null?'상시':p.dday<=0?'<em>오늘 마감</em>':`<em>D-${p.dday}</em>`}</span>
        <span class="cc">${p.certs.slice(0,3).map(c=>`<i class="${eligibility(c).ok?'ok':''}">📜 ${esc(c.jmfldnm)}</i>`).join('')||'<i class="none">연결된 자격 없음</i>'}</span></button>`;},1);
    S.page=r.page; $('ppg').innerHTML=pagerHtml(r.page,r.pages);
    $('ppg').querySelectorAll('[data-pg]').forEach(b=>b.onclick=()=>{haptic();S.page+= +b.dataset.pg;resPost(box);});
    $('pg').querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{haptic();openPost(R.posts[+b.dataset.i]);});
  });
}
function resCert(box){
  const R=S.res;
  box.innerHTML=`<div class="fgrid one" id="cg"></div><div id="cpg"></div>`;
  box.className='rbody col';
  requestAnimationFrame(()=>{
    const r=fillPaged($('cg'),R.certs.length,58,S.page,i=>certRow(R.certs[i]),1);
    S.page=r.page; $('cpg').innerHTML=pagerHtml(r.page,r.pages);
    $('cpg').querySelectorAll('[data-pg]').forEach(b=>b.onclick=()=>{haptic();S.page+= +b.dataset.pg;resCert(box);});
    $('cg').querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>{haptic();openCert(b.dataset.j);});
  });
}
function openPost(p){
  const g=p.g;
  openSheet(`<div class="sbody">
    <div style="font-size:12.5px;color:var(--g500);font-weight:600">${esc(p.co)}${p.job?' · '+p.job[2]:''}</div>
    <h3 style="margin-top:2px">${esc(p.title)}</h3>
    <div class="meta"><b>📍 ${esc(p.area)}</b><b>${esc(g.job_type_label||'')}</b><b>${esc(g.career_label||'')}${g.GI_Career==='2'&&+g.GI_Career_Year_Cnt?` ${g.GI_Career_Year_Cnt}년↑`:''}</b>
      <b>🎓 ${esc(g.edu_label||'학력무관')}</b><b>💰 ${esc(p.pay)}</b><b class="${p.dday!=null&&p.dday<=7?'warn':''}">⏰ ${p.dday==null?'상시':p.dday<=0?'오늘 마감':'D-'+p.dday}</b></div>
    ${g.GI_Keyword?`<div class="tags">${g.GI_Keyword.split(',').slice(0,8).map(t=>`<i>#${esc(t.trim())}</i>`).join('')}</div>`:''}
    <div class="sec" style="margin-top:14px">이 공고와 연결된 자격</div>
    ${p.certs.length?p.certs.map(c=>certRow({it:c,need:0,el:eligibility(c)})).join(''):'<p class="fine">연결된 자격이 없어요.</p>'}
    <p class="fine">자격은 공고 제목·키워드·직무로 연결했어요. 실제 우대 조건은 원문에서 확인하세요.<br>출처 잡코리아 · 채용기업과 잡코리아의 동의 없이 무단 전재·재배포할 수 없어요.</p>
  </div><div class="sfoot"><button class="btn sub sm" id="sc" style="flex:0 0 90px">닫기</button>${p.url?`<a class="btn sm" href="${esc(p.url)}" target="_blank" rel="noopener">공고 원문 보기 ↗</a>`:''}</div>`,sh=>{
    $('sc').onclick=closeSheet; sh.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>openCert(b.dataset.j));});
}
const SERIES_INFO={'05':'기초 기능을 익히는 입문 자격이에요. 학력·경력 제한 없이 누구나 응시할 수 있어요.',
  '04':'기초 이론과 숙련 기능을 함께 보는 자격이에요. 관련학과 전문대 이상이거나 실무 경력이 있으면 응시할 수 있어요.',
  '03':'공학 이론을 바탕으로 설계·시공·관리를 맡는 자격이에요. 관련학과 4년제 졸업(예정)이거나 경력이 있어야 해요.',
  '02':'현장 최고 숙련 기능을 인정하는 자격이에요. 오랜 실무 경력이 필요해요.',
  '01':'해당 분야 최고 수준의 전문 지식을 인정하는 자격이에요. 긴 실무 경력이 필요해요.'};
function openCert(jmcd){
  const it=QN_BY[jmcd], e=eligibility(it), posts=(S.res?S.res.posts:[]).filter(p=>p.certs.some(c=>c.jmcd===jmcd));
  const S_=it.qualgbcd==='S', grade=S_?'국가전문자격':it.seriesnm;
  const info=S_?'법령에 따라 운영되는 전문 자격이에요. 시험마다 응시 요건이 달라요.':SERIES_INFO[it.seriescd]||'';
  openSheet(`<div class="sbody">
    <span class="sb s${it.seriescd}" style="display:inline-block">${grade}</span>
    <h3 style="margin-top:6px">${esc(it.jmfldnm)}</h3>
    <div class="cinfo"><div><span>자격 구분</span><b>${esc(it.qualgbnm)}</b></div><div><span>등급</span><b>${esc(grade)}</b></div>
      <div><span>직무 분야</span><b>${esc(it.obligfldnm.trim()||'전문 분야')}</b></div><div><span>세부 분야</span><b>${esc(it.mdobligfldnm.trim()||'-')}</b></div></div>
    <p class="cdesc">${info}</p>
    <div class="gap" style="margin-top:8px"><span class="t ${e.ok?'p':''}" style="background:${e.ok?'var(--green)':'var(--red)'}">${e.t}</span><b>${e.d}</b></div>
    <p class="fine">학력 "${EDU5.find(x=>x[0]===S.edu)?.[1]||'-'}" · 전공 "${esc(S.major||'-')}" 기준 간이 판정이에요. 실제 응시자격은 큐넷에서 확인하세요.</p>
    <div class="sec" style="margin-top:12px">이 자격과 연결된 공고 ${posts.length}건</div>
    ${posts.slice(0,3).map(p=>`<div class="gap">📄 <b>${esc(p.title)}</b><em>${esc(p.co)}</em></div>`).join('')||'<p class="fine">이번 결과에는 없어요.</p>'}
  </div><div class="sfoot"><a class="btn sub sm" href="https://www.q-net.or.kr" target="_blank" rel="noopener" style="flex:0 0 140px">시험 일정 보기 ↗</a><button class="btn sm" id="sc">닫기</button></div>`,()=>{$('sc').onclick=closeSheet;});
}
/* ── 뒤로 ── */
$('back').onclick=()=>{
  haptic();
  if(S.scr==='form') return go('force',{},-1);
  if(S.scr==='mos') return go('form',{},-1);
  if(S.scr==='ev'){ const h=S.hist.pop(); if(!h) return go('mos',{},-1);
    S.stats=h.stats;S.items=h.items;S.si=h.si;S.ei=h.ei; if(S.rk>h.si) S.rk=h.si; slide(-1,render); }
};
$('sheetBg').onclick=e=>{if(e.target===$('sheetBg')) closeSheet();};
document.addEventListener('keydown',e=>{if(e.key==='Escape') closeSheet();});
render();tick();
