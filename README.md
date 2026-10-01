# Mil-Kit 🍳 — 당신의 군생활을 요리해 드립니다

병사의 진급 과정(이병 → 일병 → 상병 → 병장)을 게임처럼 따라가며 모은 답으로
**잡코리아 채용공고 조건**과 **Q-Net 국가자격 필터**를 만들고, 실제 채용공고와 자격증 코스를 보여주는 모바일 웹입니다.

## 바로 열어보기
👉 https://kthyeok.github.io/mil-kit/

## 구성
| 파일 | 내용 |
|---|---|
| `index.html` | 앱 본체 (Pretendard · GSAP · canvas-confetti CDN 사용, 없어도 동작) |
| `data.js` | 실데이터 스냅샷 — 잡코리아 채용정보 + Q-Net 국가자격 종목 목록 |
| `og.png` | 카카오톡·SNS 링크 미리보기 이미지 |
| `src/` | 앱 소스 조각 (CSS·JS·HTML 셸) — `build.py`가 합쳐 `index.html`을 만듦 |
| `build.py` | 빌드 스크립트 |
| `tests/smoke.mjs` | 헤드리스 크롬으로 전체 흐름 자동 완주·화면 넘침·콘솔 에러 검사 |
| `tools/export_snapshot.py` | Postgres → `data.js` 스냅샷 생성기 |
| `server/` | 군별 사용자 수 카운터 — `schema.sql`(테이블·함수) · `counter-api.mjs`(작은 API 서버) |

- 군 선택: 육군 · 해군 · 공군 · 해병 · 기타(상근예비역 · 카투사 등)
- 흐름: 스플래시 → 입대 → 병무청 신상명세서(학력·전공) → 자대 배치 면담(8개 분야) → 계급별 생활 이벤트 → 전역 후 진로(바로 취업 / 복학 → 졸업 후 희망 분야 → 목표 공고 선택 → 그 공고에 맞춘 나의 코스) → 요리(결과)
- 결과: **꿈을 위한 코스 서비스**(지원 자격 · 갖춰야 할 자격 · 우대 키워드 · 채용 프로세스 · 나의 코스, 좌우 스와이프) · 채용공고(원문 링크) · 자격증 · 전역카드/명함 · 카카오톡 공유
- 코스 분석은 스냅샷 필드(학력·경력·고용형태·키워드 태그·제목)와 연결된 자격을 집계하고, 채용 절차는 직무군별 일반 전형에 공고 문구에서 찾은 단계를 겹쳐 보여줍니다. 공고 원문의 상세 요강은 담지 않으며 각 공고의 '원문 보기'에서 확인합니다.
- 화면 전환: 아래에서 위로 전체 화면 넘김, 왼쪽 가장자리 스와이프로 뒤로 가기 · 목록은 좌우 스와이프로 페이지 넘김

## 개발
```bash
python build.py                    # src/ → index.html
node tests/smoke.mjs 390x844 shots # 전체 흐름 자동 점검 (Node 22+, Chrome) · PLAN=job 이면 바로 취업 경로
```
| 소스 | 역할 |
|---|---|
| `src/shell.html` | HTML 뼈대 · 메타(OG·카카오 키) · CDN |
| `src/a1_app.js` | 화면 흐름 (스플래시 → 입대 → 신상명세서 → 자대 배치 → 계급별 이벤트 → 결과) |
| `src/a2_card.js` | 전역카드 · 명함 · 카카오톡/선후임 공유 |
| `src/a3_fx.js` | 화면 넘김(아래→위) · 물결 · 꽃가루 · 숫자 올라가기 |
| `src/d1_api.js` | 잡코리아 요청 변수 → 스냅샷 필터 · Q-Net 목록 |
| `src/d2_game.js` | 계급별 이벤트 = API 요청 변수 매핑 |
| `src/d3_art.js` | 군별 배경 일러스트 · 교관 아바타 |
| `src/legacy/` | 병무청 군사특기 데이터 · 픽셀 캐릭터 |

## 카카오톡 공유 카드 켜기
1. [Kakao Developers](https://developers.kakao.com)에서 앱을 만들고 **JavaScript 키**를 복사
2. 앱 설정 → 플랫폼 → Web → 사이트 도메인에 `https://kthyeok.github.io` 등록
3. `src/shell.html`의 `<meta name="kakao-js-key" content="">`에 키를 넣고 `python build.py` 후 푸시
   (키가 없으면 휴대폰 공유창 → 카카오톡으로 문구 + 링크 미리보기 카드가 전송됩니다)

## 군별 사용자 수 카운터
입영통지서에서 고른 군을 `public.milkit_force_count` 테이블에 1씩 세고, 메인 · 입영통지서 · 결과 · 공유 화면에 k/m 단위로 보여줍니다.
정적 사이트는 DB에 직접 쓸 수 없으므로(비밀번호 노출) `server/counter-api.mjs`가 DB 앞에서 '1 더하기'와 '읽기'만 대신합니다.

1. DB에 테이블·함수 만들기: `server/schema.sql` 실행 (이미 적용됨). 파일 아래쪽 주석대로 API 전용 최소 권한 계정을 만드는 것을 권장합니다.
2. API 서버 배포 (HTTPS 필요 — GitHub Pages가 HTTPS라 http API는 브라우저가 막습니다). 예: Render.com Web Service
   - Root Directory `server` · Build `npm install` · Start `node counter-api.mjs`
   - 환경변수 `PGHOST` `PGPORT` `PGUSER` `PGPASSWORD` `ALLOW_ORIGIN=https://kthyeok.github.io`
   - 직접 서버에서 돌린다면 `cd server && npm i && node counter-api.mjs` + HTTPS(예: Cloudflare Tunnel)
3. `src/shell.html`의 `<meta name="counter-api" content="">`에 API 주소(예: `https://milkit-counter.onrender.com`)를 넣고 `python build.py` 후 푸시

API가 설정되기 전에는 `data.js` 스냅샷에 담긴 카운트(스냅샷 생성 시점 값)를 보여주고, 이 기기에서 고른 1만 더해 보여줍니다.
API: `GET /counts` → `{"육군":1234,...}` · `POST /hit {"force":"해군"}` (IP당 10분 20회 제한, 허용 도메인만)

## 데이터 갱신
정적 호스팅(GitHub Pages)은 DB에 직접 붙지 않으므로 스냅샷을 다시 만들어 올립니다.
접속 정보는 코드에 넣지 않고 환경변수로만 전달합니다.
```bash
pip install psycopg2-binary
PGHOST=... PGPORT=... PGUSER=... PGPASSWORD=... python tools/export_snapshot.py data.js
```

## 안내
- 채용정보 출처: 잡코리아 — 채용기업과 잡코리아의 동의 없이 무단 전재·재배포·재가공할 수 없습니다. 자세한 내용은 각 공고 원문에서 확인하세요.
- 자격 정보 출처: 한국산업인력공단 Q-Net 국가자격 종목 목록.
- 공고와 자격의 연결은 공고 제목·키워드·직무로 추정한 것이며, 실제 우대 조건은 원문에서 확인하세요.
- 입력한 학력·전공·이름 등은 브라우저 안에서만 쓰이며 어디에도 전송되지 않습니다.
