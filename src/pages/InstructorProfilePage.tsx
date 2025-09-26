import { Container, Title, Text } from '@mantine/core';
import { useParams } from 'react-router-dom';

const InstructorProfilePage = () => {
    const { id } = useParams();

    return (
        <Container py="xl">
            <Title order={2}>강사 프로필</Title>
            <Text>강사 ID: {id}</Text>
            <Text>이름: 홍길동</Text>
            <Text>소개: React, TypeScript 전문 강사</Text>
        </Container>
    );
};

export default InstructorProfilePage;
