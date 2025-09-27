import { Container, Title, TextInput, Textarea, Stack, Button, Group, Text } from '@mantine/core';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { getCourse, loadCourses } from '@main/lib/repository';

const CourseEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const course = id ? getCourse(id) : undefined;
    const [title, setTitle] = useState(course?.title || '');
    const [summary, setSummary] = useState(course?.summary || '');
    const [desc, setDesc] = useState(course?.description || '');

    function handleSave() {
        const list = loadCourses();

        if (id) {
            const idx = list.findIndex((c) => c.id === id);

            if (idx >= 0) {
                list[idx] = { ...list[idx], title: title.trim(), summary: summary.trim(), description: desc.trim(), updated_at: new Date().toISOString() };
            }
            sessionStorage.setItem('lms_courses_v1', JSON.stringify(list));
            navigate(`/course/${id}`);
        } else {
            const newId = 'c' + (list.length + 1);

            list.push({
                ...list[0],
                id: newId,
                title: title.trim() || '새 강의',
                summary: summary.trim(),
                description: desc.trim(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            sessionStorage.setItem('lms_courses_v1', JSON.stringify(list));
            navigate(`/course/${newId}`);
        }
    }

    return (
        <Container py="xl">
            <Group justify="space-between" mb="lg">
                <Title order={2}>{id ? '코스 수정' : '새 코스 작성'}</Title>
                {id && (
                    <Button component={Link} size="xs" to={`/course/${id}`} variant="light">
                        상세 보기
                    </Button>
                )}
            </Group>
            <Stack gap="md" maw={720}>
                <TextInput label="제목" placeholder="코스 제목" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
                <TextInput label="요약" placeholder="간단 요약" value={summary} onChange={(e) => setSummary(e.currentTarget.value)} />
                <Textarea label="상세 설명" minRows={6} placeholder="코스 상세" value={desc} onChange={(e) => setDesc(e.currentTarget.value)} />
                <Group justify="flex-end">
                    <Button disabled={!title.trim()} onClick={handleSave}>
                        저장(목업)
                    </Button>
                </Group>
                <Text c="dimmed" size="xs">
                    실제 서비스에서는 버전 관리 / 섹션 & 레슨 편집 / 가격 정책 편집이 별도 폼으로 구성됩니다.
                </Text>
            </Stack>
        </Container>
    );
};

export default CourseEditPage;
