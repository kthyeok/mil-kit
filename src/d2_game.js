
/* ═══════════════════════════════════════════════════════════════
   [Mil-Kit v5 · GAME] 군 생활 이벤트 = API 요청 조건 수집
   각 이벤트의 답은 잡코리아 요청 변수 또는 Q-Net 응답 필터로 바로 쓰인다.
   ═══════════════════════════════════════════════════════════════ */
const FORCE5=[{n:'육군',i:'🪖'},{n:'해군',i:'⚓'},{n:'공군',i:'✈️'},{n:'해병',i:'🔱'},{n:'기타',i:'🎖️',d:'상근예비역 · 카투사 등'}];
DS_SERVICE.push({군별:'기타',복무유형:'현역병',복무기간_개월:18});

/* 훈련소 신상명세서 — 학력(edu1) · 전공 */
const EDU5=[[3,'고졸'],[4,'전문대 재학·졸업'],[4.5,'대학 재학·휴학'],[5,'대졸'],[6,'대학원']];
const eduCode=v=>v>=6?6:v>=5?5:v>=4?4:3;        // 잡코리아 edu1 (대학 재학 → 전문대 기준으로 안전하게)
const MAJOR5=[['컴퓨터·IT',['21'],['10031']],['전기·전자',['20','21'],['10040']],['기계·자동차',['16','17'],['10039','10041']],
  ['건축·토목',['14'],['10043']],['안전·환경',['25','26'],['10043']],['경영·경제',['02'],['10027','10028','10035']],
  ['행정·법',['02','05'],['10027','10028']],['보건·간호',['06'],['10044']],['체육',['12'],['10045']],['조리·식품',['13','22'],['10038']],
  ['물류·무역',['02','09'],['10033','10034']],['인문·기타',[],[]]];
const HS_TRACK5=['인문계','특성화고','예체능'];

/* 주특기 직군 → 추천(★) */
const FAM_RB={combat:['10039','10043'],comm:['10031','10040'],it:['10031'],mech:['10039','10040','10041'],trans:['10034','10033'],
  admin:['10027','10028'],medic:['10044','10046'],food:['10038']};
const FAM_QN={combat:['25','11'],comm:['21','20'],it:['21'],mech:['16','20','17'],trans:['14','09'],admin:['02'],medic:['06','25'],food:['13']};
const QN_FIELD5=['21','20','16','17','14','25','26','13','02','12','24','22'];
const QN_FIELD_LABEL={'21':'💻 정보통신','20':'⚡ 전기·전자','16':'⚙️ 기계·자동차','17':'🔥 재료·용접','14':'🏗️ 건설·중장비','25':'🦺 안전관리',
  '26':'🌿 환경·에너지','13':'🍳 조리','02':'📊 경영·사무','12':'🏃 스포츠','24':'🌱 농림·조경','22':'🥫 식품가공'};
const RB_LABEL={'10031':'💻 개발·데이터','10040':'🔌 엔지니어링·설계','10041':'🏭 제조·생산','10039':'🔧 정비·설치·경호','10033':'📦 물류·무역',
  '10034':'🚚 운전·운송','10043':'🏢 건축·시설·안전','10038':'🍳 조리·식음료','10044':'🏥 의료','10027':'🗂️ 사무·총무','10028':'🤝 인사·HR',
  '10035':'💼 영업','10045':'🏋️ 스포츠·미디어','10046':'🛡️ 공공·방재'};

/* 계급별 이벤트 — p: 잡코리아 파라미터(jk:) 또는 Q-Net 필터(qn:) */
const EVENTS={
  '이병':[
    {id:'area',scene:'🌙',where:'첫 휴가 전날 밤 · 생활관',npc:'분대장',q:'첫 휴가 어디로 가?\n전역하고도 거기서 지낼 거야?',
     kind:'multi',max:3,p:'jk:area',why:'근무지역',opts:()=>JK_AREA1.map(([v,l])=>({v,l:v==='Q000'?'🗺️ 어디든 OK':l})),gain:{comm:1,dili:1}},
    {id:'rbcd',scene:'🔦',where:'새벽 불침번',npc:'선임',q:'넌 사회 나가면 뭐 하고 싶었어?\n두 개까지 말해봐.',
     kind:'multi',max:2,p:'jk:rbcd',why:'업·직종 대분류',opts:()=>Object.keys(JK_RB).map(v=>({v,l:RB_LABEL[v],star:(FAM_RB[fam()]||[]).includes(v)||majorRb().includes(v)})),
     gain:{lead:1,comm:1}},
  ],
  '일병':[
    {id:'rpcd',scene:'🛠️',where:'주특기 교육 시간',npc:'교관',q:'그중에서도 특히 해보고 싶은 일은?\n세 개까지 골라봐.',
     kind:'multi',max:3,p:'jk:rpcd',why:'업·직종 소분류',
     opts:()=>JK_JOBS.filter(j=>(S.ans.rbcd||[]).length?S.ans.rbcd.includes(j[1]):true).map(j=>({v:j[0],l:j[2]})),gain:{tech:2,dili:1}},
  ],
  '상병':[
    {id:'pay',scene:'💳',where:'월급날 · 장병적금 통장 확인',npc:'경리병',q:'전역하면 연봉은 얼마쯤 받고 싶어?',
     kind:'slider',p:'jk:pay/payterm',why:'급여 조건',gain:{dili:1}},
    {id:'ctype',scene:'🏙️',where:'외박 · 친구 회사 구경',npc:'동기',q:'어떤 회사가 제일 끌렸어?',
     kind:'single',p:'jk:ctype',why:'기업형태',opts:()=>[...Object.entries(JK_CTYPE).map(([v,l])=>({v,l})),{v:'0',l:'상관없음'}],gain:{comm:1,lead:1}},
  ],
  '병장':[
    {id:'jtype',scene:'🏖️',where:'말년 휴가',npc:'친구',q:'첫 직장은 어떤 형태로 시작할래?\n세 개까지.',
     kind:'multi',max:3,p:'jk:Jtype',why:'고용형태',opts:()=>Object.entries(JK_JTYPE).filter(([v])=>v!=='9').map(([v,l])=>({v,l})),gain:{dili:1}},
    {id:'career',scene:'🎖️',where:'전역 신고 연습',npc:'인사장교',q:'군 복무, 지원할 때 어떻게 내세울래?',
     kind:'single',p:'jk:mcareerchk',why:'경력 조건',opts:()=>[{v:'1',l:'신입으로 지원',sub:'신입 공고 위주'},{v:'3',l:'신입·경력 둘 다',sub:'경력 인정 공고까지'},{v:'0',l:'상관없음',sub:'전체'}],gain:{lead:2}},
    {id:'ob',scene:'📅',where:'전역 D-30 · 달력에 X 치는 중',npc:'후임',q:'공고는 어떤 순서로 볼 거예요?',
     kind:'single',p:'jk:Ob',why:'정렬',opts:()=>[{v:'3',l:'⏰ 마감 임박 순',sub:'바로 지원할래'},{v:'1',l:'🆕 새 공고 순',sub:'천천히 고를래'},{v:'2',l:'✏️ 최근 수정 순',sub:'활발한 회사'}],gain:{dili:1}},
    {id:'kw',scene:'📝',where:'후임들의 롤링페이퍼',npc:'후임들',q:'전역 축하드립니다! 롤링페이퍼 한 장 남겨주시고\n꿈도 한 단어로 알려주세요!',
     kind:'text',p:'jk:Keyword',why:'검색어',gain:{comm:2}},
  ],
};
const RANK5=['이병','일병','상병','병장'];
const NEXT5={이병:'일병',일병:'상병',상병:'병장',병장:'전역'};
const RANK_ITEM={이병:'patch',일병:'glasses',상병:'medal',병장:'armband'};

/* 학력·전공으로 Q-Net 계열 응시 가능 여부 (간이 · 실제 응시자격은 큐넷 확인) */
function majorQn(){ const m=MAJOR5.find(x=>x[0]===S.major); return m?m[1]:[]; }
function majorRb(){ const m=MAJOR5.find(x=>x[0]===S.major); return m?m[2]:[]; }
function canSeries(sc,obl){
  const e=effEdu(), rel=obl?majorQn().includes(obl):majorQn().length>0;
  if(sc==='05') return true;
  if(sc==='04') return e>=4&&rel;
  if(sc==='03') return e>=5&&rel;
  return false;
}
function eligibility(it){
  if(it.qualgbcd==='S') return {ok:true,t:'응시 가능',d:'국가전문자격 · 시험별 응시요건 확인'};
  const sc=it.seriescd, rel=majorQn().includes(it.obligfldcd);
  if(sc==='05') return {ok:true,t:'응시 가능',d:'기능사는 학력·경력 제한 없음'};
  if(sc==='06') return {ok:true,t:'응시 가능',d:'급수 자격 · 학력·경력 제한 없음'};
  if(sc==='04') return canSeries('04',it.obligfldcd)?{ok:true,t:'응시 가능',d:'관련학과 전문대 이상'}:{ok:false,t:'조건 필요',d:rel?'전문대 졸업(예정) 이상 필요':'동일분야 기능사 + 실무 1년 등'};
  if(sc==='03') return canSeries('03',it.obligfldcd)?{ok:true,t:'응시 가능',d:'관련학과 4년제 졸업(예정)'}:{ok:false,t:'조건 필요',d:rel?'4년제 졸업(예정) 필요':'산업기사 + 실무 1년 / 기능사 + 3년 등'};
  return {ok:false,t:'경력 필요',d:'기능장·기술사는 실무 경력 필요'};
}

/* 자대 배치 면담 — 군별 교관 질문 */
const MOS_ASK={'육군':'자대 배치 면담이다. 전역하고도 써먹을 일, 여기서 뭘 해보고 싶나?',
  '해군':'함정·기지 배치 전에 묻는다. 바다 위에서 어떤 임무를 맡아보고 싶나?',
  '공군':'비행단 배치 면담이다. 활주로 뒤에서 어떤 일을 해보고 싶나?',
  '해병':'해병대 배치 면담이다! 어떤 특기로 한번 붙어보겠나?',
  '기타':'복무지 배치 면담이에요. 어떤 일을 맡아보고 싶어요?'};

/* 졸업 후 학력 — 대학 재학·휴학 → 대졸, 전문대 재학 → 전문대 졸 */
function gradEdu(){ const e=S.edu||3; return e===4.5?5:e; }
function effEdu(){ return S.plan==='school'?gradEdu():(S.edu||3); }
