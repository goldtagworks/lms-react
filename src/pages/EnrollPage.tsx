import { Button, Card, Stack, Text, Title } from '@mantine/core';
import { CreditCard, Info } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';
import { getCourse } from '@main/lib/repository';
import PriceText from '@main/components/price/PriceText';
import EmptyState from '@main/components/EmptyState';

export default function EnrollPage() {
    const { id: rawId } = useParams();
    const mappedId = !rawId ? undefined : rawId.startsWith('c') ? rawId : 'c' + rawId; // 상세 페이지와 동일 매핑 규칙
    const course = mappedId ? getCourse(mappedId) : undefined;

    if (!course) {
        return (
            <PageContainer roleMain size="sm">
                <Title mb="sm" order={2}>
                    수강신청
                </Title>
                <EmptyState actionLabel="코스 목록" message="이미 삭제되었거나 주소가 올바르지 않습니다." title="코스를 찾을 수 없어요" to="/courses" />
            </PageContainer>
        );
    }

    return (
        <PageContainer roleMain size="sm">
            <Card withBorder p="xl" radius="md" shadow="sm">
                <Stack>
                    <Title order={2}>수강신청</Title>
                    <Text fw={700} size="lg">
                        {course.title}
                    </Text>
                    <Text c="dimmed" size="sm">
                        강사: (샘플) Instructor
                    </Text>
                    {course.summary && (
                        <Text mb={4} size="sm">
                            {course.summary}
                        </Text>
                    )}
                    <PriceText discount={course.sale_price_cents ?? undefined} price={course.list_price_cents} size="md" />
                    <Button color="blue" component={Link} leftSection={<CreditCard size={14} />} size="md" to={`/payment/${course.id}`} variant="filled">
                        결제하기
                    </Button>
                    <Button component={Link} leftSection={<Info size={14} />} size="md" to={`/course/${course.id}`} variant="outline">
                        코스 상세로
                    </Button>
                </Stack>
            </Card>
        </PageContainer>
    );
}
