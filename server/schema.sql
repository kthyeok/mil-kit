-- Mil-Kit 군별 사용자 수 카운터
-- 입영통지서 단계에서 고른 군을 1씩 센다. 개인정보는 저장하지 않는다.
create table if not exists public.milkit_force_count (
  force      text primary key check (force in ('육군','해군','공군','해병','기타')),
  cnt        bigint      not null default 0 check (cnt >= 0),
  updated_at timestamptz not null default now()
);
insert into public.milkit_force_count (force) values ('육군'),('해군'),('공군'),('해병'),('기타')
on conflict (force) do nothing;

-- 1 증가 (원자적) — 허용된 군만 갱신된다
create or replace function public.milkit_hit(f text) returns void
language sql as $$
  update public.milkit_force_count set cnt = cnt + 1, updated_at = now() where force = f;
$$;

-- (권장) API 서버 전용 최소 권한 계정 — 비밀번호를 정해 직접 실행하세요
-- create role milkit_api login password '…';
-- grant select on public.milkit_force_count to milkit_api;
-- grant execute on function public.milkit_hit(text) to milkit_api;
-- grant update (cnt, updated_at) on public.milkit_force_count to milkit_api;
