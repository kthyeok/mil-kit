/* ═══════════════════════════════════════════════════════════════
   Mil-Kit · 우리들의 이야기 — 군별 익명 게시판 (글 · 댓글 · 대댓글)
   별도 파일: index.html 뒤에 <script src="board.js"> 로 붙는다.
   - API: <meta name="board-api" content="https://…"> (server/board-api.mjs)
     없거나 연결 실패면 이 기기(localStorage)에 저장하고 data.js 스냅샷 글을 함께 보여준다
   - Mil-Kit 안에서는 앱 공용 함수(esc · toast · haptic · LS · FORCE5)를 쓰고,
     단독 페이지에서는 아래 대체 함수로 동작한다 → 전역에서 openBoard() / closeBoard()
   ═══════════════════════════════════════════════════════════════ */
(function(APP){
  /* ── 앱 함수가 없으면(단독 실행) 대체 ── */
  const esc=APP.esc||(s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
  const haptic=APP.haptic||(()=>{try{if(navigator.vibrate&&navigator.userActivation&&navigator.userActivation.isActive) navigator.vibrate(8);}catch(e){}});
  const LS=APP.LS||{get(k,d){try{const v=localStorage.getItem('mk6-'+k);return v==null?d:JSON.parse(v);}catch(e){return d;}},
    set(k,v){try{localStorage.setItem('mk6-'+k,JSON.stringify(v));}catch(e){}}};
  const toast=APP.toast||(m=>{const t=document.createElement('div');t.className='bd-toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2400);});
  const API=((document.querySelector('meta[name="board-api"]')||{}).content||'').trim().replace(/\/$/,'');
  const FORCES=(typeof FORCE5!=='undefined'?FORCE5:[{n:'육군',i:'🪖'},{n:'해군',i:'⚓'},{n:'공군',i:'✈️'},{n:'해병',i:'🔱'},{n:'기타',i:'🎖️'}]);
  const ICON=Object.fromEntries(FORCES.map(f=>[f.n,f.i]));
  const SNAP=(window.MK_DATA||{}).board||{posts:{},comments:{}};
  const BAD=/개새끼|개새|씨발|씨바|시발|ㅅㅂ|ㅆㅂ|병신|ㅂㅅ|좆|존나|졸라|지랄|꺼져|닥쳐|느금마|느금|fuck|shit/gi;   // 욕설은 단어째 ** 로
  const LINK=/https?:|www\.|\.(com|net|kr|io|me|ly)\b/i;
  const line=(v,max)=>String(v||'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max).replace(BAD,'**');
  const text=(v,max)=>String(v||'').replace(/\r\n?/g,'\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g,' ').replace(/[ \t]+/g,' ')
    .replace(/\n{3,}/g,'\n\n').trim().slice(0,max).replace(BAD,'**');
  const ago=t=>{const s=Math.max(0,(Date.now()-new Date(t).getTime())/1000);
    return s<60?'방금':s<3600?`${Math.floor(s/60)}분 전`:s<86400?`${Math.floor(s/3600)}시간 전`:s<86400*30?`${Math.floor(s/86400)}일 전`:new Date(t).toLocaleDateString('ko-KR');};
  const who=(n,f)=>esc(n||`익명의 ${f||''} 예비역`.replace('  ',' '));
  const para=s=>esc(s).replace(/\n/g,'<br>');

  /* ── 저장소: API 우선, 실패하면 이 기기 ── */
  const local=Object.assign({posts:[],comments:[]},LS.get('board',{}));
  const saveLocal=()=>{local.posts=local.posts.slice(0,200);local.comments=local.comments.slice(-1000);LS.set('board',local);};
  let live=false;
  /* 예시 글(board-mock.js): 지금 기준 몇 분 전으로 시간을 매기고, 욕설은 ** 로 가린다 */
  const RAW=window.MK_BOARD_MOCK||{posts:[],comments:[]}, NOW=Date.now(), tAt=m=>new Date(NOW-(+m||0)*60000).toISOString();
  const MOCK={posts:RAW.posts.map(p=>({id:p.id,force:p.force,name:line(p.name,12),title:line(p.title,40),body:text(p.body,1000),at:tAt(p.min),mock:true})),
    comments:RAW.comments.map(c=>({id:c.id,post_id:c.post_id,parent_id:c.parent_id,name:line(c.name,12),body:line(c.body,300),at:tAt(c.min),mock:true}))};
  const isLocalId=id=>/^[LM]/.test(String(id));   // L: 이 기기에 쓴 글 · M: 예시 글 → 서버로 보내지 않는다
  const mockCmts=id=>MOCK.comments.filter(c=>String(c.post_id)===String(id));
  async function api(path,opt){
    const r=await fetch(API+path,Object.assign({cache:'no-store'},opt||{}));
    if(!r.ok){const e=new Error('http '+r.status);e.status=r.status;throw e;}
    live=true; return r.json();
  }
  const post$=(body)=>({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const localCount=id=>local.comments.filter(c=>String(c.post_id)===String(id)).length+((SNAP.comments||{})[id]||[]).length+mockCmts(id).length;
  async function listPosts(f){
    const mock=MOCK.posts.filter(p=>p.force===f).map(p=>({...p,comments:localCount(p.id)}));
    const byNew=(a,b)=>new Date(b.at)-new Date(a.at);
    if(API){ try{ const real=await api(`/board?force=${encodeURIComponent(f)}&limit=40`); return [...real,...mock].sort(byNew); }catch(e){} }
    live=false;
    const mine=local.posts.filter(p=>p.force===f), snap=(SNAP.posts||{})[f]||[];
    return [...mine,...snap].map(p=>({...p,comments:localCount(p.id)})).concat(mock).sort(byNew);
  }
  async function getPost(id){
    if(API&&!isLocalId(id)){ try{ return await api(`/board/${id}`); }catch(e){ if(e.status===404) return null; } }
    const p=local.posts.find(x=>String(x.id)===String(id))||Object.values(SNAP.posts||{}).flat().find(x=>String(x.id)===String(id))||MOCK.posts.find(x=>String(x.id)===String(id));
    if(!p) return null;
    const comments=[...mockCmts(id),...((SNAP.comments||{})[id]||[]),...local.comments.filter(c=>String(c.post_id)===String(id))].sort((a,b)=>new Date(a.at)-new Date(b.at));
    return {post:{...p,comments:comments.length},comments};
  }
  async function createPost(d){
    if(API){ try{ return await api('/board',post$(d)); }catch(e){ if(e.status===429){toast('잠시 후 다시 써주세요');return null;} if(e.status===400){toast('내용을 확인해 주세요');return null;} } }
    const p={id:'L'+Date.now(),...d,at:new Date().toISOString(),comments:0,local:true}; local.posts.unshift(p); saveLocal(); return p;
  }
  async function createComment(postId,d){
    if(API&&!isLocalId(postId)){ try{ return await api(`/board/${postId}/comments`,post$(d)); }catch(e){ if(e.status===429){toast('잠시 후 다시 남겨주세요');return null;} if(e.status===400){toast('내용을 확인해 주세요');return null;} } }
    let parent=d.parent_id||null;
    if(parent){ const all=[...mockCmts(postId),...((SNAP.comments||{})[postId]||[]),...local.comments]; const q=all.find(c=>String(c.id)===String(parent)); if(q&&q.parent_id) parent=q.parent_id; }
    const c={id:'L'+Date.now(),post_id:postId,parent_id:parent,name:d.name,body:d.body,at:new Date().toISOString(),local:true}; local.comments.push(c); saveLocal(); return c;
  }

  /* ── 화면 ── */
  const ST={force:null,view:'list',postId:null,replyTo:null};
  let root=null;
  function mount(){
    if(root) return root;
    root=document.createElement('div'); root.className='bd'; root.id='board';
    root.setAttribute('role','dialog'); root.setAttribute('aria-modal','true'); root.setAttribute('aria-label','우리들의 이야기');
    root.innerHTML=`<div class="bd-top"><button class="bd-back" id="bdBack" aria-label="뒤로">‹</button><b id="bdTitle">우리들의 이야기</b>
      <button class="bd-close" id="bdClose">닫기 ✕</button></div><div class="bd-body" id="bdBody"></div>`;
    const host=document.getElementById('app');
    if(host) host.appendChild(root); else { root.classList.add('bd-fixed'); document.body.appendChild(root); }   // 단독 페이지: 화면 전체
    root.querySelector('#bdClose').onclick=close;
    root.querySelector('#bdBack').onclick=()=>{haptic(); if(ST.view==='list') close(); else show('list');};
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&root.classList.contains('on')) close();});
    return root;
  }
  function open(f){
    haptic(); mount();
    ST.force=f||ST.force||(typeof S!=='undefined'&&S.force)||'육군';
    root.classList.add('on'); show('list');
  }
  function close(){ if(!root) return; haptic(); root.classList.remove('on'); }
  const body=()=>root.querySelector('#bdBody');
  const note=()=>live?'익명 게시판이에요. 욕설은 가려지고 링크는 쓸 수 없어요.'
    :API?'서버에 연결하지 못해 이 기기에만 저장돼요.':'아직 서버(API)가 연결되지 않아 이 기기에만 저장돼요.';

  async function show(view,arg){
    ST.view=view; if(view!=='post') ST.replyTo=null;
    root.querySelector('#bdBack').style.visibility=view==='list'?'hidden':'visible';
    root.querySelector('#bdTitle').textContent=view==='write'?'글쓰기':view==='post'?`${ICON[ST.force]||''} ${ST.force} 이야기`:'우리들의 이야기';
    const b=body(); b.scrollTop=0;
    if(view==='list') return listView(b);
    if(view==='write') return writeView(b);
    if(view==='post') return postView(b,arg);
  }

  async function listView(b){
    b.className='bd-body'; b.dataset.v='list';
    b.innerHTML=`<div class="bd-tabs">${FORCES.map(f=>`<button class="${f.n===ST.force?'on':''}" data-bf="${f.n}">${f.i} ${f.n}</button>`).join('')}</div>
      <div class="bd-list" id="bdList"><div class="bd-empty">불러오는 중…</div></div>
      <p class="bd-note" id="bdNote"></p>
      <button class="bd-fab" id="bdWrite">✍️ 글쓰기</button>`;
    b.querySelectorAll('[data-bf]').forEach(x=>x.onclick=()=>{haptic();ST.force=x.dataset.bf;listView(b);});
    b.querySelector('#bdWrite').onclick=()=>{haptic();show('write');};
    const f=ST.force, posts=await listPosts(f);
    if(ST.view!=='list'||ST.force!==f) return;
    const L=b.querySelector('#bdList');
    L.innerHTML=posts.length?posts.map(p=>`<button class="bd-item" data-pid="${esc(p.id)}">
        <b>${p.mock?'<em class="bd-mk">예시</em>':''}${esc(p.title)}</b><p>${esc(p.body)}</p>
        <span class="bd-meta"><i>${who(p.name,p.force)}</i><i>${ago(p.at)}</i><i class="c">💬 ${p.comments||0}</i></span></button>`).join('')
      :`<div class="bd-empty"><span>💬</span><b>아직 ${f} 이야기가 없어요</b><small>첫 글의 주인공이 되어보세요</small></div>`;
    L.querySelectorAll('[data-pid]').forEach(x=>x.onclick=()=>{haptic();show('post',x.dataset.pid);});
    b.querySelector('#bdNote').textContent=note();
  }

  function writeView(b){
    b.className='bd-body'; b.dataset.v='write';
    b.innerHTML=`<div class="bd-tabs">${FORCES.map(f=>`<button class="${f.n===ST.force?'on':''}" data-wf="${f.n}">${f.i} ${f.n}</button>`).join('')}</div>
      <input class="bd-in" id="bwName" maxlength="12" placeholder="닉네임 (선택 · 비우면 익명)" value="${esc(LS.get('nick',''))}">
      <input class="bd-in" id="bwTitle" maxlength="40" placeholder="제목 (2~40자)">
      <textarea class="bd-in bd-ta" id="bwBody" maxlength="1000" placeholder="군 생활, 전역 준비, 취업 이야기… 자유롭게 써주세요 (1000자)"></textarea>
      <div class="bd-wfoot"><span id="bwCnt">0/1000</span><span>${note()}</span></div>
      <button class="bd-submit" id="bwGo">등록하기</button>`;
    b.querySelectorAll('[data-wf]').forEach(x=>x.onclick=()=>{haptic();ST.force=x.dataset.wf;b.querySelectorAll('[data-wf]').forEach(y=>y.classList.toggle('on',y===x));});
    b.querySelector('#bwBody').oninput=e=>{b.querySelector('#bwCnt').textContent=`${e.target.value.length}/1000`;};
    b.querySelector('#bwGo').onclick=async()=>{
      const name=line(b.querySelector('#bwName').value,12), title=line(b.querySelector('#bwTitle').value,40), bd=text(b.querySelector('#bwBody').value,1000);
      if(title.length<2){toast('제목을 두 글자 이상 써주세요');return;}
      if(bd.length<2){toast('내용을 두 글자 이상 써주세요');return;}
      if(LINK.test(name+title+bd)){toast('링크는 쓸 수 없어요');return;}
      haptic(); const btn=b.querySelector('#bwGo'); btn.disabled=true; LS.set('nick',name);
      const p=await createPost({force:ST.force,name,title,body:bd}); btn.disabled=false;
      if(!p) return;
      toast(p.local?'이 기기에 글을 남겼어요':'글을 올렸어요'); show('post',p.id);
    };
  }

  async function postView(b,id){
    ST.postId=id; b.className='bd-body'; b.dataset.v='post';
    b.innerHTML=`<div class="bd-empty">불러오는 중…</div>`;
    const d=await getPost(id);
    if(ST.view!=='post'||String(ST.postId)!==String(id)) return;
    if(!d){ b.innerHTML=`<div class="bd-empty"><span>🫥</span><b>글을 찾을 수 없어요</b></div>`; return; }
    const p=d.post; ST.force=p.force||ST.force;
    root.querySelector('#bdTitle').textContent=`${ICON[ST.force]||''} ${ST.force} 이야기`;
    const tops=d.comments.filter(c=>!c.parent_id), kids=pid=>d.comments.filter(c=>String(c.parent_id)===String(pid));
    const cHtml=(c,reply)=>`<div class="bd-c ${reply?'re':''}" data-cid="${esc(c.id)}"><div class="bd-ch"><b>${who(c.name,'')}</b><i>${ago(c.at)}</i></div>
      <p>${esc(c.body)}</p>${reply?'':`<button class="bd-re" data-re="${esc(c.id)}" data-nm="${who(c.name,'')}">답글</button>`}</div>`;
    b.innerHTML=`<div class="bd-scroll" id="bdScroll">
        <article class="bd-post"><span class="bd-tag">${ICON[p.force]||''} ${esc(p.force||'')}${p.mock?' · 예시 글':''}</span><h3>${esc(p.title)}</h3>
          <div class="bd-meta"><i>${who(p.name,p.force)}</i><i>${ago(p.at)}</i></div><div class="bd-text">${para(p.body)}</div></article>
        <div class="bd-ccount">댓글 ${d.comments.length}</div>
        <div class="bd-cmts">${tops.length?tops.map(c=>cHtml(c,false)+kids(c.id).map(k=>cHtml(k,true)).join('')).join(''):'<div class="bd-empty sm">첫 댓글을 남겨보세요</div>'}</div>
      </div>
      <div class="bd-composer"><div class="bd-replying" id="bdRep" hidden>↳ <b id="bdRepNm"></b>님에게 답글 <button id="bdRepX">취소</button></div>
        <div class="bd-crow"><input class="bd-in sm" id="bcName" maxlength="12" placeholder="닉네임" value="${esc(LS.get('nick',''))}">
          <input class="bd-in" id="bcBody" maxlength="300" placeholder="댓글을 남겨주세요"><button class="bd-send" id="bcGo">등록</button></div></div>`;
    const rep=b.querySelector('#bdRep');
    b.querySelectorAll('[data-re]').forEach(x=>x.onclick=()=>{haptic();ST.replyTo=x.dataset.re;b.querySelector('#bdRepNm').textContent=x.dataset.nm;rep.hidden=false;b.querySelector('#bcBody').placeholder='답글을 남겨주세요';b.querySelector('#bcBody').focus();});
    b.querySelector('#bdRepX').onclick=()=>{ST.replyTo=null;rep.hidden=true;b.querySelector('#bcBody').placeholder='댓글을 남겨주세요';};
    const send=async()=>{
      const name=line(b.querySelector('#bcName').value,12), bd=line(b.querySelector('#bcBody').value,300);
      if(!bd){toast('내용을 써주세요');return;}
      if(LINK.test(name+bd)){toast('링크는 쓸 수 없어요');return;}
      haptic(); const btn=b.querySelector('#bcGo'); btn.disabled=true; LS.set('nick',name);
      const c=await createComment(id,{name,body:bd,parent_id:ST.replyTo||null}); btn.disabled=false;
      if(!c) return;
      const keep=b.querySelector('#bdScroll').scrollTop; await postView(b,id);
      const sc=b.querySelector('#bdScroll'); if(sc){ const el=sc.querySelector(`[data-cid="${CSS.escape(String(c.id))}"]`); if(el){el.classList.add('new');el.scrollIntoView({block:'center'});} else sc.scrollTop=keep; }
    };
    b.querySelector('#bcGo').onclick=send;
    b.querySelector('#bcBody').onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();send();}};
  }

  window.openBoard=open;
  window.closeBoard=close;
})({esc:typeof esc==='function'?esc:null, toast:typeof toast==='function'?toast:null,
    haptic:typeof haptic==='function'?haptic:null, LS:typeof LS==='object'&&LS?LS:null});
