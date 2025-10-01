import { Card, Group, Text, Badge, Button, Stack } from '@mantine/core';
import { Link } from 'react-router-dom';
import { Download, ArrowRight } from 'lucide-react';
import { findCertificateById } from '@main/lib/repository';
import { openCertificatePrintView } from '@main/lib/certificatePrint';
import { useI18n } from '@main/lib/i18n';

export interface CertificateCardProps {
    id: string;
    courseTitle: string;
    issuedAt: string;
    serialNo: string;
    pdfPath: string;
    compact?: boolean;
}

// 간단한 표시 컴포넌트: 추후 성적/점수/강사명 추가 가능
export function CertificateCard({ id, courseTitle, issuedAt, serialNo, compact }: CertificateCardProps) {
    const date = new Date(issuedAt).toLocaleDateString();
    const { t } = useI18n();

    return (
        <Card withBorder p="lg" radius="lg" shadow="sm">
            <Stack gap={8}>
                <Group gap={8} justify="space-between" wrap="nowrap">
                    <Text fw={700} lineClamp={1} size="md" title={courseTitle}>
                        {courseTitle}
                    </Text>
                    <Badge color="teal" size="sm" variant="light">
                        {t('certificate.issued')}
                    </Badge>
                </Group>
                <Group gap={12} justify="space-between" wrap="nowrap">
                    <Text c="dimmed" size="sm">
                        {t('certificate.issuedAt', { date })}
                    </Text>
                    <Text c="dimmed" size="sm">
                        #{serialNo}
                    </Text>
                </Group>
                {!compact && (
                    <Text c="dimmed" lineClamp={2} size="sm">
                        {t('certificate.cardDescription')}
                    </Text>
                )}
                <Group gap={8} mt={4} wrap="nowrap">
                    <Button component={Link} leftSection={<ArrowRight size={14} />} size="sm" to={`/certificate/${id}`} variant="light">
                        {t('certificate.viewDetails')}
                    </Button>
                    <Button
                        aria-label={t('certificate.pdfDownload')}
                        leftSection={<Download size={14} />}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            const cert = findCertificateById(id);

                            if (cert) openCertificatePrintView({ certificate: cert, courseTitle });
                        }}
                    >
                        {t('certificate.pdfDownload')}
                    </Button>
                </Group>
            </Stack>
        </Card>
    );
}

export default CertificateCard;
