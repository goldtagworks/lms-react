import React from 'react';
import { Container, Group, Title, Text, SimpleGrid, Card, Select, TextInput, Box, Button } from '@mantine/core';
import { Link } from 'react-router-dom';
import { AppButton } from '@main/components/AppButton';

import { HeroSection } from '../features/home/components/HeroSection';
import { CategoryChips } from '../features/home/components/CategoryChips';
import { CoursesSection } from '../features/home/components/CoursesSection';
import { ReviewsSection } from '../features/home/components/ReviewsSection';
import { InstructorsSection } from '../features/home/components/InstructorsSection';
import { PromoBannerSection } from '../features/home/components/PromoBannerSection';
import { GuideSection } from '../features/home/components/GuideSection';
import { SupportSection } from '../features/home/components/SupportSection';
import { homeData } from '../mocks/homeData';
import { useHomeDataMock } from '../features/home/hooks/useHomeDataMock';
import { CourseCardSkeleton } from '../features/home/components/skeletons/CourseCardSkeleton';
import { InstructorCardSkeleton } from '../features/home/components/skeletons/InstructorCardSkeleton';
import { PromoBannerSkeleton } from '../features/home/components/skeletons/PromoBannerSkeleton';

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

// TODO: 위 추천 강의/배너 데이터는 homeData bundle 기반 컴포넌트 추출 후 제거 예정

// 기존 정적 homeData는 훅 로딩 완료 후 fallback
// (실제 구현 시 react-query 대체 예정)
const fallback = homeData;

const HomePage = () => {
    const { data, isLoading } = useHomeDataMock();
    const categories = data?.categories || fallback.categories;
    const popular = data?.popular || fallback.popular;
    const newCourses = data?.newCourses || fallback.newCourses;
    const bestReviews = data?.bestReviews || fallback.bestReviews;
    const instructors = data?.instructors || fallback.instructors;
    const promoBanners = data?.promoBanners || fallback.promoBanners;

    return (
        <>
            <HeroSection />

            <Container py={32} size="lg">
                <CategoryChips categories={categories} />
            </Container>

            {isLoading ? (
                <Container aria-busy="true" aria-live="polite" py={40} size="lg">
                    <Group justify="space-between" mb="md">
                        <Title order={2} size={28}>
                            인기 강의
                        </Title>
                    </Group>
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <CourseCardSkeleton key={i} />
                        ))}
                    </SimpleGrid>
                </Container>
            ) : (
                <CoursesSection courses={popular} title="인기 강의" />
            )}

            {isLoading ? (
                <Container aria-busy="true" aria-live="polite" py={40} size="lg">
                    <Group justify="space-between" mb="md">
                        <Title order={2} size={28}>
                            신규 강의
                        </Title>
                    </Group>
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <CourseCardSkeleton key={i} />
                        ))}
                    </SimpleGrid>
                </Container>
            ) : (
                <CoursesSection courses={newCourses} title="신규 강의" />
            )}

            {!isLoading && <ReviewsSection reviews={bestReviews} />}

            {isLoading ? (
                <Container aria-busy="true" py={32} size="lg">
                    <Group gap={24}>
                        {Array.from({ length: 2 }).map((_, i) => (
                            <InstructorCardSkeleton key={i} />
                        ))}
                    </Group>
                </Container>
            ) : (
                <InstructorsSection instructors={instructors} />
            )}

            {isLoading ? (
                <Container aria-busy="true" py={32} size="lg">
                    <PromoBannerSkeleton />
                </Container>
            ) : (
                promoBanners[0] && <PromoBannerSection banner={promoBanners[0]} />
            )}

            {/* 기존 Courses 섹션 이하 생략... */}
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
                        {courses.map((c, idx) => (
                            <Card key={c.title} withBorder radius="md" shadow="md">
                                <Title mb="xs" order={4} size={18}>
                                    {c.title}
                                </Title>
                                <Text c="dimmed" mb="xs" size="sm">
                                    {c.level} · {c.price}
                                </Text>
                                <Text c="dimmed" size="sm">
                                    {c.weeks}주 · {c.lessons}차시
                                </Text>
                                <Button fullWidth component={Link} mt="md" size="xs" to={`/course/${idx + 1}`} variant="light">
                                    자세히
                                </Button>
                            </Card>
                        ))}
                    </SimpleGrid>
                    <Box mt="xl" ta="center">
                        <Button component={Link} size="md" to="/courses" variant="subtle">
                            View All
                        </Button>
                    </Box>
                </Container>
            </Box>
            <GuideSection />
            <SupportSection />
        </>
    );
};

export default HomePage;
