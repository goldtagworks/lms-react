/**
 * 시험 정보
 */
export interface Exam {
    /** 시험 고유 ID */
    id: string;
    /** 코스 ID */
    course_id: string;
    /** 시험명 */
    title: string;
    /** 합격 기준 점수(%) */
    pass_score: number;
    /** 생성일 */
    created_at: string;
    /** 수정일 */
    updated_at: string;
}

/**
 * 시험 문제
 */
export interface ExamQuestion {
    /** 문제 고유 ID */
    id: string;
    /** 시험 ID */
    exam_id: string;
    /** 문제 유형(single|multiple|short) */
    type: string;
    /** 문제 본문 */
    stem: string;
    /** 선택지(jsonb, 옵션) */
    choices?: any;
    /** 정답(jsonb) */
    answer: any;
    /** 생성일 */
    created_at: string;
    /** 수정일 */
    updated_at: string;
}

/**
 * 시험 시도(응시)
 */
export interface ExamAttempt {
    /** 시도 고유 ID */
    id: string;
    /** 시험 ID */
    exam_id: string;
    /** 수강신청 ID */
    enrollment_id: string;
    /** 시작 시각 */
    started_at: string;
    /** 제출 시각(옵션) */
    submitted_at?: string;
    /** 점수(옵션) */
    score?: number;
    /** 합격 여부(옵션) */
    passed?: boolean;
    /** 답안(jsonb, 옵션) */
    answers?: any;
    /** 생성일 */
    created_at: string;
}

/**
 * 수료증
 */
export interface Certificate {
    /** 수료증 고유 ID */
    id: string;
    /** 수강신청 ID */
    enrollment_id: string;
    /** 합격 시험 시도 ID */
    exam_attempt_id: string;
    /** 발급일 */
    issued_at: string;
    /** PDF 파일 경로 */
    pdf_path: string;
    /** 일련번호 */
    serial_no: string;
}
