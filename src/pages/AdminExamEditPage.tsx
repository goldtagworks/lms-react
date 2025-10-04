import type { UpdateExamRequest } from '@main/types/examManagement';

import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import { useNavigate, useParams } from 'react-router-dom';
import { Stack, Title, Card, TextInput, Textarea, NumberInput, Button, Group, Alert, Select, Loader, Text } from '@mantine/core';
import { ArrowLeft, Save } from 'lucide-react';
import { useI18n } from '@main/lib/i18n';
import PageContainer from '@main/components/layout/PageContainer';
import { useExamWithQuestions, useUpdateExam } from '@main/hooks/useExamManagement';
import { useCoursesForExam } from '@main/hooks/useCourses';

export default function AdminExamEditPage() {
    const { t } = useI18n();
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
            title: (value) => (!value ? t('examAdmin.create.validate.titleRequired') : null),
            passScore: (value) => {
                if (value && (value < 0 || value > 100)) return t('examAdmin.create.validate.passScoreRange');

                return null;
            },
            timeLimitMinutes: (value) => {
                if (value && value <= 0) return t('examAdmin.create.validate.timeLimitPositive');

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
            console.error(t('examAdmin.errors.generic'), error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <PageContainer roleMain py={48}>
                <Group>
                    <Loader size="sm" />
                    <Text>{t('examAdmin.common.loadingOne')}</Text>
                </Group>
            </PageContainer>
        );
    }

    if (error || !exam) {
        return (
            <PageContainer roleMain py={48}>
                <Alert color="red" title={t('examAdmin.errors.generic')}>
                    {t('examAdmin.common.notFound')}
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
                        {t('examAdmin.common.backToList')}
                    </Button>
                    <Title order={1}>{t('examAdmin.edit.pageTitle')}</Title>
                </Group>

                <Card withBorder p={{ base: 'lg', md: 'xl' }} radius="md" shadow="md">
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Stack gap="lg">
                            <Select disabled data={courseOptions} description={t('examAdmin.create.field.course')} label={t('examAdmin.create.field.course')} value={exam.courseId} />

                            {/* 시험 제목 */}
                            <TextInput required label={t('examAdmin.create.field.title')} placeholder={t('examAdmin.create.field.titlePlaceholder')} {...form.getInputProps('title')} />

                            {/* 시험 설명 */}
                            <Textarea label={t('examAdmin.create.field.desc')} placeholder={t('examAdmin.create.field.descPlaceholder')} rows={4} {...form.getInputProps('descriptionMd')} />

                            {/* 설정 */}
                            <Group grow>
                                <NumberInput
                                    required
                                    label={t('examAdmin.create.field.passScore')}
                                    max={100}
                                    min={0}
                                    placeholder="70"
                                    suffix={t('examAdmin.table.scoreSuffix', { value: '' }, '점').replace(/\d+/g, '')}
                                    {...form.getInputProps('passScore')}
                                />
                                <NumberInput
                                    description={t('examAdmin.create.field.timeLimitDesc')}
                                    label={t('examAdmin.create.field.timeLimit')}
                                    min={1}
                                    placeholder="30"
                                    suffix={t('examAdmin.table.minutesSuffix', { value: '' }, '분').replace(/\d+/g, '')}
                                    {...form.getInputProps('timeLimitMinutes')}
                                />
                            </Group>

                            {/* 문제 수 표시 */}
                            <Alert color="blue" title={t('examAdmin.edit.currentInfoTitle')}>
                                <Stack gap="xs">
                                    <div>• {t('examAdmin.edit.liQuestionsCount', { count: exam.questionCount })}</div>
                                    <div>• {t('examAdmin.edit.liImmediate')}</div>
                                    <div>• {t('examAdmin.edit.liManageSeparate')}</div>
                                </Stack>
                            </Alert>

                            {/* 제출 버튼 */}
                            <Group justify="space-between">
                                <Button variant="outline" onClick={() => navigate(`/admin/exams/${exam.id}/questions`)}>
                                    {t('examAdmin.common.goQuestions')}
                                </Button>
                                <Group>
                                    <Button variant="outline" onClick={() => navigate('/admin/exams')}>
                                        {t('examAdmin.create.cancel')}
                                    </Button>
                                    <Button leftSection={<Save size={16} />} loading={isSubmitting} type="submit">
                                        {t('examAdmin.edit.submit')}
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
