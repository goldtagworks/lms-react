import { Title, Text } from '@mantine/core';
import PageContainer from '@main/components/layout/PageContainer';

const AdminCertificatesPage = () => {
    return (
        <PageContainer roleMain py={48}>
            <Title order={2}>관리자 - 수료증 관리</Title>
            <Text>전체 수료증 목록/관리 (mock)</Text>
        </PageContainer>
    );
};

export default AdminCertificatesPage;
