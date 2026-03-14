-- 샘플 게시글 (Supabase DB가 비어 있을 때 SQL 에디터에서 실행)
-- schema.sql 실행 후 이 파일을 실행하세요.

insert into public.knowledge_posts (title, category, summary, content_markdown, author_display_name)
values
  ('4월 정기모임 안내', 'NOTICE', '2025년 4월 정기모임 일정 및 참가 방법을 안내합니다.', '## 4월 정기모임\n\n일시: 2025년 4월 중\n장소: 서울소방재난본부\n\n참가 신청은 내부 공지문을 확인해 주세요.', '서울소방'),
  ('AI 활용 가이드 - 화재 현장 보고서 작성', 'AI_UTIL', 'AI를 활용해 화재 현장 보고서를 빠르고 정확하게 작성하는 방법을 소개합니다.', '## AI 활용 개요\n\n현장에서 수집한 정보를 AI 도구에 입력하면 보고서 초안이 자동 생성됩니다.\n\n※ 최종 검토 후 제출하세요.', null),
  ('소방안전교육 강의 신청 방법', 'LECTURE', '주민 대상 소방안전교육 강의 신청 절차와 유의사항을 안내합니다.', '## 강의 신청\n\n1. 담당 부서로 문의\n2. 희망 일정 협의\n3. 신청서 제출', null)
;
