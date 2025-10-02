import { Stack, Title, Card, Text, Group, Badge, Button, Alert } from '@mantine/core';
import { Link } from 'react-router-dom';
import { FileText, Download, Calendar, Trophy } from 'lucide-react';
import PageContainer from '@main/components/layout/PageContainer';
import { useCertificates } from '@main/hooks/useCertificate';
import { getCertificatePdfUrl } from '@main/services/certificateService';

export default function CertificatesPage() {
    const { data: certificates, isLoading, error } = useCertificates();

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
                <Text>수료증을 불러오는 중...</Text>
            </PageContainer>
        );
    }

    if (error) {
        return (
            <PageContainer roleMain py={48}>
                <Alert color="red" title="오류가 발생했습니다">
                    수료증 목록을 불러오는 중 오류가 발생했습니다.
                </Alert>
            </PageContainer>
        );
    }

    return (
        <PageContainer roleMain py={48}>
            <Stack gap="xl">
                <Title order={1}>내 수료증</Title>

                {!certificates || certificates.length === 0 ? (
                    <Alert color="blue" title="수료증이 없습니다">
                        <Text>아직 발급받은 수료증이 없습니다. 시험에 합격하여 수료증을 발급받아보세요!</Text>
                    </Alert>
                ) : (
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
                                                강사: {certificate.enrollment.course.instructorName}
                                            </Text>
                                        </Stack>
                                        <Badge color="green" variant="light">
                                            합격
                                        </Badge>
                                    </Group>

                                    {/* 상세 정보 */}
                                    <Group>
                                        <Group gap="xs">
                                            <Calendar size={16} />
                                            <Text size="sm">발급일: {new Date(certificate.issuedAt).toLocaleDateString('ko-KR')}</Text>
                                        </Group>
                                        <Group gap="xs">
                                            <FileText size={16} />
                                            <Text size="sm">일련번호: {certificate.serialNo}</Text>
                                        </Group>
                                        <Group gap="xs">
                                            <Trophy size={16} />
                                            <Text size="sm">점수: {certificate.examAttempt.score}점</Text>
                                        </Group>
                                    </Group>

                                    {/* 액션 버튼 */}
                                    <Group>
                                        <Button leftSection={<Download size={16} />} variant="filled" onClick={() => handleDownloadPdf(certificate.pdfPath, certificate.enrollment.course.title)}>
                                            PDF 다운로드
                                        </Button>
                                        <Button component={Link} to={`/course/${certificate.enrollment.course.id}`} variant="outline">
                                            강의 보기
                                        </Button>
                                    </Group>
                                </Stack>
                            </Card>
                        ))}
                    </Stack>
                )}
            </Stack>
        </PageContainer>
    );
}
