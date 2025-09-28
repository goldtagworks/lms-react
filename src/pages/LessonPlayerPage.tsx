import { Title, Text, Card } from '@mantine/core';
import { useParams } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';
import MarkdownView from '@main/components/markdown/MarkdownView';
import { useLessons } from '@main/lib/repository';

export default function LessonPlayerPage() {
    const { enrollmentId } = useParams();
    // 데모: enrollmentId 대신 lesson id가 param으로 올 수도 있으나 현재 스키마 단순화
    const lessons = useLessons(undefined); // 전체 불러온 뒤 첫 번째를 표시 (mock)
    const first = lessons[0];

    return (
        <PageContainer roleMain py={48}>
            <Title order={2}>강의 플레이어</Title>
            <Text>수강 ID: {enrollmentId}</Text>
            <Text mb="sm">비디오/콘텐츠 영역 (mock)</Text>
            <Card withBorder p="lg" radius="md" shadow="sm">
                <MarkdownView source={first?.content_md || '# 샘플 레슨\n내용이 아직 없습니다.'} />
            </Card>
        </PageContainer>
    );
}
