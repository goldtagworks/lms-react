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
import { useExamWithQuestions, useCreateExamQuestion, useUpdateExamQuestion, useDeleteExamQuestion, useReorderExamQuestions } from '@main/hooks/useExamManagement';

// 문제 유형 옵션 (스키마 기준)
const QUESTION_TYPES = [
    { value: 'single', label: '객관식 (단일 선택)' },
    { value: 'multiple', label: '객관식 (복수 선택)' },
    { value: 'short', label: '단답형' }
];

interface QuestionFormProps {
    question?: ExamQuestion;
    onSave: (question: CreateExamQuestionRequest | UpdateExamQuestionRequest) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

function QuestionForm({ question, onSave, onCancel, isLoading }: QuestionFormProps) {
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
            questionText: (value) => (!value ? '문제 내용을 입력해주세요' : null),
            correctAnswer: (value) => (!value ? '정답을 입력해주세요' : null),
            points: (value) => {
                if (!value || value <= 0) return '점수는 1점 이상이어야 합니다';

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
                form.setFieldError('choices', '최소 2개의 선택지를 입력해주세요');

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
                <Select required data={QUESTION_TYPES} label="문제 유형" {...form.getInputProps('questionType')} />

                {/* 문제 내용 */}
                <Textarea required label="문제 내용" placeholder="문제를 입력하세요..." rows={4} {...form.getInputProps('questionText')} />

                {/* 선택지 (객관식일 때만) */}
                {(questionType === 'single' || questionType === 'multiple') && (
                    <Stack gap="md">
                        <Text fw={500} size="sm">
                            선택지
                        </Text>
                        {options.map((option, index) => (
                            <TextInput key={index} placeholder={`선택지 ${index + 1}`} value={option} onChange={(e) => handleOptionChange(index, e.target.value)} />
                        ))}
                    </Stack>
                )}

                {/* 정답 */}
                {questionType === 'single' ? (
                    <Select
                        required
                        data={options.map((opt, idx) => ({ value: String(idx + 1), label: `${idx + 1}번: ${opt || '(비어있음)'}` }))}
                        label="정답 (단일 선택)"
                        {...form.getInputProps('correctAnswer')}
                    />
                ) : questionType === 'multiple' ? (
                    <MultiSelect
                        required
                        data={options.map((opt, idx) => ({ value: String(idx + 1), label: `${idx + 1}번: ${opt || '(비어있음)'}` }))}
                        label="정답 (복수 선택 가능)"
                        placeholder="정답을 모두 선택하세요"
                        value={typeof form.values.correctAnswer === 'string' && form.values.correctAnswer ? form.values.correctAnswer.split(',') : []}
                        onChange={(values) => form.setFieldValue('correctAnswer', values.join(','))}
                    />
                ) : (
                    <TextInput required label="정답" placeholder="정답을 입력하세요" {...form.getInputProps('correctAnswer')} />
                )}

                {/* 점수 */}
                <NumberInput required label="배점" min={1} placeholder="1" suffix="점" {...form.getInputProps('points')} />

                {/* 버튼 */}
                <Group justify="flex-end">
                    <Button variant="outline" onClick={onCancel}>
                        취소
                    </Button>
                    <Button loading={isLoading} type="submit">
                        {isEditing ? '수정 완료' : '문제 추가'}
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
                    {QUESTION_TYPES.find((t) => t.value === question.questionType)?.label || question.questionType}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Text ta="center">{question.points}점</Text>
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
                console.error('문제 순서 변경 실패:', error);
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
            console.error('문제 생성 오류:', error);
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
            console.error('문제 수정 오류:', error);
        }
    };

    const handleDeleteQuestion = (questionId: string, questionText: string) => {
        modals.openConfirmModal({
            title: '문제 삭제',
            children: (
                <Stack gap="md">
                    <Text>다음 문제를 삭제하시겠습니까?</Text>
                    <Text c="dimmed" size="sm">
                        &quot;{questionText.slice(0, 100)}...&quot;
                    </Text>
                    <Alert color="red" title="주의사항">
                        삭제된 문제는 복구할 수 없습니다.
                    </Alert>
                </Stack>
            ),
            labels: { confirm: '삭제', cancel: '취소' },
            confirmProps: { color: 'red' },
            onConfirm: () => deleteQuestionMutation.mutate({ questionId, examId: examId || '' })
        });
    };

    if (isLoading) {
        return (
            <PageContainer roleMain py={48}>
                <Group>
                    <Loader size="sm" />
                    <Text>문제 목록을 불러오는 중...</Text>
                </Group>
            </PageContainer>
        );
    }

    if (error || !exam) {
        return (
            <PageContainer roleMain py={48}>
                <Alert color="red" title="오류가 발생했습니다">
                    시험을 찾을 수 없습니다.
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
                            시험 목록으로
                        </Button>
                        <Stack gap="xs">
                            <Title order={1}>문제 관리</Title>
                            <Text c="dimmed">{exam.title}</Text>
                        </Stack>
                    </Group>
                    <Button leftSection={<Plus size={16} />} onClick={() => setShowCreateForm(true)}>
                        문제 추가
                    </Button>
                </Group>

                {/* 시험 정보 */}
                <Card withBorder padding="lg" radius="md">
                    <Stack gap="md">
                        <Group justify="space-between">
                            <Text fw={500} size="lg">
                                시험 정보
                            </Text>
                            <Button component="a" href={`/admin/exams/${exam.id}/edit`} leftSection={<Edit size={16} />} size="sm" variant="light">
                                시험 정보 수정
                            </Button>
                        </Group>
                        <Group>
                            <Badge color="blue" variant="light">
                                {sortedQuestions.length}문제
                            </Badge>
                            <Badge color="green" variant="light">
                                합격 점수: {exam.passScore}점
                            </Badge>
                            {exam.timeLimitMinutes && (
                                <Badge color="orange" variant="light">
                                    제한 시간: {exam.timeLimitMinutes}분
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
                    <Alert color="blue" title="문제가 없습니다">
                        <Stack gap="md">
                            <Text>아직 등록된 문제가 없습니다. 첫 번째 문제를 추가해보세요!</Text>
                            <Button leftSection={<Plus size={16} />} size="sm" variant="light" onClick={() => setShowCreateForm(true)}>
                                문제 추가하기
                            </Button>
                        </Stack>
                    </Alert>
                ) : (
                    <Card withBorder padding="lg" radius="md">
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Text fw={500} size="lg">
                                    문제 목록 ({sortedQuestions.length}문제)
                                </Text>
                                <Text c="dimmed" size="sm">
                                    총 {sortedQuestions.reduce((sum, q) => sum + q.points, 0)}점
                                </Text>
                            </Group>

                            <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
                                <Table>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th w={40}>#</Table.Th>
                                            <Table.Th>문제</Table.Th>
                                            <Table.Th w={120}>유형</Table.Th>
                                            <Table.Th w={80}>배점</Table.Th>
                                            <Table.Th w={120}>작업</Table.Th>
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
                <Modal opened={showCreateForm} size="lg" title="새 문제 추가" onClose={() => setShowCreateForm(false)}>
                    <QuestionForm isLoading={createQuestionMutation.isPending} onCancel={() => setShowCreateForm(false)} onSave={handleCreateQuestion} />
                </Modal>

                {/* 문제 수정 모달 */}
                <Modal opened={!!editingQuestion} size="lg" title="문제 수정" onClose={() => setEditingQuestion(null)}>
                    {editingQuestion && (
                        <QuestionForm isLoading={updateQuestionMutation.isPending} question={editingQuestion} onCancel={() => setEditingQuestion(null)} onSave={handleUpdateQuestion} />
                    )}
                </Modal>
            </Stack>
        </PageContainer>
    );
}
