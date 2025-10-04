import { Stack, Title, Card, Text, Group, Badge, Button, Alert } from '@mantine/core';
import { Link } from 'react-router-dom';
import { FileText, Download, Calendar, Trophy } from 'lucide-react';
import PageContainer from '@main/components/layout/PageContainer';
import HeroLayout from '@main/components/layout/HeroLayout';
import { EmptyStateHero } from '@main/components/EmptyStateHero';
import { useCertificates } from '@main/hooks/useCertificate';
import { getCertificatePdfUrl } from '@main/services/certificateService';
import { useI18n } from '@main/lib/i18n';

export default function CertificatesPage() {
    const { data: certificates, isLoading, error } = useCertificates();
    const { t } = useI18n();

    const handleDownloadPdf = async (pdfPath: string, courseName: string) => {
        try {
            const url = await getCertificatePdfUrl(pdfPath);

            const link = document.createElement('a');

            link.href = url;
            link.download = `${courseName}_수료증.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('PDF 다운로드 오류:', error);
        }
    };

    if (isLoading) {
        return (
            <PageContainer roleMain py={48}>
                <Text>{t('cert.page.loading')}</Text>
            </PageContainer>
        );
    }

    if (error) {
        return (
            <PageContainer roleMain py={48}>
                <Alert color="red" title={t('cert.page.errorTitle')}>
                    {t('cert.page.errorBody')}
                </Alert>
            </PageContainer>
        );
    }

    // 수료증이 없을 때는 Hero 레이아웃 사용
    if (!certificates || certificates.length === 0) {
        return (
            <HeroLayout hero={<EmptyStateHero variant="certificates" />}>
                <Card withBorder p="lg" radius="lg" shadow="sm">
                    <Alert color="blue" title={t('cert.page.emptyTitle')}>
                        <Text>{t('cert.page.emptyBody')}</Text>
                    </Alert>
                </Card>
            </HeroLayout>
        );
    }

    return (
        <PageContainer roleMain py={48}>
            <Stack gap="xl">
                <Title order={1}>{t('cert.page.title')}</Title>

                <Stack gap="md">
                    {certificates.map((certificate) => (
                        <Card key={certificate.id} withBorder padding="lg" radius="md">
                            <Stack gap="md">
                                {/* 헤더 */}
                                <Group align="flex-start" justify="space-between">
                                    <Stack gap="xs" style={{ flex: 1 }}>
                                        <Group>
                                            <Trophy color="#51cf66" size={20} />
                                            <Title order={3}>{certificate.enrollment.course.title}</Title>
                                        </Group>
                                        <Text c="dimmed" size="sm">
                                            {t('cert.item.instructor', { name: certificate.enrollment.course.instructorName })}
                                        </Text>
                                    </Stack>
                                    <Badge color="green" variant="light">
                                        {t('cert.item.passedBadge')}
                                    </Badge>
                                </Group>

                                {/* 상세 정보 */}
                                <Group>
                                    <Group gap="xs">
                                        <Calendar size={16} />
                                        <Text size="sm">{t('cert.item.issuedAt', { date: new Date(certificate.issuedAt).toLocaleDateString() })}</Text>
                                    </Group>
                                    <Group gap="xs">
                                        <FileText size={16} />
                                        <Text size="sm">
                                            {t('cert.item.serial')}: {certificate.serialNo}
                                        </Text>
                                    </Group>
                                    <Group gap="xs">
                                        <Trophy size={16} />
                                        <Text size="sm">{t('cert.item.score', { score: certificate.examAttempt.score })}</Text>
                                    </Group>
                                </Group>

                                {/* 액션 버튼 */}
                                <Group>
                                    <Button leftSection={<Download size={16} />} variant="filled" onClick={() => handleDownloadPdf(certificate.pdfPath, certificate.enrollment.course.title)}>
                                        {t('cert.item.pdfDownload')}
                                    </Button>
                                    <Button component={Link} to={`/course/${certificate.enrollment.course.id}`} variant="outline">
                                        {t('cert.item.viewCourse')}
                                    </Button>
                                </Group>
                            </Stack>
                        </Card>
                    ))}
                </Stack>
            </Stack>
        </PageContainer>
    );
}
