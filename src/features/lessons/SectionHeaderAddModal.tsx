import { useState, useEffect, useRef } from 'react';
import { Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { Plus, X } from 'lucide-react';
import { useI18n } from '@main/lib/i18n';

interface SectionHeaderAddModalProps {
    opened: boolean;
    onClose: () => void;
    onAdd: (title: string) => void;
}

// Controlled 섹션 헤더 추가 모달 (내부 입력 상태만 관리)
export default function SectionHeaderAddModal({ opened, onClose, onAdd }: SectionHeaderAddModalProps) {
    const { t } = useI18n();
    const [title, setTitle] = useState('');
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (opened) {
            setTitle('');
            queueMicrotask(() => inputRef.current?.focus());
        }
    }, [opened]);

    const trimmed = title.trim();

    function handleSubmit() {
        if (!trimmed) return;
        onAdd(trimmed);
        onClose();
    }

    return (
        <Modal centered withinPortal opened={opened} radius="md" title={t('lesson.sectionAdd.title')} onClose={onClose}>
            <Stack gap="sm" mt="xs">
                <TextInput
                    ref={inputRef}
                    label={t('lesson.sectionAdd.field.title')}
                    placeholder={t('lesson.sectionAdd.placeholder.title')}
                    value={title}
                    onChange={(e) => setTitle(e.currentTarget.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && trimmed) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                />
                <Group gap="xs" justify="flex-end">
                    <Button aria-label={t('lesson.sectionAdd.actions.add')} disabled={!trimmed} leftSection={<Plus size={14} />} size="sm" onClick={handleSubmit}>
                        {t('lesson.sectionAdd.actions.add')}
                    </Button>
                    <Button aria-label={t('lesson.sectionAdd.actions.cancel')} leftSection={<X size={14} />} size="sm" variant="default" onClick={onClose}>
                        {t('lesson.sectionAdd.actions.cancel')}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
