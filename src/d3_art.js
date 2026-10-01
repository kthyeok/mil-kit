
/* ═══════════════════════════════════════════════════════════════
   [Mil-Kit v5 · ART] 군별 배경 일러스트 · 교관/병무청 담당자 아바타 (인라인 SVG)
   ═══════════════════════════════════════════════════════════════ */
const FTHEME={
  '육군':{c1:'#2F3A1E',c2:'#55663A',acc:'#D4AF37',tag:'육군'},
  '해군':{c1:'#13284A',c2:'#2B5A8C',acc:'#E8E3D2',tag:'해군'},
  '공군':{c1:'#1D4A73',c2:'#4E8FC4',acc:'#FFFFFF',tag:'공군'},
  '해병':{c1:'#5A1414',c2:'#A32626',acc:'#F2C230',tag:'해병'},
  '기타':{c1:'#2F3640',c2:'#56606E',acc:'#9FB4C8',tag:'기타'}};
const fth=()=>FTHEME[S.force]||FTHEME['육군'];

function forceArt(force){
  const f=force||'육군', sky=(a,b)=>`<defs><linearGradient id="sk${f}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="360" height="120" fill="url(#sk${f})"/>`;
  let g='';
  if(f==='육군'){
    g=sky('#9EC5E0','#E6EFDF')+
    `<path d="M0 74 L40 46 L78 66 L120 34 L168 64 L214 40 L262 62 L306 38 L360 60 V120 H0Z" fill="#8A9B66"/>
     <path d="M0 88 L52 70 L100 84 L150 66 L210 86 L268 70 L360 84 V120 H0Z" fill="#5E6E3C"/>
     <rect x="0" y="98" width="360" height="22" fill="#6D7A3F"/>
     <g transform="translate(58 62)"><path d="M-6 14 L40 -2 L86 14Z" fill="#6B4E2E"/><rect x="0" y="14" width="80" height="34" fill="#D8C9A0"/>
       ${[8,26,44,62].map(x=>`<rect x="${x}" y="22" width="10" height="9" fill="#5A7896"/>`).join('')}<rect x="34" y="34" width="12" height="14" fill="#6B4E2E"/></g>
     <g transform="translate(176 40)"><rect x="0" y="0" width="2" height="60" fill="#888"/><rect x="2" y="2" width="22" height="15" fill="#fff"/>
       <circle cx="13" cy="9.5" r="4.4" fill="#C8102E"/><path d="M8.6 9.5a4.4 4.4 0 0 0 8.8 0a2.2 2.2 0 0 1-4.4 0a2.2 2.2 0 0 0-4.4 0" fill="#0047A0"/></g>
     <g stroke="#4A5530" stroke-width="2">${Array.from({length:19},(_,i)=>`<line x1="${i*20}" y1="96" x2="${i*20}" y2="108"/>`).join('')}<line x1="0" y1="100" x2="360" y2="100"/></g>`;
  } else if(f==='해군'){
    g=sky('#A9D2F0','#E4F2FB')+
    `<rect x="0" y="78" width="360" height="42" fill="#1F4F86"/>
     <g stroke="#fff" stroke-opacity=".55" stroke-width="2" fill="none">${[0,1,2].map(r=>`<path d="M${-10+r*14} ${90+r*10} q15 -6 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0"/>`).join('')}</g>
     <g transform="translate(150 34)"><path d="M-40 44 L150 44 L134 62 L-24 62Z" fill="#6B7785"/><rect x="10" y="26" width="70" height="18" fill="#8C97A3"/>
       <rect x="30" y="10" width="34" height="16" fill="#9DA7B2"/><rect x="45" y="-8" width="3" height="18" fill="#6B7785"/><rect x="38" y="-4" width="17" height="2" fill="#6B7785"/>
       ${[16,28,40,52,64].map(x=>`<rect x="${x}" y="31" width="7" height="5" fill="#2C3E50"/>`).join('')}<text x="104" y="57" font-size="10" font-weight="800" fill="#E8E3D2" font-family="sans-serif">ROKN</text></g>
     <g stroke="#3A4A5A" stroke-width="1.6" fill="none"><path d="M60 30 q5 -5 10 0 q5 -5 10 0"/><path d="M92 20 q4 -4 8 0 q4 -4 8 0"/></g>`;
  } else if(f==='공군'){
    g=sky('#78B2E3','#DCEEFB')+
    `<g fill="#fff" opacity=".9"><ellipse cx="60" cy="30" rx="30" ry="10"/><ellipse cx="82" cy="26" rx="20" ry="9"/><ellipse cx="290" cy="22" rx="34" ry="9"/></g>
     <rect x="0" y="92" width="360" height="28" fill="#7C858F"/><g fill="#fff">${Array.from({length:9},(_,i)=>`<rect x="${i*42+6}" y="104" width="22" height="3"/>`).join('')}</g>
     <rect x="0" y="88" width="360" height="5" fill="#8DB36A"/>
     <g transform="translate(300 40)"><rect x="6" y="14" width="12" height="38" fill="#B9C2CC"/><rect x="0" y="4" width="24" height="12" fill="#4A6178"/><rect x="2" y="6" width="20" height="6" fill="#A8D4F5"/></g>
     <path d="M30 70 L150 52" stroke="#fff" stroke-width="3" stroke-opacity=".7" stroke-linecap="round"/>
     <g transform="translate(150 40) rotate(-8)"><path d="M0 12 L46 8 L60 12 L46 16Z" fill="#5B6B7C"/><path d="M22 10 L10 -6 L18 -6 L34 10Z" fill="#4A5868"/>
       <path d="M22 14 L10 28 L18 28 L34 14Z" fill="#4A5868"/><path d="M2 12 L-4 3 L2 3 L8 11Z" fill="#4A5868"/><ellipse cx="48" cy="10.5" rx="5" ry="2" fill="#A8D4F5"/></g>`;
  } else if(f==='해병'){
    g=sky('#F6D9A9','#C6E6F4')+
    `<rect x="0" y="62" width="360" height="22" fill="#3D8FB8"/><g stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none"><path d="M0 70 q20 -5 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0"/></g>
     <path d="M0 82 Q90 74 180 80 T360 78 V120 H0Z" fill="#E8C98A"/>
     <g transform="translate(120 62)"><path d="M0 20 L10 6 L86 6 L96 20 L92 36 L4 36Z" fill="#5B6440"/><rect x="18" y="0" width="30" height="8" fill="#464E30"/>
       <rect x="62" y="12" width="20" height="8" fill="#3A4128"/>${[10,30,50,70].map(x=>`<circle cx="${x+8}" cy="36" r="5" fill="#2B2B2B"/>`).join('')}</g>
     <g transform="translate(262 34)"><rect x="0" y="0" width="2" height="54" fill="#777"/><rect x="2" y="2" width="26" height="16" fill="#C0392B"/>
       <text x="15" y="14" font-size="10" text-anchor="middle" font-weight="900" fill="#F2C230" font-family="sans-serif">⚓</text></g>
     <g fill="#C9A86A">${[30,64,220,320].map(x=>`<ellipse cx="${x}" cy="104" rx="10" ry="2"/>`).join('')}</g>`;
  } else {
    g=sky('#C9D6E4','#EEF2F6')+
    `<g fill="#9AA6B4">${[[0,40,34],[30,26,48],[70,50,30],[96,34,44],[230,30,40],[262,46,36],[292,24,52],[332,38,28]].map(([x,w,y])=>`<rect x="${x}" y="${y}" width="${w}" height="${90-y}"/>`).join('')}</g>
     <g fill="#E8EEF5" opacity=".8">${Array.from({length:22},(_,i)=>`<rect x="${(i*37)%340+6}" y="${44+(i*13)%36}" width="5" height="5"/>`).join('')}</g>
     <g transform="translate(140 46)"><rect x="0" y="12" width="84" height="32" fill="#D7DDE4"/><path d="M-6 12 L42 0 L90 12Z" fill="#5E6E3C"/>
       <rect x="8" y="20" width="68" height="8" fill="#5E6E3C"/><text x="42" y="27" font-size="6.5" text-anchor="middle" font-weight="800" fill="#fff" font-family="sans-serif">예비군 중대</text>
       <rect x="36" y="32" width="12" height="12" fill="#6B4E2E"/></g>
     <rect x="0" y="90" width="360" height="30" fill="#5C6670"/><g fill="#F2C230">${Array.from({length:9},(_,i)=>`<rect x="${i*42+8}" y="104" width="20" height="2.5"/>`).join('')}</g>`;
  }
  return `<svg class="fart" viewBox="0 0 360 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${g}</svg>`;
}

/* 교관(군별) · 병무청 담당자 흉상 */
function npcSvg(kind){
  const U={'육군':['#6D7A53','#55603F'],'해군':['#2E3F5C','#233149'],'공군':['#4E5F73','#3C4A5B'],'해병':['#5B6440','#464E30'],'기타':['#6D7A53','#55603F'],mma:['#1F2A44','#141C30']}[kind]||['#6D7A53','#55603F'];
  let hat='', chest='';
  if(kind==='mma'){
    hat=`<path d="M19 22 Q20 9 32 9 Q44 9 45 22 Q42 15 32 15 Q22 15 19 22Z" fill="#2B231C"/>`;
    chest=`<path d="M26 50 L32 60 L38 50Z" fill="#fff"/><path d="M31 52 L33 52 L34.5 62 L32 64 L29.5 62Z" fill="#2B5BD7"/>
      <rect x="40" y="54" width="9" height="7" rx="1" fill="#fff"/><rect x="41" y="55" width="7" height="2" fill="#2B5BD7"/><path d="M38 50 L44 54" stroke="#2B5BD7" stroke-width="1"/>`;
  } else if(kind==='해군'){
    hat=`<rect x="18" y="12" width="28" height="7" rx="3" fill="#F4F4F4"/><rect x="20" y="17" width="24" height="3" fill="#1C2740"/><circle cx="32" cy="15" r="2.2" fill="#D4AF37"/>`;
    chest=`<path d="M24 50 L32 58 L40 50" fill="none" stroke="#fff" stroke-width="2"/>`;
  } else if(kind==='공군'){
    hat=`<path d="M19 18 Q32 8 45 18 L45 20 L19 20Z" fill="#3C4A5B"/><rect x="29" y="12" width="6" height="4" fill="#8FB8D8"/>`;
    chest=`<rect x="38" y="53" width="8" height="3" fill="#8FB8D8"/>`;
  } else if(kind==='해병'){
    hat=`<path d="M18 19 L21 10 L43 10 L46 19Z" fill="#3A4128"/><rect x="18" y="18" width="28" height="3" fill="#2B2B2B"/><circle cx="32" cy="14" r="2.4" fill="#D4AF37"/>`;
    chest=`<rect x="20" y="53" width="11" height="4" fill="#C0392B"/><rect x="21" y="54" width="9" height="2" fill="#F2C230"/>`;
  } else {
    hat=`<path d="M18 19 Q19 9 32 9 Q45 9 46 19Z" fill="${U[1]}"/><rect x="16" y="18" width="32" height="3" rx="1.5" fill="${U[1]}"/>
      <rect x="25" y="12" width="14" height="4" rx="1" fill="#C0392B"/><text x="32" y="15.4" font-size="3.4" text-anchor="middle" fill="#fff" font-weight="900" font-family="sans-serif">조교</text>`;
    chest=`<rect x="38" y="53" width="8" height="3" fill="#D4AF37"/>`;
  }
  return `<svg class="npcsvg" viewBox="0 0 64 64" aria-hidden="true">
    <path d="M8 64 Q10 48 32 46 Q54 48 56 64Z" fill="${U[0]}"/><path d="M26 46 L32 52 L38 46Z" fill="${U[1]}"/>
    <rect x="28" y="38" width="8" height="9" fill="#E2B084"/>
    <ellipse cx="32" cy="27" rx="12" ry="13" fill="#F0C49A"/><ellipse cx="20" cy="28" rx="2" ry="3" fill="#E2B084"/><ellipse cx="44" cy="28" rx="2" ry="3" fill="#E2B084"/>
    <rect x="26" y="25" width="3" height="2.4" rx="1" fill="#2B231C"/><rect x="35" y="25" width="3" height="2.4" rx="1" fill="#2B231C"/>
    <path d="M24.5 22 L29.5 21.4 M34.5 21.4 L39.5 22" stroke="#2B231C" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M28.5 33 Q32 35 35.5 33" stroke="#B8775C" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    ${hat}${chest}</svg>`;
}
