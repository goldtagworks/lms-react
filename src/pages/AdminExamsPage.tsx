import { Stack, Title, Card, Text, Group, Badge, Button, Table, Alert, ActionIcon } from '@mantine/core';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, FileText, Clock, Target, BookOpen } from 'lucide-react';
import PageContainer from '@main/components/layout/PageContainer';
import { useExamsForAdmin, useDeleteExam } from '@main/hooks/useExamManagement';
import { useI18n } from '@main/lib/i18n';

export default function AdminExamsPage() {
    const { t } = useI18n();
    const { data: exams, isLoading, error } = useExamsForAdmin();
    const deleteExamMutation = useDeleteExam();

    const handleDeleteExam = async (examId: string, title: string) => {
        if (window.confirm(t('examAdmin.deleteExam.confirm', { title }))) {
            try {
                await deleteExamMutation.mutateAsync(examId);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(t('examAdmin.deleteExam.error'), error);
            }
        }
    };

    if (isLoading) {
        return (
            <PageContainer roleMain py={48}>
                <Text>{t('examAdmin.common.loadingList')}</Text>
            </PageContainer>
        );
    }

    if (error) {
        return (
            <PageContainer roleMain py={48}>
                <Alert color="red" title={t('examAdmin.errors.generic')}>
                    {t('examAdmin.errors.loadList')}
                </Alert>
            </PageContainer>
        );
    }

    return (
        <PageContainer roleMain py={48}>
            <Stack gap="xl">
                {/* 헤더 */}
                <Group justify="space-between">
                    <Title order={1}>{t('dashboard.title')}</Title>
                    <Button component={Link} leftSection={<Plus size={16} />} to="/admin/exams/new">
                        {t('examAdmin.common.createNew')}
                    </Button>
                </Group>

                {/* 시험 목록 */}
                {!exams || exams.length === 0 ? (
                    <Alert color="blue" title={t('examAdmin.common.noExamsTitle')}>
                        <Stack gap="md">
                            <Text>{t('examAdmin.common.noExamsBody')}</Text>
                            <Button component={Link} leftSection={<Plus size={16} />} size="sm" to="/admin/exams/new" variant="light">
                                {t('examAdmin.common.createNew')}
                            </Button>
                        </Stack>
                    </Alert>
                ) : (
                    <Card withBorder p={{ base: 'lg', md: 'xl' }} radius="md" shadow="md">
                        <Table>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>{t('examAdmin.table.name')}</Table.Th>
                                    <Table.Th>{t('examAdmin.table.course')}</Table.Th>
                                    <Table.Th>{t('examAdmin.table.questionCount')}</Table.Th>
                                    <Table.Th>{t('examAdmin.table.passScore')}</Table.Th>
                                    <Table.Th>{t('examAdmin.table.timeLimit')}</Table.Th>
                                    <Table.Th>{t('examAdmin.common.actions')}</Table.Th>
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
                                                {t('examAdmin.table.questionsSuffix', { value: exam.questionCount })}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color="green" leftSection={<Target size={12} />} variant="light">
                                                {exam.passScore}
                                                {t('scoreUnit')}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            {exam.timeLimitMinutes ? (
                                                <Badge color="orange" leftSection={<Clock size={12} />} variant="light">
                                                    {exam.timeLimitMinutes}
                                                    {t('minutesUnit')}
                                                </Badge>
                                            ) : (
                                                <Text c="dimmed" size="sm">
                                                    {t('examAdmin.table.unlimited')}
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
