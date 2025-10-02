export interface ExamQuestion {
    id: string;
    examId: string;
    questionText: string;
    questionType: 'single' | 'multiple' | 'short';
    choices?: string[]; // 객관식 선택지 (단답형은 null)
    correctAnswer: string | string[]; // 타입에 따라 다름
    points: number;
    orderIndex: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateExamQuestionRequest {
    examId: string;
    questionText: string;
    questionType: 'single' | 'multiple' | 'short';
    choices?: string[];
    correctAnswer: string | string[];
    points: number;
    orderIndex: number;
}

export interface UpdateExamQuestionRequest extends Partial<CreateExamQuestionRequest> {
    id: string;
}

export interface ExamWithQuestions {
    id: string;
    courseId: string;
    title: string;
    descriptionMd?: string;
    passScore: number;
    timeLimitMinutes?: number;
    questionCount: number;
    createdAt: string;
    updatedAt: string;
    questions: ExamQuestion[];
    course: {
        id: string;
        title: string;
    };
}

export interface CreateExamRequest {
    courseId: string;
    title: string;
    descriptionMd?: string;
    passScore: number;
    timeLimitMinutes?: number;
}

export interface UpdateExamRequest extends Partial<CreateExamRequest> {
    id: string;
}
