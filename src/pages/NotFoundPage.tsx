import { Container, Title, Text, Button } from '@mantine/core';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
    return (
        <Container py="xl" ta="center">
            <Title mb="md" order={1}>
                404 Not Found
            </Title>
            <Text c="dimmed" mb="lg">
                요청하신 페이지를 찾을 수 없습니다.
            </Text>
            <Button color="primary" component={Link} to="/" variant="filled">
                홈으로 이동
            </Button>
        </Container>
    );
};

export default NotFoundPage;
