-- knowledge_posts에 image_urls 컬럼 추가 (기존 DB용)

alter table public.knowledge_posts
  add column if not exists image_urls jsonb;
