import { ActionIcon, Badge, Button, Divider, Group, Modal, NumberInput, Notification, Select, Stack, Switch, Table, Text, TextInput, Tooltip } from '@mantine/core';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import PaginationBar from '@main/components/PaginationBar';
import { Plus, Pencil, Ban, RotateCcw, RefreshCw, Save, X } from 'lucide-react';
import useAdminCoupons from '@main/hooks/admin/useAdminCoupons';

type ActiveFilter = 'all' | 'active' | 'inactive';

// (PagedCouponsResult) 이전 로컬 구현 잔여 타입 제거 (훅에서 반환)

const AdminCouponsPage = () => {
    const {
        paged,
        q,
        activeFilter,
        setQ,
        setActiveFilter,
        setPage,
        resetFilters,
        // creation
        createOpen,
        setCreateOpen,
        cCode,
        cType,
        cValue,
        cCurrency,
        cMaxUses,
        cPerUser,
        cStart,
        cEnd,
        setCCode,
        setCType,
        setCValue,
        setCCurrency,
        setCMaxUses,
        setCPerUser,
        setCStart,
        setCEnd,
        createErr,
        setCreateErr,
        createNew,
        // edit
        editId,
        editDraft,
        setEditDraft,
        setEditId,
        setEditErr,
        editErr,
        openEdit,
        commitEdit,
        toggleActive,
        softDeactivate
    } = useAdminCoupons({ pageSize: 20 });

    return (
        <PageContainer roleMain py={48} size="lg">
            <PageHeader
                actions={
                    <Group gap="xs">
                        <TextInput
                            aria-label="코드 검색"
                            placeholder="코드 검색"
                            radius="md"
                            size="sm"
                            value={q}
                            onChange={(e) => {
                                setQ(e.currentTarget.value);
                                setPage(1);
                            }}
                        />
                        <Select
                            aria-label="활성 필터"
                            data={[
                                { value: 'all', label: '전체' },
                                { value: 'active', label: '활성' },
                                { value: 'inactive', label: '비활성' }
                            ]}
                            radius="md"
                            size="sm"
                            value={activeFilter}
                            onChange={(v) => {
                                setActiveFilter((v as ActiveFilter) || 'all');
                                setPage(1);
                            }}
                        />
                        <Tooltip label="필터 초기화">
                            <ActionIcon aria-label="필터 초기화" variant="light" onClick={resetFilters}>
                                <RefreshCw size={16} />
                            </ActionIcon>
                        </Tooltip>
                        <Button leftSection={<Plus size={16} />} size="xs" onClick={() => setCreateOpen(true)}>
                            새 쿠폰
                        </Button>
                    </Group>
                }
                description="플랫폼 내 발행된 쿠폰을 생성/수정/비활성화합니다. (mock)"
                title="쿠폰 관리"
            />

            <Stack gap="lg" mt="md">
                <Table highlightOnHover striped withColumnBorders withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th style={{ width: 140 }}>코드</Table.Th>
                            <Table.Th style={{ width: 110 }}>종류</Table.Th>
                            <Table.Th style={{ width: 120 }}>값</Table.Th>
                            <Table.Th style={{ width: 160 }}>기간</Table.Th>
                            <Table.Th style={{ width: 120 }}>사용/한도</Table.Th>
                            <Table.Th style={{ width: 90 }}>상태</Table.Th>
                            <Table.Th style={{ width: 120 }} ta="center">
                                액션
                            </Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {paged.items.length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={7}>
                                    <Text c="dimmed" py={20} size="sm" ta="center">
                                        쿠폰이 없습니다.
                                    </Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
                        {paged.items.map((c) => {
                            const period = c.starts_at || c.ends_at ? `${c.starts_at ? c.starts_at.slice(0, 10) : '—'} ~ ${c.ends_at ? c.ends_at.slice(0, 10) : '—'}` : '—';

                            return (
                                <Table.Tr key={c.id} style={{ opacity: c.active ? 1 : 0.55 }}>
                                    <Table.Td>
                                        <Text fw={600} size="sm">
                                            {c.code}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={c.type === 'percent' ? 'indigo' : 'teal'} size="sm" variant="light">
                                            {c.type}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{c.type === 'percent' ? `${c.value}%` : `${c.value.toLocaleString()} ${c.currency_code || ''}`}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="xs">{period}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="xs">
                                            {c.used_count}/{c.max_uses ?? '∞'}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={c.active ? 'green' : 'gray'} size="sm" variant="light">
                                            {c.active ? '활성' : '비활성'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td ta="center">
                                        <Group gap={4} justify="center">
                                            <Tooltip label="수정">
                                                <ActionIcon aria-label="수정" size="sm" variant="subtle" onClick={() => openEdit(c)}>
                                                    <Pencil size={14} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label={c.active ? '비활성화' : '활성화'}>
                                                <ActionIcon aria-label="활성 토글" color={c.active ? 'red' : 'green'} size="sm" variant="subtle" onClick={() => toggleActive(c)}>
                                                    {c.active ? <Ban size={14} /> : <RotateCcw size={14} />}
                                                </ActionIcon>
                                            </Tooltip>
                                            {c.active && (
                                                <Tooltip label="즉시 비활성(soft)">
                                                    <ActionIcon aria-label="즉시 비활성" color="orange" size="sm" variant="subtle" onClick={() => softDeactivate(c)}>
                                                        <Ban size={14} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            )}
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            );
                        })}
                    </Table.Tbody>
                </Table>
                <PaginationBar page={paged.page} totalPages={paged.totalPages} onChange={(p) => setPage(p)} />
            </Stack>

            {/* 생성 모달 */}
            <Modal centered opened={createOpen} radius="md" size="lg" title="새 쿠폰 생성" onClose={() => setCreateOpen(false)}>
                <Stack gap="sm">
                    {createErr && (
                        <Notification color="red" title="오류" onClose={() => setCreateErr(null)}>
                            {createErr}
                        </Notification>
                    )}
                    <Group grow>
                        <TextInput label="코드" placeholder="WELCOME10" value={cCode} onChange={(e) => setCCode(e.currentTarget.value)} />
                        <Select
                            data={[
                                { value: 'percent', label: 'percent' },
                                { value: 'fixed', label: 'fixed' }
                            ]}
                            label="종류"
                            value={cType}
                            onChange={(v) => v && setCType(v as 'percent' | 'fixed')}
                        />
                        <NumberInput label="값" min={1} value={cValue} onChange={(val) => setCValue(typeof val === 'number' ? val : '')} />
                    </Group>
                    {cType === 'fixed' && <TextInput label="통화" placeholder="KRW" value={cCurrency} onChange={(e) => setCCurrency(e.currentTarget.value.toUpperCase())} />}
                    <Group grow>
                        <NumberInput label="총 사용 한도" min={1} placeholder="무제한" value={cMaxUses} onChange={(v) => setCMaxUses(typeof v === 'number' ? v : '')} />
                        <NumberInput label="사용자당 한도" min={1} placeholder="무제한" value={cPerUser} onChange={(v) => setCPerUser(typeof v === 'number' ? v : '')} />
                    </Group>
                    <Group grow>
                        <TextInput label="시작 (ISO)" placeholder="2025-09-01" value={cStart} onChange={(e) => setCStart(e.currentTarget.value)} />
                        <TextInput label="종료 (ISO)" placeholder="2025-09-30" value={cEnd} onChange={(e) => setCEnd(e.currentTarget.value)} />
                    </Group>
                    <Divider my="xs" />
                    <Group justify="flex-end" mt="sm">
                        <Button leftSection={<Save size={14} />} size="xs" onClick={createNew}>
                            생성
                        </Button>
                        <Button leftSection={<X size={14} />} size="xs" variant="default" onClick={() => setCreateOpen(false)}>
                            취소
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* 수정 모달 */}
            <Modal centered opened={!!editId} radius="md" size="lg" title="쿠폰 수정" onClose={() => setEditId(null)}>
                {editId && (
                    <Stack gap="sm">
                        {editErr && (
                            <Notification color="red" title="오류" onClose={() => setEditErr(null)}>
                                {editErr}
                            </Notification>
                        )}
                        <Group grow>
                            <TextInput label="코드" value={editDraft.code} onChange={(e) => setEditDraft((d) => ({ ...d, code: e.currentTarget.value }))} />
                            <Select
                                data={[
                                    { value: 'percent', label: 'percent' },
                                    { value: 'fixed', label: 'fixed' }
                                ]}
                                label="종류"
                                value={editDraft.type}
                                onChange={(v) => v && setEditDraft((d) => ({ ...d, type: v as 'percent' | 'fixed' }))}
                            />
                            <NumberInput
                                label="값"
                                min={1}
                                value={editDraft.value as number | undefined}
                                onChange={(val) => setEditDraft((d) => ({ ...d, value: typeof val === 'number' ? val : d.value }))}
                            />
                        </Group>
                        {editDraft.type === 'fixed' && (
                            <TextInput label="통화" value={editDraft.currency_code || ''} onChange={(e) => setEditDraft((d) => ({ ...d, currency_code: e.currentTarget.value.toUpperCase() }))} />
                        )}
                        <Group grow>
                            <NumberInput
                                label="총 사용 한도"
                                min={1}
                                placeholder="무제한"
                                value={editDraft.max_uses as number | undefined}
                                onChange={(val) => setEditDraft((d) => ({ ...d, max_uses: typeof val === 'number' ? val : undefined }))}
                            />
                            <NumberInput
                                label="사용자당 한도"
                                min={1}
                                placeholder="무제한"
                                value={editDraft.per_user_limit as number | undefined}
                                onChange={(val) => setEditDraft((d) => ({ ...d, per_user_limit: typeof val === 'number' ? val : undefined }))}
                            />
                        </Group>
                        <Group grow>
                            <TextInput label="시작 (ISO)" value={editDraft.starts_at || ''} onChange={(e) => setEditDraft((d) => ({ ...d, starts_at: e.currentTarget.value || undefined }))} />
                            <TextInput label="종료 (ISO)" value={editDraft.ends_at || ''} onChange={(e) => setEditDraft((d) => ({ ...d, ends_at: e.currentTarget.value || undefined }))} />
                        </Group>
                        <Switch checked={!!editDraft.active} label="활성 상태" onChange={(e) => setEditDraft((d) => ({ ...d, active: e.currentTarget.checked }))} />
                        <Group justify="flex-end" mt="sm">
                            <Button leftSection={<Save size={14} />} size="xs" onClick={commitEdit}>
                                저장
                            </Button>
                            <Button leftSection={<X size={14} />} size="xs" variant="default" onClick={() => setEditId(null)}>
                                취소
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </PageContainer>
    );
};

export default AdminCouponsPage;
