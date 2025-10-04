import type { UpdateExamRequest } from '@main/types/examManagement';

import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import { useNavigate, useParams } from 'react-router-dom';
import { Stack, Title, Card, TextInput, Textarea, NumberInput, Button, Group, Alert, Select, Loader, Text } from '@mantine/core';
import { ArrowLeft, Save } from 'lucide-react';
import PageContainer from '@main/components/layout/PageContainer';
import { useExamWithQuestions, useUpdateExam } from '@main/hooks/useExamManagement';
import { useCoursesForExam } from '@main/hooks/useCourses';

export default function AdminExamEditPage() {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { data: exam, isLoading, error } = useExamWithQuestions(examId || '');
    const { data: courses } = useCoursesForExam();
    const updateExamMutation = useUpdateExam();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 코스 목록을 Select 형식으로 변환
    const courseOptions =
        courses?.map((course) => ({
            value: course.id,
            label: course.title
        })) || [];

    const form = useForm<UpdateExamRequest>({
        initialValues: {
            id: examId || '',
            courseId: '',
            title: '',
            descriptionMd: '',
            passScore: 70,
            timeLimitMinutes: 30
        },
        validate: {
            title: (value) => (!value ? '시험 제목을 입력해주세요' : null),
            passScore: (value) => {
                if (value && (value < 0 || value > 100)) return '합격 점수는 0-100 사이여야 합니다';

                return null;
            },
            timeLimitMinutes: (value) => {
                if (value && value <= 0) return '제한 시간은 양수여야 합니다';

                return null;
            }
        }
    });

    // 시험 데이터 로드 시 폼 초기화
    useEffect(() => {
        if (exam) {
            form.setValues({
                id: exam.id,
                courseId: exam.courseId,
                title: exam.title,
                descriptionMd: exam.descriptionMd || '',
                passScore: exam.passScore,
                timeLimitMinutes: exam.timeLimitMinutes || undefined
            });
        }
    }, [exam]);

    const handleSubmit = async (values: UpdateExamRequest) => {
        setIsSubmitting(true);
        try {
            await updateExamMutation.mutateAsync(values);
            navigate('/admin/exams');
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('시험 수정 오류:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <PageContainer roleMain py={48}>
                <Group>
                    <Loader size="sm" />
                    <Text>시험 정보를 불러오는 중...</Text>
                </Group>
            </PageContainer>
        );
    }

    if (error || !exam) {
        return (
            <PageContainer roleMain py={48}>
                <Alert color="red" title="오류가 발생했습니다">
                    시험을 찾을 수 없습니다.
                </Alert>
            </PageContainer>
        );
    }

    return (
        <PageContainer roleMain py={48}>
            <Stack gap="xl">
                {/* 헤더 */}
                <Group>
                    <Button leftSection={<ArrowLeft size={16} />} variant="subtle" onClick={() => navigate('/admin/exams')}>
                        시험 목록으로
                    </Button>
                    <Title order={1}>시험 수정</Title>
                </Group>

                <Card withBorder p={{ base: 'lg', md: 'xl' }} radius="md" shadow="md">
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Stack gap="lg">
                            <Select disabled data={courseOptions} description="코스는 변경할 수 없습니다" label="대상 코스" value={exam.courseId} />

                            {/* 시험 제목 */}
                            <TextInput required label="시험 제목" placeholder="예: 프로그래밍 기초 이해도 평가" {...form.getInputProps('title')} />

                            {/* 시험 설명 */}
                            <Textarea label="시험 설명" placeholder="시험에 대한 간단한 설명을 입력하세요 (Markdown 지원)" rows={4} {...form.getInputProps('descriptionMd')} />

                            {/* 설정 */}
                            <Group grow>
                                <NumberInput required label="합격 점수" max={100} min={0} placeholder="70" suffix="점" {...form.getInputProps('passScore')} />
                                <NumberInput description="비워두면 무제한" label="제한 시간" min={1} placeholder="30" suffix="분" {...form.getInputProps('timeLimitMinutes')} />
                            </Group>

                            {/* 문제 수 표시 */}
                            <Alert color="blue" title="현재 시험 정보">
                                <Stack gap="xs">
                                    <div>• 등록된 문제 수: {exam.questionCount}문제</div>
                                    <div>• 수정사항은 즉시 반영됩니다.</div>
                                    <div>• 문제 관리는 별도 페이지에서 진행하세요.</div>
                                </Stack>
                            </Alert>

                            {/* 제출 버튼 */}
                            <Group justify="space-between">
                                <Button variant="outline" onClick={() => navigate(`/admin/exams/${exam.id}/questions`)}>
                                    문제 관리
                                </Button>
                                <Group>
                                    <Button variant="outline" onClick={() => navigate('/admin/exams')}>
                                        취소
                                    </Button>
                                    <Button leftSection={<Save size={16} />} loading={isSubmitting} type="submit">
                                        수정 완료
                                    </Button>
                                </Group>
                            </Group>
                        </Stack>
                    </form>
                </Card>
            </Stack>
        </PageContainer>
    );
}
