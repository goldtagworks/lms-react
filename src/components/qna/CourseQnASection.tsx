import { useState } from 'react';
import { ActionIcon, Badge, Box, Button, Card, Collapse, Divider, Group, Pagination, Stack, Switch, Textarea, TextInput } from '@mantine/core';
import { TextTitle, TextBody, TextMeta } from '@main/components/typography';
import { useAnswerQuestion, useAskQuestion, useCourseQuestions, useQuestionAnswers, useResolveQuestion, useUpdateQuestion, useQuestionPrivacy } from '@main/hooks/useCourseQnA';
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useI18n } from '@main/lib/i18n';

interface Props {
    courseId: string;
    userId?: string;
    userRole?: string;
    enrolled: boolean;
    isInstructor: boolean;
}

export default function CourseQnASection({ courseId, userId, userRole, enrolled, isInstructor }: Props) {
    const { t } = useI18n();
    const [page, setPage] = useState(1);
    const pageSize = 5;
    const { questions, pageCount, total } = useCourseQuestions(courseId, { page, pageSize, viewerId: userId });
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const { mutate: ask, error: askError } = useAskQuestion(courseId, userId);
    const { mutate: resolveQ } = useResolveQuestion(userRole);
    const [expanded, setExpanded] = useState<string | null>(null);

    const canAsk = enrolled && !!userId;
    const canResolve = userRole === 'instructor' || userRole === 'admin';

    const handleAsk = () => {
        if (!canAsk) return;
        const q = ask(title.trim(), body.trim(), isPrivate);

        if (q) {
            setTitle('');
            setBody('');
            setIsPrivate(false);

            if (page !== 1) setPage(1); // 새 질문은 최신순 맨 앞 (단순 가정)
        }
    };

    return (
        <Stack gap="lg">
            <Group justify="space-between">
                <TextTitle fw={600} sizeOverride="md">
                    {t('qna.total', { count: total }, `전체 질문 ${total}개`)}
                </TextTitle>
                {pageCount > 1 && <Pagination size="sm" total={pageCount} value={page} onChange={setPage} />}
            </Group>
            <Box>
                <TextTitle fw={600} mb={6}>
                    {t('qna.ask', undefined, '질문 작성')}
                </TextTitle>
                {!canAsk && <TextBody c="dimmed">{t('qna.onlyEnrolled', undefined, '수강 중인 사용자만 질문을 작성할 수 있습니다')}</TextBody>}
                {canAsk && (
                    <Card withBorder p="md" radius="md">
                        <TextInput mb="xs" placeholder={t('qna.titlePlaceholder', undefined, '제목')} size="sm" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
                        <Textarea autosize minRows={3} placeholder={t('qna.bodyPlaceholder', undefined, '본문을 입력하세요')} value={body} onChange={(e) => setBody(e.currentTarget.value)} />
                        <Group justify="space-between" mt="xs">
                            <Switch checked={isPrivate} label={t('qna.privateOnlyMe', undefined, '비공개 (나만 보기)')} size="sm" onChange={(e) => setIsPrivate(e.currentTarget.checked)} />
                            <Group gap="xs">
                                {askError && (
                                    <Badge color="red" size="xs" variant="light">
                                        {askError}
                                    </Badge>
                                )}
                                <Button disabled={!title.trim() || !body.trim()} size="sm" onClick={handleAsk}>
                                    {t('qna.register', undefined, '등록')}
                                </Button>
                            </Group>
                        </Group>
                    </Card>
                )}
            </Box>
            <Divider />
            <Stack gap="sm">
                {questions.length === 0 && <TextBody c="dimmed">{t('qna.noQuestions', undefined, '아직 질문이 없습니다')}</TextBody>}
                {questions.map((q) => {
                    return (
                        <QuestionItem
                            key={q.id}
                            body={q.body}
                            canResolve={canResolve}
                            createdAt={q.created_at}
                            expanded={expanded === q.id}
                            isInstructor={isInstructor}
                            isPrivate={(q as any).is_private}
                            isResolved={q.is_resolved}
                            questionId={q.id}
                            title={q.title}
                            userId={userId}
                            onResolve={() => resolveQ(q.id)}
                            onToggle={() => setExpanded(expanded === q.id ? null : q.id)}
                        />
                    );
                })}
            </Stack>
        </Stack>
    );
}

interface QuestionItemProps {
    questionId: string;
    title: string;
    body: string;
    createdAt: string;
    isResolved: boolean;
    canResolve: boolean;
    onResolve: () => void;
    userId?: string;
    isInstructor: boolean;
    expanded: boolean;
    onToggle: () => void;
    isPrivate?: boolean;
}

function QuestionItem({ questionId, title, body, createdAt, isResolved, canResolve, onResolve, userId, isInstructor, expanded, onToggle, isPrivate }: QuestionItemProps) {
    const { t } = useI18n();
    const { answers } = useQuestionAnswers(expanded ? questionId : undefined);
    const { mutate: answer, error } = useAnswerQuestion(questionId, userId, isInstructor);
    const { mutate: updateQ, error: updateError } = useUpdateQuestion(userId);
    const { mutate: togglePrivacy, error: privacyError } = useQuestionPrivacy(userId);
    const [answerBody, setAnswerBody] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editTitle, setEditTitle] = useState(title);
    const [editBody, setEditBody] = useState(body);
    const [localPrivate, setLocalPrivate] = useState(!!isPrivate);

    const canAnswer = !!userId; // 단순 정책: 로그인 사용자 모두 (향후 조건 강화 가능)
    // owner check: based on question user (passed indirectly by inability to edit if answers exist) - simplified to user ownership handled server-side later

    const startEdit = () => {
        setEditMode(true);
        setEditTitle(title);
        setEditBody(body);
        setLocalPrivate(!!isPrivate);
    };

    const cancelEdit = () => {
        setEditMode(false);
    };

    const saveEdit = () => {
        if (!userId) return;
        const updated = updateQ(questionId, editTitle.trim(), editBody.trim());

        if (updated) {
            if (localPrivate !== !!isPrivate) togglePrivacy(questionId, localPrivate);

            setEditMode(false);
        }
    };

    const submitAnswer = () => {
        if (!canAnswer || !answerBody.trim()) return;
        const a = answer(answerBody.trim());

        if (a) setAnswerBody('');
    };

    return (
        <Card withBorder p="sm" radius="md">
            <Group align="flex-start" justify="space-between" mb={4} wrap="nowrap">
                <Box style={{ flex: 1 }}>
                    <Group align="center" gap={6} mb={4} wrap="nowrap">
                        {!editMode && (
                            <TextBody fw={600} style={{ lineHeight: 1.2 }}>
                                {title}
                            </TextBody>
                        )}
                        {editMode && <TextInput size="sm" value={editTitle} onChange={(e) => setEditTitle(e.currentTarget.value)} />}
                        {isResolved && (
                            <Badge color="green" leftSection={<CheckCircle2 size={12} />} size="xs" variant="light">
                                {t('qna.resolved', undefined, '해결됨')}
                            </Badge>
                        )}
                        {isPrivate && !editMode && (
                            <Badge color="gray" size="xs" variant="light">
                                {t('qna.private', undefined, '비공개')}
                            </Badge>
                        )}
                        {editMode && <Switch checked={localPrivate} label={t('qna.private', undefined, '비공개')} size="xs" onChange={(e) => setLocalPrivate(e.currentTarget.checked)} />}
                    </Group>
                    <TextMeta mb={6}>{new Date(createdAt).toLocaleDateString()}</TextMeta>
                    {!editMode && (
                        <TextBody lh={1.5} style={{ whiteSpace: 'pre-line' }}>
                            {body}
                        </TextBody>
                    )}
                    {editMode && <Textarea autosize minRows={3} size="sm" value={editBody} onChange={(e) => setEditBody(e.currentTarget.value)} />}
                    {editMode && (updateError || privacyError) && (
                        <Badge color="red" mt={4} size="xs" variant="light">
                            {updateError || privacyError}
                        </Badge>
                    )}
                </Box>
                <Group gap={4} wrap="nowrap">
                    {canResolve && !isResolved && (
                        <Button size="sm" variant="light" onClick={onResolve}>
                            {t('qna.solve', undefined, '해결')}
                        </Button>
                    )}
                    {!isResolved && !editMode && isPrivate !== undefined && (
                        <Button size="sm" variant="subtle" onClick={startEdit}>
                            {t('qna.edit', undefined, '수정')}
                        </Button>
                    )}
                    {editMode && (
                        <Group gap={4} wrap="nowrap">
                            <Button color="gray" size="sm" variant="subtle" onClick={cancelEdit}>
                                {t('qna.cancel', undefined, '취소')}
                            </Button>
                            <Button size="sm" variant="light" onClick={saveEdit}>
                                {t('qna.save', undefined, '저장')}
                            </Button>
                        </Group>
                    )}
                    <ActionIcon aria-label={expanded ? t('common.collapse', undefined, '접기') : t('common.expand', undefined, '펼치기')} variant="subtle" onClick={onToggle}>
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </ActionIcon>
                </Group>
            </Group>
            <Collapse in={expanded}>
                <Divider my={8} />
                <Stack gap="xs">
                    {answers.map((a) => (
                        <Card key={a.id} withBorder p="xs" radius="sm">
                            <Group align="center" gap={6} mb={4} wrap="nowrap">
                                {a.is_instructor_answer && (
                                    <Badge color="blue" size="xs" variant="light">
                                        {t('qna.instructor', undefined, '강사')}
                                    </Badge>
                                )}
                                <TextMeta>{new Date(a.created_at).toLocaleDateString()}</TextMeta>
                            </Group>
                            <TextBody lh={1.4}>{a.body}</TextBody>
                        </Card>
                    ))}
                    {canAnswer && (
                        <Card withBorder p="xs" radius="sm">
                            <Textarea
                                autosize
                                minRows={2}
                                placeholder={t('qna.answerPlaceholder', undefined, '답변을 입력하세요')}
                                value={answerBody}
                                onChange={(e) => setAnswerBody(e.currentTarget.value)}
                            />
                            <Group gap="xs" justify="flex-end" mt={6}>
                                {error && (
                                    <Badge color="red" size="xs" variant="light">
                                        {error}
                                    </Badge>
                                )}
                                <Button disabled={!answerBody.trim()} size="sm" onClick={submitAnswer}>
                                    {t('qna.register', undefined, '등록')}
                                </Button>
                            </Group>
                        </Card>
                    )}
                </Stack>
            </Collapse>
        </Card>
    );
}
