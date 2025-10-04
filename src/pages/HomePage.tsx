import React from 'react';
import { Divider } from '@mantine/core';
import { useI18n } from '@main/lib/i18n';

import { HeroSection } from '../features/home/components/HeroSection';
import { CategoryChips } from '../features/home/components/CategoryChips';
import { CoursesSection } from '../features/home/components/CoursesSection';
import { ReviewsSection } from '../features/home/components/ReviewsSection';
import { InstructorsSection } from '../features/home/components/InstructorsSection';
import { PromoBannerSection } from '../features/home/components/PromoBannerSection';
import { GuideSection } from '../features/home/components/GuideSection';
import { SupportSection } from '../features/home/components/SupportSection';
import { RecentNoticesSection } from '../components/notices/RecentNoticesSection';
import PageContainer from '../components/layout/PageContainer';
import PageSection from '../components/layout/PageSection';

const HomePage = () => {
    const { t } = useI18n();

    // TODO: 실제 API 훅으로 교체 (useHomeCategories, usePopularCourses, etc.)
    const categories: any[] = [];
    const popular: any[] = [];
    const newCourses: any[] = [];
    const bestReviews: any[] = [];
    const instructors: any[] = [];
    const promoBanners: any[] = [];

    return (
        <>
            {/* Full-bleed Hero (자체 Container 포함) */}
            <HeroSection />

            {/* 메인 컨텐츠 래퍼: Hero 제외 페이지 영역 */}
            <PageContainer roleMain py={32} size="lg">
                <PageSection withGapTop={false} /* Hero 이후 바로 노출 */>
                    <CategoryChips categories={categories} />
                </PageSection>

                {/* 최근 공지 */}
                <RecentNoticesSection />

                {/* 주요 섹션들 - 실제 데이터 연결 필요 */}
                <PageSection title={t('home.popular')}>
                    <CoursesSection courses={popular} title={t('home.popular')} />
                </PageSection>
                <PageSection title={t('home.new')}>
                    <CoursesSection courses={newCourses} title={t('home.new')} />
                </PageSection>
                <PageSection withGapTop title={t('home.bestReviews')}>
                    <Divider />
                    <ReviewsSection reviews={bestReviews} />
                </PageSection>
                <PageSection title={t('home.instructors')}>
                    <InstructorsSection instructors={instructors} title={t('home.instructors')} />
                </PageSection>
                <PageSection title={t('home.promotion')}>{promoBanners[0] && <PromoBannerSection banner={promoBanners[0]} />}</PageSection>

                <PageSection withGapTop title={t('home.guide')}>
                    <Divider mb="md" />
                    <GuideSection bare />
                </PageSection>
                <PageSection withGapTop title={t('home.support')}>
                    <SupportSection bare />
                </PageSection>
            </PageContainer>
        </>
    );
};

export default HomePage;
