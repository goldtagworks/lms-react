-- LMS schema v1.4 (2025-10-01)
-- Change Log:
--  * v1.1: Removed course_sections table; simplified curriculum model.
--          Added lessons.is_section boolean; deprecated lessons.section_id.
--          Rationale: 프론트/UX 단순화 요구. (섹션 헤더를 레슨 Row로 통합)
--  * v1.4: Added notices, instructor_applications tables (migrating from in-memory repository)
-- =============================

-- =====================================================================
-- FULL REBUILD HELPER (dev only)
-- 필요 시 모든 핵심 테이블을 깨끗하게 재생성하기 위한 드롭 블록.
-- prod 환경이나 마이그레이션 체인에서는 사용 금지. (명시적 버전 이동시 별도 migration 작성)
-- 주의: 외래키 CASCADE 로 의존 데이터 전부 삭제됨.
-- =====================================================================
DO $$
BEGIN
  IF current_setting('server_version_num')::int >= 0 THEN  -- 형식적 가드
    PERFORM 1;
  END IF;
END $$;


DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_pricing_mode') THEN
    CREATE TYPE course_pricing_mode AS ENUM ('free', 'fixed', 'subscription');
  END IF;
END $$;

-- 누락된 enum 타입 정의 (FK/컬럼에서 참조되므로 선행 필요)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_source') THEN
    CREATE TYPE enrollment_source AS ENUM ('free','purchase','manual');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coupon_discount_type') THEN
    CREATE TYPE coupon_discount_type AS ENUM ('percent','amount');
  END IF;
END $$;

-- ============================================================
-- (ORDERING NOTE)
-- categories 테이블은 courses.category_id FK 의존성 해소를 위해
-- courses 생성보다 앞서 정의되어야 한다. (기존 위치: 쿠폰/레딤션 뒤)
-- ============================================================
DROP TABLE IF EXISTS categories CASCADE; -- (moved up) 카테고리 선행 생성
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- 카테고리 고유 ID
  slug text NOT NULL UNIQUE, -- 슬러그(영문)
  name text NOT NULL -- 카테고리명
);


-- [프로필] 사용자 기본 공개/역할 정보 (auth.users 1:1 확장)
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- 사용자 ID (auth.users FK)
  display_name text, -- 표시 이름 (강사/수강생 공통)
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student','instructor','admin')), -- 역할
  bio_md text, -- 소개 (Markdown)
  avatar_url text, -- 아바타 이미지
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
-- (NOTE) instructor 관련 통계/대표 강의 뷰는 후속 v1.x에서 추가 예정

-- [코스] 강의/클래스의 기본 정보 테이블
DROP TABLE IF EXISTS courses CASCADE;
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- 코스 고유 ID
  title text NOT NULL, -- 코스명
  description text, -- 코스 설명
  instructor_id uuid NOT NULL REFERENCES profiles(user_id), -- 강사(프로필) ID
  pricing_mode course_pricing_mode NOT NULL DEFAULT 'free', -- 가격 정책(free/fixed)
  price_cents integer NOT NULL DEFAULT 0, -- 정가(원)
  sale_price_cents integer, -- 세일가(원)
  sale_ends_at timestamptz, -- 세일 종료일
  tax_included boolean NOT NULL DEFAULT true, -- 세금 포함 여부
  currency char(3) NOT NULL DEFAULT 'KRW', -- 통화
  level text, -- 난이도
  category_id uuid REFERENCES categories(id), -- 카테고리 ID
  thumbnail_url text, -- 썸네일 이미지
  summary text, -- 짧은 소개 (목록/SEO) @optional
  tags text[] DEFAULT '{}', -- 태그 배열 (간단 분류/검색) @optional
  is_featured boolean NOT NULL DEFAULT false, -- 추천 여부
  featured_rank int, -- 추천 정렬 우선순위(낮을수록 먼저)
  featured_badge_text text, -- 추천 배지 커스텀 텍스트
  published boolean NOT NULL DEFAULT false, -- 공개 여부
  created_at timestamptz NOT NULL DEFAULT now(), -- 생성일
  updated_at timestamptz NOT NULL DEFAULT now() -- 수정일
);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_category_id ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_featured ON courses(is_featured);
CREATE INDEX IF NOT EXISTS idx_courses_featured_rank ON courses(featured_rank) WHERE featured_rank IS NOT NULL;

-- (Removed deprecated legacy lessons/enrollments blocks – canonical definitions below)

-- [레슨] 강의 내 개별 학습 단위(신버전)
DROP TABLE IF EXISTS lessons CASCADE;
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- 레슨 고유 ID
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE, -- 코스 ID
  title text NOT NULL, -- 레슨/섹션 제목 (is_section=true 시 섹션 헤더)
  outline jsonb, -- 목차/개요
  content_md text, -- 본문(Markdown)
  content_url text, -- 외부 본문 URL
  attachments jsonb, -- 첨부파일
  duration_seconds int NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0), -- 영상 길이(초)
  order_index int NOT NULL, -- 순서 (섹션 포함 전역 정렬)
  is_section boolean NOT NULL DEFAULT false, -- 섹션 헤더 여부 (v1.1 추가)
  is_preview boolean NOT NULL DEFAULT false CHECK (is_section = false OR is_preview = false), -- 미리보기 (섹션 헤더는 미리보기 불가)
  created_at timestamptz NOT NULL DEFAULT now(), -- 생성일
  updated_at timestamptz NOT NULL DEFAULT now(), -- 수정일
  section_id uuid, -- @deprecated v1.1: 유지(마이그레이션 호환), 의미 없음
  UNIQUE (course_id, order_index)
);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);

-- [수강신청] 사용자의 강의 등록/수강 상태(신버전)
DROP TABLE IF EXISTS enrollments CASCADE;
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- 수강신청 고유 ID
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE, -- 사용자 ID
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE, -- 코스 ID
  status text NOT NULL CHECK (status IN ('PENDING','ENROLLED','CANCELLED')) DEFAULT 'PENDING', -- 상태
  source enrollment_source NOT NULL DEFAULT 'free', -- 신청 경로
  created_at timestamptz NOT NULL DEFAULT now(), -- 생성일
  UNIQUE (user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_enroll_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enroll_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enroll_active ON enrollments(status) WHERE status = 'ENROLLED';

-- [시험] 코스 내 시험 메타 (attempts가 참조)
DROP TABLE IF EXISTS exams CASCADE;
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- 시험 고유 ID
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE, -- 코스 ID
  title text NOT NULL, -- 시험 제목
  description_md text, -- 시험 설명(Markdown)
  pass_score int NOT NULL CHECK (pass_score BETWEEN 0 AND 100), -- 합격 점수
  time_limit_minutes int CHECK (time_limit_minutes > 0), -- 제한 시간(분) @optional
  question_count int CHECK (question_count >= 0), -- 총 문항수 (파생 금지: 실제 문항 테이블 도입 시 재검토)
  created_at timestamptz NOT NULL DEFAULT now(), -- 생성일
  updated_at timestamptz NOT NULL DEFAULT now() -- 수정일
);
CREATE INDEX IF NOT EXISTS idx_exams_course ON exams(course_id);

-- [시험 문제] 시험별 문제 및 선택지
DROP TABLE IF EXISTS exam_questions CASCADE;
CREATE TABLE IF NOT EXISTS exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- 문제 고유 ID
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE, -- 시험 ID
  question_text text NOT NULL, -- 문제 내용
  question_type text NOT NULL CHECK (question_type IN ('single', 'multiple', 'short')), -- 문제 유형
  choices jsonb, -- 객관식 선택지 (단답형은 null)
  correct_answer jsonb NOT NULL, -- 정답
  points int NOT NULL DEFAULT 1 CHECK (points > 0), -- 배점
  order_index int NOT NULL, -- 문제 순서
  created_at timestamptz NOT NULL DEFAULT now(), -- 생성일
  updated_at timestamptz NOT NULL DEFAULT now() -- 수정일
);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_order ON exam_questions(exam_id, order_index);

-- [결제] 수강신청 결제 내역
DROP TABLE IF EXISTS payments CASCADE;
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- 결제 고유 ID
  enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE, -- 수강신청 ID
  provider text NOT NULL, -- 결제 PG/수단
  provider_tx_id text NOT NULL, -- PG 거래 ID
  amount_cents int NOT NULL CHECK (amount_cents >= 0), -- 결제 금액(원)
  currency_code text NOT NULL DEFAULT 'KRW' CHECK (currency_code ~ '^[A-Z]{3}$'), -- 통화
  tax_amount_cents int NOT NULL DEFAULT 0 CHECK (tax_amount_cents >= 0), -- 세금액(원)
  tax_rate_percent numeric(5,2) CHECK (tax_rate_percent >= 0 AND tax_rate_percent <= 100), -- 세율(%)
  tax_country_code char(2) CHECK (tax_country_code ~ '^[A-Z]{2}$'), -- 과세국가
  status text NOT NULL CHECK (status IN ('PAID','FAILED','REFUNDED')), -- 결제 상태
  paid_at timestamptz, -- 결제 완료일
  raw jsonb, -- 원본 응답
  created_at timestamptz NOT NULL DEFAULT now(), -- 생성일
  UNIQUE (provider, provider_tx_id)
);

-- [시험 시도] 수강생의 시험 응시 기록 (n회 시도 가능)
DROP TABLE IF EXISTS exam_attempts CASCADE;
CREATE TABLE IF NOT EXISTS exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- 시험 시도 고유 ID
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE, -- 시험 ID
  enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE, -- 수강신청 ID
  started_at timestamptz NOT NULL DEFAULT now(), -- 시험 시작 시각
  submitted_at timestamptz, -- 제출 시각
  score int CHECK (score BETWEEN 0 AND 100), -- 점수
  passed boolean, -- 합격 여부
  answers jsonb, -- 응답(답안) 데이터
  created_at timestamptz NOT NULL DEFAULT now() -- 생성일
);
CREATE INDEX IF NOT EXISTS idx_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_attempts_enroll ON exam_attempts(enrollment_id);

-- [수료증] 각 수강신청별 1개 발급, 시험 합격 시 생성
DROP TABLE IF EXISTS certificates CASCADE;
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- 수료증 고유 ID
  enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE, -- 수강신청 ID
  exam_attempt_id uuid NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE, -- 합격 시험 시도 ID
  issued_at timestamptz NOT NULL DEFAULT now(), -- 발급일
  pdf_path text NOT NULL, -- PDF 파일 경로
  serial_no text NOT NULL, -- 일련번호
  UNIQUE (serial_no),
  UNIQUE (enrollment_id)
);
CREATE INDEX IF NOT EXISTS idx_cert_enroll ON certificates(enrollment_id);

-- [코스 리뷰] 수강생의 강의 평가 및 코멘트
DROP TABLE IF EXISTS course_reviews CASCADE;
CREATE TABLE IF NOT EXISTS course_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- 리뷰 고유 ID
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE, -- 코스 ID
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- 작성자(수강생) ID
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5), -- 평점(1~5)
  comment text, -- 코멘트
  created_at timestamptz NOT NULL DEFAULT now(), -- 작성일
  UNIQUE(course_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_course ON course_reviews(course_id);

-- [코스 평점 뷰] 코스별 평균 평점/리뷰수 집계 뷰
CREATE OR REPLACE VIEW v_course_ratings AS
SELECT course_id,
       avg(rating)::numeric(3,2) AS avg_rating,
       count(*) AS review_count
FROM course_reviews
GROUP BY course_id;

-- [Q&A 질문] 강의별 질문(수강생)
DROP TABLE IF EXISTS course_questions CASCADE;
CREATE TABLE IF NOT EXISTS course_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- 질문 고유 ID
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE, -- 코스 ID
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- 작성자(수강생) ID
  title text NOT NULL, -- 질문 제목
  body text NOT NULL, -- 질문 본문
  is_resolved boolean NOT NULL DEFAULT false, -- 해결 여부
  created_at timestamptz NOT NULL DEFAULT now() -- 작성일
);
CREATE INDEX IF NOT EXISTS idx_questions_course ON course_questions(course_id);

-- [Q&A 답변] 질문에 대한 답변(강사/수강생)
DROP TABLE IF EXISTS course_answers CASCADE;
CREATE TABLE IF NOT EXISTS course_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- 답변 고유 ID
  question_id uuid NOT NULL REFERENCES course_questions(id) ON DELETE CASCADE, -- 질문 ID
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- 작성자 ID
  body text NOT NULL, -- 답변 본문
  is_instructor_answer boolean NOT NULL DEFAULT false, -- 강사 답변 여부
  created_at timestamptz NOT NULL DEFAULT now() -- 작성일
);
CREATE INDEX IF NOT EXISTS idx_answers_question ON course_answers(question_id);

-- [위시리스트] 즐겨찾기/찜한 강의
DROP TABLE IF EXISTS wishlists CASCADE;
CREATE TABLE IF NOT EXISTS wishlists (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- 사용자 ID
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE, -- 코스 ID
  created_at timestamptz NOT NULL DEFAULT now(), -- 추가일
  PRIMARY KEY(user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlists(user_id);

-- [쿠폰] 할인 코드 및 정책
DROP TABLE IF EXISTS coupons CASCADE;
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- 쿠폰 고유 ID
  code text NOT NULL UNIQUE, -- 쿠폰 코드
  discount_type coupon_discount_type NOT NULL, -- 할인 유형(enum)
  percent numeric(5,2) CHECK (percent >= 0 AND percent <= 100), -- 퍼센트 할인율
  amount_cents int CHECK (amount_cents >= 0), -- 정액 할인액(원)
  starts_at timestamptz, -- 시작일
  ends_at timestamptz, -- 종료일
  max_redemptions int, -- 전체 사용 한도
  per_user_limit int DEFAULT 1, -- 1인당 사용 한도
  is_active boolean NOT NULL DEFAULT true, -- 활성화 여부
  created_at timestamptz NOT NULL DEFAULT now() -- 생성일
);

-- [쿠폰 사용 내역] 쿠폰별/사용자별 사용 기록
DROP TABLE IF EXISTS coupon_redemptions CASCADE;
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- 사용 내역 고유 ID
  coupon_id uuid NOT NULL REFERENCES coupons(id) ON DELETE CASCADE, -- 쿠폰 ID
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- 사용자 ID
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE SET NULL, -- 수강신청 ID(옵션)
  redeemed_at timestamptz NOT NULL DEFAULT now() -- 사용일
);
CREATE INDEX IF NOT EXISTS idx_redemptions_coupon ON coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON coupon_redemptions(user_id);

-- [코스-카테고리 매핑] N:M 관계
DROP TABLE IF EXISTS course_categories CASCADE;
CREATE TABLE IF NOT EXISTS course_categories (
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE, -- 코스 ID
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE, -- 카테고리 ID
  PRIMARY KEY (course_id, category_id)
);

-- [코스 난이도 enum] beginner/intermediate/advanced
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname='course_levels') THEN
    CREATE TYPE course_levels AS ENUM ('beginner','intermediate','advanced');
  END IF;
END $$;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS level course_levels;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS language_code text CHECK (language_code ~ '^[a-z]{2}(-[A-Z]{2})?$');

-- [코스 메트릭 뷰] 강의별 학생수/평점/리뷰수 등 집계
CREATE OR REPLACE VIEW v_course_metrics AS
WITH s AS (
  SELECT course_id, count(*) AS lesson_count, coalesce(sum(duration_seconds),0) AS total_duration_seconds
  FROM lessons GROUP BY course_id
),
E AS (
  SELECT course_id, count(*) FILTER (WHERE status='ENROLLED') AS student_count
  FROM enrollments GROUP BY course_id
),
R AS (
  SELECT course_id, avg(rating)::numeric(3,2) AS avg_rating, count(*) AS review_count
  FROM course_reviews GROUP BY course_id
)
SELECT c.id AS course_id,
       coalesce(E.student_count,0) AS student_count,
       coalesce(s.lesson_count,0) AS lesson_count,
       coalesce(s.total_duration_seconds,0) AS total_duration_seconds,
       coalesce(R.avg_rating,0)::numeric(3,2) AS avg_rating,
       coalesce(R.review_count,0) AS review_count
FROM courses c
LEFT JOIN s ON s.course_id = c.id
LEFT JOIN E ON E.course_id = c.id
LEFT JOIN R ON R.course_id = c.id;

-- =============================================
-- [공지사항] (기존 in-memory noticeRepo 대체)
-- 규칙:
--  * pinned = true 인 레코드는 목록에서 상단 고정
--  * published=false 는 관리자 초안(클라이언트 기본 쿼리는 published=true 만)
--  * 정렬: pinned DESC, created_at DESC
-- =============================================
DROP TABLE IF EXISTS notices CASCADE;
CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- 공지 고유 ID
  title text NOT NULL, -- 제목
  body text, -- 본문 (Markdown 허용)
  pinned boolean NOT NULL DEFAULT false, -- 상단 고정 여부
  published boolean NOT NULL DEFAULT true, -- 공개 여부
  created_at timestamptz NOT NULL DEFAULT now(), -- 생성일
  updated_at timestamptz NOT NULL DEFAULT now() -- 수정일
);
CREATE INDEX IF NOT EXISTS idx_notices_pinned ON notices(pinned) WHERE pinned = true;
CREATE INDEX IF NOT EXISTS idx_notices_created ON notices(created_at DESC);

-- RLS (notices): 공개 공지 목록/상세 조회는 익명 허용, 작성/수정/삭제는 관리자만 (admin role 은 profiles.role='admin')
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- (PostgreSQL은 CREATE POLICY 에 IF NOT EXISTS 미지원 → 사전 DROP 후 재생성)
DROP POLICY IF EXISTS notices_read_public ON notices;
CREATE POLICY notices_read_public ON notices
  FOR SELECT USING (published = true);

-- 관리자 전용 전체 액세스 (초안 포함)
DROP POLICY IF EXISTS notices_admin_all ON notices;
CREATE POLICY notices_admin_all ON notices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  );


-- =============================================
-- [강사 신청] instructor applications (mock -> DB 마이그레이션)
-- 상태(status): PENDING | APPROVED | REJECTED | REVOKED
-- 버킷 매핑:
--   * PENDING  => status = PENDING
--   * DECIDED  => status IN (APPROVED, REJECTED)
--   * REVOKED  => status = REVOKED
-- =============================================
DROP TABLE IF EXISTS instructor_applications CASCADE;
CREATE TABLE IF NOT EXISTS instructor_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- 신청 고유 ID
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE, -- 지원자 사용자 ID
  display_name text NOT NULL, -- 공개 표시명
  bio_md text, -- 자기소개 (Markdown)
  links jsonb, -- 외부 링크 리스트 [{label,url}]
  status text NOT NULL CHECK (status IN ('PENDING','APPROVED','REJECTED','REVOKED')) DEFAULT 'PENDING', -- 상태
  created_at timestamptz NOT NULL DEFAULT now(), -- 신청일
  decided_at timestamptz, -- 승인/거절 처리일
  rejection_reason text, -- 거절 사유
  revoked_at timestamptz, -- 승인 후 철회 처리일
  revoke_reason text -- 철회 사유
);
CREATE INDEX IF NOT EXISTS idx_instr_apps_user ON instructor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_instr_apps_status ON instructor_applications(status);

-- =============================================
-- [지원 티켓] 1:1 문의 (사용자와 관리자 간 대화)
-- Scope:
--   * support_tickets: 티켓 메타 (제목/상태/최종 업데이트)
--   * support_ticket_messages: 메시지 스레드 (작성자/본문/가시성)
-- Rationale:
--   * FAQ로 해결되지 않는 개별 문의 처리
--   * 추후 첨부파일/분류/우선순위 확장 가능 (필드 예약 주석)
-- 규칙 요약:
--   * 일반 사용자: 자신이 만든 티켓 + 그 메시지 읽기/작성
--   * 관리자: 모든 티켓/메시지 읽기/작성/상태 변경
--   * 상태(status): OPEN, ANSWERED(관리자 답변 후), CLOSED(종결)
-- 파생 필드 계산 금지 (예: message_count) → 뷰 혹은 클라이언트 집계
-- =============================================
DROP TABLE IF EXISTS support_ticket_messages CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- 티켓 고유 ID
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- 생성 사용자 ID
  title text NOT NULL, -- 제목
  status text NOT NULL CHECK (status IN ('OPEN','ANSWERED','CLOSED')) DEFAULT 'OPEN', -- 상태
  category text, -- 분류(선택; ex: billing, technical, general)
  last_message_at timestamptz NOT NULL DEFAULT now(), -- 마지막 메시지 시각 (트리거로 업데이트 고려)
  created_at timestamptz NOT NULL DEFAULT now(), -- 생성일
  updated_at timestamptz NOT NULL DEFAULT now() -- 수정일
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- 메시지 고유 ID
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE, -- 티켓 ID
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- 작성자 ID (사용자/관리자)
  body text NOT NULL, -- 메시지 본문 (Markdown 허용 가능)
  is_private boolean NOT NULL DEFAULT false, -- 내부 메모(관리자만) 여부
  created_at timestamptz NOT NULL DEFAULT now(), -- 작성일
  updated_at timestamptz NOT NULL DEFAULT now() -- 수정일(편집 허용 시)
);
CREATE INDEX IF NOT EXISTS idx_support_msgs_ticket ON support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_msgs_author ON support_ticket_messages(author_id);

-- 뷰 예시(향후): v_support_ticket_counts (상태별 카운트) 필요 시 추가

-- [RLS 정책] exam_questions 테이블
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;

-- 관리자만 모든 작업 가능
CREATE POLICY "Admins can manage exam questions" ON exam_questions
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- 학생은 시험 응시 중에만 문제 조회 가능 (정답 제외)
CREATE POLICY "Students can view questions during exam" ON exam_questions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM enrollments e
        JOIN exams ex ON ex.course_id = e.course_id
        WHERE ex.id = exam_questions.exam_id
        AND e.user_id = auth.uid()
        AND e.status = 'ENROLLED'
    )
);


-- Idempotency keys table
create table if not exists idempotency_keys (
  scope text not null,
  key_hash text not null,
  first_result jsonb,
  created_at timestamptz not null default now(),
  primary key(scope, key_hash)
);
create index if not exists idx_idem_scope on idempotency_keys(scope);

-- =============================
-- 기본 관리자 계정 생성
-- =============================
-- 주의: 실제 사용자 가입 후 이 데이터를 업데이트해야 함
-- auth.users 테이블에 해당 이메일로 가입된 사용자가 있어야 함
INSERT INTO public.users (id, email, name, role, created_at, updated_at) 
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'goldtagworks@gmail.com', 'GoldTag Admin', 'admin', now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'kr.lms.labs@gmail.com', 'LMS Labs Admin', 'admin', now(), now())
ON CONFLICT (email) DO UPDATE SET 
  role = 'admin',
  updated_at = now();
