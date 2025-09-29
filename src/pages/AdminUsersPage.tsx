import { ActionIcon, Badge, Button, Group, Modal, Select, Stack, Table, TextInput, Tooltip, Notification } from '@mantine/core';
import { useI18n } from '@main/lib/i18n';
import { TextBody, TextMeta } from '@main/components/typography';
import { useEffect, useMemo, useState } from 'react';
import PageContainer from '@main/components/layout/PageContainer';
import { upsertUserRole, removeUser, useUsers, ensureUser, initiatePasswordReset } from '@main/lib/repository';
import { useAuth } from '@main/lib/auth';
import { UserRole } from '@main/lib/nav';
import { Trash2, Shield, RefreshCw, KeyRound, Save, X } from 'lucide-react';
import PaginationBar from '@main/components/PaginationBar';
import PageHeader from '@main/components/layout/PageHeader';

interface RoleOption {
    value: UserRole;
    label: string;
}

const ROLE_OPTIONS: RoleOption[] = [
    { value: 'student', label: 'student' },
    { value: 'instructor', label: 'instructor' },
    { value: 'admin', label: 'admin' }
];

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
    const users = useUsers();
    const { user: current } = useAuth();
    const [query, setQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string | null>(null);
    // 간단한 클라이언트 페이지네이션 (서버 API 전환 시 교체)
    const [page, setPage] = useState(1);
    const pageSize = 20; // spec: 서버 페이징 예정 → placeholder
    const [editUserId, setEditUserId] = useState<string | null>(null);
    const [editRole, setEditRole] = useState<UserRole>('student');
    const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
    const [resetTarget, setResetTarget] = useState<string | null>(null);
    const [resetDone, setResetDone] = useState(false);

    useEffect(() => {
        seedFromAuthIfNeeded();
    }, []);

    const filtered = useMemo(() => {
        const base = users
            .filter((u) => (roleFilter ? u.role === roleFilter : true))
            .filter((u) => {
                if (!query.trim()) return true;
                const q = query.trim().toLowerCase();

                return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        return base;
    }, [users, query, roleFilter]);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const paged = useMemo(() => {
        const start = (page - 1) * pageSize;

        return filtered.slice(start, start + pageSize);
    }, [filtered, page]);

    function openEdit(uId: string, current: UserRole) {
        setEditUserId(uId);
        setEditRole(current);
    }
    function saveRole() {
        if (editUserId) upsertUserRole(editUserId, editRole);
        setEditUserId(null);
    }
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
                            <Table.Th style={{ width: 100 }} ta="center">
                                {t('admin.users.table.role')}
                            </Table.Th>
                            <Table.Th style={{ width: 80 }} ta="center">
                                {t('admin.users.table.actions')}
                            </Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {paged.length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={5}>
                                    <TextMeta py={20} ta="center">
                                        {t('admin.users.empty')}
                                    </TextMeta>
                                </Table.Td>
                            </Table.Tr>
                        )}
                        {paged.map((u) => (
                            <Table.Tr key={u.id}>
                                <Table.Td>
                                    <TextBody fw={500} sizeOverride="sm">
                                        {u.id}
                                    </TextBody>
                                </Table.Td>
                                <Table.Td>
                                    <TextBody>{u.name}</TextBody>
                                </Table.Td>
                                <Table.Td>
                                    <TextBody>{u.email}</TextBody>
                                </Table.Td>
                                <Table.Td ta="center">
                                    <Badge color={u.role === 'admin' ? 'red' : u.role === 'instructor' ? 'blue' : 'gray'} size="sm" variant="light">
                                        {u.role}
                                    </Badge>
                                </Table.Td>
                                <Table.Td ta="center">
                                    <Group align="center" gap={4} justify="center">
                                        <Tooltip label={t('admin.users.action.changeRole')}>
                                            <ActionIcon aria-label={t('admin.users.action.changeRole')} size="sm" variant="subtle" onClick={() => openEdit(u.id, u.role)}>
                                                <Shield size={14} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label={u.id === current?.id ? t('admin.users.action.selfDeactivateBlock') : t('admin.users.action.deactivate')}>
                                            <ActionIcon
                                                aria-label={t('admin.users.action.deactivate')}
                                                color="red"
                                                disabled={u.id === current?.id}
                                                size="sm"
                                                variant="subtle"
                                                onClick={() => u.id !== current?.id && setConfirmRemove(u.id)}
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
                                                    setResetTarget(u.id);
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
                <PaginationBar align="right" page={page} size="sm" totalPages={totalPages} onChange={(p) => setPage(p)} />
            </Stack>
            <Modal centered opened={!!editUserId} radius="md" title={t('admin.users.modal.changeRoleTitle')} onClose={() => setEditUserId(null)}>
                <Stack gap="sm" mt="xs">
                    <Select
                        data={ROLE_OPTIONS}
                        disabled={current?.id === editUserId && editRole === 'student'}
                        label={t('admin.users.modal.roleLabel')}
                        size="sm"
                        value={editRole}
                        // Prevent self downgrade to learner (spec AC: self downgrade forbidden)
                        onChange={(v) => v && setEditRole(v as UserRole)}
                    />
                    <Group justify="flex-end" mt="sm">
                        <Button leftSection={<Save size={14} />} size="sm" onClick={saveRole}>
                            {t('common.save')}
                        </Button>
                        <Button leftSection={<X size={14} />} size="sm" variant="default" onClick={() => setEditUserId(null)}>
                            {t('common.cancel')}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
            <Modal centered opened={!!confirmRemove} radius="md" title={t('admin.users.modal.deactivateTitle')} onClose={() => setConfirmRemove(null)}>
                <TextBody>{t('admin.users.modal.deactivateConfirm')}</TextBody>
                <Group justify="flex-end" mt="md">
                    <Button color="red" leftSection={<Trash2 size={14} />} size="sm" onClick={handleRemove}>
                        {t('admin.users.action.deactivate')}
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
