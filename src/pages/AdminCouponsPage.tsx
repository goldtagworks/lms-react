import { Title, Text } from '@mantine/core';
import PageContainer from '@main/components/layout/PageContainer';

const AdminCouponsPage = () => {
    return (
        <PageContainer roleMain py={48}>
            <Title order={2}>관리자 - 쿠폰 관리</Title>
            <Text>전체 쿠폰 목록/관리 (mock)</Text>
        </PageContainer>
    );
};

export default AdminCouponsPage;
