import type { CreateExamRequest } from '@main/types/examManagement';

import { useState } from 'react';
import { Stack, Title, Card, TextInput, Textarea, NumberInput, Button, Group, Alert, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useI18n } from '@main/lib/i18n';
import PageContainer from '@main/components/layout/PageContainer';
import { useCreateExam } from '@main/hooks/useExamManagement';
import { useCoursesForExam } from '@main/hooks/useCourses';

export default function AdminExamCreatePage() {
    const { t } = useI18n();
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
            courseId: (value) => (!value ? t('examAdmin.create.validate.selectCourse') : null),
            title: (value) => (!value ? t('examAdmin.create.validate.titleRequired') : null),
            passScore: (value) => {
                if (value < 0 || value > 100) return t('examAdmin.create.validate.passScoreRange');

                return null;
            },
            timeLimitMinutes: (value) => {
                if (value && value <= 0) return t('examAdmin.create.validate.timeLimitPositive');

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
            console.error(t('examAdmin.errors.generic'), error);
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
                        {t('examAdmin.common.backToList')}
                    </Button>
                    <Title order={1}>{t('examAdmin.create.pageTitle')}</Title>
                </Group>

                <Card withBorder padding="xl" radius="md">
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Stack gap="lg">
                            {/* 코스 선택 */}
                            {coursesError ? (
                                <Alert color="red" title={t('examAdmin.errors.generic', undefined, '코스 목록 조회 오류')}>
                                    {coursesError.message}
                                </Alert>
                            ) : (
                                <Select
                                    required
                                    data={courseOptions}
                                    disabled={coursesLoading}
                                    label={t('examAdmin.create.field.course')}
                                    placeholder={
                                        coursesLoading
                                            ? t('examAdmin.create.field.course', undefined, '코스 목록을 불러오는 중...')
                                            : t('examAdmin.create.field.course', undefined, '시험을 추가할 코스를 선택하세요')
                                    }
                                    {...form.getInputProps('courseId')}
                                />
                            )}

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

                            {/* 안내 메시지 */}
                            <Alert color="blue" title={t('examAdmin.create.guide.title')}>
                                <Stack gap="xs">
                                    <div>• {t('examAdmin.create.guide.li1')}</div>
                                    <div>• {t('examAdmin.create.guide.li2')}</div>
                                    <div>• {t('examAdmin.create.guide.li3')}</div>
                                </Stack>
                            </Alert>

                            {/* 제출 버튼 */}
                            <Group justify="flex-end">
                                <Button variant="outline" onClick={() => navigate('/admin/exams')}>
                                    {t('examAdmin.create.cancel')}
                                </Button>
                                <Button leftSection={<Save size={16} />} loading={isSubmitting} type="submit">
                                    {t('examAdmin.create.submitCreateAndAdd')}
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                </Card>
            </Stack>
        </PageContainer>
    );
}
