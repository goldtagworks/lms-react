import { Container, Title, Text, Button, Group } from '@mantine/core';
import { Link } from 'react-router-dom';

export default function MyPage() {
    return (
        <Container py="xl">
            <Title order={2}>마이페이지</Title>
            <Text mb="md">내 정보, 수강 내역, 수료증, 위시리스트 등</Text>
            <Group gap="md">
                <Button component={Link} to="/courses" variant="light">
                    코스 목록
                </Button>
                <Button component={Link} to="/my/wishlist" variant="light">
                    위시리스트
                </Button>
                <Button component={Link} to="/certificate/1" variant="light">
                    수료증 예시
                </Button>
                <Button component={Link} to="/" variant="outline">
                    홈으로
                </Button>
            </Group>
        </Container>
    );
}
