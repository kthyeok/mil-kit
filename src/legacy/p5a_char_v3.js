/* ---------- 캐릭터 렌더러 ---------- */
const GW=45,GH=56;
const C={skin:'#f0c49a',skinD:'#cf9c72',hair:'#2b231c',uni:'#6d7a53',uniD:'#55603f',uniL:'#838f66',
  dress:'#39452c',dressD:'#2b3521',boot:'#332b24',bootD:'#241e19',vest:'#454b35',vestD:'#343925',
  gold:'#d4af37',silver:'#c3c7cb'};
function paint(ctx,U,bobY){
  const p=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x*U),Math.round(y*U+bobY),Math.ceil(w*U),Math.ceil(h*U));};
  const circ=(cx,cy,r,c,fill=true,lw=1.6)=>{ctx.beginPath();ctx.arc(cx*U,cy*U+bobY,r*U,0,6.2832);
    if(fill){ctx.fillStyle=c;ctx.fill();}else{ctx.strokeStyle=c;ctx.lineWidth=lw*U;ctx.stroke();}};
  const has=k=>S.items.has(k);

  const JOB = S.pickJob ? OUTFIT[S.pickJob.outfit] : null;   // 직업 복장 모드
  const FU  = FORCE_UNI[S.force] || FORCE_UNI['육군'];        // 군별 군복
  const FD  = FAM_UNI[fam()]     || FAM_UNI.combat;          // 병과별 디테일
  const dressed = !JOB && has('dress');

  let UNI,UNID,UNIL,BOOT;
  if(JOB){         UNI=JOB.top;  UNID=JOB.topD; UNIL=JOB.topL;  BOOT='#2A2A2A'; }
  else if(dressed){UNI=C.dress;  UNID=C.dressD; UNIL='#4A5738'; BOOT=FU.boot;   }
  else{            UNI=FU.top;   UNID=FU.topD;  UNIL=FU.topL;   BOOT=FU.boot;   }

  ctx.save();ctx.globalAlpha=.10;ctx.beginPath();
  ctx.ellipse(22.5*U,53.6*U,8*U,1.9*U,0,0,6.2832);ctx.fillStyle='#1B64DA';ctx.fill();ctx.restore();

  if(!JOB&&has('backpack')&&!dressed){p(12,26,4,11,'#3b432c');p(29,26,4,11,'#3b432c');
    p(12,28,4,1,'#2a3020');p(29,28,4,1,'#2a3020');}

  /* 다리 · 신발 */
  const PANTS=JOB&&JOB.pants?JOB.pants:UNI;
  p(17,40,5,10,PANTS);p(23,40,5,10,PANTS);p(17,40,1,10,UNID);p(23,40,1,10,UNID);
  if(!JOB&&!dressed&&FD.detail==='camo'){p(18,43,2,2,UNIL);p(24,46,2,2,UNID);}
  p(16,49,6,4,BOOT);p(23,49,6,4,BOOT);
  p(16,52,6,1,'#1c1713');p(23,52,6,1,'#1c1713');
  p(16,49,6,1,UNIL);p(23,49,6,1,UNIL);

  /* 몸통 */
  p(15,24,15,17,UNI);p(15,24,2,17,UNID);p(28,24,2,17,UNID);

  if(JOB){
    if(JOB.shirt){ p(19,24,7,9,'#F4F6F8'); p(21,24,3,2,'#E2E6EA');
      p(21,26,3,8,JOB.theme); p(21,34,3,1,JOB.topD); }
    else { p(19,24,7,4,JOB.topL); }
    if(JOB.collar){ p(18,24,9,2,JOB.collar); p(21,26,3,1,JOB.collar); }
    if(JOB.hood){ p(16,22,13,3,JOB.topL); p(20,25,1,5,'#E6E9EE'); p(24,25,1,5,'#E6E9EE'); p(18,33,9,5,JOB.topD); }
    if(JOB.overall){ p(17,30,11,11,JOB.overall); p(18,24,2,7,JOB.overall); p(25,24,2,7,JOB.overall);
      p(18,30,1.4,1.4,'#D4AF37'); p(25.6,30,1.4,1.4,'#D4AF37'); p(20,33,5,3,'rgba(0,0,0,.15)'); }
    if(JOB.vest){ p(15,25,5,13,JOB.vest); p(25,25,5,13,JOB.vest); p(15,30,5,1.2,'#EDEDED'); p(25,30,5,1.2,'#EDEDED');
      p(15,34,5,1.2,'#EDEDED'); p(25,34,5,1.2,'#EDEDED'); }
    if(JOB.band){ p(15,31,15,1.6,JOB.band); p(15,35,15,1,JOB.band); }
    if(JOB.lanyard){ p(19.5,24,1,8,JOB.lanyard); p(24.5,24,1,8,JOB.lanyard); p(20,31,5,5,'#FFFFFF'); p(21,32,3,1.2,JOB.lanyard); p(21,34,2,1,'#B0B8C1'); }
    if(JOB.belt){ p(15,36,15,2,'#3A2A1C'); p(16,36,2,3,'#8C8C8C'); p(26,36,2,3,'#B8BEC4'); }
    if(!JOB.lanyard) p(25,27,4,1.6,'rgba(255,255,255,.55)');
  } else if(dressed){
    p(18,24,3,7,C.dressD);p(24,24,3,7,C.dressD);p(21,24,3,2,'#e6e3d6');
    p(21,26,3,9,'#5b1f24');p(21,35,3,1,'#43171b');
  } else {
    /* 병과별 군복 디테일 */
    const D=FD.detail, cm=FU.camo;
    if(D==='camo'){ p(18,27,2,2,cm[1]);p(24,31,3,2,cm[0]);p(20,35,2,2,cm[1]);
      p(26,26,2,2,cm[1]);p(17,33,2,2,cm[0]);p(22,29,2,2,cm[2]); }
    if(D==='rig'){ p(17,24,2,13,cm[0]);p(26,24,2,13,cm[0]);
      p(18,29,8,4,cm[2]);p(19,30,2,2,'#6fd0e8');p(23,30,2,1,'#c0c0c0'); }
    if(D==='grease'){ p(18,30,3,2,cm[2]);p(24,34,2,2,cm[2]);p(20,36,2,1,'#3a3128');
      p(15,24,15,1.4,cm[2]); }
    if(D==='hivis'){ p(16,27,13,2,'#C9A227');p(16,33,13,2,'#C9A227');
      p(16,27,13,.6,'#E8D06A');p(16,33,13,.6,'#E8D06A'); }
    if(D==='cross'){ p(11,29,4,4,'#F2F2F2');p(12.2,29.8,1.6,2.4,'#C0392B');p(11.4,30.6,3.2,.8,'#C0392B'); }
    if(D==='apron'){ p(18,26,9,15,'#E8E4D8');p(18,26,9,1,'#D6D1C2');p(21,24,3,2,'#E8E4D8'); }
    if(D==='plain'){ p(15,24,15,1.2,UNIL); }
    p(24,26,5,1.6,FD.label);
  }

  if(!JOB){
    p(15,38,15,2,'#2f2a1f');p(21,38,3,2,C.gold);
    if(has('vest')&&!dressed){
      p(15,24,15,13,C.vest);p(15,24,15,1,C.vestD);p(16,28,4,4,C.vestD);p(25,28,4,4,C.vestD);
      p(16,29,4,1,'#5a6145');p(25,29,4,1,'#5a6145');p(21,24,3,13,C.vestD);}
  } else {
    p(15,38,15,1.4,JOB.topD);
  }

  /* 팔 · 손 */
  p(11,25,4,13,UNI);p(30,25,4,13,UNI);p(11,25,1,13,UNID);p(33,25,1,13,UNID);
  p(11,38,4,3,C.skin);p(30,38,4,3,C.skin);p(11,40,4,1,C.skinD);p(30,40,4,1,C.skinD);

  if(!JOB){
    if(FD.arm&&!dressed) p(30,26,4,3,FD.arm);
    if(has('patch')){p(11,26,4,3,'#2c4a7a');p(12,27,2,1,C.gold);}
    p(30,30,4,2.4,'#cf3a3a');p(30,30,4,1.2,'#2b4b9b');
    if(has('armband')&&!dressed){p(11,30,4,4,'#c9a227');p(11,31,4,1,'#1c1c1c');p(11,33,4,1,'#1c1c1c');}

    const svc=S.svc||'soldier', lvl=Math.max(0,Math.min(rankIdx(),svc==='officer'?5:3)), bx=dressed?25:21;
    if(svc==='public'){             /* 사회복무요원: 계급장 대신 명찰 */
      p(bx-1,27,6,3,'#F2B705');p(bx,28,4,1,'#3F4A5C');
    } else if(svc==='soldier'){
      const bars=lvl+1;
      if(has('vest')&&!dressed){p(21,25,3,bars*2+1,'#2a3320');
        for(let i=0;i<bars;i++) p(21,26+i*2,3,1,C.silver);}
      else{p(bx-1,27,6,bars*2+1,'rgba(0,0,0,.28)');
        for(let i=0;i<bars;i++) p(bx,28+i*2,4,1,C.silver);}
    } else if(svc==='nco'){          /* 부사관: 꺾쇠(하사1·중사2·상사3) · 원사는 꺾쇠3+무궁화 */
      const n=Math.min(lvl+1,3); p(bx-1,26.5,6,n*2+2+(lvl===3?2:0),'rgba(0,0,0,.3)');
      for(let i=0;i<n;i++){const y=27.2+i*2; p(bx,y,1,1,C.gold);p(bx+1,y+.8,2,1,C.gold);p(bx+3,y,1,1,C.gold);}
      if(lvl===3){p(bx+1,27.2+n*2,2,1.6,C.gold);}
    } else {                          /* 장교: 다이아(소위1·중위2·대위3) · 무궁화(소령1·중령2·대령3) */
      const n=lvl<3?lvl+1:lvl-2; p(bx-1,26.5,6,n*3+1,'rgba(0,0,0,.3)');
      for(let i=0;i<n;i++){const y=27+i*3;
        if(lvl<3){p(bx+1,y,2,1,C.silver);p(bx,y+1,4,1,C.silver);p(bx+1,y+2,2,1,C.silver);}
        else {circ(bx+2,y+1.2,1.3,C.gold);p(bx+1.5,y+.7,1,1,'#FFF3B0');}}
    }
    if(has('medal')){p(16,25,5,1,'#b03030');p(16,26,5,1,'#3050b0');p(16,27,5,1,C.gold);}
    if(has('fitpin')){p(26,25,3,3,C.gold);p(27,26,1,1,'#fff6c2');}
    if(has('marksman')){p(16,29,3,2,C.silver);p(17,29,1,2,'#7d8288');}
  } else {
    p(11,26,4,3,JOB.theme);
  }

  /* 머리 */
  p(19,21,7,4,C.skinD);p(16,8,13,13,C.skin);p(16,8,2,13,C.skinD);
  p(15,13,1,3,C.skin);p(29,13,1,3,C.skin);
  p(19,14,2,2,'#3a2d22');p(24,14,2,2,'#3a2d22');
  p(19,12,2,1,'#2b231c');p(24,12,2,1,'#2b231c');p(21,18,3,1,'#b8775c');
  if(rankIdx()>=4) p(20,19,5,1,'#c98a6b');
  p(16,7,13,3,C.hair);p(16,7,1,5,C.hair);p(28,7,1,5,C.hair);
  if(has('glasses')&&(!JOB||JOB.tool==='laptop')){
    p(18,13,4,3,'#1c1c1c');p(23,13,4,3,'#1c1c1c');p(22,14,1,1,'#1c1c1c');
    p(19,14,2,1,'#6fd0e8');p(24,14,2,1,'#6fd0e8');}

  /* 모자 */
  if(JOB){ if(JOB.head) headgear(JOB.head,p); }
  else if(dressed){p(15,5,15,5,'#2b3420');p(14,9,17,2,'#232b1a');p(14,11,17,1,'#1a2013');p(20,6,5,3,C.gold);}
  else if(has('helmet')){
    p(14,4,17,7,FU.topD);p(14,10,17,2,FU.camo[2]);p(14,4,17,1,FU.topL);
    p(16,5,3,2,FU.topL);p(15,11,1,4,FU.camo[2]);p(29,11,1,4,FU.camo[2]);
    if(has('nvg')){p(19,3,3,5,'#2b2f22');p(23,3,3,5,'#2b2f22');p(19,2,7,2,'#3a4030');}}
  else if(has('beret')){p(15,5,15,5,'#1e1e1e');p(14,8,17,2,'#151515');p(29,4,3,2,'#1e1e1e');p(17,6,3,3,C.gold);}
  else {
    const navy = S.force==='해군';
    p(15,6,15,5, navy?'#E4E0D0':FU.cap);
    p(14,10,17,2, navy?'#C9C4B0':FU.topD);
    p(15,6,15,1, navy?'#F2EFE2':FU.topL);
    if(navy) p(14,10,17,1.4,'#1F2C44');
    p(20,7,5,3,'rgba(0,0,0,.3)');p(21,8,3,1,FU.accent);
  }
  if(!JOB&&has('backpack')&&!dressed){
    p(17,24,2,13,'#3b432c');p(26,24,2,13,'#3b432c');
    p(17,30,2,1,'#2a3020');p(26,30,2,1,'#2a3020');}

  /* 손에 든 것 */
  const t = JOB ? JOB.tool : (fam()?FAM_TOOL[fam()]:null);
  if(t) tool(t,p,circ);

  if(has('namecard')){
    p(4,39,12,1,'#c2ccd8');p(4,32,12,7,'#ffffff');
    p(4,32,12,1.4,JOB?JOB.theme:'#3182F6');
    p(6,35,5,1,'#8B95A1'); p(6,37,3,1,'#c3cad3');
    p(12.5,35,2,2,JOB?JOB.theme:'#3182F6');
    p(4,32,1,7,'#e7ebef');
  } else if(has('cert')){
    p(7,33,8,10,'#efe9d2');p(7,33,8,1,'#cfc7aa');
    p(8,35,6,1,'#b9b296');p(8,37,6,1,'#b9b296');p(8,39,4,1,'#b9b296');p(9,41,4,2,'#c0392b');
  }
}

/* 직업 복장용 모자 */
function headgear(k,p){
  switch(k){
    case 'hardhat': p(14,4,17,6,'#F2B705');p(14,9,17,2,'#D99E04');p(21,2,3,3,'#F2B705');
      p(14,4,17,1,'#FFD24A');break;
    case 'firehat': p(13,4,19,6,'#E0483C');p(12,9,21,2,'#B8352B');p(20,5,5,3,'#FFD34D');
      p(13,4,19,1,'#F26A5F');break;
    case 'polcap':  p(15,5,15,5,'#1E2A47');p(14,9,17,2,'#12192B');p(14,11,17,1,'#0C1120');
      p(20,6,5,3,'#C9A227');break;
    case 'toque':   p(16,0,13,8,'#FFFFFF');p(15,7,15,4,'#F2F2EE');p(15,10,15,1,'#DCDCD4');
      p(17,1,3,4,'#F6F6F2');p(24,1,3,4,'#F6F6F2');break;
    case 'beret2':  p(15,5,15,5,'#1e1e1e');p(14,8,17,2,'#151515');p(29,4,3,2,'#1e1e1e');
      p(17,6,3,3,C.gold);break;
    case 'headset': p(16,6,13,1.6,'#1F1F1F');p(14,11,2.4,5,'#1F1F1F');p(28.6,11,2.4,5,'#1F1F1F');
      p(15,16,5,1,'#1F1F1F');p(19,15.6,2,1.8,'#3182F6');break;
    case 'cap':     { const c=(S.pickJob&&OUTFIT[S.pickJob.outfit].capC)||'#2B2B2B';
      p(15,5,15,5,c);p(15,9,19,2,c);p(15,10.4,19,.8,'rgba(0,0,0,.35)');p(21,6,3,2,'rgba(255,255,255,.7)');break; }
    case 'whitehelmet': p(14,4,17,6,'#F4F6F8');p(14,9,17,2,'#D6DBE1');p(21,2,3,3,'#F4F6F8');
      p(14,4,17,1,'#FFFFFF');p(20,6,5,2,'#3182F6');break;
    case 'straw':   p(10,9,25,2,'#D9B25F');p(10,10.6,25,.8,'#B8913F');p(16,4,13,6,'#E8C877');
      p(16,7.4,13,1.4,'#8A5A2B');p(18,5,3,1,'#F3DC9A');break;
    case 'beanie':  p(15,4,15,7,'#1F2937');p(15,9,15,2,'#374151');p(21,2,3,2,'#E11D48');break;
  }
}

const CARD_BOX={x:2.5,y:30,w:15,h:11};
function tool(t,p,circ){
  switch(t){
    case 'rifle': p(29,32,14,2,'#3b3b3b');p(41,32,3,1,'#2a2a2a');p(27,31,4,5,'#5a4226');
      p(33,34,3,5,'#2f2f2f');p(30,30,2,2,'#4a4a4a');break;
    case 'radio': p(30,32,7,9,'#3f4a30');p(30,32,7,1,'#556339');p(35,19,1,13,'#8c8c8c');
      p(35,18,2,2,'#c0c0c0');p(31,34,2,2,'#1c1c1c');p(34,34,2,2,'#1c1c1c');p(31,37,5,2,'#6fd0e8');break;
    case 'laptop':p(28,27,12,9,'#2f2f34');p(29,28,10,7,'#5fd3e8');p(30,29,5,1,'#0d3a45');
      p(30,31,7,1,'#0d3a45');p(30,33,4,1,'#0d3a45');p(27,36,14,2,'#42424a');p(28,36,12,1,'#5a5a64');break;
    case 'wrench':p(32,28,3,13,'#9aa0a6');p(31,26,5,3,'#b8bec4');p(32,27,1,1,'#eef1f4');
      p(31,40,5,3,'#b8bec4');break;
    case 'clipboard':p(29,30,10,13,'#c9b98f');p(30,31,8,11,'#f2efe2');p(32,29,4,2,'#8c8c8c');
      p(31,34,6,1,'#9a937c');p(31,36,6,1,'#9a937c');p(31,38,4,1,'#9a937c');break;
    case 'medkit':p(29,32,10,10,'#5d6647');p(29,32,10,1,'#6f7a55');p(33,34,2,6,'#f2f2f2');
      p(31,36,6,2,'#f2f2f2');p(32,31,4,1,'#3f4630');break;
    case 'pan':p(29,35,8,2,'#4a4a4a');circ(40,36,4,'#2f2f2f');circ(40,36,3,'#5a5a5a');
      p(38,33,4,1,'#7a7a7a');break;
    case 'wheel':circ(36,36,6,'#2b2b2b',false,1.5);circ(36,36,1.4,'#2b2b2b');
      p(30,35,12,1.4,'#2b2b2b');p(35,36,1.4,6,'#2b2b2b');break;
    /* 직업 복장용 소품 */
    case 'case':  p(30,34,11,8,'#6B4A2E');p(30,34,11,1,'#8A6240');p(30,37,11,1,'#4F3620');
      p(34,32,3,2,'#4F3620');p(34.6,32.6,1.8,1.4,'#6B4A2E');p(37,37,2,2,'#D4AF37');break;
    case 'axe':   p(34,26,1.6,16,'#6B4A2E');p(31,25,7,3,'#B8BEC4');p(31,25,7,1,'#DDE2E6');
      p(36,27,2,2,'#8E959B');break;
    case 'baton': p(33,28,1.8,14,'#1F1F1F');p(33,28,1.8,2,'#3A3A3A');p(32.4,41,3,2,'#1F1F1F');break;
    case 'dumbbell': p(29,35,14,2,'#5A6472');p(28,32,3,8,'#2C3440');p(41,32,3,8,'#2C3440');
      p(28,33,3,1,'#46505E');p(41,33,3,1,'#46505E');break;
    case 'cable': circ(37,35,4.2,'#2F6FB0',false,1.6);circ(37,35,2.4,'#2F6FB0',false,1.2);
      p(31,37,3,2,'#2B2B2B');p(29.6,37.4,1.6,1.2,'#F2B705');break;
    case 'box':   p(29,31,12,10,'#C8995A');p(29,31,12,1.4,'#E0B476');p(34.4,31,1.2,10,'#9E7442');
      p(30.5,34,3,2,'#FFFFFF');p(30.9,34.6,2,.6,'#191F28');break;
    case 'drone': p(27,25,14,1.6,'#3A3A3A');p(26,24,5,1,'#A8B3BD');p(37,24,5,1,'#A8B3BD');
      p(32,25.6,4,3,'#3182F6');p(33,28.6,2,1,'#1F1F1F');p(30,36,7,5,'#2B2B2B');p(31,37,1.4,1.4,'#F04452');p(34,37,2,2,'#7DD3FC');break;
    case 'tablet':p(29,30,9,12,'#1F2937');p(30,31,7,10,'#7DD3FC');p(31,33,5,1,'#0C4A6E');p(31,35,4,1,'#0C4A6E');
      p(31,37,5,3,'#38BDF8');break;
    case 'sprout':p(30,37,8,5,'#B45309');p(30,37,8,1.2,'#D97706');p(33.6,31,1,6,'#15803D');
      p(30.6,31.6,3,2,'#22C55E');p(34.6,30.6,3,2,'#22C55E');p(32,29.6,2,1.6,'#4ADE80');break;
    case 'camera':p(29,32,10,7,'#1F2937');p(31,30.6,3,1.6,'#1F2937');circ(34,35.5,2.4,'#60A5FA');circ(34,35.5,1.2,'#0F172A');
      p(37,33,1.4,1,'#F04452');break;
  }
}

function mount(canvas,w){
  const dpr=Math.min(window.devicePixelRatio||1,3), U=w/GW, h=Math.round(GH*U);
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  canvas.style.width=w+'px';canvas.style.height=h+'px';canvas.dataset.u=U;
}
let bob=0;
function tick(){
  bob+=0.05;
  document.querySelectorAll('canvas[data-u]').forEach(cn=>{
    const c=cn.getContext('2d'), dpr=Math.min(window.devicePixelRatio||1,3), U=+cn.dataset.u;
    c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,cn.width,cn.height);
    c.imageSmoothingEnabled=false;paint(c,U,Math.round(Math.sin(bob)*1.1*(U/6)));
  });
  requestAnimationFrame(tick);
}
