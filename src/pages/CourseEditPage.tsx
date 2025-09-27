import type { Lesson } from '@main/types/lesson';

import { Container, Title, TextInput, Textarea, Stack, Button, Group, Text, Card, Divider, ActionIcon, Badge, Select, NumberInput, SegmentedControl } from '@mantine/core';
import { Save, X, Plus, Trash2, ArrowUp, ArrowDown, Split, Star, StarOff, Pencil, Edit } from 'lucide-react';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { getCourse, saveCourseDraft, listLessonsByCourse } from '@main/lib/repository';

const CourseEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const course = id ? getCourse(id) : undefined;
    const [title, setTitle] = useState(course?.title || '');
    const [summary, setSummary] = useState(course?.summary || '');
    const [desc, setDesc] = useState(course?.description || '');
    const [lessons, setLessons] = useState<Lesson[]>(() => (course ? listLessonsByCourse(course.id) : []));
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [editDraft, setEditDraft] = useState<{
        title: string;
        videoType: 'none' | 'youtube' | 'cdn';
        url: string;
        duration: number;
        sectionId: string | null;
        content: string;
        attachments: string;
    } | null>(null);
    const [sections, setSections] = useState<{ id: string; title: string; description?: string; order_index: number }[]>(() => {
        if (!course) return [];
        try {
            const raw = sessionStorage.getItem('lms_sections_v1');

            if (!raw) return [];
            const map = JSON.parse(raw) as Record<string, { id: string; title: string; description?: string; order_index: number }[]>;

            return map[course.id] || [];
        } catch {
            return [];
        }
    }); // 섹션 목업 전용 (퍼시스트)
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
            // 간단: 레슨은 로컬 state만 (실제 구현 시 별도 저장 API 필요)
            navigate(`/course/${saved.id}`);
        } catch {
            notifications.show({ color: 'red', title: '저장 오류', message: '임시 저장 중 문제가 발생했습니다.' });
        }
    };

    function handleAddLesson() {
        if (!course) {
            notifications.show({ color: 'red', message: '먼저 강의를 저장해야 레슨을 추가할 수 있습니다.', title: '코스 필요' });

            return;
        }

        const ttl = newLessonTitle.trim();

        if (ttl.length < 2) {
            notifications.show({ color: 'red', message: '레슨 제목은 2글자 이상', title: '유효성 오류' });

            return;
        }
        const now = new Date().toISOString();
        const lesson: Lesson = {
            id: 'l-' + Date.now().toString(36),
            course_id: course.id,
            title: ttl,
            outline: undefined,
            content_md: undefined,
            content_url: undefined,
            attachments: undefined,
            duration_seconds: 0,
            order_index: lessons.length + 1,
            is_preview: false, // 미리보기 자동 지정 제거 (강사 선택)
            created_at: now,
            updated_at: now
        };
        // sessionStorage 직접 갱신 (정식 API 미구현: demo only)

        try {
            const raw = sessionStorage.getItem('lms_lessons_v1');
            const arr: Lesson[] = raw ? JSON.parse(raw) : [];

            arr.push(lesson);
            sessionStorage.setItem('lms_lessons_v1', JSON.stringify(arr));
            setLessons((prev) => [...prev, lesson]);
            setNewLessonTitle('');
            notifications.show({ color: 'teal', message: '레슨이 추가되었습니다.', title: '추가 완료' });
        } catch {
            notifications.show({ color: 'red', message: '레슨 저장 실패', title: '오류' });
        }
    }

    function handleRemoveLesson(id: string) {
        try {
            const raw = sessionStorage.getItem('lms_lessons_v1');
            let arr: Lesson[] = raw ? JSON.parse(raw) : [];

            arr = arr.filter((l) => l.id !== id);
            sessionStorage.setItem('lms_lessons_v1', JSON.stringify(arr));
            setLessons((prev) => prev.filter((l) => l.id !== id));
            notifications.show({ color: 'teal', message: '레슨이 삭제되었습니다.', title: '삭제 완료' });
        } catch {
            notifications.show({ color: 'red', message: '레슨 삭제 실패', title: '오류' });
        }
    }

    function moveLesson(id: string, dir: 'up' | 'down') {
        setLessons((prev) => {
            const idx = prev.findIndex((l) => l.id === id);

            if (idx < 0) return prev;
            const target = dir === 'up' ? idx - 1 : idx + 1;

            if (target < 0 || target >= prev.length) return prev;
            const copy = [...prev];
            const tmp = copy[idx];

            copy[idx] = copy[target];
            copy[target] = tmp;
            copy.forEach((l, i) => (l.order_index = i + 1));
            try {
                sessionStorage.setItem('lms_lessons_v1', JSON.stringify(copy));
            } catch {}

            return copy;
        });
    }

    function addSection() {
        if (!course) {
            notifications.show({ color: 'red', title: '코스 필요', message: '먼저 강의를 저장하세요.' });

            return;
        }
        let localTitle = '';
        let localDesc = '';

        modals.open({
            title: '새 섹션 추가',
            centered: true,
            withCloseButton: true,
            children: (
                <Stack gap="sm" mt="xs">
                    <TextInput label="섹션 제목" placeholder="예: 섹션 1 - 소개" onChange={(e) => (localTitle = e.currentTarget.value)} />
                    <Textarea label="설명 (선택)" minRows={3} placeholder="이 섹션에서 다루는 내용 요약" onChange={(e) => (localDesc = e.currentTarget.value)} />
                    <Group gap="xs" justify="flex-end" mt="sm">
                        <Button size="xs" variant="default" onClick={() => modals.closeAll()}>
                            취소
                        </Button>
                        <Button
                            disabled={!localTitle.trim()}
                            size="xs"
                            onClick={() => {
                                const title = localTitle.trim();
                                const description = localDesc.trim();

                                if (!title) return;
                                setSections((prev) => {
                                    const next = [...prev, { id: 'sec-' + Date.now().toString(36), title, description: description || undefined, order_index: prev.length + 1 }];

                                    persistSections(course.id, next);

                                    return next;
                                });
                                notifications.show({ color: 'teal', title: '섹션 추가', message: '섹션이 추가되었습니다.' });
                                modals.closeAll();
                            }}
                        >
                            추가
                        </Button>
                    </Group>
                </Stack>
            )
        });
    }

    function openEditSection(secId: string) {
        if (!course) return;
        const target = sections.find((s) => s.id === secId);

        if (!target) return;
        let localTitle = target.title;
        let localDesc = target.description || '';

        modals.open({
            title: '섹션 편집',
            centered: true,
            children: (
                <Stack gap="sm" mt="xs">
                    <TextInput defaultValue={localTitle} label="섹션 제목" onChange={(e) => (localTitle = e.currentTarget.value)} />
                    <Textarea defaultValue={localDesc} label="설명 (선택)" minRows={3} onChange={(e) => (localDesc = e.currentTarget.value)} />
                    <Group gap="xs" justify="flex-end" mt="sm">
                        <Button size="xs" variant="default" onClick={() => modals.closeAll()}>
                            취소
                        </Button>
                        <Button
                            disabled={!localTitle.trim()}
                            size="xs"
                            onClick={() => {
                                const newTitle = localTitle.trim();
                                const newDesc = localDesc.trim();

                                if (!newTitle) return;
                                setSections((prev) => {
                                    const next = prev.map((s) => (s.id === secId ? { ...s, title: newTitle, description: newDesc || undefined } : s));

                                    persistSections(course.id, next);

                                    return next;
                                });
                                notifications.show({ color: 'teal', title: '섹션 수정', message: '저장되었습니다.' });
                                modals.closeAll();
                            }}
                        >
                            저장
                        </Button>
                    </Group>
                </Stack>
            )
        });
    }

    function removeSection(id: string) {
        if (!course) return;
        setSections((prev) => {
            const next = prev.filter((s) => s.id !== id).map((s, idx) => ({ ...s, order_index: idx + 1 }));

            persistSections(course.id, next);

            return next;
        });
        notifications.show({ color: 'teal', title: '섹션 삭제', message: '섹션이 제거되었습니다.' });
    }

    function persistSections(courseId: string, data: { id: string; title: string; description?: string; order_index: number }[]) {
        try {
            const raw = sessionStorage.getItem('lms_sections_v1');
            const map = raw ? (JSON.parse(raw) as Record<string, any>) : {};

            map[courseId] = data;
            sessionStorage.setItem('lms_sections_v1', JSON.stringify(map));
        } catch {}
    }

    function togglePreview(lessonId: string) {
        setLessons((prev) => {
            const target = prev.find((l) => l.id === lessonId);

            if (!target) return prev;

            const willUnset = target.is_preview; // 이미 preview면 해제
            const next = prev.map((l) => ({ ...l, is_preview: willUnset ? false : l.id === lessonId }));

            try {
                sessionStorage.setItem('lms_lessons_v1', JSON.stringify(next));
            } catch {}

            if (willUnset) {
                notifications.show({ color: 'gray', title: '미리보기 해제', message: '현재 강의는 미리보기 없이 저장됩니다.' });
            } else {
                notifications.show({ color: 'teal', title: '미리보기 지정', message: '해당 레슨이 미리보기로 설정되었습니다.' });
            }

            return next;
        });
    }

    function openLessonEdit(l: Lesson) {
        // derive video type from url heuristic
        const vt: 'none' | 'youtube' | 'cdn' = !l.content_url ? 'none' : /youtu\.be|youtube\.com/.test(l.content_url) ? 'youtube' : 'cdn';
        // set editing target

        setEditingLesson(l);
        setEditDraft({
            title: l.title,
            videoType: vt,
            url: l.content_url || '',
            duration: l.duration_seconds || 0,
            sectionId: l.section_id || null,
            content: l.content_md || '',
            attachments: Array.isArray(l.attachments) ? (l.attachments as any[]).join(',') : ''
        });
        modals.open({
            modalId: 'lesson-edit',
            title: '레슨 편집',
            centered: true,
            size: 'lg',
            onClose: () => {
                setEditingLesson(null);
                setEditDraft(null);
            },
            children: editDraftUI()
        });
    }

    function persistLessons(next: Lesson[]) {
        try {
            sessionStorage.setItem('lms_lessons_v1', JSON.stringify(next));
        } catch {}
    }

    function saveLessonEdit() {
        if (!editingLesson || !editDraft) return;
        const { title, videoType, url, duration, sectionId, content, attachments } = editDraft;
        const t = title.trim();

        if (t.length < 2) {
            notifications.show({ color: 'red', title: '유효성 오류', message: '제목 2글자 이상' });

            return;
        }

        if (videoType !== 'none' && !url.trim()) {
            notifications.show({ color: 'red', title: '유효성 오류', message: '영상 URL을 입력하세요.' });

            return;
        }

        if (videoType === 'youtube' && url && !/youtu\.be|youtube\.com/.test(url)) {
            notifications.show({ color: 'red', title: 'URL 형식', message: 'YouTube 링크가 아닙니다.' });

            return;
        }
        setLessons((prev) => {
            const next = prev.map((l) =>
                l.id === editingLesson.id
                    ? {
                          ...l,
                          title: t,
                          content_url: videoType === 'none' ? undefined : url.trim(),
                          duration_seconds: duration || 0,
                          section_id: sectionId || undefined,
                          content_md: content.trim() || undefined,
                          attachments: attachments
                              ? attachments
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                              : undefined,
                          updated_at: new Date().toISOString()
                      }
                    : l
            );

            persistLessons(next);

            return next;
        });
        notifications.show({ color: 'teal', title: '레슨 수정', message: '저장되었습니다.' });
        modals.close('lesson-edit');
    }

    function editDraftUI() {
        if (!editDraft) return null;
        const sectionOptions = sections
            .slice()
            .sort((a, b) => a.order_index - b.order_index)
            .map((s) => ({ value: s.id, label: s.title }));

        return (
            <Stack gap="sm" mt="xs">
                <TextInput label="제목" value={editDraft.title} onChange={(e) => setEditDraft((d) => (d ? { ...d, title: e.currentTarget.value } : d))} />
                <SegmentedControl
                    fullWidth
                    data={[
                        { label: '영상 없음', value: 'none' },
                        { label: 'YouTube', value: 'youtube' },
                        { label: 'CDN/기타', value: 'cdn' }
                    ]}
                    value={editDraft.videoType}
                    onChange={(v: any) => setEditDraft((d) => (d ? { ...d, videoType: v } : d))}
                />
                {editDraft.videoType !== 'none' && (
                    <TextInput
                        label={editDraft.videoType === 'youtube' ? 'YouTube URL' : '영상 URL'}
                        placeholder={editDraft.videoType === 'youtube' ? 'https://youtu.be/...' : 'https://cdn.example.com/video.mp4'}
                        value={editDraft.url}
                        onChange={(e) => setEditDraft((d) => (d ? { ...d, url: e.currentTarget.value } : d))}
                    />
                )}
                <NumberInput label="길이(초)" min={0} value={editDraft.duration} onChange={(v) => setEditDraft((d) => (d ? { ...d, duration: Number(v) || 0 } : d))} />
                <Select
                    clearable
                    data={sectionOptions}
                    label="섹션"
                    placeholder="(없음)"
                    value={editDraft.sectionId || null}
                    onChange={(v) => setEditDraft((d) => (d ? { ...d, sectionId: v || null } : d))}
                />
                <Textarea
                    label="본문(Markdown)"
                    minRows={4}
                    placeholder="# 제목\n내용 ..."
                    value={editDraft.content}
                    onChange={(e) => setEditDraft((d) => (d ? { ...d, content: e.currentTarget.value } : d))}
                />
                <TextInput
                    label="첨부 (쉼표 구분)"
                    placeholder="file1.pdf, link2"
                    value={editDraft.attachments}
                    onChange={(e) => setEditDraft((d) => (d ? { ...d, attachments: e.currentTarget.value } : d))}
                />
                <Group justify="flex-end" mt="sm">
                    <Button variant="default" onClick={() => modals.close('lesson-edit')}>
                        닫기
                    </Button>
                    <Button onClick={saveLessonEdit}>저장</Button>
                </Group>
            </Stack>
        );
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
                <Stack gap="xs">{/* Featured 필드는 여기서 제거 (관리자 전용 별도 UI) */}</Stack>

                <Card withBorder p="md" radius="md" shadow="sm">
                    <Stack gap="sm">
                        <Group justify="space-between">
                            <Text fw={600} size="sm">
                                레슨 & 섹션 (목업)
                            </Text>
                            {course && (
                                <Badge color="pink" variant="light">
                                    {lessons.length}개
                                </Badge>
                            )}
                        </Group>
                        {!course && (
                            <Text c="dimmed" size="xs">
                                강의를 먼저 저장하면 레슨을 추가할 수 있습니다.
                            </Text>
                        )}
                        {course && (
                            <>
                                <Group align="flex-end" gap="xs">
                                    <TextInput flex={1} label="새 레슨 제목" placeholder="예: 1. 소개" value={newLessonTitle} onChange={(e) => setNewLessonTitle(e.currentTarget.value)} />
                                    <Button leftSection={<Plus size={14} />} variant="light" onClick={handleAddLesson}>
                                        레슨 추가
                                    </Button>
                                    <Button leftSection={<Split size={14} />} variant="default" onClick={addSection}>
                                        섹션 추가
                                    </Button>
                                </Group>
                                <Divider my={4} />
                                <Stack gap={8}>
                                    {sections
                                        .slice()
                                        .sort((a, b) => a.order_index - b.order_index)
                                        .map((s) => (
                                            <Group key={s.id} gap={6} wrap="nowrap">
                                                <Badge color="gray" size="sm" variant="outline">
                                                    섹션
                                                </Badge>
                                                <Text flex={1} fw={600} size="sm">
                                                    {s.order_index}. {s.title}{' '}
                                                    {s.description && (
                                                        <Text c="dimmed" component="span" fw={400} size="xs">
                                                            — {s.description}
                                                        </Text>
                                                    )}
                                                </Text>
                                                <ActionIcon aria-label="섹션 편집" variant="subtle" onClick={() => openEditSection(s.id)}>
                                                    <Edit size={16} />
                                                </ActionIcon>
                                                <ActionIcon aria-label="섹션 삭제" color="red" variant="subtle" onClick={() => removeSection(s.id)}>
                                                    <Trash2 size={16} />
                                                </ActionIcon>
                                            </Group>
                                        ))}
                                    {lessons.some((l) => l.is_preview) === false && lessons.length > 0 && (
                                        <Text c="dimmed" size="xs">
                                            현재 미리보기 레슨이 없습니다. (선택은 옵션)
                                        </Text>
                                    )}
                                    {lessons.map((l, i) => (
                                        <Group key={l.id} gap={4} wrap="nowrap">
                                            <ActionIcon
                                                aria-label={l.is_preview ? '미리보기 해제' : '미리보기 지정'}
                                                color={l.is_preview ? 'yellow' : 'gray'}
                                                variant="subtle"
                                                onClick={() => togglePreview(l.id)}
                                            >
                                                {l.is_preview ? <Star size={16} /> : <StarOff size={16} />}
                                            </ActionIcon>
                                            <ActionIcon aria-label="위로" disabled={i === 0} variant="subtle" onClick={() => moveLesson(l.id, 'up')}>
                                                <ArrowUp size={16} />
                                            </ActionIcon>
                                            <ActionIcon aria-label="아래로" disabled={i === lessons.length - 1} variant="subtle" onClick={() => moveLesson(l.id, 'down')}>
                                                <ArrowDown size={16} />
                                            </ActionIcon>

                                            <Text flex={1} size="sm">
                                                {l.order_index}. {l.title}{' '}
                                                {l.is_preview && (
                                                    <Badge color="teal" size="xs" variant="light">
                                                        미리보기
                                                    </Badge>
                                                )}
                                                <Text c="dimmed" component="span" ml={6} size="xs">
                                                    {l.content_url ? (/youtu\.be|youtube\.com/.test(l.content_url) ? 'YouTube' : 'Video') : '—'} {l.duration_seconds ? `• ${l.duration_seconds}s` : ''}
                                                </Text>
                                            </Text>
                                            <ActionIcon aria-label="레슨 편집" variant="subtle" onClick={() => openLessonEdit(l)}>
                                                <Pencil size={16} />
                                            </ActionIcon>
                                            <ActionIcon aria-label="레슨 삭제" color="red" variant="subtle" onClick={() => handleRemoveLesson(l.id)}>
                                                <Trash2 size={16} />
                                            </ActionIcon>
                                        </Group>
                                    ))}
                                    {lessons.length === 0 && course && (
                                        <Text c="dimmed" size="xs">
                                            아직 레슨이 없습니다. 첫 레슨을 추가하세요.
                                        </Text>
                                    )}
                                </Stack>
                            </>
                        )}
                    </Stack>
                </Card>
                <Group justify="flex-end" mt="md">
                    <Button disabled={!title.trim()} leftSection={<Save size={14} />} onClick={handleSave}>
                        저장(목업)
                    </Button>
                    <Button leftSection={<X size={14} />} variant="default" onClick={() => navigate(-1)}>
                        취소
                    </Button>
                </Group>
                <Text c="dimmed" size="xs">
                    실제 서비스에서는 드래그 정렬 / 섹션 내부 레슨 이동 / 섹션 설명 & 잠금 조건 / 미리보기 토글 / 다중 편집 등이 제공됩니다. (현재: 화살표 이동 + 섹션 추가/삭제 목업)
                </Text>
            </Stack>
        </Container>
    );
};

export default CourseEditPage;
