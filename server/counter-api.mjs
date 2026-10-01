/*
 * Mil-Kit 군별 사용자 수 카운터 API
 *   GET  /counts          → {"육군":1234,"해군":56,...}
 *   POST /hit {"force":"해군"} → 1 증가 후 최신 카운트
 *
 * 정적 사이트(GitHub Pages)는 DB에 직접 붙을 수 없고, 붙더라도 비밀번호가 노출되므로
 * 이 작은 서버가 DB 앞에서 '1 더하기'와 '읽기'만 대신한다.
 *
 * 환경변수: PGHOST PGPORT PGUSER PGPASSWORD (PGDATABASE=postgres)
 *          PORT=8787  ALLOW_ORIGIN=https://kthyeok.github.io (쉼표로 여러 개)
 * 실행:    npm i pg && node counter-api.mjs
 */
import http from 'node:http';
import pg from 'pg';

const FORCES = ['육군', '해군', '공군', '해병', '기타'];
const PORT = +process.env.PORT || 8787;
const ORIGINS = (process.env.ALLOW_ORIGIN || 'https://kthyeok.github.io').split(',').map(s => s.trim()).filter(Boolean);
const pool = new pg.Pool({ database: process.env.PGDATABASE || 'postgres', max: 4, idleTimeoutMillis: 30000, connectionTimeoutMillis: 8000 });

/* IP당 10분에 20회까지만 센다 (같은 사람이 버튼을 연타해도 부풀지 않게) */
const LIMIT = 20, WINDOW = 10 * 60 * 1000, hits = new Map();
function allowed(ip) {
  const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < WINDOW);
  if (a.length >= LIMIT) { hits.set(ip, a); return false; }
  a.push(now); hits.set(ip, a); return true;
}
setInterval(() => { const now = Date.now(); for (const [ip, a] of hits) if (!a.some(t => now - t < WINDOW)) hits.delete(ip); }, WINDOW).unref();

let cache = null, cacheAt = 0;
async function counts(fresh) {
  if (!fresh && cache && Date.now() - cacheAt < 5000) return cache;
  const { rows } = await pool.query('select force, cnt from public.milkit_force_count');
  cache = Object.fromEntries(FORCES.map(f => [f, Number((rows.find(r => r.force === f) || {}).cnt || 0)]));
  cacheAt = Date.now();
  return cache;
}

function send(res, code, body, origin) {
  const h = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Vary': 'Origin' };
  if (origin) Object.assign(h, { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  res.writeHead(code, h); res.end(body == null ? '' : JSON.stringify(body));
}

http.createServer(async (req, res) => {
  const o = req.headers.origin, origin = o && (ORIGINS.includes(o) || ORIGINS.includes('*')) ? o : null;
  const url = new URL(req.url, 'http://x');
  try {
    if (req.method === 'OPTIONS') return send(res, 204, null, origin);
    if (req.method === 'GET' && url.pathname === '/counts') return send(res, 200, await counts(), origin);
    if (req.method === 'POST' && url.pathname === '/hit') {
      if (o && !origin) return send(res, 403, { error: 'origin' }, null);
      let raw = ''; for await (const c of req) { raw += c; if (raw.length > 200) break; }
      let force; try { force = JSON.parse(raw).force; } catch { /* ignore */ }
      if (!FORCES.includes(force)) return send(res, 400, { error: 'force' }, origin);
      const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
      if (allowed(ip)) await pool.query('select public.milkit_hit($1)', [force]);
      return send(res, 200, await counts(true), origin);
    }
    if (url.pathname === '/health') return send(res, 200, { ok: true }, origin);
    send(res, 404, { error: 'not found' }, origin);
  } catch (e) {
    console.error(e.message);
    send(res, 500, { error: 'server' }, origin);
  }
}).listen(PORT, () => console.log(`milkit counter api :${PORT} · allow ${ORIGINS.join(', ')}`));
