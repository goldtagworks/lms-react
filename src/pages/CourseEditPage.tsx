import { Container, Title, TextInput, Textarea, Stack, Button, Group, Text } from '@mantine/core';
import { Save, X } from 'lucide-react';
import { notifications } from '@mantine/notifications';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { getCourse, saveCourseDraft } from '@main/lib/repository';

const CourseEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const course = id ? getCourse(id) : undefined;
    const [title, setTitle] = useState(course?.title || '');
    const [summary, setSummary] = useState(course?.summary || '');
    const [desc, setDesc] = useState(course?.description || '');
    // 추천(Featured) 편집은 관리자 전용: CourseDetailPage에서 별도 모달로 관리

    const handleSave = () => {
        const t = title.trim();

        if (t.length < 2) {
            notifications.show({ color: 'red', title: '저장 실패', message: '제목은 2글자 이상이어야 합니다.' });

            return;
        }

        try {
            // 기존 featured 값은 보존 (이 화면에서는 수정 불가)
            const {
                created,
                course: saved,
                error
            } = saveCourseDraft({
                id,
                title: t,
                summary: summary.trim(),
                description: desc.trim(),
                is_featured: course?.is_featured,
                featured_rank: course?.featured_rank,
                featured_badge_text: course?.featured_badge_text
            });

            if (error || !saved) {
                notifications.show({ color: 'red', title: '저장 실패', message: '강의 저장 중 오류가 발생했습니다.' });

                return;
            }

            notifications.show({
                color: 'teal',
                title: created ? '생성 완료' : '저장 완료',
                message: created ? '새 강의가 생성되었습니다.' : '강의가 수정되었습니다.'
            });
            navigate(`/course/${saved.id}`);
        } catch {
            notifications.show({ color: 'red', title: '저장 오류', message: '임시 저장 중 문제가 발생했습니다.' });
        }
    };

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
                <Stack gap="xs">{/* Featured 필드는 여기서 제거 (관리자 전용 별도 UI) */}</Stack>
                <Group justify="flex-end" mt="md">
                    <Button disabled={!title.trim()} leftSection={<Save size={14} />} onClick={handleSave}>
                        저장(목업)
                    </Button>
                    <Button leftSection={<X size={14} />} variant="default" onClick={() => navigate(-1)}>
                        취소
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
