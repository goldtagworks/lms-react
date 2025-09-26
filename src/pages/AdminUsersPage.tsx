import { Container, Title, Text } from '@mantine/core';

const AdminUsersPage = () => {
    return (
        <Container py="xl">
            <Title order={2}>관리자 - 사용자 관리</Title>
            <Text>전체 사용자 목록/관리 (mock)</Text>
        </Container>
    );
};

export default AdminUsersPage;
