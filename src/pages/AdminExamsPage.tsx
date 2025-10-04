import { Stack, Title, Card, Text, Group, Badge, Button, Table, Alert, ActionIcon } from '@mantine/core';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, FileText, Clock, Target, BookOpen } from 'lucide-react';
import PageContainer from '@main/components/layout/PageContainer';
import { useExamsForAdmin, useDeleteExam } from '@main/hooks/useExamManagement';

export default function AdminExamsPage() {
    const { data: exams, isLoading, error } = useExamsForAdmin();
    const deleteExamMutation = useDeleteExam();

    const handleDeleteExam = async (examId: string, title: string) => {
        if (window.confirm(`시험 "${title}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
            try {
                await deleteExamMutation.mutateAsync(examId);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('시험 삭제 오류:', error);
            }
        }
    };

    if (isLoading) {
        return (
            <PageContainer roleMain py={48}>
                <Text>시험 목록을 불러오는 중...</Text>
            </PageContainer>
        );
    }

    if (error) {
        return (
            <PageContainer roleMain py={48}>
                <Alert color="red" title="오류가 발생했습니다">
                    시험 목록을 불러오는 중 오류가 발생했습니다.
                </Alert>
            </PageContainer>
        );
    }

    return (
        <PageContainer roleMain py={48}>
            <Stack gap="xl">
                {/* 헤더 */}
                <Group justify="space-between">
                    <Title order={1}>시험 관리</Title>
                    <Button component={Link} leftSection={<Plus size={16} />} to="/admin/exams/new">
                        새 시험 만들기
                    </Button>
                </Group>

                {/* 시험 목록 */}
                {!exams || exams.length === 0 ? (
                    <Alert color="blue" title="시험이 없습니다">
                        <Stack gap="md">
                            <Text>아직 생성된 시험이 없습니다. 새 시험을 만들어보세요!</Text>
                            <Button component={Link} leftSection={<Plus size={16} />} size="sm" to="/admin/exams/new" variant="light">
                                새 시험 만들기
                            </Button>
                        </Stack>
                    </Alert>
                ) : (
                    <Card withBorder p={{ base: 'lg', md: 'xl' }} radius="md" shadow="md">
                        <Table>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>시험명</Table.Th>
                                    <Table.Th>코스</Table.Th>
                                    <Table.Th>문제 수</Table.Th>
                                    <Table.Th>합격 점수</Table.Th>
                                    <Table.Th>제한 시간</Table.Th>
                                    <Table.Th>작업</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {exams.map((exam) => (
                                    <Table.Tr key={exam.id}>
                                        <Table.Td>
                                            <Stack gap="xs">
                                                <Text fw={500}>{exam.title}</Text>
                                                {exam.descriptionMd && (
                                                    <Text truncate c="dimmed" size="sm">
                                                        {exam.descriptionMd.slice(0, 100)}
                                                        {exam.descriptionMd.length > 100 && '...'}
                                                    </Text>
                                                )}
                                            </Stack>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <BookOpen size={16} />
                                                <Text size="sm">{exam.course.title}</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color="blue" leftSection={<FileText size={12} />} variant="light">
                                                {exam.questionCount}문제
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color="green" leftSection={<Target size={12} />} variant="light">
                                                {exam.passScore}점
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            {exam.timeLimitMinutes ? (
                                                <Badge color="orange" leftSection={<Clock size={12} />} variant="light">
                                                    {exam.timeLimitMinutes}분
                                                </Badge>
                                            ) : (
                                                <Text c="dimmed" size="sm">
                                                    무제한
                                                </Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <ActionIcon component={Link} size="sm" to={`/admin/exams/${exam.id}/questions`} variant="light">
                                                    <FileText size={16} />
                                                </ActionIcon>
                                                <ActionIcon color="blue" component={Link} size="sm" to={`/admin/exams/${exam.id}/edit`} variant="light">
                                                    <Edit size={16} />
                                                </ActionIcon>
                                                <ActionIcon color="red" loading={deleteExamMutation.isPending} size="sm" variant="light" onClick={() => handleDeleteExam(exam.id, exam.title)}>
                                                    <Trash2 size={16} />
                                                </ActionIcon>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Card>
                )}
            </Stack>
        </PageContainer>
    );
}
