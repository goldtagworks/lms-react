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
import { useI18n } from '@main/lib/i18n';

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
    // 인라인 제목 편집 상태 (레슨 또는 섹션 공용 id)
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameDraft, setRenameDraft] = useState('');

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

    const { t } = useI18n();

    function guardedNavigate(to: any) {
        if (dirty && !window.confirm(t('course.editPage.save.navigateAwayConfirm'))) return;
        navigateRef.current(to);
    }

    // ----- Course Save -----
    function handleSave() {
        const trimmedTitle = title.trim();

        if (trimmedTitle.length < 2) {
            notifications.show({ color: 'red', title: t('course.editPage.notify.titleNeeded'), message: t('course.editPage.notify.titleNeededMessage') });

            return;
        }
        const { created, course: saved, error } = saveCourseDraft({ id: course?.id, title: trimmedTitle, summary: summary.trim(), description: desc.trim() });

        if (error) {
            notifications.show({ color: 'red', title: t('course.editPage.notify.saveErrorTitle'), message: t('course.editPage.notify.saveErrorMessage') });

            return;
        }
        if (created && saved) {
            notifications.show({
                color: 'teal',
                title: t('course.editPage.notify.createdTitle'),
                message: t('course.editPage.notify.createdMessage')
            });
            // 강사용 편집 경로로 이동 후 레슨 입력창 포커스 유도 쿼리 파라미터 추가
            navigate(`/instructor/courses/${saved.id}/edit?focus=new-lesson`);
            // 새 코스로 이동하면 초기 스냅샷 재설정 (다음 렌더에서 course 갱신 후 useEffect 처리)
        } else {
            notifications.show({ color: 'teal', title: t('course.editPage.notify.savedTitle'), message: t('course.editPage.notify.savedMessage') });
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
        // 인라인 rename 중이면 취소
        if (renamingId) {
            setRenamingId(null);
            setRenameDraft('');
        }
        setEditingLesson(l);
        setLessonModalOpen(true);
    }

    // ----- CRUD: Add / Remove / Move (공통) -----
    function openSectionModal() {
        if (!course) {
            notifications.show({ color: 'red', title: t('course.editPage.notify.courseNeededTitle'), message: t('course.editPage.notify.courseNeededMessage') });

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

    // ----- Inline Rename -----
    function startRename(l: Lesson) {
        // 기존 편집 중이던 제목이 유효(2글자 이상)하고 다른 행이면 자동 저장
        if (renamingId && renamingId !== l.id) {
            const prev = renameDraft.trim();

            if (prev.length >= 2) {
                // 자동 저장 (토스트는 새 rename commit 시 한 번만 보여주도록 suppress)
                patch({ id: renamingId, title: prev });
            }
        }
        setRenamingId(l.id);
        setRenameDraft(l.title);
    }

    function cancelRename() {
        setRenamingId(null);
        setRenameDraft('');
    }

    function commitRename() {
        if (!renamingId) return;
        const trimmedRenameDraft = renameDraft.trim();

        if (trimmedRenameDraft.length < 2) {
            notifications.show({ color: 'red', title: t('course.editPage.notify.renameErrorTitle'), message: t('course.editPage.notify.renameErrorMessage') });

            return;
        }
        patch({ id: renamingId, title: trimmedRenameDraft });
        setRenamingId(null);
        setRenameDraft('');
    }

    const [lessonModalOpen, setLessonModalOpen] = useState(false);

    // useI18n t 사용 (keys already prepared)

    return (
        <PageContainer roleMain py={48} size="lg">
            <Group justify="space-between" mb="lg">
                <Title order={2}>{id ? t('course.editPage.titleEdit') : t('course.editPage.titleCreate')}</Title>
                {id && (
                    <Button component={Link} size="sm" to={`/course/${id}`} variant="light">
                        {t('terms.viewDetails')}
                    </Button>
                )}
            </Group>
            <Stack gap="md">
                <TextInput
                    label={t('course.editPage.field.title')}
                    placeholder={t('course.editPage.field.titlePlaceholder')}
                    size="sm"
                    value={title}
                    onChange={(e) => setTitle(e.currentTarget.value)}
                />
                <TextInput
                    label={t('course.editPage.field.summary')}
                    placeholder={t('course.editPage.field.summaryPlaceholder')}
                    size="sm"
                    value={summary}
                    onChange={(e) => setSummary(e.currentTarget.value)}
                />
                <Textarea
                    label={t('course.editPage.field.desc')}
                    minRows={6}
                    placeholder={t('course.editPage.field.descPlaceholder')}
                    size="sm"
                    value={desc}
                    onChange={(e) => setDesc(e.currentTarget.value)}
                />
                <Card withBorder p="md" radius="lg" shadow="sm">
                    <Stack gap="sm">
                        <Group justify="space-between">
                            <Text fw={600} size="sm">
                                {t('course.editPage.lessons.header')}
                            </Text>
                            {course && (
                                <Badge color="pink" variant="light">
                                    {t('course.editPage.lessons.count', { count: lessons.length })}
                                </Badge>
                            )}
                        </Group>
                        {!course && (
                            <Text c="dimmed" size="sm">
                                {t('course.editPage.lessons.saveFirstHint')}
                            </Text>
                        )}
                        {course && (
                            <>
                                <Group align="flex-end" gap="xs" justify="center">
                                    <TextInput
                                        flex={1}
                                        id="new-lesson-input"
                                        label={t('course.editPage.lessons.newLessonLabel')}
                                        placeholder={t('course.editPage.lessons.newLessonPlaceholder')}
                                        size="sm"
                                        value={newLessonTitle}
                                        onChange={(e) => setNewLessonTitle(e.currentTarget.value)}
                                    />
                                    <Button leftSection={<Plus size={14} />} size="sm" variant="light" onClick={handleAddLesson}>
                                        {t('course.editPage.lessons.addLesson')}
                                    </Button>
                                    <Button leftSection={<Split size={14} />} size="sm" variant="default" onClick={openSectionModal}>
                                        {t('course.editPage.lessons.addSection')}
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
                                                        renameDraft={renameDraft}
                                                        renamingId={renamingId}
                                                        total={orderedLessons.length}
                                                        onDelete={removeRow}
                                                        onEdit={openLessonEdit}
                                                        onMove={moveRow}
                                                        onRenameCancel={cancelRename}
                                                        onRenameChange={setRenameDraft}
                                                        onRenameCommit={commitRename}
                                                        onStartRename={startRename}
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
                                                    renameDraft={renameDraft}
                                                    renamingId={renamingId}
                                                    total={orderedLessons.length}
                                                    onDelete={handleRemoveLesson}
                                                    onEdit={openLessonEdit}
                                                    onMove={moveRow}
                                                    onRenameCancel={cancelRename}
                                                    onRenameChange={setRenameDraft}
                                                    onRenameCommit={commitRename}
                                                    onStartRename={startRename}
                                                    onTogglePreview={togglePreview}
                                                />
                                            );
                                        });
                                    })()}
                                    {lessons.some((l) => l.is_preview) === false && lessons.length > 0 && (
                                        <Text c="dimmed" size="xs">
                                            {t('course.editPage.lessons.noPreview')}
                                        </Text>
                                    )}
                                    {lessons.length === 0 && course && (
                                        <Text c="dimmed" size="xs">
                                            {t('course.editPage.lessons.noLessons')}
                                        </Text>
                                    )}
                                </Stack>
                            </>
                        )}
                    </Stack>
                </Card>
                <Group justify="flex-end" mt="md">
                    <Button disabled={!title.trim()} leftSection={<Save size={14} />} size="xs" onClick={handleSave}>
                        {dirty ? t('course.editPage.save.saveChanges') : t('common.save')}
                    </Button>
                    <Button leftSection={<X size={14} />} size="xs" variant="default" onClick={() => guardedNavigate(-1)}>
                        {dirty ? t('course.editPage.save.cancelChanges') : t('common.cancel')}
                    </Button>
                </Group>
                <Text c="dimmed" size="xs">
                    {t('course.editPage.save.inlineHelp')}
                    {dirty && t('course.editPage.save.unsavedIndicator')}
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
