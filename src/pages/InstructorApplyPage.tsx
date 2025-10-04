import { useState } from 'react';
import { Button, Card, Group, Stack, Text, TextInput, Textarea, Badge, Alert, Divider, Title } from '@mantine/core';
import { t } from '@main/lib/i18n';
import { useAuth } from '@main/lib/auth';
import { applyInstructor, useMyInstructorApplication } from '@main/lib/repository';
import { ConsentCheckboxes, ConsentState } from '@main/components/auth/ConsentCheckboxes';
import AuthLayout from '@main/components/auth/AuthLayout';
import InstructorHero from '@main/components/instructor/InstructorHero';

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

    // 비로그인 상태도 동일 레이아웃 유지 (우측 카드에서 로그인 요구 표현)

    const submit = () => {
        if (!user) return; // 로그인 필요
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
        <AuthLayout hero={<InstructorHero variant="apply" />}>
            <Card withBorder p={{ base: 'lg', md: 'xl' }} radius="lg" shadow="md">
                <Stack gap="lg">
                    <Stack gap={4}>
                        <Group justify="space-between">
                            <Title fw={700} order={3} size={26}>
                                {t('instructor.apply.title')}
                            </Title>
                            {app?.status === 'APPROVED' && <Badge color="green">{t('common.status.approved')}</Badge>}
                        </Group>
                        {!user && (
                            <Alert color="yellow" variant="light">
                                {t('auth.loginRequired.message.generic')}
                            </Alert>
                        )}
                        {app?.status === 'PENDING' && (
                            <Alert color="blue" variant="light">
                                {t('instructor.apply.pendingNotice')}
                            </Alert>
                        )}
                        {app?.status === 'APPROVED' && (
                            <Text c="dimmed" size="sm">
                                {t('instructor.apply.approvedDesc')}
                            </Text>
                        )}
                    </Stack>
                    {app?.status !== 'APPROVED' && (
                        <>
                            <TextInput
                                required
                                disabled={!user || !!app}
                                label={t('instructor.apply.displayNameLabel')}
                                placeholder={t('instructor.apply.displayNamePh')}
                                value={displayName}
                                onChange={(e) => setDisplayName(e.currentTarget.value)}
                            />
                            <Textarea
                                disabled={!user || !!app}
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
                                {!app && user && (
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
                                {app?.status === 'PENDING' && <Badge color="yellow">{t('common.status.pending')}</Badge>}
                                {!user && (
                                    <Button component="a" href="/signin" size="sm" variant="light">
                                        {t('common.login')}
                                    </Button>
                                )}
                                {!app && user && (
                                    <Button disabled={!displayName.trim() || !consent?.terms || !consent.privacy} size="sm" onClick={submit}>
                                        {t('instructor.apply.submit')}
                                    </Button>
                                )}
                            </Group>
                        </>
                    )}
                </Stack>
            </Card>
        </AuthLayout>
    );
}

export default InstructorApplyPage;
