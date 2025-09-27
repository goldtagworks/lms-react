import React from 'react';
import { Divider, Group, SimpleGrid } from '@mantine/core';

import { HeroSection } from '../features/home/components/HeroSection';
import { CategoryChips } from '../features/home/components/CategoryChips';
import { CoursesSection } from '../features/home/components/CoursesSection';
import { ReviewsSection } from '../features/home/components/ReviewsSection';
import { InstructorsSection } from '../features/home/components/InstructorsSection';
import { PromoBannerSection } from '../features/home/components/PromoBannerSection';
import { GuideSection } from '../features/home/components/GuideSection';
import { SupportSection } from '../features/home/components/SupportSection';
import { RecentNoticesSection } from '../features/notices/components/RecentNoticesSection';
import { homeData } from '../mocks/homeData';
import { useHomeDataMock } from '../features/home/hooks/useHomeDataMock';
import { CourseCardSkeleton } from '../features/home/components/skeletons/CourseCardSkeleton';
import { InstructorCardSkeleton } from '../features/home/components/skeletons/InstructorCardSkeleton';
import { PromoBannerSkeleton } from '../features/home/components/skeletons/PromoBannerSkeleton';
import PageContainer from '../components/layout/PageContainer';
import PageSection from '../components/layout/PageSection';

// TODO: 추천/배너 데이터는 homeData bundle → API 전환 예정
// (실제 구현 시 react-query 도입)
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
            {/* Full-bleed Hero (자체 Container 포함) */}
            <HeroSection />

            {/* 메인 컨텐츠 래퍼: Hero 제외 페이지 영역 */}
            <PageContainer roleMain py={32} size="lg">
                <PageSection withGapTop={false} /* Hero 이후 바로 노출 */>
                    <CategoryChips categories={categories} />
                </PageSection>

                {/* 최근 공지 (핀 우선) */}
                <RecentNoticesSection />

                {isLoading ? (
                    <PageSection aria-busy="true" aria-live="polite" title="인기 강의">
                        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <CourseCardSkeleton key={i} />
                            ))}
                        </SimpleGrid>
                    </PageSection>
                ) : (
                    <CoursesSection courses={popular} title="인기 강의" />
                )}

                {isLoading ? (
                    <PageSection aria-busy="true" aria-live="polite" title="신규 강의">
                        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <CourseCardSkeleton key={i} />
                            ))}
                        </SimpleGrid>
                    </PageSection>
                ) : (
                    <CoursesSection courses={newCourses} title="신규 강의" />
                )}

                {!isLoading && (
                    <PageSection withGapTop title="수강생 리뷰 베스트">
                        <Divider />
                        <ReviewsSection reviews={bestReviews} />
                    </PageSection>
                )}

                {isLoading ? (
                    <PageSection aria-busy="true" title="주요 강사진">
                        <Group gap={24}>
                            {Array.from({ length: 2 }).map((_, i) => (
                                <InstructorCardSkeleton key={i} />
                            ))}
                        </Group>
                    </PageSection>
                ) : (
                    <InstructorsSection instructors={instructors} />
                )}

                {isLoading ? (
                    <PageSection aria-busy title="프로모션">
                        <PromoBannerSkeleton />
                    </PageSection>
                ) : (
                    promoBanners[0] && <PromoBannerSection banner={promoBanners[0]} />
                )}

                <PageSection withGapTop title="이용 가이드">
                    <Divider mb="md" />
                    <GuideSection bare />
                </PageSection>
                <PageSection withGapTop title="고객 지원">
                    <SupportSection bare />
                </PageSection>
            </PageContainer>
        </>
    );
};

export default HomePage;
