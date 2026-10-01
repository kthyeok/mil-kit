// CDP 스모크 테스트 (사용: node tests/smoke.mjs 390x844 shots · 크롬 경로는 CHROME 환경변수): 전체 흐름 자동 완주 + 콘솔 에러 + 화면별 스크롤 넘침 검사 + 스크린샷
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const [W,H]=(process.argv[2]||'390x844').split('x').map(Number);
const FILE=pathToFileURL(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','index.html')).href;
const OUT=process.argv[3]||'shots';
fs.mkdirSync(OUT,{recursive:true});
const port=9333+Math.floor(Math.random()*500);
const ch=spawn(process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new',`--remote-debugging-port=${port}`,'--no-first-run','--user-data-dir='+path.join(os.tmpdir(),'milkit-prof'+port),'about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let tabs; for(let i=0;i<40;i++){try{tabs=await (await fetch(`http://127.0.0.1:${port}/json`)).json();break;}catch(e){await sleep(250);}}
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.onopen=r);
let id=0;const pend=new Map();const errs=[];
ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pend.has(d.id)){pend.get(d.id)(d);pend.delete(d.id);}
  if(d.method==='Runtime.exceptionThrown') errs.push('EXC '+JSON.stringify(d.params.exceptionDetails.exception?.description||d.params.exceptionDetails.text));
  if(d.method==='Runtime.consoleAPICalled'&&['error','warning'].includes(d.params.type)) errs.push(d.params.type+' '+d.params.args.map(a=>a.value||a.description).join(' '));
  if(d.method==='Log.entryAdded'&&d.params.entry.level==='error') errs.push('LOG '+d.params.entry.text);};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}));});
await send('Runtime.enable');await send('Log.enable');await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride',{width:W,height:H,deviceScaleFactor:2,mobile:true});
await send('Emulation.setTouchEmulationEnabled',{enabled:true});
await send('Page.navigate',{url:FILE});await sleep(1200);
const ev=async(expr)=>{const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true});
  if(r.result.exceptionDetails) {errs.push('EVAL '+expr.slice(0,80)+' :: '+r.result.exceptionDetails.exception?.description);return null;} return r.result.result.value;};
const shot=async name=>{await sleep(700);const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`${OUT}/${name}.png`,Buffer.from(r.result.data,'base64'));
  const o=await ev(`(()=>{const m=document.getElementById('scr');const over=m.scrollHeight-m.clientHeight;
    const hs=document.documentElement.scrollWidth>innerWidth;const dbg=over>0?[...m.querySelectorAll('*')].map(e=>{const r=e.getBoundingClientRect();return [e.tagName+'.'+e.className,Math.round(r.bottom)]}).sort((x,y)=>y[1]-x[1]).slice(0,4).map(x=>x.join(':')).join(' | ')+' scrH '+m.clientHeight+' '+getComputedStyle(m).paddingBottom:'';return {over,hs,title:document.getElementById('tbTitle').textContent+' '+dbg}})()`);
  console.log(name.padEnd(16),'overflowY=',o.over,'hScroll=',o.hs,o.title);};
const click=async sel=>{const ok=await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e) return false;e.click();return true;})()`);if(!ok) errs.push('NOCLICK '+sel);await sleep(250);};


await sleep(1400); await shot('00_splash_mid'); await sleep(1200); await shot('01_splash_done');
await click('#start'); await shot('02_force');
await click('[data-f="해군"]'); await click('#next'); await shot('03_form');
await click('[data-e="4.5"]'); await click('[data-m="컴퓨터·IT"]'); await click('#next'); await sleep(300); await shot('04_mos');
await click('.famt'); await sleep(200); await shot('04_mos'); await click('#next'); await sleep(300);
let n=0;
for(let guard=0;guard<30;guard++){
  const scr=await ev(`S.scr`);
  if(['path','cook','result'].includes(scr)) break;
  if(scr==='promo'){ await shot('promo_'+(n)); await click('#next'); await sleep(300); continue; }
  const k=await ev(`curEv().kind`); const id=await ev(`curEv().id`);
  await shot(`ev_${String(++n).padStart(2,'0')}_${id}`);
  if(k==='multi'){ await click('.evchip'); await ev(`(()=>{const c=document.querySelectorAll('.evchip');if(c[1]) c[1].click();})()`); await sleep(150); await click('#ok'); }
  else if(k==='single'){ await click('.evopt'); await sleep(350); }
  else if(k==='slider'){ await click('#ok'); }
  else if(k==='text'){ await click('.quick button'); await click('#ok'); }
  await sleep(250);
}
const PLAN=process.env.PLAN||'school';
await sleep(400); await shot('09_path'); await click(`[data-p="${PLAN}"]`); await sleep(900);
if(PLAN==='school'){ await shot('09b_school');
  await ev(`(()=>{const c=document.querySelectorAll('#sb .evchip');if(c[0]&&!c[0].classList.contains('on'))c[0].click();})()`); await sleep(150); await click('#next'); }
console.log('JK params:',await ev(`JSON.stringify(buildJK())`));
await sleep(900); await shot('12_cook'); await sleep(2600);
if(PLAN==='school'){ await shot('13a_pick_post'); await click('.post2'); await sleep(400); await shot('13b_post_sheet'); await click('#sc'); await sleep(1000); }
await shot('13_result_course');
console.log('result:',await ev(`JSON.stringify({plan:S.plan,target:S.target,posts:S.res.posts.length,certs:S.res.certs.length,notes:S.res.notes})`));
for(const i of [1,2,3,4]){ await ev(`(()=>{const c=document.getElementById('crs');c.scrollLeft=${i}*c.clientWidth;})()`); await sleep(500); await shot('13_course_'+i); }

await click('[data-t="post"]'); await shot('14_posts'); await click('.post2'); await shot('15_post_sheet'); await ev(`closeSheet()`);
await click('[data-t="cert"]'); await shot('16_certs'); await click('#cg .crow'); await shot('17_cert_sheet'); await ev(`closeSheet()`);
await click('[data-t="course"]'); await sleep(300); await click('[data-card="dis"]'); await sleep(400); await shot('18_card_dis'); await click('[data-ck="nc"]'); await sleep(300);
await ev(`(()=>{const i=document.getElementById('ncName');i.value='김밀킷';i.dispatchEvent(new Event('input'));})()`); await shot('19_card_nc'); await ev(`closeSheet()`);
await click('#inv'); await sleep(300); await shot('20_invite'); await click('[data-w="선임"]'); await shot('21_invite_sr'); await ev(`closeSheet()`);
await send('Page.navigate',{url:FILE+'#ch='+encodeURIComponent(JSON.stringify({f:'공군',m:'정비원',w:'선임'}))}); await send('Page.reload',{}); await sleep(3000); await shot('22_challenge');
console.log('ERRORS:',errs.length?'\n'+errs.join('\n'):'none');
ws.close();ch.kill();process.exit(0);
