import { useParams, Link } from 'react-router-dom';
import { getNotice } from '@main/lib/noticeRepo';
import PageContainer from '@main/components/layout/PageContainer';
import EmptyState from '@main/components/EmptyState';
import { Badge, Group, Stack, Text, Anchor, Paper, Divider, ActionIcon, Tooltip, Title } from '@mantine/core';
import { formatDate } from '@main/utils/format';
import { ChevronLeft, Pin, Share2, Copy, Pencil } from 'lucide-react';
import useCopyLink from '@main/hooks/useCopyLink';

export default function NoticeDetailPage() {
    const { id } = useParams();
    const notice = id ? getNotice(id) : undefined;
    const { copied, copy } = useCopyLink();

    if (!notice) {
        return (
            <PageContainer>
                <EmptyState message="해당 공지사항을 찾을 수 없습니다." />
            </PageContainer>
        );
    }

    function handleCopyLink() {
        copy();
    }

    return (
        <PageContainer>
            <Stack gap="lg" mt="md">
                {/* 상단 내비게이션 및 액션 */}
                <Group justify="space-between" wrap="nowrap">
                    <Group gap={6} wrap="nowrap">
                        <ActionIcon aria-label="목록으로" component={Link} to="/notices" variant="subtle">
                            <ChevronLeft size={18} />
                        </ActionIcon>
                        <Text c="dimmed" size="sm">
                            공지사항
                        </Text>
                    </Group>
                    <Group gap={4} wrap="nowrap">
                        {notice.pinned && (
                            <Tooltip withArrow label="상단 고정">
                                <ActionIcon aria-label="고정됨" color="red" variant="light">
                                    <Pin size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                        <Tooltip withArrow label="공지 관리">
                            <ActionIcon aria-label="공지 관리" component={Link} to="/admin/notices" variant="subtle">
                                <Pencil size={16} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip withArrow label="링크 복사">
                            <ActionIcon aria-label="링크 복사" color={copied ? 'teal' : undefined} variant="subtle" onClick={handleCopyLink}>
                                {copied ? <Copy size={16} /> : <Share2 size={16} />}
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>

                <Paper withBorder aria-labelledby="notice-title" component="article" p="xl" radius="md" shadow="sm">
                    <Stack gap="sm">
                        <Title fw={700} id="notice-title" order={2} style={{ lineHeight: 1.3 }}>
                            {notice.title}
                        </Title>
                        <Group gap="xs" wrap="wrap">
                            {notice.pinned && (
                                <Badge color="red" size="sm" variant="light">
                                    PIN
                                </Badge>
                            )}
                            <Text c="dimmed" size="xs">
                                게시일 {formatDate(notice.created_at)}
                            </Text>
                        </Group>
                        <Divider my="xs" />
                        <Text aria-label="공지 본문" component="div" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.95rem' }}>
                            {notice.body}
                        </Text>
                    </Stack>
                </Paper>

                {/* 하단 재동작 링크 */}
                <Group justify="flex-end">
                    <Anchor component={Link} size="sm" to="/notices" underline="always">
                        목록으로 돌아가기
                    </Anchor>
                </Group>
            </Stack>
        </PageContainer>
    );
}
