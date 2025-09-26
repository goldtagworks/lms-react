-- =============================
-- LMS schema v3.4 (single domain; roles: admin|instructor|learner)
-- Adds: sections, reviews, Q&A, wishlist, coupons, categories/levels, metrics
-- =============================

-- extensions
create extension if not exists pgcrypto; -- for gen_random_uuid()

-- ----------
-- enums
-- ----------
drop type if exists role_lms cascade;
create type role_lms as enum ('admin','instructor','learner');

create type course_pricing_mode as enum ('free','paid');
-- subscription billing/interval enums 제거
create type enrollment_source as enum ('purchase','admin','free');

-- new enums
do $$ begin
  if not exists(select 1 from pg_type where typname='coupon_discount_type') then
    create type coupon_discount_type as enum ('percent','fixed');
  end if;
end $$;
-- ----------
-- housekeeping: updated_at trigger
-- ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;

-- ----------
-- profiles (user profile + role + author fields)
-- ----------
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role role_lms not null default 'learner',
  full_name text,
  headline text,        -- short tagline under the name
  bio text,             -- long markdown biography
  website_url text,
  social_links jsonb,   -- e.g., {"youtube":"...","twitter":"..."}
  locale text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table profiles
  alter column role type role_lms using role::role_lms;
create trigger if not exists trg_profiles_updated before update on profiles
for each row execute function set_updated_at();

-- ----------
-- tax rules (optional defaults by country)
-- ----------
create table if not exists tax_rules (
  country_code char(2) primary key, -- ISO 3166-1 alpha-2
  tax_rate_percent numeric(5,2) not null check (tax_rate_percent >= 0 and tax_rate_percent <= 100),
  tax_included boolean not null default true,
  created_at timestamptz not null default now()
);

-- ----------
-- courses (pricing + tax/currency + authoring + instructor ownership)
-- ----------
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references auth.users(id) on delete restrict, -- owner instructor
  title text not null,
  summary text,         -- short course summary
  description text,     -- long markdown/html
  slug text unique,
  category text,        -- optional label (legacy)
  tags text[],          -- optional tags
  thumbnail_url text,
  pricing_mode course_pricing_mode not null default 'free',
  -- pricing fields
  list_price_cents int not null default 0 check (list_price_cents >= 0),
  sale_price_cents int check (sale_price_cents >= 0),
  sale_ends_at timestamptz,
  currency_code text not null default 'KRW' check (currency_code ~ '^[A-Z]{3}$'), -- ISO 4217
  -- legacy field (kept): effective price snapshot if needed by app
  price_cents int not null default 0 check (price_cents >= 0),
  -- tax fields
  tax_included boolean not null default true,
  tax_rate_percent numeric(5,2) check (tax_rate_percent >= 0 and tax_rate_percent <= 100),
  tax_country_code char(2) check (tax_country_code ~ '^[A-Z]{2}$'),
  -- learning policy
  progress_required_percent int not null default 60 check (progress_required_percent between 0 and 100),
  is_active boolean not null default true,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- business rules
  check (pricing_mode <> 'paid' or list_price_cents > 0),
  check (sale_price_cents is null or sale_price_cents <= list_price_cents)
);
create index if not exists idx_courses_active on courses(is_active);
create index if not exists idx_courses_published on courses(published) where published = true;
create index if not exists idx_courses_pricing on courses(pricing_mode);
create index if not exists idx_courses_sale_end on courses(sale_ends_at);
create index if not exists idx_courses_currency on courses(currency_code);
create index if not exists idx_courses_instructor on courses(instructor_id);
create trigger if not exists trg_courses_updated before update on courses
for each row execute function set_updated_at();

-- ----------
-- Sections (course curriculum grouping)
-- ----------
create table if not exists course_sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  order_index int not null,
  created_at timestamptz not null default now(),
  unique(course_id, order_index)
);
create index if not exists idx_sections_course on course_sections(course_id);
-- ----------
-- lessons (ordered within a course; richer authoring)
-- ----------
create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  outline jsonb,        -- e.g., [{"h":"Intro","t":60}]
  content_md text,      -- markdown content body
  content_url text,     -- optional hosted video/asset url
  attachments jsonb,    -- e.g., [{"name":"slides.pdf","url":"..."}]
  duration_seconds int not null check (duration_seconds >= 0),
  order_index int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, order_index)
);
-- new columns (idempotent)
alter table lessons add column if not exists section_id uuid references course_sections(id) on delete set null;
alter table lessons add column if not exists is_preview boolean not null default false;
create index if not exists idx_lessons_course on lessons(course_id);
create trigger if not exists trg_lessons_updated before update on lessons
for each row execute function set_updated_at();

-- ----------
-- enrollments (user x course)
-- ----------
create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  status text not null check (status in ('PENDING','ENROLLED','CANCELLED')) default 'PENDING',
  source enrollment_source not null default 'free',
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);
create index if not exists idx_enroll_user on enrollments(user_id);
create index if not exists idx_enroll_course on enrollments(course_id);
create index if not exists idx_enroll_active on enrollments(status) where status = 'ENROLLED';

-- ----------
-- payments (1..n per enrollment) — one-time course payments
-- ----------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments(id) on delete cascade,
  provider text not null,
  provider_tx_id text not null,
  amount_cents int not null check (amount_cents >= 0),
  currency_code text not null default 'KRW' check (currency_code ~ '^[A-Z]{3}$'),
  tax_amount_cents int not null default 0 check (tax_amount_cents >= 0),
  tax_rate_percent numeric(5,2) check (tax_rate_percent >= 0 and tax_rate_percent <= 100),
  tax_country_code char(2) check (tax_country_code ~ '^[A-Z]{2}$'),
  status text not null check (status in ('PAID','FAILED','REFUNDED')),
  paid_at timestamptz,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique (provider, provider_tx_id)
);
create index if not exists idx_pay_enroll on payments(enrollment_id);
create index if not exists idx_pay_status on payments(status);
create index if not exists idx_pay_currency on payments(currency_code);

-- ----------
-- lesson_progress (per enrollment x lesson)
-- ----------
create table if not exists lesson_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  watched_seconds int not null default 0 check (watched_seconds >= 0),
  is_completed boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (enrollment_id, lesson_id)
);
create index if not exists idx_lp_enroll on lesson_progress(enrollment_id);
create index if not exists idx_lp_lesson on lesson_progress(lesson_id);
create trigger if not exists trg_lp_updated before update on lesson_progress
for each row execute function set_updated_at();

-- ----------
-- progress view (percentage per enrollment)
-- ----------
create or replace view enrollment_progress as
select e.id as enrollment_id,
  coalesce(sum(case when lp.is_completed then 1 else 0 end),0)::float
  / nullif(count(l.id),0) * 100 as progress_percent
from enrollments e
join lessons l on l.course_id = e.course_id
left join lesson_progress lp on lp.enrollment_id = e.id and lp.lesson_id = l.id
group by e.id;

-- ----------
-- exams
-- ----------
create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  pass_score int not null default 60 check (pass_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_exams_course on exams(course_id);
create trigger if not exists trg_exams_updated before update on exams
for each row execute function set_updated_at();

-- ----------
-- exam_questions
-- ----------
create table if not exists exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  type text not null check (type in ('single','multiple','short')),
  stem text not null,
  choices jsonb,
  answer jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_eq_exam on exam_questions(exam_id);
create trigger if not exists trg_eq_updated before update on exam_questions
for each row execute function set_updated_at();

-- ----------
-- exam_attempts (n attempts per enrollment)
-- ----------
create table if not exists exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  enrollment_id uuid not null references enrollments(id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score int check (score between 0 and 100),
  passed boolean,
  answers jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_attempts_exam on exam_attempts(exam_id);
create index if not exists idx_attempts_enroll on exam_attempts(enrollment_id);

-- ----------
-- certificates (1 per enrollment)
-- ----------
create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments(id) on delete cascade,
  exam_attempt_id uuid not null references exam_attempts(id) on delete cascade,
  issued_at timestamptz not null default now(),
  pdf_path text not null,
  serial_no text not null,
  unique (serial_no),
  unique (enrollment_id)
);
create index if not exists idx_cert_enroll on certificates(enrollment_id);

-- (구독 도메인 완전 제거: 관련 enum 및 테이블 삭제. 재도입 시 별도 마이그레이션 필요.)

-- ====================================================
-- Reviews / Ratings
-- ====================================================
create table if not exists course_reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(course_id, user_id)
);
create index if not exists idx_reviews_course on course_reviews(course_id);

create or replace view v_course_ratings as
select course_id,
       avg(rating)::numeric(3,2) as avg_rating,
       count(*) as review_count
from course_reviews
group by course_id;

-- ====================================================
-- Q&A
-- ====================================================
create table if not exists course_questions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_questions_course on course_questions(course_id);

create table if not exists course_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references course_questions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  is_instructor_answer boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_answers_question on course_answers(question_id);

-- ====================================================
-- Wishlist (favorites)
-- ====================================================
create table if not exists wishlists (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, course_id)
);
create index if not exists idx_wishlist_user on wishlists(user_id);

-- ====================================================
-- Coupons / Redemptions
-- ====================================================
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type coupon_discount_type not null,
  percent numeric(5,2) check (percent >= 0 and percent <= 100),
  amount_cents int check (amount_cents >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  max_redemptions int,
  per_user_limit int default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  enrollment_id uuid references enrollments(id) on delete set null,
  redeemed_at timestamptz not null default now()
);
create index if not exists idx_redemptions_coupon on coupon_redemptions(coupon_id);
create index if not exists idx_redemptions_user on coupon_redemptions(user_id);

-- ====================================================
-- Categories / Course Levels / Language
-- ====================================================
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null
);
create table if not exists course_categories (
  course_id uuid not null references courses(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (course_id, category_id)
);

-- level enum (idempotent)
do $$ begin
  if not exists(select 1 from pg_type where typname='course_levels') then
    create type course_levels as enum ('beginner','intermediate','advanced');
  end if;
end $$;
alter table courses add column if not exists level course_levels;
alter table courses add column if not exists language_code text check (language_code ~ '^[a-z]{2}(-[A-Z]{2})?$');

-- ====================================================
-- Metrics View (for cards/lists)
-- ====================================================
create or replace view v_course_metrics as
with s as (
  select course_id, count(*) as lesson_count, coalesce(sum(duration_seconds),0) as total_duration_seconds
  from lessons group by course_id
),
E as (
  select course_id, count(*) filter (where status='ENROLLED') as student_count
  from enrollments group by course_id
),
R as (
  select course_id, avg(rating)::numeric(3,2) as avg_rating, count(*) as review_count
  from course_reviews group by course_id
)
select c.id as course_id,
       coalesce(E.student_count,0) as student_count,
       coalesce(s.lesson_count,0) as lesson_count,
       coalesce(s.total_duration_seconds,0) as total_duration_seconds,
       coalesce(R.avg_rating,0)::numeric(3,2) as avg_rating,
       coalesce(R.review_count,0) as review_count
from courses c
left join s on s.course_id = c.id
left join E on E.course_id = c.id
left join R on R.course_id = c.id;
