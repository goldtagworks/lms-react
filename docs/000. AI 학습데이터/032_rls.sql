-- =============================
-- RLS policies for LMS v3.4 (single domain; roles: admin|instructor|learner)
-- Includes: sections, reviews, Q&A, wishlist, coupons, categories (subscriptions DEPRECATED: 정기 구독 비사용)
-- Ownership: instructors can CUD only on their own courses/lessons/sections
-- =============================

-- Enable RLS on exposed tables
alter table if exists profiles                enable row level security;
alter table if exists courses                 enable row level security;
-- (v3.5) course_sections 제거: 통합 커리큘럼(is_section). RLS enable 불필요.
alter table if exists lessons                 enable row level security;
alter table if exists enrollments             enable row level security;
alter table if exists payments                enable row level security;
alter table if exists lesson_progress         enable row level security;
alter table if exists exams                   enable row level security;
alter table if exists exam_questions          enable row level security;
alter table if exists exam_attempts           enable row level security;
alter table if exists certificates            enable row level security;
-- DEPRECATED subscription tables (남겨두되 RLS enable 유지: 접근 시도 식별 목적)
alter table if exists course_reviews          enable row level security;
alter table if exists course_questions        enable row level security;
alter table if exists course_answers          enable row level security;
alter table if exists wishlists               enable row level security;
alter table if exists coupons                 enable row level security;
alter table if exists coupon_redemptions      enable row level security;
alter table if exists categories              enable row level security;
alter table if exists course_categories       enable row level security;

-- =============================
-- Helpers (role checks via profiles.role)
-- =============================
create or replace function is_admin()
returns boolean stable language sql as $$
  select exists(
    select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function is_instructor()
returns boolean stable language sql as $$
  select exists(
    select 1 from profiles p where p.user_id = auth.uid() and p.role = 'instructor'
  );
$$;

create or replace function is_staff()
returns boolean stable language sql as $$
  select is_admin() or is_instructor();
$$;

-- Is the current user the owner (instructor) of a given course?
create or replace function is_course_owner(course_id uuid)
returns boolean stable language sql as $$
  select exists(
    select 1 from courses c
    where c.id = course_id and c.instructor_id = auth.uid()
  ) or is_admin();
$$;

-- Is the current user enrolled (ENROLLED) in a given course?
create or replace function is_enrolled_for_course(course_id uuid)
returns boolean stable language sql as $$
  select exists (
    select 1 from enrollments e
    where e.course_id = course_id
      and e.user_id = auth.uid()
      and e.status = 'ENROLLED'
  );
$$;

-- =============================
-- profiles
-- =============================
create policy if not exists prof_select on profiles
for select using (user_id = auth.uid() or is_admin());

create policy if not exists prof_update on profiles
for update using (user_id = auth.uid() or is_admin())
with check (user_id = auth.uid() or is_admin());

-- =============================
-- courses (catalog visible if published; write restricted to owner/admin)
-- =============================
create policy if not exists course_read_public on courses
for select using (published = true and is_active = true or is_staff());

create policy if not exists course_write_owner on courses
for all using (is_course_owner(id)) with check (is_course_owner(id));

-- =============================
-- course_sections RLS 정책 삭제 (통합 모델). DOWNGRADE 시 위 정책 복원.

-- =============================
-- lessons (content visible to enrolled learners; preview public; owner/admin full)
-- =============================
create policy if not exists lessons_read on lessons
for select using (
  is_course_owner(course_id) or is_enrolled_for_course(course_id)
  or exists (
    select 1 from courses c
    where c.id = lessons.course_id and c.published = true and c.is_active = true and lessons.is_preview = true
  )
);

create policy if not exists lessons_write_owner on lessons
for all using (is_course_owner(course_id)) with check (is_course_owner(course_id));

-- =============================
-- enrollments (owner or staff)
-- =============================
create policy if not exists enroll_read_owner on enrollments
for select using (user_id = auth.uid());

create policy if not exists enroll_insert_self on enrollments
for insert with check (user_id = auth.uid());

create policy if not exists enroll_update_owner on enrollments
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy if not exists enroll_staff_all on enrollments
for all using (is_staff()) with check (is_staff());

-- =============================
-- payments (owner read; admin manage)
-- =============================
create policy if not exists pay_read_owner on payments
for select using (
  exists (
    select 1 from enrollments e
    where e.id = payments.enrollment_id and e.user_id = auth.uid()
  )
);

create policy if not exists pay_read_admin on payments
for select using (is_admin());

create policy if not exists pay_write_admin on payments
for all using (is_admin()) with check (is_admin());

-- =============================
-- lesson_progress (owner or staff)
-- =============================
create policy if not exists lp_all_owner on lesson_progress
for all using (
  exists (
    select 1 from enrollments e
    where e.id = lesson_progress.enrollment_id and e.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from enrollments e
    where e.id = lesson_progress.enrollment_id and e.user_id = auth.uid()
  )
);

create policy if not exists lp_all_staff on lesson_progress
for all using (is_staff()) with check (is_staff());

-- =============================
-- exams & exam_questions (owner/admin manage; enrolled can read exams)
-- =============================
create policy if not exists exams_read_enrolled_or_owner on exams
for select using (
  is_course_owner(course_id) or is_enrolled_for_course(course_id)
);

create policy if not exists exams_write_owner on exams
for all using (is_course_owner(course_id)) with check (is_course_owner(course_id));

create policy if not exists eq_read_owner on exam_questions
for select using (
  exists (select 1 from exams e where e.id = exam_questions.exam_id and is_course_owner(e.course_id))
);

create policy if not exists eq_write_owner on exam_questions
for all using (
  exists (select 1 from exams e where e.id = exam_questions.exam_id and is_course_owner(e.course_id))
) with check (
  exists (select 1 from exams e where e.id = exam_questions.exam_id and is_course_owner(e.course_id))
);

-- =============================
-- exam_attempts (owner or staff)
-- =============================
create policy if not exists ea_read_owner on exam_attempts
for select using (
  exists (
    select 1 from enrollments e
    where e.id = exam_attempts.enrollment_id and e.user_id = auth.uid()
  )
);

create policy if not exists ea_read_staff on exam_attempts
for select using (is_staff());

create policy if not exists ea_insert_owner on exam_attempts
for insert with check (
  exists (
    select 1 from enrollments e
    where e.id = exam_attempts.enrollment_id and e.user_id = auth.uid()
  )
);

create policy if not exists ea_update_owner on exam_attempts
for update using (
  exists (
    select 1 from enrollments e
    where e.id = exam_attempts.enrollment_id and e.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from enrollments e
    where e.id = exam_attempts.enrollment_id and e.user_id = auth.uid()
  )
);

create policy if not exists ea_write_staff on exam_attempts
for all using (is_staff()) with check (is_staff());

-- =============================
-- certificates (owner or staff)
-- =============================
create policy if not exists cert_read_owner on certificates
for select using (
  exists (
    select 1 from enrollments e
    where e.id = certificates.enrollment_id and e.user_id = auth.uid()
  )
);

create policy if not exists cert_read_staff on certificates
for select using (is_staff());

create policy if not exists cert_write_staff on certificates
for all using (is_staff()) with check (is_staff());

-- (구독 관련 subscription_plans / plan_features / user_subscriptions / subscription_invoices 정책 제거됨)

-- =============================
-- Reviews / Ratings
-- =============================
-- Read: public; Write: only enrolled owner; Update/Delete: author or admin
create policy if not exists rev_read_all on course_reviews
for select using (true);

create policy if not exists rev_insert_enrolled on course_reviews
for insert with check (
  user_id = auth.uid() and is_enrolled_for_course(course_id)
);

create policy if not exists rev_update_owner on course_reviews
for update using (user_id = auth.uid() or is_admin())
with check (user_id = auth.uid() or is_admin());

create policy if not exists rev_delete_owner on course_reviews
for delete using (user_id = auth.uid() or is_admin());

-- =============================
-- Q&A
-- =============================
-- Questions: public read; create if enrolled; update/delete by author or admin
create policy if not exists q_read_all on course_questions
for select using (true);

create policy if not exists q_insert_enrolled on course_questions
for insert with check (
  user_id = auth.uid() and is_enrolled_for_course(course_id)
);

create policy if not exists q_update_owner on course_questions
for update using (user_id = auth.uid() or is_admin())
with check (user_id = auth.uid() or is_admin());

create policy if not exists q_delete_owner on course_questions
for delete using (user_id = auth.uid() or is_admin());

-- Answers: public read; write by staff or answer author; delete author or admin
create policy if not exists a_read_all on course_answers
for select using (true);

create policy if not exists a_insert_staff on course_answers
for insert with check (
  user_id = auth.uid() and (
    is_staff() or exists(
      select 1 from course_questions q where q.id = course_answers.question_id and q.user_id = auth.uid()
    )
  )
);

create policy if not exists a_update_owner on course_answers
for update using (user_id = auth.uid() or is_admin())
with check (user_id = auth.uid() or is_admin());

create policy if not exists a_delete_owner on course_answers
for delete using (user_id = auth.uid() or is_admin());

-- =============================
-- Wishlist (favorites)
-- =============================
create policy if not exists wl_read_owner on wishlists
for select using (user_id = auth.uid());

create policy if not exists wl_write_owner on wishlists
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =============================
-- Coupons / Redemptions
-- =============================
-- Coupons are managed by admin only; redemption rows readable by admin (service_role typically used at checkout)
create policy if not exists cp_read_admin on coupons
for select using (is_admin());

create policy if not exists cp_write_admin on coupons
for all using (is_admin()) with check (is_admin());

create policy if not exists cr_read_admin on coupon_redemptions
for select using (is_admin());

create policy if not exists cr_write_admin on coupon_redemptions
for all using (is_admin()) with check (is_admin());

-- =============================
-- Categories / Course Categories
-- =============================
create policy if not exists cat_read_all on categories
for select using (true);

create policy if not exists cat_write_admin on categories
for all using (is_admin()) with check (is_admin());

-- Assign categories to courses: admin or course owner
create policy if not exists ccat_read_all on course_categories
for select using (true);

create policy if not exists ccat_write_owner on course_categories
for all using (
  is_admin() or exists(
    select 1 from courses c
    where c.id = course_categories.course_id and c.instructor_id = auth.uid()
  )
) with check (
  is_admin() or exists(
    select 1 from courses c
    where c.id = course_categories.course_id and c.instructor_id = auth.uid()
  )
);