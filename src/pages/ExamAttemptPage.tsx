import { useState, useEffect } from 'react';
import { Button, Card, Stack, Text, Title, Alert, Progress, Badge, Group, Radio, Checkbox, Textarea, Box } from '@mantine/core';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Send, Save } from 'lucide-react';
import PageContainer from '@main/components/layout/PageContainer';
import { useAuth } from '@main/lib/auth';
import useExam from '@main/hooks/useExam';
import useExamQuestions from '@main/hooks/useExamQuestions';
import { submitExamForGrading } from '@main/services/examService';

// 30분 타이머 (1800초)
const EXAM_DURATION = 30 * 60;

export default function ExamAttemptPage() {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: exam, isLoading: examLoading } = useExam(examId);
    const { data: questions, isLoading: questionsLoading } = useExamQuestions(examId);

    // 타이머 관리
    useEffect(() => {
        if (timeLeft <= 0) {
            handleSubmit(true); // 자동 제출

            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;

        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerChange = (questionId: string, answer: any) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleSubmit = async (_isAutoSubmit = false) => {
        if (isSubmitting) return;

        if (!user || !examId) {
            // TODO: 에러 처리
            return;
        }

        setIsSubmitting(true);

        try {
            // TODO: 실제 enrollmentId 가져오기 (현재는 임시값)
            const enrollmentId = 'temp-enrollment-id';

            const result = await submitExamForGrading({
                examId,
                answers,
                userId: user.id,
                enrollmentId
            });

            // 결과 페이지로 이동하면서 결과 데이터 전달
            navigate(`/exam/${examId}/result`, {
                state: { result }
            });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('제출 오류:', error);
            // TODO: 에러 처리 UI
        } finally {
            setIsSubmitting(false);
        }
    };

    const answeredCount = Object.keys(answers).length;
    const totalQuestions = questions?.length || 0;
    const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

    if (examLoading || questionsLoading) {
        return (
            <PageContainer roleMain py={48}>
                <Text>시험을 불러오는 중...</Text>
            </PageContainer>
        );
    }

    if (!exam) {
        return (
            <PageContainer roleMain py={48}>
                <Alert color="red" title="시험을 찾을 수 없습니다">
                    존재하지 않는 시험이거나 접근 권한이 없습니다.
                </Alert>
            </PageContainer>
        );
    }

    const timeWarning = timeLeft <= 300; // 5분 이하 경고

    return (
        <PageContainer roleMain py={24} size="md">
            {/* 헤더 */}
            <Card withBorder mb="md" p={{ base: 'lg', md: 'xl' }}>
                <Group align="center" justify="space-between">
                    <div>
                        <Title order={2}>{exam.title}</Title>
                        <Text c="dimmed">합격 기준: {exam.pass_score}점</Text>
                    </div>
                    <Group>
                        <Badge color={timeWarning ? 'red' : 'blue'} leftSection={<Clock size={14} />} size="lg">
                            {formatTime(timeLeft)}
                        </Badge>
                    </Group>
                </Group>
            </Card>

            {/* 진행 상황 */}
            <Card withBorder mb="md" p={{ base: 'lg', md: 'xl' }}>
                <Group justify="space-between" mb="xs">
                    <Text fw={500}>진행 상황</Text>
                    <Text c="dimmed">
                        {answeredCount} / {totalQuestions}
                    </Text>
                </Group>
                <Progress value={progressPercent} />
            </Card>

            {/* 문제 목록 */}
            <Stack gap="lg">
                {questions?.map((question, index) => (
                    <QuestionCard key={question.id} answer={answers[question.id]} question={question} questionNumber={index + 1} onAnswerChange={(answer) => handleAnswerChange(question.id, answer)} />
                ))}
            </Stack>

            {/* 제출 버튼 */}
            <Card withBorder mt="lg" p={{ base: 'lg', md: 'xl' }}>
                <Group justify="space-between">
                    <Text>
                        답변한 문제: <strong>{answeredCount}</strong> / {totalQuestions}
                    </Text>
                    <Group>
                        <Button
                            leftSection={<Save size={16} />}
                            variant="outline"
                            onClick={() => {
                                // 임시 저장 로직 (localStorage)
                                localStorage.setItem(`exam_${examId}_answers`, JSON.stringify(answers));
                            }}
                        >
                            임시 저장
                        </Button>
                        <Button leftSection={<Send size={16} />} loading={isSubmitting} onClick={() => handleSubmit()}>
                            제출하기
                        </Button>
                    </Group>
                </Group>
                {answeredCount < totalQuestions && (
                    <Alert color="yellow" mt="md">
                        미답변 문제가 {totalQuestions - answeredCount}개 있습니다.
                    </Alert>
                )}
            </Card>
        </PageContainer>
    );
}

// 문제 카드 컴포넌트
interface QuestionCardProps {
    question: any;
    questionNumber: number;
    answer: any;
    onAnswerChange: (answer: any) => void;
}

function QuestionCard({ question, questionNumber, answer, onAnswerChange }: QuestionCardProps) {
    const renderChoices = () => {
        if (question.type === 'single') {
            const choices = question.choices || [];

            return (
                <Radio.Group value={answer || ''} onChange={onAnswerChange}>
                    <Stack gap="xs">
                        {choices.map((choice: any, idx: number) => (
                            <Radio key={idx} label={choice.text || choice} value={choice.value || choice} />
                        ))}
                    </Stack>
                </Radio.Group>
            );
        }

        if (question.type === 'multiple') {
            const choices = question.choices || [];
            const selectedValues = Array.isArray(answer) ? answer : [];

            return (
                <Checkbox.Group value={selectedValues} onChange={onAnswerChange}>
                    <Stack gap="xs">
                        {choices.map((choice: any, idx: number) => (
                            <Checkbox key={idx} label={choice.text || choice} value={choice.value || choice} />
                        ))}
                    </Stack>
                </Checkbox.Group>
            );
        }

        if (question.type === 'short') {
            return <Textarea placeholder="답안을 입력하세요" rows={3} value={answer || ''} onChange={(e) => onAnswerChange(e.target.value)} />;
        }

        return null;
    };

    return (
        <Card withBorder p={{ base: 'lg', md: 'xl' }}>
            <Stack>
                <Group>
                    <Badge variant="light">문제 {questionNumber}</Badge>
                    <Badge color={answer ? 'green' : 'gray'}>{answer ? '답변 완료' : '미답변'}</Badge>
                </Group>

                <Box>
                    <Text fw={500} mb="md">
                        {question.stem}
                    </Text>
                    {renderChoices()}
                </Box>
            </Stack>
        </Card>
    );
}
