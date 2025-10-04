import { Grid, Card, Text, Title, Stack, Group, Badge, Table, Progress, Alert } from '@mantine/core';
import { TrendingUp, Users, BookOpen, DollarSign, Award, Target } from 'lucide-react';
import PageContainer from '@main/components/layout/PageContainer';
import { useI18n } from '@main/lib/i18n';
import { useDashboardStats, useTopCourses, useActiveStudents, useExamStats } from '@main/hooks/useDashboard';

// 통계 카드 컴포넌트
function StatCard({ title, value, icon: Icon, color = 'blue' }: { title: string; value: string | number; icon: any; color?: string }) {
    return (
        <Card withBorder p={{ base: 'lg', md: 'xl' }} radius="lg" shadow="md">
            <Group justify="space-between">
                <Stack gap="xs">
                    <Text c="dimmed" size="sm">
                        {title}
                    </Text>
                    <Title order={2}>{value}</Title>
                </Stack>
                <Icon color={`var(--mantine-color-${color}-6)`} size={32} />
            </Group>
        </Card>
    );
}

export default function AdminDashboardPage() {
    const { t } = useI18n();
    const { data: stats, isLoading: statsLoading } = useDashboardStats();
    const { data: topCourses, isLoading: coursesLoading } = useTopCourses(5);
    const { data: activeStudents, isLoading: studentsLoading } = useActiveStudents(5);
    const { data: examStats, isLoading: examStatsLoading } = useExamStats();

    if (statsLoading) {
        return (
            <PageContainer roleMain py={48}>
                <Text>{t('examAdmin.common.loadingOne')}</Text>
            </PageContainer>
        );
    }

    return (
        <PageContainer roleMain py={48}>
            <Stack gap="xl">
                <Title order={1}>{t('dashboard.title')}</Title>

                {/* 주요 통계 카드들 */}
                {stats && (
                    <Grid>
                        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                            <StatCard color="blue" icon={BookOpen} title={t('dashboard.totalCourses', undefined, '총 코스 수')} value={stats.totalCourses} />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                            <StatCard color="green" icon={Users} title={t('dashboard.totalStudents', undefined, '총 학생 수')} value={stats.totalStudents} />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                            <StatCard
                                color="orange"
                                icon={DollarSign}
                                title={t('dashboard.totalRevenue', undefined, '총 매출')}
                                value={`${stats.totalRevenue.toLocaleString()}${t('dashboard.currencySuffix', undefined, '원')}`}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                            <StatCard color="purple" icon={Award} title={t('dashboard.certificatesIssued', undefined, '발급된 수료증')} value={stats.certificatesIssued} />
                        </Grid.Col>
                    </Grid>
                )}

                {/* 이번 달 통계 */}
                {stats && (
                    <Grid>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <StatCard color="cyan" icon={TrendingUp} title={t('dashboard.newEnrollmentsThisMonth', undefined, '이번 달 신규 등록')} value={stats.newEnrollmentsThisMonth} />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <StatCard color="red" icon={Target} title={t('dashboard.activeExams', undefined, '활성 시험')} value={stats.activeExams} />
                        </Grid.Col>
                    </Grid>
                )}

                <Grid>
                    {/* 인기 코스 */}
                    <Grid.Col span={{ base: 12, lg: 6 }}>
                        <Card withBorder p={{ base: 'lg', md: 'xl' }} radius="lg" shadow="md">
                            <Stack gap="md">
                                <Title order={3}>{t('dashboard.topCourses', undefined, '인기 코스 TOP 5')}</Title>
                                {coursesLoading ? (
                                    <Text>{t('dashboard.loading', undefined, '로딩 중...')}</Text>
                                ) : topCourses && topCourses.length > 0 ? (
                                    <Table>
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th>{t('dashboard.courseTitle', undefined, '코스명')}</Table.Th>
                                                <Table.Th>{t('dashboard.instructor', undefined, '강사')}</Table.Th>
                                                <Table.Th>{t('dashboard.enrollments', undefined, '등록자')}</Table.Th>
                                                <Table.Th>{t('dashboard.revenue', undefined, '매출')}</Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {topCourses.map((course) => (
                                                <Table.Tr key={course.id}>
                                                    <Table.Td>
                                                        <Text truncate size="sm">
                                                            {course.title}
                                                        </Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text c="dimmed" size="sm">
                                                            {course.instructorName}
                                                        </Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Badge size="sm" variant="light">
                                                            {course.enrollmentCount}
                                                            {t('dashboard.personSuffix', undefined, '명')}
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text fw={500} size="sm">
                                                            {course.revenue.toLocaleString()}
                                                            {t('dashboard.currencySuffix', undefined, '원')}
                                                        </Text>
                                                    </Table.Td>
                                                </Table.Tr>
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                ) : (
                                    <Alert color="blue" radius="lg" title={t('dashboard.noData', undefined, '데이터 없음')}>
                                        {t('dashboard.noCoursesYet', undefined, '아직 등록된 코스가 없습니다.')}
                                    </Alert>
                                )}
                            </Stack>
                        </Card>
                    </Grid.Col>

                    {/* 활성 학생 */}
                    <Grid.Col span={{ base: 12, lg: 6 }}>
                        <Card withBorder p={{ base: 'lg', md: 'xl' }} radius="lg" shadow="md">
                            <Stack gap="md">
                                <Title order={3}>{t('dashboard.topActiveStudents', undefined, '활성 학생 TOP 5')}</Title>
                                {studentsLoading ? (
                                    <Text>{t('dashboard.loading', undefined, '로딩 중...')}</Text>
                                ) : activeStudents && activeStudents.length > 0 ? (
                                    <Table>
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th>{t('dashboard.studentName', undefined, '학생명')}</Table.Th>
                                                <Table.Th>{t('dashboard.courseCount', undefined, '수강 수')}</Table.Th>
                                                <Table.Th>{t('dashboard.certificates', undefined, '수료증')}</Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {activeStudents.map((student) => (
                                                <Table.Tr key={student.id}>
                                                    <Table.Td>
                                                        <Text size="sm">{student.displayName}</Text>
                                                        <Text c="dimmed" size="xs">
                                                            {student.email}
                                                        </Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Badge color="blue" size="sm" variant="light">
                                                            {student.enrollmentCount}
                                                            {t('dashboard.countSuffix', undefined, '개')}
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Badge color="green" size="sm" variant="light">
                                                            {student.certificatesCount}
                                                            {t('dashboard.countSuffix', undefined, '개')}
                                                        </Badge>
                                                    </Table.Td>
                                                </Table.Tr>
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                ) : (
                                    <Alert color="blue" radius="lg" title={t('dashboard.noData', undefined, '데이터 없음')}>
                                        {t('dashboard.noStudentsYet', undefined, '아직 등록된 학생이 없습니다.')}
                                    </Alert>
                                )}
                            </Stack>
                        </Card>
                    </Grid.Col>
                </Grid>

                {/* 시험 통계 */}
                <Card withBorder p={{ base: 'lg', md: 'xl' }} radius="lg" shadow="md">
                    <Stack gap="md">
                        <Title order={3}>{t('dashboard.examStats', undefined, '시험 통계')}</Title>
                        {examStatsLoading ? (
                            <Text>{t('dashboard.loading', undefined, '로딩 중...')}</Text>
                        ) : examStats && examStats.length > 0 ? (
                            <Table>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>{t('dashboard.examTitle', undefined, '시험명')}</Table.Th>
                                        <Table.Th>{t('dashboard.course', undefined, '코스')}</Table.Th>
                                        <Table.Th>{t('dashboard.attemptCount', undefined, '응시 횟수')}</Table.Th>
                                        <Table.Th>{t('dashboard.avgScore', undefined, '평균 점수')}</Table.Th>
                                        <Table.Th>{t('dashboard.passRate', undefined, '합격률')}</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {examStats.slice(0, 10).map((exam) => (
                                        <Table.Tr key={exam.id}>
                                            <Table.Td>
                                                <Text truncate size="sm">
                                                    {exam.title}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text truncate c="dimmed" size="sm">
                                                    {exam.courseTitle}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge color="blue" size="sm" variant="light">
                                                    {exam.attemptCount}
                                                    {t('dashboard.timesSuffix', undefined, '회')}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">
                                                    {exam.averageScore.toFixed(1)}
                                                    {t('scoreUnit')}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group align="center" gap="xs">
                                                    <Progress color={exam.passRate >= 70 ? 'green' : exam.passRate >= 50 ? 'yellow' : 'red'} size="sm" style={{ flex: 1 }} value={exam.passRate} />
                                                    <Text size="sm">{exam.passRate.toFixed(1)}%</Text>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        ) : (
                            <Alert color="blue" radius="lg" title={t('dashboard.noData', undefined, '데이터 없음')}>
                                {t('dashboard.noExamsYet', undefined, '아직 등록된 시험이 없습니다.')}
                            </Alert>
                        )}
                    </Stack>
                </Card>
            </Stack>
        </PageContainer>
    );
}
