import { Alert, Badge, Box, Button, Card, CopyButton, Divider, Grid, Group, Stack, Text, Title, Tooltip } from '@mantine/core';
import { Link, useParams } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import { getAttemptMeta, upsertAttemptMeta, useCourses } from '@main/lib/repository';
import useCertificateQuery from '@main/hooks/useCertificateQuery';
import { openCertificatePrintView } from '@main/lib/certificatePrint';
import { useEffect, useMemo } from 'react';
import { formatDateTime, formatScore } from '@main/lib/format';
import { useI18n } from '@main/lib/i18n';

// (임시) 방문 시 샘플 attempt 메타 자동 주입: 실제 구현에서는 채점 완료 시 저장
function ensureSampleAttemptMeta(cert: any | null | undefined) {
    if (!cert) return;
    if (!getAttemptMeta(cert.exam_attempt_id)) {
        const score = 92;
        const pass = 70;

        upsertAttemptMeta(cert.exam_attempt_id, { exam_title: '최종 종합 평가', pass_score: pass, passed: score >= pass, score });
    }
}

const CertificatePage = () => {
    const { id } = useParams();
    const { data: cert, isLoading } = useCertificateQuery(id);
    const courses = useCourses();

    useEffect(() => {
        ensureSampleAttemptMeta(cert);
    }, [cert]);

    const attemptMeta = getAttemptMeta(cert?.exam_attempt_id);
    const courseTitle = useMemo(() => {
        if (!cert) return '';
        // enrollment_id 패턴: enr-... -> course id 추출 불가(현재 스키마로 직접 매핑 없음). 데모: 전체 중 첫 번째 코스명 or placeholder.
        // 실제 구현 시 certificate -> enrollment -> course join 필요.

        // course title placeholder (i18n demo) - using certificate.title if missing
        return courses[0]?.title || t('certificate.title');
    }, [cert, courses]);

    const { t } = useI18n();

    if (!id) {
        return (
            <PageContainer roleMain>
                <Alert color="red" title={t('certificate.invalidPathTitle')}>
                    {t('certificate.invalidPathMessage')}
                </Alert>
            </PageContainer>
        );
    }

    if (!isLoading && !cert) {
        return (
            <PageContainer roleMain>
                <Alert color="yellow" title={t('certificate.notFoundTitle')}>
                    {t('certificate.notFoundMessage')}
                </Alert>
            </PageContainer>
        );
    }

    const passed = attemptMeta?.passed;
    const unit = t('certificate.scoreUnit');
    const scoreText = formatScore(attemptMeta?.score) + (attemptMeta?.score != null ? unit : '');
    const passScoreText = formatScore(attemptMeta?.pass_score) + (attemptMeta?.pass_score != null ? unit : '');

    return (
        <PageContainer roleMain>
            <PageHeader description={t('certificate.pageDescDemo')} title={t('certificate.pageTitle')} />
            <Card withBorder padding="xl" radius="md" shadow="sm">
                <Stack gap="lg">
                    <Group align="flex-start" justify="space-between">
                        <div>
                            <Title order={3}>{courseTitle}</Title>
                            <Group gap="xs" mt={8}>
                                {passed != null && (
                                    <Badge color={passed ? 'teal' : 'red'} variant="light">
                                        {passed ? t('result.pass') : t('result.fail')}
                                    </Badge>
                                )}
                                <Badge variant="outline">{t('certificate.demoBadge')}</Badge>
                            </Group>
                        </div>
                        <Group gap="xs">
                            <Button component={Link} size="sm" to="/my/certificates" variant="light">
                                {t('certificate.backList')}
                            </Button>
                            <Button component={Link} size="sm" to="/my" variant="outline">
                                {t('certificate.backMyPage')}
                            </Button>
                        </Group>
                    </Group>
                    <Divider />
                    <Grid gutter="md">
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <Stack gap={4}>
                                <Text c="dimmed" size="sm">
                                    {t('certificate.serial')}
                                </Text>
                                <Group gap="xs" wrap="nowrap">
                                    <Text fw={500}>{cert?.serial_no}</Text>
                                    <CopyButton timeout={1500} value={cert?.serial_no || ''}>
                                        {({ copied, copy }) => (
                                            <Tooltip withArrow label={copied ? t('common.copied') : t('common.copyLink')}>
                                                <Button color={copied ? 'teal' : 'gray'} size="sm" variant={copied ? 'filled' : 'light'} onClick={copy}>
                                                    {copied ? t('common.copied') : t('common.copyLink')}
                                                </Button>
                                            </Tooltip>
                                        )}
                                    </CopyButton>
                                </Group>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <Stack gap={4}>
                                <Text c="dimmed" size="sm">
                                    {t('certificate.issuedDateLabel')}
                                </Text>
                                <Text fw={500}>{cert ? formatDateTime(cert.issued_at) : ''}</Text>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <Stack gap={4}>
                                <Text c="dimmed" size="smsm">
                                    {t('certificate.scoreAndPass')}
                                </Text>
                                <Text fw={500}>
                                    {scoreText} / {passScoreText}
                                </Text>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <Stack gap={4}>
                                <Text c="dimmed" size="sm">
                                    {t('certificate.examTitle')}
                                </Text>
                                <Text fw={500}>{attemptMeta?.exam_title || '—'}</Text>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={12}>
                            <Box mt="sm">
                                {cert && (
                                    <Button size="sm" variant="filled" onClick={() => openCertificatePrintView({ certificate: cert as any, courseTitle })}>
                                        {t('certificate.pdfDownload')}
                                    </Button>
                                )}
                            </Box>
                        </Grid.Col>
                    </Grid>
                    <Alert color="gray" title={t('certificate.demoNoticeTitle')} variant="light">
                        {t('certificate.demoNoticeBody')}
                    </Alert>
                </Stack>
            </Card>
        </PageContainer>
    );
};

export default CertificatePage;
