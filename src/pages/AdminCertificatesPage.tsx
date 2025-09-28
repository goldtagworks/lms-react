import { Title, Text } from '@mantine/core';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';

const AdminCertificatesPage = () => {
    return (
        <PageContainer roleMain py={48}>
            <PageHeader description="강사 신청을 검토/승인/반려/회수 관리합니다." title="사용자 관리" />

            <Title order={2}>관리자 - 수료증 관리</Title>
            <Text>전체 수료증 목록/관리 (mock)</Text>
        </PageContainer>
    );
};

export default AdminCertificatesPage;
