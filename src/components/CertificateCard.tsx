import { Card, Group, Text, Badge, Button, Stack } from '@mantine/core';
import { Link } from 'react-router-dom';
import { Download, ArrowRight } from 'lucide-react';
import { findCertificateById } from '@main/lib/repository';
import { openCertificatePrintView } from '@main/lib/certificatePrint';

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

    return (
        <Card withBorder p="lg" radius="md" shadow="sm">
            <Stack gap={8}>
                <Group gap={8} justify="space-between" wrap="nowrap">
                    <Text fw={700} lineClamp={1} size="md" title={courseTitle}>
                        {courseTitle}
                    </Text>
                    <Badge color="teal" size="xs" variant="light">
                        수료
                    </Badge>
                </Group>
                <Group gap={12} justify="space-between" wrap="nowrap">
                    <Text c="dimmed" size="xs">
                        발급일 {date}
                    </Text>
                    <Text c="dimmed" size="xs">
                        #{serialNo}
                    </Text>
                </Group>
                {!compact && (
                    <Text c="dimmed" lineClamp={2} size="xs">
                        해당 강의 수료를 완료하여 발급된 인증서입니다. PDF 다운로드 또는 상세 페이지에서 검증 정보를 확인할 수 있습니다.
                    </Text>
                )}
                <Group gap={8} mt={4} wrap="nowrap">
                    <Button component={Link} leftSection={<ArrowRight size={14} />} size="xs" to={`/certificate/${id}`} variant="light">
                        상세 보기
                    </Button>
                    <Button
                        leftSection={<Download size={14} />}
                        size="xs"
                        variant="outline"
                        onClick={() => {
                            const cert = findCertificateById(id);

                            if (cert) openCertificatePrintView({ certificate: cert, courseTitle });
                        }}
                    >
                        PDF
                    </Button>
                </Group>
            </Stack>
        </Card>
    );
}

export default CertificateCard;
