/* ═══════════════════════════════════════════════════════════════
   [ETL LAYER] 공공데이터 → 앱 내부 모델 변환
   실연동 시에도 이 로직은 그대로 재사용됩니다.
   ═══════════════════════════════════════════════════════════════ */

const STATS=[
  {k:'str', n:'체력', i:'💪', c:'#F04452'},
  {k:'tech',n:'기술', i:'🔧', c:'#3182F6'},
  {k:'lead',n:'통솔', i:'🎖️', c:'#FFB020'},
  {k:'dili',n:'성실', i:'📌', c:'#15C47E'},
  {k:'comm',n:'소통', i:'💬', c:'#8B5CF6'},
];
const SK=STATS.map(s=>s.k);
const SN=k=>STATS.find(s=>s.k===k);

/* KNOW 요인 → 앱 5대 능력치 매핑 정의 */
const KNOW_MAP={
  str: ['안전과보안','인내','스트레스감내성'],
  tech:['컴퓨터와전자공학','공학과기술','분석적사고'],
  lead:['리더십','책임과진취성'],
  dili:['꼼꼼함','신뢰성'],
  comm:['상담','사회성','협조'],
};
/* KNOW 점수(0~100) → 직업별 능력치 가중치 벡터 */
function knowToWeights(code){
  const v=DS_KNOW[code]; if(!v) return null;
  const out={};
  for(const k of SK){
    const idx=KNOW_MAP[k].map(f=>KNOW_F.indexOf(f));
    out[k]=Math.round(idx.reduce((a,i)=>a+v[i],0)/idx.length);
  }
  return out;
}
/* 직군 → 직결 직업 코드 (병무청 특기 ↔ 워크넷 직업 연결) */
const FAMILY_JOBS={
  combat:['J06','J07','J12','J14'], comm:['J02','J01','J15'],
  it:['J01','J02','J03','J15'],     mech:['J05','J04'],
  trans:['J09','J04'],              admin:['J10','J11','J09','J16'],
  medic:['J08','J06'],              food:['J13','J16'],
};
/* 직군별 시작 능력치 (특기별 지원가능 자격/전공에서 유도) */
const FAMILY_BASE={
  combat:{str:4,tech:0,lead:2,dili:1,comm:0}, comm:{str:0,tech:4,lead:0,dili:2,comm:2},
  it:{str:0,tech:5,lead:0,dili:2,comm:1},     mech:{str:2,tech:4,lead:0,dili:2,comm:0},
  trans:{str:2,tech:2,lead:1,dili:4,comm:1},  admin:{str:0,tech:1,lead:1,dili:4,comm:3},
  medic:{str:1,tech:3,lead:1,dili:2,comm:3},  food:{str:2,tech:3,lead:0,dili:4,comm:1},
};

/* 최종 JOBS 모델 — ④+⑤+⑥+⑦+⑧+⑨+⑩ 조인 결과 */
const JOBS = DS_JOBCAT.map(j=>({
  code:j.직업코드, n:j.직업명, i:j.icon, cat:`${j.대분류}·${j.중분류}`,
  w: knowToWeights(j.직업코드), z:{},
  wage: DS_WAGE[j.직업코드],
  outlook: DS_OUTLOOK[j.직업코드],
  posts: DS_JOBPOST[j.직업코드],
  certs: DS_VET_CERT.filter(c=>c.카테고리2===j.직업명),
  fams: Object.keys(FAMILY_JOBS).filter(f=>FAMILY_JOBS[f].includes(j.직업코드)),
  mbti: JOB_MBTI[j.직업코드]||[],
  outfit: JOB_OUTFIT[j.직업코드]||'office',
}));

/* 능력치별 표준화(z-score).
   KNOW 원점수는 거의 모든 직업이 '꼼꼼함·신뢰성'(성실)을 높게 답해 공통 기저가 생긴다.
   그대로 비교하면 모든 직업이 60~70%대로 뭉치므로, 능력치 축마다 평균/표준편차를 제거해
   '다른 직업 대비 두드러지는 역량'만 남긴 시그니처로 매칭한다. */
(function standardizeWeights(){
  for(const k of SK){
    const v=JOBS.map(j=>j.w[k]);
    const m=v.reduce((a,b)=>a+b,0)/v.length;
    const sd=Math.sqrt(v.reduce((a,b)=>a+(b-m)**2,0)/v.length)||1;
    JOBS.forEach(j=>{ j.z[k]=(j.w[k]-m)/sd; });
  }
})();

const RANKS=['이병','일병','상병','병장','예비역'];
const ITEM={
  cap:['전투모','🧢'], helmet:['방탄모','⛑️'], beret:['베레모','🎩'], vest:['방탄조끼','🦺'],
  armband:['분대장 완장','🟡'], medal:['약장(표창)','🏅'], patch:['부대마크','🔰'],
  glasses:['전투용 안경','👓'], fitpin:['특급전사 휘장','⭐'], marksman:['특등사수 뱃지','🎯'],
  backpack:['완전군장','🎒'], nvg:['야간투시경','🔭'], dress:['정복','🤵'], cert:['전역증','📜'],
  namecard:['커리어 명함','🪪'],
  rifle:['K2 소총','🔫'], radio:['무전기','📻'], laptop:['노트북','💻'], wrench:['정비 공구','🔧'],
  clipboard:['행정 클립보드','📋'], medkit:['구급낭','🧰'], pan:['조리도구','🍳'], wheel:['차량 핸들','🛞'],
};
const iname=k=>(ITEM[k]||[k,'🎁'])[0];
const iemoji=k=>(ITEM[k]||[k,'🎁'])[1];
const FAM_TOOL={combat:'rifle',comm:'radio',it:'laptop',mech:'wrench',
  trans:'wheel',admin:'clipboard',medic:'medkit',food:'pan'};
const FAM_ICON={combat:'🎯',comm:'📡',it:'💻',mech:'🔧',trans:'🚚',admin:'📋',medic:'🩺',food:'🍳'};
const FORCE=[{n:'육군',i:'🪖'},{n:'해군',i:'⚓'},{n:'공군',i:'✈️'},{n:'해병',i:'🔱'}];

const STAGES_SOLDIER=[
  {rank:'이병',next:'일병',period:'입대 ~ 3개월',label:'신병 적응기',need:2,pool:[
    {t:'신병교육대 우수 수료',  d:'5주 기초군사훈련 종합평가 상위 10%',       s:{dili:3,str:2},      g:'patch'},
    {t:'사격 특등사수 획득',   d:'20발 중 18발 명중 · 특등사수 인증',        s:{str:2,tech:3},      g:'marksman'},
    {t:'체력검정 특급 전사',   d:'3km 12분대 · 팔굽 72회 · 윗몸 82회',       s:{str:5},             g:'fitpin'},
    {t:'내무생활 모범',       d:'동기 적응 지원으로 소대장 구두칭찬',        s:{comm:3,dili:2},     g:null},
    {t:'화생방 훈련 우수',     d:'방독면 9초 착용 · 가스실 교육 수료',        s:{str:2,dili:2},      g:null},
    {t:'자대 전입 교육 1등',   d:'부대 규정·임무 시험 만점',                 s:{dili:3,tech:1},     g:null},
  ]},
  {rank:'일병',next:'상병',period:'4 ~ 9개월',label:'실무 숙달기',need:2,pool:[
    {t:'주특기 숙련도 1급',    d:'실기평가 만점 · 단독 임무 수행 가능 판정',   s:{tech:4,dili:2},     g:null},
    {t:'혹한기 · 유격 완주',   d:'40km 완전군장 행군 낙오 없음',             s:{str:4,dili:2},      g:'backpack'},
    {t:'토익 765점 취득',     d:'사이버지식정보방 자기계발 · 230점 상승',     s:{tech:3,comm:2},     g:'glasses'},
    {t:'대대장 표창 수상',    d:'시설 개선 제안 채택 · 포상휴가 4일',        s:{lead:3,dili:2,tech:1},g:'medal'},
    {t:'원격강좌 학점 취득',   d:'군 e-러닝 2과목 · 6학점 이수',             s:{tech:2,dili:3},     g:null},
    {t:'부대 봉사활동',        d:'지역 수해복구 · 대민지원 3회',             s:{comm:3,str:2},      g:null},
  ]},
  {rank:'상병',next:'병장',period:'10 ~ 15개월',label:'중추 역할기',need:2,pool:[
    {t:'분대장 임명',         d:'분대원 8명 통솔 · 근무 편성 담당',          s:{lead:5,comm:3},     g:'armband'},
    {t:'신병 멘토 지정',      d:'전입 신병 3명 멘토링 · 부적응 0건',         s:{comm:4,lead:2,dili:1},g:null},
    {t:'국가기술자격 취득',    d:'복무 중 자격증 취득 지원 프로그램 이수',     s:{tech:5,dili:3},     g:'glasses'},
    {t:'야간 경계작전 우수',   d:'야간 초소 근무 120회 무사고',              s:{dili:4,str:2},      g:'nvg'},
    {t:'부대 창업경진대회 입상', d:'국방부 장병 창업 아이디어 공모 본선',       s:{lead:2,tech:2,comm:2},g:null},
    {t:'연합 훈련 참가',       d:'외부 부대와 합동 훈련 · 연락 임무',         s:{comm:3,str:2,lead:1},g:null},
  ]},
  {rank:'병장',next:'전역',period:'16개월 ~ 전역',label:'마무리기',need:2,pool:[
    {t:'전투준비태세 우수',    d:'연대 평가 1위 기여 · 절차 무결점',          s:{str:3,lead:3,dili:3},g:'vest'},
    {t:'모범용사 선발',       d:'사단 모범용사 표창 · 포상휴가 5일',         s:{lead:4,dili:3},     g:'medal'},
    {t:'업무 매뉴얼 제작',    d:'표준 매뉴얼 42p 작성 · 인수인계 완료',       s:{tech:3,dili:3,comm:3},g:null},
    {t:'체육대회 MVP',       d:'대대 대항 축구·족구 우승 주역',             s:{str:3,comm:3,lead:1},g:'beret'},
    {t:'전역 전 취업컨설팅',   d:'국방전직교육원 1:1 컨설팅 · 이력서 완성',   s:{comm:2,dili:2,tech:1},g:null},
    {t:'후임 교육 교관',       d:'분대 전술·주특기 교육 12회 진행',          s:{lead:3,comm:3},     g:null},
  ]},
];
/* 주특기(병과군) 맞춤 기록 — 단계마다 2개씩 추가 (PRD WP4 · "정비 특기에 사격 카드만 뜨는" 문제 개선) */
const FAM_REC={
  combat:[
    [{t:'각개전투 우수',d:'전술 평가 소대 1위',s:{str:3,lead:1}},{t:'경계 수칙 시험 만점',d:'초병 수칙 100점',s:{dili:3}}],
    [{t:'전술 행군 선두 조',d:'야간 전술 행군 길잡이',s:{str:3,lead:2}},{t:'공용화기 사수 지정',d:'K-6·K-4 사수 운용',s:{tech:2,str:2}}],
    [{t:'수색·정찰 조장',d:'3인 정찰조 지휘',s:{lead:4,str:2}},{t:'대침투 훈련 유공',d:'탐지 및 보고 모범',s:{dili:3,comm:1}}],
    [{t:'전술훈련 평가 A',d:'KCTC 쌍방훈련 생존',s:{str:3,lead:3}},{t:'소대 전투력 측정 1위',d:'사격·체력·전술 종합',s:{str:3,dili:2}}]],
  comm:[
    [{t:'무전 교신 절차 숙달',d:'음어·약어 시험 통과',s:{tech:2,dili:2}},{t:'통신 장비 인수 점검',d:'장비 목록 100% 대조',s:{dili:3}}],
    [{t:'통신망 개통 무결점',d:'야전 통신망 30분 내 개통',s:{tech:4,dili:1}},{t:'케이블 포설 작업',d:'2km 선로 포설·접속',s:{str:2,tech:2}}],
    [{t:'통신 장애 복구 유공',d:'장애 12건 신속 복구',s:{tech:4,dili:2}},{t:'무선망 운용 교관',d:'신병 무전 교육 담당',s:{comm:3,lead:2}}],
    [{t:'통신 운용 매뉴얼 개정',d:'장애 대응 체크리스트 작성',s:{tech:3,dili:3}},{t:'정보통신기사 필기 합격',d:'복무 중 자격 도전',s:{tech:4,dili:1}}]],
  it:[
    [{t:'전산 계정 관리 숙달',d:'단말 60대 계정 관리',s:{tech:3,dili:1}},{t:'보안 교육 만점',d:'정보보호 수칙 시험',s:{dili:3}}],
    [{t:'업무 자동화 스크립트',d:'엑셀 매크로로 보고 시간 절반',s:{tech:4,comm:1}},{t:'서버 백업 체계 정비',d:'백업 누락 0건',s:{tech:2,dili:3}}],
    [{t:'사이버 보안 경연 참가',d:'국방 해커톤 본선',s:{tech:5}},{t:'헬프데스크 운영',d:'사용자 문의 200건 처리',s:{comm:3,tech:2}}],
    [{t:'정보체계 장애 대응 유공',d:'전산망 복구 표창',s:{tech:4,dili:2}},{t:'정보처리기사 취득',d:'복무 중 국가기술자격',s:{tech:5,dili:2}}]],
  mech:[
    [{t:'공구 관리 모범',d:'공구 대장 100% 일치',s:{dili:3}},{t:'정비 기초 교육 수료',d:'장비 구조 이해 평가 통과',s:{tech:3}}],
    [{t:'장비 가동률 향상',d:'정비 대기 장비 5대 복구',s:{tech:4,str:1}},{t:'용접·가공 작업 숙달',d:'부품 자체 제작 3건',s:{tech:3,str:1}}],
    [{t:'정비 이력 전산화',d:'정비 기록 DB 정리',s:{tech:2,dili:3}},{t:'정비 경연대회 입상',d:'군단 정비 경연 우수',s:{tech:4,lead:1}}],
    [{t:'자동차정비기능사 취득',d:'복무 중 국가기술자격',s:{tech:5,dili:2}},{t:'무사고 정비 1년',d:'안전사고 0건',s:{dili:3,lead:1}}]],
  trans:[
    [{t:'군 운전면허 취득',d:'군 운전교육 수료',s:{tech:2,dili:2}},{t:'차량 일일점검 숙달',d:'운행 전후 점검 100%',s:{dili:3}}],
    [{t:'장거리 수송 무사고',d:'누적 5,000km 무사고',s:{dili:4,str:1}},{t:'야간 운행 숙달',d:'야간 전술 운전 평가 통과',s:{tech:2,str:2}}],
    [{t:'배차 계획 보조',d:'주간 배차표 작성',s:{lead:2,dili:3}},{t:'대형 차량 운전',d:'5톤 트럭 운용',s:{tech:3,str:2}}],
    [{t:'수송 안전 표창',d:'무사고 운전 유공',s:{dili:3,lead:2}},{t:'지게차운전기능사 취득',d:'복무 중 자격 취득',s:{tech:3,dili:2}}]],
  admin:[
    [{t:'문서 작성 교육 수료',d:'군 공문서 양식 숙달',s:{dili:3}},{t:'인원 현황 보고 정확',d:'일일 보고 누락 0건',s:{dili:2,comm:1}}],
    [{t:'보급품 재고 정리',d:'재물조사 오차 0건',s:{dili:4}},{t:'행정 전산 입력 숙달',d:'인사·급여 자료 처리',s:{tech:3,dili:1}}],
    [{t:'행정반 업무 총괄 보조',d:'결재·일정 관리',s:{lead:2,dili:3}},{t:'부대 행사 기획',d:'체육대회·위문공연 진행',s:{comm:3,lead:2}}],
    [{t:'컴퓨터활용능력 1급',d:'복무 중 자격 취득',s:{tech:4,dili:2}},{t:'행정 업무 인수인계서',d:'업무 절차 30p 정리',s:{dili:3,comm:2}}]],
  medic:[
    [{t:'응급처치 교육 수료',d:'심폐소생술 인증',s:{tech:2,comm:1}},{t:'의무실 위생 관리',d:'소독·위생 점검 담당',s:{dili:3}}],
    [{t:'환자 후송 지원',d:'야간 응급 후송 5회',s:{str:2,comm:2}},{t:'의약품 재고 관리',d:'유효기간 관리 100%',s:{dili:3,tech:1}}],
    [{t:'부대 보건 교육',d:'온열·한랭 질환 예방 교육',s:{comm:4,lead:1}},{t:'응급 상황 초동 조치',d:'부상자 응급처치 유공',s:{tech:3,str:1}}],
    [{t:'응급구조사 과정 도전',d:'관련 교육 이수',s:{tech:4,dili:2}},{t:'의무 기록 정비',d:'진료 기록 체계화',s:{dili:3,tech:1}}]],
  food:[
    [{t:'위생 교육 수료',d:'식품 위생 수칙 숙달',s:{dili:3}},{t:'배식 시간 준수',d:'정시 배식 100%',s:{dili:2,str:1}}],
    [{t:'대량 조리 숙달',d:'300인분 단독 조리',s:{tech:3,str:2}},{t:'식자재 재고 관리',d:'폐기율 절감',s:{dili:3,tech:1}}],
    [{t:'메뉴 개선 제안',d:'장병 선호 메뉴 도입',s:{tech:2,comm:2}},{t:'취사장 위생 우수',d:'위생 검열 A등급',s:{dili:4}}],
    [{t:'한식조리기능사 취득',d:'복무 중 자격 취득',s:{tech:4,dili:2}},{t:'조리병 교육 담당',d:'후임 조리 교육',s:{lead:3,comm:2}}]],
};
/* 단계별 기록 = 공통 + 주특기 맞춤 + 직접 입력에서 판별된 기록 */
function recPool(i){ return stages()[i].pool.concat((S.svc==='public'?[]:((FAM_REC[fam()]||[])[i]||[])).map(r=>({...r,g:null,fam:true})),(S.custom[i]||[])); }

const RULES=[
  {re:/체력|특급|구보|달리기|팔굽|윗몸|턱걸이|3km/i,        lab:'체력 우수',  s:{str:4},               g:'fitpin'},
  {re:/사격|특등|명중|영점|사수/i,                          lab:'사격 우수',  s:{str:2,tech:2},        g:'marksman'},
  {re:/분대장|부분대장|조장|반장|통솔|지휘/i,               lab:'분대장 경험',s:{lead:5,comm:2},       g:'armband'},
  {re:/표창|포상|수상|모범|우수|상장|훈장/i,                lab:'표창 이력',  s:{lead:2,dili:3},       g:'medal'},
  {re:/자격증|기사|산업기사|정보처리|한식|토익|어학|공부/i, lab:'자기계발',   s:{tech:4,dili:2},       g:'glasses'},
  {re:/전산|서버|네트워크|프로그램|코딩|엑셀|데이터|시스템/i,lab:'전산 역량', s:{tech:5},              g:null},
  {re:/정비|수리|공구|엔진|장비|점검|고장/i,                lab:'정비 역량',  s:{tech:4,str:1},        g:null},
  {re:/운전|수송|배차|차량|주행|무사고/i,                   lab:'수송 역량',  s:{dili:3,tech:1,str:1}, g:null},
  {re:/의무|응급|구급|위생|처치|환자/i,                     lab:'의무 역량',  s:{comm:3,tech:2},       g:'medkit'},
  {re:/조리|취사|급식|배식|식단/i,                          lab:'조리 역량',  s:{dili:3,tech:2},       g:null},
  {re:/행정|문서|보고서|서류|결재|정리/i,                   lab:'행정 역량',  s:{dili:4,comm:1},       g:'clipboard'},
  {re:/멘토|후임|상담|배려|도움|화합|소통/i,                lab:'대인 소통',  s:{comm:4,lead:1},       g:null},
  {re:/훈련|유격|혹한기|행군|화생방|각개|완전군장/i,        lab:'훈련 완수',  s:{str:3,dili:2},        g:'backpack'},
  {re:/야간|경계|불침번|초소|위병소|당직/i,                 lab:'경계근무',   s:{dili:3,str:1},        g:'nvg'},
  {re:/제안|개선|아이디어|발명|효율|간소화/i,               lab:'개선 제안',  s:{tech:2,lead:2,comm:1},g:null},
  {re:/체육|대회|축구|족구|농구|MVP|우승/i,                 lab:'체육 활동',  s:{str:3,comm:2},        g:null},
  {re:/전투준비|태세|평가|검열|작계/i,                      lab:'전투준비',   s:{str:2,lead:2,dili:2}, g:'vest'},
];
