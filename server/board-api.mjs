/*
 * Mil-Kit '우리들의 이야기' 게시판 API — 단독 실행 서버
 *   GET  /board?force=해군&limit=30&before=123   → [{id,force,name,title,body,at,comments}] 최신순 (before: 이 id보다 오래된 글)
 *   GET  /board/:id                              → {post:{…}, comments:[{id,parent_id,name,body,at}]}
 *   POST /board            {force,name,title,body} → 새 글
 *   POST /board/:id/comments {name,body,parent_id?} → 새 댓글 · 대댓글 (대댓글의 대댓글은 원 댓글 아래로 모은다)
 *   GET  /health
 *
 * 테이블: server/board.sql 을 먼저 실행
 * 환경변수: PGHOST PGPORT PGUSER PGPASSWORD (PGDATABASE=postgres)
 *          PORT=8788  ALLOW_ORIGIN=https://kthyeok.github.io (쉼표로 여러 개)
 * 실행:    npm i pg && node board-api.mjs
 */
import http from 'node:http';
import pg from 'pg';

const FORCES = ['육군', '해군', '공군', '해병', '기타'];
const PORT = +process.env.PORT || 8788;
const ORIGINS = (process.env.ALLOW_ORIGIN || 'https://kthyeok.github.io').split(',').map(s => s.trim()).filter(Boolean);
const pool = new pg.Pool({ database: process.env.PGDATABASE || 'postgres', max: 6, idleTimeoutMillis: 30000, connectionTimeoutMillis: 8000 });

/* 도배 방지 — IP당 10분에 글 3개 · 댓글 15개 (IP는 메모리에만, DB에는 저장하지 않음) */
const WINDOW = 10 * 60 * 1000, buckets = { post: new Map(), cmt: new Map() }, LIMITS = { post: 3, cmt: 15 };
function allowed(kind, ip) {
  const m = buckets[kind], now = Date.now(), a = (m.get(ip) || []).filter(t => now - t < WINDOW);
  if (a.length >= LIMITS[kind]) { m.set(ip, a); return false; }
  a.push(now); m.set(ip, a); return true;
}
setInterval(() => { const now = Date.now(); for (const m of Object.values(buckets)) for (const [ip, a] of m) if (!a.some(t => now - t < WINDOW)) m.delete(ip); }, WINDOW).unref();

const BAD = /씨발|시발|ㅅㅂ|ㅆㅂ|병신|ㅂㅅ|개새|좆|존나|지랄|꺼져|닥쳐|느금|fuck|shit/gi;
const LINK = /https?:|www\.|\.(com|net|kr|io|me|ly)\b/i;
/* 한 줄 입력(닉네임·제목·댓글) */
const line = (v, max) => String(v || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max).replace(BAD, m => '*'.repeat(m.length));
/* 여러 줄 입력(본문) — 줄바꿈은 살리고 3줄 이상 빈 줄은 줄인다 */
const text = (v, max) => String(v || '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim().slice(0, max).replace(BAD, m => '*'.repeat(m.length));
const post = r => ({ id: Number(r.id), force: r.force, name: r.name, title: r.title, body: r.body, at: r.created_at, comments: Number(r.comments || 0) });
const cmt = r => ({ id: Number(r.id), parent_id: r.parent_id == null ? null : Number(r.parent_id), name: r.name, body: r.body, at: r.created_at });

function send(res, code, body, origin) {
  const h = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Vary': 'Origin' };
  if (origin) Object.assign(h, { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  res.writeHead(code, h); res.end(body == null ? '' : JSON.stringify(body));
}
async function readJson(req, max) {
  let raw = ''; for await (const c of req) { raw += c; if (raw.length > max) break; }
  try { return JSON.parse(raw); } catch { return {}; }
}
const ipOf = req => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

http.createServer(async (req, res) => {
  const o = req.headers.origin, origin = o && (ORIGINS.includes(o) || ORIGINS.includes('*')) ? o : null;
  const url = new URL(req.url, 'http://x'), parts = url.pathname.split('/').filter(Boolean);
  try {
    if (req.method === 'OPTIONS') return send(res, 204, null, origin);
    if (url.pathname === '/health') return send(res, 200, { ok: true }, origin);
    if (parts[0] !== 'board') return send(res, 404, { error: 'not found' }, origin);
    if (req.method === 'POST' && o && !origin) return send(res, 403, { error: 'origin' }, null);

    /* 글 목록 */
    if (req.method === 'GET' && parts.length === 1) {
      const force = url.searchParams.get('force'), limit = Math.min(50, Math.max(1, +url.searchParams.get('limit') || 30));
      const before = +url.searchParams.get('before') || null;
      if (!FORCES.includes(force)) return send(res, 400, { error: 'force' }, origin);
      const { rows } = await pool.query(
        `select p.id, p.force, p.name, p.title, p.body, p.created_at,
                (select count(*) from public.milkit_board_comment c where c.post_id = p.id and not c.hidden) as comments
           from public.milkit_board_post p
          where p.force = $1 and not p.hidden and ($3::bigint is null or p.id < $3)
          order by p.id desc limit $2`, [force, limit, before]);
      return send(res, 200, rows.map(post), origin);
    }
    /* 글 + 댓글 */
    if (req.method === 'GET' && parts.length === 2) {
      const id = +parts[1]; if (!id) return send(res, 400, { error: 'id' }, origin);
      const p = await pool.query('select id, force, name, title, body, created_at from public.milkit_board_post where id = $1 and not hidden', [id]);
      if (!p.rows.length) return send(res, 404, { error: 'not found' }, origin);
      const c = await pool.query('select id, parent_id, name, body, created_at from public.milkit_board_comment where post_id = $1 and not hidden order by id', [id]);
      return send(res, 200, { post: post({ ...p.rows[0], comments: c.rows.length }), comments: c.rows.map(cmt) }, origin);
    }
    /* 글쓰기 */
    if (req.method === 'POST' && parts.length === 1) {
      const b = await readJson(req, 6000);
      const force = b.force, name = line(b.name, 12), title = line(b.title, 40), body = text(b.body, 1000);
      if (!FORCES.includes(force)) return send(res, 400, { error: 'force' }, origin);
      if (title.length < 2 || body.length < 2) return send(res, 400, { error: 'empty' }, origin);
      if (LINK.test(name + title + body)) return send(res, 400, { error: 'link' }, origin);
      if (!allowed('post', ipOf(req))) return send(res, 429, { error: 'slow down' }, origin);
      const { rows } = await pool.query('insert into public.milkit_board_post (force, name, title, body) values ($1,$2,$3,$4) returning id, force, name, title, body, created_at', [force, name, title, body]);
      return send(res, 201, post(rows[0]), origin);
    }
    /* 댓글 · 대댓글 */
    if (req.method === 'POST' && parts.length === 3 && parts[2] === 'comments') {
      const id = +parts[1]; if (!id) return send(res, 400, { error: 'id' }, origin);
      const b = await readJson(req, 2000), name = line(b.name, 12), body = line(b.body, 300);
      if (!body) return send(res, 400, { error: 'empty' }, origin);
      if (LINK.test(name + body)) return send(res, 400, { error: 'link' }, origin);
      const p = await pool.query('select 1 from public.milkit_board_post where id = $1 and not hidden', [id]);
      if (!p.rows.length) return send(res, 404, { error: 'not found' }, origin);
      let parent = b.parent_id == null ? null : +b.parent_id;
      if (parent) {   // 같은 글의 댓글만, 대댓글에 단 답글은 원 댓글 아래로
        const q = await pool.query('select id, parent_id from public.milkit_board_comment where id = $1 and post_id = $2', [parent, id]);
        if (!q.rows.length) return send(res, 400, { error: 'parent' }, origin);
        parent = Number(q.rows[0].parent_id || q.rows[0].id);
      }
      if (!allowed('cmt', ipOf(req))) return send(res, 429, { error: 'slow down' }, origin);
      const { rows } = await pool.query('insert into public.milkit_board_comment (post_id, parent_id, name, body) values ($1,$2,$3,$4) returning id, parent_id, name, body, created_at', [id, parent, name, body]);
      return send(res, 201, cmt(rows[0]), origin);
    }
    send(res, 404, { error: 'not found' }, origin);
  } catch (e) {
    console.error(e.message);
    send(res, 500, { error: 'server' }, origin);
  }
}).listen(PORT, () => console.log(`milkit board api :${PORT} · allow ${ORIGINS.join(', ')}`));
