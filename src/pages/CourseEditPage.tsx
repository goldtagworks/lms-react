import type { Lesson } from '@main/types/lesson';

import { Title, TextInput, Textarea, Stack, Button, Group, Text, Card, Divider, Badge } from '@mantine/core';
import { Save, X, Plus, Split } from 'lucide-react';
// Modal for lesson editing extracted
import LessonEditModal from '@main/features/lessons/LessonEditModal';
import SectionHeaderAddModal from '@main/features/lessons/SectionHeaderAddModal';
import { useLessonsState } from '@main/features/lessons/useLessonsState';
import { LessonRow, SectionRow } from '@main/features/lessons/LessonRows';
import { notifications } from '@mantine/notifications';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { getCourse, saveCourseDraft } from '@main/lib/repository';
import PageContainer from '@main/components/layout/PageContainer';

// NOTE: 섹션 전용 구조 제거 → is_section=true 인 Lesson Row 가 섹션 헤더 역할.
// 이전 lms_sections_v1 마이그레이션 로직 제거 (사용 안함)

const CourseEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const course = id ? getCourse(id) : undefined;
    const [title, setTitle] = useState(course?.title || '');
    const [summary, setSummary] = useState(course?.summary || '');
    const [desc, setDesc] = useState(course?.description || '');
    const { lessons, orderedLessons, addLesson, addSection, removeLesson, move, togglePreview, patch } = useLessonsState(course?.id);
    // newLessonTitle: 입력값만 페이지에서 관리
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [sectionModalOpen, setSectionModalOpen] = useState(false);

    // ----- Dirty Guard -----
    // 초기 스냅샷 (코스 생성 전이면 빈 상태)
    const initialSnapshotRef = useRef<string>('');
    const [dirty, setDirty] = useState(false);

    // snapshot 구성: course text fields + lessons JSON (id,title,is_section,order_index,content_md)
    function computeSnapshot(): string {
        const lessonShape = orderedLessons.map((l) => ({ id: l.id, title: l.title, is_section: !!l.is_section, order_index: l.order_index, content_md: l.content_md }));

        return JSON.stringify({ title, summary, desc, lessons: lessonShape });
    }

    // 최초 진입 시 스냅샷 설정 (코스 있을 때만)
    useEffect(() => {
        if (course && initialSnapshotRef.current === '') {
            initialSnapshotRef.current = computeSnapshot();
        }
    }, [course]);

    // 변경 감지
    useEffect(() => {
        if (!course) return; // 새 코스 작성 중에는 저장 전 이동 자유
        if (initialSnapshotRef.current === '') return; // 아직 초기 설정 안됨
        const nowSnap = computeSnapshot();

        setDirty(nowSnap !== initialSnapshotRef.current);
    }, [title, summary, desc, orderedLessons, course]);

    // beforeunload 브라우저 이탈 방지
    useEffect(() => {
        function handleBeforeUnload(e: BeforeUnloadEvent) {
            if (!dirty) return;
            e.preventDefault();
            e.returnValue = '';
        }
        if (dirty) window.addEventListener('beforeunload', handleBeforeUnload);

        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [dirty]);

    // 라우터 내 네비게이션 가드 (간단 confirm) - navigate(-1) / Link 등에 공통 적용 위해 window.confirm 활용
    const navigateRef = useRef(navigate);

    navigateRef.current = navigate; // 최신 참조

    function guardedNavigate(to: any) {
        if (dirty && !window.confirm('변경사항이 저장되지 않았습니다. 이동하시겠습니까?')) return;
        navigateRef.current(to);
    }

    // ----- Course Save -----
    function handleSave() {
        const t = title.trim();

        if (t.length < 2) {
            notifications.show({ color: 'red', title: '제목 필요', message: '제목 2글자 이상 입력' });

            return;
        }
        const { created, course: saved, error } = saveCourseDraft({ id: course?.id, title: t, summary: summary.trim(), description: desc.trim() });

        if (error) {
            notifications.show({ color: 'red', title: '저장 실패', message: error });

            return;
        }
        if (created && saved) {
            notifications.show({
                color: 'teal',
                title: '코스 생성',
                message: '새 코스가 생성되었습니다. 첫 레슨을 바로 추가해보세요.'
            });
            // 강사용 편집 경로로 이동 후 레슨 입력창 포커스 유도 쿼리 파라미터 추가
            navigate(`/instructor/courses/${saved.id}/edit?focus=new-lesson`);
            // 새 코스로 이동하면 초기 스냅샷 재설정 (다음 렌더에서 course 갱신 후 useEffect 처리)
        } else {
            notifications.show({ color: 'teal', title: '저장 완료', message: '코스가 저장되었습니다.' });
            // 스냅샷 갱신
            initialSnapshotRef.current = computeSnapshot();
            setDirty(false);
        }
    }

    // ----- Lessons CRUD -----
    function handleAddLesson() {
        if (addLesson(newLessonTitle)) {
            setNewLessonTitle('');
        }
    }

    function handleRemoveLesson(lessonId: string) {
        removeLesson(lessonId);
    }

    // ----- Lesson Edit Modal -----
    function openLessonEdit(l: Lesson) {
        setEditingLesson(l);
        setLessonModalOpen(true);
    }

    // ----- CRUD: Add / Remove / Move (공통) -----
    function openSectionModal() {
        if (!course) {
            notifications.show({ color: 'red', title: '코스 필요', message: '먼저 코스를 저장하세요.' });

            return;
        }

        setSectionModalOpen(true);
    }

    function removeRow(lessonId: string) {
        handleRemoveLesson(lessonId); // 재사용 (섹션/레슨 동일)
    }

    function moveRow(id: string, dir: 'up' | 'down') {
        move(id, dir);
    }

    const [lessonModalOpen, setLessonModalOpen] = useState(false);

    return (
        <PageContainer roleMain py={48} size="lg">
            <Group justify="space-between" mb="lg">
                <Title order={2}>{id ? '코스 수정' : '새 코스 작성'}</Title>
                {id && (
                    <Button component={Link} size="xs" to={`/course/${id}`} variant="light">
                        상세 보기
                    </Button>
                )}
            </Group>
            <Stack gap="md">
                <TextInput label="제목" placeholder="코스 제목" size="sm" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
                <TextInput label="요약" placeholder="간단 요약" size="sm" value={summary} onChange={(e) => setSummary(e.currentTarget.value)} />
                <Textarea label="상세 설명" minRows={6} placeholder="코스 상세" size="sm" value={desc} onChange={(e) => setDesc(e.currentTarget.value)} />
                <Card withBorder p="md" radius="md" shadow="sm">
                    <Stack gap="sm">
                        <Group justify="space-between">
                            <Text fw={600} size="sm">
                                섹션 & 레슨 (목업)
                            </Text>
                            {course && (
                                <Badge color="pink" variant="light">
                                    {lessons.length}개 레슨
                                </Badge>
                            )}
                        </Group>
                        {!course && (
                            <Text c="dimmed" size="xs">
                                코스를 먼저 저장하면 레슨/섹션을 추가할 수 있습니다.
                            </Text>
                        )}
                        {course && (
                            <>
                                <Group align="flex-end" gap="xs">
                                    <TextInput
                                        flex={1}
                                        id="new-lesson-input"
                                        label="새 레슨 제목"
                                        placeholder="예: 1. 소개"
                                        size="sm"
                                        value={newLessonTitle}
                                        onChange={(e) => setNewLessonTitle(e.currentTarget.value)}
                                    />
                                    <Button leftSection={<Plus size={14} />} size="xs" variant="light" onClick={handleAddLesson}>
                                        레슨 추가
                                    </Button>
                                    <Button leftSection={<Split size={14} />} size="xs" variant="default" onClick={openSectionModal}>
                                        섹션 구분 추가
                                    </Button>
                                </Group>
                                <Divider my={6} />
                                <Stack gap={10}>
                                    {(() => {
                                        let sectionCounter = 0;
                                        let lessonCounterWithinSection = 0;

                                        return orderedLessons.map((row, idx) => {
                                            if (row.is_section) {
                                                sectionCounter += 1;
                                                lessonCounterWithinSection = 0; // reset for new section

                                                return (
                                                    <SectionRow
                                                        key={row.id}
                                                        displayIndex={sectionCounter}
                                                        index={idx}
                                                        lesson={row}
                                                        total={orderedLessons.length}
                                                        onDelete={removeRow}
                                                        onEdit={openLessonEdit}
                                                        onMove={moveRow}
                                                    />
                                                );
                                            }
                                            lessonCounterWithinSection += 1;
                                            const composite = sectionCounter > 0 ? `${sectionCounter}-${lessonCounterWithinSection}` : String(lessonCounterWithinSection);

                                            return (
                                                <LessonRow
                                                    key={row.id}
                                                    displayIndex={composite}
                                                    index={idx}
                                                    lesson={row}
                                                    total={orderedLessons.length}
                                                    onDelete={handleRemoveLesson}
                                                    onEdit={openLessonEdit}
                                                    onMove={moveRow}
                                                    onTogglePreview={togglePreview}
                                                />
                                            );
                                        });
                                    })()}
                                    {lessons.some((l) => l.is_preview) === false && lessons.length > 0 && (
                                        <Text c="dimmed" size="xs">
                                            현재 미리보기 레슨이 없습니다. (선택은 옵션)
                                        </Text>
                                    )}
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
                    <Button disabled={!title.trim()} leftSection={<Save size={14} />} size="xs" onClick={handleSave}>
                        {dirty ? '변경 저장' : '저장(목업)'}
                    </Button>
                    <Button leftSection={<X size={14} />} size="xs" variant="default" onClick={() => guardedNavigate(-1)}>
                        {dirty ? '변경 취소' : '취소'}
                    </Button>
                </Group>
                <Text c="dimmed" size="xs">
                    단순화된 목업: 섹션은 is_section 플래그를 가진 헤더 행입니다. (드래그 정렬 / 고급 필드 추후) {dirty && ' · 미저장 변경 있음'}
                </Text>
                <LessonEditModal
                    lesson={editingLesson}
                    opened={lessonModalOpen && !!editingLesson}
                    onClose={() => {
                        setLessonModalOpen(false);
                        setEditingLesson(null);
                    }}
                    onSave={(p) => {
                        patch(p);
                        setEditingLesson(null);
                        setLessonModalOpen(false);
                    }}
                />
                <SectionHeaderAddModal
                    opened={sectionModalOpen}
                    onAdd={(title) => {
                        addSection(title);
                    }}
                    onClose={() => setSectionModalOpen(false)}
                />
            </Stack>
        </PageContainer>
    );
};

export default CourseEditPage;
