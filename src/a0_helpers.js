
/* ═══ helpers ═══ */
const $=id=>document.getElementById(id);
const el=h=>{const d=document.createElement('div');d.innerHTML=h.trim();return d.firstElementChild;};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(m){const t=el(`<div class="toast">${m}</div>`);$('tst').appendChild(t);setTimeout(()=>t.remove(),2400);}
function haptic(ms=8){ if(navigator.vibrate&&navigator.userActivation?.isActive!==false) try{navigator.vibrate(ms)}catch(e){} }
const won=v=>Math.round(v).toLocaleString('ko-KR');
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const LS={get(k,d){try{const v=localStorage.getItem('mk6-'+k);return v==null?d:JSON.parse(v);}catch(e){return d;}},
  set(k,v){try{localStorage.setItem('mk6-'+k,JSON.stringify(v));}catch(e){}}};
function fillPaged(box,n,minRow,page,draw,cols=2,gap=8){
  const rows=Math.max(1,Math.floor((box.clientHeight+gap)/(minRow+gap)));
  const per=rows*cols, pages=Math.max(1,Math.ceil(n/per)), pg=Math.min(page,pages-1);
  const shown=Math.min(per,n-pg*per), useRows=Math.max(1,Math.min(rows,Math.ceil(shown/cols)));
  box.style.gridTemplateRows=`repeat(${pages>1?rows:useRows},minmax(0,1fr))`;
  box.innerHTML=Array.from({length:shown},(_,k)=>draw(pg*per+k,k)).join('');
  return {pages,page:pg,per};
}
const pagerHtml=(pg,pages)=>pages>1?`<div class="pnav"><button data-pg="-1" ${pg?'':'disabled'} aria-label="이전">‹</button>
  <span>${pg+1} / ${pages}</span><button data-pg="1" ${pg<pages-1?'':'disabled'} aria-label="다음">›</button></div>`:'';
function openSheet(html,onMount){const sh=$('sheet');sh.innerHTML=`<div class="grab"></div>${html}`;$('sheetBg').classList.add('on');onMount&&onMount(sh);}
function closeSheet(){$('sheetBg').classList.remove('on');}
const KFONT="'Pretendard','Apple SD Gothic Neo','Malgun Gothic','맑은 고딕','Noto Sans KR',sans-serif";
