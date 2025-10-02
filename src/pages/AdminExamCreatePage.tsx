import type { CreateExamRequest } from '@main/types/examManagement';

import { useState } from 'react';
import { Stack, Title, Card, TextInput, Textarea, NumberInput, Button, Group, Alert, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import PageContainer from '@main/components/layout/PageContainer';
import { useCreateExam } from '@main/hooks/useExamManagement';
import { useCoursesForExam } from '@main/hooks/useCourses';

export default function AdminExamCreatePage() {
    const navigate = useNavigate();
    const createExamMutation = useCreateExam();
    const { data: courses, isLoading: coursesLoading, error: coursesError } = useCoursesForExam();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 코스 목록을 Select 형식으로 변환
    // 코스 목록을 Select 형식으로 변환
    const courseOptions =
        courses?.map((course) => ({
            value: course.id,
            label: course.title
        })) || [];

    const form = useForm<CreateExamRequest>({
        initialValues: {
            courseId: '',
            title: '',
            descriptionMd: '',
            passScore: 70,
            timeLimitMinutes: 30
        },
        validate: {
            courseId: (value) => (!value ? '코스를 선택해주세요' : null),
            title: (value) => (!value ? '시험 제목을 입력해주세요' : null),
            passScore: (value) => {
                if (value < 0 || value > 100) return '합격 점수는 0-100 사이여야 합니다';

                return null;
            },
            timeLimitMinutes: (value) => {
                if (value && value <= 0) return '제한 시간은 양수여야 합니다';

                return null;
            }
        }
    });

    const handleSubmit = async (values: CreateExamRequest) => {
        setIsSubmitting(true);
        try {
            const examId = await createExamMutation.mutateAsync(values);

            navigate(`/admin/exams/${examId}/questions`);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('시험 생성 오류:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PageContainer roleMain py={48}>
            <Stack gap="xl">
                {/* 헤더 */}
                <Group>
                    <Button leftSection={<ArrowLeft size={16} />} variant="subtle" onClick={() => navigate('/admin/exams')}>
                        시험 목록으로
                    </Button>
                    <Title order={1}>새 시험 만들기</Title>
                </Group>

                <Card withBorder padding="xl" radius="md">
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Stack gap="lg">
                            {/* 코스 선택 */}
                            {coursesError ? (
                                <Alert color="red" title="코스 목록 조회 오류">
                                    {coursesError.message}
                                </Alert>
                            ) : (
                                <Select
                                    required
                                    data={courseOptions}
                                    disabled={coursesLoading}
                                    label="대상 코스"
                                    placeholder={coursesLoading ? '코스 목록을 불러오는 중...' : '시험을 추가할 코스를 선택하세요'}
                                    {...form.getInputProps('courseId')}
                                />
                            )}

                            {/* 시험 제목 */}
                            <TextInput required label="시험 제목" placeholder="예: 프로그래밍 기초 이해도 평가" {...form.getInputProps('title')} />

                            {/* 시험 설명 */}
                            <Textarea label="시험 설명" placeholder="시험에 대한 간단한 설명을 입력하세요 (Markdown 지원)" rows={4} {...form.getInputProps('descriptionMd')} />

                            {/* 설정 */}
                            <Group grow>
                                <NumberInput required label="합격 점수" max={100} min={0} placeholder="70" suffix="점" {...form.getInputProps('passScore')} />
                                <NumberInput description="비워두면 무제한" label="제한 시간" min={1} placeholder="30" suffix="분" {...form.getInputProps('timeLimitMinutes')} />
                            </Group>

                            {/* 안내 메시지 */}
                            <Alert color="blue" title="안내">
                                <Stack gap="xs">
                                    <div>• 시험을 생성한 후 문제를 추가할 수 있습니다.</div>
                                    <div>• 합격 점수는 학생이 수료증을 받기 위한 최소 점수입니다.</div>
                                    <div>• 제한 시간을 비워두면 시간 제한 없이 응시할 수 있습니다.</div>
                                </Stack>
                            </Alert>

                            {/* 제출 버튼 */}
                            <Group justify="flex-end">
                                <Button variant="outline" onClick={() => navigate('/admin/exams')}>
                                    취소
                                </Button>
                                <Button leftSection={<Save size={16} />} loading={isSubmitting} type="submit">
                                    시험 생성 후 문제 추가
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                </Card>
            </Stack>
        </PageContainer>
    );
}
