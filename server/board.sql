-- Mil-Kit 우리들의 이야기 (군별 익명 게시판) — 글 · 댓글 · 대댓글
-- 닉네임은 선택, IP 등 개인정보는 저장하지 않는다. hidden=true 로 숨김 처리(관리자).
create table if not exists public.milkit_board_post (
  id         bigserial primary key,
  force      text        not null check (force in ('육군','해군','공군','해병','기타')),
  name       text        not null default '' check (char_length(name) <= 12),
  title      text        not null check (char_length(title) between 2 and 40),
  body       text        not null check (char_length(body) between 2 and 1000),
  hidden     boolean     not null default false,
  created_at timestamptz not null default now()
);
create index if not exists milkit_board_post_force_idx on public.milkit_board_post (force, id desc) where not hidden;

create table if not exists public.milkit_board_comment (
  id         bigserial primary key,
  post_id    bigint      not null references public.milkit_board_post(id) on delete cascade,
  parent_id  bigint      references public.milkit_board_comment(id) on delete cascade,   -- 대댓글이면 원 댓글 id
  name       text        not null default '' check (char_length(name) <= 12),
  body       text        not null check (char_length(body) between 1 and 300),
  hidden     boolean     not null default false,
  created_at timestamptz not null default now()
);
create index if not exists milkit_board_comment_post_idx on public.milkit_board_comment (post_id, id);

-- (권장) 게시판 API 전용 최소 권한 계정
-- create role milkit_board login password '…';
-- grant select, insert on public.milkit_board_post, public.milkit_board_comment to milkit_board;
-- grant usage on sequence public.milkit_board_post_id_seq, public.milkit_board_comment_id_seq to milkit_board;
