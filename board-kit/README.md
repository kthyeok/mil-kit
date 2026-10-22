# 우리들의 이야기 — 운영 이관 패키지

군별(육군·해군·공군·해병·기타) 익명 게시판입니다. 글·댓글·대댓글을 지원하고 예시 글도 함께 들어 있습니다.
**이 폴더만 운영 서버로 가져가면 됩니다.**

```
board-kit/
├─ web/                      ← 웹서버(정적 파일)에 올림
│  ├─ board.js               게시판 화면·동작 (전역 함수 openBoard() / closeBoard())
│  ├─ board.css              게시판 스타일
│  ├─ board-mock.js          예시 글 25개 (군별 5개, 댓글·대댓글 포함) — 빼도 됨
│  └─ demo.html              단독 확인용 페이지 (버튼 하나 → 게시판)
└─ server/                   ← API 서버(Node 18+)
   ├─ board-api.mjs          게시판 API (단독 실행, 기본 포트 8788)
   ├─ board.sql              DB 테이블 2개 (글 · 댓글)
   ├─ package.json
   └─ package-lock.json
```

---

## 1. DB

`server/board.sql`을 한 번 실행합니다. (현재 Mil-Kit DB에는 이미 적용되어 있음)

| 테이블 | 내용 |
|---|---|
| `public.milkit_board_post` | 글 — 군, 닉네임(선택·12자), 제목(2~40자), 본문(2~1000자), 숨김 여부, 작성 시각 |
| `public.milkit_board_comment` | 댓글 — 글 id, 원 댓글 id(`parent_id`, 대댓글일 때), 닉네임, 내용(1~300자), 숨김 여부, 작성 시각 |

- IP 등 개인정보는 저장하지 않습니다.
- 글이나 댓글을 내릴 때는 `update … set hidden = true where id = …` (화면·API에서 바로 사라짐)
- 파일 아래 주석에 API 전용 최소 권한 계정 SQL이 있습니다. `postgres` 대신 그 계정을 쓰세요.

## 2. API 서버

```bash
cd server
npm install
PGHOST=… PGPORT=… PGUSER=… PGPASSWORD=… ALLOW_ORIGIN=https://운영도메인 node board-api.mjs
```

| 환경변수 | 설명 |
|---|---|
| `PGHOST` `PGPORT` `PGUSER` `PGPASSWORD` | DB 접속 (코드에 넣지 말 것) |
| `PGDATABASE` | 기본 `postgres` |
| `PORT` | 기본 `8788` |
| `ALLOW_ORIGIN` | 글쓰기를 허용할 사이트 주소. 여러 개면 쉼표로 |

| API | 설명 |
|---|---|
| `GET /board?force=해군&limit=30&before=123` | 글 목록 (최신순, 댓글 수 포함 · `before`: 더 오래된 글 이어 보기) |
| `GET /board/:id` | 글 + 댓글·대댓글 |
| `POST /board` `{force, name, title, body}` | 글쓰기 |
| `POST /board/:id/comments` `{name, body, parent_id?}` | 댓글 · 대댓글 (대댓글에 단 답글은 원 댓글 아래로 모음) |
| `GET /health` | 상태 확인 |

- 욕설은 단어째 `**` 로 가림 · 링크(http, www, .com 등)는 거부 · IP당 10분에 글 3개 / 댓글 15개
- 웹이 HTTPS면 API도 HTTPS여야 합니다(리버스 프록시). 웹과 같은 도메인의 `/api/` 아래로 두면 `ALLOW_ORIGIN` 설정이 단순해집니다.

## 3. 웹 화면

`web/`의 파일을 웹서버에 올리고, 게시판을 띄울 페이지에 아래를 넣습니다.

```html
<head>
  <meta name="board-api" content="https://운영도메인/api">   <!-- board-api.mjs 주소 -->
  <link rel="stylesheet" href="board.css">
</head>
<body>
  …
  <button onclick="openBoard()">💬 우리들의 이야기</button>
  <script src="board-mock.js"></script>   <!-- 예시 글 (필요 없으면 이 줄 삭제) -->
  <script src="board.js"></script>
</body>
```

- 화면을 꽉 채우는 레이어로 열리고, 오른쪽 위 **닫기**로 닫힙니다.
- Mil-Kit 안(`#app`)에서는 앱 화면 안을 채우고, 다른 페이지에서는 브라우저 화면 전체를 채웁니다.
- `openBoard('해군')` 처럼 군을 넘기면 그 탭으로 열립니다.
- `board-api`가 비어 있거나 서버에 연결하지 못하면 글이 **그 기기에만** 저장되고, 화면에 그렇게 안내됩니다.
- 확인: `web/demo.html`을 열면 버튼 하나로 바로 써볼 수 있습니다.

## 4. 예시 글 (`board-mock.js`)

- 군별 5개, 모두 25개 · 댓글·대댓글 포함 · 작성 시각은 페이지를 연 시점 기준 "35분 전", "3일 전" 식으로 계산
- 목록에 **예시** 배지, 글 안에 "○○ · 예시 글"이 붙어 실제 사용자 글과 구분됩니다.
- DB에 넣지 않고 파일로만 보여주므로, 실제 글과 섞여도 언제든 한 줄로 걷어낼 수 있습니다.
- 예시 글에 단 댓글은 서버로 보내지 않고 그 기기에만 저장됩니다.
- 빼는 방법: `<script src="board-mock.js">` 한 줄 삭제 (파일도 지워도 됨)

## 5. 이관 체크리스트

- [ ] `server/board.sql` 실행 (새 DB일 때)
- [ ] API 전용 DB 계정 만들기 · `postgres` 비밀번호 변경
- [ ] `board-api.mjs` 실행 + HTTPS 연결 · `ALLOW_ORIGIN`에 운영 도메인
- [ ] 페이지 `<meta name="board-api">`에 API 주소
- [ ] 예시 글을 쓸지 결정 (`board-mock.js` 유지/삭제)
- [ ] `demo.html` 또는 실제 페이지에서 글·댓글·대댓글 한 번씩 써보고 DB에 들어갔는지 확인
