import { useState } from 'react';
import { Button, Card, Group, Stack, Text, TextInput, Textarea, Badge, Alert, Divider } from '@mantine/core';
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
            <Card>
                <Text>로그인이 필요합니다.</Text>
            </Card>
        );
    }

    if (app?.status === 'APPROVED') {
        return (
            <Card withBorder shadow="sm">
                <Stack>
                    <Text fw={600}>이미 승인된 강사입니다.</Text>
                    <Badge color="green">승인 완료</Badge>
                    <Text c="dimmed" size="sm">
                        이제 강의 생성을 시작할 수 있습니다.
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
                강사 신청
            </Text>
            {app && app.status === 'PENDING' && (
                <Alert color="blue" variant="light">
                    승인 대기 중입니다. 관리자가 검토 후 승인/반려 처리합니다.
                </Alert>
            )}
            <Card withBorder radius="md" shadow="sm">
                <Stack>
                    <TextInput required disabled={!!app} label="표시 이름" placeholder="공개될 강사명" value={displayName} onChange={(e) => setDisplayName(e.currentTarget.value)} />
                    <Textarea
                        disabled={!!app}
                        label="소개 (Markdown 가능)"
                        minRows={4}
                        placeholder="간단한 경력, 전문 분야 등을 작성하세요"
                        rows={6}
                        value={bio}
                        onChange={(e) => setBio(e.currentTarget.value)}
                    />
                    <Stack gap={4}>
                        <Group justify="space-between">
                            <Text fw={500}>관련 링크</Text>
                        </Group>
                        {links.length > 0 && (
                            <Stack>
                                {links.map((l, i) => (
                                    <Group key={i} gap="xs">
                                        <Badge color="grape" variant="light">
                                            {l.label}
                                        </Badge>
                                        <Text c="blue" size="xs" style={{ wordBreak: 'break-all' }}>
                                            {l.url}
                                        </Text>
                                    </Group>
                                ))}
                            </Stack>
                        )}
                        {!app && (
                            <Group align="flex-end" wrap="nowrap">
                                <TextInput label="라벨" placeholder="GitHub" style={{ flex: 1 }} value={linkLabel} onChange={(e) => setLinkLabel(e.currentTarget.value)} />
                                <TextInput label="URL" placeholder="https://github.com/username" style={{ flex: 2 }} value={linkUrl} onChange={(e) => setLinkUrl(e.currentTarget.value)} />
                                <Button size="xs" variant="light" onClick={addLink}>
                                    추가
                                </Button>
                            </Group>
                        )}
                    </Stack>
                    <Divider my="sm" />
                    <Stack>
                        <Text fw={600}>약관 동의</Text>
                        <ConsentCheckboxes compact requireAge requireInstructorPolicy onChange={setConsent} />
                    </Stack>
                    <Group justify="flex-end">
                        {!app && (
                            <Button disabled={!displayName.trim() || !consent?.terms || !consent.privacy} size="xs" onClick={submit}>
                                신청 제출
                            </Button>
                        )}
                        {app?.status === 'PENDING' && <Badge color="yellow">대기중</Badge>}
                    </Group>
                </Stack>
            </Card>
        </Stack>
    );
}

export default InstructorApplyPage;
