import { Container, Title, Text } from '@mantine/core';
import { useParams } from 'react-router-dom';

export default function LessonPlayerPage() {
    const { enrollmentId } = useParams();

    return (
        <Container py="xl">
            <Title order={2}>강의 플레이어</Title>
            <Text>수강 ID: {enrollmentId}</Text>
            <Text>비디오/콘텐츠 영역 (mock)</Text>
        </Container>
    );
}
