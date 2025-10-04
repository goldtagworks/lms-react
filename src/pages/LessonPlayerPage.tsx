import { Title, Text, Card, Button, Group, Box, Progress, Alert } from '@mantine/core';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageContainer from '@main/components/layout/PageContainer';
import MarkdownView from '@main/components/markdown/MarkdownView';
import { useLessonWithProgress, useCourseProgressLessons, useMarkLessonComplete } from '@main/hooks/course/useLessonProgress';
import { t } from '@main/lib/i18n';

export default function LessonPlayerPage() {
    const { enrollmentId, lessonId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // 현재 레슨 정보 (진도 포함)
    const { data: lesson, isLoading: isLessonLoading, error: lessonError } = useLessonWithProgress(lessonId || '', enrollmentId);

    // 코스의 전체 레슨 목록 (네비게이션용)
    const { data: allLessons } = useCourseProgressLessons(lesson?.course_id || '', enrollmentId);

    // 레슨 완료 처리
    const markComplete = useMarkLessonComplete();
    const completeMutation = useMutation({
        mutationFn: () => markComplete(enrollmentId!, lessonId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lesson', lessonId, 'progress', enrollmentId] });
            queryClient.invalidateQueries({ queryKey: ['lessons', lesson?.course_id, 'progress', enrollmentId] });
        }
    });

    if (isLessonLoading) {
        return (
            <PageContainer roleMain py={48}>
                <Text>{t('player.loading')}</Text>
            </PageContainer>
        );
    }

    if (lessonError || !lesson) {
        return (
            <PageContainer roleMain py={48}>
                <Alert color="red">{t('player.lessonNotFound')}</Alert>
            </PageContainer>
        );
    }

    // 섹션 헤더인 경우 콘텐츠 표시하지 않음
    if (lesson.is_section) {
        return (
            <PageContainer roleMain py={48}>
                <Title order={2}>{lesson.title}</Title>
                <Text c="dimmed">{t('player.sectionHeader')}</Text>
            </PageContainer>
        );
    }

    // 다음/이전 레슨 찾기
    const currentIndex = allLessons?.findIndex((l) => l.id === lessonId) ?? -1;
    const previousLesson = currentIndex > 0 ? allLessons?.[currentIndex - 1] : null;
    const nextLesson = currentIndex >= 0 && currentIndex < (allLessons?.length ?? 0) - 1 ? allLessons?.[currentIndex + 1] : null;

    const handleComplete = () => {
        if (!lesson.is_completed) {
            completeMutation.mutate();
        }
    };

    const navigateToLesson = (targetLessonId: string) => {
        navigate(`/enrollments/${enrollmentId}/lessons/${targetLessonId}`);
    };

    return (
        <PageContainer roleMain py={48}>
            {/* 헤더 */}
            <Group justify="space-between" mb="lg">
                <div>
                    <Title order={2}>{lesson.title}</Title>
                    {lesson.duration_seconds > 0 && (
                        <Text c="dimmed" size="sm">
                            {t('player.duration', { minutes: Math.ceil(lesson.duration_seconds / 60) })}
                        </Text>
                    )}
                </div>

                {lesson.is_completed && (
                    <Group>
                        <Text c="green" size="sm">
                            {t('player.completed')}
                        </Text>
                    </Group>
                )}
            </Group>

            {/* 진도율 표시 */}
            {allLessons && (
                <Box mb="lg">
                    <Text mb="xs" size="sm">
                        {t('player.progress', {
                            current: currentIndex + 1,
                            total: allLessons.filter((l) => !l.is_section).length
                        })}
                    </Text>
                    <Progress size="sm" value={((currentIndex + 1) / allLessons.filter((l) => !l.is_section).length) * 100} />
                </Box>
            )}

            {/* 레슨 콘텐츠 */}
            <Card withBorder mb="lg" p={{ base: 'lg', md: 'xl' }} radius="lg" shadow="sm">
                {lesson.content_url ? (
                    <Box mb="md">
                        <Text c="dimmed" mb="xs" size="sm">
                            {t('player.externalContent')}
                        </Text>
                        <Button component="a" href={lesson.content_url} rel="noopener noreferrer" target="_blank" variant="outline">
                            {t('player.openContent')}
                        </Button>
                    </Box>
                ) : null}

                <MarkdownView source={lesson.content_md || t('lesson.emptyContent')} />
            </Card>

            {/* 액션 버튼 */}
            <Group justify="space-between">
                <Group>
                    {previousLesson && (
                        <Button disabled={previousLesson.is_section} variant="outline" onClick={() => navigateToLesson(previousLesson.id)}>
                            {t('player.previous')}
                        </Button>
                    )}
                </Group>

                <Group>
                    {!lesson.is_completed && (
                        <Button loading={completeMutation.isPending} onClick={handleComplete}>
                            {t('player.markComplete')}
                        </Button>
                    )}

                    {nextLesson && (
                        <Button disabled={nextLesson.is_section} onClick={() => navigateToLesson(nextLesson.id)}>
                            {t('player.next')}
                        </Button>
                    )}
                </Group>
            </Group>
        </PageContainer>
    );
}
