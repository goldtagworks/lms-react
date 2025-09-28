import type { InstructorProfile } from '@main/lib/repository';

import { useState, useEffect, useCallback } from 'react';
import { Modal, Stack, TextInput, Textarea, Group, Button, ActionIcon } from '@mantine/core';
import { Plus, Link as LinkIcon, Trash2 } from 'lucide-react';
import { Save, X } from 'lucide-react';

export interface InstructorProfileEditModalProps {
    opened: boolean;
    profile: InstructorProfile | null;
    onClose(): void;
    onSave(patch: { display_name: string; bio_md?: string; links?: { label: string; url: string }[] }): void;
}

export default function InstructorProfileEditModal({ opened, profile, onClose, onSave }: InstructorProfileEditModalProps) {
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [links, setLinks] = useState<{ label: string; url: string }[]>([]);

    useEffect(() => {
        if (opened && profile) {
            setDisplayName(profile.display_name || '');
            setBio(profile.bio_md || '');
            setLinks(profile.links ? [...profile.links] : []);
        } else if (!opened) {
            setDisplayName('');
            setBio('');
            setLinks([]);
        }
    }, [opened, profile]);

    const handleSave = useCallback(() => {
        const name = displayName.trim();

        if (name.length < 2) return; // 간단 검증
        const cleanLinks = links.map((l) => ({ label: l.label.trim(), url: l.url.trim() })).filter((l) => l.label.length > 0 && /^https?:\/\//i.test(l.url));

        onSave({ display_name: name, bio_md: bio.trim() || undefined, links: cleanLinks.length ? cleanLinks : undefined });
        onClose();
    }, [displayName, bio, links, onClose, onSave]);

    function addLink() {
        setLinks((ls) => [...ls, { label: '', url: '' }]);
    }
    function updateLink(idx: number, patch: Partial<{ label: string; url: string }>) {
        setLinks((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
    }
    function removeLink(idx: number) {
        setLinks((ls) => ls.filter((_, i) => i !== idx));
    }

    return (
        <Modal centered withinPortal opened={opened} radius="md" size="lg" title="프로필 수정" onClose={onClose}>
            <Stack gap="sm" mt="xs">
                <TextInput label="표시 이름" value={displayName} onChange={(e) => setDisplayName(e.currentTarget.value)} />
                <Textarea label="소개 (Markdown)" minRows={6} placeholder="## 소개\n경력 요약 ..." value={bio} onChange={(e) => setBio(e.currentTarget.value)} />
                <TextInput label="표시 이름" size="sm" value={displayName} onChange={(e) => setDisplayName(e.currentTarget.value)} />
                <Textarea label="소개 (Markdown)" minRows={6} placeholder="## 소개\n경력 요약 ..." size="sm" value={bio} onChange={(e) => setBio(e.currentTarget.value)} />
                <Group justify="space-between" mt="xs">
                    <Group gap={6}>
                        <LinkIcon size={16} />
                        <TextInput disabled value="외부 링크" w={100} />
                        <TextInput disabled size="sm" value="외부 링크" w={100} />
                    </Group>
                    <ActionIcon aria-label="링크 추가" variant="light" onClick={addLink}>
                        <Plus size={16} />
                    </ActionIcon>
                </Group>
                <Stack gap={6}>
                    {links.map((l, i) => (
                        <Group key={i} align="flex-end" gap={8} wrap="nowrap">
                            <TextInput flex={1} label={`Label ${i + 1}`} placeholder="GitHub" value={l.label} onChange={(e) => updateLink(i, { label: e.currentTarget.value })} />
                            <TextInput flex={2} label="URL" placeholder="https://" value={l.url} onChange={(e) => updateLink(i, { url: e.currentTarget.value })} />
                            <TextInput flex={1} label={`Label ${i + 1}`} placeholder="GitHub" size="sm" value={l.label} onChange={(e) => updateLink(i, { label: e.currentTarget.value })} />
                            <TextInput flex={2} label="URL" placeholder="https://" size="sm" value={l.url} onChange={(e) => updateLink(i, { url: e.currentTarget.value })} />
                            <ActionIcon aria-label="삭제" color="red" mb={4} variant="subtle" onClick={() => removeLink(i)}>
                                <Trash2 size={16} />
                            </ActionIcon>
                        </Group>
                    ))}
                </Stack>
                <Group justify="flex-end" mt="sm">
                    <Button disabled={displayName.trim().length < 2} leftSection={<Save size={16} />} size="xs" onClick={handleSave}>
                        저장
                    </Button>
                    <Button leftSection={<X size={16} />} size="xs" variant="default" onClick={onClose}>
                        취소
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
