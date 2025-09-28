import { useState, useEffect, useRef } from 'react';
import { Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { Plus, X } from 'lucide-react';

interface SectionHeaderAddModalProps {
    opened: boolean;
    onClose: () => void;
    onAdd: (title: string) => void;
}

// Controlled 섹션 헤더 추가 모달 (내부 입력 상태만 관리)
export default function SectionHeaderAddModal({ opened, onClose, onAdd }: SectionHeaderAddModalProps) {
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
        <Modal centered withinPortal opened={opened} title="섹션 구분 추가" onClose={onClose}>
            <Stack gap="sm" mt="xs">
                <TextInput
                    ref={inputRef}
                    label="섹션 제목"
                    placeholder="예: 섹션 1. 소개"
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
                    <Button disabled={!trimmed} leftSection={<Plus size={14} />} size="xs" onClick={handleSubmit}>
                        추가
                    </Button>
                    <Button leftSection={<X size={14} />} size="xs" variant="default" onClick={onClose}>
                        취소
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
