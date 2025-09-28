import { ActionIcon, Badge, Button, Group, Modal, Stack, Table, Text, TextInput, Tooltip, Switch, Notification } from '@mantine/core';
import { ArrowDown, ArrowUp, Edit3, Plus, Save, X, RefreshCw } from 'lucide-react';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import PaginationBar from '@main/components/PaginationBar';
import useAdminCategories from '@main/hooks/admin/useAdminCategories';

export default function AdminCategoriesPage() {
    const {
        items,
        page,
        totalPages,
        q,
        filterActive,
        setQ,
        setFilterActive,
        resetFilters,
        setPage,
        createOpen,
        setCreateOpen,
        newName,
        setNewName,
        creatingErr,
        setCreatingErr,
        handleCreate,
        renameId,
        renameValue,
        setRenameValue,
        setRenameId,
        startRename,
        commitRename,
        toggleActive,
        deactivate,
        move
    } = useAdminCategories({ pageSize: 15 });

    const paged = items; // 훅이 이미 page size slice 반환
    const pageSafe = page; // naming 유지 호환

    return (
        <PageContainer roleMain py={48} size="lg">
            <PageHeader
                actions={
                    <Group gap="xs">
                        <TextInput aria-label="검색" placeholder="이름/슬러그" radius="md" size="sm" value={q} onChange={(e) => setQ(e.currentTarget.value)} />
                        <TextInput
                            readOnly
                            aria-label="활성 필터"
                            placeholder={filterActive === 'all' ? '전체' : filterActive === 'active' ? '활성' : '비활성'}
                            radius="md"
                            size="sm"
                            style={{ cursor: 'pointer', width: 110 }}
                            value={filterActive === 'all' ? '' : filterActive === 'active' ? '활성 필터 중' : '비활성 필터 중'}
                            onClick={() => setFilterActive((prev) => (prev === 'all' ? 'active' : prev === 'active' ? 'inactive' : 'all'))}
                        />
                        <Tooltip label="필터 초기화">
                            <ActionIcon aria-label="필터 초기화" variant="light" onClick={resetFilters}>
                                <RefreshCw size={16} />
                            </ActionIcon>
                        </Tooltip>
                        <Button leftSection={<Plus size={16} />} size="xs" onClick={() => setCreateOpen(true)}>
                            새 카테고리
                        </Button>
                    </Group>
                }
                description="코스 분류용 카테고리를 생성/재정렬/비활성화합니다. (mock)"
                title="카테고리 관리"
            />

            <Stack gap="lg" mt="md">
                <Table highlightOnHover striped withColumnBorders withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th style={{ width: 60 }} ta="center">
                                순서
                            </Table.Th>
                            <Table.Th style={{ width: 260 }} ta="center">
                                이름
                            </Table.Th>
                            <Table.Th style={{ width: 220 }} ta="center">
                                슬러그
                            </Table.Th>
                            <Table.Th style={{ width: 100 }} ta="center">
                                상태
                            </Table.Th>
                            <Table.Th style={{ width: 140 }} ta="center">
                                액션
                            </Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {paged.length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={5}>
                                    <Text c="dimmed" py={20} size="sm" ta="center">
                                        카테고리가 없습니다.
                                    </Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
                        {paged.map((c, idx) => (
                            <Table.Tr key={c.id} style={{ opacity: c.active ? 1 : 0.55 }}>
                                <Table.Td ta="center">
                                    <Group align="center" gap={4} justify="center" wrap="nowrap">
                                        <ActionIcon aria-label="위로" disabled={idx === 0 && pageSafe === 1} size="sm" variant="subtle" onClick={() => move(c, 'up')}>
                                            <ArrowUp size={14} />
                                        </ActionIcon>
                                        <ActionIcon aria-label="아래로" disabled={idx === paged.length - 1 && pageSafe === totalPages} size="sm" variant="subtle" onClick={() => move(c, 'down')}>
                                            <ArrowDown size={14} />
                                        </ActionIcon>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    {renameId === c.id ? (
                                        <Group gap={4} wrap="nowrap">
                                            <TextInput aria-label="카테고리 이름" size="xs" style={{ flexGrow: 1 }} value={renameValue} onChange={(e) => setRenameValue(e.currentTarget.value)} />
                                            <ActionIcon aria-label="저장" color="green" size="sm" variant="light" onClick={commitRename}>
                                                <Save size={14} />
                                            </ActionIcon>
                                            <ActionIcon aria-label="취소" color="red" size="sm" variant="light" onClick={() => setRenameId(null)}>
                                                <X size={14} />
                                            </ActionIcon>
                                        </Group>
                                    ) : (
                                        <Group gap={6} wrap="nowrap">
                                            <Text c={c.active ? undefined : 'dimmed'} fw={500} size="sm">
                                                {c.name}
                                            </Text>
                                            <ActionIcon aria-label="이름 변경" size="sm" variant="subtle" onClick={() => startRename(c)}>
                                                <Edit3 size={14} />
                                            </ActionIcon>
                                        </Group>
                                    )}
                                </Table.Td>
                                <Table.Td>
                                    <Text size="xs">{c.slug}</Text>
                                </Table.Td>
                                <Table.Td ta="center">
                                    <Badge color={c.active ? 'green' : 'gray'} size="sm" variant="light">
                                        {c.active ? '활성' : '비활성'}
                                    </Badge>
                                </Table.Td>
                                <Table.Td ta="center">
                                    <Group gap={4} justify="center">
                                        <Tooltip label={c.active ? '비활성화' : '활성화'}>
                                            <Switch aria-label="활성 토글" checked={c.active} size="xs" onChange={() => toggleActive(c)} />
                                        </Tooltip>
                                        {c.active && (
                                            <Tooltip label="즉시 비활성 (soft)">
                                                <ActionIcon aria-label="즉시 비활성" color="orange" size="sm" variant="subtle" onClick={() => deactivate(c)}>
                                                    <X size={14} />
                                                </ActionIcon>
                                            </Tooltip>
                                        )}
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Stack>

            <PaginationBar align="right" page={pageSafe} totalPages={totalPages} onChange={(p) => setPage(p)} />

            <Modal centered opened={createOpen} radius="md" size="sm" title="새 카테고리" onClose={() => setCreateOpen(false)}>
                <Stack gap="sm">
                    {creatingErr && (
                        <Notification color="red" title="오류" onClose={() => setCreatingErr(null)}>
                            {creatingErr}
                        </Notification>
                    )}
                    <TextInput aria-label="카테고리 이름" label="이름" placeholder="예: 개발" radius="md" value={newName} onChange={(e) => setNewName(e.currentTarget.value)} />
                    <Group justify="flex-end" mt="sm">
                        <Button leftSection={<Save size={14} />} size="xs" onClick={handleCreate}>
                            생성
                        </Button>
                        <Button leftSection={<X size={14} />} size="xs" variant="default" onClick={() => setCreateOpen(false)}>
                            취소
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </PageContainer>
    );
}
