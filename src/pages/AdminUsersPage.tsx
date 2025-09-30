import { ActionIcon, Button, Group, Modal, Select, Stack, Table, TextInput, Tooltip, Notification } from '@mantine/core';
import { useI18n } from '@main/lib/i18n';
import { TextBody, TextMeta } from '@main/components/typography';
import { useEffect, useState } from 'react';
import PageContainer from '@main/components/layout/PageContainer';
import { removeUser, ensureUser, initiatePasswordReset } from '@main/lib/repository';
import { useAuth } from '@main/lib/auth';
import { UserRole } from '@main/lib/nav';
import { Trash2, RefreshCw, KeyRound, X } from 'lucide-react';
import PaginationBar from '@main/components/PaginationBar';
import PageHeader from '@main/components/layout/PageHeader';
import useAdminUsersPaged from '@main/hooks/admin/useAdminUsersPaged';

interface RoleOption {
    value: UserRole;
    label: string;
}

const ROLE_OPTIONS: RoleOption[] = [];

// 간단 seed: Auth Provider 에 저장된 사용자 외 추가 목록 비어 있을 수 있음
function seedFromAuthIfNeeded() {
    try {
        const raw = localStorage.getItem('demo-auth-user');

        if (raw) {
            const u = JSON.parse(raw) as { id: string; name: string; email: string; role: UserRole };

            if (u && u.id) ensureUser({ id: u.id, name: u.name, email: u.email, role: u.role });
        }
    } catch {
        // ignore
    }
}

const AdminUsersPage = () => {
    const { user: current } = useAuth();
    const [query, setQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string | null>(null); // 역할 필터 (현재 backend role 미구현) → placeholder
    const [page, setPage] = useState(1);
    const pageSize = 20;
    // role 관련 state 제거 (backend role 미구현)
    const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
    const [resetTarget, setResetTarget] = useState<string | null>(null);
    const [resetDone, setResetDone] = useState(false);

    useEffect(() => {
        seedFromAuthIfNeeded();
    }, []);

    // useAdminUsersPaged 훅: role filter와 query는 훅 외부에서 필터링 필요 → 간단히 훅 호출 후 클라이언트 필터 추가
    const { data } = useAdminUsersPaged(page, { pageSize, q: undefined });
    const filtered = data.items
        // roleFilter placeholder (UserRow에 role 없음)
        .filter(() => true)
        .filter((u) => {
            if (!query.trim()) return true;
            const qLower = query.trim().toLowerCase();

            return (u.name || '').toLowerCase().includes(qLower) || (u.email || '').toLowerCase().includes(qLower) || u.user_id.toLowerCase().includes(qLower);
        });
    const total = filtered.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const pageSafe = Math.min(Math.max(1, page), pageCount);
    const start = (pageSafe - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    if (pageSafe !== page) setPage(pageSafe);

    // role 변경 기능 비활성 (placeholder omitted)
    function handleRemove() {
        if (confirmRemove) removeUser(confirmRemove);
        setConfirmRemove(null);
    }
    function resetFilters() {
        setQuery('');
        setRoleFilter(null);
        setPage(1);
    }

    const { t } = useI18n();

    return (
        <PageContainer roleMain py={48} size="lg">
            <PageHeader
                actions={
                    <Group gap="xs">
                        <TextInput
                            aria-label={t('a11y.admin.usersSearch')}
                            placeholder={t('admin.users.searchPlaceholder')}
                            radius="md"
                            size="sm"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.currentTarget.value);
                                setPage(1);
                            }}
                        />
                        <Select
                            allowDeselect
                            clearable
                            aria-label={t('a11y.roleFilter')}
                            data={ROLE_OPTIONS}
                            placeholder={t('admin.users.filter.roleAll')}
                            radius="md"
                            size="sm"
                            value={roleFilter}
                            onChange={(v) => {
                                setRoleFilter(v);
                                setPage(1);
                            }}
                        />
                        <Tooltip label={t('common.resetFilters')}>
                            <ActionIcon aria-label={t('common.resetFilters')} variant="light" onClick={resetFilters}>
                                <RefreshCw size={16} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                }
                description={t('admin.users.description')}
                title={t('admin.users.title')}
            />

            <Stack gap="lg">
                <Table highlightOnHover striped withColumnBorders withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th style={{ width: 140 }} ta="center">
                                {t('admin.users.table.id')}
                            </Table.Th>
                            <Table.Th style={{ width: 160 }} ta="center">
                                {t('admin.users.table.name')}
                            </Table.Th>
                            <Table.Th style={{ width: 220 }} ta="center">
                                {t('admin.users.table.email')}
                            </Table.Th>
                            {/* 역할 컬럼 제거 (role 미구현) */}
                            <Table.Th style={{ width: 80 }} ta="center">
                                {t('admin.users.table.actions')}
                            </Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {pageItems.length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={5}>
                                    <TextMeta py={20} ta="center">
                                        {t('admin.users.empty')}
                                    </TextMeta>
                                </Table.Td>
                            </Table.Tr>
                        )}
                        {pageItems.map((u) => (
                            <Table.Tr key={u.user_id}>
                                <Table.Td>
                                    <TextBody fw={500} sizeOverride="sm">
                                        {u.user_id}
                                    </TextBody>
                                </Table.Td>
                                <Table.Td>
                                    <TextBody>{u.name || '—'}</TextBody>
                                </Table.Td>
                                <Table.Td>
                                    <TextBody>{u.email || '—'}</TextBody>
                                </Table.Td>
                                <Table.Td ta="center">
                                    <Group align="center" gap={4} justify="center">
                                        <Tooltip label={u.user_id === current?.id ? t('admin.users.action.selfDeactivateBlock') : t('common.deactivate')}>
                                            <ActionIcon
                                                aria-label={t('common.deactivate')}
                                                color="red"
                                                disabled={u.user_id === current?.id}
                                                size="sm"
                                                variant="subtle"
                                                onClick={() => u.user_id !== current?.id && setConfirmRemove(u.user_id)}
                                            >
                                                <Trash2 size={14} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label={t('admin.users.action.passwordReset')}>
                                            <ActionIcon
                                                aria-label={t('admin.users.action.passwordReset')}
                                                color="grape"
                                                size="sm"
                                                variant="subtle"
                                                onClick={() => {
                                                    setResetTarget(u.user_id);
                                                }}
                                            >
                                                <KeyRound size={14} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
                <PaginationBar align="right" page={page} size="sm" totalPages={pageCount} onChange={(p) => setPage(p)} />
            </Stack>
            {/* 역할 변경 모달 제거 (role 미구현) */}
            <Modal centered opened={!!confirmRemove} radius="md" title={t('admin.users.modal.deactivateTitle')} onClose={() => setConfirmRemove(null)}>
                <TextBody>{t('admin.users.modal.deactivateConfirm')}</TextBody>
                <Group justify="flex-end" mt="md">
                    <Button color="red" leftSection={<Trash2 size={14} />} size="sm" onClick={handleRemove}>
                        {t('common.deactivate')}
                    </Button>
                    <Button leftSection={<X size={14} />} size="sm" variant="default" onClick={() => setConfirmRemove(null)}>
                        {t('common.cancel')}
                    </Button>
                </Group>
            </Modal>
            <Modal
                centered
                opened={!!resetTarget}
                radius="md"
                title={resetDone ? t('admin.users.modal.passwordResetDone') : t('admin.users.modal.passwordResetTitle')}
                onClose={() => {
                    setResetTarget(null);
                    setResetDone(false);
                }}
            >
                <Stack gap="sm">
                    {!resetDone && (
                        <>
                            <TextBody>{t('admin.users.modal.passwordResetConfirm')}</TextBody>
                            <Group justify="flex-end" mt="sm">
                                <Button
                                    color="grape"
                                    leftSection={<RefreshCw size={14} />}
                                    size="sm"
                                    onClick={() => {
                                        if (resetTarget) {
                                            initiatePasswordReset(resetTarget);
                                            setResetDone(true);
                                        }
                                    }}
                                >
                                    {t('admin.users.modal.passwordResetAndSend')}
                                </Button>
                                <Button leftSection={<X size={14} />} size="sm" variant="default" onClick={() => setResetTarget(null)}>
                                    {t('common.cancel')}
                                </Button>
                            </Group>
                        </>
                    )}
                    {resetDone && (
                        <Notification color="grape" title={t('admin.users.modal.passwordResetMailSentTitle')} withCloseButton={false}>
                            {t('admin.users.modal.passwordResetMailSentBody')}
                        </Notification>
                    )}
                </Stack>
            </Modal>
        </PageContainer>
    );
};

export default AdminUsersPage;
