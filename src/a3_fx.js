
/* ═══════════════════════════════════════════════════════════════
   [Mil-Kit v7 · FX] 화면 전환 · 효과
   - 전체 화면 넘김(세로): 새 화면이 아래에서 통째로 올라오고,
     이전 화면은 위로 살짝 밀리며 작아지고 어두워진다. 뒤로 가기는 반대(아래로 내려감).
   - 왼쪽 가장자리에서 오른쪽으로 쓸면 뒤로 가기
   - 버튼 물결(ripple) · 숫자 올라가기 · 축하 꽃가루 (CDN 라이브러리 없으면 조용히 생략)
   ═══════════════════════════════════════════════════════════════ */
const FX={busy:false, reduce:matchMedia('(prefers-reduced-motion: reduce)').matches};
function slide(dir,doRender){
  const app=$('app');
  if(FX.reduce||!app.animate||FX.busy){doRender();return;}
  FX.busy=true;
  const r=app.getBoundingClientRect();
  const ghost=app.cloneNode(true);
  ghost.removeAttribute('id'); ghost.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
  ghost.querySelectorAll('canvas').forEach(c=>c.removeAttribute('data-u'));
  const src=app.querySelectorAll('canvas'), dst=ghost.querySelectorAll('canvas');
  src.forEach((c,i)=>{try{dst[i].getContext('2d').drawImage(c,0,0);}catch(e){}});
  const m=$('scr'), gm=ghost.querySelector('main'); if(gm) gm.scrollTop=m.scrollTop;
  Object.assign(ghost.style,{position:'fixed',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',
    margin:'0',pointerEvents:'none',zIndex:dir>0?'40':'60'});
  ghost.classList.add('ghost');
  document.body.appendChild(ghost);
  doRender();
  app.style.zIndex='50';
  const ease='cubic-bezier(.32,.72,0,1)', D=560;
  const wide=innerWidth>=900;   // 데스크톱 휴대폰 무대: 프레임 밖으로 나가지 않게 짧게 밀고 흐리게
  const back=wide?[{transform:'translateY(0) scale(1)',opacity:1},{transform:'translateY(-10%) scale(.94)',opacity:0}]
    :[{transform:'translateY(0) scale(1)',filter:'brightness(1)',borderRadius:'0px'},{transform:'translateY(-12%) scale(.92)',filter:'brightness(.6)',borderRadius:'28px'}];
  const front=wide?[{transform:'translateY(16%)',opacity:0},{transform:'translateY(0)',opacity:1}]
    :[{transform:'translateY(100%)',borderRadius:'28px 28px 0 0'},{transform:'translateY(0)',borderRadius:'0px'}];
  let a1,a2;
  if(dir>0){ a1=app.animate(front,{duration:D,easing:ease}); a2=ghost.animate(back,{duration:D,easing:ease,fill:'forwards'}); }
  else { a1=ghost.animate([...front].reverse(),{duration:D,easing:ease,fill:'forwards'}); a2=app.animate([...back].reverse(),{duration:D,easing:ease}); }
  const done=()=>{ghost.remove();app.style.zIndex='';FX.busy=false;};
  Promise.all([a1.finished,a2.finished]).then(done,done);
  setTimeout(()=>{if(ghost.isConnected) done();},D+400);
}

/* 왼쪽 가장자리 스와이프 → 뒤로 */
(function(){
  let x0=null,y0=0;
  addEventListener('touchstart',e=>{const t=e.touches[0], r=$('app').getBoundingClientRect();
    x0=(t.clientX-r.left<26&&!$('back').hidden)?t.clientX:null; y0=t.clientY;},{passive:true});
  addEventListener('touchend',e=>{if(x0==null) return; const t=e.changedTouches[0];
    if(t.clientX-x0>70&&Math.abs(t.clientY-y0)<60) $('back').click(); x0=null;},{passive:true});
})();

/* 버튼 물결 */
document.addEventListener('pointerdown',e=>{
  const b=e.target.closest('.btn,.opt,.evopt,.evchip,.chip,.famt,.crow,.post2,.rd,.mico button');
  if(!b||b.disabled||FX.reduce) return;
  const r=b.getBoundingClientRect(), s=Math.max(r.width,r.height)*1.2, w=document.createElement('span');
  w.className='rip'; Object.assign(w.style,{width:s+'px',height:s+'px',left:(e.clientX-r.left-s/2)+'px',top:(e.clientY-r.top-s/2)+'px'});
  if(getComputedStyle(b).position==='static') b.style.position='relative';
  b.style.overflow='hidden'; b.appendChild(w); setTimeout(()=>w.remove(),620);
},{passive:true});

/* 숫자 올라가기 */
function countUp(root){
  (root||document).querySelectorAll('[data-count]').forEach(el=>{
    const to=+el.dataset.count; if(FX.reduce||!to){el.textContent=won(to);return;}
    const t0=performance.now(), D=900;
    (function f(t){const p=Math.min(1,(t-t0)/D), e=1-Math.pow(1-p,3); el.textContent=won(to*e); if(p<1) requestAnimationFrame(f);})(t0);
  });
}
/* 꽃가루 (canvas-confetti CDN) */
function party(kind){
  if(FX.reduce||typeof confetti!=='function') return;
  const c=['#3182F6','#15C47E','#FFB020','#F04452','#6B7A4A'];
  if(kind==='big'){
    confetti({particleCount:90,spread:75,origin:{y:.62},colors:c,scalar:.9});
    setTimeout(()=>confetti({particleCount:50,angle:60,spread:60,origin:{x:0,y:.7},colors:c}),180);
    setTimeout(()=>confetti({particleCount:50,angle:120,spread:60,origin:{x:1,y:.7},colors:c}),300);
  } else confetti({particleCount:45,spread:60,startVelocity:32,origin:{y:.45},colors:c,scalar:.8});
}
/* 요소 순차 등장 (GSAP 있으면 스프링, 없으면 CSS .up 그대로) */
function stagger(sel,root){
  if(FX.reduce||!window.gsap) return;
  const els=(root||document).querySelectorAll(sel); if(!els.length) return;
  gsap.fromTo(els,{y:26,opacity:0,scale:.97},{y:0,opacity:1,scale:1,duration:.6,ease:'back.out(1.6)',stagger:.06,clearProps:'transform,opacity'});
}
