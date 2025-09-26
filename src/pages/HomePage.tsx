import React from 'react';
import { Container, Group, Title, Text, SimpleGrid, Card, Select, TextInput, Box } from '@mantine/core';

import { LinkButton } from '../components/LinkButton';
import { CourseCard } from '../components/CourseCard';
import { AppButton } from '../components/AppButton';
import MainLayout from '../layouts/MainLayout';

const courses = [
    {
        title: 'Korean 1',
        level: 'Beginner',
        percent: 60,
        price: '무료',
        weeks: 4,
        lessons: 12
    },
    {
        title: 'Conversation 3',
        level: 'Intermediate',
        percent: 70,
        price: '유료',
        weeks: 6,
        lessons: 16
    },
    {
        title: 'Business Korean',
        level: 'Advanced',
        percent: 80,
        price: '유료',
        weeks: 8,
        lessons: 20
    },
    {
        title: 'K-WAVE Korean',
        level: 'Intermediate',
        percent: 60,
        price: '무료',
        weeks: 4,
        lessons: 8
    }
];

function HomePage() {
    return (
        <MainLayout>
            {/* Hero */}
            <Container py="xl" size="lg">
                <Title lh={1.15} mb="md" order={1} size={40}>
                    Whenever, wherever,
                    <br />
                    배움은 계속됩니다
                </Title>
                <Text c="dimmed" mb="md" size="lg">
                    입문부터 비즈니스까지, 수준별 커리큘럼을 만나보세요. 강의별 응시 기준(%)을 명확히 안내합니다.
                </Text>
                <Group gap="md" wrap="wrap">
                    <LinkButton color="primary" href="#courses" label="코스 둘러보기" size="md" />
                    <LinkButton color="accent" href="#guide" label="이용 가이드" size="md" variant="light" />
                </Group>
            </Container>
            {/* Courses */}
            <Box bg="var(--mantine-color-body)" id="courses" py="xl">
                <Container size="lg">
                    <Group align="center" justify="space-between">
                        <Title m={0} order={2} size={24}>
                            코스 목록
                        </Title>
                        <Group gap="md" wrap="wrap">
                            <Select aria-label="레벨" data={['Beginner', 'Intermediate', 'Advanced']} placeholder="레벨" size="md" />
                            <Select aria-label="유형" data={['Korean', 'Conversation', 'Special']} placeholder="유형" size="md" />
                            <TextInput aria-label="코스 검색" placeholder="검색(제목/키워드)" size="md" />
                            <AppButton label="검색" size="md" variant="outline" />
                        </Group>
                    </Group>
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} mt="lg" spacing="lg">
                        {courses.map((c) => (
                            <CourseCard key={c.title} lessons={c.lessons} level={c.level} percent={c.percent} price={c.price} title={c.title} weeks={c.weeks} />
                        ))}
                    </SimpleGrid>
                    <Box mt="xl" ta="center">
                        <LinkButton href="#all" label="View All" size="md" variant="subtle" />
                    </Box>
                </Container>
            </Box>
            {/* Guide */}
            <Box bg="var(--mantine-color-body)" id="guide" py="xl">
                <Container size="lg">
                    <Title mb="md" order={2} size={24}>
                        이용 가이드
                    </Title>
                    <Text c="dimmed" mb="md">
                        수강 절차, 자료 다운로드, 뷰어 설치 안내를 확인하세요.
                    </Text>
                    <ul style={{ paddingLeft: 18, color: '#6B7280', margin: 0 }}>
                        <li>
                            <AppButton bg="none" h="auto" label="학습자 가이드 PDF" p={0} variant="subtle" />
                        </li>
                        <li>
                            <AppButton bg="none" h="auto" label="자료실 바로가기" p={0} variant="subtle" />
                        </li>
                        <li>
                            <AppButton bg="none" h="auto" label="파일 뷰어 다운로드" p={0} variant="subtle" />
                        </li>
                    </ul>
                </Container>
            </Box>
            {/* Support */}
            <Box id="support" py="xl">
                <Container size="lg">
                    <Card withBorder radius="md">
                        <Group align="center" justify="space-between">
                            <div>
                                <Title mb="sm" order={3}>
                                    도움이 필요하신가요?
                                </Title>
                                <Text c="dimmed">운영시간 평일 09:00–18:00 · help@example.com · 02-0000-0000</Text>
                            </div>
                            <Group gap="sm">
                                <LinkButton color="accent" href="#faq" label="FAQ" size="md" variant="light" />
                                <LinkButton color="primary" href="#contact" label="1:1 문의" size="md" />
                            </Group>
                        </Group>
                    </Card>
                </Container>
            </Box>
        </MainLayout>
    );
}

export default HomePage;
