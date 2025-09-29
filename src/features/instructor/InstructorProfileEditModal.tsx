import type { InstructorProfile } from '@main/lib/repository';

import { useState, useEffect, useCallback } from 'react';
import { Modal, Stack, TextInput, Textarea, Group, Button, ActionIcon } from '@mantine/core';
import { useI18n } from '@main/lib/i18n';
import { Plus, Link as LinkIcon, Trash2 } from 'lucide-react';
import { Save, X } from 'lucide-react';

export interface InstructorProfileEditModalProps {
    opened: boolean;
    profile: InstructorProfile | null;
    onClose(): void;
    onSave(patch: { display_name: string; bio_md?: string; links?: { label: string; url: string }[] }): void;
}

export default function InstructorProfileEditModal({ opened, profile, onClose, onSave }: InstructorProfileEditModalProps) {
    const { t } = useI18n();
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
        <Modal centered withinPortal opened={opened} radius="md" size="lg" title={t('instructor.edit.title')} onClose={onClose}>
            <Stack gap="sm" mt="xs">
                <TextInput label={t('instructor.edit.displayName')} value={displayName} onChange={(e) => setDisplayName(e.currentTarget.value)} />
                <Textarea label={t('instructor.edit.bio')} minRows={6} placeholder={t('instructor.edit.bioPlaceholder')} value={bio} onChange={(e) => setBio(e.currentTarget.value)} />
                <TextInput label={t('instructor.edit.displayName')} size="sm" value={displayName} onChange={(e) => setDisplayName(e.currentTarget.value)} />
                <Textarea label={t('instructor.edit.bio')} minRows={6} placeholder={t('instructor.edit.bioPlaceholder')} size="sm" value={bio} onChange={(e) => setBio(e.currentTarget.value)} />
                <Group justify="space-between" mt="xs">
                    <Group gap={6}>
                        <LinkIcon size={16} />
                        <TextInput disabled value={t('instructor.edit.linkLabel')} w={100} />
                        <TextInput disabled size="sm" value={t('instructor.edit.linkLabel')} w={100} />
                    </Group>
                    <ActionIcon aria-label={t('instructor.edit.linkAdd')} variant="light" onClick={addLink}>
                        <Plus size={16} />
                    </ActionIcon>
                </Group>
                <Stack gap={6}>
                    {links.map((l, i) => (
                        <Group key={i} align="flex-end" gap={8} wrap="nowrap">
                            <TextInput
                                flex={1}
                                label={t('instructor.edit.linkLabelIndexed', { index: i + 1 })}
                                placeholder={t('instructor.edit.linkPlaceholder')}
                                value={l.label}
                                onChange={(e) => updateLink(i, { label: e.currentTarget.value })}
                            />
                            <TextInput
                                flex={2}
                                label={t('instructor.edit.url')}
                                placeholder={t('instructor.edit.urlPlaceholder')}
                                value={l.url}
                                onChange={(e) => updateLink(i, { url: e.currentTarget.value })}
                            />
                            <TextInput
                                flex={1}
                                label={t('instructor.edit.linkLabelIndexed', { index: i + 1 })}
                                placeholder={t('instructor.edit.linkPlaceholder')}
                                size="sm"
                                value={l.label}
                                onChange={(e) => updateLink(i, { label: e.currentTarget.value })}
                            />
                            <TextInput
                                flex={2}
                                label={t('instructor.edit.url')}
                                placeholder={t('instructor.edit.urlPlaceholder')}
                                size="sm"
                                value={l.url}
                                onChange={(e) => updateLink(i, { url: e.currentTarget.value })}
                            />
                            <ActionIcon aria-label={t('instructor.edit.linkRemove')} color="red" mb={4} variant="subtle" onClick={() => removeLink(i)}>
                                <Trash2 size={16} />
                            </ActionIcon>
                        </Group>
                    ))}
                </Stack>
                <Group justify="flex-end" mt="sm">
                    <Button aria-label={t('common.save')} disabled={displayName.trim().length < 2} leftSection={<Save size={16} />} size="sm" onClick={handleSave}>
                        {t('common.save')}
                    </Button>
                    <Button aria-label={t('common.cancel')} leftSection={<X size={16} />} size="sm" variant="default" onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
