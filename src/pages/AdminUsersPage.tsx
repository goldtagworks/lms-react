import { Title, Text } from '@mantine/core';
import PageContainer from '@main/components/layout/PageContainer';

const AdminUsersPage = () => {
    return (
        <PageContainer roleMain py={48}>
            <Title order={2}>관리자 - 사용자 관리</Title>
            <Text>전체 사용자 목록/관리 (mock)</Text>
        </PageContainer>
    );
};

export default AdminUsersPage;
