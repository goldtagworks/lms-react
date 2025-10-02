-- 시험 관리 시스템 테스트 데이터
-- Phase C 테스팅용 샘플 데이터 생성

-- 테스트 코스 생성 (이미 존재하지 않는 경우)
INSERT INTO courses (id, title, description_md, instructor_id, category_id, pricing_mode, list_price_cents, currency, tax_included, is_published, published_at)
VALUES 
    ('test-course-1', '프로그래밍 기초', '프로그래밍의 기본 개념을 배우는 과정입니다.', 
     (SELECT id FROM users WHERE role = 'instructor' LIMIT 1), 
     (SELECT id FROM categories LIMIT 1), 
     'one_time', 50000, 'KRW', true, true, now()),
    ('test-course-2', 'React 심화', 'React의 고급 기능을 다루는 과정입니다.', 
     (SELECT id FROM users WHERE role = 'instructor' LIMIT 1), 
     (SELECT id FROM categories LIMIT 1), 
     'one_time', 80000, 'KRW', true, true, now()),
    ('test-course-3', 'Node.js 백엔드', 'Node.js를 사용한 백엔드 개발 과정입니다.', 
     (SELECT id FROM users WHERE role = 'instructor' LIMIT 1), 
     (SELECT id FROM categories LIMIT 1), 
     'one_time', 70000, 'KRW', true, true, now())
ON CONFLICT (id) DO NOTHING;

-- 테스트 시험 생성
INSERT INTO exams (id, course_id, title, description_md, pass_score, time_limit_minutes, question_count)
VALUES 
    ('test-exam-1', 'test-course-1', '프로그래밍 기초 이해도 평가', 
     '프로그래밍의 기본 개념에 대한 이해도를 평가하는 시험입니다.', 
     70, 30, 0),
    ('test-exam-2', 'test-course-2', 'React 컴포넌트 실습 평가', 
     'React 컴포넌트 작성 능력을 평가합니다.', 
     80, 45, 0),
    ('test-exam-3', 'test-course-3', 'Node.js API 개발 평가', 
     'Node.js를 사용한 RESTful API 개발 능력을 평가합니다.', 
     75, 60, 0)
ON CONFLICT (id) DO NOTHING;

-- 테스트 문제 생성
INSERT INTO exam_questions (id, exam_id, question_text, question_type, choices, correct_answer, points, order_index)
VALUES 
    -- 프로그래밍 기초 시험 문제들
    ('q1-basic-1', 'test-exam-1', '다음 중 변수를 선언하는 올바른 방법은?', 'single', 
     '["let name = ''홍길동'';", "var 123name = ''홍길동'';", "const = ''홍길동'';", "variable name = ''홍길동'';"]',
     '"1"', 1, 0),
    ('q1-basic-2', 'test-exam-1', '함수의 정의에 대한 설명으로 옳은 것을 모두 선택하세요.', 'multiple',
     '["함수는 재사용 가능한 코드 블록이다", "함수는 매개변수를 받을 수 있다", "함수는 값을 반환할 수 있다", "함수는 한 번만 호출할 수 있다"]',
     '["1", "2", "3"]', 2, 1),
    ('q1-basic-3', 'test-exam-1', 'JavaScript에서 배열의 첫 번째 인덱스는 몇 번인가요?', 'short',
     null, '"0"', 1, 2),
    
    -- React 시험 문제들
    ('q2-react-1', 'test-exam-2', 'React에서 상태를 관리하는 Hook은?', 'single',
     '["useState", "useEffect", "useContext", "useCallback"]',
     '"1"', 1, 0),
    ('q2-react-2', 'test-exam-2', 'JSX에 대한 설명으로 옳은 것은?', 'multiple',
     '["JavaScript XML의 줄임말이다", "HTML과 유사한 문법을 사용한다", "React에서만 사용할 수 있다", "브라우저가 직접 이해할 수 있다"]',
     '["1", "2"]', 2, 1),
    
    -- Node.js 시험 문제들  
    ('q3-node-1', 'test-exam-3', 'Express.js에서 GET 요청을 처리하는 메서드는?', 'single',
     '["app.get()", "app.post()", "app.put()", "app.delete()"]',
     '"1"', 1, 0),
    ('q3-node-2', 'test-exam-3', 'REST API의 HTTP 메서드 중 데이터를 생성할 때 사용하는 것은?', 'short',
     null, '"POST"', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- 시험별 문제 수 업데이트
UPDATE exams SET question_count = (
    SELECT COUNT(*) FROM exam_questions WHERE exam_id = exams.id
);

-- 테스트 사용자 생성 (관리자/강사/학생)
INSERT INTO users (id, email, display_name, role)
VALUES 
    ('admin-test', 'admin@test.com', '테스트 관리자', 'admin'),
    ('instructor-test', 'instructor@test.com', '테스트 강사', 'instructor'),
    ('student-test', 'student@test.com', '테스트 학생', 'student')
ON CONFLICT (id) DO NOTHING;

-- 완료 메시지
SELECT 'Phase C 테스트 데이터 생성 완료!' as message;