import { Title, Text } from '@mantine/core';
import PageContainer from '@main/components/layout/PageContainer';

export default function AdminCategoriesPage() {
    return (
        <PageContainer roleMain py={48}>
            <Title order={2}>관리자 - 카테고리 관리</Title>
            <Text>전체 카테고리 목록/관리 (mock)</Text>
        </PageContainer>
    );
}
