import { Container, Title, Text } from '@mantine/core';
import { useParams } from 'react-router-dom';

const CourseEditPage = () => {
    const { id } = useParams();

    return (
        <Container py="xl">
            <Title order={2}>코스 정보 수정</Title>
            <Text>코스 ID: {id}</Text>
            <Text>코스 정보/커리큘럼 편집 영역 (mock)</Text>
        </Container>
    );
};

export default CourseEditPage;
