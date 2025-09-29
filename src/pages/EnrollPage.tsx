import { Alert, Badge, Box, Button, Card, Divider, Grid, Group, Stack, Title } from '@mantine/core';
import { TextBody, TextMeta } from '@main/components/typography';
import { CheckCircle2, CreditCard, Info, Tag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';
import EmptyState from '@main/components/EmptyState';
import { useCourseByRouteId } from '@main/hooks/useCourseByRouteId';
import PriceText from '@main/components/price/PriceText';
import { enrollCourse, isEnrolled } from '@main/lib/repository';
import { useAuth } from '@main/lib/auth';

export default function EnrollPage() {
    const { course, notFound } = useCourseByRouteId();
    const { user } = useAuth();
    const navigate = useNavigate();
    const already = user && course ? isEnrolled(user.id, course.id) : false;

    function handleEnrollAndGo() {
        if (!user) {
            navigate('/signin');

            return;
        }
        if (!course) return;
        const { enrollment } = enrollCourse(user.id, course.id); // 즉시 ENROLLED (mock 결제)

        navigate(`/learn/${enrollment.id}`);
    }

    if (notFound || !course) {
        return (
            <PageContainer roleMain size="sm">
                <EmptyState actionLabel="코스 목록" message="이미 삭제되었거나 주소가 올바르지 않습니다." title="코스를 찾을 수 없어요" to="/courses" />
            </PageContainer>
        );
    }

    return (
        <PageContainer roleMain size="lg">
            <Grid gutter="xl">
                {/* Action / Price Panel (모바일 우선 상단) */}
                <Grid.Col order={{ base: 0, md: 2 }} span={{ base: 12, md: 4 }}>
                    <Card withBorder aria-label="수강 액션" component="aside" p="lg" radius="md" shadow="sm">
                        <Stack gap="sm">
                            <Box>
                                <TextBody fw={700} sizeOverride="lg">
                                    {course.title}
                                </TextBody>
                                <TextMeta mt={2}>강사: (샘플) Instructor</TextMeta>
                            </Box>
                            {!already && (
                                <Box>
                                    <PriceText discount={course.sale_price_cents ?? undefined} price={course.list_price_cents} size="md" />
                                </Box>
                            )}
                            {already && (
                                <Alert color="teal" icon={<CheckCircle2 size={16} />} radius="sm" variant="light">
                                    이미 수강 중입니다. 바로 학습을 이어가세요.
                                </Alert>
                            )}
                            <Button
                                fullWidth
                                aria-label={already ? '학습 페이지로 이동' : '즉시 수강 시작'}
                                color="blue"
                                leftSection={<CreditCard size={16} />}
                                size="xs"
                                variant="filled"
                                onClick={handleEnrollAndGo}
                            >
                                {already ? '학습하러 가기' : '수강 시작'}
                            </Button>
                            <Group gap={8} justify="space-between">
                                <Button component={Link} leftSection={<Info size={14} />} size="sm" to={`/course/${course.id}`} variant="subtle">
                                    코스 상세
                                </Button>
                                <TextMeta sizeOverride="10px">* 가격/할인 계산은 서버 기준 (클라이언트 재계산 금지)</TextMeta>
                            </Group>
                        </Stack>
                    </Card>
                </Grid.Col>

                {/* Main Content */}
                <Grid.Col order={{ base: 1, md: 1 }} span={{ base: 12, md: 8 }}>
                    <Stack gap="lg">
                        <header>
                            <Title order={1} style={{ lineHeight: 1.2 }}>
                                수강신청
                            </Title>
                            {course.summary && (
                                <TextBody mt="sm" style={{ maxWidth: 680 }}>
                                    {course.summary}
                                </TextBody>
                            )}
                        </header>
                        <section aria-label="코스 메타">
                            <Group gap="sm" mb="sm" wrap="wrap">
                                {course.category && (
                                    <Badge color="violet" variant="light">
                                        {course.category}
                                    </Badge>
                                )}
                                {course.tags?.slice(0, 4).map((t) => (
                                    <Badge key={t} color="gray" variant="outline">
                                        {t}
                                    </Badge>
                                ))}
                            </Group>
                            <Divider my="sm" />
                            <Group gap={24} wrap="wrap">
                                <MetaItem icon={<Tag size={16} />} label="카테고리" value={course.category || '—'} />
                            </Group>
                        </section>
                        <section aria-label="코스 설명">
                            <Title mb={8} order={3} size="h5">
                                코스 소개
                            </Title>
                            {course.description ? <TextBody style={{ whiteSpace: 'pre-line' }}>{course.description}</TextBody> : <TextMeta>상세 설명이 아직 준비되지 않았습니다.</TextMeta>}
                        </section>
                    </Stack>
                </Grid.Col>
            </Grid>
        </PageContainer>
    );
}

// ----- 내부 소형 컴포넌트 -----
interface MetaItemProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}
function MetaItem({ icon, label, value }: MetaItemProps) {
    return (
        <Group align="center" gap={6}>
            {icon}
            <TextMeta>{label}</TextMeta>
            <TextMeta c="inherit" fw={600} sizeOverride="xs">
                {value}
            </TextMeta>
        </Group>
    );
}
