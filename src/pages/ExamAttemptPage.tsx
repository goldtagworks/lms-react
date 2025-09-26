import { Container, Title, Text } from '@mantine/core';
import { useParams } from 'react-router-dom';

export default function ExamAttemptPage() {
    const { examId } = useParams();

    return (
        <Container py="xl">
            <Title order={2}>시험 시도</Title>
            <Text>시험 ID: {examId}</Text>
            <Text>문제 풀이/제출 영역 (mock)</Text>
        </Container>
    );
}
