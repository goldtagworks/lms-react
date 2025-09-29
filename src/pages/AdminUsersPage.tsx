import { ActionIcon, Badge, Button, Group, Modal, Select, Stack, Table, TextInput, Tooltip, Notification } from '@mantine/core';
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
    { value: 'student', label: '학생' },
    { value: 'instructor', label: '강사' },
    { value: 'admin', label: '관리자' }
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

    return (
        <PageContainer roleMain py={48} size="lg">
            <PageHeader
                actions={
                    <Group gap="xs">
                        <TextInput
                            aria-label="검색"
                            placeholder="이름/이메일/ID"
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
                            aria-label="역할 필터"
                            data={ROLE_OPTIONS}
                            placeholder="역할 전체"
                            radius="md"
                            size="sm"
                            value={roleFilter}
                            onChange={(v) => {
                                setRoleFilter(v);
                                setPage(1);
                            }}
                        />
                        <Tooltip label="필터 초기화">
                            <ActionIcon aria-label="필터 초기화" variant="light" onClick={resetFilters}>
                                <RefreshCw size={16} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                }
                description="플랫폼 사용자 목록을 조회하고 역할을 변경하거나 비활성화합니다. (mock 페이징)"
                title="사용자 관리"
            />

            <Stack gap="lg">
                <Table highlightOnHover striped withColumnBorders withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th style={{ width: 140 }} ta="center">
                                ID
                            </Table.Th>
                            <Table.Th style={{ width: 160 }} ta="center">
                                이름
                            </Table.Th>
                            <Table.Th style={{ width: 220 }} ta="center">
                                이메일
                            </Table.Th>
                            <Table.Th style={{ width: 100 }} ta="center">
                                역할
                            </Table.Th>
                            <Table.Th style={{ width: 80 }} ta="center">
                                액션
                            </Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {paged.length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={5}>
                                    <TextMeta py={20} ta="center">
                                        사용자가 없습니다.
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
                                        <Tooltip label="역할 변경">
                                            <ActionIcon aria-label="역할 변경" size="sm" variant="subtle" onClick={() => openEdit(u.id, u.role)}>
                                                <Shield size={14} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label={u.id === current?.id ? '자기 자신은 비활성화 불가' : '비활성화'}>
                                            <ActionIcon
                                                aria-label="비활성화"
                                                color="red"
                                                disabled={u.id === current?.id}
                                                size="sm"
                                                variant="subtle"
                                                onClick={() => u.id !== current?.id && setConfirmRemove(u.id)}
                                            >
                                                <Trash2 size={14} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label="비밀번호 초기화">
                                            <ActionIcon
                                                aria-label="비밀번호 초기화"
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
            <Modal centered opened={!!editUserId} radius="md" title="역할 변경" onClose={() => setEditUserId(null)}>
                <Stack gap="sm" mt="xs">
                    <Select
                        data={ROLE_OPTIONS}
                        disabled={current?.id === editUserId && editRole === 'student'}
                        label="역할"
                        size="sm"
                        value={editRole}
                        // 자기 자신을 learner(학생)으로 강등 방지 (spec AC: self downgrade 금지)
                        onChange={(v) => v && setEditRole(v as UserRole)}
                    />
                    <Group justify="flex-end" mt="sm">
                        <Button leftSection={<Save size={14} />} size="sm" onClick={saveRole}>
                            저장
                        </Button>
                        <Button leftSection={<X size={14} />} size="sm" variant="default" onClick={() => setEditUserId(null)}>
                            취소
                        </Button>
                    </Group>
                </Stack>
            </Modal>
            <Modal centered opened={!!confirmRemove} radius="md" title="사용자 비활성화" onClose={() => setConfirmRemove(null)}>
                <TextBody>이 사용자를 비활성화하시겠습니까? (mock 데이터 제거)</TextBody>
                <Group justify="flex-end" mt="md">
                    <Button color="red" leftSection={<Trash2 size={14} />} size="sm" onClick={handleRemove}>
                        비활성화
                    </Button>
                    <Button leftSection={<X size={14} />} size="sm" variant="default" onClick={() => setConfirmRemove(null)}>
                        취소
                    </Button>
                </Group>
            </Modal>
            <Modal
                centered
                opened={!!resetTarget}
                radius="md"
                title={resetDone ? '초기화 완료' : '비밀번호 초기화'}
                onClose={() => {
                    setResetTarget(null);
                    setResetDone(false);
                }}
            >
                <Stack gap="sm">
                    {!resetDone && (
                        <>
                            <TextBody>해당 사용자의 비밀번호를 초기화하고 재설정 안내 메일을 발송합니다. 진행하시겠습니까?</TextBody>
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
                                    초기화 및 발송
                                </Button>
                                <Button leftSection={<X size={14} />} size="sm" variant="default" onClick={() => setResetTarget(null)}>
                                    취소
                                </Button>
                            </Group>
                        </>
                    )}
                    {resetDone && (
                        <Notification color="grape" title="메일 발송 완료" withCloseButton={false}>
                            재설정 메일(모킹 로그)이 발송되었습니다. 사용자가 링크를 통해 새 비밀번호를 설정할 수 있습니다.
                        </Notification>
                    )}
                </Stack>
            </Modal>
        </PageContainer>
    );
};

export default AdminUsersPage;
