import { Card, Container, SimpleGrid, Text, Title, Button, Group, Select, TextInput } from '@mantine/core';
import { Link } from 'react-router-dom';

const categories = [
    { value: 'all', label: '전체' },
    { value: 'frontend', label: '프론트엔드' },
    { value: 'backend', label: '백엔드' },
    { value: 'data', label: '데이터분석' },
    { value: 'ai', label: 'AI/ML' },
    { value: 'cert', label: '자격증' },
    { value: 'biz', label: '비즈니스' }
];

const mockCourses = [
    {
        id: 1,
        title: 'React 입문',
        instructor: '홍길동',
        price: 39000,
        discount: 29000,
        rating: 4.8,
        students: 1200,
        summary: 'React 기초부터 실전까지!',
        image: 'https://cdn.inflearn.com/public/courses/1.png',
        tags: ['프론트엔드', 'React', '실전']
    },
    {
        id: 2,
        title: 'TypeScript 완전정복',
        instructor: '이몽룡',
        price: 45000,
        discount: 35000,
        rating: 4.7,
        students: 900,
        summary: 'TS 타입 시스템 마스터',
        image: 'https://cdn.inflearn.com/public/courses/2.png',
        tags: ['프론트엔드', 'TypeScript', '실무']
    },
    {
        id: 3,
        title: 'SQL & 데이터베이스',
        instructor: '성춘향',
        price: 32000,
        discount: null,
        rating: 4.6,
        students: 700,
        summary: 'DB 기초와 실무 활용',
        image: 'https://cdn.inflearn.com/public/courses/3.png',
        tags: ['DB', 'SQL', '백엔드']
    },
    {
        id: 4,
        title: 'Next.js 실전',
        instructor: '김철수',
        price: 49000,
        discount: 39000,
        rating: 4.9,
        students: 1800,
        summary: 'Next.js로 실전 프로젝트!',
        image: 'https://cdn.inflearn.com/public/courses/4.png',
        tags: ['프론트엔드', 'Next.js']
    },
    {
        id: 5,
        title: '파이썬 데이터분석',
        instructor: '박영희',
        price: 42000,
        discount: null,
        rating: 4.8,
        students: 1500,
        summary: 'Python으로 데이터분석 실습',
        image: 'https://cdn.inflearn.com/public/courses/5.png',
        tags: ['데이터분석', 'Python']
    }
];

const CourseListPage = () => {
    return (
        <Container py="xl" size="lg">
            <Title mb="lg" order={2}>
                전체 강의
            </Title>
            {/* 필터/정렬/검색 UI */}
            <Group gap="md" mb="xl" wrap="wrap">
                <Select aria-label="카테고리" data={categories} defaultValue="all" size="md" />
                <Select
                    aria-label="정렬"
                    data={[
                        { value: 'latest', label: '최신순' },
                        { value: 'popular', label: '인기순' },
                        { value: 'rating', label: '평점순' }
                    ]}
                    defaultValue="latest"
                    size="md"
                />
                <TextInput aria-label="검색" placeholder="강의명/키워드 검색" size="md" style={{ minWidth: 220 }} />
                <Button size="md" variant="outline">
                    검색
                </Button>
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="xl">
                {mockCourses.map((course) => (
                    <Card key={course.id} withBorder p="lg" radius="md" shadow="md">
                        <img alt={course.title} src={course.image} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 12, marginBottom: 12 }} />
                        <Title mb={4} order={4} size={18}>
                            {course.title}
                        </Title>
                        <Text c="dimmed" mb={4} size="sm">
                            {course.instructor}
                        </Text>
                        <Group gap={4} mb={4}>
                            {course.tags.map((tag) => (
                                <Text key={tag} bg="#e0e7ff" c="blue.6" px={8} py={2} size="xs" style={{ borderRadius: 8 }}>
                                    {tag}
                                </Text>
                            ))}
                        </Group>
                        <Text mb={4} size="sm">
                            {course.summary}
                        </Text>
                        <Group align="center" gap={8} mb={4}>
                            <Text c={course.discount ? 'red.6' : 'dark'} fw={700} size="md">
                                {course.discount ? `${course.discount.toLocaleString()}원` : `${course.price.toLocaleString()}원`}
                            </Text>
                            {course.discount && (
                                <Text c="dimmed" size="sm" style={{ textDecoration: 'line-through' }}>
                                    {course.price.toLocaleString()}원
                                </Text>
                            )}
                        </Group>
                        <Group align="center" gap={8} mb={8}>
                            <Text c="yellow.7" size="sm">
                                ★ {course.rating}
                            </Text>
                            <Text c="dimmed" size="xs">
                                수강생 {course.students.toLocaleString()}명
                            </Text>
                        </Group>
                        <Button fullWidth component={Link} mt="sm" radius="md" to={`/course/${course.id}`} variant="light">
                            상세 보기
                        </Button>
                    </Card>
                ))}
            </SimpleGrid>
        </Container>
    );
};

export default CourseListPage;
