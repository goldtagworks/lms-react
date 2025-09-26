import { Button, Card, Container, Group, Text, Title, Box, SimpleGrid, Divider, Avatar, Tabs, List, Rating } from '@mantine/core';
import { useParams, Link } from 'react-router-dom';

const mockCourse = {
    id: 1,
    title: 'React 입문',
    instructor: {
        name: '홍길동',
        bio: '프론트엔드 전문가, 10년 경력',
        image: 'https://cdn.inflearn.com/public/instructors/1.png'
    },
    price: 39000,
    discount: 29000,
    rating: 4.8,
    students: 1200,
    summary: 'React 기초부터 실전까지! 실무에 바로 적용 가능한 프로젝트 중심 강의.',
    image: 'https://cdn.inflearn.com/public/courses/1.png',
    tags: ['프론트엔드', 'React', '실전'],
    description: '이 강의는 React의 기초부터 실전 프로젝트까지 단계별로 학습할 수 있도록 구성되어 있습니다. 최신 개발 트렌드와 실무 노하우를 모두 담았습니다.',
    curriculum: ['React 소개 및 개발환경 세팅', 'JSX와 컴포넌트 기초', '상태 관리와 이벤트', '라우팅과 네트워크', '실전 프로젝트 실습', '배포 및 마무리'],
    reviews: [
        { user: 'user01', rating: 5, comment: '실무에 바로 써먹을 수 있어요!', date: '2025-09-20' },
        { user: 'user02', rating: 4, comment: '예제와 설명이 명확해서 좋았습니다.', date: '2025-09-18' }
    ],
    qna: [{ user: 'user03', question: '예제 코드는 어디서 받을 수 있나요?', answer: '강의 자료실에서 다운로드 가능합니다.', date: '2025-09-21' }]
};

export default function CourseDetailPage() {
    const { id } = useParams();

    // 실제로는 id로 데이터 fetch, 여기선 mock만 사용
    return (
        <Container py="xl" size="lg">
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                {/* 좌측: 썸네일/가격/수강신청 */}
                <Box>
                    <Card withBorder p="xl" radius="md" shadow="md">
                        <img alt={mockCourse.title} src={mockCourse.image} style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 12, marginBottom: 16 }} />
                        <Title mb={8} order={2} size={28}>
                            {mockCourse.title}
                        </Title>
                        <Group gap={4} mb={8}>
                            {mockCourse.tags.map((tag) => (
                                <Text key={tag} bg="#e0e7ff" c="blue.6" px={8} py={2} size="xs" style={{ borderRadius: 8 }}>
                                    {tag}
                                </Text>
                            ))}
                        </Group>
                        <Group align="center" gap={8} mb={8}>
                            <Text c={mockCourse.discount ? 'red.6' : 'dark'} fw={700} size="lg">
                                {mockCourse.discount ? `${mockCourse.discount.toLocaleString()}원` : `${mockCourse.price.toLocaleString()}원`}
                            </Text>
                            {mockCourse.discount && (
                                <Text c="dimmed" size="sm" style={{ textDecoration: 'line-through' }}>
                                    {mockCourse.price.toLocaleString()}원
                                </Text>
                            )}
                        </Group>
                        <Group align="center" gap={8} mb={8}>
                            <Text c="yellow.7" size="sm">
                                ★ {mockCourse.rating}
                            </Text>
                            <Text c="dimmed" size="xs">
                                수강생 {mockCourse.students.toLocaleString()}명
                            </Text>
                        </Group>
                        <Button fullWidth component={Link} mb={8} radius="md" size="lg" to={`/enroll/${mockCourse.id}`} variant="filled">
                            수강신청
                        </Button>
                        <Button fullWidth component={Link} radius="md" size="md" to="/courses" variant="outline">
                            목록으로
                        </Button>
                    </Card>
                    {/* 강사 정보 */}
                    <Card withBorder mt="lg" p="lg" radius="md" shadow="sm">
                        <Group align="center" gap={16}>
                            <Avatar radius="xl" size={56} src={mockCourse.instructor.image} />
                            <Box>
                                <Text fw={700}>{mockCourse.instructor.name}</Text>
                                <Text c="dimmed" size="sm">
                                    {mockCourse.instructor.bio}
                                </Text>
                            </Box>
                        </Group>
                    </Card>
                </Box>
                {/* 우측: 상세/커리큘럼/후기/Q&A */}
                <Box>
                    <Tabs color="blue" defaultValue="desc">
                        <Tabs.List>
                            <Tabs.Tab value="desc">강의 소개</Tabs.Tab>
                            <Tabs.Tab value="curriculum">커리큘럼</Tabs.Tab>
                            <Tabs.Tab value="reviews">후기</Tabs.Tab>
                            <Tabs.Tab value="qna">Q&A</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panel pt="md" value="desc">
                            <Text mb={16} size="lg">
                                {mockCourse.description}
                            </Text>
                            <Divider my="md" />
                            <Text c="dimmed" size="sm">
                                {mockCourse.summary}
                            </Text>
                        </Tabs.Panel>
                        <Tabs.Panel pt="md" value="curriculum">
                            <List center size="md" spacing="sm">
                                {mockCourse.curriculum.map((item, idx) => (
                                    <List.Item key={idx}>{item}</List.Item>
                                ))}
                            </List>
                        </Tabs.Panel>
                        <Tabs.Panel pt="md" value="reviews">
                            {mockCourse.reviews.length === 0 ? (
                                <Text c="dimmed">아직 후기가 없습니다.</Text>
                            ) : (
                                mockCourse.reviews.map((r, idx) => (
                                    <Card key={idx} withBorder mb={12} p="md" radius="md" shadow="xs">
                                        <Group align="center" gap={8} mb={4}>
                                            <Text fw={700}>{r.user}</Text>
                                            <Rating readOnly fractions={2} size="sm" value={r.rating} />
                                            <Text c="dimmed" size="xs">
                                                {r.date}
                                            </Text>
                                        </Group>
                                        <Text>{r.comment}</Text>
                                    </Card>
                                ))
                            )}
                        </Tabs.Panel>
                        <Tabs.Panel pt="md" value="qna">
                            {mockCourse.qna.length === 0 ? (
                                <Text c="dimmed">등록된 Q&A가 없습니다.</Text>
                            ) : (
                                mockCourse.qna.map((q, idx) => (
                                    <Card key={idx} withBorder mb={12} p="md" radius="md" shadow="xs">
                                        <Text fw={700} mb={4}>
                                            {q.user}
                                        </Text>
                                        <Text c="dimmed" mb={4} size="xs">
                                            {q.date}
                                        </Text>
                                        <Text mb={8}>{q.question}</Text>
                                        <Text c="blue.6">A. {q.answer}</Text>
                                    </Card>
                                ))
                            )}
                        </Tabs.Panel>
                    </Tabs>
                </Box>
            </SimpleGrid>
        </Container>
    );
}
