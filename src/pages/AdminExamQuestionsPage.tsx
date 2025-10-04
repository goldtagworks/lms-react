import type { ExamQuestion, CreateExamQuestionRequest, UpdateExamQuestionRequest } from '@main/types/examManagement';

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stack, Title, Card, Text, Button, Group, Alert, ActionIcon, Badge, Loader, Modal, TextInput, Textarea, Select, NumberInput, Table, MultiSelect } from '@mantine/core';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { ArrowLeft, Plus, Edit, Trash2, GripVertical, Eye } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PageContainer from '@main/components/layout/PageContainer';
import { useI18n } from '@main/lib/i18n';
import { useExamWithQuestions, useCreateExamQuestion, useUpdateExamQuestion, useDeleteExamQuestion, useReorderExamQuestions } from '@main/hooks/useExamManagement';

// 문제 유형 값 목록 (라벨은 i18n에서 계산)
const QUESTION_TYPE_VALUES = ['single', 'multiple', 'short'] as const;

interface QuestionFormProps {
    question?: ExamQuestion;
    onSave: (question: CreateExamQuestionRequest | UpdateExamQuestionRequest) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

function QuestionForm({ question, onSave, onCancel, isLoading }: QuestionFormProps) {
    const { t } = useI18n();
    const isEditing = !!question;

    const form = useForm<CreateExamQuestionRequest | UpdateExamQuestionRequest>({
        initialValues: {
            ...(isEditing && { id: question.id }),
            examId: question?.examId || '',
            questionType: question?.questionType || 'single',
            questionText: question?.questionText || '',
            choices: question?.choices || undefined,
            correctAnswer: question?.correctAnswer || '',
            points: question?.points || 1,
            orderIndex: question?.orderIndex || 0
        },
        validate: {
            questionText: (value) => (!value ? t('examAdmin.questions.validate.textRequired') : null),
            correctAnswer: (value) => (!value ? t('examAdmin.questions.validate.correctRequired') : null),
            points: (value) => {
                if (!value || value <= 0) return t('examAdmin.questions.validate.pointsMin');

                return null;
            }
        }
    });

    const questionType = form.values.questionType;

    // 객관식 옵션 관리
    const [options, setOptions] = useState<string[]>(() => {
        if (question?.choices) {
            return question.choices;
        }

        return ['', '', '', ''];
    });

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];

        newOptions[index] = value;
        setOptions(newOptions);
        form.setFieldValue('choices', newOptions);
    };

    const handleSubmit = (values: CreateExamQuestionRequest | UpdateExamQuestionRequest) => {
        if (questionType === 'single' || questionType === 'multiple') {
            // 객관식인 경우 옵션 검증
            const validOptions = options.filter((opt) => opt.trim());

            if (validOptions.length < 2) {
                form.setFieldError('choices', t('examAdmin.questions.validate.choicesMin'));

                return;
            }
            values.choices = options.filter((opt) => opt.trim());
        } else {
            values.choices = undefined;
        }

        onSave(values);
    };

    return (
        <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="lg">
                {/* 문제 유형 */}
                <Select
                    required
                    data={QUESTION_TYPE_VALUES.map((v) => ({ value: v, label: t(`examAdmin.questions.type.${v}`) }))}
                    label={t('examAdmin.questions.form.type')}
                    {...form.getInputProps('questionType')}
                />

                {/* 문제 내용 */}
                <Textarea required label={t('examAdmin.questions.form.text')} placeholder={t('examAdmin.questions.form.textPlaceholder')} rows={4} {...form.getInputProps('questionText')} />

                {/* 선택지 (객관식일 때만) */}
                {(questionType === 'single' || questionType === 'multiple') && (
                    <Stack gap="md">
                        <Text fw={500} size="sm">
                            {t('examAdmin.questions.form.choices')}
                        </Text>
                        {options.map((option, index) => (
                            <TextInput
                                key={index}
                                placeholder={t('examAdmin.questions.form.choicePlaceholder', { index: index + 1 })}
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                            />
                        ))}
                    </Stack>
                )}

                {/* 정답 */}
                {questionType === 'single' ? (
                    <Select
                        required
                        data={options.map((opt, idx) => ({ value: String(idx + 1), label: `${idx + 1}: ${opt || '( )'}` }))}
                        label={t('examAdmin.questions.form.correctSingle')}
                        {...form.getInputProps('correctAnswer')}
                    />
                ) : questionType === 'multiple' ? (
                    <MultiSelect
                        required
                        data={options.map((opt, idx) => ({ value: String(idx + 1), label: `${idx + 1}: ${opt || '( )'}` }))}
                        label={t('examAdmin.questions.form.correctMultiple')}
                        placeholder={t('examAdmin.questions.form.correctMultiplePlaceholder')}
                        value={typeof form.values.correctAnswer === 'string' && form.values.correctAnswer ? form.values.correctAnswer.split(',') : []}
                        onChange={(values) => form.setFieldValue('correctAnswer', values.join(','))}
                    />
                ) : (
                    <TextInput
                        required
                        label={t('examAdmin.questions.form.correctShort')}
                        placeholder={t('examAdmin.questions.form.correctShortPlaceholder')}
                        {...form.getInputProps('correctAnswer')}
                    />
                )}

                {/* 점수 */}
                <NumberInput required label={t('examAdmin.questions.form.points')} min={1} placeholder="1" suffix={t('examAdmin.questions.form.pointsSuffix')} {...form.getInputProps('points')} />

                {/* 버튼 */}
                <Group justify="flex-end">
                    <Button variant="outline" onClick={onCancel}>
                        {t('examAdmin.questions.form.cancel')}
                    </Button>
                    <Button loading={isLoading} type="submit">
                        {isEditing ? t('examAdmin.questions.form.submitEdit') : t('examAdmin.questions.form.submitCreate')}
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}

// 드래그 가능한 문제 행 컴포넌트
interface SortableQuestionRowProps {
    question: ExamQuestion;
    index: number;
    onEdit: (question: ExamQuestion) => void;
    onDelete: (questionId: string, questionText: string) => void;
    isDeleting: boolean;
}

function SortableQuestionRow({ question, index, onEdit, onDelete, isDeleting }: SortableQuestionRowProps) {
    const { t } = useI18n();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: question.id
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <Table.Tr ref={setNodeRef} style={style}>
            <Table.Td>
                <Group gap="xs">
                    <ActionIcon size="sm" style={{ cursor: 'grab' }} variant="subtle" {...attributes} {...listeners}>
                        <GripVertical size={16} />
                    </ActionIcon>
                    <Text fw={500}>{index + 1}</Text>
                </Group>
            </Table.Td>
            <Table.Td>
                <Text lineClamp={2}>{question.questionText}</Text>
            </Table.Td>
            <Table.Td>
                <Badge size="sm" variant="light">
                    {t(`examAdmin.questions.type.${question.questionType}`)}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Text ta="center">
                    {question.points}
                    {t('examAdmin.questions.form.pointsSuffix')}
                </Text>
            </Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <ActionIcon size="sm" variant="light">
                        <Eye size={16} />
                    </ActionIcon>
                    <ActionIcon color="blue" size="sm" variant="light" onClick={() => onEdit(question)}>
                        <Edit size={16} />
                    </ActionIcon>
                    <ActionIcon color="red" loading={isDeleting} size="sm" variant="light" onClick={() => onDelete(question.id, question.questionText)}>
                        <Trash2 size={16} />
                    </ActionIcon>
                </Group>
            </Table.Td>
        </Table.Tr>
    );
}

export default function AdminExamQuestionsPage() {
    const { t } = useI18n();
    const { examId } = useParams();
    const navigate = useNavigate();
    const { data: exam, isLoading, error } = useExamWithQuestions(examId || '');
    const createQuestionMutation = useCreateExamQuestion();
    const updateQuestionMutation = useUpdateExamQuestion();
    const deleteQuestionMutation = useDeleteExamQuestion();
    const reorderQuestionsMutation = useReorderExamQuestions();

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
    const [sortedQuestions, setSortedQuestions] = useState<ExamQuestion[]>([]);

    // 드래그앤드롭 센서 설정
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    // 문제 목록 동기화
    useEffect(() => {
        if (exam?.questions) {
            setSortedQuestions([...exam.questions].sort((a, b) => a.orderIndex - b.orderIndex));
        }
    }, [exam?.questions]);

    // 드래그 종료 핸들러
    const handleDragEnd = async (event: any) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = sortedQuestions.findIndex((q) => q.id === active.id);
            const newIndex = sortedQuestions.findIndex((q) => q.id === over?.id);

            const newOrder = arrayMove(sortedQuestions, oldIndex, newIndex);

            setSortedQuestions(newOrder);

            // 서버에 순서 변경 전송
            try {
                await reorderQuestionsMutation.mutateAsync({
                    examId: examId || '',
                    questionIds: newOrder.map((q) => q.id)
                });
            } catch (error) {
                // 실패 시 원래 순서로 되돌림
                setSortedQuestions(sortedQuestions);
                // eslint-disable-next-line no-console
                console.error(t('examAdmin.errors.generic'), error);
            }
        }
    };

    const handleCreateQuestion = async (questionData: CreateExamQuestionRequest | UpdateExamQuestionRequest) => {
        try {
            // 생성 요청인지 확인
            if ('id' in questionData) {
                // 수정 요청 (실제로는 생성 컨텍스트에서 호출되지 않음)
                return;
            }
            await createQuestionMutation.mutateAsync({
                ...questionData,
                examId: examId || '',
                orderIndex: sortedQuestions.length
            });
            setShowCreateForm(false);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(t('examAdmin.errors.generic'), error);
        }
    };

    const handleUpdateQuestion = async (questionData: CreateExamQuestionRequest | UpdateExamQuestionRequest) => {
        try {
            // 수정 요청인지 확인
            if (!('id' in questionData)) {
                // 생성 요청 (실제로는 수정 컨텍스트에서 호출되지 않음)
                return;
            }
            await updateQuestionMutation.mutateAsync(questionData);
            setEditingQuestion(null);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(t('examAdmin.errors.generic'), error);
        }
    };

    const handleDeleteQuestion = (questionId: string, questionText: string) => {
        modals.openConfirmModal({
            title: t('examAdmin.questions.confirmDelete.title'),
            children: (
                <Stack gap="md">
                    <Text>{t('examAdmin.questions.confirmDelete.bodyPrompt')}</Text>
                    <Text c="dimmed" size="sm">
                        &quot;{questionText.slice(0, 100)}...&quot;
                    </Text>
                    <Alert color="red" title={t('examAdmin.questions.confirmDelete.warnTitle')}>
                        {t('examAdmin.questions.confirmDelete.warnBody')}
                    </Alert>
                </Stack>
            ),
            labels: { confirm: t('examAdmin.questions.confirmDelete.confirm'), cancel: t('examAdmin.questions.confirmDelete.cancel') },
            confirmProps: { color: 'red' },
            onConfirm: () => deleteQuestionMutation.mutate({ questionId, examId: examId || '' })
        });
    };

    if (isLoading) {
        return (
            <PageContainer roleMain py={48}>
                <Group>
                    <Loader size="sm" />
                    <Text>{t('examAdmin.common.loadingQuestions')}</Text>
                </Group>
            </PageContainer>
        );
    }

    if (error || !exam) {
        return (
            <PageContainer roleMain py={48}>
                <Alert color="red" title={t('examAdmin.errors.generic')}>
                    {t('examAdmin.common.notFound')}
                </Alert>
            </PageContainer>
        );
    }

    return (
        <PageContainer roleMain py={48}>
            <Stack gap="xl">
                {/* 헤더 */}
                <Group justify="space-between">
                    <Group>
                        <Button leftSection={<ArrowLeft size={16} />} variant="subtle" onClick={() => navigate('/admin/exams')}>
                            {t('examAdmin.common.backToList')}
                        </Button>
                        <Stack gap="xs">
                            <Title order={1}>{t('examAdmin.questions.pageTitle')}</Title>
                            <Text c="dimmed">{exam.title}</Text>
                        </Stack>
                    </Group>
                    <Button leftSection={<Plus size={16} />} onClick={() => setShowCreateForm(true)}>
                        {t('examAdmin.questions.addQuestion')}
                    </Button>
                </Group>

                {/* 시험 정보 */}
                <Card withBorder p={{ base: 'lg', md: 'xl' }} radius="md" shadow="md">
                    <Stack gap="md">
                        <Group justify="space-between">
                            <Text fw={500} size="lg">
                                {t('examAdmin.questions.infoTitle')}
                            </Text>
                            <Button component="a" href={`/admin/exams/${exam.id}/edit`} leftSection={<Edit size={16} />} size="sm" variant="light">
                                {t('examAdmin.questions.infoEdit')}
                            </Button>
                        </Group>
                        <Group>
                            <Badge color="blue" variant="light">
                                {t('examAdmin.questions.badgeQuestions', { count: sortedQuestions.length })}
                            </Badge>
                            <Badge color="green" variant="light">
                                {t('examAdmin.questions.badgePassScore', { score: exam.passScore })}
                            </Badge>
                            {exam.timeLimitMinutes && (
                                <Badge color="orange" variant="light">
                                    {t('examAdmin.questions.badgeTimeLimit', { minutes: exam.timeLimitMinutes })}
                                </Badge>
                            )}
                        </Group>
                        {exam.descriptionMd && (
                            <Text c="dimmed" size="sm">
                                {exam.descriptionMd}
                            </Text>
                        )}
                    </Stack>
                </Card>

                {/* 문제 목록 */}
                {sortedQuestions.length === 0 ? (
                    <Alert color="blue" title={t('examAdmin.questions.emptyTitle')}>
                        <Stack gap="md">
                            <Text>{t('examAdmin.questions.emptyBody')}</Text>
                            <Button leftSection={<Plus size={16} />} size="sm" variant="light" onClick={() => setShowCreateForm(true)}>
                                {t('examAdmin.questions.emptyAdd')}
                            </Button>
                        </Stack>
                    </Alert>
                ) : (
                    <Card withBorder p={{ base: 'lg', md: 'xl' }} radius="md" shadow="md">
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Text fw={500} size="lg">
                                    {t('examAdmin.questions.listSection', { count: sortedQuestions.length })}
                                </Text>
                                <Text c="dimmed" size="sm">
                                    {t('examAdmin.questions.totalPoints', { points: sortedQuestions.reduce((sum, q) => sum + q.points, 0) })}
                                </Text>
                            </Group>

                            <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
                                <Table>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th w={40}>{t('examAdmin.questions.table.number')}</Table.Th>
                                            <Table.Th>{t('examAdmin.questions.table.question')}</Table.Th>
                                            <Table.Th w={120}>{t('examAdmin.questions.table.type')}</Table.Th>
                                            <Table.Th w={80}>{t('examAdmin.questions.table.points')}</Table.Th>
                                            <Table.Th w={120}>{t('examAdmin.questions.table.actions')}</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <SortableContext items={sortedQuestions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                                        <Table.Tbody>
                                            {sortedQuestions.map((question, index) => (
                                                <SortableQuestionRow
                                                    key={question.id}
                                                    index={index}
                                                    isDeleting={deleteQuestionMutation.isPending}
                                                    question={question}
                                                    onDelete={handleDeleteQuestion}
                                                    onEdit={setEditingQuestion}
                                                />
                                            ))}
                                        </Table.Tbody>
                                    </SortableContext>
                                </Table>
                            </DndContext>
                        </Stack>
                    </Card>
                )}

                {/* 문제 생성 모달 */}
                <Modal opened={showCreateForm} size="lg" title={t('examAdmin.questions.addQuestionModal')} onClose={() => setShowCreateForm(false)}>
                    <QuestionForm isLoading={createQuestionMutation.isPending} onCancel={() => setShowCreateForm(false)} onSave={handleCreateQuestion} />
                </Modal>

                {/* 문제 수정 모달 */}
                <Modal opened={!!editingQuestion} size="lg" title={t('examAdmin.questions.editQuestionModal')} onClose={() => setEditingQuestion(null)}>
                    {editingQuestion && (
                        <QuestionForm isLoading={updateQuestionMutation.isPending} question={editingQuestion} onCancel={() => setEditingQuestion(null)} onSave={handleUpdateQuestion} />
                    )}
                </Modal>
            </Stack>
        </PageContainer>
    );
}
