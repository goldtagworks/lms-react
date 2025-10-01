import { useState } from 'react';
import { Button, Card, Group, Stack, Text, TextInput, Textarea, Badge, Alert, Divider } from '@mantine/core';
import { t } from '@main/lib/i18n';
import { useAuth } from '@main/lib/auth';
import { applyInstructor, useMyInstructorApplication } from '@main/lib/repository';
import { ConsentCheckboxes, ConsentState } from '@main/components/auth/ConsentCheckboxes';

interface LinkInput {
    label: string;
    url: string;
}

export function InstructorApplyPage() {
    const { user } = useAuth();
    const app = useMyInstructorApplication(user?.id);
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [links, setLinks] = useState<LinkInput[]>([]);
    const [linkLabel, setLinkLabel] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [consent, setConsent] = useState<ConsentState | null>(null);

    if (!user) {
        return (
            <Card withBorder mx="auto" p="lg" radius="lg" shadow="sm">
                <Text>{t('instructor.apply.loginRequired')}</Text>
            </Card>
        );
    }

    if (app?.status === 'APPROVED') {
        return (
            <Card withBorder radius="lg" shadow="sm">
                <Stack>
                    <Text fw={600}>{t('instructor.apply.alreadyApproved')}</Text>
                    <Badge color="green">{t('common.status.approved')}</Badge>
                    <Text c="dimmed" size="sm">
                        {t('instructor.apply.approvedDesc')}
                    </Text>
                </Stack>
            </Card>
        );
    }

    const submit = () => {
        if (!displayName.trim()) return;
        if (!consent?.terms || !consent.privacy) return; // require base terms/privacy
        applyInstructor(
            { id: user.id, name: user.name || user.id, email: user.email || user.id + '@local', role: user.role },
            { display_name: displayName.trim(), bio_md: bio || undefined, links: links.length ? links : undefined }
        );
    };

    const addLink = () => {
        if (!linkLabel.trim() || !linkUrl.trim()) return;
        setLinks((prev) => [...prev, { label: linkLabel.trim(), url: linkUrl.trim() }]);
        setLinkLabel('');
        setLinkUrl('');
    };

    return (
        <Stack maw={640} mx="auto" p="md">
            <Text fw={700} fz={28}>
                {t('instructor.apply.title')}
            </Text>
            {app && app.status === 'PENDING' && (
                <Alert color="blue" variant="light">
                    {t('instructor.apply.pendingNotice')}
                </Alert>
            )}
            <Card withBorder radius="lg" shadow="sm">
                <Stack>
                    <TextInput
                        required
                        disabled={!!app}
                        label={t('instructor.apply.displayNameLabel')}
                        placeholder={t('instructor.apply.displayNamePh')}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.currentTarget.value)}
                    />
                    <Textarea
                        disabled={!!app}
                        label={t('instructor.apply.bioLabel')}
                        minRows={4}
                        placeholder={t('instructor.apply.bioPh')}
                        rows={6}
                        value={bio}
                        onChange={(e) => setBio(e.currentTarget.value)}
                    />
                    <Stack gap={4}>
                        <Group justify="space-between">
                            <Text fw={500}>{t('instructor.apply.linksTitle')}</Text>
                        </Group>
                        {links.length > 0 && (
                            <Stack>
                                {links.map((l, i) => (
                                    <Group key={i} gap="xs">
                                        <Badge color="grape" variant="light">
                                            {l.label}
                                        </Badge>
                                        <Text c="blue" size="sm" style={{ wordBreak: 'break-all' }}>
                                            {l.url}
                                        </Text>
                                    </Group>
                                ))}
                            </Stack>
                        )}
                        {!app && (
                            <Group align="flex-end" wrap="nowrap">
                                <TextInput
                                    label={t('instructor.apply.linkLabel')}
                                    placeholder={t('instructor.apply.linkLabelPh')}
                                    style={{ flex: 1 }}
                                    value={linkLabel}
                                    onChange={(e) => setLinkLabel(e.currentTarget.value)}
                                />
                                <TextInput label="URL" placeholder={t('instructor.apply.linkUrlPh')} style={{ flex: 2 }} value={linkUrl} onChange={(e) => setLinkUrl(e.currentTarget.value)} />
                                <Button size="sm" variant="light" onClick={addLink}>
                                    {t('common.addLink')}
                                </Button>
                            </Group>
                        )}
                    </Stack>
                    <Divider my="sm" />
                    <Stack>
                        <Text fw={600}>{t('instructor.apply.consentTitle')}</Text>
                        <ConsentCheckboxes compact requireAge requireInstructorPolicy onChange={setConsent} />
                    </Stack>
                    <Group justify="flex-end">
                        {!app && (
                            <Button disabled={!displayName.trim() || !consent?.terms || !consent.privacy} size="sm" onClick={submit}>
                                {t('instructor.apply.submit')}
                            </Button>
                        )}
                        {app?.status === 'PENDING' && <Badge color="yellow">{t('common.status.pending')}</Badge>}
                    </Group>
                </Stack>
            </Card>
        </Stack>
    );
}

export default InstructorApplyPage;
