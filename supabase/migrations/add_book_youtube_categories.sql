-- 추천도서(BOOK)·필독 유튜브(YOUTUBE) 카테고리 — 앱 Write/Edit과 enum 일치
-- 기존 프로젝트: Supabase SQL Editor에서 한 번 실행 (멱등)

do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'knowledge_category' and e.enumlabel = 'BOOK'
  ) then
    alter type public.knowledge_category add value 'BOOK';
  end if;

  if not exists (
    select 1 from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'knowledge_category' and e.enumlabel = 'YOUTUBE'
  ) then
    alter type public.knowledge_category add value 'YOUTUBE';
  end if;
end $$;

-- 상태 확인 (SQL Editor에서 선택 실행):
-- select e.enumlabel
-- from pg_enum e
-- join pg_type t on e.enumtypid = t.oid
-- where t.typname = 'knowledge_category'
-- order by e.enumsortorder;
