import { Title, Text } from '@mantine/core';
import { useParams } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';

export default function ExamAttemptPage() {
    const { examId } = useParams();

    return (
        <PageContainer roleMain py={48}>
            <Title order={2}>시험 시도</Title>
            <Text>시험 ID: {examId}</Text>
            <Text>문제 풀이/제출 영역 (mock)</Text>
        </PageContainer>
    );
}
