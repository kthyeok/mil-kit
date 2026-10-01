
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
const STEPS_TOTAL=3+EV_ALL.length+RANK5.length+2;

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
  $('back').hidden=!['form','mos','ev','school'].includes(S.scr);
  const TB={force:['STEP 1','📮','입영 통지서'],form:['STEP 2','🏛️','병무청 신상명세서'],mos:['STEP 3','🏕️','자대 배치 면담'],
    ev:[RANK5[S.si],rankMark(S.si),`${S.force} ${RANK5[S.si]} 생활`],path:['전역','🎖️','전역 후 진로'],school:['복학','🎓','졸업 후 목표'],
    result:['완성','🍽️','꿈을 위한 코스']}[S.scr];
  $('tbTitle').innerHTML=TB?`<span class="tbc ${S.scr==='ev'?'rk':''}">${TB[0]}</span><span class="tbi">${TB[1]}</span><b class="tbt">${TB[2]}</b>`:'';
  $('tbStep').textContent=S.scr==='ev'?`${S.ei+1}/${EVENTS[RANK5[S.si]].length}`:'';
  $('scr').className=S.scr==='result'?'hub':'';

  $('cta').innerHTML='';
  ({splash:scSplash,force:scForce,form:scForm,mos:scMos,ev:scEvent,promo:scPromo,path:scPath,school:scSchool,cook:scCook,result:scResult})[S.scr]();
}
/* 계급장(병) — 이병 1줄 · 일병 2줄 · 상병 3줄 · 병장 4줄 */
function rankMark(i){ return `<svg class="rkm" viewBox="0 0 14 18" aria-hidden="true">${Array.from({length:i+1},(_,k)=>`<rect x="1" y="${15-k*4.4}" width="12" height="2.6" rx="1"/>`).join('')}</svg>`; }
let rzT=0; addEventListener('resize',()=>{clearTimeout(rzT);rzT=setTimeout(()=>{if(!$('sheetBg').classList.contains('on')) render();},150);});
function go(scr,o={},dir=1){Object.assign(S,o);S.scr=scr;slide(dir,render);}   // dir: 1 앞으로 · -1 뒤로

/* ═══ 0. 스플래시 — 거꾸로 놓인 군모 냄비 · 2초 요리 ═══ */
const CAMO={
  army:['#5B6B3A','#7C8656','#4A3F33','#2B2A24','#B8AE8E','#6E7B4A','#8D9C5A'],
  cap:['#7A7B62','#5C5A48','#3B3A30','#C9B79A','#8C8A72','#4D5240','#A99B7E'],
  marine:['#3E4A5C','#6B7686','#A9B0BA','#2A2F38','#55606E','#8A93A0','#4F5A4A']};
/* 디지털 무늬 — 2~3칸짜리 픽셀 덩어리를 흩뿌린다 */
function pix(seed,pal,x0,y0,w,h,n,u=5){
  const r=mulberry32(seed); let o='';
  for(let i=0;i<n;i++){const c=pal[Math.floor(r()*pal.length)], x=x0+Math.floor(r()*w/u)*u, y=y0+Math.floor(r()*h/u)*u, k=1+Math.floor(r()*3);
    for(let j=0;j<k;j++) o+=`<rect x="${x+(j%2)*u}" y="${y+Math.floor(j/2)*u}" width="${u}" height="${u}" fill="${c}"/>`;}
  return o;
}
const STEAM=`<g class="steam">${['#3E8E41','#1D4ED8','#38BDF8','#EF4444'].map((c,i)=>`<path class="st st${i}" d="M${62+i*25} 56c-9-11 8-17 0-29s8-17 1-27" stroke="${c}" stroke-width="7" stroke-linecap="round" fill="none"/>`).join('')}</g>`;
const CAP_OF={'육군':'army','해군':'navy','공군':'air','해병':'marine','기타':'helmet'};
function capSvg(kind='helmet'){
  const id='c'+kind, wrap=b=>`<svg class="capsvg" viewBox="0 0 200 170" aria-hidden="true">${STEAM}${b}</svg>`;
  if(kind==='helmet'){   /* 철모(위장포 커버) — 띠 · 턱끈이 손잡이처럼 */
    const body='M26 66 Q24 150 100 152 Q176 150 174 66 Z';
    return wrap(`<defs><clipPath id="${id}"><path d="${body}"/></clipPath><radialGradient id="${id}g" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></radialGradient></defs>
      <path d="M40 74 Q8 92 22 118 Q30 128 44 116" stroke="#5E6B3A" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M160 74 Q192 92 178 118 Q170 128 156 116" stroke="#5E6B3A" stroke-width="6" fill="none" stroke-linecap="round"/>
      <rect x="14" y="98" width="10" height="7" rx="1.5" fill="#3E4628" transform="rotate(-20 19 101)"/><rect x="176" y="98" width="10" height="7" rx="1.5" fill="#3E4628" transform="rotate(20 181 101)"/>
      <path d="${body}" fill="#5B6B3A"/><g clip-path="url(#${id})">${pix(11,CAMO.army,24,60,152,95,150)}
        <path d="M28 88 Q100 108 172 88 L170 104 Q100 124 30 104 Z" fill="#6E7B4A" opacity=".55"/>
        <path d="M28 88 Q100 108 172 88 M30 104 Q100 124 170 104" stroke="#3E4628" stroke-width="1.4" stroke-dasharray="3 2" fill="none"/>
        <path d="M100 74 Q104 112 100 152" stroke="#3E4628" stroke-width="1.2" stroke-dasharray="3 2" fill="none" opacity=".7"/>
        <rect width="200" height="170" fill="url(#${id}g)"/></g>
      <path d="${body}" fill="none" stroke="#3E4628" stroke-width="2.5"/>
      <ellipse cx="100" cy="66" rx="74" ry="15" fill="#4A5530"/><ellipse cx="100" cy="67" rx="66" ry="11" fill="#1F2416"/>
      <path d="M60 64 L52 78 M140 64 L148 78" stroke="#5E6B3A" stroke-width="5" stroke-linecap="round"/>`);
  }
  if(kind==='navy'){     /* 흰 수병모 — 뒤집으면 말린 챙이 아래로 퍼진다 */
    return wrap(`<defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#DCE0E5"/><stop offset=".5" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D3D8DE"/></linearGradient></defs>
      <path d="M46 96 Q46 146 100 148 Q154 146 154 96 Z" fill="url(#${id})" stroke="#C4CAD1" stroke-width="2"/>
      <path d="M58 132 Q100 142 142 132" stroke="#D5DAE0" stroke-width="2" fill="none"/>
      <path d="M24 64 L176 64 L164 102 Q100 114 36 102 Z" fill="url(#${id})" stroke="#C4CAD1" stroke-width="2"/>
      ${[74,82,90].map(y=>`<path d="M${30+(y-64)*.3} ${y} Q100 ${y+12} ${170-(y-64)*.3} ${y}" stroke="#CBD1D8" stroke-width="1" stroke-dasharray="2.5 2" fill="none"/>`).join('')}
      <ellipse cx="100" cy="64" rx="76" ry="15" fill="#FFFFFF" stroke="#C4CAD1" stroke-width="2"/><ellipse cx="100" cy="65" rx="64" ry="10" fill="#E9ECEF"/>
      <ellipse cx="100" cy="67" rx="52" ry="7" fill="#2A3140"/>`);
  }
  if(kind==='marine'){   /* 해병 팔각모 — 팔각 정수리가 냄비 바닥, 챙은 옆으로 */
    const body='M32 66 L46 128 L62 142 L100 147 L138 142 L154 128 L168 66 Z';
    return wrap(`<defs><clipPath id="${id}"><path d="${body}"/></clipPath><clipPath id="${id}b"><path d="M150 72 Q194 70 198 90 Q186 104 154 98 Z"/></clipPath></defs>
      <path d="M150 72 Q194 70 198 90 Q186 104 154 98 Z" fill="#3E4A5C"/><g clip-path="url(#${id}b)">${pix(5,CAMO.marine,150,66,50,40,40,4)}</g>
      <path d="${body}" fill="#55606E"/><g clip-path="url(#${id})">${pix(21,CAMO.marine,30,60,140,90,170)}
        <path d="M46 128 L154 128 M62 142 L52 70 M138 142 L148 70 M100 147 L100 74" stroke="#2A2F38" stroke-width="1.3" opacity=".5" fill="none"/></g>
      <path d="${body}" fill="none" stroke="#2A2F38" stroke-width="2.5"/>
      <g fill="#1F242B" transform="translate(100 101)"><path d="M0 -14 l2 4.2 4.6.6-3.3 3.2.8 4.6-4.1-2.2-4.1 2.2.8-4.6-3.3-3.2 4.6-.6z"/>
        <path d="M-1.4 -2 h2.8 v13 q5-.6 7.6-5 l2.2 1.4 q-3.4 7-11 7.6 q-7.6-.6-11-7.6 l2.2-1.4 q2.6 4.4 7.6 5z"/><rect x="-6" y="0" width="12" height="2.4" rx="1"/>
        <path d="M-12 -4 q-6 -4 -9 2 q5 -1 9 2z M12 -4 q6 -4 9 2 q-5 -1 -9 2z"/></g>
      <ellipse cx="100" cy="66" rx="70" ry="14" fill="#3E4A5C"/><ellipse cx="100" cy="67" rx="62" ry="10" fill="#1A1E25"/>`);
  }
  /* 육군 모자(디지털 무늬) · 공군 모자(남색 + 흰 패치) — 야구모 형태 */
  const air=kind==='air', body='M32 66 Q32 148 100 150 Q168 148 168 66 Z';
  const base=air?'#2C3E73':'#7A7B62', dark=air?'#1E2C55':'#3B3A30';
  return wrap(`<defs><clipPath id="${id}"><path d="${body}"/></clipPath><clipPath id="${id}b"><path d="M150 70 Q196 64 199 86 Q188 102 152 94 Z"/></clipPath>
      <radialGradient id="${id}g" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff" stop-opacity="${air?.22:.12}"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></radialGradient></defs>
    <path d="M150 70 Q196 64 199 86 Q188 102 152 94 Z" fill="${air?dark:base}"/>
    ${air?'':`<g clip-path="url(#${id}b)">${pix(3,CAMO.cap,150,62,52,44,40,4)}</g>`}
    <path d="M156 76 Q190 72 194 86 M158 82 Q188 80 191 90" stroke="${dark}" stroke-width="1" stroke-dasharray="2.5 2" fill="none" opacity=".7"/>
    <path d="${body}" fill="${base}"/><g clip-path="url(#${id})">${air?'':pix(9,CAMO.cap,30,60,140,92,170)}
      ${[-46,-16,16,46].map(dx=>`<path d="M100 150 Q${100+dx*1.15} 108 ${100+dx*1.5} 66" stroke="${dark}" stroke-width="1.3" stroke-dasharray="3 2" fill="none" opacity=".55"/>`).join('')}
      <rect width="200" height="170" fill="url(#${id}g)"/></g>
    <circle cx="100" cy="148" r="3.4" fill="${dark}"/>
    <path d="${body}" fill="none" stroke="${dark}" stroke-width="2.5"/>
    ${air?`<g transform="translate(86 96)"><rect width="28" height="11" rx="1.5" fill="#F4F6F8"/><rect x="3" y="4" width="22" height="3" rx="1" fill="#9FB4D6"/></g>`:''}
    <ellipse cx="100" cy="66" rx="70" ry="14" fill="${dark}"/><ellipse cx="100" cy="67" rx="62" ry="10" fill="#15171C"/>`);
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
    <div class="spcnt"><small>지금까지 <b data-cnt="all">${kfmt(countTotal())}</b>명이 군생활을 요리했어요</small>${countStrip()}<em class="pphint">👆 숫자를 누르면 우리 군 롤링페이퍼</em></div>
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
    <div class="letter up"><span>📨</span><div><b>입영통지서가 도착했습니다</b><small>어느 군으로 입대했나요? · 지금까지 <b data-cnt="all">${kfmt(countTotal())}</b>명 입대 · <u data-paper="${S.force||'육군'}">📜 롤링페이퍼</u></small></div></div>
    <div class="fgrid f5">${FORCE5.map((f,n)=>`<button class="opt tile up ${S.force===f.n?'on':''} ${f.n==='기타'?'wide':''}" style="--d:${60+n*40}ms" data-f="${f.n}">
      <span class="ck">✓</span><span class="big">${f.i}</span><span class="tt">${f.n}</span>
      <span class="dd">${f.d||`복무 ${(DS_SERVICE.find(x=>x.군별===f.n)||{}).복무기간_개월}개월 · 특기 ${DS_MOS.filter(x=>x.군별===f.n).length}종`}</span>
      <span class="fcnt" data-paper="${f.n}">👥 <b data-cnt="${f.n}">${kfmt(CNT.v[f.n])}</b>명 입대 📜</span></button>`).join('')}</div>`;
  $('scr').querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{haptic();S.force=b.dataset.f;
    $('scr').querySelectorAll('.opt').forEach(o=>o.classList.toggle('on',o===b));$('next').disabled=false;$('next').textContent=`${S.force} 입대하기`;});
  $('cta').innerHTML=`<button class="btn" id="next" ${S.force?'':'disabled'}>${S.force?S.force+' 입대하기':'군을 골라주세요'}</button>`;
  $('next').onclick=()=>{haptic(); if(!S.counted){S.counted=true; hitForce(S.force);} go('form');};   // 한 번 요리할 때 1회만 센다
}

/* ═══ 2. 훈련소 신상명세서 — 학력(edu1) · 전공 ═══ */
function scForm(){
  $('scr').innerHTML=`
    <div class="mma"><div class="mma-av">${npcSvg('mma')}</div>
      <div class="mma-b"><em>병무청 담당자</em><p>${S.force} 입영을 축하드려요! 배치에 참고하도록 <b>신상명세서</b>를 작성해 주세요 ✍️</p></div></div>
    <div class="paper handoff">
      <div class="ph2"><span class="emb"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18.5" fill="#fff" stroke="#1F3B73" stroke-width="2"/>
          <g transform="translate(20 20)">${taegeukG(10)}</g></svg></span>
        <div class="pt"><small>병무청 서식 제12호</small><b>신 상 명 세 서</b><span>${S.force} 입영 대상자용</span></div>
        <span class="serial"><i class="bar"></i><em>No. ${new Date().getFullYear()}-${String(Math.floor(1000+Math.random()*8999))}</em></span></div>
      <div class="pf"><label>최종 학력</label><div class="chips5 edu">${EDU5.map(([v,l])=>`<button class="chip ${S.edu===v?'on':''}" data-e="${v}">${l}</button>`).join('')}</div></div>
      <div class="pf grow"><label>전공 <small>${S.edu===3?'(고졸이면 관심 있는 계열)':''}</small></label>
        <div class="chips5 mj">${MAJOR5.map(([m])=>`<button class="chip ${S.major===m?'on':''}" data-m="${m}">${m}</button>`).join('')}</div></div>
      <div class="pfoot"><span class="pseal">🔒 기재 내용은 이 기기 안에서만 쓰여요</span>
</div>
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
function mosLabel(){ return S.mos?((FAM5[S.mos.직군]||[])[1]||S.mos.특기명):''; }
function scMos(){
  const all=mosList();
  const fams=Object.keys(FAM5).map(k=>({k,L:all.filter(m=>m.직군===k)})).filter(x=>x.L.length).sort((a,b)=>b.L.length-a.L.length);
  $('scr').innerHTML=`
    <div class="scene2 sm up"><div class="sc-art">${forceArt(S.force)}<span class="sc-npc">${npcSvg(S.force)}</span>
        <span class="sc-tag">🏕️ ${S.force} 자대 배치 면담</span><span class="sc-me"><canvas id="cM"></canvas></span></div>
      <div class="sc-bub"><em>${S.force} 교관</em>${esc(MOS_ASK[S.force]||MOS_ASK['육군'])}</div></div>
    <div class="famgrid big up" style="--d:60ms">${fams.map(f=>`<button class="opt famt ${S.mos&&S.mos.직군===f.k?'on':''}" data-k="${f.k}">
      <span class="em">${FAM5[f.k][0]}</span><span class="tx"><span class="tt">${FAM5[f.k][1]}</span><span class="dd">${esc(topBy(f.L,'분야',3).join('·'))}</span></span></button>`).join('')}</div>`;
  mount($('cM'),34);
  const sync=()=>{$('next').disabled=!S.mos;$('next').textContent=S.mos?`"${mosLabel()}" 해보고 싶습니다!`:'하고 싶은 일을 골라주세요';};
  $('scr').querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{haptic();const f=fams.find(x=>x.k===b.dataset.k);
    const top=topBy(f.L,'분야',1)[0]; S.mos=f.L.find(m=>m.분야===top)||f.L[0];   // 대표 특기(가장 흔한 분야)로 배치
    $('scr').querySelectorAll('.famt').forEach(o=>o.classList.toggle('on',o===b));sync();});
  $('cta').innerHTML=`<button class="btn" id="next" disabled></button>`;sync();
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
    b.className='evbody up evtext rp';
    b.innerHTML=`<div class="rpwall" id="rpw"><div class="ppload">${S.force} 롤링페이퍼 불러오는 중…</div></div>
      <div class="rpwrite"><span class="rpto">To. ${S.force} 전우들 <em>From. ${esc(mosLabel())} 병장</em></span>
        <div class="ppbox"><textarea id="rpm" maxlength="80" rows="2" placeholder="전역하며 남기는 한마디 (80자)">${esc(S.paperMsg||'')}</textarea><b id="rpc">${(S.paperMsg||'').length}/80</b></div></div>
      <div class="rolling"><span>💭 내 꿈 한 단어</span><input class="inp" id="kw" maxlength="16" placeholder="예) 보안관제, 정비, 물류" value="${esc(cur||'')}"></div>
      <div class="quick">${(sug.length?sug:['정비','보안','물류','전기','조리','안전']).map(k=>`<button data-k="${esc(k)}">#${esc(k)}</button>`).join('')}</div>`;
    b.querySelectorAll('[data-k]').forEach(x=>x.onclick=()=>{haptic();$('kw').value=x.dataset.k;});
    $('rpm').oninput=x=>{S.paperMsg=x.target.value;$('rpc').textContent=`${x.target.value.length}/80`;};
    $('scr').querySelector('.evfoot span').innerHTML=`📜 한마디는 <b>${S.force} 롤링페이퍼</b>에 공개돼요 · 꿈은 검색어로만 쓰여요`;
    loadPapers(S.force).then(({list})=>{const w=$('rpw'); if(!w) return;
      w.innerHTML=list.length?list.slice(0,12).map(noteHtml).join('')
        :`<div class="ppempty sm"><span>📝</span><b>첫 ${S.force} 롤링페이퍼 주인공이 되어보세요</b><small>후임들과 전우들이 읽게 돼요</small></div>`;});
    $('cta').innerHTML=`<div class="btn-row"><button class="btn sub" id="skip" style="flex:0 0 108px">건너뛰기</button><button class="btn" id="ok">남기고 전역 준비</button></div>`;
    $('ok').onclick=()=>{haptic();
      const m=paperClean($('rpm').value,80);
      if(m.length>=2&&!S.paperSent){
        if(PAPER_LINK.test(m)){toast('링크는 남길 수 없어요');return;}
        S.paperSent=true;
        postPaper(S.force,`${mosLabel()} 병장`,m).then(sv=>toast(sv.local?'📜 롤링페이퍼를 이 기기에 남겼어요':'📜 롤링페이퍼에 남겼어요'));
      }
      answer($('kw').value.trim());};
    $('skip').onclick=()=>{haptic();answer('');};
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
      <div class="rankbig up" style="--d:80ms">${last?'<em>전역</em>! 이제 요리할 시간':`<em>${next}</em>(으)로 진급!`}</div>
      <div class="deltas">${SK.filter(k=>g[k]).map((k,i)=>`<b class="pop" style="--d:${160+i*60}ms">${SN(k).i} ${SN(k).n} <i>+${g[k]}</i></b>`).join('')}
        ${RANK_ITEM[r]?`<b class="pop" style="--d:420ms">${iemoji(RANK_ITEM[r])} ${iname(RANK_ITEM[r])}</b>`:''}</div>
    </div>
    <div class="card up collected" style="--d:300ms"><div class="ct">🧺 이번 계급에서 모은 재료</div>
      ${got.map(x=>`<div class="cl"><span>${x.w}</span><b>${esc(x.a)}</b></div>`).join('')}</div>`;
  requestAnimationFrame(()=>{const h=Math.max(70,$('pst').clientHeight-16);mount($('cP'),Math.min(200,Math.floor(h*GW/GH)));});
  setTimeout(()=>party(last?'big':'small'),380);
  if(window.gsap&&!FX.reduce) gsap.fromTo('.rankbig',{scale:.6},{scale:1,duration:.6,ease:'back.out(2.4)',delay:.1,clearProps:'transform'});
  $('cta').innerHTML=`<button class="btn" id="next">${last?'🧭 전역 후 계획 세우기':'계속 복무하기'}</button>`;
  $('next').onclick=()=>{haptic();if(last) go('path'); else go('ev',{si:S.si+1,ei:0});};
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
  if(S.plan==='school'){            // 복학: 졸업 후 학력 · 신입 · 졸업 후 희망 분야
    q.edu1=eduCode(gradEdu()); q.mcareerchk='1';
    const R2=S.ans.rbcd2||[];
    if(R2.length){ q.rbcd=R2.join(','); const rp=(a.rpcd||[]).filter(p=>R2.includes(RB_OF_PART[p])); if(rp.length) q.rpcd=rp.join(','); else delete q.rpcd; }
  }
  return q;
}
function qnFilter(){ return {obligfldcd:S.ans.qnField||[],seriescd:S.ans.qnSeries&&S.ans.qnSeries!=='all'?S.ans.qnSeries:null,major:S.major}; }
/* ═══ 6. 요리 중 — 실제 호출 순서대로 ═══ */
const COOK_STEPS=[['📮','채용공고 모으는 중'],['📜','자격증 정보 모으는 중'],['🔗','공고와 자격 연결'],['🍽️','코스 플레이팅']];
function scCook(){
  $('scr').innerHTML=`<div class="splash cook">
    <div class="sp-stage small">${capSvg('helmet')}<div class="flame"><i></i><i></i><i></i></div></div>
    <div class="anlt"><b id="apct">0%</b><span>당신의 군생활을 요리하는 중</span></div>
    <div class="abar"><i id="abar"></i></div>
    <div class="asteps">${COOK_STEPS.map(s=>`<div class="astep"><span class="ai">${s[0]}</span><span class="an">${s[1]}</span><span class="ac"></span></div>`).join('')}</div></div>`;
  const T=2600,t0=performance.now(),N=COOK_STEPS.length;
  (function tk(t){ if(S.scr!=='cook'||!$('abar')) return;
    const p=Math.min(1,(t-t0)/T),e=1-Math.pow(1-p,2.2);
    $('abar').style.width=e*100+'%';$('apct').textContent=Math.round(e*100)+'%';
    document.querySelectorAll('.astep').forEach((s,i)=>{s.classList.toggle('doing',e>=i/N&&e<(i+1)/N);s.classList.toggle('done',e>=(i+1)/N);});
    if(p<1) requestAnimationFrame(tk); else setTimeout(()=>{S.res=cookResult();go('result',{tab:S.plan==='school'?'post':'course',page:0,target:null,cslide:0});},300);
  })(t0);
}

/* ═══ 결과 계산 — 두 API 응답 결합 ═══ */
const AREA_NAME=Object.fromEntries(JK_AREA1);
function jtLabel(g){ return String(g.job_type_label||'').split(',').filter(t=>t&&t!=='0').join(',')||'미기재'; }
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
      ${S.plan==='school'?`<button class="${S.tab==='post'?'on':''}" data-t="post">① 목표 공고<em>${R.total>99?'99+':R.total}</em></button>
      <button class="${S.tab==='course'?'on':''}" data-t="course">② 나의 코스</button>`
      :`<button class="${S.tab==='course'?'on':''}" data-t="course">코스</button>
      <button class="${S.tab==='post'?'on':''}" data-t="post">채용공고<em>${R.total>99?'99+':R.total}</em></button>`}
      <button class="${S.tab==='cert'?'on':''}" data-t="cert">자격증<em>${R.certs.length}</em></button></div>
    <div id="rbody" class="rbody"></div>`;
  document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{haptic();S.tab=b.dataset.t;S.page=0;render();});
  if(!['course','post','cert'].includes(S.tab)) S.tab='course';
  ({course:resCourse,post:resPost,cert:resCert})[S.tab]($('rbody'));
  $('cta').innerHTML=`<div class="btn-row"><button class="btn sub" id="again" style="flex:0 0 104px">다시 요리</button><button class="btn" id="inv">📤 선후임에게 공유하기</button></div>`;
  $('inv').onclick=openInvite;
  $('again').onclick=()=>{haptic();Object.assign(S,{counted:false,paperSent:false,paperMsg:'',partied:false,plan:null,cslide:0,target:null,force:null,mos:null,edu:null,major:null,ans:{},si:0,ei:0,rk:0,hist:[],lastGain:{},res:null,mosQ:'',mosCat:'전체',mosPage:0});go('force');};
}
function resSum(box){
  const R=S.res, tc=R.certs.filter(c=>c.need).slice(0,3), ok=R.certs.filter(c=>c.el.ok).length;
  const menu=resMenu(), field=courseField(), road=courseItems();
  box.innerHTML=`
    <div class="card menu up"><div class="mrow"><div class="cv"><canvas id="cR"></canvas></div>
      <div class="mtx"><span class="k">오늘의 메뉴</span><b>${esc(menu)} 정식</b><small>${S.force} ${esc(mosLabel())} · 곁들임 ${tc[0]?esc(tc[0].it.jmfldnm):'자격 코스'}</small></div>
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
  box.innerHTML=`${S.plan==='school'?`<div class="pickh"><b>🎯 졸업 후 지원할 목표 공고를 골라주세요</b><span>고른 공고에 맞춰 복학 기간 동안의 자격 코스를 짜드려요</span></div>`:''}
    <div class="fgrid one" id="pg" data-swipe-pager="ppg"></div><div id="ppg"></div>`;
  box.className='rbody col';
  if(!R.posts.length){$('pg').innerHTML='<div class="empty">조건에 맞는 공고가 없어요. 다시 요리하며 답을 바꿔보세요.</div>';return;}
  requestAnimationFrame(()=>{
    const r=fillPaged($('pg'),R.posts.length,86,S.page,i=>{const p=R.posts[i];
      return `<button class="post2 ${S.target===i?'tgt':''}" data-i="${i}">${S.target===i?'<i class="tgtb">🎯 목표</i>':''}<span class="co">${esc(p.co)}${/전역|군필|병역|제대/.test(p.title+p.g.GI_Keyword)?' · 🎖️군필 우대':''}</span>
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
  box.innerHTML=`<div class="fgrid one" id="cg" data-swipe-pager="cpg"></div><div id="cpg"></div>`;
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
    <div class="meta"><b>📍 ${esc(p.area)}</b><b>${esc(jtLabel(g))}</b><b>${esc(g.career_label||'')}${g.GI_Career==='2'&&+g.GI_Career_Year_Cnt?` ${g.GI_Career_Year_Cnt}년↑`:''}</b>
      <b>🎓 ${esc(g.edu_label||'학력무관')}</b><b>💰 ${esc(p.pay)}</b><b class="${p.dday!=null&&p.dday<=7?'warn':''}">⏰ ${p.dday==null?'상시':p.dday<=0?'오늘 마감':'D-'+p.dday}</b></div>
    ${g.GI_Keyword?`<div class="tags">${g.GI_Keyword.split(',').slice(0,8).map(t=>`<i>#${esc(t.trim())}</i>`).join('')}</div>`:''}
    <div class="sec" style="margin-top:14px">이 공고와 연결된 자격</div>
    ${p.certs.length?p.certs.map(c=>certRow({it:c,need:0,el:eligibility(c)})).join(''):'<p class="fine">연결된 자격이 없어요.</p>'}
    <p class="fine">자격은 공고 제목·키워드·직무로 연결했어요. 실제 우대 조건은 원문에서 확인하세요.<br>출처 잡코리아 · 채용기업과 잡코리아의 동의 없이 무단 전재·재배포할 수 없어요.</p>
  </div><div class="sfoot">${p.url?`<a class="btn sub sm" href="${esc(p.url)}" target="_blank" rel="noopener" style="flex:0 0 112px">원문 보기 ↗</a>`:''}<button class="btn sm" id="sc">🎯 이 공고로 내 코스 짜기</button></div>`,sh=>{
    $('sc').onclick=()=>{haptic();const i=S.res.posts.indexOf(p);closeSheet();S.target=i<0?null:i;S.tab='course';S.cslide=0;slide(1,render);}; sh.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>openCert(b.dataset.j));});
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
/* ═══ 8. 전역 후 진로 — 취업 / 복학 ═══ */
function scPath(){
  const school=S.edu>=4&&S.edu<=4.5?'복학':'진학·복학';
  $('scr').innerHTML=`
    <div class="scene2 up"><div class="sc-art">${forceArt(S.force)}<span class="sc-npc">${npcSvg(S.force)}</span>
        <span class="sc-tag">🎖️ 전역 신고 직후</span><span class="sc-rk">예비역</span><span class="sc-me"><canvas id="cE"></canvas></span></div>
      <div class="sc-bub"><em>${S.force} 인사장교</em>전역 축하한다! 사회에 나가면<br>바로 일할 건가, 학교로 돌아갈 건가?</div></div>
    <div class="pathgrid up" style="--d:80ms">
      <button class="pathc ${S.plan==='job'?'on':''}" data-p="job"><span class="em">💼</span><b>바로 취업</b><span>전역 후 바로 일을 시작해요</span><i>지금 학력 기준으로 공고·자격을 찾아요</i></button>
      <button class="pathc ${S.plan==='school'?'on':''}" data-p="school"><span class="em">🎓</span><b>${school}</b><span>학교로 돌아가 졸업 후 취업해요</span><i>졸업 후 학력(${EDU5.find(x=>x[0]===gradEdu())?.[1]||'-'}) 기준으로 미리 준비해요</i></button>
    </div>`;
  mount($('cE'),44);
  $('scr').querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{haptic();S.plan=b.dataset.p;
    $('scr').querySelectorAll('.pathc').forEach(x=>x.classList.toggle('on',x===b));
    setTimeout(()=>go(S.plan==='job'?'cook':'school'),220);});
}
function scSchool(){
  const sel=new Set(S.ans.rbcd2||S.ans.rbcd||[]), rec=new Set([...majorRb(),...(FAM_RB[fam()]||[])]);
  const O=Object.keys(JK_RB).map(v=>({v,l:RB_LABEL[v],star:rec.has(v)})).sort((a,b)=>b.star-a.star);
  $('scr').innerHTML=`
    <div class="schoolh up"><span class="em">🎓</span><div><b>복학 후 어느 곳에 취업하고 싶어?</b>
      <small>${esc(S.major||'')} 전공 · 졸업 후 ${EDU5.find(x=>x[0]===gradEdu())?.[1]||''} 기준으로 공고를 찾아요</small></div></div>
    <div class="evbody evmulti up" style="--d:60ms" id="sb">${O.map((o,i)=>`<button class="evchip ${sel.has(o.v)?'on':''}" data-i="${i}">${o.l}${o.star?'<i>★</i>':''}</button>`).join('')}</div>
    <div class="evfoot"><span>★ 전공·주특기 추천 · 최대 2개</span><span>졸업 후 신입 기준</span></div>`;
  const sync=()=>{$('next').disabled=!sel.size;$('next').textContent=sel.size?`졸업 후 코스 짜기 (${sel.size}/2)`:'희망 분야를 골라주세요';};
  $('sb').querySelectorAll('[data-i]').forEach(x=>x.onclick=()=>{const v=O[+x.dataset.i].v;
    if(sel.has(v)) sel.delete(v); else { if(sel.size>=2){toast('2개까지 고를 수 있어요');return;} sel.add(v); }
    haptic();x.classList.toggle('on',sel.has(v));sync();});
  $('cta').innerHTML=`<button class="btn" id="next" disabled></button>`;sync();
  $('next').onclick=()=>{haptic();S.ans.rbcd2=[...sel];go('cook');};
}

/* ═══ 9. 꿈을 위한 코스 서비스 — 공고 데이터 분석 ═══
   스냅샷에 담긴 필드(학력·경력·고용형태·키워드 태그·제목)와 연결된 자격으로 요건을 집계하고,
   채용 절차는 직무군별 일반 전형에 공고 문구에서 찾은 단계(코딩테스트·NCS·실기 등)를 겹쳐 보여준다.
   공고 원문의 상세 요강은 담지 않는다 — 각 공고의 '원문 보기'에서 확인. */
const PROC={
  '10031':['서류','코딩테스트','기술면접','컬처핏·임원면접'],'10040':['서류','직무면접(전공·PT)','임원면접','건강검진'],
  '10041':['서류','면접','건강검진','교대근무 배치'],'10039':['서류','실기·실무 확인','면접'],'10033':['서류','면접','실무 확인(장비·시스템)'],
  '10034':['서류(면허·경력)','운전 실기','면접'],'10043':['서류(자격증)','면접','현장 배치'],'10038':['서류','실기(조리 테스트)','면접','보건증'],
  '10044':['서류(면허)','면접','건강검진'],'10027':['서류','인적성·NCS','실무면접','임원면접'],'10028':['서류','인적성·NCS','실무면접','임원면접'],
  '10035':['서류','면접','영업 PT'],'10045':['서류','실기 시연','면접'],'10046':['서류','필기(NCS·전공)','면접','신원조회']};
const PROC_HINT=[[/코딩\s?테스트|코테|알고리즘/,'코딩테스트'],[/과제|포트폴리오/,'과제·포트폴리오'],[/PT|프레젠테이션|발표/,'PT 면접'],
  [/NCS|인적성|필기/,'필기·인적성'],[/실기|시연|테스트/,'실기'],[/체력/,'체력 측정'],[/수습|인턴/,'수습 기간']];
const VET_RX=/전역|군필|병역필|제대|예비역|군\s?경력|ROTC|부사관|장교|군\s?우대/;
const TAG_STOP=new Set(['정규직','계약직','신입','경력','경력무관','신입·경력','채용','모집','사원','직원','주5일','4대보험','인턴','아르바이트','상시','즉시','급구']);
function analyzeCourse(R){
  const P=R.posts, n=Math.max(1,P.length), pct=f=>Math.round(P.filter(f).length/n*100);
  const edu=[['학력무관',pct(p=>['0','255'].includes(p.g.GI_EDU_CutLine))],['고졸',pct(p=>p.g.GI_EDU_CutLine==='3')],
    ['초대졸',pct(p=>p.g.GI_EDU_CutLine==='4')],['대졸↑',pct(p=>['5','6'].includes(p.g.GI_EDU_CutLine))]];
  const myEdu=eduCode(effEdu()), eduOk=pct(p=>['0','255'].includes(p.g.GI_EDU_CutLine)||+p.g.GI_EDU_CutLine<=myEdu);
  const newbie=pct(p=>['1','3','4'].includes(p.g.GI_Career));
  const yrs=P.filter(p=>p.g.GI_Career==='2'&&+p.g.GI_Career_Year_Cnt>0&&+p.g.GI_Career_Year_Cnt<40).map(p=>+p.g.GI_Career_Year_Cnt);
  const jt={}; P.forEach(p=>String(p.g.job_type_label||'').split(',').filter(t=>t&&t!=='0').forEach(t=>{jt[t]=(jt[t]||0)+1;}));
  const jobType=Object.entries(jt).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([t,c])=>[t,Math.round(c/n*100)]);
  const vet=pct(p=>VET_RX.test(p.title+' '+p.g.GI_Keyword));
  const tg={}; P.forEach(p=>String(p.g.GI_Keyword||'').split(',').map(t=>t.trim()).filter(t=>t&&t.length<=12&&!TAG_STOP.has(t)).forEach(t=>{tg[t]=(tg[t]||0)+1;}));
  const tags=Object.entries(tg).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const rbc={}; P.forEach(p=>p.g.parts.forEach(x=>{const r=RB_OF_PART[x]; if(r) rbc[r]=(rbc[r]||0)+1;}));
  const rb=Object.keys(rbc).sort((a,b)=>rbc[b]-rbc[a])[0]||(S.ans.rbcd2||S.ans.rbcd||[])[0]||'10027';
  const found=[...new Set(PROC_HINT.filter(([rx])=>P.some(p=>rx.test(p.title+' '+p.g.GI_Keyword))).map(([,l])=>l))];
  const certs=R.certs.filter(c=>c.need).slice(0,4); if(!certs.length) certs.push(...R.certs.slice(0,3));
  return {n:P.length,total:R.total,edu,eduOk,newbie,yrs:yrs.length?Math.round(yrs.reduce((a,b)=>a+b,0)/yrs.length):0,jobType,vet,tags,rb,
    proc:PROC[rb]||PROC['10027'],found,certs,top:P[0]};
}
function certWhen(c){
  const nowOk=eligibility(c.it).ok;
  if(c.it.seriescd==='05'||c.it.qualgbcd==='S') return nowOk?'지금 바로':'요건 확인';
  if(nowOk) return S.plan==='school'?'졸업 전까지':'전역 직후';
  return '경력 쌓은 뒤';
}
function resCourse(box){
  const R=S.res;
  if(S.target!=null&&R.posts[S.target]) return resCourseTarget(box,R.posts[S.target]);
  if(S.plan==='school'){ box.className='rbody col'; box.innerHTML=`<div class="empty pick0"><span>🎯</span><b>먼저 목표 공고를 골라주세요</b><small>공고에 맞춰 복학 기간의 자격 코스를 짜드려요</small><button class="btn sm" id="gopost">목표 공고 고르기</button></div>`;
    $('gopost').onclick=()=>{haptic();S.tab='post';render();}; return; }
  const A=analyzeCourse(R), menu=resMenu(), road=courseItems();
  box.className='rbody col course2';
  const bar=A.edu.map(([l,v],i)=>v?`<i class="e${i}" style="flex:${v}" title="${l} ${v}%"></i>`:'').join('');
  const cards=[
    ['📋','지원 자격',`<div class="kv2"><span>내 학력으로 지원 가능</span><b>${A.eduOk}%</b></div>
      <div class="ebar">${bar}</div><div class="elg">${A.edu.map(([l,v],i)=>`<span><i class="e${i}"></i>${l} ${v}%</span>`).join('')}</div>
      <div class="kv2"><span>신입 지원 가능</span><b>${A.newbie}%</b></div>
      ${A.yrs?`<div class="kv2"><span>경력 요구 시 평균</span><b>${A.yrs}년</b></div>`:''}
      <div class="kv2"><span>고용 형태</span><b>${A.jobType.map(([t,v])=>`${esc(t)} ${v}%`).join(' · ')||'-'}</b></div>
      <div class="kv2 hi"><span>🎖️ 군필·전역 우대 언급</span><b>${A.vet}%</b></div>`],
    ['📜','갖춰야 할 자격',`<div class="road3 mini">${road.map((x,i)=>{const e=eligibility(x);return `<button class="rd ${e.ok?'ok':''}" data-j="${x.jmcd}"><i>${COURSE[i][0]} ${COURSE[i][1]}</i><b>${esc(x.jmfldnm)}</b><span>${e.ok?'✓ ':''}${e.t}</span></button>`;}).join('<em>→</em>')}</div>
      <div class="clist">${A.certs.map(c=>`<button class="cl2" data-j="${c.it.jmcd}"><b>${esc(c.it.jmfldnm)}</b><span>${c.need?`공고 ${c.need}건 연결`:'분야 추천'}</span><em class="${c.el.ok?'ok':'no'}">${certWhen(c)}</em></button>`).join('')}</div>`],
    ['✨','우대 역량 키워드',`<div class="tcloud">${A.tags.map(([t,c],i)=>`<span style="--w:${Math.max(.82,1.25-i*.05)}">#${esc(t)}<em>${c}</em></span>`).join('')||'<p class="fine">키워드가 적은 공고예요.</p>'}</div>
      <p class="fine">공고 ${A.n}건의 키워드 태그를 모았어요. 숫자는 그 키워드를 단 공고 수예요.</p>`],
    ['🧭','채용 프로세스',`<ol class="proc">${A.proc.map((s,i)=>`<li><b>${i+1}</b><span>${esc(s)}</span>${A.found.some(f=>s.includes(f.split('·')[0]))?'<em>공고 확인</em>':''}</li>`).join('')}</ol>
      ${A.found.length?`<p class="fine">공고 문구에서 찾은 단계: <b>${A.found.join(' · ')}</b></p>`:''}
      <p class="fine">${esc(JK_RB[A.rb]||'')} 직무의 일반 전형이에요. 실제 절차는 공고마다 달라요.</p>`],
    ['🗓️','나의 코스',`<ol class="tl">
      <li class="done"><b>군 복무</b><span>${esc(S.force)} ${esc(mosLabel())} · ${months()}개월 · 주특기 경험 정리</span></li>
      ${S.plan==='school'?`<li><b>복학</b><span>${esc(S.major||'전공')} 공부 + ${road[1]?esc(road[1].jmfldnm):'산업기사'} 준비 · ${A.tags.slice(0,2).map(t=>'#'+esc(t[0])).join(' ')} 역량 쌓기</span></li>
        <li><b>졸업</b><span>${EDU5.find(x=>x[0]===gradEdu())?.[1]||''} · ${road[2]?esc(road[2].jmfldnm):'상위 자격'} 도전</span></li>`
        :`<li><b>전역 직후</b><span>${road[0]?esc(road[0].jmfldnm):'기능사'} 취득 · 이력서에 군 경력 녹이기</span></li>`}
      <li><b>지원</b><span>${esc(A.proc[1]||'면접')} 대비 · 공고 ${A.total}건 중 ${A.n}건 우선 지원</span></li>
      <li class="goal"><b>${esc(menu)}</b><span>꿈 완성 🍽️</span></li></ol>`]];
  box.innerHTML=`
    <div class="chd up"><div class="ctx"><span class="k">당신의 꿈을 이루기 위한 <b>코스 서비스</b></span><b>${esc(menu)} 정식</b>
        <small>${S.plan==='school'?'🎓 복학 후 취업':'💼 바로 취업'} · 공고 <b data-count="${A.total}">0</b>건 분석</small></div>
      <div class="mico"><button data-card="dis" aria-label="전역카드">🎖️<span>전역카드</span></button><button data-card="nc" aria-label="명함">🪪<span>명함</span></button></div></div>
    <div class="rcnt">${countStrip(true)}</div>
    <div class="crs" id="crs">${cards.map(([e,t,b],i)=>`<section class="ccard"><h4><span>${e}</span>${t}<em>${i+1}/${cards.length}</em></h4><div class="cb">${b}</div></section>`).join('')}</div>
    <div class="dots" id="dots">${cards.map((c,i)=>`<button data-d="${i}" aria-label="${c[1]}">${c[0]}</button>`).join('')}</div>
    ${A.top?`<button class="toppost" id="tp"><span>대표 공고</span><b>${esc(A.top.co)} · ${esc(A.top.title)}</b><em>원문 ↗</em></button>`:''}`;
  countUp(box); stagger('.ccard,.chd',box);
  if(!S.partied){S.partied=true;setTimeout(()=>party('big'),450);}
  const crs=$('crs'), dots=[...box.querySelectorAll('[data-d]')];
  const mark=()=>{const i=Math.round(crs.scrollLeft/Math.max(1,crs.clientWidth)); S.cslide=i; dots.forEach((d,k)=>d.classList.toggle('on',k===i));};
  crs.addEventListener('scroll',()=>requestAnimationFrame(mark),{passive:true});
  dots.forEach(d=>d.onclick=()=>{haptic();crs.scrollTo({left:+d.dataset.d*crs.clientWidth,behavior:'smooth'});});
  requestAnimationFrame(()=>{crs.scrollLeft=(S.cslide||0)*crs.clientWidth; mark();});
  box.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>{haptic();openCert(b.dataset.j);});
  box.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>openCardSheet(b.dataset.card));
  if($('tp')) $('tp').onclick=()=>{haptic();openPost(A.top);};
}

/* ── 목표 공고 1건 기준 코스 (복학) ── */
function roadFor(certs){
  const fld=(certs.find(c=>c.obligfldcd)||{}).obligfldcd||courseField();
  return ['05','04','03'].map(sc=>certs.find(x=>x.obligfldcd===fld&&x.seriescd===sc)||QNET_ITEMS.find(x=>x.obligfldcd===fld&&x.seriescd===sc)).filter(Boolean).slice(0,3);
}
function resCourseTarget(box,p){
  const g=p.g, myEdu=eduCode(effEdu()), needEdu=+g.GI_EDU_CutLine;
  const eduOk=[0,255].includes(needEdu)||needEdu<=myEdu, newOk=['1','3','4'].includes(g.GI_Career);
  const vet=VET_RX.test(p.title+' '+g.GI_Keyword);
  const tags=String(g.GI_Keyword||'').split(',').map(t=>t.trim()).filter(t=>t&&!TAG_STOP.has(t)).slice(0,10);
  const rb=p.job?p.job[1]:(g.parts.map(x=>RB_OF_PART[x]).find(Boolean)||(S.ans.rbcd2||[])[0]||'10027');
  const proc=PROC[rb]||PROC['10027'], found=PROC_HINT.filter(([rx])=>rx.test(p.title+' '+g.GI_Keyword)).map(([,l])=>l);
  const certs=p.certs.length?p.certs:R0certs(), road=roadFor(certs);
  const lineup=[...new Map([...road,...certs].map(c=>[c.jmcd,c])).values()].slice(0,5);
  const when=c=>{const e=eligibility(c); if(c.seriescd==='05'||c.qualgbcd==='S') return e.ok?['복학 1학기','now']:['요건 확인','no'];
    return e.ok?(c.seriescd==='04'?['복학 2~3학기','mid']:['졸업 학기','end']):['입사 후 경력','no'];};
  const myEduName=EDU5.find(x=>x[0]===effEdu())?.[1]||'-';
  const row=(k,need,mine,ok)=>`<div class="req ${ok?'ok':'no'}"><span>${k}</span><b>${need}</b><em>${ok?'✓ 충족':'✕ 준비 필요'}</em>${mine?`<small>나: ${mine}</small>`:''}</div>`;
  const cards=[
    ['📋','공고 지원 자격',`${row('학력',esc(g.edu_label||'학력무관'),`졸업 후 ${esc(myEduName)}`,eduOk)}
      ${row('경력',esc(g.career_label||'-')+(g.GI_Career==='2'&&+g.GI_Career_Year_Cnt?` ${g.GI_Career_Year_Cnt}년↑`:''),'신입(졸업 예정)',newOk)}
      <div class="kv2"><span>고용 형태</span><b>${esc(jtLabel(g))}</b></div>
      <div class="kv2"><span>근무지 · 급여</span><b>${esc(p.area)} · ${esc(p.pay)}</b></div>
      <div class="kv2 hi"><span>🎖️ 군필·전역 우대</span><b>${vet?'공고에 언급 있음':'언급 없음'}</b></div>`],
    ['📜','이 공고에 맞출 자격',`<div class="road3 mini">${road.map((x,i)=>{const e=eligibility(x);return `<button class="rd ${e.ok?'ok':''}" data-j="${x.jmcd}"><i>${COURSE[i][0]} ${COURSE[i][1]}</i><b>${esc(x.jmfldnm)}</b><span>${e.ok?'✓ ':''}${e.t}</span></button>`;}).join('<em>→</em>')}</div>
      <div class="clist">${lineup.map(c=>{const w=when(c);return `<button class="cl2" data-j="${c.jmcd}"><b>${esc(c.jmfldnm)}</b><span>${p.certs.some(x=>x.jmcd===c.jmcd)?'이 공고와 연결된 자격':'같은 분야 단계 자격'}</span><em class="${w[1]==='no'?'no':'ok'}">${w[0]}</em></button>`;}).join('')}</div>`],
    ['✨','우대 역량 키워드',`<div class="tcloud">${tags.map((t,i)=>`<span style="--w:${Math.max(.85,1.2-i*.04)}">#${esc(t)}</span>`).join('')||'<p class="fine">공고에 키워드 태그가 없어요. 원문에서 우대사항을 확인하세요.</p>'}</div>
      <p class="fine">공고의 키워드 태그예요. 복학 기간에 수업·프로젝트로 하나씩 채워보세요.</p>`],
    ['🧭','채용 프로세스',`<ol class="proc">${proc.map((s,i)=>`<li><b>${i+1}</b><span>${esc(s)}</span>${found.some(f=>s.includes(f.split('·')[0]))?'<em>공고 확인</em>':''}</li>`).join('')}</ol>
      <p class="fine">${esc(JK_RB[rb]||'')} 직무의 일반 전형${found.length?` · 공고 문구에서 찾은 단계: <b>${found.join(' · ')}</b>`:''}. 정확한 절차는 원문에서 확인하세요.</p>`],
    ['🗓️','나의 코스',`<ol class="tl">
      <li class="done"><b>군 복무</b><span>${esc(S.force)} ${esc(mosLabel())} · ${months()}개월 — 자소서에 쓸 경험 정리</span></li>
      <li><b>복학 1학기</b><span>${lineup[0]?esc(lineup[0].jmfldnm)+' 취득':'기초 자격 취득'} · ${tags[0]?'#'+esc(tags[0])+' 기초 다지기':esc(S.major||'전공')+' 기초'}</span></li>
      <li><b>복학 2~3학기</b><span>${lineup[1]?esc(lineup[1].jmfldnm)+' 준비':'상위 자격 준비'} · ${tags.slice(1,3).map(t=>'#'+esc(t)).join(' ')||'관련 프로젝트'}${proc[1]?` · ${esc(proc[1])} 연습`:''}</span></li>
      <li><b>졸업 학기</b><span>${lineup[2]?esc(lineup[2].jmfldnm)+' 도전 · ':''}학력 요건 ${eduOk?'충족 ✓':'확인 필요'} · 같은 회사·직무 공고 알림 설정</span></li>
      <li class="goal"><b>${esc(p.co)} 지원</b><span>${esc(p.job?p.job[2]:p.title)} · ${proc.join(' → ')}</span></li></ol>`]];
  box.className='rbody col course2';
  box.innerHTML=`
    <div class="chd up"><div class="ctx"><span class="k">🎯 목표 공고에 맞춘 <b>코스 서비스</b></span><b>${esc(p.co)}</b>
        <small>${esc(p.title)}</small></div>
      <div class="mico"><button id="chg" aria-label="공고 바꾸기">🔁<span>공고 변경</span></button><button data-card="dis" aria-label="전역카드">🎖️<span>전역카드</span></button></div></div>
    <div class="rcnt">${countStrip(true)}</div>
    <div class="crs" id="crs">${cards.map(([e,t,b],i)=>`<section class="ccard"><h4><span>${e}</span>${t}<em>${i+1}/${cards.length}</em></h4><div class="cb">${b}</div></section>`).join('')}</div>
    <div class="dots" id="dots">${cards.map((c,i)=>`<button data-d="${i}" aria-label="${c[1]}">${c[0]}</button>`).join('')}</div>
    <button class="toppost" id="tp"><span>원문</span><b>자격요건·우대사항·전형은 공고 원문에서 확인</b><em>보기 ↗</em></button>`;
  stagger('.ccard,.chd',box);
  if(!S.partied){S.partied=true;setTimeout(()=>party('big'),450);}
  const crs=$('crs'), dots=[...box.querySelectorAll('[data-d]')];
  const mark=()=>{const i=Math.round(crs.scrollLeft/Math.max(1,crs.clientWidth)); S.cslide=i; dots.forEach((d,k)=>d.classList.toggle('on',k===i));};
  crs.addEventListener('scroll',()=>requestAnimationFrame(mark),{passive:true});
  dots.forEach(d=>d.onclick=()=>{haptic();crs.scrollTo({left:+d.dataset.d*crs.clientWidth,behavior:'smooth'});});
  requestAnimationFrame(()=>{crs.scrollLeft=(S.cslide||0)*crs.clientWidth; mark();});
  box.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>{haptic();openCert(b.dataset.j);});
  box.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>openCardSheet(b.dataset.card));
  $('chg').onclick=()=>{haptic();S.tab='post';render();};
  $('tp').onclick=()=>{haptic(); if(p.url) window.open(p.url,'_blank','noopener'); else openPost(p);};
}
function R0certs(){ return (S.res?S.res.certs:[]).slice(0,3).map(c=>c.it); }

/* ── 뒤로 ── */
$('back').onclick=()=>{
  haptic();
  if(S.scr==='form') return go('force',{},-1);
  if(S.scr==='mos') return go('form',{},-1);
  if(S.scr==='school') return go('path',{},-1);
  if(S.scr==='ev'){ const h=S.hist.pop(); if(!h) return go('mos',{},-1);
    S.stats=h.stats;S.items=h.items;S.si=h.si;S.ei=h.ei; if(S.rk>h.si) S.rk=h.si; slide(-1,render); }
};
$('sheetBg').onclick=e=>{if(e.target===$('sheetBg')) closeSheet();};
document.addEventListener('keydown',e=>{if(e.key==='Escape') closeSheet();});
render();tick();loadCounts();
