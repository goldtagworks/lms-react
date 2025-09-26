import { Button, Card, Container, Stack, Text, Title } from '@mantine/core';
import { useParams, Link } from 'react-router-dom';

const mockCert = {
    id: 1,
    courseTitle: 'React 입문',
    user: '홍길동',
    date: '2025-09-27',
    certNo: 'CERT-20250927-0001'
};

const CertificatePage = () => {
    const { id } = useParams();

    // 실제로는 id로 데이터 fetch, 여기선 mock만 사용
    return (
        <Container py="xl" size="sm">
            <Card withBorder padding="xl" radius="md" shadow="sm">
                <Stack>
                    <Title order={2}>수료증</Title>
                    <Text fw={700}>{mockCert.courseTitle}</Text>
                    <Text>수료자: {mockCert.user}</Text>
                    <Text>수료일: {mockCert.date}</Text>
                    <Text>수료증 번호: {mockCert.certNo}</Text>
                    <Button color="primary" size="md" variant="filled">
                        PDF 다운로드(목업)
                    </Button>
                    <Button component={Link} size="md" to={`/my`} variant="outline">
                        마이페이지로
                    </Button>
                </Stack>
            </Card>
        </Container>
    );
};

export default CertificatePage;
